import { notFound } from "next/navigation";
import { InsuranceRequestDetailsPageShell } from "@/components/insurance-request-details-page-shell";
import { glassRequestModule, glassRequestService } from "@/lib/insurance-modules/glass-requests";
import { requirePagePermission } from "@/lib/page-guard";

export default async function GlassRequestDetailsPage({ params }: { params: Promise<{ id: string }> }) {
  await requirePagePermission("glassRequestsRead");
  const { id } = await params;
  const request = glassRequestService.get(id);
  if (!request) notFound();
  return <InsuranceRequestDetailsPageShell module={glassRequestModule} request={request} />;
}
