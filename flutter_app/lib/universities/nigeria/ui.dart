import '../../models/university_config.dart';

/// University of Ibadan
final uiConfig = UniversityConfig(
  id: 'ui',
  name: 'University of Ibadan',
  shortName: 'UI',
  country: 'Nigeria',
  location: 'Ibadan, Oyo State',
  gradingSystem: GradingSystem(
    scale: 5,
    grades: defaultNigerianGrades,
  ),
  degreeClasses: const [
    DegreeClass(name: 'First Class Honours', minCGPA: 4.50, maxCGPA: 5.00),
    DegreeClass(name: 'Second Class Upper', minCGPA: 3.50, maxCGPA: 4.49),
    DegreeClass(name: 'Second Class Lower', minCGPA: 2.40, maxCGPA: 3.49),
    DegreeClass(name: 'Third Class', minCGPA: 1.50, maxCGPA: 2.39),
    DegreeClass(name: 'Pass', minCGPA: 1.00, maxCGPA: 1.49),
  ],
  creditRules: const CreditRules(
    minimumCredits: 15,
    maximumPerSemester: 24,
    minimumPerSemester: 15,
    graduationCredits: [
      GraduationCredits(min: 120, max: 150, programYears: 4),
      GraduationCredits(min: 150, max: 190, programYears: 5),
      GraduationCredits(min: 190, max: 225, programYears: 6),
    ],
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
    description: 'Sustained low academic performance may lead to dismissal.',
  ),
  maxProgramDuration:
      '50% extension beyond the standard duration (e.g., 6 years for a 4-year programme).',
  version: 'academic-regulations',
  sourceDocuments: const ['University of Ibadan Academic Regulations'],
);
