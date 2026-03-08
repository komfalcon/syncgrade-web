import 'package:flutter/material.dart';

import 'package:cgpa_app/engine/calculations.dart';
import 'package:cgpa_app/models/university_config.dart';
import 'package:cgpa_app/models/engine_types.dart';
import 'package:cgpa_app/universities/nigeria/nigeria.dart';

/// Feature 4: Carryover Impact Simulator.
class CarryoverPage extends StatefulWidget {
  const CarryoverPage({super.key});

  @override
  State<CarryoverPage> createState() => _CarryoverPageState();
}

class _CarryoverPageState extends State<CarryoverPage> {
  late List<UniversityConfig> _universities;
  UniversityConfig? _config;

  final _cgpaCtrl = TextEditingController(text: '3.00');
  final _totalCreditsCtrl = TextEditingController(text: '60');
  final List<_FailedEntry> _failedCourses = [];
  CarryoverImpactResult? _result;

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

  String get _lastGrade =>
      _grades.isNotEmpty ? _grades.last.grade : 'F';

  String get _firstGrade =>
      _grades.isNotEmpty ? _grades.first.grade : 'A';

  void _addFailedCourse() {
    setState(() {
      _failedCourses.add(_FailedEntry(
        nameController: TextEditingController(),
        creditsController: TextEditingController(text: '3'),
        originalGrade: _lastGrade,
        newGrade: _firstGrade,
      ));
    });
  }

  void _removeFailedCourse(int index) {
    setState(() {
      _failedCourses[index].nameController.dispose();
      _failedCourses[index].creditsController.dispose();
      _failedCourses.removeAt(index);
    });
  }

  void _calculate() {
    if (_config == null || _failedCourses.isEmpty) return;

    final currentCGPA = double.tryParse(_cgpaCtrl.text.trim()) ?? 0;
    final totalCredits = int.tryParse(_totalCreditsCtrl.text.trim()) ?? 0;

    final failedCourses = _failedCourses.map((e) {
      return FailedCourseInput(
        name: e.nameController.text.trim().isEmpty
            ? 'Course ${_failedCourses.indexOf(e) + 1}'
            : e.nameController.text.trim(),
        credits: int.tryParse(e.creditsController.text.trim()) ?? 3,
        originalGrade: e.originalGrade,
        newGrade: e.newGrade,
      );
    }).toList();

    final result = carryoverImpact(
      currentCGPA,
      totalCredits,
      failedCourses,
      _grades,
      _config!.repeatPolicy.method,
    );

    setState(() => _result = result);
  }

  @override
  void dispose() {
    _cgpaCtrl.dispose();
    _totalCreditsCtrl.dispose();
    for (final c in _failedCourses) {
      c.nameController.dispose();
      c.creditsController.dispose();
    }
    super.dispose();
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(title: const Text('Carryover Impact')),
      floatingActionButton: FloatingActionButton(
        onPressed: _addFailedCourse,
        child: const Icon(Icons.add),
      ),
      body: ListView(
        padding: const EdgeInsets.all(16),
        children: [
          _buildUniversityDropdown(),
          const SizedBox(height: 16),
          _buildInputCard(),
          const SizedBox(height: 16),
          const Text('Failed Courses to Retake',
              style: TextStyle(fontSize: 16, fontWeight: FontWeight.bold)),
          const SizedBox(height: 8),
          ..._failedCourses.asMap().entries.map(
              (e) => _buildFailedCourseCard(e.key, e.value)),
          if (_failedCourses.isNotEmpty) ...[
            const SizedBox(height: 12),
            ElevatedButton.icon(
              onPressed: _calculate,
              icon: const Icon(Icons.calculate),
              label: const Text('Calculate Impact'),
            ),
          ],
          if (_result != null) ...[
            const SizedBox(height: 20),
            _buildResultCard(),
            const SizedBox(height: 12),
            _buildCourseAnalysis(),
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

  Widget _buildInputCard() {
    return Card(
      child: Padding(
        padding: const EdgeInsets.all(12),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            const Text('Current Status',
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
                    controller: _totalCreditsCtrl,
                    keyboardType: TextInputType.number,
                    decoration: const InputDecoration(
                      labelText: 'Total Credits',
                      prefixIcon: Icon(Icons.credit_score),
                    ),
                  ),
                ),
              ],
            ),
            if (_config != null) ...[
              const SizedBox(height: 8),
              Text(
                'Repeat policy: ${_config!.repeatPolicy.description}',
                style: TextStyle(
                    fontSize: 12, color: Colors.grey.shade600),
              ),
            ],
          ],
        ),
      ),
    );
  }

  Widget _buildFailedCourseCard(int index, _FailedEntry entry) {
    return Card(
      margin: const EdgeInsets.only(bottom: 8),
      child: Padding(
        padding: const EdgeInsets.all(10),
        child: Column(
          children: [
            Row(
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
                    decoration:
                        const InputDecoration(labelText: 'Cr', isDense: true),
                  ),
                ),
                IconButton(
                  icon: const Icon(Icons.close, size: 18),
                  onPressed: () => _removeFailedCourse(index),
                ),
              ],
            ),
            const SizedBox(height: 8),
            Row(
              children: [
                Expanded(
                  child: DropdownButtonFormField<String>(
                    value: entry.originalGrade,
                    isDense: true,
                    decoration: const InputDecoration(
                      labelText: 'Original Grade',
                      isDense: true,
                      contentPadding:
                          EdgeInsets.symmetric(horizontal: 8, vertical: 8),
                    ),
                    items: _grades
                        .map((g) => DropdownMenuItem(
                            value: g.grade, child: Text(g.grade)))
                        .toList(),
                    onChanged: (v) {
                      if (v != null) {
                        setState(() => entry.originalGrade = v);
                      }
                    },
                  ),
                ),
                const Padding(
                  padding: EdgeInsets.symmetric(horizontal: 8),
                  child: Icon(Icons.arrow_forward, size: 18),
                ),
                Expanded(
                  child: DropdownButtonFormField<String>(
                    value: entry.newGrade,
                    isDense: true,
                    decoration: const InputDecoration(
                      labelText: 'New Grade',
                      isDense: true,
                      contentPadding:
                          EdgeInsets.symmetric(horizontal: 8, vertical: 8),
                    ),
                    items: _grades
                        .map((g) => DropdownMenuItem(
                            value: g.grade, child: Text(g.grade)))
                        .toList(),
                    onChanged: (v) {
                      if (v != null) {
                        setState(() => entry.newGrade = v);
                      }
                    },
                  ),
                ),
              ],
            ),
          ],
        ),
      ),
    );
  }

  Widget _buildResultCard() {
    final r = _result!;
    final isPositive = r.cgpaChange >= 0;
    return Card(
      color: isPositive ? Colors.green.shade50 : Colors.red.shade50,
      child: Padding(
        padding: const EdgeInsets.all(16),
        child: Column(
          children: [
            const Text('Carryover Impact',
                style: TextStyle(fontSize: 18, fontWeight: FontWeight.bold)),
            const SizedBox(height: 16),
            Row(
              mainAxisAlignment: MainAxisAlignment.spaceEvenly,
              children: [
                _cgpaColumn('Before', r.currentCGPA),
                Icon(Icons.arrow_forward,
                    color: isPositive ? Colors.green : Colors.red, size: 32),
                _cgpaColumn('After', r.projectedCGPA),
              ],
            ),
            const SizedBox(height: 12),
            Container(
              padding:
                  const EdgeInsets.symmetric(horizontal: 16, vertical: 8),
              decoration: BoxDecoration(
                color: isPositive
                    ? Colors.green.shade100
                    : Colors.red.shade100,
                borderRadius: BorderRadius.circular(20),
              ),
              child: Text(
                '${isPositive ? '+' : ''}${r.cgpaChange.toStringAsFixed(2)} CGPA',
                style: TextStyle(
                  fontSize: 18,
                  fontWeight: FontWeight.bold,
                  color: isPositive ? Colors.green.shade800 : Colors.red.shade800,
                ),
              ),
            ),
          ],
        ),
      ),
    );
  }

  Widget _cgpaColumn(String label, double cgpa) {
    return Column(
      children: [
        Text(label, style: const TextStyle(fontSize: 12, color: Colors.grey)),
        Text(cgpa.toStringAsFixed(2),
            style: const TextStyle(fontSize: 32, fontWeight: FontWeight.bold)),
      ],
    );
  }

  Widget _buildCourseAnalysis() {
    final r = _result!;
    return Card(
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          const Padding(
            padding: EdgeInsets.all(12),
            child: Text('Course-by-Course Analysis',
                style: TextStyle(fontSize: 16, fontWeight: FontWeight.bold)),
          ),
          ...r.coursesAnalyzed.map((c) => ListTile(
                title: Text(c.name),
                subtitle: Text(
                    '${c.originalGrade} (${c.originalPoints.toStringAsFixed(1)}) → ${c.newGrade} (${c.newPoints.toStringAsFixed(1)})'),
                trailing: Text(
                  '${c.creditImpact >= 0 ? '+' : ''}${c.creditImpact.toStringAsFixed(1)} QP',
                  style: TextStyle(
                    fontWeight: FontWeight.bold,
                    color:
                        c.creditImpact >= 0 ? Colors.green : Colors.red,
                  ),
                ),
                leading: CircleAvatar(
                  backgroundColor:
                      c.creditImpact >= 0 ? Colors.green.shade50 : Colors.red.shade50,
                  child: Text('${c.credits}',
                      style: const TextStyle(fontWeight: FontWeight.bold)),
                ),
              )),
        ],
      ),
    );
  }
}

class _FailedEntry {
  final TextEditingController nameController;
  final TextEditingController creditsController;
  String originalGrade;
  String newGrade;

  _FailedEntry({
    required this.nameController,
    required this.creditsController,
    required this.originalGrade,
    required this.newGrade,
  });
}
