import 'dart:convert';

/// Generate CSV content from semester data.
///
/// The output includes one header row and one data row per course, grouped by
/// semester. A summary row with the overall CGPA is appended at the end.
String generateCSV(
  List<SemesterCSVData> semesters,
  double cgpa,
) {
  final rows = <String>[];
  rows.add('Semester,Course,Credits,Grade,Grade Point');

  for (final sem in semesters) {
    for (final course in sem.courses) {
      rows.add([
        _csvEscape(sem.name),
        _csvEscape(course.name),
        course.credits.toString(),
        _csvEscape(course.grade),
        course.gradePoint.toString(),
      ].join(','));
    }
  }

  rows.add('');
  rows.add('Overall CGPA,$cgpa');

  return rows.join('\n');
}

/// Escape a CSV field value by wrapping in quotes when it contains special characters.
String _csvEscape(String value) {
  if (value.contains(',') || value.contains('"') || value.contains('\n')) {
    return '"${value.replaceAll('"', '""')}"';
  }
  return value;
}

/// Encode app data as a JSON string for backup.
String exportBackupJson(Map<String, dynamic> data) {
  return const JsonEncoder.withIndent('  ').convert(data);
}

/// Parse a JSON backup string. Returns null if the content is not valid JSON.
Map<String, dynamic>? parseBackupJson(String content) {
  if (content.trim().isEmpty) return null;
  try {
    final parsed = jsonDecode(content);
    if (parsed is Map<String, dynamic>) {
      return parsed;
    }
    return null;
  } catch (_) {
    return null;
  }
}

/// Data model for CSV export
class SemesterCSVData {
  final String name;
  final List<CourseCSVData> courses;

  const SemesterCSVData({required this.name, required this.courses});
}

class CourseCSVData {
  final String name;
  final int credits;
  final String grade;
  final double gradePoint;

  const CourseCSVData({
    required this.name,
    required this.credits,
    required this.grade,
    required this.gradePoint,
  });
}
