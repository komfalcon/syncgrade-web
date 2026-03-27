import type { UniversityConfig } from "../types";
import { DEFAULT_NIGERIAN_GRADES } from "../types";

/** University of Benin */
export const unibenConfig: UniversityConfig = {
  id: "uniben",
  name: "University of Benin",
  shortName: "UNIBEN",
  country: "Nigeria",
  location: "Benin City, Edo State",
  gradingSystem: [{
    session_start: "2000/2001",
    session_end: "present",
    scale: 5,
    grades: DEFAULT_NIGERIAN_GRADES,
  }],
  degreeClasses: [
    { name: "First Class Honours", minCGPA: 4.50, maxCGPA: 5.00 },
    { name: "Second Class Upper", minCGPA: 3.50, maxCGPA: 4.49 },
    { name: "Second Class Lower", minCGPA: 2.40, maxCGPA: 3.49 },
    { name: "Third Class", minCGPA: 1.50, maxCGPA: 2.39 },
    { name: "Pass", minCGPA: 1.00, maxCGPA: 1.49 },
  ],
  creditRules: {
    minimumCredits: 15,
    maximumPerSemester: 24,
    minimumPerSemester: 15,
    graduationCredits: [
      { min: 120, max: 150, programYears: 4 },
      { min: 150, max: 190, programYears: 5 },
      { min: 190, max: 225, programYears: 6 },
    ],
  },
  repeatPolicy: {
    method: "both",
    description:
      "Both the original and repeat grades are factored into the CGPA.",
  },
  probation: {
    minCGPA: 1.0,
    description: "A student whose CGPA falls below 1.00 is placed on probation.",
  },
  dismissal: {
    description: "Continuous academic failure may lead to dismissal.",
  },
  maxProgramDuration:
    "50% extension beyond the standard duration (e.g., 6 years for a 4-year programme).",
  version: "2022",
  sourceDocuments: ["Student Information Hand Book (2022)"],
};
