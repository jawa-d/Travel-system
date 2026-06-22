import { demoCustomers } from "@/lib/demo-data";

export type DemoCustomer = {
  id: string;
  arabicName: string;
  englishName: string;
  passportNumber: string;
  nationality: string;
  dateOfBirth: Date;
  gender: "MALE" | "FEMALE";
  mobile: string;
  email: string | null;
  address: string | null;
  passportImage: string | null;
  createdAt: Date;
  updatedAt: Date;
};

const globalStore = globalThis as typeof globalThis & {
  __trinsuDemoCustomers?: DemoCustomer[];
};

function initialCustomers(): DemoCustomer[] {
  return demoCustomers.map((customer) => ({
    ...customer,
    gender: customer.gender as DemoCustomer["gender"],
    dateOfBirth: new Date(customer.dateOfBirth),
    email: customer.email || null,
    address: customer.address || null,
    passportImage: customer.passportImage || null,
    createdAt: new Date(customer.createdAt),
    updatedAt: new Date(customer.updatedAt)
  }));
}

export function getDemoCustomers() {
  globalStore.__trinsuDemoCustomers ??= initialCustomers();
  return globalStore.__trinsuDemoCustomers;
}

export function createDemoCustomer(input: Omit<DemoCustomer, "id" | "createdAt" | "updatedAt">) {
  const duplicate = getDemoCustomers().some(
    (customer) => customer.passportNumber.toUpperCase() === input.passportNumber.toUpperCase()
  );
  if (duplicate) return null;

  const now = new Date();
  const customer: DemoCustomer = {
    ...input,
    id: `demo-customer-${crypto.randomUUID()}`,
    passportNumber: input.passportNumber.toUpperCase(),
    createdAt: now,
    updatedAt: now
  };
  getDemoCustomers().unshift(customer);
  return customer;
}

export function updateDemoCustomer(id: string, input: Omit<DemoCustomer, "id" | "createdAt" | "updatedAt">) {
  const customers = getDemoCustomers();
  const index = customers.findIndex((customer) => customer.id === id);
  if (index === -1) return null;
  const duplicate = customers.some((customer) =>
    customer.id !== id && customer.passportNumber.toUpperCase() === input.passportNumber.toUpperCase()
  );
  if (duplicate) return "DUPLICATE" as const;
  customers[index] = {
    ...customers[index],
    ...input,
    passportNumber: input.passportNumber.toUpperCase(),
    updatedAt: new Date()
  };
  return customers[index];
}
