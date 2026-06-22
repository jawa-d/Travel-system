"use client";

import Link from "next/link";
import { ImageIcon, UserRound } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { useLocalCollection } from "@/lib/local-storage";
import { StoredImage } from "@/components/stored-image";

type CustomerItem = {
  id: string;
  arabicName: string;
  englishName: string;
  passportNumber: string;
  nationality: string;
  mobile: string;
  email: string | null;
  passportImage?: string | null;
};

export function LocalCustomers({ initial, serverIds }: { initial: CustomerItem[]; serverIds: string[] }) {
  const [customers] = useLocalCollection("customers", initial);
  const localOnly = customers.filter((customer) => !serverIds.includes(customer.id));
  if (!localOnly.length) return null;

  return (
    <div className="border-b bg-primary/[0.025]">
      <div className="border-b px-5 py-3 text-xs font-bold text-primary sm:px-6">
        عملاء محفوظون في هذا المتصفح
      </div>
      <div className="divide-y">
        {localOnly.map((customer) => (
          <article key={customer.id} className="grid gap-4 px-5 py-4 sm:px-6 lg:grid-cols-[minmax(210px,1.35fr)_minmax(150px,0.8fr)_minmax(190px,1fr)_auto] lg:items-center">
            <div className="flex min-w-0 items-center gap-3">
              {customer.passportImage ? (
                <StoredImage source={customer.passportImage} alt="" className="h-12 w-12 rounded-xl object-cover" />
              ) : (
                <div className="grid h-12 w-12 place-items-center rounded-xl bg-primary/10 text-primary"><UserRound className="h-5 w-5" /></div>
              )}
              <div className="min-w-0">
                <p className="truncate font-bold">{customer.arabicName}</p>
                <p className="truncate text-sm text-muted-foreground" dir="ltr">{customer.englishName}</p>
              </div>
            </div>
            <div>
              <p className="font-mono text-sm font-bold" dir="ltr">{customer.passportNumber}</p>
              <Badge className="mt-1 bg-muted text-foreground">{customer.nationality}</Badge>
            </div>
            <div className="text-sm">
              <p dir="ltr">{customer.mobile}</p>
              <p className="truncate text-muted-foreground" dir="ltr">{customer.email}</p>
            </div>
            <Button asChild variant="outline" size="sm">
              <Link href={`/customers/${customer.id}`}><ImageIcon className="h-4 w-4" />عرض الملف</Link>
            </Button>
          </article>
        ))}
      </div>
    </div>
  );
}
