import { readFileSync } from "node:fs";
import { join } from "node:path";
import jsPDF from "jspdf";
import QRCode from "qrcode";

const ARABIC_FONT_FILE = "ArabicTypesetting.ttf";
const ARABIC_FONT_NAME = "ArabicTypesetting";
let arabicFontBase64: string | null = null;

function registerArabicFont(doc: jsPDF) {
  arabicFontBase64 ??= readFileSync(join(process.cwd(), "public", "fonts", ARABIC_FONT_FILE)).toString("base64");
  doc.addFileToVFS(ARABIC_FONT_FILE, arabicFontBase64);
  doc.addFont(ARABIC_FONT_FILE, ARABIC_FONT_NAME, "normal");
  doc.addFont(ARABIC_FONT_FILE, ARABIC_FONT_NAME, "bold");
}

function arabic(doc: jsPDF, value: string) {
  return doc.processArabic(value);
}

function rtlText(doc: jsPDF, value: string, x: number, y: number, options: { maxWidth?: number; align?: "right" | "center" } = {}) {
  doc.setFont(ARABIC_FONT_NAME, "normal");
  doc.text(arabic(doc, value), x, y, {
    align: options.align ?? "right",
    maxWidth: options.maxWidth
  });
}

function field(doc: jsPDF, labelAr: string, labelEn: string, value: string, x: number, y: number, width: number) {
  doc.setDrawColor(218, 226, 232);
  doc.setFillColor(249, 251, 252);
  doc.roundedRect(x, y, width, 17, 2, 2, "FD");
  doc.setFontSize(8);
  doc.setTextColor(94, 108, 122);
  rtlText(doc, labelAr, x + width - 4, y + 5);
  doc.setFont("helvetica", "normal");
  doc.text(labelEn, x + 4, y + 5);
  doc.setFontSize(10);
  doc.setTextColor(18, 32, 45);
  const isArabic = /[\u0600-\u06ff]/.test(value);
  if (isArabic) rtlText(doc, value, x + width - 4, y + 12.5, { maxWidth: width - 8 });
  else {
    doc.setFont("helvetica", "bold");
    doc.text(value || "-", x + 4, y + 12.5, { maxWidth: width - 8 });
  }
}

export async function createPolicyPdf(policy: {
  policyNumber: string;
  customerName: string;
  arabicCustomerName?: string;
  passportNumber: string;
  destination: string;
  coverageAmount?: string;
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
  const doc = new jsPDF({ orientation: "portrait", unit: "mm", format: "a4", putOnlyUsedFonts: true });
  registerArabicFont(doc);
  const qr = await QRCode.toDataURL(policy.verificationUrl, { margin: 1, width: 240, errorCorrectionLevel: "H" });

  doc.setFillColor(7, 31, 49);
  doc.rect(0, 0, 210, 42, "F");
  doc.setFillColor(7, 142, 158);
  doc.rect(0, 38, 210, 4, "F");
  doc.setTextColor(255, 255, 255);
  doc.setFont("helvetica", "bold");
  doc.setFontSize(24);
  doc.text("TRINSU", 16, 17);
  doc.setFontSize(9);
  doc.text("TRAVEL INSURANCE", 16, 24);
  doc.setFontSize(8);
  doc.text("Official Electronic Policy", 16, 32);
  doc.setFontSize(18);
  rtlText(doc, "وثيقة تأمين السفر", 194, 18);
  doc.setFontSize(9);
  rtlText(doc, "وثيقة إلكترونية رسمية قابلة للتحقق", 194, 29);

  doc.setTextColor(18, 32, 45);
  doc.setFontSize(11);
  field(doc, "رقم الوثيقة", "Policy Number", policy.policyNumber, 15, 50, 180);
  field(doc, "اسم العميل بالعربية", "Customer Arabic Name", policy.arabicCustomerName ?? "-", 108, 71, 87);
  field(doc, "اسم العميل بالإنجليزية", "Customer English Name", policy.customerName, 15, 71, 87);
  field(doc, "رقم جواز السفر", "Passport Number", policy.passportNumber, 108, 92, 87);
  field(doc, "الوجهة", "Destination", policy.destination, 15, 92, 87);
  field(doc, "تاريخ المغادرة", "Departure Date", policy.departureDate, 108, 113, 87);
  field(doc, "تاريخ العودة", "Return Date", policy.returnDate, 15, 113, 87);
  field(doc, "مبلغ التغطية", "Coverage Amount", policy.coverageAmount ?? "-", 108, 134, 87);
  field(doc, "نوع الوثيقة", "Policy Type", policy.policyType ?? "-", 15, 134, 87);
  field(doc, "خطة السفر", "Travel Plan", policy.planName ?? "-", 108, 155, 87);
  field(doc, "قسط التأمين", "Premium", policy.premium, 15, 155, 87);
  field(doc, "تاريخ الإصدار", "Issue Date", policy.issueDate ?? "-", 108, 176, 87);
  field(doc, "أُصدرت بواسطة", "Issued By", policy.issuedBy ?? "-", 15, 176, 87);

  doc.setDrawColor(7, 142, 158);
  doc.setLineWidth(0.5);
  doc.roundedRect(15, 201, 180, 49, 3, 3);
  doc.addImage(qr, "PNG", 154, 207, 35, 35);
  doc.setFont("helvetica", "bold");
  doc.setFontSize(8);
  doc.text("SCAN TO VERIFY", 159, 246);
  doc.setFontSize(9);
  doc.text(policy.issuedByRole ? `Role: ${policy.issuedByRole}` : "Authorized issuer", 22, 211);
  doc.setFontSize(14);
  doc.setTextColor(7, 118, 134);
  doc.text("AUTHORIZED", 28, 226);
  doc.setFontSize(8);
  doc.setTextColor(18, 32, 45);
  doc.text("Electronic Signature", 32, 233);

  doc.setDrawColor(7, 118, 134);
  doc.setLineWidth(0.8);
  doc.circle(118, 225, 17);
  doc.setFont("helvetica", "bold");
  doc.setFontSize(11);
  doc.text("TRINSU", 108, 222);
  doc.setFontSize(7);
  doc.text("COMPANY STAMP", 104, 228);
  rtlText(doc, "ختم الشركة", 126, 234, { align: "center" });

  doc.setDrawColor(220, 226, 232);
  doc.line(15, 262, 195, 262);
  doc.setTextColor(90, 103, 115);
  doc.setFontSize(8);
  rtlText(doc, "امسح رمز الاستجابة السريعة للتحقق من صحة الوثيقة", 195, 270);
  doc.setFont("helvetica", "normal");
  doc.text("Scan the QR code to verify this policy.", 15, 270);
  doc.setFontSize(6.5);
  doc.text(policy.verificationUrl, 15, 278, { maxWidth: 180 });
  doc.text("TRINSU Travel Insurance Management System", 15, 287);

  return doc;
}

export async function createCertificatePdf(input: { title: string; number: string; lines: string[]; verificationUrl?: string }) {
  const doc = new jsPDF({ orientation: "portrait", unit: "mm", format: "a4", putOnlyUsedFonts: true });
  registerArabicFont(doc);
  doc.setFillColor(7, 118, 134);
  doc.rect(0, 0, 210, 30, "F");
  doc.setTextColor(255, 255, 255);
  doc.setFontSize(18);
  if (/[\u0600-\u06ff]/.test(input.title)) rtlText(doc, input.title, 192, 19);
  else {
    doc.setFont("helvetica", "bold");
    doc.text(input.title, 18, 19);
  }
  doc.setTextColor(20, 30, 40);
  doc.setFont("helvetica", "normal");
  doc.setFontSize(12);
  doc.text(`Number: ${input.number}`, 18, 48);
  input.lines.forEach((line, index) => {
    if (/[\u0600-\u06ff]/.test(line)) rtlText(doc, line, 192, 64 + index * 10);
    else doc.text(line, 18, 64 + index * 10);
  });
  if (input.verificationUrl) {
    const qr = await QRCode.toDataURL(input.verificationUrl, { margin: 1, width: 160 });
    doc.addImage(qr, "PNG", 155, 44, 34, 34);
  }
  doc.circle(160, 210, 18);
  doc.setFont("helvetica", "bold");
  doc.text("TRINSU E-STAMP", 140, 212);
  return doc;
}

export function registerPdfArabicFont(doc: jsPDF) {
  registerArabicFont(doc);
  return { fontName: ARABIC_FONT_NAME, process: (value: string) => arabic(doc, value) };
}
