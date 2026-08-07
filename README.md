# CPT Excel-to-Dashboard (Public)

A public, client-side build of the CPT Excel-to-Dashboard. Upload the
Sagiease CPT export (.xlsx) and the whole Excel-to-dashboard pipeline runs
entirely in your browser -- the file never leaves your machine, there's no
backend, and nothing is uploaded anywhere.

This is a sibling of the private, build-time dashboard maintained elsewhere;
it reimplements that project's chart components, selectors, and data
transform logic for a upload-driven, statically-hosted deployment (GitHub
Pages). See `src/data/transformExcel.ts` for the in-browser port of the
original Python/pandas transform.

## Data privacy note

The CPT roster (name -> team -> tenure) is committed directly in
`src/data/roster.ts` and ships in the public deployed bundle -- real
employee names and hire dates are visible to anyone with the link. This is
a deliberate tradeoff for simplicity over a private per-session roster
upload; see that file's header comment for the reasoning.

## Development

```bash
npm install
npm run dev      # dev server
npm run build    # production build -> dist/index.html (single self-contained file)
npm run preview  # serve the production build locally
```

## Deployment

Pushes to `main` build and deploy `dist/` to GitHub Pages via
`.github/workflows/deploy.yml`.
