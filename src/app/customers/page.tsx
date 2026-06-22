import Link from "next/link";
import {
  ArrowLeft,
  Contact,
  Mail,
  MapPin,
  Phone,
  Search,
  UserRound,
  Users
  ,FileDown, FileSpreadsheet
} from "lucide-react";
import { AppShell } from "@/components/app-shell";
import { CustomerForm } from "@/components/customer-form";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { prisma } from "@/lib/prisma";
import { requirePagePermission } from "@/lib/page-guard";

export default async function CustomersPage({ searchParams }: { searchParams: Promise<{ q?: string }> }) {
  await requirePagePermission("customersRead");
  const { q = "" } = await searchParams;
  const customers = await prisma.customer.findMany({
    where: q
      ? {
          OR: [
            { passportNumber: { contains: q, mode: "insensitive" } },
            { arabicName: { contains: q, mode: "insensitive" } },
            { englishName: { contains: q, mode: "insensitive" } }
          ]
        }
      : undefined,
    orderBy: { createdAt: "desc" },
    take: 50
  });

  return (
    <AppShell>
      <div className="mb-6 flex flex-col justify-between gap-4 lg:flex-row lg:items-end">
        <div>
          <div className="mb-2 flex items-center gap-2 text-sm font-medium text-primary">
            <Users className="h-4 w-4" />
            قاعدة بيانات العملاء
          </div>
          <h1 className="text-2xl font-bold tracking-tight sm:text-3xl">إدارة العملاء</h1>
          <p className="mt-1 text-sm text-muted-foreground">
            ابحث عن العملاء وأدر بياناتهم بسهولة ومن دون تكرار رقم الجواز.
          </p>
        </div>

        <form className="flex w-full gap-2 lg:max-w-xl">
          <div className="relative flex-1">
            <Search className="pointer-events-none absolute right-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              name="q"
              placeholder="ابحث بالاسم أو رقم الجواز..."
              defaultValue={q}
              className="h-11 bg-card pr-10 shadow-sm"
            />
          </div>
          <Button type="submit" className="h-11 px-6">بحث</Button>
          {q && (
            <Button asChild type="button" variant="outline" className="h-11">
              <Link href="/customers">مسح</Link>
            </Button>
          )}
          <Button asChild type="button" variant="outline" className="h-11"><Link href={`/api/export?resource=customers&format=xlsx&q=${encodeURIComponent(q)}`}><FileSpreadsheet className="h-4 w-4 text-emerald-600" />Excel</Link></Button>
          <Button asChild type="button" variant="outline" className="h-11"><Link href={`/api/export?resource=customers&format=pdf&q=${encodeURIComponent(q)}`}><FileDown className="h-4 w-4 text-red-600" />PDF</Link></Button>
        </form>
      </div>

      <div className="grid items-start gap-6 xl:grid-cols-[minmax(0,1fr)_360px]">
        <Card className="overflow-hidden border-border/80 shadow-sm">
          <CardHeader className="border-b bg-muted/20 px-5 py-4 sm:px-6">
            <div className="flex items-center justify-between gap-4">
              <div>
                <CardTitle className="flex items-center gap-2">
                  <span>العملاء</span>
                  <Badge className="border-primary/20 bg-primary/10 text-primary">
                    {customers.length}
                  </Badge>
                </CardTitle>
                <p className="mt-1 text-sm text-muted-foreground">
                  {q ? `نتائج البحث عن “${q}”` : "أحدث العملاء المسجلين"}
                </p>
              </div>
              <div className="hidden rounded-xl bg-primary/10 p-2.5 text-primary sm:block">
                <Contact className="h-5 w-5" />
              </div>
            </div>
          </CardHeader>

          <CardContent className="p-0">
            {customers.length === 0 ? (
              <div className="flex min-h-64 flex-col items-center justify-center px-6 text-center">
                <div className="mb-4 rounded-full bg-muted p-4 text-muted-foreground">
                  <UserRound className="h-7 w-7" />
                </div>
                <h2 className="font-semibold">لا توجد نتائج</h2>
                <p className="mt-1 max-w-sm text-sm text-muted-foreground">
                  لم نعثر على عميل مطابق. جرّب اسمًا آخر أو ابحث باستخدام رقم الجواز.
                </p>
              </div>
            ) : (
              <div className="divide-y">
                {customers.map((customer) => (
                  <article
                    key={customer.id}
                    className="group grid gap-4 px-5 py-5 transition-colors hover:bg-muted/35 sm:px-6 lg:grid-cols-[minmax(210px,1.35fr)_minmax(150px,0.8fr)_minmax(190px,1fr)_auto] lg:items-center"
                  >
                    <div className="flex min-w-0 items-center gap-3.5">
                      <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-gradient-to-br from-primary to-cyan-600 text-lg font-bold text-white shadow-sm">
                        {customer.arabicName.trim().charAt(0)}
                      </div>
                      <div className="min-w-0">
                        <Link
                          href={`/customers/${customer.id}`}
                          className="block truncate font-bold transition-colors hover:text-primary"
                        >
                          {customer.arabicName}
                        </Link>
                        <p className="mt-0.5 truncate text-sm text-muted-foreground" dir="ltr">
                          {customer.englishName}
                        </p>
                      </div>
                    </div>

                    <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:block lg:space-y-1">
                      <p className="text-xs font-medium text-muted-foreground lg:hidden">رقم الجواز</p>
                      <p className="text-xs font-medium text-muted-foreground lg:mb-1">الجواز والجنسية</p>
                      <div className="col-span-2 flex flex-wrap items-center gap-2 sm:col-span-2 lg:col-auto">
                        <span className="font-mono text-sm font-bold tracking-wide" dir="ltr">
                          {customer.passportNumber}
                        </span>
                        <Badge className="bg-muted text-foreground">{customer.nationality}</Badge>
                      </div>
                    </div>

                    <div className="space-y-1.5 text-sm">
                      <p className="mb-1 text-xs font-medium text-muted-foreground">معلومات التواصل</p>
                      <div className="flex items-center gap-2" dir="ltr">
                        <Phone className="h-3.5 w-3.5 shrink-0 text-primary" />
                        <span className="truncate">{customer.mobile}</span>
                      </div>
                      {customer.email ? (
                        <div className="flex items-center gap-2 text-muted-foreground" dir="ltr">
                          <Mail className="h-3.5 w-3.5 shrink-0" />
                          <span className="truncate">{customer.email}</span>
                        </div>
                      ) : customer.address ? (
                        <div className="flex items-center gap-2 text-muted-foreground">
                          <MapPin className="h-3.5 w-3.5 shrink-0" />
                          <span className="truncate">{customer.address}</span>
                        </div>
                      ) : null}
                    </div>

                    <Button
                      asChild
                      variant="outline"
                      className="w-full gap-2 border-primary/20 text-primary hover:bg-primary hover:text-primary-foreground lg:w-auto"
                    >
                      <Link href={`/customers/${customer.id}`}>
                        عرض الملف
                        <ArrowLeft className="h-4 w-4 transition-transform group-hover:-translate-x-0.5" />
                      </Link>
                    </Button>
                  </article>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        <div className="xl:sticky xl:top-24">
          <CustomerForm />
        </div>
      </div>
    </AppShell>
  );
}
