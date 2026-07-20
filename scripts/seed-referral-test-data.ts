import { PrismaClient, ReferralStatus, TransportMode } from "@prisma/client";

const prisma = new PrismaClient();

const applicants = [
  "Al Noor Trading", "Basra Gulf Cargo", "Tigris Medical Supplies", "Zahra Import Co", "Rafidain Steel",
  "Palm Logistics", "Baghdad Electronics", "Nahrain Foods", "Al Salam Textiles", "Mesopotamia Motors"
];

const beneficiaries = [
  "Trade Bank of Iraq", "Al Mansour Bank", "National Bank of Iraq", "Iraq Islamic Bank", "Gulf Commercial Bank",
  "Ashur International Bank", "Babylon Finance", "Al Huda Bank", "Sumer Commercial Bank", "Dar Al Salam Bank"
];

const cargo = [
  "Medical devices and spare parts", "Steel coils", "Consumer electronics", "Frozen food shipment", "Textile rolls",
  "Industrial pumps", "Ceramic tiles", "Agricultural equipment", "Pharmaceutical cartons", "Vehicle spare parts"
];

const cities = ["Shanghai", "Dubai", "Mersin", "Jebel Ali", "Mumbai", "Hamburg", "Busan", "Singapore", "Amman", "Kuwait"];
const iraqRoutes = ["Umm Qasr", "Baghdad", "Basra", "Erbil", "Najaf", "Mosul", "Karbala", "Kirkuk", "Sulaymaniyah", "Duhok"];
const coverTypes = ["Cluse A", "Cluse B", "Cluse C"];
const statuses: ReferralStatus[] = ["RECEIVED", "UNDER_REVIEW", "CONTACTING", "ISSUED"];
const modes: TransportMode[] = ["SEA", "LAND", "AIR"];
const packages = ["Containers", "Pallets", "Cartons", "Crates", "Drums", "Bags"];

function daysFromNow(days: number) {
  const date = new Date();
  date.setDate(date.getDate() + days);
  return date;
}

function referralNumber(index: number) {
  const stamp = new Date().toISOString().replace(/\D/g, "").slice(0, 14);
  return `REF-TEST-${stamp}-${String(index).padStart(2, "0")}`;
}

async function main() {
  const creator = await prisma.user.findFirst({
    where: { active: true },
    select: { id: true, name: true, email: true, role: true, agency: { select: { name: true } } },
    orderBy: { createdAt: "asc" }
  });

  const referralRows = [];
  const installmentRows = [];

  for (let index = 1; index <= 50; index += 1) {
    const insuredAmount = 25_000 + index * 3_750;
    const increaseRate = index % 4 === 0 ? 15 : index % 3 === 0 ? 10 : 5;
    const totalPremium = Math.round(insuredAmount * (0.004 + (index % 5) * 0.0005));
    const currency = index % 5 === 0 ? "USD" : "IQD";
    const status = statuses[index % statuses.length];
    const number = referralNumber(index);

    referralRows.push({
      referralNumber: number,
      type: "MARINE" as const,
      status,
      applicantName: `${applicants[index % applicants.length]} ${index}`,
      beneficiaryName: beneficiaries[index % beneficiaries.length],
      insuredAmount,
      insuranceFrom: daysFromNow(index),
      insuranceTo: daysFromNow(index + 30 + (index % 20)),
      totalInsuredAfterIncrease: Math.round(insuredAmount * (1 + increaseRate / 100)),
      increaseRate,
      coverType: coverTypes[index % coverTypes.length],
      cargoDescription: cargo[index % cargo.length],
      routeFrom: cities[index % cities.length],
      routeTo: iraqRoutes[index % iraqRoutes.length],
      transportMode: modes[index % modes.length],
      packagingType: packages[index % packages.length],
      lcNumber: `LC-${new Date().getFullYear()}-${String(7000 + index)}`,
      carrierName: `${["Maersk", "MSC", "CMA CGM", "Turkish Cargo", "DHL"][index % 5]} ${100 + index}`,
      invoiceNumber: `INV-${new Date().getFullYear()}-${String(90000 + index)}`,
      currency,
      extraRisks: index % 2 === 0 ? ["war"] : index % 3 === 0 ? ["strike", "riot"] : [],
      hasPreviousCompensation: index % 11 === 0,
      totalPremium,
      notes: `Test referral batch record ${index}`,
      createdById: creator?.id,
      createdByName: creator?.name ?? "Test Data",
      createdByEmail: creator?.email ?? null,
      createdByRole: creator?.role ?? "SUPER_ADMIN",
      createdByBank: creator?.agency?.name ?? (index % 4 === 0 ? "Test Bank Desk" : null),
      issuedAt: status === "ISSUED" ? daysFromNow(-index) : null
    });

    installmentRows.push(
      { referralNumber: number, label: "First installment", amount: Math.round(totalPremium * 0.5), dueDate: daysFromNow(index + 7), paid: index % 2 === 0 },
      { referralNumber: number, label: "Final installment", amount: totalPremium - Math.round(totalPremium * 0.5), dueDate: daysFromNow(index + 21), paid: false }
    );
  }

  await prisma.referral.createMany({ data: referralRows });

  const referrals = await prisma.referral.findMany({
    where: { referralNumber: { in: referralRows.map((item) => item.referralNumber) } },
    select: { id: true, referralNumber: true }
  });
  const referralIdByNumber = new Map(referrals.map((item) => [item.referralNumber, item.id]));

  await prisma.referralInstallment.createMany({
    data: installmentRows.flatMap((item) => {
      const referralId = referralIdByNumber.get(item.referralNumber);
      return referralId ? [{ referralId, label: item.label, amount: item.amount, dueDate: item.dueDate, paid: item.paid }] : [];
    })
  });

  console.log(`Created ${referrals.length} referral test records.`);
  console.log(referrals.map((item) => item.referralNumber).sort().join("\n"));
}

main()
  .catch((error) => {
    console.error(error);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
