import { Globe2, PlusCircle } from "lucide-react";
import { AppShell } from "@/components/app-shell";
import { CountryManager } from "@/components/country-manager";
import { ResourceForm } from "@/components/resource-form";
import { Badge } from "@/components/ui/badge";
import { getDemoCountries } from "@/lib/demo-country-store";
import { isDirectAccessEnabled } from "@/lib/direct-access";
import { prisma } from "@/lib/prisma";

const fields = [
  { name: "nameAr", label: "اسم الدولة بالعربية" },
  { name: "nameEn", label: "اسم الدولة بالإنجليزية" },
  { name: "isoCode", label: "رمز ISO" },
  { name: "category", label: "التصنيف", options: [
    { label: "مسموحة", value: "ALLOWED" },
    { label: "مقيّدة", value: "RESTRICTED" },
    { label: "عالية الخطورة", value: "HIGH_RISK" }
  ] },
  { name: "additionalRiskFee", label: "رسوم المخاطر الإضافية", type: "number" },
  { name: "status", label: "الحالة", options: [
    { label: "فعالة", value: "ACTIVE" },
    { label: "غير فعالة", value: "INACTIVE" }
  ] }
];

export default async function CountriesPage() {
  const countries = isDirectAccessEnabled()
    ? getDemoCountries()
    : await prisma.country.findMany({ orderBy: [{ category: "asc" }, { nameAr: "asc" }] });
  const activeCountries = countries.filter((country) => country.status === "ACTIVE").length;
  const highRiskCountries = countries.filter((country) => country.category === "HIGH_RISK").length;

  return (
    <AppShell>
      <div className="mb-6 flex flex-col justify-between gap-4 md:flex-row md:items-end">
        <div>
          <div className="mb-2 flex items-center gap-2 text-sm font-medium text-primary">
            <Globe2 className="h-4 w-4" />نطاق التغطية الجغرافية
          </div>
          <h1 className="text-2xl font-bold tracking-tight sm:text-3xl">إدارة الدول</h1>
          <p className="mt-1 text-sm text-muted-foreground">
            إضافة وتعديل وحذف الدول وتحديد تصنيف المخاطر والرسوم الإضافية.
          </p>
        </div>
        <div className="flex gap-3">
          <Stat label="الدول الفعالة" value={activeCountries} className="text-emerald-600" />
          <Stat label="عالية الخطورة" value={highRiskCountries} className="text-red-600" />
        </div>
      </div>

      <div className="grid items-start gap-6 xl:grid-cols-[minmax(0,1fr)_360px]">
        <section className="space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-lg font-bold">الدول المسجلة</h2>
              <p className="text-sm text-muted-foreground">يمكنك تعديل الدولة أو حذفها مباشرة</p>
            </div>
            <Badge className="border-primary/20 bg-primary/10 text-primary">{countries.length} دولة</Badge>
          </div>

          <CountryManager
            countries={countries.map((country) => ({
              id: country.id,
              nameAr: country.nameAr,
              nameEn: country.nameEn,
              isoCode: country.isoCode,
              category: country.category,
              additionalRiskFee: String(country.additionalRiskFee),
              status: country.status
            }))}
          />
        </section>

        <aside className="xl:sticky xl:top-24">
          <div className="mb-3 flex items-center gap-2 px-1">
            <PlusCircle className="h-4 w-4 text-primary" />
            <p className="text-sm font-medium text-muted-foreground">إضافة دولة جديدة</p>
          </div>
          <ResourceForm title="دولة جديدة" endpoint="/api/countries" fields={fields} />
        </aside>
      </div>
    </AppShell>
  );
}

function Stat({ label, value, className }: { label: string; value: number; className: string }) {
  return (
    <div className="rounded-xl border bg-card px-4 py-2.5 shadow-sm">
      <p className="text-xs text-muted-foreground">{label}</p>
      <p className={`mt-0.5 text-lg font-bold ${className}`}>{value}</p>
    </div>
  );
}
