import fs from 'fs';
import path from 'path';

export interface AffiliateProfile {
  id: string;
  code: string;
  name: string;
  email: string;
  upiId: string;
  commissionRatePercent: number;
  totalReferrals: number;
  totalEarningsInInr: number;
  pendingPayoutInInr: number;
  createdAt: string;
  status: 'ACTIVE' | 'PENDING' | 'SUSPENDED';
}

const AFFILIATES_FILE = path.resolve(process.cwd(), 'data/affiliates.json');

export function getAffiliates(): AffiliateProfile[] {
  if (!fs.existsSync(AFFILIATES_FILE)) {
    return [];
  }
  try {
    return JSON.parse(fs.readFileSync(AFFILIATES_FILE, 'utf8'));
  } catch {
    return [];
  }
}

export function saveAffiliates(affiliates: AffiliateProfile[]): void {
  const dir = path.dirname(AFFILIATES_FILE);
  if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
  fs.writeFileSync(AFFILIATES_FILE, JSON.stringify(affiliates, null, 2));
}

export function getAffiliateByCode(code: string): AffiliateProfile | undefined {
  const clean = code.trim().toUpperCase();
  return getAffiliates().find(a => a.code.toUpperCase() === clean && a.status === 'ACTIVE');
}

export function registerAffiliate(name: string, email: string, upiId: string): AffiliateProfile {
  const affiliates = getAffiliates();
  const existing = affiliates.find(a => a.email.toLowerCase() === email.toLowerCase());
  if (existing) return existing;

  const code = (name.replace(/[^a-zA-Z0-9]/g, '').slice(0, 5) + Math.floor(100 + Math.random() * 900)).toUpperCase();
  const newAffiliate: AffiliateProfile = {
    id: `aff-${Date.now()}`,
    code,
    name,
    email,
    upiId,
    commissionRatePercent: 20,
    totalReferrals: 0,
    totalEarningsInInr: 0,
    pendingPayoutInInr: 0,
    createdAt: new Date().toISOString(),
    status: 'ACTIVE'
  };

  affiliates.push(newAffiliate);
  saveAffiliates(affiliates);
  return newAffiliate;
}
