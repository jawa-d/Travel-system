import { InsuranceRequestsPageShell } from "@/components/insurance-requests-page-shell";
import { healthRequestModule } from "@/lib/insurance-modules/health-requests";
import { requirePagePermission } from "@/lib/page-guard";

export default async function HealthRequestsPage() {
  await requirePagePermission("healthRequestsRead");
  return <InsuranceRequestsPageShell module={healthRequestModule} />;
}
