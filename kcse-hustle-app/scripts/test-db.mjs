import { config } from "dotenv";
import { PrismaClient } from "@prisma/client";

config();

const prisma = new PrismaClient();
const timeout = setTimeout(() => {
  console.error("TIMEOUT after 20s — check DATABASE_URL host/port and Supabase network");
  process.exit(1);
}, 20_000);

try {
  const ping = await prisma.$queryRaw`SELECT 1 AS ok`;
  console.log("Connection OK:", ping);

  const tables = await prisma.$queryRaw`
    SELECT tablename FROM pg_tables WHERE schemaname = 'public' ORDER BY tablename
  `;
  const names = tables.map((r) => r.tablename);
  console.log("Tables:", names.length ? names.join(", ") : "(none — run schema SQL or prisma migrate)");

  const userCount = await prisma.user.count().catch(() => null);
  const adminCount = await prisma.adminUser.count().catch(() => null);
  if (userCount !== null) console.log("User rows:", userCount);
  if (adminCount !== null) console.log("AdminUser rows:", adminCount);
} catch (e) {
  console.error("DB error:", e.message);
  process.exitCode = 1;
} finally {
  clearTimeout(timeout);
  await prisma.$disconnect();
}
