import 'package:flutter/material.dart';

import 'package:cgpa_app/engine/calculations.dart';
import 'package:cgpa_app/models/engine_types.dart';

/// Feature 7: Academic Performance Analytics.
class AnalyticsPage extends StatefulWidget {
  const AnalyticsPage({super.key});

  @override
  State<AnalyticsPage> createState() => _AnalyticsPageState();
}

class _AnalyticsPageState extends State<AnalyticsPage> {
  final List<_SemesterEntry> _semesters = [];
  List<PerformanceTrend>? _trends;

  void _addSemester() {
    setState(() {
      _semesters.add(_SemesterEntry(
        nameController: TextEditingController(
            text: '${(_semesters.length ~/ 2 + 1) * 100}L-${_semesters.length % 2 + 1}'),
        gpaController: TextEditingController(),
        creditsController: TextEditingController(text: '18'),
      ));
    });
  }

  void _removeSemester(int index) {
    setState(() {
      _semesters[index].dispose();
      _semesters.removeAt(index);
    });
  }

  void _analyze() {
    if (_semesters.isEmpty) return;

    final inputs = _semesters.map((e) {
      return SemesterTrendInput(
        name: e.nameController.text.trim().isEmpty
            ? 'Semester ${_semesters.indexOf(e) + 1}'
            : e.nameController.text.trim(),
        gpa: double.tryParse(e.gpaController.text.trim()) ?? 0,
        credits: int.tryParse(e.creditsController.text.trim()) ?? 0,
      );
    }).toList();

    final trends = analyzePerformanceTrends(inputs);
    setState(() => _trends = trends);
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

  IconData _trendIcon(String trend) {
    switch (trend) {
      case 'improving':
        return Icons.trending_up;
      case 'declining':
        return Icons.trending_down;
      default:
        return Icons.trending_flat;
    }
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(title: const Text('Performance Analytics')),
      floatingActionButton: FloatingActionButton(
        onPressed: _addSemester,
        child: const Icon(Icons.add),
      ),
      body: ListView(
        padding: const EdgeInsets.all(16),
        children: [
          const Text('Enter Semester Data',
              style: TextStyle(fontSize: 16, fontWeight: FontWeight.bold)),
          const SizedBox(height: 8),
          ..._semesters.asMap().entries.map(
              (e) => _buildSemesterCard(e.key, e.value)),
          if (_semesters.isNotEmpty) ...[
            const SizedBox(height: 12),
            ElevatedButton.icon(
              onPressed: _analyze,
              icon: const Icon(Icons.analytics),
              label: const Text('Analyze Trends'),
            ),
          ],
          if (_trends != null && _trends!.isNotEmpty) ...[
            const SizedBox(height: 20),
            _buildSummaryCard(),
            const SizedBox(height: 12),
            _buildChartPlaceholder(),
            const SizedBox(height: 12),
            _buildTrendList(),
          ],
        ],
      ),
    );
  }

  Widget _buildSemesterCard(int index, _SemesterEntry entry) {
    return Card(
      margin: const EdgeInsets.only(bottom: 8),
      child: Padding(
        padding: const EdgeInsets.all(10),
        child: Row(
          children: [
            Expanded(
              flex: 2,
              child: TextField(
                controller: entry.nameController,
                decoration:
                    InputDecoration(labelText: 'Sem ${index + 1}', isDense: true),
              ),
            ),
            const SizedBox(width: 8),
            Expanded(
              child: TextField(
                controller: entry.gpaController,
                keyboardType:
                    const TextInputType.numberWithOptions(decimal: true),
                decoration:
                    const InputDecoration(labelText: 'GPA', isDense: true),
              ),
            ),
            const SizedBox(width: 8),
            Expanded(
              child: TextField(
                controller: entry.creditsController,
                keyboardType: TextInputType.number,
                decoration:
                    const InputDecoration(labelText: 'Credits', isDense: true),
              ),
            ),
            IconButton(
              icon: const Icon(Icons.close, size: 18),
              onPressed: () => _removeSemester(index),
            ),
          ],
        ),
      ),
    );
  }

  Widget _buildSummaryCard() {
    final trends = _trends!;
    final latestCGPA = trends.last.cgpa;
    final highestGPA = trends.map((t) => t.gpa).reduce(
        (a, b) => a > b ? a : b);
    final lowestGPA = trends.map((t) => t.gpa).reduce(
        (a, b) => a < b ? a : b);
    final improving =
        trends.where((t) => t.trend == 'improving').length;
    final declining =
        trends.where((t) => t.trend == 'declining').length;

    return Card(
      color: Colors.teal.shade50,
      child: Padding(
        padding: const EdgeInsets.all(16),
        child: Column(
          children: [
            const Text('Performance Summary',
                style: TextStyle(fontSize: 18, fontWeight: FontWeight.bold)),
            const SizedBox(height: 16),
            Row(
              mainAxisAlignment: MainAxisAlignment.spaceEvenly,
              children: [
                _summaryItem('CGPA', latestCGPA.toStringAsFixed(2),
                    Colors.teal),
                _summaryItem('Highest', highestGPA.toStringAsFixed(2),
                    Colors.green),
                _summaryItem('Lowest', lowestGPA.toStringAsFixed(2),
                    Colors.red),
              ],
            ),
            const SizedBox(height: 12),
            Row(
              mainAxisAlignment: MainAxisAlignment.center,
              children: [
                Chip(
                  avatar: const Icon(Icons.trending_up,
                      size: 16, color: Colors.green),
                  label: Text('$improving improving'),
                ),
                const SizedBox(width: 8),
                Chip(
                  avatar: const Icon(Icons.trending_down,
                      size: 16, color: Colors.red),
                  label: Text('$declining declining'),
                ),
              ],
            ),
          ],
        ),
      ),
    );
  }

  Widget _summaryItem(String label, String value, Color color) {
    return Column(
      children: [
        Text(value,
            style: TextStyle(
                fontSize: 24, fontWeight: FontWeight.bold, color: color)),
        Text(label, style: const TextStyle(fontSize: 12, color: Colors.grey)),
      ],
    );
  }

  Widget _buildChartPlaceholder() {
    final trends = _trends!;
    final maxGPA = trends.map((t) => t.gpa).reduce(
            (a, b) => a > b ? a : b) +
        0.5;

    return Card(
      child: Padding(
        padding: const EdgeInsets.all(16),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            const Text('GPA Trend',
                style: TextStyle(fontSize: 16, fontWeight: FontWeight.bold)),
            const SizedBox(height: 12),
            SizedBox(
              height: 150,
              child: Row(
                crossAxisAlignment: CrossAxisAlignment.end,
                children: trends.map((t) {
                  final barHeight =
                      maxGPA > 0 ? (t.gpa / maxGPA) * 130 : 0.0;
                  return Expanded(
                    child: Padding(
                      padding: const EdgeInsets.symmetric(horizontal: 2),
                      child: Column(
                        mainAxisAlignment: MainAxisAlignment.end,
                        children: [
                          Text(t.gpa.toStringAsFixed(1),
                              style: const TextStyle(fontSize: 10)),
                          const SizedBox(height: 2),
                          Container(
                            height: barHeight,
                            decoration: BoxDecoration(
                              color: _trendColor(t.trend),
                              borderRadius: const BorderRadius.vertical(
                                  top: Radius.circular(4)),
                            ),
                          ),
                          const SizedBox(height: 4),
                          Text(t.semester,
                              style: const TextStyle(fontSize: 8),
                              overflow: TextOverflow.ellipsis),
                        ],
                      ),
                    ),
                  );
                }).toList(),
              ),
            ),
          ],
        ),
      ),
    );
  }

  Widget _buildTrendList() {
    final trends = _trends!;
    return Card(
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          const Padding(
            padding: EdgeInsets.all(12),
            child: Text('Semester Details',
                style: TextStyle(fontSize: 16, fontWeight: FontWeight.bold)),
          ),
          ...trends.map((t) => ListTile(
                leading: CircleAvatar(
                  backgroundColor: _trendColor(t.trend).withAlpha(30),
                  child:
                      Icon(_trendIcon(t.trend), color: _trendColor(t.trend)),
                ),
                title: Text(t.semester),
                subtitle: Text(
                    'GPA: ${t.gpa.toStringAsFixed(2)} | CGPA: ${t.cgpa.toStringAsFixed(2)} | ${t.credits} credits'),
                trailing: Column(
                  mainAxisAlignment: MainAxisAlignment.center,
                  crossAxisAlignment: CrossAxisAlignment.end,
                  children: [
                    Text(
                      t.trend.toUpperCase(),
                      style: TextStyle(
                        fontSize: 11,
                        fontWeight: FontWeight.bold,
                        color: _trendColor(t.trend),
                      ),
                    ),
                    if (t.improvementMarker != null)
                      Text(t.improvementMarker!,
                          style: const TextStyle(fontSize: 10)),
                  ],
                ),
              )),
        ],
      ),
    );
  }
}

class _SemesterEntry {
  final TextEditingController nameController;
  final TextEditingController gpaController;
  final TextEditingController creditsController;

  _SemesterEntry({
    required this.nameController,
    required this.gpaController,
    required this.creditsController,
  });

  void dispose() {
    nameController.dispose();
    gpaController.dispose();
    creditsController.dispose();
  }
}
