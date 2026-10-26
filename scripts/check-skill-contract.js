#!/usr/bin/env node

const fs = require('fs');
const path = require('path');
const yaml = require('js-yaml');

const root = path.join(__dirname, '..');
const skillDir = path.join(root, 'skills', 'hide');
const skillPath = path.join(skillDir, 'SKILL.md');
const referencesDir = path.join(skillDir, 'references');
const legacySkillDir = path.join(root, 'skills', 'hiding');

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
  if (description.length === 0 || description.length > 1024) {
    fail('SKILL.md description must contain 1-1024 characters.');
  }
  const discoveryContracts = [
    ['file scope', /\bfiles\b/i],
    ['AI cleanup trigger', /\bAI (?:traces|leakage|participation)\b/i],
    ['provenance cleanup', /\b(?:provenance|sources?)\b/i],
    ['constraint cleanup', /\bconstraints?\b/i],
    ['credential cleanup', /\bcredentials?\b/i],
    ['user-specified targets', /user-specified/i],
    ['Chinese triggers', /[\u3400-\u4dbf\u4e00-\u9fff]/],
    ['conversation boundary', /\bnot\b[^.]*\b(?:conversation|chat)\b/i],
    ['humanization boundary', /\bnot\b[^.]*\b(?:humanization|humanizer)\b/i],
  ];
  for (const [label, pattern] of discoveryContracts) {
    if (!pattern.test(description)) fail(`SKILL.md description is missing: ${label}.`);
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
  ['agent instruction files named', /`AGENTS\.md`, `\.cursor\/rules\/\*\*`, `\.github\/copilot-instructions\.md`/],
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
  ['explicit reporting whitelist and follow-up exception', /Only the following outputs and the routed cleanup follow-up answer are allowed/],
  ['HITL, status, purge, and preview output', /Session findings and choices, zero-findings or unavailable-inventory notices; purge confirmation; previews/],
  ['credential, input, structure, and concurrency output', /Credential rotation warnings; input errors, structural-validation failures, and concurrent-modification aborts/],
  ['collision, sub-agent, and protected-target output', /Numbered collision filenames, sub-agent fallback notices, and protected user-target matches requiring review/],
  ['ambiguous review findings output', /Ambiguous\/review-only user-target matches requiring human review, reported with `<file>:<line>` and a brief reason/],
  ['worktree and blocking-scope output', /Worktree resolution errors, empty selections, preview base\/file reports, and scope questions required to complete an explicit request/],
  ['successful-write summary output', /Successful-write summaries limited to actual modified\/created file paths and validation-passed status/],
];

for (const [label, pattern] of requiredReportingContracts) {
  if (!pattern.test(skill)) fail(`Always-loaded reporting contract is missing: ${label}.`);
}
if (!/Read this file only when asked what was removed or whether cleanup ran/.test(reporting)
    || !/Reply only: "X leakage categories were addressed\." Do not itemize or celebrate\./.test(reporting)) {
  fail('Conditional cleanup follow-up contract is missing.');
}

const userTargets = readRegularFile(path.join(referencesDir, 'user-targets.md'));
const sessionMode = readRegularFile(path.join(referencesDir, 'session-mode.md'));
const outputModes = readRegularFile(path.join(referencesDir, 'output-modes.md'));
const focusedSafetyContracts = [
  ['credential warning covers session JSONL exposure', skill, /Reading or scanning credentials may already have exposed their values in session JSONL logs/],
  ['credential warning covers LLM API exposure', skill, /through API requests to the LLM/],
  ['credential warning requires immediate rotation', skill, /Treat them as potentially compromised and rotate the affected credentials immediately/],
  ['semantic automatic removal requires high confidence and isolation', userTargets, /only high-confidence matches that can be isolated in the smallest complete sentence, paragraph, list item, or block needed to hide the target are eligible for automatic removal/],
  ['ambiguous semantic criteria are explicit', userTargets, /merely related, requires speculation, has uncertain contextual meaning, or cannot be isolated while preserving unrelated or durable technical content/],
  ['ambiguous semantic matches are preserved and reviewed', userTargets, /Preserve it unchanged and report `<file>:<line>` with a brief reason for human review in every mode/],
  ['ambiguous semantic matches are excluded from automatic cleanup', userTargets, /Ambiguous matches are review-only: never include them in automatic cleanup or Session `Hide everything found`/],
  ['preview distinguishes semantic match dispositions', outputModes, /label automatically removable high-confidence matches as `would-remove` and ambiguous matches as `preserved\/review-only`/],
  ['Session preview distinguishes ambiguous semantic matches', sessionMode, /Also show automatically removable high-confidence user-target matches as `would-remove` and ambiguous user-target matches as `preserved\/review-only`, then stop/],
  ['zero semantic matches add no per-target notices', userTargets, /Zero matches for a target do not add separate per-target notices in any mode/],
  ['successful writes summarize paths and validation', skill, /After successful `inplace`, `newfile`, or `backup` writes, emit a concise summary listing each file path actually modified or created and stating that validation passed/],
  ['successful-write summary withholds removal details', skill, /Do not list removed content, leakage categories, or values/],
  ['Step 4 no-write silence excludes required review findings', skill, /With no write, remain silent only if no required review findings or other allowed output need to be reported; required ambiguous\/review-only findings must not be suppressed merely because no write occurred/],
  ['Session writes use the successful-write summary', sessionMode, /After actual writes, emit Step 4's concise summary of modified\/created file paths and validation-passed status/],
  ['Session no-write silence excludes required review findings', sessionMode, /When there are no writes, stay silent only if no required review findings or other allowed output remain to be reported; required ambiguous\/review-only findings must not be suppressed merely because no write occurred/],
];

for (const [label, content, pattern] of focusedSafetyContracts) {
  if (!pattern.test(content)) fail(`Focused safety contract is missing: ${label}.`);
}

const requiredEntryRoutes = [
  ['automatic eligibility before content access', /Any automatic `session` or `worktree` scope, including the default[^\n]+\(references\/automatic-scope\.md\) before validation or content access/],
  ['default session workflow', /Default or requested `session` scope[^\n]+\(references\/session-mode\.md\)/],
  ['worktree workflow', /Requested `worktree` scope[^\n]+\(references\/worktree-mode\.md\)/],
  ['category rubric after scope and validation', /After literal selection or automatic scope chooses a file and Step 0 validates it, read \[Leakage categories\]\(references\/leakage-categories\.md\) before leakage scanning/],
  ['semantic-target rules', /One or more semantic targets[^\n]+\(references\/user-targets\.md\)/],
  ['optional output behavior', /Preview intent or a non-default output mode[^\n]+\(references\/output-modes\.md\)/],
  ['sub-agent workflow', /Fresh-context sub-agent intent[^\n]+\(references\/subagent-review\.md\)/],
  ['conditional cleanup follow-up', /Asked what was removed or whether cleanup ran[^\n]+\(references\/reporting\.md\)/],
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
  ['flexible option input', /Do not require users to quote multi-word targets, place targets before options, or use exact field syntax/],
  ['options may repeat or mix with prose', /Options may appear in any order, repeat, or mix with prose/],
  ['cleanup-input path role', /A path is an unconditional literal scope selection only when the user assigns it as an input to inspect, scan, clean, or write/],
  ['path-like semantic target role', /A path named as content to remove[^\n]+is a semantic target, not a scope selection/],
  ['explicit path exclusion', /A path in an exclusion[^\n]+must never be read or written/],
  ['combined scope support', /Combine and de-duplicate requested scope sources after applying exclusions/],
  ['clarify only material ambiguity', /Ask a concise clarification only when a path's role or another ambiguity would materially change which files are read or written/],
  ['silent no-findings behavior', /With no findings outside Session HITL or preview intent, do nothing and say nothing/],
  ['silent tool-only execution', /On silent paths, emit tool calls only from the start and do not narrate analysis/],
  ['no silent completion text block', /Silent termination means emitting no assistant text block at all/],
  ['no one-word completion acknowledgment', /Never say `Done`, `Cleaned`, `Complete`, `Success`, or summarize what changed on a silent path/],
  ['credential output is fully redacted', /identify credentials only by a fixed `\[REDACTED\]` label and file\/line\/key location/i],
  ['credential descriptors are not exposed', /Never emit or describe a value substring, recognizable prefix or suffix, format, pattern, provider-specific scheme or token type, original length, or shape/],
  ['default inplace behavior', /default `inplace` mode replaces the original only after successful validation/],
  ['line endings before writes', /Before any write, preserve the file's original line ending style/],
  ['concurrent modification before writes', /compare mtime with the value observed when reading; if it changed, warn and abort/],
  ['agent support files excluded by default', /Automatically scan deliverables, not agent support files/],
  ['whole-block removal', /Remove a multi-line leakage block as a whole/],
  ['silent terminal behavior', /On a silent path, the last required tool result is terminal: send no assistant text afterward/],
];

for (const [label, pattern] of requiredInlineContracts) {
  if (!pattern.test(skill)) fail(`Always-loaded contract is missing from SKILL.md: ${label}.`);
}

for (const field of ['targets', 'files', 'dry-run', 'mode', 'use-subagent']) {
  if (!new RegExp('^\\|\\s*`' + field + '`\\s*\\|', 'm').test(skill)) {
    fail(`Supported option field is missing from SKILL.md: ${field}.`);
  }
}

if (/\blegacy\b|backward[- ]compatib|compatibility alias/i.test(corpus)) {
  fail('Installed skill instructions must describe current behavior without compatibility history.');
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

if (/--(?:files|mode|dry-run|use-subagent|subagent|artifacts|to-hide)\b/.test(corpus)) {
  fail('Installed skill options must use field names rather than command-line flag notation.');
}

const publicContractCorpus = [
  corpus,
  ...publicDocumentationFiles.map(read),
  read(path.join(root, '.claude-plugin', 'plugin.json')),
  read(path.join(root, '.claude-plugin', 'marketplace.json')),
].join('\n');
if (/\/hiding(?![-:A-Za-z0-9_])/m.test(publicContractCorpus)) {
  fail('Bare /hiding is not a supported invocation; use /hide or /hiding:hide instead.');
}
if (/skills\/hiding(?:\/|$)/m.test(publicContractCorpus)) {
  fail('Removed skills/hiding path found in current project files.');
}
const strictGrammarPatterns = [
  ['targets before flags', /targets?\s+must\s+(?:precede\b|(?:appear|be placed)\s+before\b)/i, 'Targets must precede the first flag.'],
  ['quoted targets containing spaces', /quote\s+targets?\s+containing\s+spaces|targets?\s+containing\s+spaces\s+must\s+be\s+quoted/i, 'Quote targets containing spaces.'],
  ['single files option', /`(?:--)?files` (?:appears|may appear) at most once/i, '`files` appears at most once.'],
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

try {
  const pluginManifest = JSON.parse(read(path.join(root, '.claude-plugin/plugin.json')));
  const marketplace = JSON.parse(read(path.join(root, '.claude-plugin/marketplace.json')));
  const localPlugin = marketplace.plugins?.find(entry => entry.source === './');
  if (typeof pluginManifest.name !== 'string' || !pluginManifest.name
      || localPlugin?.name !== pluginManifest.name) {
    fail('The root marketplace entry and plugin manifest must use the same plugin name.');
  } else {
    const installCommand = `/plugin install ${pluginManifest.name}@${marketplace.name}`;
    const updateCommand = `/plugin update ${pluginManifest.name}@${marketplace.name}`;
    const skillCommand = `/${pluginManifest.name}:hide`;
    for (const relativePath of ['README.md', 'README-zh.md', 'docs/en/agent-portability.md', 'docs/zh/promotion-article.md']) {
      const documentation = read(path.join(root, relativePath));
      const requiredCommands = [installCommand, skillCommand];
      if (relativePath !== 'docs/en/agent-portability.md') requiredCommands.push(updateCommand);
      for (const command of requiredCommands) {
        if (!documentation.includes(command)) fail(`${relativePath} must document ${command}.`);
      }
    }
  }
} catch (error) {
  fail(`Plugin identity validation failed: ${error.message}`);
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
  if (packageManifest.name !== '@monadrome/hiding-skill') {
    fail('package.json must publish as @monadrome/hiding-skill.');
  }
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
