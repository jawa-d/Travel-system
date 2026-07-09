import { Role } from "@prisma/client";
import { CheckCircle2, ClipboardList, Clock3, PlusCircle } from "lucide-react";
import { AppShell } from "@/components/app-shell";
import { ClaimManager } from "@/components/claim-manager";
import { getDemoClaims } from "@/lib/demo-claim-store";
import { getDemoPolicies } from "@/lib/demo-policy-store";
import { isDirectAccessEnabled } from "@/lib/direct-access";
import { requirePagePermission } from "@/lib/page-guard";
import { prisma } from "@/lib/prisma";
import { visiblePolicyWhere } from "@/lib/policy-access";

export default async function ClaimsPage() {
  const user = await requirePagePermission("claimsWrite");
  const canManageClaims = user.role === Role.SUPER_ADMIN || user.role === Role.ADMIN || user.role === Role.UNDERWRITER;
  const claimTypes = isDirectAccessEnabled() ? [] : await prisma.lookupValue.findMany({ where: { category: "CLAIM_TYPE", active: true }, orderBy: { sortOrder: "asc" } });
  const claims = isDirectAccessEnabled()
    ? getDemoClaims()
    : canManageClaims
      ? await prisma.claim.findMany({ where: { policy: visiblePolicyWhere(user) }, include: { policy: true, customer: true }, orderBy: { createdAt: "desc" } })
      : [];
  const policies = isDirectAccessEnabled()
    ? getDemoPolicies()
    : await prisma.policy.findMany({ where: visiblePolicyWhere(user), include: { customer: true }, orderBy: { createdAt: "desc" }, take: 100 });
  const agents = !isDirectAccessEnabled() && canManageClaims
    ? await prisma.user.findMany({ where: { role: "AGENT", active: true }, select: { id: true, name: true }, orderBy: { name: "asc" } })
    : [];

  const newClaims = claims.filter((claim) => claim.status === "OPEN").length;
  const underReview = claims.filter((claim) => claim.status === "UNDER_REVIEW").length;
  const approved = claims.filter((claim) => claim.status === "APPROVED").length;

  return (
    <AppShell>
      <div className="mb-6 flex flex-col justify-between gap-4 md:flex-row md:items-end">
        <div>
          <div className="mb-2 flex items-center gap-2 text-sm font-medium text-primary">
            <ClipboardList className="h-4 w-4" />متابعة التعويضات
          </div>
          <h1 className="text-2xl font-bold tracking-tight sm:text-3xl">إدارة المطالبات</h1>
          <p className="mt-1 text-sm text-muted-foreground">
            إنشاء ومراجعة ومتابعة مطالبات وثائق تأمين السفر.
          </p>
        </div>
        <div className="flex gap-2">
          <Stat icon={PlusCircle} label="مفتوحة" value={newClaims} className="text-blue-600" />
          <Stat icon={Clock3} label="قيد المراجعة" value={underReview} className="text-amber-600" />
          <Stat icon={CheckCircle2} label="مقبولة" value={approved} className="text-emerald-600" />
        </div>
      </div>

      <ClaimManager
        canCreate
        canManage={canManageClaims}
        canViewClaims={canManageClaims}
        claimTypes={(claimTypes.length ? claimTypes.map((item) => ({ value: item.value, label: item.labelAr })) : [
          { value: "MEDICAL", label: "طبية" }, { value: "BAGGAGE", label: "أمتعة" },
          { value: "TRIP_DELAY", label: "تأخير رحلة" }, { value: "CANCELLATION", label: "إلغاء رحلة" },
          { value: "OTHER", label: "أخرى" }
        ])}
        claims={claims.map((claim) => ({
          id: claim.id,
          claimNumber: claim.claimNumber,
          policyNumber: claim.policy.policyNumber,
          customerName: claim.customer.arabicName,
          claimType: claim.claimType,
          description: claim.description,
          attachments: [...claim.attachments],
          status: claim.status,
          createdAt: claim.createdAt.toISOString()
        }))}
        policies={policies.map((policy) => ({
          policyNumber: policy.policyNumber,
          customerName: policy.customer.arabicName
        }))}
        agents={agents.map((agent) => ({ id: agent.id, name: agent.name ?? agent.id }))}
      />
    </AppShell>
  );
}

function Stat({ icon: Icon, label, value, className }: {
  icon: typeof PlusCircle;
  label: string;
  value: number;
  className: string;
}) {
  return (
    <div className="rounded-xl border bg-card px-3 py-2 shadow-sm">
      <div className="flex items-center gap-1.5 text-xs text-muted-foreground"><Icon className="h-3.5 w-3.5" />{label}</div>
      <p className={`mt-0.5 text-lg font-bold ${className}`}>{value}</p>
    </div>
  );
}
