import { InsuranceRequestsPageShell } from "@/components/insurance-requests-page-shell";
import { propertyRequestModule } from "@/lib/insurance-modules/property-requests";
import { requirePagePermission } from "@/lib/page-guard";

export default async function PropertyRequestsPage() {
  await requirePagePermission("propertyRequestsRead");
  return <InsuranceRequestsPageShell module={propertyRequestModule} />;
}
