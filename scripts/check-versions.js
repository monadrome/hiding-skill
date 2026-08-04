#!/usr/bin/env node
const fs = require('fs');
const path = require('path');
const yaml = require('js-yaml');

const root = path.join(__dirname, '..');
const semver = /^\d+\.\d+\.\d+$/;
const versions = [];
let failed = false;

function fail(message) {
  console.error(message);
  failed = true;
}

for (const relativePath of ['package.json', '.claude-plugin/plugin.json']) {
  try {
    const value = JSON.parse(fs.readFileSync(path.join(root, relativePath), 'utf8')).version;
    if (typeof value !== 'string' || !semver.test(value)) {
      fail(`${relativePath}: version must be pinned X.Y.Z semver, got ${JSON.stringify(value)}`);
    }
    versions.push([relativePath, value]);
  } catch (error) {
    fail(`${relativePath}: ${error.message}`);
  }
}

try {
  const relativePath = 'skills/hide/SKILL.md';
  const content = fs.readFileSync(path.join(root, relativePath), 'utf8');
  const frontmatterEnd = content.indexOf('\n---', 3);
  if (!content.startsWith('---\n') || frontmatterEnd < 0) throw new Error('invalid frontmatter delimiters');
  const frontmatter = yaml.load(content.slice(3, frontmatterEnd));
  const value = frontmatter?.metadata?.version;
  if (typeof value !== 'string') {
    fail(`${relativePath}: metadata.version is missing`);
  } else {
    if (!semver.test(value)) fail(`${relativePath}: version must be pinned X.Y.Z semver`);
    versions.push([relativePath, value]);
  }
} catch (error) {
  fail(`skills/hide/SKILL.md: ${error.message}`);
}

const distinct = [...new Set(versions.map(([, version]) => version))];
if (distinct.length !== 1) {
  fail(`Version mismatch: ${versions.map(([file, version]) => `${file}=${version}`).join(', ')}`);
}
const shared = distinct.length === 1 ? distinct[0] : null;

if (shared && process.env.GITHUB_REF_TYPE === 'tag') {
  const tag = process.env.GITHUB_REF_NAME || '';
  const expected = `v${shared}`;
  if (tag !== expected) fail(`Release tag ${JSON.stringify(tag)} must exactly match ${expected}`);
}

if (failed) process.exit(1);
console.log(`All ${versions.length} version files pinned at ${shared}.`);
