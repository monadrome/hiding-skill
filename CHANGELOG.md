# Changelog

All notable changes to this project are documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.1.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [Unreleased]

## [0.10.0] - 2026-09-08

### Breaking Changes

- Moved the npm package from `@huatalk/hiding-skill` to `@monadrome/hiding-skill` after the GitHub account rename. npm cannot rename a published package, so `@monadrome/hiding-skill` is a new package; `@huatalk/hiding-skill` is deprecated and should be replaced in dependency lists.

### Changed

- Split automatic scope eligibility into deliverables and agent support files. Instruction and rule files (`AGENTS.md`, `CLAUDE.md`, `.cursor/rules/**`, `.github/copilot-instructions.md`), planning and progress state, and agent memory are excluded by default and processed only when the user names them.
- Moved the agent-support exclusion ahead of the task-deliverable rule, so a support file stays excluded even when the current task created or updated it.
- Added contract checks that fail when the agent-support exclusion, its precedence, the explicit-selection override, or the consumer test for ambiguous collections is removed.

## [0.9.2] - 2026-08-03

### Changed

- Made dependency installation and repository checks reproducible across local, pull-request, and release workflows.
- Added package inspection, pinned CI actions, and main-branch ancestry protection to the release path.
- Kept the repository hero image out of the runtime npm package while preserving it in the rendered README.

## [0.9.1] - 2026-07-27

### Changed

- Replaced the mandatory positional/flag grammar with natural-language intent resolution for targets, file scope, previews, output modes, and fresh-context review.
- Kept `--files`, `--mode`, `--dry-run`, and `--use-subagent` as backward-compatible hints that may appear in any order or alongside prose.
- Distinguished cleanup-input paths from path-like semantic targets and explicit exclusions so natural-language requests do not expand file scope accidentally.
- Added static contract checks that prevent reintroducing ordering, quoting, single-occurrence, and reserved-selector requirements.
- Strengthened silent-termination instructions and checks against `Done`, completion summaries, and removed-content details after the final verification tool call.

## [0.9.0] - 2026-07-26

### Breaking Changes

- Renamed the installed skill identifier and slash command from `hiding` and `/hiding` to `hide` and `/hide`. Existing users must update their invocation after upgrading; no legacy alias is included.
- Claude Code native plugin installs use the namespaced `/hiding:hide` command because the `hiding` plugin identity is preserved; Claude Code also accepts bare `/hide` when it is unambiguous.

### Changed

- Moved the canonical skill directory from `skills/hiding` to `skills/hide` and updated validation, documentation, and package contents accordingly.
- Kept the **Hiding** product name, `HuaTalk/hiding-skill` repository, `@huatalk/hiding-skill` npm package, and `hiding` Claude plugin/marketplace identities unchanged.

## [0.8.1] - 2026-07-22

### Documentation

- Made the npm installation flow the primary Quickstart and first Installation option in the English and Chinese READMEs.

## [0.8.0] - 2026-07-22

### Added

- Added static checks for the protected Skill discovery contract, high-impact safety anchors, and one-level local reference integrity; wired them into pull-request, tag, and publish validation.
- Added maintainer guidance for progressive-loading placement, baseline-model evaluation, and failure-driven harnessing.

### Changed

- Reduced the always-loaded Skill instructions by moving selector, target, output, sub-agent, and reporting workflows into directly routed one-level references without changing the discovery description or behavior contract.
- Condensed the reporting exception whitelist into five equivalent groups while preserving every existing user-visible output case.
- Further reduced the always-loaded instructions by removing duplicated purpose prose, redundant invocation examples, and extension enumerations while retaining the file-scope and behavior contracts.

### Fixed

- Strengthened credential-output redaction so previews use a fixed label and location instead of reproducing value fragments, recognizable patterns, shape-preserving masks, or provider-specific credential descriptors.
- Enforced tool-only silent cleanup and made the final required tool result terminal to prevent validation summaries and cleanup-status narration.

## [0.7.1] - 2026-07-21

This is the first version intended for public npm distribution.

### Changed

- Positioned Hiding as strategic content cleanup for provenance clues, exposed constraints, AI participation, and user-specified sensitive context, with release hygiene as a common use case rather than a prerequisite.
- Simplified and aligned the Skill, Claude plugin, marketplace, npm, and bilingual README descriptions for clearer discovery and consistent product positioning.
- Prepared public npm distribution with an explicit official registry, public scoped-package access, complete linked documentation, a token-based bootstrap path, and subsequent Trusted Publisher/OIDC releases.

## [0.7.0] - 2026-07-21

This was a repository milestone only. It was never tagged or published to npm;
its changes are included in the first public 0.7.1 package.

### Added

- **User-specified semantic targets** (`/hiding "data sources" "internal rules" ...`): leading positional arguments add one-off content-hiding goals to the built-in five-category and credential scan. Targets must precede flags; executable-code and behavior-affecting config matches require human review.
- **File selection** (`--files <file>...`, `--files session`, or `--files worktree`): pass literal paths, explicitly select current-session edits, or select files changed from the primary-branch merge base through the invocation-time Git worktree. The worktree selector includes committed branch changes, staged and unstaged changes, and untracked non-ignored files. Omitting `--files` is equivalent to `--files session`.
- **Guardrail leakage coverage**: the AI-facing rationale/guardrails category explicitly covers AI safety limits, refusal justifications, and behavioral fences.

### Changed

- Reorganized both READMEs around a concise quickstart, narrative workflow, platform installation, capability inventory, philosophy, and contribution guidance.
- Moved detailed bilingual before/after cases into dedicated example pages and corrected credential examples to match the v0.7.0 safety contract.
- File paths are accepted only through `--files`; leading positional arguments are semantic content targets, never inferred file paths.
- `session` and `worktree` are reserved, standalone `--files` selectors; neither can be mixed with paths or the other selector. Use `./session` or `./worktree` for literal same-named files. Worktree selection uses local refs only and never fetches.
- Automatic session and worktree selection now resolves output artifacts autonomously by explicit selection, tool ownership, task goal, and target consumer, in that order. Known control state is excluded, literal paths override all automatic rules, and low-confidence files are preserved and skipped without prompting (`--dry-run` lists them unscanned). Scope clarification is reserved for cases where conservative exclusion would block an explicit request. Filename and persistence alone are not decisive.
- Unknown or malformed flags, targets after the first flag, and ambiguous values are explicit errors.
- Credential handling distinguishes access-bearing secrets from sensitive context, preserves executable code and unsafe-to-rewrite configuration values, and validates a temporary candidate before replacing the original.
- Credential detection now precedes purge decisions, and `--use-subagent` is detection-only; the main agent retains the original purge, security, editing, validation, and output workflow.
- Skill instructions and runtime messages are now English-only; the concise frontmatter description retains Chinese trigger terms for discovery.

### Fixed

- `--use-subagent` now receives absolute target and leakage-category reference paths resolved from the installed Skill, so invocation from another project cannot lose the category definitions.
- Remaining documentation examples now use `--files` for file selection and quote multi-word semantic targets under the v0.7.0 argument grammar.

## [0.6.0] - 2026-07-16

This was a repository milestone only. It was never tagged or published to npm;
its changes are included in the first public 0.7.0 package.

### Added

- **Output modes** (`--mode inplace|newfile|backup`): write cleaned content in place (default), to a `<name>-cleaned.<ext>` sibling, or to the original name with the original renamed to `<name>.<ext>.bak`.
- **Output-target collision safety**: `newfile`/`backup` never overwrite an existing target — a numbered alternative (`-cleaned-2`, `.bak-2`) is used and reported in one line.
- **`--dry-run`**: preview all would-be changes without modifying files, in every mode (File, Description, HITL).
- **`--use-subagent`**: a fresh-context sub-agent identifies candidate leakage locations only; the main agent retains all purge, credential, editing, validation, output, and write decisions. Report fallback when sub-agents are unavailable.
- **Credential-rotation warnings**: whenever secrets or credentials are *found* — stripped or merely previewed — a mandatory rotate-credentials warning fires. The only mandatory exception to silent execution.
- **Current-session modified-file discovery**: default/`--files session` HITL mode inventories only files created or modified in the current session; unrelated Git changes are excluded.
- **Flag validation**: unknown or malformed flags and unsupported positional arguments are explicit errors.
- Expanded known-extension list for File-mode detection.

### Changed

- Distribution consolidated to two channels: `npx skills add HuaTalk/hiding-skill` (70+ agents) and the Claude Code native plugin marketplace.

### Removed

- Always-on rule files (`.cursor/rules/`, `.windsurf/rules/`, …), per-platform plugin manifests, SessionStart awareness hook, and statusline badges — all conflicted with the post-hoc cleanup philosophy (see `docs/zh/design-tradeoffs.md`).

## Earlier history

Pre-0.6.0 development was not tagged or published; see the git log for details.
