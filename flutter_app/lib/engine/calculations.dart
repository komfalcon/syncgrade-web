import 'dart:math' as math;

import '../models/university_config.dart';
import '../models/engine_types.dart';

/// How quickly the safety buffer decays as the student progresses (0 = no decay, 1 = full).
const double _bufferDecayRate = 0.5;

/// Minimum GPA delta between semesters to be considered a meaningful change.
const double _trendThreshold = 0.1;

/// Default credit weight per course when building study-load recommendations.
const int _defaultCourseCredits = 3;

/// Round a number to [dp] decimal places.
double _round(double value, [int dp = 2]) {
  final factor = math.pow(10, dp).toDouble();
  return (value * factor).roundToDouble() / factor;
}

/// Look up grade points for a grade letter using the grading system.
/// Returns 0 when the grade is not found.
double getGradePoints(String grade, List<GradeRange> grades) {
  final normalised = grade.trim().toUpperCase();
  for (final g in grades) {
    if (g.grade.toUpperCase() == normalised) {
      return g.points;
    }
  }
  return 0;
}

/// Look up the grade letter for a numeric score.
/// Returns null when no matching range is found.
String? getGradeForScore(double score, List<GradeRange> grades) {
  for (final g in grades) {
    if (score >= g.min && score <= g.max) {
      return g.grade;
    }
  }
  return null;
}

/// Calculate GPA for a single set of courses.
/// GPA = Σ(gradePoints × credits) / Σ(credits)
GPAResult calculateGPA(List<CourseInput> courses, List<GradeRange> grades) {
  if (courses.isEmpty) {
    return const GPAResult(
      gpa: 0,
      totalCredits: 0,
      totalQualityPoints: 0,
      courses: [],
    );
  }

  final results = courses.map((c) {
    final gradePoints = getGradePoints(c.grade, grades);
    return CourseResult(
      name: c.name,
      credits: c.credits,
      grade: c.grade,
      gradePoints: gradePoints,
      qualityPoints: _round(gradePoints * c.credits),
    );
  }).toList();

  final totalCredits = results.fold<int>(0, (sum, r) => sum + r.credits);
  final totalQualityPoints =
      results.fold<double>(0, (sum, r) => sum + r.qualityPoints);

  return GPAResult(
    gpa: totalCredits > 0 ? _round(totalQualityPoints / totalCredits) : 0,
    totalCredits: totalCredits,
    totalQualityPoints: _round(totalQualityPoints),
    courses: results,
  );
}

/// Calculate cumulative GPA across multiple semesters.
/// Handles carryover courses based on the provided repeat policy:
///   - "replace": the new attempt fully replaces the old quality points
///   - "average": old and new quality points are averaged
///   - "both":    both attempts count (credits and QP are additive)
///   - "highest": keep only the highest quality points
CGPAResult calculateCGPA(
  List<SemesterInput> semesters,
  List<GradeRange> grades, [
  RepeatMethod repeatPolicy = RepeatMethod.replace,
]) {
  if (semesters.isEmpty) {
    return const CGPAResult(
      cgpa: 0,
      totalCredits: 0,
      totalQualityPoints: 0,
      semesterResults: [],
    );
  }

  // Track each course's best/accumulated record for carryover handling.
  final courseMap = <String, _CourseRecord>{};
  final semesterResults = <SemesterResult>[];

  for (final sem in semesters) {
    final gpaResult = calculateGPA(sem.courses, grades);
    semesterResults.add(SemesterResult(
      semester: sem.name,
      gpa: gpaResult.gpa,
      credits: gpaResult.totalCredits,
      qualityPoints: gpaResult.totalQualityPoints,
    ));

    for (final course in gpaResult.courses) {
      final key = course.name.trim().toLowerCase();
      final existing = courseMap[key];

      if (existing == null) {
        courseMap[key] = _CourseRecord(
          credits: course.credits,
          qualityPoints: course.qualityPoints,
          count: 1,
        );
        continue;
      }

      switch (repeatPolicy) {
        case RepeatMethod.replace:
          // Keep credits constant; use latest quality points.
          existing.qualityPoints = course.qualityPoints;
          existing.count += 1;
          break;

        case RepeatMethod.average:
          // Average all attempts' quality points; credits stay constant.
          existing.qualityPoints =
              (existing.qualityPoints * existing.count +
                      course.qualityPoints) /
                  (existing.count + 1);
          existing.count += 1;
          break;

        case RepeatMethod.both:
          // Both attempts count toward totals.
          existing.credits += course.credits;
          existing.qualityPoints += course.qualityPoints;
          existing.count += 1;
          break;

        case RepeatMethod.highest:
          // Keep only the highest quality points; credits stay constant.
          if (course.qualityPoints > existing.qualityPoints) {
            existing.qualityPoints = course.qualityPoints;
          }
          existing.count += 1;
          break;
      }
    }
  }

  final totalCredits =
      courseMap.values.fold<int>(0, (sum, c) => sum + c.credits);
  final totalQualityPoints = _round(
    courseMap.values.fold<double>(0, (sum, c) => sum + c.qualityPoints),
  );

  return CGPAResult(
    cgpa: totalCredits > 0 ? _round(totalQualityPoints / totalCredits) : 0,
    totalCredits: totalCredits,
    totalQualityPoints: totalQualityPoints,
    semesterResults: semesterResults,
  );
}

/// Project what GPA is needed in remaining credits to achieve a target CGPA.
///
/// Formula:
///   requiredGPA = (targetCGPA × (completedCredits + remainingCredits)
///                  − currentCGPA × completedCredits) / remainingCredits
ProjectionResult projectCGPA(
  double currentCGPA,
  int completedCredits,
  double targetCGPA,
  int remainingCredits,
  double scale,
) {
  if (remainingCredits <= 0) {
    return ProjectionResult(
      currentCGPA: _round(currentCGPA),
      targetCGPA: _round(targetCGPA),
      requiredGPA: 0,
      isAchievable: currentCGPA >= targetCGPA,
      remainingCredits: 0,
      completedCredits: completedCredits,
    );
  }

  final totalCredits = completedCredits + remainingCredits;
  final currentQP = currentCGPA * completedCredits;
  final requiredGPA =
      (targetCGPA * totalCredits - currentQP) / remainingCredits;

  return ProjectionResult(
    currentCGPA: _round(currentCGPA),
    targetCGPA: _round(targetCGPA),
    requiredGPA: _round(requiredGPA),
    isAchievable: requiredGPA >= 0 && requiredGPA <= scale,
    remainingCredits: remainingCredits,
    completedCredits: completedCredits,
  );
}

/// Simulate a what-if scenario: what happens to the CGPA if the student
/// takes specific courses with specific grades.
WhatIfResult simulateWhatIf(
  double currentCGPA,
  int completedCredits,
  WhatIfScenario scenario,
  List<GradeRange> grades,
  List<DegreeClass> degreeClasses,
) {
  final semGPA = calculateGPA(scenario.courses, grades);
  final currentQP = currentCGPA * completedCredits;
  final newTotalCredits = completedCredits + semGPA.totalCredits;
  final newTotalQP = currentQP + semGPA.totalQualityPoints;
  final projectedCGPA =
      newTotalCredits > 0 ? _round(newTotalQP / newTotalCredits) : 0.0;

  return WhatIfResult(
    originalCGPA: _round(currentCGPA),
    projectedCGPA: projectedCGPA,
    semesterGPA: semGPA.gpa,
    change: _round(projectedCGPA - currentCGPA),
    newTotalCredits: newTotalCredits,
    degreeClass: getDegreeClass(projectedCGPA, degreeClasses),
    previousDegreeClass: getDegreeClass(currentCGPA, degreeClasses),
  );
}

/// Calculate the impact of re-taking failed / carryover courses.
///
/// Policies:
///   - "replace": old QP removed, new QP added; total credits unchanged
///   - "both":    new attempt added on top; total credits increase
///   - "average": old QP replaced by average of old & new; credits unchanged
///   - "highest": only the higher QP value is kept; credits unchanged
CarryoverImpactResult carryoverImpact(
  double currentCGPA,
  int totalCredits,
  List<FailedCourseInput> failedCourses,
  List<GradeRange> grades,
  RepeatMethod repeatPolicy,
) {
  if (failedCourses.isEmpty || totalCredits <= 0) {
    return CarryoverImpactResult(
      currentCGPA: _round(currentCGPA),
      projectedCGPA: _round(currentCGPA),
      cgpaChange: 0,
      coursesAnalyzed: [],
    );
  }

  var totalQP = currentCGPA * totalCredits;
  var adjustedCredits = totalCredits;

  final coursesAnalyzed = failedCourses.map((c) {
    final originalPoints = getGradePoints(c.originalGrade, grades);
    final newPoints = getGradePoints(c.newGrade, grades);
    final oldQP = originalPoints * c.credits;
    final newQP = newPoints * c.credits;

    switch (repeatPolicy) {
      case RepeatMethod.replace:
        totalQP = totalQP - oldQP + newQP;
        break;
      case RepeatMethod.both:
        totalQP += newQP;
        adjustedCredits += c.credits;
        break;
      case RepeatMethod.average:
        final avgQP = (oldQP + newQP) / 2;
        totalQP = totalQP - oldQP + avgQP;
        break;
      case RepeatMethod.highest:
        final highestQP = math.max(oldQP, newQP);
        totalQP = totalQP - oldQP + highestQP;
        break;
    }

    return CarryoverCourseAnalysis(
      name: c.name,
      credits: c.credits,
      originalGrade: c.originalGrade,
      originalPoints: originalPoints,
      newGrade: c.newGrade,
      newPoints: newPoints,
      creditImpact: _round(newQP - oldQP),
    );
  }).toList();

  final projectedCGPA =
      adjustedCredits > 0 ? _round(totalQP / adjustedCredits) : 0.0;

  return CarryoverImpactResult(
    currentCGPA: _round(currentCGPA),
    projectedCGPA: projectedCGPA,
    cgpaChange: _round(projectedCGPA - currentCGPA),
    coursesAnalyzed: coursesAnalyzed,
  );
}

/// Determine the current degree class from a CGPA value.
/// Returns "Unclassified" when no matching class is found.
String getDegreeClass(double cgpa, List<DegreeClass> degreeClasses) {
  final sorted = List<DegreeClass>.from(degreeClasses)
    ..sort((a, b) => b.minCGPA.compareTo(a.minCGPA));
  for (final dc in sorted) {
    if (cgpa >= dc.minCGPA && cgpa <= dc.maxCGPA) {
      return dc.name;
    }
  }
  return 'Unclassified';
}

/// Assess degree risk based on current CGPA and class boundaries.
///
/// Risk is determined by how close the CGPA is to the lower boundary of the
/// current degree class, expressed as a fraction of remaining academic capacity.
DegreeRiskLevel assessDegreeRisk(
  double cgpa,
  List<DegreeClass> degreeClasses,
  int completedCredits,
  int totalProgramCredits,
) {
  final sorted = List<DegreeClass>.from(degreeClasses)
    ..sort((a, b) => b.minCGPA.compareTo(a.minCGPA));

  var currentIdx = -1;
  for (var i = 0; i < sorted.length; i++) {
    if (cgpa >= sorted[i].minCGPA && cgpa <= sorted[i].maxCGPA) {
      currentIdx = i;
      break;
    }
  }

  final currentClass =
      currentIdx >= 0 ? sorted[currentIdx] : sorted[sorted.length - 1];
  final nextClassDown =
      (currentIdx >= 0 && currentIdx < sorted.length - 1)
          ? sorted[currentIdx + 1]
          : null;
  final nextClassUp = currentIdx > 0 ? sorted[currentIdx - 1] : null;

  final distDown = _round(cgpa - currentClass.minCGPA);
  final distUp = nextClassUp != null
      ? _round(nextClassUp.minCGPA - cgpa)
      : null;

  final progressRatio =
      totalProgramCredits > 0 ? completedCredits / totalProgramCredits : 0.0;

  // Buffer shrinks as the student progresses through the programme.
  final effectiveBuffer = distDown * (1 - progressRatio * _bufferDecayRate);

  RiskLevel level;
  String message;

  if (effectiveBuffer > 0.5) {
    level = RiskLevel.safe;
    message =
        'Comfortably within ${currentClass.name} ($distDown above boundary).';
  } else if (effectiveBuffer > 0.25) {
    level = RiskLevel.warning;
    message =
        'Getting close to the ${currentClass.name} lower boundary — only $distDown above.';
  } else if (effectiveBuffer > 0.1) {
    level = RiskLevel.danger;
    message =
        'At risk of dropping below ${currentClass.name} — $distDown above boundary with ${_round((1 - progressRatio) * 100)}% of credits remaining.';
  } else {
    level = RiskLevel.critical;
    message =
        'Critically close to losing ${currentClass.name} — only $distDown above boundary.';
  }

  return DegreeRiskLevel(
    level: level,
    message: message,
    currentClass: currentClass.name,
    nextClassDown: nextClassDown?.name,
    cgpaToNextClassDown: distDown,
    cgpaToNextClassUp: distUp,
  );
}

/// Calculate best-case and worst-case CGPA projections given remaining credits.
BestWorstProjection projectBestWorstCase(
  double currentCGPA,
  int completedCredits,
  int remainingCredits,
  double scale,
  List<DegreeClass> degreeClasses,
) {
  final currentQP = currentCGPA * completedCredits;
  final totalCredits = completedCredits + remainingCredits;

  final bestQP = currentQP + scale * remainingCredits;
  final bestCGPA = totalCredits > 0 ? _round(bestQP / totalCredits) : 0.0;

  final worstQP = currentQP; // worst case: 0 grade points for all remaining
  final worstCGPA = totalCredits > 0 ? _round(worstQP / totalCredits) : 0.0;

  // GPA needed in remaining credits to maintain current CGPA
  final gpaNeeded = remainingCredits > 0
      ? _round((currentCGPA * totalCredits - currentQP) / remainingCredits)
      : 0.0;

  return BestWorstProjection(
    bestCase: BestCaseProjection(
      cgpa: bestCGPA,
      degreeClass: getDegreeClass(bestCGPA, degreeClasses),
      gpaNeeded: gpaNeeded,
    ),
    worstCase: CaseProjection(
      cgpa: worstCGPA,
      degreeClass: getDegreeClass(worstCGPA, degreeClasses),
    ),
    currentCase: CaseProjection(
      cgpa: _round(currentCGPA),
      degreeClass: getDegreeClass(currentCGPA, degreeClasses),
    ),
    remainingCredits: remainingCredits,
  );
}

/// Recommend an optimal study load for a target GPA.
///
/// Heuristic: pick the maximum allowed credits and determine the minimum
/// uniform grade needed across standard 3-credit courses to reach the target.
StudyLoadRecommendation recommendStudyLoad(
  double currentCGPA,
  int completedCredits,
  double targetCGPA,
  UniversityConfig config,
) {
  final grades = config.gradingSystem.grades;
  final scale = config.gradingSystem.scale;
  final maxCredits = config.creditRules.maximumPerSemester;
  final minCredits = config.creditRules.minimumPerSemester;

  final currentQP = currentCGPA * completedCredits;
  final totalWithMax = completedCredits + maxCredits;
  final requiredGPAMax =
      maxCredits > 0 ? (targetCGPA * totalWithMax - currentQP) / maxCredits : 0.0;

  // If the target is reachable at max load, prefer max; otherwise fall back to min.
  int recommendedCredits;
  double targetGPA;

  if (requiredGPAMax >= 0 && requiredGPAMax <= scale) {
    recommendedCredits = maxCredits;
    targetGPA = _round(requiredGPAMax);
  } else if (requiredGPAMax < 0) {
    // Target already exceeded — take minimum load.
    recommendedCredits = minCredits;
    targetGPA = 0;
  } else {
    recommendedCredits = maxCredits;
    targetGPA = _round(scale);
  }

  // Find the minimum grade letter that meets or exceeds the required per-course GPA.
  final sortedGrades = List<GradeRange>.from(grades)
    ..sort((a, b) => a.points.compareTo(b.points));
  String minGrade = sortedGrades.last.grade;
  for (final g in sortedGrades) {
    if (g.points >= targetGPA) {
      minGrade = g.grade;
      break;
    }
  }

  // Build a course plan using the default credit unit per course.
  final courseCredits = config.creditRules.minimumCredits > 0
      ? config.creditRules.minimumCredits
      : _defaultCourseCredits;
  final numCourses = recommendedCredits ~/ courseCredits;
  final remainder = recommendedCredits - numCourses * courseCredits;

  final courses = List<StudyLoadCourse>.generate(
    numCourses,
    (_) => StudyLoadCourse(credits: courseCredits, minGrade: minGrade),
  );
  if (remainder > 0) {
    courses.add(StudyLoadCourse(credits: remainder, minGrade: minGrade));
  }

  String reason;
  if (requiredGPAMax < 0) {
    reason =
        'Your CGPA already exceeds the target. A light load of $recommendedCredits credits is sufficient.';
  } else if (requiredGPAMax > scale) {
    reason =
        'Reaching $targetCGPA requires a GPA above $scale — take maximum credits ($maxCredits) and aim for the highest grades possible.';
  } else {
    reason =
        'Taking $recommendedCredits credits and averaging at least a "$minGrade" ($targetGPA GPA) should bring your CGPA to $targetCGPA.';
  }

  return StudyLoadRecommendation(
    recommendedCredits: recommendedCredits,
    targetGPA: targetGPA,
    courses: courses,
    reason: reason,
  );
}

/// Analyze performance trends across semesters.
///
/// Each semester is annotated with a running CGPA and a trend indicator
/// ("improving" / "declining" / "stable").
List<PerformanceTrend> analyzePerformanceTrends(
  List<SemesterTrendInput> semesters,
) {
  if (semesters.isEmpty) return [];

  final results = <PerformanceTrend>[];
  var cumulativeQP = 0.0;
  var cumulativeCredits = 0;

  for (var i = 0; i < semesters.length; i++) {
    final sem = semesters[i];
    cumulativeQP += sem.gpa * sem.credits;
    cumulativeCredits += sem.credits;
    final cgpa =
        cumulativeCredits > 0 ? _round(cumulativeQP / cumulativeCredits) : 0.0;

    var trend = 'stable';
    String? improvementMarker;

    if (i > 0) {
      final prevGPA = semesters[i - 1].gpa;
      final diff = sem.gpa - prevGPA;
      if (diff > _trendThreshold) {
        trend = 'improving';
        improvementMarker = '+${_round(diff)} from previous semester';
      } else if (diff < -_trendThreshold) {
        trend = 'declining';
      }
    }

    results.add(PerformanceTrend(
      semester: sem.name,
      gpa: _round(sem.gpa),
      cgpa: cgpa,
      credits: sem.credits,
      trend: trend,
      improvementMarker: improvementMarker,
    ));
  }

  return results;
}

/// Validate a university config for completeness and correctness.
/// Returns an object with a [valid] flag and a list of warnings.
ConfigValidationResult validateUniversityConfig(UniversityConfig config) {
  final warnings = <String>[];

  if (config.id.isEmpty) warnings.add('Missing university id.');
  if (config.name.isEmpty) warnings.add('Missing university name.');
  if (config.shortName.isEmpty) warnings.add('Missing university shortName.');

  // Grading system
  final gradingSystem = config.gradingSystem;
  if (gradingSystem.grades.isEmpty) {
    warnings.add('Grading system has no grades defined.');
  } else {
    final maxPoints =
        gradingSystem.grades.map((g) => g.points).reduce(math.max);
    if (gradingSystem.scale != maxPoints) {
      warnings.add(
        'Scale (${gradingSystem.scale}) does not match the highest grade points ($maxPoints).',
      );
    }

    // Check for overlapping ranges
    final sorted = List<GradeRange>.from(gradingSystem.grades)
      ..sort((a, b) => a.min.compareTo(b.min));
    for (var i = 1; i < sorted.length; i++) {
      if (sorted[i].min <= sorted[i - 1].max) {
        warnings.add(
          'Overlapping grade ranges: "${sorted[i - 1].grade}" (${sorted[i - 1].min}–${sorted[i - 1].max}) and "${sorted[i].grade}" (${sorted[i].min}–${sorted[i].max}).',
        );
      }
    }
  }

  // Degree classes
  if (config.degreeClasses.isEmpty) {
    warnings.add('No degree classes defined.');
  } else {
    final sortedDC = List<DegreeClass>.from(config.degreeClasses)
      ..sort((a, b) => a.minCGPA.compareTo(b.minCGPA));
    for (var i = 1; i < sortedDC.length; i++) {
      if (sortedDC[i].minCGPA <= sortedDC[i - 1].maxCGPA) {
        warnings.add(
          'Overlapping degree classes: "${sortedDC[i - 1].name}" and "${sortedDC[i].name}".',
        );
      }
    }
  }

  // Credit rules
  final creditRules = config.creditRules;
  if (creditRules.minimumPerSemester > creditRules.maximumPerSemester) {
    warnings.add('Minimum credits per semester exceeds maximum.');
  }
  if (creditRules.minimumCredits <= 0) {
    warnings.add('Minimum credits should be positive.');
  }

  // Repeat policy — always present due to required field

  // Probation
  // ignore: unnecessary_null_comparison
  if (config.probation == null) {
    warnings.add('Missing probation configuration.');
  }

  return ConfigValidationResult(
    valid: warnings.isEmpty,
    warnings: warnings,
  );
}

/// Internal mutable record for tracking course carryovers in CGPA calculation.
class _CourseRecord {
  int credits;
  double qualityPoints;
  int count;

  _CourseRecord({
    required this.credits,
    required this.qualityPoints,
    required this.count,
  });
}
