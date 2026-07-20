import { InsuranceRequestsPageShell } from "@/components/insurance-requests-page-shell";
import { fireRequestModule } from "@/lib/insurance-modules/fire-requests";
import { requirePagePermission } from "@/lib/page-guard";

export default async function FireRequestsPage() {
  await requirePagePermission("fireRequestsRead");
  return <InsuranceRequestsPageShell module={fireRequestModule} />;
}
