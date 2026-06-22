import { AppShell } from "@/components/app-shell";
import { CustomerProfile } from "@/components/customer-profile";
import { prisma } from "@/lib/prisma";
import { notFound } from "next/navigation";
import { requirePagePermission } from "@/lib/page-guard";
import { can } from "@/lib/rbac";

export default async function CustomerProfilePage({ params }: { params: Promise<{ id: string }> }) {
  const user = await requirePagePermission("customersRead");
  const { id } = await params;
  const customer = await prisma.customer.findUnique({
    where: { id },
    include: { policies: { include: { travelPlan: true, destinationCountry: true }, orderBy: { createdAt: "desc" } } }
  });
  if (!customer) notFound();

  const policies = customer.policies.map((policy) => ({
    id: policy.id,
    policyNumber: policy.policyNumber,
    customerName: customer.arabicName,
    destinationName: policy.destinationCountry.nameAr,
    planName: policy.travelPlan.name,
    premium: String(policy.premium),
    status: policy.status
  }));

  return (
    <AppShell>
      <CustomerProfile
        canDelete={can(user.role, "customersDelete")}
        initialCustomer={{
          id: customer.id,
          arabicName: customer.arabicName,
          englishName: customer.englishName,
          passportNumber: customer.passportNumber,
          nationality: customer.nationality,
          dateOfBirth: customer.dateOfBirth.toISOString(),
          gender: customer.gender,
          mobile: customer.mobile,
          email: customer.email,
          address: customer.address,
          passportImage: customer.passportImage
        }}
        initialPolicies={policies}
      />
    </AppShell>
  );
}
