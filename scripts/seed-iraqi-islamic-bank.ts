import { PrismaClient, Role } from "@prisma/client";
import bcrypt from "bcryptjs";
import { randomUUID } from "crypto";

const prisma = new PrismaClient();

const bankName = "المصرف العراقي الاسلامي للاستثمار والتنمية";

const branches = [
  { code: "IIB-MAIN", branch: "الفرع الرئيسي والادارة العامه", email: "iib-main@trinsu.local" },
  { code: "IIB-RAMADI", branch: "الرمادي", email: "iib-ramadi@trinsu.local" },
  { code: "IIB-MANSOUR", branch: "المنصور", email: "iib-mansour@trinsu.local" },
  { code: "IIB-KARRADA", branch: "الكرادة", email: "iib-karrada@trinsu.local" },
  { code: "IIB-NAJAF", branch: "النجف", email: "iib-najaf@trinsu.local" },
  { code: "IIB-MOSUL", branch: "الموصل", email: "iib-mosul@trinsu.local" },
  { code: "IIB-BASRA", branch: "البصرة", email: "iib-basra@trinsu.local" },
  { code: "IIB-KIRKUK", branch: "كركوك", email: "iib-kirkuk@trinsu.local" },
  { code: "IIB-FALLUJAH", branch: "الفلوجة", email: "iib-fallujah@trinsu.local" },
  { code: "IIB-HILLA", branch: "الحلة", email: "iib-hilla@trinsu.local" },
  { code: "IIB-SAMAWAH", branch: "السماوة", email: "iib-samawah@trinsu.local" },
  { code: "IIB-DIWANIYAH", branch: "الديوانية", email: "iib-diwaniyah@trinsu.local" },
  { code: "IIB-TIKRIT", branch: "تكريت", email: "iib-tikrit@trinsu.local" },
  { code: "IIB-ERBIL", branch: "اربيل", email: "iib-erbil@trinsu.local" },
  { code: "IIB-SULAYMANIYAH", branch: "السليمانيه", email: "iib-sulaymaniyah@trinsu.local" },
  { code: "IIB-KARBALA", branch: "كربلاء", email: "iib-karbala@trinsu.local" },
  { code: "IIB-POLICE-MARTYRS", branch: "وزارة الداخليه صندوق شهداء الشرطة", email: "iib-police-martyrs@trinsu.local" },
  { code: "IIB-DUHOK", branch: "دهوك", email: "iib-duhok@trinsu.local" },
  { code: "IIB-ZAYOUNA", branch: "زيونة", email: "iib-zayouna@trinsu.local" },
  { code: "IIB-ADHAMIYA", branch: "الاعظمية", email: "iib-adhamiya@trinsu.local" },
  { code: "IIB-SAYDIYA", branch: "السيدية", email: "iib-saydiya@trinsu.local" }
];

function passwordEnvName(code: string) {
  return `${code.replace(/-/g, "_")}_PASSWORD`;
}

function temporaryPassword(code: string) {
  return `ChangeMe-${code}-${randomUUID().slice(0, 8)}!`;
}

async function main() {
  for (const item of branches) {
    const agency = await prisma.agency.upsert({
      where: { code: item.code },
      update: {
        name: `${bankName} - ${item.branch}`,
        active: true
      },
      create: {
        code: item.code,
        name: `${bankName} - ${item.branch}`,
        active: true
      }
    });

    const passwordFromEnv = process.env[passwordEnvName(item.code)];
    const password = passwordFromEnv ?? temporaryPassword(item.code);
    const passwordHash = await bcrypt.hash(password, 12);
    const existingUser = await prisma.user.findUnique({
      where: { email: item.email },
      select: { id: true }
    });

    if (existingUser) {
      await prisma.user.update({
        where: { email: item.email },
        data: {
          name: `${bankName} - ${item.branch}`,
          ...(passwordFromEnv ? { passwordHash } : {}),
          role: Role.BANK,
          active: true,
          agencyId: agency.id
        }
      });
    } else {
      await prisma.user.create({
        data: {
          name: `${bankName} - ${item.branch}`,
          email: item.email,
          passwordHash,
          role: Role.BANK,
          active: true,
          agencyId: agency.id
        }
      });
    }
  }

  console.table(branches.map(({ code, branch, email }) => ({
    branch,
    email,
    passwordEnv: passwordEnvName(code)
  })));
}

main()
  .catch((error) => {
    console.error(error);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
