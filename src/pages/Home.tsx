import { useMemo, useState } from "react";
import { BarChart3, Plus } from "lucide-react";
import { CartesianGrid, Line, LineChart, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { useCGPA } from "@/hooks/useCGPA";
import SemesterCard from "@/components/SemesterCard";
import AddSemesterDialog from "@/components/AddSemesterDialog";
import ShareProgress from "@/components/ShareProgress";
import { useGpaScale } from "@/contexts/GpaScaleContext";
import { getClassification } from "@/utils/gpaLogic";

const CLASSIFICATION_STYLES: Record<string, string> = {
  "First Class": "border-emerald-500/30 bg-emerald-500/10 text-emerald-700 dark:text-emerald-300",
  "Second Class Upper": "border-cyan-500/30 bg-cyan-500/10 text-primary dark:text-cyan-300",
  "Second Class Lower": "border-amber-500/30 bg-amber-500/10 text-amber-700 dark:text-amber-300",
  "Third Class": "border-orange-500/30 bg-orange-500/10 text-orange-700 dark:text-orange-300",
  Pass: "border-border-strong bg-surface-elevated text-foreground-muted",
};

function getClassificationBadgeClass(label: string): string {
  return CLASSIFICATION_STYLES[label] ?? "border-border bg-muted text-muted-foreground";
}

export default function Home() {
  const cgpa = useCGPA();
  const scale = useGpaScale();
  const [showAddSemester, setShowAddSemester] = useState(false);
  const [expandedSemesterId, setExpandedSemesterId] = useState<string | null>(null);

  const chartTheme = useMemo(
    () => ({
      axis: "var(--foreground-muted)",
      grid: "var(--border)",
      tooltipBg: "var(--surface-elevated)",
      tooltipText: "var(--foreground)",
      line: "var(--accent)",
      dot: "var(--accent)",
    }),
    [],
  );

  const chartData = useMemo(
    () =>
      cgpa.semesters.map((semester) => ({
        name: semester.name,
        gpa: cgpa.semesterGPAs[semester.id] || 0,
      })),
    [cgpa.semesters, cgpa.semesterGPAs],
  );

  const semesterNames = useMemo(() => cgpa.semesters.map((s) => s.name), [cgpa.semesters]);
  const classification = useMemo(() => getClassification(cgpa.currentCGPA, scale), [cgpa.currentCGPA, scale]);
  const firstName = useMemo(() => {
    const value = cgpa.settings.studentName?.trim();
    if (!value) return "";
    return value.split(/\s+/)[0] ?? "";
  }, [cgpa.settings.studentName]);

  return (
    <div className="space-y-10">
        <Card className="rounded-xl border border-border bg-surface p-4 shadow-md md:p-6">
          {firstName ? (
            <p className="mb-2 text-lg font-semibold text-foreground-muted">{firstName}, your CGPA is</p>
          ) : null}
          <div className="flex flex-wrap items-start justify-between gap-4">
            <div>
              <p className="text-sm font-medium uppercase tracking-wide text-muted-foreground">Current CGPA</p>
              <h1 className="mt-2 font-mono text-5xl font-bold text-foreground md:text-6xl">
                {cgpa.currentCGPA.toFixed(2)}
              </h1>
              <p className="mt-2 text-sm text-muted-foreground">
                Scale {scale.toFixed(1)} • {cgpa.totalCredits} credits completed
              </p>
            </div>
            <span className={`rounded-full border px-3 py-1 text-sm font-medium ${getClassificationBadgeClass(classification.label)}`}>
              {classification.label}
            </span>
          </div>
          {cgpa.semesters.length > 0 ? (
            <div className="mt-5">
              <ShareProgress cgpa={cgpa.currentCGPA} totalCredits={cgpa.totalCredits} />
            </div>
          ) : null}
        </Card>

        <section className="mb-10 space-y-4">
          <div className="flex items-center justify-between gap-3">
            <h2 className="text-2xl font-bold text-foreground">Your Semesters</h2>
            <Button onClick={() => setShowAddSemester(true)} className="min-h-12 gap-2">
              <Plus className="h-4 w-4" />
              Add Semester
            </Button>
          </div>

          {cgpa.semesters.length === 0 ? (
            <Card className="rounded-xl border border-border bg-surface p-4 text-center shadow-md md:p-6">
              <p className="text-muted-foreground">No semesters yet. Add your first semester to begin tracking your CGPA.</p>
            </Card>
          ) : (
            <div className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-3">
              {cgpa.semesters.map((semester) => (
                <SemesterCard
                  key={semester.id}
                  semester={semester}
                  gpa={cgpa.semesterGPAs[semester.id] || 0}
                  isExpanded={expandedSemesterId === semester.id}
                  onToggleExpand={() => setExpandedSemesterId(expandedSemesterId === semester.id ? null : semester.id)}
                  onRemove={() => cgpa.removeSemester(semester.id)}
                  onAddCourse={(course) => cgpa.addCourse(semester.id, course)}
                  onUpdateCourse={(courseId, updates) => cgpa.updateCourse(semester.id, courseId, updates)}
                  onRemoveCourse={(courseId) => cgpa.removeCourse(semester.id, courseId)}
                  gpaScale={scale}
                  semesterNames={semesterNames}
                />
              ))}
            </div>
          )}
        </section>

        {chartData.length > 0 ? (
          <Card className="rounded-xl border border-border bg-surface p-4 shadow-md">
            <h3 className="mb-4 flex items-center gap-2 text-xl font-bold text-foreground">
              <BarChart3 className="h-4 w-4 text-accent" />
              CGPA Progression
            </h3>
            <ResponsiveContainer width="100%" height={220}>
              <LineChart data={chartData}>
                <CartesianGrid strokeDasharray="3 3" stroke={chartTheme.grid} />
                <XAxis
                  dataKey="name"
                  tick={{ fill: chartTheme.axis, fontSize: 12 }}
                  axisLine={{ stroke: chartTheme.grid }}
                  tickLine={{ stroke: chartTheme.grid }}
                />
                <YAxis
                  domain={[0, scale]}
                  tick={{ fill: chartTheme.axis, fontSize: 12 }}
                  axisLine={{ stroke: chartTheme.grid }}
                  tickLine={{ stroke: chartTheme.grid }}
                />
                <Tooltip
                  contentStyle={{
                    backgroundColor: chartTheme.tooltipBg,
                    color: chartTheme.tooltipText,
                    border: `1px solid ${chartTheme.grid}`,
                    borderRadius: "0.5rem",
                  }}
                  labelStyle={{ color: chartTheme.tooltipText, fontWeight: 600 }}
                  itemStyle={{ color: chartTheme.dot }}
                />
                <Line
                  type="monotone"
                  dataKey="gpa"
                  stroke={chartTheme.line}
                  strokeWidth={2}
                  dot={{ fill: chartTheme.dot, strokeWidth: 0, r: 5 }}
                  activeDot={{ r: 7, fill: chartTheme.line }}
                />
              </LineChart>
            </ResponsiveContainer>
          </Card>
        ) : null}
      <AddSemesterDialog
        open={showAddSemester}
        onOpenChange={setShowAddSemester}
        onAdd={(name: string) => {
          cgpa.addSemester(name);
          setShowAddSemester(false);
        }}
      />
    </div>
  );
}
