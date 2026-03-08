import 'package:test/test.dart';
import 'package:cgpa_app/engine/calculations.dart';
import 'package:cgpa_app/models/university_config.dart';
import 'package:cgpa_app/models/engine_types.dart';
import 'package:cgpa_app/universities/nigeria/abu.dart';
import 'package:cgpa_app/universities/nigeria/covenant.dart';

final grades = defaultNigerianGrades;
final degreeClasses = defaultNigerianDegreeClasses;

// ---------------------------------------------------------------------------
// getGradePoints
// ---------------------------------------------------------------------------
void main() {
  group('getGradePoints', () {
    test('returns correct points for each grade letter', () {
      expect(getGradePoints('A', grades), equals(5));
      expect(getGradePoints('B', grades), equals(4));
      expect(getGradePoints('C', grades), equals(3));
      expect(getGradePoints('D', grades), equals(2));
      expect(getGradePoints('E', grades), equals(1));
      expect(getGradePoints('F', grades), equals(0));
    });

    test('is case insensitive', () {
      expect(getGradePoints('a', grades), equals(5));
      expect(getGradePoints('b', grades), equals(4));
    });

    test('returns 0 for unknown grades', () {
      expect(getGradePoints('Z', grades), equals(0));
      expect(getGradePoints('', grades), equals(0));
    });
  });

  // ---------------------------------------------------------------------------
  // getGradeForScore
  // ---------------------------------------------------------------------------
  group('getGradeForScore', () {
    test('maps scores to correct grade letters', () {
      expect(getGradeForScore(85, grades), equals('A'));
      expect(getGradeForScore(70, grades), equals('A'));
      expect(getGradeForScore(65, grades), equals('B'));
      expect(getGradeForScore(55, grades), equals('C'));
      expect(getGradeForScore(47, grades), equals('D'));
      expect(getGradeForScore(42, grades), equals('E'));
      expect(getGradeForScore(20, grades), equals('F'));
    });

    test('returns null for out-of-range scores', () {
      expect(getGradeForScore(-1, grades), isNull);
    });
  });

  // ---------------------------------------------------------------------------
  // calculateGPA
  // ---------------------------------------------------------------------------
  group('calculateGPA', () {
    test('returns zero for empty courses', () {
      final result = calculateGPA([], grades);
      expect(result.gpa, equals(0));
      expect(result.totalCredits, equals(0));
    });

    test('calculates GPA correctly for a single course', () {
      final result = calculateGPA(
        [const CourseInput(name: 'MTH101', credits: 3, grade: 'A')],
        grades,
      );
      expect(result.gpa, equals(5));
      expect(result.totalCredits, equals(3));
    });

    test('calculates GPA for multiple courses', () {
      final result = calculateGPA(
        [
          const CourseInput(name: 'MTH101', credits: 3, grade: 'A'),
          const CourseInput(name: 'PHY101', credits: 3, grade: 'C'),
        ],
        grades,
      );
      // (5*3 + 3*3) / 6 = 24/6 = 4.0
      expect(result.gpa, equals(4));
      expect(result.totalCredits, equals(6));
    });
  });

  // ---------------------------------------------------------------------------
  // calculateCGPA
  // ---------------------------------------------------------------------------
  group('calculateCGPA', () {
    test('returns zero for empty semesters', () {
      final result = calculateCGPA([], grades);
      expect(result.cgpa, equals(0));
    });

    test('handles replace policy for repeated courses', () {
      final result = calculateCGPA(
        [
          SemesterInput(
            name: 'Sem 1',
            courses: [const CourseInput(name: 'MTH101', credits: 3, grade: 'F')],
          ),
          SemesterInput(
            name: 'Sem 2',
            courses: [const CourseInput(name: 'MTH101', credits: 3, grade: 'A')],
          ),
        ],
        grades,
        RepeatMethod.replace,
      );
      // Replace: only the latest attempt (A=5) counts; 5*3/3 = 5.0
      expect(result.cgpa, equals(5));
    });

    test('handles both policy for repeated courses', () {
      final result = calculateCGPA(
        [
          SemesterInput(
            name: 'Sem 1',
            courses: [const CourseInput(name: 'MTH101', credits: 3, grade: 'F')],
          ),
          SemesterInput(
            name: 'Sem 2',
            courses: [const CourseInput(name: 'MTH101', credits: 3, grade: 'A')],
          ),
        ],
        grades,
        RepeatMethod.both,
      );
      // Both: (0*3 + 5*3) / (3+3) = 15/6 = 2.5
      expect(result.cgpa, equals(2.5));
    });

    test('handles highest policy for repeated courses', () {
      final result = calculateCGPA(
        [
          SemesterInput(
            name: 'Sem 1',
            courses: [const CourseInput(name: 'MTH101', credits: 3, grade: 'C')],
          ),
          SemesterInput(
            name: 'Sem 2',
            courses: [const CourseInput(name: 'MTH101', credits: 3, grade: 'A')],
          ),
        ],
        grades,
        RepeatMethod.highest,
      );
      // Highest: best QP wins (A=5); 5*3/3 = 5.0
      expect(result.cgpa, equals(5));
    });

    test('handles average policy for repeated courses', () {
      final result = calculateCGPA(
        [
          SemesterInput(
            name: 'Sem 1',
            courses: [const CourseInput(name: 'MTH101', credits: 3, grade: 'F')],
          ),
          SemesterInput(
            name: 'Sem 2',
            courses: [const CourseInput(name: 'MTH101', credits: 3, grade: 'A')],
          ),
        ],
        grades,
        RepeatMethod.average,
      );
      // Average: QP averaged = (0 + 15) / 2 = 7.5; CGPA = 7.5 / 3 = 2.5
      expect(result.cgpa, equals(2.5));
    });
  });

  // ---------------------------------------------------------------------------
  // projectCGPA
  // ---------------------------------------------------------------------------
  group('projectCGPA', () {
    test('calculates required GPA to reach target', () {
      final result = projectCGPA(3.0, 60, 4.0, 60, 5);
      // requiredGPA = (4.0 * 120 - 3.0 * 60) / 60 = (480 - 180) / 60 = 5.0
      expect(result.requiredGPA, equals(5));
      expect(result.isAchievable, isTrue);
    });

    test('marks unachievable when required GPA exceeds scale', () {
      final result = projectCGPA(2.0, 100, 4.5, 20, 5);
      expect(result.isAchievable, isFalse);
    });

    test('handles zero remaining credits', () {
      final result = projectCGPA(4.0, 120, 4.5, 0, 5);
      expect(result.isAchievable, isFalse);
    });
  });

  // ---------------------------------------------------------------------------
  // simulateWhatIf
  // ---------------------------------------------------------------------------
  group('simulateWhatIf', () {
    test('projects CGPA after hypothetical courses', () {
      final result = simulateWhatIf(
        3.0,
        60,
        const WhatIfScenario(
          courses: [CourseInput(name: 'NEW101', credits: 3, grade: 'A')],
          semesterName: 'Test',
        ),
        grades,
        degreeClasses,
      );
      // New QP = 5*3 = 15, total QP = 180+15 = 195, total credits = 63
      // CGPA = 195/63 ≈ 3.10
      expect(result.projectedCGPA, greaterThan(3.0));
      expect(result.change, greaterThan(0));
    });
  });

  // ---------------------------------------------------------------------------
  // carryoverImpact
  // ---------------------------------------------------------------------------
  group('carryoverImpact', () {
    test('calculates impact with replace policy', () {
      final result = carryoverImpact(
        3.0,
        60,
        [
          const FailedCourseInput(
            name: 'MTH101',
            credits: 3,
            originalGrade: 'F',
            newGrade: 'B',
          ),
        ],
        grades,
        RepeatMethod.replace,
      );
      expect(result.projectedCGPA, greaterThan(3.0));
      expect(result.cgpaChange, greaterThan(0));
    });

    test('calculates impact with highest policy', () {
      final result = carryoverImpact(
        3.0,
        60,
        [
          const FailedCourseInput(
            name: 'MTH101',
            credits: 3,
            originalGrade: 'C',
            newGrade: 'B',
          ),
        ],
        grades,
        RepeatMethod.highest,
      );
      // Highest of C(3) and B(4) is B(4); improvement over C
      expect(result.projectedCGPA, greaterThan(3.0));
    });

    test('returns unchanged CGPA for empty failed courses', () {
      final result = carryoverImpact(3.5, 60, [], grades, RepeatMethod.replace);
      expect(result.projectedCGPA, equals(3.5));
      expect(result.cgpaChange, equals(0));
    });
  });

  // ---------------------------------------------------------------------------
  // getDegreeClass
  // ---------------------------------------------------------------------------
  group('getDegreeClass', () {
    test('classifies CGPA into correct degree class', () {
      expect(getDegreeClass(4.75, degreeClasses), equals('First Class'));
      expect(
          getDegreeClass(3.80, degreeClasses), equals('Second Class Upper'));
      expect(
          getDegreeClass(2.80, degreeClasses), equals('Second Class Lower'));
      expect(getDegreeClass(1.80, degreeClasses), equals('Third Class'));
      expect(getDegreeClass(1.20, degreeClasses), equals('Pass'));
      expect(getDegreeClass(0.50, degreeClasses), equals('Fail'));
    });

    test('returns Unclassified for out-of-range CGPA', () {
      expect(getDegreeClass(6.0, degreeClasses), equals('Unclassified'));
    });
  });

  // ---------------------------------------------------------------------------
  // assessDegreeRisk
  // ---------------------------------------------------------------------------
  group('assessDegreeRisk', () {
    test('returns safe for CGPA well within class bounds', () {
      // Second Class Lower (2.40-3.49) — CGPA of 3.40 is 1.0 above boundary
      final result = assessDegreeRisk(3.40, degreeClasses, 10, 150);
      expect(result.level, equals(RiskLevel.safe));
      expect(result.currentClass, equals('Second Class Lower'));
    });

    test('returns higher risk closer to class boundary', () {
      final result = assessDegreeRisk(4.51, degreeClasses, 120, 150);
      expect(
        [RiskLevel.warning, RiskLevel.danger, RiskLevel.critical],
        contains(result.level),
      );
    });
  });

  // ---------------------------------------------------------------------------
  // projectBestWorstCase
  // ---------------------------------------------------------------------------
  group('projectBestWorstCase', () {
    test('projects best case with scale=5', () {
      final result =
          projectBestWorstCase(3.0, 60, 60, 5, degreeClasses);
      // Best: (3.0*60 + 5*60) / 120 = (180+300)/120 = 4.0
      expect(result.bestCase.cgpa, equals(4));
      // Worst: (180+0)/120 = 1.5
      expect(result.worstCase.cgpa, equals(1.5));
      expect(result.currentCase.cgpa, equals(3.0));
    });
  });

  // ---------------------------------------------------------------------------
  // recommendStudyLoad
  // ---------------------------------------------------------------------------
  group('recommendStudyLoad', () {
    test('returns a recommendation with courses', () {
      final result = recommendStudyLoad(3.0, 60, 4.0, abuConfig);
      expect(result.recommendedCredits, greaterThan(0));
      expect(result.courses.length, greaterThan(0));
      expect(result.reason.length, greaterThan(0));
    });

    test('suggests minimum load when target already exceeded', () {
      final result = recommendStudyLoad(4.8, 120, 3.5, abuConfig);
      expect(result.targetGPA, equals(0));
    });
  });

  // ---------------------------------------------------------------------------
  // analyzePerformanceTrends
  // ---------------------------------------------------------------------------
  group('analyzePerformanceTrends', () {
    test('returns empty for no semesters', () {
      expect(analyzePerformanceTrends([]), isEmpty);
    });

    test('detects improving trend', () {
      final results = analyzePerformanceTrends([
        const SemesterTrendInput(name: 'Sem 1', gpa: 2.0, credits: 18),
        const SemesterTrendInput(name: 'Sem 2', gpa: 4.0, credits: 18),
      ]);
      expect(results[1].trend, equals('improving'));
    });

    test('detects declining trend', () {
      final results = analyzePerformanceTrends([
        const SemesterTrendInput(name: 'Sem 1', gpa: 4.0, credits: 18),
        const SemesterTrendInput(name: 'Sem 2', gpa: 2.0, credits: 18),
      ]);
      expect(results[1].trend, equals('declining'));
    });

    test('tracks cumulative GPA', () {
      final results = analyzePerformanceTrends([
        const SemesterTrendInput(name: 'Sem 1', gpa: 4.0, credits: 18),
        const SemesterTrendInput(name: 'Sem 2', gpa: 3.0, credits: 18),
      ]);
      // cumulative: (4*18 + 3*18) / 36 = 126/36 = 3.5
      expect(results[1].cgpa, equals(3.5));
    });
  });

  // ---------------------------------------------------------------------------
  // validateUniversityConfig
  // ---------------------------------------------------------------------------
  group('validateUniversityConfig', () {
    test('validates a correct config without warnings', () {
      final result = validateUniversityConfig(abuConfig);
      expect(result.valid, isTrue);
      expect(result.warnings, isEmpty);
    });

    test('warns when id is missing', () {
      final broken = UniversityConfig(
        id: '',
        name: abuConfig.name,
        shortName: abuConfig.shortName,
        country: abuConfig.country,
        location: abuConfig.location,
        gradingSystem: abuConfig.gradingSystem,
        degreeClasses: abuConfig.degreeClasses,
        creditRules: abuConfig.creditRules,
        repeatPolicy: abuConfig.repeatPolicy,
        probation: abuConfig.probation,
        dismissal: abuConfig.dismissal,
        maxProgramDuration: abuConfig.maxProgramDuration,
        version: abuConfig.version,
        sourceDocuments: abuConfig.sourceDocuments,
      );
      final result = validateUniversityConfig(broken);
      expect(result.warnings, contains('Missing university id.'));
    });

    test('validates Covenant University config', () {
      final result = validateUniversityConfig(covenantConfig);
      expect(result.valid, isTrue);
    });
  });
}
