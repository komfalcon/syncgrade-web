/// University configuration types for the CGPA academic platform.
/// Each university config is a standalone, validated data structure
/// that the engine layer consumes without hard-coding any university-specific logic.
library;

class GradeRange {
  final String grade;
  final double min;
  final double max;
  final double points;

  const GradeRange({
    required this.grade,
    required this.min,
    required this.max,
    required this.points,
  });

  Map<String, dynamic> toJson() => {
        'grade': grade,
        'min': min,
        'max': max,
        'points': points,
      };

  factory GradeRange.fromJson(Map<String, dynamic> json) => GradeRange(
        grade: json['grade'] as String,
        min: (json['min'] as num).toDouble(),
        max: (json['max'] as num).toDouble(),
        points: (json['points'] as num).toDouble(),
      );
}

class DegreeClass {
  final String name;
  final double minCGPA;
  final double maxCGPA;

  const DegreeClass({
    required this.name,
    required this.minCGPA,
    required this.maxCGPA,
  });

  Map<String, dynamic> toJson() => {
        'name': name,
        'minCGPA': minCGPA,
        'maxCGPA': maxCGPA,
      };

  factory DegreeClass.fromJson(Map<String, dynamic> json) => DegreeClass(
        name: json['name'] as String,
        minCGPA: (json['minCGPA'] as num).toDouble(),
        maxCGPA: (json['maxCGPA'] as num).toDouble(),
      );
}

class GraduationCredits {
  final int min;
  final int max;
  final int programYears;

  const GraduationCredits({
    required this.min,
    required this.max,
    required this.programYears,
  });

  Map<String, dynamic> toJson() => {
        'min': min,
        'max': max,
        'programYears': programYears,
      };

  factory GraduationCredits.fromJson(Map<String, dynamic> json) =>
      GraduationCredits(
        min: json['min'] as int,
        max: json['max'] as int,
        programYears: json['programYears'] as int,
      );
}

class CreditRules {
  final int minimumCredits;
  final int maximumPerSemester;
  final int minimumPerSemester;
  final List<GraduationCredits> graduationCredits;

  const CreditRules({
    required this.minimumCredits,
    required this.maximumPerSemester,
    required this.minimumPerSemester,
    required this.graduationCredits,
  });

  Map<String, dynamic> toJson() => {
        'minimumCredits': minimumCredits,
        'maximumPerSemester': maximumPerSemester,
        'minimumPerSemester': minimumPerSemester,
        'graduationCredits': graduationCredits.map((g) => g.toJson()).toList(),
      };

  factory CreditRules.fromJson(Map<String, dynamic> json) => CreditRules(
        minimumCredits: json['minimumCredits'] as int,
        maximumPerSemester: json['maximumPerSemester'] as int,
        minimumPerSemester: json['minimumPerSemester'] as int,
        graduationCredits: (json['graduationCredits'] as List<dynamic>)
            .map((g) => GraduationCredits.fromJson(g as Map<String, dynamic>))
            .toList(),
      );
}

enum RepeatMethod { replace, average, both, highest }

class RepeatPolicy {
  final RepeatMethod method;
  final String description;

  const RepeatPolicy({
    required this.method,
    required this.description,
  });

  Map<String, dynamic> toJson() => {
        'method': method.name,
        'description': description,
      };

  factory RepeatPolicy.fromJson(Map<String, dynamic> json) => RepeatPolicy(
        method: RepeatMethod.values.firstWhere(
          (e) => e.name == json['method'],
        ),
        description: json['description'] as String,
      );
}

class Probation {
  final double minCGPA;
  final String description;

  const Probation({
    required this.minCGPA,
    required this.description,
  });

  Map<String, dynamic> toJson() => {
        'minCGPA': minCGPA,
        'description': description,
      };

  factory Probation.fromJson(Map<String, dynamic> json) => Probation(
        minCGPA: (json['minCGPA'] as num).toDouble(),
        description: json['description'] as String,
      );
}

class Dismissal {
  final String description;

  const Dismissal({required this.description});

  Map<String, dynamic> toJson() => {'description': description};

  factory Dismissal.fromJson(Map<String, dynamic> json) =>
      Dismissal(description: json['description'] as String);
}

class UniversityConfig {
  final String id;
  final String name;
  final String shortName;
  final String country;
  final String location;
  final GradingSystem gradingSystem;
  final List<DegreeClass> degreeClasses;
  final CreditRules creditRules;
  final RepeatPolicy repeatPolicy;
  final Probation probation;
  final Dismissal dismissal;
  final String maxProgramDuration;
  final String version;
  final List<String> sourceDocuments;

  const UniversityConfig({
    required this.id,
    required this.name,
    required this.shortName,
    required this.country,
    required this.location,
    required this.gradingSystem,
    required this.degreeClasses,
    required this.creditRules,
    required this.repeatPolicy,
    required this.probation,
    required this.dismissal,
    required this.maxProgramDuration,
    required this.version,
    required this.sourceDocuments,
  });

  Map<String, dynamic> toJson() => {
        'id': id,
        'name': name,
        'shortName': shortName,
        'country': country,
        'location': location,
        'gradingSystem': gradingSystem.toJson(),
        'degreeClasses': degreeClasses.map((d) => d.toJson()).toList(),
        'creditRules': creditRules.toJson(),
        'repeatPolicy': repeatPolicy.toJson(),
        'probation': probation.toJson(),
        'dismissal': dismissal.toJson(),
        'maxProgramDuration': maxProgramDuration,
        'version': version,
        'sourceDocuments': sourceDocuments,
      };

  factory UniversityConfig.fromJson(Map<String, dynamic> json) =>
      UniversityConfig(
        id: json['id'] as String,
        name: json['name'] as String,
        shortName: json['shortName'] as String,
        country: json['country'] as String,
        location: json['location'] as String,
        gradingSystem: GradingSystem.fromJson(
            json['gradingSystem'] as Map<String, dynamic>),
        degreeClasses: (json['degreeClasses'] as List<dynamic>)
            .map((d) => DegreeClass.fromJson(d as Map<String, dynamic>))
            .toList(),
        creditRules:
            CreditRules.fromJson(json['creditRules'] as Map<String, dynamic>),
        repeatPolicy: RepeatPolicy.fromJson(
            json['repeatPolicy'] as Map<String, dynamic>),
        probation:
            Probation.fromJson(json['probation'] as Map<String, dynamic>),
        dismissal:
            Dismissal.fromJson(json['dismissal'] as Map<String, dynamic>),
        maxProgramDuration: json['maxProgramDuration'] as String,
        version: json['version'] as String,
        sourceDocuments: (json['sourceDocuments'] as List<dynamic>)
            .map((s) => s as String)
            .toList(),
      );
}

class GradingSystem {
  final double scale;
  final List<GradeRange> grades;

  const GradingSystem({
    required this.scale,
    required this.grades,
  });

  Map<String, dynamic> toJson() => {
        'scale': scale,
        'grades': grades.map((g) => g.toJson()).toList(),
      };

  factory GradingSystem.fromJson(Map<String, dynamic> json) => GradingSystem(
        scale: (json['scale'] as num).toDouble(),
        grades: (json['grades'] as List<dynamic>)
            .map((g) => GradeRange.fromJson(g as Map<String, dynamic>))
            .toList(),
      );
}

/// Default 5-point Nigerian grading scale (NUC standard)
const List<GradeRange> defaultNigerianGrades = [
  GradeRange(grade: 'A', min: 70, max: 100, points: 5.0),
  GradeRange(grade: 'B', min: 60, max: 69, points: 4.0),
  GradeRange(grade: 'C', min: 50, max: 59, points: 3.0),
  GradeRange(grade: 'D', min: 45, max: 49, points: 2.0),
  GradeRange(grade: 'E', min: 40, max: 44, points: 1.0),
  GradeRange(grade: 'F', min: 0, max: 39, points: 0.0),
];

/// Default 5-point Nigerian degree classification
const List<DegreeClass> defaultNigerianDegreeClasses = [
  DegreeClass(name: 'First Class', minCGPA: 4.50, maxCGPA: 5.00),
  DegreeClass(name: 'Second Class Upper', minCGPA: 3.50, maxCGPA: 4.49),
  DegreeClass(name: 'Second Class Lower', minCGPA: 2.40, maxCGPA: 3.49),
  DegreeClass(name: 'Third Class', minCGPA: 1.50, maxCGPA: 2.39),
  DegreeClass(name: 'Pass', minCGPA: 1.00, maxCGPA: 1.49),
  DegreeClass(name: 'Fail', minCGPA: 0.00, maxCGPA: 0.99),
];
