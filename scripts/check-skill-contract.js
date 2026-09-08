#!/usr/bin/env node

const fs = require('fs');
const path = require('path');
const crypto = require('crypto');
const yaml = require('js-yaml');

const root = path.join(__dirname, '..');
const skillDir = path.join(root, 'skills', 'hide');
const skillPath = path.join(skillDir, 'SKILL.md');
const referencesDir = path.join(skillDir, 'references');
const legacySkillDir = path.join(root, 'skills', 'hiding');
const expectedDescriptionSha256 = '343fa0d3a526db0b36d296b57a73683e93089e7918a27bf8222ffa578c901972';

const failures = [];

if (fs.existsSync(legacySkillDir)) {
  failures.push('Legacy skills/hiding directory must not be shipped alongside skills/hide.');
}

function fail(message) {
  failures.push(message);
}

function read(filePath) {
  return fs.readFileSync(filePath, 'utf8').replace(/\r\n/g, '\n');
}

function readRegularFile(filePath) {
  try {
    return fs.statSync(filePath).isFile() ? read(filePath) : '';
  } catch {
    return '';
  }
}

function walkMarkdown(directory) {
  const files = [];
  for (const entry of fs.readdirSync(directory, { withFileTypes: true })) {
    const entryPath = path.join(directory, entry.name);
    if (entry.isDirectory()) files.push(...walkMarkdown(entryPath));
    else if (entry.isFile() && entry.name.endsWith('.md')) files.push(entryPath);
  }
  return files.sort();
}

function frontmatterValue(frontmatter, key) {
  const match = frontmatter.match(new RegExp(`^${key}:\\s*(?:"([^"]*)"|'([^']*)'|(.*))$`, 'm'));
  return match ? (match[1] ?? match[2] ?? match[3]).trim() : null;
}

const skill = read(skillPath);
const frontmatterMatch = skill.match(/^---\n([\s\S]*?)\n---(?:\n|$)/);

if (!frontmatterMatch) {
  fail('SKILL.md frontmatter is missing or malformed.');
} else {
  const frontmatter = frontmatterMatch[1];
  try {
    const parsed = yaml.load(frontmatter);
    if (!parsed || typeof parsed !== 'object') fail('SKILL.md frontmatter must be a YAML mapping.');
    if (typeof parsed?.name !== 'string' || typeof parsed?.description !== 'string') {
      fail('SKILL.md frontmatter must include string name and description fields.');
    }
    if (typeof parsed?.metadata?.version !== 'string') fail('SKILL.md frontmatter metadata.version is missing.');
  } catch (error) {
    fail(`SKILL.md frontmatter is invalid YAML: ${error.message}`);
  }
  if (frontmatterValue(frontmatter, 'name') !== 'hide') {
    fail('SKILL.md name must be hide.');
  }
  const description = frontmatterValue(frontmatter, 'description') || '';
  const descriptionSha256 = crypto.createHash('sha256').update(description).digest('hex');
  if (descriptionSha256 !== expectedDescriptionSha256) {
    fail('SKILL.md description changed.');
  }
  if (frontmatterValue(frontmatter, 'argument-hint') !== null) {
    fail('SKILL.md must not impose an argument-hint grammar.');
  }
  if (!/^metadata:\s*\n(?: {2}[^\n]+\n)* {2}version:\s*["']?[^"'\s]+["']?\s*$/m.test(frontmatter)) {
    fail('SKILL.md metadata.version is missing or malformed.');
  }
}

const skillLines = skill.length === 0 ? 0 : skill.split('\n').length - Number(skill.endsWith('\n'));
if (skillLines > 500) fail(`SKILL.md exceeds the 500-line Agent Skills guideline (${skillLines}).`);

const localLinkPattern = /\[[^\]]+\]\(([^)]+\.md(?:#[^)]+)?)\)/g;
const linkedReferences = new Set();
let match;

while ((match = localLinkPattern.exec(skill)) !== null) {
  const link = match[1].split('#')[0];
  if (/^[a-z]+:\/\//i.test(link)) continue;
  const normalized = path.posix.normalize(link);
  if (!/^references\/[^/]+\.md$/.test(normalized)) {
    fail(`SKILL.md reference must be one level deep under references/: ${link}`);
    continue;
  }
  const resolved = path.resolve(skillDir, normalized);
  if (!resolved.startsWith(`${referencesDir}${path.sep}`) || !fs.existsSync(resolved) || !fs.statSync(resolved).isFile()) {
    fail(`SKILL.md reference is missing or unreadable: ${link}`);
    continue;
  }
  linkedReferences.add(resolved);
}

const referenceFiles = walkMarkdown(referencesDir);
const publicDocumentationFiles = [
  path.join(root, 'AGENTS.md'),
  path.join(root, 'CLAUDE.md'),
  path.join(root, 'README.md'),
  path.join(root, 'README-zh.md'),
  ...walkMarkdown(path.join(root, 'docs')),
];

for (const documentationPath of publicDocumentationFiles) {
  const content = read(documentationPath);
  const base = path.dirname(documentationPath);
  for (const linkMatch of content.matchAll(/\]\((?!https?:|mailto:|#)([^)#]+)(?:#[^)]+)?\)/g)) {
    let target;
    try {
      target = path.resolve(base, decodeURIComponent(linkMatch[1]));
    } catch (error) {
      fail(`${path.relative(root, documentationPath)} has an invalid local link ${linkMatch[1]}: ${error.message}`);
      continue;
    }
    if (target !== root && !target.startsWith(`${root}${path.sep}`)) {
      fail(`${path.relative(root, documentationPath)} links outside the repository: ${linkMatch[1]}`);
    } else if (!fs.existsSync(target)) {
      fail(`${path.relative(root, documentationPath)} links to missing file: ${linkMatch[1]}`);
    }
  }
}

const cjk = /[\u3400-\u4dbf\u4e00-\u9fff]/;
for (const documentationPath of [path.join(root, 'README.md'), ...walkMarkdown(path.join(root, 'docs', 'en'))]) {
  if (cjk.test(read(documentationPath))) {
    fail(`${path.relative(root, documentationPath)} must contain English user documentation only.`);
  }
}

const englishSections = (read(path.join(root, 'README.md')).match(/^## /gm) || []).length;
const chineseSections = (read(path.join(root, 'README-zh.md')).match(/^## /gm) || []).length;
if (englishSections !== chineseSections) {
  fail(`README section counts differ: English=${englishSections}, Chinese=${chineseSections}`);
}

for (const referencePath of referenceFiles) {
  if (!linkedReferences.has(referencePath)) {
    fail(`Reference is not linked directly from SKILL.md: ${path.relative(skillDir, referencePath)}`);
  }
  const content = read(referencePath);
  localLinkPattern.lastIndex = 0;
  while ((match = localLinkPattern.exec(content)) !== null) {
    if (!/^[a-z]+:\/\//i.test(match[1])) {
      fail(`Reference-to-reference Markdown links are not allowed: ${path.relative(skillDir, referencePath)} -> ${match[1]}`);
    }
  }
}

const automaticScope = readRegularFile(path.join(referencesDir, 'automatic-scope.md'));
if (!/whenever the request uses automatic `session` or `worktree` scope, including the default session scope/.test(automaticScope)) {
  fail('Automatic-scope reference must include the default invocation condition.');
}

const agentSupportContracts = [
  ['deliverable and agent support-file split', /\*\*Deliverables\*\*[\s\S]{0,240}\*\*Agent support files\*\*/],
  ['agent instruction files named', /`AGENTS\.md`, `CLAUDE\.md`, `\.cursor\/rules\/\*\*`, `\.github\/copilot-instructions\.md`/],
  ['agent support rule precedes the task goal', /This rule precedes the task-goal rule/],
  ['agent support exclusion survives task edits', /stays excluded even when the current task created or updated it/],
  ['explicit selection overrides the support-file exclusion', /even when it is an agent support file/],
  ['ambiguous collections judged by consumer', /judged by consumer/],
];

for (const [label, pattern] of agentSupportContracts) {
  if (!pattern.test(automaticScope)) fail(`Agent support-file contract is missing: ${label}.`);
}

const reporting = readRegularFile(path.join(referencesDir, 'reporting.md'));
const requiredReportingContracts = [
  ['silent tool execution and completion', /use tools without narration and end the turn immediately after successful verification with no assistant text block/],
  ['silent acknowledgments forbidden', /Never say `Done`, `Cleaned`, `Complete`, `Success`, or any equivalent acknowledgment/],
  ['HITL, purge, and preview output', /Session HITL findings and choices, whole-file purge confirmation, and previews \(including `--dry-run`\)/],
  ['credential and Session status output', /Credential rotation warnings, plus Session zero-findings and unavailable-inventory notices/],
  ['input, structure, and concurrency errors', /Input errors, structural-validation failures, and concurrent-modification aborts/],
  ['collision, sub-agent, and protected-target output', /Numbered collision filenames, sub-agent fallback notices, and user-target matches in executable content/],
  ['worktree and blocking-scope output', /Worktree resolution errors, empty selections, and preview base\/file reports; blocking scope questions/],
];

for (const [label, pattern] of requiredReportingContracts) {
  if (!pattern.test(reporting)) fail(`Reporting contract is missing: ${label}.`);
}

const requiredEntryRoutes = [
  ['automatic eligibility before content access', /Any automatic `session` or `worktree` scope, including the default[^\n]+\(references\/automatic-scope\.md\) before validation or content access/],
  ['default session workflow', /Default or requested `session` scope[^\n]+\(references\/session-mode\.md\)/],
  ['worktree workflow', /Requested `worktree` scope[^\n]+\(references\/worktree-mode\.md\)/],
  ['category rubric after scope and validation', /After literal selection or automatic scope chooses a file and Step 0 validates it, read \[Leakage categories\]\(references\/leakage-categories\.md\) before leakage scanning/],
  ['semantic-target rules', /One or more semantic targets[^\n]+\(references\/user-targets\.md\)/],
  ['optional output behavior', /Preview intent or a non-default output mode[^\n]+\(references\/output-modes\.md\)/],
  ['sub-agent workflow', /Fresh-context sub-agent intent[^\n]+\(references\/subagent-review\.md\)/],
  ['reporting before visible output', /Before any user-visible output[^\n]+\(references\/reporting\.md\)/],
];

for (const [label, pattern] of requiredEntryRoutes) {
  if (!pattern.test(skill)) fail(`Conditional reference route is missing: ${label}.`);
}

if (skill.indexOf('(references/automatic-scope.md)') > skill.indexOf('(references/leakage-categories.md)')) {
  fail('Automatic-scope route must precede the scan-only category route.');
}

const corpus = [skill, ...referenceFiles.map(read)].join('\n');
const requiredInlineContracts = [
  ['natural-language request parsing', /Treat the full invocation text after `\/hide` as a natural-language request/],
  ['no mandatory legacy grammar', /Do not require users to quote multi-word targets, place targets before options, or use exact flag syntax/],
  ['legacy flag compatibility', /Legacy forms such as `--files`, `--mode`, `--dry-run`, and `--use-subagent` remain supported as compatibility aliases/],
  ['cleanup-input path role', /A path is an unconditional literal scope selection only when the user assigns it as an input to inspect, scan, clean, or write/],
  ['path-like semantic target role', /A path named as content to remove[^\n]+is a semantic target, not a scope selection/],
  ['explicit path exclusion', /A path in an exclusion[^\n]+must never be read or written/],
  ['combined scope support', /Combine and de-duplicate requested scope sources after applying exclusions/],
  ['clarify only material ambiguity', /Ask a concise clarification only when a path's role or another ambiguity would materially change which files are read or written/],
  ['silent no-findings behavior', /with no findings outside Session HITL or preview intent, do nothing and say nothing/],
  ['silent tool-only execution', /On silent paths, emit tool calls only from the start and do not narrate analysis/],
  ['no silent completion text block', /Silent termination means emitting no assistant text block at all/],
  ['no one-word completion acknowledgment', /Never say `Done`, `Cleaned`, `Complete`, `Success`, or summarize what changed on a silent path/],
  ['credential output is fully redacted', /identify credentials only by a fixed `\[REDACTED\]` label and file\/line\/key location/],
  ['credential descriptors are not exposed', /Never emit or describe a value substring, recognizable prefix or suffix, format, pattern, provider-specific scheme or token type, original length, or shape/],
  ['default inplace behavior', /default `inplace` mode replaces the original only after successful validation/],
  ['line endings before writes', /Before any write, preserve the file's original line ending style/],
  ['concurrent modification before writes', /compare mtime with the value observed when reading; if it changed, warn and abort/],
  ['agent support files excluded by default', /Automatically scan deliverables, not agent support files/],
  ['whole-block removal', /Remove a multi-line leakage block as a whole/],
  ['silent terminal behavior', /the last required tool result is terminal: send no assistant text/],
  ['no post-tool cleanup summary', /Do not acknowledge completion or describe removed content after that tool result/],
];

for (const [label, pattern] of requiredInlineContracts) {
  if (!pattern.test(skill)) fail(`Always-loaded contract is missing from SKILL.md: ${label}.`);
}

const requiredContracts = [
  ['automatic scope before scanning', /Resolve scope before Step 0 or any content scan/],
  ['session inventory is not expanded by Git', /Git status may provide context but must not expand this inventory/],
  ['worktree selection is local-only', /Use local Git state only; do not fetch/],
  ['credential scan precedes purge', /Before any purge decision, scan every line, key, and value for credentials/],
  ['credential warning recommends rotation', /rotate the affected credentials immediately/],
  ['purge candidates are not partially stripped', /Do not strip a purge candidate/],
  ['whole-file deletion requires confirmation', /delete only on explicit confirmation/],
  ['preview never writes', /Preview intent never writes/],
  ['subagents detect candidates only', /sub-agent detects candidate leakage only/],
  ['runtime-visible code content is protected', /runtime-visible doc strings as-is/],
];

for (const [label, pattern] of requiredContracts) {
  if (!pattern.test(corpus)) fail(`Required contract is missing: ${label}.`);
}

const staleFlags = [
  ['--subagent', /(^|[^-])--subagent\b/m],
  ['--artifacts', /(^|[^-])--artifacts\b/m],
  ['--to-hide', /(^|[^-])--to-hide\b/m],
];

for (const [flag, pattern] of staleFlags) {
  if (pattern.test(corpus)) fail(`Stale flag found in the installed skill: ${flag}`);
}

const publicContractCorpus = [
  corpus,
  ...publicDocumentationFiles.map(read),
  read(path.join(root, '.claude-plugin', 'plugin.json')),
  read(path.join(root, '.claude-plugin', 'marketplace.json')),
].join('\n');
if (/\/hiding(?![-:A-Za-z0-9_])|skills\/hiding(?:\/|$)/m.test(publicContractCorpus)) {
  fail('Legacy /hiding invocation or skills/hiding path found in current project files.');
}
const strictGrammarPatterns = [
  ['targets before flags', /targets?\s+must\s+(?:precede\b|(?:appear|be placed)\s+before\b)/i, 'Targets must precede the first flag.'],
  ['quoted targets containing spaces', /quote\s+targets?\s+containing\s+spaces|targets?\s+containing\s+spaces\s+must\s+be\s+quoted/i, 'Quote targets containing spaces.'],
  ['single files flag', /`--files` (?:appears|may appear) at most once/i, '`--files` appears at most once.'],
  ['reserved standalone selectors', /reserved (?:standalone )?selectors?.*(?:only value|never mix)/i, '`session` and `worktree` are reserved selectors and each must be the only value.'],
  ['syntax-only rejection', /reject positional targets|unknown\/misspelled flags/i, 'Reject positional targets after the first flag.'],
];

for (const [label, pattern, regressionSample] of strictGrammarPatterns) {
  if (!pattern.test(regressionSample)) fail(`Legacy strict argument grammar detector is ineffective: ${label}.`);
  if (pattern.test(publicContractCorpus)) fail(`Legacy strict argument grammar remains: ${label}.`);
}

for (const relativePath of ['.claude-plugin/plugin.json', '.claude-plugin/marketplace.json', 'package.json']) {
  try {
    JSON.parse(read(path.join(root, relativePath)));
  } catch (error) {
    fail(`${relativePath}: invalid JSON: ${error.message}`);
  }
}

for (const relativePath of ['.github/workflows/test.yml', '.github/workflows/publish.yml']) {
  try {
    yaml.load(read(path.join(root, relativePath)));
  } catch (error) {
    fail(`${relativePath}: invalid YAML: ${error.message}`);
  }
}

try {
  const packageManifest = JSON.parse(read(path.join(root, 'package.json')));
  if ('main' in packageManifest) fail('package.json must not declare a JavaScript entry point for this data-only package.');
  if (packageManifest.scripts?.prepublishOnly !== 'npm test') {
    fail('package.json must run repository checks before manual publication.');
  }
} catch {
  // The manifest parser above already reports malformed JSON.
}

try {
  const packageLock = JSON.parse(read(path.join(root, 'package-lock.json')));
  for (const [dependencyPath, metadata] of Object.entries(packageLock.packages || {})) {
    if (!metadata.resolved) continue;
    const registry = new URL(metadata.resolved).hostname;
    if (registry !== 'registry.npmjs.org') {
      fail(`package-lock.json uses a non-public registry for ${dependencyPath}: ${registry}`);
    }
  }
} catch (error) {
  fail(`package-lock.json: invalid lock data: ${error.message}`);
}

if (failures.length > 0) {
  for (const failure of failures) console.error(failure);
  process.exit(1);
}

console.log(`Hiding skill contract and ${referenceFiles.length} reference file(s): valid.`);
