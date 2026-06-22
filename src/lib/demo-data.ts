export const demoCustomers = [
  {
    id: "demo-customer-1",
    arabicName: "محمد علي",
    englishName: "Mohammed Ali",
    passportNumber: "A1234567",
    nationality: "Iraqi",
    dateOfBirth: new Date("1990-04-12"),
    gender: "MALE",
    mobile: "07700000000",
    email: "customer@example.com",
    address: "Baghdad",
    passportImage: null,
    createdAt: new Date(),
    updatedAt: new Date()
  },
  {
    id: "demo-customer-2",
    arabicName: "سارة أحمد",
    englishName: "Sarah Ahmed",
    passportNumber: "B7654321",
    nationality: "Iraqi",
    dateOfBirth: new Date("1988-11-03"),
    gender: "FEMALE",
    mobile: "07800000000",
    email: "sarah@example.com",
    address: "Erbil",
    passportImage: null,
    createdAt: new Date(),
    updatedAt: new Date()
  }
] as const;

export const demoCountries = [
  {
    id: "demo-country-1",
    nameAr: "تركيا",
    nameEn: "Turkey",
    isoCode: "TR",
    category: "ALLOWED",
    additionalRiskFee: 0,
    status: "ACTIVE",
    createdAt: new Date(),
    updatedAt: new Date()
  },
  {
    id: "demo-country-2",
    nameAr: "الإمارات",
    nameEn: "United Arab Emirates",
    isoCode: "AE",
    category: "ALLOWED",
    additionalRiskFee: 0,
    status: "ACTIVE",
    createdAt: new Date(),
    updatedAt: new Date()
  }
] as const;

export const demoPlans = [
  {
    id: "demo-plan-1",
    name: "الخطة الأساسية",
    price: 25,
    medicalCoverage: 10000,
    baggageCoverage: 500,
    tripDelayCoverage: 250,
    medicalEvacuation: 5000,
    repatriation: 5000,
    personalLiability: 10000,
    active: true,
    createdAt: new Date(),
    updatedAt: new Date()
  },
  {
    id: "demo-plan-2",
    name: "الخطة الذهبية",
    price: 55,
    medicalCoverage: 50000,
    baggageCoverage: 1500,
    tripDelayCoverage: 750,
    medicalEvacuation: 25000,
    repatriation: 25000,
    personalLiability: 50000,
    active: true,
    createdAt: new Date(),
    updatedAt: new Date()
  }
] as const;

export const demoPolicies = [
  {
    id: "demo-policy-1",
    policyNumber: "TRI-DEMO-0001",
    customer: demoCustomers[0],
    destinationCountry: demoCountries[0],
    travelPlan: demoPlans[0],
    departureDate: new Date(),
    returnDate: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
    premium: 35,
    coverageAmount: 25000,
    policyType: "INDIVIDUAL",
    status: "ACTIVE",
    createdAt: new Date()
  }
] as const;

export const demoClaims = [
  {
    id: "demo-claim-1",
    claimNumber: "CLM-DEMO-0001",
    policy: demoPolicies[0],
    customer: demoCustomers[0],
    claimType: "MEDICAL",
    description: "مطالبة تجريبية للفحص",
    attachments: [],
    status: "NEW",
    createdAt: new Date(),
    updatedAt: new Date()
  }
] as const;

export const demoNotifications = [
  {
    id: "demo-notification-1",
    title: "وضع تجريبي",
    message: "الدخول المباشر مفعل، ويتم عرض بيانات تجريبية مؤقتة.",
    status: "PENDING",
    dueAt: null,
    createdAt: new Date()
  }
] as const;
