import dayjs from "dayjs";
import { prisma } from "@/lib/prisma";

export const DEFAULT_SUBSCRIPTION_PRICES = {
  DAILY: 49,
  WEEKLY: 199,
  MONTHLY: 599,
} as const;

export const SUBSCRIPTION_DURATIONS: Record<string, number> = {
  DAILY: 1,
  WEEKLY: 7,
  MONTHLY: 30,
};

export function getSubscriptionDurationDays(
  subscriptionType?: string | null,
  customDays?: number
): number {
  if (subscriptionType === "DAILY") return 1;
  if (subscriptionType === "WEEKLY") return 7;
  if (subscriptionType === "MONTHLY") return 30;
  if (customDays && customDays > 0) return customDays;
  return 1;
}

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

export async function canAccessPaperByPhone(phone: string, paperId: string) {
  const cleanPhone = phone.trim().replace(/[\s-]/g, "");
  const user = await prisma.user.findFirst({
    where: { phone: cleanPhone },
  });

  if (user) {
    const allowed = await canAccessPaper(user.id, paperId);
    if (allowed) return { allowed: true, user };
  }

  // Also verify if there is a successful payment record directly with this phone and paperId
  const successfulPayment = await prisma.payment.findFirst({
    where: {
      phone: cleanPhone,
      paperId,
      status: "SUCCESS",
    },
  });

  if (successfulPayment) {
    return { allowed: true, user: user || null };
  }

  return { allowed: false, user: null };
}

