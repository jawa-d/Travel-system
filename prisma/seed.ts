import { PrismaClient, Role } from "@prisma/client";
import bcrypt from "bcryptjs";

const prisma = new PrismaClient();

async function main() {
  const passwordHash = await bcrypt.hash("Admin@12345", 12);

  await prisma.user.upsert({
    where: { email: "admin@trinsu.local" },
    update: {
      name: "مدير النظام"
    },
    create: {
      name: "مدير النظام",
      email: "admin@trinsu.local",
      passwordHash,
      role: Role.SUPER_ADMIN
    }
  });

  const agentHash = await bcrypt.hash("Agent@12345", 12);
  await prisma.user.upsert({
    where: { email: "agent@trinsu.local" },
    update: {
      name: "وكيل المبيعات"
    },
    create: {
      name: "وكيل المبيعات",
      email: "agent@trinsu.local",
      passwordHash: agentHash,
      role: Role.AGENT
    }
  });

  await prisma.travelPlan.createMany({
    skipDuplicates: true,
    data: [
      {
        name: "الخطة الأساسية",
        price: 25,
        medicalCoverage: 10000,
        baggageCoverage: 500,
        tripDelayCoverage: 250,
        medicalEvacuation: 5000,
        repatriation: 5000,
        personalLiability: 10000
      },
      {
        name: "الخطة الذهبية",
        price: 55,
        medicalCoverage: 50000,
        baggageCoverage: 1500,
        tripDelayCoverage: 750,
        medicalEvacuation: 25000,
        repatriation: 25000,
        personalLiability: 50000
      }
    ]
  });

  await prisma.country.createMany({
    skipDuplicates: true,
    data: [
      { nameAr: "تركيا", nameEn: "Turkey", isoCode: "TR", category: "ALLOWED" },
      { nameAr: "الإمارات", nameEn: "United Arab Emirates", isoCode: "AE", category: "ALLOWED" },
      { nameAr: "المملكة المتحدة", nameEn: "United Kingdom", isoCode: "GB", category: "ALLOWED" },
      { nameAr: "أفغانستان", nameEn: "Afghanistan", isoCode: "AF", category: "HIGH_RISK", additionalRiskFee: 45 },
      { nameAr: "سوريا", nameEn: "Syria", isoCode: "SY", category: "RESTRICTED", additionalRiskFee: 30 }
    ]
  });

  await prisma.notification.createMany({
    data: [
      {
        type: "SYSTEM",
        title: "مرحبا بك",
        message: "تم تجهيز منصة TRINSU لإدارة تأمين السفر.",
        status: "PENDING"
      },
      {
        type: "EMAIL",
        title: "إعداد البريد",
        message: "أضف بيانات SMTP في ملف البيئة لتفعيل إرسال ملفات PDF.",
        status: "PENDING"
      }
    ]
  });
}

main()
  .catch((error) => {
    console.error(error);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
