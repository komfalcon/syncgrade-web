import { getSyncPayload } from "@/lib/syncPayload";
import { getStoredValue, setStoredValue, STORAGE_KEYS } from "@/storage/db";
import type { AcademicData } from "@/types/sync";

export const FIRST_SYNC_SUCCESS_KEY = "syncgrade-first-cloud-sync-success";

const DEFAULT_SYNC_ENDPOINT = "/api/student-sync";

export async function syncAcademicSnapshot(): Promise<boolean> {
  const rawData = await getStoredValue(STORAGE_KEYS.cgpaData);
  const parsed = rawData ? (JSON.parse(rawData) as AcademicData) : {};
  const payload = await getSyncPayload<{
    department: string;
    university: string;
    academic_data: AcademicData;
  }>({
    department: "",
    university: "",
    academic_data: parsed,
  });

  const profileRaw = localStorage.getItem(STORAGE_KEYS.syncgradeUser);
  if (profileRaw) {
    try {
      const profile = JSON.parse(profileRaw) as { department?: string; university?: string };
      payload.data.department = profile.department ?? "";
      payload.data.university = profile.university ?? "";
    } catch {
      payload.data.department = "";
      payload.data.university = "";
    }
  }

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
  return true;
}
