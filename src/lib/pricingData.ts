// ─── ASEGURAR LTDA — Revenue Strategy ───
// Head of Revenue: 4-tier pricing (SMB → Enterprise)
// Variables: cost per asset, add-ons, satellite msgs, 24/7 support, partner commissions

export interface PricingTier {
  key: string;
  assets: string;
  basePrice: Record<string, { currency: string; amount: string; unit: string }>;
  popular?: boolean;
  features: string[];
  limits: {
    usersIncluded: number;
    eventsPerDay: number;
    retentionDays: number;
    apiCallsPerMonth: number;
    reportsPerMonth: number;
  };
}

export interface AddOn {
  key: string;
  price: Record<string, { currency: string; amount: string; unit: string }>;
}

export interface FairUseRule {
  key: string;
}

export interface CountryConfig {
  code: string;
  name: string;
  flag: string;
  currency: string;
}

// ─── COUNTRIES ───
export const countries: CountryConfig[] = [
  { code: "CO", name: "Colombia", flag: "🇨🇴", currency: "COP" },
  { code: "EC", name: "Ecuador", flag: "🇪🇨", currency: "USD" },
  { code: "PE", name: "Perú", flag: "🇵🇪", currency: "USD" },
  { code: "MX", name: "México", flag: "🇲🇽", currency: "MXN" },
  { code: "CL", name: "Chile", flag: "🇨🇱", currency: "USD" },
];

// ─── 4 TIERS ───
export const tiers: PricingTier[] = [
  {
    key: "smb",
    assets: "1–25",
    basePrice: {
      CO: { currency: "COP", amount: "45.000", unit: "/activo/mes" },
      EC: { currency: "USD", amount: "12", unit: "/asset/mo" },
      PE: { currency: "USD", amount: "12", unit: "/asset/mo" },
      MX: { currency: "MXN", amount: "210", unit: "/activo/mes" },
      CL: { currency: "USD", amount: "13", unit: "/asset/mo" },
    },
    features: ["feat1", "feat2", "feat3", "feat4", "feat5"],
    limits: {
      usersIncluded: 3,
      eventsPerDay: 1440,
      retentionDays: 90,
      apiCallsPerMonth: 10000,
      reportsPerMonth: 20,
    },
  },
  {
    key: "professional",
    assets: "26–100",
    popular: true,
    basePrice: {
      CO: { currency: "COP", amount: "38.000", unit: "/activo/mes" },
      EC: { currency: "USD", amount: "10", unit: "/asset/mo" },
      PE: { currency: "USD", amount: "10", unit: "/asset/mo" },
      MX: { currency: "MXN", amount: "175", unit: "/activo/mes" },
      CL: { currency: "USD", amount: "11", unit: "/asset/mo" },
    },
    features: ["feat1", "feat2", "feat3", "feat4", "feat5", "feat6", "feat7", "feat8"],
    limits: {
      usersIncluded: 10,
      eventsPerDay: 2880,
      retentionDays: 180,
      apiCallsPerMonth: 50000,
      reportsPerMonth: 100,
    },
  },
  {
    key: "business",
    assets: "101–500",
    basePrice: {
      CO: { currency: "COP", amount: "30.000", unit: "/activo/mes" },
      EC: { currency: "USD", amount: "8", unit: "/asset/mo" },
      PE: { currency: "USD", amount: "8", unit: "/asset/mo" },
      MX: { currency: "MXN", amount: "140", unit: "/activo/mes" },
      CL: { currency: "USD", amount: "9", unit: "/asset/mo" },
    },
    features: ["feat1", "feat2", "feat3", "feat4", "feat5", "feat6", "feat7", "feat8", "feat9", "feat10"],
    limits: {
      usersIncluded: 30,
      eventsPerDay: 5760,
      retentionDays: 365,
      apiCallsPerMonth: 200000,
      reportsPerMonth: -1, // unlimited
    },
  },
  {
    key: "enterprise",
    assets: "500+",
    basePrice: {
      CO: { currency: "COP", amount: "Contactar", unit: "" },
      EC: { currency: "USD", amount: "Contact", unit: "" },
      PE: { currency: "USD", amount: "Contact", unit: "" },
      MX: { currency: "MXN", amount: "Contactar", unit: "" },
      CL: { currency: "USD", amount: "Contact", unit: "" },
    },
    features: ["feat1", "feat2", "feat3", "feat4", "feat5", "feat6", "feat7", "feat8", "feat9", "feat10", "feat11", "feat12"],
    limits: {
      usersIncluded: -1,
      eventsPerDay: -1,
      retentionDays: -1,
      apiCallsPerMonth: -1,
      reportsPerMonth: -1,
    },
  },
];

// ─── ADD-ONS ───
export const addOns: AddOn[] = [
  {
    key: "video",
    price: {
      CO: { currency: "COP", amount: "18.000", unit: "/cámara/mes" },
      EC: { currency: "USD", amount: "5", unit: "/cam/mo" },
      PE: { currency: "USD", amount: "5", unit: "/cam/mo" },
      MX: { currency: "MXN", amount: "85", unit: "/cámara/mes" },
      CL: { currency: "USD", amount: "5", unit: "/cam/mo" },
    },
  },
  {
    key: "evidence",
    price: {
      CO: { currency: "COP", amount: "12.000", unit: "/activo/mes" },
      EC: { currency: "USD", amount: "3", unit: "/asset/mo" },
      PE: { currency: "USD", amount: "3", unit: "/asset/mo" },
      MX: { currency: "MXN", amount: "55", unit: "/activo/mes" },
      CL: { currency: "USD", amount: "3", unit: "/asset/mo" },
    },
  },
  {
    key: "satellite",
    price: {
      CO: { currency: "COP", amount: "800", unit: "/msg" },
      EC: { currency: "USD", amount: "0.20", unit: "/msg" },
      PE: { currency: "USD", amount: "0.20", unit: "/msg" },
      MX: { currency: "MXN", amount: "3.50", unit: "/msg" },
      CL: { currency: "USD", amount: "0.22", unit: "/msg" },
    },
  },
  {
    key: "support247",
    price: {
      CO: { currency: "COP", amount: "350.000", unit: "/mes" },
      EC: { currency: "USD", amount: "90", unit: "/mo" },
      PE: { currency: "USD", amount: "90", unit: "/mo" },
      MX: { currency: "MXN", amount: "1.600", unit: "/mes" },
      CL: { currency: "USD", amount: "95", unit: "/mo" },
    },
  },
  {
    key: "coldchain",
    price: {
      CO: { currency: "COP", amount: "15.000", unit: "/sensor/mes" },
      EC: { currency: "USD", amount: "4", unit: "/sensor/mo" },
      PE: { currency: "USD", amount: "4", unit: "/sensor/mo" },
      MX: { currency: "MXN", amount: "70", unit: "/sensor/mes" },
      CL: { currency: "USD", amount: "4", unit: "/sensor/mo" },
    },
  },
  {
    key: "partner",
    price: {
      CO: { currency: "COP", amount: "Consultar", unit: "" },
      EC: { currency: "USD", amount: "Inquire", unit: "" },
      PE: { currency: "USD", amount: "Inquire", unit: "" },
      MX: { currency: "MXN", amount: "Consultar", unit: "" },
      CL: { currency: "USD", amount: "Inquire", unit: "" },
    },
  },
];

// ─── FAIR USE RULE KEYS (translations in locale files) ───
export const fairUseRules: string[] = [
  "rule1", "rule2", "rule3", "rule4", "rule5", "rule6",
];

// ─── PARTNER COMMISSION TIERS ───
export const partnerCommissions = [
  { key: "silver", minAssets: 50, commission: "10%" },
  { key: "gold", minAssets: 200, commission: "15%" },
  { key: "platinum", minAssets: 500, commission: "20%" },
];
