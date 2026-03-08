import '../../models/university_config.dart';

/// Ahmadu Bello University, Zaria
final abuConfig = UniversityConfig(
  id: 'abu',
  name: 'Ahmadu Bello University, Zaria',
  shortName: 'ABU',
  country: 'Nigeria',
  location: 'Zaria, Kaduna State',
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
        'Both the initial and resit grades count in the CGPA calculation.',
  ),
  probation: const Probation(
    minCGPA: 1.0,
    description: 'A student whose CGPA falls below 1.00 is placed on probation.',
  ),
  dismissal: const Dismissal(
    description:
        'Two consecutive semesters on probation may lead to dismissal.',
  ),
  maxProgramDuration:
      '50% extension beyond the standard duration (e.g., 6 years for a 4-year programme).',
  version: '2021-2022',
  sourceDocuments: const ['Undergraduate Student Handbook (2021/2022 Session)'],
);
