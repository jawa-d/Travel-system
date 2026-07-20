import { InsuranceRequestsPageShell } from "@/components/insurance-requests-page-shell";
import { workersCompensationRequestModule } from "@/lib/insurance-modules/workers-compensation-requests";
import { requirePagePermission } from "@/lib/page-guard";

export default async function WorkersCompensationRequestsPage() {
  await requirePagePermission("workersCompensationRequestsRead");
  return <InsuranceRequestsPageShell module={workersCompensationRequestModule} />;
}
