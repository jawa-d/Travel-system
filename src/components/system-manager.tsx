"use client";

import { useRef, useState } from "react";
import { ArchiveRestore, DatabaseBackup, RotateCcw, ShieldCheck, Trash2, UserPlus, Users } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { clearStoredFiles, exportStoredFiles, importStoredFiles } from "@/lib/file-storage";
import { appendLocalAudit, useLocalCollection } from "@/lib/local-storage";
import { ConfirmDialog } from "@/components/ui/confirm-dialog";
import { useToast } from "@/components/ui/toast-provider";

type Role = "SUPER_ADMIN" | "ADMIN" | "UNDERWRITER" | "FINANCE" | "AGENT" | "VIEWER";
type LocalUser = { id: string; name: string; email: string; role: Role; active: boolean };

const roles: Record<Role, string> = {
  SUPER_ADMIN: "مدير عام", ADMIN: "مدير", UNDERWRITER: "مكتتب",
  FINANCE: "المالية", AGENT: "وكيل", VIEWER: "مشاهد"
};

const initialUsers: LocalUser[] = [{
  id: "local-super-admin",
  name: "مدير تجريبي",
  email: "direct@trinsu.local",
  role: "SUPER_ADMIN",
  active: true
}];

export function SystemManager() {
  const [users, setUsers] = useLocalCollection<LocalUser>("users", initialUsers);
  const [busy, setBusy] = useState("");
  const fileRef = useRef<HTMLInputElement>(null);
  const [confirmReset, setConfirmReset] = useState(false);
  const { toast } = useToast();

  async function backup() {
    setBusy("backup");
    const storage: Record<string, unknown> = {};
    for (let index = 0; index < localStorage.length; index++) {
      const storageKey = localStorage.key(index);
      if (storageKey?.startsWith("trinsu:")) storage[storageKey] = JSON.parse(localStorage.getItem(storageKey) ?? "null");
    }
    const payload = { version: 1, exportedAt: new Date().toISOString(), storage, files: await exportStoredFiles() };
    const link = document.createElement("a");
    link.href = URL.createObjectURL(new Blob([JSON.stringify(payload)], { type: "application/json" }));
    link.download = `trinsu-backup-${new Date().toISOString().slice(0, 10)}.json`;
    link.click();
    URL.revokeObjectURL(link.href);
    appendLocalAudit("BACKUP_CREATED", "System");
    setBusy("");
    toast({ title: "تم إنشاء النسخة الاحتياطية", tone: "success" });
  }

  async function restore(file: File) {
    setBusy("restore");
    try {
      const payload = JSON.parse(await file.text()) as {
        storage?: Record<string, unknown>;
        files?: Parameters<typeof importStoredFiles>[0];
      };
      Object.entries(payload.storage ?? {}).forEach(([storageKey, value]) => {
        if (storageKey.startsWith("trinsu:")) localStorage.setItem(storageKey, JSON.stringify(value));
      });
      if (payload.files) await importStoredFiles(payload.files);
      appendLocalAudit("BACKUP_RESTORED", "System");
      window.location.reload();
    } catch {
      toast({ title: "ملف النسخة الاحتياطية غير صالح", tone: "error" });
      setBusy("");
    }
  }

  async function reset() {
    [...Array(localStorage.length)].map((_, index) => localStorage.key(index))
      .filter((storageKey): storageKey is string => Boolean(storageKey?.startsWith("trinsu:")))
      .forEach((storageKey) => localStorage.removeItem(storageKey));
    await clearStoredFiles();
    window.location.href = "/";
  }

  return (
    <div className="grid gap-6 xl:grid-cols-[1.3fr_0.8fr]">
      <Card>
        <CardHeader><CardTitle className="flex items-center gap-2"><Users className="h-5 w-5 text-primary" />المستخدمون والصلاحيات</CardTitle></CardHeader>
        <CardContent className="space-y-5">
          <form className="grid gap-3 rounded-xl border bg-muted/15 p-4 md:grid-cols-[1fr_1fr_180px_auto]" onSubmit={(event) => {
            event.preventDefault();
            const form = new FormData(event.currentTarget);
            const user: LocalUser = {
              id: `local-user-${crypto.randomUUID()}`,
              name: String(form.get("name")),
              email: String(form.get("email")),
              role: String(form.get("role")) as Role,
              active: true
            };
            setUsers((current) => [user, ...current]);
            event.currentTarget.reset();
          }}>
            <Input name="name" placeholder="اسم المستخدم" required />
            <Input name="email" type="email" placeholder="البريد الإلكتروني" required dir="ltr" />
            <select name="role" className="h-10 rounded-md border bg-background px-3 text-sm">
              {Object.entries(roles).map(([value, label]) => <option key={value} value={value}>{label}</option>)}
            </select>
            <Button><UserPlus className="h-4 w-4" />إضافة</Button>
          </form>
          <div className="divide-y rounded-xl border">
            {users.map((user) => (
              <div key={user.id} className="flex flex-col justify-between gap-3 p-4 sm:flex-row sm:items-center">
                <div><p className="font-bold">{user.name}</p><p className="text-sm text-muted-foreground" dir="ltr">{user.email}</p></div>
                <div className="flex items-center gap-2">
                  <select value={user.role} onChange={(event) => setUsers((current) => current.map((item) => item.id === user.id ? { ...item, role: event.target.value as Role } : item))} className="h-9 rounded-md border bg-background px-2 text-sm">
                    {Object.entries(roles).map(([value, label]) => <option key={value} value={value}>{label}</option>)}
                  </select>
                  <Button type="button" size="icon" variant="ghost" className="text-destructive" disabled={user.id === "local-super-admin"} onClick={() => setUsers((current) => current.filter((item) => item.id !== user.id))}><Trash2 className="h-4 w-4" /></Button>
                </div>
              </div>
            ))}
          </div>
          <p className="text-xs text-muted-foreground">هذه الإدارة تخص وضع العرض المحلي. عند تشغيل قاعدة البيانات تُدار الحسابات من جدول المستخدمين الفعلي.</p>
        </CardContent>
      </Card>

      <div className="space-y-6">
        <Card>
          <CardHeader><CardTitle className="flex items-center gap-2"><DatabaseBackup className="h-5 w-5 text-primary" />النسخ الاحتياطي</CardTitle></CardHeader>
          <CardContent className="space-y-3">
            <Button type="button" className="w-full" onClick={backup} disabled={Boolean(busy)}><DatabaseBackup className="h-4 w-4" />{busy === "backup" ? "جارٍ التجهيز..." : "تنزيل نسخة كاملة"}</Button>
            <input ref={fileRef} type="file" accept="application/json" className="sr-only" onChange={(event) => event.target.files?.[0] && restore(event.target.files[0])} />
            <Button type="button" variant="outline" className="w-full" onClick={() => fileRef.current?.click()} disabled={Boolean(busy)}><ArchiveRestore className="h-4 w-4" />استرجاع نسخة</Button>
          </CardContent>
        </Card>
        <Card className="border-red-200">
          <CardHeader><CardTitle className="flex items-center gap-2 text-red-700"><RotateCcw className="h-5 w-5" />إعادة ضبط البيانات</CardTitle></CardHeader>
          <CardContent>
            <p className="mb-4 text-sm text-muted-foreground">يحذف العملاء والوثائق والصور والمرفقات والتعديلات المحلية ويعيد بيانات العرض الأصلية.</p>
            <Button type="button" variant="destructive" className="w-full" onClick={() => setConfirmReset(true)}><RotateCcw className="h-4 w-4" />إعادة الضبط</Button>
          </CardContent>
        </Card>
        <div className="flex items-center gap-2 rounded-xl border border-emerald-200 bg-emerald-50 p-4 text-sm text-emerald-800"><ShieldCheck className="h-5 w-5" />النسخة الاحتياطية تشمل ملفات IndexedDB والصور.</div>
      </div>
      <ConfirmDialog open={confirmReset} onOpenChange={setConfirmReset} title="إعادة ضبط بيانات العرض؟" description="سيتم حذف جميع البيانات والصور والمرفقات المحلية من هذا المتصفح، ولا يمكن التراجع عن ذلك." confirmLabel="حذف وإعادة الضبط" destructive onConfirm={reset} />
    </div>
  );
}
