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
  method: "replace" | "average" | "both";
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
export const DEFAULT_NIGERIAN_GRADES: GradeRange[] = [
  { grade: "A", min: 70, max: 100, points: 5.0 },
  { grade: "B", min: 60, max: 69, points: 4.0 },
  { grade: "C", min: 50, max: 59, points: 3.0 },
  { grade: "D", min: 45, max: 49, points: 2.0 },
  { grade: "E", min: 40, max: 44, points: 1.0 },
  { grade: "F", min: 0, max: 39, points: 0.0 },
];

/** Default 5-point Nigerian degree classification */
export const DEFAULT_NIGERIAN_DEGREE_CLASSES: DegreeClass[] = [
  { name: "First Class", minCGPA: 4.50, maxCGPA: 5.00 },
  { name: "Second Class Upper", minCGPA: 3.50, maxCGPA: 4.49 },
  { name: "Second Class Lower", minCGPA: 2.40, maxCGPA: 3.49 },
  { name: "Third Class", minCGPA: 1.50, maxCGPA: 2.39 },
  { name: "Pass", minCGPA: 1.00, maxCGPA: 1.49 },
  { name: "Fail", minCGPA: 0.00, maxCGPA: 0.99 },
];
