#!/usr/bin/env node
/**
 * Batch research driver. Iterates phenomenon repos and invokes the
 * single-repo research script for each one whose api.json is still a
 * skeleton (heuristic: empty sources[] or empty sightings.notable[]).
 *
 * Usage:
 *   ANTHROPIC_API_KEY=... node scripts/claude-research-batch.js [--apply] [--limit N] [--only id1,id2]
 *
 * Output: drafts/<id>.json per repo. Also writes drafts/_log.jsonl with
 *   per-repo timing / token usage / errors so the run is auditable.
 *
 * Concurrency is intentionally small (default 2) to stay under per-org
 * rate limits and to make the run easy to interrupt.
 */
const { spawn } = require('child_process');
const fs = require('fs');
const path = require('path');

const PARENT_DIR = path.join(__dirname, '../../');
const DRAFTS_DIR = path.join(__dirname, '../drafts');
const LOG_PATH = path.join(DRAFTS_DIR, '_log.jsonl');
const EXCLUDE = new Set(['wyrdness.github.io', '.github', 'server', 'node_modules']);

const args = process.argv.slice(2);
const APPLY = args.includes('--apply');
const FORCE = args.includes('--force');
const limitArg = args.find(a => a.startsWith('--limit='));
const onlyArg  = args.find(a => a.startsWith('--only='));
const concArg  = args.find(a => a.startsWith('--concurrency='));
const LIMIT = limitArg ? parseInt(limitArg.split('=')[1], 10) : 0;
const ONLY  = onlyArg ? onlyArg.split('=')[1].split(',').filter(Boolean) : null;
const CONCURRENCY = concArg ? parseInt(concArg.split('=')[1], 10) : 2;

if (!process.env.ANTHROPIC_API_KEY) {
  console.error('ANTHROPIC_API_KEY not set');
  process.exit(1);
}

function isSkeleton(apiPath) {
  try {
    const d = JSON.parse(fs.readFileSync(apiPath, 'utf8'));
    const sources = (d.sources || []).length;
    const notable = (d.sightings && d.sightings.notable || []).length;
    const features = (d.characteristics && d.characteristics.physical && d.characteristics.physical.features || []).length;
    return sources === 0 && notable === 0 && features === 0;
  } catch (e) {
    return false;
  }
}

function listRepos() {
  return fs.readdirSync(PARENT_DIR, { withFileTypes: true })
    .filter(e => e.isDirectory() && !e.name.startsWith('.') && !EXCLUDE.has(e.name))
    .map(e => e.name)
    .filter(name => fs.existsSync(path.join(PARENT_DIR, name, 'api.json')))
    .sort();
}

function selectTargets() {
  const all = listRepos();
  let chosen = ONLY ? all.filter(n => ONLY.includes(n)) : all.filter(n => FORCE || isSkeleton(path.join(PARENT_DIR, n, 'api.json')));
  if (LIMIT > 0) chosen = chosen.slice(0, LIMIT);
  return chosen;
}

function runOne(id) {
  return new Promise((resolve) => {
    const t0 = Date.now();
    const a = ['scripts/claude-research.js', id];
    if (APPLY) a.push('--apply');
    const child = spawn('node', a, { env: process.env, stdio: ['ignore', 'inherit', 'pipe'] });
    let stderr = '';
    child.stderr.on('data', (d) => {
      const s = d.toString();
      stderr += s;
      process.stderr.write(s);
    });
    child.on('close', (code) => {
      const entry = {
        id,
        ok: code === 0,
        code,
        ms: Date.now() - t0,
        ts: new Date().toISOString(),
        stderr_tail: stderr.split('\n').slice(-3).join('\n')
      };
      fs.appendFileSync(LOG_PATH, JSON.stringify(entry) + '\n');
      resolve(entry);
    });
  });
}

async function main() {
  fs.mkdirSync(DRAFTS_DIR, { recursive: true });
  const targets = selectTargets();
  console.error(`[batch] ${targets.length} target(s); concurrency=${CONCURRENCY}; apply=${APPLY}`);

  let cursor = 0;
  let ok = 0, fail = 0;
  async function worker() {
    while (cursor < targets.length) {
      const id = targets[cursor++];
      const r = await runOne(id);
      if (r.ok) ok++; else fail++;
    }
  }
  await Promise.all(Array.from({ length: CONCURRENCY }, () => worker()));
  console.error(`[batch] done: ok=${ok} fail=${fail} log=${LOG_PATH}`);
  process.exit(fail > 0 ? 1 : 0);
}

main().catch((e) => { console.error(e); process.exit(1); });
