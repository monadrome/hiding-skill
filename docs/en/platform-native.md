# Platform-Native Features

Use platform-native secret management and project tooling for maintenance after cleanup. The [Skill contract](../../skills/hide/SKILL.md) defines what `/hide` may change; the optional follow-ups below are separate maintenance tasks.

## Secrets and Configuration

| Finding | `/hide` behavior | Optional follow-up |
|---------|------------------|--------------------|
| Credential in executable code | Report its redacted location and recommend rotation; preserve the code | Migrate to environment variables or a secret manager in a separate, tested change |
| Credential in configuration | Use a format-safe placeholder only when structure is preserved; otherwise leave unchanged and request review. Always recommend rotation | Configure the application's supported secret-loading mechanism |
| Internal names, IPs, or non-access-bearing URLs | Preserve unless they match another leakage category or an explicit user target | Review how the project manages environment-specific settings |

## Documentation

| Content | `/hide` behavior |
|---------|------------------|
| Decisions, alternatives, evidence, and technical rationale | Preserve useful reader-facing content, including "we chose X because Y" and ADRs |
| "As instructed by AGENTS.md..." | Remove the unavailable rule reference while preserving any durable requirement or conclusion |
| Transient attempts and session-bound work logs in deliverables | Remove process traces while retaining final findings and useful reference material |
| Project-facing plans, dated decisions, and research conclusions | Preserve durable records; a date or sequence of steps does not make them leakage |
| Agent instruction files, planning state, and memory | Exclude from automatic session/worktree scope; process only when explicitly selected |

## Code Comments

| Content | `/hide` behavior |
|---------|------------------|
| AI narration mixed with a useful technical reason | Remove the narration and preserve the technical reason |
| "Let me know if you need changes" or "Here's the implementation:" | Remove conversational scaffolding |
| TODO/FIXME/HACK markers | Preserve unless accompanying text independently matches a leakage category or user target |
| Executable code, string literals, and runtime-visible doc strings | Preserve and report protected matches for human review |
