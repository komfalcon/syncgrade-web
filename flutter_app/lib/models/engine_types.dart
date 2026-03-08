/// Engine-specific types for CGPA calculations.
/// These types are used by the pure calculation functions.
library;

class CourseInput {
  final String name;
  final int credits;
  final String grade;
  final bool isCarryover;
  final String? semester;

  const CourseInput({
    required this.name,
    required this.credits,
    required this.grade,
    this.isCarryover = false,
    this.semester,
  });

  Map<String, dynamic> toJson() => {
        'name': name,
        'credits': credits,
        'grade': grade,
        'isCarryover': isCarryover,
        if (semester != null) 'semester': semester,
      };

  factory CourseInput.fromJson(Map<String, dynamic> json) => CourseInput(
        name: json['name'] as String,
        credits: json['credits'] as int,
        grade: json['grade'] as String,
        isCarryover: json['isCarryover'] as bool? ?? false,
        semester: json['semester'] as String?,
      );
}

class CourseResult {
  final String name;
  final int credits;
  final String grade;
  final double gradePoints;
  final double qualityPoints; // gradePoints * credits

  const CourseResult({
    required this.name,
    required this.credits,
    required this.grade,
    required this.gradePoints,
    required this.qualityPoints,
  });
}

class GPAResult {
  final double gpa;
  final int totalCredits;
  final double totalQualityPoints;
  final List<CourseResult> courses;

  const GPAResult({
    required this.gpa,
    required this.totalCredits,
    required this.totalQualityPoints,
    required this.courses,
  });
}

class SemesterResult {
  final String semester;
  final double gpa;
  final int credits;
  final double qualityPoints;

  const SemesterResult({
    required this.semester,
    required this.gpa,
    required this.credits,
    required this.qualityPoints,
  });
}

class CGPAResult {
  final double cgpa;
  final int totalCredits;
  final double totalQualityPoints;
  final List<SemesterResult> semesterResults;

  const CGPAResult({
    required this.cgpa,
    required this.totalCredits,
    required this.totalQualityPoints,
    required this.semesterResults,
  });
}

class ProjectionResult {
  final double currentCGPA;
  final double targetCGPA;
  final double requiredGPA;
  final bool isAchievable;
  final int remainingCredits;
  final int completedCredits;

  const ProjectionResult({
    required this.currentCGPA,
    required this.targetCGPA,
    required this.requiredGPA,
    required this.isAchievable,
    required this.remainingCredits,
    required this.completedCredits,
  });
}

class WhatIfScenario {
  final List<CourseInput> courses;
  final String semesterName;

  const WhatIfScenario({
    required this.courses,
    required this.semesterName,
  });
}

class WhatIfResult {
  final double originalCGPA;
  final double projectedCGPA;
  final double semesterGPA;
  final double change;
  final int newTotalCredits;
  final String degreeClass;
  final String previousDegreeClass;

  const WhatIfResult({
    required this.originalCGPA,
    required this.projectedCGPA,
    required this.semesterGPA,
    required this.change,
    required this.newTotalCredits,
    required this.degreeClass,
    required this.previousDegreeClass,
  });
}

class CarryoverCourseAnalysis {
  final String name;
  final int credits;
  final String originalGrade;
  final double originalPoints;
  final String newGrade;
  final double newPoints;
  final double creditImpact;

  const CarryoverCourseAnalysis({
    required this.name,
    required this.credits,
    required this.originalGrade,
    required this.originalPoints,
    required this.newGrade,
    required this.newPoints,
    required this.creditImpact,
  });
}

class CarryoverImpactResult {
  final double currentCGPA;
  final double projectedCGPA;
  final double cgpaChange;
  final List<CarryoverCourseAnalysis> coursesAnalyzed;

  const CarryoverImpactResult({
    required this.currentCGPA,
    required this.projectedCGPA,
    required this.cgpaChange,
    required this.coursesAnalyzed,
  });
}

enum RiskLevel { safe, warning, danger, critical }

class DegreeRiskLevel {
  final RiskLevel level;
  final String message;
  final String currentClass;
  final String? nextClassDown;
  final double cgpaToNextClassDown;
  final double? cgpaToNextClassUp;

  const DegreeRiskLevel({
    required this.level,
    required this.message,
    required this.currentClass,
    required this.nextClassDown,
    required this.cgpaToNextClassDown,
    required this.cgpaToNextClassUp,
  });
}

class CaseProjection {
  final double cgpa;
  final String degreeClass;

  const CaseProjection({
    required this.cgpa,
    required this.degreeClass,
  });
}

class BestCaseProjection extends CaseProjection {
  final double gpaNeeded;

  const BestCaseProjection({
    required super.cgpa,
    required super.degreeClass,
    required this.gpaNeeded,
  });
}

class BestWorstProjection {
  final BestCaseProjection bestCase;
  final CaseProjection worstCase;
  final CaseProjection currentCase;
  final int remainingCredits;

  const BestWorstProjection({
    required this.bestCase,
    required this.worstCase,
    required this.currentCase,
    required this.remainingCredits,
  });
}

class StudyLoadCourse {
  final int credits;
  final String minGrade;

  const StudyLoadCourse({
    required this.credits,
    required this.minGrade,
  });
}

class StudyLoadRecommendation {
  final int recommendedCredits;
  final double targetGPA;
  final List<StudyLoadCourse> courses;
  final String reason;

  const StudyLoadRecommendation({
    required this.recommendedCredits,
    required this.targetGPA,
    required this.courses,
    required this.reason,
  });
}

class PerformanceTrend {
  final String semester;
  final double gpa;
  final double cgpa;
  final int credits;
  final String trend; // "improving" | "declining" | "stable"
  final String? improvementMarker;

  const PerformanceTrend({
    required this.semester,
    required this.gpa,
    required this.cgpa,
    required this.credits,
    required this.trend,
    this.improvementMarker,
  });
}

class SemesterInput {
  final String name;
  final List<CourseInput> courses;

  const SemesterInput({
    required this.name,
    required this.courses,
  });

  Map<String, dynamic> toJson() => {
        'name': name,
        'courses': courses.map((c) => c.toJson()).toList(),
      };

  factory SemesterInput.fromJson(Map<String, dynamic> json) => SemesterInput(
        name: json['name'] as String,
        courses: (json['courses'] as List<dynamic>)
            .map((c) => CourseInput.fromJson(c as Map<String, dynamic>))
            .toList(),
      );
}

class FailedCourseInput {
  final String name;
  final int credits;
  final String originalGrade;
  final String newGrade;

  const FailedCourseInput({
    required this.name,
    required this.credits,
    required this.originalGrade,
    required this.newGrade,
  });
}

class SemesterTrendInput {
  final String name;
  final double gpa;
  final int credits;

  const SemesterTrendInput({
    required this.name,
    required this.gpa,
    required this.credits,
  });
}

class ConfigValidationResult {
  final bool valid;
  final List<String> warnings;

  const ConfigValidationResult({
    required this.valid,
    required this.warnings,
  });
}
