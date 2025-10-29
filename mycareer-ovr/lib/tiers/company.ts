/**
 * Company tier reference
 * Tier 1 = Top (FAANG, top bulge bracket, elite PE/HF)
 * Tier 2 = Strong (well-known tech, reputable finance)
 * Tier 3 = Mid-market (regional leaders, established startups)
 * Tier 4 = Small/local (small companies, lesser-known brands)
 * Tier 5 = Unknown/unverified
 */

interface CompanyTierMap {
  [key: string]: number;
}

const COMPANY_TIERS: CompanyTierMap = {
  // Tech - Tier 1
  "google": 1,
  "alphabet": 1,
  "apple": 1,
  "microsoft": 1,
  "amazon": 1,
  "meta": 1,
  "facebook": 1,
  "netflix": 1,
  "tesla": 1,
  "nvidia": 1,
  "openai": 1,
  "stripe": 1,
  
  // Finance - Tier 1
  "goldman sachs": 1,
  "jpmorgan": 1,
  "jp morgan": 1,
  "morgan stanley": 1,
  "blackrock": 1,
  "citadel": 1,
  "bridgewater": 1,
  "renaissance technologies": 1,
  "two sigma": 1,
  "jane street": 1,
  "de shaw": 1,
  "aqr": 1,
  
  // Asset Management - Tier 1
  "vanguard": 1,
  "fidelity": 1,
  "wellington management": 1,
  "state street": 1,
  "pimco": 1,
  
  // Tech - Tier 2
  "salesforce": 2,
  "adobe": 2,
  "servicenow": 2,
  "workday": 2,
  "snowflake": 2,
  "databricks": 2,
  "airbnb": 2,
  "uber": 2,
  "lyft": 2,
  "doordash": 2,
  "shopify": 2,
  "square": 2,
  "block": 2,
  "coinbase": 2,
  
  // Finance - Tier 2
  "bank of america": 2,
  "citigroup": 2,
  "wells fargo": 2,
  "ubs": 2,
  "credit suisse": 2,
  "deutsche bank": 2,
  "barclays": 2,
  "millennium": 2,
  "point72": 2,
  "balyasny": 2,
  
  // Consulting - Tier 1
  "mckinsey": 1,
  "bain": 1,
  "boston consulting group": 1,
  "bcg": 1,
  
  // Consulting - Tier 2
  "deloitte": 2,
  "pwc": 2,
  "ey": 2,
  "kpmg": 2,
  "accenture": 2,
  
  // Pharma/Biotech - Tier 1
  "pfizer": 1,
  "moderna": 1,
  "johnson & johnson": 1,
  "j&j": 1,
  "roche": 1,
  "novartis": 1,
  
  // Pharma - Tier 2
  "merck": 2,
  "abbvie": 2,
  "bristol myers squibb": 2,
  "gilead": 2,
};

export function getCompanyTier(companyName: string): number {
  const normalized = companyName.toLowerCase().trim();
  
  // Check exact match
  if (COMPANY_TIERS[normalized]) {
    return COMPANY_TIERS[normalized];
  }
  
  // Check partial match
  for (const [name, tier] of Object.entries(COMPANY_TIERS)) {
    if (normalized.includes(name) || name.includes(normalized)) {
      return tier;
    }
  }
  
  // Default to Tier 3 (unknown but benefit of doubt)
  return 3;
}

export function getCompanyTierScore(tier: number | null | undefined): number {
  if (tier == null) return 0;
  
  // Tier 1 = 1.0, Tier 2 = 0.75, Tier 3 = 0.5, Tier 4 = 0.3, Tier 5 = 0.15
  const tierScores: { [key: number]: number } = {
    1: 1.0,
    2: 0.75,
    3: 0.5,
    4: 0.3,
    5: 0.15,
  };
  
  return tierScores[tier] ?? 0.5;
}

// Allow user-submitted overrides (to be stored in a separate table)
export function getUserOverrideTier(
  companyName: string,
  userOverrides: Record<string, number>
): number | null {
  const normalized = companyName.toLowerCase().trim();
  return userOverrides[normalized] ?? null;
}

