import dayjs from "dayjs";
import { prisma } from "@/lib/prisma";

export async function hasActiveSubscription(userId: string) {
  const now = new Date();
  const subscription = await prisma.subscription.findFirst({
    where: {
      userId,
      isActive: true,
      activatedAt: { lte: now },
      expiresAt: { gt: now },
    },
    orderBy: { expiresAt: "desc" },
  });

  return subscription;
}

export async function canAccessPaper(userId: string, paperId: string) {
  const [subscription, purchase] = await Promise.all([
    hasActiveSubscription(userId),
    prisma.paperPurchase.findUnique({
      where: { userId_paperId: { userId, paperId } },
    }),
  ]);

  if (subscription) return true;
  if (!purchase) return false;
  if (!purchase.expiresAt) return true;
  return dayjs(purchase.expiresAt).isAfter(dayjs());
}
