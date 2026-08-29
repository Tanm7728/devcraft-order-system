/**
 * nlp.js — Lightweight NLP & Fuzzy Matching Utility for Conversational Hinglish
 * Pure JS — Zero external network dependencies.
 */

import { convertDevanagariDigits } from './numberWords.js';

/**
 * Computes Levenshtein Distance between two strings.
 */
export function levenshteinDistance(a, b) {
  if (a.length === 0) return b.length;
  if (b.length === 0) return a.length;

  const matrix = [];
  for (let i = 0; i <= b.length; i++) matrix[i] = [i];
  for (let j = 0; j <= a.length; j++) matrix[0][j] = j;

  for (let i = 1; i <= b.length; i++) {
    for (let j = 1; j <= a.length; j++) {
      if (b.charAt(i - 1) === a.charAt(j - 1)) {
        matrix[i][j] = matrix[i - 1][j - 1];
      } else {
        matrix[i][j] = Math.min(
          matrix[i - 1][j - 1] + 1, // substitution
          matrix[i][j - 1] + 1,     // insertion
          matrix[i - 1][j] + 1      // deletion
        );
      }
    }
  }

  return matrix[b.length][a.length];
}

/**
 * Returns similarity ratio between 0.0 and 1.0.
 */
export function stringSimilarity(str1, str2) {
  const s1 = String(str1).toLowerCase().trim();
  const s2 = String(str2).toLowerCase().trim();
  if (s1 === s2) return 1.0;
  const maxLen = Math.max(s1.length, s2.length);
  if (maxLen === 0) return 1.0;
  const dist = levenshteinDistance(s1, s2);
  return Math.max(0, 1 - (dist / maxLen));
}

/**
 * Common Hinglish word stemmer / normalizer
 */
export function normalizeToken(token) {
  if (!token) return '';
  let t = convertDevanagariDigits(token.toLowerCase().trim());

  // Plural removal
  if (t.endsWith('s') && !t.endsWith('ss') && t.length > 3) {
    if (t === 'cookies') t = 'cookie';
    else if (t === 'pastries') t = 'pastry';
    else if (t === 'brownies') t = 'brownie';
    else if (t === 'rotis') t = 'roti';
    else if (t === 'kurtas') t = 'kurta';
    else if (t === 'shirts') t = 'shirt';
    else if (t === 'blouses') t = 'blouse';
    else if (t === 'pants') t = 'pant';
    else if (t === 'pajamas' || t === 'pyjamas') t = 'pajama';
    else if (t === 'fans') t = 'fan';
    else if (t === 'switches') t = 'switch';
    else if (t === 'sockets') t = 'socket';
    else if (t === 'lights') t = 'light';
    else if (t === 'cakes') t = 'cake';
    else t = t.slice(0, -1);
  }

  // Common Hindi verb/inflection stemming
  if (t === 'silwani' || t === 'silwana' || t === 'silna' || t === 'silana' || t === 'silvaana') {
    return 'stitch';
  }

  return t;
}

/**
 * Splits text into tokens while preserving Devanagari and punctuation bounds.
 */
export function tokenize(text) {
  if (!text) return [];
  const converted = convertDevanagariDigits(text);
  return converted
    .split(/[\s,;!?.\n]+/)
    .map(t => t.trim())
    .filter(t => t.length > 0);
}

/**
 * Extracts attached numbers and units like "2kg", "1.5kg", "500rs", "34inch", "4roti"
 */
export function parseAttachedQuantities(text) {
  const replacements = [];
  const re = /(\d+(?:\.\d+)?)\s*(kg|kilo|gram|gm|inch|in|rs|₹|rotis?|kurtas?|shirts?|blouses?|fans?|sockets?|mcb|lights?)/gi;
  let match;
  while ((match = re.exec(text)) !== null) {
    replacements.push({
      full: match[0],
      number: parseFloat(match[1]),
      unit: match[2].toLowerCase(),
      index: match.index,
    });
  }
  return replacements;
}

/**
 * Non-customer stop words (common salutations and intent markers)
 */
export const NON_CUSTOMER_WORDS = new Set([
  'bhaiya', 'bhai', 'didi', 'uncle', 'aunty', 'sir', 'madam', 'ji', 'hello', 'namaste',
  'order', 'urgent', 'urgent order', 'please', 'plz', 'total', 'amount', 'rate', 'price',
  'kal', 'aaj', 'parso', 'narso', 'tarikh', 'date', 'delivery', 'address', 'master', 'bedroom',
  'kitchen', 'bathroom', 'hall', 'room', 'balcony', 'terrace', 'house', 'home', 'shop'
]);
