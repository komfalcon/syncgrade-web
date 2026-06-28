import { useState, useRef, useEffect, useMemo } from "react";
import { useLocation } from "wouter";
import { motion } from "framer-motion";
import {
  Database,
  MessageSquare,
  Moon,
  Sun,
  Trash2,
  User,
  Cloud,
  Lock,
  RefreshCw,
  LogOut,
  Mail,
  BookOpen,
  School,
  Upload,
  Download,
  FileJson,
  FileSpreadsheet,
  AlertCircle,
  Key,
  Check,
} from "lucide-react";
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import FeedbackForm from "@/components/FeedbackForm";
import UniversitySelector from "@/components/UniversitySelector";
import { useCGPA, getDefaultSettings, type AppSettings } from "@/hooks/useCGPA";
import { useTheme } from "@/contexts/ThemeContext";
import { toast } from "sonner";
import {
  signInWithPopup,
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  signOut,
  onAuthStateChanged,
} from "firebase/auth";
import { doc, setDoc } from "firebase/firestore";
import { auth, googleProvider, db, isConfigured } from "@/lib/firebase";
import { migrateD1DataToFirebaseUser, syncAcademicSnapshot, restoreUserProfile } from "@/lib/cloudSync";
import { exportBackup, parseBackupFile, generateCSV } from "@/engine/backup";
import {
  getStoredValue,
  setOnboardingComplete,
  setStoredValue,
  STORAGE_KEYS,
  getSyncgradeUserProfile,
  saveSyncgradeUserProfile,
  appDb,
} from "@/storage/db";

const staggerContainer = {
  hidden: {},
  show: { transition: { staggerChildren: 0.08 } },
};

const fadeUpItem = {
  hidden: { opacity: 0, y: 20 },
  show: { opacity: 1, y: 0, transition: { type: "spring" as const, stiffness: 200, damping: 24 } },
};

export default function More() {
  const { semesters, currentCGPA, totalCredits, settings, updateSettings, clearAllData } = useCGPA();
  const { theme, toggleTheme } = useTheme();
  const isDark = theme === "dark";

  // Profile Form State
  const [studentName, setStudentName] = useState(settings.studentName || "");
  const [programme, setProgramme] = useState(settings.programme || "");
  const [profileSaving, setProfileSaving] = useState(false);

  // Auth & Cloud Sync State
  const [currentUser, setCurrentUser] = useState<any | null>(null);
  const [authLoading, setAuthLoading] = useState(true);
  const [authMode, setAuthMode] = useState<"signin" | "signup">("signin");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [syncBusy, setSyncBusy] = useState<"auth" | "sync" | null>(null);
  const [lastSyncTime, setLastSyncTime] = useState<string | null>(null);

  // Backup/Restore State
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [importPreview, setImportPreview] = useState<{
    semesters: number;
    courses: number;
    cgpa: number;
  } | null>(null);

  // Sync profile details when hooks update
  useEffect(() => {
    if (settings.studentName) setStudentName(settings.studentName);
    if (settings.programme) setProgramme(settings.programme);
  }, [settings.studentName, settings.programme]);

  // Firebase auth observer and cloud profile sync
  useEffect(() => {
    if (!isConfigured) {
      setAuthLoading(false);
      return;
    }
    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      setCurrentUser(user);
      setAuthLoading(false);

      if (user) {
        // Run background migration from local tables
        await migrateD1DataToFirebaseUser(user);

        // Fetch user profile from Firestore
        const cloudProfile = await restoreUserProfile(user.uid);
        if (cloudProfile) {
          await saveSyncgradeUserProfile({
            uuid: cloudProfile.uuid || user.uid,
            name: cloudProfile.name || "",
            department: cloudProfile.department || "",
            university: cloudProfile.university || "",
          });

          // Pre-fill local settings from cloud if local is empty
          const localData = await getStoredValue(STORAGE_KEYS.cgpaData);
          const hasLocalSemesters = localData ? (JSON.parse(localData).semesters?.length > 0) : false;
          
          if (!hasLocalSemesters && cloudProfile.academic_data) {
            await setStoredValue(STORAGE_KEYS.cgpaData, JSON.stringify(cloudProfile.academic_data));
            if (cloudProfile.academic_data.settings) {
              await setStoredValue(STORAGE_KEYS.settings, JSON.stringify(cloudProfile.academic_data.settings));
              updateSettings(cloudProfile.academic_data.settings);
            }
            await setOnboardingComplete(true);
            toast.success("Retrieved and restored your cloud academic snapshot!");
            setTimeout(() => window.location.reload(), 500);
          }
        } else {
          // If profile is missing from cloud but exists locally, initialize it on Firebase
          if (settings.studentName && settings.programme && settings.activeUniversity) {
            const userDocRef = doc(db, "students", user.uid);
            const rawData = await getStoredValue(STORAGE_KEYS.cgpaData);
            const parsed = rawData ? JSON.parse(rawData) : {};
            await setDoc(
              userDocRef,
              {
                uuid: user.uid,
                name: settings.studentName,
                department: settings.programme,
                university: settings.activeUniversity,
                last_sync: new Date().toISOString(),
                academic_data: parsed,
              },
              { merge: true }
            );

            await saveSyncgradeUserProfile({
              uuid: user.uid,
              name: settings.studentName,
              department: settings.programme,
              university: settings.activeUniversity,
            });
          }
        }

        const lastSync = await getStoredValue("syncgrade_last_sync_time");
        setLastSyncTime(lastSync);
      } else {
        setLastSyncTime(null);
      }
    });

    return unsubscribe;
  }, [settings, updateSettings]);

  // Profile Save Action
  const handleSaveProfile = async () => {
    if (!studentName.trim() || !programme.trim()) {
      toast.error("Please enter both your full name and programme.");
      return;
    }
    setProfileSaving(true);
    try {
      updateSettings({
        studentName: studentName.trim(),
        programme: programme.trim(),
      });

      if (currentUser) {
        await saveSyncgradeUserProfile({
          uuid: currentUser.uid,
          name: studentName.trim(),
          department: programme.trim(),
          university: settings.activeUniversity || "",
        });
        
        // Push update directly to cloud
        const userDocRef = doc(db, "students", currentUser.uid);
        await setDoc(
          userDocRef,
          {
            name: studentName.trim(),
            department: programme.trim(),
            university: settings.activeUniversity || "",
            last_sync: new Date().toISOString(),
          },
          { merge: true }
        );
      }
      toast.success("Academic profile updated successfully!");
    } catch (e: any) {
      toast.error(e.message || "Failed to update profile.");
    } finally {
      setProfileSaving(false);
    }
  };

  // Google Sign In
  const handleGoogleSignIn = async () => {
    setSyncBusy("auth");
    try {
      const cred = await signInWithPopup(auth, googleProvider);
      toast.success(`Welcome, ${cred.user.displayName || cred.user.email}!`);
    } catch (e: any) {
      toast.error("Google login failed or cancelled.");
    } finally {
      setSyncBusy(null);
    }
  };

  // Email Sign In
  const handleEmailSignIn = async () => {
    if (!email.trim() || !password.trim()) {
      toast.error("Please enter email and password.");
      return;
    }
    setSyncBusy("auth");
    try {
      await signInWithEmailAndPassword(auth, email.trim(), password);
      toast.success("Signed in successfully!");
    } catch (e: any) {
      toast.error("Invalid email or password.");
    } finally {
      setSyncBusy(null);
    }
  };

  // Email Sign Up
  const handleEmailSignUp = async () => {
    if (!email.trim() || !password.trim()) {
      toast.error("Please enter email and password.");
      return;
    }
    if (password.length < 6) {
      toast.error("Password must be at least 6 characters.");
      return;
    }

    setSyncBusy("auth");
    try {
      const cred = await createUserWithEmailAndPassword(auth, email.trim(), password);
      const userDocRef = doc(db, "students", cred.user.uid);
      const rawData = await getStoredValue(STORAGE_KEYS.cgpaData);
      const parsed = rawData ? JSON.parse(rawData) : {};

      // Auto link local settings profile
      const currentName = settings.studentName || "";
      const currentProg = settings.programme || "";
      const currentUni = settings.activeUniversity || "";

      await setDoc(userDocRef, {
        uuid: cred.user.uid,
        name: currentName,
        department: currentProg,
        university: currentUni,
        last_sync: new Date().toISOString(),
        academic_data: parsed,
      });

      await saveSyncgradeUserProfile({
        uuid: cred.user.uid,
        name: currentName,
        department: currentProg,
        university: currentUni,
      });

      toast.success("Account created and cloud sync activated!");
    } catch (e: any) {
      if (e.code === "auth/email-already-in-use") {
        toast.error("An account with this email already exists. Try signing in.");
      } else {
        toast.error(e.message || "Failed to create account.");
      }
    } finally {
      setSyncBusy(null);
    }
  };

  // Sign Out
  const handleSignOut = async () => {
    if (
      !confirm(
        "Are you sure you want to sign out? Your backup will remain safe in the cloud, but sync updates will stop on this device."
      )
    )
      return;
    setSyncBusy("auth");
    try {
      await signOut(auth);
      await appDb.kv.delete("syncgrade_jwt_token");
      await appDb.kv.delete("syncgrade_last_sync_time");
      toast.success("Signed out successfully.");
    } catch {
      toast.error("Sign out failed.");
    } finally {
      setSyncBusy(null);
    }
  };

  // Manual Sync Action
  const handleManualSync = async () => {
    setSyncBusy("sync");
    try {
      const result = await syncAcademicSnapshot(true);
      if (result.success) {
        toast.success("Cloud sync completed!");
        const lastSync = await getStoredValue("syncgrade_last_sync_time");
        setLastSyncTime(lastSync);
      } else if (result.code === "OVERWRITE_PREVENTED") {
        if (confirm("Warning: Cloud backup contains more semesters. Overwrite cloud data anyway?")) {
          const forceResult = await syncAcademicSnapshot(true);
          if (forceResult.success) {
            toast.success("Forced sync completed successfully!");
            const lastSync = await getStoredValue("syncgrade_last_sync_time");
            setLastSyncTime(lastSync);
          } else {
            toast.error(forceResult.error || "Forced sync failed.");
          }
        }
      } else {
        toast.error(result.error || "Sync failed.");
      }
    } catch {
      toast.error("Cloud synchronization error occurred.");
    } finally {
      setSyncBusy(null);
    }
  };

  // Backup Export JSON
  const handleExportJSON = () => {
    const data = { semesters, currentCGPA, totalCredits, settings };
    exportBackup(data);
    toast.success("Backup exported as JSON file!");
  };

  // Backup Export CSV
  const handleExportCSV = () => {
    const gradeRanges = settings.gradeRanges ?? getDefaultSettings().gradeRanges;
    const csvSemesters = semesters.map((sem) => ({
      name: sem.name,
      courses: sem.courses.map((c) => {
        const match = gradeRanges.find((r) => r.points === c.gradePoint);
        return {
          name: c.name,
          credits: c.credits,
          grade: match?.grade ?? String(c.gradePoint),
          gradePoint: c.gradePoint,
        };
      }),
    }));
    const csv = generateCSV(csvSemesters, currentCGPA);
    const blob = new Blob([csv], { type: "text/csv" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `cgpa-export-${new Date().toISOString().slice(0, 10)}.csv`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
    toast.success("CSV Spreadsheet exported successfully!");
  };

  // Backup File Picker Select
  const handleFileSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0] ?? null;
    setSelectedFile(file);
    setImportPreview(null);

    if (file) {
      const parsed = await parseBackupFile(file);
      if (parsed && typeof parsed === "object") {
        const p = parsed as Record<string, unknown>;
        const sems = Array.isArray(p.semesters) ? p.semesters : [];
        const courses = sems.reduce(
          (sum: number, s: Record<string, unknown>) =>
            sum + (Array.isArray(s.courses) ? s.courses.length : 0),
          0
        );
        setImportPreview({
          semesters: sems.length,
          courses,
          cgpa: typeof p.currentCGPA === "number" ? p.currentCGPA : 0,
        });
      } else {
        toast.error("Could not read backup file. Ensure it is a valid JSON export.");
        setSelectedFile(null);
      }
    }
  };

  // Backup Import Action
  const handleImport = async () => {
    if (!selectedFile) {
      toast.error("Please select a backup file first.");
      return;
    }

    const parsed = await parseBackupFile(selectedFile);
    if (!parsed) {
      toast.error("Invalid backup file format.");
      return;
    }

    const backup = parsed as Record<string, unknown>;
    const importedSettings =
      typeof backup.settings === "object" && backup.settings !== null && !Array.isArray(backup.settings)
        ? (backup.settings as Partial<AppSettings>)
        : {};
    const defaultSettings = getDefaultSettings();
    const mergedSettings: AppSettings = {
      ...defaultSettings,
      ...importedSettings,
      studentName:
        typeof importedSettings.studentName === "string" ? importedSettings.studentName : defaultSettings.studentName,
      programme: typeof importedSettings.programme === "string" ? importedSettings.programme : defaultSettings.programme,
      gradeRanges: Array.isArray(importedSettings.gradeRanges)
        ? importedSettings.gradeRanges
        : defaultSettings.gradeRanges,
      activeUniversity:
        typeof importedSettings.activeUniversity === "string" || importedSettings.activeUniversity === null
          ? importedSettings.activeUniversity
          : defaultSettings.activeUniversity,
      admissionSession:
        typeof importedSettings.admissionSession === "string"
          ? importedSettings.admissionSession
          : defaultSettings.admissionSession,
      gpaScale: typeof importedSettings.gpaScale === "number" ? importedSettings.gpaScale : defaultSettings.gpaScale,
      repeatPolicy:
        importedSettings.repeatPolicy === "replace" ||
        importedSettings.repeatPolicy === "average" ||
        importedSettings.repeatPolicy === "both" ||
        importedSettings.repeatPolicy === "highest"
          ? importedSettings.repeatPolicy
          : defaultSettings.repeatPolicy,
    };
    const restoredSemesters = Array.isArray(backup.semesters) ? backup.semesters : [];
    const restoredData = {
      semesters: restoredSemesters,
      currentCGPA: typeof backup.currentCGPA === "number" ? backup.currentCGPA : 0,
      totalCredits: typeof backup.totalCredits === "number" ? backup.totalCredits : 0,
      totalGradePoints: typeof backup.totalGradePoints === "number" ? backup.totalGradePoints : 0,
      semesterGPAs:
        backup.semesterGPAs && typeof backup.semesterGPAs === "object" && !Array.isArray(backup.semesterGPAs)
          ? backup.semesterGPAs
          : {},
      settings: {
        ...mergedSettings,
        startingLevel: 100,
      },
    };

    try {
      await setStoredValue(STORAGE_KEYS.cgpaData, JSON.stringify(restoredData));
      await setStoredValue(STORAGE_KEYS.settings, JSON.stringify(mergedSettings));
      await setOnboardingComplete(true);

      toast.success("Backup restored successfully! Reloading...");
      setTimeout(() => window.location.reload(), 500);
    } catch {
      toast.error("Failed to restore data locally.");
    }
  };

  const handleClearData = async () => {
    if (
      !confirm(
        "Warning: This will permanently delete all semesters, courses, custom institutions, and local profile details from this device. Proceed?"
      )
    )
      return;
    await clearAllData();
  };

  return (
    <motion.div variants={staggerContainer} initial="hidden" animate="show" className="space-y-8 pb-20 md:pb-6">
      <motion.header variants={fadeUpItem} className="space-y-1.5 border-b border-border pb-4">
        <h1 className="text-2xl font-bold tracking-tight text-foreground md:text-3xl">Profile &amp; Settings</h1>
        <p className="text-sm text-foreground-muted">Manage sync credentials, institution rules, backups, and preferences.</p>
      </motion.header>

      <div className="grid gap-6 md:grid-cols-2">
        {/* Left Column */}
        <div className="space-y-6">
          {/* Card 1: Academic Profile Card */}
          <motion.div variants={fadeUpItem}>
            <Card className="rounded-2xl border border-border bg-surface p-5 shadow-card transition-shadow hover:shadow-elevated">
              <CardHeader className="p-0 pb-4">
                <CardTitle className="flex items-center gap-2 text-base font-semibold text-foreground">
                  <User className="h-5 w-5 text-primary" />
                  Academic Profile
                </CardTitle>
                <CardDescription className="text-xs text-foreground-muted">
                  Update your identity details to calibrate CGPA grading and reports.
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4 p-0">
                <div className="space-y-1.5">
                  <Label htmlFor="profile-student-name">Student Full Name</Label>
                  <Input
                    id="profile-student-name"
                    value={studentName}
                    onChange={(event) => setStudentName(event.target.value)}
                    placeholder="e.g. Jane Doe"
                    autoComplete="name"
                    className="h-11 rounded-lg"
                  />
                </div>

                <div className="space-y-1.5">
                  <Label htmlFor="profile-programme">Programme / Course of study</Label>
                  <Input
                    id="profile-programme"
                    value={programme}
                    onChange={(event) => setProgramme(event.target.value)}
                    placeholder="e.g. Computer Science"
                    autoComplete="organization-title"
                    className="h-11 rounded-lg"
                  />
                </div>

                <div className="pt-1">
                  <UniversitySelector label="Institution / University Profile" />
                </div>

                <Button
                  onClick={handleSaveProfile}
                  disabled={profileSaving}
                  className="w-full h-10 mt-2 bg-gradient-to-r from-primary to-primary-hover text-primary-foreground font-semibold"
                >
                  {profileSaving ? "Saving..." : "Save Profile"}
                </Button>
              </CardContent>
            </Card>
          </motion.div>

          {/* Card 2: Cloud Sync Settings */}
          <motion.div variants={fadeUpItem}>
            <Card className="rounded-2xl border border-border bg-surface p-5 shadow-card transition-shadow hover:shadow-elevated">
              <CardHeader className="p-0 pb-4">
                <CardTitle className="flex items-center gap-2 text-base font-semibold text-foreground">
                  <Cloud className="h-5 w-5 text-primary" />
                  Cloud Synchronization
                </CardTitle>
                <CardDescription className="text-xs text-foreground-muted">
                  Sync your GPAs across multiple devices securely.
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4 p-0">
                {!isConfigured ? (
                  <div className="rounded-xl border border-warning/30 bg-warning/5 p-4 text-xs text-warning leading-relaxed flex items-start gap-2.5">
                    <AlertCircle className="h-4 w-4 shrink-0 mt-0.5" />
                    <div>
                      <p className="font-semibold">Firebase Credentials Missing</p>
                      <p className="mt-1 opacity-90">
                        To activate, setup Firebase environment keys in your local <code>.env</code> file. Check
                        the example file in source code.
                      </p>
                    </div>
                  </div>
                ) : authLoading ? (
                  <div className="flex h-24 items-center justify-center">
                    <RefreshCw className="h-6 w-6 animate-spin text-primary" />
                  </div>
                ) : currentUser ? (
                  // Signed In View
                  <div className="space-y-4">
                    <div className="rounded-xl border border-success/30 bg-success/5 p-4 space-y-3">
                      <div className="flex items-start justify-between">
                        <div>
                          <p className="text-xs font-semibold text-success flex items-center gap-1.5">
                            <span className="inline-block h-2 w-2 rounded-full bg-success animate-pulse" />
                            Auto Sync Active
                          </p>
                          <p className="text-xs text-foreground-muted mt-1 truncate">
                            Account: {currentUser.email || "Google OAuth Connected"}
                          </p>
                          <p className="text-[11px] text-foreground-subtle mt-0.5">
                            {lastSyncTime ? `Last Synced: ${new Date(lastSyncTime).toLocaleString()}` : "Never Synced"}
                          </p>
                        </div>
                      </div>

                      <div className="flex gap-2 pt-2 border-t border-success/15">
                        <Button
                          size="sm"
                          onClick={handleManualSync}
                          disabled={syncBusy !== null}
                          className="flex-1 gap-1.5 h-9 text-xs"
                        >
                          <RefreshCw className={`h-3.5 w-3.5 ${syncBusy === "sync" ? "animate-spin" : ""}`} />
                          Sync Now
                        </Button>
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={handleSignOut}
                          disabled={syncBusy !== null}
                          className="flex-1 gap-1.5 h-9 text-xs border-success/35 text-success hover:bg-success/5"
                        >
                          <LogOut className="h-3.5 w-3.5" />
                          Sign Out
                        </Button>
                      </div>
                    </div>
                  </div>
                ) : (
                  // Signed Out Tabs / Form
                  <div className="space-y-4">
                    <div className="flex border-b border-border">
                      <button
                        type="button"
                        onClick={() => setAuthMode("signin")}
                        className={`flex-1 pb-2.5 text-xs font-bold text-center border-b-2 transition-all ${
                          authMode === "signin"
                            ? "border-primary text-primary"
                            : "border-transparent text-foreground-muted hover:text-foreground"
                        }`}
                      >
                        Sign In
                      </button>
                      <button
                        type="button"
                        onClick={() => setAuthMode("signup")}
                        className={`flex-1 pb-2.5 text-xs font-bold text-center border-b-2 transition-all ${
                          authMode === "signup"
                            ? "border-primary text-primary"
                            : "border-transparent text-foreground-muted hover:text-foreground"
                        }`}
                      >
                        Create Account
                      </button>
                    </div>

                    <Button
                      variant="outline"
                      type="button"
                      onClick={handleGoogleSignIn}
                      disabled={syncBusy !== null}
                      className="w-full flex items-center justify-center gap-2 h-10 border-border bg-surface text-xs hover:bg-surface-elevated"
                    >
                      <svg className="h-4 w-4" viewBox="0 0 24 24">
                        <path
                          fill="#EA4335"
                          d="M12 5.04c1.66 0 3.2.57 4.38 1.69l3.27-3.27C17.67 1.48 14.98 1 12 1 7.35 1 3.37 3.68 1.37 7.56l3.89 3.01C6.26 7.56 8.9 5.04 12 5.04z"
                        />
                        <path
                          fill="#4285F4"
                          d="M23.49 12.27c0-.81-.07-1.59-.2-2.36H12v4.51h6.43c-.28 1.44-1.09 2.67-2.3 3.48l3.58 2.78c2.1-1.94 3.78-4.78 3.78-8.41z"
                        />
                        <path
                          fill="#FBBC05"
                          d="M5.26 14.43c-.24-.72-.38-1.49-.38-2.29s.14-1.57.38-2.29L1.37 6.84C.49 8.6.01 10.56.01 12.63c0 2.07.48 4.03 1.36 5.79l3.89-2.99z"
                        />
                        <path
                          fill="#34A853"
                          d="M12 23c3.24 0 5.97-1.07 7.96-2.91l-3.58-2.78c-.99.66-2.26 1.06-4.38 1.06-3.1 0-5.74-2.52-6.74-5.53L1.37 16.84C3.37 20.32 7.35 23 12 23z"
                        />
                      </svg>
                      Continue with Google
                    </Button>

                    <div className="relative flex items-center justify-center">
                      <span className="absolute inset-x-0 border-t border-border" />
                      <span className="relative bg-surface px-3 text-[10px] text-foreground-subtle uppercase tracking-widest font-semibold">
                        or credentials
                      </span>
                    </div>

                    <form
                      onSubmit={(e) => {
                        e.preventDefault();
                        if (authMode === "signin") {
                          handleEmailSignIn();
                        } else {
                          handleEmailSignUp();
                        }
                      }}
                      className="space-y-3"
                    >
                      <div className="space-y-1">
                        <Label htmlFor="auth-email">Email Address</Label>
                        <Input
                          id="auth-email"
                          type="email"
                          placeholder="student@example.edu.ng"
                          value={email}
                          onChange={(e) => setEmail(e.target.value)}
                          className="h-10 rounded-lg"
                          autoComplete="username"
                        />
                      </div>
                      <div className="space-y-1">
                        <Label htmlFor="auth-password">Password</Label>
                        <Input
                          id="auth-password"
                          type="password"
                          placeholder="Min. 6 characters"
                          value={password}
                          onChange={(e) => setPassword(e.target.value)}
                          className="h-10 rounded-lg"
                          autoComplete={authMode === "signin" ? "current-password" : "new-password"}
                        />
                      </div>

                      <Button
                        type="submit"
                        disabled={syncBusy !== null}
                        className="w-full h-10 mt-2"
                      >
                        {syncBusy === "auth" ? (
                          <RefreshCw className="h-4 w-4 animate-spin" />
                        ) : authMode === "signin" ? (
                          "Sign In to Account"
                        ) : (
                          "Register Academic Sync"
                        )}
                      </Button>
                    </form>
                  </div>
                )}
              </CardContent>
            </Card>
          </motion.div>
        </div>

        {/* Right Column */}
        <div className="space-y-6">
          {/* Card 3: Backups & Restores */}
          <motion.div variants={fadeUpItem}>
            <Card className="rounded-2xl border border-border bg-surface p-5 shadow-card transition-shadow hover:shadow-elevated">
              <CardHeader className="p-0 pb-4">
                <CardTitle className="flex items-center gap-2 text-base font-semibold text-foreground">
                  <Database className="h-5 w-5 text-primary" />
                  Local Backups &amp; Export
                </CardTitle>
                <CardDescription className="text-xs text-foreground-muted">
                  Download spreadsheet files or backup database snapshots.
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4 p-0">
                <div className="space-y-2">
                  <p className="text-xs text-foreground-muted leading-relaxed">
                    Export your academic records. Exports include {semesters.length} semester(s), {totalCredits} credit
                    hours, and a current CGPA of {currentCGPA.toFixed(2)}.
                  </p>
                  <div className="flex gap-2">
                    <Button onClick={handleExportJSON} variant="outline" className="flex-1 gap-1.5 h-10 text-xs">
                      <FileJson className="h-3.5 w-3.5 text-primary" />
                      JSON Backup
                    </Button>
                    <Button onClick={handleExportCSV} variant="outline" className="flex-1 gap-1.5 h-10 text-xs">
                      <FileSpreadsheet className="h-3.5 w-3.5 text-primary" />
                      CSV Spreadsheet
                    </Button>
                  </div>
                </div>

                <div className="border-t border-border pt-4 space-y-3">
                  <div className="rounded-xl border border-warning/20 bg-warning/5 p-3 flex gap-2 items-start text-xs text-warning">
                    <AlertCircle className="h-4 w-4 shrink-0 mt-0.5" />
                    <span>Importing overrides local semesters. Consider downloading a backup first.</span>
                  </div>

                  <div className="space-y-1.5">
                    <Label htmlFor="settings-import-picker">Select JSON Backup File</Label>
                    <Input
                      id="settings-import-picker"
                      ref={fileInputRef}
                      type="file"
                      accept=".json"
                      onChange={handleFileSelect}
                      className="h-11 rounded-lg file:mr-2 file:py-1 file:px-2 file:rounded-md file:border-0 file:bg-surface-elevated file:text-xs"
                    />
                  </div>

                  {importPreview && (
                    <div className="rounded-xl border border-border bg-surface-elevated p-3 text-xs space-y-1">
                      <p className="font-semibold text-foreground">Import Preview:</p>
                      <div className="grid grid-cols-3 gap-2 pt-1 text-center font-semibold text-foreground-muted">
                        <div className="bg-surface py-1.5 rounded-md">
                          <p className="text-foreground text-sm font-bold">{importPreview.semesters}</p>
                          <p className="text-[10px]">Semesters</p>
                        </div>
                        <div className="bg-surface py-1.5 rounded-md">
                          <p className="text-foreground text-sm font-bold">{importPreview.courses}</p>
                          <p className="text-[10px]">Courses</p>
                        </div>
                        <div className="bg-surface py-1.5 rounded-md">
                          <p className="text-foreground text-sm font-bold">{importPreview.cgpa.toFixed(2)}</p>
                          <p className="text-[10px]">CGPA</p>
                        </div>
                      </div>
                    </div>
                  )}

                  <Button onClick={handleImport} disabled={!selectedFile} className="w-full h-10 gap-1.5">
                    <Upload className="h-4 w-4" />
                    Restore Backup
                  </Button>
                </div>
              </CardContent>
            </Card>
          </motion.div>

          {/* Card 4: Appearance & Feedback */}
          <motion.div variants={fadeUpItem} className="space-y-6">
            {/* Theme Card */}
            <Card className="rounded-2xl border border-border bg-surface p-5 shadow-card transition-shadow hover:shadow-elevated">
              <button
                type="button"
                onClick={toggleTheme}
                className="flex w-full items-center justify-between gap-3 text-left transition-colors duration-150"
              >
                <div className="flex items-center gap-3">
                  <div className="rounded-xl bg-surface-elevated p-2.5 text-foreground-muted">
                    {isDark ? <Sun className="h-5 w-5" /> : <Moon className="h-5 w-5" />}
                  </div>
                  <div>
                    <h3 className="text-sm font-bold text-foreground">Theme Mode</h3>
                    <p className="text-xs text-foreground-muted">Toggle between dark and light appearance preferences.</p>
                  </div>
                </div>
                <span className="rounded-full bg-surface-elevated px-3 py-1 text-xs font-semibold uppercase tracking-wider text-foreground-muted">
                  {isDark ? "Dark" : "Light"}
                </span>
              </button>
            </Card>

            {/* Feedback Card */}
            <Card className="rounded-2xl border border-border bg-surface p-5 shadow-card transition-shadow hover:shadow-elevated">
              <CardHeader className="p-0 pb-3">
                <CardTitle className="flex items-center gap-2 text-base font-semibold text-foreground">
                  <MessageSquare className="h-5 w-5 text-primary" />
                  Submit Feedback
                </CardTitle>
                <CardDescription className="text-xs text-foreground-muted">
                  Found an issue or have a feature suggestion? Let us know!
                </CardDescription>
              </CardHeader>
              <CardContent className="p-0">
                <FeedbackForm />
              </CardContent>
            </Card>

            {/* Danger Zone Card */}
            <Card className="rounded-2xl border border-destructive/20 bg-destructive/5 p-5 shadow-card">
              <div className="flex items-center justify-between gap-3 flex-wrap sm:flex-nowrap">
                <div>
                  <h3 className="text-sm font-bold text-destructive">Danger Zone</h3>
                  <p className="text-xs text-destructive/80 mt-0.5">
                    Irreversibly wipe all course databases, profile history, and active settings.
                  </p>
                </div>
                <Button onClick={handleClearData} variant="destructive" size="sm" className="h-9 shrink-0 gap-1.5">
                  <Trash2 className="h-3.5 w-3.5" />
                  Wipe Data
                </Button>
              </div>
            </Card>
          </motion.div>
        </div>
      </div>
    </motion.div>
  );
}
