import Dexie, { type Table } from "dexie";
import type { RepeatPolicy, UniversityConfig } from "@/universities/types";
import type { UserIdentity } from "@/types/sync";

export interface KvEntry {
  key: string;
  value: string;
  updatedAt: number;
}

export interface CustomUniversityEntry {
  id: string;
  name: string;
  shortName: string;
  location: string;
  gradingSystem: Array<{
    session_start: string;
    session_end: string;
    scale: 4 | 5;
    grades: Array<{
      letter: string;
      points: number;
      min: number;
      max: number;
    }>;
  }>;
  repeatPolicy: RepeatPolicy["method"];
  creditRules: {
    maxUnitsPerSemester: number;
    probationCGPA: number;
  };
  createdAt: number;
  updatedAt: number;
}

export interface UserProfileEntry {
  id: string;
  universityId: string;
  universityShortName: string;
  universityName: string;
  admissionSession: string;
  repeatPolicy: RepeatPolicy["method"];
  configuration: UniversityConfig;
  updatedAt: number;
}

export interface SyncgradeUserProfileEntry extends UserIdentity {
  updatedAt: number;
}

class AppDb extends Dexie {
  kv!: Table<KvEntry, string>;
  customUniversities!: Table<CustomUniversityEntry, string>;
  userProfile!: Table<UserProfileEntry, string>;
  user_profile!: Table<SyncgradeUserProfileEntry, string>;

  constructor() {
    super("cgpa_app_db");
    this.version(1).stores({
      kv: "key,updatedAt",
    });
    this.version(2).stores({
      kv: "key,updatedAt",
      customUniversities: "id,shortName,updatedAt",
    });
    this.version(3).stores({
      kv: "key,updatedAt",
      customUniversities: "id,shortName,updatedAt",
      userProfile: "id,updatedAt,universityShortName",
    });
    this.version(4).stores({
      kv: "key,updatedAt",
      customUniversities: "id,shortName,updatedAt",
      userProfile: "id,updatedAt,universityShortName",
      user_profile: "uuid,updatedAt,university",
    });
  }
}

export const appDb = new AppDb();

export const STORAGE_KEYS = {
  cgpaData: "cgpa-calculator-data",
  settings: "cgpa-calculator-settings",
  predictions: "cgpa-saved-predictions",
  syncgradeUser: "syncgrade_user",
} as const;

export async function getStoredValue(key: string): Promise<string | null> {
  const item = await appDb.kv.get(key);
  return item?.value ?? null;
}

export async function setStoredValue(key: string, value: string): Promise<void> {
  await appDb.kv.put({ key, value, updatedAt: Date.now() });
}

export async function removeStoredValue(key: string): Promise<void> {
  await appDb.kv.delete(key);
}

export function getSyncgradeUserFromLocalStorage(): SyncgradeUserProfileEntry | null {
  if (typeof window === "undefined") return null;
  const raw = localStorage.getItem(STORAGE_KEYS.syncgradeUser);
  if (!raw) return null;
  try {
    const parsed = JSON.parse(raw) as Partial<SyncgradeUserProfileEntry>;
    if (!parsed.uuid || !parsed.name || !parsed.department || !parsed.university) {
      return null;
    }
    return {
      uuid: parsed.uuid,
      name: parsed.name,
      department: parsed.department,
      university: parsed.university,
      updatedAt: parsed.updatedAt ?? Date.now(),
    };
  } catch {
    localStorage.removeItem(STORAGE_KEYS.syncgradeUser);
    return null;
  }
}

export async function saveSyncgradeUserProfile(
  profile: Omit<SyncgradeUserProfileEntry, "updatedAt">,
): Promise<SyncgradeUserProfileEntry> {
  const next: SyncgradeUserProfileEntry = {
    ...profile,
    updatedAt: Date.now(),
  };
  await appDb.user_profile.put(next);
  if (typeof window !== "undefined") {
    localStorage.setItem(STORAGE_KEYS.syncgradeUser, JSON.stringify(next));
  }
  return next;
}

export async function getSyncgradeUserProfile(): Promise<SyncgradeUserProfileEntry | null> {
  const local = getSyncgradeUserFromLocalStorage();
  if (local) return local;

  const latest = await appDb.user_profile.orderBy("updatedAt").last();
  if (!latest) return null;

  const identity: SyncgradeUserProfileEntry = {
    uuid: latest.uuid,
    name: latest.name,
    department: latest.department,
    university: latest.university,
    updatedAt: latest.updatedAt,
  };

  if (typeof window !== "undefined") {
    localStorage.setItem(STORAGE_KEYS.syncgradeUser, JSON.stringify(identity));
  }

  return identity;
}
