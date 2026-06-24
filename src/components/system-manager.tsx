"use client";

import { useRef, useState } from "react";
import { ArchiveRestore, DatabaseBackup, Eye, EyeOff, RotateCcw, ShieldCheck, Trash2, UserPlus, Users } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { clearStoredFiles, exportStoredFiles, importStoredFiles } from "@/lib/file-storage";
import { appendLocalAudit } from "@/lib/local-storage";
import { ConfirmDialog } from "@/components/ui/confirm-dialog";
import { useToast } from "@/components/ui/toast-provider";

type Role = "SUPER_ADMIN" | "ADMIN" | "UNDERWRITER" | "FINANCE" | "AGENT" | "VIEWER";
type SystemUser = { id: string; name: string | null; email: string; role: Role; active: boolean };

function isSystemUser(user: SystemUser | null | undefined): user is SystemUser {
  return Boolean(user?.id && user.email && user.role);
}

const roles: Record<Role, string> = {
  SUPER_ADMIN: "مدير عام", ADMIN: "مدير", UNDERWRITER: "مكتتب",
  FINANCE: "المالية", AGENT: "وكيل", VIEWER: "مشاهد"
};

export function SystemManager({ users: initialUsers, currentUserId }: { users: SystemUser[]; currentUserId: string }) {
  const [users, setUsers] = useState(() => initialUsers.filter(isSystemUser));
  const [busy, setBusy] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const fileRef = useRef<HTMLInputElement>(null);
  const [confirmReset, setConfirmReset] = useState(false);
  const { toast } = useToast();

  async function createUser(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const form = event.currentTarget;
    setBusy("user-create");
    const response = await fetch("/api/system-users", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(Object.fromEntries(new FormData(form).entries()))
    });
    const result = await response.json().catch(() => null);
    setBusy("");
    if (!response.ok) {
      toast({ title: "تعذر إضافة المستخدم", description: result?.error, tone: "error" });
      return;
    }
    if (!isSystemUser(result)) {
      toast({ title: "تعذر قراءة بيانات المستخدم الجديد", tone: "error" });
      return;
    }
    setUsers((current) => [result, ...current.filter(isSystemUser)]);
    form.reset();
    toast({ title: "تم إنشاء المستخدم ويمكنه تسجيل الدخول الآن", tone: "success" });
  }

  async function updateRole(user: SystemUser, role: Role) {
    setBusy(user.id);
    const response = await fetch(`/api/system-users/${user.id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ role })
    });
    const result = await response.json().catch(() => null);
    setBusy("");
    if (!response.ok) {
      toast({ title: "تعذر تحديث الصلاحية", description: result?.error, tone: "error" });
      return;
    }
    if (!isSystemUser(result)) {
      toast({ title: "تعذر قراءة بيانات المستخدم", tone: "error" });
      return;
    }
    setUsers((current) => current.filter(isSystemUser).map((item) => item.id === user.id ? result : item));
    toast({ title: "تم تحديث صلاحية المستخدم", tone: "success" });
  }

  async function removeUser(user: SystemUser) {
    setBusy(user.id);
    const response = await fetch(`/api/system-users/${user.id}`, { method: "DELETE" });
    const result = await response.json().catch(() => null);
    setBusy("");
    if (!response.ok) {
      toast({ title: "تعذر حذف المستخدم", description: result?.error, tone: "error" });
      return;
    }
    setUsers((current) => current.filter((item) => item.id !== user.id));
    toast({ title: "تم تعطيل المستخدم ومنع تسجيل دخوله", tone: "success" });
  }

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
    <div className="grid min-w-0 gap-6 xl:grid-cols-[minmax(0,1.35fr)_minmax(320px,0.65fr)]">
      <Card>
        <CardHeader><CardTitle className="flex items-center gap-2"><Users className="h-5 w-5 text-primary" />المستخدمون والصلاحيات</CardTitle></CardHeader>
        <CardContent className="space-y-5">
          <form className="grid gap-3 rounded-xl border bg-muted/15 p-4 md:grid-cols-2 xl:grid-cols-[1fr_1fr_1fr_180px_auto]" onSubmit={createUser}>
            <Input name="name" placeholder="اسم المستخدم" required />
            <Input name="email" type="email" placeholder="البريد الإلكتروني" required dir="ltr" />
            <div className="relative">
              <Input name="password" type={showPassword ? "text" : "password"} placeholder="كلمة المرور" required minLength={8} dir="ltr" className="pl-11" />
              <button type="button" onClick={() => setShowPassword((value) => !value)} className="absolute left-2 top-1/2 -translate-y-1/2 rounded-md p-2 text-muted-foreground hover:bg-muted" aria-label={showPassword ? "إخفاء كلمة المرور" : "إظهار كلمة المرور"}>
                {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
              </button>
            </div>
            <select name="role" className="h-10 rounded-md border bg-background px-3 text-sm">
              {Object.entries(roles).map(([value, label]) => <option key={value} value={value}>{label}</option>)}
            </select>
            <Button disabled={busy === "user-create"}><UserPlus className="h-4 w-4" />إضافة</Button>
          </form>
          <div className="divide-y rounded-xl border">
            {users.filter(isSystemUser).map((user) => (
              <div key={user.id} className="flex flex-col justify-between gap-3 p-4 sm:flex-row sm:items-center">
                <div><p className="font-bold">{user.name || "مستخدم"}</p><p className="text-sm text-muted-foreground" dir="ltr">{user.email}</p></div>
                <div className="flex items-center gap-2">
                  <select value={user.role} disabled={user.id === currentUserId || busy === user.id} onChange={(event) => updateRole(user, event.target.value as Role)} className="h-9 rounded-md border bg-background px-2 text-sm">
                    {Object.entries(roles).map(([value, label]) => <option key={value} value={value}>{label}</option>)}
                  </select>
                  <Button type="button" size="icon" variant="ghost" className="text-destructive" disabled={user.id === currentUserId || busy === user.id} onClick={() => removeUser(user)}><Trash2 className="h-4 w-4" /></Button>
                </div>
              </div>
            ))}
          </div>
          <p className="text-xs text-muted-foreground">تُحفظ الحسابات في قاعدة البيانات، ويمكن للمستخدم تسجيل الدخول مباشرة بالبريد وكلمة المرور المحددين هنا.</p>
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
