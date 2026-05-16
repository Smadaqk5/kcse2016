import { config } from "dotenv";
import { readFileSync } from "fs";

config();

function inspect(name) {
  const v = process.env[name];
  if (!v) {
    console.log(`${name}: MISSING`);
    return;
  }
  console.log(`${name}:`);
  console.log(`  length: ${v.length}`);
  console.log(`  starts with postgresql://: ${v.startsWith("postgresql://")}`);
  console.log(`  starts with postgres://: ${v.startsWith("postgres://")}`);
  console.log(`  has YOUR_ placeholder: ${/YOUR_/i.test(v)}`);
  console.log(`  @ count: ${(v.match(/@/g) || []).length}`);
  const hasSpace = /\s/.test(v);
  const hasNewline = /[\r\n]/.test(v);
  console.log(`  contains whitespace/newline: ${hasSpace || hasNewline}`);
  try {
    const u = new URL(v);
    console.log(`  parsed OK — host: ${u.hostname}, port: ${u.port || "(default)"}`);
  } catch (e) {
    console.log(`  parse error: ${e.message}`);
    // postgresql://user:password@host:port/db
    const m = v.match(/^postgresql:\/\/([^:]+):([^@]*)@([^:/]+):?(\d+)?\//);
    if (m) {
      console.log(`  regex split — user len: ${m[1].length}, pass len: ${m[2].length}, host: ${m[3]}, port: ${m[4] || "(missing)"}`);
      const passSpecial = m[2].match(/[^a-zA-Z0-9._-]/g);
      if (passSpecial) {
        const unique = [...new Set(passSpecial)].join("");
        console.log(`  password has special chars (need URL-encoding): ${unique}`);
      }
    } else {
      console.log(`  could not regex-split URL — likely unencoded : or @ in password, or wrong format`);
    }
  }
}

console.log("--- env vars (no secrets printed) ---\n");
inspect("DATABASE_URL");
inspect("DIRECT_URL");
inspect("JWT_SECRET");

// Raw .env line shape (no values)
try {
  const raw = readFileSync(".env", "utf8");
  const dbLines = raw
    .split("\n")
    .filter((l) => /^DATABASE_URL|^DIRECT_URL/.test(l.trim()));
  console.log("\n--- .env line prefixes (values hidden) ---");
  for (const line of dbLines) {
    const eq = line.indexOf("=");
    const key = eq >= 0 ? line.slice(0, eq).trim() : line.trim();
    const val = eq >= 0 ? line.slice(eq + 1).trim() : "";
    console.log(
      `${key}= [len ${val.length}, quoted: ${/^["']/.test(val)}, prefix: ${val.slice(0, 12).replace(/[^a-zA-Z0-9:/.-]/g, "?")}...]`,
    );
  }
} catch {
  console.log("\nCould not read .env file");
}
