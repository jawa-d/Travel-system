import { InsuranceRequestsPageShell } from "@/components/insurance-requests-page-shell";
import { travelRequestModule } from "@/lib/insurance-modules/travel-requests";
import { requirePagePermission } from "@/lib/page-guard";

export default async function TravelRequestsPage() {
  await requirePagePermission("travelRequestsRead");
  return <InsuranceRequestsPageShell module={travelRequestModule} />;
}
