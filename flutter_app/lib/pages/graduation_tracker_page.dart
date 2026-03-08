import 'package:flutter/material.dart';

import 'package:cgpa_app/models/university_config.dart';
import 'package:cgpa_app/universities/nigeria/nigeria.dart';

/// Feature 2: Graduation Credit Tracker.
class GraduationTrackerPage extends StatefulWidget {
  const GraduationTrackerPage({super.key});

  @override
  State<GraduationTrackerPage> createState() => _GraduationTrackerPageState();
}

class _GraduationTrackerPageState extends State<GraduationTrackerPage> {
  late List<UniversityConfig> _universities;
  UniversityConfig? _config;
  final _completedCreditsCtrl = TextEditingController(text: '0');
  final _currentSemesterCtrl = TextEditingController(text: '1');

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

  @override
  void dispose() {
    _completedCreditsCtrl.dispose();
    _currentSemesterCtrl.dispose();
    super.dispose();
  }

  int get _completedCredits =>
      int.tryParse(_completedCreditsCtrl.text.trim()) ?? 0;

  int get _currentSemester =>
      int.tryParse(_currentSemesterCtrl.text.trim()) ?? 1;

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(title: const Text('Graduation Tracker')),
      body: ListView(
        padding: const EdgeInsets.all(16),
        children: [
          _buildUniversityDropdown(),
          const SizedBox(height: 16),
          _buildInputFields(),
          const SizedBox(height: 20),
          _buildProgressSection(),
          const SizedBox(height: 16),
          _buildCreditRulesCard(),
          const SizedBox(height: 16),
          _buildProgramInfoCard(),
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
        if (id != null) setState(() => _config = getUniversityById(id));
      },
    );
  }

  Widget _buildInputFields() {
    return Row(
      children: [
        Expanded(
          child: TextField(
            controller: _completedCreditsCtrl,
            keyboardType: TextInputType.number,
            decoration: const InputDecoration(
              labelText: 'Completed Credits',
              prefixIcon: Icon(Icons.check_circle),
            ),
            onChanged: (_) => setState(() {}),
          ),
        ),
        const SizedBox(width: 12),
        Expanded(
          child: TextField(
            controller: _currentSemesterCtrl,
            keyboardType: TextInputType.number,
            decoration: const InputDecoration(
              labelText: 'Current Semester',
              prefixIcon: Icon(Icons.calendar_today),
            ),
            onChanged: (_) => setState(() {}),
          ),
        ),
      ],
    );
  }

  Widget _buildProgressSection() {
    if (_config == null) {
      return const Card(
        child: Padding(
          padding: EdgeInsets.all(24),
          child: Text('Select a university to view graduation progress.'),
        ),
      );
    }

    final graduationCredits = _config!.creditRules.graduationCredits;
    if (graduationCredits.isEmpty) {
      return const Card(
        child: Padding(
          padding: EdgeInsets.all(16),
          child: Text('No graduation credit data available.'),
        ),
      );
    }

    final target = graduationCredits.first;
    final requiredMin = target.min;
    final completed = _completedCredits;
    final remaining = (requiredMin - completed).clamp(0, requiredMin);
    final progress = requiredMin > 0 ? (completed / requiredMin).clamp(0.0, 1.0) : 0.0;

    final totalSemesters = target.programYears * 2;
    final semestersLeft = (totalSemesters - _currentSemester).clamp(0, totalSemesters);
    final creditsPerSemester = semestersLeft > 0 ? (remaining / semestersLeft).ceil() : remaining;

    return Card(
      color: Colors.teal.shade50,
      child: Padding(
        padding: const EdgeInsets.all(16),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            const Text('Graduation Progress',
                style: TextStyle(fontSize: 18, fontWeight: FontWeight.bold)),
            const SizedBox(height: 16),
            ClipRRect(
              borderRadius: BorderRadius.circular(8),
              child: LinearProgressIndicator(
                value: progress,
                minHeight: 20,
                backgroundColor: Colors.grey.shade200,
                color: progress >= 1.0 ? Colors.green : Colors.teal,
              ),
            ),
            const SizedBox(height: 8),
            Text(
              '${(progress * 100).toStringAsFixed(1)}% complete',
              style: TextStyle(
                fontSize: 16,
                fontWeight: FontWeight.w600,
                color: progress >= 1.0 ? Colors.green : Colors.teal.shade700,
              ),
            ),
            const SizedBox(height: 16),
            Row(
              mainAxisAlignment: MainAxisAlignment.spaceAround,
              children: [
                _progressStat('Completed', '$completed', Colors.green),
                _progressStat('Remaining', '$remaining', Colors.orange),
                _progressStat('Required', '$requiredMin', Colors.blue),
              ],
            ),
            if (remaining > 0 && semestersLeft > 0) ...[
              const Divider(height: 24),
              ListTile(
                leading: const Icon(Icons.info_outline, color: Colors.teal),
                title: Text(
                    'You need ~$creditsPerSemester credits/semester for the remaining $semestersLeft semesters.'),
                contentPadding: EdgeInsets.zero,
              ),
            ],
            if (remaining == 0)
              const ListTile(
                leading: Icon(Icons.celebration, color: Colors.green),
                title: Text('You have met the minimum credit requirement!'),
                contentPadding: EdgeInsets.zero,
              ),
          ],
        ),
      ),
    );
  }

  Widget _progressStat(String label, String value, Color color) {
    return Column(
      children: [
        Text(value,
            style: TextStyle(
                fontSize: 24, fontWeight: FontWeight.bold, color: color)),
        Text(label, style: const TextStyle(fontSize: 12, color: Colors.grey)),
      ],
    );
  }

  Widget _buildCreditRulesCard() {
    if (_config == null) return const SizedBox.shrink();
    final rules = _config!.creditRules;
    return Card(
      child: Padding(
        padding: const EdgeInsets.all(16),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            const Text('Credit Rules',
                style: TextStyle(fontSize: 16, fontWeight: FontWeight.bold)),
            const SizedBox(height: 12),
            _ruleRow('Min Credits per Semester',
                rules.minimumPerSemester.toString()),
            _ruleRow('Max Credits per Semester',
                rules.maximumPerSemester.toString()),
            ...rules.graduationCredits.map((gc) => _ruleRow(
                'Graduation (${gc.programYears}yr)',
                '${gc.min}–${gc.max} credits')),
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
          Text(value,
              style: const TextStyle(fontWeight: FontWeight.w600)),
        ],
      ),
    );
  }

  Widget _buildProgramInfoCard() {
    if (_config == null) return const SizedBox.shrink();
    return Card(
      child: Padding(
        padding: const EdgeInsets.all(16),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            const Text('Program Information',
                style: TextStyle(fontSize: 16, fontWeight: FontWeight.bold)),
            const SizedBox(height: 12),
            _ruleRow('University', _config!.name),
            _ruleRow('Max Duration', _config!.maxProgramDuration),
            _ruleRow('Probation Threshold',
                '${_config!.probation.minCGPA} CGPA'),
            _ruleRow('Repeat Policy', _config!.repeatPolicy.description),
          ],
        ),
      ),
    );
  }
}
