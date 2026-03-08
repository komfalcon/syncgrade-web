import '../../models/university_config.dart';

/// Covenant University, Ota
final covenantConfig = UniversityConfig(
  id: 'covenant',
  name: 'Covenant University',
  shortName: 'Covenant',
  country: 'Nigeria',
  location: 'Ota, Ogun State',
  gradingSystem: const GradingSystem(
    scale: 5,
    grades: [
      GradeRange(grade: 'A', min: 70, max: 100, points: 5.0),
      GradeRange(grade: 'B', min: 60, max: 69, points: 4.0),
      GradeRange(grade: 'C', min: 50, max: 59, points: 3.0),
      GradeRange(grade: 'D', min: 45, max: 49, points: 2.0),
      GradeRange(grade: 'F', min: 0, max: 44, points: 0.0),
    ],
  ),
  degreeClasses: const [
    DegreeClass(name: 'First Class', minCGPA: 4.50, maxCGPA: 5.00),
    DegreeClass(name: 'Second Class Upper', minCGPA: 3.50, maxCGPA: 4.49),
    DegreeClass(name: 'Second Class Lower', minCGPA: 2.40, maxCGPA: 3.49),
    DegreeClass(name: 'Third Class', minCGPA: 1.50, maxCGPA: 2.39),
  ],
  creditRules: const CreditRules(
    minimumCredits: 15,
    maximumPerSemester: 25,
    minimumPerSemester: 15,
    graduationCredits: [],
  ),
  repeatPolicy: const RepeatPolicy(
    method: RepeatMethod.replace,
    description:
        'Failed courses must be re-registered; the new grade replaces the old one, subject to a 25-unit semester maximum.',
  ),
  probation: const Probation(
    minCGPA: 1.0,
    description:
        'A student with a CGPA between 1.00 and 1.49 is placed on probation.',
  ),
  dismissal: const Dismissal(
    description:
        'A student whose CGPA falls below 1.00, or remains below 1.50 after a probation year, may be dismissed.',
  ),
  maxProgramDuration: 'Standard programme duration plus 2 years.',
  version: '2019-2022',
  sourceDocuments: const ['The Student Handbook (2019–2022)'],
);
