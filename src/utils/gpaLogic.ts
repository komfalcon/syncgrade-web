export interface ClassificationResult {
  label: string;
  color: string;
  tier: 1 | 2 | 3 | 4 | 5;
}

type ScaleBand = {
  min: number;
  max: number;
  result: ClassificationResult;
};

const SCALE_5_BANDS: ScaleBand[] = [
  { min: 4.5, max: 5.0, result: { label: "First Class", color: "text-emerald-600", tier: 1 } },
  { min: 3.5, max: 4.49, result: { label: "Second Upper", color: "text-cyan-600", tier: 2 } },
  { min: 2.4, max: 3.49, result: { label: "Second Lower", color: "text-amber-600", tier: 3 } },
  { min: 1.5, max: 2.39, result: { label: "Third Class", color: "text-orange-600", tier: 4 } },
  { min: 0.0, max: 1.49, result: { label: "Pass", color: "text-rose-600", tier: 5 } },
];

const SCALE_4_BANDS: ScaleBand[] = [
  { min: 3.5, max: 4.0, result: { label: "First Class", color: "text-emerald-600", tier: 1 } },
  { min: 3.0, max: 3.49, result: { label: "Second Upper", color: "text-cyan-600", tier: 2 } },
  { min: 2.0, max: 2.99, result: { label: "Second Lower", color: "text-amber-600", tier: 3 } },
  { min: 1.0, max: 1.99, result: { label: "Third Class", color: "text-orange-600", tier: 4 } },
  { min: 0.0, max: 0.99, result: { label: "Pass", color: "text-rose-600", tier: 5 } },
];

const FALLBACK_RESULT: ClassificationResult = {
  label: "Pass",
  color: "text-rose-600",
  tier: 5,
};

export function getClassification(gpa: number, scale: 4.0 | 5.0): ClassificationResult {
  const safeGpa = Number.isFinite(gpa) ? Math.max(0, gpa) : 0;
  const bands = scale === 4.0 ? SCALE_4_BANDS : SCALE_5_BANDS;
  const match = bands.find((band) => safeGpa >= band.min && safeGpa <= band.max);
  return match?.result ?? FALLBACK_RESULT;
}

export function normalizeToSupportedScale(scale: number): 4.0 | 5.0 {
  return scale <= 4 ? 4.0 : 5.0;
}
