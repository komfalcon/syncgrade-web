import type { GradeRange } from "../types";

export type GradingTemplateId = "standard-5.0" | "legacy-4.0" | "engineering-5.0";

type Band = {
  letter: string;
  min: number;
  max: number;
};

function buildTemplate(scale: number, bands: Band[]): GradeRange[] {
  return bands.map((band, index) => ({
    grade: band.letter,
    min: band.min,
    max: band.max,
    points: Math.max(scale - index, 0),
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

export const gradingTemplates: Record<GradingTemplateId, { scale: number; grades: GradeRange[] }> = {
  "standard-5.0": {
    scale: 5,
    grades: buildTemplate(5, STANDARD_5_BANDS),
  },
  "legacy-4.0": {
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
