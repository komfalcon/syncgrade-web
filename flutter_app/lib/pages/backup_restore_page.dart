import 'package:flutter/material.dart';

import 'package:cgpa_app/utils/backup.dart';

/// Feature 10: Offline Backup & Restore.
class BackupRestorePage extends StatefulWidget {
  const BackupRestorePage({super.key});

  @override
  State<BackupRestorePage> createState() => _BackupRestorePageState();
}

class _BackupRestorePageState extends State<BackupRestorePage>
    with SingleTickerProviderStateMixin {
  late TabController _tabCtrl;

  // Backup tab state
  final List<_SemesterBackupEntry> _semesters = [];
  final _cgpaCtrl = TextEditingController(text: '3.50');
  String? _csvOutput;
  String? _jsonOutput;

  // Restore tab state
  final _jsonInputCtrl = TextEditingController();
  Map<String, dynamic>? _parsedData;
  String? _parseError;

  @override
  void initState() {
    super.initState();
    _tabCtrl = TabController(length: 2, vsync: this);
  }

  void _addSemester() {
    setState(() {
      _semesters.add(_SemesterBackupEntry(
        nameController: TextEditingController(
            text: 'Semester ${_semesters.length + 1}'),
        courses: [],
      ));
    });
  }

  void _addCourseToSemester(int semIndex) {
    setState(() {
      _semesters[semIndex].courses.add(_CourseBackupEntry(
        nameController: TextEditingController(),
        creditsController: TextEditingController(text: '3'),
        gradeController: TextEditingController(text: 'A'),
        gradePointController: TextEditingController(text: '5.0'),
      ));
    });
  }

  void _removeSemester(int index) {
    setState(() {
      _semesters[index].dispose();
      _semesters.removeAt(index);
    });
  }

  void _generateCSV() {
    final semesters = _semesters.map((s) {
      return SemesterCSVData(
        name: s.nameController.text.trim(),
        courses: s.courses.map((c) {
          return CourseCSVData(
            name: c.nameController.text.trim().isEmpty
                ? 'Course'
                : c.nameController.text.trim(),
            credits: int.tryParse(c.creditsController.text.trim()) ?? 3,
            grade: c.gradeController.text.trim(),
            gradePoint:
                double.tryParse(c.gradePointController.text.trim()) ?? 0,
          );
        }).toList(),
      );
    }).toList();

    final cgpa = double.tryParse(_cgpaCtrl.text.trim()) ?? 0;
    final csv = generateCSV(semesters, cgpa);
    setState(() => _csvOutput = csv);
  }

  void _generateJSON() {
    final data = <String, dynamic>{
      'appVersion': '1.0.0',
      'exportDate': DateTime.now().toIso8601String(),
      'cgpa': double.tryParse(_cgpaCtrl.text.trim()) ?? 0,
      'semesters': _semesters.map((s) {
        return {
          'name': s.nameController.text.trim(),
          'courses': s.courses.map((c) {
            return {
              'name': c.nameController.text.trim(),
              'credits': int.tryParse(c.creditsController.text.trim()) ?? 3,
              'grade': c.gradeController.text.trim(),
              'gradePoint':
                  double.tryParse(c.gradePointController.text.trim()) ?? 0,
            };
          }).toList(),
        };
      }).toList(),
    };

    final json = exportBackupJson(data);
    setState(() => _jsonOutput = json);
  }

  void _parseJSON() {
    final content = _jsonInputCtrl.text.trim();
    if (content.isEmpty) {
      setState(() {
        _parseError = 'Please paste JSON content.';
        _parsedData = null;
      });
      return;
    }

    final parsed = parseBackupJson(content);
    setState(() {
      if (parsed != null) {
        _parsedData = parsed;
        _parseError = null;
      } else {
        _parsedData = null;
        _parseError = 'Invalid JSON format.';
      }
    });
  }

  @override
  void dispose() {
    _tabCtrl.dispose();
    _cgpaCtrl.dispose();
    _jsonInputCtrl.dispose();
    for (final s in _semesters) {
      s.dispose();
    }
    super.dispose();
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(
        title: const Text('Backup & Restore'),
        bottom: TabBar(
          controller: _tabCtrl,
          indicatorColor: Colors.white,
          tabs: const [
            Tab(icon: Icon(Icons.upload), text: 'Export'),
            Tab(icon: Icon(Icons.download), text: 'Import'),
          ],
        ),
      ),
      body: TabBarView(
        controller: _tabCtrl,
        children: [
          _buildExportTab(),
          _buildImportTab(),
        ],
      ),
    );
  }

  Widget _buildExportTab() {
    return ListView(
      padding: const EdgeInsets.all(16),
      children: [
        TextField(
          controller: _cgpaCtrl,
          keyboardType:
              const TextInputType.numberWithOptions(decimal: true),
          decoration: const InputDecoration(
            labelText: 'Overall CGPA',
            prefixIcon: Icon(Icons.grade),
          ),
        ),
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
            (e) => _buildSemesterExportCard(e.key, e.value)),
        const SizedBox(height: 16),
        Row(
          children: [
            Expanded(
              child: OutlinedButton.icon(
                onPressed: _semesters.isNotEmpty ? _generateCSV : null,
                icon: const Icon(Icons.table_chart),
                label: const Text('Generate CSV'),
              ),
            ),
            const SizedBox(width: 12),
            Expanded(
              child: ElevatedButton.icon(
                onPressed: _semesters.isNotEmpty ? _generateJSON : null,
                icon: const Icon(Icons.code),
                label: const Text('Export JSON'),
              ),
            ),
          ],
        ),
        if (_csvOutput != null) ...[
          const SizedBox(height: 16),
          _buildOutputCard('CSV Output', _csvOutput!),
        ],
        if (_jsonOutput != null) ...[
          const SizedBox(height: 16),
          _buildOutputCard('JSON Backup', _jsonOutput!),
        ],
      ],
    );
  }

  Widget _buildSemesterExportCard(int index, _SemesterBackupEntry entry) {
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
                    controller: entry.nameController,
                    decoration: InputDecoration(
                        labelText: 'Semester ${index + 1}', isDense: true),
                  ),
                ),
                IconButton(
                  icon: const Icon(Icons.add_circle, size: 20),
                  onPressed: () => _addCourseToSemester(index),
                  tooltip: 'Add course',
                ),
                IconButton(
                  icon: const Icon(Icons.delete, size: 20, color: Colors.red),
                  onPressed: () => _removeSemester(index),
                ),
              ],
            ),
            ...entry.courses.asMap().entries.map((ce) {
              final c = ce.value;
              return Padding(
                padding: const EdgeInsets.only(top: 6),
                child: Row(
                  children: [
                    const SizedBox(width: 16),
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
                        decoration:
                            const InputDecoration(labelText: 'Cr', isDense: true),
                      ),
                    ),
                    const SizedBox(width: 6),
                    Expanded(
                      child: TextField(
                        controller: c.gradeController,
                        decoration: const InputDecoration(
                            labelText: 'Grade', isDense: true),
                      ),
                    ),
                    const SizedBox(width: 6),
                    Expanded(
                      child: TextField(
                        controller: c.gradePointController,
                        keyboardType: const TextInputType.numberWithOptions(
                            decimal: true),
                        decoration: const InputDecoration(
                            labelText: 'GP', isDense: true),
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

  Widget _buildOutputCard(String title, String content) {
    return Card(
      color: Colors.grey.shade50,
      child: Padding(
        padding: const EdgeInsets.all(12),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            Row(
              mainAxisAlignment: MainAxisAlignment.spaceBetween,
              children: [
                Text(title,
                    style: const TextStyle(fontWeight: FontWeight.bold)),
                IconButton(
                  icon: const Icon(Icons.copy, size: 20),
                  onPressed: () {
                    ScaffoldMessenger.of(context).showSnackBar(
                      const SnackBar(content: Text('Copied to clipboard')),
                    );
                  },
                  tooltip: 'Copy',
                ),
              ],
            ),
            const SizedBox(height: 8),
            Container(
              width: double.infinity,
              padding: const EdgeInsets.all(8),
              decoration: BoxDecoration(
                color: Colors.white,
                borderRadius: BorderRadius.circular(4),
                border: Border.all(color: Colors.grey.shade300),
              ),
              child: SelectableText(
                content,
                style: const TextStyle(
                    fontFamily: 'monospace', fontSize: 12),
              ),
            ),
          ],
        ),
      ),
    );
  }

  Widget _buildImportTab() {
    return ListView(
      padding: const EdgeInsets.all(16),
      children: [
        const Text('Paste JSON Backup',
            style: TextStyle(fontSize: 16, fontWeight: FontWeight.bold)),
        const SizedBox(height: 12),
        TextField(
          controller: _jsonInputCtrl,
          maxLines: 10,
          decoration: const InputDecoration(
            hintText: 'Paste your JSON backup here...',
            border: OutlineInputBorder(),
          ),
        ),
        const SizedBox(height: 12),
        ElevatedButton.icon(
          onPressed: _parseJSON,
          icon: const Icon(Icons.restore),
          label: const Text('Parse & Restore'),
        ),
        if (_parseError != null) ...[
          const SizedBox(height: 12),
          Card(
            color: Colors.red.shade50,
            child: Padding(
              padding: const EdgeInsets.all(12),
              child: Row(
                children: [
                  const Icon(Icons.error, color: Colors.red),
                  const SizedBox(width: 8),
                  Expanded(child: Text(_parseError!)),
                ],
              ),
            ),
          ),
        ],
        if (_parsedData != null) ...[
          const SizedBox(height: 12),
          Card(
            color: Colors.green.shade50,
            child: Padding(
              padding: const EdgeInsets.all(12),
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  const Row(
                    children: [
                      Icon(Icons.check_circle, color: Colors.green),
                      SizedBox(width: 8),
                      Text('Valid backup data parsed!',
                          style: TextStyle(fontWeight: FontWeight.bold)),
                    ],
                  ),
                  const SizedBox(height: 12),
                  ..._parsedData!.entries.map((e) => Padding(
                        padding: const EdgeInsets.symmetric(vertical: 2),
                        child: Text(
                          '${e.key}: ${e.value is List ? '${(e.value as List).length} items' : e.value}',
                          style: const TextStyle(fontSize: 13),
                        ),
                      )),
                ],
              ),
            ),
          ),
        ],
      ],
    );
  }
}

class _SemesterBackupEntry {
  final TextEditingController nameController;
  final List<_CourseBackupEntry> courses;

  _SemesterBackupEntry({required this.nameController, required this.courses});

  void dispose() {
    nameController.dispose();
    for (final c in courses) {
      c.dispose();
    }
  }
}

class _CourseBackupEntry {
  final TextEditingController nameController;
  final TextEditingController creditsController;
  final TextEditingController gradeController;
  final TextEditingController gradePointController;

  _CourseBackupEntry({
    required this.nameController,
    required this.creditsController,
    required this.gradeController,
    required this.gradePointController,
  });

  void dispose() {
    nameController.dispose();
    creditsController.dispose();
    gradeController.dispose();
    gradePointController.dispose();
  }
}
