import { useCallback, useRef, useState } from "react";
import {
  FileSpreadsheet,
  Upload,
  AlertTriangle,
  Loader2,
  ShieldCheck,
  LayoutDashboard,
  CheckCircle2,
  ExternalLink,
} from "lucide-react";
import { validateWorkbook } from "../data/validateWorkbook";
import { transformWorkbook } from "../data/transformExcel";
import { openStandaloneInNewTab } from "./downloadStandalone";
import type { DashboardData } from "../data/types";
import sagilityLogo from "../assets/sagility-logo-white.png";

type Stage = "idle" | "working" | "ready" | "error";

export function UploadScreen() {
  const [stage, setStage] = useState<Stage>("idle");
  const [error, setError] = useState<string | null>(null);
  const [dragOver, setDragOver] = useState(false);
  const [ready, setReady] = useState<{ data: DashboardData; unrecognizedMembers: string[] } | null>(null);
  const [popupBlocked, setPopupBlocked] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  const handleFile = useCallback(async (file: File) => {
    setStage("working");
    setError(null);
    setPopupBlocked(false);
    const validation = await validateWorkbook(file);
    if (!validation.ok) {
      setError(validation.message);
      setStage("error");
      return;
    }
    try {
      const { data, unrecognizedMembers } = await transformWorkbook(file);
      setReady({ data, unrecognizedMembers });
      setStage("ready");
    } catch (e) {
      setError(`Something went wrong while reading this file: ${e instanceof Error ? e.message : String(e)}`);
      setStage("error");
    }
  }, []);

  // Must run synchronously inside the click handler -- window.open() called
  // after an await gets silently blocked by most browsers.
  const handleOpen = useCallback(() => {
    if (!ready) return;
    const win = openStandaloneInNewTab(ready.data, ready.unrecognizedMembers);
    if (!win) {
      setPopupBlocked(true);
      return;
    }
    setPopupBlocked(false);
    setReady(null);
    setStage("idle");
  }, [ready]);

  return (
    <div className="relative flex min-h-screen items-center justify-center overflow-hidden bg-brand-green-900 p-6">
      <div className="pointer-events-none absolute -top-40 left-1/2 h-[28rem] w-[36rem] -translate-x-1/2 rounded-full bg-brand-green-400 opacity-20 blur-[100px]" />
      <div className="pointer-events-none absolute -bottom-32 -right-24 h-80 w-80 rounded-full bg-brand-green-200 opacity-10 blur-[100px]" />

      <div className="relative w-full max-w-xl space-y-6">
        <div className="flex flex-col items-center text-center">
          <img src={sagilityLogo} alt="Sagility" className="h-24 w-auto" />
          <h1 className="mt-5 text-2xl font-medium text-brand-green-50">CPT Excel-to-Dashboard</h1>
          <p className="mt-2 text-sm text-brand-green-200">
            Upload the Sagiease CPT export (.xlsx) to generate the dashboard. Nothing leaves your browser --
            the file is processed locally and never uploaded to any server.
          </p>
        </div>

        {stage === "ready" ? (
          <div className="flex flex-col items-center gap-3 rounded-2xl border-2 border-brand-green-400/40 bg-brand-green-400/5 p-12 text-center">
            <CheckCircle2 className="h-10 w-10 text-brand-green-400" />
            <div className="text-sm text-brand-green-50">Dashboard ready</div>
            <p className="text-xs text-brand-green-200/70">
              Opens in a new tab, so this screen stays ready for your next file.
            </p>
            <button
              onClick={handleOpen}
              className="mt-2 flex items-center gap-1.5 rounded-lg bg-brand-green-400 px-4 py-2 text-sm font-medium text-brand-green-900 transition-colors hover:bg-brand-green-200"
            >
              <ExternalLink className="h-4 w-4" />
              Open Dashboard in New Tab
            </button>
            {popupBlocked && (
              <p className="animate-fade-slide-in mt-1 text-xs text-status-warning">
                Your browser blocked the popup -- allow popups for this site, then try again.
              </p>
            )}
          </div>
        ) : (
          <div
            onDragOver={(e) => {
              e.preventDefault();
              setDragOver(true);
            }}
            onDragLeave={() => setDragOver(false)}
            onDrop={(e) => {
              e.preventDefault();
              setDragOver(false);
              const file = e.dataTransfer.files?.[0];
              if (file) void handleFile(file);
            }}
            onClick={() => inputRef.current?.click()}
            className={`flex cursor-pointer flex-col items-center gap-3 rounded-2xl border-2 border-dashed p-12 text-center transition-all duration-200 ${
              dragOver
                ? "scale-[1.01] border-brand-green-400 bg-brand-green-400/10"
                : "border-brand-green-200/30 bg-brand-green-50/[0.02] hover:border-brand-green-200/60 hover:bg-brand-green-50/[0.04]"
            }`}
          >
            {stage === "working" ? (
              <Loader2 className="h-10 w-10 animate-spin text-brand-green-400" />
            ) : (
              <Upload className="h-10 w-10 text-brand-green-200 transition-transform duration-200" />
            )}
            <div className="text-sm text-brand-green-50">
              {stage === "working" ? "Reading workbook..." : "Drop the Excel file here, or click to browse"}
            </div>
            <div className="flex items-center gap-1.5 text-xs text-brand-green-200/70">
              <FileSpreadsheet className="h-3.5 w-3.5" />
              Expects a "Raw Data" sheet from the Sagiease CPT export
            </div>
            <input
              ref={inputRef}
              type="file"
              accept=".xlsx"
              className="hidden"
              onChange={(e) => {
                const file = e.target.files?.[0];
                if (file) void handleFile(file);
                e.target.value = "";
              }}
            />
          </div>
        )}

        {error && (
          <div className="animate-fade-slide-in flex items-start gap-2 rounded-xl border border-status-warning/40 bg-status-warning/10 p-4 text-sm text-brand-green-50">
            <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0 text-status-warning" />
            <span>{error}</span>
          </div>
        )}

        <div className="flex items-center justify-center gap-4 text-xs text-brand-green-200/60">
          <span className="flex items-center gap-1.5">
            <Upload className="h-3.5 w-3.5" />
            Upload
          </span>
          <span className="h-px w-4 bg-brand-green-200/20" />
          <span className="flex items-center gap-1.5">
            <ShieldCheck className="h-3.5 w-3.5" />
            Processed locally
          </span>
          <span className="h-px w-4 bg-brand-green-200/20" />
          <span className="flex items-center gap-1.5">
            <LayoutDashboard className="h-3.5 w-3.5" />
            Dashboard opens
          </span>
        </div>
      </div>
    </div>
  );
}
