import { Banknote, FileX2, ReceiptText } from "lucide-react";
import { AppShell } from "@/components/app-shell";
import { CancellationManager } from "@/components/cancellation-manager";
import { Card, CardContent } from "@/components/ui/card";
import { getDemoCancellations } from "@/lib/demo-cancellation-store";
import { getDemoPolicies } from "@/lib/demo-policy-store";
import { isDirectAccessEnabled } from "@/lib/direct-access";
import { requirePagePermission } from "@/lib/page-guard";
import { prisma } from "@/lib/prisma";
import { formatCurrency } from "@/lib/utils";
import { visiblePolicyWhere } from "@/lib/policy-access";

export default async function CancellationsPage() {
  const user = await requirePagePermission("cancellationsRead");
  const cancellations = isDirectAccessEnabled()
    ? getDemoCancellations()
    : await prisma.cancellation.findMany({
        where: { policy: visiblePolicyWhere(user) },
        include: { policy: { include: { customer: true } } },
        orderBy: { createdAt: "desc" }
      });
  const cancellationReasons = isDirectAccessEnabled() ? [] : await prisma.lookupValue.findMany({
    where: { category: "CANCELLATION_REASON", active: true }, orderBy: { sortOrder: "asc" }
  });

  const cancelledPolicyIds = new Set(cancellations.map((item) => item.policy.id));
  const availablePolicies = isDirectAccessEnabled()
    ? getDemoPolicies().filter((policy) => policy.status !== "CANCELLED" && !cancelledPolicyIds.has(policy.id))
    : await prisma.policy.findMany({
        where: { AND: [visiblePolicyWhere(user), { status: { not: "CANCELLED" }, cancellation: null }] },
        include: { customer: true },
        orderBy: { createdAt: "desc" },
        take: 100
      });

  const totalRefunds = cancellations.reduce((sum, item) => sum + Number(item.refundAmount), 0);
  const totalFees = cancellations.reduce((sum, item) => sum + Number(item.administrativeFees), 0);

  return (
    <AppShell>
      <div className="mb-6">
        <div className="mb-2 flex items-center gap-2 text-sm font-medium text-red-600">
          <FileX2 className="h-4 w-4" />إلغاء وثائق التأمين
        </div>
        <h1 className="text-2xl font-bold tracking-tight sm:text-3xl">إدارة الإلغاءات</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          احتساب الاسترداد، إلغاء الوثيقة، وإصدار شهادة الإلغاء.
        </p>
      </div>

      <div className="mb-6 grid gap-3 sm:grid-cols-3">
        <Stat icon={FileX2} label="إجمالي الإلغاءات" value={cancellations.length} className="bg-red-50 text-red-600" />
        <Stat icon={Banknote} label="إجمالي الاستردادات" value={formatCurrency(totalRefunds)} className="bg-emerald-50 text-emerald-600" />
        <Stat icon={ReceiptText} label="الرسوم الإدارية" value={formatCurrency(totalFees)} className="bg-amber-50 text-amber-600" />
      </div>

      <CancellationManager
        canCreate={user.role !== "AGENT"}
        cancellationReasons={(cancellationReasons.length ? cancellationReasons.map((item) => ({ value: item.value, label: item.labelAr })) : [
          { value: "VISA_REJECTION", label: "رفض التأشيرة" },
          { value: "TRIP_CANCELLATION", label: "إلغاء الرحلة" },
          { value: "CUSTOMER_REQUEST", label: "طلب العميل" },
          { value: "ISSUANCE_ERROR", label: "خطأ في الإصدار" }
        ])}
        cancellations={cancellations.map((item) => ({
          id: item.id,
          cancellationNumber: item.cancellationNumber,
          policyNumber: item.policy.policyNumber,
          customerName: item.policy.customer.arabicName,
          reason: item.reason,
          notes: item.notes,
          premium: String("premium" in item.policy ? item.policy.premium : 0),
          refundAmount: String(item.refundAmount),
          administrativeFees: String(item.administrativeFees),
          createdAt: item.createdAt.toISOString()
        }))}
        policies={availablePolicies.map((policy) => ({
          policyNumber: policy.policyNumber,
          customerName: policy.customer.arabicName,
          premium: String(policy.premium)
        }))}
      />
    </AppShell>
  );
}

function Stat({ icon: Icon, label, value, className }: {
  icon: typeof FileX2;
  label: string;
  value: string | number;
  className: string;
}) {
  return (
    <Card className="shadow-sm">
      <CardContent className="flex items-center gap-3 p-4">
        <div className={`flex h-10 w-10 items-center justify-center rounded-xl ${className}`}><Icon className="h-5 w-5" /></div>
        <div><p className="text-xs text-muted-foreground">{label}</p><p className="mt-0.5 text-xl font-black">{value}</p></div>
      </CardContent>
    </Card>
  );
}
