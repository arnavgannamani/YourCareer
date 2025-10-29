/**
 * Cron job scheduler
 * 
 * Sets up scheduled tasks for the application.
 * In production, use a more robust solution like:
 * - Inngest
 * - Bull/BullMQ
 * - External cron (Vercel Cron, GitHub Actions, etc.)
 */

import cron from "node-cron";
import { syncMarketSignals } from "./market-sync";

export function startScheduler() {
  console.log("Starting cron scheduler...");

  // Run market sync daily at 2 AM
  cron.schedule("0 2 * * *", async () => {
    console.log("Running scheduled market signal sync...");
    try {
      await syncMarketSignals();
    } catch (error) {
      console.error("Scheduled market sync failed:", error);
    }
  });

  console.log("✓ Cron scheduler started (market sync: daily at 2 AM)");
}

// Auto-start in development
if (process.env.NODE_ENV === "development" && require.main === module) {
  startScheduler();
  
  // Keep process alive
  process.on("SIGINT", () => {
    console.log("\nStopping scheduler...");
    process.exit(0);
  });
}

