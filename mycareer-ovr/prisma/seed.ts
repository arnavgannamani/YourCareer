import { PrismaClient } from "@prisma/client";
import * as fs from "fs";
import * as path from "path";
import { calculateOVR } from "../lib/ovr/calculator";
import { getMarketProvider } from "../lib/market/adapter";

const prisma = new PrismaClient();

interface FixtureData {
  name: string;
  email: string;
  education: any[];
  experiences: any[];
  skills: any[];
  certifications: any[];
  progressEvents: any[];
  settings: any;
}

async function loadFixture(filename: string): Promise<FixtureData> {
  const filePath = path.join(process.cwd(), "fixtures", filename);
  const data = fs.readFileSync(filePath, "utf-8");
  return JSON.parse(data);
}

async function seedUser(fixture: FixtureData) {
  console.log(`Seeding user: ${fixture.name}`);

  // Create user
  const user = await prisma.user.create({
    data: {
      email: fixture.email,
      name: fixture.name,
      emailVerified: new Date(),
    },
  });

  // Create education
  for (const edu of fixture.education) {
    await prisma.education.create({
      data: {
        userId: user.id,
        school: edu.school,
        schoolTier: edu.schoolTier,
        degree: edu.degree,
        major: edu.major,
        gpa: edu.gpa,
        startDate: edu.startDate ? new Date(edu.startDate) : undefined,
        endDate: edu.endDate ? new Date(edu.endDate) : undefined,
      },
    });
  }

  // Create experiences
  for (const exp of fixture.experiences) {
    await prisma.experience.create({
      data: {
        userId: user.id,
        title: exp.title,
        company: exp.company,
        companyTier: exp.companyTier,
        industry: exp.industry,
        employmentType: exp.employmentType,
        startDate: new Date(exp.startDate),
        endDate: exp.endDate ? new Date(exp.endDate) : undefined,
        bullets: exp.bullets || [],
        impactScore: exp.impactScore,
        geo: exp.geo,
      },
    });
  }

  // Create skills
  for (const skill of fixture.skills) {
    await prisma.skillEndorsement.create({
      data: {
        userId: user.id,
        skill: skill.skill,
        level: skill.level,
        verified: skill.verified,
        lastUsed: skill.lastUsed ? new Date(skill.lastUsed) : undefined,
      },
    });
  }

  // Create certifications
  for (const cert of fixture.certifications) {
    await prisma.certification.create({
      data: {
        userId: user.id,
        name: cert.name,
        authority: cert.authority,
        issuedOn: cert.issuedOn ? new Date(cert.issuedOn) : undefined,
        expiresOn: cert.expiresOn ? new Date(cert.expiresOn) : undefined,
      },
    });
  }

  // Create progress events
  for (const event of fixture.progressEvents) {
    await prisma.progressEvent.create({
      data: {
        userId: user.id,
        type: event.type,
        metadata: event.metadata,
        proofUrl: event.proofUrl,
        value: event.value,
        createdAt: event.createdAt ? new Date(event.createdAt) : new Date(),
      },
    });
  }

  // Create settings
  await prisma.userSettings.create({
    data: {
      userId: user.id,
      allowLLM: false,
      geo: fixture.settings.geo,
      targetRole: fixture.settings.targetRole,
      targetIndustry: fixture.settings.targetIndustry,
    },
  });

  // Calculate and save initial OVR
  const [education, experiences, skills, certifications, progressEvents] =
    await Promise.all([
      prisma.education.findMany({ where: { userId: user.id } }),
      prisma.experience.findMany({ where: { userId: user.id } }),
      prisma.skillEndorsement.findMany({ where: { userId: user.id } }),
      prisma.certification.findMany({ where: { userId: user.id } }),
      prisma.progressEvent.findMany({ where: { userId: user.id } }),
    ]);

  // Fetch market signal
  let marketSignal;
  if (fixture.settings.targetRole && fixture.settings.targetIndustry) {
    const provider = getMarketProvider();
    const signal = await provider.fetchSignals(
      fixture.settings.targetRole,
      fixture.settings.targetIndustry,
      fixture.settings.geo
    );
    marketSignal = {
      demandIdx: signal.demandIdx,
      skillScarcity: signal.skillScarcity,
      compMomentum: signal.compMomentum,
    };
  }

  const ovrResult = calculateOVR({
    education,
    experiences,
    skills,
    certifications,
    progressEvents,
    marketSignal,
  });

  await prisma.ratingSnapshot.create({
    data: {
      userId: user.id,
      overall: ovrResult.overall,
      confidence: ovrResult.confidence,
      breakdown: ovrResult.breakdown as any,
      explanations: ovrResult.explanations,
      modelVersion: ovrResult.modelVersion,
    },
  });

  console.log(`✓ ${fixture.name} - OVR: ${ovrResult.overall}`);
}

async function seedMarketSignals() {
  console.log("Seeding market signals...");

  const signals = [
    {
      roleFamily: "Investment Operations",
      industry: "Asset Management",
      date: new Date(),
      demandIdx: 0.62,
      skillScarcity: {
        Python: 0.68,
        SQL: 0.58,
        Tableau: 0.62,
        Excel: 0.45,
      },
      compMomentum: 0.05,
    },
    {
      roleFamily: "Investment Banking",
      industry: "Finance",
      date: new Date(),
      demandIdx: 0.58,
      skillScarcity: {
        "Financial Modeling": 0.60,
        Excel: 0.45,
        Python: 0.65,
      },
      compMomentum: 0.02,
    },
    {
      roleFamily: "Software Engineering",
      industry: "Technology",
      date: new Date(),
      demandIdx: 0.72,
      skillScarcity: {
        Python: 0.72,
        JavaScript: 0.65,
        TypeScript: 0.68,
        React: 0.64,
        AWS: 0.70,
      },
      compMomentum: 0.15,
    },
    {
      roleFamily: "Data Science",
      industry: "Technology",
      date: new Date(),
      demandIdx: 0.78,
      skillScarcity: {
        Python: 0.75,
        "Machine Learning": 0.80,
        SQL: 0.68,
        R: 0.65,
      },
      compMomentum: 0.18,
    },
  ];

  for (const signal of signals) {
    await prisma.marketSignal.create({
      data: signal as any,
    });
  }

  console.log("✓ Market signals seeded");
}

async function main() {
  console.log("Starting seed...");

  // Clear existing data
  await prisma.ratingSnapshot.deleteMany();
  await prisma.progressEvent.deleteMany();
  await prisma.certification.deleteMany();
  await prisma.skillEndorsement.deleteMany();
  await prisma.experience.deleteMany();
  await prisma.education.deleteMany();
  await prisma.userSettings.deleteMany();
  await prisma.resumeVersion.deleteMany();
  await prisma.marketSignal.deleteMany();
  await prisma.session.deleteMany();
  await prisma.account.deleteMany();
  await prisma.user.deleteMany();

  console.log("✓ Cleared existing data");

  // Seed fixtures
  await seedUser(await loadFixture("hs_grad.json"));
  await seedUser(await loadFixture("tier1_intern.json"));
  await seedUser(await loadFixture("analyst_promo.json"));
  await seedUser(await loadFixture("dormant_user.json"));

  // Seed market signals
  await seedMarketSignals();

  console.log("\n✅ Seed completed successfully!");
  console.log("\nDemo users:");
  console.log("1. alex.johnson@example.com - High school grad (baseline)");
  console.log("2. sam.chen@example.com - Tier-1 finance intern");
  console.log("3. jordan.smith@example.com - Investment ops associate (promoted)");
  console.log("4. casey.williams@example.com - Dormant user (stale profile)");
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });

