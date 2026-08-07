import * as XLSX from "xlsx";
import { REQUIRED_SHEET, REQUIRED_COLUMNS } from "./transformExcel";

export type ValidationResult = { ok: true } | { ok: false; message: string };

/** Cheap pre-check before running the full transform: confirms this is the
 * right workbook (expected sheet + columns present) so a wrong file gets a
 * clear, human-readable error instead of a cryptic JS exception mid-parse. */
export async function validateWorkbook(file: File): Promise<ValidationResult> {
  if (!/\.xlsx$/i.test(file.name)) {
    return { ok: false, message: `"${file.name}" isn't an .xlsx file. Please upload the Workday CPT export.` };
  }

  let workbook: XLSX.WorkBook;
  try {
    const buffer = await file.arrayBuffer();
    // sheetRows: 1 -- only the header row is needed to validate, no reason
    // to parse the full workbook twice (once here, once in transformWorkbook).
    workbook = XLSX.read(buffer, { sheetRows: 1 });
  } catch {
    return { ok: false, message: `Couldn't read "${file.name}" as an Excel workbook -- the file may be corrupted or not a real .xlsx.` };
  }

  if (!workbook.SheetNames.includes(REQUIRED_SHEET)) {
    return {
      ok: false,
      message: `This workbook has no "${REQUIRED_SHEET}" sheet (found: ${workbook.SheetNames.join(", ") || "none"}). Please upload the Workday CPT export.`,
    };
  }

  const sheet = workbook.Sheets[REQUIRED_SHEET];
  const [headerRow] = XLSX.utils.sheet_to_json<string[]>(sheet, { header: 1, range: 0 });
  const present = new Set((headerRow ?? []).map((h) => String(h).trim()));
  const missing = REQUIRED_COLUMNS.filter((c) => !present.has(c));

  if (missing.length > 0) {
    return {
      ok: false,
      message: `"${REQUIRED_SHEET}" is missing expected column${missing.length > 1 ? "s" : ""}: ${missing.join(", ")}. Please upload the Workday CPT export.`,
    };
  }

  return { ok: true };
}
