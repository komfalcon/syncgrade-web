import { getSyncPayload } from "@/lib/syncPayload";
import { getStoredValue, setStoredValue, STORAGE_KEYS, getSyncgradeUserProfile } from "@/storage/db";
import type { AcademicData } from "@/types/sync";

export const FIRST_SYNC_SUCCESS_KEY = "syncgrade-first-cloud-sync-success";
export const FIRST_SYNC_SUCCESS_EVENT = "syncgrade:first-sync-success";

const DEFAULT_SYNC_ENDPOINT = "/api/student-sync";

export async function syncAcademicSnapshot(): Promise<boolean> {
  const identity = await getSyncgradeUserProfile();
  if (!identity) return false;

  const rawData = await getStoredValue(STORAGE_KEYS.cgpaData);
  const parsed = rawData ? (JSON.parse(rawData) as AcademicData) : {};
  const payload = await getSyncPayload({
    department: identity.department,
    university: identity.university,
    academic_data: parsed,
  });

  const endpoint = import.meta.env.VITE_STUDENT_SYNC_ENDPOINT ?? DEFAULT_SYNC_ENDPOINT;
  const response = await fetch(endpoint, {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify(payload),
  });

  if (!response.ok) {
    return false;
  }

  localStorage.setItem(FIRST_SYNC_SUCCESS_KEY, "1");
  await setStoredValue(FIRST_SYNC_SUCCESS_KEY, "1");
  window.dispatchEvent(new Event(FIRST_SYNC_SUCCESS_EVENT));
  return true;
}
