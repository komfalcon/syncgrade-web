import 'package:flutter/material.dart';

import 'package:cgpa_app/engine/calculations.dart';
import 'package:cgpa_app/models/university_config.dart';
import 'package:cgpa_app/models/engine_types.dart';
import 'package:cgpa_app/universities/nigeria/nigeria.dart';

/// Feature 3: "What-If" Semester Simulator.
class WhatIfPage extends StatefulWidget {
  const WhatIfPage({super.key});

  @override
  State<WhatIfPage> createState() => _WhatIfPageState();
}

class _WhatIfPageState extends State<WhatIfPage> {
  late List<UniversityConfig> _universities;
  UniversityConfig? _config;

  final _cgpaCtrl = TextEditingController(text: '3.50');
  final _creditsCtrl = TextEditingController(text: '60');
  final _semesterNameCtrl = TextEditingController(text: '200L-2');
  final List<_CourseEntry> _courses = [];
  WhatIfResult? _result;

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

  void _simulate() {
    if (_config == null || _courses.isEmpty) return;

    final currentCGPA =
        double.tryParse(_cgpaCtrl.text.trim()) ?? 0;
    final completedCredits =
        int.tryParse(_creditsCtrl.text.trim()) ?? 0;

    final courses = _courses.map((e) {
      return CourseInput(
        name: e.nameController.text.trim().isEmpty
            ? 'Course ${_courses.indexOf(e) + 1}'
            : e.nameController.text.trim(),
        credits: int.tryParse(e.creditsController.text.trim()) ?? 3,
        grade: e.grade,
      );
    }).toList();

    final scenario = WhatIfScenario(
      courses: courses,
      semesterName: _semesterNameCtrl.text.trim(),
    );

    final result = simulateWhatIf(
      currentCGPA,
      completedCredits,
      scenario,
      _grades,
      _config!.degreeClasses,
    );

    setState(() => _result = result);
  }

  @override
  void dispose() {
    _cgpaCtrl.dispose();
    _creditsCtrl.dispose();
    _semesterNameCtrl.dispose();
    for (final c in _courses) {
      c.nameController.dispose();
      c.creditsController.dispose();
    }
    super.dispose();
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(title: const Text('What-If Simulator')),
      floatingActionButton: FloatingActionButton(
        onPressed: _addCourse,
        child: const Icon(Icons.add),
      ),
      body: ListView(
        padding: const EdgeInsets.all(16),
        children: [
          _buildUniversityDropdown(),
          const SizedBox(height: 16),
          _buildCurrentStatusInputs(),
          const SizedBox(height: 16),
          const Text('Hypothetical Courses',
              style: TextStyle(fontSize: 16, fontWeight: FontWeight.bold)),
          const SizedBox(height: 8),
          ..._courses.asMap().entries.map(
              (e) => _buildCourseRow(e.key, e.value)),
          if (_courses.isNotEmpty) ...[
            const SizedBox(height: 12),
            ElevatedButton.icon(
              onPressed: _simulate,
              icon: const Icon(Icons.science),
              label: const Text('Simulate'),
            ),
          ],
          if (_result != null) ...[
            const SizedBox(height: 20),
            _buildResultCard(),
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
            _result = null;
          });
        }
      },
    );
  }

  Widget _buildCurrentStatusInputs() {
    return Card(
      child: Padding(
        padding: const EdgeInsets.all(12),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            const Text('Current Academic Status',
                style: TextStyle(fontWeight: FontWeight.bold)),
            const SizedBox(height: 12),
            Row(
              children: [
                Expanded(
                  child: TextField(
                    controller: _cgpaCtrl,
                    keyboardType:
                        const TextInputType.numberWithOptions(decimal: true),
                    decoration: const InputDecoration(
                      labelText: 'Current CGPA',
                      prefixIcon: Icon(Icons.grade),
                    ),
                  ),
                ),
                const SizedBox(width: 12),
                Expanded(
                  child: TextField(
                    controller: _creditsCtrl,
                    keyboardType: TextInputType.number,
                    decoration: const InputDecoration(
                      labelText: 'Completed Credits',
                      prefixIcon: Icon(Icons.credit_score),
                    ),
                  ),
                ),
              ],
            ),
            const SizedBox(height: 12),
            TextField(
              controller: _semesterNameCtrl,
              decoration: const InputDecoration(
                labelText: 'Semester Name',
                prefixIcon: Icon(Icons.label),
              ),
            ),
          ],
        ),
      ),
    );
  }

  Widget _buildCourseRow(int index, _CourseEntry entry) {
    return Card(
      margin: const EdgeInsets.only(bottom: 8),
      child: Padding(
        padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 8),
        child: Row(
          children: [
            Expanded(
              flex: 3,
              child: TextField(
                controller: entry.nameController,
                decoration: InputDecoration(
                    labelText: 'Course ${index + 1}', isDense: true),
              ),
            ),
            const SizedBox(width: 8),
            Expanded(
              child: TextField(
                controller: entry.creditsController,
                keyboardType: TextInputType.number,
                decoration: const InputDecoration(
                    labelText: 'Cr', isDense: true),
              ),
            ),
            const SizedBox(width: 8),
            Expanded(
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
                        value: g.grade, child: Text(g.grade)))
                    .toList(),
                onChanged: (v) {
                  if (v != null) setState(() => entry.grade = v);
                },
              ),
            ),
            IconButton(
              icon: const Icon(Icons.close, size: 18),
              onPressed: () => _removeCourse(index),
            ),
          ],
        ),
      ),
    );
  }

  Widget _buildResultCard() {
    final r = _result!;
    final isPositive = r.change >= 0;
    return Card(
      color: isPositive ? Colors.green.shade50 : Colors.red.shade50,
      child: Padding(
        padding: const EdgeInsets.all(16),
        child: Column(
          children: [
            const Text('Simulation Results',
                style: TextStyle(fontSize: 18, fontWeight: FontWeight.bold)),
            const SizedBox(height: 16),
            Row(
              mainAxisAlignment: MainAxisAlignment.spaceEvenly,
              children: [
                _resultColumn('Before', r.originalCGPA.toStringAsFixed(2),
                    r.previousDegreeClass),
                Icon(Icons.arrow_forward,
                    color: isPositive ? Colors.green : Colors.red, size: 32),
                _resultColumn('After', r.projectedCGPA.toStringAsFixed(2),
                    r.degreeClass),
              ],
            ),
            const Divider(height: 24),
            Row(
              mainAxisAlignment: MainAxisAlignment.spaceEvenly,
              children: [
                _statChip(
                  'Change',
                  '${isPositive ? '+' : ''}${r.change.toStringAsFixed(2)}',
                  isPositive ? Colors.green : Colors.red,
                ),
                _statChip(
                  'Semester GPA',
                  r.semesterGPA.toStringAsFixed(2),
                  Colors.blue,
                ),
                _statChip(
                  'New Credits',
                  r.newTotalCredits.toString(),
                  Colors.purple,
                ),
              ],
            ),
          ],
        ),
      ),
    );
  }

  Widget _resultColumn(String label, String cgpa, String degreeClass) {
    return Column(
      children: [
        Text(label, style: const TextStyle(fontSize: 12, color: Colors.grey)),
        Text(cgpa,
            style: const TextStyle(
                fontSize: 32, fontWeight: FontWeight.bold)),
        Text(degreeClass,
            style: const TextStyle(fontSize: 12, fontWeight: FontWeight.w500)),
      ],
    );
  }

  Widget _statChip(String label, String value, Color color) {
    return Chip(
      avatar: CircleAvatar(
        backgroundColor: color,
        child: Text(value, style: const TextStyle(fontSize: 10, color: Colors.white)),
      ),
      label: Text(label, style: const TextStyle(fontSize: 12)),
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
