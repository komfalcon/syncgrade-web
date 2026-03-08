import 'package:flutter/material.dart';

import 'pages/pages.dart';

void main() {
  runApp(const CGPAApp());
}

class CGPAApp extends StatelessWidget {
  const CGPAApp({super.key});

  @override
  Widget build(BuildContext context) {
    return MaterialApp(
      title: 'CGPA--',
      debugShowCheckedModeBanner: false,
      theme: ThemeData(
        colorScheme: ColorScheme.fromSeed(
          seedColor: Colors.teal,
          primary: Colors.teal,
          secondary: Colors.cyan,
          brightness: Brightness.light,
        ),
        useMaterial3: true,
        appBarTheme: const AppBarTheme(
          backgroundColor: Colors.teal,
          foregroundColor: Colors.white,
          elevation: 2,
        ),
        cardTheme: CardTheme(
          elevation: 2,
          shape: RoundedRectangleBorder(
            borderRadius: BorderRadius.circular(12),
          ),
        ),
        inputDecorationTheme: InputDecorationTheme(
          border: OutlineInputBorder(
            borderRadius: BorderRadius.circular(8),
          ),
          filled: true,
          fillColor: Colors.teal.shade50.withAlpha(80),
        ),
        elevatedButtonTheme: ElevatedButtonThemeData(
          style: ElevatedButton.styleFrom(
            backgroundColor: Colors.teal,
            foregroundColor: Colors.white,
            padding: const EdgeInsets.symmetric(horizontal: 24, vertical: 12),
            shape: RoundedRectangleBorder(
              borderRadius: BorderRadius.circular(8),
            ),
          ),
        ),
      ),
      initialRoute: '/',
      routes: {
        '/': (_) => const HomePage(),
        '/gpa-calculator': (_) => const GPACalculatorPage(),
        '/graduation-tracker': (_) => const GraduationTrackerPage(),
        '/what-if': (_) => const WhatIfPage(),
        '/carryover': (_) => const CarryoverPage(),
        '/degree-risk': (_) => const DegreeRiskPage(),
        '/best-worst': (_) => const BestWorstPage(),
        '/analytics': (_) => const AnalyticsPage(),
        '/study-load': (_) => const StudyLoadPage(),
        '/university-comparison': (_) => const UniversityComparisonPage(),
        '/backup-restore': (_) => const BackupRestorePage(),
        '/reports': (_) => const ReportsPage(),
        '/timeline': (_) => const TimelinePage(),
      },
    );
  }
}
