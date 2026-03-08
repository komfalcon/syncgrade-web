import type { UniversityConfig } from "../types";
import { DEFAULT_NIGERIAN_GRADES } from "../types";

/** University of Nigeria, Nsukka */
export const unnConfig: UniversityConfig = {
  id: "unn",
  name: "University of Nigeria, Nsukka",
  shortName: "UNN",
  country: "Nigeria",
  location: "Nsukka, Enugu State",
  gradingSystem: {
    scale: 5,
    grades: DEFAULT_NIGERIAN_GRADES,
  },
  degreeClasses: [
    { name: "First Class Honours", minCGPA: 4.50, maxCGPA: 5.00 },
    { name: "Second Class Upper Honours", minCGPA: 3.50, maxCGPA: 4.49 },
    { name: "Second Class Lower Honours", minCGPA: 2.40, maxCGPA: 3.49 },
    { name: "Third Class", minCGPA: 1.50, maxCGPA: 2.39 },
    { name: "Pass", minCGPA: 1.00, maxCGPA: 1.49 },
  ],
  creditRules: {
    minimumCredits: 15,
    maximumPerSemester: 24,
    minimumPerSemester: 15,
    graduationCredits: [
      { min: 120, max: 120, programYears: 4 },
      { min: 150, max: 150, programYears: 5 },
      { min: 180, max: 180, programYears: 6 },
    ],
  },
  repeatPolicy: {
    method: "replace",
    description:
      "Failed courses must be repeated; the new grade replaces the old one in the CGPA calculation.",
  },
  probation: {
    minCGPA: 1.0,
    description: "A student whose CGPA falls below 1.00 is placed on probation.",
  },
  dismissal: {
    description:
      "Two consecutive sessions with a CGPA below 1.00 may lead to dismissal.",
  },
  maxProgramDuration:
    "50% extension beyond the standard duration (e.g., 6 years for a 4-year programme).",
  version: "2013-2014",
  sourceDocuments: ["Undergraduate Academic Regulations (2013/2014)"],
};
