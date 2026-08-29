/**
 * conflict.test.js — Test Runner for DevCraft Objective 3 (Conflict Scenarios)
 *
 * Verifies all 3 scripted offline-edit sequences from conflict_scenarios.md under:
 *   1. Reconnection Order 1: Device A first, then Device B
 *   2. Reconnection Order 2: Device B first, then Device A
 *
 * Assertions:
 *   - Determinism: finalState(A->B) === finalState(B->A) for all scenarios
 *   - No Silent Data Loss: All conflicts and discarded edits are surfaced to the operator
 *
 * Usage: node src/sync/tests/conflict.test.js
 */

/* global process */

import { runSyncSimulation } from '../syncEngine.js';

const INITIAL_ORDER = {
  order_id: 'ORD-1042',
  customer: 'Meena aunty',
  items: [
    { item_id: 'it-1', description: 'kurta', quantity: 2, attributes: { color: 'navy blue', chest: 40 } },
    { item_id: 'it-2', description: 'pajama', quantity: 1, attributes: { color: 'cream', waist: 34 } }
  ],
  due_date: '2026-09-05',
  amount: 1200,
  references_prior_order: false,
  confidence: 1.0,
  needs_clarification: false
};

async function runTests() {
  console.log('╔══════════════════════════════════════════════════════╗');
  console.log('║   KaamFlow — Conflict Resolution Verifier            ║');
  console.log('║   (Validating Scenarios 1, 2, & 3 from Brief)        ║');
  console.log('╚══════════════════════════════════════════════════════╝\n');

  let passed = 0;
  let failed = 0;

  function assert(cond, label) {
    if (cond) {
      console.log(`  ✅  ${label}`);
      passed++;
    } else {
      console.log(`  ❌  ${label}`);
      failed++;
    }
  }

  // ── Scenario 1 — Disjoint field edits ─────────────────────────────────────
  console.log('── Scenario 1: Disjoint Field Edits ───────────────────');
  const s1_opsA = [{ device: 'A', time: '10:12', type: 'SET_FIELD', field: 'due_date', value: '2026-09-08' }];
  const s1_opsB = [{ device: 'B', time: '10:15', type: 'SET_FIELD', field: 'amount', value: 1500 }];

  const res1 = runSyncSimulation(INITIAL_ORDER, s1_opsA, s1_opsB);
  assert(res1.isDeterministic, 'Scenario 1: Deterministic under both reconnection orders (A->B === B->A)');
  assert(res1.finalStateAFirst.due_date === '2026-09-08', 'Scenario 1: due_date updated to 2026-09-08');
  assert(res1.finalStateAFirst.amount === 1500, 'Scenario 1: amount updated to 1500');
  console.log(`     Converged State: due_date="${res1.finalStateAFirst.due_date}", amount=${res1.finalStateAFirst.amount}\n`);

  // ── Scenario 2 — Concurrent edit to the same field ────────────────────────
  console.log('── Scenario 2: Concurrent Edit (Identical Timestamp) ──');
  const s2_opsA = [{ device: 'A', time: '11:03', type: 'SET_ITEM_FIELD', itemId: 'it-1', field: 'quantity', value: 3 }];
  const s2_opsB = [{ device: 'B', time: '11:03', type: 'SET_ITEM_FIELD', itemId: 'it-1', field: 'quantity', value: 5 }];

  const res2 = runSyncSimulation(INITIAL_ORDER, s2_opsA, s2_opsB);
  const qAFirst = res2.finalStateAFirst.items.find(i => i.item_id === 'it-1').quantity;
  const qBFirst = res2.finalStateBFirst.items.find(i => i.item_id === 'it-1').quantity;

  assert(res2.isDeterministic, 'Scenario 2: Deterministic under both reconnection orders (A->B === B->A)');
  assert(qAFirst === qBFirst, `Scenario 2: Converged quantity is consistent (${qAFirst})`);
  assert(res2.conflictsAFirst.length > 0 || res2.conflictsBFirst.length > 0, 'Scenario 2: Overwritten concurrent edit surfaced in audit log');
  console.log(`     Converged it-1 quantity: ${qAFirst}`);
  console.log(`     Surfaced Conflicts: ${JSON.stringify(res2.conflictsAFirst.concat(res2.conflictsBFirst))}\n`);

  // ── Scenario 3 — Delete versus update ─────────────────────────────────────
  console.log('── Scenario 3: Delete vs Concurrent Update ────────────');
  const s3_opsA = [{ device: 'A', time: '14:20', type: 'DELETE_ITEM', itemId: 'it-2' }];
  const s3_opsB = [
    { device: 'B', time: '14:22', type: 'SET_ITEM_FIELD', itemId: 'it-2', field: 'attributes.color', value: 'black' },
    { device: 'B', time: '14:23', type: 'SET_ITEM_FIELD', itemId: 'it-2', field: 'quantity', value: 4 }
  ];

  const res3 = runSyncSimulation(INITIAL_ORDER, s3_opsA, s3_opsB);
  assert(res3.isDeterministic, 'Scenario 3: Deterministic under both reconnection orders (A->B === B->A)');
  assert(res3.conflictsAFirst.length > 0 || res3.conflictsBFirst.length > 0, 'Scenario 3: Delete/edit collision surfaced to operator in audit log');
  console.log(`     Items in final state: ${res3.finalStateAFirst.items.map(i => i.item_id || i.description).join(', ')}`);
  console.log(`     Surfaced Conflict Logs: ${JSON.stringify(res3.conflictsAFirst.concat(res3.conflictsBFirst), null, 2)}\n`);

  console.log('── Summary ────────────────────────────────────────────');
  console.log(`  Tests Passed: ${passed}`);
  console.log(`  Tests Failed: ${failed}`);

  if (failed > 0) {
    process.exit(1);
  } else {
    console.log('\n✨  All conflict resolution scenarios passed successfully!');
  }
}

runTests().catch(err => {
  console.error('Fatal test error:', err);
  process.exit(1);
});
