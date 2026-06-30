import { demoCountries } from "@/lib/demo-data";
import { isDemoModeEnabled } from "@/lib/direct-access";

export type DemoCountry = {
  id: string;
  nameAr: string;
  nameEn: string;
  isoCode: string;
  category: "ALLOWED" | "RESTRICTED" | "HIGH_RISK";
  additionalRiskFee: number;
  status: "ACTIVE" | "INACTIVE";
  createdAt: Date;
  updatedAt: Date;
};

const globalStore = globalThis as typeof globalThis & {
  __trinsuDemoCountries?: DemoCountry[];
};

function initialCountries(): DemoCountry[] {
  return demoCountries.map((country) => ({
    ...country,
    category: country.category as DemoCountry["category"],
    status: country.status as DemoCountry["status"],
    additionalRiskFee: Number(country.additionalRiskFee),
    createdAt: new Date(country.createdAt),
    updatedAt: new Date(country.updatedAt)
  }));
}

export function getDemoCountries() {
  if (!isDemoModeEnabled()) return [];
  globalStore.__trinsuDemoCountries ??= initialCountries();
  return globalStore.__trinsuDemoCountries;
}

export function createDemoCountry(data: Omit<DemoCountry, "id" | "createdAt" | "updatedAt">) {
  if (!isDemoModeEnabled()) return null;
  const now = new Date();
  const country: DemoCountry = {
    ...data,
    id: `demo-country-${crypto.randomUUID()}`,
    createdAt: now,
    updatedAt: now
  };
  getDemoCountries().unshift(country);
  return country;
}

export function updateDemoCountry(id: string, data: Omit<DemoCountry, "id" | "createdAt" | "updatedAt">) {
  if (!isDemoModeEnabled()) return null;
  const countries = getDemoCountries();
  const index = countries.findIndex((country) => country.id === id);
  if (index === -1) return null;
  countries[index] = { ...countries[index], ...data, updatedAt: new Date() };
  return countries[index];
}

export function deleteDemoCountry(id: string) {
  if (!isDemoModeEnabled()) return false;
  const countries = getDemoCountries();
  const index = countries.findIndex((country) => country.id === id);
  if (index === -1) return false;
  countries.splice(index, 1);
  return true;
}
