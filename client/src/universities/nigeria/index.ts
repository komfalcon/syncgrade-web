import type { UniversityConfig } from "../types";
import universityDb from "@/data/university_db.json";
import { appDb, type CustomUniversityEntry } from "@/storage/db";
import { DEFAULT_NIGERIAN_DEGREE_CLASSES } from "../types";

/** All Nigerian university configurations */
type UniversityDbEntry = (typeof universityDb.universities)[number];

export interface UniversityDbMeta {
  version: string;
  lastUpdated: string;
}

const baseMetadata: UniversityDbMeta = {
  version: universityDb.version,
  lastUpdated: universityDb.lastUpdated,
};

function toUniversityConfig(entry: UniversityDbEntry): UniversityConfig {
  return {
    id: entry.id,
    name: entry.name,
    shortName: entry.shortName,
    country: "Nigeria",
    location: entry.location,
    gradingSystem: {
      scale: entry.gradingSystem.scale,
      grades: entry.gradingSystem.grades.map((grade) => ({
        grade: grade.letter,
        points: grade.points,
        min: grade.min,
        max: grade.max,
      })),
    },
    degreeClasses: DEFAULT_NIGERIAN_DEGREE_CLASSES.map((degreeClass) => ({ ...degreeClass })),
    creditRules: {
      minimumCredits: 15,
      maximumPerSemester: entry.creditRules.maxUnitsPerSemester,
      minimumPerSemester: 15,
      graduationCredits: [],
    },
    repeatPolicy: {
      method: entry.repeatPolicy,
      description:
        entry.repeatPolicy === "replace"
          ? "New grade overwrites the old one in CGPA."
          : "Both attempts count toward total units/points.",
    },
    probation: {
      minCGPA: entry.creditRules.probationCGPA,
      description: `CGPA below ${entry.creditRules.probationCGPA.toFixed(2)} is probationary.`,
    },
    dismissal: {
      description: "Refer to institutional regulations for dismissal thresholds.",
    },
    maxProgramDuration: "As defined by the institution.",
    version: baseMetadata.version,
    sourceDocuments: [],
  };
}

function fromCustomEntry(entry: CustomUniversityEntry): UniversityConfig {
  return {
    id: entry.id,
    name: entry.name,
    shortName: entry.shortName,
    country: "Nigeria",
    location: entry.location,
    gradingSystem: {
      scale: entry.gradingSystem.scale,
      grades: entry.gradingSystem.grades.map((grade) => ({
        grade: grade.letter,
        points: grade.points,
        min: grade.min,
        max: grade.max,
      })),
    },
    degreeClasses: DEFAULT_NIGERIAN_DEGREE_CLASSES.map((degreeClass) => ({ ...degreeClass })),
    creditRules: {
      minimumCredits: 15,
      maximumPerSemester: entry.creditRules.maxUnitsPerSemester,
      minimumPerSemester: 15,
      graduationCredits: [],
    },
    repeatPolicy: {
      method: entry.repeatPolicy,
      description:
        entry.repeatPolicy === "replace"
          ? "New grade overwrites the old one in CGPA."
          : "Both attempts count toward total units/points.",
    },
    probation: {
      minCGPA: entry.creditRules.probationCGPA,
      description: `CGPA below ${entry.creditRules.probationCGPA.toFixed(2)} is probationary.`,
    },
    dismissal: {
      description: "Refer to custom institution policy settings.",
    },
    maxProgramDuration: "Custom profile",
    version: "custom",
    sourceDocuments: ["Local custom profile"],
  };
}

export const nigerianUniversities: UniversityConfig[] = universityDb.universities.map(toUniversityConfig);
let mergedUniversities: UniversityConfig[] = [...nigerianUniversities];

export async function getCustomUniversities(): Promise<UniversityConfig[]> {
  const custom = await appDb.customUniversities.toArray();
  return custom.map(fromCustomEntry);
}

/** Returns merged static and local custom universities. */
export async function getUnifiedUniversities(): Promise<UniversityConfig[]> {
  const custom = await getCustomUniversities();
  mergedUniversities = [...nigerianUniversities, ...custom];
  return mergedUniversities;
}

export function getUniversityDbMeta(): UniversityDbMeta {
  return baseMetadata;
}

/** Retrieve a university configuration by its unique id */
export function getUniversityById(id: string): UniversityConfig | undefined {
  return mergedUniversities.find((u) => u.id === id);
}

/** Return every registered university configuration */
export function getAllUniversities(): UniversityConfig[] {
  return mergedUniversities;
}
