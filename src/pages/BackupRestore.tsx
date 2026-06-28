import { useState, useRef, useMemo, useEffect } from 'react';
import { useLocation } from 'wouter';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  ArrowLeft,
  Download,
  Upload,
  FileJson,
  FileSpreadsheet,
  AlertCircle,
  Cloud,
  Lock,
  RefreshCw,
  Copy,
  Check,
  Trash2,
  Key,
} from 'lucide-react';
import { toast } from 'sonner';
import { getDefaultSettings, type AppSettings, useCGPA } from '@/hooks/useCGPA';
import { exportBackup, parseBackupFile, generateCSV } from '@/engine/backup';
import {
  getStoredValue,
  setOnboardingComplete,
  setStoredValue,
  STORAGE_KEYS,
  getSyncgradeUserProfile,
  saveSyncgradeUserProfile,
  appDb,
} from '@/storage/db';
import { syncAcademicSnapshot, restoreFromCloud } from '@/lib/cloudSync';
import DataManagement from '@/components/DataManagement';

export default function BackupRestore() {
  const { semesters, currentCGPA, totalCredits, settings } = useCGPA();
  const [, setLocation] = useLocation();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [importPreview, setImportPreview] = useState<{
    semesters: number;
    courses: number;
    cgpa: number;
  } | null>(null);

  // Cloud Sync state variables
  const [syncProfile, setSyncProfile] = useState<any | null>(null);
  const [syncPassword, setSyncPassword] = useState("");
  const [restoreUuid, setRestoreUuid] = useState("");
  const [restorePassword, setRestorePassword] = useState("");
  const [isCopied, setIsCopied] = useState(false);
  const [syncBusy, setSyncBusy] = useState<"enable" | "restore" | "sync" | "disable" | null>(null);

  const isProfileComplete = useMemo(() => {
    return settings.studentName?.trim().length > 0 && settings.programme?.trim().length > 0 && settings.activeUniversity;
  }, [settings]);

  const loadSyncProfile = async () => {
    const profile = await getSyncgradeUserProfile();
    const token = await getStoredValue("syncgrade_jwt_token");
    const lastSync = await getStoredValue("syncgrade_last_sync_time");
    if (profile && token) {
      setSyncProfile({ ...profile, lastSync });
    } else {
      setSyncProfile(null);
    }
  };

  useEffect(() => {
    void loadSyncProfile();
  }, []);

  const handleEnableSync = async () => {
    if (!isProfileComplete) {
      toast.error("Please complete your profile details on the dashboard first!");
      return;
    }
    if (syncPassword.trim().length < 6) {
      toast.error("Password must be at least 6 characters long.");
      return;
    }

    setSyncBusy("enable");
    try {
      const uuid = crypto.randomUUID();
      await saveSyncgradeUserProfile({
        uuid,
        name: settings.studentName,
        department: settings.programme,
        university: settings.activeUniversity || "Custom",
      });
      await setStoredValue("syncgrade_sync_password", syncPassword);

      const result = await syncAcademicSnapshot();
      if (result.success) {
        toast.success("Cloud Sync successfully enabled!");
        setSyncPassword("");
        await loadSyncProfile();
      } else if (result.code === "OVERWRITE_PREVENTED") {
        toast.error("Cloud conflict. Sync identity creation aborted.");
        await appDb.user_profile.clear();
      } else {
        toast.error(result.error || "Sync setup failed.");
        await appDb.user_profile.clear();
      }
    } catch {
      toast.error("An error occurred during sync setup.");
    } finally {
      setSyncBusy(null);
    }
  };

  const handleManualSync = async () => {
    setSyncBusy("sync");
    try {
      const result = await syncAcademicSnapshot(true);
      if (result.success) {
        toast.success("Sync completed successfully!");
        await loadSyncProfile();
      } else if (result.code === "OVERWRITE_PREVENTED") {
        if (confirm("Warning: Cloud backup contains more semesters. Overwrite cloud data anyway?")) {
          const forceResult = await syncAcademicSnapshot(true);
          if (forceResult.success) {
            toast.success("Sync forced successfully!");
            await loadSyncProfile();
          } else {
            toast.error(forceResult.error || "Forced sync failed.");
          }
        }
      } else {
        toast.error(result.error || "Sync failed.");
      }
    } catch {
      toast.error("Sync error occurred.");
    } finally {
      setSyncBusy(null);
    }
  };

  const handleDisableSync = async () => {
    if (!confirm("Are you sure you want to disable Cloud Sync? This will remove sync credentials locally, but won't delete backup data from the cloud.")) return;
    setSyncBusy("disable");
    try {
      await appDb.user_profile.clear();
      await appDb.kv.delete("syncgrade_jwt_token");
      await appDb.kv.delete("syncgrade_last_sync_time");
      await appDb.kv.delete("syncgrade_sync_password");
      setSyncProfile(null);
      toast.success("Cloud Sync disabled.");
    } catch {
      toast.error("Failed to disable sync.");
    } finally {
      setSyncBusy(null);
    }
  };

  const handleRestoreSync = async () => {
    if (!restoreUuid.trim() || !restorePassword.trim()) {
      toast.error("Please enter both your Sync ID and password.");
      return;
    }
    if (confirm("Restore will overwrite all local settings, semesters, and courses. Proceed?")) {
      setSyncBusy("restore");
      try {
        const result = await restoreFromCloud(restoreUuid.trim(), restorePassword.trim());
        if (result.success && result.student) {
          const { student, token } = result;
          
          await saveSyncgradeUserProfile({
            uuid: student.uuid,
            name: student.name,
            department: student.department,
            university: student.university,
          });
          await setStoredValue("syncgrade_jwt_token", token || "");
          await setStoredValue("syncgrade_sync_password", restorePassword.trim());
          if (student.last_sync) {
            await setStoredValue("syncgrade_last_sync_time", student.last_sync);
          }

          if (student.academic_data) {
            await setStoredValue(STORAGE_KEYS.cgpaData, JSON.stringify(student.academic_data));
            if (student.academic_data.settings) {
              await setStoredValue(STORAGE_KEYS.settings, JSON.stringify(student.academic_data.settings));
            }
          }
          await setOnboardingComplete(true);

          toast.success("Academic records restored successfully! Reloading...");
          setTimeout(() => window.location.reload(), 800);
        } else {
          toast.error(result.error || "Restoration failed.");
        }
      } catch {
        toast.error("Restoration error occurred.");
      } finally {
        setSyncBusy(null);
      }
    }
  };

  const handleCopyId = () => {
    if (!syncProfile?.uuid) return;
    navigator.clipboard.writeText(syncProfile.uuid);
    setIsCopied(true);
    setTimeout(() => setIsCopied(false), 2000);
  };

  const totalCourses = useMemo(
    () => semesters.reduce((sum, sem) => sum + sem.courses.length, 0),
    [semesters],
  );

  const [lastModified, setLastModified] = useState<string | null>(null);
  useEffect(() => {
    void (async () => {
      const raw = await getStoredValue(STORAGE_KEYS.cgpaData);
      setLastModified(raw ? 'Today' : null);
    })();
  }, []);

  const handleExportJSON = () => {
    const data = {
      semesters,
      currentCGPA,
      totalCredits,
      settings,
    };
    exportBackup(data);
    toast.success('Backup exported as JSON!');
  };

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
    const blob = new Blob([csv], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `cgpa-export-${new Date().toISOString().slice(0, 10)}.csv`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
    toast.success('CSV exported successfully!');
  };

  const handleFileSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0] ?? null;
    setSelectedFile(file);
    setImportPreview(null);

    if (file) {
      const parsed = await parseBackupFile(file);
      if (parsed && typeof parsed === 'object') {
        const p = parsed as Record<string, unknown>;
        const sems = Array.isArray(p.semesters) ? p.semesters : [];
        const courses = sems.reduce(
          (sum: number, s: Record<string, unknown>) =>
            sum + (Array.isArray(s.courses) ? s.courses.length : 0),
          0,
        );
        setImportPreview({
          semesters: sems.length,
          courses,
          cgpa: typeof p.currentCGPA === 'number' ? p.currentCGPA : 0,
        });
      } else {
        toast.error('Could not read the selected file.');
        setSelectedFile(null);
      }
    }
  };

  const handleImport = async () => {
    if (!selectedFile) {
      toast.error('Please select a backup file first.');
      return;
    }

    const parsed = await parseBackupFile(selectedFile);
    if (!parsed) {
      toast.error('Invalid backup file.');
      return;
    }

    const backup = parsed as Record<string, unknown>;
    const importedSettings =
      typeof backup.settings === 'object' &&
      backup.settings !== null &&
      !Array.isArray(backup.settings)
        ? (backup.settings as Partial<AppSettings>)
        : {};
    const defaultSettings = getDefaultSettings();
    const mergedSettings: AppSettings = {
      ...defaultSettings,
      ...importedSettings,
      studentName:
        typeof importedSettings.studentName === 'string'
          ? importedSettings.studentName
          : defaultSettings.studentName,
      programme:
        typeof importedSettings.programme === 'string'
          ? importedSettings.programme
          : defaultSettings.programme,
      gradeRanges: Array.isArray(importedSettings.gradeRanges)
        ? importedSettings.gradeRanges
        : defaultSettings.gradeRanges,
      activeUniversity:
        typeof importedSettings.activeUniversity === 'string' ||
        importedSettings.activeUniversity === null
          ? importedSettings.activeUniversity
          : defaultSettings.activeUniversity,
      admissionSession:
        typeof importedSettings.admissionSession === 'string'
          ? importedSettings.admissionSession
          : defaultSettings.admissionSession,
      gpaScale:
        typeof importedSettings.gpaScale === 'number'
          ? importedSettings.gpaScale
          : defaultSettings.gpaScale,
      repeatPolicy:
        importedSettings.repeatPolicy === 'replace' ||
        importedSettings.repeatPolicy === 'average' ||
        importedSettings.repeatPolicy === 'both' ||
        importedSettings.repeatPolicy === 'highest'
          ? importedSettings.repeatPolicy
          : defaultSettings.repeatPolicy,
    };
    const restoredSemesters = Array.isArray(backup.semesters)
      ? backup.semesters
      : [];
    const restoredData = {
      semesters: restoredSemesters,
      currentCGPA:
        typeof backup.currentCGPA === 'number' ? backup.currentCGPA : 0,
      totalCredits:
        typeof backup.totalCredits === 'number' ? backup.totalCredits : 0,
      totalGradePoints:
        typeof backup.totalGradePoints === 'number' ? backup.totalGradePoints : 0,
      semesterGPAs:
        backup.semesterGPAs &&
        typeof backup.semesterGPAs === 'object' &&
        !Array.isArray(backup.semesterGPAs)
          ? backup.semesterGPAs
          : {},
      settings: mergedSettings,
    };

    try {
      await setStoredValue(STORAGE_KEYS.cgpaData, JSON.stringify(restoredData));
      await setStoredValue(STORAGE_KEYS.settings, JSON.stringify(mergedSettings));
      await setOnboardingComplete(true);

      toast.success('Backup restored! Reloading…');
      setTimeout(() => window.location.reload(), 500);
    } catch {
      toast.error('Failed to persist restored backup.');
    }
  };

  return (
    <div className="space-y-6">
      <div className="mx-auto max-w-4xl space-y-6">
        {/* Header */}
        <div className="rounded-xl border border-border bg-surface-elevated p-6 shadow-md">
          <div className="flex items-center gap-3">
            <Button
              variant="ghost"
              size="icon"
              className=""
              onClick={() => setLocation('/')}
            >
              <ArrowLeft className="h-5 w-5" />
            </Button>
            <div>
              <h1 className="text-2xl font-bold md:text-3xl">
                Backup &amp; Restore
              </h1>
              <p className="mt-1 text-foreground-muted">
                Export your data or restore from a previous backup
              </p>
            </div>
          </div>
        </div>

        {/* Current Data Summary */}
        <Card className="p-6">
          <h2 className="mb-4 text-lg font-semibold">Current Data Summary</h2>
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
            <div className="rounded-lg bg-blue-50 p-3 text-center">
              <p className="text-xl font-bold text-blue-700 sm:text-2xl">
                {semesters.length}
              </p>
              <p className="text-xs text-blue-600 sm:text-sm">Semesters</p>
            </div>
            <div className="rounded-lg bg-green-50 p-3 text-center">
              <p className="text-xl font-bold text-green-700 sm:text-2xl">
                {totalCourses}
              </p>
              <p className="text-xs text-green-600 sm:text-sm">Total Courses</p>
            </div>
            <div className="rounded-lg bg-purple-50 p-3 text-center">
              <p className="text-xl font-bold text-purple-700 sm:text-2xl">
                {currentCGPA.toFixed(2)}
              </p>
              <p className="text-xs text-purple-600 sm:text-sm">Current CGPA</p>
            </div>
            <div className="rounded-lg bg-amber-50 p-3 text-center">
              <p className="text-xl font-bold text-amber-700 sm:text-2xl">
                {settings.activeUniversity ?? 'None'}
              </p>
              <p className="text-xs text-amber-600 sm:text-sm">University</p>
            </div>
            <div className="rounded-lg bg-rose-50 p-3 text-center">
              <p className="text-xl font-bold text-rose-700 sm:text-2xl">
                {totalCredits}
              </p>
              <p className="text-xs text-rose-600 sm:text-sm">Total Credits</p>
            </div>
            {lastModified && (
              <div className="rounded-lg bg-surface-elevated p-3 text-center">
                <p className="text-xl font-bold text-foreground sm:text-2xl">
                  {lastModified}
                </p>
                <p className="text-xs text-foreground-muted sm:text-sm">Last Modified</p>
              </div>
            )}
          </div>
        </Card>

        {/* Export Section */}
        <Card className="p-6">
          <h2 className="mb-2 text-lg font-semibold">Export Data</h2>
          <p className="mb-4 text-sm text-muted-foreground">
            Download your data as JSON (full backup) or CSV (spreadsheet).
            {semesters.length > 0 && (
              <span className="ml-1">
                Will include {semesters.length} semester(s), {totalCourses}{' '}
                course(s), and CGPA of {currentCGPA.toFixed(2)}.
              </span>
            )}
          </p>
          <div className="flex flex-wrap gap-3">
            <Button onClick={handleExportJSON} className="gap-2">
              <FileJson className="h-4 w-4" />
              Export as JSON
            </Button>
            <Button
              onClick={handleExportCSV}
              variant="outline"
              className="gap-2"
            >
              <FileSpreadsheet className="h-4 w-4" />
              Export as CSV
            </Button>
          </div>
        </Card>

        {/* Import Section */}
        <Card className="p-6">
          <h2 className="mb-2 text-lg font-semibold">Import Backup</h2>

          <div className="mb-4 flex items-start gap-2 rounded-lg border border-amber-200 bg-amber-50 p-3 text-sm text-amber-800">
            <AlertCircle className="mt-0.5 h-4 w-4 shrink-0" />
            <span>
              Importing a backup will <strong>replace</strong> all current data.
              Consider exporting first.
            </span>
          </div>

          <div className="space-y-4">
            <div>
              <Label htmlFor="backup-file">Select JSON backup file</Label>
              <Input
                id="backup-file"
                ref={fileInputRef}
                type="file"
                accept=".json"
                onChange={handleFileSelect}
                className="mt-1"
              />
            </div>

            {importPreview && (
              <div className="rounded-lg border border-blue-200 bg-blue-50 p-4">
                <h3 className="mb-2 text-sm font-semibold text-blue-800">
                  Import Preview
                </h3>
                <div className="grid grid-cols-3 gap-3 text-center text-sm">
                  <div>
                    <p className="font-bold text-blue-700">
                      {importPreview.semesters}
                    </p>
                    <p className="text-blue-600">Semesters</p>
                  </div>
                  <div>
                    <p className="font-bold text-blue-700">
                      {importPreview.courses}
                    </p>
                    <p className="text-blue-600">Courses</p>
                  </div>
                  <div>
                    <p className="font-bold text-blue-700">
                      {importPreview.cgpa.toFixed(2)}
                    </p>
                    <p className="text-blue-600">CGPA</p>
                  </div>
                </div>
              </div>
            )}

            <Button
              onClick={handleImport}
              disabled={!selectedFile}
              className="gap-2"
            >
              <Upload className="h-4 w-4" />
              Import Backup
            </Button>
          </div>
        </Card>

        {/* Cloud Sync Section */}
        <Card className="p-6">
          <h2 className="mb-2 text-lg font-semibold flex items-center gap-2">
            <Cloud className="h-5 w-5 text-primary" />
            Cloud Synchronization
          </h2>
          <p className="mb-4 text-sm text-muted-foreground">
            Securely back up your GPA records to the cloud and sync them across multiple devices.
          </p>

          {syncProfile ? (
            <div className="space-y-4">
              <div className="rounded-lg border border-success/40 bg-success/5 p-4">
                <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                  <div>
                    <p className="text-sm font-semibold text-success flex items-center gap-1.5">
                      <span className="inline-block h-2 w-2 rounded-full bg-success animate-pulse" />
                      Cloud Sync Active
                    </p>
                    <p className="text-xs text-foreground-muted mt-0.5">
                      {syncProfile.lastSync
                        ? `Last synced: ${new Date(syncProfile.lastSync).toLocaleString()}`
                        : "Never synced"}
                    </p>
                  </div>
                  <div className="flex gap-2">
                    <Button
                      size="sm"
                      onClick={handleManualSync}
                      disabled={syncBusy !== null}
                      className="gap-1.5 h-9"
                    >
                      <RefreshCw className={`h-3.5 w-3.5 ${syncBusy === "sync" ? "animate-spin" : ""}`} />
                      Sync Now
                    </Button>
                    <Button
                      size="sm"
                      variant="destructive"
                      onClick={handleDisableSync}
                      disabled={syncBusy !== null}
                      className="gap-1.5 h-9"
                    >
                      <Trash2 className="h-3.5 w-3.5" />
                      Disable Sync
                    </Button>
                  </div>
                </div>

                <div className="mt-4 pt-3 border-t border-success/20 flex flex-col gap-2">
                  <Label className="text-xs font-semibold text-foreground-muted">Your Unique Sync ID</Label>
                  <div className="flex gap-2 max-w-md">
                    <Input
                      readOnly
                      value={syncProfile.uuid}
                      className="h-9 font-mono text-xs select-all bg-surface-elevated"
                    />
                    <Button
                      size="icon"
                      variant="outline"
                      onClick={handleCopyId}
                      className="h-9 w-9 shrink-0"
                    >
                      {isCopied ? <Check className="h-4 w-4 text-success" /> : <Copy className="h-4 w-4" />}
                    </Button>
                  </div>
                  <p className="text-[10px] text-foreground-subtle">
                    Save this Sync ID and your password to restore your records on another device.
                  </p>
                </div>
              </div>
            </div>
          ) : (
            <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
              {/* Enable Card */}
              <div className="space-y-4 rounded-lg border border-border p-4">
                <h3 className="text-sm font-semibold text-foreground flex items-center gap-1.5">
                  <Lock className="h-4 w-4 text-primary" />
                  Enable Cloud Sync
                </h3>
                <p className="text-xs text-muted-foreground">
                  Create a cloud profile to automatically save your GPA data in real-time.
                </p>

                {!isProfileComplete ? (
                  <div className="rounded-lg border border-warning/30 bg-warning/5 p-3 text-xs text-warning">
                    Please set your name, programme, and university on the dashboard first to enable sync.
                  </div>
                ) : (
                  <div className="space-y-3">
                    <div className="space-y-1">
                      <Label htmlFor="sync-password">Set Sync Password</Label>
                      <Input
                        id="sync-password"
                        type="password"
                        placeholder="Min 6 characters"
                        value={syncPassword}
                        onChange={(e) => setSyncPassword(e.target.value)}
                        className="h-9"
                      />
                    </div>
                    <Button
                      onClick={handleEnableSync}
                      disabled={syncBusy !== null}
                      className="w-full h-9"
                    >
                      {syncBusy === "enable" ? "Enabling..." : "Enable Backup"}
                    </Button>
                  </div>
                )}
              </div>

              {/* Restore Card */}
              <div className="space-y-4 rounded-lg border border-border p-4">
                <h3 className="text-sm font-semibold text-foreground flex items-center gap-1.5">
                  <Key className="h-4 w-4 text-primary" />
                  Restore Sync Identity
                </h3>
                <p className="text-xs text-muted-foreground">
                  Restore your existing GPA profile and data using your Sync ID and password.
                </p>

                <div className="space-y-3">
                  <div className="space-y-1">
                    <Label htmlFor="restore-uuid">Sync ID (UUID)</Label>
                    <Input
                      id="restore-uuid"
                      placeholder="e.g. 550e8400-e29b-41d4-a716-446655440000"
                      value={restoreUuid}
                      onChange={(e) => setRestoreUuid(e.target.value)}
                      className="h-9 font-mono text-xs"
                    />
                  </div>
                  <div className="space-y-1">
                    <Label htmlFor="restore-password">Sync Password</Label>
                    <Input
                      id="restore-password"
                      type="password"
                      placeholder="Enter password"
                      value={restorePassword}
                      onChange={(e) => setRestorePassword(e.target.value)}
                      className="h-9"
                    />
                  </div>
                  <Button
                    onClick={handleRestoreSync}
                    variant="outline"
                    disabled={syncBusy !== null}
                    className="w-full h-9"
                  >
                    {syncBusy === "restore" ? "Restoring..." : "Restore Data"}
                  </Button>
                </div>
              </div>
            </div>
          )}
        </Card>

        <DataManagement />
      </div>
    </div>
  );
}
