import nodemailer from "nodemailer";

export async function sendEmail(input: { to: string; subject: string; text: string; attachments?: { filename: string; content: Buffer; contentType: string }[] }) {
  if (!process.env.SMTP_HOST) {
    return { skipped: true, reason: "SMTP is not configured" };
  }

  const transporter = nodemailer.createTransport({
    host: process.env.SMTP_HOST,
    port: Number(process.env.SMTP_PORT ?? 587),
    secure: Number(process.env.SMTP_PORT) === 465,
    auth: process.env.SMTP_USER ? { user: process.env.SMTP_USER, pass: process.env.SMTP_PASS } : undefined
  });

  await transporter.sendMail({
    from: process.env.SMTP_FROM ?? "TRINSU <no-reply@trinsu.local>",
    to: input.to,
    subject: input.subject,
    text: input.text,
    attachments: input.attachments
  });

  return { skipped: false };
}
