import { initializeApp, getApps, getApp } from "firebase/app";
import {
  getFirestore,
  collection,
  doc,
  getDocs,
  setDoc,
  deleteDoc,
  Firestore,
} from "firebase/firestore";
import firebaseConfig from "@/../firebase-applet-config.json";

export interface FirestorePackage {
  id: string;
  name: string;
  subscriptionType: "DAILY" | "WEEKLY" | "MONTHLY";
  amount: number;
  durationDays: number;
  isActive: boolean;
  sortOrder: number;
  updatedAt?: string;
  createdAt?: string;
}

export interface FirestorePaper {
  id: string;
  title: string;
  description?: string | null;
  contentType: string;
  unitCode: string;
  topic: string;
  course: string;
  semester: string;
  price: number;
  filePath: string;
  isPublished: boolean;
  createdAt?: string;
  updatedAt?: string;
}

let firestoreInstance: Firestore | null = null;

export function getFirebaseDb(): Firestore | null {
  try {
    if (!firestoreInstance) {
      const app = getApps().length === 0 ? initializeApp(firebaseConfig) : getApp();
      firestoreInstance = getFirestore(app, firebaseConfig.firestoreDatabaseId);
    }
    return firestoreInstance;
  } catch (err) {
    console.error("[Firestore] Initialization error:", err);
    return null;
  }
}

/**
 * Fetch all subscription packages from Firestore (both "packages" and "subscriptionPackages" collections checked)
 */
export async function fetchPackagesFromFirestore(): Promise<FirestorePackage[]> {
  const db = getFirebaseDb();
  if (!db) return [];

  try {
    // 1. Try "packages" collection
    const snap = await getDocs(collection(db, "packages"));
    if (!snap.empty) {
      const items: FirestorePackage[] = [];
      snap.forEach((d) => {
        const data = d.data();
        items.push({
          id: data.id || d.id,
          name: data.name || "Access Pass",
          subscriptionType: (data.subscriptionType as "DAILY" | "WEEKLY" | "MONTHLY") || "DAILY",
          amount: Number(data.amount) || 49,
          durationDays: Number(data.durationDays) || 1,
          isActive: data.isActive !== false,
          sortOrder: Number(data.sortOrder) || 1,
          updatedAt: data.updatedAt,
          createdAt: data.createdAt,
        });
      });
      items.sort((a, b) => a.sortOrder - b.sortOrder || a.amount - b.amount);
      return items;
    }

    // 2. Try "subscriptionPackages" collection fallback
    const altSnap = await getDocs(collection(db, "subscriptionPackages"));
    if (!altSnap.empty) {
      const items: FirestorePackage[] = [];
      altSnap.forEach((d) => {
        const data = d.data();
        items.push({
          id: data.id || d.id,
          name: data.name || "Access Pass",
          subscriptionType: (data.subscriptionType as "DAILY" | "WEEKLY" | "MONTHLY") || "DAILY",
          amount: Number(data.amount) || 49,
          durationDays: Number(data.durationDays) || 1,
          isActive: data.isActive !== false,
          sortOrder: Number(data.sortOrder) || 1,
          updatedAt: data.updatedAt,
          createdAt: data.createdAt,
        });
      });
      items.sort((a, b) => a.sortOrder - b.sortOrder || a.amount - b.amount);
      return items;
    }

    return [];
  } catch (err) {
    console.warn("[Firestore] fetchPackages error:", err);
    return [];
  }
}

/**
 * Save or update a subscription package in Firestore (writes to both "packages" and "subscriptionPackages")
 */
export async function savePackageToFirestore(pkg: FirestorePackage): Promise<void> {
  const db = getFirebaseDb();
  if (!db) return;

  const cleanData = {
    id: pkg.id,
    name: pkg.name,
    subscriptionType: pkg.subscriptionType,
    amount: Number(pkg.amount),
    durationDays: Number(pkg.durationDays),
    isActive: pkg.isActive !== false,
    sortOrder: Number(pkg.sortOrder) || 1,
    updatedAt: new Date().toISOString(),
  };

  try {
    await Promise.allSettled([
      setDoc(doc(db, "packages", pkg.id), cleanData, { merge: true }),
      setDoc(doc(db, "subscriptionPackages", pkg.id), cleanData, { merge: true }),
    ]);
  } catch (err) {
    console.error("[Firestore] savePackage error:", err);
  }
}

/**
 * Delete a package from Firestore
 */
export async function deletePackageFromFirestore(id: string): Promise<void> {
  const db = getFirebaseDb();
  if (!db) return;

  try {
    await Promise.allSettled([
      deleteDoc(doc(db, "packages", id)),
      deleteDoc(doc(db, "subscriptionPackages", id)),
    ]);
  } catch (err) {
    console.error("[Firestore] deletePackage error:", err);
  }
}

/**
 * Fetch all papers from Firestore (excluding any marked as deleted)
 */
export async function fetchPapersFromFirestore(): Promise<FirestorePaper[]> {
  const db = getFirebaseDb();
  if (!db) return [];

  try {
    const [paperSnap, deletedSet] = await Promise.all([
      getDocs(collection(db, "papers")),
      fetchDeletedPaperIds().catch(() => new Set<string>()),
    ]);

    if (paperSnap.empty) return [];

    const papers: FirestorePaper[] = [];
    paperSnap.forEach((d) => {
      const data = d.data();
      const paperId = data.id || d.id;

      // Skip if deleted tombstone exists
      if (deletedSet.has(paperId)) return;

      papers.push({
        id: paperId,
        title: data.title || "KCSE Paper",
        description: data.description || null,
        contentType: data.contentType || "PAST_PAPER",
        unitCode: data.unitCode || "121/1",
        topic: data.topic || "General",
        course: data.course || "KCSE",
        semester: data.semester || "1",
        price: Number(data.price) >= 0 ? Number(data.price) : 50,
        filePath: data.filePath || "",
        isPublished: data.isPublished !== false,
        createdAt: data.createdAt,
        updatedAt: data.updatedAt,
      });
    });

    papers.sort((a, b) => (b.createdAt || "").localeCompare(a.createdAt || ""));
    return papers;
  } catch (err) {
    console.warn("[Firestore] fetchPapers error:", err);
    return [];
  }
}

/**
 * Fetch set of all paper IDs that have been deleted
 */
export async function fetchDeletedPaperIds(): Promise<Set<string>> {
  const db = getFirebaseDb();
  if (!db) return new Set();

  try {
    const snap = await getDocs(collection(db, "deleted_papers"));
    const set = new Set<string>();
    snap.forEach((d) => {
      set.add(d.id);
    });
    return set;
  } catch (err) {
    console.warn("[Firestore] fetchDeletedPaperIds notice:", err);
    return new Set();
  }
}

/**
 * Save or update a paper in Firestore
 */
export async function savePaperToFirestore(paper: FirestorePaper): Promise<void> {
  const db = getFirebaseDb();
  if (!db) return;

  const cleanData = {
    id: paper.id,
    title: paper.title,
    description: paper.description || null,
    contentType: paper.contentType || "PAST_PAPER",
    unitCode: paper.unitCode || "121/1",
    topic: paper.topic || "General",
    course: paper.course || "KCSE",
    semester: paper.semester || "1",
    price: Number(paper.price),
    filePath: paper.filePath || "",
    isPublished: paper.isPublished !== false,
    updatedAt: new Date().toISOString(),
    ...(paper.createdAt ? { createdAt: paper.createdAt } : { createdAt: new Date().toISOString() }),
  };

  try {
    await Promise.allSettled([
      setDoc(doc(db, "papers", paper.id), cleanData, { merge: true }),
      // Remove from deleted_papers tombstone if it was re-added or edited
      deleteDoc(doc(db, "deleted_papers", paper.id)),
    ]);
  } catch (err) {
    console.error("[Firestore] savePaper error:", err);
  }
}

/**
 * Delete a paper from Firestore completely and record tombstone
 */
export async function deletePaperFromFirestore(id: string): Promise<void> {
  const db = getFirebaseDb();
  if (!db) return;

  try {
    await Promise.allSettled([
      deleteDoc(doc(db, "papers", id)),
      deleteDoc(doc(db, "kcse_papers", id)),
      setDoc(doc(db, "deleted_papers", id), {
        id,
        deletedAt: new Date().toISOString(),
      }),
    ]);
    console.log(`[Firestore] Paper ${id} removed and added to deleted_papers registry.`);
  } catch (err) {
    console.error("[Firestore] deletePaper error:", err);
  }
}

/**
 * Ensures initial default packages and existing mock papers are mirrored in Firestore
 */
export async function seedFirestoreIfEmpty(
  defaultPackages: FirestorePackage[],
  defaultPapers: FirestorePaper[]
): Promise<void> {
  const db = getFirebaseDb();
  if (!db) return;

  try {
    const pkgSnap = await getDocs(collection(db, "packages"));
    if (pkgSnap.empty) {
      console.log("[Firestore] Seeding default packages into Firestore database...");
      for (const p of defaultPackages) {
        await savePackageToFirestore(p);
      }
    }

    const [paperSnap, deletedSet] = await Promise.all([
      getDocs(collection(db, "papers")),
      fetchDeletedPaperIds().catch(() => new Set<string>()),
    ]);

    if (paperSnap.empty && defaultPapers.length > 0) {
      console.log("[Firestore] Seeding initial papers into Firestore database...");
      for (const pp of defaultPapers) {
        if (!deletedSet.has(pp.id)) {
          await savePaperToFirestore(pp);
        }
      }
    }
  } catch (err) {
    console.warn("[Firestore] seedFirestoreIfEmpty notice:", err);
  }
}
