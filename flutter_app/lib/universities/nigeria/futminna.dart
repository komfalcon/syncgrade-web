import '../../models/university_config.dart';

/// Federal University of Technology, Minna
final futminnaConfig = UniversityConfig(
  id: 'futminna',
  name: 'Federal University of Technology, Minna',
  shortName: 'FUTMINNA',
  country: 'Nigeria',
  location: 'Minna, Niger State',
  gradingSystem: GradingSystem(
    scale: 5,
    grades: defaultNigerianGrades,
  ),
  degreeClasses: const [
    DegreeClass(name: 'First Class Honours', minCGPA: 4.50, maxCGPA: 5.00),
    DegreeClass(
        name: 'Second Class Upper Honours', minCGPA: 3.50, maxCGPA: 4.49),
    DegreeClass(
        name: 'Second Class Lower Honours', minCGPA: 2.40, maxCGPA: 3.49),
    DegreeClass(name: 'Third Class Honours', minCGPA: 1.50, maxCGPA: 2.39),
    DegreeClass(name: 'Pass', minCGPA: 1.00, maxCGPA: 1.49),
  ],
  creditRules: const CreditRules(
    minimumCredits: 16,
    maximumPerSemester: 24,
    minimumPerSemester: 16,
    graduationCredits: [],
  ),
  repeatPolicy: const RepeatPolicy(
    method: RepeatMethod.both,
    description:
        'Both the original and repeat grades are included in the CGPA calculation.',
  ),
  probation: const Probation(
    minCGPA: 1.0,
    description: 'A student whose CGPA falls below 1.00 is placed on probation.',
  ),
  dismissal: const Dismissal(
    description:
        'Two consecutive sessions on probation without improvement may lead to dismissal.',
  ),
  maxProgramDuration:
      '50% extension beyond the standard duration (e.g., 6 years for a 4-year programme).',
  version: '2019-2021',
  sourceDocuments: const ['Students\' Handbook & Information Guide (2019–2021)'],
);
