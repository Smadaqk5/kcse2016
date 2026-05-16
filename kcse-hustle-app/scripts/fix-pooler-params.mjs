import { config } from "dotenv";
import { readFileSync, writeFileSync } from "fs";

config();

function ensurePoolerParams(url) {
  if (!url.includes("pooler.supabase.com")) return url;
  const u = new URL(url);
  if (u.port === "6543" && !u.searchParams.has("pgbouncer")) {
    u.searchParams.set("pgbouncer", "true");
  }
  return u.toString();
}

let envText = readFileSync(".env", "utf8");
let changed = false;

for (const key of ["DATABASE_URL", "DIRECT_URL"]) {
  const current = process.env[key];
  if (!current) continue;
  const fixed = ensurePoolerParams(current);
  if (fixed === current) {
    console.log(`${key}: pooler params OK`);
    continue;
  }
  const re = new RegExp(`^(${key}\\s*=\\s*)(["']?)(.*)\\2\\s*$`, "m");
  envText = envText.replace(re, `$1"${fixed}"`);
  changed = true;
  console.log(`${key}: added ?pgbouncer=true for transaction pooler`);
}

if (changed) writeFileSync(".env", envText, "utf8");
else console.log("No .env changes.");
