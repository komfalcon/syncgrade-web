import type { UniversityConfig } from "../types";
import { DEFAULT_NIGERIAN_GRADES } from "../types";

/** Obafemi Awolowo University, Ile-Ife */
export const oauConfig: UniversityConfig = {
  id: "oau",
  name: "Obafemi Awolowo University, Ile-Ife",
  shortName: "OAU",
  country: "Nigeria",
  location: "Ile-Ife, Osun State",
  gradingSystem: [{
    session_start: "2000/2001",
    session_end: "present",
    scale: 5,
    grades: DEFAULT_NIGERIAN_GRADES,
  }],
  degreeClasses: [
    { name: "First Class", minCGPA: 4.50, maxCGPA: 5.00 },
    { name: "Second Class Upper", minCGPA: 3.50, maxCGPA: 4.49 },
    { name: "Second Class Lower", minCGPA: 2.40, maxCGPA: 3.49 },
    { name: "Third Class", minCGPA: 1.50, maxCGPA: 2.39 },
    { name: "Pass", minCGPA: 1.00, maxCGPA: 1.49 },
  ],
  creditRules: {
    minimumCredits: 16,
    maximumPerSemester: 24,
    minimumPerSemester: 16,
    // Not specified in the source handbook
    graduationCredits: [],
  },
  repeatPolicy: {
    method: "replace",
    description:
      "Failed courses must be repeated; electives may be substituted. The new grade replaces the old one.",
  },
  probation: {
    minCGPA: 1.0,
    description: "A student whose CGPA falls below 1.00 is placed on probation.",
  },
  dismissal: {
    description:
      "Two consecutive sessions on probation may lead to dismissal.",
  },
  maxProgramDuration:
    "50% extension beyond the standard duration (e.g., 6 years for a 4-year programme).",
  version: "faculty-handbook",
  sourceDocuments: ["Faculty Handbook (Faculty of Technology)"],
};
