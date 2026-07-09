// scripts/backupDatabase.js
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";
import { exec } from "child_process";
import util from "util";
import dotenv from "dotenv";

dotenv.config();

const execAsync = util.promisify(exec);

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const BACKUP_ROOT = path.join(__dirname, "..", "backups");
const THIRTY_DAYS_MS = 30 * 24 * 60 * 60 * 1000;

function ensureBackupDir() {
  if (!fs.existsSync(BACKUP_ROOT)) {
    fs.mkdirSync(BACKUP_ROOT, { recursive: true });
  }
}

function getTimestampFolder() {
  return new Date().toISOString().replace(/:/g, "-").replace(/\..+/, "");
}

function cleanupOldBackups() {
  ensureBackupDir();

  const folders = fs.readdirSync(BACKUP_ROOT);

  for (const folder of folders) {
    const folderPath = path.join(BACKUP_ROOT, folder);

    if (!fs.statSync(folderPath).isDirectory()) continue;

    const stats = fs.statSync(folderPath);
    const age = Date.now() - stats.mtimeMs;

    if (age > THIRTY_DAYS_MS) {
      fs.rmSync(folderPath, { recursive: true, force: true });
      console.log(`[backup] Deleted old backup: ${folder}`);
    }
  }
}

export async function runDatabaseBackup() {
  try {
    if (!process.env.MONGO_URI) {
      throw new Error("MONGO_URI is missing");
    }

    ensureBackupDir();

    const timestamp = getTimestampFolder();
    const backupPath = path.join(BACKUP_ROOT, timestamp);

    fs.mkdirSync(backupPath, { recursive: true });

    const command = `mongodump --uri="${process.env.MONGO_URI}" --out="${backupPath}"`;

    console.log("[backup] Starting backup...");
    await execAsync(command);

    console.log(`[backup] Backup completed: ${backupPath}`);

    cleanupOldBackups();
  } catch (error) {
    console.error("[backup] Failed:", error.message);
    throw error;
  }
}

if (process.argv[1] === fileURLToPath(import.meta.url)) {
  runDatabaseBackup()
    .then(() => process.exit(0))
    .catch(() => process.exit(1));
}