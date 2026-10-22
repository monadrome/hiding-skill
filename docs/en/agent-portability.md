# Agent Portability

Which files in this repo map to which AI agent.

## Skill Distribution (via `npx skills`)

The canonical skill `skills/hide/SKILL.md` is distributed through the Agent Skills installer:

```bash
npx skills add monadrome/hiding-skill
```

The installer places the Skill in supported agents' directories. Agent compatibility, install location, and slash-command support depend on the installer and each host's Skill implementation.

## Claude Code Native

| Agent | File(s) | Type |
|-------|---------|------|
| **Claude Code** | `.claude-plugin/plugin.json`, `.claude-plugin/marketplace.json`, `skills/hide/SKILL.md` | Plugin + Skill |

## Additional Agents (via npx skills)

Other supported agents can receive the Skill via `npx skills`. The installer handles their installation paths; this repository does not provide separate platform-specific Skill definitions.

## How to use

### Skill install (supported agents)

```bash
npx skills add monadrome/hiding-skill
```

Makes the Skill available to supported agents selected during installation. Invocation behavior depends on the host.

### Plugin install (Claude Code native)

```bash
/plugin marketplace add https://github.com/monadrome/hiding-skill.git
/plugin install hiding@hiding
```

Gives you the namespaced `/hiding:hide` command with session-aware HITL mode. Claude Code also accepts `/hide` when no other command uses that name.

### Repository maintenance

`AGENTS.md` contains repository maintenance instructions; `CLAUDE.md` imports the same guidance. Hosts may load these files as project instructions when working in this repository. Cleanup workflows live in `skills/hide/SKILL.md` and its conditional references and are loaded on invocation, not through project instructions. Installing the Skill in another project does not by itself load this repository's `AGENTS.md`.
