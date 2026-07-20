"use client";

import { CheckCircle2, Clock3, FileCheck2, MessageCircle, PencilLine, Send, UserPlus, XCircle } from "lucide-react";
import { useMemo, useState } from "react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  formatPayloadKey,
  formatPayloadValue,
  type InsuranceModuleView,
  type InsuranceRequestView
} from "@/lib/insurance-request-ui";

const workflowIcons = [Clock3, PencilLine, FileCheck2, Send, MessageCircle, CheckCircle2, XCircle];

export function InsuranceRequestWorkspace({
  module,
  request
}: {
  module: InsuranceModuleView;
  request: InsuranceRequestView;
}) {
  const [status, setStatus] = useState(request.status);
  const [assignedTo, setAssignedTo] = useState(request.assignedTo);
  const [note, setNote] = useState("");
  const [notes, setNotes] = useState(request.internalNotes);
  const payloadRows = useMemo(() => Object.entries(request.payload), [request.payload]);

  function addNote() {
    const trimmed = note.trim();
    if (!trimmed) return;
    setNotes((current) => [{
      id: crypto.randomUUID(),
      author: "Current user",
      body: trimmed,
      createdAt: new Date().toISOString()
    }, ...current]);
    setNote("");
  }

  return (
    <div className="grid gap-6 xl:grid-cols-[minmax(0,1fr)_340px]">
      <div className="space-y-6">
        <section className="rounded-lg border bg-card">
          <div className="border-b bg-muted/10 p-4"><h2 className="text-base font-black">بيانات العميل</h2></div>
          <div className="grid gap-3 p-4 sm:grid-cols-2 lg:grid-cols-3">
            <Detail label="الاسم الكامل" value={request.customer.fullName} />
            <Detail label="الهاتف" value={request.customer.mobile} dir="ltr" />
            <Detail label="البريد الإلكتروني" value={request.customer.email || "-"} dir="ltr" />
            <Detail label="الرقم الوطني" value={request.customer.nationalId || "-"} dir="ltr" />
            <Detail label="المدينة" value={request.customer.city} />
            <Detail label="العنوان" value={request.customer.address} />
          </div>
        </section>

        <section className="rounded-lg border bg-card">
          <div className="border-b bg-muted/10 p-4">
            <h2 className="text-base font-black">بيانات الاستمارة المستلمة من البوابة</h2>
          </div>
          <div className="grid gap-3 p-4 md:grid-cols-2">
            {payloadRows.map(([key, value]) => (
              <Detail key={key} label={formatPayloadKey(key)} value={formatPayloadValue(value)} dir={typeof value === "number" || typeof value === "boolean" ? "ltr" : undefined} />
            ))}
          </div>
        </section>

        <section className="rounded-lg border bg-card">
          <div className="border-b bg-muted/10 p-4"><h2 className="text-base font-black">المستندات</h2></div>
          <div className="grid gap-3 p-4 md:grid-cols-2">
            {request.documents.length ? request.documents.map((document) => (
              <div key={document.key} className="rounded-lg border bg-muted/15 p-4">
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <p className="font-bold">{document.label}</p>
                    <p className="mt-1 truncate text-xs text-muted-foreground">{document.fileName}</p>
                    <p className="mt-1 text-xs text-muted-foreground" dir="ltr">{document.type} | {document.size}</p>
                  </div>
                  <Badge className={document.status === "received" ? "bg-emerald-100 text-emerald-700 hover:bg-emerald-100" : document.status === "missing" ? "bg-red-100 text-red-700 hover:bg-red-100" : "bg-amber-100 text-amber-700 hover:bg-amber-100"}>
                    {document.status === "received" ? "مستلم" : document.status === "missing" ? "ناقص" : "للمراجعة"}
                  </Badge>
                </div>
                <Button type="button" size="sm" variant="outline" className="mt-3" disabled>فتح عند الربط</Button>
              </div>
            )) : (
              <div className="rounded-lg border border-dashed p-6 text-sm text-muted-foreground md:col-span-2">لا توجد مرفقات في بيانات mock الحالية.</div>
            )}
          </div>
        </section>
      </div>

      <aside className="space-y-6">
        <section className="rounded-lg border bg-card">
          <div className="border-b bg-muted/10 p-4"><h2 className="text-base font-black">Workflow</h2></div>
          <div className="space-y-2 p-4">
            {module.statuses.map((item, index) => {
              const Icon = workflowIcons[index] ?? Clock3;
              return (
                <Button key={item} type="button" variant="outline" className="w-full justify-start" onClick={() => setStatus(item)}>
                  <Icon className="h-4 w-4" />
                  {module.statusLabels[item]}
                  {status === item ? <span className="mr-auto h-2 w-2 rounded-full bg-primary" /> : null}
                </Button>
              );
            })}
            <Badge className={module.statusClasses[status]}>{module.statusLabels[status]}</Badge>
          </div>
        </section>

        <section className="rounded-lg border bg-card">
          <div className="border-b bg-muted/10 p-4">
            <h2 className="flex items-center gap-2 text-base font-black"><UserPlus className="h-4 w-4 text-primary" />Assignment</h2>
          </div>
          <div className="space-y-3 p-4">
            <select value={assignedTo} onChange={(event) => setAssignedTo(event.target.value)} className="h-11 w-full rounded-lg border bg-background px-3 text-sm outline-none focus:ring-2 focus:ring-ring">
              <option>Unassigned</option>
              <option>Underwriting Team</option>
              <option>Casualty Team</option>
              <option>Property Team</option>
              <option>Engineering Team</option>
              <option>Travel Desk</option>
              <option>Health Desk</option>
              <option>Risk Control</option>
            </select>
            <p className="rounded-lg border bg-muted/15 p-3 text-sm font-bold">{assignedTo}</p>
          </div>
        </section>

        <section className="rounded-lg border bg-card">
          <div className="border-b bg-muted/10 p-4"><h2 className="text-base font-black">Actions</h2></div>
          <div className="grid gap-2 p-4">
            <Button type="button" variant="outline">طلب مستندات إضافية</Button>
            <Button type="button" variant="outline">تحويل للمكتتب</Button>
            <Button type="button" variant="outline">تجهيز عرض سعر</Button>
            <Button type="button">حفظ محلي</Button>
          </div>
        </section>

        <section className="rounded-lg border bg-card">
          <div className="border-b bg-muted/10 p-4"><h2 className="text-base font-black">Internal Notes</h2></div>
          <div className="space-y-3 p-4">
            <textarea value={note} onChange={(event) => setNote(event.target.value)} rows={4} placeholder="اكتب ملاحظة داخلية" className="w-full resize-y rounded-lg border bg-background px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-ring" />
            <Button type="button" className="w-full" onClick={addNote}>إضافة ملاحظة</Button>
            {notes.map((item) => (
              <div key={item.id} className="rounded-lg border bg-muted/15 p-3">
                <p className="text-xs font-bold text-primary">{item.author}</p>
                <p className="mt-1 whitespace-pre-wrap text-sm leading-6">{item.body}</p>
              </div>
            ))}
          </div>
        </section>
      </aside>
    </div>
  );
}

function Detail({ label, value, dir }: { label: string; value: React.ReactNode; dir?: "ltr" | "rtl" }) {
  return (
    <div className="rounded-lg border bg-muted/15 p-3">
      <p className="text-xs text-muted-foreground">{label}</p>
      <p className="mt-1.5 break-words text-sm font-bold" dir={dir}>{value}</p>
    </div>
  );
}

