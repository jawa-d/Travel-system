import * as XLSX from "xlsx";
import { createCorporatePdf } from "@/lib/pdf";

export function rowsToExcelBuffer<T extends Record<string, unknown>>(rows: T[], sheetName = "Report") {
  const workbook = XLSX.utils.book_new();
  const sheet = XLSX.utils.json_to_sheet(rows);
  XLSX.utils.book_append_sheet(workbook, sheet, sheetName);
  return XLSX.write(workbook, { type: "buffer", bookType: "xlsx" }) as Buffer;
}

export async function rowsToPdfBuffer(title: string, rows: Record<string, unknown>[]) {
  const columns = rows.length ? Object.keys(rows[0]).slice(0, 6) : ["Status"];
  const printableRows = rows.length
    ? rows.slice(0, 120).map((row) => columns.map((column) => String(row[column] ?? "").replace(/\s+/g, " ").slice(0, 80)))
    : [["No data available"]];
  const doc = await createCorporatePdf({
    title,
    documentType: "Report",
    documentNumber: `REP-${new Date().toISOString().slice(0, 10).replace(/-/g, "")}`,
    generatedBy: "TRINSU System",
    qrPayload: { title, generatedAt: new Date().toISOString(), rows: rows.length },
    sections: [
      {
        title: "Report Summary",
        fields: [
          { label: "Report Title", value: title },
          { label: "Total Rows", value: rows.length },
          { label: "Generated Date", value: new Date().toISOString().slice(0, 10) },
          { label: "Export Format", value: "PDF" }
        ]
      }
    ],
    tables: [
      {
        title: "Report Data",
        columns,
        rows: printableRows,
        totals: [{ label: "Records", value: rows.length }]
      }
    ],
    terms: [
      "This report is generated from TRINSU operational records.",
      "Values are intended for internal review, regulatory support and authorized business reporting."
    ],
    approvalStatus: "GENERATED"
  });
  return Buffer.from(doc.output("arraybuffer"));
}
