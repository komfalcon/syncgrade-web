import 'package:flutter/material.dart';

import 'package:cgpa_app/engine/calculations.dart';
import 'package:cgpa_app/models/university_config.dart';
import 'package:cgpa_app/models/engine_types.dart';
import 'package:cgpa_app/universities/nigeria/nigeria.dart';

/// Feature 6: Best/Worst Case Projection.
class BestWorstPage extends StatefulWidget {
  const BestWorstPage({super.key});

  @override
  State<BestWorstPage> createState() => _BestWorstPageState();
}

class _BestWorstPageState extends State<BestWorstPage> {
  late List<UniversityConfig> _universities;
  UniversityConfig? _config;

  final _cgpaCtrl = TextEditingController(text: '3.50');
  final _completedCreditsCtrl = TextEditingController(text: '60');
  final _remainingCreditsCtrl = TextEditingController(text: '60');
  BestWorstProjection? _result;

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

  void _project() {
    if (_config == null) return;

    final cgpa = double.tryParse(_cgpaCtrl.text.trim()) ?? 0;
    final completed = int.tryParse(_completedCreditsCtrl.text.trim()) ?? 0;
    final remaining = int.tryParse(_remainingCreditsCtrl.text.trim()) ?? 0;

    final result = projectBestWorstCase(
      cgpa,
      completed,
      remaining,
      _config!.gradingSystem.scale,
      _config!.degreeClasses,
    );

    setState(() => _result = result);
  }

  @override
  void dispose() {
    _cgpaCtrl.dispose();
    _completedCreditsCtrl.dispose();
    _remainingCreditsCtrl.dispose();
    super.dispose();
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(title: const Text('Best/Worst Case')),
      body: ListView(
        padding: const EdgeInsets.all(16),
        children: [
          _buildUniversityDropdown(),
          const SizedBox(height: 16),
          _buildInputCard(),
          const SizedBox(height: 16),
          ElevatedButton.icon(
            onPressed: _project,
            icon: const Icon(Icons.swap_vert),
            label: const Text('Project'),
          ),
          if (_result != null) ...[
            const SizedBox(height: 20),
            _buildProjectionCards(),
            const SizedBox(height: 12),
            _buildGpaNeededCard(),
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
                    controller: _remainingCreditsCtrl,
                    keyboardType: TextInputType.number,
                    decoration: const InputDecoration(
                      labelText: 'Remaining Credits',
                      prefixIcon: Icon(Icons.pending),
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

  Widget _buildProjectionCards() {
    final r = _result!;
    return Row(
      children: [
        Expanded(
          child: _caseCard(
            'Best Case',
            r.bestCase.cgpa,
            r.bestCase.degreeClass,
            Colors.green,
            Icons.trending_up,
          ),
        ),
        const SizedBox(width: 8),
        Expanded(
          child: _caseCard(
            'Current',
            r.currentCase.cgpa,
            r.currentCase.degreeClass,
            Colors.blue,
            Icons.trending_flat,
          ),
        ),
        const SizedBox(width: 8),
        Expanded(
          child: _caseCard(
            'Worst Case',
            r.worstCase.cgpa,
            r.worstCase.degreeClass,
            Colors.red,
            Icons.trending_down,
          ),
        ),
      ],
    );
  }

  Widget _caseCard(
      String label, double cgpa, String degreeClass, Color color, IconData icon) {
    return Card(
      color: color.withAlpha(25),
      shape: RoundedRectangleBorder(
        borderRadius: BorderRadius.circular(12),
        side: BorderSide(color: color.withAlpha(100)),
      ),
      child: Padding(
        padding: const EdgeInsets.all(12),
        child: Column(
          children: [
            Icon(icon, color: color, size: 28),
            const SizedBox(height: 8),
            Text(label,
                style: TextStyle(
                    fontSize: 12, color: color, fontWeight: FontWeight.w600)),
            const SizedBox(height: 4),
            Text(
              cgpa.toStringAsFixed(2),
              style: TextStyle(
                  fontSize: 28, fontWeight: FontWeight.bold, color: color),
            ),
            const SizedBox(height: 4),
            Text(
              degreeClass,
              textAlign: TextAlign.center,
              style: const TextStyle(fontSize: 11),
            ),
          ],
        ),
      ),
    );
  }

  Widget _buildGpaNeededCard() {
    final r = _result!;
    return Card(
      color: Colors.amber.shade50,
      child: Padding(
        padding: const EdgeInsets.all(16),
        child: Column(
          children: [
            const Icon(Icons.info_outline, color: Colors.amber, size: 32),
            const SizedBox(height: 8),
            const Text('To Maintain Current CGPA',
                style: TextStyle(fontSize: 16, fontWeight: FontWeight.bold)),
            const SizedBox(height: 8),
            Text(
              'You need a GPA of ${r.bestCase.gpaNeeded.toStringAsFixed(2)} in the remaining ${r.remainingCredits} credits.',
              textAlign: TextAlign.center,
              style: const TextStyle(fontSize: 14),
            ),
            const SizedBox(height: 8),
            Text(
              r.bestCase.gpaNeeded <= (_config?.gradingSystem.scale ?? 5.0)
                  ? 'This is achievable! ✓'
                  : 'This exceeds the maximum GPA scale. ✗',
              style: TextStyle(
                fontWeight: FontWeight.w600,
                color: r.bestCase.gpaNeeded <=
                        (_config?.gradingSystem.scale ?? 5.0)
                    ? Colors.green
                    : Colors.red,
              ),
            ),
          ],
        ),
      ),
    );
  }
}
