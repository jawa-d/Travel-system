import { MotorRequestStatus } from "@prisma/client";
import type { MotorRequestDetail, MotorRequestListItem, PortalMotorRequest } from "@/lib/motor-requests/types";

const validStatuses = new Set<string>(Object.values(MotorRequestStatus));

export function mapPortalMotorListResponse(input: unknown): MotorRequestListItem[] {
  const rows = Array.isArray(input) ? input : isRecord(input) && Array.isArray(input.data) ? input.data : [];
  return rows.map((row) => mapPortalMotorListItem(row as PortalMotorRequest));
}

export function mapPortalMotorDetailResponse(input: unknown): MotorRequestDetail | null {
  const row = isRecord(input) && "data" in input ? input.data : input;
  if (!isRecord(row)) return null;

  return mapPortalMotorDetail(row as PortalMotorRequest);
}

function mapPortalMotorListItem(request: PortalMotorRequest): MotorRequestListItem {
  const created = parseDate(stringValue(request.createdDate) ?? stringValue(request.createdAt));

  return {
    id: request.id,
    requestNumber: request.requestNumber,
    status: mapStatus(request.status),
    customerFullName: request.customerFullName,
    manufacturer: request.manufacturer,
    model: request.model,
    plateNumber: request.plateNumber,
    estimatedVehicleValue: decimalString(request.estimatedVehicleValue),
    insurancePremium: decimalString(request.insurancePremium),
    netPremium: decimalString(request.netPremium),
    pricingCurrency: stringValue(request.pricingCurrency) ?? "IQD",
    commission: mapCommission(request.commission),
    createdDate: created.toISOString(),
    createdTime: stringValue(request.createdTime) ?? created.toTimeString().slice(0, 5)
  };
}

function mapPortalMotorDetail(request: PortalMotorRequest): MotorRequestDetail {
  const now = new Date();
  const createdDate = parseDate(stringValue(request.createdDate) ?? stringValue(request.createdAt));

  return {
    id: request.id,
    requestNumber: request.requestNumber,
    submissionToken: stringValue(request.submissionToken) ?? request.id,
    status: mapStatus(request.status),
    customerFullName: request.customerFullName,
    customerMobile: stringValue(request.customerMobile) ?? "",
    customerEmail: stringValue(request.customerEmail),
    customerNationalId: stringValue(request.customerNationalId) ?? "",
    customerAddress: stringValue(request.customerAddress) ?? "",
    customerCity: stringValue(request.customerCity) ?? "",
    vehicleType: stringValue(request.vehicleType) ?? "",
    manufacturer: request.manufacturer,
    model: request.model,
    manufacturingYear: numberValue(request.manufacturingYear),
    color: stringValue(request.color) ?? "",
    plateNumber: request.plateNumber,
    chassisNumber: stringValue(request.chassisNumber) ?? "",
    engineNumber: stringValue(request.engineNumber) ?? "",
    estimatedVehicleValue: decimalString(request.estimatedVehicleValue),
    coverageType: stringValue(request.coverageType) ?? "",
    coverageNotes: stringValue(request.coverageNotes),
    vehicleImages: request.vehicleImages ?? [],
    customerDocuments: request.customerDocuments ?? [],
    uploadFailures: request.uploadFailures ?? [],
    notes: stringValue(request.notes),
    agentId: stringValue(request.agentId),
    agentName: stringValue(request.agentName) ?? "Portal",
    agentEmail: stringValue(request.agentEmail),
    agentRole: null,
    agentAgency: stringValue(request.agentAgency),
    userId: stringValue(request.userId),
    reviewedById: null,
    reviewedByName: stringValue(request.reviewedByName),
    reviewedAt: optionalDate(stringValue(request.reviewedAt)),
    approvedById: null,
    approvedByName: null,
    approvedAt: null,
    managerNotes: stringValue(request.managerNotes),
    insurancePremium: decimalString(request.insurancePremium),
    discount: decimalString(request.discount),
    additionalFees: decimalString(request.additionalFees),
    taxes: decimalString(request.taxes),
    netPremium: decimalString(request.netPremium),
    pricingCurrency: stringValue(request.pricingCurrency) ?? "IQD",
    pricingNotes: stringValue(request.pricingNotes),
    policyTermsHtml: stringValue(request.policyTermsHtml),
    termsApprovedById: null,
    termsApprovedByName: stringValue(request.termsApprovedByName),
    termsApprovedAt: optionalDate(stringValue(request.termsApprovedAt)),
    underwriterSignature: request.underwriterSignature ?? null,
    managerSignature: request.managerSignature ?? null,
    companyStamp: request.companyStamp ?? null,
    policyIssuedAt: optionalDate(stringValue(request.policyIssuedAt)),
    issuedPolicyNumber: stringValue(request.issuedPolicyNumber),
    editHistory: request.editHistory ?? [],
    source: "PORTAL",
    createdDate,
    createdTime: stringValue(request.createdTime) ?? createdDate.toTimeString().slice(0, 5),
    createdAt: optionalDate(stringValue(request.createdAt)) ?? now,
    updatedAt: optionalDate(stringValue(request.updatedAt)) ?? now
  } as unknown as MotorRequestDetail;
}

function mapCommission(input: unknown): MotorRequestListItem["commission"] {
  if (!isRecord(input)) return null;

  return {
    id: stringValue(input.id) ?? "",
    paid: Boolean(input.paid),
    commissionAmount: decimalString(input.commissionAmount)
  };
}

function mapStatus(status: string): MotorRequestStatus {
  return validStatuses.has(status) ? status as MotorRequestStatus : MotorRequestStatus.SUBMITTED;
}

function decimalString(value: unknown) {
  return String(value ?? 0);
}

function numberValue(value: unknown) {
  const number = Number(value);
  return Number.isFinite(number) ? number : 0;
}

function parseDate(value: string | null | undefined) {
  return optionalDate(value) ?? new Date();
}

function optionalDate(value: string | null | undefined) {
  if (!value) return null;
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? null : date;
}

function stringValue(input: unknown) {
  return typeof input === "string" || typeof input === "number" ? String(input) : null;
}

function isRecord(input: unknown): input is Record<string, unknown> {
  return Boolean(input) && typeof input === "object";
}
