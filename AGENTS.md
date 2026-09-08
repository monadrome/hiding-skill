# Hiding — strategic content cleanup for files

Hiding strips AI-generated artifacts, exposed constraints, source/provenance clues, and user-specified sensitive content whenever a file needs to reveal less about its origin, process, AI participation, constraints, or sensitive context. Release hygiene is a common context, not a prerequisite.

## Core Operating Contract

- Do not inject persistent constraints into normal sessions; preserve reasoning and generation quality.
- Process files only. Agent replies and conversation output are out of scope.
- Remove leakage without changing code logic or rewriting prose like a humanizer.
- The product purpose includes strategic concealment of AI participation, source/provenance, exposed constraints, and process when requested, including avoiding disclosure; do not add a transparency objective that the user did not request.
- Stay silent by default; the cleanup operation must leave no trace.
- Credential safety overrides silence: warn and recommend rotation whenever credentials are found.
- Require explicit user confirmation before deleting an entire file.
- Automatically scan deliverables, not agent support files (instruction and rule files such as `AGENTS.md`, planning state, progress logs, memory); agent support files are processed only when the user names them.
- Keep behavior consistent across supported agent environments.

## Five Leakage Categories

| Category | Principle | Strip |
|---------|-----------|-------|
| **Secrets and credentials** | Credentials, tokens, internal URLs — actual security risks | Always. Zero tolerance. **Mandatory credential-rotation warning.** |
| **Unshared rule references** | References to knowledge the reader doesn't share (CLAUDE.md, skill instructions, team conventions) | Remove — the reader only has this file |
| **AI-facing rationale/guardrails** | Rationale about AI-facing constraints rather than business decisions | Remove — state decisions, don't justify them |
| **AI self-reference** | Language revealing the author is an AI: first-person narration, hedging, meta-commentary | Remove — human-written files don't say "Here's the result:" |
| **Thought-process traces** | Derivation trails, research logs, step-by-step reasoning | Remove — reads like a lab notebook, not a reference document |

These are **principles**, not keywords. Judge by intent, not by grep.
Note: TODO/FIXME/HACK markers are NOT automatically AI leakage — human developers write these too. Judge by context.

## Execution Order

For automatic session or `worktree` selection, resolve output-artifact eligibility autonomously before these steps. Do not inspect file content while deciding scope.

1. **Validate**: file exists, not binary, not directory, not too large (> 10K lines / 500KB)
2. **Credential scan**: detect credentials before any purge decision; the rotation warning fires even if the file is deleted or left unchanged
3. **Purge check**: if removing transient thought-process traces, AI-facing rationale/guardrails, AI self-reference, and user-target matches leaves no section viable as standalone reference — ask before deleting
4. **Strip**: credentials first, then style leakage and user-target matches
5. **Verify**: use actual parsers (Python json/yaml, xmllint, jq) where available; visual check as fallback

## Output Modes

| Mode | Behavior |
|------|----------|
| `inplace` (default) | Modify file in place |
| `newfile` | Create `<name>-cleaned.<ext>`, leave original untouched |
| `backup` | Rename original to `<file>.bak` (e.g. `config.yml` → `config.yml.bak`), write cleaned to original name |

Target collision (`newfile`/`backup`): never overwrite an existing target — use a numbered alternative (`-cleaned-2`, `.bak-2`, incrementing) and report the name used in one line.

## Natural-Language Input

Treat everything after `/hide` as a natural-language request. Infer semantic targets, literal files or automatic session/worktree scope, preview versus write intent, output mode, and fresh-context review from any clear phrasing:

```bash
/hide preview report.md and remove data-source and internal-review references
```

Traditional forms remain optional compatibility aliases: `--dry-run` means preview, `--mode` selects `inplace`/`newfile`/`backup`, `--files` identifies literal or automatic scope, and `--use-subagent` requests fresh-context candidate detection. They may appear in any order or be mixed with prose. Do not require quoting, a fixed position, single occurrence, or exact option spelling when the intent is otherwise clear.

Resolve path-like mentions by their role. A file is unconditionally in scope only when the user assigns it as an input to inspect, scan, clean, or write. A path named as content to remove is a semantic target, not a scope selection; a path the user excludes must never be read or written. Combine and de-duplicate requested scope sources after applying exclusions; default to current-session files and `inplace` output when omitted. Ask only when ambiguity would materially change which files are read or written, whether writes occur, or where output is placed.

Semantic targets are natural-language descriptions, not regexes. In comments or prose, remove the smallest coherent unit that hides the target. Never change executable code, identifiers, or behavior-affecting config values; report those matches for human review.

Fresh-context review identifies candidate leakage only. Before spawning, the main agent resolves the target and `references/leakage-categories.md` to absolute paths from the loaded Skill location; a missing reference is an installation error. The main agent retains scope, credential scanning, purge classification, confirmation, editing, validation, output, and write logic. If sub-agents are unavailable, report the fallback.

For worktree scope, locate the repository from the working directory where the skill is invoked and use local refs only. Resolve the primary branch from the current branch's configured `<remote>/HEAD`, `origin/HEAD`, `origin/main`, local `main`, `origin/master`, then local `master`; stop if unresolved or if `HEAD` has no merge base. Select tracked files changed from that merge base to the current worktree plus untracked non-ignored files. Exclude deleted files, ignored files, directories, and submodules; use NUL-safe Git output, de-duplicate, and validate all files before writing. An empty result is reported explicitly. Preview intent also reports the resolved base and selected files.

Resolve automatic session and `worktree` scope before validation or scanning, in this order: (1) a file explicitly assigned as a cleanup input is in scope, while target-only and excluded path mentions are not; (2) exclude agent support files — anything that exists to instruct, plan, log, or remember for a coding agent rather than to be read by a human or project consumer, such as `AGENTS.md`, `CLAUDE.md`, `.cursor/rules/**`, `.github/copilot-instructions.md`, `.planning/**`, recognizable planning-with-files state, and equivalent session plans, logs, or memory; this precedes (3), so a support file stays excluded even when the task created or updated it; (3) include files directly requested as task deliverables; (4) include human/project-consumed files and exclude agent-only files; (5) use task/session context to decide uncertain cases autonomously. When confidence remains low, preserve and exclude the file without scanning or asking. Ask only if this conservative exclusion would prevent completion of an explicit request. Under preview intent, list conservative exclusions without scanning them. Filename and persistence alone are not decisive: a formal `findings.md` report may be an output, while persistent agent memory is control state.

## Session HITL (requested or default session scope)

Inventories files created or modified through file-editing tools in the current session; Git status must not expand the set. Resolve output-artifact eligibility autonomously before scanning, conservatively excluding low-confidence files. Then scan eligible files for the five categories and any user targets. With fresh-context sub-agent intent, the sub-agent supplies candidate locations only; the main agent performs credential scanning, purge classification, tiering, confirmation, and execution. If the runtime cannot identify session-modified files, report the limitation and stop. Findings are organized into Tier 0 (Security Critical — credentials), Tier 1 (purge candidates), Tier 2 (inline leakage and user-target matches), and Tier 3 (session-level concerns). For zero findings, briefly report that no AI leakage was found; mention user-specified content only when targets were supplied.

## Rules

- **No leakage found (non-HITL)**: do nothing, say nothing, unless fresh-context detection had to report a non-isolated fallback.
- **Silent completion**: after the final successful verification tool call, emit no assistant text at all; never say `Done`, `Cleaned`, `Complete`, `Success`, or summarize removed content.
- **Multi-line leakage blocks**: remove the whole block.
- **After stripping, re-read once** to verify structural integrity.
- **Preserve line endings**: detect and preserve LF vs CRLF.

## Strip Strategy by File Type

- **Code** (.java, .py, .ts, .go, .rs, .js, .tsx, .jsx, etc.): Remove comment lines matching leakage categories or user targets. Keep executable code as-is. Remove empty comment blocks.
- **Markdown** (.md): Remove paragraphs and sentences matching leakage categories or user targets. Keep technical content.
- **Config** (.yml, .yaml, .json, .xml, .toml, .env, .properties, .ini, .cfg): Remove leakage comments. Change credential values only when a format-safe placeholder preserves structure; report other behavior-affecting values for human review.
- **Other**: Remove any comment or prose matching the leakage categories or user targets.

## Token-efficient execution (only for codex cli)

- Minimize model/tool round trips. Batch independent inspections, searches,
  and verification commands into as few tool calls as practical.
- Strongly prefer a single tool execution with `Promise.all` with several
  `tools.shell_command(...)` invocations or at least a single such call with
  multiple sequential shell commands over multiple overall tool calls.
- For a straightforward implementation, inspect the relevant files once,
  implement in one pass where possible, and perform one proportional
  verification pass.
- Do not run broad repository searches, dump complete files, or print complete
  diffs when targeted paths, symbols, ranges, or diff statistics are enough.
- Do not use web search when the answer can reasonably be determined from the
  repository, installed source code, or existing project documentation.
- Do not create ad-hoc verification scripts for small changes unless ordinary
  project checks cannot validate the behavior.
- After one failed environmental verification attempt, diagnose narrowly.
  Avoid repeated retries, polling, and alternative verification mechanisms
  unless they are necessary to establish correctness.
- Running an existing focused test or build is normally sufficient. Do not
  escalate into multiple test, editor, runtime, and debugger verification
  passes for a low-risk change unless a failure requires it.
- Keep command output narrow. Prefer targeted `rg`, bounded file ranges,
  path-specific diffs, and concise status output.
- Do not read workflow skills merely to perform routine completion checks.
- If in doubt, ask the user how to proceed.
