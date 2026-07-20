import { notFound } from "next/navigation";
import { InsuranceRequestDetailsPageShell } from "@/components/insurance-request-details-page-shell";
import { publicLiabilityRequestModule, publicLiabilityRequestService } from "@/lib/insurance-modules/public-liability-requests";
import { requirePagePermission } from "@/lib/page-guard";

export default async function PublicLiabilityRequestDetailsPage({ params }: { params: Promise<{ id: string }> }) {
  await requirePagePermission("publicLiabilityRequestsRead");
  const { id } = await params;
  const request = publicLiabilityRequestService.get(id);
  if (!request) notFound();
  return <InsuranceRequestDetailsPageShell module={publicLiabilityRequestModule} request={request} />;
}
