import { InsuranceRequestsPageShell } from "@/components/insurance-requests-page-shell";
import { contractorsAllRisksRequestModule } from "@/lib/insurance-modules/contractors-all-risks-requests";
import { requirePagePermission } from "@/lib/page-guard";

export default async function ContractorsAllRisksRequestsPage() {
  await requirePagePermission("contractorsAllRisksRequestsRead");
  return <InsuranceRequestsPageShell module={contractorsAllRisksRequestModule} />;
}
