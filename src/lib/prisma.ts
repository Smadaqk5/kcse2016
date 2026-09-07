import { PrismaClient } from "@prisma/client";
import bcrypt from "bcryptjs";

const globalForPrisma = globalThis as unknown as { prisma?: PrismaClient };

export function isPlaceholderDbUrl(url?: string | null): boolean {
  if (!url || typeof url !== "string") return true;
  const trimmed = url.trim();
  return (
    !trimmed ||
    trimmed.includes("YOUR_DB_PASSWORD") ||
    trimmed.includes("YOUR_PROJECT_REF") ||
    trimmed.includes("localhost:5432/placeholder") ||
    trimmed.includes("[YOUR_PASSWORD]") ||
    trimmed.includes("[PASSWORD]") ||
    trimmed.includes("<PASSWORD>") ||
    trimmed.includes("example.com")
  );
}

const hasDbUrl = Boolean(process.env.DATABASE_URL && !isPlaceholderDbUrl(process.env.DATABASE_URL));

// In-memory data store for fallback/preview when Postgres is offline
interface MockUser {
  id: string;
  username: string;
  phone: string;
  passwordHash: string;
  role: "ADMIN" | "SUBSCRIBER";
  isActive: boolean;
  twoFactorSecret?: string | null;
  twoFactorEnabled?: boolean;
  createdAt: Date;
  updatedAt: Date;
}

interface MockAdmin {
  id: string;
  username: string;
  passwordHash: string;
  fullName: string;
  twoFactorSecret?: string | null;
  twoFactorEnabled?: boolean;
  createdAt: Date;
  updatedAt: Date;
}

interface MockPackage {
  id: string;
  name: string;
  subscriptionType: "DAILY" | "WEEKLY" | "MONTHLY";
  amount: number;
  durationDays: number;
  isActive: boolean;
  sortOrder: number;
  createdAt: Date;
  updatedAt: Date;
}

interface MockSubscription {
  id: string;
  userId: string;
  subscriptionType: "DAILY" | "WEEKLY" | "MONTHLY";
  activatedAt: Date;
  expiresAt: Date;
  isActive: boolean;
  paymentId?: string | null;
  createdAt: Date;
  updatedAt: Date;
}

interface MockPaper {
  id: string;
  title: string;
  description: string | null;
  contentType: "PAST_PAPER" | "REVISION_NOTE" | "MOCK_EXAM";
  unitCode: string;
  topic: string;
  course: string;
  semester: string;
  price: number;
  filePath: string;
  isPublished: boolean;
  createdAt: Date;
  updatedAt: Date;
}

interface MockPayment {
  id: string;
  userId: string;
  amount: number;
  status: "PENDING" | "SUCCESS" | "FAILED";
  transactionRef: string | null;
  mpesaReceiptNumber: string | null;
  phone: string;
  checkoutRequestId: string | null;
  merchantRequestId: string | null;
  subscriptionType: "DAILY" | "WEEKLY" | "MONTHLY" | null;
  paperId: string | null;
  metadata: Record<string, unknown> | null;
  createdAt: Date;
  updatedAt: Date;
  user?: MockUser;
  paper?: MockPaper | null;
}

interface MockPaperPurchase {
  id: string;
  userId: string;
  paperId: string;
  purchasedAt: Date;
  expiresAt: Date | null;
  paymentId: string | null;
  paper?: MockPaper;
}

// Global in-memory storage for development/preview persistence
const mockStore = (globalThis as unknown as {
  _mockStore?: {
    users: MockUser[];
    admins: MockAdmin[];
    packages: MockPackage[];
    subscriptions: MockSubscription[];
    papers: MockPaper[];
    payments: MockPayment[];
    purchases: MockPaperPurchase[];
    activityLogs: Array<{ id: string; userId: string; action: string; details?: string | null; createdAt: Date }>;
  };
})._mockStore ??= {
  users: [
    {
      id: "usr-demo-student",
      username: "student",
      phone: "254712345678",
      passwordHash: bcrypt.hashSync("KCSE-2026-DEMO", 10),
      role: "SUBSCRIBER",
      isActive: true,
      twoFactorSecret: "KCSE-2026-DEMO",
      twoFactorEnabled: false,
      createdAt: new Date(),
      updatedAt: new Date(),
    },
  ],
  admins: [
    {
      id: "admin-1",
      username: "admin",
      passwordHash: bcrypt.hashSync(process.env.DEFAULT_ADMIN_PASSWORD || "Mainaadam66@", 10),
      fullName: "Lead Examination Controller",
      twoFactorSecret: null,
      twoFactorEnabled: false,
      createdAt: new Date(),
      updatedAt: new Date(),
    },
    {
      id: "admin-2",
      username: "mainaadam66@gmail.com",
      passwordHash: bcrypt.hashSync("Mainaadam66@", 10),
      fullName: "Lead Examination Controller",
      twoFactorSecret: null,
      twoFactorEnabled: false,
      createdAt: new Date(),
      updatedAt: new Date(),
    },
  ],
  packages: [
    {
      id: "pkg-daily",
      name: "Daily Access Pass",
      subscriptionType: "DAILY",
      amount: 49,
      durationDays: 1,
      isActive: true,
      sortOrder: 1,
      createdAt: new Date(),
      updatedAt: new Date(),
    },
    {
      id: "pkg-weekly",
      name: "Weekly Exam Booster",
      subscriptionType: "WEEKLY",
      amount: 199,
      durationDays: 7,
      isActive: true,
      sortOrder: 2,
      createdAt: new Date(),
      updatedAt: new Date(),
    },
    {
      id: "pkg-monthly",
      name: "Monthly VIP Pass",
      subscriptionType: "MONTHLY",
      amount: 599,
      durationDays: 30,
      isActive: true,
      sortOrder: 3,
      createdAt: new Date(),
      updatedAt: new Date(),
    },
  ],
  subscriptions: [],
  papers: [
    {
      id: "paper-math-1",
      title: "KCSE 2024 Mathematics Paper 1 (121/1) - Official KNEC & Marking Scheme",
      description: "Section I & II comprehensive questions on Calculus, Vectors, Coordinate Geometry, and Trigonometry with complete point allocation.",
      contentType: "PAST_PAPER",
      unitCode: "121/1",
      topic: "Core Pure Mathematics",
      course: "KCSE High School",
      semester: "Term 3",
      price: 50,
      filePath: "sample_math1.pdf",
      isPublished: true,
      createdAt: new Date(Date.now() - 3600000 * 24 * 5),
      updatedAt: new Date(),
    },
    {
      id: "paper-math-2",
      title: "KCSE 2024 Mathematics Paper 2 (121/2) - High-Level Probability & 3D Geometry",
      description: "Advanced transformations, Binomial expansion, Compound interest, Probability trees, and 3D projection calculations.",
      contentType: "PAST_PAPER",
      unitCode: "121/2",
      topic: "Probability & Applied Math",
      course: "KCSE High School",
      semester: "Term 3",
      price: 50,
      filePath: "sample_math2.pdf",
      isPublished: true,
      createdAt: new Date(Date.now() - 3600000 * 24 * 4),
      updatedAt: new Date(),
    },
    {
      id: "paper-eng-1",
      title: "KCSE 2024 English Paper 1 (101/1) - Functional Writing & Oral Skills",
      description: "Includes official format guidelines for Minutes, Investigative Reports, Cloze Tests, and Phonetic/Intonation evaluation.",
      contentType: "PAST_PAPER",
      unitCode: "101/1",
      topic: "Functional Writing & Oracy",
      course: "KCSE High School",
      semester: "Term 3",
      price: 50,
      filePath: "sample_eng1.pdf",
      isPublished: true,
      createdAt: new Date(Date.now() - 3600000 * 24 * 3),
      updatedAt: new Date(),
    },
    {
      id: "paper-eng-2",
      title: "KCSE 2024 English Paper 2 (101/2) - Comprehension & Literary Appreciation",
      description: "Full set-book excerpt analyses (Fathers of Nations, The Samaritan, Parliament of Owls) with sample essay model answers.",
      contentType: "PAST_PAPER",
      unitCode: "101/2",
      topic: "Literary Analysis & Grammar",
      course: "KCSE High School",
      semester: "Term 3",
      price: 50,
      filePath: "sample_eng2.pdf",
      isPublished: true,
      createdAt: new Date(Date.now() - 3600000 * 24 * 2),
      updatedAt: new Date(),
    },
    {
      id: "paper-chem-1",
      title: "KCSE 2024 Chemistry Paper 1 (233/1) - Theory & Reaction Kinetics",
      description: "Atomic structure, Periodic table periodicity, Qualitative analysis, Thermochemistry, and Organic Chemistry reaction pathways.",
      contentType: "PAST_PAPER",
      unitCode: "233/1",
      topic: "Inorganic & Physical Chemistry",
      course: "KCSE High School",
      semester: "Term 3",
      price: 50,
      filePath: "sample_chem1.pdf",
      isPublished: true,
      createdAt: new Date(Date.now() - 3600000 * 24 * 2),
      updatedAt: new Date(),
    },
    {
      id: "paper-bio-1",
      title: "KCSE 2024 Biology Paper 1 (231/1) - Cell Physiology & Genetics",
      description: "Human physiology, Photosynthesis & respiration, Genetic crosses, Evolution, and Ecological sampling methodologies.",
      contentType: "PAST_PAPER",
      unitCode: "231/1",
      topic: "Physiology, Genetics & Ecology",
      course: "KCSE High School",
      semester: "Term 3",
      price: 50,
      filePath: "sample_bio1.pdf",
      isPublished: true,
      createdAt: new Date(Date.now() - 3600000 * 24 * 1),
      updatedAt: new Date(),
    },
    {
      id: "paper-phys-1",
      title: "KCSE 2024 Physics Paper 1 (232/1) - Mechanics & Thermal Physics",
      description: "Newtonian mechanics, Energy conservation, Pressure in fluids, Gas laws, and Hooke's Law experimental setups.",
      contentType: "PAST_PAPER",
      unitCode: "232/1",
      topic: "Mechanics & Thermodynamics",
      course: "KCSE High School",
      semester: "Term 3",
      price: 50,
      filePath: "sample_phys1.pdf",
      isPublished: true,
      createdAt: new Date(Date.now() - 3600000 * 24 * 1),
      updatedAt: new Date(),
    },
    {
      id: "paper-mock-2026",
      title: "KCSE 2026 VIP Predicted Mock Series 1 (National Combined)",
      description: "Strictly confidential predicted high-probability examination items compiled by senior chief examiners across Kenya.",
      contentType: "MOCK_EXAM",
      unitCode: "MOCK-2026",
      topic: "VIP National Prediction",
      course: "KCSE High School",
      semester: "Pre-KCSE",
      price: 100,
      filePath: "sample_mock2026.pdf",
      isPublished: true,
      createdAt: new Date(),
      updatedAt: new Date(),
    },
  ],
  payments: [],
  purchases: [],
  activityLogs: [],
};

function createMockPrisma(): PrismaClient {
  const userMethods = {
    findUnique: async ({ where }: { where: { id?: string; username?: string; phone?: string } }) => {
      return (
        mockStore.users.find(
          (u) =>
            (where.id && u.id === where.id) ||
            (where.username && u.username.toLowerCase() === where.username.toLowerCase()) ||
            (where.phone && u.phone === where.phone)
        ) || null
      );
    },
    findFirst: async ({ where }: { where?: Record<string, unknown> } = {}) => {
      if (!where) return mockStore.users[0] || null;
      if (where.twoFactorSecret) {
        const target = String(where.twoFactorSecret).trim().toUpperCase().replace(/[\s_]+/g, "-");
        const found = mockStore.users.find(
          (u) =>
            u.twoFactorSecret &&
            u.twoFactorSecret.toUpperCase().replace(/[\s_]+/g, "-") === target
        );
        if (found) return found;
      }
      return (
        mockStore.users.find((u) => {
          for (const [k, v] of Object.entries(where)) {
            if (typeof v === "string" && typeof (u as unknown as Record<string, unknown>)[k] === "string") {
              if ((u as unknown as Record<string, string>)[k].toLowerCase() !== v.toLowerCase()) return false;
            } else if ((u as unknown as Record<string, unknown>)[k] !== v) {
              return false;
            }
          }
          return true;
        }) || null
      );
    },
    findMany: async () => [...mockStore.users],
    count: async ({ where }: { where?: Record<string, unknown> } = {}) => {
      if (!where) return mockStore.users.length;
      return mockStore.users.filter((u) => {
        if (where.role && u.role !== where.role) return false;
        if (where.isActive !== undefined && u.isActive !== where.isActive) return false;
        return true;
      }).length;
    },
    create: async ({ data }: { data: Record<string, unknown> }) => {
      const newUser: MockUser = {
        id: `usr-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
        username: String(data.username),
        phone: String(data.phone),
        passwordHash: String(data.passwordHash),
        role: (data.role as "ADMIN" | "SUBSCRIBER") || "SUBSCRIBER",
        isActive: data.isActive !== false,
        twoFactorSecret: (data.twoFactorSecret as string) || null,
        twoFactorEnabled: Boolean(data.twoFactorEnabled),
        createdAt: new Date(),
        updatedAt: new Date(),
      };
      mockStore.users.push(newUser);
      return newUser;
    },
    update: async ({ where, data }: { where: { id?: string; username?: string }; data: Record<string, unknown> }) => {
      const idx = mockStore.users.findIndex(
        (u) => (where.id && u.id === where.id) || (where.username && u.username === where.username)
      );
      if (idx === -1) throw new Error("User not found");
      const updated = {
        ...mockStore.users[idx],
        ...data,
        updatedAt: new Date(),
      } as MockUser;
      mockStore.users[idx] = updated;
      return updated;
    },
    delete: async ({ where }: { where: { id?: string; username?: string } }) => {
      const idx = mockStore.users.findIndex(
        (u) => (where.id && u.id === where.id) || (where.username && u.username === where.username)
      );
      if (idx !== -1) {
        const [deleted] = mockStore.users.splice(idx, 1);
        return deleted;
      }
      return null;
    },
    upsert: async ({
      where,
      create,
      update,
    }: {
      where: { id?: string; username?: string; phone?: string };
      create: Record<string, unknown>;
      update: Record<string, unknown>;
    }) => {
      const existing = mockStore.users.find(
        (u) =>
          (where.id && u.id === where.id) ||
          (where.username && u.username === where.username) ||
          (where.phone && u.phone === where.phone)
      );
      if (existing) {
        Object.assign(existing, update, { updatedAt: new Date() });
        return existing;
      }
      return userMethods.create({ data: create });
    },
  };

  const adminMethods = {
    findUnique: async ({ where }: { where: { id?: string; username?: string } }) => {
      return (
        mockStore.admins.find(
          (a) =>
            (where.id && a.id === where.id) ||
            (where.username && a.username.toLowerCase() === where.username.toLowerCase())
        ) || null
      );
    },
    findFirst: async ({ where }: { where?: Record<string, unknown> } = {}) => {
      if (!where) return mockStore.admins[0] || null;
      return (
        mockStore.admins.find((a) => {
          for (const [k, v] of Object.entries(where)) {
            if (typeof v === "string" && typeof (a as unknown as Record<string, unknown>)[k] === "string") {
              if ((a as unknown as Record<string, string>)[k].toLowerCase() !== v.toLowerCase()) return false;
            } else if ((a as unknown as Record<string, unknown>)[k] !== v) {
              return false;
            }
          }
          return true;
        }) || mockStore.admins[0] || null
      );
    },
    findMany: async () => [...mockStore.admins],
    count: async () => mockStore.admins.length,
    create: async ({ data }: { data: Record<string, unknown> }) => {
      const admin: MockAdmin = {
        id: `adm-${Date.now()}`,
        username: String(data.username),
        passwordHash: String(data.passwordHash),
        fullName: String(data.fullName || "Administrator"),
        twoFactorSecret: (data.twoFactorSecret as string) || null,
        twoFactorEnabled: Boolean(data.twoFactorEnabled),
        createdAt: new Date(),
        updatedAt: new Date(),
      };
      mockStore.admins.push(admin);
      return admin;
    },
    update: async ({ where, data }: { where: { id?: string; username?: string }; data: Record<string, unknown> }) => {
      const idx = mockStore.admins.findIndex(
        (a) => (where.id && a.id === where.id) || (where.username && a.username === where.username)
      );
      if (idx === -1) throw new Error("Admin not found");
      const updated = {
        ...mockStore.admins[idx],
        ...data,
        updatedAt: new Date(),
      } as MockAdmin;
      mockStore.admins[idx] = updated;
      return updated;
    },
    delete: async ({ where }: { where: { id?: string; username?: string } }) => {
      const idx = mockStore.admins.findIndex(
        (a) => (where.id && a.id === where.id) || (where.username && a.username === where.username)
      );
      if (idx !== -1) {
        const [deleted] = mockStore.admins.splice(idx, 1);
        return deleted;
      }
      return null;
    },
  };

  const packageMethods = {
    findMany: async ({ where }: { where?: { isActive?: boolean }; orderBy?: unknown } = {}) => {
      let list = [...mockStore.packages];
      if (where?.isActive !== undefined) {
        list = list.filter((p) => p.isActive === where.isActive);
      }
      return list.sort((a, b) => a.sortOrder - b.sortOrder);
    },
    findFirst: async ({ where }: { where?: { id?: string; subscriptionType?: string; isActive?: boolean } } = {}) => {
      return (
        mockStore.packages.find((p) => {
          if (where?.id && p.id !== where.id) return false;
          if (where?.subscriptionType && p.subscriptionType !== where.subscriptionType) return false;
          if (where?.isActive !== undefined && p.isActive !== where.isActive) return false;
          return true;
        }) || null
      );
    },
    findUnique: async ({ where }: { where: { id?: string; subscriptionType?: string } }) => {
      return (
        mockStore.packages.find((p) => {
          if (where.id && p.id === where.id) return true;
          if (where.subscriptionType && p.subscriptionType === where.subscriptionType) return true;
          return false;
        }) || null
      );
    },
    create: async ({ data }: { data: Record<string, unknown> }) => {
      const pkg: MockPackage = {
        id: (data.id as string) || `pkg-${Date.now()}`,
        name: String(data.name),
        subscriptionType: (data.subscriptionType as "DAILY" | "WEEKLY" | "MONTHLY") || "DAILY",
        amount: Number(data.amount),
        durationDays: Number(data.durationDays || 1),
        isActive: data.isActive !== false,
        sortOrder: Number(data.sortOrder || 0),
        createdAt: new Date(),
        updatedAt: new Date(),
      };
      mockStore.packages.push(pkg);
      return pkg;
    },
    update: async ({ where, data }: { where: { id: string }; data: Record<string, unknown> }) => {
      const idx = mockStore.packages.findIndex((p) => p.id === where.id);
      if (idx !== -1) {
        mockStore.packages[idx] = { ...mockStore.packages[idx], ...data, updatedAt: new Date() } as MockPackage;
        return mockStore.packages[idx];
      }
      throw new Error("Subscription package not found");
    },
    delete: async ({ where }: { where: { id: string } }) => {
      const idx = mockStore.packages.findIndex((p) => p.id === where.id);
      if (idx !== -1) {
        const [deleted] = mockStore.packages.splice(idx, 1);
        return deleted;
      }
      return null;
    },
    count: async () => mockStore.packages.length,
    upsert: async ({
      where,
      create,
      update,
    }: {
      where: { id?: string; subscriptionType?: string };
      create: Record<string, unknown>;
      update: Record<string, unknown>;
    }) => {
      const existing = mockStore.packages.find(
        (p) =>
          (where.id && p.id === where.id) ||
          (where.subscriptionType && p.subscriptionType === where.subscriptionType)
      );
      if (existing) {
        Object.assign(existing, update, { updatedAt: new Date() });
        return existing;
      }
      return packageMethods.create({ data: create });
    },
  };

  const subscriptionMethods = {
    findMany: async ({ where }: { where?: Record<string, unknown> } = {}) => {
      let list = [...mockStore.subscriptions];
      if (where?.userId) list = list.filter((s) => s.userId === where.userId);
      if (where?.isActive !== undefined) list = list.filter((s) => s.isActive === where.isActive);
      return list;
    },
    findUnique: async ({ where }: { where: { id: string } }) => {
      return mockStore.subscriptions.find((s) => s.id === where.id) || null;
    },
    findFirst: async ({ where }: { where?: Record<string, unknown> } = {}) => {
      const now = new Date();
      return (
        mockStore.subscriptions.find((s) => {
          if (where?.userId && s.userId !== where.userId) return false;
          if (where?.isActive !== undefined && s.isActive !== where.isActive) return false;
          if (s.expiresAt <= now) return false;
          return true;
        }) || null
      );
    },
    create: async ({ data }: { data: Record<string, unknown> }) => {
      const sub: MockSubscription = {
        id: `sub-${Date.now()}`,
        userId: String(data.userId),
        subscriptionType: (data.subscriptionType as "DAILY" | "WEEKLY" | "MONTHLY") || "DAILY",
        activatedAt: (data.activatedAt as Date) || new Date(),
        expiresAt: (data.expiresAt as Date) || new Date(Date.now() + 86400000),
        isActive: true,
        paymentId: (data.paymentId as string) || null,
        createdAt: new Date(),
        updatedAt: new Date(),
      };
      mockStore.subscriptions.push(sub);
      return sub;
    },
    update: async ({ where, data }: { where: { id: string }; data: Record<string, unknown> }) => {
      const idx = mockStore.subscriptions.findIndex((s) => s.id === where.id);
      if (idx !== -1) {
        mockStore.subscriptions[idx] = {
          ...mockStore.subscriptions[idx],
          ...data,
          updatedAt: new Date(),
        } as MockSubscription;
        return mockStore.subscriptions[idx];
      }
      return null;
    },
    delete: async ({ where }: { where: { id: string } }) => {
      const idx = mockStore.subscriptions.findIndex((s) => s.id === where.id);
      if (idx !== -1) {
        const [deleted] = mockStore.subscriptions.splice(idx, 1);
        return deleted;
      }
      return null;
    },
    count: async () => mockStore.subscriptions.filter((s) => s.isActive && s.expiresAt > new Date()).length,
  };

  const paperMethods = {
    findMany: async ({ where, take }: { where?: { isPublished?: boolean }; take?: number; orderBy?: unknown } = {}) => {
      let list = [...mockStore.papers];
      if (where?.isPublished !== undefined) {
        list = list.filter((p) => p.isPublished === where.isPublished);
      }
      if (take) list = list.slice(0, take);
      return list;
    },
    findUnique: async ({ where }: { where: { id: string } }) => {
      return mockStore.papers.find((p) => p.id === where.id) || null;
    },
    findFirst: async ({ where }: { where?: { id?: string } } = {}) => {
      if (!where) return mockStore.papers[0] || null;
      return mockStore.papers.find((p) => (where.id ? p.id === where.id : true)) || null;
    },
    create: async ({ data }: { data: Record<string, unknown> }) => {
      const paper: MockPaper = {
        id: (data.id as string) || `paper-${Date.now()}`,
        title: String(data.title),
        description: (data.description as string) || null,
        contentType: (data.contentType as "PAST_PAPER" | "REVISION_NOTE" | "MOCK_EXAM") || "PAST_PAPER",
        unitCode: String(data.unitCode || "GEN-01"),
        topic: String(data.topic || "General"),
        course: String(data.course || "KCSE"),
        semester: String(data.semester || "Term 1"),
        price: Number(data.price || 50),
        filePath: String(data.filePath || "default.pdf"),
        isPublished: data.isPublished !== false,
        createdAt: new Date(),
        updatedAt: new Date(),
      };
      mockStore.papers.unshift(paper);
      return paper;
    },
    update: async ({ where, data }: { where: { id: string }; data: Record<string, unknown> }) => {
      const idx = mockStore.papers.findIndex((p) => p.id === where.id);
      if (idx !== -1) {
        mockStore.papers[idx] = {
          ...mockStore.papers[idx],
          ...data,
          price: data.price !== undefined ? Number(data.price) : mockStore.papers[idx].price,
          updatedAt: new Date(),
        } as MockPaper;
        return mockStore.papers[idx];
      }
      throw new Error("Paper not found");
    },
    delete: async ({ where }: { where: { id: string } }) => {
      const idx = mockStore.papers.findIndex((p) => p.id === where.id);
      if (idx !== -1) {
        const [deleted] = mockStore.papers.splice(idx, 1);
        return deleted;
      }
      return null;
    },
    count: async () => mockStore.papers.length,
  };

  const paymentMethods = {
    create: async ({ data }: { data: Record<string, unknown> }) => {
      const payment: MockPayment = {
        id: `pay-${Date.now()}`,
        userId: String(data.userId),
        amount: Number(data.amount),
        status: "PENDING",
        transactionRef: (data.transactionRef as string) || null,
        mpesaReceiptNumber: null,
        phone: String(data.phone),
        checkoutRequestId: (data.checkoutRequestId as string) || null,
        merchantRequestId: null,
        subscriptionType: (data.subscriptionType as "DAILY" | "WEEKLY" | "MONTHLY") || null,
        paperId: (data.paperId as string) || null,
        metadata: (data.metadata as Record<string, unknown>) || null,
        createdAt: new Date(),
        updatedAt: new Date(),
        user: mockStore.users.find((u) => u.id === data.userId),
        paper: mockStore.papers.find((p) => p.id === data.paperId) || null,
      };
      mockStore.payments.unshift(payment);
      return payment;
    },
    findFirst: async ({ where }: { where?: Record<string, unknown> } = {}) => {
      return (
        mockStore.payments.find((p) => {
          if (where?.id && p.id !== where.id) return false;
          if (where?.checkoutRequestId && p.checkoutRequestId !== where.checkoutRequestId) return false;
          if (where?.transactionRef && p.transactionRef !== where.transactionRef) return false;
          return true;
        }) || null
      );
    },
    findUnique: async ({ where }: { where: { id: string } }) => {
      return mockStore.payments.find((p) => p.id === where.id) || null;
    },
    update: async ({ where, data }: { where: { id: string }; data: Record<string, unknown> }) => {
      const idx = mockStore.payments.findIndex((p) => p.id === where.id);
      if (idx !== -1) {
        const updated = {
          ...mockStore.payments[idx],
          ...data,
          updatedAt: new Date(),
        } as MockPayment;
        mockStore.payments[idx] = updated;
        return updated;
      }
      return null;
    },
    findMany: async ({ take }: { take?: number } = {}) => {
      let list = mockStore.payments.map((p) => ({
        ...p,
        user: mockStore.users.find((u) => u.id === p.userId) || { username: "student", phone: p.phone },
      }));
      if (take) list = list.slice(0, take);
      return list;
    },
    aggregate: async () => {
      const sum = mockStore.payments
        .filter((p) => p.status === "SUCCESS")
        .reduce((acc, curr) => acc + curr.amount, 0);
      return { _sum: { amount: sum } };
    },
    count: async ({ where }: { where?: Record<string, unknown> } = {}) => {
      if (!where) return mockStore.payments.length;
      return mockStore.payments.filter((p) => {
        if (where.status && p.status !== where.status) return false;
        if (where.userId && p.userId !== where.userId) return false;
        return true;
      }).length;
    },
    delete: async ({ where }: { where: { id: string } }) => {
      const idx = mockStore.payments.findIndex((p) => p.id === where.id);
      if (idx !== -1) {
        const [deleted] = mockStore.payments.splice(idx, 1);
        return deleted;
      }
      return null;
    },
  };

  const purchaseMethods = {
    findMany: async ({ where }: { where?: { userId?: string } } = {}) => {
      let list = [...mockStore.purchases];
      if (where?.userId) {
        list = list.filter((p) => p.userId === where.userId);
      }
      return list.map((pur) => ({
        ...pur,
        paper: mockStore.papers.find((p) => p.id === pur.paperId) || null,
      }));
    },
    findUnique: async ({ where }: { where: { userId_paperId?: { userId: string; paperId: string } } }) => {
      if (!where.userId_paperId) return null;
      return (
        mockStore.purchases.find(
          (p) => p.userId === where.userId_paperId!.userId && p.paperId === where.userId_paperId!.paperId
        ) || null
      );
    },
    create: async ({ data }: { data: Record<string, unknown> }) => {
      const created: MockPaperPurchase = {
        id: (data.id as string) || `pur-${Date.now()}`,
        userId: String(data.userId),
        paperId: String(data.paperId),
        purchasedAt: (data.purchasedAt as Date) || new Date(),
        expiresAt: (data.expiresAt as Date) || null,
        paymentId: (data.paymentId as string) || null,
      };
      mockStore.purchases.push(created);
      return created;
    },
    upsert: async ({
      where,
      create,
    }: {
      where: { userId_paperId: { userId: string; paperId: string } };
      create: Record<string, unknown>;
    }) => {
      const existing = mockStore.purchases.find(
        (p) => p.userId === where.userId_paperId.userId && p.paperId === where.userId_paperId.paperId
      );
      if (existing) return existing;
      const created: MockPaperPurchase = {
        id: `pur-${Date.now()}`,
        userId: where.userId_paperId.userId,
        paperId: where.userId_paperId.paperId,
        purchasedAt: new Date(),
        expiresAt: null,
        paymentId: (create.paymentId as string) || null,
      };
      mockStore.purchases.push(created);
      return created;
    },
    delete: async ({ where }: { where: { id?: string; userId_paperId?: { userId: string; paperId: string } } }) => {
      const idx = mockStore.purchases.findIndex(
        (p) =>
          (where.id && p.id === where.id) ||
          (where.userId_paperId &&
            p.userId === where.userId_paperId.userId &&
            p.paperId === where.userId_paperId.paperId)
      );
      if (idx !== -1) {
        const [deleted] = mockStore.purchases.splice(idx, 1);
        return deleted;
      }
      return null;
    },
    count: async ({ where }: { where?: Record<string, unknown> } = {}) => {
      if (!where) return mockStore.purchases.length;
      return mockStore.purchases.filter((p) => {
        if (where.userId && p.userId !== where.userId) return false;
        if (where.paperId && p.paperId !== where.paperId) return false;
        return true;
      }).length;
    },
  };

  const activityMethods = {
    create: async ({ data }: { data: Record<string, unknown> }) => {
      const log = {
        id: `log-${Date.now()}`,
        userId: String(data.userId),
        action: String(data.action),
        details: (data.details as string) || null,
        createdAt: new Date(),
      };
      mockStore.activityLogs.push(log);
      return log;
    },
    findMany: async ({ take }: { take?: number } = {}) => {
      let list = [...mockStore.activityLogs].reverse();
      if (take) list = list.slice(0, take);
      return list;
    },
    count: async () => mockStore.activityLogs.length,
  };

  const rawModels: Record<string, unknown> = {
    user: userMethods,
    adminUser: adminMethods,
    subscriptionPackage: packageMethods,
    subscription: subscriptionMethods,
    paper: paperMethods,
    payment: paymentMethods,
    paperPurchase: purchaseMethods,
    activityLog: activityMethods,
  };

  // Wrap EACH model with a protective proxy to guarantee every Prisma method exists as a callable async function
  const models: Record<string, unknown> = {};
  for (const [name, targetObj] of Object.entries(rawModels)) {
    models[name] = new Proxy(targetObj as object, {
      get(target, propKey, receiver) {
        if (Reflect.has(target, propKey)) {
          return Reflect.get(target, propKey, receiver);
        }
        if (propKey === "count") return async () => 0;
        if (propKey === "findMany") return async () => [];
        if (propKey === "findFirst" || propKey === "findUnique") return async () => null;
        if (propKey === "aggregate") return async () => ({ _sum: { amount: 0 }, _count: 0 });
        if (propKey === "groupBy") return async () => [];
        if (propKey === "delete" || propKey === "deleteMany") return async () => ({ count: 0 });
        if (propKey === "updateMany") return async () => ({ count: 0 });
        if (propKey === "upsert") return async () => null;
        return async () => null;
      },
    });
  }

  return new Proxy({} as PrismaClient, {
    get: (_target, prop) => {
      if (prop === "$connect" || prop === "$disconnect") return async () => {};
      if (prop === "$queryRaw" || prop === "$executeRaw") return async () => [];
      if (typeof prop === "string" && prop in models) return models[prop];
      return new Proxy(
        {},
        {
          get: () => async () => null,
        }
      );
    },
  });
}

let realPrisma: PrismaClient | null = null;
if (hasDbUrl) {
  try {
    realPrisma =
      globalForPrisma.prisma ??
      new PrismaClient({
        log: ["warn", "error"],
      });
    if (process.env.NODE_ENV !== "production") {
      globalForPrisma.prisma = realPrisma;
    }
  } catch {
    console.warn("[AI Studio] Database initialization failed — using mock");
  }
}

const sharedMockPrisma = createMockPrisma();
let consecutiveDbFailures = 0;
const MAX_CONSECUTIVE_FAILURES = 3;

export const prisma: PrismaClient = new Proxy((realPrisma ?? sharedMockPrisma) as PrismaClient, {
  get(target, prop, receiver) {
    if (!realPrisma || consecutiveDbFailures >= MAX_CONSECUTIVE_FAILURES) {
      return Reflect.get(sharedMockPrisma as unknown as object, prop, receiver);
    }
    const original = Reflect.get(target, prop, receiver);
    if (typeof original === "object" && original !== null) {
      return new Proxy(original, {
        get(modelTarget, modelProp, modelReceiver) {
          const method = Reflect.get(modelTarget, modelProp, modelReceiver);
          if (typeof method === "function") {
            return async (...args: unknown[]) => {
              try {
                const result = await method.apply(modelTarget, args);
                consecutiveDbFailures = 0;
                return result;
              } catch (err: unknown) {
                consecutiveDbFailures++;
                const errMsg = err instanceof Error ? err.message : String(err);
                if (consecutiveDbFailures <= MAX_CONSECUTIVE_FAILURES) {
                  console.warn(
                    `[AI Studio] DB connection unavailable for ${String(prop)}.${String(modelProp)}. Switching to active in-memory store:`,
                    errMsg.split("\n")[0]
                  );
                }
                const mockClient = sharedMockPrisma as unknown as Record<
                  string,
                  Record<string, (...a: unknown[]) => Promise<unknown>>
                >;
                const mock = typeof prop === "string" ? mockClient[prop] : undefined;
                if (mock && typeof modelProp === "string" && typeof mock[modelProp] === "function") {
                  return await mock[modelProp](...args);
                }
                if (modelProp === "findMany") return [];
                if (modelProp === "count") return 0;
                if (modelProp === "aggregate") return { _sum: { amount: 0 } };
                return null;
              }
            };
          }
          return method;
        },
      });
    }
    return original;
  },
});
