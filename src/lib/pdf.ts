import { readFileSync } from "node:fs";
import { join } from "node:path";
import jsPDF from "jspdf";
import QRCode from "qrcode";
import { toEnglishDigits } from "@/lib/i18n";

const ENGLISH_FONT_NAME = "helvetica";
const ARABIC_FONT_NAME = "ArabicTypesetting";
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
let arabicFontRegistered = false;
const PDF_QR_OPTIONS = { margin: 2, width: 512, errorCorrectionLevel: "H" as const };
const FOOTER_TOP_Y = 276;
const CONTENT_BOTTOM_Y = 260;

type Locale = "ar" | "en";
type PdfField = { label: string; value?: string | number | null };
type PdfSection = { title: string; fields: PdfField[] };
type PdfTable = { title: string; columns: string[]; rows: Array<Array<string | number | null | undefined>>; totals?: PdfField[] };
type PdfImageAsset = { url?: string; name?: string; label?: string; type?: string };
type PdfApprovalAsset = { url?: string; name?: string; uploadedByName?: string };

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
  imageSections?: Array<{ title: string; images: PdfImageAsset[] }>;
  approvalAssets?: {
    preparedBy?: PdfApprovalAsset | null;
    reviewedBy?: PdfApprovalAsset | null;
    stamp?: PdfApprovalAsset | null;
  };
  approvalStatus?: string;
};

function isArabicText(value: string) {
  return /[\u0600-\u06ff]/.test(value);
}

function processText(_doc: jsPDF, value: string) {
  return value;
}

function registerArabicFont(doc: jsPDF) {
  if (arabicFontRegistered) return;
  const fontBase64 = readFileSync(join(process.cwd(), "public", "fonts", "ArabicTypesetting.ttf")).toString("base64");
  doc.addFileToVFS("ArabicTypesetting.ttf", fontBase64);
  doc.addFont("ArabicTypesetting.ttf", ARABIC_FONT_NAME, "normal");
  doc.addFont("ArabicTypesetting.ttf", ARABIC_FONT_NAME, "bold");
  arabicFontRegistered = true;
}

function setFont(doc: jsPDF, value: string, style: "normal" | "bold" = "normal") {
  if (isArabicText(value)) {
    registerArabicFont(doc);
    doc.setFont(ARABIC_FONT_NAME, style);
    return;
  }
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
  return toEnglishDigits(String(value));
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
  return 70;
}

function drawSection(doc: jsPDF, section: PdfSection, startY: number) {
  let y = ensureSpace(doc, startY, 38);
  doc.setFillColor(LIGHT[0], LIGHT[1], LIGHT[2]);
  doc.setDrawColor(BORDER[0], BORDER[1], BORDER[2]);
  doc.roundedRect(14, y, 182, 9, 2, 2, "FD");
  text(doc, section.title, 18, y + 6.4, { size: 10, style: "bold", color: NAVY, align: "left" });
  y += 13;

  const fieldGap = 2.6;
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
        height: Math.max(14.5, 10.4 + valueLines.length * 4.2)
      };
    });
    const rowHeight = Math.max(...row.map((item) => item.height));
    const nextY = ensureSpace(doc, y, rowHeight + fieldGap);
    if (nextY < y) {
      y = nextY;
      doc.setFillColor(LIGHT[0], LIGHT[1], LIGHT[2]);
      doc.setDrawColor(BORDER[0], BORDER[1], BORDER[2]);
      doc.roundedRect(14, y, 182, 9, 2, 2, "FD");
      text(doc, section.title, 18, y + 6.4, { size: 10, style: "bold", color: NAVY, align: "left" });
      y += 13;
    } else {
      y = nextY;
    }

    row.forEach((item) => {
      doc.setFillColor(255, 255, 255);
      doc.setDrawColor(BORDER[0], BORDER[1], BORDER[2]);
      doc.roundedRect(item.x, y, colWidth, rowHeight, 2, 2, "FD");
      text(doc, item.field.label, item.x + 4, y + 5.4, { size: 7.5, style: "bold", color: MUTED, align: "left" });
      item.valueLines.forEach((line, lineIndex) => {
        text(doc, line, item.x + 4, y + 10.9 + lineIndex * 4.2, { size: 8.8, style: "bold", color: TEXT, align: "left", maxWidth: valueMaxWidth });
      });
    });
    y += rowHeight + fieldGap;
  }
  return y + 2;
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

async function imageToDataUrl(url?: string) {
  if (!url) return null;
  try {
    const response = await fetch(url);
    if (!response.ok) return null;
    const contentType = response.headers.get("content-type") ?? "image/png";
    const buffer = Buffer.from(await response.arrayBuffer());
    return { dataUrl: `data:${contentType};base64,${buffer.toString("base64")}`, contentType };
  } catch {
    return null;
  }
}

function imageFormat(contentType?: string) {
  if (contentType?.includes("jpeg") || contentType?.includes("jpg")) return "JPEG";
  if (contentType?.includes("webp")) return "WEBP";
  return "PNG";
}

async function drawSignatures(doc: jsPDF, y: number, approvalStatus: string, assets?: CorporatePdfInput["approvalAssets"]) {
  y = ensureSpace(doc, y, 45);
  const cards = [
    { title: "Prepared By", value: assets?.preparedBy?.uploadedByName ?? "Underwriter", asset: assets?.preparedBy },
    { title: "Reviewed By", value: assets?.reviewedBy?.uploadedByName ?? "General Manager", asset: assets?.reviewedBy },
    { title: "Approval Status", value: approvalStatus }
  ];
  for (const [index, card] of cards.entries()) {
    const x = 14 + index * 62;
    doc.setDrawColor(BORDER[0], BORDER[1], BORDER[2]);
    doc.roundedRect(x, y, 58, 32, 2, 2);
    text(doc, card.title, x + 29, y + 7, { size: 8, color: MUTED, align: "center" });
    const image = await imageToDataUrl(card.asset?.url);
    if (image) {
      doc.addImage(image.dataUrl, imageFormat(image.contentType), x + 13, y + 10, 32, 12, undefined, "FAST");
    } else {
      doc.setDrawColor(GOLD[0], GOLD[1], GOLD[2]);
      doc.line(x + 10, y + 22, x + 48, y + 22);
    }
    text(doc, card.value, x + 29, y + 28, { size: 7.5, color: NAVY, align: "center", maxWidth: 48 });
  }
  if (assets?.stamp?.url) {
    const stamp = await imageToDataUrl(assets.stamp.url);
    if (stamp) doc.addImage(stamp.dataUrl, imageFormat(stamp.contentType), 156, y + 10, 26, 16, undefined, "FAST");
  }
  return y + 39;
}

async function drawVerificationQr(doc: jsPDF, payload: Record<string, unknown> | string, x = 154, y = 74, size = 42) {
  const verificationPayload = typeof payload === "string" ? payload : JSON.stringify(payload);
  const qr = await QRCode.toDataURL(verificationPayload, PDF_QR_OPTIONS);
  doc.setFillColor(255, 255, 255);
  doc.setDrawColor(GOLD[0], GOLD[1], GOLD[2]);
  doc.roundedRect(x, y, size, size, 2.4, 2.4, "FD");
  doc.addImage(qr, "PNG", x + 2.5, y + 2.5, size - 5, size - 5);
  if (/^https?:\/\//i.test(verificationPayload)) {
    doc.link(x, y, size, size, { url: verificationPayload });
  }
}

async function drawHeaderVerificationQr(doc: jsPDF, payload: Record<string, unknown> | string) {
  await drawVerificationQr(doc, payload, 58, 34, 19);
  text(doc, "Verify", 67.5, 56, { size: 5.8, style: "bold", color: [238, 242, 247], align: "center" });
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

  let y = 70;
  if (input.qrPayload) {
    await drawHeaderVerificationQr(doc, input.qrPayload);
  }

  for (const section of input.sections ?? []) y = drawSection(doc, section, y);
  for (const table of input.tables ?? []) y = drawTable(doc, table, y);
  for (const section of input.imageSections ?? []) y = await drawImageSection(doc, section.title, section.images, y);

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

  await drawSignatures(doc, y + 4, input.approvalStatus ?? "APPROVED", input.approvalAssets);
  addFooter(doc);
  return doc;
}

async function drawImageSection(doc: jsPDF, title: string, images: PdfImageAsset[], startY: number) {
  if (!images.length) return startY;
  let y = ensureSpace(doc, startY, 42);
  text(doc, title, 14, y, { size: 10, style: "bold", color: NAVY, align: "left" });
  y += 6;
  const boxWidth = 58;
  const boxHeight = 44;
  for (let index = 0; index < images.length; index += 1) {
    if (index % 3 === 0) y = ensureSpace(doc, y, boxHeight + 10);
    const x = 14 + (index % 3) * 62;
    doc.setDrawColor(BORDER[0], BORDER[1], BORDER[2]);
    doc.roundedRect(x, y, boxWidth, boxHeight, 2, 2);
    const image = await imageToDataUrl(images[index].url);
    if (image && images[index].type?.startsWith("image/")) {
      doc.addImage(image.dataUrl, imageFormat(image.contentType), x + 2, y + 2, boxWidth - 4, 30, undefined, "FAST");
    } else {
      text(doc, "Document attached", x + boxWidth / 2, y + 19, { size: 8, color: MUTED, align: "center" });
    }
    text(doc, images[index].label ?? images[index].name ?? `File ${index + 1}`, x + 3, y + 38, { size: 6.8, style: "bold", color: TEXT, maxWidth: boxWidth - 6 });
    if (index % 3 === 2 || index === images.length - 1) y += boxHeight + 7;
  }
  return y + 3;
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

export async function createMotorRequestPdf(request: {
  requestNumber: string;
  issueDate?: string;
  customerFullName: string;
  customerMobile: string;
  customerEmail?: string | null;
  customerNationalId: string;
  customerAddress: string;
  customerCity: string;
  vehicleType: string;
  manufacturer: string;
  model: string;
  manufacturingYear: number;
  color: string;
  plateNumber: string;
  chassisNumber: string;
  engineNumber: string;
  estimatedVehicleValue: string | number;
  coverageType?: string | null;
  coverageNotes?: string | null;
  insurancePremium: string | number;
  discount: string | number;
  additionalFees: string | number;
  taxes: string | number;
  netPremium: string | number;
  pricingCurrency: string;
  pricingNotes?: string | null;
  policyTermsHtml?: string | null;
  vehicleImages: PdfImageAsset[];
  customerDocuments: PdfImageAsset[];
  verificationUrl: string;
  preparedByName?: string | null;
  reviewedByName?: string | null;
  approvedByName?: string | null;
  underwriterSignature?: PdfApprovalAsset | null;
  managerSignature?: PdfApprovalAsset | null;
  companyStamp?: PdfApprovalAsset | null;
}) {
  const currency = request.pricingCurrency || "IQD";
  return createCorporatePdf({
    title: "Motor Insurance Request",
    documentType: "Request",
    documentNumber: request.requestNumber,
    issueDate: request.issueDate,
    customerName: request.customerFullName,
    generatedBy: request.preparedByName ?? COMPANY_NAME_EN,
    qrPayload: request.verificationUrl,
    sections: [
      {
        title: "Company Information",
        fields: [
          { label: "Company", value: COMPANY_NAME_EN },
          { label: "Document", value: "Motor Insurance Request" },
          { label: "Request Number", value: request.requestNumber },
          { label: "Issue Date", value: request.issueDate }
        ]
      },
      {
        title: "Customer Information",
        fields: [
          { label: "Customer Name", value: request.customerFullName },
          { label: "Mobile", value: request.customerMobile },
          { label: "Email", value: request.customerEmail },
          { label: "National ID", value: request.customerNationalId },
          { label: "Address", value: request.customerAddress },
          { label: "City", value: request.customerCity }
        ]
      },
      {
        title: "Vehicle Information",
        fields: [
          { label: "Vehicle Type", value: request.vehicleType },
          { label: "Manufacturer", value: request.manufacturer },
          { label: "Model", value: request.model },
          { label: "Year", value: request.manufacturingYear },
          { label: "Color", value: request.color },
          { label: "Plate Number", value: request.plateNumber },
          { label: "Chassis Number", value: request.chassisNumber },
          { label: "Engine Number", value: request.engineNumber },
          { label: "Estimated Value", value: request.estimatedVehicleValue }
        ]
      },
      {
        title: "Coverage Information",
        fields: [
          { label: "Coverage Type", value: request.coverageType },
          { label: "Coverage Notes", value: request.coverageNotes }
        ]
      },
      {
        title: "Pricing Information",
        fields: [
          { label: "Insurance Premium", value: `${request.insurancePremium} ${currency}` },
          { label: "Discount", value: `${request.discount} ${currency}` },
          { label: "Additional Fees", value: `${request.additionalFees} ${currency}` },
          { label: "Taxes", value: `${request.taxes} ${currency}` },
          { label: "Net Premium", value: `${request.netPremium} ${currency}` },
          { label: "Pricing Notes", value: request.pricingNotes }
        ]
      },
      {
        title: "Approval Flow",
        fields: [
          { label: "Prepared By", value: request.preparedByName },
          { label: "Reviewed By", value: request.reviewedByName },
          { label: "Approved By", value: request.approvedByName }
        ]
      }
    ],
    imageSections: [
      { title: "Uploaded Vehicle Images", images: request.vehicleImages },
      { title: "Uploaded Customer Documents", images: request.customerDocuments }
    ],
    terms: htmlToLines(request.policyTermsHtml),
    approvalAssets: {
      preparedBy: request.underwriterSignature,
      reviewedBy: request.managerSignature,
      stamp: request.companyStamp
    },
    approvalStatus: request.approvedByName ? "APPROVED" : "PENDING APPROVAL"
  });
}

function htmlToLines(html?: string | null) {
  if (!html) return [];
  return html
    .replace(/<br\s*\/?>/gi, "\n")
    .replace(/<\/(p|div|li|h[1-6])>/gi, "\n")
    .replace(/<[^>]+>/g, "")
    .split("\n")
    .map((line) => line.trim())
    .filter(Boolean);
}
