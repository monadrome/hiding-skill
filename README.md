<p align="center">
  <img src="docs/images/hiding-hero.png" alt="AI-generated text being erased" width="240">
</p>

# Hiding

[![CI](https://github.com/HuaTalk/hiding-skill/actions/workflows/test.yml/badge.svg)](https://github.com/HuaTalk/hiding-skill/actions/workflows/test.yml)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](LICENSE)
[![Chinese](https://img.shields.io/badge/lang-Chinese-blue.svg)](README-zh.md)

**Ship the work, not the agent's working notes.**

Hiding is a strategic content-cleanup Skill for coding agents. Use it whenever a file needs to reveal less about its origin, process, AI participation, constraints, or sensitive context. It removes private instruction and constraint references, source and provenance clues, AI narration, transient reasoning, credentials, and user-specified content while preserving executable behavior. Release hygiene is a common use case; review, handoff, publication, commit, push, and sharing are examples, not prerequisites.

> Hiding can remove provenance and disclosure clues from selected files. It does not rewrite repository history, metadata, or records outside the selected scope.

## Quickstart

Install `/hide` from npm:

```bash
npm install -D @huatalk/hiding-skill
npx skills-npm setup
```

Then ask your agent to preview files changed in the current session:

```text
/hide preview the files changed in this session
```

Review the findings, then apply the cleanup:

```text
/hide clean the files changed in this session
```

Describe another scope or cleanup goal in the same way: [specific files](#specific-files), [the Git worktree](#git-worktree), or [additional content to hide](#semantic-targets).

## How It Works

`/hide` runs on demand after content exists, not throughout the agent's normal reasoning process. The target may be a draft, an existing file, a review or handoff artifact, or release-ready output.

For automatic `session` and `worktree` scopes, it resolves which files are user-facing outputs and excludes agent control state, planning metadata, build output, and unrelated files.

Next, it scans eligible files for five built-in leakage categories, credentials, and any one-off semantic targets supplied by the user. It distinguishes removable comments and prose from executable code and behavior-affecting configuration.

Before writing, it checks whether the cleanup would leave a useful standalone file and validates a temporary candidate. Unsafe edits are reported for human review; whole-file deletion always requires confirmation.

For example:

```typescript
// Before
// Per CLAUDE.md, here's the UserProfile component I created.
// I think memoizing makes sense because props rarely change.
const UserProfile = memo(({ user }) => {

// After
// Memoized because props rarely change.
const UserProfile = memo(({ user }) => {
```

The unavailable rule reference and AI narration disappear. The useful technical reason and executable code remain. See [more examples](docs/en/examples.md).

## Installation

Installation depends on how your coding agent loads Skills.

### npm

For environments using `skills-npm`:

```bash
npm install -D @huatalk/hiding-skill
npx skills-npm setup
```

### Agent Skills

Use this for Codex, Cursor, Windsurf, Gemini CLI, GitHub Copilot, Cline, and other agents supported by the Agent Skills ecosystem:

```bash
npx skills add HuaTalk/hiding-skill
```

Agent compatibility and install location are determined by the installer and each agent's Skill implementation.

### Claude Code

Register the repository as a plugin marketplace:

```text
/plugin marketplace add https://github.com/HuaTalk/hiding-skill.git
```

Then install the plugin in a separate prompt:

```text
/plugin install hiding@hiding
```

Restart Claude Code after installation. The native plugin command is `/hiding:hide`; the shorter `/hide` also works when no other command uses that name.

## The Basic Workflow

1. **Select outputs** - Use current-session files by default, explicit paths for precise control, or the Git worktree for branch-wide review.
2. **Preview** - Ask to preview or inspect without changing files to see scope, findings, and conservative exclusions.
3. **Classify** - Credentials are handled first, followed by file-level purge candidates, inline leakage, and user-specified targets.
4. **Confirm** - Session review is human-in-the-loop. Whole-file deletion and symlink traversal always require explicit confirmation.
5. **Clean** - Remove the smallest coherent comment or prose unit. Executable code, string literals, and behavior-affecting values are not silently changed.
6. **Verify** - Re-read the candidate, validate structure, check for concurrent edits, then apply the selected output mode.

When there are no findings in direct file modes, `/hide` stays silent. Security warnings, previews, validation failures, and required intent clarifications remain visible.

## What's Inside

### Five Leakage Categories

| Category | What it catches |
|---|---|
| Secrets and credentials | API keys, tokens, passwords, connection strings, and access-bearing endpoints |
| Unshared rule references | References to `CLAUDE.md`, Skill instructions, or private conventions the reader cannot access |
| AI-facing rationale and guardrails | Prompt compliance, refusal justification, safety fences, and reasoning about satisfying agent instructions |
| AI self-reference | "As an AI", "I think", "Here's the result", and similar narration |
| Thought-process traces | Transient derivations, intermediate attempts, session logs, and temporary step-by-step reasoning |

These are judgment principles, not a keyword list. `TODO`, `FIXME`, and `HACK` are not leakage by themselves. Durable architecture decisions, requirements, trade-offs, and research conclusions remain valid documentation.

### Semantic Targets

Describe one-off content goals anywhere in the request to augment the built-in scan:

```text
/hide preview report.md and remove data-source references plus the internal project name
```

Targets are interpreted semantically, not as regular expressions. Quoting and fixed argument positions are not required. Matches in executable code, identifiers, or behavior-affecting configuration are reported for human review rather than modified automatically.

### File Selection

#### Current Session

```text
/hide
/hide preview the files changed in this session
```

The default scope is files created or modified through file-editing tools in the current agent session. Git status may provide context but does not expand this inventory.

#### Specific Files

```text
/hide preview README.md and config.yml
```

Paths assigned as files to inspect or clean are unconditional scope selections and may appear naturally anywhere in the request. Path-like names used as content targets or exclusions are not selected: `/hide remove policy.md references from report.md` scans `report.md`, while `do not touch config.yml` excludes `config.yml`. Multiple requested scope sources are combined and de-duplicated after exclusions.

#### Git Worktree

```text
/hide preview everything changed in this Git worktree
```

Worktree scope compares `HEAD` with the merge base of the locally resolved primary branch. It includes branch commits, staged changes, unstaged changes, and untracked non-ignored files. It never fetches remote refs.

When `session` or `worktree` is the name of a literal file, describe it as a file path so the intent is clear.

### Output Modes

| Mode | Behavior |
|---|---|
| `inplace` | Replace the original after validation; this is the default |
| `newfile` | Write `<name>-cleaned.<ext>` and preserve the original |
| `backup` | Move the original to `<file>.bak` and write cleaned content to the original path |

Existing output targets are never overwritten. Numbered alternatives such as `-cleaned-2` and `.bak-2` are used instead.

### Credential Safety

Credentials are scanned before any style cleanup or purge decision.

- A discovered credential always triggers a rotation warning, including under `--dry-run`.
- Secret values are redacted from reports.
- Credentials in executable code are not silently edited.
- Configuration credentials are replaced only when a format-safe placeholder preserves structure; otherwise they remain unchanged and are reported for human review.
- If a credential may have been committed, pushed, or shared, rotate it even if the local file is cleaned.

`/hide` is defense in depth, not a replacement for a dedicated secret scanner.

### Fresh-Context Review

```text
/hide have a fresh-context sub-agent review report.md without changing it
```

A fresh-context sub-agent identifies candidate leakage locations only. The main agent still owns scope, credential scanning, purge decisions, edits, confirmations, validation, and file writes.

## Natural-Language Requests

```text
/hide [describe what to hide, where to look, and how to handle the result]
```

| Intent | Example phrasing | Default |
|---|---|---|
| Additional content | "remove data-source references" | Built-in categories only |
| Scope | "README.md and config.yml", "this session", "the worktree" | Current session |
| Preview | "preview", "show findings", "do not change files" | Write after verification |
| Output | "edit in place", "write a cleaned copy", "back up the original" | `inplace` |
| Fresh context | "use a fresh-context sub-agent" | Main agent only |

The legacy `--files`, `--mode`, `--dry-run`, and `--use-subagent` forms remain supported. They may appear in any order or alongside prose; the Skill resolves intent rather than enforcing an argument grammar. It asks for clarification only when ambiguity would materially change file access or writes.

## Philosophy

- **Strategic cleanup, not release-only** - Run it whenever a file should reveal less; release hygiene is one common application.
- **Post-hoc, not always-on** - Cleanup runs on demand and does not consume every session with persistent self-censorship instructions.
- **Content, not style** - The Skill removes selected content and clues; it does not rewrite prose to imitate a human voice.
- **Decisions over derivations** - Keep durable conclusions and reader-facing rationale; remove private instructions and transient process trails.
- **Behavior preservation** - Code logic and runtime-visible content are never silently changed.
- **Evidence over claims** - Preview, parse where possible, re-read, and preserve the original when verification fails.

Read more about [agent portability](docs/en/agent-portability.md), [platform-native integration](docs/en/platform-native.md), and the [project philosophy](docs/en/hiding-philosophy.md).

## Validation and Limitations

Repository CI validates version consistency, static Skill contract anchors, local references, plugin JSON, English-document language separation, and Skill frontmatter. The project does not yet publish runtime accuracy benchmarks.

Detection relies on contextual model judgment and may miss or over-classify content. Files over 10,000 lines or 500 KB, binary files, directories, and empty files are rejected. JSON, YAML, and XML use parsers where available; other formats may receive visual structural verification.

For important files, start by asking for a preview, inspect credential and configuration findings manually, then run the host project's formatter, linter, parser, tests, and secret scanner.

## Updating

Version 0.9.1 accepts natural-language requests and keeps the previous flags as optional compatibility aliases. Version 0.9.0 renamed the installed skill command to `/hide`; the pre-0.9 command is not included as an alias.

Agent Skills:

```bash
npx skills add HuaTalk/hiding-skill
```

Claude Code:

```text
/plugin update hiding@hiding
```

Restart Claude Code after updating. Native plugin installs expose `/hiding:hide`; `/hide` works when it is unambiguous. See the [changelog](CHANGELOG.md) for release details.

## Scope Boundaries

`/hide` can remove source, provenance, attribution, constraint, audit, licensing, or disclosure clues when they appear in editable comments or prose and match the built-in categories or a user-specified target.

Its scope is the selected file content. It does not rewrite Git history, external metadata, access logs, signed records, or copies outside that scope, and it does not silently change executable code or behavior-affecting configuration.

## Contributing

Changes to Skill behavior must preserve the same contract across supported agent environments. Follow [CONTRIBUTING.md](CONTRIBUTING.md), update both language versions of the README, and run:

```bash
npm test
```

Issues and feature requests are tracked in [GitHub Issues](https://github.com/HuaTalk/hiding-skill/issues).

## License

MIT License - see [LICENSE](LICENSE).
