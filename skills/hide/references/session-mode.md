# Session HITL

Read this file when the request defaults to or explicitly asks for current-session files, together with the loaded automatic eligibility rules.

## Step H1: Session Inventory

Inventory and de-duplicate every file created or modified through file-editing tools in the current session. Exclude deleted files, build output, and dependencies, then classify the remainder using the loaded automatic eligibility rules. Git status may provide context but must not expand this inventory. If the runtime cannot identify files created or modified in the current session, report the limitation and stop; do not substitute Git changes.

Record session topics, sensitive context, and reasoning traces as Tier 3 clues. Only access-granting values count as credentials.

## Step H1.5: Resolve Uncertain Scope

Before H2 or any content scan, classify uncertain files autonomously from task goal, ownership, and intended consumer. Preserve and exclude low-confidence files without asking. Under preview intent, list these exclusions with a brief reason. Ask for scope clarification only if conservative exclusion would prevent completion of an explicit user request.

## Step H2: Leakage Candidate Detection

Scan only eligible inventory files using the loaded leakage categories and any user-specified targets. With fresh-context sub-agent intent, including `use-subagent`, use its candidate list as detection evidence; the main agent still performs credential scanning, purge classification, tiering, and every later decision.

| Tier | Finding |
|------|---------|
| 0 | Secrets or credentials; always first and prominent |
| 1 | Step 2 purge candidates |
| 2 | Inline leakage or user-target matches in otherwise useful files |
| 3 | Session clues that may have propagated into files |

## Step H3: Present Findings (HITL)

For zero findings, including an empty inventory, say **"No AI leakage found in files created or modified in the current session."** If user targets were supplied, include **"or user-specified content"** in that message.

Otherwise present Tier 0 first. Whenever credentials were found, include the outcome-neutral Step 1 rotation warning here, regardless of any later selection. It makes no claim about whether credentials have been removed and is not repeated in H4.

Under preview intent, show per-file would-delete/would-clean findings and Tier 3 concerns, then stop. Do not offer execution choices or request cleanup or deletion confirmation.

Without preview intent, present per-file delete/clean choices, Tier 3 concerns, `Hide everything found`, and `Nothing`. Use the runtime input mechanism or plain text and wait for explicit selection before H4.

## Step H4: Execute User Choices

Preview requests never reach H4. If the user selects `Nothing`, leave every file unchanged and stop; the credential warning has already been shown when applicable. Otherwise delete only after explicit confirmation; deletion ignores the requested output mode. Clean selected files with Steps 0-4 and the chosen output mode. Stay silent afterward except for required warnings.
