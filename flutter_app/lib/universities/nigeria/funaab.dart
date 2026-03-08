import '../../models/university_config.dart';

/// Federal University of Agriculture, Abeokuta
final funaabConfig = UniversityConfig(
  id: 'funaab',
  name: 'Federal University of Agriculture, Abeokuta',
  shortName: 'FUNAAB',
  country: 'Nigeria',
  location: 'Abeokuta, Ogun State',
  gradingSystem: GradingSystem(
    scale: 5,
    grades: defaultNigerianGrades,
  ),
  degreeClasses: defaultNigerianDegreeClasses,
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
        'Both the original and repeat grades are factored into the CGPA.',
  ),
  probation: const Probation(
    minCGPA: 1.0,
    description: 'A student whose CGPA falls below 1.00 is placed on probation.',
  ),
  dismissal: const Dismissal(
    description:
        'Failure to rise above a 1.00 CGPA after the probation period may lead to dismissal.',
  ),
  maxProgramDuration:
      '50% extension beyond the standard duration (e.g., 6 years for a 4-year programme).',
  version: 'NUC-standard',
  sourceDocuments: const ['Inferred from NUC Minimum Academic Standards'],
);
