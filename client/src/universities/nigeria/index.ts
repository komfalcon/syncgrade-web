import type { UniversityConfig } from "../types";
import universityDb from "@/data/university_db.json";

/** All Nigerian university configurations */
export const nigerianUniversities: UniversityConfig[] =
  universityDb.universities as UniversityConfig[];

/** Retrieve a university configuration by its unique id */
export function getUniversityById(id: string): UniversityConfig | undefined {
  return nigerianUniversities.find((u) => u.id === id);
}

/** Return every registered university configuration */
export function getAllUniversities(): UniversityConfig[] {
  return nigerianUniversities;
}
