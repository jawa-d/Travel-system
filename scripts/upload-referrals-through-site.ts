const baseUrl = process.env.SITE_URL ?? "http://localhost:3000";
const referralCount = Number(process.env.REFERRAL_COUNT ?? 50);
const startIndex = Number(process.env.REFERRAL_START_INDEX ?? 1);

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
const origins = ["Shanghai", "Dubai", "Mersin", "Jebel Ali", "Mumbai", "Hamburg", "Busan", "Singapore", "Amman", "Kuwait"];
const destinations = ["Umm Qasr", "Baghdad", "Basra", "Erbil", "Najaf", "Mosul", "Karbala", "Kirkuk", "Sulaymaniyah", "Duhok"];
const modes = ["SEA", "LAND", "AIR"];
const packages = ["Containers", "Pallets", "Cartons", "Crates", "Drums", "Bags"];

function date(days: number) {
  const value = new Date();
  value.setDate(value.getDate() + days);
  return value.toISOString().slice(0, 10);
}

function payload(index: number) {
  const insuredAmount = 25_000 + index * 3_750;
  const increaseRate = index % 4 === 0 ? 15 : index % 3 === 0 ? 10 : 5;
  const totalPremium = Math.round(insuredAmount * (0.004 + (index % 5) * 0.0005));
  const firstInstallment = Math.round(totalPremium * 0.5);

  return {
    type: "MARINE",
    applicantName: `${applicants[index % applicants.length]} ${index}`,
    beneficiaryName: beneficiaries[index % beneficiaries.length],
    insuredAmount,
    insuranceFrom: date(index),
    insuranceTo: date(index + 30 + (index % 20)),
    totalInsuredAfterIncrease: Math.round(insuredAmount * (1 + increaseRate / 100)),
    increaseRate,
    coverType: ["Cluse A", "Cluse B", "Cluse C"][index % 3],
    cargoDescription: cargo[index % cargo.length],
    routeFrom: origins[index % origins.length],
    routeTo: destinations[index % destinations.length],
    transportMode: modes[index % modes.length],
    packagingType: packages[index % packages.length],
    lcNumber: `LC-${new Date().getFullYear()}-${String(7000 + index)}`,
    carrierName: `${["Maersk", "MSC", "CMA CGM", "Turkish Cargo", "DHL"][index % 5]} ${100 + index}`,
    invoiceNumber: `INV-${new Date().getFullYear()}-${String(90000 + index)}`,
    currency: index % 5 === 0 ? "USD" : "IQD",
    extraRisks: index % 2 === 0 ? ["war"] : index % 3 === 0 ? ["strike", "riot"] : [],
    hasPreviousCompensation: index % 11 === 0,
    totalPremium,
    installments: [
      { label: "First installment", amount: firstInstallment, dueDate: date(index + 7) },
      { label: "Final installment", amount: totalPremium - firstInstallment, dueDate: date(index + 21) }
    ],
    notes: `Fake referral uploaded through site API ${index}`
  };
}

async function main() {
  const created: string[] = [];

  for (let offset = 0; offset < referralCount; offset += 1) {
    const index = startIndex + offset;
    let response: Response | null = null;
    let rawBody = "";
    let body: { referralNumber?: string } | null = null;

    for (let attempt = 1; attempt <= 4; attempt += 1) {
      response = await fetch(`${baseUrl}/api/referrals`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload(index))
      });
      rawBody = await response.text();
      body = rawBody ? JSON.parse(rawBody) : null;
      if (response.ok) break;
      if (!rawBody.includes("Can't reach database server") || attempt === 4) break;
      await new Promise((resolve) => setTimeout(resolve, attempt * 2500));
    }

    if (!response?.ok) {
      throw new Error(`Referral ${index} failed with ${response?.status ?? "no-response"}: ${JSON.stringify(body)}`);
    }

    if (!body?.referralNumber) {
      throw new Error(`Referral ${index} returned ${response.status} without referralNumber: ${rawBody.slice(0, 300)}`);
    }

    created.push(body.referralNumber);
    console.log(`${index}. ${body.referralNumber}`);
  }

  console.log(`Uploaded ${created.length} referrals through ${baseUrl}/api/referrals`);
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
