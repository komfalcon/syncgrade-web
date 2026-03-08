import { useState, useRef, useMemo } from 'react';
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
} from 'lucide-react';
import { toast } from 'sonner';
import { useCGPA } from '@/hooks/useCGPA';
import { exportBackup, parseBackupFile, generateCSV } from '@/engine/backup';

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

  const totalCourses = useMemo(
    () => semesters.reduce((sum, sem) => sum + sem.courses.length, 0),
    [semesters],
  );

  const lastModified = useMemo(() => {
    const raw = localStorage.getItem('cgpa-calculator-data');
    if (!raw) return null;
    return 'Today';
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
    const gradeRanges = settings.gradeRanges;
    const csvSemesters = semesters.map((sem) => ({
      name: sem.name,
      courses: sem.courses.map((c) => {
        const match = gradeRanges.find((r) => r.gradePoint === c.gradePoint);
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
    const restoredData = {
      semesters: backup.semesters,
      currentCGPA: backup.currentCGPA,
      totalCredits: backup.totalCredits,
      totalGradePoints: backup.totalGradePoints,
      semesterGPAs: backup.semesterGPAs,
      settings: backup.settings,
    };

    localStorage.setItem('cgpa-calculator-data', JSON.stringify(restoredData));
    if (backup.settings) {
      localStorage.setItem(
        'cgpa-calculator-settings',
        JSON.stringify(backup.settings),
      );
    }

    toast.success('Backup restored! Reloading…');
    setTimeout(() => window.location.reload(), 500);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 p-4 md:p-8">
      <div className="mx-auto max-w-4xl space-y-6">
        {/* Header */}
        <div className="rounded-2xl bg-gradient-to-r from-slate-600 to-slate-800 p-6 text-white shadow-lg">
          <div className="flex items-center gap-3">
            <Button
              variant="ghost"
              size="icon"
              className="text-white hover:bg-white/20"
              onClick={() => setLocation('/')}
            >
              <ArrowLeft className="h-5 w-5" />
            </Button>
            <div>
              <h1 className="text-2xl font-bold md:text-3xl">
                💾 Backup &amp; Restore
              </h1>
              <p className="mt-1 text-slate-200">
                Export your data or restore from a previous backup
              </p>
            </div>
          </div>
        </div>

        {/* Current Data Summary */}
        <Card className="p-6">
          <h2 className="mb-4 text-lg font-semibold">Current Data Summary</h2>
          <div className="grid grid-cols-2 gap-4 sm:grid-cols-3">
            <div className="rounded-lg bg-blue-50 p-3 text-center">
              <p className="text-2xl font-bold text-blue-700">
                {semesters.length}
              </p>
              <p className="text-sm text-blue-600">Semesters</p>
            </div>
            <div className="rounded-lg bg-green-50 p-3 text-center">
              <p className="text-2xl font-bold text-green-700">
                {totalCourses}
              </p>
              <p className="text-sm text-green-600">Total Courses</p>
            </div>
            <div className="rounded-lg bg-purple-50 p-3 text-center">
              <p className="text-2xl font-bold text-purple-700">
                {currentCGPA.toFixed(2)}
              </p>
              <p className="text-sm text-purple-600">Current CGPA</p>
            </div>
            <div className="rounded-lg bg-amber-50 p-3 text-center">
              <p className="text-2xl font-bold text-amber-700">
                {settings.activeUniversity ?? 'None'}
              </p>
              <p className="text-sm text-amber-600">University</p>
            </div>
            <div className="rounded-lg bg-rose-50 p-3 text-center">
              <p className="text-2xl font-bold text-rose-700">
                {totalCredits}
              </p>
              <p className="text-sm text-rose-600">Total Credits</p>
            </div>
            {lastModified && (
              <div className="rounded-lg bg-gray-50 p-3 text-center">
                <p className="text-2xl font-bold text-gray-700">
                  {lastModified}
                </p>
                <p className="text-sm text-gray-600">Last Modified</p>
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
      </div>
    </div>
  );
}
