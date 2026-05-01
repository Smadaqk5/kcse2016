import { z } from "zod";

const kenyaPhoneRegex = /^(\+254|254)[17]\d{8}$|^0[17]\d{8}$/;

export const loginSchema = z.object({
  username: z.string().min(3),
  password: z.string().min(6),
});

export const createUserSchema = z.object({
  username: z.string().min(3),
  password: z.string().min(6),
  phone: z.string().regex(kenyaPhoneRegex, "Use 07/01/2547/2541/+2547/+2541 format"),
});

export const selfRegisterSchema = createUserSchema;

export const stkSchema = z.object({
  amount: z.number().positive(),
  phone: z.string().regex(kenyaPhoneRegex, "Use 07/01/2547/2541/+2547/+2541 format"),
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
