import { InsuranceRequestsPageShell } from "@/components/insurance-requests-page-shell";
import { publicLiabilityRequestModule } from "@/lib/insurance-modules/public-liability-requests";
import { requirePagePermission } from "@/lib/page-guard";

export default async function PublicLiabilityRequestsPage() {
  await requirePagePermission("publicLiabilityRequestsRead");
  return <InsuranceRequestsPageShell module={publicLiabilityRequestModule} />;
}
