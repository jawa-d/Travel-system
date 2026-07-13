"use client";

import * as Dialog from "@radix-ui/react-dialog";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { BadgeDollarSign, Eye, X } from "lucide-react";
import { ReferralStatus } from "@prisma/client";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { useToast } from "@/components/ui/toast-provider";
import { referralStatusLabels } from "@/lib/referrals";
import { formatCurrency, formatDate } from "@/lib/utils";

export type ReferralListItem = {
  id: string;
  referralNumber: string;
  status: ReferralStatus;
  applicantName: string | null;
  beneficiaryName: string | null;
  totalPremium: string;
  currency: string;
  createdByName: string | null;
  createdByBank: string | null;
  createdAt: string;
  commission: { id: string; commissionAmount: string } | null;
};

export function ReferralsList({ referrals, canManage, canPayCommission }: { referrals: ReferralListItem[]; canManage: boolean; canPayCommission: boolean }) {
  const router = useRouter();
  const { toast } = useToast();
  const [busy, setBusy] = useState("");
  const [commissionReferral, setCommissionReferral] = useState<ReferralListItem | null>(null);
  const [premiumAmount, setPremiumAmount] = useState("");
  const [notes, setNotes] = useState("");

  async function updateStatus(id: string, status: ReferralStatus) {
    setBusy(id);
    const response = await fetch(`/api/referrals/${id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ status })
    });
    const result = await response.json().catch(() => null);
    setBusy("");
    if (!response.ok) {
      toast({ title: "تعذر تحديث حالة الإحالة", description: result?.error, tone: "error" });
      return;
    }
    router.refresh();
  }

  function openCommission(referral: ReferralListItem) {
    setCommissionReferral(referral);
    setPremiumAmount(referral.totalPremium);
    setNotes("");
  }

  async function payCommission() {
    if (!commissionReferral) return;
    setBusy(commissionReferral.id);
    const response = await fetch(`/api/referrals/${commissionReferral.id}/commission`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ premiumAmount, commissionRate: 10, notes })
    });
    const result = await response.json().catch(() => null);
    setBusy("");
    if (!response.ok) {
      toast({ title: "تعذر صرف العمولة", description: result?.error, tone: "error" });
      return;
    }
    toast({ title: "تم صرف العمولة", description: "تم احتساب 10% من قسط الوثيقة وتسجيلها.", tone: "success" });
    setCommissionReferral(null);
    router.refresh();
  }

  return (
    <>
      <div className="overflow-x-auto">
        <table className="w-full min-w-[980px] text-sm">
          <thead className="bg-muted/40 text-xs text-muted-foreground">
            <tr>
              <th className="p-3 text-right">رقم الإحالة</th>
              <th className="p-3 text-right">طالب التأمين</th>
              <th className="p-3 text-right">المستفيد</th>
              <th className="p-3 text-right">الجهة الرافعة</th>
              <th className="p-3 text-right">القسط الكلي</th>
              <th className="p-3 text-right">الحالة</th>
              <th className="p-3 text-right">التاريخ</th>
              <th className="p-3 text-left">إجراءات</th>
            </tr>
          </thead>
          <tbody className="divide-y">
            {referrals.map((referral) => (
              <tr key={referral.id} className="hover:bg-muted/20">
                <td className="p-3 font-mono font-black text-primary" dir="ltr">{referral.referralNumber}</td>
                <td className="p-3 font-bold">{referral.applicantName || "-"}</td>
                <td className="p-3">{referral.beneficiaryName || "-"}</td>
                <td className="p-3">{referral.createdByBank || referral.createdByName || "-"}</td>
                <td className="p-3" dir="ltr">{formatCurrency(Number(referral.totalPremium))} {referral.currency}</td>
                <td className="p-3">
                  {canManage ? (
                    <select value={referral.status} disabled={busy === referral.id} onChange={(event) => updateStatus(referral.id, event.target.value as ReferralStatus)} className="h-9 rounded-md border bg-background px-2 text-xs font-bold">
                      {Object.entries(referralStatusLabels).map(([value, label]) => <option key={value} value={value}>{label}</option>)}
                    </select>
                  ) : (
                    <Badge className={statusClasses[referral.status]}>{referralStatusLabels[referral.status]}</Badge>
                  )}
                </td>
                <td className="p-3 text-muted-foreground">{formatDate(referral.createdAt)}</td>
                <td className="p-3">
                  <div className="flex justify-end gap-2">
                    {canPayCommission ? (
                      referral.commission ? (
                        <Badge className="border-emerald-200 bg-emerald-50 text-emerald-700">عمولة مصروفة</Badge>
                      ) : (
                        <Button type="button" size="sm" variant="secondary" disabled={referral.status !== "ISSUED"} onClick={() => openCommission(referral)}>
                          <BadgeDollarSign className="h-4 w-4" />
                          صرف العمولة
                        </Button>
                      )
                    ) : null}
                    <Button asChild size="sm" variant="outline">
                      <Link href={`/referrals/${referral.id}`}><Eye className="h-4 w-4" />عرض</Link>
                    </Button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <Dialog.Root open={Boolean(commissionReferral)} onOpenChange={(open) => !open && setCommissionReferral(null)}>
        <Dialog.Portal>
          <Dialog.Overlay className="fixed inset-0 z-[80] bg-slate-950/55 backdrop-blur-sm" />
          <Dialog.Content className="fixed left-1/2 top-1/2 z-[81] w-[calc(100%-2rem)] max-w-lg -translate-x-1/2 -translate-y-1/2 rounded-xl border bg-card shadow-2xl">
            <div className="flex items-start justify-between border-b p-5">
              <div>
                <Dialog.Title className="text-lg font-black">صرف عمولة الإحالة</Dialog.Title>
                <Dialog.Description className="mt-1 text-sm text-muted-foreground">النسبة ثابتة 10% من قسط الوثيقة.</Dialog.Description>
              </div>
              <Dialog.Close className="rounded-lg p-1.5 text-muted-foreground hover:bg-muted"><X className="h-4 w-4" /></Dialog.Close>
            </div>
            <div className="space-y-4 p-5">
              <label className="space-y-1.5 text-sm font-bold">
                <span>القسط الكلي</span>
                <input value={premiumAmount} onChange={(event) => setPremiumAmount(event.target.value)} type="number" min="0" step="0.01" className="h-11 w-full rounded-lg border bg-background px-3" dir="ltr" />
              </label>
              <div className="rounded-lg border bg-muted/20 p-3">
                <p className="text-xs text-muted-foreground">مبلغ العمولة 10%</p>
                <p className="mt-1 text-2xl font-black text-primary" dir="ltr">{formatCurrency(Number(premiumAmount || 0) * 0.1)}</p>
              </div>
              <label className="space-y-1.5 text-sm font-bold">
                <span>ملاحظات</span>
                <textarea value={notes} onChange={(event) => setNotes(event.target.value)} className="min-h-24 w-full rounded-lg border bg-background px-3 py-2" />
              </label>
            </div>
            <div className="flex justify-end gap-2 border-t p-4">
              <Button type="button" variant="outline" onClick={() => setCommissionReferral(null)}>تراجع</Button>
              <Button type="button" disabled={!Number(premiumAmount) || busy === commissionReferral?.id} onClick={payCommission}>
                <BadgeDollarSign className="h-4 w-4" />
                صرف العمولة
              </Button>
            </div>
          </Dialog.Content>
        </Dialog.Portal>
      </Dialog.Root>
    </>
  );
}

const statusClasses: Record<ReferralStatus, string> = {
  RECEIVED: "bg-blue-100 text-blue-700 hover:bg-blue-100",
  UNDER_REVIEW: "bg-cyan-100 text-cyan-700 hover:bg-cyan-100",
  CONTACTING: "bg-amber-100 text-amber-700 hover:bg-amber-100",
  ISSUED: "bg-emerald-100 text-emerald-700 hover:bg-emerald-100"
};
