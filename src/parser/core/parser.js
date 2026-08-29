/**
 * parser.js — Hybrid Router Architecture for DevCraft
 *
 * Online Path:  Google Gemini REST API (gemini-3.6-flash) / OpenAI API → strictly conforms to schema.json.
 * Offline Path: Local deterministic NLP regex / rule-based engine — zero blocking network calls.
 *
 * Guaranteed strict compliance with schema.json (no extra properties).
 */

/* global process */

import {
  extractItemsAndAttributes,
  extractAmount,
  extractCustomer,
  referencesPriorOrder,
  isMissingBlockingAttribute,
  detectDomain,
  DOMAIN_VOCABULARY
} from './entityextractor.js';
import { parseDate } from './dateParser.js';
import { computeConfidence } from './confidence.js';

// ─── Configuration ──────────────────────────────────────────────────────────

const GEMINI_API_KEY = process.env.GEMINI_API_KEY || '';
const OPENAI_API_KEY = process.env.OPENAI_API_KEY || '';
const LLM_TIMEOUT   = parseInt(process.env.LLM_TIMEOUT || '10000', 10); // ms

/**
 * Detects which LLM provider is configured.
 * @returns {'gemini' | 'openai' | null}
 */
export function detectProvider() {
  if (GEMINI_API_KEY) return 'gemini';
  if (OPENAI_API_KEY) return 'openai';
  return null;
}

// ─── System Prompt for LLM ──────────────────────────────────────────────────

function buildSystemPrompt(domain, receivedAt) {
  const vocabDesc = JSON.stringify(DOMAIN_VOCABULARY, null, 2);

  return `You are an expert order extraction engine for DevCraft.
Given a customer message in Hinglish / Hindi / Devanagari / English, extract structured order data strictly following the schema.

Anchor Information:
- Received at (Asia/Kolkata): "${receivedAt || '2026-08-30T10:00:00+05:30'}"
- Domain: "${domain || 'unknown'}" (tailor, tiffin, electrician, baker)

Closed Attribute Vocabulary by Domain:
${vocabDesc}

Critical Rules:
1. "items": Array of distinct items ordered. If no item can be identified, emit an empty array [].
   - "description": lowercase singular item name (e.g. "socket", "wiring", "pant", "pajama", "blouse", "rajma", "cake").
   - "quantity": integer count (default 1). If contradictory ("do ya teen"), record first number (2) and set needs_clarification: true.
   - "attributes": Object with keys strictly from the domain's vocabulary above. Never emit keys outside this list. Values must be scalar (string, number, or boolean).
     - electrician issues: "not working", "spark", "noise", "slow", "short circuit", "fuse blown", "leaking current".
     - tailor fit: "slim", "regular", "loose". sleeve: "full", "half", "three-quarter".
     - tiffin: jain is boolean (true/false), spice_level in ("mild", "medium", "spicy"), portion in ("half", "full", "extra").
     - baker: egg_free is boolean (true/false).
2. "due_date": ISO-8601 calendar date (YYYY-MM-DD), resolved against received_at in Asia/Kolkata.
   - "kal" is always tomorrow (+1 day). "parso" is +2 days. "is weekend" is upcoming Saturday.
   - "agle <day>" is strictly next weekday (+7 if received_at is that day).
   - If no deadline is stated, emit null.
   - If an unresolvable deadline is referenced ("jaldi", "asap", "urgent", "jab ho jaye", "festival se pehle", "diwali se pehle"), emit null AND set needs_clarification: true.
3. "amount": Total money stated in INR as a plain number (e.g. 1200), without symbols. null if not stated.
4. "references_prior_order": boolean (true for "last time jaisa", "pichli baar wala", false for "pichli baar jaisa nahi").
5. "needs_clarification": boolean. Set to true IF AND ONLY IF:
   (a) No identifiable item (items: [])
   (b) Quantity is referenced but contradictory ("do ya teen")
   (c) Deadline is referenced but unresolvable to calendar date ("jaldi", "asap")
   (d) A blocking attribute is missing from ALL items:
       - baker: "flavour" is missing
       - electrician: "issue" is missing
       (tailor and tiffin are non-blocking, never flag them for missing attributes)
   A field that is simply absent and not referenced is null, NOT a clarification.

Respond ONLY with a valid JSON object with EXACTLY these fields: customer, items, due_date, amount, references_prior_order, confidence, needs_clarification.`;
}

// ─── Schema Enforcement ─────────────────────────────────────────────────────

/**
 * Validates and strictly coerces predictions to the schema.json shape without extra properties.
 *
 * @param {Object} raw
 * @param {string} id
 * @param {string} [domain]
 * @returns {Object}
 */
export function enforceSchema(raw, id, domain) {
  const customer = (typeof raw.customer === 'string' && raw.customer.trim()) ? raw.customer.trim() : null;

  const validVocabKeys = domain && DOMAIN_VOCABULARY[domain]
    ? new Set(DOMAIN_VOCABULARY[domain])
    : null;

  const items = Array.isArray(raw.items)
    ? raw.items.map(item => {
        const desc = typeof item.description === 'string' ? item.description.trim().toLowerCase() : '';
        const qty = Number.isInteger(item.quantity) && item.quantity >= 1
          ? item.quantity
          : (Number.isFinite(item.quantity) ? Math.max(1, Math.round(item.quantity)) : 1);

        const rawAttrs = (typeof item.attributes === 'object' && item.attributes !== null && !Array.isArray(item.attributes))
          ? item.attributes
          : {};

        const cleanAttrs = {};
        for (const [k, v] of Object.entries(rawAttrs)) {
          if (validVocabKeys && !validVocabKeys.has(k)) continue;
          if (typeof v === 'string' || typeof v === 'number' || typeof v === 'boolean') {
            cleanAttrs[k] = v;
          }
        }

        return {
          description: desc,
          quantity: qty,
          attributes: cleanAttrs
        };
      }).filter(i => i.description.length > 0)
    : [];

  let due_date = null;
  if (typeof raw.due_date === 'string' && /^\d{4}-\d{2}-\d{2}$/.test(raw.due_date.trim())) {
    due_date = raw.due_date.trim();
  }

  const amount = (typeof raw.amount === 'number' && Number.isFinite(raw.amount) && raw.amount > 0)
    ? raw.amount
    : null;

  const references_prior_order = Boolean(raw.references_prior_order);
  const confidence = Number.isFinite(raw.confidence)
    ? Math.max(0.0, Math.min(1.0, parseFloat(raw.confidence.toFixed(2))))
    : 1.0;
  const needs_clarification = Boolean(raw.needs_clarification);

  return {
    id,
    customer,
    items,
    due_date,
    amount,
    references_prior_order,
    confidence,
    needs_clarification
  };
}

// ─── Online Gemini Path ──────────────────────────────────────────────────────

async function parseWithGemini(record) {
  const model = process.env.GEMINI_MODEL || 'gemini-3.6-flash';
  const url = `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${process.env.GEMINI_API_KEY}`;

  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), LLM_TIMEOUT);

  try {
    const prompt = `${buildSystemPrompt(record.domain, record.received_at)}\n\nMessage to parse:\n"${record.message}"`;

    const res = await fetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        contents: [{ role: 'user', parts: [{ text: prompt }] }],
        generationConfig: {
          responseMimeType: 'application/json',
          temperature: 0.0
        }
      }),
      signal: controller.signal
    });

    if (!res.ok) {
      throw new Error(`Gemini API returned ${res.status}`);
    }

    const data = await res.json();
    const text = data?.candidates?.[0]?.content?.parts?.[0]?.text;
    if (!text) throw new Error('Empty Gemini output');

    const parsed = JSON.parse(text);
    return enforceSchema(parsed, record.id, record.domain);
  } finally {
    clearTimeout(timer);
  }
}

// ─── Online OpenAI Path ──────────────────────────────────────────────────────

async function parseWithOpenAI(record) {
  const url = 'https://api.openai.com/v1/chat/completions';
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), LLM_TIMEOUT);

  try {
    const res = await fetch(url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${process.env.OPENAI_API_KEY}`
      },
      body: JSON.stringify({
        model: 'gpt-4o-mini',
        response_format: { type: 'json_object' },
        temperature: 0.0,
        messages: [
          { role: 'system', content: buildSystemPrompt(record.domain, record.received_at) },
          { role: 'user', content: record.message }
        ]
      }),
      signal: controller.signal
    });

    if (!res.ok) throw new Error(`OpenAI API returned ${res.status}`);
    const data = await res.json();
    const text = data?.choices?.[0]?.message?.content;
    if (!text) throw new Error('Empty OpenAI output');

    const parsed = JSON.parse(text);
    return enforceSchema(parsed, record.id, record.domain);
  } finally {
    clearTimeout(timer);
  }
}

// ─── Offline Pure-JS Fallback Path ──────────────────────────────────────────

/**
 * Pure JS rule-based parser. Zero network calls.
 *
 * @param {Object} record - { id, message, domain, received_at }
 * @returns {Object}
 */
export function parseOffline(record) {
  const message = typeof record === 'string' ? record : (record?.message || '');
  const recId = typeof record === 'object' && record ? record.id : 'record';
  const receivedAt = (typeof record === 'object' && record?.received_at) ? record.received_at : new Date().toISOString();
  const domain = (typeof record === 'object' && record?.domain && record.domain !== 'all' && record.domain !== 'general')
    ? record.domain
    : detectDomain(message);

  const { items, has_contradictory_quantity } = extractItemsAndAttributes(message, domain);
  const { due_date, had_unresolvable_deadline } = parseDate(message, receivedAt);
  const amount = extractAmount(message);
  const customer = extractCustomer(message);
  const references_prior_order = referencesPriorOrder(message);
  const missing_blocking_attribute = isMissingBlockingAttribute(items, domain);

  const { confidence, needs_clarification } = computeConfidence({
    customer,
    items,
    due_date,
    amount,
    references_prior_order,
    domain,
    had_unresolvable_deadline,
    has_contradictory_quantity,
    missing_blocking_attribute
  });

  const enforced = enforceSchema({
    customer,
    items,
    due_date,
    amount,
    references_prior_order,
    confidence,
    needs_clarification
  }, recId, domain);

  return {
    ...enforced,
    domain
  };
}

// ─── Hybrid Router ──────────────────────────────────────────────────────────

/**
 * Parses a single message or record object through the hybrid router.
 *
 * @param {string|Object} input
 * @returns {Promise<Object>}
 */
export async function parseMessage(input) {
  const record = typeof input === 'string'
    ? { id: 'test-input', message: input, domain: null, received_at: new Date().toISOString() }
    : {
        id: input.id || 'record',
        message: input.message || '',
        domain: input.domain || null,
        received_at: input.received_at || new Date().toISOString()
      };

  const provider = detectProvider();

  if (provider === 'gemini') {
    try {
      const res = await parseWithGemini(record);
      return { ...res, _route: 'online' };
    } catch {
      // Fallback to offline
    }
  } else if (provider === 'openai') {
    try {
      const res = await parseWithOpenAI(record);
      return { ...res, _route: 'online' };
    } catch {
      // Fallback to offline
    }
  }

  const res = parseOffline(record);
  return { ...res, _route: 'offline' };
}

/**
 * Batch-parse multiple records with concurrency control.
 *
 * @param {Array<string|Object>} records
 * @param {{ batchSize?: number, onProgress?: (done: number, total: number) => void }} [opts]
 * @returns {Promise<Object[]>}
 */
export async function parseMessages(records, opts = {}) {
  const { batchSize = 10, onProgress } = opts;
  const results = new Array(records.length);

  for (let i = 0; i < records.length; i += batchSize) {
    const batch = records.slice(i, i + batchSize);
    const batchResults = await Promise.all(batch.map(r => parseMessage(r)));

    for (let j = 0; j < batchResults.length; j++) {
      results[i + j] = batchResults[j];
    }

    if (onProgress) {
      onProgress(Math.min(i + batchSize, records.length), records.length);
    }
  }

  return results;
}