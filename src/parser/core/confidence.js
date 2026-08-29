/**
 * confidence.js
 * Calculates self-reported confidence (0.0 to 1.0) and evaluates the strict needs_clarification
 * decision rule from DATASET_CARD.md.
 *
 * needs_clarification is true iff at least one of:
 *   (a) No identifiable item (items: [])
 *   (b) Referenced quantity is unreadable or contradictory ("do ya teen")
 *   (c) Referenced deadline cannot be resolved to a calendar date (jaldi, asap, urgent...)
 *   (d) Blocking attribute is missing from all items (baker: flavour, electrician: issue)
 *
 * Pure JS — zero network calls.
 */

/**
 * @typedef {Object} ParseContext
 * @property {string|null} customer
 * @property {Array} items
 * @property {string|null} due_date
 * @property {number|null} amount
 * @property {boolean} references_prior_order
 * @property {string} [domain]
 * @property {boolean} [had_unresolvable_deadline]
 * @property {boolean} [has_contradictory_quantity]
 * @property {boolean} [missing_blocking_attribute]
 */

/**
 * Computes self-reported confidence and evaluates the exact needs_clarification rule.
 *
 * @param {ParseContext} ctx
 * @returns {{ confidence: number, needs_clarification: boolean }}
 */
export function computeConfidence(ctx) {
  let needs_clarification = false;

  // ── (a) No identifiable item ──────────────────────────────────────────────
  const noItems = !ctx.items || ctx.items.length === 0;
  if (noItems) {
    needs_clarification = true;
  }

  // ── (b) Contradictory / ambiguous quantity ─────────────────────────────────
  if (ctx.has_contradictory_quantity) {
    needs_clarification = true;
  }

  // ── (c) Unresolvable deadline referenced ───────────────────────────────────
  if (ctx.had_unresolvable_deadline && ctx.due_date === null) {
    needs_clarification = true;
  }

  // ── (d) Blocking attribute missing ─────────────────────────────────────────
  if (ctx.missing_blocking_attribute) {
    needs_clarification = true;
  }

  // ── Confidence Calculation ────────────────────────────────────────────────
  let score = 0.0;

  if (noItems) {
    score = 0.0;
  } else {
    score += 0.40; // Base item presence

    // Bonus for items with valid quantities and attributes
    const validItems = ctx.items.filter(i => i.quantity >= 1);
    if (validItems.length === ctx.items.length) score += 0.15;

    const hasAttrs = ctx.items.some(i => i.attributes && Object.keys(i.attributes).length > 0);
    if (hasAttrs) score += 0.15;

    if (ctx.due_date !== null) score += 0.10;
    if (ctx.amount !== null) score += 0.10;
    if (ctx.customer !== null) score += 0.05;
    if (ctx.references_prior_order) score += 0.05;
  }

  if (needs_clarification && score > 0.4) {
    score = Math.min(score, 0.5);
  }

  const confidence = Math.round(Math.min(Math.max(score, 0.0), 1.0) * 100) / 100;

  return {
    confidence,
    needs_clarification
  };
}
