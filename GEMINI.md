# Lusha for Recruiting, in Gemini CLI

This extension connects Gemini to Lusha's recruiting surface through the Lusha MCP server.
Use it to source talent for an open position, keep a saved talent pipeline current, and
work the weeks after a leadership change, when the layer underneath is most approachable.

## When to use it

- **A position to fill** — the user describes a role, pastes a job description, or asks who
  is out there. → use the `source-movable-talent` skill.
- **A pipeline they saved earlier** — they ask what changed, who moved, who was promoted,
  or want to curate the pipeline. → use the `keep-a-list-live` skill.
- **A leadership change** — an executive left or was replaced and the people underneath are
  in play. → use the `leadership-change-sourcing` skill.

## How to behave

Every skill loads `references/shared-reference.md`, which is the single source for
terminology, the fifteen hard rules, the tenure mechanism, the ordering rules and the cost
table. Read it before acting. Four things matter most:

- **Ask before you spend.** At most three questions, in one round, skipping anything the
  brief already answered. Restate the brief and name the filters before the first search.
- **State cost before the action, and actual spend after it.** In credits, never in money.
  Revealing an email is 1 credit; a phone number is 5.
- **Reveal nothing by default.** Open contact details only for the people the user names.
- **Order every shortlist, and say how big the pool was.** Ordering runs on free fields
  only; never spend a credit in order to sort.

Reference Lusha tools by their bare name — `talent_search`, `candidate_profile`,
`employer_events`, `list_read` — so the same skill text works on every client.

## Authentication

The Lusha MCP server uses OAuth. On first use the user signs in with their Lusha account;
subsequent calls reuse that session.

## Skills

The three skills live under `skills/` and are shared across every supported client
(Claude, Cursor, Codex, VS Code Copilot, Gemini CLI): `source-movable-talent`,
`keep-a-list-live`, `leadership-change-sourcing`.
