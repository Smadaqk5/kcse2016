import { config } from "dotenv";
import { PrismaClient } from "@prisma/client";
import bcrypt from "bcryptjs";

config();

const prisma = new PrismaClient();

try {
  const user = await prisma.user.create({
    data: {
      username: "testuser_" + Date.now(),
      phone: "2547" + String(Date.now()).slice(-8),
      passwordHash: await bcrypt.hash("testpass123", 10),
      role: "SUBSCRIBER",
      isActive: true,
    },
  });
  console.log("Created:", user.id, user.username);
  await prisma.user.delete({ where: { id: user.id } });
  console.log("Cleaned up test user");
} catch (e) {
  console.error("Error code:", e.code, "message:", e.message);
  process.exitCode = 1;
} finally {
  await prisma.$disconnect();
}
