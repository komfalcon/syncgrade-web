export const COOKIE_NAME = "app_session_id";
export const ONE_YEAR_MS = 1000 * 60 * 60 * 24 * 365;

export const DEFAULT_MAX_SEMESTER_UNITS = 24;

export const DEFAULT_NIGERIAN_GRADES = [
  { grade: "A", min: 70, max: 100, points: 5.0 },
  { grade: "B", min: 60, max: 69, points: 4.0 },
  { grade: "C", min: 50, max: 59, points: 3.0 },
  { grade: "D", min: 45, max: 49, points: 2.0 },
  { grade: "E", min: 40, max: 44, points: 1.0 },
  { grade: "F", min: 0, max: 39, points: 0.0 },
] as const;

export const DEFAULT_NIGERIAN_DEGREE_CLASSES = [
  { name: "First Class", minCGPA: 4.5, maxCGPA: 5.0 },
  { name: "Second Class Upper", minCGPA: 3.5, maxCGPA: 4.49 },
  { name: "Second Class Lower", minCGPA: 2.4, maxCGPA: 3.49 },
  { name: "Third Class", minCGPA: 1.5, maxCGPA: 2.39 },
  { name: "Pass", minCGPA: 1.0, maxCGPA: 1.49 },
  { name: "Fail", minCGPA: 0.0, maxCGPA: 0.99 },
] as const;
