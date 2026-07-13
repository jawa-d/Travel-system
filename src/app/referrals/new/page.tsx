import { Ship } from "lucide-react";
import { AppShell } from "@/components/app-shell";
import { ReferralForm } from "@/components/referral-form";
import { requirePagePermission } from "@/lib/page-guard";

export default async function NewReferralPage() {
  await requirePagePermission("referralsCreate");
  return (
    <AppShell>
      <div className="mb-6">
        <div className="mb-2 flex items-center gap-2 text-sm font-semibold text-primary"><Ship className="h-4 w-4" />إحالة بحرية</div>
        <h1 className="text-2xl font-black tracking-normal text-slate-950 dark:text-foreground sm:text-3xl">رفع حالة إحالة جديدة</h1>
        <p className="mt-2 max-w-2xl text-sm leading-6 text-muted-foreground">أدخل تفاصيل الحالة والغطاء والدفعات. الأنواع غير البحرية ظاهرة لكنها غير مفعلة حاليا.</p>
      </div>
      <ReferralForm />
    </AppShell>
  );
}
