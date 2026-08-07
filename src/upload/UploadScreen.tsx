import { useCallback, useRef, useState } from "react";
import { FileSpreadsheet, Upload, AlertTriangle, Loader2 } from "lucide-react";
import { validateWorkbook } from "../data/validateWorkbook";
import { transformWorkbook } from "../data/transformExcel";
import type { DashboardData } from "../data/types";

type Stage = "idle" | "working" | "error";

export function UploadScreen({
  onLoaded,
}: {
  onLoaded: (data: DashboardData, unrecognizedMembers: string[]) => void;
}) {
  const [stage, setStage] = useState<Stage>("idle");
  const [error, setError] = useState<string | null>(null);
  const [dragOver, setDragOver] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  const handleFile = useCallback(
    async (file: File) => {
      setStage("working");
      setError(null);
      const validation = await validateWorkbook(file);
      if (!validation.ok) {
        setError(validation.message);
        setStage("error");
        return;
      }
      try {
        const { data, unrecognizedMembers } = await transformWorkbook(file);
        onLoaded(data, unrecognizedMembers);
      } catch (e) {
        setError(`Something went wrong while reading this file: ${e instanceof Error ? e.message : String(e)}`);
        setStage("error");
      }
    },
    [onLoaded],
  );

  return (
    <div className="flex min-h-screen items-center justify-center p-6">
      <div className="w-full max-w-xl space-y-6">
        <div className="text-center">
          <h1 className="text-2xl font-medium text-brand-green-50">CPT Performance Dashboard</h1>
          <p className="mt-2 text-sm text-brand-green-200">
            Upload the Workday CPT export (.xlsx) to generate the dashboard. Nothing leaves your browser --
            the file is processed locally and never uploaded to any server.
          </p>
        </div>

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
          className={`flex cursor-pointer flex-col items-center gap-3 rounded-2xl border-2 border-dashed p-12 text-center transition-colors ${
            dragOver ? "border-brand-green-400 bg-brand-green-400/10" : "border-brand-green-200/30 hover:border-brand-green-200/60"
          }`}
        >
          {stage === "working" ? (
            <Loader2 className="h-10 w-10 animate-spin text-brand-green-400" />
          ) : (
            <Upload className="h-10 w-10 text-brand-green-200" />
          )}
          <div className="text-sm text-brand-green-50">
            {stage === "working" ? "Reading workbook..." : "Drop the Excel file here, or click to browse"}
          </div>
          <div className="flex items-center gap-1.5 text-xs text-brand-green-200/70">
            <FileSpreadsheet className="h-3.5 w-3.5" />
            Expects a "Raw Data" sheet from the Workday CPT export
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

        {error && (
          <div className="flex items-start gap-2 rounded-xl border border-status-warning/40 bg-status-warning/10 p-4 text-sm text-brand-green-50">
            <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0 text-status-warning" />
            <span>{error}</span>
          </div>
        )}
      </div>
    </div>
  );
}
