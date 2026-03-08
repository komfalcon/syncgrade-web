import 'package:flutter/material.dart';

import 'package:cgpa_app/engine/calculations.dart';
import 'package:cgpa_app/models/university_config.dart';
import 'package:cgpa_app/models/engine_types.dart';
import 'package:cgpa_app/universities/nigeria/nigeria.dart';

/// Feature 11: Printable Academic Reports.
class ReportsPage extends StatefulWidget {
  const ReportsPage({super.key});

  @override
  State<ReportsPage> createState() => _ReportsPageState();
}

class _ReportsPageState extends State<ReportsPage> {
  late List<UniversityConfig> _universities;
  UniversityConfig? _config;

  final _studentNameCtrl = TextEditingController(text: 'Student');
  final _matricNoCtrl = TextEditingController(text: 'MAT/2024/001');
  final _departmentCtrl = TextEditingController(text: 'Computer Science');
  final _cgpaCtrl = TextEditingController(text: '3.80');
  final _completedCreditsCtrl = TextEditingController(text: '90');

  final List<_ReportSemester> _semesters = [];
  bool _reportGenerated = false;

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
      _semesters.add(_ReportSemester(
        nameController: TextEditingController(
            text: '${(_semesters.length ~/ 2 + 1) * 100}L-${_semesters.length % 2 + 1}'),
        courses: [],
      ));
    });
  }

  void _addCourse(int semIndex) {
    setState(() {
      _semesters[semIndex].courses.add(_ReportCourse(
        nameController: TextEditingController(),
        creditsController: TextEditingController(text: '3'),
        grade: _grades.isNotEmpty ? _grades.first.grade : 'A',
      ));
    });
  }

  void _generateReport() {
    setState(() => _reportGenerated = true);
  }

  @override
  void dispose() {
    _studentNameCtrl.dispose();
    _matricNoCtrl.dispose();
    _departmentCtrl.dispose();
    _cgpaCtrl.dispose();
    _completedCreditsCtrl.dispose();
    for (final s in _semesters) {
      s.dispose();
    }
    super.dispose();
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(title: const Text('Academic Reports')),
      body: ListView(
        padding: const EdgeInsets.all(16),
        children: [
          _buildUniversityDropdown(),
          const SizedBox(height: 16),
          _buildStudentInfoCard(),
          const SizedBox(height: 16),
          Row(
            mainAxisAlignment: MainAxisAlignment.spaceBetween,
            children: [
              const Text('Semesters',
                  style: TextStyle(fontSize: 16, fontWeight: FontWeight.bold)),
              ElevatedButton.icon(
                onPressed: _addSemester,
                icon: const Icon(Icons.add, size: 18),
                label: const Text('Add Semester'),
              ),
            ],
          ),
          const SizedBox(height: 8),
          ..._semesters.asMap().entries.map(
              (e) => _buildSemesterCard(e.key, e.value)),
          const SizedBox(height: 16),
          ElevatedButton.icon(
            onPressed: _generateReport,
            icon: const Icon(Icons.description),
            label: const Text('Generate Report'),
          ),
          if (_reportGenerated) ...[
            const SizedBox(height: 20),
            _buildReport(),
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
            _reportGenerated = false;
          });
        }
      },
    );
  }

  Widget _buildStudentInfoCard() {
    return Card(
      child: Padding(
        padding: const EdgeInsets.all(12),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            const Text('Student Information',
                style: TextStyle(fontWeight: FontWeight.bold)),
            const SizedBox(height: 12),
            Row(
              children: [
                Expanded(
                  child: TextField(
                    controller: _studentNameCtrl,
                    decoration: const InputDecoration(
                        labelText: 'Full Name', isDense: true),
                  ),
                ),
                const SizedBox(width: 12),
                Expanded(
                  child: TextField(
                    controller: _matricNoCtrl,
                    decoration: const InputDecoration(
                        labelText: 'Matric No.', isDense: true),
                  ),
                ),
              ],
            ),
            const SizedBox(height: 12),
            Row(
              children: [
                Expanded(
                  child: TextField(
                    controller: _departmentCtrl,
                    decoration: const InputDecoration(
                        labelText: 'Department', isDense: true),
                  ),
                ),
                const SizedBox(width: 12),
                Expanded(
                  child: TextField(
                    controller: _cgpaCtrl,
                    keyboardType:
                        const TextInputType.numberWithOptions(decimal: true),
                    decoration:
                        const InputDecoration(labelText: 'CGPA', isDense: true),
                  ),
                ),
                const SizedBox(width: 12),
                Expanded(
                  child: TextField(
                    controller: _completedCreditsCtrl,
                    keyboardType: TextInputType.number,
                    decoration: const InputDecoration(
                        labelText: 'Credits', isDense: true),
                  ),
                ),
              ],
            ),
          ],
        ),
      ),
    );
  }

  Widget _buildSemesterCard(int index, _ReportSemester semester) {
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

  Widget _buildReport() {
    if (_config == null) return const SizedBox.shrink();

    final cgpa = double.tryParse(_cgpaCtrl.text.trim()) ?? 0;
    final credits = int.tryParse(_completedCreditsCtrl.text.trim()) ?? 0;
    final degreeClass = getDegreeClass(cgpa, _config!.degreeClasses);

    // Calculate GPA for each semester
    final semesterResults = _semesters.map((s) {
      final courses = s.courses.map((c) {
        return CourseInput(
          name: c.nameController.text.trim().isEmpty
              ? 'Course'
              : c.nameController.text.trim(),
          credits: int.tryParse(c.creditsController.text.trim()) ?? 3,
          grade: c.grade,
        );
      }).toList();

      return (
        name: s.nameController.text.trim(),
        result: courses.isNotEmpty ? calculateGPA(courses, _grades) : null,
      );
    }).toList();

    return Card(
      shape: RoundedRectangleBorder(
        borderRadius: BorderRadius.circular(12),
        side: const BorderSide(color: Colors.teal, width: 2),
      ),
      child: Padding(
        padding: const EdgeInsets.all(20),
        child: Column(
          children: [
            Text(
              _config!.name,
              style: const TextStyle(fontSize: 18, fontWeight: FontWeight.bold),
              textAlign: TextAlign.center,
            ),
            const Text('Academic Transcript Report',
                style: TextStyle(fontSize: 14, color: Colors.grey)),
            const Divider(height: 24),
            _reportRow('Student Name', _studentNameCtrl.text),
            _reportRow('Matric Number', _matricNoCtrl.text),
            _reportRow('Department', _departmentCtrl.text),
            _reportRow('Total Credits', credits.toString()),
            _reportRow('CGPA', cgpa.toStringAsFixed(2)),
            _reportRow('Degree Class', degreeClass),
            const Divider(height: 24),
            ...semesterResults.map((sr) {
              if (sr.result == null) return const SizedBox.shrink();
              return Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  Container(
                    width: double.infinity,
                    padding: const EdgeInsets.all(8),
                    color: Colors.teal.shade50,
                    child: Text(
                      '${sr.name} — GPA: ${sr.result!.gpa.toStringAsFixed(2)}',
                      style: const TextStyle(fontWeight: FontWeight.bold),
                    ),
                  ),
                  ...sr.result!.courses.map((c) => Padding(
                        padding: const EdgeInsets.symmetric(
                            horizontal: 8, vertical: 2),
                        child: Row(
                          children: [
                            Expanded(flex: 3, child: Text(c.name)),
                            SizedBox(
                                width: 40,
                                child: Text('${c.credits}',
                                    textAlign: TextAlign.center)),
                            SizedBox(
                                width: 40,
                                child: Text(c.grade,
                                    textAlign: TextAlign.center)),
                            SizedBox(
                                width: 50,
                                child: Text(
                                    c.qualityPoints.toStringAsFixed(1),
                                    textAlign: TextAlign.right)),
                          ],
                        ),
                      )),
                  const SizedBox(height: 8),
                ],
              );
            }),
            const Divider(),
            const SizedBox(height: 8),
            Text(
              'Generated on ${DateTime.now().toString().substring(0, 10)}',
              style: const TextStyle(fontSize: 11, color: Colors.grey),
            ),
          ],
        ),
      ),
    );
  }

  Widget _reportRow(String label, String value) {
    return Padding(
      padding: const EdgeInsets.symmetric(vertical: 3),
      child: Row(
        children: [
          SizedBox(
            width: 120,
            child: Text(label,
                style: const TextStyle(fontWeight: FontWeight.w600)),
          ),
          Expanded(child: Text(value)),
        ],
      ),
    );
  }
}

class _ReportSemester {
  final TextEditingController nameController;
  final List<_ReportCourse> courses;

  _ReportSemester({required this.nameController, required this.courses});

  void dispose() {
    nameController.dispose();
    for (final c in courses) {
      c.nameController.dispose();
      c.creditsController.dispose();
    }
  }
}

class _ReportCourse {
  final TextEditingController nameController;
  final TextEditingController creditsController;
  String grade;

  _ReportCourse({
    required this.nameController,
    required this.creditsController,
    required this.grade,
  });
}
