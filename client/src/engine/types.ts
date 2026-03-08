/**
 * Engine-specific types for CGPA calculations.
 * These types are used by the pure calculation functions.
 */

export interface CourseInput {
  name: string;
  credits: number;
  grade: string;
  isCarryover?: boolean;
  semester?: string;
}

export interface CourseResult {
  name: string;
  credits: number;
  grade: string;
  gradePoints: number;
  qualityPoints: number; // gradePoints * credits
}

export interface GPAResult {
  gpa: number;
  totalCredits: number;
  totalQualityPoints: number;
  courses: CourseResult[];
}

export interface CGPAResult {
  cgpa: number;
  totalCredits: number;
  totalQualityPoints: number;
  semesterResults: {
    semester: string;
    gpa: number;
    credits: number;
    qualityPoints: number;
  }[];
}

export interface ProjectionResult {
  currentCGPA: number;
  targetCGPA: number;
  requiredGPA: number;
  isAchievable: boolean;
  remainingCredits: number;
  completedCredits: number;
}

export interface WhatIfScenario {
  courses: CourseInput[];
  semesterName: string;
}

export interface WhatIfResult {
  originalCGPA: number;
  projectedCGPA: number;
  semesterGPA: number;
  change: number;
  newTotalCredits: number;
  degreeClass: string;
  previousDegreeClass: string;
}

export interface CarryoverImpactResult {
  currentCGPA: number;
  projectedCGPA: number;
  cgpaChange: number;
  coursesAnalyzed: {
    name: string;
    credits: number;
    originalGrade: string;
    originalPoints: number;
    newGrade: string;
    newPoints: number;
    creditImpact: number;
  }[];
}

export interface DegreeRiskLevel {
  level: "safe" | "warning" | "danger" | "critical";
  message: string;
  currentClass: string;
  nextClassDown: string | null;
  cgpaToNextClassDown: number;
  cgpaToNextClassUp: number | null;
}

export interface BestWorstProjection {
  bestCase: {
    cgpa: number;
    degreeClass: string;
    gpaNeeded: number;
  };
  worstCase: {
    cgpa: number;
    degreeClass: string;
  };
  currentCase: {
    cgpa: number;
    degreeClass: string;
  };
  remainingCredits: number;
}

export interface StudyLoadRecommendation {
  recommendedCredits: number;
  targetGPA: number;
  courses: { credits: number; minGrade: string }[];
  reason: string;
}

export interface PerformanceTrend {
  semester: string;
  gpa: number;
  cgpa: number;
  credits: number;
  trend: "improving" | "declining" | "stable";
  improvementMarker?: string;
}
