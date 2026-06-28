import { getSyncPayload } from "@/lib/syncPayload";
import { getStoredValue, setStoredValue, STORAGE_KEYS, getSyncgradeUserProfile } from "@/storage/db";
import type { AcademicData } from "@/types/sync";

export const FIRST_SYNC_SUCCESS_KEY = "syncgrade-first-cloud-sync-success";
export const FIRST_SYNC_SUCCESS_EVENT = "syncgrade:first-sync-success";

const DEFAULT_SYNC_ENDPOINT = "/api/student-sync";

export interface SyncResult {
  success: boolean;
  code?: string;
  error?: string;
}

export async function syncAcademicSnapshot(force = false): Promise<SyncResult> {
  try {
    const identity = await getSyncgradeUserProfile();
    if (!identity) return { success: false, error: "Sync identity not initialized" };

    const rawData = await getStoredValue(STORAGE_KEYS.cgpaData);
    const parsed = rawData ? (JSON.parse(rawData) as AcademicData) : {};
    const payload = await getSyncPayload({
      department: identity.department,
      university: identity.university,
      academic_data: parsed,
    });

    const token = await getStoredValue("syncgrade_jwt_token");
    const password = await getStoredValue("syncgrade_sync_password");

    const fullPayload = {
      ...payload,
      ...(password ? { password } : {}),
      ...(force ? { force: true } : {}),
    };

    const endpoint = import.meta.env.VITE_STUDENT_SYNC_ENDPOINT ?? DEFAULT_SYNC_ENDPOINT;
    const response = await fetch(endpoint, {
      method: "POST",
      headers: {
        "content-type": "application/json",
        ...(token ? { "Authorization": `Bearer ${token}` } : {}),
      },
      body: JSON.stringify(fullPayload),
    });

    if (response.status === 409) {
      const resData = await response.json() as { code?: string };
      if (resData.code === "OVERWRITE_PREVENTED") {
        return { success: false, code: "OVERWRITE_PREVENTED" };
      }
    }

    if (!response.ok) {
      const errData = await response.json() as { error?: string };
      return { success: false, error: errData.error || "Sync failed" };
    }

    const resJson = await response.json() as { success: boolean; token?: string; last_sync?: string };

    if (resJson.token) {
      await setStoredValue("syncgrade_jwt_token", resJson.token);
    }
    if (resJson.last_sync) {
      await setStoredValue("syncgrade_last_sync_time", resJson.last_sync);
    }

    localStorage.setItem(FIRST_SYNC_SUCCESS_KEY, "1");
    await setStoredValue(FIRST_SYNC_SUCCESS_KEY, "1");
    window.dispatchEvent(new Event(FIRST_SYNC_SUCCESS_EVENT));
    return { success: true };
  } catch (e) {
    return { success: false, error: "Network error occurred during sync" };
  }
}

export interface RestoreResult {
  success: boolean;
  error?: string;
  token?: string;
  student?: {
    uuid: string;
    name: string;
    department: string;
    university: string;
    last_sync: string;
    academic_data: any;
  };
}

export async function restoreFromCloud(uuid: string, password: string): Promise<RestoreResult> {
  const baseEndpoint = import.meta.env.VITE_STUDENT_SYNC_ENDPOINT ?? DEFAULT_SYNC_ENDPOINT;
  const endpoint = `${baseEndpoint}/restore`;
  try {
    const response = await fetch(endpoint, {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ uuid, password }),
    });

    if (!response.ok) {
      const errData = await response.json() as { error?: string };
      return { success: false, error: errData.error || "Failed to restore data" };
    }

    const resJson = await response.json() as { success: boolean; token: string; student: any };
    return {
      success: true,
      token: resJson.token,
      student: resJson.student,
    };
  } catch (e) {
    return { success: false, error: "Network or server connection error" };
  }
}
