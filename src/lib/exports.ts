import * as XLSX from "xlsx";
import jsPDF from "jspdf";
import { registerPdfArabicFont } from "@/lib/pdf";

export function rowsToExcelBuffer<T extends Record<string, unknown>>(rows: T[], sheetName = "Report") {
  const workbook = XLSX.utils.book_new();
  const sheet = XLSX.utils.json_to_sheet(rows);
  XLSX.utils.book_append_sheet(workbook, sheet, sheetName);
  return XLSX.write(workbook, { type: "buffer", bookType: "xlsx" }) as Buffer;
}

export function rowsToPdfBuffer(title: string, rows: Record<string, unknown>[]) {
  const doc = new jsPDF({ orientation: "landscape", unit: "mm", format: "a4", putOnlyUsedFonts: true });
  const arabicFont = registerPdfArabicFont(doc);
  doc.setFont("helvetica", "bold");
  doc.setFontSize(16);
  doc.text(title, 14, 18);
  doc.setFont("helvetica", "normal");
  doc.setFontSize(8);

  if (!rows.length) {
    doc.text("No data available", 14, 30);
    return Buffer.from(doc.output("arraybuffer"));
  }

  const columns = Object.keys(rows[0]);
  const printableWidth = 267;
  const columnWidth = printableWidth / Math.max(columns.length, 1);
  let y = 29;

  const drawHeader = () => {
    doc.setFont("helvetica", "bold");
    columns.forEach((column, index) => {
      doc.text(doc.splitTextToSize(column, columnWidth - 3)[0] ?? "", 14 + index * columnWidth, y);
    });
    doc.line(14, y + 2, 281, y + 2);
    doc.setFont("helvetica", "normal");
    y += 7;
  };

  drawHeader();
  rows.forEach((row) => {
    if (y > 190) {
      doc.addPage("a4", "landscape");
      y = 18;
      drawHeader();
    }
    columns.forEach((column, index) => {
      const value = String(row[column] ?? "").replace(/\s+/g, " ");
      const line = doc.splitTextToSize(value, columnWidth - 3)[0] ?? "";
      if (/[\u0600-\u06ff]/.test(line)) {
        doc.setFont(arabicFont.fontName, "normal");
        doc.text(arabicFont.process(line), 14 + (index + 1) * columnWidth - 3, y, { align: "right", maxWidth: columnWidth - 3 });
        doc.setFont("helvetica", "normal");
      } else {
        doc.text(line, 14 + index * columnWidth, y);
      }
    });
    y += 6;
  });

  return Buffer.from(doc.output("arraybuffer"));
}
