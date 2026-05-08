#!/usr/bin/env node
/**
 * Generate README.md and SOURCES.md for every phenomenon repo from its
 * api.json. The api.json is the single source of truth — these markdown
 * files are derived. Run via `make repo-docs`.
 *
 * Skips repos whose api.json is still a skeleton (no sources[] and no
 * sightings.notable[]) so we don't replace hand-written stubs with even
 * thinner generated stubs. Pass --force to regenerate everything.
 */
const fs = require('fs');
const path = require('path');

const PARENT_DIR = path.join(__dirname, '../../');
const EXCLUDE = new Set(['wyrdness.github.io', '.github', 'server', 'node_modules']);
const FORCE = process.argv.includes('--force');
const ONLY = (() => {
  const a = process.argv.find(x => x.startsWith('--only='));
  return a ? a.split('=')[1].split(',').filter(Boolean) : null;
})();

function pad(s) { return (s == null ? '' : String(s)); }

function fmtAlias(a) {
  if (!a) return '';
  const bits = [];
  if (a.language) bits.push(a.language);
  if (a.region) bits.push(a.region);
  return `| ${pad(a.name)} | ${bits.join(' / ')} | ${pad(a.meaning)} |`;
}

function fmtTimeline(t) {
  return `| ${pad(t.date)} | ${pad(t.event)} | ${pad(t.significance)} |`;
}

function fmtSighting(s) {
  const date = s.date && s.date.value || '';
  const loc = s.location && s.location.description || '';
  const witnesses = s.witnesses && (s.witnesses.count != null ? `${s.witnesses.count} (${(s.witnesses.types||[]).join(', ')})` : '');
  const ev = (s.evidence || []).join('; ');
  const cred = s.credibility && s.credibility.rating || '';
  const star = s.featured ? ' ⭐' : '';
  return [
    `### ${s.name || s.id}${star}`,
    `> **Date**: ${date}  `,
    `> **Location**: ${loc}  `,
    witnesses ? `> **Witnesses**: ${witnesses}  ` : null,
    ev ? `> **Evidence**: ${ev}  ` : null,
    '',
    pad(s.description),
    '',
    cred ? `**Credibility**: ${cred}${s.credibility.notes ? ' — ' + s.credibility.notes : ''}` : null,
    (s.sources || []).length ? `**Sources**: ${(s.sources || []).join('; ')}` : null
  ].filter(Boolean).join('\n');
}

function fmtSource(s) {
  const authors = (s.authors || []).join(', ');
  const bits = [authors, s.date ? `(${s.date})` : null, `*${s.title}*`, s.publication, s.isbn ? `ISBN: ${s.isbn}` : null, s.doi ? `DOI: ${s.doi}` : null, s.url ? `<${s.url}>` : null].filter(Boolean);
  return `- ${bits.join('. ')}`;
}

function fmtTheoryGroup(group, items) {
  if (!items || !items.length) return '';
  return [
    `### ${group}`,
    '',
    items.map(t => {
      const props = (t.proponents || []).length ? ` _(${t.proponents.join(', ')})_` : '';
      return `**${t.name}**${props}\n\n${pad(t.description)}\n`;
    }).join('\n')
  ].join('\n');
}

function statusBadge(s) {
  return `![Status](https://img.shields.io/badge/status-${encodeURIComponent(pad(s) || 'unknown')}-blue)`;
}

function buildReadme(d) {
  const p = d.phenomenon || {};
  const cls = d.classification || {};
  const ch = d.characteristics || {};
  const ph = ch.physical || {};
  const dist = d.distribution || {};
  const range = dist.range || {};
  const hist = d.history || {};
  const sgt = d.sightings || {};
  const stats = sgt.statistics || {};
  const ev = d.evidence || {};
  const th = d.theories || {};
  const cult = d.cultural || {};
  const research = d.research || {};
  const sources = d.sources || [];

  const parts = [];
  parts.push(`# ${p.name || p.id}\n`);
  if (p.description && p.description.summary) parts.push(`> ${p.description.summary}\n`);
  parts.push([
    `[![API Version](https://img.shields.io/badge/api-v${(d.meta && d.meta.version) || '1.0.0'}-blue)]()`,
    `[![Last Updated](https://img.shields.io/badge/updated-${(d.meta && d.meta.last_updated) || ''}-green)]()`,
    `[![Sightings](https://img.shields.io/badge/sightings-${stats.total_documented || 0}-orange)]()`,
    statusBadge(p.status)
  ].join(' ') + '\n');

  parts.push('---\n## Quick Reference\n');
  parts.push('| Property | Value |');
  parts.push('|---|---|');
  parts.push(`| **ID** | \`${p.id}\` |`);
  parts.push(`| **Category** | ${p.category} |`);
  if (p.subcategory) parts.push(`| **Subcategory** | ${p.subcategory} |`);
  if (hist.timeline && hist.timeline.length) parts.push(`| **First recorded** | ${hist.timeline[0].date} |`);
  if (range.description) parts.push(`| **Primary range** | ${range.description.split(/[.|;]/)[0]} |`);
  parts.push(`| **Status** | ${p.status} |`);

  if (p.description && p.description.full) {
    parts.push('\n---\n## Overview\n');
    parts.push(p.description.full);
  }

  if (p.aliases && p.aliases.length) {
    parts.push('\n---\n## Names & Aliases\n');
    parts.push('| Name | Origin | Meaning |');
    parts.push('|---|---|---|');
    p.aliases.forEach(a => parts.push(fmtAlias(a)));
  }

  if (p.etymology) {
    parts.push('\n## Etymology\n');
    if (p.etymology.origin) parts.push(`- **Origin**: ${p.etymology.origin}`);
    if (p.etymology.meaning) parts.push(`- **Meaning**: ${p.etymology.meaning}`);
    if (p.etymology.first_use) parts.push(`- **First use**: ${p.etymology.first_use}`);
  }

  if (cls.related_phenomena && cls.related_phenomena.length) {
    parts.push('\n---\n## Related Phenomena\n');
    cls.related_phenomena.forEach(r => parts.push(`- [${r.name}](../${r.id}/) — _${r.relationship}_${r.description ? ': ' + r.description : ''}`));
  }

  if (ph.height || ph.weight || (ph.coloration || []).length || (ph.features || []).length || ph.morphology) {
    parts.push('\n---\n## Physical Description\n');
    if (ph.height) parts.push(`- **Height**: ${ph.height.min}–${ph.height.max} ${ph.height.unit || 'm'} _(${ph.height.confidence || 'unknown'} confidence)_`);
    if (ph.weight) parts.push(`- **Weight**: ${ph.weight.min}–${ph.weight.max} ${ph.weight.unit || 'kg'} _(${ph.weight.confidence || 'unknown'} confidence)_`);
    if ((ph.coloration || []).length) parts.push(`- **Coloration**: ${ph.coloration.join(', ')}`);
    if (ph.morphology) parts.push(`- **Morphology**: ${ph.morphology}`);
    if ((ph.features || []).length) {
      parts.push('\n### Features\n');
      parts.push('| Feature | Description | Frequency |');
      parts.push('|---|---|---|');
      ph.features.forEach(f => parts.push(`| ${f.feature} | ${f.description} | ${f.frequency || ''} |`));
    }
  }

  if ((ch.abilities || []).length) {
    parts.push('\n## Reported Abilities\n');
    parts.push('| Ability | Description | Frequency | Evidence |');
    parts.push('|---|---|---|---|');
    ch.abilities.forEach(a => parts.push(`| ${a.ability} | ${a.description} | ${a.frequency || ''} | ${a.evidence_level || ''} |`));
  }

  if (ch.behavior) {
    const b = ch.behavior;
    parts.push('\n## Behavior\n');
    if (b.activity_period) parts.push(`- **Activity**: ${b.activity_period}`);
    if (b.disposition) parts.push(`- **Disposition**: ${b.disposition}`);
    if (b.social_structure) parts.push(`- **Social structure**: ${b.social_structure}`);
    if ((b.habitat_preference || []).length) parts.push(`- **Habitat**: ${b.habitat_preference.join(', ')}`);
    if (b.diet) parts.push(`- **Diet**: ${b.diet}`);
  }

  if (range.description || (dist.hotspots || []).length) {
    parts.push('\n---\n## Distribution\n');
    if (range.description) parts.push(range.description + '\n');
    if ((dist.hotspots || []).length) {
      parts.push('### Hotspots\n');
      parts.push('| Location | Region | Sightings | Peak |');
      parts.push('|---|---|---|---|');
      dist.hotspots.forEach(h => {
        const region = h.location && [h.location.region, h.location.country].filter(Boolean).join(', ');
        parts.push(`| ${h.name} | ${region || ''} | ${h.sighting_count || ''} | ${h.peak_period || ''} |`);
      });
    }
  }

  if (hist.timeline && hist.timeline.length) {
    parts.push('\n---\n## Historical Timeline\n');
    parts.push('| Date | Event | Significance |');
    parts.push('|---|---|---|');
    hist.timeline.forEach(t => parts.push(fmtTimeline(t)));
  }

  if ((sgt.notable || []).length) {
    parts.push('\n---\n## Notable Sightings\n');
    sgt.notable.forEach(s => { parts.push(fmtSighting(s)); parts.push('\n---\n'); });
  }

  const evGroups = [['Physical', ev.physical], ['Photographic', ev.photographic], ['Video', ev.video], ['Audio', ev.audio], ['Trace', ev.trace], ['Documentary', ev.documentary]];
  const hasEvidence = evGroups.some(([_, items]) => (items || []).length);
  if (hasEvidence) {
    parts.push('\n## Evidence\n');
    evGroups.forEach(([name, items]) => {
      if (!items || !items.length) return;
      parts.push(`### ${name}\n`);
      parts.push('| Name | Date | Description | Status |');
      parts.push('|---|---|---|---|');
      items.forEach(it => parts.push(`| ${it.name || ''} | ${it.date || ''} | ${it.description || ''} | ${it.status || ''} |`));
    });
  }

  const theoryParts = [fmtTheoryGroup('Paranormal / Cryptozoological', th.paranormal), fmtTheoryGroup('Scientific', th.scientific), fmtTheoryGroup('Skeptical', th.skeptical)].filter(Boolean);
  if (theoryParts.length) {
    parts.push('\n---\n## Theories & Explanations\n');
    parts.push(theoryParts.join('\n'));
  }

  if (cult.indigenous && (cult.indigenous.cultures || []).length) {
    parts.push('\n## Indigenous Perspectives\n');
    if (cult.indigenous.sensitivity_note) parts.push(`> ⚠️ **${cult.indigenous.sensitivity_note}**\n`);
    parts.push(`**Cultures**: ${cult.indigenous.cultures.join(', ')}`);
    if (cult.indigenous.significance) parts.push(`\n${cult.indigenous.significance}`);
    if (cult.indigenous.respect_guidelines) parts.push(`\n_Guidelines: ${cult.indigenous.respect_guidelines}_`);
  }

  if (cult.popular_culture) {
    const pc = cult.popular_culture;
    if ((pc.literature || []).length || (pc.film_tv || []).length || (pc.games || []).length || (pc.music || []).length || (pc.other || []).length) {
      parts.push('\n## Popular Culture\n');
      if ((pc.literature || []).length) parts.push('**Literature**: ' + pc.literature.join('; '));
      if ((pc.film_tv || []).length) parts.push('\n**Film / TV**: ' + pc.film_tv.join('; '));
      if ((pc.games || []).length) parts.push('\n**Games**: ' + pc.games.join('; '));
      if ((pc.music || []).length) parts.push('\n**Music**: ' + pc.music.join('; '));
      if ((pc.other || []).length) parts.push('\n**Other**: ' + pc.other.join('; '));
    }
  }

  if ((research.researchers || []).length || (research.organizations || []).length) {
    parts.push('\n---\n## Research\n');
    if ((research.researchers || []).length) {
      parts.push('### Researchers\n');
      parts.push('| Name | Affiliation | Contribution | Period |');
      parts.push('|---|---|---|---|');
      research.researchers.forEach(r => parts.push(`| ${r.name} | ${r.affiliation || ''} | ${r.contribution || ''} | ${r.period || ''} |`));
    }
    if ((research.organizations || []).length) {
      parts.push('\n### Organizations\n');
      research.organizations.forEach(o => parts.push(`- [${o.name}](${o.url || '#'}) — ${o.focus || ''}`));
    }
    if (research.ongoing_studies) parts.push(`\n${research.ongoing_studies}`);
  }

  parts.push('\n---\n## Sources\n\nSee [SOURCES.md](SOURCES.md) for the complete bibliography.\n');
  parts.push('\n## How to Report a Sighting\n');
  parts.push('1. **GitHub Issue**: [Submit Sighting Report](../../issues/new?template=sighting_report.yml)');
  parts.push('2. Provide date, location, witnesses, description, conditions, and any evidence.');
  parts.push('\n---\n## License\n');
  parts.push('Content: [CC BY 4.0](https://creativecommons.org/licenses/by/4.0/)  ');
  parts.push('Data: [CC0 1.0](https://creativecommons.org/publicdomain/zero/1.0/)  ');
  parts.push('\n---\n_Auto-generated from `api.json`. Do not edit by hand — edit `api.json` and run `make repo-docs`._');
  return parts.join('\n');
}

function buildSources(d) {
  const sources = d.sources || [];
  const groups = { book: [], paper: [], article: [], news: [], website: [], documentary: [], interview: [], archive: [], other: [] };
  for (const s of sources) {
    (groups[s.type] || groups.other).push(s);
  }
  const lines = [`# Sources & References — ${(d.phenomenon || {}).name || (d.phenomenon || {}).id || ''}`, '',
    'Bibliography compiled from `api.json`. To add a source, edit `api.json` and regenerate.', ''];

  const order = [['Books', 'book'], ['Academic Papers', 'paper'], ['Articles', 'article'], ['News', 'news'], ['Documentaries', 'documentary'], ['Interviews', 'interview'], ['Archives & Records', 'archive'], ['Websites', 'website'], ['Other', 'other']];
  for (const [label, key] of order) {
    if (!(groups[key] || []).length) continue;
    lines.push(`## ${label}\n`);
    groups[key].forEach(s => lines.push(fmtSource(s)));
    lines.push('');
  }
  if (sources.length === 0) {
    lines.push('_To be added._');
  }
  lines.push('---\n_Auto-generated from `api.json`._');
  return lines.join('\n');
}

function isSkeleton(d) {
  const sources = (d.sources || []).length;
  const notable = (d.sightings && d.sightings.notable || []).length;
  return sources === 0 && notable === 0;
}

function listRepos() {
  return fs.readdirSync(PARENT_DIR, { withFileTypes: true })
    .filter(e => e.isDirectory() && !e.name.startsWith('.') && !EXCLUDE.has(e.name))
    .map(e => e.name)
    .filter(name => fs.existsSync(path.join(PARENT_DIR, name, 'api.json')))
    .sort();
}

function main() {
  const repos = ONLY ? listRepos().filter(r => ONLY.includes(r)) : listRepos();
  let written = 0, skipped = 0, errors = 0;
  for (const name of repos) {
    const dir = path.join(PARENT_DIR, name);
    try {
      const d = JSON.parse(fs.readFileSync(path.join(dir, 'api.json'), 'utf8'));
      if (!FORCE && isSkeleton(d)) { skipped++; continue; }
      fs.writeFileSync(path.join(dir, 'README.md'), buildReadme(d) + '\n');
      fs.writeFileSync(path.join(dir, 'SOURCES.md'), buildSources(d) + '\n');
      written++;
    } catch (err) {
      errors++;
      console.error(`[${name}] error: ${err.message}`);
    }
  }
  console.log(`Repos:    ${repos.length}`);
  console.log(`Written:  ${written}`);
  console.log(`Skipped:  ${skipped} (skeleton; pass --force to regenerate)`);
  console.log(`Errors:   ${errors}`);
}

main();
