import dotenv from "dotenv";
// override: true ensures the .env file values always win over any inherited
// shell environment variables (e.g. a stale CORS_ORIGINS from a parent shell).
dotenv.config({ override: true });

import app from "./core/App.js";
import connectDB from "./config/database.js";
import { startOverdueBookingsCron } from "./jobs/overdueBookings.cron.js";
import { startBackupDatabaseCron } from "./jobs/backupDatabase.cron.js";

const PORT = process.env.PORT || 5000;

connectDB().then(() => {
    app.listen(PORT, () => {
        console.log(`Server running on port ${PORT}`);
    });
    startOverdueBookingsCron();
    startBackupDatabaseCron();
});