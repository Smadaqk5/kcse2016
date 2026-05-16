import { z } from "zod";
import {
  KENYA_PHONE_MESSAGE,
  KENYA_PHONE_REGEX,
  normalizePhone,
} from "@/lib/phone";

const phoneField = z
  .string()
  .min(1, "Phone is required")
  .transform(normalizePhone)
  .refine((v) => KENYA_PHONE_REGEX.test(v), { message: KENYA_PHONE_MESSAGE });

export const loginSchema = z.object({
  username: z.string().trim().min(3, "Username must be at least 3 characters"),
  password: z.string().min(6, "Password must be at least 6 characters"),
});

export const createUserSchema = z.object({
  username: z.string().trim().min(3, "Username must be at least 3 characters"),
  password: z.string().min(6, "Password must be at least 6 characters"),
  phone: phoneField,
});

export const selfRegisterSchema = createUserSchema;

export const stkSchema = z.object({
  amount: z.number().positive(),
  phone: phoneField,
  type: z.enum(["SUBSCRIPTION", "PAPER"]),
  subscriptionType: z.enum(["DAILY", "WEEKLY", "MONTHLY"]).optional(),
  packageId: z.string().cuid().optional(),
  paperId: z.string().cuid().optional(),
});

export const subscriptionPackageSchema = z.object({
  name: z.string().min(2),
  subscriptionType: z.enum(["DAILY", "WEEKLY", "MONTHLY"]),
  amount: z.number().min(10),
  durationDays: z.number().int().min(1).max(365),
  isActive: z.boolean().optional(),
  sortOrder: z.number().int().min(0).max(100).optional(),
});
