"use client";

import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";
import { FileUp, SendHorizonal } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useToast } from "@/components/ui/toast-provider";

export function ReportRequestForm() {
  const router = useRouter();
  const { toast } = useToast();
  const [isPending, startTransition] = useTransition();
  const [details, setDetails] = useState("");

  function submit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const formData = new FormData(event.currentTarget);
    const title = String(formData.get("title") ?? "").trim();

    startTransition(async () => {
      const response = await fetch("/api/report-requests", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ title, details })
      });
      const result = await response.json().catch(() => ({}));
      if (!response.ok) {
        toast({ title: result.error ?? "تعذر إرسال طلب التقرير", tone: "error" });
        return;
      }
      toast({ title: "تم إرسال طلب التقرير", description: result.requestNumber, tone: "success" });
      router.push("/");
      router.refresh();
    });
  }

  return (
    <form onSubmit={submit} className="space-y-5">
      <div className="grid gap-2">
        <Label htmlFor="report-title">عنوان التقرير</Label>
        <Input
          id="report-title"
          name="title"
          required
          minLength={4}
          maxLength={160}
          placeholder="مثال: تقرير شهري عن الإحالات الصادرة"
          className="h-12"
        />
      </div>

      <div className="grid gap-2">
        <Label htmlFor="report-details">تفاصيل وشرح الطلب</Label>
        <textarea
          id="report-details"
          value={details}
          onChange={(event) => setDetails(event.target.value)}
          required
          minLength={20}
          maxLength={5000}
          rows={10}
          placeholder="اكتب نطاق التقرير، الفترة المطلوبة، الحقول المهمة، وأي ملاحظات يحتاجها المدير العام قبل إعداد التقرير."
          className="min-h-56 w-full resize-y rounded-md border bg-background px-3 py-3 text-sm leading-7 text-foreground ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring dark:border-border dark:bg-slate-900/40"
        />
        <div className="flex items-center justify-between text-xs text-muted-foreground">
          <span className="flex items-center gap-1"><FileUp className="h-3.5 w-3.5" />كلما كانت التفاصيل أدق، كانت الاستجابة أسرع.</span>
          <span dir="ltr">{details.length}/5000</span>
        </div>
      </div>

      <Button className="h-12 w-full" disabled={isPending}>
        <SendHorizonal className="h-4 w-4" />
        {isPending ? "جارٍ إرسال الطلب..." : "إرسال طلب التقرير"}
      </Button>
    </form>
  );
}
