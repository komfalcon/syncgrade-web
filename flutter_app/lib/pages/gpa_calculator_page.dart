import 'package:flutter/material.dart';

import 'package:cgpa_app/engine/calculations.dart';
import 'package:cgpa_app/models/university_config.dart';
import 'package:cgpa_app/models/engine_types.dart';
import 'package:cgpa_app/universities/nigeria/nigeria.dart';

/// Feature 1: GPA Calculator & Degree Class Predictor.
class GPACalculatorPage extends StatefulWidget {
  const GPACalculatorPage({super.key});

  @override
  State<GPACalculatorPage> createState() => _GPACalculatorPageState();
}

class _GPACalculatorPageState extends State<GPACalculatorPage> {
  late List<UniversityConfig> _universities;
  UniversityConfig? _config;
  final List<_CourseEntry> _courses = [];
  GPAResult? _result;
  String? _degreeClass;

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

  void _addCourse() {
    setState(() {
      _courses.add(_CourseEntry(
        nameController: TextEditingController(),
        creditsController: TextEditingController(text: '3'),
        grade: _grades.isNotEmpty ? _grades.first.grade : 'A',
      ));
    });
  }

  void _removeCourse(int index) {
    setState(() {
      _courses[index].nameController.dispose();
      _courses[index].creditsController.dispose();
      _courses.removeAt(index);
    });
  }

  void _calculate() {
    if (_config == null || _courses.isEmpty) return;

    final courses = _courses.map((entry) {
      final credits =
          int.tryParse(entry.creditsController.text.trim()) ?? 3;
      return CourseInput(
        name: entry.nameController.text.trim().isEmpty
            ? 'Course ${_courses.indexOf(entry) + 1}'
            : entry.nameController.text.trim(),
        credits: credits,
        grade: entry.grade,
      );
    }).toList();

    final result = calculateGPA(courses, _grades);
    final degreeClass =
        getDegreeClass(result.gpa, _config!.degreeClasses);

    setState(() {
      _result = result;
      _degreeClass = degreeClass;
    });
  }

  void _reset() {
    for (final c in _courses) {
      c.nameController.dispose();
      c.creditsController.dispose();
    }
    setState(() {
      _courses.clear();
      _result = null;
      _degreeClass = null;
    });
  }

  @override
  void dispose() {
    for (final c in _courses) {
      c.nameController.dispose();
      c.creditsController.dispose();
    }
    super.dispose();
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(title: const Text('GPA Calculator')),
      floatingActionButton: FloatingActionButton(
        onPressed: _addCourse,
        child: const Icon(Icons.add),
      ),
      body: ListView(
        padding: const EdgeInsets.all(16),
        children: [
          _buildUniversityDropdown(),
          const SizedBox(height: 16),
          ..._courses.asMap().entries.map((e) =>
              _buildCourseCard(e.key, e.value)),
          const SizedBox(height: 12),
          if (_courses.isNotEmpty)
            Row(
              children: [
                Expanded(
                  child: ElevatedButton.icon(
                    onPressed: _calculate,
                    icon: const Icon(Icons.calculate),
                    label: const Text('Calculate GPA'),
                  ),
                ),
                const SizedBox(width: 12),
                OutlinedButton(
                  onPressed: _reset,
                  child: const Text('Reset'),
                ),
              ],
            ),
          if (_result != null) ...[
            const SizedBox(height: 20),
            _buildResultCard(),
            const SizedBox(height: 12),
            _buildCourseBreakdown(),
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
          .map((u) => DropdownMenuItem(
                value: u.id,
                child: Text(u.shortName),
              ))
          .toList(),
      onChanged: (id) {
        if (id != null) {
          setState(() {
            _config = getUniversityById(id);
            _result = null;
            _degreeClass = null;
          });
        }
      },
    );
  }

  Widget _buildCourseCard(int index, _CourseEntry entry) {
    return Card(
      margin: const EdgeInsets.only(bottom: 8),
      child: Padding(
        padding: const EdgeInsets.all(12),
        child: Row(
          children: [
            Expanded(
              flex: 3,
              child: TextField(
                controller: entry.nameController,
                decoration: InputDecoration(
                  labelText: 'Course ${index + 1}',
                  isDense: true,
                ),
              ),
            ),
            const SizedBox(width: 8),
            Expanded(
              flex: 1,
              child: TextField(
                controller: entry.creditsController,
                keyboardType: TextInputType.number,
                decoration: const InputDecoration(
                  labelText: 'Credits',
                  isDense: true,
                ),
              ),
            ),
            const SizedBox(width: 8),
            Expanded(
              flex: 1,
              child: DropdownButtonFormField<String>(
                value: entry.grade,
                isDense: true,
                decoration: const InputDecoration(
                  labelText: 'Grade',
                  isDense: true,
                  contentPadding:
                      EdgeInsets.symmetric(horizontal: 8, vertical: 8),
                ),
                items: _grades
                    .map((g) => DropdownMenuItem(
                          value: g.grade,
                          child: Text(g.grade),
                        ))
                    .toList(),
                onChanged: (v) {
                  if (v != null) {
                    setState(() => entry.grade = v);
                  }
                },
              ),
            ),
            IconButton(
              icon: const Icon(Icons.delete, color: Colors.red),
              onPressed: () => _removeCourse(index),
              iconSize: 20,
            ),
          ],
        ),
      ),
    );
  }

  Widget _buildResultCard() {
    final result = _result!;
    return Card(
      color: Colors.teal.shade50,
      child: Padding(
        padding: const EdgeInsets.all(16),
        child: Column(
          children: [
            Text(
              result.gpa.toStringAsFixed(2),
              style: TextStyle(
                fontSize: 48,
                fontWeight: FontWeight.bold,
                color: Colors.teal.shade700,
              ),
            ),
            const Text('Semester GPA',
                style: TextStyle(fontSize: 16, color: Colors.grey)),
            const Divider(height: 24),
            Row(
              mainAxisAlignment: MainAxisAlignment.spaceEvenly,
              children: [
                _stat('Credits', result.totalCredits.toString()),
                _stat('Quality Pts',
                    result.totalQualityPoints.toStringAsFixed(1)),
                _stat('Degree Class', _degreeClass ?? 'N/A'),
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
            style: const TextStyle(
                fontSize: 18, fontWeight: FontWeight.bold)),
        Text(label, style: const TextStyle(fontSize: 12, color: Colors.grey)),
      ],
    );
  }

  Widget _buildCourseBreakdown() {
    final result = _result!;
    return Card(
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          const Padding(
            padding: EdgeInsets.all(12),
            child: Text('Course Breakdown',
                style: TextStyle(fontSize: 16, fontWeight: FontWeight.bold)),
          ),
          DataTable(
            columnSpacing: 16,
            columns: const [
              DataColumn(label: Text('Course')),
              DataColumn(label: Text('Credits'), numeric: true),
              DataColumn(label: Text('Grade')),
              DataColumn(label: Text('Points'), numeric: true),
              DataColumn(label: Text('QP'), numeric: true),
            ],
            rows: result.courses
                .map((c) => DataRow(cells: [
                      DataCell(Text(c.name)),
                      DataCell(Text(c.credits.toString())),
                      DataCell(Text(c.grade)),
                      DataCell(Text(c.gradePoints.toStringAsFixed(1))),
                      DataCell(
                          Text(c.qualityPoints.toStringAsFixed(1))),
                    ]))
                .toList(),
          ),
        ],
      ),
    );
  }
}

class _CourseEntry {
  final TextEditingController nameController;
  final TextEditingController creditsController;
  String grade;

  _CourseEntry({
    required this.nameController,
    required this.creditsController,
    required this.grade,
  });
}
