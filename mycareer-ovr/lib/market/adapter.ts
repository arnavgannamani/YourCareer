/**
 * Market signals adapter
 * 
 * Pluggable interface for market data providers.
 * Ships with a mock provider that returns stable indices.
 * 
 * TODO: Integrate real providers like:
 * - LinkedIn Talent Insights API
 * - Indeed Hiring Lab data
 * - Levels.fyi API
 * - Custom scraping pipelines
 */

export interface MarketSignalData {
  roleFamily: string;
  industry: string;
  geo?: string;
  date: Date;
  demandIdx: number; // 0-1, where 0.5 is neutral
  skillScarcity: Record<string, number>; // skill -> 0-1 scarcity
  compMomentum: number; // -1 to +1, where 0 is flat
}

export interface MarketDataProvider {
  fetchSignals(
    roleFamily: string,
    industry: string,
    geo?: string
  ): Promise<MarketSignalData>;
}

/**
 * Mock provider - returns stable, plausible market signals
 * Simulates current market conditions (2025)
 */
export class MockMarketProvider implements MarketDataProvider {
  async fetchSignals(
    roleFamily: string,
    industry: string,
    geo?: string
  ): Promise<MarketSignalData> {
    // Simulate API delay
    await new Promise((resolve) => setTimeout(resolve, 100));
    
    const roleFamilyLower = roleFamily.toLowerCase();
    const industryLower = industry.toLowerCase();
    
    // Base demand by role family
    let demandIdx = 0.5;
    if (roleFamilyLower.includes("software") || roleFamilyLower.includes("engineer")) {
      demandIdx = 0.72;
    } else if (roleFamilyLower.includes("data")) {
      demandIdx = 0.78;
    } else if (roleFamilyLower.includes("finance") || roleFamilyLower.includes("investment")) {
      demandIdx = 0.58;
    } else if (roleFamilyLower.includes("product")) {
      demandIdx = 0.65;
    }
    
    // Industry modifiers
    if (industryLower.includes("tech") || industryLower.includes("saas")) {
      demandIdx += 0.05;
    } else if (industryLower.includes("fintech")) {
      demandIdx += 0.08;
    } else if (industryLower.includes("crypto") || industryLower.includes("web3")) {
      demandIdx -= 0.15; // market correction
    }
    
    // Clamp to 0-1
    demandIdx = Math.max(0, Math.min(1, demandIdx));
    
    // Skill scarcity based on role
    const skillScarcity: Record<string, number> = {};
    
    if (roleFamilyLower.includes("software") || roleFamilyLower.includes("data")) {
      skillScarcity["Python"] = 0.72;
      skillScarcity["JavaScript"] = 0.65;
      skillScarcity["TypeScript"] = 0.68;
      skillScarcity["React"] = 0.64;
      skillScarcity["SQL"] = 0.61;
      skillScarcity["AWS"] = 0.70;
      skillScarcity["Machine Learning"] = 0.75;
      skillScarcity["LLMs"] = 0.82;
      skillScarcity["Rust"] = 0.79;
      skillScarcity["Go"] = 0.71;
    }
    
    if (roleFamilyLower.includes("finance") || roleFamilyLower.includes("investment")) {
      skillScarcity["Python"] = 0.68;
      skillScarcity["Excel"] = 0.45;
      skillScarcity["SQL"] = 0.58;
      skillScarcity["Tableau"] = 0.62;
      skillScarcity["R"] = 0.65;
      skillScarcity["Bloomberg"] = 0.55;
      skillScarcity["Financial Modeling"] = 0.60;
      skillScarcity["VBA"] = 0.52;
    }
    
    // Compensation momentum
    let compMomentum = 0;
    if (demandIdx > 0.7) {
      compMomentum = 0.15; // strong upward
    } else if (demandIdx > 0.6) {
      compMomentum = 0.05; // slight upward
    } else if (demandIdx < 0.4) {
      compMomentum = -0.10; // downward pressure
    }
    
    return {
      roleFamily,
      industry,
      geo,
      date: new Date(),
      demandIdx,
      skillScarcity,
      compMomentum,
    };
  }
}

/**
 * Market signal calculator - computes trend multipliers
 */
export function calculateTrendMultiplier(signal: MarketSignalData): number {
  // Base multiplier is 1.0
  // Add up to ±10% based on demand and momentum
  const demandComponent = 0.15 * (signal.demandIdx - 0.5);
  const momentumComponent = 0.10 * signal.compMomentum;
  
  const adjustment = demandComponent + momentumComponent;
  const clampedAdjustment = Math.max(-0.10, Math.min(0.10, adjustment));
  
  return 1.0 + clampedAdjustment;
}

export function getSkillScarcityWeight(
  skill: string,
  signal: MarketSignalData
): number {
  const scarcity = signal.skillScarcity[skill] ?? 0.5;
  // Base weight 0.5, scale up to 1.5 based on scarcity
  return 0.5 + 1.0 * scarcity;
}

// Singleton instance
let providerInstance: MarketDataProvider | null = null;

export function getMarketProvider(): MarketDataProvider {
  if (!providerInstance) {
    // TODO: Check env vars to determine which provider to use
    // For now, always use mock
    providerInstance = new MockMarketProvider();
  }
  return providerInstance;
}

