/**
 * Backup, restore, and CSV export utilities.
 *
 * `exportBackup` and `parseBackupFile` depend on browser APIs (Blob, File)
 * and are intended for use in the client only.
 */

/**
 * Export all app data as a downloadable JSON file.
 */
export function exportBackup(data: object): void {
  const json = JSON.stringify(data, null, 2);
  const blob = new Blob([json], { type: "application/json" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = `cgpa-backup-${new Date().toISOString().slice(0, 10)}.json`;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}

/**
 * Import a backup from a JSON file.
 * Returns the parsed data or null if the file is empty / not valid JSON.
 */
export function parseBackupFile(file: File): Promise<object | null> {
  return new Promise((resolve) => {
    const reader = new FileReader();
    reader.onload = () => {
      try {
        const text = reader.result as string;
        if (!text || text.trim().length === 0) {
          resolve(null);
          return;
        }
        const parsed = JSON.parse(text);
        if (typeof parsed === "object" && parsed !== null) {
          resolve(parsed);
        } else {
          resolve(null);
        }
      } catch {
        resolve(null);
      }
    };
    reader.onerror = () => resolve(null);
    reader.readAsText(file);
  });
}

/**
 * Generate CSV content from semester data.
 *
 * The output includes one header row and one data row per course, grouped by
 * semester. A summary row with the overall CGPA is appended at the end.
 */
export function generateCSV(
  semesters: {
    name: string;
    courses: {
      name: string;
      credits: number;
      grade: string;
      gradePoint: number;
    }[];
  }[],
  cgpa: number
): string {
  const rows: string[] = [];
  rows.push("Semester,Course,Credits,Grade,Grade Point");

  for (const sem of semesters) {
    for (const course of sem.courses) {
      rows.push(
        [
          csvEscape(sem.name),
          csvEscape(course.name),
          course.credits,
          csvEscape(course.grade),
          course.gradePoint,
        ].join(",")
      );
    }
  }

  rows.push("");
  rows.push(`Overall CGPA,${cgpa}`);

  return rows.join("\n");
}

/** Escape a CSV field value by wrapping in quotes when it contains special characters. */
function csvEscape(value: string): string {
  if (value.includes(",") || value.includes('"') || value.includes("\n")) {
    return `"${value.replace(/"/g, '""')}"`;
  }
  return value;
}
