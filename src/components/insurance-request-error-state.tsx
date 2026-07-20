"use client";

import { AlertTriangle, RotateCcw } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";

export function InsuranceRequestErrorState({ reset }: { reset: () => void }) {
  return (
    <main className="min-h-screen bg-background p-6">
      <Card className="border-destructive/30">
        <CardContent className="flex min-h-80 flex-col items-center justify-center p-8 text-center">
          <span className="mb-4 grid h-14 w-14 place-items-center rounded-lg bg-destructive/10 text-destructive">
            <AlertTriangle className="h-7 w-7" />
          </span>
          <h2 className="text-lg font-black">تعذر تحميل طلبات التأمين</h2>
          <p className="mt-2 max-w-md text-sm leading-6 text-muted-foreground">
            حدث خطأ أثناء تحميل بيانات هذا القسم. يمكن إعادة المحاولة بدون تغيير أي بيانات.
          </p>
          <Button type="button" className="mt-5" onClick={reset}>
            <RotateCcw className="h-4 w-4" />
            إعادة المحاولة
          </Button>
        </CardContent>
      </Card>
    </main>
  );
}
