#!/usr/bin/env node

/**
 * Script to generate api.json files for directories missing them
 * Based on README.md content and the api.example.json template
 */

const fs = require('fs');
const path = require('path');

// Get list of all directories
const directories = fs.readdirSync('.', { withFileTypes: true })
  .filter(dirent => dirent.isDirectory())
  .map(dirent => dirent.name)
  .filter(name => name !== '.git' && name !== '.github' && name !== 'node_modules' && name !== 'wyrdness.github.io');

// Find directories missing api.json but have README.md
const missing = directories.filter(dir => {
  const hasReadme = fs.existsSync(path.join(dir, 'README.md'));
  const hasApi = fs.existsSync(path.join(dir, 'api.json'));
  return hasReadme && !hasApi;
});

console.log(`Found ${missing.length} directories missing api.json files`);

// Function to escape special characters for JSON
function escapeForJson(str) {
  if (!str) return '';
  return str
    .replace(/\\/g, '\\\\')
    .replace(/"/g, '\\"')
    .replace(/\n/g, ' ')
    .replace(/\r/g, '')
    .replace(/\t/g, ' ')
    .replace(/\f/g, '')
    .replace(/[\u0000-\u001F]/g, '');
}

// Function to parse README and extract information
function parseReadme(readmePath) {
  const content = fs.readFileSync(readmePath, 'utf-8');
  const lines = content.split('\n');
  
  const data = {
    name: '',
    category: 'UNKNOWN',
    subcategory: '',
    origin: '',
    description: '',
    tags: [],
    aliases: []
  };
  
  // Extract title (first # heading)
  for (const line of lines) {
    if (line.startsWith('# ') && !data.name) {
      data.name = line.substring(2).trim();
      break;
    }
  }
  
  // Extract metadata - try multiple formats
  for (let i = 0; i < lines.length; i++) {
    const line = lines[i].trim();
    
    // Handle different category formats
    if (line.match(/\*?\*?Category\*?\*?:?\s/i)) {
      const match = line.match(/\*?\*?Category\*?\*?:?\s+(.+?)(?:\s{2,}|\*\*|$)/i);
      if (match && match[1]) {
        data.category = match[1].trim().replace(/\*/g, '').replace(/\s+/g, '_').toUpperCase();
      }
    }
    
    // Cultural Origin
    if (line.match(/\*?\*?Cultural Origin\*?\*?:?\s/i)) {
      const match = line.match(/\*?\*?Cultural Origin\*?\*?:?\s+(.+?)(?:\s{2,}|\*\*|$)/i);
      if (match && match[1]) {
        data.origin = match[1].trim().replace(/\*/g, '');
      }
    }
    
    // Type
    if (line.match(/\*?\*?Type\*?\*?:?\s/i) && !line.includes('Phenomenon')) {
      const match = line.match(/\*?\*?Type\*?\*?:?\s+(.+?)(?:\s{2,}|\*\*|$)/i);
      if (match && match[1]) {
        data.subcategory = match[1].trim().replace(/\*/g, '');
      }
    }
    
    // Symbolism/Tags
    if (line.match(/\*?\*?Symbolism\*?\*?:?\s/i)) {
      const match = line.match(/\*?\*?Symbolism\*?\*?:?\s+(.+?)(?:\s{2,}|$)/i);
      if (match && match[1]) {
        data.tags = match[1].trim().replace(/\*/g, '').split(',').map(t => t.trim().toLowerCase().replace(/\s+/g, '-'));
      }
    }
    
    // Get description from Overview section
    if (line.match(/^##\s+Overview/i)) {
      let desc = '';
      let foundText = false;
      for (let j = i + 1; j < lines.length && !lines[j].startsWith('##'); j++) {
        const cleanLine = lines[j].trim();
        if (cleanLine && !cleanLine.startsWith('**') && !cleanLine.startsWith('*') && !cleanLine.startsWith('-')) {
          desc += cleanLine + ' ';
          foundText = true;
        } else if (foundText && cleanLine.startsWith('**')) {
          break;
        }
      }
      data.description = desc.trim();
    }
    
    // Alternative: get from Description section
    if (!data.description && line.match(/^##\s+Description/i)) {
      let desc = '';
      for (let j = i + 1; j < Math.min(i + 10, lines.length); j++) {
        const cleanLine = lines[j].trim();
        if (lines[j].startsWith('##')) break;
        if (cleanLine && !cleanLine.startsWith('**') && !cleanLine.startsWith('###') && !cleanLine.startsWith('-')) {
          desc += cleanLine + ' ';
          if (desc.length > 300) break;
        }
      }
      data.description = desc.trim();
    }
  }
  
  // If no description from sections, get the first substantial paragraph
  if (!data.description) {
    let foundTitle = false;
    for (let i = 0; i < lines.length; i++) {
      if (lines[i].startsWith('# ')) {
        foundTitle = true;
        continue;
      }
      if (foundTitle) {
        const cleanLine = lines[i].trim();
        if (cleanLine.length > 100 && !cleanLine.startsWith('#') && !cleanLine.startsWith('**') && !cleanLine.startsWith('*')) {
          data.description = cleanLine;
          break;
        }
      }
    }
  }
  
  // Clean and escape description
  data.description = escapeForJson(data.description);
  data.name = escapeForJson(data.name);
  data.origin = escapeForJson(data.origin);
  data.subcategory = escapeForJson(data.subcategory);
  
  return data;
}

// Function to create api.json based on template
function createApiJson(dirName, readmeData) {
  const id = dirName;
  const repoUrl = `https://github.com/wyrdness/${dirName}`;
  const today = new Date().toISOString().split('T')[0];
  
  // Get first sentence for summary - handle edge cases
  let summary = readmeData.description || "No description available.";
  const sentences = summary.match(/[^.!?]+[.!?]+/g);
  if (sentences && sentences.length > 0) {
    summary = sentences[0].trim();
  } else if (summary.length > 200) {
    summary = summary.substring(0, 200) + '...';
  }
  
  const apiJson = {
    "meta": {
      "version": "1.0.0",
      "schema_version": "1.0.0",
      "last_updated": today,
      "repository": repoUrl,
      "maintainers": [
        {
          "name": "Wyrdness Team",
          "github": "wyrdness",
          "role": "maintainer"
        }
      ],
      "license": {
        "data": "CC0-1.0",
        "content": "CC-BY-4.0"
      }
    },
    "phenomenon": {
      "id": id,
      "name": readmeData.name,
      "aliases": [],
      "category": readmeData.category,
      "subcategory": readmeData.subcategory || "Unknown",
      "tags": readmeData.tags.length > 0 ? readmeData.tags : ["folklore", "mythology"],
      "status": "documented",
      "description": {
        "summary": summary,
        "full": readmeData.description
      },
      "etymology": {
        "origin": readmeData.origin || "Unknown",
        "meaning": "To be documented",
        "first_use": "Unknown"
      }
    },
    "classification": {
      "taxonomy": {
        "category": readmeData.category,
        "type": readmeData.subcategory || "Unknown",
        "subtype": "Unknown",
        "variant": "Unknown"
      },
      "related_phenomena": []
    },
    "characteristics": {
      "physical": {
        "features": [],
        "morphology": "See README.md for detailed physical description"
      },
      "abilities": [],
      "behavior": {
        "activity_period": "unknown",
        "disposition": "unknown",
        "habitat_preference": []
      }
    },
    "distribution": {
      "range": {
        "description": readmeData.origin || "Unknown",
        "continents": [],
        "countries": [],
        "regions": []
      },
      "hotspots": [],
      "temporal": {
        "first_recorded": {
          "date": "Unknown",
          "circa": true,
          "source": "Traditional folklore"
        }
      }
    },
    "history": {
      "origins": {
        "cultural_roots": readmeData.origin || "Unknown",
        "earliest_accounts": "See README.md for historical details",
        "folklore_connections": "Unknown"
      },
      "timeline": []
    },
    "sightings": {
      "statistics": {
        "total_documented": 0,
        "verified": 0,
        "disputed": 0,
        "debunked": 0
      },
      "notable": [],
      "database_path": "./sightings/"
    },
    "evidence": {
      "physical": [],
      "photographic": [],
      "video": [],
      "audio": [],
      "trace": []
    },
    "theories": {
      "paranormal": [],
      "scientific": [],
      "skeptical": []
    },
    "cultural": {
      "folklore": {
        "traditions": [],
        "stories": [],
        "beliefs": "See README.md for cultural context"
      },
      "popular_culture": {
        "literature": [],
        "film_tv": [],
        "games": [],
        "other": []
      }
    },
    "research": {
      "researchers": [],
      "organizations": [],
      "ongoing_studies": "None documented"
    },
    "sources": []
  };
  
  return apiJson;
}

// Process each directory
let created = 0;
let errors = 0;

for (const dir of missing) {
  try {
    const readmePath = path.join(dir, 'README.md');
    const apiPath = path.join(dir, 'api.json');
    
    console.log(`Processing: ${dir}`);
    
    const readmeData = parseReadme(readmePath);
    const apiJson = createApiJson(dir, readmeData);
    
    fs.writeFileSync(apiPath, JSON.stringify(apiJson, null, 2) + '\n');
    console.log(`  ✓ Created ${apiPath}`);
    created++;
    
  } catch (error) {
    console.error(`  ✗ Error processing ${dir}:`, error.message);
    errors++;
  }
}

console.log(`\nComplete: ${created} created, ${errors} errors`);
