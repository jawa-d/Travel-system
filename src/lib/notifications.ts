import { addDays, differenceInCalendarDays } from "date-fns";
import { prisma } from "@/lib/prisma";

export async function createSystemNotification(input: {
  title: string;
  message: string;
  entity?: string;
  entityId?: string;
  userId?: string;
}) {
  return prisma.notification.create({
    data: {
      type: "SYSTEM",
      title: input.title,
      message: input.message,
      entity: input.entity,
      entityId: input.entityId,
      userId: input.userId
    }
  });
}

export async function createAccessDeniedNotification(input: {
  userId: string;
  userName?: string | null;
  userEmail?: string | null;
  userRole?: string | null;
  path: string;
  permission?: string | null;
  reason?: string | null;
}) {
  const actor = input.userName || input.userEmail || "مستخدم غير معروف";
  const permissionText = input.permission ? `\nالصلاحية المطلوبة: ${input.permission}` : "";
  const reasonText = input.reason ? `\nسبب المنع: ${input.reason}` : "";
  const message = [
    `تم منع محاولة دخول غير مصرح بها.`,
    `المستخدم: ${actor}`,
    input.userEmail ? `البريد: ${input.userEmail}` : null,
    input.userRole ? `الدور: ${input.userRole}` : null,
    `الصفحة المطلوبة: ${input.path}`,
    permissionText.trim() || null,
    reasonText.trim() || null,
    `وقت المحاولة: ${new Date().toLocaleString("en-US-u-nu-latn", { timeZone: "Asia/Baghdad" })}`
  ].filter(Boolean).join("\n");

  const superAdmins = await prisma.user.findMany({
    where: { role: "SUPER_ADMIN", active: true },
    select: { id: true }
  });

  const base = {
    type: "SYSTEM" as const,
    title: "تنبيه أمني: محاولة دخول مرفوضة",
    message,
    entity: "AccessDenied",
    entityId: input.userId
  };

  if (!superAdmins.length) {
    return prisma.notification.create({ data: base });
  }

  return prisma.notification.createMany({
    data: superAdmins.map((admin) => ({ ...base, userId: admin.id }))
  });
}

export async function schedulePolicyExpiryNotifications(policyId: string) {
  const policy = await prisma.policy.findUnique({ where: { id: policyId }, include: { customer: true, issuedBy: true } });
  if (!policy) return;
  const days = [30, 15, 7, 1];
  await prisma.notification.createMany({
    data: days.map((day) => ({
      userId: policy.issuedById,
      type: "EXPIRY" as const,
      title: `تنبيه انتهاء خلال ${day} يوم`,
      message: `الوثيقة ${policy.policyNumber} للعميل ${policy.customer.arabicName} ستنتهي قريبا.`,
      entity: "Policy",
      entityId: policy.id,
      dueAt: addDays(policy.returnDate, -day)
    }))
  });
}

export async function buildExpiryNotificationsPreview() {
  const policies = await prisma.policy.findMany({
    where: { status: "ACTIVE" },
    include: { customer: true },
    orderBy: { returnDate: "asc" },
    take: 20
  });
  return policies
    .map((policy) => ({
      policy,
      daysLeft: differenceInCalendarDays(policy.returnDate, new Date())
    }))
    .filter((item) => [30, 15, 7, 1].includes(item.daysLeft));
}
