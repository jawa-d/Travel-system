"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import {
  Bell, BellRing, CheckCheck, Clock3, Mail,
  Search, Server
} from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { formatDate } from "@/lib/utils";
import { useLocalCollection } from "@/lib/local-storage";
import { useToast } from "@/components/ui/toast-provider";

type NotificationType = "SYSTEM" | "EXPIRY" | "EMAIL";
type NotificationStatus = "PENDING" | "SENT" | "READ" | "FAILED";

export type NotificationItem = {
  id: string;
  type: NotificationType;
  title: string;
  message: string;
  status: NotificationStatus;
  dueAt: string | null;
  createdAt: string;
};

const typeDetails = {
  SYSTEM: { label: "النظام", icon: Server, tone: "bg-blue-50 text-blue-600" },
  EXPIRY: { label: "انتهاء وثيقة", icon: Clock3, tone: "bg-amber-50 text-amber-600" },
  EMAIL: { label: "البريد", icon: Mail, tone: "bg-violet-50 text-violet-600" }
} as const;

const statusDetails = {
  PENDING: { label: "جديد", className: "border-blue-200 bg-blue-50 text-blue-700" },
  SENT: { label: "مرسل", className: "border-emerald-200 bg-emerald-50 text-emerald-700" },
  READ: { label: "مقروء", className: "border-slate-200 bg-slate-100 text-slate-600" },
  FAILED: { label: "فشل", className: "border-red-200 bg-red-50 text-red-700" }
} as const;

export function NotificationCenter({ notifications }: { notifications: NotificationItem[] }) {
  const router = useRouter();
  const [items, setItems] = useLocalCollection("notifications", notifications);
  const [query, setQuery] = useState("");
  const [filter, setFilter] = useState<"ALL" | "UNREAD" | NotificationType>("ALL");
  const [busy, setBusy] = useState<string | null>(null);
  const [error, setError] = useState("");
  const { toast } = useToast();

  const filtered = useMemo(() => {
    const text = query.trim().toLowerCase();
    return items.filter((item) => {
      const matchesFilter =
        filter === "ALL" ||
        (filter === "UNREAD" && item.status !== "READ") ||
        item.type === filter;
      return matchesFilter && (!text || `${item.title} ${item.message}`.toLowerCase().includes(text));
    });
  }, [items, query, filter]);

  async function markRead(id: string) {
    setBusy(id);
    setError("");
    const response = await fetch(`/api/notifications/${id}`, { method: "PATCH" });
    setBusy(null);
    if (!response.ok) {
      const result = await response.json().catch(() => null);
      setError(result?.error ?? "تعذر تحديث الإشعار");
      return;
    }
    setItems((current) => current.map((item) => item.id === id ? { ...item, status: "READ" } : item));
    toast({ title: "تم تعليم الإشعار كمقروء", tone: "success" });
    router.refresh();
  }

  async function markAllRead() {
    setBusy("all");
    setError("");
    const response = await fetch("/api/notifications", { method: "PATCH" });
    setBusy(null);
    if (!response.ok) {
      const result = await response.json().catch(() => null);
      setError(result?.error ?? "تعذر تحديث الإشعارات");
      return;
    }
    setItems((current) => current.map((item) => ({ ...item, status: "READ" })));
    toast({ title: "تم تعليم جميع الإشعارات كمقروءة", tone: "success" });
    router.refresh();
  }

  const unread = items.filter((item) => item.status !== "READ").length;
  const [browserPermission, setBrowserPermission] = useState<NotificationPermission | "unsupported">("unsupported");
  useEffect(() => {
    if ("Notification" in window) setBrowserPermission(Notification.permission);
  }, []);

  return (
    <>
      <div className="mb-5 flex flex-col gap-3 rounded-xl border bg-card p-3 shadow-sm lg:flex-row">
        <div className="relative flex-1">
          <Search className="absolute right-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input value={query} onChange={(event) => setQuery(event.target.value)} placeholder="ابحث في الإشعارات..." className="h-11 pr-10" />
        </div>
        <select value={filter} onChange={(event) => setFilter(event.target.value as typeof filter)} className="h-11 rounded-md border bg-background px-3 text-sm lg:w-44">
          <option value="ALL">جميع الإشعارات</option>
          <option value="UNREAD">غير المقروءة</option>
          <option value="SYSTEM">إشعارات النظام</option>
          <option value="EXPIRY">انتهاء الوثائق</option>
          <option value="EMAIL">البريد الإلكتروني</option>
        </select>
        <Button type="button" variant="outline" className="h-11" onClick={markAllRead} disabled={!unread || busy === "all"}>
          <CheckCheck className="h-4 w-4" />
          {busy === "all" ? "جارٍ التحديث..." : "تعليم الكل كمقروء"}
        </Button>
        {browserPermission !== "granted" && browserPermission !== "unsupported" ? (
          <Button type="button" variant="outline" className="h-11" onClick={async () => setBrowserPermission(await Notification.requestPermission())}>
            <BellRing className="h-4 w-4" />تفعيل إشعارات المتصفح
          </Button>
        ) : null}
      </div>

      {error && <p className="mb-4 rounded-xl border border-red-200 bg-red-50 p-4 text-sm text-red-700">{error}</p>}

      {filtered.length ? (
        <div className="space-y-3">
          {filtered.map((item) => {
            const type = typeDetails[item.type];
            const TypeIcon = type.icon;
            const unreadItem = item.status !== "READ";
            return (
              <Card key={item.id} className={`overflow-hidden transition-all ${unreadItem ? "border-primary/25 bg-primary/[0.02] shadow-sm" : "border-border/70"}`}>
                <CardContent className="p-5">
                  <div className="flex flex-col justify-between gap-4 md:flex-row md:items-start">
                    <div className="flex min-w-0 gap-3">
                      <div className={`relative flex h-11 w-11 shrink-0 items-center justify-center rounded-xl ${type.tone}`}>
                        <TypeIcon className="h-5 w-5" />
                        {unreadItem && <span className="absolute -left-1 -top-1 h-3 w-3 rounded-full border-2 border-white bg-primary" />}
                      </div>
                      <div className="min-w-0">
                        <div className="flex flex-wrap items-center gap-2">
                          <h3 className="font-bold">{item.title}</h3>
                          <Badge className={statusDetails[item.status].className}>{statusDetails[item.status].label}</Badge>
                        </div>
                        <p className="mt-1.5 text-sm leading-6 text-muted-foreground">{item.message}</p>
                        <div className="mt-2 flex flex-wrap items-center gap-3 text-xs text-muted-foreground">
                          <span>{type.label}</span>
                          <span>•</span>
                          <span>{item.dueAt ? `مستحق: ${formatDate(item.dueAt)}` : formatDate(item.createdAt)}</span>
                        </div>
                      </div>
                    </div>
                    {unreadItem && (
                      <Button type="button" size="sm" variant="outline" onClick={() => markRead(item.id)} disabled={busy === item.id}>
                        <CheckCheck className="h-4 w-4" />
                        {busy === item.id ? "جارٍ..." : "تعليم كمقروء"}
                      </Button>
                    )}
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>
      ) : (
        <Card className="border-dashed">
          <CardContent className="flex min-h-64 flex-col items-center justify-center text-center">
            <Bell className="mb-4 h-9 w-9 text-muted-foreground" />
            <h3 className="font-semibold">لا توجد إشعارات مطابقة</h3>
            <p className="mt-1 text-sm text-muted-foreground">غيّر البحث أو نوع الإشعار.</p>
          </CardContent>
        </Card>
      )}
    </>
  );
}
