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

## One-sitting mode

For a feature that is one coherent unit, the unit of work may be "one feature" instead of
"one small ticket", via `/one-sitting`. It is a size choice, not a shortcut: every rule
below still applies, and the feature is still exactly one ticket on the tracker.

- **Plan checkpoint first.** Restate the feature, list files, write one automated check per
  acceptance criterion, state what is out of scope, then wait for approval.
- **Size check.** Stop and slice into tickets (or write an ADR first) if the work changes
  the schema or adds a migration, touches auth/login/roster/shared code, spans more than
  ~8 files or a diff too long to read carefully, or hinges on an undecided design question.
- **Git inside the sitting.** Local commits on the ticket branch, one per step, each after
  its check was seen failing and then passing; then a plain push of that branch and
  opening the PR, per the allowed list under Version control. Merging stays with the
  human, and deploying is never covered.
- **Same ending as any ticket:** `/code-review`, plain-English diff explanation, named
  trade-offs, then stop.

If the diff stops being readable in one pass, that is the signal to go back to tickets.

---

## Standing rules

### Scope

- Implement the current ticket only. If you find yourself editing a file the
  ticket did not call for, stop and ask.
- Do not refactor, rename, reformat, or clean up code you were not asked to
  touch. Record it as a suggestion instead.
- Do not add a dependency without asking. Name what it costs and what the
  no-dependency version would look like.

### Smallest change that fully works

Be lazy about the solution, never about the ticket. Before writing code, take the
first rung of this ladder that works completely:

1. Does it need to exist? If the need is already met, say so and stop.
2. Does this repo already have a helper or pattern? Reuse it.
3. Does the language, standard library or platform already do it?
4. Does an already-installed dependency do it? (A new one still needs asking.)
5. Can it be one readable line?
6. Otherwise, write the minimum code, with no options or abstractions "for later".

Never cut: validation at trust boundaries, error handling that prevents data loss,
security, accessibility, or anything the ticket explicitly asks for. For a bug, grep
every caller first and fix the root cause once. When you knowingly cut a corner, leave
`shortcut: <limit>, <when to upgrade>` in the code. End each ticket explanation with one
or two lines on what was skipped or left unchecked. (Adapted from Ponytail,
github.com/DietrichGebert/ponytail, MIT.)

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

- **Allowed without asking, on the ticket branch only:** `git status`, `diff`, `log`,
  `switch -c ticket-<n>-<slug>`, `add` (never staging data files or secrets, see above),
  `commit`, `git push -u origin ticket-<n>-<slug>` (plain push, no force), and opening a
  pull request for that branch with `Closes #<n>`. Show the commit message and PR text
  in chat as you go.
- **Ask first, every time:** `git merge` or merging a PR, `git pull`/`rebase` onto the
  ticket branch when it would rewrite commits, `git stash`, `git reset`, `git checkout --`
  or anything that discards uncommitted work, deleting any branch (local or remote), and
  creating tags or releases.
- **Never, unless told directly and given a reason:** `git push --force` (or
  `--force-with-lease`), pushing to `main`, rewriting published history, `git commit
  --amend` on a pushed commit, `--no-verify`, and any deploy.
- **Deploys are always the human's decision.** Not covered by any permission above, by
  `/one-sitting`, or by a green PR. This includes `wrangler deploy`, migrations against
  the production or demo D1 databases, and anything in `docs/agents/deploy.md`.
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
