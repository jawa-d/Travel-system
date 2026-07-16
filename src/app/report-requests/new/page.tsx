import Link from "next/link";
import { ArrowRight, FileQuestion, ShieldCheck } from "lucide-react";
import { AppShell } from "@/components/app-shell";
import { ReportRequestForm } from "@/components/report-request-form";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { requirePagePermission } from "@/lib/page-guard";

export default async function NewReportRequestPage() {
  const user = await requirePagePermission("reportRequestsCreate");

  return (
    <AppShell>
      <div className="mb-6 flex flex-col justify-between gap-4 lg:flex-row lg:items-end">
        <div>
          <div className="mb-2 flex items-center gap-2 text-sm font-semibold text-primary"><FileQuestion className="h-4 w-4" />طلبات التقارير</div>
          <h1 className="text-2xl font-black tracking-normal text-slate-950 dark:text-foreground sm:text-3xl">طلب تقرير جديد</h1>
          <p className="mt-2 max-w-2xl text-sm leading-6 text-muted-foreground">
            ارفع طلب تقرير واضح للمدير العام مع عنوان مختصر وتفاصيل كاملة حتى يتم التعامل معه بسرعة ودقة.
          </p>
        </div>
        <Button asChild variant="outline"><Link href="/"><ArrowRight className="h-4 w-4" />الرجوع للرئيسية</Link></Button>
      </div>

      <div className="grid gap-6 xl:grid-cols-[1fr_360px]">
        <Card>
          <CardHeader className="border-b bg-muted/10">
            <CardTitle>بيانات طلب التقرير</CardTitle>
          </CardHeader>
          <CardContent className="p-6">
            <ReportRequestForm />
          </CardContent>
        </Card>

        <aside className="space-y-4">
          <Card>
            <CardContent className="p-5">
              <div className="mb-4 grid h-12 w-12 place-items-center rounded-lg bg-primary/10 text-primary">
                <ShieldCheck className="h-6 w-6" />
              </div>
              <h2 className="font-black">معلومات مقدم الطلب</h2>
              <div className="mt-4 space-y-3 text-sm">
                <Info label="الاسم" value={user.name ?? "غير محدد"} />
                <Info label="البريد الإلكتروني" value={user.email ?? "غير محدد"} dir="ltr" />
              </div>
            </CardContent>
          </Card>

          <Card className="border-primary/20 bg-primary/[0.03]">
            <CardContent className="p-5 text-sm leading-7 text-muted-foreground">
              اكتب الفترة المطلوبة، نوع البيانات، شكل التقرير المتوقع، وأي حقول ضرورية مثل أرقام الإحالات أو حالات الإصدار.
            </CardContent>
          </Card>
        </aside>
      </div>
    </AppShell>
  );
}

function Info({ label, value, dir }: { label: string; value: string; dir?: "ltr" | "rtl" }) {
  return (
    <div className="rounded-lg border bg-background p-3">
      <p className="text-xs text-muted-foreground">{label}</p>
      <p className="mt-1 font-bold" dir={dir}>{value}</p>
    </div>
  );
}
