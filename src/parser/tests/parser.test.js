/**
 * parser.test.js — Test Script for Test A & Dataset Evaluation
 *
 * Reads messages_train.json (250 records), parses each record through the router,
 * writes clean predictions to results.json matching schema.json, and executes score.py.
 *
 * Usage:  node src/parser/tests/parser.test.js
 */

/* global process */

import { readFile, writeFile } from 'node:fs/promises';
import { fileURLToPath } from 'node:url';
import { dirname, resolve } from 'node:path';
import { exec } from 'node:child_process';
import { promisify } from 'node:util';
import { parseMessages, detectProvider } from '../core/parser.js';

const execAsync = promisify(exec);
const __filename = fileURLToPath(import.meta.url);
const __dirname  = dirname(__filename);
const ROOT       = resolve(__dirname, '..', '..', '..');

async function main() {
  const startTime = performance.now();

  console.log('╔══════════════════════════════════════════════════════╗');
  console.log('║   KaamFlow — DevCraft Test A Evaluator               ║');
  console.log('╚══════════════════════════════════════════════════════╝\n');

  const provider = detectProvider();
  if (provider) {
    console.log(`🌐  Active LLM Provider: ${provider.toUpperCase()}`);
  } else {
    console.log('📴  Mode: Local Deterministic Offline Fallback (Zero Network Calls)');
  }

  // 1. Load dataset
  const messagesPath = resolve(ROOT, 'messages_train.json');
  console.log(`📂  Loading dataset from: ${messagesPath}`);

  const raw = await readFile(messagesPath, 'utf-8');
  const records = JSON.parse(raw);

  if (!Array.isArray(records) || records.length === 0) {
    console.error('❌  messages_train.json must be a non-empty array of records.');
    process.exit(1);
  }

  console.log(`✅  Loaded ${records.length} records.\n`);
  console.log('⚙️   Parsing records through hybrid router...');

  // 2. Parse batch with progress
  const results = await parseMessages(records, {
    batchSize: provider ? 5 : 50,
    onProgress: (done, total) => {
      const pct = Math.round((done / total) * 100);
      process.stdout.write(`\r  Progress: ${done}/${total} (${pct}%)`);
    }
  });

  process.stdout.write('\n\n');

  // 3. Prepare clean output conforming strictly to schema.json
  const output = results.map(r => {
    const clean = { ...r };
    delete clean._route;
    return clean;
  });

  const outputPath = resolve(ROOT, 'results.json');
  await writeFile(outputPath, JSON.stringify(output, null, 2), 'utf-8');
  console.log(`📝  Predictions saved to: ${outputPath}`);

  // 4. Statistics
  const elapsed = ((performance.now() - startTime) / 1000).toFixed(2);
  const onlineCount  = results.filter(r => r._route === 'online').length;
  const offlineCount = results.filter(r => r._route === 'offline').length;
  const clarifyCount = results.filter(r => r.needs_clarification).length;

  console.log('\n── Execution Metrics ──────────────────────────────────');
  console.log(`  Total Processed:    ${results.length}`);
  console.log(`  Online Routed:      ${onlineCount}`);
  console.log(`  Offline Routed:     ${offlineCount}`);
  console.log(`  Needs Clarification: ${clarifyCount}`);
  console.log(`  Processing Time:    ${elapsed}s\n`);

  // 5. Run official score.py if present
  const scorePyPath = resolve(ROOT, 'score.py');
  const breakdownPath = resolve(ROOT, 'breakdown.json');

  try {
    console.log('📊  Executing official score.py benchmark...');
    const cmd = `python "${scorePyPath}" --gold "${messagesPath}" --pred "${outputPath}" --out "${breakdownPath}"`;
    const { stdout } = await execAsync(cmd, { cwd: ROOT });
    console.log(stdout);
  } catch (err) {
    console.warn('⚠️  Could not run score.py directly via child_process:', err.message);
    console.log('    You can run it manually with:');
    console.log(`    python score.py --gold messages_train.json --pred results.json --out breakdown.json`);
  }

  console.log('✨  Evaluation run completed.');
}

main().catch(err => {
  console.error('💥  Fatal error in evaluator:', err);
  process.exit(1);
});
