/**
 * URL-encode the password in DATABASE_URL / DIRECT_URL when it contains
 * characters that break postgresql:// parsing (/, *, @, #, ?, etc.).
 */
import { config } from "dotenv";
import { readFileSync, writeFileSync } from "fs";

config();

function fixPostgresUrl(raw) {
  const prefix = "postgresql://";
  if (!raw.startsWith(prefix)) return raw;

  const rest = raw.slice(prefix.length);
  const at = rest.lastIndexOf("@");
  if (at < 0) return raw;

  const creds = rest.slice(0, at);
  const hostAndPath = rest.slice(at + 1);
  const colon = creds.indexOf(":");
  if (colon < 0) return raw;

  const user = creds.slice(0, colon);
  const password = creds.slice(colon + 1);
  const encoded = encodeURIComponent(password);
  if (encoded === password) return raw;

  return `${prefix}${user}:${encoded}@${hostAndPath}`;
}

let envText = readFileSync(".env", "utf8");
let changed = false;

for (const key of ["DATABASE_URL", "DIRECT_URL"]) {
  const current = process.env[key];
  if (!current) continue;

  const fixed = fixPostgresUrl(current);
  if (fixed === current) {
    console.log(`${key}: already OK (no encoding needed)`);
    continue;
  }

  const re = new RegExp(`^(${key}\\s*=\\s*)(["']?)(.*)\\2\\s*$`, "m");
  if (!re.test(envText)) {
    console.log(`${key}: could not update .env line automatically`);
    continue;
  }

  envText = envText.replace(re, `$1"${fixed}"`);
  changed = true;
  console.log(`${key}: password URL-encoded in .env`);
}

if (changed) {
  writeFileSync(".env", envText, "utf8");
  console.log("\nUpdated .env — re-run: npx prisma migrate status");
} else {
  console.log("\nNo changes written.");
}
