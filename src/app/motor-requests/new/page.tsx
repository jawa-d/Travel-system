import { AppShell } from "@/components/app-shell";
import { MotorInsuranceRequestForm } from "@/components/motor-insurance-request-form";
import { requirePagePermission } from "@/lib/page-guard";

export default async function NewMotorRequestPage() {
  await requirePagePermission("motorRequestsCreate");

  return (
    <AppShell>
      <MotorInsuranceRequestForm />
    </AppShell>
  );
}
