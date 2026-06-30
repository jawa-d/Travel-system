import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { canAccessPolicy } from "@/lib/policy-access";
import { requireUser, jsonError } from "@/lib/api";
import { createPolicyPdf } from "@/lib/pdf";
import { sendEmail } from "@/lib/email";
import { emailPdfSchema } from "@/lib/validators";
import { formatCurrency } from "@/lib/utils";
import { getPolicyVerificationUrl } from "@/lib/policy-verification";

function formatPdfDate(value: Date | string) {
  return new Intl.DateTimeFormat("en-US", {
    year: "numeric",
    month: "long",
    day: "numeric"
  }).format(new Date(value));
}

export async function POST(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const user = await requireUser();
    const { id } = await params;
    const { email } = emailPdfSchema.parse(await request.json());
    const policy = await prisma.policy.findUniqueOrThrow({
      where: { id },
      include: { customer: true, destinationCountry: true, travelPlan: true, issuedBy: true, agency: true }
    });
    if (!canAccessPolicy(user, policy) || policy.deletedAt) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }
    const verificationUrl = getPolicyVerificationUrl(policy.policyNumber);
    const doc = await createPolicyPdf({
      policyNumber: policy.policyNumber,
      customerName: policy.customer.englishName,
      passportNumber: policy.customer.passportNumber,
      nationality: policy.customer.nationality,
      destination: policy.destinationCountry.nameEn,
      coverageAmount: String(policy.coverageAmount),
      agency: policy.agency?.name ?? policy.issuedByAgency ?? "-",
      policyType: policy.policyType,
      planName: policy.travelPlan.name,
      departureDate: formatPdfDate(policy.departureDate),
      returnDate: formatPdfDate(policy.returnDate),
      premium: formatCurrency(String(policy.premium)),
      verificationUrl,
      issueDate: formatPdfDate(policy.issuedAt ?? policy.createdAt),
      issuedBy: policy.issuedByName ?? policy.issuedBy?.name ?? "-",
      issuedByRole: policy.issuedByRole ?? policy.issuedBy?.role ?? "-"
    });
    const buffer = Buffer.from(doc.output("arraybuffer"));
    const result = await sendEmail({
      to: email,
      subject: `TRINSU Policy ${policy.policyNumber}`,
      text: `Attached is policy ${policy.policyNumber}. Verification: ${verificationUrl}`,
      attachments: [{ filename: `${policy.policyNumber}.pdf`, content: buffer, contentType: "application/pdf" }]
    });
    await prisma.notification.create({
      data: {
        type: "EMAIL",
        title: "Policy PDF email",
        message: `Policy ${policy.policyNumber} emailed to ${email}`,
        entity: "Policy",
        entityId: policy.id,
        status: result.skipped ? "FAILED" : "SENT",
        sentAt: result.skipped ? null : new Date()
      }
    });
    return NextResponse.json(result);
  } catch (error) {
    return jsonError(error);
  }
}
