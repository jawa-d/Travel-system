"use client";

import Link from "next/link";
import { useMemo, useState } from "react";
import {
  BadgeDollarSign, Banknote, ChevronDown,
  Download, FileCheck2, FileText, RotateCcw, Search, TrendingUp, UserRound
} from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { formatCurrency, formatDate } from "@/lib/utils";

type PolicyStatus = "DRAFT" | "ACTIVE" | "EXPIRED" | "CANCELLED";

type AgentPolicy = {
  id: string;
  policyNumber: string;
  customerName: string;
  passportNumber: string;
  destination: string;
  planName: string;
  premium: number;
  coverageAmount: number;
  commission: number;
  status: PolicyStatus;
  issuedAt: string;
  claimsCount: number;
  endorsementsCount: number;
  cancellation: {
    cancellationNumber: string;
    refundAmount: number;
    administrativeFees: number;
    createdAt: string;
  } | null;
};

export type AgentAccount = {
  id: string;
  name: string;
  email: string;
  active: boolean;
  agencyName: string | null;
  agencyCode: string | null;
  joinedAt: string;
  commissionRate: number;
  grossPremium: number;
  eligiblePremium: number;
  cancelledPremium: number;
  refunds: number;
  administrativeFees: number;
  earnedCommission: number;
  lostCommission: number;
  netProduction: number;
  policies: AgentPolicy[];
};

const statusDetails = {
  DRAFT: { label: "مسودة", className: "border-slate-200 bg-slate-100 text-slate-700" },
  ACTIVE: { label: "فعّالة", className: "border-emerald-200 bg-emerald-50 text-emerald-700" },
  EXPIRED: { label: "منتهية", className: "border-amber-200 bg-amber-50 text-amber-700" },
  CANCELLED: { label: "ملغاة", className: "border-red-200 bg-red-50 text-red-700" }
} as const;

export function AgentAccountsDashboard({ accounts }: { accounts: AgentAccount[] }) {
  const [query, setQuery] = useState("");
  const [accountStatus, setAccountStatus] = useState<"ALL" | "ACTIVE" | "INACTIVE">("ALL");
  const [policyStatus, setPolicyStatus] = useState<"ALL" | PolicyStatus>("ALL");
  const [from, setFrom] = useState("");
  const [to, setTo] = useState("");
  const [sort, setSort] = useState<"COMMISSION" | "PREMIUM" | "POLICIES" | "NAME">("COMMISSION");

  const filtered = useMemo(() => {
    const text = query.trim().toLowerCase();
    const fromDate = from ? new Date(`${from}T00:00:00`) : null;
    const toDate = to ? new Date(`${to}T23:59:59.999`) : null;

    return accounts
      .map((account) => {
        const policies = account.policies.filter((policy) => {
          const issuedAt = new Date(policy.issuedAt);
          return (policyStatus === "ALL" || policy.status === policyStatus) &&
            (!fromDate || issuedAt >= fromDate) &&
            (!toDate || issuedAt <= toDate) &&
            (!text || [
              account.name, account.email, account.agencyName ?? "",
              policy.policyNumber, policy.customerName, policy.passportNumber, policy.destination
            ].some((value) => value.toLowerCase().includes(text)));
        });
        return { ...account, visiblePolicies: policies };
      })
      .filter((account) =>
        (accountStatus === "ALL" || (accountStatus === "ACTIVE" ? account.active : !account.active)) &&
        (!text || account.visiblePolicies.length > 0 ||
          [account.name, account.email, account.agencyName ?? ""].some((value) => value.toLowerCase().includes(text))) &&
        ((!from && !to && policyStatus === "ALL") || account.visiblePolicies.length > 0)
      )
      .sort((a, b) => {
        if (sort === "NAME") return a.name.localeCompare(b.name, "ar");
        if (sort === "POLICIES") return b.visiblePolicies.length - a.visiblePolicies.length;
        if (sort === "PREMIUM") return visiblePremium(b) - visiblePremium(a);
        return visibleCommission(b) - visibleCommission(a);
      });
  }, [accounts, accountStatus, from, policyStatus, query, sort, to]);

  function reset() {
    setQuery("");
    setAccountStatus("ALL");
    setPolicyStatus("ALL");
    setFrom("");
    setTo("");
    setSort("COMMISSION");
  }

  const exportQuery = new URLSearchParams({
    resource: "agent-accounts",
    format: "xlsx",
    ...(query ? { q: query } : {}),
    ...(from ? { from } : {}),
    ...(to ? { to } : {}),
    ...(policyStatus !== "ALL" ? { status: policyStatus } : {})
  }).toString();

  return (
    <>
      <Card className="mb-6 border-slate-200/80 shadow-sm">
        <CardHeader className="border-b bg-slate-50/60">
          <div className="flex flex-col justify-between gap-3 lg:flex-row lg:items-center">
            <div>
              <CardTitle>سجل حسابات الوكلاء</CardTitle>
              <p className="mt-1 text-sm text-muted-foreground">ابحث باسم الوكيل أو الوثيقة أو العميل، وحدد الفترة والحالة المطلوبة.</p>
            </div>
            <div className="flex gap-2">
              <Button asChild variant="outline">
                <Link href={`/api/export?${exportQuery}`}><Download className="h-4 w-4" />تصدير Excel</Link>
              </Button>
              <Button type="button" variant="ghost" onClick={reset}><RotateCcw className="h-4 w-4" />إعادة تعيين</Button>
            </div>
          </div>
        </CardHeader>
        <CardContent className="grid gap-3 p-4 md:grid-cols-2 xl:grid-cols-6">
          <div className="relative md:col-span-2">
            <Search className="absolute right-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <Input value={query} onChange={(event) => setQuery(event.target.value)} className="h-11 pr-10" placeholder="وكيل، بريد، وثيقة، عميل، جواز أو وجهة..." />
          </div>
          <Select value={accountStatus} onChange={(value) => setAccountStatus(value as typeof accountStatus)} options={[
            ["ALL", "كل الوكلاء"], ["ACTIVE", "الوكلاء الفعّالون"], ["INACTIVE", "الوكلاء المعطلون"]
          ]} />
          <Select value={policyStatus} onChange={(value) => setPolicyStatus(value as typeof policyStatus)} options={[
            ["ALL", "كل الوثائق"], ["ACTIVE", "فعّالة"], ["DRAFT", "مسودة"], ["EXPIRED", "منتهية"], ["CANCELLED", "ملغاة"]
          ]} />
          <Input type="date" value={from} onChange={(event) => setFrom(event.target.value)} className="h-11" aria-label="من تاريخ" />
          <Input type="date" value={to} onChange={(event) => setTo(event.target.value)} className="h-11" aria-label="إلى تاريخ" />
          <div className="md:col-span-2 xl:col-span-6">
            <Select value={sort} onChange={(value) => setSort(value as typeof sort)} options={[
              ["COMMISSION", "ترتيب حسب أعلى عمولة"],
              ["PREMIUM", "ترتيب حسب أعلى أقساط"],
              ["POLICIES", "ترتيب حسب عدد الوثائق"],
              ["NAME", "ترتيب حسب الاسم"]
            ]} />
          </div>
        </CardContent>
      </Card>

      <div className="space-y-5">
        {filtered.map((account, index) => {
          const premium = visiblePremium(account);
          const commission = visibleCommission(account);
          return (
            <details key={account.id} className="group overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm" open={index === 0}>
              <summary className="cursor-pointer list-none p-5 transition-colors hover:bg-slate-50/70">
                <div className="flex flex-col justify-between gap-5 xl:flex-row xl:items-center">
                  <div className="flex min-w-0 items-center gap-4">
                    <span className="grid h-14 w-14 shrink-0 place-items-center rounded-2xl bg-gradient-to-br from-primary to-cyan-600 text-xl font-black text-white shadow-lg shadow-primary/15">
                      {account.name.slice(0, 1)}
                    </span>
                    <div className="min-w-0">
                      <div className="flex flex-wrap items-center gap-2">
                        <h2 className="truncate text-lg font-black">{account.name}</h2>
                        <Badge className={account.active ? "bg-emerald-50 text-emerald-700" : "bg-red-50 text-red-700"}>
                          {account.active ? "حساب فعّال" : "حساب معطل"}
                        </Badge>
                        {account.agencyCode ? <Badge className="border border-slate-200 bg-white text-slate-600">{account.agencyCode}</Badge> : null}
                      </div>
                      <p className="mt-1 truncate text-sm text-muted-foreground" dir="ltr">{account.email}</p>
                      <p className="mt-1 text-xs text-muted-foreground">
                        {account.agencyName ?? "وكيل مستقل"} · انضم {formatDate(account.joinedAt)}
                      </p>
                    </div>
                  </div>

                  <div className="grid flex-1 gap-3 sm:grid-cols-2 lg:grid-cols-4 xl:max-w-3xl">
                    <MiniMetric label="الوثائق" value={account.visiblePolicies.length} icon={FileText} />
                    <MiniMetric label="الأقساط" value={formatCurrency(premium)} icon={Banknote} />
                    <MiniMetric label="العمولة" value={formatCurrency(commission)} icon={BadgeDollarSign} />
                    <MiniMetric label="صافي الإنتاج" value={formatCurrency(account.netProduction)} icon={TrendingUp} />
                  </div>
                  <ChevronDown className="h-5 w-5 shrink-0 text-slate-400 transition-transform group-open:rotate-180" />
                </div>
              </summary>

              <div className="border-t bg-slate-50/50 p-5">
                <div className="mb-5 grid gap-3 sm:grid-cols-2 xl:grid-cols-7">
                  <Financial label="إجمالي الإصدار" value={account.grossPremium} tone="text-slate-800" />
                  <Financial label="أقساط مستحقة للعمولة" value={account.eligiblePremium} tone="text-blue-700" />
                  <Financial label="عمولة مستحقة" value={account.earnedCommission} tone="text-emerald-700" />
                  <Financial label="عمولة ملغاة" value={account.lostCommission} tone="text-red-600" />
                  <Financial label="إصدار ملغى" value={account.cancelledPremium} tone="text-red-700" />
                  <Financial label="استردادات العملاء" value={account.refunds} tone="text-amber-700" />
                  <Financial label="رسوم إدارية" value={account.administrativeFees} tone="text-violet-700" />
                </div>

                <div className="overflow-x-auto rounded-xl border bg-white">
                  <table className="w-full min-w-[1050px] text-sm">
                    <thead className="bg-slate-50 text-xs text-slate-500">
                      <tr>
                        <th className="p-3 text-right">الوثيقة والعميل</th>
                        <th className="p-3 text-right">الوجهة والخطة</th>
                        <th className="p-3 text-right">تاريخ الإصدار</th>
                        <th className="p-3 text-right">الحالة</th>
                        <th className="p-3 text-right">القسط</th>
                        <th className="p-3 text-right">العمولة</th>
                        <th className="p-3 text-right">الحركات</th>
                        <th className="p-3 text-left">التفاصيل</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y">
                      {account.visiblePolicies.map((policy) => (
                        <tr key={policy.id} className="hover:bg-slate-50/70">
                          <td className="p-3">
                            <p className="font-mono font-black text-primary" dir="ltr">{policy.policyNumber}</p>
                            <p className="mt-1 font-semibold">{policy.customerName}</p>
                            <p className="text-xs text-muted-foreground" dir="ltr">{policy.passportNumber}</p>
                          </td>
                          <td className="p-3">
                            <p className="font-semibold">{policy.destination}</p>
                            <p className="text-xs text-muted-foreground">{policy.planName}</p>
                          </td>
                          <td className="p-3 text-muted-foreground">{formatDate(policy.issuedAt)}</td>
                          <td className="p-3"><Badge className={statusDetails[policy.status].className}>{statusDetails[policy.status].label}</Badge></td>
                          <td className="p-3 font-black" dir="ltr">{formatCurrency(policy.premium)}</td>
                          <td className="p-3 font-black text-emerald-700" dir="ltr">{formatCurrency(policy.commission)}</td>
                          <td className="p-3">
                            <p>{policy.endorsementsCount} ملحق · {policy.claimsCount} مطالبة</p>
                            {policy.cancellation ? (
                              <p className="mt-1 text-xs text-red-600">استرداد {formatCurrency(policy.cancellation.refundAmount)}</p>
                            ) : null}
                          </td>
                          <td className="p-3 text-left">
                            <Button asChild size="sm" variant="outline"><Link href={`/policies/${policy.id}`}>فتح الوثيقة</Link></Button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                  {!account.visiblePolicies.length ? (
                    <div className="p-10 text-center text-sm text-muted-foreground">لا توجد وثائق مطابقة ضمن المرشحات الحالية.</div>
                  ) : null}
                </div>
              </div>
            </details>
          );
        })}
      </div>

      {!filtered.length ? (
        <Card className="border-dashed">
          <CardContent className="flex min-h-64 flex-col items-center justify-center text-center">
            <UserRound className="mb-4 h-10 w-10 text-muted-foreground" />
            <h3 className="font-bold">لا توجد حسابات مطابقة</h3>
            <p className="mt-1 text-sm text-muted-foreground">غيّر البحث أو الفترة أو حالات التصفية.</p>
          </CardContent>
        </Card>
      ) : null}
    </>
  );
}

function visiblePremium(account: AgentAccount & { visiblePolicies?: AgentPolicy[] }) {
  return (account.visiblePolicies ?? account.policies).reduce((sum, policy) => sum + policy.premium, 0);
}

function visibleCommission(account: AgentAccount & { visiblePolicies?: AgentPolicy[] }) {
  return (account.visiblePolicies ?? account.policies).reduce((sum, policy) => sum + policy.commission, 0);
}

function Select({ value, onChange, options }: {
  value: string;
  onChange: (value: string) => void;
  options: [string, string][];
}) {
  return (
    <select value={value} onChange={(event) => onChange(event.target.value)} className="h-11 rounded-md border bg-background px-3 text-sm">
      {options.map(([optionValue, label]) => <option key={optionValue} value={optionValue}>{label}</option>)}
    </select>
  );
}

function MiniMetric({ label, value, icon: Icon }: { label: string; value: string | number; icon: typeof FileCheck2 }) {
  return (
    <div className="rounded-xl border bg-white p-3">
      <div className="flex items-center gap-2 text-xs text-muted-foreground"><Icon className="h-4 w-4 text-primary" />{label}</div>
      <p className="mt-1 truncate font-black">{value}</p>
    </div>
  );
}

function Financial({ label, value, tone }: { label: string; value: number; tone: string }) {
  return (
    <div className="rounded-xl border bg-white p-3">
      <p className="text-xs text-muted-foreground">{label}</p>
      <p className={`mt-1 font-black ${tone}`} dir="ltr">{formatCurrency(value)}</p>
    </div>
  );
}
