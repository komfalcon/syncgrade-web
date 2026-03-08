import { describe, it, expect } from "vitest";
import {
  getGradePoints,
  getGradeForScore,
  calculateGPA,
  calculateCGPA,
  projectCGPA,
  simulateWhatIf,
  carryoverImpact,
  getDegreeClass,
  assessDegreeRisk,
  projectBestWorstCase,
  recommendStudyLoad,
  analyzePerformanceTrends,
  validateUniversityConfig,
} from "./calculations";
import {
  DEFAULT_NIGERIAN_GRADES,
  DEFAULT_NIGERIAN_DEGREE_CLASSES,
} from "../universities/types";
import { abuConfig } from "../universities/nigeria/abu";
import { covenantConfig } from "../universities/nigeria/covenant";
import type { UniversityConfig } from "../universities/types";

const grades = DEFAULT_NIGERIAN_GRADES;
const degreeClasses = DEFAULT_NIGERIAN_DEGREE_CLASSES;

// ---------------------------------------------------------------------------
// getGradePoints
// ---------------------------------------------------------------------------
describe("getGradePoints", () => {
  it("returns correct points for each grade letter", () => {
    expect(getGradePoints("A", grades)).toBe(5);
    expect(getGradePoints("B", grades)).toBe(4);
    expect(getGradePoints("C", grades)).toBe(3);
    expect(getGradePoints("D", grades)).toBe(2);
    expect(getGradePoints("E", grades)).toBe(1);
    expect(getGradePoints("F", grades)).toBe(0);
  });

  it("is case insensitive", () => {
    expect(getGradePoints("a", grades)).toBe(5);
    expect(getGradePoints("b", grades)).toBe(4);
  });

  it("returns 0 for unknown grades", () => {
    expect(getGradePoints("Z", grades)).toBe(0);
    expect(getGradePoints("", grades)).toBe(0);
  });
});

// ---------------------------------------------------------------------------
// getGradeForScore
// ---------------------------------------------------------------------------
describe("getGradeForScore", () => {
  it("maps scores to correct grade letters", () => {
    expect(getGradeForScore(85, grades)).toBe("A");
    expect(getGradeForScore(70, grades)).toBe("A");
    expect(getGradeForScore(65, grades)).toBe("B");
    expect(getGradeForScore(55, grades)).toBe("C");
    expect(getGradeForScore(47, grades)).toBe("D");
    expect(getGradeForScore(42, grades)).toBe("E");
    expect(getGradeForScore(20, grades)).toBe("F");
  });

  it("returns null for out-of-range scores", () => {
    expect(getGradeForScore(-1, grades)).toBeNull();
  });
});

// ---------------------------------------------------------------------------
// calculateGPA
// ---------------------------------------------------------------------------
describe("calculateGPA", () => {
  it("returns zero for empty courses", () => {
    const result = calculateGPA([], grades);
    expect(result.gpa).toBe(0);
    expect(result.totalCredits).toBe(0);
  });

  it("calculates GPA correctly for a single course", () => {
    const result = calculateGPA(
      [{ name: "MTH101", credits: 3, grade: "A" }],
      grades,
    );
    expect(result.gpa).toBe(5);
    expect(result.totalCredits).toBe(3);
  });

  it("calculates GPA for multiple courses", () => {
    const result = calculateGPA(
      [
        { name: "MTH101", credits: 3, grade: "A" },
        { name: "PHY101", credits: 3, grade: "C" },
      ],
      grades,
    );
    // (5*3 + 3*3) / 6 = 24/6 = 4.0
    expect(result.gpa).toBe(4);
    expect(result.totalCredits).toBe(6);
  });
});

// ---------------------------------------------------------------------------
// calculateCGPA
// ---------------------------------------------------------------------------
describe("calculateCGPA", () => {
  it("returns zero for empty semesters", () => {
    const result = calculateCGPA([], grades);
    expect(result.cgpa).toBe(0);
  });

  it("handles replace policy for repeated courses", () => {
    const result = calculateCGPA(
      [
        { name: "Sem 1", courses: [{ name: "MTH101", credits: 3, grade: "F" }] },
        { name: "Sem 2", courses: [{ name: "MTH101", credits: 3, grade: "A" }] },
      ],
      grades,
      "replace",
    );
    // Replace: only the latest attempt (A=5) counts; 5*3/3 = 5.0
    expect(result.cgpa).toBe(5);
  });

  it("handles both policy for repeated courses", () => {
    const result = calculateCGPA(
      [
        { name: "Sem 1", courses: [{ name: "MTH101", credits: 3, grade: "F" }] },
        { name: "Sem 2", courses: [{ name: "MTH101", credits: 3, grade: "A" }] },
      ],
      grades,
      "both",
    );
    // Both: (0*3 + 5*3) / (3+3) = 15/6 = 2.5
    expect(result.cgpa).toBe(2.5);
  });

  it("handles highest policy for repeated courses", () => {
    const result = calculateCGPA(
      [
        { name: "Sem 1", courses: [{ name: "MTH101", credits: 3, grade: "C" }] },
        { name: "Sem 2", courses: [{ name: "MTH101", credits: 3, grade: "A" }] },
      ],
      grades,
      "highest",
    );
    // Highest: best QP wins (A=5); 5*3/3 = 5.0
    expect(result.cgpa).toBe(5);
  });

  it("handles average policy for repeated courses", () => {
    const result = calculateCGPA(
      [
        { name: "Sem 1", courses: [{ name: "MTH101", credits: 3, grade: "F" }] },
        { name: "Sem 2", courses: [{ name: "MTH101", credits: 3, grade: "A" }] },
      ],
      grades,
      "average",
    );
    // Average: QP averaged = (0 + 15) / 2 = 7.5; CGPA = 7.5 / 3 = 2.5
    expect(result.cgpa).toBe(2.5);
  });
});

// ---------------------------------------------------------------------------
// projectCGPA
// ---------------------------------------------------------------------------
describe("projectCGPA", () => {
  it("calculates required GPA to reach target", () => {
    const result = projectCGPA(3.0, 60, 4.0, 60, 5);
    // requiredGPA = (4.0 * 120 - 3.0 * 60) / 60 = (480 - 180) / 60 = 5.0
    expect(result.requiredGPA).toBe(5);
    expect(result.isAchievable).toBe(true);
  });

  it("marks unachievable when required GPA exceeds scale", () => {
    const result = projectCGPA(2.0, 100, 4.5, 20, 5);
    expect(result.isAchievable).toBe(false);
  });

  it("handles zero remaining credits", () => {
    const result = projectCGPA(4.0, 120, 4.5, 0, 5);
    expect(result.isAchievable).toBe(false);
  });
});

// ---------------------------------------------------------------------------
// simulateWhatIf
// ---------------------------------------------------------------------------
describe("simulateWhatIf", () => {
  it("projects CGPA after hypothetical courses", () => {
    const result = simulateWhatIf(
      3.0,
      60,
      { courses: [{ name: "NEW101", credits: 3, grade: "A" }], semesterName: "Test" },
      grades,
      degreeClasses,
    );
    // New QP = 5*3 = 15, total QP = 180+15 = 195, total credits = 63
    // CGPA = 195/63 ≈ 3.10
    expect(result.projectedCGPA).toBeGreaterThan(3.0);
    expect(result.change).toBeGreaterThan(0);
  });
});

// ---------------------------------------------------------------------------
// carryoverImpact
// ---------------------------------------------------------------------------
describe("carryoverImpact", () => {
  it("calculates impact with replace policy", () => {
    const result = carryoverImpact(
      3.0,
      60,
      [{ name: "MTH101", credits: 3, originalGrade: "F", newGrade: "B" }],
      grades,
      "replace",
    );
    expect(result.projectedCGPA).toBeGreaterThan(3.0);
    expect(result.cgpaChange).toBeGreaterThan(0);
  });

  it("calculates impact with highest policy", () => {
    const result = carryoverImpact(
      3.0,
      60,
      [{ name: "MTH101", credits: 3, originalGrade: "C", newGrade: "B" }],
      grades,
      "highest",
    );
    // Highest of C(3) and B(4) is B(4); improvement over C
    expect(result.projectedCGPA).toBeGreaterThan(3.0);
  });

  it("returns unchanged CGPA for empty failed courses", () => {
    const result = carryoverImpact(3.5, 60, [], grades, "replace");
    expect(result.projectedCGPA).toBe(3.5);
    expect(result.cgpaChange).toBe(0);
  });
});

// ---------------------------------------------------------------------------
// getDegreeClass
// ---------------------------------------------------------------------------
describe("getDegreeClass", () => {
  it("classifies CGPA into correct degree class", () => {
    expect(getDegreeClass(4.75, degreeClasses)).toBe("First Class");
    expect(getDegreeClass(3.80, degreeClasses)).toBe("Second Class Upper");
    expect(getDegreeClass(2.80, degreeClasses)).toBe("Second Class Lower");
    expect(getDegreeClass(1.80, degreeClasses)).toBe("Third Class");
    expect(getDegreeClass(1.20, degreeClasses)).toBe("Pass");
    expect(getDegreeClass(0.50, degreeClasses)).toBe("Fail");
  });

  it("returns Unclassified for out-of-range CGPA", () => {
    expect(getDegreeClass(6.0, degreeClasses)).toBe("Unclassified");
  });
});

// ---------------------------------------------------------------------------
// assessDegreeRisk
// ---------------------------------------------------------------------------
describe("assessDegreeRisk", () => {
  it("returns safe for CGPA well within class bounds", () => {
    // Second Class Lower (2.40-3.49) — CGPA of 3.40 is 1.0 above boundary
    const result = assessDegreeRisk(3.40, degreeClasses, 10, 150);
    expect(result.level).toBe("safe");
    expect(result.currentClass).toBe("Second Class Lower");
  });

  it("returns higher risk closer to class boundary", () => {
    const result = assessDegreeRisk(4.51, degreeClasses, 120, 150);
    expect(["warning", "danger", "critical"]).toContain(result.level);
  });
});

// ---------------------------------------------------------------------------
// projectBestWorstCase
// ---------------------------------------------------------------------------
describe("projectBestWorstCase", () => {
  it("projects best case with scale=5", () => {
    const result = projectBestWorstCase(3.0, 60, 60, 5, degreeClasses);
    // Best: (3.0*60 + 5*60) / 120 = (180+300)/120 = 4.0
    expect(result.bestCase.cgpa).toBe(4);
    // Worst: (180+0)/120 = 1.5
    expect(result.worstCase.cgpa).toBe(1.5);
    expect(result.currentCase.cgpa).toBe(3.0);
  });
});

// ---------------------------------------------------------------------------
// recommendStudyLoad
// ---------------------------------------------------------------------------
describe("recommendStudyLoad", () => {
  it("returns a recommendation with courses", () => {
    const result = recommendStudyLoad(3.0, 60, 4.0, abuConfig);
    expect(result.recommendedCredits).toBeGreaterThan(0);
    expect(result.courses.length).toBeGreaterThan(0);
    expect(result.reason.length).toBeGreaterThan(0);
  });

  it("suggests minimum load when target already exceeded", () => {
    const result = recommendStudyLoad(4.8, 120, 3.5, abuConfig);
    expect(result.targetGPA).toBe(0);
  });
});

// ---------------------------------------------------------------------------
// analyzePerformanceTrends
// ---------------------------------------------------------------------------
describe("analyzePerformanceTrends", () => {
  it("returns empty for no semesters", () => {
    expect(analyzePerformanceTrends([])).toEqual([]);
  });

  it("detects improving trend", () => {
    const results = analyzePerformanceTrends([
      { name: "Sem 1", gpa: 2.0, credits: 18 },
      { name: "Sem 2", gpa: 4.0, credits: 18 },
    ]);
    expect(results[1].trend).toBe("improving");
  });

  it("detects declining trend", () => {
    const results = analyzePerformanceTrends([
      { name: "Sem 1", gpa: 4.0, credits: 18 },
      { name: "Sem 2", gpa: 2.0, credits: 18 },
    ]);
    expect(results[1].trend).toBe("declining");
  });

  it("tracks cumulative GPA", () => {
    const results = analyzePerformanceTrends([
      { name: "Sem 1", gpa: 4.0, credits: 18 },
      { name: "Sem 2", gpa: 3.0, credits: 18 },
    ]);
    // cumulative: (4*18 + 3*18) / 36 = 126/36 = 3.5
    expect(results[1].cgpa).toBe(3.5);
  });
});

// ---------------------------------------------------------------------------
// validateUniversityConfig
// ---------------------------------------------------------------------------
describe("validateUniversityConfig", () => {
  it("validates a correct config without warnings", () => {
    const result = validateUniversityConfig(abuConfig);
    expect(result.valid).toBe(true);
    expect(result.warnings).toHaveLength(0);
  });

  it("warns when id is missing", () => {
    const broken = { ...abuConfig, id: "" } as UniversityConfig;
    const result = validateUniversityConfig(broken);
    expect(result.warnings).toContain("Missing university id.");
  });

  it("validates Covenant University config", () => {
    const result = validateUniversityConfig(covenantConfig);
    expect(result.valid).toBe(true);
  });
});
