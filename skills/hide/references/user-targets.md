# User-Specified Targets

Read this file only when the invocation contains one or more semantic targets.

User targets augment, never replace, the five leakage categories and credential scan. Match by meaning: `"data sources"` includes source attributions and provenance; an exact project or rule name includes obvious contextual references. Do not automatically remove content merely because it is related.

A path-like name can itself be a semantic target. In "remove `AGENTS.md` references from `report.md`", scan `report.md`; do not select or read `AGENTS.md` unless the request separately assigns it as a cleanup input.

- In comments or prose, only high-confidence matches that can be isolated in the smallest complete sentence, paragraph, list item, or block needed to hide the target are eligible for automatic removal. Remove that unit while keeping the remainder coherent and preserving unrelated and durable technical content. Do not invent replacement facts.
- A match is ambiguous if it is merely related, requires speculation, has uncertain contextual meaning, or cannot be isolated while preserving unrelated or durable technical content. Preserve it unchanged and report `<file>:<line>` with a brief reason for human review in every mode. Ambiguous matches are review-only: never include them in automatic cleanup or Session `Hide everything found`.
- In executable code, identifiers, or behavior-affecting config values, do not modify the match. Report `<file>:<line>` for human review without echoing sensitive values.
- If removing eligible target matches would leave no useful standalone content, apply the purge confirmation rule.
- Zero matches for a target do not add separate per-target notices in any mode.
