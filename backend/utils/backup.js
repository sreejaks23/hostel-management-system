// Creates a timestamped MongoDB backup using `mongodump`.
// Usage: npm run backup   (requires the MongoDB Database Tools installed:
// https://www.mongodb.com/docs/database-tools/installation/)
//
// For production, schedule this on a daily cron (e.g. `0 2 * * * cd /path/to/backend && npm run backup`)
// and ship the resulting folder to off-site storage (S3, Backblaze, etc.).
import { execFile } from "child_process";
import path from "path";
import fs from "fs";
import dotenv from "dotenv";

dotenv.config();

const mongoUri = process.env.MONGO_URI;
if (!mongoUri) {
  console.error("MONGO_URI is not set in .env — cannot run backup.");
  process.exit(1);
}

const backupRoot = path.join(process.cwd(), "backups");
if (!fs.existsSync(backupRoot)) fs.mkdirSync(backupRoot, { recursive: true });

const timestamp = new Date().toISOString().replace(/[:.]/g, "-");
const outDir = path.join(backupRoot, timestamp);

console.log(`Starting backup to ${outDir} ...`);

execFile("mongodump", ["--uri", mongoUri, "--out", outDir], (error, stdout, stderr) => {
  if (error) {
    console.error("Backup failed. Is `mongodump` installed and on your PATH?");
    console.error(error.message);
    process.exit(1);
  }
  if (stderr) console.log(stderr);
  console.log(`Backup complete: ${outDir}`);
});
