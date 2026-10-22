# Hiding: repository maintenance

This repository ships the `/hide` file-cleanup Skill, documentation, packaging metadata, and static checks. There is no runtime implementation or build.

## Working Conventions

- Keep runtime behavior in `./skills/hide/SKILL.md` and its directly routed references. Ordinary maintenance is not a cleanup invocation: do not apply hide's silence or stripping rules to maintenance replies or edits.
- Preserve the product's purpose: users control disclosure of AI participation, provenance, constraints, and sensitive context in files. Do not add an unrequested transparency objective or humanizer behavior.
- Keep behavior consistent across supported agents; do not introduce always-on cleanup rules or session hooks.
- Maintainer-facing files and Skill body text are English. Keep bilingual discovery triggers; Chinese user documentation belongs in `./README-zh.md` and `./docs/zh/`.
- Mirror user-facing changes between the English and Chinese READMEs. Keep their section order and content equivalent.
- Batch independent inspections and keep searches and verification proportional to the change.

## Checks

- Run `npm test` and `git diff --check` before committing.
- Static checks validate text and structure, not agent behavior, loading costs, or accuracy. Qualify claims accordingly.
- Record notable changes under `Unreleased` in `./CHANGELOG.md`. Internal instruction refactors do not require a version bump or release tag.

## Read When Needed

- Executing or changing cleanup behavior: read `./skills/hide/SKILL.md`, then only the references relevant to the request or change.
- Changing instruction placement or evaluating loading costs: read `./docs/en/skill-progressive-loading.md`.
- Changing packaging or preparing a release: read `./CONTRIBUTING.md` and the relevant files under `./.claude-plugin/`.
