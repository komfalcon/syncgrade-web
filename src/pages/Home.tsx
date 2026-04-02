import { useMemo, useState } from "react";
import { Plus } from "lucide-react";
import { Line, LineChart, ResponsiveContainer, Tooltip, XAxis, YAxis, CartesianGrid } from "recharts";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { useCGPA } from "@/hooks/useCGPA";
import SemesterCard from "@/components/SemesterCard";
import AddSemesterDialog from "@/components/AddSemesterDialog";
import ShareProgress from "@/components/ShareProgress";
import { useGpaScale } from "@/contexts/GpaScaleContext";
import { getClassification } from "@/utils/gpaLogic";

const CHART_THEME = {
  axis: "hsl(var(--muted-foreground))",
  grid: "hsl(var(--border))",
  line: "hsl(var(--primary))",
  dot: "hsl(var(--chart-2))",
  tooltipBg: "hsl(var(--card))",
  tooltipText: "hsl(var(--card-foreground))",
};

const CLASSIFICATION_STYLES: Record<string, string> = {
  "First Class": "bg-emerald-500/10 text-emerald-700 dark:text-emerald-300 border-emerald-500/30",
  "Second Class Upper": "bg-cyan-500/10 text-cyan-700 dark:text-cyan-300 border-cyan-500/30",
  "Second Class Lower": "bg-amber-500/10 text-amber-700 dark:text-amber-300 border-amber-500/30",
  "Third Class": "bg-orange-500/10 text-orange-700 dark:text-orange-300 border-orange-500/30",
  Pass: "bg-slate-500/10 text-slate-700 dark:text-slate-300 border-slate-500/30",
};

function getClassificationBadgeClass(label: string): string {
  return CLASSIFICATION_STYLES[label] ?? "bg-muted text-muted-foreground border-border";
}

export default function Home() {
  const cgpa = useCGPA();
  const scale = useGpaScale();
  const [showAddSemester, setShowAddSemester] = useState(false);
  const [expandedSemesterId, setExpandedSemesterId] = useState<string | null>(null);

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

  return (
    <div className="min-h-screen bg-background pb-20 md:pb-8">
      <main className="container mx-auto space-y-8 px-4 py-6">
        <Card className="border-border bg-card p-6 shadow-md md:p-8">
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

        <section className="space-y-4">
          <div className="flex items-center justify-between gap-3">
            <h2 className="text-2xl font-bold text-foreground">Your Semesters</h2>
            <Button onClick={() => setShowAddSemester(true)} className="min-h-12 gap-2">
              <Plus className="h-4 w-4" />
              Add Semester
            </Button>
          </div>

          {cgpa.semesters.length === 0 ? (
            <Card className="border-border bg-card p-8 text-center">
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
          <Card className="border-border bg-card p-6 shadow-sm">
            <h3 className="mb-4 text-lg font-semibold text-foreground">CGPA Progression</h3>
            <ResponsiveContainer width="100%" height={300}>
              <LineChart data={chartData}>
                <CartesianGrid strokeDasharray="3 3" stroke={CHART_THEME.grid} />
                <XAxis dataKey="name" stroke={CHART_THEME.axis} />
                <YAxis domain={[0, scale]} stroke={CHART_THEME.axis} />
                <Tooltip
                  contentStyle={{
                    backgroundColor: CHART_THEME.tooltipBg,
                    color: CHART_THEME.tooltipText,
                    border: `1px solid ${CHART_THEME.grid}`,
                    borderRadius: "0.5rem",
                  }}
                />
                <Line
                  type="monotone"
                  dataKey="gpa"
                  stroke={CHART_THEME.line}
                  strokeWidth={3}
                  dot={{ fill: CHART_THEME.dot, r: 5 }}
                  activeDot={{ r: 7, fill: CHART_THEME.line }}
                />
              </LineChart>
            </ResponsiveContainer>
          </Card>
        ) : null}

      </main>

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
