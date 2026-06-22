// Company profile + owner contact.
// This data is not persisted in localStorage.

export interface CompanyProfile {
  name: string;
  tagline: string;
  gstin: string;
  address: string;
  phone: string;          // primary contact / owner WhatsApp
  email: string;          // primary email
  bank: string;
  upi: string;
  financialYear: string;
}

const KEY = "honey-erp-company";

function defaultFinancialYear(): string {
  const d = new Date();
  const y = d.getMonth() >= 3 ? d.getFullYear() : d.getFullYear() - 1;
  const next = (y + 1) % 100;
  return `${String(y % 100).padStart(2, "0")}-${String(next).padStart(2, "0")}`;
}

export const DEFAULT_COMPANY: CompanyProfile = {
  name: "HONEY ENTERPRISES",
  tagline: "Stone Crusher • Aggregate Trading • Transport",
  gstin: "06ABCDE1234F1Z5",
  address: "Yard No. 12, NH-48, Gurugram, Haryana",
  phone: "8059075260",
  email: "sumit2and2singh@gmail.com",
  bank: "HDFC Bank • A/c 50200012345678 • IFSC HDFC0001234",
  upi: "honey@upi",
  financialYear: defaultFinancialYear(),
};

export function loadCompany(): CompanyProfile {
  return DEFAULT_COMPANY;
}

export function saveCompany(_p: CompanyProfile): void {
  // Local storage persistence removed. Company profile is not saved across reloads.
}
