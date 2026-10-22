---
name: hide
description: Removes AI traces, provenance clues, exposed constraints, credentials, and user-specified content from files. Use when asked to hide source, clean AI traces, remove sensitive references, 隐藏 AI 痕迹、隐藏数据来源、隐藏约束、清理 xxx 痕迹, or perform release hygiene. File cleanup only; not prose humanization, ordinary editing, or conversation cleanup.
metadata:
  author: monadrome
  version: "1.0.0"
  category: output-discipline
---

# /hide

## Core Contract

- Do not inject persistent constraints into normal sessions.
- Process code, config, Markdown, and documentation files only; do not modify agent replies or conversation output.
- Remove leakage without changing code logic or doing humanizer-style rewrites.
- Leave no cleanup trace, visible gap, marker, metadata, or unrelated formatting change.
- Always warn and recommend rotation when credentials are found.
- Require explicit confirmation before deleting an entire file.
- Automatically scan deliverables, not agent support files (instructions, rules, planning state, progress logs, or memory); process support files only when explicitly selected.
- Preserve behavior across supported agent environments.

## Gotchas

- **Silent output**: With no findings outside Session HITL or preview intent, do nothing and say nothing. On silent paths, emit tool calls only from the start and do not narrate analysis. Silent termination means emitting no assistant text block at all. Never say `Done`, `Cleaned`, `Complete`, `Success`, or summarize what changed on a silent path. The last required tool result is terminal: send no assistant text afterward.
- **Credential output**: Identify credentials only by a fixed `[REDACTED]` label and file/line/key location. Never emit or describe a value substring, recognizable prefix or suffix, format, pattern, provider-specific scheme or token type, original length, or shape.
- **False positives**: Preserve durable requirements, decisions, trade-offs, and research conclusions. TODO/FIXME/HACK and first-person prose are not leakage by themselves; judge audience and purpose using the leakage categories.

## Reporting

Only the following outputs and the routed cleanup follow-up answer are allowed:

- Session findings and choices, zero-findings or unavailable-inventory notices; purge confirmation; previews.
- Credential rotation warnings; input errors, structural-validation failures, and concurrent-modification aborts.
- Numbered collision filenames, sub-agent fallback notices, and protected user-target matches requiring review.
- Worktree resolution errors, empty selections, preview base/file reports, and scope questions required to complete an explicit request.

## Intent Resolution

Treat the full invocation text after `/hide` as a natural-language request. Infer the option fields below by meaning, not fixed syntax.

### Options

| Field | Meaning | Default |
|-------|---------|---------|
| `targets` | Semantic descriptions of additional content to remove | Built-in categories only |
| `files` | Literal input files, `session`, and/or `worktree` | `session` |
| `dry-run` | Preview findings without writing | Off |
| `mode` | `inplace`, `newfile`, or `backup` | `inplace` |
| `use-subagent` | Fresh-context candidate detection | Off |

Options may appear in any order, repeat, or mix with prose. Do not require users to quote multi-word targets, place targets before options, or use exact field syntax. Interpret misspellings and option-like text by meaning when confidence is high.

Resolve path-like mentions by their role. A path is an unconditional literal scope selection only when the user assigns it as an input to inspect, scan, clean, or write. A path named as content to remove ("remove `AGENTS.md` references from `report.md`") is a semantic target, not a scope selection. A path in an exclusion ("do not touch `config.yml`") must never be read or written. Combine and de-duplicate requested scope sources after applying exclusions. Automatic selections follow their routed workflows. Default to `session` scope and `inplace` output.

Treat descriptions of content to remove as semantic targets, not regexes. Ask a concise clarification only when a path's role or another ambiguity would materially change which files are read or written, whether files are modified, or where output is placed. Otherwise choose the clear intent and proceed.

## Conditional References

Read only the references whose condition matches. For automatic selectors, load only the scope and selector references first; do not preload scan-only references while resolving scope.

| Condition | Read |
|-----------|------|
| Any automatic `session` or `worktree` scope, including the default | [Automatic scope eligibility](references/automatic-scope.md) before validation or content access |
| Default or requested `session` scope | [Session HITL](references/session-mode.md) |
| Requested `worktree` scope | [Git worktree selection](references/worktree-mode.md) |
| One or more semantic targets | [User-specified targets](references/user-targets.md) |
| Preview intent or a non-default output mode | [Output modes](references/output-modes.md) |
| Fresh-context sub-agent intent | [Sub-agent review](references/subagent-review.md) |
| Asked what was removed or whether cleanup ran | [Cleanup follow-up](references/reporting.md) |

## Execution Order

Apply these steps in order; each gates the next.

### Step 0: Validate

Reject missing, directory, binary, empty, or oversized files (>10,000 lines or >500KB) with a brief error. Require confirmation before following a symlink.

### Step 1: Scan Secrets and Credentials

After literal selection or automatic scope chooses a file and Step 0 validates it, read [Leakage categories](references/leakage-categories.md) before leakage scanning. Do not load it while resolving automatic scope or for an empty selection.

Before any purge decision, scan every line, key, and value for credentials. Credentials grant access; internal names, non-access-bearing URLs, and mock labels are not credentials. Record findings and the required warning without modifying the file yet.

In Session HITL, show the following outcome-neutral warning once with Tier 0 findings before waiting for selection. Otherwise emit it after the outcome is known. The warning is required even if the file is deleted as a purge candidate or left unchanged:

> **"Security-sensitive content (credentials/keys/tokens) was found. If this file was ever committed, pushed, or shared, rotate the affected credentials immediately."**

### Step 2: File-Level Purge Check (HITL)

Ask: after removing transient thought-process traces, AI-facing rationale/guardrails, AI self-reference, and user-target matches, would any section remain useful standalone reference? If no, treat the file as a purge candidate. Durable reader-facing content must not count toward purge signals.

Do not strip a purge candidate. Under preview intent, report it as a would-delete candidate without requesting or acting on deletion confirmation. Otherwise ask whether to delete it; delete only on explicit confirmation, or leave it untouched and stop processing that file. Emit any pending Step 1 credential warning regardless of this choice.

### Step 3: Strip

First remove allowed credential values identified in Step 1. Do not modify credentials in executable code; report the line for review. Replace configuration credentials only with a format-safe placeholder; otherwise leave them and request review.

Then remove unshared rule references, AI-facing rationale/guardrails, AI self-reference, transient thought-process traces, and allowed matches for user-specified targets.

### Step 4: Verify

Validate a temporary candidate before changing the original. Use installed parsers for JSON (`jq` or Python `json`), YAML (PyYAML), and XML (`xmllint`). A missing parser or `ModuleNotFoundError` permits visual fallback; a syntax error fails validation. For code, check delimiters, imports, and directives; for Markdown, check heading hierarchy and code fences.

After stripping, re-read the candidate once. On failure, discard it and leave the original untouched. Report: "Structural issue detected after cleaning — file left unchanged. Human review needed." A successful visual fallback is silent.

The default `inplace` mode replaces the original only after successful validation. Before any write, preserve the file's original line ending style (LF vs CRLF) and compare mtime with the value observed when reading; if it changed, warn and abort. Replace atomically where supported.

## Strip Strategy by File Type

- **Code**: Remove comment lines matching leakage categories or user targets. Keep executable code, string literals, and runtime-visible doc strings as-is; report those matches for human review. If removing a comment would leave an empty comment block (e.g., `/** */`), remove the whole block.
- **Markdown**: Remove paragraphs and sentences matching leakage categories or user targets. Keep technical content.
- **Config**: Remove leakage comments. Handle credential values only as Step 3 permits; report user-target matches in behavior-affecting values for human review. Keep config structure and other values. For YAML block scalars (`|`, `>`), replace the entire scalar value only when the permitted edit remains format-safe.
- **Other**: Remove any comment or prose matching the leakage categories or user targets.

Remove a multi-line leakage block as a whole.
