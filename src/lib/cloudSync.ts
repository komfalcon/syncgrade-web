import { getStoredValue, setStoredValue, STORAGE_KEYS, getSyncgradeUserProfile } from "@/storage/db";
import type { AcademicData } from "@/types/sync";
import { auth, db, isConfigured } from "./firebase";
import { doc, getDoc, setDoc } from "firebase/firestore";

export const FIRST_SYNC_SUCCESS_KEY = "syncgrade-first-cloud-sync-success";
export const FIRST_SYNC_SUCCESS_EVENT = "syncgrade:first-sync-success";

export interface SyncResult {
  success: boolean;
  code?: string;
  error?: string;
}

export async function syncAcademicSnapshot(force = false): Promise<SyncResult> {
  if (!isConfigured) {
    return { success: false, error: "Firebase is not configured. Set VITE_FIREBASE_* environment variables." };
  }

  try {
    const currentUser = auth.currentUser;
    if (!currentUser) return { success: false, error: "You must be signed in to sync data to the cloud." };

    const rawData = await getStoredValue(STORAGE_KEYS.cgpaData);
    const parsed = rawData ? (JSON.parse(rawData) as AcademicData) : {};
    
    // Read profile settings from IndexedDB
    const settingsRaw = await getStoredValue(STORAGE_KEYS.settings);
    const settings = settingsRaw ? JSON.parse(settingsRaw) : {};

    const userDocRef = doc(db, "students", currentUser.uid);

    // Overwrite Prevention
    if (!force) {
      const docSnap = await getDoc(userDocRef);
      if (docSnap.exists()) {
        const existingData = docSnap.data();
        if (existingData.academic_data && parsed) {
          const oldSems = Array.isArray(existingData.academic_data.semesters) 
            ? existingData.academic_data.semesters.length 
            : 0;
          const incomingSems = Array.isArray(parsed.semesters) 
            ? parsed.semesters.length 
            : 0;

          if (incomingSems < oldSems) {
            return { success: false, code: "OVERWRITE_PREVENTED" };
          }
        }
      }
    }

    const lastSync = new Date().toISOString();
    await setDoc(userDocRef, {
      name: settings.studentName || currentUser.displayName || "",
      department: settings.programme || "",
      university: settings.activeUniversity || "",
      last_sync: lastSync,
      academic_data: parsed,
    }, { merge: true });

    await setStoredValue("syncgrade_last_sync_time", lastSync);
    await setStoredValue("syncgrade_jwt_token", "firebase_authenticated");

    localStorage.setItem(FIRST_SYNC_SUCCESS_KEY, "1");
    await setStoredValue(FIRST_SYNC_SUCCESS_KEY, "1");
    window.dispatchEvent(new Event(FIRST_SYNC_SUCCESS_EVENT));
    return { success: true };
  } catch (e: any) {
    console.error("Firestore sync failed", e);
    return { success: false, error: e.message || "Failed to sync to cloud." };
  }
}

export async function restoreUserProfile(uid: string): Promise<any | null> {
  if (!isConfigured) return null;
  try {
    const userDocRef = doc(db, "students", uid);
    const docSnap = await getDoc(userDocRef);
    if (docSnap.exists()) {
      return docSnap.data();
    }
    return null;
  } catch (e) {
    console.error("Failed to fetch user profile from Firestore", e);
    return null;
  }
}

/**
 * Automatically migrates any active D1 student sync profile to Firebase Firestore
 * during background launch when a user signs in, ensuring complete backward compatibility.
 */
export async function migrateD1DataToFirebaseUser(currentUser: any): Promise<void> {
  if (typeof window === "undefined" || !isConfigured || !currentUser) return;

  const migrated = localStorage.getItem("syncgrade_firebase_migrated");
  if (migrated === "true") return;

  const identity = await getSyncgradeUserProfile();
  const password = await getStoredValue("syncgrade_sync_password");
  
  if (!identity || !password) {
    // No local sync profile configured, mark as migrated
    localStorage.setItem("syncgrade_firebase_migrated", "true");
    return;
  }

  const baseEndpoint = import.meta.env.VITE_STUDENT_SYNC_ENDPOINT ?? "/api/student-sync";
  const restoreEndpoint = `${baseEndpoint}/restore`;

  try {
    const response = await fetch(restoreEndpoint, {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ uuid: identity.uuid, password }),
    });

    if (response.ok) {
      const resJson = await response.json() as { success: boolean; student: any };
      const student = resJson.student;

      if (student && student.academic_data) {
        const userDocRef = doc(db, "students", currentUser.uid);
        await setDoc(userDocRef, {
          name: student.name || currentUser.displayName || "",
          department: student.department || "",
          university: student.university || "",
          last_sync: student.last_sync || new Date().toISOString(),
          academic_data: student.academic_data,
        }, { merge: true });

        console.info("Firebase Migration: Successfully migrated D1 student profile to Firestore.");
      }
    }
  } catch (err) {
    console.warn("D1 to Firebase migration background workflow deferred: ", err);
  } finally {
    localStorage.setItem("syncgrade_firebase_migrated", "true");
  }
}
