import { notFound } from "next/navigation";
import { InsuranceRequestDetailsPageShell } from "@/components/insurance-request-details-page-shell";
import { travelRequestModule, travelRequestService } from "@/lib/insurance-modules/travel-requests";
import { requirePagePermission } from "@/lib/page-guard";

export default async function TravelRequestDetailsPage({ params }: { params: Promise<{ id: string }> }) {
  await requirePagePermission("travelRequestsRead");
  const { id } = await params;
  const request = travelRequestService.get(id);
  if (!request) notFound();
  return <InsuranceRequestDetailsPageShell module={travelRequestModule} request={request} />;
}
