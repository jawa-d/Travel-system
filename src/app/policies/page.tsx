import Link from "next/link";
import { FilePlus2, FileText } from "lucide-react";
import { AppShell } from "@/components/app-shell";
import { PolicyManager } from "@/components/policy-manager";
import { Button } from "@/components/ui/button";
import { prisma } from "@/lib/prisma";
import { requirePagePermission } from "@/lib/page-guard";
import { visiblePolicyWhere } from "@/lib/policy-access";
import { PolicyDashboardStats } from "@/components/policy-dashboard-stats";

async function getPolicies(user: { id: string; role: string }) {
  return prisma.policy.findMany({
    where: visiblePolicyWhere(user as Parameters<typeof visiblePolicyWhere>[0], user.role === "SUPER_ADMIN"),
    include: { customer: true, destinationCountry: true, travelPlan: true },
    orderBy: { createdAt: "desc" },
    take: 100
  });
}

export default async function PoliciesPage() {
  const user = await requirePagePermission("policiesRead");
  const policies = await getPolicies(user);
  const active = policies.filter((policy) => policy.status === "ACTIVE").length;
  const drafts = policies.filter((policy) => policy.status === "DRAFT").length;
  const cancelled = policies.filter((policy) => policy.status === "CANCELLED").length;
  const expired = policies.filter((policy) => policy.status === "EXPIRED").length;
  const visibleWhere = visiblePolicyWhere(user as Parameters<typeof visiblePolicyWhere>[0]);
  const [claims, endorsements] = await Promise.all([
    prisma.claim.count({ where: { policy: visibleWhere } }),
    prisma.endorsement.count({ where: { policy: visibleWhere } })
  ]);

  return (
    <AppShell>
      <div className="mb-6 flex flex-col justify-between gap-4 lg:flex-row lg:items-end">
        <div>
          <div className="mb-2 flex items-center gap-2 text-sm font-medium text-primary">
            <FileText className="h-4 w-4" />سجل وثائق التأمين
          </div>
          <h1 className="text-2xl font-bold tracking-tight sm:text-3xl">إدارة الوثائق</h1>
          <p className="mt-1 text-sm text-muted-foreground">
            البحث وإدارة الحالة وتحميل وطباعة وإرسال وثائق التأمين.
          </p>
        </div>
        <div className="flex flex-wrap items-center gap-3">
          <Button asChild className="h-11">
            <Link href="/policies/new"><FilePlus2 className="h-4 w-4" />إصدار وثيقة</Link>
          </Button>
        </div>
      </div>

      <PolicyDashboardStats values={{ total: policies.filter((item) => !item.deletedAt).length, active, expired, cancelled, claims, endorsements }} />

      {drafts > 0 && (
        <div className="mb-5 rounded-xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-800">
          لديك {drafts} {drafts === 1 ? "وثيقة مسودة" : "وثائق مسودة"} تحتاج إلى المراجعة أو التفعيل.
        </div>
      )}

      <PolicyManager
        canManageStatus={user.role !== "AGENT"}
        canDelete={user.role === "SUPER_ADMIN"}
        policies={policies.map((policy) => ({
          id: policy.id,
          policyNumber: policy.policyNumber,
          customerName: policy.customer.arabicName,
          customerEmail: policy.customer.email,
          destinationName: policy.destinationCountry.nameAr,
          planName: policy.travelPlan.name,
          departureDate: policy.departureDate.toISOString(),
          returnDate: policy.returnDate.toISOString(),
          premium: String(policy.premium),
          coverageAmount: String(policy.coverageAmount),
          status: policy.status
          ,deletedAt: policy.deletedAt?.toISOString() ?? null
        }))}
      />
    </AppShell>
  );
}
