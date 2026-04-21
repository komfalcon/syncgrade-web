import type { SessionGradingSystem, UniversityConfig } from "../types";
import universityDb from "@/data/university_db.json";
import { appDb, type CustomUniversityEntry } from "@/storage/db";
import { DEFAULT_NIGERIAN_DEGREE_CLASSES } from "../types";
import {
  resolveGradingTemplate,
  type GradingTemplateId,
} from "./gradingTemplates";

/** All Nigerian university configurations */
type UniversityDbSession = {
  session_start: string;
  session_end: string;
  /**
   * Preferred compact form for standardized grading setups.
   * If present, grading values are resolved from gradingTemplates.ts.
   * Inline scale/grades remain supported for legacy or custom rows.
   */
  templateId?: string;
  scale?: number;
  grades?: Array<{
    letter: string;
    points: number;
    min: number;
    max: number;
  }>;
};

type UniversityDbEntry = {
  id: string;
  name: string;
  acronym: string;
  location: string;
  type?: "university" | "polytechnic" | "college";
  templateId?: string;
  configurations?: Array<{
    sessionRange: string;
    templateId: string;
  }>;
  academic_rules: {
    max_credit_load: number;
    probation_cgpa: number;
    repeat_policy: string;
  };
};

const universityEntries = universityDb.universities as UniversityDbEntry[];

function toSessionGradingSystem(session: UniversityDbSession): SessionGradingSystem {
  if (session.templateId) {
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
    scale: session.scale ?? 5,
    grades: (session.grades ?? []).map((grade) => ({
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
  version: (universityDb as { version?: string }).version ?? "1.0.0",
  lastUpdated:
    (universityDb as { lastUpdated?: string }).lastUpdated ?? "2026-01-01T00:00:00.000Z",
};

const NCCE_NCE_CLASSES = [
  { name: "Distinction", minCGPA: 4.5, maxCGPA: 5.0 },
  { name: "Credit", minCGPA: 3.5, maxCGPA: 4.49 },
  { name: "Merit", minCGPA: 2.5, maxCGPA: 3.49 },
  { name: "Pass", minCGPA: 1.5, maxCGPA: 2.49 },
  { name: "Low Pass", minCGPA: 1.0, maxCGPA: 1.49 },
  { name: "Fail", minCGPA: 0.0, maxCGPA: 0.99 },
] as const;


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

function parseSessionRange(sessionRange: string): UniversityDbSession {
  const [startRaw, endRaw] = sessionRange.split("-").map((part) => part.trim());
  return {
    session_start: startRaw || "2000/2001",
    session_end: (endRaw || "present").toLowerCase() === "present" ? "present" : endRaw,
  };
}

function buildDbSessions(entry: UniversityDbEntry): UniversityDbSession[] {
  if (entry.configurations?.length) {
    return entry.configurations.map((configuration) => ({
      ...parseSessionRange(configuration.sessionRange),
      templateId: configuration.templateId,
    }));
  }

  return [
    {
      session_start: "2000/2001",
      session_end: "present",
      templateId: entry.templateId,
    },
  ];
}

function toUniversityConfig(entry: UniversityDbEntry): UniversityConfig {
  const repeatPolicy = normalizeRepeatPolicy(entry.academic_rules.repeat_policy);
  return {
    id: entry.id,
    name: entry.name,
    shortName: entry.acronym,
    type: entry.type,
    country: "Nigeria",
    location: entry.location,
    gradingSystem: buildDbSessions(entry).map((session) => toSessionGradingSystem(session)),
    degreeClasses:
      entry.type === "college"
        ? NCCE_NCE_CLASSES.map((degreeClass) => ({ ...degreeClass }))
        : DEFAULT_NIGERIAN_DEGREE_CLASSES.map((degreeClass) => ({ ...degreeClass })),
    creditRules: {
      minimumCredits: 15,
      maximumPerSemester: entry.academic_rules.max_credit_load,
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
      minCGPA: entry.academic_rules.probation_cgpa,
      description: `CGPA below ${entry.academic_rules.probation_cgpa.toFixed(2)} is probationary.`,
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

export const nigerianUniversities: UniversityConfig[] = universityEntries
  .map(toUniversityConfig)
  .sort((a, b) => a.name.localeCompare(b.name, 'en', { sensitivity: 'base' }));
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
