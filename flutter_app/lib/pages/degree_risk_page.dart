import 'package:flutter/material.dart';

import 'package:cgpa_app/engine/calculations.dart';
import 'package:cgpa_app/models/university_config.dart';
import 'package:cgpa_app/models/engine_types.dart';
import 'package:cgpa_app/universities/nigeria/nigeria.dart';

/// Feature 5: Degree Risk Warning System.
class DegreeRiskPage extends StatefulWidget {
  const DegreeRiskPage({super.key});

  @override
  State<DegreeRiskPage> createState() => _DegreeRiskPageState();
}

class _DegreeRiskPageState extends State<DegreeRiskPage> {
  late List<UniversityConfig> _universities;
  UniversityConfig? _config;

  final _cgpaCtrl = TextEditingController(text: '3.50');
  final _completedCreditsCtrl = TextEditingController(text: '80');
  final _totalProgramCreditsCtrl = TextEditingController(text: '150');
  DegreeRiskLevel? _result;

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

  void _assess() {
    if (_config == null) return;

    final cgpa = double.tryParse(_cgpaCtrl.text.trim()) ?? 0;
    final completed = int.tryParse(_completedCreditsCtrl.text.trim()) ?? 0;
    final total = int.tryParse(_totalProgramCreditsCtrl.text.trim()) ?? 0;

    final result = assessDegreeRisk(
      cgpa,
      _config!.degreeClasses,
      completed,
      total,
    );

    setState(() => _result = result);
  }

  @override
  void dispose() {
    _cgpaCtrl.dispose();
    _completedCreditsCtrl.dispose();
    _totalProgramCreditsCtrl.dispose();
    super.dispose();
  }

  Color _riskColor(RiskLevel level) {
    switch (level) {
      case RiskLevel.safe:
        return Colors.green;
      case RiskLevel.warning:
        return Colors.orange;
      case RiskLevel.danger:
        return Colors.deepOrange;
      case RiskLevel.critical:
        return Colors.red;
    }
  }

  IconData _riskIcon(RiskLevel level) {
    switch (level) {
      case RiskLevel.safe:
        return Icons.check_circle;
      case RiskLevel.warning:
        return Icons.warning;
      case RiskLevel.danger:
        return Icons.error;
      case RiskLevel.critical:
        return Icons.dangerous;
    }
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(title: const Text('Degree Risk Warning')),
      body: ListView(
        padding: const EdgeInsets.all(16),
        children: [
          _buildUniversityDropdown(),
          const SizedBox(height: 16),
          _buildInputCard(),
          const SizedBox(height: 16),
          ElevatedButton.icon(
            onPressed: _assess,
            icon: const Icon(Icons.assessment),
            label: const Text('Assess Risk'),
          ),
          if (_result != null) ...[
            const SizedBox(height: 20),
            _buildRiskCard(),
            const SizedBox(height: 12),
            _buildDetailsCard(),
            const SizedBox(height: 12),
            _buildDegreeClassesCard(),
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
            const Text('Academic Status',
                style: TextStyle(fontWeight: FontWeight.bold)),
            const SizedBox(height: 12),
            TextField(
              controller: _cgpaCtrl,
              keyboardType:
                  const TextInputType.numberWithOptions(decimal: true),
              decoration: const InputDecoration(
                labelText: 'Current CGPA',
                prefixIcon: Icon(Icons.grade),
              ),
            ),
            const SizedBox(height: 12),
            Row(
              children: [
                Expanded(
                  child: TextField(
                    controller: _completedCreditsCtrl,
                    keyboardType: TextInputType.number,
                    decoration: const InputDecoration(
                      labelText: 'Completed Credits',
                      prefixIcon: Icon(Icons.check_circle_outline),
                    ),
                  ),
                ),
                const SizedBox(width: 12),
                Expanded(
                  child: TextField(
                    controller: _totalProgramCreditsCtrl,
                    keyboardType: TextInputType.number,
                    decoration: const InputDecoration(
                      labelText: 'Total Program Credits',
                      prefixIcon: Icon(Icons.school),
                    ),
                  ),
                ),
              ],
            ),
          ],
        ),
      ),
    );
  }

  Widget _buildRiskCard() {
    final r = _result!;
    final color = _riskColor(r.level);
    final icon = _riskIcon(r.level);

    return Card(
      color: color.withAlpha(25),
      shape: RoundedRectangleBorder(
        borderRadius: BorderRadius.circular(12),
        side: BorderSide(color: color, width: 2),
      ),
      child: Padding(
        padding: const EdgeInsets.all(20),
        child: Column(
          children: [
            Icon(icon, size: 64, color: color),
            const SizedBox(height: 12),
            Text(
              r.level.name.toUpperCase(),
              style: TextStyle(
                fontSize: 28,
                fontWeight: FontWeight.bold,
                color: color,
              ),
            ),
            const SizedBox(height: 8),
            Text(
              r.message,
              textAlign: TextAlign.center,
              style: const TextStyle(fontSize: 14),
            ),
            const SizedBox(height: 16),
            Container(
              padding:
                  const EdgeInsets.symmetric(horizontal: 16, vertical: 8),
              decoration: BoxDecoration(
                color: Colors.white,
                borderRadius: BorderRadius.circular(20),
              ),
              child: Text(
                'Current Class: ${r.currentClass}',
                style: const TextStyle(
                    fontSize: 16, fontWeight: FontWeight.bold),
              ),
            ),
          ],
        ),
      ),
    );
  }

  Widget _buildDetailsCard() {
    final r = _result!;
    return Card(
      child: Padding(
        padding: const EdgeInsets.all(16),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            const Text('Risk Details',
                style: TextStyle(fontSize: 16, fontWeight: FontWeight.bold)),
            const SizedBox(height: 12),
            _detailRow('Current Class', r.currentClass),
            if (r.nextClassDown != null)
              _detailRow('Next Class Down', r.nextClassDown!),
            _detailRow('CGPA Buffer (Down)',
                r.cgpaToNextClassDown.toStringAsFixed(2)),
            if (r.cgpaToNextClassUp != null)
              _detailRow('CGPA to Next Class Up',
                  r.cgpaToNextClassUp!.toStringAsFixed(2)),
          ],
        ),
      ),
    );
  }

  Widget _detailRow(String label, String value) {
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

  Widget _buildDegreeClassesCard() {
    if (_config == null) return const SizedBox.shrink();
    final classes = _config!.degreeClasses;
    final currentCGPA = double.tryParse(_cgpaCtrl.text.trim()) ?? 0;

    return Card(
      child: Padding(
        padding: const EdgeInsets.all(16),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            const Text('Degree Classifications',
                style: TextStyle(fontSize: 16, fontWeight: FontWeight.bold)),
            const SizedBox(height: 12),
            ...classes.map((dc) {
              final isCurrent =
                  currentCGPA >= dc.minCGPA && currentCGPA <= dc.maxCGPA;
              return Container(
                margin: const EdgeInsets.only(bottom: 4),
                decoration: BoxDecoration(
                  color: isCurrent ? Colors.teal.shade50 : null,
                  borderRadius: BorderRadius.circular(8),
                  border: isCurrent
                      ? Border.all(color: Colors.teal, width: 2)
                      : null,
                ),
                child: ListTile(
                  dense: true,
                  leading: isCurrent
                      ? const Icon(Icons.arrow_right, color: Colors.teal)
                      : const SizedBox(width: 24),
                  title: Text(
                    dc.name,
                    style: TextStyle(
                      fontWeight:
                          isCurrent ? FontWeight.bold : FontWeight.normal,
                    ),
                  ),
                  trailing: Text(
                    '${dc.minCGPA.toStringAsFixed(2)} – ${dc.maxCGPA.toStringAsFixed(2)}',
                    style: const TextStyle(fontFamily: 'monospace'),
                  ),
                ),
              );
            }),
          ],
        ),
      ),
    );
  }
}
