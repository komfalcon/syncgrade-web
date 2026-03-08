import 'package:flutter/material.dart';

import 'package:cgpa_app/engine/calculations.dart';
import 'package:cgpa_app/models/university_config.dart';
import 'package:cgpa_app/models/engine_types.dart';
import 'package:cgpa_app/universities/nigeria/nigeria.dart';

/// Feature 12: Performance Timeline.
class TimelinePage extends StatefulWidget {
  const TimelinePage({super.key});

  @override
  State<TimelinePage> createState() => _TimelinePageState();
}

class _TimelinePageState extends State<TimelinePage> {
  late List<UniversityConfig> _universities;
  UniversityConfig? _config;

  final List<_TimelineSemester> _semesters = [];
  List<PerformanceTrend>? _trends;
  CGPAResult? _cgpaResult;

  @override
  void initState() {
    super.initState();
    _universities = getAllUniversities();
  }

  @override
  void didChangeDependencies() {
    super.didChangeDependencies();
    final arg = ModalRoute.of(context)?.settings.arguments;
    if (_config == null) {
      _config = arg is UniversityConfig
          ? arg
          : (_universities.isNotEmpty ? _universities.first : null);
    }
  }

  List<GradeRange> get _grades =>
      _config?.gradingSystem.grades ?? <GradeRange>[];

  void _addSemester() {
    setState(() {
      _semesters.add(_TimelineSemester(
        nameController: TextEditingController(
            text: '${(_semesters.length ~/ 2 + 1) * 100}L-${_semesters.length % 2 + 1}'),
        courses: [],
      ));
    });
  }

  void _addCourse(int semIndex) {
    setState(() {
      _semesters[semIndex].courses.add(_TimelineCourse(
        nameController: TextEditingController(),
        creditsController: TextEditingController(text: '3'),
        grade: _grades.isNotEmpty ? _grades.first.grade : 'A',
      ));
    });
  }

  void _removeSemester(int index) {
    setState(() {
      _semesters[index].dispose();
      _semesters.removeAt(index);
    });
  }

  void _buildTimeline() {
    if (_config == null || _semesters.isEmpty) return;

    // Build SemesterInput list for CGPA calculation
    final semesterInputs = _semesters.map((s) {
      final courses = s.courses.map((c) {
        return CourseInput(
          name: c.nameController.text.trim().isEmpty
              ? 'Course'
              : c.nameController.text.trim(),
          credits: int.tryParse(c.creditsController.text.trim()) ?? 3,
          grade: c.grade,
        );
      }).toList();
      return SemesterInput(
        name: s.nameController.text.trim(),
        courses: courses,
      );
    }).toList();

    final cgpaResult = calculateCGPA(
      semesterInputs,
      _grades,
      _config!.repeatPolicy.method,
    );

    // Build trend inputs from semester results
    final trendInputs = cgpaResult.semesterResults.map((sr) {
      return SemesterTrendInput(
        name: sr.semester,
        gpa: sr.gpa,
        credits: sr.credits,
      );
    }).toList();

    final trends = analyzePerformanceTrends(trendInputs);

    setState(() {
      _cgpaResult = cgpaResult;
      _trends = trends;
    });
  }

  @override
  void dispose() {
    for (final s in _semesters) {
      s.dispose();
    }
    super.dispose();
  }

  Color _trendColor(String trend) {
    switch (trend) {
      case 'improving':
        return Colors.green;
      case 'declining':
        return Colors.red;
      default:
        return Colors.blue;
    }
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(title: const Text('Performance Timeline')),
      floatingActionButton: FloatingActionButton(
        onPressed: _addSemester,
        child: const Icon(Icons.add),
      ),
      body: ListView(
        padding: const EdgeInsets.all(16),
        children: [
          _buildUniversityDropdown(),
          const SizedBox(height: 16),
          ..._semesters.asMap().entries.map(
              (e) => _buildSemesterCard(e.key, e.value)),
          if (_semesters.isNotEmpty) ...[
            const SizedBox(height: 12),
            ElevatedButton.icon(
              onPressed: _buildTimeline,
              icon: const Icon(Icons.timeline),
              label: const Text('Build Timeline'),
            ),
          ],
          if (_cgpaResult != null && _trends != null) ...[
            const SizedBox(height: 20),
            _buildCGPASummary(),
            const SizedBox(height: 12),
            _buildTimelineView(),
          ],
        ],
      ),
    );
  }

  Widget _buildUniversityDropdown() {
    return DropdownButtonFormField<String>(
      value: _config?.id,
      decoration: const InputDecoration(
        labelText: 'University',
        prefixIcon: Icon(Icons.account_balance),
      ),
      items: _universities
          .map((u) => DropdownMenuItem(value: u.id, child: Text(u.shortName)))
          .toList(),
      onChanged: (id) {
        if (id != null) {
          setState(() {
            _config = getUniversityById(id);
            _cgpaResult = null;
            _trends = null;
          });
        }
      },
    );
  }

  Widget _buildSemesterCard(int index, _TimelineSemester semester) {
    return Card(
      margin: const EdgeInsets.only(bottom: 8),
      child: Padding(
        padding: const EdgeInsets.all(10),
        child: Column(
          children: [
            Row(
              children: [
                Expanded(
                  child: TextField(
                    controller: semester.nameController,
                    decoration: InputDecoration(
                        labelText: 'Semester ${index + 1}', isDense: true),
                  ),
                ),
                IconButton(
                  icon: const Icon(Icons.add_circle, size: 20),
                  onPressed: () => _addCourse(index),
                  tooltip: 'Add course',
                ),
                IconButton(
                  icon: const Icon(Icons.delete, size: 20, color: Colors.red),
                  onPressed: () => _removeSemester(index),
                ),
              ],
            ),
            ...semester.courses.map((c) {
              return Padding(
                padding: const EdgeInsets.only(top: 6, left: 16),
                child: Row(
                  children: [
                    Expanded(
                      flex: 3,
                      child: TextField(
                        controller: c.nameController,
                        decoration: const InputDecoration(
                            labelText: 'Course', isDense: true),
                      ),
                    ),
                    const SizedBox(width: 6),
                    Expanded(
                      child: TextField(
                        controller: c.creditsController,
                        keyboardType: TextInputType.number,
                        decoration: const InputDecoration(
                            labelText: 'Cr', isDense: true),
                      ),
                    ),
                    const SizedBox(width: 6),
                    Expanded(
                      child: DropdownButtonFormField<String>(
                        value: c.grade,
                        isDense: true,
                        decoration: const InputDecoration(
                          labelText: 'Grade',
                          isDense: true,
                          contentPadding:
                              EdgeInsets.symmetric(horizontal: 8, vertical: 8),
                        ),
                        items: _grades
                            .map((g) => DropdownMenuItem(
                                value: g.grade, child: Text(g.grade)))
                            .toList(),
                        onChanged: (v) {
                          if (v != null) setState(() => c.grade = v);
                        },
                      ),
                    ),
                  ],
                ),
              );
            }),
          ],
        ),
      ),
    );
  }

  Widget _buildCGPASummary() {
    final r = _cgpaResult!;
    final degreeClass = _config != null
        ? getDegreeClass(r.cgpa, _config!.degreeClasses)
        : 'N/A';

    return Card(
      color: Colors.teal.shade50,
      child: Padding(
        padding: const EdgeInsets.all(16),
        child: Column(
          children: [
            Text(
              r.cgpa.toStringAsFixed(2),
              style: TextStyle(
                fontSize: 48,
                fontWeight: FontWeight.bold,
                color: Colors.teal.shade700,
              ),
            ),
            const Text('Cumulative GPA',
                style: TextStyle(fontSize: 16, color: Colors.grey)),
            const SizedBox(height: 8),
            Chip(
              label: Text(degreeClass),
              backgroundColor: Colors.teal.shade100,
            ),
            const SizedBox(height: 8),
            Row(
              mainAxisAlignment: MainAxisAlignment.spaceEvenly,
              children: [
                _stat('Credits', r.totalCredits.toString()),
                _stat('Quality Pts',
                    r.totalQualityPoints.toStringAsFixed(1)),
                _stat('Semesters',
                    r.semesterResults.length.toString()),
              ],
            ),
          ],
        ),
      ),
    );
  }

  Widget _stat(String label, String value) {
    return Column(
      children: [
        Text(value,
            style:
                const TextStyle(fontSize: 18, fontWeight: FontWeight.bold)),
        Text(label,
            style: const TextStyle(fontSize: 12, color: Colors.grey)),
      ],
    );
  }

  Widget _buildTimelineView() {
    final trends = _trends!;
    return Card(
      child: Padding(
        padding: const EdgeInsets.all(16),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            const Text('Semester Timeline',
                style: TextStyle(fontSize: 16, fontWeight: FontWeight.bold)),
            const SizedBox(height: 16),
            ...trends.asMap().entries.map((e) {
              final i = e.key;
              final t = e.value;
              final isLast = i == trends.length - 1;
              final color = _trendColor(t.trend);

              return IntrinsicHeight(
                child: Row(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    // Timeline indicator
                    SizedBox(
                      width: 40,
                      child: Column(
                        children: [
                          Container(
                            width: 16,
                            height: 16,
                            decoration: BoxDecoration(
                              color: color,
                              shape: BoxShape.circle,
                              border:
                                  Border.all(color: Colors.white, width: 2),
                              boxShadow: [
                                BoxShadow(
                                  color: color.withAlpha(80),
                                  blurRadius: 4,
                                ),
                              ],
                            ),
                          ),
                          if (!isLast)
                            Expanded(
                              child: Container(
                                width: 2,
                                color: Colors.grey.shade300,
                              ),
                            ),
                        ],
                      ),
                    ),
                    // Semester card
                    Expanded(
                      child: Container(
                        margin: const EdgeInsets.only(bottom: 16),
                        padding: const EdgeInsets.all(12),
                        decoration: BoxDecoration(
                          color: color.withAlpha(15),
                          borderRadius: BorderRadius.circular(8),
                          border: Border.all(color: color.withAlpha(60)),
                        ),
                        child: Column(
                          crossAxisAlignment: CrossAxisAlignment.start,
                          children: [
                            Row(
                              mainAxisAlignment:
                                  MainAxisAlignment.spaceBetween,
                              children: [
                                Text(
                                  t.semester,
                                  style: const TextStyle(
                                      fontWeight: FontWeight.bold,
                                      fontSize: 14),
                                ),
                                Container(
                                  padding: const EdgeInsets.symmetric(
                                      horizontal: 8, vertical: 2),
                                  decoration: BoxDecoration(
                                    color: color.withAlpha(40),
                                    borderRadius: BorderRadius.circular(12),
                                  ),
                                  child: Text(
                                    t.trend.toUpperCase(),
                                    style: TextStyle(
                                      fontSize: 10,
                                      fontWeight: FontWeight.bold,
                                      color: color,
                                    ),
                                  ),
                                ),
                              ],
                            ),
                            const SizedBox(height: 8),
                            Row(
                              children: [
                                _timelineStat('GPA',
                                    t.gpa.toStringAsFixed(2)),
                                const SizedBox(width: 16),
                                _timelineStat('CGPA',
                                    t.cgpa.toStringAsFixed(2)),
                                const SizedBox(width: 16),
                                _timelineStat(
                                    'Credits', t.credits.toString()),
                              ],
                            ),
                            if (t.improvementMarker != null) ...[
                              const SizedBox(height: 4),
                              Text(
                                t.improvementMarker!,
                                style: TextStyle(
                                    fontSize: 11, color: color),
                              ),
                            ],
                          ],
                        ),
                      ),
                    ),
                  ],
                ),
              );
            }),
          ],
        ),
      ),
    );
  }

  Widget _timelineStat(String label, String value) {
    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        Text(value,
            style:
                const TextStyle(fontSize: 16, fontWeight: FontWeight.bold)),
        Text(label,
            style: const TextStyle(fontSize: 10, color: Colors.grey)),
      ],
    );
  }
}

class _TimelineSemester {
  final TextEditingController nameController;
  final List<_TimelineCourse> courses;

  _TimelineSemester({required this.nameController, required this.courses});

  void dispose() {
    nameController.dispose();
    for (final c in courses) {
      c.nameController.dispose();
      c.creditsController.dispose();
    }
  }
}

class _TimelineCourse {
  final TextEditingController nameController;
  final TextEditingController creditsController;
  String grade;

  _TimelineCourse({
    required this.nameController,
    required this.creditsController,
    required this.grade,
  });
}
