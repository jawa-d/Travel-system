import { notFound } from "next/navigation";
import { InsuranceRequestDetailsPageShell } from "@/components/insurance-request-details-page-shell";
import { cashInsuranceRequestModule, cashInsuranceRequestService } from "@/lib/insurance-modules/cash-insurance-requests";
import { requirePagePermission } from "@/lib/page-guard";

export default async function CashInsuranceRequestDetailsPage({ params }: { params: Promise<{ id: string }> }) {
  await requirePagePermission("cashInsuranceRequestsRead");
  const { id } = await params;
  const request = cashInsuranceRequestService.get(id);
  if (!request) notFound();
  return <InsuranceRequestDetailsPageShell module={cashInsuranceRequestModule} request={request} />;
}
