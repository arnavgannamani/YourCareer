/**
 * Unit tests for tier systems
 */

import { getCompanyTier, getCompanyTierScore } from "../lib/tiers/company";
import { getSchoolTier, getSchoolTierScore, getDegreeLevelScore, getGPAScore } from "../lib/tiers/school";

describe("Company Tiers", () => {
  it("should recognize Tier 1 companies", () => {
    expect(getCompanyTier("Google")).toBe(1);
    expect(getCompanyTier("Goldman Sachs")).toBe(1);
    expect(getCompanyTier("McKinsey")).toBe(1);
  });

  it("should recognize Tier 2 companies", () => {
    expect(getCompanyTier("Salesforce")).toBe(2);
    expect(getCompanyTier("Bank of America")).toBe(2);
    expect(getCompanyTier("Deloitte")).toBe(2);
  });

  it("should default to Tier 3 for unknown companies", () => {
    expect(getCompanyTier("Unknown Startup Inc")).toBe(3);
  });

  it("should be case insensitive", () => {
    expect(getCompanyTier("GOOGLE")).toBe(1);
    expect(getCompanyTier("google")).toBe(1);
    expect(getCompanyTier("GoOgLe")).toBe(1);
  });

  it("should calculate tier scores correctly", () => {
    expect(getCompanyTierScore(1)).toBe(1.0);
    expect(getCompanyTierScore(2)).toBe(0.75);
    expect(getCompanyTierScore(3)).toBe(0.5);
    expect(getCompanyTierScore(null)).toBe(0);
  });
});

describe("School Tiers", () => {
  it("should recognize Tier 1 schools", () => {
    expect(getSchoolTier("Harvard")).toBe(1);
    expect(getSchoolTier("Stanford")).toBe(1);
    expect(getSchoolTier("MIT")).toBe(1);
  });

  it("should recognize Tier 2 schools", () => {
    expect(getSchoolTier("University of Michigan")).toBe(2);
    expect(getSchoolTier("NYU")).toBe(2);
    expect(getSchoolTier("Northeastern University")).toBe(2);
  });

  it("should default to Tier 3 for unknown schools", () => {
    expect(getSchoolTier("Unknown State University")).toBe(3);
  });

  it("should calculate school tier scores correctly", () => {
    expect(getSchoolTierScore(1)).toBe(1.0);
    expect(getSchoolTierScore(2)).toBe(0.75);
    expect(getSchoolTierScore(3)).toBe(0.5);
  });
});

describe("Degree Level Scoring", () => {
  it("should score PhD highest", () => {
    expect(getDegreeLevelScore("PhD in Computer Science")).toBe(1.0);
    expect(getDegreeLevelScore("Doctorate")).toBe(1.0);
  });

  it("should score Master's degrees", () => {
    expect(getDegreeLevelScore("Master of Science")).toBe(0.85);
    expect(getDegreeLevelScore("MBA")).toBe(0.85);
  });

  it("should score Bachelor's degrees", () => {
    expect(getDegreeLevelScore("Bachelor of Arts")).toBe(0.7);
    expect(getDegreeLevelScore("BS in Engineering")).toBe(0.7);
  });

  it("should score Associate's degrees", () => {
    expect(getDegreeLevelScore("Associate Degree")).toBe(0.4);
  });
});

describe("GPA Scoring", () => {
  it("should score high GPAs at 1.0", () => {
    expect(getGPAScore(3.9)).toBe(1.0);
    expect(getGPAScore(4.0)).toBe(1.0);
  });

  it("should score GPAs on a curve", () => {
    expect(getGPAScore(3.5)).toBe(0.9);
    expect(getGPAScore(3.0)).toBe(0.7);
    expect(getGPAScore(2.5)).toBe(0.4);
  });

  it("should handle null GPA", () => {
    expect(getGPAScore(null)).toBe(0);
    expect(getGPAScore(undefined)).toBe(0);
  });

  it("should normalize GPAs on different scales", () => {
    // If GPA > 4.0, assumes different scale
    const normalized = getGPAScore(3.8, 5.0);
    expect(normalized).toBeGreaterThan(0.5);
  });
});

