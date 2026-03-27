import {
  GradeRange,
  DegreeClass,
  UniversityConfig,
} from "../universities/types";
import {
  CourseInput,
  CourseResult,
  GPAResult,
  CGPAResult,
  ProjectionResult,
  WhatIfScenario,
  WhatIfResult,
  CarryoverImpactResult,
  DegreeRiskLevel,
  BestWorstProjection,
  StudyLoadRecommendation,
  PerformanceTrend,
} from "./types";

// How quickly the safety buffer decays as the student progresses (0 = no decay, 1 = full).
const BUFFER_DECAY_RATE = 0.5;

// Minimum GPA delta between semesters to be considered a meaningful change.
const TREND_THRESHOLD = 0.1;

// Default credit weight per course when building study-load recommendations.
const DEFAULT_COURSE_CREDITS = 3;

/** Round a number to `dp` decimal places. */
function round(value: number, dp = 2): number {
  const factor = Math.pow(10, dp);
  const epsilon = value >= 0 ? Number.EPSILON : -Number.EPSILON;
  return Math.round((value + epsilon) * factor) / factor;
}

/**
 * Look up grade points for a grade letter using the grading system.
 * Returns 0 when the grade is not found.
 */
export function getGradePoints(grade: string, grades: GradeRange[]): number {
  const normalised = grade.trim().toUpperCase();
  const match = grades.find((g) => g.grade.toUpperCase() === normalised);
  return match ? match.points : 0;
}

/**
 * Look up the grade letter for a numeric score.
 * Returns null when no matching range is found.
 */
export function getGradeForScore(
  score: number,
  grades: GradeRange[]
): string | null {
  const match = grades.find((g) => score >= g.min && score <= g.max);
  return match ? match.grade : null;
}

/**
 * Calculate GPA for a single set of courses.
 * GPA = Σ(gradePoints × credits) / Σ(credits)
 */
export function calculateGPA(
  courses: CourseInput[],
  grades: GradeRange[]
): GPAResult {
  if (courses.length === 0) {
    return { gpa: 0, totalCredits: 0, totalQualityPoints: 0, courses: [] };
  }

  const results: CourseResult[] = courses.map((c) => {
    const gradePoints = getGradePoints(c.grade, grades);
    return {
      name: c.name,
      credits: c.credits,
      grade: c.grade,
      gradePoints,
      qualityPoints: round(gradePoints * c.credits),
    };
  });

  const totalCredits = results.reduce((sum, r) => sum + r.credits, 0);
  const totalQualityPoints = results.reduce(
    (sum, r) => sum + r.qualityPoints,
    0
  );

  return {
    gpa: totalCredits > 0 ? round(totalQualityPoints / totalCredits) : 0,
    totalCredits,
    totalQualityPoints: round(totalQualityPoints),
    courses: results,
  };
}

/**
 * Calculate cumulative GPA across multiple semesters.
 * Handles carryover courses based on the provided repeat policy:
 *   - "replace": the new attempt fully replaces the old quality points
 *   - "average": old and new quality points are averaged
 *   - "both":    both attempts count (credits and QP are additive)
 */
export function calculateCGPA(
  semesters: { name: string; courses: CourseInput[] }[],
  grades: GradeRange[],
  repeatPolicy: "replace" | "average" | "both" | "highest" = "replace"
): CGPAResult {
  if (semesters.length === 0) {
    return {
      cgpa: 0,
      totalCredits: 0,
      totalQualityPoints: 0,
      semesterResults: [],
    };
  }

  // Track each course's best/accumulated record for carryover handling.
  const courseMap = new Map<
    string,
    { credits: number; qualityPoints: number; count: number }
  >();

  const semesterResults: CGPAResult["semesterResults"] = [];

  for (const sem of semesters) {
    const gpaResult = calculateGPA(sem.courses, grades);
    semesterResults.push({
      semester: sem.name,
      gpa: gpaResult.gpa,
      credits: gpaResult.totalCredits,
      qualityPoints: gpaResult.totalQualityPoints,
    });

    for (const course of gpaResult.courses) {
      const key = course.name.trim().toLowerCase();
      const existing = courseMap.get(key);

      if (!existing) {
        courseMap.set(key, {
          credits: course.credits,
          qualityPoints: course.qualityPoints,
          count: 1,
        });
        continue;
      }

      switch (repeatPolicy) {
        case "replace":
          // Keep credits constant; use latest quality points.
          existing.qualityPoints = course.qualityPoints;
          existing.count += 1;
          break;

        case "average":
          // Average all attempts' quality points; credits stay constant.
          existing.qualityPoints =
            (existing.qualityPoints * existing.count + course.qualityPoints) /
            (existing.count + 1);
          existing.count += 1;
          break;

        case "both":
          // Both attempts count toward totals.
          existing.credits += course.credits;
          existing.qualityPoints += course.qualityPoints;
          existing.count += 1;
          break;

        case "highest":
          // Keep only the highest quality points; credits stay constant.
          if (course.qualityPoints > existing.qualityPoints) {
            existing.qualityPoints = course.qualityPoints;
          }
          existing.count += 1;
          break;
      }
    }
  }

  const totalCredits = Array.from(courseMap.values()).reduce(
    (sum, c) => sum + c.credits,
    0
  );
  const totalQualityPoints = round(
    Array.from(courseMap.values()).reduce(
      (sum, c) => sum + c.qualityPoints,
      0
    )
  );

  return {
    cgpa: totalCredits > 0 ? round(totalQualityPoints / totalCredits) : 0,
    totalCredits,
    totalQualityPoints,
    semesterResults,
  };
}

/**
 * Project what GPA is needed in remaining credits to achieve a target CGPA.
 *
 * Formula:
 *   requiredGPA = (targetCGPA × (completedCredits + remainingCredits)
 *                  − currentCGPA × completedCredits) / remainingCredits
 */
export function projectCGPA(
  currentCGPA: number,
  completedCredits: number,
  targetCGPA: number,
  remainingCredits: number,
  scale: number
): ProjectionResult {
  if (remainingCredits <= 0) {
    return {
      currentCGPA: round(currentCGPA),
      targetCGPA: round(targetCGPA),
      requiredGPA: 0,
      isAchievable: currentCGPA >= targetCGPA,
      remainingCredits: 0,
      completedCredits,
    };
  }

  const totalCredits = completedCredits + remainingCredits;
  const currentQP = currentCGPA * completedCredits;
  const requiredGPA = (targetCGPA * totalCredits - currentQP) / remainingCredits;

  return {
    currentCGPA: round(currentCGPA),
    targetCGPA: round(targetCGPA),
    requiredGPA: round(requiredGPA),
    isAchievable: requiredGPA >= 0 && requiredGPA <= scale,
    remainingCredits,
    completedCredits,
  };
}

/**
 * Simulate a what-if scenario: what happens to the CGPA if the student
 * takes specific courses with specific grades.
 */
export function simulateWhatIf(
  currentCGPA: number,
  completedCredits: number,
  scenario: WhatIfScenario,
  grades: GradeRange[],
  degreeClasses: DegreeClass[]
): WhatIfResult {
  const semGPA = calculateGPA(scenario.courses, grades);
  const currentQP = currentCGPA * completedCredits;
  const newTotalCredits = completedCredits + semGPA.totalCredits;
  const newTotalQP = currentQP + semGPA.totalQualityPoints;
  const projectedCGPA =
    newTotalCredits > 0 ? round(newTotalQP / newTotalCredits) : 0;

  return {
    originalCGPA: round(currentCGPA),
    projectedCGPA,
    semesterGPA: semGPA.gpa,
    change: round(projectedCGPA - currentCGPA),
    newTotalCredits,
    degreeClass: getDegreeClass(projectedCGPA, degreeClasses),
    previousDegreeClass: getDegreeClass(currentCGPA, degreeClasses),
  };
}

/**
 * Calculate the impact of re-taking failed / carryover courses.
 *
 * Policies:
 *   - "replace": old QP removed, new QP added; total credits unchanged
 *   - "both":    new attempt added on top; total credits increase
 *   - "average": old QP replaced by average of old & new; credits unchanged
 */
export function carryoverImpact(
  currentCGPA: number,
  totalCredits: number,
  failedCourses: {
    name: string;
    credits: number;
    originalGrade: string;
    newGrade: string;
  }[],
  grades: GradeRange[],
  repeatPolicy: "replace" | "average" | "both" | "highest"
): CarryoverImpactResult {
  if (failedCourses.length === 0 || totalCredits <= 0) {
    return {
      currentCGPA: round(currentCGPA),
      projectedCGPA: round(currentCGPA),
      cgpaChange: 0,
      coursesAnalyzed: [],
    };
  }

  let totalQP = currentCGPA * totalCredits;
  let adjustedCredits = totalCredits;

  const coursesAnalyzed = failedCourses.map((c) => {
    const originalPoints = getGradePoints(c.originalGrade, grades);
    const newPoints = getGradePoints(c.newGrade, grades);
    const oldQP = originalPoints * c.credits;
    const newQP = newPoints * c.credits;

    switch (repeatPolicy) {
      case "replace":
        totalQP = totalQP - oldQP + newQP;
        break;
      case "both":
        totalQP += newQP;
        adjustedCredits += c.credits;
        break;
      case "average": {
        const avgQP = (oldQP + newQP) / 2;
        totalQP = totalQP - oldQP + avgQP;
        break;
      }
      case "highest": {
        // Only use the higher of the two quality point values.
        const highestQP = Math.max(oldQP, newQP);
        totalQP = totalQP - oldQP + highestQP;
        break;
      }
    }

    return {
      name: c.name,
      credits: c.credits,
      originalGrade: c.originalGrade,
      originalPoints,
      newGrade: c.newGrade,
      newPoints,
      creditImpact: round(newQP - oldQP),
    };
  });

  const projectedCGPA =
    adjustedCredits > 0 ? round(totalQP / adjustedCredits) : 0;

  return {
    currentCGPA: round(currentCGPA),
    projectedCGPA,
    cgpaChange: round(projectedCGPA - currentCGPA),
    coursesAnalyzed,
  };
}

/**
 * Determine the current degree class from a CGPA value.
 * Returns "Unclassified" when no matching class is found.
 */
export function getDegreeClass(
  cgpa: number,
  degreeClasses: DegreeClass[]
): string {
  const sorted = [...degreeClasses].sort((a, b) => b.minCGPA - a.minCGPA);
  const match = sorted.find((dc) => cgpa >= dc.minCGPA && cgpa <= dc.maxCGPA);
  return match ? match.name : "Unclassified";
}

/**
 * Assess degree risk based on current CGPA and class boundaries.
 *
 * Risk is determined by how close the CGPA is to the lower boundary of the
 * current degree class, expressed as a fraction of remaining academic capacity.
 */
export function assessDegreeRisk(
  cgpa: number,
  degreeClasses: DegreeClass[],
  completedCredits: number,
  totalProgramCredits: number
): DegreeRiskLevel {
  const sorted = [...degreeClasses].sort((a, b) => b.minCGPA - a.minCGPA);
  const currentIdx = sorted.findIndex(
    (dc) => cgpa >= dc.minCGPA && cgpa <= dc.maxCGPA
  );

  const currentClass =
    currentIdx >= 0 ? sorted[currentIdx] : sorted[sorted.length - 1];
  const nextClassDown =
    currentIdx >= 0 && currentIdx < sorted.length - 1
      ? sorted[currentIdx + 1]
      : null;
  const nextClassUp = currentIdx > 0 ? sorted[currentIdx - 1] : null;

  const distDown = round(cgpa - currentClass.minCGPA);
  const distUp = nextClassUp ? round(nextClassUp.minCGPA - cgpa) : null;

  const progressRatio =
    totalProgramCredits > 0 ? completedCredits / totalProgramCredits : 0;

  // Buffer shrinks as the student progresses through the programme.
  // Buffer shrinks proportionally to academic progress so risk is amplified later.
  const effectiveBuffer = distDown * (1 - progressRatio * BUFFER_DECAY_RATE);

  let level: DegreeRiskLevel["level"];
  let message: string;

  if (effectiveBuffer > 0.5) {
    level = "safe";
    message = `Comfortably within ${currentClass.name} (${distDown} above boundary).`;
  } else if (effectiveBuffer > 0.25) {
    level = "warning";
    message = `Getting close to the ${currentClass.name} lower boundary — only ${distDown} above.`;
  } else if (effectiveBuffer > 0.1) {
    level = "danger";
    message = `At risk of dropping below ${currentClass.name} — ${distDown} above boundary with ${round((1 - progressRatio) * 100)}% of credits remaining.`;
  } else {
    level = "critical";
    message = `Critically close to losing ${currentClass.name} — only ${distDown} above boundary.`;
  }

  return {
    level,
    message,
    currentClass: currentClass.name,
    nextClassDown: nextClassDown ? nextClassDown.name : null,
    cgpaToNextClassDown: distDown,
    cgpaToNextClassUp: distUp,
  };
}

/**
 * Calculate best-case and worst-case CGPA projections given remaining credits.
 */
export function projectBestWorstCase(
  currentCGPA: number,
  completedCredits: number,
  remainingCredits: number,
  scale: number,
  degreeClasses: DegreeClass[]
): BestWorstProjection {
  const currentQP = currentCGPA * completedCredits;
  const totalCredits = completedCredits + remainingCredits;

  const bestQP = currentQP + scale * remainingCredits;
  const bestCGPA = totalCredits > 0 ? round(bestQP / totalCredits) : 0;

  const worstQP = currentQP; // worst case: 0 grade points for all remaining
  const worstCGPA = totalCredits > 0 ? round(worstQP / totalCredits) : 0;

  // GPA needed in remaining credits to maintain current CGPA
  const gpaNeeded =
    remainingCredits > 0
      ? round(
          (currentCGPA * totalCredits - currentQP) / remainingCredits
        )
      : 0;

  return {
    bestCase: {
      cgpa: bestCGPA,
      degreeClass: getDegreeClass(bestCGPA, degreeClasses),
      gpaNeeded: gpaNeeded,
    },
    worstCase: {
      cgpa: worstCGPA,
      degreeClass: getDegreeClass(worstCGPA, degreeClasses),
    },
    currentCase: {
      cgpa: round(currentCGPA),
      degreeClass: getDegreeClass(currentCGPA, degreeClasses),
    },
    remainingCredits,
  };
}

/**
 * Recommend an optimal study load for a target GPA.
 *
 * Heuristic: pick the maximum allowed credits and determine the minimum
 * uniform grade needed across standard 3-credit courses to reach the target.
 */
export function recommendStudyLoad(
  currentCGPA: number,
  completedCredits: number,
  targetCGPA: number,
  config: UniversityConfig
): StudyLoadRecommendation {
  const { creditRules, gradingSystem } = config;
  const activeGrading = gradingSystem[gradingSystem.length - 1];
  const grades = activeGrading?.grades ?? [];
  const scale = activeGrading?.scale ?? 5;
  const maxCredits = creditRules.maximumPerSemester;
  const minCredits = creditRules.minimumPerSemester;

  const currentQP = currentCGPA * completedCredits;
  const totalWithMax = completedCredits + maxCredits;
  const requiredGPAMax =
    maxCredits > 0
      ? (targetCGPA * totalWithMax - currentQP) / maxCredits
      : 0;

  // If the target is reachable at max load, prefer max; otherwise fall back to min.
  let recommendedCredits: number;
  let targetGPA: number;

  if (requiredGPAMax >= 0 && requiredGPAMax <= scale) {
    recommendedCredits = maxCredits;
    targetGPA = round(requiredGPAMax);
  } else if (requiredGPAMax < 0) {
    // Target already exceeded — take minimum load.
    recommendedCredits = minCredits;
    targetGPA = 0;
  } else {
    recommendedCredits = maxCredits;
    targetGPA = round(scale);
  }

  // Find the minimum grade letter that meets or exceeds the required per-course GPA.
  const sortedGrades = [...grades].sort((a, b) => a.points - b.points);
  const minGrade =
    sortedGrades.find((g) => g.points >= targetGPA)?.grade ??
    sortedGrades[sortedGrades.length - 1]?.grade ??
    "F";

  // Build a course plan using the default credit unit per course.
  const courseCredits = config.creditRules.minimumCredits || DEFAULT_COURSE_CREDITS;
  const numCourses = Math.floor(recommendedCredits / courseCredits);
  const remainder = recommendedCredits - numCourses * courseCredits;

  const courses: { credits: number; minGrade: string }[] = Array.from(
    { length: numCourses },
    () => ({ credits: courseCredits, minGrade })
  );
  if (remainder > 0) {
    courses.push({ credits: remainder, minGrade });
  }

  let reason: string;
  if (requiredGPAMax < 0) {
    reason = `Your CGPA already exceeds the target. A light load of ${recommendedCredits} credits is sufficient.`;
  } else if (requiredGPAMax > scale) {
    reason = `Reaching ${targetCGPA} requires a GPA above ${scale} — take maximum credits (${maxCredits}) and aim for the highest grades possible.`;
  } else {
    reason = `Taking ${recommendedCredits} credits and averaging at least a "${minGrade}" (${targetGPA} GPA) should bring your CGPA to ${targetCGPA}.`;
  }

  return { recommendedCredits, targetGPA, courses, reason };
}

/**
 * Analyze performance trends across semesters.
 *
 * Each semester is annotated with a running CGPA and a trend indicator
 * ("improving" / "declining" / "stable").
 */
export function analyzePerformanceTrends(
  semesters: { name: string; gpa: number; credits: number }[]
): PerformanceTrend[] {
  if (semesters.length === 0) return [];

  const results: PerformanceTrend[] = [];
  let cumulativeQP = 0;
  let cumulativeCredits = 0;

  for (let i = 0; i < semesters.length; i++) {
    const sem = semesters[i];
    cumulativeQP += sem.gpa * sem.credits;
    cumulativeCredits += sem.credits;
    const cgpa = cumulativeCredits > 0 ? round(cumulativeQP / cumulativeCredits) : 0;

    let trend: PerformanceTrend["trend"] = "stable";
    let improvementMarker: string | undefined;

    if (i > 0) {
      const prevGPA = semesters[i - 1].gpa;
      const diff = sem.gpa - prevGPA;
      if (diff > TREND_THRESHOLD) {
        trend = "improving";
        improvementMarker = `+${round(diff)} from previous semester`;
      } else if (diff < -TREND_THRESHOLD) {
        trend = "declining";
      }
    }

    results.push({
      semester: sem.name,
      gpa: round(sem.gpa),
      cgpa,
      credits: sem.credits,
      trend,
      ...(improvementMarker ? { improvementMarker } : {}),
    });
  }

  return results;
}

/**
 * Validate a university config for completeness and correctness.
 * Returns an object with a `valid` flag and a list of warnings.
 */
export function validateUniversityConfig(
  config: UniversityConfig
): { valid: boolean; warnings: string[] } {
  const warnings: string[] = [];

  if (!config.id) warnings.push("Missing university id.");
  if (!config.name) warnings.push("Missing university name.");
  if (!config.shortName) warnings.push("Missing university shortName.");

  // Grading system
  const { gradingSystem } = config;
  if (!gradingSystem || gradingSystem.length === 0) {
    warnings.push("Grading system has no session entries defined.");
  } else {
    for (const session of gradingSystem) {
      if (!session.session_start || !session.session_end) {
        warnings.push("Each grading session must include session_start and session_end.");
      }
      if (!session.grades || session.grades.length === 0) {
        warnings.push(`Session ${session.session_start} has no grades defined.`);
        continue;
      }

      const maxPoints = Math.max(...session.grades.map((g) => g.points));
      if (session.scale !== maxPoints) {
        warnings.push(
          `Session ${session.session_start} scale (${session.scale}) does not match the highest grade points (${maxPoints}).`
        );
      }

      // Check for overlapping ranges
      const sorted = [...session.grades].sort((a, b) => a.min - b.min);
      for (let i = 1; i < sorted.length; i++) {
        if (sorted[i].min <= sorted[i - 1].max) {
          warnings.push(
            `Session ${session.session_start}: overlapping grade ranges "${sorted[i - 1].grade}" (${sorted[i - 1].min}–${sorted[i - 1].max}) and "${sorted[i].grade}" (${sorted[i].min}–${sorted[i].max}).`
          );
        }
      }
    }
  }

  // Degree classes
  if (!config.degreeClasses || config.degreeClasses.length === 0) {
    warnings.push("No degree classes defined.");
  } else {
    const sortedDC = [...config.degreeClasses].sort(
      (a, b) => a.minCGPA - b.minCGPA
    );
    for (let i = 1; i < sortedDC.length; i++) {
      if (sortedDC[i].minCGPA <= sortedDC[i - 1].maxCGPA) {
        warnings.push(
          `Overlapping degree classes: "${sortedDC[i - 1].name}" and "${sortedDC[i].name}".`
        );
      }
    }
  }

  // Credit rules
  const { creditRules } = config;
  if (creditRules) {
    if (creditRules.minimumPerSemester > creditRules.maximumPerSemester) {
      warnings.push("Minimum credits per semester exceeds maximum.");
    }
    if (creditRules.minimumCredits <= 0) {
      warnings.push("Minimum credits should be positive.");
    }
  } else {
    warnings.push("Missing credit rules.");
  }

  // Repeat policy
  if (!config.repeatPolicy) {
    warnings.push("Missing repeat policy.");
  }

  // Probation
  if (!config.probation || config.probation.minCGPA == null) {
    warnings.push("Missing probation configuration.");
  }

  return { valid: warnings.length === 0, warnings };
}
