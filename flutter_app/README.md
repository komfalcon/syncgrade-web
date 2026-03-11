# CGPA-- Flutter App

Offline academic CGPA calculator platform with a deterministic engine for GPA/CGPA calculations, what-if simulations, carryover analysis, degree risk assessment, and more.

## Project Structure

```
flutter_app/
├── android/                  # Android platform (Gradle build)
│   ├── app/build.gradle      # App-level Gradle config (compileSdk 34, minSdk 21)
│   ├── build.gradle           # Project-level Gradle config (AGP 8.1.4, Kotlin 1.9.22)
│   ├── settings.gradle        # Plugin management and repositories
│   ├── gradle.properties      # JVM args and AndroidX settings
│   ├── gradlew / gradlew.bat  # Gradle wrapper scripts
│   └── gradle/wrapper/
│       └── gradle-wrapper.properties  # Gradle 8.3 distribution URL
├── ios/                       # iOS platform (minimal scaffold)
│   └── Runner/Info.plist
├── web/                       # Web platform
│   ├── index.html             # Flutter web entry point
│   └── manifest.json          # PWA manifest
├── lib/
│   ├── main.dart              # App entry point
│   ├── engine/                # Pure Dart calculation engine (13 functions)
│   ├── models/                # Data models with JSON serialization
│   ├── pages/                 # Flutter UI pages (13 pages)
│   ├── universities/          # University configurations (Nigeria)
│   └── utils/                 # CSV/JSON backup utilities
├── test/                      # Dart test suite
│   └── engine/calculations_test.dart
├── assets/                    # Static assets directory
├── pubspec.yaml               # Flutter/Dart dependencies
└── analysis_options.yaml      # Lint rules
```

## Prerequisites

| Tool | Required Version | Check Command |
|------|-----------------|---------------|
| Flutter SDK | ≥ 3.10.0 | `flutter --version` |
| Dart SDK | ≥ 3.0.0 | `dart --version` |
| Java JDK | 17 (recommended) | `java -version` |
| Android SDK | API 34 | `sdkmanager --list` |
| Android Build Tools | 34.0.0 | (included in SDK) |
| Gradle | 8.3 (via wrapper) | `./android/gradlew --version` |

## Quick Start

### 1. Install Flutter SDK

```bash
# Follow https://docs.flutter.dev/get-started/install
# Verify installation:
flutter doctor -v
```

### 2. Run Engine Tests (No Flutter SDK Required)

The calculation engine is pure Dart and can be tested without the Flutter SDK:

```bash
cd flutter_app
dart pub get
dart test
```

### 3. Build Android APK

```bash
cd flutter_app

# Ensure Flutter dependencies are resolved
flutter pub get

# Clean previous builds
flutter clean

# Build release APK
flutter build apk --release
```

The APK will be at: `build/app/outputs/flutter-apk/app-release.apk`

### 4. Build Flutter Web

```bash
cd flutter_app
flutter pub get
flutter build web --release
```

The web build output will be at: `build/web/`

### 5. Run in Development

```bash
cd flutter_app

# Mobile (requires connected device/emulator)
flutter run

# Web (opens in browser)
flutter run -d chrome

# Web on specific port
flutter run -d web-server --web-port=8080
```

## Build Diagnostics & Troubleshooting

### Issue: `java.net.SocketException` During Gradle Wrapper Download

**Root Cause:** Network/SSL issues preventing Gradle from downloading its distribution zip.

**Fixes (try in order):**

```bash
# 1. Verify network connectivity to Gradle servers
curl -I https://services.gradle.org/distributions/gradle-8.3-all.zip

# 2. Check/set JAVA_HOME (must point to JDK 17)
echo $JAVA_HOME
export JAVA_HOME=/usr/lib/jvm/temurin-17-jdk-amd64  # Linux
# export JAVA_HOME=$(/usr/libexec/java_home -v 17)   # macOS

# 3. Verify gradlew has execute permissions
chmod +x flutter_app/android/gradlew

# 4. Clear Gradle cache and re-download
rm -rf ~/.gradle/wrapper/dists/gradle-8.3-all/
cd flutter_app/android && ./gradlew --version

# 5. If behind a proxy, configure Gradle proxy settings
# Add to flutter_app/android/gradle.properties:
#   systemProp.http.proxyHost=your-proxy.example.com
#   systemProp.http.proxyPort=8080
#   systemProp.https.proxyHost=your-proxy.example.com
#   systemProp.https.proxyPort=8080

# 6. If SSL certificate issues, import certs or use HTTP (not recommended)
# Edit gradle-wrapper.properties to use http:// instead of https:// as a last resort

# 7. Manual Gradle download (if automated download fails)
wget https://services.gradle.org/distributions/gradle-8.3-all.zip
mkdir -p ~/.gradle/wrapper/dists/gradle-8.3-all/
# Extract to the appropriate directory
```

### Issue: Flutter Web Build Failures

**Common causes and fixes:**

```bash
# 1. Ensure Flutter web is enabled
flutter config --enable-web

# 2. Check for web-incompatible dependencies
# Packages like path_provider, file_picker need web implementations
# Check pubspec.yaml for web-compatible alternatives

# 3. Clean and rebuild
flutter clean
flutter pub get
flutter build web --release --verbose

# 4. If dart2js compilation errors, check for dart:io imports in web code
# dart:io is not available on web - use conditional imports
```

### Issue: Missing Android SDK Components

```bash
# 1. Install required SDK components
sdkmanager "platforms;android-34" "build-tools;34.0.0"

# 2. Accept all licenses
flutter doctor --android-licenses

# 3. Verify Android SDK setup
flutter doctor -v
```

### Issue: Dependency Conflicts

```bash
# 1. Check for outdated packages
flutter pub outdated

# 2. Upgrade dependencies
flutter pub upgrade

# 3. If conflicts persist, try resolving manually
flutter pub get --verbose
```

### General Recovery Steps

```bash
cd flutter_app

# Full clean rebuild sequence:
flutter clean
flutter pub cache repair
flutter pub get
flutter build apk --release --verbose 2>&1 | tee build.log
```

## Backend / Server Integration

This repository includes a **Node.js Express server** in the `server/` directory:

- **Location:** `server/index.ts`
- **Purpose:** Serves the React web app (`client/`) in production
- **Build:** `npm run build` (from repo root)
- **Start:** `npm run start` (from repo root)

The Flutter app is **fully offline** and does **not** require the backend server to build or run. The server is only needed for the React/TypeScript web version of the app.

## Version Compatibility Matrix

| Flutter SDK | Gradle | AGP | Kotlin | Java | Android API |
|------------|--------|-----|--------|------|-------------|
| 3.10.x – 3.24.x | 8.3 | 8.1.4 | 1.9.22 | 17 | 34 |

## CI/CD

GitHub Actions workflows are configured in `.github/workflows/flutter.yml`:

1. **Dart Engine Tests** — Runs pure Dart tests without Flutter SDK
2. **Build Android APK** — Builds release APK with Flutter + Java 17
3. **Build Flutter Web** — Builds web release

Workflows trigger on pushes/PRs to `main` that modify files in `flutter_app/`.

## Architecture Notes

- The **calculation engine** (`lib/engine/calculations.dart`) is pure Dart with 13 functions — no Flutter SDK dependency
- The engine is **shared** with the React/TypeScript version at `client/src/engine/calculations.ts`
- **University configs** are pluggable — add a new file in `lib/universities/nigeria/` per university
- All models support **JSON serialization** for backup/restore
- **RepeatPolicy** supports 4 methods: `replace`, `average`, `both`, `highest`
