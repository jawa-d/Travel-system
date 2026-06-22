"use client";

import { useState } from "react";
import { Eye, EyeOff, KeyRound, Pencil, Plus, Power, ShieldCheck, UserRound, X } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ConfirmDialog } from "@/components/ui/confirm-dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useToast } from "@/components/ui/toast-provider";
import { formatDate } from "@/lib/utils";

type Agent = {
  id: string;
  name: string | null;
  email: string;
  active: boolean;
  createdAt: string;
  _count: { policies: number };
};

export function AgentManager({ agents: initialAgents }: { agents: Agent[] }) {
  const [agents, setAgents] = useState(initialAgents);
  const [busy, setBusy] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [editing, setEditing] = useState<Agent | null>(null);
  const [passwordAgent, setPasswordAgent] = useState<Agent | null>(null);
  const [statusAgent, setStatusAgent] = useState<Agent | null>(null);
  const { toast } = useToast();

  async function patchAgent(agent: Agent, body: Record<string, unknown>) {
    setBusy(true);
    const response = await fetch(`/api/agents/${agent.id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body)
    });
    const result = await response.json().catch(() => null);
    setBusy(false);
    if (!response.ok) {
      toast({ title: "تعذر تحديث الوكيل", description: result?.error, tone: "error" });
      return null;
    }
    const updated = { ...result, createdAt: new Date(result.createdAt).toISOString() } as Agent;
    setAgents((current) => current.map((item) => item.id === updated.id ? updated : item));
    return updated;
  }

  async function createAgent(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const form = event.currentTarget;
    setBusy(true);
    const response = await fetch("/api/agents", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(Object.fromEntries(new FormData(form).entries()))
    });
    const result = await response.json().catch(() => null);
    setBusy(false);
    if (!response.ok) {
      toast({ title: "تعذر إضافة الوكيل", description: result?.error, tone: "error" });
      return;
    }
    setAgents((current) => [{ ...result, createdAt: new Date(result.createdAt).toISOString() }, ...current]);
    form.reset();
    toast({ title: "تم إنشاء حساب الوكيل", tone: "success" });
  }

  return (
    <>
      <div className="mb-8 grid items-start gap-6 xl:grid-cols-[minmax(0,1fr)_380px]">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <UserRound className="h-5 w-5 text-primary" />الوكلاء ({agents.length})
            </CardTitle>
            <p className="text-sm text-muted-foreground">تعديل الحسابات، تعطيل الدخول، وإعادة تعيين كلمات المرور.</p>
          </CardHeader>
          <CardContent>
            <div className="divide-y rounded-xl border">
              {agents.map((agent) => (
                <div key={agent.id} className="flex flex-col justify-between gap-4 p-4 lg:flex-row lg:items-center">
                  <div className="flex min-w-0 items-center gap-3">
                    <span className="grid h-11 w-11 shrink-0 place-items-center rounded-xl bg-primary/10 font-bold text-primary">
                      {agent.name?.slice(0, 1) ?? "و"}
                    </span>
                    <div className="min-w-0">
                      <div className="flex flex-wrap items-center gap-2">
                        <p className="truncate font-bold">{agent.name ?? "وكيل"}</p>
                        <Badge className={agent.active ? "bg-emerald-50 text-emerald-700" : "bg-red-50 text-red-700"}>
                          {agent.active ? "فعال" : "معطل"}
                        </Badge>
                      </div>
                      <p className="truncate text-sm text-muted-foreground" dir="ltr">{agent.email}</p>
                      <p className="mt-1 text-xs text-muted-foreground">{agent._count.policies} وثيقة · أضيف {formatDate(agent.createdAt)}</p>
                    </div>
                  </div>
                  <div className="flex flex-wrap gap-2">
                    <Button size="sm" variant="outline" onClick={() => setEditing(agent)}>
                      <Pencil className="h-4 w-4" />تعديل
                    </Button>
                    <Button size="sm" variant="outline" onClick={() => setPasswordAgent(agent)}>
                      <KeyRound className="h-4 w-4" />كلمة المرور
                    </Button>
                    <Button size="sm" variant={agent.active ? "destructive" : "default"} onClick={() => setStatusAgent(agent)}>
                      <Power className="h-4 w-4" />{agent.active ? "تعطيل" : "تفعيل"}
                    </Button>
                  </div>
                </div>
              ))}
              {!agents.length ? <p className="p-8 text-center text-sm text-muted-foreground">لم تتم إضافة وكلاء بعد.</p> : null}
            </div>
          </CardContent>
        </Card>

        <Card className="xl:sticky xl:top-24">
          <CardHeader>
            <CardTitle className="flex items-center gap-2"><Plus className="h-5 w-5 text-primary" />إضافة وكيل</CardTitle>
          </CardHeader>
          <CardContent>
            <form onSubmit={createAgent} className="space-y-4">
              <Field label="اسم الوكيل" name="name" required minLength={3} />
              <Field label="البريد الإلكتروني" name="email" type="email" required dir="ltr" />
              <div className="space-y-2">
                <Label htmlFor="agent-password">كلمة المرور</Label>
                <div className="relative">
                  <Input id="agent-password" name="password" type={showPassword ? "text" : "password"} required minLength={8} dir="ltr" className="pl-11" />
                  <button type="button" onClick={() => setShowPassword((value) => !value)} className="absolute left-2 top-1/2 -translate-y-1/2 rounded-md p-2 text-muted-foreground hover:bg-muted">
                    {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                  </button>
                </div>
              </div>
              <div className="rounded-xl border border-emerald-200 bg-emerald-50 p-3 text-xs leading-5 text-emerald-800">
                <div className="mb-1 flex items-center gap-2 font-bold"><ShieldCheck className="h-4 w-4" />صلاحيات الوكيل</div>
                العملاء وإضافة أو تعديل عميل وإصدار ومشاهدة وثائقه فقط.
              </div>
              <Button className="w-full" disabled={busy}><KeyRound className="h-4 w-4" />إنشاء حساب الوكيل</Button>
            </form>
          </CardContent>
        </Card>
      </div>

      {editing ? (
        <Modal title="تعديل بيانات الوكيل" onClose={() => setEditing(null)}>
          <form className="space-y-4" onSubmit={async (event) => {
            event.preventDefault();
            const body = Object.fromEntries(new FormData(event.currentTarget).entries());
            if (await patchAgent(editing, body)) {
              setEditing(null);
              toast({ title: "تم تحديث بيانات الوكيل", tone: "success" });
            }
          }}>
            <Field label="اسم الوكيل" name="name" defaultValue={editing.name ?? ""} required minLength={3} />
            <Field label="البريد الإلكتروني" name="email" type="email" defaultValue={editing.email} required dir="ltr" />
            <Button className="w-full" disabled={busy}>حفظ التعديلات</Button>
          </form>
        </Modal>
      ) : null}

      {passwordAgent ? (
        <Modal title={`إعادة كلمة مرور ${passwordAgent.name ?? "الوكيل"}`} onClose={() => setPasswordAgent(null)}>
          <form className="space-y-4" onSubmit={async (event) => {
            event.preventDefault();
            const password = String(new FormData(event.currentTarget).get("password"));
            if (await patchAgent(passwordAgent, { password })) {
              setPasswordAgent(null);
              toast({ title: "تمت إعادة تعيين كلمة المرور", tone: "success" });
            }
          }}>
            <Field label="كلمة المرور الجديدة" name="password" type="password" required minLength={8} dir="ltr" />
            <p className="text-xs text-muted-foreground">ثمانية أحرف على الأقل.</p>
            <Button className="w-full" disabled={busy}><KeyRound className="h-4 w-4" />حفظ كلمة المرور</Button>
          </form>
        </Modal>
      ) : null}

      <ConfirmDialog
        open={Boolean(statusAgent)}
        onOpenChange={(open) => !open && setStatusAgent(null)}
        title={statusAgent?.active ? "تعطيل حساب الوكيل" : "تفعيل حساب الوكيل"}
        description={statusAgent?.active
          ? "لن يتمكن الوكيل من تسجيل الدخول أو استخدام النظام حتى تعيد تفعيل حسابه."
          : "سيتمكن الوكيل من تسجيل الدخول واستخدام صلاحياته من جديد."}
        confirmLabel={statusAgent?.active ? "تعطيل الحساب" : "تفعيل الحساب"}
        destructive={statusAgent?.active}
        busy={busy}
        onConfirm={async () => {
          if (!statusAgent) return;
          const updated = await patchAgent(statusAgent, { active: !statusAgent.active });
          if (updated) {
            setStatusAgent(null);
            toast({ title: updated.active ? "تم تفعيل الوكيل" : "تم تعطيل الوكيل", tone: "success" });
          }
        }}
      />
    </>
  );
}

function Modal({ title, onClose, children }: { title: string; onClose: () => void; children: React.ReactNode }) {
  return (
    <div className="fixed inset-0 z-[70] grid place-items-center bg-slate-950/60 p-4 backdrop-blur-sm">
      <Card className="w-full max-w-md">
        <CardHeader className="flex-row items-center justify-between space-y-0 border-b">
          <CardTitle>{title}</CardTitle>
          <Button type="button" size="icon" variant="ghost" onClick={onClose}><X className="h-5 w-5" /></Button>
        </CardHeader>
        <CardContent className="p-5">{children}</CardContent>
      </Card>
    </div>
  );
}

function Field(props: React.InputHTMLAttributes<HTMLInputElement> & { label: string }) {
  const { label, name, ...inputProps } = props;
  return (
    <div className="space-y-2">
      <Label htmlFor={String(name)}>{label}</Label>
      <Input id={String(name)} name={name} {...inputProps} />
    </div>
  );
}
