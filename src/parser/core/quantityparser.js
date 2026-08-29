/**
 * quantityParser.js
 * Extracts numeric quantities from unstructured text.
 * Uses numberWords utility for Hindi/English word-to-number mapping.
 * Default: 1 if an item is mentioned but quantity is absent.
 *
 * Pure JS — zero network calls.
 */

import { wordToNumber, NUMBER_WORD_MAP } from '../utils/numberWords.js';

// Build a regex alternation from all known number words (longest first to avoid partial matches)
const wordKeys = Object.keys(NUMBER_WORD_MAP).sort((a, b) => b.length - a.length);
const numberWordPattern = wordKeys.map(w => w.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')).join('|');

// Pattern: <numberWord|digit> <item>   — e.g. "2 kurta", "ek shirt", "दर्जन gulab jamun"
const QTY_ITEM_RE = new RegExp(
  `(?:^|\\s)(\\d+(?:\\.\\d+)?|${numberWordPattern})\\s+(?:bhar\\s+)?([a-zA-Z\u0900-\u097F][a-zA-Z\u0900-\u097F\\s]{1,30}?)(?=[,.]|\\s*$|\\s+(?:aur|and|ya|or|chahiye|banana|bana|karwani|mein|ho|tak))`,
  'gi'
);

/**
 * Extracts quantity–item pairs from a message.
 *
 * @param {string} message
 * @returns {{ description: string, quantity: number }[]}
 */
export function extractQuantities(message) {
  if (!message) return [];

  const results = [];
  const seen = new Set();
  let match;

  // Reset regex state
  QTY_ITEM_RE.lastIndex = 0;

  while ((match = QTY_ITEM_RE.exec(message)) !== null) {
    const rawQty = match[1];
    const rawItem = match[2].trim();

    if (!rawItem || rawItem.length < 2) continue;

    const qty = wordToNumber(rawQty);
    const description = rawItem.toLowerCase();

    if (!seen.has(description)) {
      seen.add(description);
      results.push({
        description: rawItem.trim(),
        quantity: qty !== null ? Math.round(qty) : 1,
      });
    }
  }

  return results;
}

/**
 * Given a pre-extracted item description, attempts to find a leading quantity.
 * Falls back to 1.
 *
 * @param {string} fragment  — e.g. "2 kurta" or "shirt"
 * @returns {{ description: string, quantity: number }}
 */
export function parseQuantityFromFragment(fragment) {
  const m = fragment.match(/^(\d+(?:\.\d+)?)\s+(.+)/);
  if (m) {
    return { description: m[2].trim(), quantity: Math.round(parseFloat(m[1])) };
  }

  // Try word-based numbers
  for (const [word, num] of Object.entries(NUMBER_WORD_MAP)) {
    const re = new RegExp(`^${word.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}\\s+(.+)`, 'i');
    const wm = fragment.match(re);
    if (wm) {
      return { description: wm[1].trim(), quantity: Math.round(num) };
    }
  }

  return { description: fragment.trim(), quantity: 1 };
}
