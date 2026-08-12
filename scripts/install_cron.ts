#!/usr/bin/env -S npx tsx
/**
 * scripts/install_cron.ts — installs the news pipeline as a macOS launchd agent
 * that runs the node-cron daemon (scripts/cron_wrapper.ts).
 *
 * The actual scheduling is done in-process by node-cron (see cron_wrapper.ts).
 * This script makes that daemon persist across reboots by registering a
 * LaunchAgent plist at ~/Library/LaunchAgents/com.casts.radio-news.plist and
 * loading it with launchctl.
 *
 * Default schedule: every Friday at 22:00 (end of the KHU school week), Asia/Seoul.
 * Override with --schedule="30 9 * * 1" or the SCHEDULE env var.
 *
 * Usage:
 *   npx tsx scripts/install_cron.ts                     # install (default Fri 22:00)
 *   npx tsx scripts/install_cron.ts --schedule="0 9 * * 1"
 *   npx tsx scripts/install_cron.ts --uninstall         # remove the agent
 *   npx tsx scripts/install_cron.ts --status            # show agent status
 */
import { execFileSync } from "node:child_process";
import * as path from "node:path";
import * as os from "node:os";
import * as fs from "node:fs";

const ROOT = path.resolve(path.dirname(new URL(import.meta.url).pathname), "..");
const HOME = os.homedir();
const LABEL = "com.casts.radio-news";
const PLIST = path.join(HOME, "Library", "LaunchAgents", `${LABEL}.plist`);
const WRAPPER = path.join(ROOT, "scripts", "cron_wrapper.ts");
const LOG = path.join(ROOT, "_workspace", "cron.log");
const TZ = process.env.TZ || "Asia/Seoul";

// Resolve the absolute path to npx (must be on PATH for launchd).
let NPX = "npx";
try {
  NPX = execFileSync("which", ["npx"], { encoding: "utf8" }).trim();
} catch {
  /* fall back to 'npx' */
}

// --- Parse args ---
let action: "install" | "uninstall" | "status" = "install";
let sch = "";
for (const a of process.argv.slice(2)) {
  if (a.startsWith("--schedule=")) sch = a.slice("--schedule=".length);
  else if (a === "--uninstall") action = "uninstall";
  else if (a === "--status") action = "status";
  else if (a === "-h" || a === "--help") {
    console.log("usage: npx tsx scripts/install_cron.ts [--schedule=\"0 22 * * 5\"] [--uninstall] [--status]");
    process.exit(0);
  } else {
    console.error(`unknown arg: ${a}`);
    process.exit(2);
  }
}
const SCHEDULE = sch || process.env.SCHEDULE || "0 22 * * 5"; // default: Friday 22:00

function plistXml(): string {
  return `<?xml version="1.0" encoding="UTF-8"?>
<!DOCTYPE plist PUBLIC "-//Apple//DTD PLIST 1.0//EN" "http://www.apple.com/DTDs/PropertyList-1.0.dtd">
<plist version="1.0">
<dict>
  <key>Label</key>
  <string>${LABEL}</string>
  <key>ProgramArguments</key>
  <array>
    <string>${NPX}</string>
    <string>tsx</string>
    <string>${WRAPPER}</string>
  </array>
  <key>WorkingDirectory</key>
  <string>${ROOT}</string>
  <key>RunAtLoad</key>
  <true/>
  <key>KeepAlive</key>
  <true/>
  <key>StandardOutPath</key>
  <string>${LOG}.out</string>
  <key>StandardErrorPath</key>
  <string>${LOG}.err</string>
  <key>EnvironmentVariables</key>
  <dict>
    <key>PATH</key>
    <string>/opt/homebrew/bin:/usr/local/bin:/opt/homebrew/opt/node/bin:/usr/bin:/bin:/usr/sbin:/sbin</string>
    <key>SCHEDULE</key>
    <string>${SCHEDULE}</string>
    <key>TZ</key>
    <string>${TZ}</string>
  </dict>
</dict>
</plist>
`;
}

function launchctl(actionName: string, args: string[]): string {
  try {
    return execFileSync("launchctl", [actionName, ...args], { encoding: "utf8" });
  } catch (e) {
    return `(launchctl ${actionName} ${args.join(" ")} failed: ${(e as Error).message})`;
  }
}

// --- Install ---
function main(): void {
  if (action === "install") {
    fs.mkdirSync(path.join(HOME, "Library", "LaunchAgents"), { recursive: true });
    fs.writeFileSync(PLIST, plistXml());
    fs.chmodSync(PLIST, "644");

    // Unload any existing instance, then (re)load.
    if (fs.existsSync(PLIST)) launchctl("unload", [PLIST]);
    launchctl("load", [PLIST]);

    console.log("Installed launchd agent (node-cron daemon):");
    console.log(`  label    : ${LABEL}`);
    console.log(`  schedule : ${SCHEDULE} (${TZ})`);
    console.log(`  plist    : ${PLIST}`);
    console.log(`  wrapper  : ${WRAPPER}`);
    console.log(`  log      : ${LOG}`);
    console.log();
    console.log(launchctl("print", [`gui/${os.userInfo().uid}/${LABEL}`]) || "loaded");
    return;
  }

  // --- Uninstall ---
  if (action === "uninstall") {
    launchctl("unload", [PLIST]);
    if (fs.existsSync(PLIST)) fs.unlinkSync(PLIST);
    console.log(`Removed launchd agent ${LABEL} (${PLIST})`);
    return;
  }

  // --- Status ---
  if (action === "status") {
    const out = launchctl("print", [`gui/${os.userInfo().uid}/${LABEL}`]);
    console.log(out);
    return;
  }
}

main();