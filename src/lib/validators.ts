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

export const accessCodeLoginSchema = z.object({
  accessCode: z
    .string()
    .trim()
    .min(3, "Please enter your unique access code"),
});

export const candidateRegisterSchema = z.object({
  fullName: z.string().trim().min(2, "Please enter your name").max(50).optional(),
  phone: z
    .string()
    .trim()
    .min(1, "Phone number is required for M-Pesa access")
    .transform(normalizePhone)
    .refine((v) => KENYA_PHONE_REGEX.test(v), { message: KENYA_PHONE_MESSAGE }),
});

export const loginSchema = z.object({
  username: z.string().trim().min(2, "Username or access code is required"),
  password: z.string().min(1, "Password is required").optional(),
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
  packageId: z.string().min(1).optional(),
  paperId: z.string().min(1).optional(),
});

export const subscriptionPackageSchema = z.object({
  name: z.string().min(2),
  subscriptionType: z.enum(["DAILY", "WEEKLY", "MONTHLY"]),
  amount: z.coerce.number().min(10, "Amount must be at least 10 KES"),
  durationDays: z.coerce.number().int().min(1).max(365),
  isActive: z.boolean().optional(),
  sortOrder: z.coerce.number().int().min(0).max(1000).optional().default(0),
});
