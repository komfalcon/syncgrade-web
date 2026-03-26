import type { GradeRange } from "../types";

export type GradingTemplateId =
  | "nuc_standard_5"
  | "nuc_revised_5"
  | "nbte_standard_4_0"
  | "ncce_standard_5"
  | "ui_legacy_4"
  | "engineering-5.0";

type Band = {
  letter: string;
  min: number;
  max: number;
};

function buildTemplate(scale: number, bands: Band[]): GradeRange[] {
  const gradePointsByLetter: Record<string, number> = {
    A: scale,
    B: scale - 1,
    C: scale - 2,
    D: scale - 3,
    E: 1,
    F: 0,
  };

  return bands.map((band) => ({
    grade: band.letter,
    min: band.min,
    max: band.max,
    points: gradePointsByLetter[band.letter] ?? 0,
  }));
}

const STANDARD_5_BANDS: Band[] = [
  { letter: "A", min: 70, max: 100 },
  { letter: "B", min: 60, max: 69 },
  { letter: "C", min: 50, max: 59 },
  { letter: "D", min: 45, max: 49 },
  { letter: "E", min: 40, max: 44 },
  { letter: "F", min: 0, max: 39 },
];

const LEGACY_4_BANDS: Band[] = [
  { letter: "A", min: 70, max: 100 },
  { letter: "B", min: 60, max: 69 },
  { letter: "C", min: 50, max: 59 },
  { letter: "D", min: 45, max: 49 },
  { letter: "F", min: 0, max: 44 },
];

const ENGINEERING_5_BANDS: Band[] = [
  { letter: "A", min: 75, max: 100 },
  { letter: "B", min: 70, max: 74 },
  { letter: "C", min: 60, max: 69 },
  { letter: "D", min: 50, max: 59 },
  { letter: "E", min: 45, max: 49 },
  { letter: "F", min: 0, max: 44 },
];

const NBTE_STANDARD_4_BANDS: Band[] = [
  { letter: "A", min: 70, max: 100 },
  { letter: "B", min: 60, max: 69 },
  { letter: "C", min: 50, max: 59 },
  { letter: "D", min: 45, max: 49 },
  { letter: "F", min: 0, max: 44 },
];

const NCCE_STANDARD_5_BANDS: Band[] = [
  { letter: "A", min: 70, max: 100 },
  { letter: "B", min: 60, max: 69 },
  { letter: "C", min: 50, max: 59 },
  { letter: "D", min: 45, max: 49 },
  { letter: "E", min: 40, max: 44 },
  { letter: "F", min: 0, max: 39 },
];

export const gradingTemplates: Record<GradingTemplateId, { scale: number; grades: GradeRange[] }> = {
  nuc_standard_5: {
    scale: 5,
    grades: buildTemplate(5, STANDARD_5_BANDS),
  },
  nuc_revised_5: {
    scale: 5,
    grades: [
      { grade: "A", min: 70, max: 100, points: 5 },
      { grade: "B", min: 60, max: 69, points: 4 },
      { grade: "C", min: 50, max: 59, points: 3 },
      { grade: "D", min: 45, max: 49, points: 2 },
      { grade: "F", min: 0, max: 44, points: 0 },
    ],
  },
  nbte_standard_4_0: {
    scale: 4,
    grades: buildTemplate(4, NBTE_STANDARD_4_BANDS),
  },
  ncce_standard_5: {
    scale: 5,
    grades: buildTemplate(5, NCCE_STANDARD_5_BANDS),
  },
  ui_legacy_4: {
    scale: 4,
    grades: buildTemplate(4, LEGACY_4_BANDS),
  },
  "engineering-5.0": {
    scale: 5,
    grades: buildTemplate(5, ENGINEERING_5_BANDS),
  },
};

export function resolveGradingTemplate(templateId: GradingTemplateId): {
  scale: number;
  grades: GradeRange[];
} {
  const template = gradingTemplates[templateId];
  return {
    scale: template.scale,
    grades: template.grades.map((grade) => ({ ...grade })),
  };
}

export function isOnProbation(currentCGPA: number, probationCGPA: number): boolean {
  return currentCGPA < probationCGPA;
}
