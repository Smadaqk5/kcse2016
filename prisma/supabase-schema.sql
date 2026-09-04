-- ====================================================================
-- KCSE VIP Exam Portal - Supabase PostgreSQL Schema & Seed Data
-- ====================================================================
-- How to apply:
-- 1. In your Supabase Dashboard: go to "SQL Editor" -> "New query"
-- 2. Paste this entire file and click "Run"
-- 3. In your AI Studio project Settings -> Environment Variables, set:
--    DATABASE_URL = postgresql://postgres.[YOUR-PROJECT-REF]:[PASSWORD]@aws-0-[REGION].pooler.supabase.com:6543/postgres?pgbouncer=true
--    DIRECT_URL   = postgresql://postgres.[YOUR-PROJECT-REF]:[PASSWORD]@aws-0-[REGION].pooler.supabase.com:5432/postgres
--    NEXT_PUBLIC_SUPABASE_URL = https://[YOUR-PROJECT-REF].supabase.co
--    NEXT_PUBLIC_SUPABASE_ANON_KEY = [YOUR-ANON-KEY]
-- ====================================================================

CREATE SCHEMA IF NOT EXISTS "public";

-- 1. Create Enums
DO $$ BEGIN
    CREATE TYPE "public"."Role" AS ENUM ('ADMIN', 'SUBSCRIBER');
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
    CREATE TYPE "public"."PaymentStatus" AS ENUM ('PENDING', 'SUCCESS', 'FAILED');
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
    CREATE TYPE "public"."SubscriptionType" AS ENUM ('DAILY', 'WEEKLY', 'MONTHLY');
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
    CREATE TYPE "public"."ContentType" AS ENUM ('PAST_PAPER', 'REVISION_NOTE', 'MOCK_EXAM');
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

-- 2. Create Tables
CREATE TABLE IF NOT EXISTS "public"."User" (
    "id" TEXT NOT NULL,
    "username" TEXT NOT NULL,
    "phone" TEXT NOT NULL,
    "passwordHash" TEXT NOT NULL,
    "role" "public"."Role" NOT NULL DEFAULT 'SUBSCRIBER',
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "twoFactorSecret" TEXT, -- Stores candidate's Unique Access Code (e.g. KCSE-8492-1038)
    "twoFactorEnabled" BOOLEAN NOT NULL DEFAULT false,
    "createdByAdmin" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "User_pkey" PRIMARY KEY ("id")
);

-- Ensure column exists if migrating existing table
ALTER TABLE "public"."User" ADD COLUMN IF NOT EXISTS "twoFactorSecret" TEXT;
ALTER TABLE "public"."User" ADD COLUMN IF NOT EXISTS "twoFactorEnabled" BOOLEAN NOT NULL DEFAULT false;

CREATE TABLE IF NOT EXISTS "public"."AdminUser" (
    "id" TEXT NOT NULL,
    "username" TEXT NOT NULL,
    "passwordHash" TEXT NOT NULL,
    "fullName" TEXT NOT NULL,
    "twoFactorSecret" TEXT,
    "twoFactorEnabled" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "AdminUser_pkey" PRIMARY KEY ("id")
);

CREATE TABLE IF NOT EXISTS "public"."SubscriptionPackage" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "subscriptionType" "public"."SubscriptionType" NOT NULL,
    "amount" DECIMAL(10,2) NOT NULL,
    "durationDays" INTEGER NOT NULL,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "sortOrder" INTEGER NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "SubscriptionPackage_pkey" PRIMARY KEY ("id")
);

CREATE TABLE IF NOT EXISTS "public"."Subscription" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "subscriptionType" "public"."SubscriptionType" NOT NULL,
    "activatedAt" TIMESTAMP(3) NOT NULL,
    "expiresAt" TIMESTAMP(3) NOT NULL,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "paymentId" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Subscription_pkey" PRIMARY KEY ("id")
);

CREATE TABLE IF NOT EXISTS "public"."Payment" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "amount" DECIMAL(10,2) NOT NULL,
    "status" "public"."PaymentStatus" NOT NULL DEFAULT 'PENDING',
    "transactionRef" TEXT,
    "mpesaReceiptNumber" TEXT,
    "phone" TEXT NOT NULL,
    "checkoutRequestId" TEXT,
    "merchantRequestId" TEXT,
    "subscriptionType" "public"."SubscriptionType",
    "paperId" TEXT,
    "metadata" JSONB,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Payment_pkey" PRIMARY KEY ("id")
);

CREATE TABLE IF NOT EXISTS "public"."Paper" (
    "id" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "description" TEXT,
    "contentType" "public"."ContentType" NOT NULL,
    "unitCode" TEXT NOT NULL,
    "topic" TEXT NOT NULL,
    "course" TEXT NOT NULL,
    "semester" TEXT NOT NULL,
    "price" DECIMAL(10,2) NOT NULL,
    "filePath" TEXT NOT NULL,
    "isPublished" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Paper_pkey" PRIMARY KEY ("id")
);

CREATE TABLE IF NOT EXISTS "public"."PaperPurchase" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "paperId" TEXT NOT NULL,
    "purchasedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "expiresAt" TIMESTAMP(3),
    "paymentId" TEXT,

    CONSTRAINT "PaperPurchase_pkey" PRIMARY KEY ("id")
);

CREATE TABLE IF NOT EXISTS "public"."ActivityLog" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "action" TEXT NOT NULL,
    "details" TEXT,
    "ipAddress" TEXT,
    "userAgent" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "ActivityLog_pkey" PRIMARY KEY ("id")
);

-- 3. Unique Indexes
CREATE UNIQUE INDEX IF NOT EXISTS "User_username_key" ON "public"."User"("username");
CREATE UNIQUE INDEX IF NOT EXISTS "User_phone_key" ON "public"."User"("phone");
CREATE UNIQUE INDEX IF NOT EXISTS "AdminUser_username_key" ON "public"."AdminUser"("username");
CREATE UNIQUE INDEX IF NOT EXISTS "SubscriptionPackage_subscriptionType_key" ON "public"."SubscriptionPackage"("subscriptionType");
CREATE UNIQUE INDEX IF NOT EXISTS "Payment_transactionRef_key" ON "public"."Payment"("transactionRef");
CREATE UNIQUE INDEX IF NOT EXISTS "Payment_checkoutRequestId_key" ON "public"."Payment"("checkoutRequestId");
CREATE UNIQUE INDEX IF NOT EXISTS "PaperPurchase_userId_paperId_key" ON "public"."PaperPurchase"("userId", "paperId");

-- 4. Foreign Keys
DO $$ BEGIN
    ALTER TABLE "public"."Subscription" ADD CONSTRAINT "Subscription_userId_fkey" FOREIGN KEY ("userId") REFERENCES "public"."User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
EXCEPTION WHEN duplicate_object THEN null; END $$;

DO $$ BEGIN
    ALTER TABLE "public"."Subscription" ADD CONSTRAINT "Subscription_paymentId_fkey" FOREIGN KEY ("paymentId") REFERENCES "public"."Payment"("id") ON DELETE SET NULL ON UPDATE CASCADE;
EXCEPTION WHEN duplicate_object THEN null; END $$;

DO $$ BEGIN
    ALTER TABLE "public"."Payment" ADD CONSTRAINT "Payment_userId_fkey" FOREIGN KEY ("userId") REFERENCES "public"."User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
EXCEPTION WHEN duplicate_object THEN null; END $$;

DO $$ BEGIN
    ALTER TABLE "public"."Payment" ADD CONSTRAINT "Payment_paperId_fkey" FOREIGN KEY ("paperId") REFERENCES "public"."Paper"("id") ON DELETE SET NULL ON UPDATE CASCADE;
EXCEPTION WHEN duplicate_object THEN null; END $$;

DO $$ BEGIN
    ALTER TABLE "public"."PaperPurchase" ADD CONSTRAINT "PaperPurchase_userId_fkey" FOREIGN KEY ("userId") REFERENCES "public"."User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
EXCEPTION WHEN duplicate_object THEN null; END $$;

DO $$ BEGIN
    ALTER TABLE "public"."PaperPurchase" ADD CONSTRAINT "PaperPurchase_paperId_fkey" FOREIGN KEY ("paperId") REFERENCES "public"."Paper"("id") ON DELETE CASCADE ON UPDATE CASCADE;
EXCEPTION WHEN duplicate_object THEN null; END $$;

DO $$ BEGIN
    ALTER TABLE "public"."ActivityLog" ADD CONSTRAINT "ActivityLog_userId_fkey" FOREIGN KEY ("userId") REFERENCES "public"."User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
EXCEPTION WHEN duplicate_object THEN null; END $$;

-- 5. Enable Row Level Security (RLS)
ALTER TABLE "public"."User" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "public"."AdminUser" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "public"."SubscriptionPackage" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "public"."Subscription" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "public"."Payment" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "public"."Paper" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "public"."PaperPurchase" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "public"."ActivityLog" ENABLE ROW LEVEL SECURITY;

-- 6. Default Public Read Policies for Public Content
DO $$ BEGIN
    CREATE POLICY "Allow public read of active packages" ON "public"."SubscriptionPackage" FOR SELECT USING (isActive = true);
EXCEPTION WHEN duplicate_object THEN null; END $$;

DO $$ BEGIN
    CREATE POLICY "Allow public read of published papers" ON "public"."Paper" FOR SELECT USING (isPublished = true);
EXCEPTION WHEN duplicate_object THEN null; END $$;

-- Allow backend service role / postgres connection full access
DO $$ BEGIN
    CREATE POLICY "Allow service role all users" ON "public"."User" FOR ALL USING (true);
EXCEPTION WHEN duplicate_object THEN null; END $$;

DO $$ BEGIN
    CREATE POLICY "Allow service role all admin" ON "public"."AdminUser" FOR ALL USING (true);
EXCEPTION WHEN duplicate_object THEN null; END $$;

DO $$ BEGIN
    CREATE POLICY "Allow service role all packages" ON "public"."SubscriptionPackage" FOR ALL USING (true);
EXCEPTION WHEN duplicate_object THEN null; END $$;

DO $$ BEGIN
    CREATE POLICY "Allow service role all subscriptions" ON "public"."Subscription" FOR ALL USING (true);
EXCEPTION WHEN duplicate_object THEN null; END $$;

DO $$ BEGIN
    CREATE POLICY "Allow service role all payments" ON "public"."Payment" FOR ALL USING (true);
EXCEPTION WHEN duplicate_object THEN null; END $$;

DO $$ BEGIN
    CREATE POLICY "Allow service role all papers" ON "public"."Paper" FOR ALL USING (true);
EXCEPTION WHEN duplicate_object THEN null; END $$;

DO $$ BEGIN
    CREATE POLICY "Allow service role all purchases" ON "public"."PaperPurchase" FOR ALL USING (true);
EXCEPTION WHEN duplicate_object THEN null; END $$;

DO $$ BEGIN
    CREATE POLICY "Allow service role all logs" ON "public"."ActivityLog" FOR ALL USING (true);
EXCEPTION WHEN duplicate_object THEN null; END $$;

-- 7. Initial Seed Data (Safe Upserts)
-- Default Packages
INSERT INTO "public"."SubscriptionPackage" ("id", "name", "subscriptionType", "amount", "durationDays", "isActive", "sortOrder")
VALUES
    ('pkg-daily', 'Daily Access Pass', 'DAILY', 1500.00, 1, true, 1),
    ('pkg-weekly', 'Weekly Exam Booster', 'WEEKLY', 5000.00, 7, true, 2),
    ('pkg-monthly', 'Monthly VIP Pass', 'MONTHLY', 12000.00, 30, true, 3)
ON CONFLICT ("subscriptionType") DO UPDATE SET
    "amount" = EXCLUDED."amount",
    "name" = EXCLUDED."name",
    "durationDays" = EXCLUDED."durationDays",
    "isActive" = EXCLUDED."isActive";

-- Default Admin User (Password: Mainaadam66@)
INSERT INTO "public"."AdminUser" ("id", "username", "passwordHash", "fullName", "createdAt", "updatedAt")
VALUES
    ('admin-master', 'admin', '$2a$10$fV3zD0vX4Vf6hQfP8xU0q.qZzPjH3d6Zc1XqJ3l5vI9bC7dE2fA0K', 'Lead Examination Controller', NOW(), NOW())
ON CONFLICT ("username") DO NOTHING;

-- Default Demo Student (Access Code: KCSE-2026-DEMO)
INSERT INTO "public"."User" ("id", "username", "phone", "passwordHash", "role", "isActive", "twoFactorSecret", "createdAt", "updatedAt")
VALUES
    ('usr-demo-student', 'student', '254712345678', '$2a$10$fV3zD0vX4Vf6hQfP8xU0q.qZzPjH3d6Zc1XqJ3l5vI9bC7dE2fA0K', 'SUBSCRIBER', true, 'KCSE-2026-DEMO', NOW(), NOW())
ON CONFLICT ("username") DO NOTHING;

-- Default Sample Papers
INSERT INTO "public"."Paper" ("id", "title", "description", "contentType", "unitCode", "topic", "course", "semester", "price", "filePath", "isPublished")
VALUES
    ('paper-math-1', 'KCSE 2024 Mathematics Paper 1 (121/1) - Official KNEC & Marking Scheme', 'Section I & II comprehensive questions on Calculus, Vectors, Coordinate Geometry, and Trigonometry with complete point allocation.', 'PAST_PAPER', '121/1', 'Core Pure Mathematics', 'KCSE High School', 'Term 3', 50.00, 'sample_math1.pdf', true),
    ('paper-math-2', 'KCSE 2024 Mathematics Paper 2 (121/2) - High-Level Probability & 3D Geometry', 'Advanced transformations, Binomial expansion, Compound interest, Probability trees, and 3D projection calculations.', 'PAST_PAPER', '121/2', 'Probability & Applied Math', 'KCSE High School', 'Term 3', 50.00, 'sample_math2.pdf', true),
    ('paper-eng-1', 'KCSE 2024 English Paper 1 (101/1) - Functional Writing & Oral Skills', 'Includes official format guidelines for Minutes, Investigative Reports, Cloze Tests, and Phonetic/Intonation evaluation.', 'PAST_PAPER', '101/1', 'Functional Writing & Oracy', 'KCSE High School', 'Term 3', 50.00, 'sample_eng1.pdf', true),
    ('paper-eng-2', 'KCSE 2024 English Paper 2 (101/2) - Comprehension & Literary Appreciation', 'Full set-book excerpt analyses (Fathers of Nations, The Samaritan, Parliament of Owls) with sample essay model answers.', 'PAST_PAPER', '101/2', 'Literary Analysis & Grammar', 'KCSE High School', 'Term 3', 50.00, 'sample_eng2.pdf', true),
    ('paper-chem-1', 'KCSE 2024 Chemistry Paper 1 (233/1) - Theory & Reaction Kinetics', 'Atomic structure, Periodic table periodicity, Qualitative analysis, Thermochemistry, and Organic Chemistry reaction pathways.', 'PAST_PAPER', '233/1', 'Inorganic & Physical Chemistry', 'KCSE High School', 'Term 3', 50.00, 'sample_chem1.pdf', true),
    ('paper-bio-1', 'KCSE 2024 Biology Paper 1 (231/1) - Cell Physiology & Genetics', 'Human physiology, Photosynthesis & respiration, Genetic crosses, Evolution, and Ecological sampling methodologies.', 'PAST_PAPER', '231/1', 'Physiology, Genetics & Ecology', 'KCSE High School', 'Term 3', 50.00, 'sample_bio1.pdf', true),
    ('paper-phys-1', 'KCSE 2024 Physics Paper 1 (232/1) - Mechanics & Thermal Physics', 'Newtonian mechanics, Energy conservation, Pressure in fluids, Gas laws, and Hooke''s Law experimental setups.', 'PAST_PAPER', '232/1', 'Mechanics & Thermodynamics', 'KCSE High School', 'Term 3', 50.00, 'sample_phys1.pdf', true),
    ('paper-mock-2026', 'KCSE 2026 VIP Predicted Mock Series 1 (National Combined)', 'Strictly confidential predicted high-probability examination items compiled by senior chief examiners across Kenya.', 'MOCK_EXAM', 'MOCK-2026', 'VIP National Prediction', 'KCSE High School', 'Pre-KCSE', 100.00, 'sample_mock2026.pdf', true)
ON CONFLICT ("id") DO NOTHING;
