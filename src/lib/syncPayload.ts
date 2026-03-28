import { getSyncgradeUserProfile } from "@/storage/db";

type JsonObject = Record<string, unknown>;

export interface SyncHeaderPayload {
  uuid: string;
  name: string;
  timestamp: string;
}

export interface SyncPayload<T extends JsonObject> {
  user: SyncHeaderPayload;
  data: T;
}

export async function getSyncPayload<T extends JsonObject>(data: T): Promise<SyncPayload<T>> {
  const identity = await getSyncgradeUserProfile();
  if (!identity) {
    throw new Error("Sync identity not initialized");
  }

  return {
    user: {
      uuid: identity.uuid,
      name: identity.name,
      timestamp: new Date().toISOString(),
    },
    data,
  };
}
