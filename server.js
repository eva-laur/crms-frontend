import dotenv from "dotenv";
dotenv.config();

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