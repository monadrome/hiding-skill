# Automatic Scope Eligibility

Resolve scope before Step 0 or any content scan. Read this file whenever the request uses automatic `session` or `worktree` scope, including the default session scope, before candidate content access.

Candidates split into two kinds. **Deliverables** — code, articles, reports, configuration, and other files a human or the project consumes — are eligible for scanning. **Agent support files** — anything that exists to instruct, plan, log, or remember for a coding agent rather than to be read by a human or project consumer — are excluded by default and are processed only when the user names them explicitly.

For each candidate, apply this order and stop at the first decisive rule:

1. **Explicit selection**: a file the user explicitly assigns as an input to inspect, scan, clean, or write is in scope, even when it is an agent support file. A path mentioned only as content to remove is not selected. A path the user excludes is never a candidate.
2. **Agent support file**: exclude files that exist for a coding agent to operate rather than for a human or project consumer to read. This rule precedes the task-goal rule: a support file stays excluded even when the current task created or updated it. Named cases:
   - agent instruction and rule files: `AGENTS.md`, `CLAUDE.md`, `.cursor/rules/**`, `.github/copilot-instructions.md`, and equivalents;
   - planning and progress state: `.planning/**`, recognizable planning-with-files state (`task_plan.md`, `findings.md`, and `progress.md` used together), and equivalent session plans or progress logs;
   - agent memory, scratch notes, and session transcripts.
3. **Task goal**: include files directly requested as task deliverables, such as an article, report, code change, ADR, requirements document, final research conclusion, or project-facing plan.
4. **Target consumer**: include files intended for human or project use; exclude files intended only for an agent or tool.
5. **Uncertain**: use task/session context to make a conservative decision. When confidence remains low, preserve and exclude the file without scanning; do not ask solely because classification is uncertain. Ask only when excluding it would prevent completion of an explicit user request. Do not infer from persistence or filename alone.

Collections whose role depends on content — `todo/`, `notes/`, `scratch/`, and similar — are judged by consumer: agent task state is excluded, while a human-facing backlog or note is a deliverable.

In short, an automatically selected file is a deliverable for a human or project consumer and is not an agent support file. A formal `findings.md` report can qualify as a deliverable; a persistent agent memory does not. Apply this eligibility check only to `session` and `worktree` selector candidates.
