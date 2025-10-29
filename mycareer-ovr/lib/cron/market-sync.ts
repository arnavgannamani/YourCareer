/**
 * Daily market signal sync job
 * 
 * Fetches updated market signals for all role/industry combinations
 * and stores them in the database.
 * 
 * Run this as a cron job (e.g., with node-cron or external scheduler)
 */

import { prisma } from "../db";
import { getMarketProvider } from "../market/adapter";

export async function syncMarketSignals() {
  console.log("Starting market signal sync...");
  
  try {
    // Get all unique role/industry combinations from user settings
    const settings = await prisma.userSettings.findMany({
      where: {
        targetRole: { not: null },
        targetIndustry: { not: null },
      },
      distinct: ["targetRole", "targetIndustry", "geo"],
      select: {
        targetRole: true,
        targetIndustry: true,
        geo: true,
      },
    });

    // Add default combinations if no users yet
    const defaultCombos = [
      { roleFamily: "Software Engineering", industry: "Technology", geo: null },
      { roleFamily: "Data Science", industry: "Technology", geo: null },
      { roleFamily: "Investment Banking", industry: "Finance", geo: null },
      { roleFamily: "Investment Operations", industry: "Asset Management", geo: null },
      { roleFamily: "Product Management", industry: "Technology", geo: null },
    ];

    const combos = settings.length > 0
      ? settings.map((s) => ({
          roleFamily: s.targetRole!,
          industry: s.targetIndustry!,
          geo: s.geo,
        }))
      : defaultCombos;

    const provider = getMarketProvider();
    let updatedCount = 0;

    for (const combo of combos) {
      try {
        const signal = await provider.fetchSignals(
          combo.roleFamily,
          combo.industry,
          combo.geo || undefined
        );

        // Upsert market signal
        await prisma.marketSignal.upsert({
          where: {
            roleFamily_industry_geo_date: {
              roleFamily: combo.roleFamily,
              industry: combo.industry,
              geo: combo.geo || null,
              date: signal.date,
            },
          },
          create: {
            roleFamily: combo.roleFamily,
            industry: combo.industry,
            geo: combo.geo,
            date: signal.date,
            demandIdx: signal.demandIdx,
            skillScarcity: signal.skillScarcity as any,
            compMomentum: signal.compMomentum,
          },
          update: {
            demandIdx: signal.demandIdx,
            skillScarcity: signal.skillScarcity as any,
            compMomentum: signal.compMomentum,
          },
        });

        updatedCount++;
        console.log(`✓ Updated signal for ${combo.roleFamily} in ${combo.industry}`);
      } catch (error) {
        console.error(
          `Error fetching signal for ${combo.roleFamily}/${combo.industry}:`,
          error
        );
      }
    }

    // Clean up old signals (>90 days)
    const ninetyDaysAgo = new Date();
    ninetyDaysAgo.setDate(ninetyDaysAgo.getDate() - 90);

    const deletedCount = await prisma.marketSignal.deleteMany({
      where: {
        date: { lt: ninetyDaysAgo },
      },
    });

    console.log(`✅ Market sync completed: ${updatedCount} signals updated, ${deletedCount.count} old signals cleaned`);
    
    return { updated: updatedCount, deleted: deletedCount.count };
  } catch (error) {
    console.error("Market sync failed:", error);
    throw error;
  }
}

// If run directly (not imported), execute sync
if (require.main === module) {
  syncMarketSignals()
    .then(() => {
      console.log("Sync completed successfully");
      process.exit(0);
    })
    .catch((error) => {
      console.error("Sync failed:", error);
      process.exit(1);
    });
}

