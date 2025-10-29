/**
 * Unit tests for OVR calculator
 * 
 * Tests deterministic scoring with fixture data
 */

import { calculateOVR, generateRecommendations } from "../lib/ovr/calculator";
import type { ProfileData } from "../lib/ovr/calculator";

describe("OVR Calculator", () => {
  describe("calculateOVR", () => {
    it("should return baseline score for empty profile", () => {
      const profile: ProfileData = {
        education: [],
        experiences: [],
        skills: [],
        certifications: [],
        progressEvents: [],
      };

      const result = calculateOVR(profile);

      expect(result.overall).toBeGreaterThanOrEqual(0);
      expect(result.overall).toBeLessThanOrEqual(99);
      expect(result.confidence).toBeGreaterThanOrEqual(0);
      expect(result.confidence).toBeLessThanOrEqual(1);
      expect(result.breakdown).toHaveLength(6);
      expect(result.modelVersion).toBe("v1.0");
    });

    it("should calculate high score for elite profile", () => {
      const profile: ProfileData = {
        education: [
          {
            id: "1",
            userId: "test",
            school: "MIT",
            schoolTier: 1,
            degree: "Master of Science",
            major: "Computer Science",
            gpa: 3.9,
            startDate: new Date("2020-09-01"),
            endDate: new Date("2022-05-01"),
            createdAt: new Date(),
          },
        ],
        experiences: [
          {
            id: "1",
            userId: "test",
            title: "Senior Software Engineer",
            company: "Google",
            companyTier: 1,
            industry: "Technology",
            startDate: new Date("2022-06-01"),
            endDate: null,
            employmentType: "fulltime",
            impactScore: 0.9,
            bullets: [
              "Led team of 5 engineers to build ML platform serving 10M+ users",
              "Improved system performance by 45% through optimization",
              "Launched 3 major features increasing user engagement by 25%",
            ],
            geo: "California",
            createdAt: new Date(),
          },
        ],
        skills: [
          { id: "1", userId: "test", skill: "Python", level: 5, verified: true, lastUsed: new Date(), createdAt: new Date() },
          { id: "2", userId: "test", skill: "Machine Learning", level: 5, verified: true, lastUsed: new Date(), createdAt: new Date() },
          { id: "3", userId: "test", skill: "AWS", level: 4, verified: true, lastUsed: new Date(), createdAt: new Date() },
        ],
        certifications: [
          {
            id: "1",
            userId: "test",
            name: "AWS Certified Solutions Architect",
            authority: "Amazon",
            issuedOn: new Date("2023-01-01"),
            expiresOn: null,
            createdAt: new Date(),
          },
        ],
        progressEvents: [],
      };

      const result = calculateOVR(profile);

      expect(result.overall).toBeGreaterThanOrEqual(75);
      expect(result.confidence).toBeGreaterThan(0.6);
      expect(result.explanations.length).toBeGreaterThan(0);
    });

    it("should apply trend multiplier", () => {
      const profile: ProfileData = {
        education: [],
        experiences: [
          {
            id: "1",
            userId: "test",
            title: "Data Scientist",
            company: "TechCorp",
            companyTier: 2,
            industry: "Technology",
            startDate: new Date("2023-01-01"),
            endDate: null,
            employmentType: "fulltime",
            impactScore: 0.7,
            bullets: ["Built ML models", "Analyzed data"],
            geo: null,
            createdAt: new Date(),
          },
        ],
        skills: [],
        certifications: [],
        progressEvents: [],
        marketSignal: {
          demandIdx: 0.8, // High demand
          skillScarcity: {},
          compMomentum: 0.15, // Strong upward momentum
        },
      };

      const result = calculateOVR(profile);

      expect(result.trendMultiplier).toBeGreaterThan(1.0);
      expect(result.explanations.some((e) => e.includes("favorable"))).toBe(true);
    });

    it("should apply recency penalty for stale profiles", () => {
      const oneYearAgo = new Date();
      oneYearAgo.setFullYear(oneYearAgo.getFullYear() - 1);

      const profile: ProfileData = {
        education: [],
        experiences: [
          {
            id: "1",
            userId: "test",
            title: "Analyst",
            company: "OldCorp",
            companyTier: 3,
            industry: "Finance",
            startDate: new Date("2020-01-01"),
            endDate: oneYearAgo,
            employmentType: "fulltime",
            impactScore: 0.5,
            bullets: [],
            geo: null,
            createdAt: new Date(),
          },
        ],
        skills: [],
        certifications: [],
        progressEvents: [],
      };

      const result = calculateOVR(profile);

      expect(result.recencyAdjustment).toBeLessThan(1.0);
      expect(result.explanations.some((e) => e.includes("needs update") || e.includes("staleness"))).toBe(true);
    });

    it("should be deterministic (same input = same output)", () => {
      const profile: ProfileData = {
        education: [
          {
            id: "1",
            userId: "test",
            school: "Harvard",
            schoolTier: 1,
            degree: "Bachelor of Arts",
            major: "Economics",
            gpa: 3.8,
            startDate: new Date("2019-09-01"),
            endDate: new Date("2023-05-01"),
            createdAt: new Date(),
          },
        ],
        experiences: [],
        skills: [
          { id: "1", userId: "test", skill: "Excel", level: 4, verified: false, lastUsed: null, createdAt: new Date() },
        ],
        certifications: [],
        progressEvents: [],
      };

      const result1 = calculateOVR(profile);
      const result2 = calculateOVR(profile);

      expect(result1.overall).toBe(result2.overall);
      expect(result1.confidence).toBe(result2.confidence);
    });
  });

  describe("generateRecommendations", () => {
    it("should recommend adding missing data", () => {
      const profile: ProfileData = {
        education: [],
        experiences: [],
        skills: [],
        certifications: [],
        progressEvents: [],
      };

      const recommendations = generateRecommendations(profile, 50);

      expect(recommendations.length).toBeGreaterThan(0);
      expect(recommendations.some((r) => r.action.includes("education"))).toBe(true);
      expect(recommendations.some((r) => r.action.includes("experience"))).toBe(true);
    });

    it("should recommend quantifying achievements", () => {
      const profile: ProfileData = {
        education: [],
        experiences: [
          {
            id: "1",
            userId: "test",
            title: "Engineer",
            company: "TechCo",
            companyTier: 2,
            industry: "Technology",
            startDate: new Date("2023-01-01"),
            endDate: null,
            employmentType: "fulltime",
            impactScore: 0.3,
            bullets: ["Worked on projects", "Helped team"], // No quantification
            geo: null,
            createdAt: new Date(),
          },
        ],
        skills: [],
        certifications: [],
        progressEvents: [],
      };

      const recommendations = generateRecommendations(profile, 60);

      expect(recommendations.some((r) => r.action.includes("Quantify"))).toBe(true);
    });

    it("should sort recommendations by estimated delta", () => {
      const profile: ProfileData = {
        education: [],
        experiences: [],
        skills: [
          { id: "1", userId: "test", skill: "Python", level: 3, verified: false, lastUsed: null, createdAt: new Date() },
        ],
        certifications: [],
        progressEvents: [],
      };

      const recommendations = generateRecommendations(profile, 50);

      // Should be sorted descending by estimatedDelta
      for (let i = 0; i < recommendations.length - 1; i++) {
        expect(recommendations[i].estimatedDelta).toBeGreaterThanOrEqual(
          recommendations[i + 1].estimatedDelta
        );
      }
    });
  });
});

