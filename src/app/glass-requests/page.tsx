import { InsuranceRequestsPageShell } from "@/components/insurance-requests-page-shell";
import { glassRequestModule } from "@/lib/insurance-modules/glass-requests";
import { requirePagePermission } from "@/lib/page-guard";

export default async function GlassRequestsPage() {
  await requirePagePermission("glassRequestsRead");
  return <InsuranceRequestsPageShell module={glassRequestModule} />;
}
