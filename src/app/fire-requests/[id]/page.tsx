import { notFound } from "next/navigation";
import { InsuranceRequestDetailsPageShell } from "@/components/insurance-request-details-page-shell";
import { fireRequestModule, fireRequestService } from "@/lib/insurance-modules/fire-requests";
import { requirePagePermission } from "@/lib/page-guard";

export default async function FireRequestDetailsPage({ params }: { params: Promise<{ id: string }> }) {
  await requirePagePermission("fireRequestsRead");
  const { id } = await params;
  const request = fireRequestService.get(id);
  if (!request) notFound();
  return <InsuranceRequestDetailsPageShell module={fireRequestModule} request={request} />;
}
