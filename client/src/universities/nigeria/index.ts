import type { UniversityConfig } from "../types";
import { abuConfig } from "./abu";
import { covenantConfig } from "./covenant";
import { funaabConfig } from "./funaab";
import { futminnaConfig } from "./futminna";
import { oauConfig } from "./oau";
import { uiConfig } from "./ui";
import { unibenConfig } from "./uniben";
import { unnConfig } from "./unn";

export {
  abuConfig,
  covenantConfig,
  funaabConfig,
  futminnaConfig,
  oauConfig,
  uiConfig,
  unibenConfig,
  unnConfig,
};

/** All Nigerian university configurations */
export const nigerianUniversities: UniversityConfig[] = [
  abuConfig,
  covenantConfig,
  funaabConfig,
  futminnaConfig,
  oauConfig,
  uiConfig,
  unibenConfig,
  unnConfig,
];

/** Retrieve a university configuration by its unique id */
export function getUniversityById(id: string): UniversityConfig | undefined {
  return nigerianUniversities.find((u) => u.id === id);
}

/** Return every registered university configuration */
export function getAllUniversities(): UniversityConfig[] {
  return nigerianUniversities;
}
