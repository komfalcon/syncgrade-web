import type { SessionGradingSystem, UniversityConfig } from "../types";
import universityDb from "@/data/university_db.json";
import { appDb, type CustomUniversityEntry } from "@/storage/db";
import { DEFAULT_NIGERIAN_DEGREE_CLASSES } from "../types";
import {
  resolveGradingTemplate,
  type GradingTemplateId,
} from "./gradingTemplates";

/** All Nigerian university configurations */
type UniversityDbEntry = (typeof universityDb.universities)[number];
type UniversityDbSession = UniversityDbEntry["gradingSystem"][number];

function toSessionGradingSystem(session: UniversityDbSession): SessionGradingSystem {
  if ("templateId" in session && session.templateId) {
    const template = resolveGradingTemplate(session.templateId as GradingTemplateId);
    return {
      session_start: session.session_start,
      session_end: session.session_end,
      scale: template.scale,
      grades: template.grades,
    };
  }

  return {
    session_start: session.session_start,
    session_end: session.session_end,
    scale: session.scale,
    grades: session.grades.map((grade) => ({
      grade: grade.letter,
      points: grade.points,
      min: grade.min,
      max: grade.max,
    })),
  };
}

export interface UniversityDbMeta {
  version: string;
  lastUpdated: string;
}

const baseMetadata: UniversityDbMeta = {
  version: universityDb.version,
  lastUpdated: universityDb.lastUpdated,
};


function normalizeSessionLabel(value: string): string {
  return value.trim().toLowerCase();
}

function parseSessionStartYear(value: string): number | null {
  const match = value.match(/^(\d{4})\/(\d{4})$/);
  if (!match) return null;
  const first = Number(match[1]);
  const second = Number(match[2]);
  if (second !== first + 1) return null;
  return first;
}

function selectGradingSystemByAdmissionSession(
  systems: SessionGradingSystem[],
  admissionSession: string | null,
): SessionGradingSystem {
  if (!systems.length) {
    return {
      session_start: "2000/2001",
      session_end: "present",
      scale: 5,
      grades: [],
    };
  }

  const sorted = [...systems].sort((a, b) => {
    const ay = parseSessionStartYear(a.session_start) ?? Number.NEGATIVE_INFINITY;
    const by = parseSessionStartYear(b.session_start) ?? Number.NEGATIVE_INFINITY;
    return ay - by;
  });

  if (!admissionSession) return sorted[sorted.length - 1];

  const target = normalizeSessionLabel(admissionSession);
  const exact = sorted.find((s) => normalizeSessionLabel(s.session_start) === target);
  if (exact) return exact;

  const targetYear = parseSessionStartYear(admissionSession);
  if (targetYear == null) return sorted[sorted.length - 1];

  let chosen = sorted[0];
  for (const system of sorted) {
    const startYear = parseSessionStartYear(system.session_start);
    if (startYear == null) {
      continue;
    }
    if (startYear <= targetYear) {
      chosen = system;
    } else {
      break;
    }
  }
  return chosen;
}

function normalizeRepeatPolicy(value: string): "replace" | "both" {
  return value === "both" ? "both" : "replace";
}

function toUniversityConfig(entry: UniversityDbEntry): UniversityConfig {
  const repeatPolicy = normalizeRepeatPolicy(entry.repeatPolicy);
  return {
    id: entry.id,
    name: entry.name,
    shortName: entry.shortName,
    country: "Nigeria",
    location: entry.location,
    gradingSystem: entry.gradingSystem.map((session) => toSessionGradingSystem(session)),
    degreeClasses: DEFAULT_NIGERIAN_DEGREE_CLASSES.map((degreeClass) => ({ ...degreeClass })),
    creditRules: {
      minimumCredits: 15,
      maximumPerSemester: entry.creditRules.maxUnitsPerSemester,
      minimumPerSemester: 15,
      graduationCredits: [],
    },
    repeatPolicy: {
      method: repeatPolicy,
      description:
        repeatPolicy === "replace"
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
    gradingSystem: entry.gradingSystem.map((session) => ({
      session_start: session.session_start,
      session_end: session.session_end,
      scale: session.scale,
      grades: session.grades.map((grade) => ({
        grade: grade.letter,
        points: grade.points,
        min: grade.min,
        max: grade.max,
      })),
    })),
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


export function resolveUniversityGradingSystem(
  university: UniversityConfig,
  admissionSession: string | null,
): SessionGradingSystem {
  return selectGradingSystemByAdmissionSession(university.gradingSystem, admissionSession);
}
