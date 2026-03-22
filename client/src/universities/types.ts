/**
 * University configuration types for the CGPA academic platform.
 * Each university config is a standalone, validated data structure
 * that the engine layer consumes without hard-coding any university-specific logic.
 */

export interface GradeRange {
  grade: string;
  min: number;
  max: number;
  points: number;
}

export interface DegreeClass {
  name: string;
  minCGPA: number;
  maxCGPA: number;
}

export interface CreditRules {
  minimumCredits: number;
  maximumPerSemester: number;
  minimumPerSemester: number;
  graduationCredits: { min: number; max: number; programYears: number }[];
}

export interface RepeatPolicy {
  method: "replace" | "average" | "both" | "highest";
  description: string;
}

export interface UniversityConfig {
  id: string;
  name: string;
  shortName: string;
  country: string;
  location: string;
  gradingSystem: {
    scale: number;
    grades: GradeRange[];
  };
  degreeClasses: DegreeClass[];
  creditRules: CreditRules;
  repeatPolicy: RepeatPolicy;
  probation: {
    minCGPA: number;
    description: string;
  };
  dismissal: {
    description: string;
  };
  maxProgramDuration: string;
  version: string;
  sourceDocuments: string[];
}

/** Default 5-point Nigerian grading scale (NUC standard) */
export const DEFAULT_NIGERIAN_GRADES: GradeRange[] = SHARED_DEFAULT_NIGERIAN_GRADES.map(
  (grade) => ({ ...grade }),
);

/** Default 5-point Nigerian degree classification */
export const DEFAULT_NIGERIAN_DEGREE_CLASSES: DegreeClass[] =
  SHARED_DEFAULT_NIGERIAN_DEGREE_CLASSES.map((degreeClass) => ({
    ...degreeClass,
  }));
import {
  DEFAULT_NIGERIAN_DEGREE_CLASSES as SHARED_DEFAULT_NIGERIAN_DEGREE_CLASSES,
  DEFAULT_NIGERIAN_GRADES as SHARED_DEFAULT_NIGERIAN_GRADES,
} from "@shared/const";
