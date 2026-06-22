"use client";

import { CircleAlert, RefreshCw } from "lucide-react";
import { Button } from "@/components/ui/button";

export default function GlobalError({ reset }: { error: Error & { digest?: string }; reset: () => void }) {
  return (
    <main className="grid min-h-screen place-items-center bg-background p-6">
      <div className="max-w-md text-center">
        <span className="mx-auto grid h-16 w-16 place-items-center rounded-2xl bg-red-50 text-red-600"><CircleAlert className="h-8 w-8" /></span>
        <h1 className="mt-5 text-2xl font-black">حدث خطأ غير متوقع</h1>
        <p className="mt-2 text-sm leading-6 text-muted-foreground">تعذر تحميل هذه الصفحة. أعد المحاولة، وإذا استمرت المشكلة راجع اتصال الخادم وقاعدة البيانات.</p>
        <Button className="mt-6" onClick={reset}><RefreshCw className="h-4 w-4" />إعادة المحاولة</Button>
      </div>
    </main>
  );
}
