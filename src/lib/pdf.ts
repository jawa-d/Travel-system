import { readFileSync } from "node:fs";
import { join } from "node:path";
import jsPDF from "jspdf";
import QRCode from "qrcode";
import { toEnglishDigits } from "@/lib/i18n";

const ENGLISH_FONT_NAME = "helvetica";
const NAVY = [41, 53, 69] as const;
const GOLD = [174, 143, 80] as const;
const LIGHT = [241, 236, 226] as const;
const BORDER = [216, 210, 197] as const;
const TEXT = [35, 43, 55] as const;
const MUTED = [101, 113, 130] as const;
const FOOTER_TEXT = [111, 121, 135] as const;
const FOOTER_LINE = [226, 232, 240] as const;
const COMPANY_NAME_EN = "Iraq Takaful Insurance Company";
const LOGO_FILE = "Screenshot 2026-06-22 194918.png";
let logoBase64: string | null = null;
const PDF_QR_OPTIONS = { margin: 2, width: 512, errorCorrectionLevel: "H" as const };
const FOOTER_TOP_Y = 276;
const CONTENT_BOTTOM_Y = 268;

type Locale = "ar" | "en";
type PdfField = { label: string; value?: string | number | null };
type PdfSection = { title: string; fields: PdfField[] };
type PdfTable = { title: string; columns: string[]; rows: Array<Array<string | number | null | undefined>>; totals?: PdfField[] };

type CorporatePdfInput = {
  title: string;
  documentNumber: string;
  documentType?: string;
  locale?: Locale;
  generatedBy?: string;
  issueDate?: string;
  customerName?: string;
  qrPayload?: Record<string, unknown> | string;
  sections?: PdfSection[];
  tables?: PdfTable[];
  terms?: string[];
  approvalStatus?: string;
};

function isArabicText(value: string) {
  return /[\u0600-\u06ff]/.test(value);
}

function processText(_doc: jsPDF, value: string) {
  return value;
}

function setFont(doc: jsPDF, _value: string, style: "normal" | "bold" = "normal") {
  doc.setFont(ENGLISH_FONT_NAME, style);
}

function text(doc: jsPDF, value: string, x: number, y: number, options: { maxWidth?: number; align?: "left" | "right" | "center"; size?: number; style?: "normal" | "bold"; color?: readonly number[]; lineHeightFactor?: number } = {}) {
  const displayValue = processText(doc, value);
  const color = options.color ?? TEXT;
  doc.setTextColor(color[0], color[1], color[2]);
  doc.setFontSize(options.size ?? 9);
  setFont(doc, value, options.style ?? "normal");
  doc.setR2L(false);
  doc.text(displayValue, x, y, {
    align: options.align ?? "left",
    maxWidth: options.maxWidth,
    isInputVisual: false,
    lineHeightFactor: options.lineHeightFactor ?? 1.2
  });
}

function splitText(doc: jsPDF, value: unknown, maxWidth: number, size = 9, style: "normal" | "bold" = "normal") {
  const normalized = safe(value);
  doc.setFont(ENGLISH_FONT_NAME, style);
  doc.setFontSize(size);
  return doc.splitTextToSize(normalized, maxWidth) as string[];
}

function safe(value: unknown) {
  if (value === null || value === undefined || value === "") return "-";
  const normalized = toEnglishDigits(String(value));
  return isArabicText(normalized) ? "-" : normalized;
}

function withOpacity(doc: jsPDF, opacity: number, draw: () => void) {
  const advancedDoc = doc as jsPDF & {
    GState?: new (options: { opacity: number; "stroke-opacity"?: number }) => unknown;
    setGState?: (state: unknown) => jsPDF;
  };

  if (!advancedDoc.GState || !advancedDoc.setGState) {
    draw();
    return;
  }

  advancedDoc.setGState(new advancedDoc.GState({ opacity, "stroke-opacity": opacity }));
  draw();
  advancedDoc.setGState(new advancedDoc.GState({ opacity: 1, "stroke-opacity": 1 }));
}

function drawPageWatermark(doc: jsPDF) {
  withOpacity(doc, 0.06, () => {
    doc.setTextColor(NAVY[0], NAVY[1], NAVY[2]);
    doc.setFont(ENGLISH_FONT_NAME, "bold");
    doc.setFontSize(30);
    doc.setR2L(false);
    doc.text(COMPANY_NAME_EN, 105, 149, { align: "center", angle: -38, isInputVisual: false });
  });
}

function drawOfficialLogo(doc: jsPDF, x: number, y: number, width: number) {
  logoBase64 ??= readFileSync(join(process.cwd(), "src", LOGO_FILE)).toString("base64");
  const imageHeight = 64;
  const imageWidth = imageHeight * (302 / 483);
  const imageX = x + (width - imageWidth) / 2;
  const imageY = y + 9 - imageHeight * (288 / 483);
  doc.addImage(`data:image/png;base64,${logoBase64}`, "PNG", imageX, imageY, imageWidth, imageHeight);
}

function addHeader(doc: jsPDF, input: Required<Pick<CorporatePdfInput, "title" | "documentNumber" | "documentType" | "issueDate">>) {
  doc.setFillColor(NAVY[0], NAVY[1], NAVY[2]);
  doc.rect(0, 0, 210, 62, "F");
  doc.setFillColor(GOLD[0], GOLD[1], GOLD[2]);
  doc.rect(0, 62, 210, 2.6, "F");

  doc.setFillColor(255, 255, 255);
  doc.roundedRect(12, 8, 42, 44, 3, 3, "F");
  drawOfficialLogo(doc, 12, 8, 42);

  text(doc, COMPANY_NAME_EN, 126, 22, { size: 16.2, style: "bold", color: [255, 255, 255], align: "center", maxWidth: 116, lineHeightFactor: 1.1 });
  text(doc, "Enterprise Travel Insurance Documents", 126, 33.5, { size: 8.2, color: [219, 226, 235], align: "center" });

  text(doc, input.title, 196, 47, { size: 11.2, style: "bold", color: [255, 255, 255], align: "right", maxWidth: 70, lineHeightFactor: 1.25 });
  text(doc, `${input.documentType}: ${input.documentNumber}`, 196, 55, { size: 8.2, style: "bold", color: [238, 242, 247], align: "right" });
  text(doc, `Issue Date: ${input.issueDate}`, 126, 55, { size: 7.2, color: [219, 226, 235], align: "center" });
}

function addFooter(doc: jsPDF) {
  const pageCount = doc.getNumberOfPages();
  for (let page = 1; page <= pageCount; page += 1) {
    doc.setPage(page);
    doc.setDrawColor(FOOTER_LINE[0], FOOTER_LINE[1], FOOTER_LINE[2]);
    doc.setLineWidth(0.2);
    doc.line(14, FOOTER_TOP_Y, 196, FOOTER_TOP_Y);

    text(doc, `Page ${page} of ${pageCount}`, 14, 282.5, { size: 7.2, color: FOOTER_TEXT });
    text(doc, "Generated by:", 105, 281.2, { size: 6.8, color: FOOTER_TEXT, align: "center" });
    text(doc, "System Administrator", 105, 285.1, { size: 7.4, style: "bold", color: FOOTER_TEXT, align: "center" });
    text(doc, "it_main@iraq-takaful.com", 196, 282.5, { size: 7.2, color: FOOTER_TEXT, align: "right" });

    text(doc, `Copyright ${new Date().getFullYear()} ${COMPANY_NAME_EN}.`, 105, 291, { size: 7, color: FOOTER_TEXT, align: "center" });
    text(doc, "All Rights Reserved.", 105, 294.6, { size: 6.6, color: FOOTER_TEXT, align: "center" });
  }
}

function ensureSpace(doc: jsPDF, y: number, needed = 24) {
  if (y + needed <= CONTENT_BOTTOM_Y) return y;
  doc.addPage();
  drawPageWatermark(doc);
  return 76;
}

function drawSection(doc: jsPDF, section: PdfSection, startY: number) {
  let y = ensureSpace(doc, startY, 45);
  doc.setFillColor(LIGHT[0], LIGHT[1], LIGHT[2]);
  doc.setDrawColor(BORDER[0], BORDER[1], BORDER[2]);
  doc.roundedRect(14, y, 182, 9, 2, 2, "FD");
  text(doc, section.title, 18, y + 6.4, { size: 10, style: "bold", color: NAVY, align: "left" });
  y += 13;

  const fieldGap = 4;
  const colWidth = 88;
  const valueMaxWidth = colWidth - 8;
  for (let index = 0; index < section.fields.length; index += 2) {
    const rowFields = section.fields.slice(index, index + 2);
    const row = rowFields.map((field, col) => {
      const valueLines = splitText(doc, field.value, valueMaxWidth, 9, "bold");
      return {
        field,
        x: col === 0 ? 14 : 108,
        valueLines,
        height: Math.max(17, 12 + valueLines.length * 4.6)
      };
    });
    const rowHeight = Math.max(...row.map((item) => item.height));
    y = ensureSpace(doc, y, rowHeight + fieldGap);

    row.forEach((item) => {
      doc.setFillColor(255, 255, 255);
      doc.setDrawColor(BORDER[0], BORDER[1], BORDER[2]);
      doc.roundedRect(item.x, y, colWidth, rowHeight, 2, 2, "FD");
      text(doc, item.field.label, item.x + 4, y + 5.4, { size: 7.5, style: "bold", color: MUTED, align: "left" });
      item.valueLines.forEach((line, lineIndex) => {
        text(doc, line, item.x + 4, y + 11.8 + lineIndex * 4.6, { size: 9, style: "bold", color: TEXT, align: "left", maxWidth: valueMaxWidth });
      });
    });
    y += rowHeight + fieldGap;
  }
  return y + 4;
}

function drawTable(doc: jsPDF, table: PdfTable, startY: number) {
  let y = ensureSpace(doc, startY, 34);
  text(doc, table.title, 14, y, { size: 10, style: "bold", color: NAVY, align: "left" });
  y += 5;
  const x = 14;
  const width = 182;
  const colWidth = width / Math.max(table.columns.length, 1);
  doc.setFillColor(NAVY[0], NAVY[1], NAVY[2]);
  doc.rect(x, y, width, 8, "F");
  table.columns.forEach((column, index) => {
    text(doc, column, x + index * colWidth + colWidth / 2, y + 5.6, { size: 7.2, style: "bold", color: [255, 255, 255], align: "center", maxWidth: colWidth - 3 });
  });
  y += 8;

  table.rows.forEach((row, rowIndex) => {
    const cellLines = row.map((cell) => splitText(doc, cell, colWidth - 3, 7));
    const rowHeight = Math.max(8, 5 + Math.max(...cellLines.map((lines) => lines.length)) * 3.8);
    y = ensureSpace(doc, y, rowHeight + 1);
    doc.setFillColor(rowIndex % 2 === 0 ? 255 : 249, rowIndex % 2 === 0 ? 255 : 250, rowIndex % 2 === 0 ? 255 : 247);
    doc.setDrawColor(BORDER[0], BORDER[1], BORDER[2]);
    doc.rect(x, y, width, rowHeight, "FD");
    cellLines.forEach((lines, index) => {
      lines.forEach((line, lineIndex) => {
        text(doc, line, x + index * colWidth + colWidth / 2, y + 5.4 + lineIndex * 3.8, { size: 7, color: TEXT, align: "center", maxWidth: colWidth - 3 });
      });
    });
    y += rowHeight;
  });

  if (table.totals?.length) {
    y += 3;
    doc.setFillColor(LIGHT[0], LIGHT[1], LIGHT[2]);
    doc.setDrawColor(GOLD[0], GOLD[1], GOLD[2]);
    doc.roundedRect(114, y, 82, 8 + table.totals.length * 6, 2, 2, "FD");
    table.totals.forEach((item, index) => {
      text(doc, `${item.label}: ${safe(item.value)}`, 192, y + 6 + index * 6, { size: 8, style: "bold", color: NAVY, align: "right" });
    });
    y += 11 + table.totals.length * 6;
  }
  return y + 5;
}

function drawSignatures(doc: jsPDF, y: number, approvalStatus: string) {
  y = ensureSpace(doc, y, 45);
  const cards = [
    { title: "Authorized Signature", value: "Authorized Officer" },
    { title: "Company Stamp", value: COMPANY_NAME_EN },
    { title: "Approval Status", value: approvalStatus }
  ];
  cards.forEach((card, index) => {
    const x = 14 + index * 62;
    doc.setDrawColor(BORDER[0], BORDER[1], BORDER[2]);
    doc.roundedRect(x, y, 58, 32, 2, 2);
    text(doc, card.title, x + 29, y + 7, { size: 8, color: MUTED, align: "center" });
    if (index === 1) {
      doc.setDrawColor(GOLD[0], GOLD[1], GOLD[2]);
      doc.setLineWidth(0.45);
      doc.circle(x + 29, y + 19.2, 13.2);
      doc.setLineWidth(0.2);
      doc.circle(x + 29, y + 19.2, 11);
      text(doc, "IRAQ TAKAFUL", x + 29, y + 18, { size: 6.8, style: "bold", color: NAVY, align: "center", maxWidth: 23, lineHeightFactor: 1 });
      text(doc, "INSURANCE", x + 29, y + 22.3, { size: 6.4, style: "bold", color: NAVY, align: "center", maxWidth: 23, lineHeightFactor: 1 });
    } else {
      doc.setDrawColor(GOLD[0], GOLD[1], GOLD[2]);
      doc.line(x + 10, y + 22, x + 48, y + 22);
      text(doc, card.value, x + 29, y + 28, { size: 7.5, color: NAVY, align: "center" });
    }
  });
  return y + 39;
}

async function drawVerificationQr(doc: jsPDF, payload: Record<string, unknown> | string, x = 154, y = 74) {
  const verificationPayload = typeof payload === "string" ? payload : JSON.stringify(payload);
  const qr = await QRCode.toDataURL(verificationPayload, PDF_QR_OPTIONS);
  doc.setFillColor(255, 255, 255);
  doc.setDrawColor(GOLD[0], GOLD[1], GOLD[2]);
  doc.roundedRect(x, y, 42, 50, 2.4, 2.4, "FD");
  doc.addImage(qr, "PNG", x + 4, y + 4, 34, 34);
  doc.setDrawColor(BORDER[0], BORDER[1], BORDER[2]);
  doc.line(x + 5, y + 40, x + 37, y + 40);
  text(doc, "Scan QR Code", x + 21, y + 44.8, { size: 6.6, style: "bold", color: NAVY, align: "center" });
  text(doc, "to Verify Policy", x + 21, y + 48.2, { size: 6.2, color: MUTED, align: "center" });
  if (/^https?:\/\//i.test(verificationPayload)) {
    doc.link(x, y, 42, 50, { url: verificationPayload });
  }
}

export async function createCorporatePdf(input: CorporatePdfInput) {
  const doc = new jsPDF({ orientation: "portrait", unit: "mm", format: "a4", putOnlyUsedFonts: true, compress: true });
  const issueDate = input.issueDate ?? new Date().toISOString().slice(0, 10);
  drawPageWatermark(doc);
  addHeader(doc, {
    title: input.title,
    documentNumber: input.documentNumber,
    documentType: input.documentType ?? "Document",
    issueDate
  });

  let y = input.qrPayload ? 130 : 78;
  if (input.qrPayload) {
    await drawVerificationQr(doc, input.qrPayload);
  }

  for (const section of input.sections ?? []) y = drawSection(doc, section, y);
  for (const table of input.tables ?? []) y = drawTable(doc, table, y);

  if (input.terms?.length) {
    y = ensureSpace(doc, y, 32);
    text(doc, "Terms & Conditions", 14, y, { size: 10, style: "bold", color: NAVY, align: "left" });
    y += 6;
    input.terms.forEach((term, index) => {
      const lines = splitText(doc, `${index + 1}. ${safe(term)}`, 182, 7.8);
      y = ensureSpace(doc, y, lines.length * 4.3 + 2);
      lines.forEach((line, lineIndex) => {
        text(doc, line, 14, y + lineIndex * 4.3, { size: 7.8, color: TEXT, align: "left", maxWidth: 182 });
      });
      y += lines.length * 4.3 + 2;
    });
  }

  drawSignatures(doc, y + 4, input.approvalStatus ?? "APPROVED");
  addFooter(doc);
  return doc;
}

export async function createPolicyPdf(policy: {
  policyNumber: string;
  customerName: string;
  passportNumber: string;
  nationality?: string;
  destination: string;
  coverageAmount?: string;
  agency?: string;
  policyType?: string;
  planName?: string;
  departureDate: string;
  returnDate: string;
  premium: string;
  verificationUrl: string;
  issueDate?: string;
  issuedBy?: string;
  issuedByRole?: string;
}) {
  return createCorporatePdf({
    title: "Official Travel Insurance Policy",
    documentType: "Policy",
    documentNumber: policy.policyNumber,
    issueDate: policy.issueDate,
    generatedBy: policy.issuedBy ?? COMPANY_NAME_EN,
    customerName: policy.customerName,
    qrPayload: policy.verificationUrl,
    sections: [
      {
        title: "Customer Information",
        fields: [
          { label: "Customer Name", value: policy.customerName },
          { label: "Passport Number", value: policy.passportNumber },
          { label: "Nationality", value: policy.nationality }
        ]
      },
      {
        title: "Policy Information",
        fields: [
          { label: "Policy Number", value: policy.policyNumber },
          { label: "Policy Type", value: policy.policyType },
          { label: "Travel Plan", value: policy.planName },
          { label: "Agency", value: policy.agency }
        ]
      },
      {
        title: "Travel Information",
        fields: [
          { label: "Destination", value: policy.destination },
          { label: "Departure Date", value: policy.departureDate },
          { label: "Expiry Date", value: policy.returnDate },
          { label: "Issue Date", value: policy.issueDate }
        ]
      },
      {
        title: "Coverage & Premium Details",
        fields: [
          { label: "Coverage Amount", value: policy.coverageAmount },
          { label: "Premium", value: policy.premium },
          { label: "Issued By", value: policy.issuedBy },
          { label: "Issuer Role", value: policy.issuedByRole },
          { label: "QR Code", value: "Enabled" }
        ]
      }
    ],
    terms: [
      "This document is electronically generated and valid when verified through the QR code.",
      "Coverage is subject to policy terms, exclusions, limits and approved travel dates.",
      "Any change to customer, destination or coverage information requires an official endorsement."
    ],
    approvalStatus: "AUTHORIZED"
  });
}

export async function createCertificatePdf(input: { title: string; number: string; lines: string[]; verificationUrl?: string }) {
  return createCorporatePdf({
    title: input.title,
    documentType: "Certificate",
    documentNumber: input.number,
    qrPayload: input.verificationUrl ?? { documentNumber: input.number, issueDate: new Date().toISOString().slice(0, 10), title: input.title },
    sections: [
      {
        title: "Certificate Details",
        fields: input.lines.map((line, index) => {
          const [label, ...rest] = line.split(":");
          return { label: rest.length ? label : `Detail ${index + 1}`, value: rest.length ? rest.join(":").trim() : line };
        })
      }
    ],
    terms: [
      "This certificate is issued by Iraq Takaful Insurance Company.",
      "The certificate is valid only with a matching company record and QR verification."
    ],
    approvalStatus: "APPROVED"
  });
}

export function registerPdfArabicFont(doc: jsPDF) {
  return { fontName: ENGLISH_FONT_NAME, process: (value: string) => processText(doc, value) };
}
