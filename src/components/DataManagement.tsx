import { useMemo, useState } from "react";
import { Download, Upload, AlertTriangle, ShieldAlert } from "lucide-react";
import { exportDB, importDB } from "dexie-export-import";
import { toast } from "sonner";
import { appDb } from "@/storage/db";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";

function getBackupFileName() {
  const date = new Date().toISOString().slice(0, 10);
  return `SyncGrade_Backup_${date}.json`;
}

export default function DataManagement() {
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [confirmOpen, setConfirmOpen] = useState(false);
  const [busy, setBusy] = useState<"export" | "import" | null>(null);

  const canImport = useMemo(() => !!selectedFile && busy === null, [selectedFile, busy]);

  const handleExport = async () => {
    setBusy("export");
    try {
      const blob = await exportDB(appDb, { prettyJson: true });
      const url = URL.createObjectURL(blob);
      const anchor = document.createElement("a");
      anchor.href = url;
      anchor.download = getBackupFileName();
      document.body.appendChild(anchor);
      anchor.click();
      document.body.removeChild(anchor);
      URL.revokeObjectURL(url);
      toast.success("Backup download started.");
    } catch {
      toast.error("Failed to export your data. Please try again.");
    } finally {
      setBusy(null);
    }
  };

  const handleFileSelected = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0] ?? null;
    if (file && !file.name.toLowerCase().endsWith(".json")) {
      toast.error("Please select a valid .json backup file.");
      event.currentTarget.value = "";
      setSelectedFile(null);
      return;
    }
    setSelectedFile(file);
  };

  const handleConfirmImport = async () => {
    if (!selectedFile) {
      toast.error("Please select a JSON backup file first.");
      return;
    }

    setBusy("import");
    try {
      await appDb.delete();
      await importDB(selectedFile);
      toast.success("Backup imported successfully. Reloading…");
      window.location.reload();
    } catch {
      toast.error("Import failed. The file may be invalid or corrupted.");
      setBusy(null);
      setConfirmOpen(false);
    }
  };

  return (
    <Card className="p-6 border-red-200 bg-red-50/30">
      <div className="mb-4 flex items-start gap-3">
        <div className="rounded-md bg-red-100 p-2 text-red-700">
          <ShieldAlert className="h-5 w-5" />
        </div>
        <div>
          <h2 className="text-lg font-semibold text-slate-900">Danger Zone · Data Management</h2>
          <p className="text-sm text-slate-600">
            Export your full local database or restore from a backup file.
          </p>
        </div>
      </div>

      <div className="mb-5 rounded-lg border border-amber-200 bg-amber-50 p-3 text-sm text-amber-900">
        <div className="flex items-start gap-2">
          <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0" />
          <p>
            This file contains your entire academic record. Keep it safe and do not share it
            with others.
          </p>
        </div>
      </div>

      <div className="grid gap-6 md:grid-cols-2">
        <div className="space-y-3 rounded-lg border bg-white p-4">
          <h3 className="font-medium text-slate-900">Export Data</h3>
          <p className="text-sm text-slate-600">
            Download a complete JSON backup of your local SyncGrade database.
          </p>
          <Button onClick={handleExport} disabled={busy !== null} className="gap-2">
            <Download className="h-4 w-4" />
            {busy === "export" ? "Exporting..." : "Export Database"}
          </Button>
        </div>

        <div className="space-y-3 rounded-lg border bg-white p-4">
          <h3 className="font-medium text-slate-900">Import Data</h3>
          <Label htmlFor="backup-json">Select backup file (.json)</Label>
          <Input
            id="backup-json"
            type="file"
            accept=".json,application/json"
            onChange={handleFileSelected}
            disabled={busy !== null}
          />
          <Button
            variant="outline"
            onClick={() => setConfirmOpen(true)}
            disabled={!canImport}
            className="gap-2"
          >
            <Upload className="h-4 w-4" />
            {busy === "import" ? "Importing..." : "Import & Overwrite"}
          </Button>
        </div>
      </div>

      <AlertDialog open={confirmOpen} onOpenChange={setConfirmOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Confirm Overwrite</AlertDialogTitle>
            <AlertDialogDescription>
              Importing will permanently delete all current local data and replace it with the
              selected backup. This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={busy === "import"}>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={handleConfirmImport} disabled={busy === "import"}>
              Continue Import
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </Card>
  );
}
