import { notFound } from "next/navigation";
import { InsuranceRequestDetailsPageShell } from "@/components/insurance-request-details-page-shell";
import { contractorsAllRisksRequestModule, contractorsAllRisksRequestService } from "@/lib/insurance-modules/contractors-all-risks-requests";
import { requirePagePermission } from "@/lib/page-guard";

export default async function ContractorsAllRisksRequestDetailsPage({ params }: { params: Promise<{ id: string }> }) {
  await requirePagePermission("contractorsAllRisksRequestsRead");
  const { id } = await params;
  const request = contractorsAllRisksRequestService.get(id);
  if (!request) notFound();
  return <InsuranceRequestDetailsPageShell module={contractorsAllRisksRequestModule} request={request} />;
}
