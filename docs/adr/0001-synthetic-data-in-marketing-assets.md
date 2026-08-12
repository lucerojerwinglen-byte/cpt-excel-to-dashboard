# Marketing/demo videos use synthetic data, never the real roster

The live app deliberately ships real employee names and hire dates in
`src/data/roster.ts` — a confirmed tradeoff documented in `CLAUDE.md`,
made because hiding the file from git would give no real privacy benefit
(anything the client-side bundle needs at runtime is visible in devtools
regardless).

That reasoning does not carry over to promotional assets. A demo/ad video
is a new, higher-visibility distribution surface — it can be shared
externally, embedded in slide decks, or posted publicly, independent of
who can reach the deployed app itself. When generating video/screenshot
content for tutorials or ads (e.g. via Claude Design), always use
realistic-looking but entirely fictional names, numbers, and dates in any
dashboard/chart shots. Never reuse real roster or case data captured from
the live app.
