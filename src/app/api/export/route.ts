import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requirePermission, requireUser } from "@/lib/api";
import { rowsToExcelBuffer, rowsToPdfBuffer } from "@/lib/exports";
import { isDirectAccessEnabled } from "@/lib/direct-access";
import { demoClaims } from "@/lib/demo-data";
import { getDemoCustomers } from "@/lib/demo-customer-store";
import { getDemoPolicies } from "@/lib/demo-policy-store";
import { getDemoPlans } from "@/lib/demo-plan-store";
import { getDemoCountries } from "@/lib/demo-country-store";
import { getDemoEndorsements } from "@/lib/demo-endorsement-store";
import { getDemoCancellations } from "@/lib/demo-cancellation-store";
import { getDemoNotifications } from "@/lib/demo-notification-store";
import { getDemoAuditLogs } from "@/lib/demo-audit-store";
import { getIpAddress, writeAuditLog } from "@/lib/audit";
import { visibleCustomerWhere, visiblePolicyWhere } from "@/lib/policy-access";

type ExportRow = Record<string, string | number | boolean | null>;

const titles: Record<string, string> = {
  dashboard: "Dashboard",
  customers: "Customers",
  policies: "Policies",
  claims: "Claims",
  plans: "Travel Plans",
  countries: "Countries",
  endorsements: "Endorsements",
  cancellations: "Cancellations",
  notifications: "Notifications",
  audit: "Audit Log",
  agency: "Agency Policies",
  "agent-accounts": "Agent Accounts",
  reports: "System Report"
};

function text(value: unknown) {
  if (value === null || value === undefined) return "";
  if (value instanceof Date) return value.toISOString();
  if (typeof value === "object") return JSON.stringify(value);
  return String(value);
}

function normalize(rows: Record<string, unknown>[]): ExportRow[] {
  return rows.map((row) => Object.fromEntries(Object.entries(row).map(([key, value]) => [key, text(value)])));
}

async function authorize(resource: string) {
  if (isDirectAccessEnabled()) return null;
  if (resource === "audit") return requirePermission("auditRead");
  if (resource === "reports" || resource === "dashboard") return requirePermission("reportsRead");
  if (resource === "claims") return requirePermission("claimsRead");
  if (resource === "agency") return requirePermission("agencyRead");
  if (resource === "agent-accounts") return requirePermission("agentAccountsRead");
  if (resource === "notifications") return requirePermission("notificationsRead");
  if (resource === "customers") return requirePermission("customersRead");
  return requireUser();
}

async function demoRows(resource: string): Promise<ExportRow[]> {
  switch (resource) {
    case "customers":
      return normalize(getDemoCustomers().map((item) => ({
        arabicName: item.arabicName, englishName: item.englishName,
        passportNumber: item.passportNumber, nationality: item.nationality,
        dateOfBirth: item.dateOfBirth, mobile: item.mobile, email: item.email
      })));
    case "policies":
    case "agency":
      return normalize(getDemoPolicies().map((item) => ({
        policyNumber: item.policyNumber, customer: item.customer.arabicName,
        destination: item.destinationCountry.nameAr, plan: item.travelPlan.name,
        departureDate: item.departureDate, returnDate: item.returnDate,
        premium: item.premium, coverageAmount: item.coverageAmount, status: item.status
      })));
    case "agent-accounts":
      return [];
    case "claims":
      return normalize(demoClaims.map((item) => ({
        claimNumber: item.claimNumber, policyNumber: item.policy.policyNumber,
        customer: item.customer.arabicName, type: item.claimType,
        status: item.status, description: item.description, createdAt: item.createdAt
      })));
    case "plans":
      return normalize(getDemoPlans().map((item) => ({ ...item })));
    case "countries":
      return normalize(getDemoCountries().map((item) => ({ ...item })));
    case "endorsements":
      return normalize(getDemoEndorsements().map((item) => ({
        endorsementNumber: item.endorsementNumber, policyNumber: item.policy.policyNumber,
        customer: item.policy.customer.arabicName, type: item.endorsementType,
        additionalPremium: item.additionalPremium, status: item.status, createdAt: item.createdAt
      })));
    case "cancellations":
      return normalize(getDemoCancellations().map((item) => ({
        cancellationNumber: item.cancellationNumber, policyNumber: item.policy.policyNumber,
        customer: item.policy.customer.arabicName, reason: item.reason,
        refundAmount: item.refundAmount, administrativeFees: item.administrativeFees, createdAt: item.createdAt
      })));
    case "notifications":
      return normalize(getDemoNotifications().map((item) => ({
        title: item.title, message: item.message, type: item.type,
        status: item.status, dueAt: item.dueAt, createdAt: item.createdAt
      })));
    case "audit":
      return normalize(getDemoAuditLogs().map((item) => ({
        user: item.user?.name ?? "System", role: item.role, action: item.action,
        entity: item.entity, entityId: item.entityId, ipAddress: item.ipAddress,
        createdAt: item.createdAt
      })));
    case "dashboard":
    case "reports": {
      const policies = getDemoPolicies();
      return normalize([
        { metric: "Total customers", value: getDemoCustomers().length },
        { metric: "Total policies", value: policies.length },
        { metric: "Total premiums", value: policies.reduce((sum, item) => sum + Number(item.premium), 0) },
        { metric: "Total claims", value: demoClaims.length }
      ]);
    }
    default:
      return [];
  }
}

async function databaseRows(resource: string, request: NextRequest, user: Awaited<ReturnType<typeof requireUser>>): Promise<ExportRow[]> {
  const params = request.nextUrl.searchParams;
  const from = params.get("from") ? new Date(String(params.get("from"))) : undefined;
  const to = params.get("to") ? new Date(`${params.get("to")}T23:59:59.999Z`) : undefined;
  const status = params.get("status") || undefined;
  const agent = params.get("agent") || undefined;
  const policyNumber = params.get("policyNumber") || undefined;
  const q = params.get("q") || undefined;
  const dateRange = from || to ? { gte: from, lte: to } : undefined;
  const policyVisibility = visiblePolicyWhere(user);

  switch (resource) {
    case "customers":
      return normalize(await prisma.customer.findMany({
        where: {
          AND: [
            visibleCustomerWhere(user),
            q ? {
              OR: [
                { arabicName: { contains: q, mode: "insensitive" } },
                { englishName: { contains: q, mode: "insensitive" } },
                { passportNumber: { contains: q, mode: "insensitive" } }
              ]
            } : {}
          ]
        },
        orderBy: { createdAt: "desc" },
        select: {
          englishName: true, arabicName: true, passportNumber: true, mobile: true,
          email: true, nationality: true, createdAt: true
        }
      }));
    case "policies":
    case "agency":
      return normalize((await prisma.policy.findMany({
        where: {
          AND: [
            policyVisibility,
            status ? { status: status as never } : {},
            agent ? { issuedByUserId: agent } : {},
            policyNumber ? { policyNumber: { contains: policyNumber, mode: "insensitive" } } : {},
            dateRange ? { createdAt: dateRange } : {}
          ]
        },
        orderBy: { createdAt: "desc" },
        include: { customer: true, destinationCountry: true, travelPlan: true, issuedBy: true }
      })).map((item) => ({
        policyNumber: item.policyNumber, customer: item.customer.arabicName,
        passportNumber: item.customer.passportNumber, destination: item.destinationCountry.nameAr,
        travelDates: `${item.departureDate.toISOString().slice(0, 10)} - ${item.returnDate.toISOString().slice(0, 10)}`,
        coverage: item.coverageAmount, premium: item.premium, status: item.status,
        issuedBy: item.issuedByName ?? item.issuedBy?.name ?? "", issueDate: item.issuedAt ?? item.createdAt
      })));
    case "agent-accounts": {
      const agents = await prisma.user.findMany({
        where: {
          role: "AGENT",
          ...(q ? {
            OR: [
              { name: { contains: q, mode: "insensitive" as const } },
              { email: { contains: q, mode: "insensitive" as const } }
            ]
          } : {})
        },
        orderBy: { name: "asc" },
        select: {
          id: true,
          name: true,
          email: true,
          active: true,
          agency: { select: { name: true, code: true } },
          ownedPolicies: {
            where: {
              deletedAt: null,
              ...(status ? { status: status as never } : {}),
              ...(dateRange ? { createdAt: dateRange } : {})
            },
            select: {
              policyNumber: true,
              status: true,
              premium: true,
              createdAt: true,
              customer: { select: { arabicName: true } },
              destinationCountry: { select: { nameAr: true } },
              cancellation: { select: { refundAmount: true, administrativeFees: true } }
            }
          }
        }
      });
      const rows: Record<string, unknown>[] = [];
      agents.forEach((agent) => {
        if (agent.ownedPolicies.length) {
          agent.ownedPolicies.forEach((policy) => {
            const premium = Number(policy.premium);
            const commission = policy.status === "ACTIVE" || policy.status === "EXPIRED" ? premium * 0.1 : 0;
            rows.push({
              agent: agent.name ?? "Agent",
              email: agent.email,
              accountStatus: agent.active ? "ACTIVE" : "INACTIVE",
              agency: agent.agency?.name ?? "",
              agencyCode: agent.agency?.code ?? "",
              policyNumber: policy.policyNumber,
              customer: policy.customer.arabicName,
              destination: policy.destinationCountry.nameAr,
              policyStatus: policy.status,
              premium,
              commissionRate: "10%",
              commission,
              cancelledCommission: policy.status === "CANCELLED" ? premium * 0.1 : 0,
              refund: Number(policy.cancellation?.refundAmount ?? 0),
              administrativeFees: Number(policy.cancellation?.administrativeFees ?? 0),
              issueDate: policy.createdAt
            });
          });
        } else {
          rows.push({
            agent: agent.name ?? "Agent",
            email: agent.email,
            accountStatus: agent.active ? "ACTIVE" : "INACTIVE",
            agency: agent.agency?.name ?? "",
            agencyCode: agent.agency?.code ?? "",
            policyNumber: "",
            customer: "",
            destination: "",
            policyStatus: "",
            premium: 0,
            commissionRate: "10%",
            commission: 0,
            cancelledCommission: 0,
            refund: 0,
            administrativeFees: 0,
            issueDate: ""
          });
        }
      });
      return normalize(rows);
    }
    case "claims":
      return normalize((await prisma.claim.findMany({
        where: {
          AND: [
            status ? { status: status as never } : {},
            policyNumber ? { policy: { policyNumber: { contains: policyNumber, mode: "insensitive" } } } : {},
            agent ? { policy: { issuedByUserId: agent } } : {},
            dateRange ? { createdAt: dateRange } : {},
            { policy: policyVisibility }
          ]
        },
        orderBy: { createdAt: "desc" }, include: { policy: { include: { issuedBy: true } }, customer: true }
      })).map((item) => ({
        claimNumber: item.claimNumber, policyNumber: item.policy.policyNumber,
        customer: item.customer.arabicName, type: item.claimType,
        status: item.status, agent: item.policy.issuedByName ?? item.policy.issuedBy?.name ?? "",
        createdAt: item.createdAt
      })));
    case "plans":
      return normalize(await prisma.travelPlan.findMany({ orderBy: { createdAt: "desc" } }));
    case "countries":
      return normalize(await prisma.country.findMany({ orderBy: { nameEn: "asc" } }));
    case "endorsements":
      return normalize((await prisma.endorsement.findMany({
        where: {
          policy: { AND: [policyVisibility, ...(policyNumber ? [{ policyNumber: { contains: policyNumber, mode: "insensitive" as const } }] : [])] },
          ...(dateRange ? { createdAt: dateRange } : {})
        },
        orderBy: { createdAt: "desc" }, include: { policy: { include: { customer: true, issuedBy: true } } }
      })).map((item) => ({
        policyNumber: item.policy.policyNumber, endorsementType: item.endorsementType,
        oldValue: item.previousValue, newValue: item.newValue,
        createdBy: item.createdByName ?? item.policy.issuedByName ?? item.policy.issuedBy?.name ?? "", date: item.createdAt
      })));
    case "cancellations":
      return normalize((await prisma.cancellation.findMany({
        where: {
          policy: { AND: [policyVisibility, ...(policyNumber ? [{ policyNumber: { contains: policyNumber, mode: "insensitive" as const } }] : [])] },
          ...(dateRange ? { createdAt: dateRange } : {})
        },
        orderBy: { createdAt: "desc" }, include: { policy: { include: { customer: true } } }
      })).map((item) => ({
        policyNumber: item.policy.policyNumber, customer: item.policy.customer.arabicName,
        reason: item.reason, refund: item.refundAmount, status: item.policy.status, date: item.createdAt
      })));
    case "notifications":
      return normalize(await prisma.notification.findMany({
        orderBy: { createdAt: "desc" },
        select: { title: true, message: true, type: true, status: true, entity: true, dueAt: true, sentAt: true, createdAt: true }
      }));
    case "audit":
      return normalize((await prisma.auditLog.findMany({
        orderBy: { createdAt: "desc" }, include: { user: true }
      })).map((item) => ({
        user: item.user?.name ?? "System", role: item.role, action: item.action,
        entity: item.entity, entityId: item.entityId, ipAddress: item.ipAddress,
        metadata: item.metadata, createdAt: item.createdAt
      })));
    case "dashboard":
    case "reports": {
      const [customers, policies, premiums, claims, active, cancelled] = await Promise.all([
        prisma.customer.count({ where: visibleCustomerWhere(user) }),
        prisma.policy.count({ where: policyVisibility }),
        prisma.policy.aggregate({ where: policyVisibility, _sum: { premium: true } }),
        prisma.claim.count({ where: { policy: policyVisibility } }),
        prisma.policy.count({ where: { AND: [policyVisibility, { status: "ACTIVE" }] } }),
        prisma.policy.count({ where: { AND: [policyVisibility, { status: "CANCELLED" }] } })
      ]);
      return normalize([
        { metric: "Total customers", value: customers },
        { metric: "Total policies", value: policies },
        { metric: "Active policies", value: active },
        { metric: "Cancelled policies", value: cancelled },
        { metric: "Total premiums", value: premiums._sum.premium ?? 0 },
        { metric: "Total claims", value: claims }
      ]);
    }
    default:
      return [];
  }
}

export async function GET(request: NextRequest) {
  const resource = request.nextUrl.searchParams.get("resource") ?? "";
  const format = request.nextUrl.searchParams.get("format") ?? "";
  if (!titles[resource] || !["xlsx", "pdf"].includes(format)) {
    return NextResponse.json({ error: "Invalid export request" }, { status: 400 });
  }

  const user = await authorize(resource);
  const rows = isDirectAccessEnabled() ? await demoRows(resource) : await databaseRows(resource, request, user!);
  const stamp = new Date().toISOString().slice(0, 10);
  const filename = `${resource}-${stamp}`;

  if (format === "xlsx") {
    const buffer = rowsToExcelBuffer(rows, titles[resource].slice(0, 31));
    if (user) await writeAuditLog({
      userId: user.id, role: user.role, action: "EXPORT_ACTION", entity: resource,
      ipAddress: getIpAddress(request.headers), metadata: { resource, format, rows: rows.length }
    });
    return new Response(new Uint8Array(buffer), {
      headers: {
        "Content-Type": "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
        "Content-Disposition": `attachment; filename="${filename}.xlsx"`
      }
    });
  }

  const buffer = await rowsToPdfBuffer(`Iraq Takaful - ${titles[resource]}`, rows);
  if (user) await writeAuditLog({
    userId: user.id, role: user.role, action: "EXPORT_ACTION", entity: resource,
    ipAddress: getIpAddress(request.headers), metadata: { resource, format, rows: rows.length }
  });
  return new Response(new Uint8Array(buffer), {
    headers: {
      "Content-Type": "application/pdf",
      "Content-Disposition": `attachment; filename="${filename}.pdf"`
    }
  });
}
