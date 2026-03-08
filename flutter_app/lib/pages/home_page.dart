import 'package:flutter/material.dart';

import 'package:cgpa_app/universities/nigeria/nigeria.dart';
import 'package:cgpa_app/models/university_config.dart';

class HomePage extends StatefulWidget {
  const HomePage({super.key});

  @override
  State<HomePage> createState() => _HomePageState();
}

class _HomePageState extends State<HomePage> {
  late List<UniversityConfig> _universities;
  UniversityConfig? _selectedUniversity;

  @override
  void initState() {
    super.initState();
    _universities = getAllUniversities();
    if (_universities.isNotEmpty) {
      _selectedUniversity = _universities.first;
    }
  }

  static const _features = <_FeatureItem>[
    _FeatureItem(
      icon: Icons.school,
      title: 'GPA Calculator',
      description: 'Calculate semester GPA and predict degree class',
      route: '/gpa-calculator',
      color: Colors.teal,
    ),
    _FeatureItem(
      icon: Icons.track_changes,
      title: 'Graduation Tracker',
      description: 'Track credits towards graduation requirements',
      route: '/graduation-tracker',
      color: Colors.blue,
    ),
    _FeatureItem(
      icon: Icons.science,
      title: 'What-If Simulator',
      description: 'Simulate hypothetical semester outcomes',
      route: '/what-if',
      color: Colors.purple,
    ),
    _FeatureItem(
      icon: Icons.replay,
      title: 'Carryover Impact',
      description: 'Analyze impact of retaking failed courses',
      route: '/carryover',
      color: Colors.orange,
    ),
    _FeatureItem(
      icon: Icons.warning_amber,
      title: 'Degree Risk Warning',
      description: 'Assess risk of dropping degree classification',
      route: '/degree-risk',
      color: Colors.red,
    ),
    _FeatureItem(
      icon: Icons.swap_vert,
      title: 'Best/Worst Case',
      description: 'Project best and worst case CGPA outcomes',
      route: '/best-worst',
      color: Colors.indigo,
    ),
    _FeatureItem(
      icon: Icons.analytics,
      title: 'Performance Analytics',
      description: 'Analyze academic performance trends',
      route: '/analytics',
      color: Colors.green,
    ),
    _FeatureItem(
      icon: Icons.tune,
      title: 'Study Load Optimizer',
      description: 'Get optimal credit load recommendations',
      route: '/study-load',
      color: Colors.amber,
    ),
    _FeatureItem(
      icon: Icons.compare_arrows,
      title: 'University Comparison',
      description: 'Compare university grading systems',
      route: '/university-comparison',
      color: Colors.cyan,
    ),
    _FeatureItem(
      icon: Icons.backup,
      title: 'Backup & Restore',
      description: 'Export and import academic data',
      route: '/backup-restore',
      color: Colors.brown,
    ),
    _FeatureItem(
      icon: Icons.description,
      title: 'Academic Reports',
      description: 'Generate printable academic reports',
      route: '/reports',
      color: Colors.deepPurple,
    ),
    _FeatureItem(
      icon: Icons.timeline,
      title: 'Performance Timeline',
      description: 'Semester-by-semester performance view',
      route: '/timeline',
      color: Colors.pink,
    ),
  ];

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(
        title: const Text('CGPA--'),
        centerTitle: true,
      ),
      body: Column(
        children: [
          _buildUniversitySelector(),
          Expanded(child: _buildFeatureGrid()),
        ],
      ),
    );
  }

  Widget _buildUniversitySelector() {
    return Container(
      width: double.infinity,
      padding: const EdgeInsets.all(16),
      decoration: BoxDecoration(
        color: Colors.teal.shade50,
        border: Border(
          bottom: BorderSide(color: Colors.teal.shade100),
        ),
      ),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Text(
            'Select University',
            style: TextStyle(
              fontSize: 14,
              fontWeight: FontWeight.w600,
              color: Colors.teal.shade700,
            ),
          ),
          const SizedBox(height: 8),
          DropdownButtonFormField<String>(
            value: _selectedUniversity?.id,
            decoration: InputDecoration(
              prefixIcon: const Icon(Icons.account_balance),
              border: OutlineInputBorder(
                borderRadius: BorderRadius.circular(8),
              ),
              contentPadding:
                  const EdgeInsets.symmetric(horizontal: 12, vertical: 8),
            ),
            items: _universities
                .map((u) => DropdownMenuItem(
                      value: u.id,
                      child: Text('${u.shortName} — ${u.name}'),
                    ))
                .toList(),
            onChanged: (id) {
              if (id != null) {
                setState(() {
                  _selectedUniversity = getUniversityById(id);
                });
              }
            },
          ),
        ],
      ),
    );
  }

  Widget _buildFeatureGrid() {
    return Padding(
      padding: const EdgeInsets.all(12),
      child: GridView.builder(
        gridDelegate: const SliverGridDelegateWithFixedCrossAxisCount(
          crossAxisCount: 2,
          mainAxisSpacing: 12,
          crossAxisSpacing: 12,
          childAspectRatio: 1.1,
        ),
        itemCount: _features.length,
        itemBuilder: (context, index) {
          final feature = _features[index];
          return _buildFeatureCard(feature);
        },
      ),
    );
  }

  Widget _buildFeatureCard(_FeatureItem feature) {
    return Card(
      clipBehavior: Clip.antiAlias,
      child: InkWell(
        onTap: () {
          Navigator.pushNamed(
            context,
            feature.route,
            arguments: _selectedUniversity,
          );
        },
        child: Padding(
          padding: const EdgeInsets.all(12),
          child: Column(
            mainAxisAlignment: MainAxisAlignment.center,
            children: [
              CircleAvatar(
                radius: 24,
                backgroundColor: feature.color.withAlpha(30),
                child: Icon(feature.icon, color: feature.color, size: 28),
              ),
              const SizedBox(height: 10),
              Text(
                feature.title,
                textAlign: TextAlign.center,
                style: const TextStyle(
                  fontSize: 14,
                  fontWeight: FontWeight.bold,
                ),
              ),
              const SizedBox(height: 4),
              Text(
                feature.description,
                textAlign: TextAlign.center,
                style: TextStyle(
                  fontSize: 11,
                  color: Colors.grey.shade600,
                ),
                maxLines: 2,
                overflow: TextOverflow.ellipsis,
              ),
            ],
          ),
        ),
      ),
    );
  }
}

class _FeatureItem {
  final IconData icon;
  final String title;
  final String description;
  final String route;
  final MaterialColor color;

  const _FeatureItem({
    required this.icon,
    required this.title,
    required this.description,
    required this.route,
    required this.color,
  });
}
