#!/usr/bin/env node

const fs = require('fs');
const path = require('path');

// Required files per template
const REQUIRED_FILES = ['README.md', 'api.json', 'LICENSE', 'CHANGELOG.md'];
const OPTIONAL_FILES = ['SOURCES.md', '.github', 'package.json'];
const REQUIRED_DIRS = ['sightings', 'media'];

// Get all directories except .github and wyrdness.github.io
const dirs = fs.readdirSync('.', { withFileTypes: true })
  .filter(dirent => dirent.isDirectory())
  .map(dirent => dirent.name)
  .filter(name => name !== '.github' && name !== 'wyrdness.github.io' && name !== '.git' && name !== 'node_modules');

console.log(`Verifying ${dirs.length} repositories...\n`);

const issues = {
  missingRequired: [],
  missingDirs: [],
  wrongLicense: [],
  noSources: []
};

let compliant = 0;
let warnings = 0;

for (const dir of dirs) {
  const problems = [];
  
  // Check required files
  for (const file of REQUIRED_FILES) {
    const filePath = path.join(dir, file);
    // Check for LICENSE or LICENSE.md
    if (file === 'LICENSE') {
      if (!fs.existsSync(filePath) && !fs.existsSync(path.join(dir, 'LICENSE.md'))) {
        problems.push(`Missing: ${file} (or LICENSE.md)`);
        issues.missingRequired.push(`${dir}: ${file}`);
      }
    } else if (!fs.existsSync(filePath)) {
      problems.push(`Missing: ${file}`);
      issues.missingRequired.push(`${dir}: ${file}`);
    }
  }
  
  // Check required directories
  for (const dirName of REQUIRED_DIRS) {
    const dirPath = path.join(dir, dirName);
    if (!fs.existsSync(dirPath)) {
      problems.push(`Missing directory: ${dirName}`);
      issues.missingDirs.push(`${dir}: ${dirName}`);
    }
  }
  
  // Check if SOURCES.md exists (recommended but not required)
  if (!fs.existsSync(path.join(dir, 'SOURCES.md'))) {
    issues.noSources.push(dir);
  }
  
  if (problems.length === 0) {
    compliant++;
  } else {
    console.log(`❌ ${dir}:`);
    problems.forEach(p => console.log(`   - ${p}`));
    warnings++;
  }
}

console.log(`\n${'='.repeat(60)}`);
console.log(`SUMMARY`);
console.log(`${'='.repeat(60)}`);
console.log(`Total repositories: ${dirs.length}`);
console.log(`✅ Fully compliant: ${compliant}`);
console.log(`⚠️  With issues: ${warnings}`);
console.log();
console.log(`Missing required files: ${issues.missingRequired.length}`);
console.log(`Missing required directories: ${issues.missingDirs.length}`);
console.log(`Missing SOURCES.md (optional): ${issues.noSources.length}`);

// Save detailed report
const report = {
  timestamp: new Date().toISOString(),
  total: dirs.length,
  compliant: compliant,
  withIssues: warnings,
  issues: issues
};

fs.writeFileSync('verification-report.json', JSON.stringify(report, null, 2));
console.log('\nDetailed report saved to: verification-report.json');
