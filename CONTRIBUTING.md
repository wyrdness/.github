# Contributing to Wyrdness

Thank you for your interest in contributing to the Paranormal Archive! Whether you're a seasoned researcher, a curious skeptic, or someone with a story to tell, we welcome your contributions.

## Table of Contents

- [Code of Conduct](#code-of-conduct)
- [Ways to Contribute](#ways-to-contribute)
- [Submitting Encounter Reports](#submitting-encounter-reports)
- [Contributing Code](#contributing-code)
- [Data Standards](#data-standards)
- [Documentation](#documentation)
- [Community Guidelines](#community-guidelines)

---

## Code of Conduct

By participating in this project, you agree to abide by our [Code of Conduct](CODE_OF_CONDUCT.md). We are committed to maintaining a respectful, inclusive community.

---

## Ways to Contribute

### 1. Submit Encounter Reports

Share documented paranormal experiences with proper evidence and context.

### 2. Improve Data Quality

- Verify existing entries against primary sources
- Add missing details to incomplete records
- Flag questionable or debunked entries
- Cross-reference with other databases

### 3. Contribute Code

- Build tools for data analysis and visualization
- Improve our APIs and integrations
- Fix bugs and enhance existing features
- Create documentation and tutorials

### 4. Research & Analysis

- Analyze patterns across phenomena types
- Write research summaries and reports
- Investigate correlations and anomalies
- Fact-check and source verification

### 5. Translation & Localization

- Translate documentation and interfaces
- Localize encounter reports from non-English sources
- Help make paranormal research accessible globally

---

## Submitting Encounter Reports

### Required Information

All encounter submissions must include:

| Field | Description | Required |
|-------|-------------|----------|
| `date` | When did this occur? (as precise as possible) | Yes |
| `location` | Where did this occur? (coordinates preferred) | Yes |
| `phenomenon_type` | Category of encounter (see taxonomy below) | Yes |
| `description` | Detailed account of what happened | Yes |
| `witnesses` | Number of witnesses (anonymized) | Yes |
| `source` | How was this documented? | Yes |
| `evidence` | Any supporting materials | No |
| `credibility_notes` | Factors affecting reliability | No |

### Phenomenon Taxonomy

Use these categories when classifying encounters:

```
CRYPTIDS
├── Humanoid (Bigfoot, Yeti, etc.)
├── Aquatic (Loch Ness, lake monsters)
├── Aerial (Thunderbirds, Mothman)
├── Canine/Feline (werewolves, phantom cats)
└── Other

UFOS_UAPS
├── CE1 (Close Encounter - Visual)
├── CE2 (Physical Effects)
├── CE3 (Entity Contact)
├── CE4 (Abduction)
├── CE5 (Human-Initiated)
├── Daylight Disc
├── Nocturnal Light
└── Radar/Visual

HAUNTINGS
├── Residual
├── Intelligent
├── Poltergeist
├── Shadow Entity
├── Demonic/Inhuman
└── Crisis Apparition

ENTITIES
├── Ghosts/Spirits
├── Jinn/Djinn
├── Demons/Angels
├── Fairies/Fae
├── Shadow People
└── Other

ANOMALIES
├── Time Slip
├── Doppelganger
├── Reality Glitch
├── Mysterious Disappearance
└── Other

PSYCHIC_PHENOMENA
├── ESP/Telepathy
├── Precognition
├── Telekinesis
├── Near-Death Experience
└── Other
```

### Evidence Standards

We accept various forms of supporting evidence:

| Type | Guidelines |
|------|------------|
| **Photographs** | Include metadata, context, and original files when possible |
| **Video** | Unedited footage preferred; note any enhancements |
| **Audio** | Include transcription and recording conditions |
| **Documents** | Historical records, news clippings, official reports |
| **Witness Statements** | Written accounts with consent for publication |
| **Physical Evidence** | Photographs/descriptions; note chain of custody |

### What NOT to Submit

- Obvious hoaxes or fabrications
- Copyrighted material without permission
- Personal information without consent
- Unverified third-hand accounts
- Content that violates our Code of Conduct

---

## Contributing Code

### Getting Started

1. **Fork** the repository you want to contribute to
2. **Clone** your fork locally
3. **Create a branch** for your changes:
   ```bash
   git checkout -b feature/your-feature-name
   ```
4. **Make your changes** following our coding standards
5. **Test** your changes thoroughly
6. **Commit** with clear, descriptive messages
7. **Push** to your fork
8. **Open a Pull Request**

### Commit Message Format

```
type(scope): brief description

Longer explanation if needed.

Refs: #issue-number
```

**Types:**
- `feat`: New feature
- `fix`: Bug fix
- `docs`: Documentation changes
- `data`: Data additions or corrections
- `refactor`: Code refactoring
- `test`: Adding or updating tests
- `chore`: Maintenance tasks

### Pull Request Guidelines

- Provide a clear description of changes
- Reference any related issues
- Include screenshots for UI changes
- Ensure all tests pass
- Keep PRs focused and reasonably sized
- Be responsive to feedback

---

## Data Standards

### File Formats

| Format | Use Case |
|--------|----------|
| `README.md` | Human-readable documentation |
| `api.json` | Machine-readable data (must sync with README) |
| `SOURCES.md` | Bibliography and references |

### JSON Schema

All `api.json` files must conform to our schema. Key fields:

```json
{
  "phenomenon": {
    "id": "unique-identifier",
    "name": "Common Name",
    "aliases": ["Other Name", "Alternative Name"],
    "category": "CATEGORY_TYPE",
    "description": "Detailed description...",
    "origin": {
      "culture": "Cultural origin",
      "region": "Geographic region",
      "period": "Historical period"
    },
    "characteristics": [],
    "sightings": [],
    "evidence": [],
    "sources": []
  }
}
```

### Source Citation

Always cite your sources. Use this format:

```markdown
- **Title** by Author (Year). Publisher. [Link if available]
- **News Article Title**. Publication Name, Date. [URL]
- **Personal Communication** with [Name/Anonymous], Date. [Permission status]
```

---

## Documentation

### Writing Style

- Use clear, accessible language
- Maintain a neutral, factual tone
- Distinguish between verified facts and speculation
- Include proper citations
- Use inclusive language

### Structure

Documentation should follow this general structure:

1. **Overview** - Brief introduction
2. **Description** - Detailed information
3. **History** - Timeline and context
4. **Evidence** - Documented cases
5. **Analysis** - Patterns and theories
6. **Sources** - Full citations

---

## Community Guidelines

### Respectful Discourse

- **Be respectful** of all viewpoints
- **Assume good faith** in others' contributions
- **Disagree constructively** with evidence and reasoning
- **Credit others** for their work and ideas

### Skepticism & Belief

We welcome both believers and skeptics. When engaging:

- Present evidence, not ridicule
- Acknowledge uncertainty
- Separate personal belief from documented evidence
- Avoid dismissive language

### Quality Over Quantity

- **Accuracy matters** - Verify before submitting
- **Sources matter** - Cite everything
- **Context matters** - Provide full information
- **Honesty matters** - Acknowledge limitations

---

## Recognition

Contributors are recognized in several ways:

- Listed in repository CONTRIBUTORS files
- Credited in release notes
- Highlighted in community spotlights
- Badge recognition for significant contributions

---

## Questions?

- Open an issue with the `question` label
- Join our community discussions
- Check existing documentation and FAQs

---

*Thank you for helping us explore the unknown responsibly.*

**"The important thing is not to stop questioning."** — Albert Einstein
