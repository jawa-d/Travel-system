import { InsuranceRequestsPageShell } from "@/components/insurance-requests-page-shell";
import { cashInsuranceRequestModule } from "@/lib/insurance-modules/cash-insurance-requests";
import { requirePagePermission } from "@/lib/page-guard";

export default async function CashInsuranceRequestsPage() {
  await requirePagePermission("cashInsuranceRequestsRead");
  return <InsuranceRequestsPageShell module={cashInsuranceRequestModule} />;
}
