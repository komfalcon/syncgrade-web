import type { UniversityConfig } from "../types";
import {
  DEFAULT_NIGERIAN_GRADES,
  DEFAULT_NIGERIAN_DEGREE_CLASSES,
} from "../types";

/** Ahmadu Bello University, Zaria */
export const abuConfig: UniversityConfig = {
  id: "abu",
  name: "Ahmadu Bello University, Zaria",
  shortName: "ABU",
  country: "Nigeria",
  location: "Zaria, Kaduna State",
  gradingSystem: [{
    session_start: "2000/2001",
    session_end: "present",
    scale: 5,
    grades: DEFAULT_NIGERIAN_GRADES,
  }],
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
      "Both the initial and resit grades count in the CGPA calculation.",
  },
  probation: {
    minCGPA: 1.0,
    description: "A student whose CGPA falls below 1.00 is placed on probation.",
  },
  dismissal: {
    description:
      "Two consecutive semesters on probation may lead to dismissal.",
  },
  maxProgramDuration:
    "50% extension beyond the standard duration (e.g., 6 years for a 4-year programme).",
  version: "2021-2022",
  sourceDocuments: ["Undergraduate Student Handbook (2021/2022 Session)"],
};
