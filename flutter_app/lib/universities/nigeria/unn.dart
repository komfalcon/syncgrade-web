import '../../models/university_config.dart';

/// University of Nigeria, Nsukka
final unnConfig = UniversityConfig(
  id: 'unn',
  name: 'University of Nigeria, Nsukka',
  shortName: 'UNN',
  country: 'Nigeria',
  location: 'Nsukka, Enugu State',
  gradingSystem: GradingSystem(
    scale: 5,
    grades: defaultNigerianGrades,
  ),
  degreeClasses: const [
    DegreeClass(
        name: 'First Class Honours', minCGPA: 4.50, maxCGPA: 5.00),
    DegreeClass(
        name: 'Second Class Upper Honours', minCGPA: 3.50, maxCGPA: 4.49),
    DegreeClass(
        name: 'Second Class Lower Honours', minCGPA: 2.40, maxCGPA: 3.49),
    DegreeClass(name: 'Third Class', minCGPA: 1.50, maxCGPA: 2.39),
    DegreeClass(name: 'Pass', minCGPA: 1.00, maxCGPA: 1.49),
  ],
  creditRules: const CreditRules(
    minimumCredits: 15,
    maximumPerSemester: 24,
    minimumPerSemester: 15,
    graduationCredits: [
      GraduationCredits(min: 120, max: 120, programYears: 4),
      GraduationCredits(min: 150, max: 150, programYears: 5),
      GraduationCredits(min: 180, max: 180, programYears: 6),
    ],
  ),
  repeatPolicy: const RepeatPolicy(
    method: RepeatMethod.replace,
    description:
        'Failed courses must be repeated; the new grade replaces the old one in the CGPA calculation.',
  ),
  probation: const Probation(
    minCGPA: 1.0,
    description: 'A student whose CGPA falls below 1.00 is placed on probation.',
  ),
  dismissal: const Dismissal(
    description:
        'Two consecutive sessions with a CGPA below 1.00 may lead to dismissal.',
  ),
  maxProgramDuration:
      '50% extension beyond the standard duration (e.g., 6 years for a 4-year programme).',
  version: '2013-2014',
  sourceDocuments: const ['Undergraduate Academic Regulations (2013/2014)'],
);
