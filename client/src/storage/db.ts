import Dexie, { type Table } from "dexie";

export interface KvEntry {
  key: string;
  value: string;
  updatedAt: number;
}

class AppDb extends Dexie {
  kv!: Table<KvEntry, string>;

  constructor() {
    super("cgpa_app_db");
    this.version(1).stores({
      kv: "key,updatedAt",
    });
  }
}

export const appDb = new AppDb();

export const STORAGE_KEYS = {
  cgpaData: "cgpa-calculator-data",
  settings: "cgpa-calculator-settings",
  predictions: "cgpa-saved-predictions",
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
