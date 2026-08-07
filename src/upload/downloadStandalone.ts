import type { DashboardData } from "../data/types";

export type EmbeddedPayload = { data: DashboardData; unrecognizedMembers: string[] };

/** Marker attribute on the injected data <script>, so re-downloading after
 * loading a previously-downloaded file doesn't stack duplicate tags. */
const MARKER_ATTR = "data-embedded-dashboard-data";

/** Global the embedded script sets, checked by App.tsx on startup so a
 * previously-downloaded (or newly opened-in-a-tab) standalone document opens
 * straight into the dashboard instead of prompting for another upload. */
export function getEmbeddedDashboardData(): EmbeddedPayload | null {
  const w = window as unknown as { __EMBEDDED_DASHBOARD_DATA__?: EmbeddedPayload };
  return w.__EMBEDDED_DASHBOARD_DATA__ ?? null;
}

/** Builds a self-contained HTML document with this session's parsed data
 * baked in, so opening it -- as a download or a new tab -- shows the
 * finished dashboard directly, no re-upload, no server.
 *
 * Only produces a truly standalone document when running the production
 * build (vite-plugin-singlefile inlines all JS/CSS into index.html at build
 * time, so document.documentElement already contains the full bundle to
 * clone). In `vite dev`, the page is served unbundled -- test this against
 * `npm run build` + `npm run preview`, not `npm run dev`. */
function buildStandaloneHtml(payload: EmbeddedPayload): string {
  const docClone = document.documentElement.cloneNode(true) as HTMLElement;
  docClone.querySelectorAll(`script[${MARKER_ATTR}]`).forEach((el) => el.remove());

  const dataScript = document.createElement("script");
  dataScript.setAttribute(MARKER_ATTR, "true");
  dataScript.textContent = `window.__EMBEDDED_DASHBOARD_DATA__=${JSON.stringify(payload)};`;
  docClone.querySelector("head")?.appendChild(dataScript);

  return "<!doctype html>\n" + docClone.outerHTML;
}

/** Downloads the currently-running page as a self-contained HTML file with
 * this session's parsed data baked in, so the recipient opens it and sees
 * the finished dashboard directly. */
export function downloadStandaloneHtml(data: DashboardData, unrecognizedMembers: string[]): void {
  const html = buildStandaloneHtml({ data, unrecognizedMembers });
  const blob = new Blob([html], { type: "text/html" });
  const url = URL.createObjectURL(blob);

  const stamp = new Date().toISOString().slice(0, 10);
  const a = document.createElement("a");
  a.href = url;
  a.download = `CPT-Excel-to-Dashboard-${stamp}.html`;
  document.body.appendChild(a);
  a.click();
  a.remove();
  URL.revokeObjectURL(url);
}

/** Opens the generated dashboard in a new tab instead of replacing the
 * current one, so the upload screen stays available for the next file. Must
 * be called synchronously from a user gesture (e.g. a button's onClick) --
 * browsers block window.open() calls that happen after an await. Returns
 * null if the browser blocked the popup anyway, so the caller can show a
 * fallback instead of silently doing nothing. */
export function openStandaloneInNewTab(data: DashboardData, unrecognizedMembers: string[]): Window | null {
  const html = buildStandaloneHtml({ data, unrecognizedMembers });
  const blob = new Blob([html], { type: "text/html" });
  const url = URL.createObjectURL(blob);
  const win = window.open(url, "_blank");
  // Delay the revoke so the new tab has time to load the blob URL first.
  setTimeout(() => URL.revokeObjectURL(url), 30_000);
  return win;
}
