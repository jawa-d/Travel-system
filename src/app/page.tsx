import { subMonths } from "date-fns";
import { AppShell } from "@/components/app-shell";
import { ExecutiveDashboard, type ExecutiveDashboardData } from "@/components/executive-dashboard";
import { requirePagePermission } from "@/lib/page-guard";
import { prisma } from "@/lib/prisma";
import { visiblePolicyWhere } from "@/lib/policy-access";

const monthFormatter = new Intl.DateTimeFormat("ar-IQ-u-nu-latn", { month: "short" });

export default async function DashboardPage() {
  const user = await requirePagePermission("dashboard");
  const policyWhere = visiblePolicyWhere(user);
  const since = new Date();
  since.setMonth(since.getMonth() - 11, 1);
  since.setHours(0, 0, 0, 0);

  const [
    totalCustomers,
    totalPolicies,
    activePolicies,
    totalClaims,
    totalEndorsements,
    totalCancellations,
    totalAgents,
    policyDates,
    customerDates,
    policyStatuses,
    claimStatuses,
    latestPolicies,
    latestClaims,
    latestEndorsements,
    latestActivity
  ] = await Promise.all([
    prisma.customer.count(),
    prisma.policy.count({ where: policyWhere }),
    prisma.policy.count({ where: { AND: [policyWhere, { status: "ACTIVE" }] } }),
    prisma.claim.count({ where: { policy: policyWhere } }),
    prisma.endorsement.count({ where: { policy: policyWhere } }),
    prisma.cancellation.count({ where: { policy: policyWhere } }),
    prisma.user.count({ where: { role: "AGENT" } }),
    prisma.policy.findMany({ where: { AND: [policyWhere, { createdAt: { gte: since } }] }, select: { createdAt: true } }),
    prisma.customer.findMany({ where: { createdAt: { gte: since } }, select: { createdAt: true } }),
    prisma.policy.groupBy({ by: ["status"], where: policyWhere, _count: true }),
    prisma.claim.groupBy({ by: ["status"], where: { policy: policyWhere }, _count: true }),
    prisma.policy.findMany({
      where: policyWhere,
      orderBy: { createdAt: "desc" },
      take: 5,
      select: {
        id: true, policyNumber: true, status: true, premium: true, createdAt: true,
        customer: { select: { arabicName: true } }
      }
    }),
    prisma.claim.findMany({
      where: { policy: policyWhere },
      orderBy: { createdAt: "desc" },
      take: 5,
      select: {
        id: true, claimNumber: true, status: true, createdAt: true,
        customer: { select: { arabicName: true } }
      }
    }),
    prisma.endorsement.findMany({
      where: { policy: policyWhere },
      orderBy: { createdAt: "desc" },
      take: 5,
      select: {
        id: true, endorsementNumber: true, status: true, endorsementType: true, createdAt: true,
        policy: { select: { policyNumber: true } }
      }
    }),
    prisma.activity.findMany({
      orderBy: { createdAt: "desc" },
      take: 6,
      select: {
        id: true, action: true, entity: true, createdAt: true,
        actor: { select: { name: true } }
      }
    })
  ]);

  const months = Array.from({ length: 12 }, (_, index) => {
    const date = subMonths(new Date(), 11 - index);
    return {
      key: `${date.getFullYear()}-${date.getMonth()}`,
      label: monthFormatter.format(date),
      policies: 0,
      customers: 0
    };
  });
  const monthMap = new Map(months.map((month) => [month.key, month]));
  policyDates.forEach(({ createdAt }) => {
    const item = monthMap.get(`${createdAt.getFullYear()}-${createdAt.getMonth()}`);
    if (item) item.policies += 1;
  });
  customerDates.forEach(({ createdAt }) => {
    const item = monthMap.get(`${createdAt.getFullYear()}-${createdAt.getMonth()}`);
    if (item) item.customers += 1;
  });

  const data: ExecutiveDashboardData = {
    userName: user.name ?? "مدير النظام",
    metrics: {
      totalCustomers,
      totalPolicies,
      activePolicies,
      totalClaims,
      totalEndorsements,
      totalCancellations,
      totalAgents
    },
    policiesByMonth: months.map(({ label, policies }) => ({ label, value: policies })),
    customerGrowth: months.map(({ label, customers }) => ({ label, value: customers })),
    policiesByStatus: policyStatuses.map((item) => ({ status: item.status, value: item._count })),
    claimsByStatus: claimStatuses.map((item) => ({ status: item.status, value: item._count })),
    latestPolicies: latestPolicies.map((item) => ({
      id: item.id,
      code: item.policyNumber,
      title: item.customer.arabicName,
      status: item.status,
      amount: Number(item.premium),
      createdAt: item.createdAt.toISOString()
    })),
    latestClaims: latestClaims.map((item) => ({
      id: item.id,
      code: item.claimNumber,
      title: item.customer.arabicName,
      status: item.status,
      createdAt: item.createdAt.toISOString()
    })),
    latestEndorsements: latestEndorsements.map((item) => ({
      id: item.id,
      code: item.endorsementNumber,
      title: item.policy.policyNumber,
      status: item.status,
      subtitle: item.endorsementType,
      createdAt: item.createdAt.toISOString()
    })),
    latestActivity: latestActivity.map((item) => ({
      id: item.id,
      code: item.action,
      title: item.entity,
      subtitle: item.actor?.name ?? "النظام",
      status: "ACTIVITY",
      createdAt: item.createdAt.toISOString()
    }))
  };

  return <AppShell><ExecutiveDashboard data={data} /></AppShell>;
}
