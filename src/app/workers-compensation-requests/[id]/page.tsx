import { notFound } from "next/navigation";
import { InsuranceRequestDetailsPageShell } from "@/components/insurance-request-details-page-shell";
import { workersCompensationRequestModule, workersCompensationRequestService } from "@/lib/insurance-modules/workers-compensation-requests";
import { requirePagePermission } from "@/lib/page-guard";

export default async function WorkersCompensationRequestDetailsPage({ params }: { params: Promise<{ id: string }> }) {
  await requirePagePermission("workersCompensationRequestsRead");
  const { id } = await params;
  const request = workersCompensationRequestService.get(id);
  if (!request) notFound();
  return <InsuranceRequestDetailsPageShell module={workersCompensationRequestModule} request={request} />;
}
