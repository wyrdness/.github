#!/usr/bin/env node
/**
 * Research a single phenomenon using the Claude API.
 *
 * Reads <repo>/api.json (skeleton or partially populated) and produces a
 * fully populated draft conforming to the org schema. Output is written to
 * drafts/<id>.json — never overwriting the source — so a human reviews
 * before merging.
 *
 * Usage:
 *   ANTHROPIC_API_KEY=... node scripts/claude-research.js <repo-id>
 *   ANTHROPIC_API_KEY=... node scripts/claude-research.js <repo-id> --apply
 *
 * Run via Docker:  make research ID=bigfoot
 *
 * Notes:
 *   - Uses claude-opus-4-7 with extended thinking for hard cases.
 *   - Aggressive prompt caching: the schema, accuracy rules, and the bigfoot
 *     reference example are cached so per-phenomenon calls are cheap.
 *   - The model is instructed to refuse to fabricate and to mark uncertain
 *     fields rather than invent them.
 */
const fs = require('fs');
const path = require('path');
const Anthropic = require('@anthropic-ai/sdk');

const PARENT_DIR = path.join(__dirname, '../../');
const SCHEMA_PATH = path.join(PARENT_DIR, '.github/schemas/api.schema.json');
const REFERENCE_PATH = path.join(PARENT_DIR, 'bigfoot/api.json');
const DRAFTS_DIR = path.join(__dirname, '../drafts');

const MODEL = 'claude-opus-4-7';
const MAX_TOKENS = 16000;
const THINKING_BUDGET = 6000;

function usage() {
  console.error('usage: claude-research.js <repo-id> [--apply]');
  process.exit(1);
}

function readJson(p) { return JSON.parse(fs.readFileSync(p, 'utf8')); }

function buildSystem(schemaText, referenceText) {
  // System prompt is cached; per-phenomenon calls only pay for the user
  // message + thinking + output.
  return [
    {
      type: 'text',
      text: `You are a paranormal phenomena researcher producing reference-quality data for the Wyrdness Project.

Your job: produce a fully populated api.json for one phenomenon, conforming exactly to the JSON schema below.

# Accuracy is non-negotiable

- NEVER fabricate sightings, dates, witness names, ISBNs, DOIs, coordinates, or sources.
- Only include facts you are highly confident about from your training data.
- For a fact you are unsure of, omit the field or use a conservative formulation. Empty arrays and unknown values are acceptable; invented details are not.
- Sources (books, papers, articles) MUST be real publications you can identify with reasonable confidence. Prefer well-known monographs and peer-reviewed papers. If uncertain about an ISBN/DOI, omit that field rather than guessing.
- For each notable sighting, the date, location, and witness names must be drawn from the documentary record. If you cannot verify all three, omit the sighting.
- For Indigenous traditions, use respectful, accurate framing that matches published ethnography. Distinguish folkloric figures from cryptozoological framings.
- If a phenomenon is genuinely under-documented or you have low confidence, return a smaller but accurate api.json — not a padded one with invented details.

# Output format

Return ONLY a single JSON object that validates against the schema. No prose, no markdown code fences, no explanations. Top-level keys must include: meta, phenomenon, classification, characteristics, distribution, history, sightings, evidence, theories, cultural, research, sources.

# Schema

\`\`\`json
${schemaText}
\`\`\`

# Reference example (Bigfoot, fully populated)

\`\`\`json
${referenceText}
\`\`\`

The reference shows the level of detail and citation expected for a well-documented phenomenon. For obscure phenomena, scale down accordingly — but keep the structure.`,
      cache_control: { type: 'ephemeral' }
    }
  ];
}

function buildUser(skeleton) {
  return `Phenomenon: ${skeleton.phenomenon?.name || skeleton.phenomenon?.id}
Repository id: ${skeleton.phenomenon?.id}
Current category: ${skeleton.phenomenon?.category}

Existing skeleton api.json:
\`\`\`json
${JSON.stringify(skeleton, null, 2)}
\`\`\`

Produce a fully populated api.json for this phenomenon. Preserve the meta block (version, repository, maintainers, license) and the phenomenon.id from the skeleton. Update meta.last_updated to today's date in YYYY-MM-DD form. Bump meta.version to 1.1.0 if the skeleton was 1.0.0.

Output JSON only.`;
}

function extractJson(text) {
  // Tolerate fenced output even though we asked for raw JSON
  const fenced = text.match(/```(?:json)?\s*([\s\S]*?)\s*```/);
  if (fenced) return fenced[1];
  return text;
}

async function main() {
  const id = process.argv[2];
  const apply = process.argv.includes('--apply');
  if (!id || id.startsWith('--')) usage();

  const apiKey = process.env.ANTHROPIC_API_KEY;
  if (!apiKey) {
    console.error('ANTHROPIC_API_KEY not set');
    process.exit(1);
  }

  const repoDir = path.join(PARENT_DIR, id);
  const apiPath = path.join(repoDir, 'api.json');
  if (!fs.existsSync(apiPath)) {
    console.error(`No api.json at ${apiPath}`);
    process.exit(1);
  }

  const skeleton = readJson(apiPath);
  const schemaText = fs.readFileSync(SCHEMA_PATH, 'utf8');
  const referenceText = fs.readFileSync(REFERENCE_PATH, 'utf8');

  fs.mkdirSync(DRAFTS_DIR, { recursive: true });

  const client = new Anthropic({ apiKey });

  process.stderr.write(`[research] ${id}: calling ${MODEL} (extended thinking ${THINKING_BUDGET} tok)...\n`);
  const t0 = Date.now();
  const response = await client.messages.create({
    model: MODEL,
    max_tokens: MAX_TOKENS,
    thinking: { type: 'enabled', budget_tokens: THINKING_BUDGET },
    system: buildSystem(schemaText, referenceText),
    messages: [{ role: 'user', content: buildUser(skeleton) }]
  });
  const dt = ((Date.now() - t0) / 1000).toFixed(1);

  const text = response.content
    .filter(b => b.type === 'text')
    .map(b => b.text)
    .join('');

  const u = response.usage || {};
  process.stderr.write(
    `[research] ${id}: done in ${dt}s; ` +
    `input=${u.input_tokens}, ` +
    `cache_create=${u.cache_creation_input_tokens || 0}, ` +
    `cache_read=${u.cache_read_input_tokens || 0}, ` +
    `output=${u.output_tokens}\n`
  );

  let parsed;
  try {
    parsed = JSON.parse(extractJson(text));
  } catch (err) {
    const rawPath = path.join(DRAFTS_DIR, `${id}.raw.txt`);
    fs.writeFileSync(rawPath, text);
    console.error(`Parse failed; raw written to ${rawPath}`);
    process.exit(1);
  }

  const draftPath = path.join(DRAFTS_DIR, `${id}.json`);
  fs.writeFileSync(draftPath, JSON.stringify(parsed, null, 2) + '\n');
  process.stderr.write(`[research] ${id}: draft written to ${draftPath}\n`);

  if (apply) {
    fs.writeFileSync(apiPath, JSON.stringify(parsed, null, 2) + '\n');
    process.stderr.write(`[research] ${id}: applied to ${apiPath}\n`);
  } else {
    process.stderr.write(`[research] ${id}: dry run; review ${draftPath} then re-run with --apply or copy manually.\n`);
  }
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
