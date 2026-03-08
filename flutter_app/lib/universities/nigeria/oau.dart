import '../../models/university_config.dart';

/// Obafemi Awolowo University, Ile-Ife
final oauConfig = UniversityConfig(
  id: 'oau',
  name: 'Obafemi Awolowo University, Ile-Ife',
  shortName: 'OAU',
  country: 'Nigeria',
  location: 'Ile-Ife, Osun State',
  gradingSystem: GradingSystem(
    scale: 5,
    grades: defaultNigerianGrades,
  ),
  degreeClasses: const [
    DegreeClass(name: 'First Class', minCGPA: 4.50, maxCGPA: 5.00),
    DegreeClass(name: 'Second Class Upper', minCGPA: 3.50, maxCGPA: 4.49),
    DegreeClass(name: 'Second Class Lower', minCGPA: 2.40, maxCGPA: 3.49),
    DegreeClass(name: 'Third Class', minCGPA: 1.50, maxCGPA: 2.39),
    DegreeClass(name: 'Pass', minCGPA: 1.00, maxCGPA: 1.49),
  ],
  creditRules: const CreditRules(
    minimumCredits: 16,
    maximumPerSemester: 24,
    minimumPerSemester: 16,
    graduationCredits: [],
  ),
  repeatPolicy: const RepeatPolicy(
    method: RepeatMethod.replace,
    description:
        'Failed courses must be repeated; electives may be substituted. The new grade replaces the old one.',
  ),
  probation: const Probation(
    minCGPA: 1.0,
    description: 'A student whose CGPA falls below 1.00 is placed on probation.',
  ),
  dismissal: const Dismissal(
    description:
        'Two consecutive sessions on probation may lead to dismissal.',
  ),
  maxProgramDuration:
      '50% extension beyond the standard duration (e.g., 6 years for a 4-year programme).',
  version: 'faculty-handbook',
  sourceDocuments: const ['Faculty Handbook (Faculty of Technology)'],
);
