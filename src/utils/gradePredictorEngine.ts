import type { GradeRange } from '@/universities/types';

export interface Course {
  name: string;
  units: number;
}

export interface GradeOption {
  label: string;
  point: number;
  minScore: number;
  maxScore: number;
}

export interface CourseAssignment {
  courseName: string;
  units: number;
  gradeLabel: string;
  gradePoint: number;
  minScore: number;
  maxScore: number;
}

export type StrategyType = 'safe' | 'balanced' | 'highEffort';

export interface Strategy {
  type: StrategyType;
  label: string;
  description: string;
  assignments: CourseAssignment[];
  resultingCGPA: number;
  minimumGradeRequired: string;
  feasibilityScore: number;
}

export interface PredictorResult {
  maxAttainableCGPA: number;
  strategies: Strategy[];
  hasNoSolution: boolean;
}

type WorkingAssignment = {
  course: Course;
  gradeIndex: number;
};

const HIGH_EFFORT_TOP_COURSE_RATIO = 0.5;
const SAFE_FEASIBILITY_MIN = 85;
const SAFE_FEASIBILITY_MAX = 100;
const SAFE_FEASIBILITY_RANGE = SAFE_FEASIBILITY_MAX - SAFE_FEASIBILITY_MIN;
const BALANCED_FEASIBILITY_MIN = 50;
const BALANCED_FEASIBILITY_MAX = 84;
const BALANCED_FEASIBILITY_RANGE = BALANCED_FEASIBILITY_MAX - BALANCED_FEASIBILITY_MIN;
const HIGH_EFFORT_FEASIBILITY_MIN = 10;
const HIGH_EFFORT_FEASIBILITY_MAX = 49;
const HIGH_EFFORT_FEASIBILITY_RANGE = HIGH_EFFORT_FEASIBILITY_MAX - HIGH_EFFORT_FEASIBILITY_MIN;

const round2 = (value: number): number => Math.round(value * 100) / 100;

const toSafeNumber = (value: number, fallback = 0): number =>
  Number.isFinite(value) ? value : fallback;

const normalizeCourses = (courses: Course[]): Course[] =>
  courses
    .map((course) => ({
      name: course.name?.trim() ?? '',
      units: Math.max(0, Math.round(toSafeNumber(course.units))),
    }))
    .filter((course) => course.name.length > 0 && course.units > 0);

const sortByPriority = (courses: Course[]): Course[] =>
  [...courses].sort((a, b) => {
    if (b.units !== a.units) return b.units - a.units;
    return a.name.localeCompare(b.name);
  });

const calculateResultingCGPA = (
  currentCGPA: number,
  completedCredits: number,
  assignments: CourseAssignment[],
  scale: number,
): number => {
  const safeCurrent = Math.max(0, toSafeNumber(currentCGPA));
  const safeCompleted = Math.max(0, Math.round(toSafeNumber(completedCredits)));
  const safeScale = Math.max(0, toSafeNumber(scale));

  const semesterPoints = assignments.reduce(
    (sum, assignment) => sum + assignment.units * assignment.gradePoint,
    0,
  );
  const semesterUnits = assignments.reduce((sum, assignment) => sum + assignment.units, 0);

  const denominator = safeCompleted + semesterUnits;
  if (denominator <= 0) return 0;

  const raw = (safeCurrent * safeCompleted + semesterPoints) / denominator;
  return round2(Math.min(safeScale, Math.max(0, raw)));
};

const buildAssignments = (
  working: WorkingAssignment[],
  gradeOptionsAscending: GradeOption[],
): CourseAssignment[] =>
  working.map(({ course, gradeIndex }) => {
    const option = gradeOptionsAscending[gradeIndex];
    return {
      courseName: course.name,
      units: course.units,
      gradeLabel: option.label,
      gradePoint: option.point,
      minScore: option.minScore,
      maxScore: option.maxScore,
    };
  });

const findMinimumGradeLabel = (
  assignments: CourseAssignment[],
  canonicalDesc: GradeOption[],
): string => {
  if (assignments.length === 0 || canonicalDesc.length === 0) return 'N/A';
  const pointRank = new Map(canonicalDesc.map((option, index) => [option.point, index]));
  const sorted = [...assignments].sort((a, b) => {
    const rankA = pointRank.get(a.gradePoint) ?? Number.MAX_SAFE_INTEGER;
    const rankB = pointRank.get(b.gradePoint) ?? Number.MAX_SAFE_INTEGER;
    return rankB - rankA;
  });
  return sorted[0]?.gradeLabel ?? 'N/A';
};

const assignmentsSignature = (assignments: CourseAssignment[]): string =>
  [...assignments]
    .sort((a, b) => a.courseName.localeCompare(b.courseName))
    .map((assignment) => `${assignment.courseName}:${assignment.gradeLabel}:${assignment.units}`)
    .join('|');

const distributionVariance = (assignments: CourseAssignment[]): number => {
  if (assignments.length <= 1) return 0;
  const mean = assignments.reduce((sum, a) => sum + a.gradePoint, 0) / assignments.length;
  return (
    assignments.reduce((sum, a) => sum + Math.pow(a.gradePoint - mean, 2), 0) / assignments.length
  );
};

const makeStrategy = (
  type: StrategyType,
  label: string,
  description: string,
  assignments: CourseAssignment[],
  currentCGPA: number,
  completedCredits: number,
  scale: number,
  canonicalDesc: GradeOption[],
  feasibilityScore: number,
): Strategy => ({
  type,
  label,
  description,
  assignments,
  resultingCGPA: calculateResultingCGPA(currentCGPA, completedCredits, assignments, scale),
  minimumGradeRequired: findMinimumGradeLabel(assignments, canonicalDesc),
  feasibilityScore: Math.max(0, Math.min(100, Math.round(feasibilityScore))),
});

const generateSafeAssignments = (
  courses: Course[],
  targetCGPA: number,
  currentCGPA: number,
  completedCredits: number,
  gradeOptionsAscending: GradeOption[],
  scale: number,
): { assignments: CourseAssignment[]; upgrades: number } | null => {
  const startIndex = Math.max(
    0,
    gradeOptionsAscending.findIndex((option) => option.point > 0),
  );
  const working: WorkingAssignment[] = courses.map((course) => ({
    course,
    gradeIndex: startIndex,
  }));

  const ordered = sortByPriority(courses);
  const workingByName = new Map(working.map((item) => [item.course.name, item]));

  let upgrades = 0;
  let assignments = buildAssignments(working, gradeOptionsAscending);
  let cgpa = calculateResultingCGPA(currentCGPA, completedCredits, assignments, scale);

  while (cgpa < targetCGPA) {
    let upgraded = false;
    for (const course of ordered) {
      const item = workingByName.get(course.name);
      if (!item || item.gradeIndex >= gradeOptionsAscending.length - 1) {
        continue;
      }
      item.gradeIndex += 1;
      upgrades += 1;
      upgraded = true;
      assignments = buildAssignments(working, gradeOptionsAscending);
      cgpa = calculateResultingCGPA(currentCGPA, completedCredits, assignments, scale);
      break;
    }

    if (!upgraded) {
      return null;
    }
  }

  return { assignments, upgrades };
};

const generateBalancedAssignments = (
  courses: Course[],
  targetCGPA: number,
  currentCGPA: number,
  completedCredits: number,
  gradeOptionsAscending: GradeOption[],
  scale: number,
): CourseAssignment[] | null => {
  const uniformCandidates = gradeOptionsAscending.map((gradeOption, index) => {
    const working: WorkingAssignment[] = courses.map((course) => ({
      course,
      gradeIndex: index,
    }));
    const assignments = buildAssignments(working, gradeOptionsAscending);
    const cgpa = calculateResultingCGPA(currentCGPA, completedCredits, assignments, scale);
    return { index, cgpa, assignments };
  });

  const bestUniformAbove = uniformCandidates
    .filter((candidate) => candidate.cgpa >= targetCGPA)
    .sort((a, b) => a.cgpa - b.cgpa)[0];

  if (bestUniformAbove && Math.abs(bestUniformAbove.cgpa - targetCGPA) < 0.01) {
    return bestUniformAbove.assignments;
  }

  const closestBelow = uniformCandidates
    .filter((candidate) => candidate.cgpa < targetCGPA)
    .sort((a, b) => b.cgpa - a.cgpa)[0];

  if (!closestBelow) {
    return bestUniformAbove?.assignments ?? null;
  }

  const baseIndex = closestBelow.index;
  const upgradeIndex = Math.min(baseIndex + 1, gradeOptionsAscending.length - 1);
  const working: WorkingAssignment[] = courses.map((course) => ({
    course,
    gradeIndex: baseIndex,
  }));

  const ordered = sortByPriority(courses);
  const workingByName = new Map(working.map((item) => [item.course.name, item]));

  let assignments = buildAssignments(working, gradeOptionsAscending);
  let cgpa = calculateResultingCGPA(currentCGPA, completedCredits, assignments, scale);

  for (const course of ordered) {
    if (cgpa >= targetCGPA) break;
    const item = workingByName.get(course.name);
    if (!item) continue;
    item.gradeIndex = upgradeIndex;
    assignments = buildAssignments(working, gradeOptionsAscending);
    cgpa = calculateResultingCGPA(currentCGPA, completedCredits, assignments, scale);
  }

  if (cgpa >= targetCGPA) return assignments;
  return bestUniformAbove?.assignments ?? null;
};

const generateHighEffortAssignments = (
  courses: Course[],
  targetCGPA: number,
  currentCGPA: number,
  completedCredits: number,
  gradeOptionsDescending: GradeOption[],
  scale: number,
): CourseAssignment[] | null => {
  const ordered = sortByPriority(courses);
  const highest = gradeOptionsDescending[0];
  const oneBelow = gradeOptionsDescending[1] ?? highest;
  const topCount = Math.ceil(courses.length * HIGH_EFFORT_TOP_COURSE_RATIO);

  const assignments = ordered.map((course, index) => ({
    courseName: course.name,
    units: course.units,
    gradeLabel: (index < topCount ? highest : oneBelow).label,
    gradePoint: (index < topCount ? highest : oneBelow).point,
    minScore: (index < topCount ? highest : oneBelow).minScore,
    maxScore: (index < topCount ? highest : oneBelow).maxScore,
  }));

  let cgpa = calculateResultingCGPA(currentCGPA, completedCredits, assignments, scale);
  if (cgpa >= targetCGPA) return assignments;

  for (const assignment of assignments.slice(topCount)) {
    assignment.gradeLabel = highest.label;
    assignment.gradePoint = highest.point;
    assignment.minScore = highest.minScore;
    assignment.maxScore = highest.maxScore;
    cgpa = calculateResultingCGPA(currentCGPA, completedCredits, assignments, scale);
    if (cgpa >= targetCGPA) return assignments;
  }

  return cgpa >= targetCGPA ? assignments : null;
};

export function calculateMaxCGPA(
  currentCGPA: number,
  completedCredits: number,
  courses: Course[],
  scale: number,
): number {
  const safeScale = Math.max(0, toSafeNumber(scale));
  const safeCourses = normalizeCourses(courses);
  const maxAssignments = safeCourses.map((course) => ({
    courseName: course.name,
    units: course.units,
    gradeLabel: `Max (${safeScale.toFixed(1)})`,
    gradePoint: safeScale,
    minScore: 0,
    maxScore: 100,
  }));

  return calculateResultingCGPA(currentCGPA, completedCredits, maxAssignments, safeScale);
}

export function generateStrategies(
  currentCGPA: number,
  completedCredits: number,
  courses: Course[],
  targetCGPA: number,
  gradeOptions: GradeOption[],
  scale: number,
): PredictorResult {
  const safeScale = Math.max(0, toSafeNumber(scale));
  const safeCourses = normalizeCourses(courses);
  const safeTarget = round2(Math.min(safeScale, Math.max(0, toSafeNumber(targetCGPA))));
  const canonicalDesc = [...gradeOptions].sort((a, b) => b.point - a.point);
  const ascending = [...canonicalDesc].reverse();

  const maxCGPA = calculateMaxCGPA(currentCGPA, completedCredits, safeCourses, safeScale);

  if (safeCourses.length === 0 || canonicalDesc.length === 0 || safeTarget > maxCGPA) {
    return {
      maxAttainableCGPA: maxCGPA,
      strategies: [],
      hasNoSolution: true,
    };
  }

  const safeGenerated = generateSafeAssignments(
    safeCourses,
    safeTarget,
    currentCGPA,
    completedCredits,
    ascending,
    safeScale,
  );

  const balancedAssignments = generateBalancedAssignments(
    safeCourses,
    safeTarget,
    currentCGPA,
    completedCredits,
    ascending,
    safeScale,
  );

  const highEffortAssignments = generateHighEffortAssignments(
    safeCourses,
    safeTarget,
    currentCGPA,
    completedCredits,
    canonicalDesc,
    safeScale,
  );

  const safeStrategy =
    safeGenerated &&
    makeStrategy(
      'safe',
      'Safe Path',
      'Minimum grades needed. Most room for error.',
      safeGenerated.assignments,
      currentCGPA,
      completedCredits,
      safeScale,
      canonicalDesc,
      SAFE_FEASIBILITY_MAX -
        Math.min(
          SAFE_FEASIBILITY_RANGE,
          Math.round((safeGenerated.upgrades / Math.max(1, safeCourses.length * 2)) * SAFE_FEASIBILITY_RANGE),
        ),
    );

  const balancedStrategy =
    balancedAssignments &&
    makeStrategy(
      'balanced',
      'Balanced Path',
      'Consistent effort across all courses.',
      balancedAssignments,
      currentCGPA,
      completedCredits,
      safeScale,
      canonicalDesc,
      BALANCED_FEASIBILITY_MAX -
        Math.min(
          BALANCED_FEASIBILITY_RANGE,
          Math.round(distributionVariance(balancedAssignments) * 15),
        ),
    );

  const highEffortResult =
    highEffortAssignments &&
    calculateResultingCGPA(currentCGPA, completedCredits, highEffortAssignments, safeScale);

  const highEffortBuffer = highEffortResult ? Math.max(0, highEffortResult - safeTarget) : 0;
  const highEffortStrategy =
    highEffortAssignments &&
    makeStrategy(
      'highEffort',
      'High Effort Path',
      'Score high to build a buffer above your target.',
      highEffortAssignments,
      currentCGPA,
      completedCredits,
      safeScale,
      canonicalDesc,
      Math.max(
        HIGH_EFFORT_FEASIBILITY_MIN,
        HIGH_EFFORT_FEASIBILITY_MAX -
          Math.round((highEffortBuffer / Math.max(0.01, safeScale)) * HIGH_EFFORT_FEASIBILITY_RANGE),
      ),
    );

  const deduped = [safeStrategy, balancedStrategy, highEffortStrategy]
    .filter((strategy): strategy is Strategy => Boolean(strategy))
    .reduce<Map<string, Strategy>>((map, strategy) => {
      const signature = assignmentsSignature(strategy.assignments);
      const existing = map.get(signature);
      if (!existing || strategy.feasibilityScore > existing.feasibilityScore) {
        map.set(signature, strategy);
      }
      return map;
    }, new Map());

  const orderedDistinct = Array.from(deduped.values()).sort((a, b) => {
    const priority: Record<StrategyType, number> = {
      safe: 0,
      balanced: 1,
      highEffort: 2,
    };
    return priority[a.type] - priority[b.type];
  });

  return {
    maxAttainableCGPA: maxCGPA,
    strategies: orderedDistinct.slice(0, 3),
    hasNoSolution: orderedDistinct.length === 0,
  };
}

export function deriveGradeOptions(gradeRanges: GradeRange[]): GradeOption[] {
  const mapped = gradeRanges
    .map((range) => {
      const candidate = range as GradeRange & {
        isPassing?: boolean;
        passing?: boolean;
      };
      const explicitlyPassing = candidate.isPassing === true || candidate.passing === true;
      const isFailingByPoint = range.points <= 0;
      if (isFailingByPoint && !explicitlyPassing) return null;

      return {
        label: range.grade,
        point: range.points,
        minScore: range.min,
        maxScore: range.max,
      };
    })
    .filter((grade): grade is GradeOption => Boolean(grade));

  return mapped.sort((a, b) => b.point - a.point);
}

/*
Inline test assertions (manual verification checklist)

const courses: Course[] = [
  { name: 'C1', units: 3 },
  { name: 'C2', units: 3 },
  { name: 'C3', units: 3 },
  { name: 'C4', units: 3 },
  { name: 'C5', units: 3 },
  { name: 'C6', units: 3 },
];

const gradeOptions5: GradeOption[] = [
  { label: 'A', point: 5, minScore: 70, maxScore: 100 },
  { label: 'B', point: 4, minScore: 60, maxScore: 69 },
  { label: 'C', point: 3, minScore: 50, maxScore: 59 },
  { label: 'D', point: 2, minScore: 45, maxScore: 49 },
  { label: 'E', point: 1, minScore: 40, maxScore: 44 },
];

// 1) calculateMaxCGPA: 5.0 scale
// assert(calculateMaxCGPA(3.2, 90, courses, 5.0) === 3.5);

// 2) calculateMaxCGPA: 4.0 scale
// assert(calculateMaxCGPA(2.8, 80, courses, 4.0) === 3.02);

// 3) hasNoSolution when target exceeds max
// assert(generateStrategies(3.2, 90, courses, 5.0, gradeOptions5, 5.0).hasNoSolution === true);

// 4) Safe strategy has lowest minimum grade among returned strategies
// const resultA = generateStrategies(2.4, 90, courses, 2.9, gradeOptions5, 5.0);
// assert(resultA.strategies.find(s => s.type === 'safe')!.minimumGradeRequired <= resultA.strategies.find(s => s.type === 'balanced')!.minimumGradeRequired);
// assert(resultA.strategies.find(s => s.type === 'safe')!.minimumGradeRequired <= resultA.strategies.find(s => s.type === 'highEffort')!.minimumGradeRequired);

// 5) Balanced strategy has most uniform distribution (lowest variance)
// const variance = (assignments: CourseAssignment[]) => {
//   const mean = assignments.reduce((sum, a) => sum + a.gradePoint, 0) / assignments.length;
//   return assignments.reduce((sum, a) => sum + (a.gradePoint - mean) ** 2, 0) / assignments.length;
// };
// const safe = resultA.strategies.find(s => s.type === 'safe')!;
// const balanced = resultA.strategies.find(s => s.type === 'balanced')!;
// const high = resultA.strategies.find(s => s.type === 'highEffort')!;
// assert(variance(balanced.assignments) <= variance(safe.assignments));
// assert(variance(balanced.assignments) <= variance(high.assignments));

// 6) All strategies resultingCGPA >= target
// assert(resultA.strategies.every((s) => s.resultingCGPA >= 2.9));
*/
