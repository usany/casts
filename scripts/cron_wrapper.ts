#!/usr/bin/env -S npx tsx
/**
 * scripts/cron_wrapper.ts — node-cron daemon for the news pipeline (TypeScript).
 *
 * Runs as a long-lived process that schedules the pipeline with node-cron
 * (instead of relying on the OS crontab). It:
 *   1. Restores a usable PATH (node/npx/tsx/playwright)
 *   2. cd's to the repo root and loads .env
 *   3. Registers a node-cron job (default: every Friday 22:00, Asia/Seoul)
 *   4. Runs scripts/run_pipeline.ts in a child process when the job fires
 *      (noOverlap guards against concurrent runs if a run overruns its slot)
 *
 * This process is meant to be kept alive by a launchd LaunchAgent installed by
 * scripts/install_cron.ts (see that file). Windows/Linux users can run it
 * under a process manager (pm2, systemd, nohup, etc.).
 *
 * Schedule is read from the SCHEDULE env var or --schedule="..." (default Fri 22:00).
 * Use --run-now to execute the pipeline once immediately on startup (for testing).
 *
 * Run:
 *   npx tsx scripts/cron_wrapper.ts                        # daemon, default schedule
 *   npx tsx scripts/cron_wrapper.ts --schedule="0 9 * * 1"
 *   SCHEDULE="0 9 * * 1" npx tsx scripts/cron_wrapper.ts
 *   npx tsx scripts/cron_wrapper.ts --run-now
 */
import cron from "node-cron";
import { spawn } from "node:child_process";
import * as path from "node:path";
import * as fs from "node:fs";
import * as os from "node:os";

const HOME = os.homedir();

// --- Restore a usable PATH for cron/minimal environments ---
const extra = [
  "/opt/homebrew/bin",
  "/usr/local/bin",
  "/opt/homebrew/opt/node/bin",
  `${HOME}/.local/bin`,
].join(":");
const sep = ":";
const merged = `${extra}${sep}${process.env.PATH ?? "/usr/bin:/bin:/usr/sbin:/sbin"}`;
process.env.PATH = [...new Set(merged.split(sep).filter(Boolean))].join(sep);

// --- Resolve repo root and cd there ---
const ROOT = path.resolve(path.dirname(new URL(import.meta.url).pathname), "..");
process.chdir(ROOT);

const LOG = path.join(ROOT, "_workspace", "cron.log");
const TZ = process.env.TZ || "Asia/Seoul";

// --- Tiny logger (console + rotating log file) ---
function log(msg: string): void {
  const line = `[${new Date().toISOString()}] ${msg}`;
  console.log(line);
  try {
    fs.mkdirSync(path.dirname(LOG), { recursive: true });
    fs.appendFileSync(LOG, line + "\n");
  } catch {
    /* logging is best-effort */
  }
}

// --- Load .env (only fills vars not already set) ---
function loadEnv(): void {
  try {
    const raw = fs.readFileSync(path.join(ROOT, ".env"), "utf8");
    for (const l of raw.split(/\r?\n/)) {
      const m = /^\s*([A-Za-z_][A-Za-z0-9_]*)\s*=\s*(.*)\s*$/.exec(l);
      if (m && process.env[m[1]] === undefined) {
        process.env[m[1]] = m[2].replace(/^["']|["']$/g, "");
      }
    }
  } catch {
    /* .env missing — rely on env vars */
  }
}

// --- Parse --schedule / --run-now args ---
function parseArgs(argv: string[]): { schedule: string | null; runNow: boolean } {
  let schedule: string | null = null;
  let runNow = false;
  for (const a of argv) {
    if (a.startsWith("--schedule=")) schedule = a.slice("--schedule=".length);
    else if (a === "--run-now") runNow = true;
    else if (a === "-h" || a === "--help") {
      console.log("usage: npx tsx scripts/cron_wrapper.ts [--schedule='0 22 * * 5'] [--run-now]");
      process.exit(0);
    } else {
      console.error(`unknown arg: ${a}`);
      process.exit(2);
    }
  }
  return { schedule, runNow };
}

// --- Run the pipeline in a child process (aborts daemon-ish; logs exit) ---
function runPipeline(trigger: string): void {
  log(`RUN triggered (${trigger})`);
  const child = spawn("npx", ["tsx", "scripts/run_pipeline.ts"], {
    cwd: ROOT,
    stdio: "inherit",
    env: { ...process.env },
  });
  child.on("error", (err) => log(`FATAL: could not spawn pipeline: ${err.message}`));
  child.on("exit", (code, sig) => {
    log(`pipeline finished — exit=${code ?? "null"} signal=${sig ?? "null"}`);
  });
}

// --- Main ---
loadEnv();
const { schedule: scheduleArg, runNow } = parseArgs(process.argv.slice(2));
const SCHEDULE = scheduleArg || process.env.SCHEDULE || "0 22 * * 5"; // default: Friday 22:00

if (!cron.validate(SCHEDULE)) {
  log(`FATAL: invalid cron expression: "${SCHEDULE}"`);
  process.exit(1);
}

if (runNow) {
  log("--run-now: executing pipeline immediately");
  runPipeline("manual --run-now");
}

const task = cron.schedule(
  SCHEDULE,
  () => runPipeline(`scheduled ${SCHEDULE}`),
  { name: "radio-news", timezone: TZ, noOverlap: true },
);

log("==============================================================");
log(`node-cron daemon started`);
log(`  schedule : ${SCHEDULE} (${TZ})`);
log(`  next run : ${task.getNextRun() ? task.getNextRun()!.toISOString() : "n/a"}`);
log(`  root     : ${ROOT}`);
log(`  log      : ${LOG}`);
log("==============================================================");

// Keep the process alive (node-cron tasks keep the event loop ref'd by default).
process.on("SIGTERM", () => {
  log("received SIGTERM, shutting down");
  task.stop();
  process.exit(0);
});
process.on("SIGINT", () => {
  log("received SIGINT, shutting down");
  task.stop();
  process.exit(0);
});