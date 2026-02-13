# AI.md - Wyrdness Project Guide for AI Assistants

**Location**: `.github/AI.md`  
**Version**: 1.0.1  
**Last Updated**: 2026-02-13  
**Purpose**: Complete reference for AI agents working with the Wyrdness paranormal phenomena archive

> **⚠️ READ THIS FIRST**: AI agents should read this entire file before performing any work on the Wyrdness project. It contains all necessary context, standards, and workflows.

---

## 🎯 Project Overview

**Wyrdness** is a comprehensive, structured archive of paranormal phenomena, cryptids, folklore, and unexplained mysteries from around the world. Each phenomenon is documented in its own repository with standardized data structures for both human and machine consumption.

### Core Principles
1. **Data Accuracy**: Every claim must be sourced and cited
2. **Neutral Tone**: Present facts without bias toward belief or skepticism  
3. **Structured Data**: Both README.md (human) and api.json (machine) formats
4. **Open Access**: CC0-1.0 for data, CC-BY-4.0 for content
5. **Respect**: Honor cultural origins and Indigenous knowledge systems

---

## 📁 Repository Structure

### Root Directory Layout

```
wyrdness/
├── .github/                    # GitHub configuration and templates
│   ├── AI.md                  # 👈 THIS FILE - Read this first!
│   ├── VERIFICATION_SUMMARY.md # Repository compliance summary
│   ├── templates/             
│   │   ├── api.example.json   # Template for api.json files
│   │   ├── README.template.md # Template for README files
│   │   └── repo/              # Full repository template
│   ├── schemas/               # JSON schemas for validation
│   ├── CONTRIBUTING.md        # Contribution guidelines
│   ├── CODE_OF_CONDUCT.md     # Community standards
│   ├── REPO_TEMPLATE.md       # Repository structure spec
│   └── README.md              # Project overview
│
├── {phenomenon-name}/         # Individual phenomenon repositories (517 total)
│   ├── README.md              # Human-readable documentation
│   ├── api.json               # Machine-readable structured data
│   ├── LICENSE or LICENSE.md  # Repository license
│   ├── CHANGELOG.md           # Version history
│   ├── SOURCES.md             # Bibliography (optional but recommended)
│   ├── sightings/             # Documented encounters
│   │   ├── YYYY/              # Organized by year
│   │   └── historical/        # Pre-1900 sightings
│   └── media/                 # Supporting evidence
│       ├── images/
│       ├── audio/
│       └── documents/
│
├── generate-api-json.js       # Script to create api.json from README
├── verify-repos.js            # Repository compliance checker
├── verification-report.json   # Latest compliance report
└── wyrdness.github.io/        # Public website
```

---

## 📄 Required Files (Per Phenomenon Repository)

### 1. README.md
**Purpose**: Human-readable documentation of the phenomenon

**Required Sections**:
- Title (# Phenomenon Name)
- Overview section with description
- Category metadata (**Category**: VALUE)
- Cultural origin (**Cultural Origin**: VALUE)
- Physical description
- History and origins
- Notable sightings
- Evidence
- Sources/bibliography

**Format Notes**:
- Use Markdown formatting
- Include metadata in bold: `**Category**: CRYPTID`
- First substantial paragraph becomes summary in api.json
- Must stay in sync with api.json content

### 2. api.json
**Purpose**: Machine-readable structured data

**Required Structure**:
```json
{
  "meta": {
    "version": "1.0.0",
    "schema_version": "1.0.0",
    "last_updated": "YYYY-MM-DD",
    "repository": "https://github.com/wyrdness/{phenomenon}",
    "maintainers": [...],
    "license": {
      "data": "CC0-1.0",
      "content": "CC-BY-4.0"
    }
  },
  "phenomenon": {
    "id": "phenomenon-name",
    "name": "Display Name",
    "aliases": [...],
    "category": "CATEGORY_NAME",
    "subcategory": "Type",
    "tags": [...],
    "status": "documented|active|historical",
    "description": {
      "summary": "One sentence summary",
      "full": "Complete description"
    },
    "etymology": {...}
  },
  "classification": {...},
  "characteristics": {...},
  "distribution": {...},
  "history": {...},
  "sightings": {...},
  "evidence": {...},
  "theories": {...},
  "cultural": {...},
  "research": {...},
  "sources": [...]
}
```

**See**: `templates/api.example.json` in this directory for complete example

### 3. LICENSE or LICENSE.md
Standard open license file

### 4. CHANGELOG.md
Version history and changes

### 5. SOURCES.md (Recommended)
Full bibliography with proper citations

---

## 🏷️ Category System

### Valid Categories

**Primary Categories**:
- `CRYPTID` - Undiscovered animals/creatures (85 repos)
- `ENTITY_SPIRIT` - Supernatural beings, spirits, demons (78 repos)
- `MYTHOLOGICAL_CREATURE` - Traditional mythology creatures (52 repos)
- `GHOST_HAUNTING` - Ghosts, hauntings, apparitions
- `UNDEAD` - Vampires, revenants, zombies
- `DEMON_ANGEL` - Demons, fallen angels, celestial beings
- `FAE_FOLKLORE` - Fairies, fae folk, nature spirits
- `SHAPESHIFTER` - Beings that change form
- `UFO_UAP` - Unidentified flying objects
- `URBAN_LEGEND` - Modern folklore, creepypasta
- `CONSPIRACY_THEORY` - Conspiracy theories
- `ANOMALY` - Reality glitches, time slips
- `PSYCHIC_PHENOMENA` - ESP, telepathy, precognition
- `ATMOSPHERIC_PHENOMENON` - Unexplained lights, sounds
- `LOCATION` - Haunted or mysterious places
- `HAUNTED_LOCATION` - Specific haunted sites
- `ARCHAEOLOGICAL_MYSTERY` - Ancient unexplained sites
- `HISTORICAL_MYSTERY` - Unsolved historical events

**Category Guidelines**:
- Use UPPERCASE with underscores
- Primary category only (no slashes or commas)
- If multiple categories apply, choose the primary one
- Document in README as: `**Category:** CRYPTID`

---

## 🔧 Common Tasks

### Creating a New Phenomenon Repository

1. **Create directory**: `{phenomenon-name}/` (lowercase, hyphens)
2. **Create README.md**: Use `.github/templates/README.template.md` as template
3. **Generate api.json**: Run `node generate-api-json.js` (from root) OR create manually
4. **Add LICENSE**: Copy from `.github/templates/` or existing repo
5. **Create CHANGELOG.md**: Start with version 1.0.0
6. **Create directories**: `sightings/` and `media/`
7. **Add SOURCES.md**: Bibliography (recommended)
8. **Verify**: Run `node verify-repos.js` (from root)

### Updating api.json

**Manual Method**:
1. Edit api.json directly
2. Update corresponding sections in README.md
3. Bump version number
4. Update last_updated date

**Automated Method**:
1. Update README.md with new content
2. Run `node generate-api-json.js` to regenerate
3. Review and adjust generated content
4. Update version and date

**Critical**: README.md and api.json must stay in sync!

### Fixing Missing Files

If `verify-repos.js` reports issues:

**Missing CHANGELOG.md**:
```bash
for dir in {list}; do
  echo "# Changelog\n\n## [1.0.0] - $(date +%Y-%m-%d)\n- Initial documentation" > "$dir/CHANGELOG.md"
done
```

**Missing directories**:
```bash
for dir in {list}; do
  mkdir -p "$dir/sightings" "$dir/media"
done
```

**Missing LICENSE**:
```bash
cp .github/templates/LICENSE "$dir/"
```

### Fixing UNKNOWN Categories

1. **Check README.md** for `**Category:**` field
2. **If not found**, check `## Category` header
3. **If still not found**, infer from:
   - Phenomenon name and type
   - Cultural context
   - Related phenomena
4. **Update both** api.json and README.md
5. **Valid format**: `**Category:** CRYPTID`

Script example:
```javascript
const api = JSON.parse(fs.readFileSync('phenomenon/api.json'));
api.phenomenon.category = 'CRYPTID';
api.classification.taxonomy.category = 'CRYPTID';
fs.writeFileSync('phenomenon/api.json', JSON.stringify(api, null, 2) + '\n');
```

---

## 📋 Naming Conventions

| Item | Convention | Example |
|------|------------|---------|
| Repository name | lowercase-with-hyphens | `loch-ness-monster` |
| Phenomenon ID | same as repo name | `loch-ness-monster` |
| Display name | Proper Capitalization | `Loch Ness Monster` |
| Sighting files | `YYYY-MM-DD-location.json` | `1967-10-20-bluff-creek.json` |
| Media files | `YYYY-description.ext` | `1967-patterson-gimlin.jpg` |
| Evidence IDs | `{id}-{type}-{number}` | `bigfoot-evidence-001` |

---

## 🎨 Documentation Style Guide

### Tone and Voice
- **Neutral and factual**: Present information without editorializing
- **Respectful**: Honor cultural traditions and beliefs
- **Academic but accessible**: Clear language, proper citations
- **Balanced**: Present both supporting evidence and skeptical views

### Writing Guidelines
- Use present tense for ongoing phenomena
- Use past tense for historical accounts
- Cite every claim with sources
- Distinguish between:
  - Verified facts
  - Reported claims
  - Speculation/theories
  - Cultural beliefs

### Formatting
- Use `**bold**` for metadata labels
- Use `*italic*` for emphasis
- Use `> blockquotes` for witness testimony
- Use `---` for section dividers
- Use tables for structured comparisons

---

## 🔍 Validation and Quality Checks

### Automated Checks

**Run verification**:
```bash
node verify-repos.js
```

**Check JSON validity**:
```bash
for file in */api.json; do 
  jq empty "$file" 2>/dev/null || echo "Invalid: $file"
done
```

**Check category distribution**:
```bash
jq -r '.phenomenon.category' */api.json | sort | uniq -c | sort -rn
```

**Find UNKNOWN categories**:
```bash
jq -r 'select(.phenomenon.category == "UNKNOWN") | .phenomenon.id' */api.json
```

### Manual Quality Checks

✅ **README.md checklist**:
- [ ] Title matches phenomenon name
- [ ] Has Overview section
- [ ] Category metadata present
- [ ] Cultural origin specified
- [ ] Proper citations in sources
- [ ] No broken links
- [ ] Respectful of cultural context

✅ **api.json checklist**:
- [ ] Valid JSON (no syntax errors)
- [ ] All required fields present
- [ ] Summary is one sentence
- [ ] Category is valid (not UNKNOWN)
- [ ] Dates in ISO format (YYYY-MM-DD)
- [ ] Repository URL correct
- [ ] Version numbers match README

---

## 🚨 Common Issues and Solutions

### Issue: Empty or Stub README
**Symptoms**: README only has 8 lines, just title and author
**Solution**: Research the phenomenon and create proper documentation

### Issue: UNKNOWN Category
**Symptoms**: `api.json` shows `"category": "UNKNOWN"`
**Solution**: 
1. Check README for category field
2. Infer from phenomenon type
3. Update both README and api.json

### Issue: Invalid JSON
**Symptoms**: Parse errors when reading api.json
**Solution**:
- Check for unescaped quotes in descriptions
- Escape newlines and control characters
- Use proper JSON string escaping

### Issue: Missing Directories
**Symptoms**: No sightings/ or media/ folder
**Solution**: `mkdir -p phenomenon/{sightings,media}`

### Issue: README/api.json Sync
**Symptoms**: Information differs between files
**Solution**: 
1. Determine which is correct
2. Update the other to match
3. Bump version numbers
4. Document in CHANGELOG.md

---

## 🤖 Scripts Reference

### generate-api-json.js
**Purpose**: Create api.json files from README.md content

**Usage**:
```bash
node generate-api-json.js
```

**What it does**:
- Scans all directories for README.md
- Extracts metadata (category, origin, description)
- Generates api.json with proper structure
- Preserves existing api.json if present

**When to use**:
- Creating new repositories
- Bulk updates after README changes
- Fixing missing api.json files

### verify-repos.js
**Purpose**: Check repository compliance with template

**Usage**:
```bash
node verify-repos.js
```

**Output**:
- Lists non-compliant repositories
- Reports missing files/directories
- Generates verification-report.json

**When to use**:
- After bulk changes
- Before committing
- Regular quality audits

---

## 📚 Reference Files

### Key Files in .github/

- **AI.md** (this file) - Complete guide for AI agents
- **VERIFICATION_SUMMARY.md** - Current compliance status
- **templates/api.example.json** - Complete api.json example
- **templates/README.template.md** - README structure
- **templates/repo/** - Full repo template
- **REPO_TEMPLATE.md** - Repository structure specification
- **CONTRIBUTING.md** - Contribution guidelines
- **CODE_OF_CONDUCT.md** - Community standards
- **schemas/** - JSON validation schemas (if present)

---

## 🌍 Cultural Sensitivity Guidelines

### Indigenous Knowledge
- Consult tribal authorities before documenting Indigenous phenomena
- Do not appropriate or misrepresent beliefs
- Credit specific nations/tribes, not just "Native American"
- Include sensitivity notes where appropriate
- Link to community resources when available

### Sacred Sites
- Respect restrictions on photography/access
- Note spiritual significance
- Include proper names in native languages
- Acknowledge ongoing cultural importance

### International Phenomena
- Use proper romanization for non-Latin scripts
- Include original language names
- Respect local naming conventions
- Note regional variations
- Acknowledge folklore vs. modern interpretations

---

## 📊 Current Statistics

**Total Repositories**: 517  
**Fully Compliant**: 503 (97.3%)  
**With Issues**: 14 (2.7%)  

**Category Distribution** (Top 10):
1. CRYPTID - 85
2. ENTITY_SPIRIT - 78
3. MYTHOLOGICAL_CREATURE - 52
4. FAE_FOLKLORE - 17
5. UNDEAD - 16
6. GHOST_HAUNTING - 13
7. DEMON_ANGEL - 11
8. ATMOSPHERIC_PHENOMENON - 11
9. URBAN_LEGEND - 10
10. SHAPESHIFTER - 9

**Common Issues**:
- Missing CHANGELOG.md: 16 repos
- Missing sightings/ or media/: 12 repos  
- Missing SOURCES.md (optional): 129 repos

---

## 🔄 Workflow for AI Agents

### When Asked to Create New Phenomenon

1. **Research**: Verify phenomenon exists and gather sources
2. **Check duplicates**: Search existing repos for similar entries
3. **Create structure**:
   ```bash
   mkdir {phenomenon-name}
   mkdir {phenomenon-name}/{sightings,media}
   ```
4. **Write README.md**: Follow template, include all required sections
5. **Generate api.json**: Run script or create manually
6. **Add supporting files**: LICENSE, CHANGELOG.md, SOURCES.md
7. **Verify**: Run `node verify-repos.js`
8. **Review**: Check category, sources, cultural sensitivity

### When Asked to Update Existing Phenomenon

1. **Read current files**: View README.md and api.json
2. **Make changes**: Update both files to stay in sync
3. **Update metadata**: Bump version, update last_updated date
4. **Document changes**: Add entry to CHANGELOG.md
5. **Verify**: Check JSON validity and structure compliance

### When Asked to Fix Issues

1. **Run verification**: `node verify-repos.js`
2. **Identify problems**: Review verification-report.json
3. **Fix systematically**: Address missing files, categories, etc.
4. **Re-verify**: Run verification again
5. **Report results**: Summary of changes made

### When Asked About the Project

1. **Read this file (AI.md)** for comprehensive understanding
2. **Check specific templates** for detailed examples
3. **Review existing repos** (e.g., bigfoot, peri) for best practices
4. **Verify current stats** with verification script

---

## ⚡ Quick Command Reference

```bash
# Verify all repos
node verify-repos.js

# Generate missing api.json files
node generate-api-json.js

# Check for UNKNOWN categories
jq -r 'select(.phenomenon.category == "UNKNOWN") | .phenomenon.id' */api.json

# Count repos by category
jq -r '.phenomenon.category' */api.json | sort | uniq -c | sort -rn

# Find repos missing files
for dir in */; do [ ! -f "$dir/api.json" ] && echo $dir; done

# Create missing directories
for dir in */; do mkdir -p "$dir"/{sightings,media}; done

# Validate all JSON files
for file in */api.json; do jq empty "$file" || echo "Invalid: $file"; done

# Check README sizes (find stubs)
for dir in */; do wc -l "$dir/README.md" 2>/dev/null; done | sort -n
```

---

## 📝 Version History

- **1.0.1** (2026-02-13): Moved to `.github/AI.md`
  - Updated all internal references
  - Added Quick Start section
  - Clarified file locations relative to .github/
  
- **1.0.0** (2026-02-13): Initial AI.md creation
  - Complete project structure documentation
  - Category system definition
  - Workflow guidelines
  - Common issues and solutions

---

## 🆘 Getting Help

**For AI Agents**:
1. **READ THIS FILE FIRST** (`.github/AI.md`) - You're reading it now!
2. Check `REPO_TEMPLATE.md` (in this directory) for structure details
3. Review `CONTRIBUTING.md` (in this directory) for contribution guidelines
4. Check `VERIFICATION_SUMMARY.md` (in this directory) for current status
5. Examine example repos: `bigfoot/`, `peri/`, `phoenix/`
6. Run `verify-repos.js` (from project root) to understand current state

**For Humans**:
- See `README.md` in this directory for project overview
- See `CONTRIBUTING.md` in this directory for contribution process
- Open issues on GitHub for questions

---

## 📌 Quick Start for AI Agents

**First Time Working on Wyrdness?**

1. ✅ Read this entire AI.md file (you're doing it!)
2. ✅ Run `cd /path/to/wyrdness && node verify-repos.js` to see current state
3. ✅ Review 2-3 example repos: `bigfoot/`, `mothman/`, `phoenix/`
4. ✅ Check `VERIFICATION_SUMMARY.md` for known issues
5. ✅ Now you're ready to work!

**Common Commands** (run from project root):
```bash
# Check compliance
node verify-repos.js

# Generate missing api.json files
node generate-api-json.js

# Find UNKNOWN categories
jq -r 'select(.phenomenon.category == "UNKNOWN") | .phenomenon.id' */api.json

# Count by category
jq -r '.phenomenon.category' */api.json | sort | uniq -c | sort -rn
```

---

**End of AI.md**  
*This file should be read by AI agents before performing any work on the Wyrdness project.*  
*Location: `.github/AI.md` - Committed with project configuration*
