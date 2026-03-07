export interface GradeRange {
  grade: string;
  minScore: number;
  maxScore: number;
  gradePoint: number;
}

export interface NigerianUniversity {
  name: string;
  shortName: string;
  location: string;
  gpaScale: 4.0 | 5.0;
  gradeRanges: readonly GradeRange[];
  gradingSystem: string;
}

const FIVE_POINT_STANDARD_GRADES: readonly GradeRange[] = [
  { grade: "A", minScore: 70, maxScore: 100, gradePoint: 5.0 },
  { grade: "B", minScore: 60, maxScore: 69, gradePoint: 4.0 },
  { grade: "C", minScore: 50, maxScore: 59, gradePoint: 3.0 },
  { grade: "D", minScore: 45, maxScore: 49, gradePoint: 2.0 },
  { grade: "E", minScore: 40, maxScore: 44, gradePoint: 1.0 },
  { grade: "F", minScore: 0, maxScore: 39, gradePoint: 0.0 },
];

export const NIGERIAN_UNIVERSITIES: readonly NigerianUniversity[] = [
  {
    name: "University of Lagos",
    shortName: "UNILAG",
    location: "Lagos",
    gpaScale: 5.0,
    gradeRanges: FIVE_POINT_STANDARD_GRADES,
    gradingSystem: "5-point grading system",
  },
  {
    name: "University of Ibadan",
    shortName: "UI",
    location: "Ibadan",
    gpaScale: 5.0,
    gradeRanges: FIVE_POINT_STANDARD_GRADES,
    gradingSystem: "5-point grading system",
  },
  {
    name: "Obafemi Awolowo University",
    shortName: "OAU",
    location: "Ile-Ife",
    gpaScale: 4.0,
    gradeRanges: [
      { grade: "A", minScore: 70, maxScore: 100, gradePoint: 4.0 },
      { grade: "B", minScore: 60, maxScore: 69, gradePoint: 3.0 },
      { grade: "C", minScore: 50, maxScore: 59, gradePoint: 2.0 },
      { grade: "D", minScore: 45, maxScore: 49, gradePoint: 1.0 },
      { grade: "F", minScore: 0, maxScore: 44, gradePoint: 0.0 },
    ],
    gradingSystem: "4-point grading system",
  },
  {
    name: "Lagos State University",
    shortName: "LASU",
    location: "Lagos",
    gpaScale: 5.0,
    gradeRanges: FIVE_POINT_STANDARD_GRADES,
    gradingSystem: "5-point grading system",
  },
  {
    name: "Covenant University",
    shortName: "Covenant",
    location: "Ota",
    gpaScale: 4.0,
    gradeRanges: [
      { grade: "A", minScore: 70, maxScore: 100, gradePoint: 4.0 },
      { grade: "B+", minScore: 65, maxScore: 69, gradePoint: 3.5 },
      { grade: "B", minScore: 60, maxScore: 64, gradePoint: 3.0 },
      { grade: "C+", minScore: 55, maxScore: 59, gradePoint: 2.5 },
      { grade: "C", minScore: 50, maxScore: 54, gradePoint: 2.0 },
      { grade: "D", minScore: 45, maxScore: 49, gradePoint: 1.5 },
      { grade: "E", minScore: 40, maxScore: 44, gradePoint: 1.0 },
      { grade: "F", minScore: 0, maxScore: 39, gradePoint: 0.0 },
    ],
    gradingSystem: "4-point grading system",
  },
  {
    name: "Ahmadu Bello University",
    shortName: "ABU",
    location: "Zaria",
    gpaScale: 5.0,
    gradeRanges: FIVE_POINT_STANDARD_GRADES,
    gradingSystem: "5-point grading system",
  },
  {
    name: "Yaba College of Technology",
    shortName: "YABATECH",
    location: "Lagos",
    gpaScale: 4.0,
    gradeRanges: [
      { grade: "A", minScore: 75, maxScore: 100, gradePoint: 4.0 },
      { grade: "B", minScore: 65, maxScore: 74, gradePoint: 3.0 },
      { grade: "C", minScore: 55, maxScore: 64, gradePoint: 2.0 },
      { grade: "D", minScore: 45, maxScore: 54, gradePoint: 1.0 },
      { grade: "F", minScore: 0, maxScore: 44, gradePoint: 0.0 },
    ],
    gradingSystem: "4-point grading system",
  },
  {
    name: "University of Abuja",
    shortName: "UNIABUJA",
    location: "Abuja",
    gpaScale: 5.0,
    gradeRanges: FIVE_POINT_STANDARD_GRADES,
    gradingSystem: "5-point grading system",
  },
] as const satisfies ReadonlyArray<NigerianUniversity>;

/** Returns a mutable copy of the standard 5-point grading scale (UNILAG/UI system). */
export function getDefaultGradeRanges(): GradeRange[] {
  return [...FIVE_POINT_STANDARD_GRADES];
}
