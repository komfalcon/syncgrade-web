export interface CourseHistory {
  semesterName: string;
  courseName: string;
  courseCode: string;
  gradePoint: number;
  creditUnits: number;
  passed: boolean;
}

export interface CarryoverMatch {
  isLikelyCarryover: boolean;
  confidence: 'high' | 'medium' | 'low';
  matchedCourse: CourseHistory;
  reason: string;
}

export function extractCourseCode(courseName: string): string {
  const match = courseName.match(/[A-Z]{2,4}\s?\d{2,4}/i);
  if (!match) return '';
  return match[0].replace(/\s+/g, '').toUpperCase();
}

export function normalizeName(name: string): string {
  const lowered = name.toLowerCase();
  const withoutPunctuation = lowered.replace(/[^\w\s]/g, ' ');
  const withoutFillers = withoutPunctuation
    .replace(/\bintroduction to\b/g, ' ')
    .replace(/\bintro to\b/g, ' ')
    .replace(/\bfundamentals of\b/g, ' ')
    .replace(/\bprinciples of\b/g, ' ')
    .replace(/\bbasic\b/g, ' ')
    .replace(/\bgeneral\b/g, ' ')
    .replace(/\band\b/g, ' ')
    .replace(/\bof\b/g, ' ')
    .replace(/\bthe\b/g, ' ')
    .replace(/\bin\b/g, ' ')
    .replace(/\bfor\b/g, ' ');
  return withoutFillers.replace(/\s+/g, ' ').trim();
}

const toBigrams = (value: string): string[] => {
  if (value.length < 2) return [];
  const bigrams: string[] = [];
  for (let i = 0; i < value.length - 1; i += 1) {
    bigrams.push(value.slice(i, i + 2));
  }
  return bigrams;
};

export function calculateSimilarity(a: string, b: string): number {
  if (a === b) return 1;
  if (!a || !b) return 0;
  if (a.includes(b) || b.includes(a)) return 0.9;

  const aBigrams = toBigrams(a);
  const bBigrams = toBigrams(b);
  if (!aBigrams.length || !bBigrams.length) return 0;

  const bCounts = new Map<string, number>();
  for (const bg of bBigrams) {
    bCounts.set(bg, (bCounts.get(bg) ?? 0) + 1);
  }

  let common = 0;
  for (const bg of aBigrams) {
    const count = bCounts.get(bg) ?? 0;
    if (count > 0) {
      common += 1;
      bCounts.set(bg, count - 1);
    }
  }

  return (2 * common) / (aBigrams.length + bBigrams.length);
}

const confidenceScore: Record<CarryoverMatch['confidence'], number> = {
  high: 3,
  medium: 2,
  low: 1,
};

export function detectCarryover(
  newCourseName: string,
  allPreviousCourses: CourseHistory[],
  passThreshold: number,
): CarryoverMatch | null {
  const newCode = extractCourseCode(newCourseName);
  const normalizedNew = normalizeName(newCourseName);
  const matches: CarryoverMatch[] = [];

  for (const previousCourse of allPreviousCourses) {
    const isPassed = previousCourse.passed || previousCourse.gradePoint >= passThreshold;
    if (isPassed) continue;

    const previousCode = previousCourse.courseCode || extractCourseCode(previousCourse.courseName);
    if (newCode && previousCode && newCode === previousCode) {
      matches.push({
        isLikelyCarryover: true,
        confidence: 'high',
        matchedCourse: previousCourse,
        reason: `Same course code (${newCode}) found in ${previousCourse.semesterName} where you scored ${previousCourse.gradePoint}`,
      });
      continue;
    }

    const normalizedPrev = normalizeName(previousCourse.courseName);
    const score = calculateSimilarity(normalizedNew, normalizedPrev);
    if (score < 0.4) continue;

    const confidence: CarryoverMatch['confidence'] =
      score >= 0.8 ? 'high' : score >= 0.6 ? 'medium' : 'low';
    matches.push({
      isLikelyCarryover: true,
      confidence,
      matchedCourse: previousCourse,
      reason: `Similar to ${previousCourse.courseName} in ${previousCourse.semesterName} where you scored ${previousCourse.gradePoint}`,
    });
  }

  if (!matches.length) return null;

  return matches.slice(1).reduce((best, current) => {
    if (confidenceScore[current.confidence] >= confidenceScore[best.confidence]) return current;
    return best;
  }, matches[0]);
}
