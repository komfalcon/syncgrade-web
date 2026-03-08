import type { UniversityConfig } from "../types";
import { DEFAULT_NIGERIAN_GRADES } from "../types";

/** University of Ibadan */
export const uiConfig: UniversityConfig = {
  id: "ui",
  name: "University of Ibadan",
  shortName: "UI",
  country: "Nigeria",
  location: "Ibadan, Oyo State",
  gradingSystem: {
    scale: 5,
    grades: DEFAULT_NIGERIAN_GRADES,
  },
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
      "Both the original and repeat grades are included in the CGPA calculation.",
  },
  probation: {
    minCGPA: 1.0,
    description: "A student whose CGPA falls below 1.00 is placed on probation.",
  },
  dismissal: {
    description: "Sustained low academic performance may lead to dismissal.",
  },
  maxProgramDuration:
    "50% extension beyond the standard duration (e.g., 6 years for a 4-year programme).",
  version: "academic-regulations",
  sourceDocuments: ["University of Ibadan Academic Regulations"],
};
