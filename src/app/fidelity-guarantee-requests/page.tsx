import { InsuranceRequestsPageShell } from "@/components/insurance-requests-page-shell";
import { fidelityGuaranteeRequestModule } from "@/lib/insurance-modules/fidelity-guarantee-requests";
import { requirePagePermission } from "@/lib/page-guard";

export default async function FidelityGuaranteeRequestsPage() {
  await requirePagePermission("fidelityGuaranteeRequestsRead");
  return <InsuranceRequestsPageShell module={fidelityGuaranteeRequestModule} />;
}
