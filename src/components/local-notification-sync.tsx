"use client";

import { useEffect } from "react";
import { readLocalCollection, writeLocalCollection } from "@/lib/local-storage";

type Policy = { id: string; policyNumber: string; customerName: string; returnDate: string; status: string };
type Notification = { id: string; type: "EXPIRY"; title: string; message: string; status: "PENDING"; dueAt: string; createdAt: string };

export function LocalNotificationSync() {
  useEffect(() => {
    const policies = readLocalCollection<Policy>("policies") ?? [];
    const current = readLocalCollection<Notification>("notifications") ?? [];
    const existing = new Set(current.map((item) => item.id));
    const now = Date.now();
    const generated: Notification[] = [];
    policies.filter((policy) => policy.status === "ACTIVE").forEach((policy) => {
      const days = Math.ceil((new Date(policy.returnDate).getTime() - now) / 86_400_000);
      if (![30, 15, 7, 3, 1, 0].includes(days)) return;
      const id = `expiry-${policy.id}-${days}`;
      if (existing.has(id)) return;
      generated.push({
        id,
        type: "EXPIRY",
        title: days === 0 ? "تنتهي الوثيقة اليوم" : `تنتهي الوثيقة خلال ${days} يوم`,
        message: `الوثيقة ${policy.policyNumber} للعميل ${policy.customerName} تقترب من الانتهاء.`,
        status: "PENDING",
        dueAt: new Date().toISOString(),
        createdAt: new Date().toISOString()
      });
    });
    if (generated.length) {
      writeLocalCollection("notifications", [...generated, ...current]);
      if ("Notification" in window && Notification.permission === "granted") {
        generated.forEach((item) => new Notification(item.title, { body: item.message }));
      }
    }
  }, []);
  return null;
}
