/**
 * OVR Calculation Engine
 * 
 * Deterministic weighted model that computes a 0-99 career rating
 * with explainability and confidence scoring.
 */

import { 
  Education, 
  Experience, 
  SkillEndorsement, 
  Certification, 
  ProgressEvent,
  MarketSignal 
} from "@prisma/client";
import { getSchoolTierScore, getDegreeLevelScore, getGPAScore } from "../tiers/school";
import { getCompanyTierScore } from "../tiers/company";
import { calculateTrendMultiplier, getSkillScarcityWeight } from "../market/adapter";
import { clamp, roundToInt } from "../utils";

export interface OVRBreakdownItem {
  factor: string;
  rawScore: number;
  weight: number;
  contribution: number;
}

export interface OVRResult {
  overall: number; // 0-99
  confidence: number; // 0-1
  breakdown: OVRBreakdownItem[];
  explanations: string[];
  trendMultiplier: number;
  recencyAdjustment: number;
  modelVersion: string;
}

export interface ProfileData {
  education: Education[];
  experiences: Experience[];
  skills: SkillEndorsement[];
  certifications: Certification[];
  progressEvents: ProgressEvent[];
  marketSignal?: MarketSignalData;
}

export interface MarketSignalData {
  demandIdx: number;
  skillScarcity: Record<string, number>;
  compMomentum: number;
}

// Model weights (tunable)
const WEIGHTS = {
  education: 0.18,
  experience: 0.28,
  impact: 0.24,
  skills: 0.18,
  certifications: 0.06,
  microEvents: 0.06,
};

const BASE_SCORE = 20;
const MODEL_VERSION = "v1.0";

export function calculateOVR(profile: ProfileData): OVRResult {
  const breakdown: OVRBreakdownItem[] = [];
  const explanations: string[] = [];
  
  // 1. Education score
  const eduScore = calculateEducationScore(profile.education, explanations);
  breakdown.push({
    factor: "Education",
    rawScore: eduScore,
    weight: WEIGHTS.education,
    contribution: eduScore * WEIGHTS.education,
  });
  
  // 2. Experience score
  const expScore = calculateExperienceScore(profile.experiences, explanations);
  breakdown.push({
    factor: "Experience",
    rawScore: expScore,
    weight: WEIGHTS.experience,
    contribution: expScore * WEIGHTS.experience,
  });
  
  // 3. Impact score
  const impactScore = calculateImpactScore(profile.experiences, explanations);
  breakdown.push({
    factor: "Impact",
    rawScore: impactScore,
    weight: WEIGHTS.impact,
    contribution: impactScore * WEIGHTS.impact,
  });
  
  // 4. Skills score
  const skillsScore = calculateSkillsScore(
    profile.skills,
    profile.marketSignal,
    explanations
  );
  breakdown.push({
    factor: "Skills",
    rawScore: skillsScore,
    weight: WEIGHTS.skills,
    contribution: skillsScore * WEIGHTS.skills,
  });
  
  // 5. Certifications score
  const certsScore = calculateCertificationsScore(profile.certifications, explanations);
  breakdown.push({
    factor: "Certifications",
    rawScore: certsScore,
    weight: WEIGHTS.certifications,
    contribution: certsScore * WEIGHTS.certifications,
  });
  
  // 6. Micro events score (XP)
  const microScore = calculateMicroEventsScore(profile.progressEvents, explanations);
  breakdown.push({
    factor: "Recent Activity",
    rawScore: microScore,
    weight: WEIGHTS.microEvents,
    contribution: microScore * WEIGHTS.microEvents,
  });
  
  // Sum weighted contributions
  const weightedSum = breakdown.reduce((sum, item) => sum + item.contribution, 0);
  const rawScore = BASE_SCORE + weightedSum;
  
  // 7. Trend multiplier
  const trendMultiplier = profile.marketSignal
    ? calculateTrendMultiplier(profile.marketSignal)
    : 1.0;
  
  if (trendMultiplier > 1.02) {
    explanations.push(
      `Market trends are favorable (+${((trendMultiplier - 1) * 100).toFixed(1)}%)`
    );
  } else if (trendMultiplier < 0.98) {
    explanations.push(
      `Market trends are challenging (${((trendMultiplier - 1) * 100).toFixed(1)}%)`
    );
  }
  
  // 8. Recency adjustment
  const recencyAdjustment = calculateRecencyAdjustment(profile.experiences);
  if (recencyAdjustment < 0.98) {
    explanations.push(
      `Profile needs update (${Math.round((1 - recencyAdjustment) * 100)}% staleness penalty)`
    );
  }
  
  // Final score
  const finalScore = clamp(
    roundToInt(rawScore * trendMultiplier * recencyAdjustment),
    0,
    99
  );
  
  // Confidence calculation
  const confidence = calculateConfidence(profile);
  
  return {
    overall: finalScore,
    confidence,
    breakdown,
    explanations,
    trendMultiplier,
    recencyAdjustment,
    modelVersion: MODEL_VERSION,
  };
}

function calculateEducationScore(education: Education[], explanations: string[]): number {
  if (education.length === 0) {
    explanations.push("No education data provided");
    return 0;
  }
  
  // Take the best education entry
  let maxScore = 0;
  let bestSchool = "";
  
  for (const edu of education) {
    const schoolScore = getSchoolTierScore(edu.schoolTier) * 10; // 0-10
    const degreeScore = getDegreeLevelScore(edu.degree) * 8; // 0-8
    const gpaScore = getGPAScore(edu.gpa) * 4; // 0-4
    
    const totalScore = schoolScore + degreeScore + gpaScore;
    
    if (totalScore > maxScore) {
      maxScore = totalScore;
      bestSchool = edu.school;
    }
  }
  
  const topEdu = education.find((e) => e.school === bestSchool);
  if (topEdu) {
    if (topEdu.schoolTier === 1) {
      explanations.push(`Elite education from ${topEdu.school}`);
    } else if (topEdu.schoolTier === 2) {
      explanations.push(`Strong education from ${topEdu.school}`);
    }
    
    if (topEdu.gpa && topEdu.gpa >= 3.7) {
      explanations.push(`Excellent GPA: ${topEdu.gpa.toFixed(2)}`);
    }
  }
  
  return maxScore; // 0-22 range
}

function calculateExperienceScore(experiences: Experience[], explanations: string[]): number {
  if (experiences.length === 0) {
    explanations.push("No work experience yet");
    return 0;
  }
  
  let score = 0;
  
  // Company tier contribution
  const avgCompanyTier = experiences.reduce((sum, exp) => {
    return sum + getCompanyTierScore(exp.companyTier);
  }, 0) / experiences.length;
  score += avgCompanyTier * 12; // 0-12
  
  const hasTier1 = experiences.some((e) => e.companyTier === 1);
  if (hasTier1) {
    explanations.push(`Tier-1 company experience`);
  }
  
  // Tenure calculation
  const totalMonths = experiences.reduce((sum, exp) => {
    const start = new Date(exp.startDate);
    const end = exp.endDate ? new Date(exp.endDate) : new Date();
    const months = (end.getTime() - start.getTime()) / (1000 * 60 * 60 * 24 * 30);
    return sum + months;
  }, 0);
  
  const tenureScore = Math.min(totalMonths / 6, 10); // Cap at 10 for 5 years
  score += tenureScore;
  
  if (totalMonths >= 24) {
    explanations.push(`${Math.round(totalMonths / 12)} years of experience`);
  }
  
  // Role level (detect seniority from title)
  const roles = experiences.map((e) => e.title.toLowerCase());
  let roleLevel = 0;
  
  if (roles.some((r) => r.includes("senior") || r.includes("lead") || r.includes("principal"))) {
    roleLevel = 8;
    explanations.push("Senior-level role");
  } else if (roles.some((r) => r.includes("analyst") || r.includes("associate"))) {
    roleLevel = 5;
  } else if (roles.some((r) => r.includes("intern") || r.includes("co-op"))) {
    roleLevel = 3;
  } else {
    roleLevel = 4;
  }
  
  score += roleLevel;
  
  return Math.min(score, 30); // Cap at 30
}

function calculateImpactScore(experiences: Experience[], explanations: string[]): number {
  if (experiences.length === 0) return 0;
  
  let score = 0;
  
  // Quantified bullets (look for numbers in bullets)
  const allBullets = experiences.flatMap((e) => e.bullets);
  const quantifiedBullets = allBullets.filter((b) =>
    /\d+[%$KMB]|\d+\+|\d+x|increased|improved|reduced|saved/i.test(b)
  );
  
  const quantRatio = allBullets.length > 0 ? quantifiedBullets.length / allBullets.length : 0;
  score += quantRatio * 10; // 0-10
  
  if (quantifiedBullets.length >= 3) {
    explanations.push(`${quantifiedBullets.length} quantified achievements`);
  }
  
  // Impact score from experiences
  const avgImpact = experiences.reduce((sum, exp) => {
    return sum + (exp.impactScore ?? 0.5);
  }, 0) / experiences.length;
  
  score += avgImpact * 12; // 0-12
  
  // Leadership indicators
  const leadershipKeywords = ["led", "managed", "directed", "coordinated", "team"];
  const hasLeadership = allBullets.some((b) =>
    leadershipKeywords.some((kw) => b.toLowerCase().includes(kw))
  );
  
  if (hasLeadership) {
    score += 5;
    explanations.push("Leadership experience demonstrated");
  }
  
  return Math.min(score, 27); // Cap at 27
}

function calculateSkillsScore(
  skills: SkillEndorsement[],
  marketSignal: MarketSignalData | undefined,
  explanations: string[]
): number {
  if (skills.length === 0) {
    explanations.push("No skills listed");
    return 0;
  }
  
  let score = 0;
  const scarcityBoosts: string[] = [];
  
  for (const skill of skills) {
    let skillValue = 1.0;
    
    // Level multiplier
    if (skill.level) {
      skillValue *= skill.level / 5;
    }
    
    // Verified bonus
    if (skill.verified) {
      skillValue *= 1.3;
    }
    
    // Recent use bonus
    if (skill.lastUsed) {
      const daysSinceUse = (Date.now() - new Date(skill.lastUsed).getTime()) / (1000 * 60 * 60 * 24);
      if (daysSinceUse < 180) {
        skillValue *= 1.2;
      }
    }
    
    // Market scarcity multiplier
    if (marketSignal) {
      const scarcityWeight = getSkillScarcityWeight(skill.skill, marketSignal);
      if (scarcityWeight > 1.2) {
        skillValue *= scarcityWeight;
        scarcityBoosts.push(skill.skill);
      }
    }
    
    score += skillValue;
  }
  
  if (scarcityBoosts.length > 0) {
    explanations.push(`High-demand skills: ${scarcityBoosts.slice(0, 3).join(", ")}`);
  }
  
  if (skills.length >= 8) {
    explanations.push(`Diverse skill set (${skills.length} skills)`);
  }
  
  return Math.min(score, 20); // Cap at 20
}

function calculateCertificationsScore(
  certifications: Certification[],
  explanations: string[]
): number {
  if (certifications.length === 0) return 0;
  
  let score = 0;
  
  for (const cert of certifications) {
    // Check if expired
    if (cert.expiresOn && new Date(cert.expiresOn) < new Date()) {
      continue; // Skip expired certs
    }
    
    // Weight by authority
    const name = cert.name.toLowerCase();
    const authority = cert.authority?.toLowerCase() || "";
    
    if (
      name.includes("aws") ||
      name.includes("google cloud") ||
      name.includes("azure") ||
      authority.includes("amazon") ||
      authority.includes("google") ||
      authority.includes("microsoft")
    ) {
      score += 2.5;
    } else if (
      name.includes("cfa") ||
      name.includes("cpa") ||
      name.includes("pmp") ||
      name.includes("cissp")
    ) {
      score += 3.0;
    } else {
      score += 1.5;
    }
  }
  
  if (certifications.length > 0) {
    explanations.push(`${certifications.length} certification${certifications.length > 1 ? "s" : ""}`);
  }
  
  return Math.min(score, 8); // Cap at 8
}

function calculateMicroEventsScore(events: ProgressEvent[], explanations: string[]): number {
  const now = Date.now();
  const NINETY_DAYS = 90 * 24 * 60 * 60 * 1000;
  const HALF_LIFE = 21 * 24 * 60 * 60 * 1000; // 21 days
  
  // Filter events from last 90 days
  const recentEvents = events.filter((e) => {
    const eventTime = new Date(e.createdAt).getTime();
    return now - eventTime <= NINETY_DAYS;
  });
  
  if (recentEvents.length === 0) return 0;
  
  // Apply decay
  let totalXP = 0;
  for (const event of recentEvents) {
    const age = now - new Date(event.createdAt).getTime();
    const decay = Math.pow(0.5, age / HALF_LIFE);
    totalXP += event.value * decay;
  }
  
  const score = Math.min(totalXP, 8); // Cap at 8
  
  if (recentEvents.length > 0) {
    explanations.push(`${recentEvents.length} recent activities (last 90 days)`);
  }
  
  return score;
}

function calculateRecencyAdjustment(experiences: Experience[]): number {
  if (experiences.length === 0) return 1.0;
  
  // Find most recent activity
  let mostRecentDate = new Date(0);
  for (const exp of experiences) {
    const endDate = exp.endDate ? new Date(exp.endDate) : new Date();
    if (endDate > mostRecentDate) {
      mostRecentDate = endDate;
    }
  }
  
  const daysSinceUpdate = (Date.now() - mostRecentDate.getTime()) / (1000 * 60 * 60 * 24);
  
  // No penalty for < 6 months
  if (daysSinceUpdate < 180) return 1.0;
  
  // Linear decay: -2% per month after 6 months, max -10%
  const monthsStale = (daysSinceUpdate - 180) / 30;
  const penalty = Math.min(monthsStale * 0.02, 0.10);
  
  return 1.0 - penalty;
}

function calculateConfidence(profile: ProfileData): number {
  let confidence = 0.5; // Base confidence
  
  // Data completeness
  const hasEducation = profile.education.length > 0;
  const hasExperience = profile.experiences.length > 0;
  const hasSkills = profile.skills.length > 0;
  
  const completeness = [hasEducation, hasExperience, hasSkills].filter(Boolean).length / 3;
  confidence += 0.1 * completeness;
  
  // Verified artifacts
  const verifiedSkills = profile.skills.filter((s) => s.verified).length;
  const verificationRatio = profile.skills.length > 0 ? verifiedSkills / profile.skills.length : 0;
  confidence += 0.2 * verificationRatio;
  
  // Proof URLs in events
  const eventsWithProof = profile.progressEvents.filter((e) => e.proofUrl).length;
  const proofRatio = profile.progressEvents.length > 0 
    ? eventsWithProof / profile.progressEvents.length 
    : 0;
  confidence += 0.1 * proofRatio;
  
  // Date consistency (check for gaps or overlaps)
  const hasDateIssues = checkDateConsistency(profile.experiences);
  if (hasDateIssues) {
    confidence -= 0.1;
  }
  
  return clamp(confidence, 0, 1);
}

function checkDateConsistency(experiences: Experience[]): boolean {
  // Simple check: look for overlapping full-time roles
  const fullTimeRoles = experiences.filter((e) => e.employmentType === "fulltime");
  
  for (let i = 0; i < fullTimeRoles.length; i++) {
    for (let j = i + 1; j < fullTimeRoles.length; j++) {
      const role1 = fullTimeRoles[i];
      const role2 = fullTimeRoles[j];
      
      const start1 = new Date(role1.startDate);
      const end1 = role1.endDate ? new Date(role1.endDate) : new Date();
      const start2 = new Date(role2.startDate);
      const end2 = role2.endDate ? new Date(role2.endDate) : new Date();
      
      // Check for overlap
      if (start1 <= end2 && start2 <= end1) {
        return true; // Inconsistency found
      }
    }
  }
  
  return false;
}

/**
 * Generate recommendations for improving OVR
 */
export function generateRecommendations(profile: ProfileData, currentOVR: number): Array<{
  action: string;
  estimatedDelta: number;
  category: string;
}> {
  const recommendations: Array<{ action: string; estimatedDelta: number; category: string }> = [];
  
  // Education recommendations
  if (profile.education.length === 0) {
    recommendations.push({
      action: "Add education history",
      estimatedDelta: 8,
      category: "Education",
    });
  } else {
    const hasGPA = profile.education.some((e) => e.gpa != null);
    if (!hasGPA) {
      recommendations.push({
        action: "Add GPA to education",
        estimatedDelta: 2,
        category: "Education",
      });
    }
  }
  
  // Experience recommendations
  if (profile.experiences.length === 0) {
    recommendations.push({
      action: "Add internship or work experience",
      estimatedDelta: 15,
      category: "Experience",
    });
  } else {
    const allBullets = profile.experiences.flatMap((e) => e.bullets);
    const quantifiedBullets = allBullets.filter((b) =>
      /\d+[%$KMB]|\d+\+|\d+x|increased|improved|reduced/i.test(b)
    );
    
    if (quantifiedBullets.length < 3) {
      recommendations.push({
        action: "Quantify achievements with metrics (%, $, impact)",
        estimatedDelta: 5,
        category: "Impact",
      });
    }
  }
  
  // Skills recommendations
  if (profile.skills.length < 5) {
    recommendations.push({
      action: "Add more relevant skills (target 8-10)",
      estimatedDelta: 3,
      category: "Skills",
    });
  }
  
  const unverifiedSkills = profile.skills.filter((s) => !s.verified).length;
  if (unverifiedSkills >= 3) {
    recommendations.push({
      action: "Verify skills with portfolio/projects",
      estimatedDelta: 4,
      category: "Skills",
    });
  }
  
  // Certification recommendations
  if (profile.certifications.length === 0 && currentOVR < 80) {
    recommendations.push({
      action: "Earn a professional certification",
      estimatedDelta: 3,
      category: "Certifications",
    });
  }
  
  // Activity recommendations
  const recentEvents = profile.progressEvents.filter((e) => {
    const age = Date.now() - new Date(e.createdAt).getTime();
    return age < 30 * 24 * 60 * 60 * 1000; // Last 30 days
  });
  
  if (recentEvents.length === 0) {
    recommendations.push({
      action: "Log recent activities (projects, blogs, contributions)",
      estimatedDelta: 2,
      category: "Activity",
    });
  }
  
  // Sort by estimated delta
  return recommendations.sort((a, b) => b.estimatedDelta - a.estimatedDelta).slice(0, 5);
}

