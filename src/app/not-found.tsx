import Link from "next/link";
import { ArrowRight, FileQuestion } from "lucide-react";
import { Button } from "@/components/ui/button";

export default function NotFound() {
  return (
    <main className="grid min-h-screen place-items-center bg-background p-6">
      <div className="max-w-md text-center">
        <span className="mx-auto grid h-16 w-16 place-items-center rounded-2xl bg-primary/10 text-primary"><FileQuestion className="h-8 w-8" /></span>
        <p className="mt-5 text-sm font-bold text-primary">404</p>
        <h1 className="mt-1 text-2xl font-black">الصفحة غير موجودة</h1>
        <p className="mt-2 text-sm text-muted-foreground">قد يكون الرابط تغير أو أن السجل المطلوب لم يعد متاحًا.</p>
        <Button asChild className="mt-6"><Link href="/"><ArrowRight className="h-4 w-4" />العودة للوحة التحكم</Link></Button>
      </div>
    </main>
  );
}
