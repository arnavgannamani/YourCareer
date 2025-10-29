/**
 * School tier reference
 * Tier 1 = Elite (Ivy+, MIT, Stanford, top targets)
 * Tier 2 = Strong (top public, semi-targets)
 * Tier 3 = Mid-tier (regional state schools, solid privates)
 * Tier 4 = Lower-tier (small regional, for-profit accredited)
 * Tier 5 = Unknown/unaccredited
 */

interface SchoolTierMap {
  [key: string]: number;
}

const SCHOOL_TIERS: SchoolTierMap = {
  // Tier 1 - Elite
  "harvard": 1,
  "stanford": 1,
  "mit": 1,
  "massachusetts institute of technology": 1,
  "princeton": 1,
  "yale": 1,
  "columbia": 1,
  "university of pennsylvania": 1,
  "upenn": 1,
  "penn": 1,
  "wharton": 1,
  "dartmouth": 1,
  "brown": 1,
  "cornell": 1,
  "duke": 1,
  "northwestern": 1,
  "caltech": 1,
  "university of chicago": 1,
  "uchicago": 1,
  "johns hopkins": 1,
  "carnegie mellon": 1,
  "cmu": 1,
  
  // Tier 2 - Strong
  "university of california berkeley": 2,
  "uc berkeley": 2,
  "berkeley": 2,
  "university of michigan": 2,
  "umich": 2,
  "university of virginia": 2,
  "uva": 2,
  "georgetown": 2,
  "vanderbilt": 2,
  "rice": 2,
  "notre dame": 2,
  "university of north carolina": 2,
  "unc": 2,
  "ucla": 2,
  "university of california los angeles": 2,
  "usc": 2,
  "university of southern california": 2,
  "nyu": 2,
  "new york university": 2,
  "boston college": 2,
  "georgia tech": 2,
  "georgia institute of technology": 2,
  "university of texas austin": 2,
  "ut austin": 2,
  "university of washington": 2,
  "uw": 2,
  "northeastern": 2,
  "northeastern university": 2,
  
  // Tier 3 - Mid-tier
  "boston university": 3,
  "bu": 3,
  "purdue": 3,
  "penn state": 3,
  "ohio state": 3,
  "university of florida": 3,
  "uf": 3,
  "university of wisconsin": 3,
  "uw madison": 3,
  "university of illinois": 3,
  "uiuc": 3,
  "rutgers": 3,
  "university of maryland": 3,
  "umd": 3,
  "indiana university": 3,
  "syracuse": 3,
  "fordham": 3,
  "villanova": 3,
  "pepperdine": 3,
  "santa clara": 3,
  "lehigh": 3,
};

export function getSchoolTier(schoolName: string): number {
  const normalized = schoolName.toLowerCase().trim();
  
  // Check exact match
  if (SCHOOL_TIERS[normalized]) {
    return SCHOOL_TIERS[normalized];
  }
  
  // Check partial match
  for (const [name, tier] of Object.entries(SCHOOL_TIERS)) {
    if (normalized.includes(name) || name.includes(normalized)) {
      return tier;
    }
  }
  
  // Default to Tier 3 (unknown but benefit of doubt)
  return 3;
}

export function getSchoolTierScore(tier: number | null | undefined): number {
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

export function getDegreeLevelScore(degree: string): number {
  const normalized = degree.toLowerCase();
  
  if (normalized.includes("phd") || normalized.includes("doctorate")) {
    return 1.0;
  }
  if (normalized.includes("master") || normalized.includes("mba") || normalized.includes("ms") || normalized.includes("ma")) {
    return 0.85;
  }
  if (normalized.includes("bachelor") || normalized.includes("bs") || normalized.includes("ba")) {
    return 0.7;
  }
  if (normalized.includes("associate") || normalized.includes("aa") || normalized.includes("as")) {
    return 0.4;
  }
  
  return 0.5; // default
}

export function getGPAScore(gpa: number | null | undefined, scale: number = 4.0): number {
  if (gpa == null) return 0;
  
  // Normalize to 4.0 scale if needed
  const normalized = gpa > 4.0 ? (gpa / scale) * 4.0 : gpa;
  
  // Curve: 3.5+ = 1.0, 3.0 = 0.7, 2.5 = 0.4, 2.0 = 0.2
  if (normalized >= 3.7) return 1.0;
  if (normalized >= 3.5) return 0.9;
  if (normalized >= 3.3) return 0.8;
  if (normalized >= 3.0) return 0.7;
  if (normalized >= 2.7) return 0.55;
  if (normalized >= 2.5) return 0.4;
  if (normalized >= 2.0) return 0.25;
  
  return 0.1;
}

