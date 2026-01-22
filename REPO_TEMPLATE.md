# Wyrdness Repository Template

This document defines the standard structure for all phenomenon repositories in the Wyrdness organization.

---

## Directory Structure

```
{phenomenon}/
├── .github/
│   ├── ISSUE_TEMPLATE/
│   │   ├── sighting_report.yml       # Submit new sighting
│   │   ├── correction.yml            # Request data correction
│   │   ├── source_addition.yml       # Add new source/reference
│   │   └── config.yml                # Issue template config
│   └── PULL_REQUEST_TEMPLATE.md      # PR template
│
├── sightings/
│   ├── YYYY/                         # Organized by year
│   │   └── YYYY-MM-DD-location.json  # Individual sighting files
│   └── historical/                   # Pre-1900 sightings
│       └── YYYY-location.json
│
├── media/
│   ├── images/                       # Photo evidence (with attribution)
│   ├── audio/                        # Audio recordings (EVP, etc.)
│   └── documents/                    # Scanned historical documents
│
├── README.md                         # Human-readable documentation
├── api.json                          # Machine-readable API data
├── SOURCES.md                        # Full bibliography
├── CHANGELOG.md                      # Data change history
└── LICENSE                           # Repository license
```

---

## File Specifications

### README.md

The README serves as human-readable API documentation. It must contain the same information as `api.json` in readable format.

### api.json

Machine-readable data following the Wyrdness JSON Schema. Must be kept in sync with README.md.

### SOURCES.md

Complete bibliography with full citations for all referenced materials.

### sightings/*.json

Individual sighting reports following the sighting schema. Filenames: `YYYY-MM-DD-location-brief.json`

---

## Sync Requirements

- `README.md` and `api.json` MUST contain equivalent information
- Changes to one MUST be reflected in the other
- Automated validation should check sync status
- Version numbers must match across files

---

## Naming Conventions

| Item | Convention | Example |
|------|------------|---------|
| Repository | lowercase, hyphens | `loch-ness-monster` |
| Sighting files | `YYYY-MM-DD-location.json` | `1967-10-20-bluff-creek.json` |
| Media files | `YYYY-description.ext` | `1967-patterson-gimlin-frame352.jpg` |
| IDs | `{phenomenon}-{type}-{number}` | `bigfoot-sighting-00142` |

