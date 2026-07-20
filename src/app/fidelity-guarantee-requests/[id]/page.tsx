import { notFound } from "next/navigation";
import { InsuranceRequestDetailsPageShell } from "@/components/insurance-request-details-page-shell";
import { fidelityGuaranteeRequestModule, fidelityGuaranteeRequestService } from "@/lib/insurance-modules/fidelity-guarantee-requests";
import { requirePagePermission } from "@/lib/page-guard";

export default async function FidelityGuaranteeRequestDetailsPage({ params }: { params: Promise<{ id: string }> }) {
  await requirePagePermission("fidelityGuaranteeRequestsRead");
  const { id } = await params;
  const request = fidelityGuaranteeRequestService.get(id);
  if (!request) notFound();
  return <InsuranceRequestDetailsPageShell module={fidelityGuaranteeRequestModule} request={request} />;
}
