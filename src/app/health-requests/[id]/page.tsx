import { notFound } from "next/navigation";
import { InsuranceRequestDetailsPageShell } from "@/components/insurance-request-details-page-shell";
import { healthRequestModule, healthRequestService } from "@/lib/insurance-modules/health-requests";
import { requirePagePermission } from "@/lib/page-guard";

export default async function HealthRequestDetailsPage({ params }: { params: Promise<{ id: string }> }) {
  await requirePagePermission("healthRequestsRead");
  const { id } = await params;
  const request = healthRequestService.get(id);
  if (!request) notFound();
  return <InsuranceRequestDetailsPageShell module={healthRequestModule} request={request} />;
}
