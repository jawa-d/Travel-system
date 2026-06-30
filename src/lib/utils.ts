import { type ClassValue, clsx } from "clsx";
import { twMerge } from "tailwind-merge";
import { toEnglishDigits } from "@/lib/i18n";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function formatCurrency(value: number | string) {
  return toEnglishDigits(new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
    maximumFractionDigits: 2
  }).format(Number(value)));
}

export function formatDate(value: Date | string) {
  return toEnglishDigits(new Intl.DateTimeFormat("en-US-u-nu-latn", {
    year: "numeric",
    month: "long",
    day: "numeric"
  }).format(new Date(value)));
}

export function getAge(dateOfBirth: Date | string) {
  const dob = new Date(dateOfBirth);
  const today = new Date();
  let age = today.getFullYear() - dob.getFullYear();
  const monthDiff = today.getMonth() - dob.getMonth();
  if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < dob.getDate())) age -= 1;
  return age;
}
