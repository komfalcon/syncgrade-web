import '../../models/university_config.dart';
import 'abu.dart';
import 'covenant.dart';
import 'funaab.dart';
import 'futminna.dart';
import 'oau.dart';
import 'ui.dart';
import 'uniben.dart';
import 'unn.dart';

export 'abu.dart';
export 'covenant.dart';
export 'funaab.dart';
export 'futminna.dart';
export 'oau.dart';
export 'ui.dart';
export 'uniben.dart';
export 'unn.dart';

/// All Nigerian university configurations
final List<UniversityConfig> nigerianUniversities = [
  abuConfig,
  covenantConfig,
  funaabConfig,
  futminnaConfig,
  oauConfig,
  uiConfig,
  unibenConfig,
  unnConfig,
];

/// Retrieve a university configuration by its unique id
UniversityConfig? getUniversityById(String id) {
  try {
    return nigerianUniversities.firstWhere((u) => u.id == id);
  } catch (_) {
    return null;
  }
}

/// Return every registered university configuration
List<UniversityConfig> getAllUniversities() => nigerianUniversities;
