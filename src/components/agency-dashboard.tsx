"use client";

import Link from "next/link";
import { useMemo, useState } from "react";
import {
  CalendarDays, CheckCircle2, Download, FileText, MapPin,
  Plane, Search, ShieldX, UserRound
} from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { formatCurrency, formatDate } from "@/lib/utils";
import { useLocalCollection } from "@/lib/local-storage";

type PolicyStatus = "DRAFT" | "ACTIVE" | "EXPIRED" | "CANCELLED";

export type AgencyPolicy = {
  id: string;
  policyNumber: string;
  customerName: string;
  destinationName: string;
  planName: string;
  departureDate: string;
  returnDate: string;
  premium: string;
  status: PolicyStatus;
};

const statuses = {
  DRAFT: { label: "مسودة", className: "border-slate-200 bg-slate-100 text-slate-700" },
  ACTIVE: { label: "فعالة", className: "border-emerald-200 bg-emerald-50 text-emerald-700" },
  EXPIRED: { label: "منتهية", className: "border-amber-200 bg-amber-50 text-amber-700" },
  CANCELLED: { label: "ملغاة", className: "border-red-200 bg-red-50 text-red-700" }
} as const;

export function AgencyDashboard({ policies, commissionRate }: { policies: AgencyPolicy[]; commissionRate: number }) {
  const [items] = useLocalCollection("agency-policies", policies);
  const [query, setQuery] = useState("");
  const [status, setStatus] = useState<"ALL" | PolicyStatus>("ALL");

  const filtered = useMemo(() => {
    const text = query.trim().toLowerCase();
    return items.filter((policy) =>
      (status === "ALL" || policy.status === status) &&
      (!text || [policy.policyNumber, policy.customerName, policy.destinationName].some((value) => value.toLowerCase().includes(text)))
    );
  }, [items, query, status]);

  return (
    <>
      <div className="mb-5 flex flex-col gap-3 rounded-xl border bg-card p-3 shadow-sm sm:flex-row">
        <div className="relative flex-1">
          <Search className="absolute right-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input value={query} onChange={(event) => setQuery(event.target.value)} placeholder="ابحث برقم الوثيقة، العميل أو الوجهة..." className="h-11 pr-10" />
        </div>
        <select value={status} onChange={(event) => setStatus(event.target.value as typeof status)} className="h-11 rounded-md border bg-background px-3 text-sm sm:w-44">
          <option value="ALL">جميع الحالات</option>
          {Object.entries(statuses).map(([value, item]) => <option key={value} value={value}>{item.label}</option>)}
        </select>
      </div>

      {filtered.length ? (
        <div className="grid gap-4 2xl:grid-cols-2">
          {filtered.map((policy) => {
            const commission = Number(policy.premium) * commissionRate;
            return (
              <Card key={policy.id} className="overflow-hidden border-border/80 shadow-sm transition-all hover:-translate-y-0.5 hover:shadow-md">
                <CardContent className="p-0">
                  <div className="p-5">
                    <div className="flex items-start justify-between gap-4">
                      <div className="flex min-w-0 items-center gap-3">
                        <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-primary/10 text-primary">
                          <FileText className="h-5 w-5" />
                        </div>
                        <div className="min-w-0">
                          <p className="truncate font-mono text-sm font-black text-primary" dir="ltr">{policy.policyNumber}</p>
                          <div className="mt-1 flex items-center gap-2">
                            <UserRound className="h-3.5 w-3.5 text-muted-foreground" />
                            <h3 className="truncate font-bold">{policy.customerName}</h3>
                          </div>
                        </div>
                      </div>
                      <Badge className={statuses[policy.status].className}>
                        {policy.status === "ACTIVE" ? <CheckCircle2 className="ml-1 h-3 w-3" /> : policy.status === "CANCELLED" ? <ShieldX className="ml-1 h-3 w-3" /> : null}
                        {statuses[policy.status].label}
                      </Badge>
                    </div>

                    <div className="mt-5 grid gap-3 sm:grid-cols-2">
                      <Info icon={MapPin} label="الوجهة" value={policy.destinationName} />
                      <Info icon={Plane} label="الخطة" value={policy.planName} />
                      <Info icon={CalendarDays} label="تاريخ المغادرة" value={formatDate(policy.departureDate)} />
                      <Info icon={CalendarDays} label="تاريخ العودة" value={formatDate(policy.returnDate)} />
                    </div>

                    <div className="mt-4 grid grid-cols-2 gap-3">
                      <div className="rounded-xl bg-primary/5 p-3">
                        <p className="text-xs text-muted-foreground">قسط الوثيقة</p>
                        <p className="mt-1 font-black text-primary" dir="ltr">{formatCurrency(policy.premium)}</p>
                      </div>
                      <div className="rounded-xl bg-emerald-50 p-3">
                        <p className="text-xs text-emerald-700">عمولتك ({commissionRate * 100}%)</p>
                        <p className="mt-1 font-black text-emerald-700" dir="ltr">{formatCurrency(commission)}</p>
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center justify-between border-t bg-muted/20 px-5 py-3">
                    <span className="text-xs text-muted-foreground">وثيقة صادرة عبر البوابة</span>
                    <Button asChild size="sm" variant="outline">
                      <Link href={`/api/policies/${policy.id}/pdf`}><Download className="h-4 w-4" />تحميل PDF</Link>
                    </Button>
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>
      ) : (
        <Card className="border-dashed">
          <CardContent className="flex min-h-64 flex-col items-center justify-center text-center">
            <FileText className="mb-4 h-9 w-9 text-muted-foreground" />
            <h3 className="font-semibold">لا توجد وثائق مطابقة</h3>
            <p className="mt-1 text-sm text-muted-foreground">غيّر البحث أو مرشح الحالة.</p>
          </CardContent>
        </Card>
      )}
    </>
  );
}

function Info({ icon: Icon, label, value }: { icon: typeof MapPin; label: string; value: string }) {
  return (
    <div className="flex items-start gap-2 rounded-xl border bg-muted/15 p-3">
      <Icon className="mt-0.5 h-4 w-4 shrink-0 text-primary" />
      <div className="min-w-0">
        <p className="text-xs text-muted-foreground">{label}</p>
        <p className="mt-0.5 truncate text-sm font-semibold">{value}</p>
      </div>
    </div>
  );
}
