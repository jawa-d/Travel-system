import { notFound } from "next/navigation";
import { InsuranceRequestDetailsPageShell } from "@/components/insurance-request-details-page-shell";
import { propertyRequestModule, propertyRequestService } from "@/lib/insurance-modules/property-requests";
import { requirePagePermission } from "@/lib/page-guard";

export default async function PropertyRequestDetailsPage({ params }: { params: Promise<{ id: string }> }) {
  await requirePagePermission("propertyRequestsRead");
  const { id } = await params;
  const request = propertyRequestService.get(id);
  if (!request) notFound();
  return <InsuranceRequestDetailsPageShell module={propertyRequestModule} request={request} />;
}
