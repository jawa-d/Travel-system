import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { canAccessPolicy } from "@/lib/policy-access";
import { requireUser, jsonError } from "@/lib/api";
import { createPolicyPdf } from "@/lib/pdf";
import { sendEmail } from "@/lib/email";
import { emailPdfSchema } from "@/lib/validators";
import { formatCurrency, formatDate } from "@/lib/utils";

export async function POST(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const user = await requireUser();
    const { id } = await params;
    const { email } = emailPdfSchema.parse(await request.json());
    const policy = await prisma.policy.findUniqueOrThrow({
      where: { id },
      include: { customer: true, destinationCountry: true, travelPlan: true }
    });
    if (!canAccessPolicy(user, policy) || policy.deletedAt) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }
    const verificationUrl = `${process.env.NEXTAUTH_URL ?? "http://localhost:3000"}/verify/${policy.policyNumber}`;
    const doc = await createPolicyPdf({
      policyNumber: policy.policyNumber,
      customerName: policy.customer.englishName,
      arabicCustomerName: policy.customer.arabicName,
      passportNumber: policy.customer.passportNumber,
      destination: policy.destinationCountry.nameEn,
      coverageAmount: String(policy.coverageAmount),
      policyType: policy.policyType,
      planName: policy.travelPlan.name,
      departureDate: formatDate(policy.departureDate),
      returnDate: formatDate(policy.returnDate),
      premium: formatCurrency(String(policy.premium)),
      verificationUrl
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
