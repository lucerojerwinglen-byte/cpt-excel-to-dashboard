# CPT Excel-to-Dashboard (Public)

## What this is

A public, fully client-side fork of the CPT Excel-to-Dashboard. The user
uploads the Sagiease CPT export (.xlsx) and the entire Excel→dashboard
pipeline runs in their browser -- no backend, no server, the file never
leaves the machine. Built so leadership can generate and share the
dashboard without needing the private source data repo or a Python
environment.

Sagiease is the CPT system of record -- cases are *received* there, which is
where this export comes from. Workday is a separate system where those
cases get *processed* afterward. Don't "fix" the export name back to
Workday -- it's not a typo, it's the correct source system.

**Live:** https://cpt-excel-to-dashboard.jerwinlucero.workers.dev/
**Deploy:** Cloudflare Workers Builds via its own GitHub Git integration
(configured in the Cloudflare dashboard, not a GitHub Actions workflow) --
push to `main` and Cloudflare runs `npm run build` then `npx wrangler
deploy`, publishing the static assets described by `wrangler.jsonc`
(`assets.directory: ./dist`). Non-`main` branches get their own preview
deploy via `npx wrangler versions upload`. Moved off GitHub Pages because
`*.github.io` is blocked on the target company network.

This repo is a sibling of a private project ("CPT Data Analysis Project" /
`cpt-performance-dashboard`) that builds the same dashboard at build-time
from a Python/pandas pipeline against a richer, privately-held Excel file.
That project is reference-only for this one -- its chart components,
`selectors.ts`, and design tokens were copied here verbatim; nothing is
synced automatically between the two repos. If you need to port a fix or
feature from one to the other, do it by hand.

## Architecture

- Same dashboard UI, charts, and `src/data/selectors.ts` as the private
  project, **unchanged** -- they operate on the same `DashboardData` JSON
  shape regardless of whether it came from a build-time Python script or
  an in-browser upload.
- `src/data/transformExcel.ts` is a hand-written TypeScript port of the
  private project's `build_dashboard.py` (pandas transform). It reads the
  uploaded workbook via SheetJS (`xlsx` package) and reproduces the same
  column derivations, lookups, and meta statistics.
- `src/data/loadData.ts` and `src/data/provenance.ts` hold their data as
  runtime-populated `let` exports (not build-time `const`s) set once via
  `setDashboardData()` after upload, relying on ESM live bindings so every
  consumer (selectors, charts) sees real data without any of them needing
  to change.
- `src/data/roster.ts` is the CPT team roster (name → team → tenure),
  committed as **plain public source** -- real employee names and hire
  dates are visible in the deployed bundle to anyone with the link. This
  was a deliberate, explicitly-confirmed tradeoff: injecting it privately
  at build time would give zero actual privacy benefit, since anything the
  client-side bundle needs at runtime is visible in devtools regardless of
  whether the source was public or privately injected. Don't try to "fix"
  this by hiding the file from git without re-confirming with the user --
  it doesn't solve the underlying exposure and just adds build complexity.
- `src/upload/downloadStandalone.ts` lets a user download the
  currently-loaded dashboard as one self-contained HTML file (data baked
  in via `window.__EMBEDDED_DASHBOARD_DATA__`) to share manually. Only
  produces a truly standalone file against the **production build** --
  `vite-plugin-singlefile` inlines all JS/CSS into `index.html` at build
  time, so `vite dev` doesn't have anything to clone into a working
  offline file.

## Two real bugs already found and fixed here -- don't reintroduce them

Both were caught by diffing this port's output field-by-field against the
canonical Python-built `dashboard_data.json` for the same source file.

1. **SheetJS's `cellDates: true` decodes Excel date serials using the
   host machine's local timezone, not UTC.** Verified empirically: on a
   UTC+8 machine it silently produced timestamps 8h off from the correct,
   timezone-independent value. Since this transform runs in whoever's
   browser opens the app, "host machine" means the *uploader's* OS
   timezone -- `cellDates` would make every timestamp wrong for anyone not
   in UTC+8. Fixed by reading raw numeric serials and converting via
   `XLSX.SSF.parse_date_code()` + `Date.UTC()` instead, which is
   timezone-independent. **Never re-add `cellDates: true` to the
   `XLSX.read()` call in `transformExcel.ts`.**
2. **This Workday export encodes blank cells as the literal text `"NULL"`**,
   not as empty/absent cells. Pandas' `read_excel` silently converts this
   (and other sentinels like `"NA"`, `"N/A"`, `"None"`) to `NaN` via its
   default `na_values` list; SheetJS has no equivalent. Every "is this
   blank" check in `transformExcel.ts` goes through the shared `isBlank()`
   helper for this reason -- don't replace it with a raw `== null` check.

## `xlsx` dependency pin

`package.json` pins `"xlsx"` to a SheetJS CDN tarball URL
(`https://cdn.sheetjs.com/xlsx-0.20.3/xlsx-0.20.3.tgz`), not a semver
range. The npm-registry `xlsx` package has an unfixed prototype-pollution
/ ReDoS advisory (GHSA-4r6h-8v6p-xvw6, GHSA-5pgg-2g8v-p4x9) -- SheetJS
only publishes patched builds via their own CDN now. Keep using their CDN
URL when bumping this dependency, not `npm install xlsx@latest`.

## Development

```bash
npm install
npm run dev       # dev server
npx tsc -b        # type-check
npm run build     # production build -> dist/index.html (single self-contained file)
npm run preview   # serve the production build locally, for testing downloadStandalone.ts
```

There's no test suite. When changing `transformExcel.ts`, verify against
the real source file by building, uploading it via `npm run preview`, and
spot-checking KPI numbers -- or compare against the private repo's
`dashboard_data.json` meta fields if you have access to that repo.

## Claude Code skills

`.claude/skills/` and `.agents/skills/` are gitignored (local-only,
reconstructable from `skills-lock.json`) -- they won't come back on a
fresh `git clone` on a different machine. If skills are missing after a
fresh clone, re-run whatever tool originally installed them against
`skills-lock.json`.
