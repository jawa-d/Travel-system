import { AlertTriangle, Clock3, FileCheck2, MessageSquareWarning, ShieldCheck } from "lucide-react";
import { AppShell } from "@/components/app-shell";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { requirePagePermission } from "@/lib/page-guard";

const responseCommitments = [
  {
    title: "التواصل مع العميل",
    target: "لا تتجاوز يوم عمل واحد",
    description: "تلتزم شركة التكافل بالتواصل مع العميل خلال مدة لا تتجاوز يوم عمل واحد من تاريخ استلام الإحالة."
  },
  {
    title: "إصدار عرض السعر",
    target: "خلال يوم عمل واحد",
    description: "يتم إصدار عرض السعر خلال يوم عمل واحد من استلام المستندات المطلوبة."
  }
];

const complaintCommitments = [
  {
    title: "تسجيل الشكوى",
    description: "يتم تسجيل أي شكوى واردة من عملاء الإحالات ضمن سجل المتابعة."
  },
  {
    title: "إخطار المصرف",
    description: "يتم إخطار المصرف بأي شكوى جوهرية خلال خمسة أيام عمل."
  },
  {
    title: "معالجة الشكاوى",
    description: "تتم معالجة الشكاوى وفق سياسة شركة التكافل المعتمدة."
  }
];

const kpis = [
  { metric: "زمن التواصل الأول", target: "1 يوم عمل", owner: "فريق الإحالات", evidence: "تاريخ الاستلام وتاريخ أول تواصل" },
  { metric: "زمن إصدار عرض السعر", target: "1 يوم عمل بعد المستندات", owner: "الاكتتاب", evidence: "تاريخ اكتمال المستندات وتاريخ العرض" },
  { metric: "إخطار الشكوى الجوهرية", target: "5 أيام عمل", owner: "خدمة العملاء", evidence: "سجل الشكوى وتاريخ الإخطار" },
  { metric: "اكتمال نموذج الإحالة", target: "مراجعة مستمرة", owner: "الامتثال", evidence: "تقرير ربع سنوي رقابي" }
];

export default async function ReferralSlaPage() {
  await requirePagePermission("referralsRead");

  return (
    <AppShell>
      <div className="mb-6">
        <div className="mb-2 flex items-center gap-2 text-sm font-semibold text-primary">
          <ShieldCheck className="h-4 w-4" />
          اتفاقية مستوى الخدمة
        </div>
        <h1 className="text-2xl font-black tracking-normal text-slate-950 dark:text-foreground sm:text-3xl">
          اتفاقية مستوى الخدمة (SLA) ومؤشرات الأداء (KPIs)
        </h1>
        <p className="mt-2 max-w-3xl text-sm leading-6 text-muted-foreground">
          إطار تشغيلي لمتابعة التزامات الإحالات، زمن الاستجابة، إدارة الشكاوى، ومؤشرات الأداء المعتمدة مع المصارف.
        </p>
      </div>

      <div className="mb-6 grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        <Metric icon={Clock3} title="أول تواصل" value="1 يوم عمل" />
        <Metric icon={FileCheck2} title="عرض السعر" value="1 يوم عمل" />
        <Metric icon={MessageSquareWarning} title="إخطار الشكوى" value="5 أيام عمل" />
        <Metric icon={ShieldCheck} title="مراجعة الامتثال" value="ربع سنوي" />
      </div>

      <div className="grid gap-6 xl:grid-cols-[minmax(0,1fr)_minmax(340px,0.7fr)]">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Clock3 className="h-5 w-5 text-primary" />
              أولا: زمن الاستجابة
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            {responseCommitments.map((item, index) => (
              <div key={item.title} className="rounded-lg border bg-muted/10 p-4">
                <div className="mb-2 flex items-center justify-between gap-3">
                  <h2 className="font-black">{index + 1}. {item.title}</h2>
                  <span className="rounded-md bg-primary/10 px-3 py-1 text-xs font-bold text-primary">{item.target}</span>
                </div>
                <p className="text-sm leading-6 text-muted-foreground">{item.description}</p>
              </div>
            ))}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <MessageSquareWarning className="h-5 w-5 text-primary" />
              ثانيا: إدارة الشكاوى
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            {complaintCommitments.map((item, index) => (
              <div key={item.title} className="rounded-lg border bg-muted/10 p-4">
                <h2 className="mb-1 font-black">{index + 1}. {item.title}</h2>
                <p className="text-sm leading-6 text-muted-foreground">{item.description}</p>
              </div>
            ))}
          </CardContent>
        </Card>
      </div>

      <Card className="mt-6">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <AlertTriangle className="h-5 w-5 text-primary" />
            مؤشرات الأداء والمتابعة
          </CardTitle>
        </CardHeader>
        <CardContent className="overflow-x-auto p-0">
          <table className="w-full min-w-[820px] text-sm">
            <thead className="bg-muted/40 text-xs text-muted-foreground">
              <tr>
                <th className="p-3 text-right">المؤشر</th>
                <th className="p-3 text-right">المستهدف</th>
                <th className="p-3 text-right">المالك التشغيلي</th>
                <th className="p-3 text-right">دليل القياس</th>
              </tr>
            </thead>
            <tbody className="divide-y">
              {kpis.map((item) => (
                <tr key={item.metric}>
                  <td className="p-3 font-bold">{item.metric}</td>
                  <td className="p-3">{item.target}</td>
                  <td className="p-3">{item.owner}</td>
                  <td className="p-3 text-muted-foreground">{item.evidence}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </CardContent>
      </Card>
    </AppShell>
  );
}

function Metric({ icon: Icon, title, value }: { icon: typeof Clock3; title: string; value: string }) {
  return (
    <Card>
      <CardContent className="flex items-center justify-between gap-4 p-5">
        <div>
          <p className="text-sm text-muted-foreground">{title}</p>
          <p className="mt-2 text-2xl font-black">{value}</p>
        </div>
        <span className="grid h-11 w-11 place-items-center rounded-lg bg-primary/10 text-primary">
          <Icon className="h-5 w-5" />
        </span>
      </CardContent>
    </Card>
  );
}
