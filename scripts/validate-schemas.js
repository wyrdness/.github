#!/usr/bin/env node
/**
 * Validate every sibling phenomenon repo's api.json against the org schema.
 * Reports failures; does not modify data.
 */
const fs = require('fs');
const path = require('path');
const Ajv = require('ajv');
const addFormats = require('ajv-formats');

const PARENT_DIR = path.join(__dirname, '../../');
const SCHEMA_PATH = path.join(PARENT_DIR, '.github/schemas/api.schema.json');

const EXCLUDE = new Set(['wyrdness.github.io', '.github', 'server', 'node_modules']);

function listPhenomenonDirs() {
  return fs.readdirSync(PARENT_DIR, { withFileTypes: true })
    .filter(e => e.isDirectory() && !e.name.startsWith('.') && !EXCLUDE.has(e.name))
    .map(e => e.name)
    .sort();
}

function main() {
  if (!fs.existsSync(SCHEMA_PATH)) {
    console.error(`Schema not found at ${SCHEMA_PATH}`);
    process.exit(1);
  }

  const schema = JSON.parse(fs.readFileSync(SCHEMA_PATH, 'utf8'));
  const ajv = new Ajv({ allErrors: true, strict: false });
  addFormats(ajv);
  const validate = ajv.compile(schema);

  const dirs = listPhenomenonDirs();
  let ok = 0;
  let failed = 0;
  let missing = 0;
  const failures = [];

  for (const name of dirs) {
    const apiPath = path.join(PARENT_DIR, name, 'api.json');
    if (!fs.existsSync(apiPath)) {
      missing++;
      failures.push({ name, kind: 'missing', errors: ['api.json not present'] });
      continue;
    }

    let data;
    try {
      data = JSON.parse(fs.readFileSync(apiPath, 'utf8'));
    } catch (err) {
      failed++;
      failures.push({ name, kind: 'parse', errors: [err.message] });
      continue;
    }

    if (validate(data)) {
      ok++;
    } else {
      failed++;
      failures.push({
        name,
        kind: 'schema',
        errors: validate.errors.slice(0, 5).map(e => `${e.instancePath || '/'} ${e.message}`)
      });
    }
  }

  console.log(`Validated ${dirs.length} repo(s):`);
  console.log(`  ok      = ${ok}`);
  console.log(`  failed  = ${failed}`);
  console.log(`  missing = ${missing}`);

  if (failures.length) {
    console.log('\nFailures:');
    for (const f of failures.slice(0, 50)) {
      console.log(`  [${f.kind}] ${f.name}`);
      for (const e of f.errors) console.log(`     - ${e}`);
    }
    if (failures.length > 50) console.log(`  ...and ${failures.length - 50} more`);
  }

  process.exit(failed + missing > 0 ? 1 : 0);
}

main();
