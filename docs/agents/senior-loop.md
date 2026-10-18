# Senior Loop — working agreement

This file governs how you (the coding agent) work in this repo. It applies to
every session. If a request in chat conflicts with something here, say so before
proceeding.

The person you work with is deliberately building senior-engineer habits.
Optimising for their speed today at the cost of their understanding is a
failure, not a favour.

---

## Session start protocol

Do this before anything else, every session, including after `/clear`:

1. Read `CONTEXT.md` and the ADR index (`docs/adr/README.md`), then only the
   glossary files and ADRs for the area being touched.
2. Read the open spec and tickets on the issue tracker.
3. State in one short paragraph: what this project is, which ticket is current,
   and what its acceptance check is.
4. Wait. Do not begin work off the back of orientation.

Never re-derive a decision that is already written down. If a written decision
now looks wrong, raise it as a decision to revisit — do not quietly implement
something different.

---

## The chain

| Stage | Skill | Produces | Lands in |
|---|---|---|---|
| Interrogate | `/grill-with-docs` | Resolved design, sharpened vocabulary | `CONTEXT.md`, ADRs |
| Specify | `/to-spec` | The spec / PRD | Issue tracker |
| Slice | `/to-tickets` | Phased tickets with blocking edges | Issue tracker |
| Build | `/implement` | Code, driving `/tdd`, closing with `/code-review` | The repo |

Rules for the chain:

- Never skip a stage. In particular, never move from grilling straight to code.
- Do **not** `/clear` or compact between `/to-spec` and `/to-tickets`. Run them
  in the same context window or the spec has to be re-fetched and can truncate.
- Once tickets exist, `/clear` between them is encouraged. The tickets are the
  state; the transcript is not.
- Work **one ticket at a time**. Finish, prove, stop, wait for approval.

---

## Standing rules

### Scope

- Implement the current ticket only. If you find yourself editing a file the
  ticket did not call for, stop and ask.
- Do not refactor, rename, reformat, or clean up code you were not asked to
  touch. Record it as a suggestion instead.
- Do not add a dependency without asking. Name what it costs and what the
  no-dependency version would look like.

### Tests

- Every ticket ships with an automated check. Write it before the
  implementation where the shape of the code allows, and show it failing first.
  A test that has never failed proves nothing.
- Never weaken, skip, mock around, or delete a test to make something pass. If a
  test fails and the test is right, the code is wrong. If the test is wrong, say
  so explicitly and get agreement before touching it.
- Never fabricate test output. Paste what actually ran.
- If a check genuinely cannot be automated — real browser rendering, visual
  layout — say why in one sentence, then write a numbered manual checklist that
  takes under two minutes to walk. Manual is the exception and needs a reason
  each time.
- If this repo has no test runner, propose the smallest setup that fits the
  stack before the first ticket. Smallest means one command, no config sprawl.

### Debugging

- Two failed fix attempts on the same bug is the limit. Do not attempt a third
  patch. Stop, state the hypothesis, and switch to a diagnosis loop: reproduce
  reliably, minimise, instrument, then fix.
- Never resolve a failure with a fallback value, a default, or a `try/catch`
  that swallows the error. Failures must stay loud.

### Communication

- After each ticket, explain the diff in plain English for someone who can read
  code but would not yet have written it. What changed, why, what you rejected.
- Name trade-offs unprompted. "I used X rather than Y because Z" is required.
- If a request will cause a problem later, say so before doing it. Fast
  agreement is not helpfulness.
- Never call a ticket done while a check is failing, unwritten, or unrun.

### Version control

**Never commit real data.** Company exports, production dumps, anything with
real names, employee IDs, or case records stays out of the repo permanently.
Sample or anonymised fixtures only. If you are about to stage a data file, stop
and ask. Deleting it in a later commit does not remove it from history.

Never commit secrets, API keys, `.env` files, or credentials. If one has already
been committed, say so immediately — rotating the key matters more than removing
the file.

**Branch per ticket.** Before `/implement`, the working branch is
`ticket-<n>-<short-slug>`, cut from an up-to-date main branch. Main always works.
If the ticket goes wrong, the branch gets deleted rather than untangled.

Two sibling tickets both cut from main before either merges, and both touching
the same file, will conflict at merge time even though neither branch did
anything wrong. Resolve it like any merge conflict, re-run the full suite, and
don't treat the second-merging branch as at fault.

**One commit per ticket**, in the form `<type>: <what changed> (#<ticket>)` —
`feat`, `fix`, `refactor`, `test`, `chore`. The message says what changed and
why, not which files were touched; the diff already says that.

**Merge through a pull request**, even solo, with `Closes #<ticket>` in the body.
Run `/code-review` against the diff before opening it. The PR is the human's
diff-reading surface — do not bypass it to save a step.

Operational rules:

- Propose commit messages and branch names; do not run `git commit`, `git push`,
  or `git merge` unless explicitly asked. The human runs those.
- Expect a clean tree before each ticket. If it is dirty when one begins, flag it
  and stop.
- Never rewrite published history — no `push --force`, no rebase of anything
  already pushed — unless asked directly and told why.
- Keep `.gitignore` current. Build output, dependencies, local env files, and
  any data directory belong in it from the first commit.

---

## Drift check

If three tickets pass in a row with no failing test shown first, no trade-off
named, and no diff explained, the agreement has stopped being followed. Say so.
