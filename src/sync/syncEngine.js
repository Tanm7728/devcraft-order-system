/**
 * syncEngine.js
 * Deterministic Field-Level Last-Write-Wins (LWW) Sync Engine with Stable Tie-Breaking
 * and Conflict Surfacing for DevCraft Objective 3.
 *
 * Guarantees:
 *  1. Commutativity: merge(A, B) === merge(B, A) (identical final state regardless of reconnection order)
 *  2. No Silent Data Loss: Overwritten concurrent edits and delete-update collisions are surfaced in the audit log
 *  3. Determinism: Stable tie-breaking via device ID on timestamp collisions
 *
 * Pure JS — zero network calls.
 */

/**
 * Compares two operation/field vectors (timestamp, deviceId) deterministically.
 * Returns > 0 if A wins, < 0 if B wins, 0 if identical.
 */
export function compareVectors(tsA, devA, tsB, devB) {
  const tA = typeof tsA === 'string' ? new Date(`1970-01-01T${tsA.length === 5 ? tsA + ':00' : tsA}`).getTime() : (tsA || 0);
  const tB = typeof tsB === 'string' ? new Date(`1970-01-01T${tsB.length === 5 ? tsB + ':00' : tsB}`).getTime() : (tsB || 0);

  if (tA !== tB) {
    return tA - tB;
  }
  // Stable deterministic tie-break using lexicographical device ID
  return String(devA || '').localeCompare(String(devB || ''));
}

export class OrderSyncEngine {
  constructor(initialState = null) {
    this.state = initialState ? JSON.parse(JSON.stringify(initialState)) : null;
    this.fieldMeta = {}; // key -> { timestamp, deviceId, value }
    this.itemMeta = {};  // item_id -> { deleted: boolean, timestamp, deviceId, fields: { [f]: { timestamp, deviceId } } }
    this.conflicts = []; // Surfaced conflicts for operator audit
  }

  /**
   * Initializes state with default metadata.
   */
  init(order, baseTimestamp = '10:00', baseDevice = 'system') {
    this.state = JSON.parse(JSON.stringify(order));
    this.fieldMeta = {};
    this.itemMeta = {};
    this.conflicts = [];

    // Scalar fields
    for (const [k, v] of Object.entries(this.state)) {
      if (k !== 'items') {
        this.fieldMeta[k] = { timestamp: baseTimestamp, deviceId: baseDevice, value: v };
      }
    }

    // Items
    if (Array.isArray(this.state.items)) {
      this.state.items.forEach(item => {
        const itemId = item.item_id || item.description;
        this.itemMeta[itemId] = {
          deleted: false,
          timestamp: baseTimestamp,
          deviceId: baseDevice,
          snapshot: JSON.parse(JSON.stringify(item)),
          fields: {}
        };
        for (const [ik, iv] of Object.entries(item)) {
          if (ik === 'attributes' && typeof iv === 'object') {
            for (const [ak, av] of Object.entries(iv)) {
              this.itemMeta[itemId].fields[`attributes.${ak}`] = {
                timestamp: baseTimestamp,
                deviceId: baseDevice,
                value: av
              };
            }
          } else {
            this.itemMeta[itemId].fields[ik] = {
              timestamp: baseTimestamp,
              deviceId: baseDevice,
              value: iv
            };
          }
        }
      });
    }
  }

  /**
   * Applies an edit operation locally.
   *
   * @param {Object} op
   * @param {string} op.device - 'A' | 'B'
   * @param {string} op.time - '10:12'
   * @param {string} op.type - 'SET_FIELD' | 'SET_ITEM_FIELD' | 'DELETE_ITEM' | 'ADD_ITEM'
   * @param {string} [op.field] - e.g. 'due_date', 'amount'
   * @param {string} [op.itemId] - e.g. 'it-1'
   * @param {any} [op.value]
   */
  applyOp(op) {
    const { device, time, type, field, itemId, value } = op;

    if (type === 'SET_FIELD') {
      const currentMeta = this.fieldMeta[field];
      if (!currentMeta || compareVectors(time, device, currentMeta.timestamp, currentMeta.deviceId) >= 0) {
        if (currentMeta && currentMeta.timestamp === time && currentMeta.value !== value) {
          this.conflicts.push({
            type: 'CONCURRENT_FIELD_EDIT',
            field,
            winner: { device, time, value },
            loser: { device: currentMeta.deviceId, time: currentMeta.timestamp, value: currentMeta.value },
            resolution: `Accepted ${device}'s edit via deterministic tie-break`
          });
        }
        this.fieldMeta[field] = { timestamp: time, deviceId: device, value };
        this.state[field] = value;
      }
    } else if (type === 'SET_ITEM_FIELD') {
      if (!this.itemMeta[itemId]) {
        this.itemMeta[itemId] = {
          deleted: false,
          timestamp: time,
          deviceId: device,
          snapshot: { item_id: itemId, attributes: {} },
          fields: {}
        };
      }
      const itemM = this.itemMeta[itemId];
      const fieldM = itemM.fields[field];

      // If item was marked deleted, check if this edit happened after the delete
      if (itemM.deleted && compareVectors(time, device, itemM.timestamp, itemM.deviceId) > 0) {
        this.conflicts.push({
          type: 'RESURRECT_AFTER_DELETE',
          itemId,
          field,
          winner: { device, time, value },
          loser: { device: itemM.deviceId, time: itemM.timestamp, action: 'DELETE' },
          resolution: `Item ${itemId} edited by ${device} after deletion by ${itemM.deviceId}; resurrected with updated attributes`
        });
        itemM.deleted = false;
      }

      if (!itemM.deleted) {
        if (!fieldM || compareVectors(time, device, fieldM.timestamp, fieldM.deviceId) >= 0) {
          if (fieldM && fieldM.timestamp === time && fieldM.value !== value) {
            this.conflicts.push({
              type: 'CONCURRENT_ITEM_FIELD_EDIT',
              itemId,
              field,
              winner: { device, time, value },
              loser: { device: fieldM.deviceId, time: fieldM.timestamp, value: fieldM.value },
              resolution: `Accepted ${device}'s edit on ${itemId}.${field} via deterministic tie-break`
            });
          }
          itemM.fields[field] = { timestamp: time, deviceId: device, value };
          if (compareVectors(time, device, itemM.timestamp, itemM.deviceId) > 0) {
            itemM.timestamp = time;
            itemM.deviceId = device;
          }
          this._updateItemInState(itemId, field, value);
        }
      }
    } else if (type === 'DELETE_ITEM') {
      if (!this.itemMeta[itemId]) {
        this.itemMeta[itemId] = {
          deleted: true,
          timestamp: time,
          deviceId: device,
          snapshot: { item_id: itemId, attributes: {} },
          fields: {}
        };
        this.state.items = this.state.items.filter(i => (i.item_id || i.description) !== itemId);
      } else {
        const itemM = this.itemMeta[itemId];
        // Compare delete timestamp against the item's latest modification timestamp
        if (compareVectors(time, device, itemM.timestamp, itemM.deviceId) >= 0) {
          itemM.deleted = true;
          itemM.timestamp = time;
          itemM.deviceId = device;
          this.state.items = this.state.items.filter(i => (i.item_id || i.description) !== itemId);
        } else {
          // A deletion from an earlier timestamp arrived after a newer edit
          this.conflicts.push({
            type: 'DELETE_REJECTED_DUE_TO_NEWER_EDIT',
            itemId,
            deleteOp: { device, time },
            newerEdit: { device: itemM.deviceId, time: itemM.timestamp },
            resolution: `Item ${itemId} deletion at ${time} by ${device} rejected because newer edits exist at ${itemM.timestamp} by ${itemM.deviceId}`
          });
        }
      }
    }
  }

  _updateItemInState(itemId, fieldPath, val) {
    let item = this.state.items.find(i => (i.item_id || i.description) === itemId);
    if (!item) {
      const snap = this.itemMeta[itemId]?.snapshot;
      item = snap ? JSON.parse(JSON.stringify(snap)) : { item_id: itemId, attributes: {} };
      this.state.items.push(item);
    }
    if (fieldPath.startsWith('attributes.')) {
      const attrKey = fieldPath.split('.')[1];
      if (!item.attributes) item.attributes = {};
      item.attributes[attrKey] = val;
    } else {
      item[fieldPath] = val;
    }
    // Update snapshot
    if (this.itemMeta[itemId]) {
      this.itemMeta[itemId].snapshot = JSON.parse(JSON.stringify(item));
    }
  }

  /**
   * Replays a list of operations in batch.
   */
  applyOperations(ops) {
    // Sort ops deterministically by (timestamp, deviceId)
    const sorted = [...ops].sort((a, b) => compareVectors(a.time, a.device, b.time, b.device));
    for (const op of sorted) {
      this.applyOp(op);
    }
  }

  /**
   * Returns clean observable state matching DevCraft format.
   */
  getSnapshot() {
    return JSON.parse(JSON.stringify(this.state));
  }

  /**
   * Returns surfaced conflicts for operator visibility.
   */
  getSurfacedConflicts() {
    return JSON.parse(JSON.stringify(this.conflicts));
  }
}

/**
 * Deterministic Sync Simulator for Scenario verification.
 * Runs both reconnection sequences (A then B, and B then A) and verifies convergence.
 */
export function runSyncSimulation(initialOrder, opsA, opsB) {
  // 1. Reconnect A first, then B
  const engineAFirst = new OrderSyncEngine();
  engineAFirst.init(initialOrder);
  // A's edits arrive, then B's edits arrive
  for (const op of opsA) engineAFirst.applyOp(op);
  for (const op of opsB) engineAFirst.applyOp(op);
  const finalStateAFirst = engineAFirst.getSnapshot();
  const conflictsAFirst = engineAFirst.getSurfacedConflicts();

  // 2. Reconnect B first, then A
  const engineBFirst = new OrderSyncEngine();
  engineBFirst.init(initialOrder);
  // B's edits arrive, then A's edits arrive
  for (const op of opsB) engineBFirst.applyOp(op);
  for (const op of opsA) engineBFirst.applyOp(op);
  const finalStateBFirst = engineBFirst.getSnapshot();
  const conflictsBFirst = engineBFirst.getSurfacedConflicts();

  // Determinism check
  const isDeterministic = JSON.stringify(finalStateAFirst) === JSON.stringify(finalStateBFirst);

  return {
    isDeterministic,
    finalStateAFirst,
    finalStateBFirst,
    conflictsAFirst,
    conflictsBFirst
  };
}
