import 'package:flutter/material.dart';

import 'package:cgpa_app/engine/calculations.dart';
import 'package:cgpa_app/models/university_config.dart';
import 'package:cgpa_app/universities/nigeria/nigeria.dart';

/// Feature 9: University Comparison Database.
class UniversityComparisonPage extends StatefulWidget {
  const UniversityComparisonPage({super.key});

  @override
  State<UniversityComparisonPage> createState() =>
      _UniversityComparisonPageState();
}

class _UniversityComparisonPageState extends State<UniversityComparisonPage> {
  late List<UniversityConfig> _universities;
  UniversityConfig? _uniA;
  UniversityConfig? _uniB;

  @override
  void initState() {
    super.initState();
    _universities = getAllUniversities();
    if (_universities.length >= 2) {
      _uniA = _universities[0];
      _uniB = _universities[1];
    } else if (_universities.isNotEmpty) {
      _uniA = _universities.first;
    }
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(title: const Text('University Comparison')),
      body: ListView(
        padding: const EdgeInsets.all(16),
        children: [
          _buildSelectors(),
          const SizedBox(height: 16),
          if (_uniA != null && _uniB != null) ...[
            _buildBasicInfoComparison(),
            const SizedBox(height: 12),
            _buildGradingComparison(),
            const SizedBox(height: 12),
            _buildDegreeClassComparison(),
            const SizedBox(height: 12),
            _buildCreditRulesComparison(),
            const SizedBox(height: 12),
            _buildPoliciesComparison(),
            const SizedBox(height: 12),
            _buildValidationComparison(),
          ],
        ],
      ),
    );
  }

  Widget _buildSelectors() {
    return Row(
      children: [
        Expanded(
          child: DropdownButtonFormField<String>(
            value: _uniA?.id,
            decoration: const InputDecoration(
              labelText: 'University A',
              prefixIcon: Icon(Icons.school),
            ),
            items: _universities
                .map((u) =>
                    DropdownMenuItem(value: u.id, child: Text(u.shortName)))
                .toList(),
            onChanged: (id) {
              if (id != null) {
                setState(() => _uniA = getUniversityById(id));
              }
            },
          ),
        ),
        const SizedBox(width: 12),
        Expanded(
          child: DropdownButtonFormField<String>(
            value: _uniB?.id,
            decoration: const InputDecoration(
              labelText: 'University B',
              prefixIcon: Icon(Icons.school),
            ),
            items: _universities
                .map((u) =>
                    DropdownMenuItem(value: u.id, child: Text(u.shortName)))
                .toList(),
            onChanged: (id) {
              if (id != null) {
                setState(() => _uniB = getUniversityById(id));
              }
            },
          ),
        ),
      ],
    );
  }

  Widget _buildBasicInfoComparison() {
    return Card(
      child: Padding(
        padding: const EdgeInsets.all(16),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            const Text('Basic Information',
                style: TextStyle(fontSize: 16, fontWeight: FontWeight.bold)),
            const SizedBox(height: 12),
            _compRow('Name', _uniA!.name, _uniB!.name),
            _compRow('Short Name', _uniA!.shortName, _uniB!.shortName),
            _compRow('Location', _uniA!.location, _uniB!.location),
            _compRow('Country', _uniA!.country, _uniB!.country),
            _compRow(
                'Max Duration', _uniA!.maxProgramDuration, _uniB!.maxProgramDuration),
            _compRow('Version', _uniA!.version, _uniB!.version),
          ],
        ),
      ),
    );
  }

  Widget _buildGradingComparison() {
    return Card(
      child: Padding(
        padding: const EdgeInsets.all(16),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            const Text('Grading System',
                style: TextStyle(fontSize: 16, fontWeight: FontWeight.bold)),
            const SizedBox(height: 12),
            _compRow(
              'Scale',
              _uniA!.gradingSystem.scale.toStringAsFixed(1),
              _uniB!.gradingSystem.scale.toStringAsFixed(1),
            ),
            _compRow(
              'Grade Levels',
              _uniA!.gradingSystem.grades.length.toString(),
              _uniB!.gradingSystem.grades.length.toString(),
            ),
            const Divider(),
            const Text('Grade Ranges',
                style: TextStyle(fontSize: 14, fontWeight: FontWeight.w600)),
            const SizedBox(height: 8),
            Row(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Expanded(child: _gradeTable(_uniA!)),
                const SizedBox(width: 8),
                Expanded(child: _gradeTable(_uniB!)),
              ],
            ),
          ],
        ),
      ),
    );
  }

  Widget _gradeTable(UniversityConfig uni) {
    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        Text(uni.shortName,
            style: const TextStyle(fontWeight: FontWeight.bold, fontSize: 12)),
        const SizedBox(height: 4),
        ...uni.gradingSystem.grades.map((g) => Padding(
              padding: const EdgeInsets.symmetric(vertical: 1),
              child: Row(
                children: [
                  SizedBox(
                      width: 24,
                      child: Text(g.grade,
                          style: const TextStyle(fontWeight: FontWeight.w600))),
                  Expanded(
                    child: Text(
                      '${g.min.toStringAsFixed(0)}–${g.max.toStringAsFixed(0)} (${g.points.toStringAsFixed(1)})',
                      style: const TextStyle(fontSize: 12),
                    ),
                  ),
                ],
              ),
            )),
      ],
    );
  }

  Widget _buildDegreeClassComparison() {
    return Card(
      child: Padding(
        padding: const EdgeInsets.all(16),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            const Text('Degree Classifications',
                style: TextStyle(fontSize: 16, fontWeight: FontWeight.bold)),
            const SizedBox(height: 12),
            Row(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Expanded(child: _degreeClassList(_uniA!)),
                const SizedBox(width: 8),
                Expanded(child: _degreeClassList(_uniB!)),
              ],
            ),
          ],
        ),
      ),
    );
  }

  Widget _degreeClassList(UniversityConfig uni) {
    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        Text(uni.shortName,
            style: const TextStyle(fontWeight: FontWeight.bold, fontSize: 12)),
        const SizedBox(height: 4),
        ...uni.degreeClasses.map((dc) => Padding(
              padding: const EdgeInsets.symmetric(vertical: 2),
              child: Text(
                '${dc.name}: ${dc.minCGPA.toStringAsFixed(2)}–${dc.maxCGPA.toStringAsFixed(2)}',
                style: const TextStyle(fontSize: 12),
              ),
            )),
      ],
    );
  }

  Widget _buildCreditRulesComparison() {
    return Card(
      child: Padding(
        padding: const EdgeInsets.all(16),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            const Text('Credit Rules',
                style: TextStyle(fontSize: 16, fontWeight: FontWeight.bold)),
            const SizedBox(height: 12),
            _compRow(
              'Min/Semester',
              _uniA!.creditRules.minimumPerSemester.toString(),
              _uniB!.creditRules.minimumPerSemester.toString(),
            ),
            _compRow(
              'Max/Semester',
              _uniA!.creditRules.maximumPerSemester.toString(),
              _uniB!.creditRules.maximumPerSemester.toString(),
            ),
            ..._buildGraduationCreditsRows(),
          ],
        ),
      ),
    );
  }

  List<Widget> _buildGraduationCreditsRows() {
    final aGrad = _uniA!.creditRules.graduationCredits;
    final bGrad = _uniB!.creditRules.graduationCredits;
    final maxLen = aGrad.length > bGrad.length ? aGrad.length : bGrad.length;

    return List.generate(maxLen, (i) {
      final aText = i < aGrad.length
          ? '${aGrad[i].min}–${aGrad[i].max} (${aGrad[i].programYears}yr)'
          : 'N/A';
      final bText = i < bGrad.length
          ? '${bGrad[i].min}–${bGrad[i].max} (${bGrad[i].programYears}yr)'
          : 'N/A';
      return _compRow('Graduation ${i + 1}', aText, bText);
    });
  }

  Widget _buildPoliciesComparison() {
    return Card(
      child: Padding(
        padding: const EdgeInsets.all(16),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            const Text('Policies',
                style: TextStyle(fontSize: 16, fontWeight: FontWeight.bold)),
            const SizedBox(height: 12),
            _compRow(
              'Repeat Method',
              _uniA!.repeatPolicy.method.name,
              _uniB!.repeatPolicy.method.name,
            ),
            _compRow(
              'Probation CGPA',
              _uniA!.probation.minCGPA.toStringAsFixed(2),
              _uniB!.probation.minCGPA.toStringAsFixed(2),
            ),
          ],
        ),
      ),
    );
  }

  Widget _buildValidationComparison() {
    final validA = validateUniversityConfig(_uniA!);
    final validB = validateUniversityConfig(_uniB!);

    return Card(
      child: Padding(
        padding: const EdgeInsets.all(16),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            const Text('Config Validation',
                style: TextStyle(fontSize: 16, fontWeight: FontWeight.bold)),
            const SizedBox(height: 12),
            Row(
              children: [
                Expanded(
                  child: _validationChip(_uniA!.shortName, validA.valid,
                      validA.warnings.length),
                ),
                const SizedBox(width: 8),
                Expanded(
                  child: _validationChip(_uniB!.shortName, validB.valid,
                      validB.warnings.length),
                ),
              ],
            ),
          ],
        ),
      ),
    );
  }

  Widget _validationChip(String name, bool valid, int warningCount) {
    return Container(
      padding: const EdgeInsets.all(12),
      decoration: BoxDecoration(
        color: valid ? Colors.green.shade50 : Colors.orange.shade50,
        borderRadius: BorderRadius.circular(8),
        border: Border.all(
          color: valid ? Colors.green : Colors.orange,
        ),
      ),
      child: Column(
        children: [
          Icon(
            valid ? Icons.check_circle : Icons.warning,
            color: valid ? Colors.green : Colors.orange,
          ),
          const SizedBox(height: 4),
          Text(name, style: const TextStyle(fontWeight: FontWeight.bold)),
          Text(
            valid ? 'Valid' : '$warningCount warnings',
            style: TextStyle(
                fontSize: 12,
                color: valid ? Colors.green : Colors.orange),
          ),
        ],
      ),
    );
  }

  Widget _compRow(String label, String valueA, String valueB) {
    final isSame = valueA == valueB;
    return Padding(
      padding: const EdgeInsets.symmetric(vertical: 4),
      child: Row(
        children: [
          SizedBox(
            width: 100,
            child: Text(label,
                style: const TextStyle(fontSize: 12, color: Colors.grey)),
          ),
          Expanded(
            child: Text(
              valueA,
              style: TextStyle(
                fontSize: 12,
                fontWeight: FontWeight.w600,
                color: isSame ? null : Colors.blue,
              ),
            ),
          ),
          Expanded(
            child: Text(
              valueB,
              style: TextStyle(
                fontSize: 12,
                fontWeight: FontWeight.w600,
                color: isSame ? null : Colors.orange,
              ),
            ),
          ),
        ],
      ),
    );
  }
}
