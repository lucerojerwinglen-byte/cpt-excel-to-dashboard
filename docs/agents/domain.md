# Domain Docs

How agents should use this repo's domain documentation.

## Before exploring, read these

1. **`CONTEXT.md`** at the repo root: the project in one paragraph plus its glossary. If
   it has a **Glossary map**, read only the `docs/context/<area>.md` files for the area
   you're working in.
2. **`docs/adr/README.md`**: the ADR index, one line per decision. Read it, then open
   only the ADRs that touch your area. Skip ones marked SUPERSEDED or RETIRED unless you
   need the history.

If any of these don't exist yet, proceed silently; they get created when terms or
decisions actually get resolved.

## Keeping them current

- New term → add it to `CONTEXT.md` (or its area file), with an `_Avoid_:` line for
  synonyms the project doesn't use.
- New decision → new `docs/adr/NNNN-<slug>.md` **and** one line in `docs/adr/README.md`
  (`- [NNNN](file.md) — gist — status`). A decision that replaces an older one marks the
  old line `SUPERSEDED by NNNN`.
- When `CONTEXT.md` grows past ~15 KB with several separate areas, split each area into
  `docs/context/<area>.md` and leave a Glossary map in `CONTEXT.md`.

## Use the glossary's vocabulary

When your output names a domain concept (an issue title, a test name, a proposal), use the
term as the glossary defines it. If the concept isn't there yet, either you're inventing
language the project doesn't use (reconsider) or there's a real gap (add it).

## Flag ADR conflicts

If your output contradicts an existing ADR, say so explicitly rather than silently
overriding it:

> _Contradicts ADR-0003 (region derived from owner) — but worth reopening because…_
