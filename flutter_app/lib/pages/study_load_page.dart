import 'package:flutter/material.dart';

import 'package:cgpa_app/engine/calculations.dart';
import 'package:cgpa_app/models/university_config.dart';
import 'package:cgpa_app/models/engine_types.dart';
import 'package:cgpa_app/universities/nigeria/nigeria.dart';

/// Feature 8: Study Load Optimizer.
class StudyLoadPage extends StatefulWidget {
  const StudyLoadPage({super.key});

  @override
  State<StudyLoadPage> createState() => _StudyLoadPageState();
}

class _StudyLoadPageState extends State<StudyLoadPage> {
  late List<UniversityConfig> _universities;
  UniversityConfig? _config;

  final _cgpaCtrl = TextEditingController(text: '3.20');
  final _completedCreditsCtrl = TextEditingController(text: '60');
  final _targetCgpaCtrl = TextEditingController(text: '3.80');
  StudyLoadRecommendation? _result;

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

  void _recommend() {
    if (_config == null) return;

    final cgpa = double.tryParse(_cgpaCtrl.text.trim()) ?? 0;
    final completed = int.tryParse(_completedCreditsCtrl.text.trim()) ?? 0;
    final target = double.tryParse(_targetCgpaCtrl.text.trim()) ?? 0;

    final result = recommendStudyLoad(cgpa, completed, target, _config!);
    setState(() => _result = result);
  }

  @override
  void dispose() {
    _cgpaCtrl.dispose();
    _completedCreditsCtrl.dispose();
    _targetCgpaCtrl.dispose();
    super.dispose();
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(title: const Text('Study Load Optimizer')),
      body: ListView(
        padding: const EdgeInsets.all(16),
        children: [
          _buildUniversityDropdown(),
          const SizedBox(height: 16),
          _buildInputCard(),
          const SizedBox(height: 16),
          ElevatedButton.icon(
            onPressed: _recommend,
            icon: const Icon(Icons.tune),
            label: const Text('Get Recommendation'),
          ),
          if (_result != null) ...[
            const SizedBox(height: 20),
            _buildRecommendationCard(),
            const SizedBox(height: 12),
            _buildCourseBreakdown(),
            const SizedBox(height: 12),
            _buildCreditRulesInfo(),
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
            const Text('Your Goals',
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
                    controller: _targetCgpaCtrl,
                    keyboardType:
                        const TextInputType.numberWithOptions(decimal: true),
                    decoration: const InputDecoration(
                      labelText: 'Target CGPA',
                      prefixIcon: Icon(Icons.flag),
                    ),
                  ),
                ),
              ],
            ),
            const SizedBox(height: 12),
            TextField(
              controller: _completedCreditsCtrl,
              keyboardType: TextInputType.number,
              decoration: const InputDecoration(
                labelText: 'Completed Credits',
                prefixIcon: Icon(Icons.check_circle_outline),
              ),
            ),
          ],
        ),
      ),
    );
  }

  Widget _buildRecommendationCard() {
    final r = _result!;
    return Card(
      color: Colors.teal.shade50,
      child: Padding(
        padding: const EdgeInsets.all(16),
        child: Column(
          children: [
            const Icon(Icons.lightbulb, color: Colors.amber, size: 40),
            const SizedBox(height: 12),
            const Text('Recommendation',
                style: TextStyle(fontSize: 18, fontWeight: FontWeight.bold)),
            const SizedBox(height: 16),
            Row(
              mainAxisAlignment: MainAxisAlignment.spaceEvenly,
              children: [
                _statColumn('Credits', r.recommendedCredits.toString(),
                    Colors.teal),
                _statColumn('Target GPA', r.targetGPA.toStringAsFixed(2),
                    Colors.indigo),
                _statColumn('Courses', r.courses.length.toString(),
                    Colors.purple),
              ],
            ),
            const SizedBox(height: 16),
            Container(
              padding: const EdgeInsets.all(12),
              decoration: BoxDecoration(
                color: Colors.white,
                borderRadius: BorderRadius.circular(8),
              ),
              child: Text(
                r.reason,
                textAlign: TextAlign.center,
                style: const TextStyle(fontSize: 14),
              ),
            ),
          ],
        ),
      ),
    );
  }

  Widget _statColumn(String label, String value, Color color) {
    return Column(
      children: [
        Text(value,
            style: TextStyle(
                fontSize: 28, fontWeight: FontWeight.bold, color: color)),
        Text(label, style: const TextStyle(fontSize: 12, color: Colors.grey)),
      ],
    );
  }

  Widget _buildCourseBreakdown() {
    final r = _result!;
    return Card(
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          const Padding(
            padding: EdgeInsets.all(12),
            child: Text('Suggested Course Plan',
                style: TextStyle(fontSize: 16, fontWeight: FontWeight.bold)),
          ),
          ...r.courses.asMap().entries.map((e) {
            final i = e.key;
            final course = e.value;
            return ListTile(
              leading: CircleAvatar(
                backgroundColor: Colors.teal.shade100,
                child: Text('${i + 1}'),
              ),
              title: Text('${course.credits} credit unit course'),
              trailing: Chip(
                label: Text('Min: ${course.minGrade}'),
                backgroundColor: Colors.amber.shade100,
              ),
            );
          }),
        ],
      ),
    );
  }

  Widget _buildCreditRulesInfo() {
    if (_config == null) return const SizedBox.shrink();
    final rules = _config!.creditRules;
    return Card(
      child: Padding(
        padding: const EdgeInsets.all(16),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            Text('${_config!.shortName} Credit Rules',
                style:
                    const TextStyle(fontSize: 16, fontWeight: FontWeight.bold)),
            const SizedBox(height: 12),
            _ruleRow('Min Credits/Semester',
                rules.minimumPerSemester.toString()),
            _ruleRow('Max Credits/Semester',
                rules.maximumPerSemester.toString()),
            _ruleRow('Grading Scale',
                '${_config!.gradingSystem.scale} point'),
          ],
        ),
      ),
    );
  }

  Widget _ruleRow(String label, String value) {
    return Padding(
      padding: const EdgeInsets.symmetric(vertical: 4),
      child: Row(
        mainAxisAlignment: MainAxisAlignment.spaceBetween,
        children: [
          Text(label, style: const TextStyle(color: Colors.grey)),
          Text(value, style: const TextStyle(fontWeight: FontWeight.w600)),
        ],
      ),
    );
  }
}
