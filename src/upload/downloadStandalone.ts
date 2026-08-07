import type { DashboardData } from "../data/types";

/** Marker attribute on the injected data <script>, so re-downloading after
 * loading a previously-downloaded file doesn't stack duplicate tags. */
const MARKER_ATTR = "data-embedded-dashboard-data";

/** Global the embedded script sets, checked by main.tsx on startup so a
 * previously-downloaded standalone file opens straight into the dashboard
 * instead of prompting for another upload. */
export function getEmbeddedDashboardData(): DashboardData | null {
  const w = window as unknown as { __EMBEDDED_DASHBOARD_DATA__?: DashboardData };
  return w.__EMBEDDED_DASHBOARD_DATA__ ?? null;
}

/** Downloads the currently-running page as a self-contained HTML file with
 * this session's parsed data baked in, so the recipient opens it and sees
 * the finished dashboard directly -- no re-upload, no server.
 *
 * Only produces a truly standalone file when running the production build
 * (vite-plugin-singlefile inlines all JS/CSS into index.html at build time,
 * so document.documentElement already contains the full bundle to clone).
 * In `vite dev`, the page is served unbundled, so a "download" here would
 * just capture <script src="/src/main.tsx"> references that don't resolve
 * outside the dev server -- test this feature against `npm run build` +
 * `npm run preview`, not `npm run dev`. */
export function downloadStandaloneHtml(data: DashboardData): void {
  const docClone = document.documentElement.cloneNode(true) as HTMLElement;
  docClone.querySelectorAll(`script[${MARKER_ATTR}]`).forEach((el) => el.remove());

  const dataScript = document.createElement("script");
  dataScript.setAttribute(MARKER_ATTR, "true");
  dataScript.textContent = `window.__EMBEDDED_DASHBOARD_DATA__=${JSON.stringify(data)};`;
  docClone.querySelector("head")?.appendChild(dataScript);

  const html = "<!doctype html>\n" + docClone.outerHTML;
  const blob = new Blob([html], { type: "text/html" });
  const url = URL.createObjectURL(blob);

  const stamp = new Date().toISOString().slice(0, 10);
  const a = document.createElement("a");
  a.href = url;
  a.download = `CPT-Performance-Dashboard-${stamp}.html`;
  document.body.appendChild(a);
  a.click();
  a.remove();
  URL.revokeObjectURL(url);
}
