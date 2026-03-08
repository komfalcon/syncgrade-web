import type { UniversityConfig } from "../types";
import {
  DEFAULT_NIGERIAN_GRADES,
  DEFAULT_NIGERIAN_DEGREE_CLASSES,
} from "../types";

/** Federal University of Agriculture, Abeokuta */
export const funaabConfig: UniversityConfig = {
  id: "funaab",
  name: "Federal University of Agriculture, Abeokuta",
  shortName: "FUNAAB",
  country: "Nigeria",
  location: "Abeokuta, Ogun State",
  gradingSystem: {
    scale: 5,
    grades: DEFAULT_NIGERIAN_GRADES,
  },
  degreeClasses: DEFAULT_NIGERIAN_DEGREE_CLASSES,
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
    description:
      "Failure to rise above a 1.00 CGPA after the probation period may lead to dismissal.",
  },
  maxProgramDuration:
    "50% extension beyond the standard duration (e.g., 6 years for a 4-year programme).",
  version: "NUC-standard",
  sourceDocuments: ["Inferred from NUC Minimum Academic Standards"],
};
