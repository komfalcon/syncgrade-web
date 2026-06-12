import { useMemo, useState } from "react";
import { motion } from "framer-motion";
import {
  BarChart3,
  GraduationCap,
  Plus,
  Target,
  TrendingUp,
} from "lucide-react";
import { cn } from "@/lib/utils";
import {
  CartesianGrid,
  Line,
  LineChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { useCGPA } from "@/hooks/useCGPA";
import SemesterCard from "@/components/SemesterCard";
import AddSemesterDialog from "@/components/AddSemesterDialog";
import ShareProgress from "@/components/ShareProgress";
import { useGpaScale } from "@/contexts/GpaScaleContext";
import { getClassification } from "@/utils/gpaLogic";
import GradingGuide from "@/components/GradingGuide";
import { extractCourseCode, type CourseHistory } from "@/utils/carryoverDetector";
import { useUniversities } from "@/hooks/useUniversities";
import TireSection from "@/components/TireSection";

const CLASSIFICATION_STYLES: Record<string, string> = {
  "First Class": "bg-success/10 text-success border-success/20",
  "Second Class Upper": "bg-primary/10 text-primary-foreground border-primary/20",
  "Second Class Lower": "bg-warning/10 text-warning border-warning/20",
  "Third Class": "bg-orange-50 text-orange-600 border-orange-200",
  Pass: "bg-zinc-100 text-zinc-600 border-zinc-200",
};

function getClassificationBadgeClass(label: string): string {
  return CLASSIFICATION_STYLES[label] ?? "bg-muted text-muted-foreground border-border";
}

const fadeUpItem = {
  hidden: { opacity: 0, y: 16 },
  show: { opacity: 1, y: 0, transition: { type: "spring" as const, stiffness: 200, damping: 24 } },
};

const scaleInItem = {
  hidden: { opacity: 0, scale: 0.95 },
  show: { opacity: 1, scale: 1, transition: { type: "spring" as const, stiffness: 200, damping: 22 } },
};

interface StatCardProps {
  icon: React.ReactNode;
  label: string;
  value: string;
  sub: string;
}

function StatCard({ icon, label, value, sub }: StatCardProps) {
  return (
    <div className="rounded-xl border border-border bg-surface p-4 shadow-soft transition-shadow hover:shadow-elevated md:p-5">
      <div className="flex items-start justify-between">
        <div>
          <p className="text-[11px] font-semibold uppercase tracking-widest text-foreground-muted">
            {label}
          </p>
          <p className="mt-1.5 text-2xl font-bold tracking-tight text-foreground">
            {value}
          </p>
          <p className="mt-0.5 text-xs text-foreground-subtle">{sub}</p>
        </div>
        <div className="rounded-lg bg-surface-elevated p-2.5 text-foreground-muted">
          {icon}
        </div>
      </div>
    </div>
  );
}

export default function Home() {
  const cgpa = useCGPA();
  const scale = useGpaScale();
  const { universities } = useUniversities();
  const [showAddSemester, setShowAddSemester] = useState(false);
  const [expandedSemesterId, setExpandedSemesterId] = useState<string | null>(null);

  const chartTheme = useMemo(
    () => ({
      axis: "#a1a1aa",
      grid: "#e4e4e7",
      tooltipBg: "#ffffff",
      tooltipText: "#18181b",
      line: "#a3e635",
      dot: "#a3e635",
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
  const activeUniversityName = useMemo(
    () => universities.find((uni) => uni.shortName === cgpa.settings.activeUniversity)?.name ?? null,
    [cgpa.settings.activeUniversity, universities],
  );
  const passThreshold = useMemo(() => {
    const passingPoints = cgpa.settings.gradeRanges
      .map((range) => range.points)
      .filter((points) => points > 0);
    if (!passingPoints.length) return 1.0;
    return Math.min(...passingPoints);
  }, [cgpa.settings.gradeRanges]);
  const previousCoursesBySemesterId = useMemo(() => {
    const map: Record<string, CourseHistory[]> = {};
    const history: CourseHistory[] = [];
    cgpa.semesters.forEach((semester) => {
      map[semester.id] = [...history];
      semester.courses.forEach((course) => {
        history.push({
          semesterName: semester.name,
          courseName: course.name,
          courseCode: extractCourseCode(course.name),
          gradePoint: course.gradePoint,
          creditUnits: course.credits,
          passed: course.gradePoint >= passThreshold,
        });
      });
    });
    return map;
  }, [cgpa.semesters, passThreshold]);
  const groupedSemesters = useMemo(() => {
    const groups = new Map<number, Array<{ id: string; semesterIndex: number }>>();
    cgpa.semesters.forEach((semester, semesterIndex) => {
      const level = semester.level ?? 100;
      const current = groups.get(level) ?? [];
      current.push({ id: semester.id, semesterIndex });
      groups.set(level, current);
    });
    return Array.from(groups.entries())
      .sort(([a], [b]) => a - b)
      .map(([level, entries]) => ({
        level,
        semesters: entries
          .sort((a, b) => a.semesterIndex - b.semesterIndex)
          .map((entry) => cgpa.semesters[entry.semesterIndex]),
      }));
  }, [cgpa.semesters]);
  const firstName = useMemo(() => {
    const value = cgpa.settings.studentName?.trim();
    if (!value) return "";
    return value.split(/\s+/)[0] ?? "";
  }, [cgpa.settings.studentName]);

  const stats = useMemo(() => {
    const gpas = Object.values(cgpa.semesterGPAs).filter((g) => g > 0);
    const avg = gpas.length > 0 ? gpas.reduce((a, b) => a + b, 0) / gpas.length : 0;
    const best = gpas.length > 0 ? Math.max(...gpas) : 0;
    const bestSemester = best > 0 ? cgpa.semesters.find((s) => cgpa.semesterGPAs[s.id] === best) : null;
    return { avg, best, bestSemester };
  }, [cgpa.semesterGPAs, cgpa.semesters]);

  const cgpaPercent = (cgpa.currentCGPA / scale) * 100;

  return (
    <motion.div
      initial="hidden"
      animate="show"
      variants={{ hidden: {}, show: { transition: { staggerChildren: 0.06 } } }}
      className="space-y-6 pb-24 md:space-y-8 md:pb-8"
    >
      {/* ── Sticky CGPA Hero ──────────────────────────────────── */}
      <motion.div variants={scaleInItem} className="sticky top-0 z-10 -mx-4 px-4 pt-4 pb-2 md:static md:mx-0 md:px-0 md:pt-0">
        <div className="rounded-xl border border-border bg-surface/95 shadow-soft backdrop-blur-md md:border-border md:bg-surface md:shadow-card md:backdrop-blur-none">
          <div className="px-4 py-4 md:px-6 md:py-5">
            {/* Top row */}
            <div className="flex items-start justify-between gap-3">
              <div>
                {firstName ? (
                  <p className="flex items-center gap-1.5 text-xs font-medium text-foreground-muted">
                    <span className="inline-block h-1.5 w-1.5 rounded-full bg-success" />
                    Welcome back, {firstName}
                  </p>
                ) : (
                  <p className="flex items-center gap-1.5 text-xs font-medium text-foreground-muted">
                    <GraduationCap className="h-3.5 w-3.5" />
                    Your Academic Progress
                  </p>
                )}
              </div>
              <Badge className={cn("px-2.5 py-1 text-[11px]", getClassificationBadgeClass(classification.label))}>
                {classification.label}
              </Badge>
            </div>

            {/* CGPA display */}
            <div className="mt-3 flex flex-wrap items-end justify-between gap-4">
              <div>
                <div className="flex items-baseline gap-2">
                  <h1 className="font-mono text-4xl font-bold tracking-tight text-foreground md:text-5xl">
                    {cgpa.currentCGPA.toFixed(2)}
                  </h1>
                  <span className="text-sm font-medium text-foreground-subtle">
                    / {scale.toFixed(1)}
                  </span>
                </div>
                <p className="mt-0.5 text-xs text-foreground-subtle">
                  {cgpa.totalCredits} credits completed
                </p>
              </div>

              {cgpa.semesters.length > 0 && (
                <ShareProgress cgpa={cgpa.currentCGPA} totalCredits={cgpa.totalCredits} />
              )}
            </div>

            {/* Progress bar */}
            <div className="mt-4 space-y-1">
              <div className="flex items-center justify-between text-[11px]">
                <span className="text-foreground-subtle">Progress toward {classification.label}</span>
                <span className="font-mono font-medium text-foreground">
                  {cgpaPercent.toFixed(0)}%
                </span>
              </div>
              <div className="h-1.5 overflow-hidden rounded-full bg-zinc-100">
                <motion.div
                  className="h-full rounded-full bg-gradient-to-r from-primary/60 to-primary"
                  initial={{ width: 0 }}
                  animate={{ width: `${cgpaPercent}%` }}
                  transition={{ duration: 1, ease: "easeOut", delay: 0.3 }}
                />
              </div>
            </div>
          </div>
        </div>
      </motion.div>

      {/* ── Stats Row ─────────────────────────────────────────── */}
      {cgpa.semesters.length > 0 && (
        <motion.div variants={fadeUpItem} className="grid gap-3 sm:grid-cols-3">
          <StatCard
            icon={<BarChart3 className="h-4 w-4" />}
            label="Average GPA"
            value={stats.avg > 0 ? stats.avg.toFixed(2) : "—"}
            sub={`across ${cgpa.semesters.length} semester${cgpa.semesters.length !== 1 ? "s" : ""}`}
          />
          <StatCard
            icon={<TrendingUp className="h-4 w-4" />}
            label="Best Semester"
            value={stats.best > 0 ? stats.best.toFixed(2) : "—"}
            sub={stats.bestSemester ? stats.bestSemester.name : ""}
          />
          <StatCard
            icon={<Target className="h-4 w-4" />}
            label="Target Class"
            value={classification.label === "First Class" ? "Maintain" : "First Class"}
            sub={classification.label === "First Class" ? "On track to graduate with First Class" : `${(cgpa.currentCGPA + 0.5).toFixed(2)} to reach`}
          />
        </motion.div>
      )}

      {/* ── Grading Guide + Semesters (two-column) ────────────── */}
      <div className="grid gap-6 lg:grid-cols-[260px_1fr]">
        {/* Left — Grading Guide */}
        <motion.div variants={fadeUpItem}>
          <GradingGuide gradeRanges={cgpa.settings.gradeRanges} universityName={activeUniversityName} />
        </motion.div>

        {/* Right — Semesters */}
        <motion.section variants={fadeUpItem} className="w-full space-y-4">
          <div className="flex items-center justify-between gap-3">
            <div>
              <h2 className="text-lg font-bold tracking-tight text-foreground">
                Your Semesters
              </h2>
              <p className="text-xs text-foreground-subtle">
                {cgpa.semesters.length} semester{cgpa.semesters.length !== 1 ? "s" : ""} ·{" "}
                {cgpa.semesters.reduce((sum, s) => sum + s.courses.length, 0)} courses
              </p>
            </div>
            <Button onClick={() => setShowAddSemester(true)} className="gap-1.5 shrink-0">
              <Plus className="h-4 w-4" />
              <span className="hidden sm:inline">Add Semester</span>
            </Button>
          </div>

          {cgpa.semesters.length === 0 ? (
            <Card className="p-8 text-center">
              <div className="mx-auto mb-3 flex h-12 w-12 items-center justify-center rounded-full bg-surface-elevated">
                <GraduationCap className="h-6 w-6 text-foreground-muted" />
              </div>
              <p className="text-sm font-medium text-foreground">No semesters yet</p>
              <p className="mt-0.5 text-xs text-foreground-subtle">
                Add your first semester to begin tracking your CGPA.
              </p>
              <Button onClick={() => setShowAddSemester(true)} className="mt-4 gap-1.5">
                <Plus className="h-4 w-4" />
                Add Semester
              </Button>
            </Card>
          ) : (
            <motion.div
              variants={{ hidden: {}, show: { transition: { staggerChildren: 0.06 } } }}
              initial="hidden"
              animate="show"
              className="space-y-5"
            >
              {groupedSemesters.map((group) => {
                const groupAverage =
                  group.semesters.length > 0
                    ? group.semesters.reduce((sum, semester) => sum + (cgpa.semesterGPAs[semester.id] || 0), 0) /
                      group.semesters.length
                    : 0;

                return (
                  <motion.div key={group.level} variants={fadeUpItem}>
                    <div className="mb-2 flex items-center gap-2 px-0.5">
                      <h3 className="text-sm font-semibold text-foreground">
                        {group.level}L
                      </h3>
                      <span className="inline-flex items-center rounded-full bg-surface-elevated px-2 py-0.5 text-[10px] font-medium text-foreground-muted">
                        Avg: {groupAverage.toFixed(2)}
                      </span>
                    </div>

                    <div className="space-y-2">
                      {group.semesters.map((semester) => (
                        <motion.div key={semester.id} variants={fadeUpItem}>
                          <SemesterCard
                            semester={semester}
                            gpa={cgpa.semesterGPAs[semester.id] || 0}
                            isExpanded={expandedSemesterId === semester.id}
                            onToggleExpand={() =>
                              setExpandedSemesterId(
                                expandedSemesterId === semester.id ? null : semester.id,
                              )
                            }
                            onRemove={() => cgpa.removeSemester(semester.id)}
                            onAddCourse={(course) => cgpa.addCourse(semester.id, course)}
                            onUpdateCourse={(courseId, updates) =>
                              cgpa.updateCourse(semester.id, courseId, updates)
                            }
                            onRemoveCourse={(courseId) =>
                              cgpa.removeCourse(semester.id, courseId)
                            }
                            gpaScale={scale}
                            semesterNames={semesterNames}
                            previousCourses={previousCoursesBySemesterId[semester.id] ?? []}
                            passThreshold={passThreshold}
                          />
                        </motion.div>
                      ))}
                    </div>
                  </motion.div>
                );
              })}
            </motion.div>
          )}
        </motion.section>
      </div>

      {/* ── Chart ─────────────────────────────────────────────── */}
      {chartData.length > 0 && (
        <motion.div variants={scaleInItem}>
          <Card className="p-5 md:p-6">
            <h3 className="mb-4 flex items-center gap-2 text-base font-semibold text-foreground">
              <BarChart3 className="h-4 w-4 text-foreground-muted" />
              CGPA Progression
            </h3>
            <ResponsiveContainer width="100%" height={220}>
              <LineChart data={chartData}>
                <CartesianGrid strokeDasharray="3 3" stroke={chartTheme.grid} />
                <XAxis
                  dataKey="name"
                  tick={{ fill: chartTheme.axis, fontSize: 11 }}
                  axisLine={{ stroke: chartTheme.grid }}
                  tickLine={false}
                />
                <YAxis
                  domain={[0, scale]}
                  tick={{ fill: chartTheme.axis, fontSize: 11 }}
                  axisLine={false}
                  tickLine={false}
                />
                <Tooltip
                  contentStyle={{
                    backgroundColor: chartTheme.tooltipBg,
                    color: chartTheme.tooltipText,
                    border: "1px solid #e4e4e7",
                    borderRadius: "0.5rem",
                    boxShadow: "0 4px 12px rgba(0,0,0,0.06)",
                    fontSize: "13px",
                  }}
                  labelStyle={{ fontWeight: 600 }}
                />
                <Line
                  type="monotone"
                  dataKey="gpa"
                  stroke={chartTheme.line}
                  strokeWidth={2.5}
                  dot={{ fill: chartTheme.dot, strokeWidth: 0, r: 4 }}
                  activeDot={{ r: 6, fill: chartTheme.line }}
                />
              </LineChart>
            </ResponsiveContainer>
          </Card>
        </motion.div>
      )}

      {/* ── Featured: Tire Section ────────────────────────────── */}
      <motion.section variants={fadeUpItem}>
        <div className="overflow-hidden rounded-xl border border-border">
          <div className="flex items-center gap-2 border-b border-border px-4 py-2.5 md:px-5">
            <div className="flex h-5 w-5 items-center justify-center rounded-full bg-surface-elevated">
              <span className="h-2 w-2 rounded-full bg-primary" />
            </div>
            <span className="text-[10px] font-semibold uppercase tracking-[0.15em] text-foreground-muted">
              Featured
            </span>
            <div className="ml-auto h-px flex-1 bg-border" />
          </div>
          <TireSection />
        </div>
      </motion.section>

      {/* ── Dialog ────────────────────────────────────────────── */}
      <AddSemesterDialog
        open={showAddSemester}
        onOpenChange={setShowAddSemester}
        existingSemesterCount={cgpa.semesters.length}
        startingLevel={cgpa.settings.startingLevel}
        onAdd={(name: string, level: number) => {
          cgpa.addSemester(name, level);
          setShowAddSemester(false);
        }}
      />
    </motion.div>
  );
}
