// jobs/backupDatabase.cron.js
import cron from "node-cron";
import { runDatabaseBackup } from "../scripts/backupDatabase.js";

export function startBackupDatabaseCron() {
  cron.schedule("0 2 * * *", async () => {
    console.log("[backup-cron] Running scheduled backup...");

    try {
      await runDatabaseBackup();
    } catch (error) {
      console.error("[backup-cron] Backup failed:", error.message);
    }
  });

  console.log("[backup-cron] Scheduled: daily at 2:00 AM");
}