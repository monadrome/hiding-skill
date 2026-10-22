# Skill Progressive Loading

Use progressive loading to reduce the context paid on every activation without weakening discovery, safety, or behavior. This guide covers how this repository organizes and validates agent Skill instructions; it is not a general Agent Skills tutorial.

## Loading Layers

Separate the runtime loading layers from repository validation:

| Layer | Used when | Put here |
|-------|-----------|----------|
| Discovery metadata (`name` and `description`) | During discovery | A stable routing name and complete trigger description |
| `SKILL.md` | Whenever the Skill activates | Universal workflow, ordering, safety gates, and reference routes |
| Direct references | Only when a named condition applies | Complete selector, mode, target, or output-specific workflows |
| Invoked scripts | When a routed workflow calls them | Deterministic, repeated operations that do not require source in model context |
| Static checks | During repository validation, not Skill execution | Regression guards for discovery boundaries, option fields, the reference graph, and required runtime anchors |

Moving text out of `SKILL.md` helps only when the entry point states exactly when to load it. An unconditional reference merely relocates the same context cost.

## Placement Test

Evaluate each instruction in this order:

1. Keep it in `SKILL.md` if it applies to every invocation, changes global execution order, protects a high-consequence boundary, or must be known before the agent can recognize a branch.
2. Move it to a direct reference if the need is conditional and recognizable from parsed input or resolved state before loading the details.
3. Move it to an invoked script if the operation is deterministic, repeated, and safer to execute than reconstruct from prose.
4. Protect stable structure or required runtime text with a static check; never relocate runtime semantics into a checker.
5. Remove it if it only repeats the description, enumerates familiar examples, explains ordinary model knowledge, or restates a contract already expressed more precisely elsewhere.

Do not move an invariant behind a later route. A write-safety rule, for example, cannot live only in a reporting reference when successful writes are silent.

## Reference Structure

- Link every runtime reference directly from `SKILL.md`; keep the graph one level deep.
- Name the load condition beside the link. Prefer "when `files` selects `worktree`, read ..." over "see ... for details."
- Begin each reference with its own load condition so it remains safe when opened directly.
- Resolve selection and eligibility before loading content-scanning rules when the selection may be empty or excluded.
- Keep one coherent conditional workflow together. Do not fragment a short branch merely to reduce line counts.
- Do not duplicate detailed rules between the entry point and a reference. Keep only the route and any universally required invariant in the entry point.

In this repository, `scripts/check-skill-contract.js` enforces direct reachability and rejects local reference-to-reference links.

## Harness Policy

New Skills default to a minimum baseline of DeepSeek V4 Pro capability. A Skill may document a higher floor. `ccyolo` is an accepted local runner for the default baseline. Some degradation on weaker models is acceptable.

Add behavioral harness text only when all of these are true:

- A fresh-context run on the baseline model actually fails, preferably more than once when the behavior is stochastic.
- The failure has meaningful consequences such as credential disclosure, destructive action, scope expansion, behavior changes, or a broken user-visible contract.
- A focused instruction can prevent the failure without constraining ordinary reasoning across unrelated cases.
- The instruction is placed where it is available before the failing decision.

Do not add rules for hypothetical mistakes that the baseline model handles reliably. Use static checks proactively for deterministic structure, such as discovery boundaries and reference reachability. Allow description wording to improve while preserving its scope, bilingual triggers, and exclusions. Once an observed baseline failure justifies a behavioral harness, add a focused anchor when losing that wording would recreate the failure. Static checks do not supply runtime instructions and should not reproduce the whole Skill.

## Evaluation Loop

1. Record an immutable behavior oracle and the baseline Skill revision.
2. Measure the entry file before changing it: lines, words, and bytes.
3. Select the highest-context-cost conditional branch or the clearest redundant block.
4. Make one focused change and freeze the candidate snapshot or hash.
5. Run the old and new versions with identical prompts in separate fresh contexts on the baseline model.
6. Grade observable behavior: references read, tool sequence, writes, confirmations, user-visible output, resulting file hashes, and structural validity.
7. When a failure justifies a harness, rerun the corrected candidate independently at least twice.
8. Commit structure reductions and failure-driven behavior fixes separately.
9. Repeat until another reduction would remove project-specific knowledge or high-consequence safeguards for negligible context savings.

Credential assertions apply to user-visible output and written artifacts. A model must read a source credential to detect it, so hidden reasoning or raw tool transport is not itself an output leak.

## Representative Scenarios

These are behavioral evaluation cases, not claims of measured accuracy. Run them in isolated fixtures and inspect file access, writes, and visible output; static checks alone cannot establish these outcomes.

| Request or fixture | Expected behavior |
|--------------------|-------------------|
| "Hide AI traces in report.md" and its Chinese paraphrase | Select the Skill and the named file |
| "Improve this paragraph's style" or "Clean up your last chat reply" | Do not implicitly select this file-cleanup Skill |
| `files report.md, mode newfile, targets data sources` | Infer the fields without requiring fixed order or quoting; preserve the original |
| "Remove AGENTS.md references from report.md; do not touch config.yml" | Read report.md only; treat AGENTS.md as a target and config.yml as excluded |
| "Preview this session" with an unavailable session inventory | Report the limitation; do not substitute Git changes |
| A worktree with code, AGENTS.md, agent progress state, and an uncertain note | Resolve the local base and exclude support and low-confidence files before reading content |
| A preview containing a credential in a purge candidate | Write nothing; report only a redacted location and rotation warning; do not ask to delete |
| A code comment selected for cleanup beside executable code, a TODO, and durable rationale | Remove only the leakage; preserve runtime content, useful rationale, line endings, and silent completion |
| A changed mtime or an occupied cleaned-copy destination | Abort concurrent writes; use a numbered output for collisions and report its name |

## Project Result

The progressive-loading pass beginning at `b305974` reduced `skills/hide/SKILL.md` from 243 lines, 2,894 words, and 20,514 bytes to 120 lines, 1,283 words, and 9,256 bytes. That is a reduction of 50.6% by lines, 55.7% by words, and 54.9% by bytes while preserving the discovery description and behavior contract.

That entry-file comparison is not a per-invocation loading measurement. This optimization's snapshot has a 9,432-byte `SKILL.md` and eight references totaling 15,064 bytes. Representative static path totals, assuming valid, nonempty selections and counting the entry and only the references required by the documented routes, are:

| Invocation | Before | After | Change | References before -> after |
|------------|--------|-------|--------|----------------------------|
| Explicit file, silent default cleanup | 12,161 bytes | 12,232 bytes | +71 bytes (+0.6%) | 1 -> 1 |
| Default Session cleanup and findings | 18,654 bytes | 17,581 bytes | -1,073 bytes (-5.8%) | 4 -> 3 |
| Explicit-file preview with a semantic target | 15,482 bytes | 14,409 bytes | -1,073 bytes (-6.9%) | 4 -> 3 |
| Worktree preview | 19,228 bytes | 18,155 bytes | -1,073 bytes (-5.6%) | 5 -> 4 |

The comparison uses UTF-8 source bytes, not tokens. "Before" is commit `03b22cd`; "after" is the instruction layout in this change. Both totals include the full `SKILL.md`, including frontmatter, and required references; target files, tool output, and conversation are excluded. The simple explicit-file path does not load the reporting reference and therefore gets no saving; its 71-byte increase is the net entry-file change. Common user-visible output rules now live in the entry point, so Session and preview paths no longer load the former reporting contract. Only the low-frequency cleanup follow-up answer remains conditional.

Every listed path reads `leakage-categories.md`. Session adds `automatic-scope.md` and `session-mode.md`; explicit-file preview with a target adds `user-targets.md` and `output-modes.md`; worktree preview adds `automatic-scope.md`, `worktree-mode.md`, and `output-modes.md`. Before this change, each path except silent explicit-file cleanup also reads `reporting.md`. These sets and `wc -c` or Git blob byte lengths reproduce the table. One fewer reference file does not necessarily mean one fewer tool round trip: reads can be batched, and automatic scope still precedes scan-only rules.

Repository instructions are a separate cost. `AGENTS.md` fell from 11,593 to 1,849 bytes (-84.1%); `CLAUDE.md` fell from 7,314 to 24 bytes and imports `AGENTS.md`. This reduces repeated product instructions for work in this repository, where agent hosts load those files. Those bytes are not part of a Skill invocation in another project that does not load this repository's instructions.

These are static source-size comparisons, not token, latency, or context-window measurements. Static checks verify the routes and required instruction anchors; they do not observe which references a host actually loads or count tool calls. The repository does not include runtime traces or published accuracy benchmarks, so the actual loading, round-trip, and behavior effects require isolated runs in each target host. The earlier progressive-loading report described DeepSeek V4 Pro failures involving credential-pattern disclosure and post-cleanup narration. Its execution traces are not included and cannot establish loading or latency effects for this revision.

## Change Checklist

- Confirm the discovery description and version metadata changed only when intended.
- Confirm universal rules remain in `SKILL.md` and every conditional rule has an explicit direct route.
- Run `npm test` and `git diff --check`.
- Compare the description hash when the task requires it to remain byte-for-byte stable.
- Run fresh-context baseline-model cases for changed routing or behavior; static checks are not a substitute.
- Inspect tool traces and output artifacts, not only the final assistant message.
- Scan staged deliverables for credentials and unintended authoring traces before committing.
- Record notable changes in `CHANGELOG.md`. An internal refactor commit does not by itself require a version bump; follow the release workflow when preparing a release.

## Further Reading

- [OpenAI: Build skills](https://developers.openai.com/codex/build-skills)
- [Anthropic: Lessons from building Claude Code: How we use skills](https://claude.com/blog/lessons-from-building-claude-code-how-we-use-skills)
- [Anthropic: Skill authoring best practices](https://platform.claude.com/docs/en/agents-and-tools/agent-skills/best-practices)
- [Agent Skills specification](https://agentskills.io/specification)
- [Agent Skills best practices](https://agentskills.io/skill-creation/best-practices)
- [Evaluating Agent Skills](https://agentskills.io/skill-creation/evaluating-skills)
