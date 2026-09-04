const { PrismaClient } = require("@prisma/client");
const bcrypt = require("bcryptjs");

const prisma = new PrismaClient();

async function main() {
  const adminUsername = process.env.DEFAULT_ADMIN_USERNAME || "admin";
  const adminPassword = process.env.DEFAULT_ADMIN_PASSWORD || "Admin@12345";
  const userUsername = process.env.DEFAULT_USER_USERNAME || "student";
  const userPassword = process.env.DEFAULT_USER_PASSWORD || "Student@12345";
  const userPhone = process.env.DEFAULT_USER_PHONE || "254712345678";
  const adminHash = await bcrypt.hash(adminPassword, 12);
  const userHash = await bcrypt.hash(userPassword, 12);

  await prisma.adminUser.upsert({
    where: { username: adminUsername },
    update: { passwordHash: adminHash },
    create: {
      username: adminUsername,
      fullName: "System Admin",
      passwordHash: adminHash,
    },
  });

  await prisma.user.upsert({
    where: { username: userUsername },
    update: { passwordHash: userHash, phone: userPhone, role: "SUBSCRIBER", isActive: true },
    create: {
      username: userUsername,
      phone: userPhone,
      passwordHash: userHash,
      role: "SUBSCRIBER",
      isActive: true,
    },
  });

  const defaultPackages = [
    { name: "Daily Access Pass", subscriptionType: "DAILY", amount: 1500, durationDays: 1, sortOrder: 1 },
    { name: "Weekly Exam Booster", subscriptionType: "WEEKLY", amount: 5000, durationDays: 7, sortOrder: 2 },
    { name: "Monthly VIP Pass", subscriptionType: "MONTHLY", amount: 12000, durationDays: 30, sortOrder: 3 },
  ];

  for (const pkg of defaultPackages) {
    await prisma.subscriptionPackage.upsert({
      where: { subscriptionType: pkg.subscriptionType },
      update: {
        name: pkg.name,
        amount: pkg.amount,
        durationDays: pkg.durationDays,
        sortOrder: pkg.sortOrder,
        isActive: true,
      },
      create: pkg,
    });
  }

  console.log(`Seeded admin account: ${adminUsername} / ${adminPassword}`);
  console.log(`Seeded subscriber account: ${userUsername} / ${userPassword}`);
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => prisma.$disconnect());
