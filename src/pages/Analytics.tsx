import { useState, useMemo } from 'react';
import { useLocation } from 'wouter';
import { motion } from 'framer-motion';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  ArrowLeft,
  TrendingUp,
  TrendingDown,
  Minus,
  Shield,
  AlertTriangle,
  Target,
  BarChart3,
} from 'lucide-react';
import {
  ResponsiveContainer,
  LineChart,
  Line,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
} from 'recharts';
import { useCGPA } from '@/hooks/useCGPA';
import {
  analyzePerformanceTrends,
  assessDegreeRisk,
  projectBestWorstCase,
} from '@/engine/calculations';
import { DEFAULT_NIGERIAN_DEGREE_CLASSES } from '@/universities/types';
import { useUniversities } from '@/hooks/useUniversities';
import { useGpaScale } from '@/contexts/GpaScaleContext';

const CHART_THEME = {
  axis: 'var(--foreground-muted)',
  grid: 'var(--border)',
  tooltipBg: 'var(--surface-elevated)',
  tooltipText: 'var(--foreground)',
  semesterLine: 'var(--primary)',
  cumulativeLine: 'var(--accent)',
  comparisonBar: 'var(--primary)',
};

const staggerContainer = {
  hidden: {},
  show: { transition: { staggerChildren: 0.07 } },
};

const fadeUpItem = {
  hidden: { opacity: 0, y: 20 },
  show: { opacity: 1, y: 0, transition: { type: "spring" as const, stiffness: 200, damping: 24 } },
};

export default function Analytics() {
  const { semesters, currentCGPA, totalCredits, semesterGPAs, settings } =
    useCGPA();
  const [, setLocation] = useLocation();
  const [remainingCredits, setRemainingCredits] = useState(60);
  const { universities } = useUniversities();

  const scale = useGpaScale();

  const degreeClasses = useMemo(() => {
    if (settings.activeUniversity) {
      const config = universities.find(
        (u) => u.shortName === settings.activeUniversity,
      );
      if (config) return config.degreeClasses;
    }
    return DEFAULT_NIGERIAN_DEGREE_CLASSES;
  }, [settings.activeUniversity, universities]);

  const semesterData = useMemo(
    () =>
      semesters.map((sem) => ({
        name: sem.name,
        gpa: semesterGPAs[sem.id] || 0,
        credits: sem.courses.reduce((sum, c) => sum + c.credits, 0),
      })),
    [semesters, semesterGPAs],
  );

  const trends = useMemo(
    () => analyzePerformanceTrends(semesterData),
    [semesterData],
  );
  const semesterComparisonData = useMemo(
    () =>
      semesterData.map((semester) => ({
        semester: semester.name,
        gpa: semester.gpa,
      })),
    [semesterData],
  );

  const riskAssessment = useMemo(
    () =>
      totalCredits > 0
        ? assessDegreeRisk(
            currentCGPA,
            degreeClasses,
            totalCredits,
            totalCredits + remainingCredits,
          )
        : null,
    [currentCGPA, degreeClasses, totalCredits, remainingCredits],
  );

  const projection = useMemo(
    () =>
      projectBestWorstCase(
        currentCGPA,
        totalCredits,
        remainingCredits,
        scale,
        degreeClasses,
      ),
    [currentCGPA, totalCredits, remainingCredits, scale, degreeClasses],
  );

  const stats = useMemo(() => {
    const gpas = semesterData.map((s) => s.gpa).filter((g) => g > 0);
    const totalCourses = semesters.reduce(
      (sum, sem) => sum + sem.courses.length,
      0,
    );

    return {
      highest: gpas.length > 0 ? Math.max(...gpas) : 0,
      lowest: gpas.length > 0 ? Math.min(...gpas) : 0,
      average:
        gpas.length > 0
          ? parseFloat((gpas.reduce((a, b) => a + b, 0) / gpas.length).toFixed(2))
          : 0,
      totalCourses,
      totalCredits,
      semesterCount: semesters.length,
    };
  }, [semesterData, semesters, totalCredits]);

  const overallTrend = useMemo(() => {
    if (trends.length < 2) return 'stable' as const;
    const last = trends[trends.length - 1];
    return last.trend;
  }, [trends]);

  const riskColors: Record<string, string> = {
    safe: 'bg-success/10 text-success border-success/40',
    warning: 'bg-warning/10 text-warning border-warning/40',
    danger: 'bg-warning/10 text-warning border-warning/40',
    critical: 'bg-destructive/10 text-destructive border-destructive/40',
  };

  const riskIcons: Record<string, React.ReactNode> = {
    safe: <Shield className="w-6 h-6 text-green-600" />,
    warning: <AlertTriangle className="w-6 h-6 text-yellow-600" />,
    danger: <AlertTriangle className="w-6 h-6 text-orange-600" />,
    critical: <AlertTriangle className="w-6 h-6 text-red-600" />,
  };

  const trendIcon =
    overallTrend === 'improving' ? (
      <TrendingUp className="w-5 h-5 text-success" />
    ) : overallTrend === 'declining' ? (
      <TrendingDown className="w-5 h-5 text-destructive" />
    ) : (
      <Minus className="w-5 h-5 text-foreground-muted" />
    );

  const trendLabel =
    overallTrend === 'improving'
      ? 'Improving'
      : overallTrend === 'declining'
        ? 'Declining'
        : 'Stable';

  const trendColor =
    overallTrend === 'improving'
      ? 'text-success'
      : overallTrend === 'declining'
        ? 'text-destructive'
        : 'text-foreground-muted';

  const hasSemesters = semesters.length > 0;

  return (
    <motion.div
      variants={staggerContainer}
      initial="hidden"
      animate="show"
      className="space-y-10"
    >
      <motion.div variants={fadeUpItem}>
        <Card className="rounded-xl border border-border bg-surface p-4 shadow-md md:p-6">
          <div>
            <motion.div whileHover={{ x: -4 }} whileTap={{ scale: 0.98 }}>
              <Button
                variant="ghost"
                className="mb-4"
                onClick={() => setLocation('/')}
              >
                <ArrowLeft className="w-4 h-4 mr-2" />
                Back to Dashboard
              </Button>
            </motion.div>
            <div className="flex items-center gap-3">
              <div className="min-w-0">
                <h1 className="text-xl font-bold sm:text-3xl md:text-4xl">
                  Academic Analytics
                </h1>
                <p className="mt-1 text-sm text-foreground-muted sm:text-base">
                  Deep insights into your academic performance
                </p>
              </div>
            </div>
          </div>
        </Card>
      </motion.div>

      <div className="space-y-10">
        {!hasSemesters ? (
          <motion.div variants={fadeUpItem}>
            <Card className="rounded-xl border border-border bg-surface p-4 text-center shadow-md md:p-6">
              <p className="text-foreground-muted text-lg">
                Add semesters and courses on the dashboard to see your analytics.
              </p>
              <motion.div whileHover={{ scale: 1.03 }} whileTap={{ scale: 0.97 }} className="mt-4 inline-block">
                <Button onClick={() => setLocation('/')}>
                  Go to Dashboard
                </Button>
              </motion.div>
            </Card>
          </motion.div>
        ) : (
          <>
            <motion.div variants={fadeUpItem}>
              <Card className="rounded-xl border border-border bg-surface p-4 shadow-md md:p-6">
                <div className="flex items-center gap-3">
                  <motion.div
                    initial={{ scale: 0 }}
                    animate={{ scale: 1 }}
                    transition={{ type: "spring", stiffness: 300, damping: 15, delay: 0.2 }}
                  >
                    {trendIcon}
                  </motion.div>
                  <div>
                    <h2 className="text-lg font-bold text-foreground">
                      Overall Trend
                    </h2>
                    <p className={`text-sm font-semibold ${trendColor}`}>
                      Your performance is <span className="lowercase">{trendLabel}</span>
                    </p>
                  </div>
                </div>
              </Card>
            </motion.div>

            <motion.div variants={fadeUpItem}>
              <Card className="rounded-xl border border-border bg-surface p-4 shadow-md">
                <h2 className="mb-4 flex items-center gap-2 text-xl font-bold text-foreground">
                  <BarChart3 className="h-4 w-4 text-primary" />
                  Performance Trends
                </h2>
                {trends.length > 0 ? (
                  <ResponsiveContainer width="100%" height={220}>
                    <LineChart data={trends}>
                      <CartesianGrid strokeDasharray="3 3" stroke={CHART_THEME.grid} />
                      <XAxis
                        dataKey="semester"
                        tick={{ fill: CHART_THEME.axis, fontSize: 12 }}
                        axisLine={{ stroke: CHART_THEME.grid }}
                        tickLine={{ stroke: CHART_THEME.grid }}
                      />
                      <YAxis
                        domain={[0, scale]}
                        tick={{ fill: CHART_THEME.axis, fontSize: 12 }}
                        axisLine={{ stroke: CHART_THEME.grid }}
                        tickLine={{ stroke: CHART_THEME.grid }}
                      />
                      <Tooltip
                        contentStyle={{
                          backgroundColor: CHART_THEME.tooltipBg,
                          color: CHART_THEME.tooltipText,
                          border: `1px solid ${CHART_THEME.grid}`,
                          borderRadius: '0.5rem',
                        }}
                        labelStyle={{ color: CHART_THEME.tooltipText, fontWeight: 600 }}
                        itemStyle={{ color: CHART_THEME.comparisonBar }}
                      />
                      <Legend wrapperStyle={{ color: 'var(--foreground-muted)', fontSize: 12 }} />
                      <Line
                        type="monotone"
                        dataKey="gpa"
                        name="Semester GPA"
                        stroke={CHART_THEME.semesterLine}
                        strokeWidth={2}
                        dot={{ r: 5, fill: CHART_THEME.semesterLine, strokeWidth: 0 }}
                        activeDot={{ r: 6, fill: CHART_THEME.semesterLine }}
                      />
                      <Line
                        type="monotone"
                        dataKey="cgpa"
                        name="Cumulative CGPA"
                        stroke={CHART_THEME.cumulativeLine}
                        strokeWidth={2}
                        dot={{ r: 5, fill: CHART_THEME.cumulativeLine, strokeWidth: 0 }}
                        activeDot={{ r: 7, fill: CHART_THEME.cumulativeLine }}
                      />
                    </LineChart>
                  </ResponsiveContainer>
                ) : (
                  <p className="py-8 text-center text-foreground-muted">
                    Not enough data for trends yet.
                  </p>
                )}
              </Card>
            </motion.div>
            <motion.div variants={fadeUpItem}>
              <Card className="rounded-xl border border-border bg-surface p-4 shadow-md">
                <h2 className="mb-4 flex items-center gap-2 text-xl font-bold text-foreground">
                  <BarChart3 className="h-4 w-4 text-primary" />
                  Semester Comparison
                </h2>
                {semesterComparisonData.length > 0 ? (
                  <ResponsiveContainer width="100%" height={220}>
                    <BarChart data={semesterComparisonData}>
                      <CartesianGrid strokeDasharray="3 3" stroke={CHART_THEME.grid} />
                      <XAxis
                        dataKey="semester"
                        tick={{ fill: CHART_THEME.axis, fontSize: 12 }}
                        axisLine={{ stroke: CHART_THEME.grid }}
                        tickLine={{ stroke: CHART_THEME.grid }}
                      />
                      <YAxis
                        domain={[0, scale]}
                        tick={{ fill: CHART_THEME.axis, fontSize: 12 }}
                        axisLine={{ stroke: CHART_THEME.grid }}
                        tickLine={{ stroke: CHART_THEME.grid }}
                      />
                      <Tooltip
                        contentStyle={{
                          backgroundColor: CHART_THEME.tooltipBg,
                          color: CHART_THEME.tooltipText,
                          border: `1px solid ${CHART_THEME.grid}`,
                          borderRadius: '0.5rem',
                        }}
                        labelStyle={{ color: CHART_THEME.tooltipText, fontWeight: 600 }}
                        itemStyle={{ color: CHART_THEME.comparisonBar }}
                      />
                      <Legend wrapperStyle={{ color: 'var(--foreground-muted)', fontSize: 12 }} />
                      <Bar dataKey="gpa" name="Semester GPA" fill={CHART_THEME.comparisonBar} radius={[6, 6, 0, 0]} />
                      <Bar dataKey={() => scale} name="Target/Max" fill={CHART_THEME.comparisonBar} fillOpacity={0.2} radius={[6, 6, 0, 0]} />
                    </BarChart>
                  </ResponsiveContainer>
                ) : (
                  <p className="py-8 text-center text-foreground-muted">Not enough semester data yet.</p>
                )}
              </Card>
            </motion.div>

            {riskAssessment && (
              <motion.div variants={fadeUpItem}>
                <Card className="rounded-xl border border-border bg-surface p-4 shadow-md md:p-6">
                  <h2 className="mb-4 text-xl font-bold text-foreground">
                    Degree Risk Assessment
                  </h2>
                  <motion.div
                    initial={{ opacity: 0, x: -16 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: 0.3, type: "spring", stiffness: 200 }}
                    className={`rounded-lg border p-4 flex items-start gap-4 ${riskColors[riskAssessment.level]}`}
                  >
                    {riskIcons[riskAssessment.level]}
                    <div>
                      <p className="font-bold capitalize">
                        {riskAssessment.level} — {riskAssessment.currentClass}
                      </p>
                      <p className="text-sm mt-1">{riskAssessment.message}</p>
                      {riskAssessment.cgpaToNextClassUp !== null && (
                        <p className="text-sm mt-1">
                          {riskAssessment.cgpaToNextClassUp.toFixed(2)} GPA points
                          to reach the next class up
                        </p>
                      )}
                    </div>
                  </motion.div>
                </Card>
              </motion.div>
            )}

            <motion.div variants={fadeUpItem}>
              <Card className="rounded-xl border border-border bg-surface p-4 shadow-md md:p-6">
                <h2 className="mb-4 text-xl font-bold text-foreground">
                  Best / Worst Case Projection
                </h2>
                <div className="mb-6 max-w-xs">
                  <Label htmlFor="remaining-credits">Remaining Credits</Label>
                  <Input
                    id="remaining-credits"
                    type="number"
                    min={0}
                    value={remainingCredits}
                    onChange={(e) =>
                      setRemainingCredits(Math.max(0, Number(e.target.value)))
                    }
                    className="mt-1"
                  />
                </div>
                <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
                  <motion.div
                    whileHover={{ scale: 1.03, y: -4 }}
                    className="rounded-lg border border-success/40 bg-success/10 p-4 text-center transition-all duration-200 hover:shadow-[0_0_16px_-2px_var(--success)/0.2]"
                  >
                    <TrendingUp className="mx-auto mb-2 h-6 w-6 text-success" />
                    <p className="text-sm font-medium text-success">
                      Best Case
                    </p>
                    <p className="text-2xl font-bold text-foreground">
                      {projection.bestCase.cgpa.toFixed(2)}
                    </p>
                    <p className="text-sm text-success">
                      {projection.bestCase.degreeClass}
                    </p>
                  </motion.div>
                  <motion.div
                    whileHover={{ scale: 1.03, y: -4 }}
                    className="rounded-lg border border-primary/40 bg-primary/10 p-4 text-center transition-all duration-200 hover:shadow-[0_0_16px_-2px_var(--primary)/0.2]"
                  >
                    <Target className="mx-auto mb-2 h-6 w-6 text-primary" />
                    <p className="text-sm font-medium text-primary">
                      Current
                    </p>
                    <p className="text-2xl font-bold text-foreground">
                      {projection.currentCase.cgpa.toFixed(2)}
                    </p>
                    <p className="text-sm text-primary">
                      {projection.currentCase.degreeClass}
                    </p>
                  </motion.div>
                  <motion.div
                    whileHover={{ scale: 1.03, y: -4 }}
                    className="rounded-lg border border-destructive/40 bg-destructive/10 p-4 text-center transition-all duration-200 hover:shadow-[0_0_16px_-2px_var(--destructive)/0.2]"
                  >
                    <TrendingDown className="mx-auto mb-2 h-6 w-6 text-destructive" />
                    <p className="text-sm font-medium text-destructive">
                      Worst Case
                    </p>
                    <p className="text-2xl font-bold text-foreground">
                      {projection.worstCase.cgpa.toFixed(2)}
                    </p>
                    <p className="text-sm text-destructive">
                      {projection.worstCase.degreeClass}
                    </p>
                  </motion.div>
                </div>
              </Card>
            </motion.div>

            <motion.div variants={fadeUpItem}>
              <Card className="rounded-xl border border-border bg-surface p-4 shadow-md md:p-6">
                <h2 className="mb-4 text-xl font-bold text-foreground">
                  Performance Summary
                </h2>
                <div className="grid grid-cols-2 gap-4 md:grid-cols-3">
                  <motion.div
                    whileHover={{ scale: 1.05, y: -2 }}
                    className="rounded-lg bg-primary/10 p-4 text-center transition-all duration-200 hover:shadow-[0_0_12px_-2px_var(--primary)/0.15]"
                  >
                    <p className="text-sm font-medium text-primary">
                      Highest GPA
                    </p>
                    <p className="text-2xl font-bold text-foreground">
                      {stats.highest.toFixed(2)}
                    </p>
                  </motion.div>
                  <motion.div
                    whileHover={{ scale: 1.05, y: -2 }}
                    className="rounded-lg bg-destructive/10 p-4 text-center transition-all duration-200 hover:shadow-[0_0_12px_-2px_var(--destructive)/0.15]"
                  >
                    <p className="text-sm font-medium text-destructive">
                      Lowest GPA
                    </p>
                    <p className="text-2xl font-bold text-foreground">
                      {stats.lowest.toFixed(2)}
                    </p>
                  </motion.div>
                  <motion.div
                    whileHover={{ scale: 1.05, y: -2 }}
                    className="rounded-lg bg-accent/10 p-4 text-center transition-all duration-200 hover:shadow-[0_0_12px_-2px_var(--accent)/0.15]"
                  >
                    <p className="text-sm font-medium text-accent">
                      Average GPA
                    </p>
                    <p className="text-2xl font-bold text-foreground">
                      {stats.average.toFixed(2)}
                    </p>
                  </motion.div>
                  <motion.div
                    whileHover={{ scale: 1.05, y: -2 }}
                    className="rounded-lg bg-warning/10 p-4 text-center transition-all duration-200 hover:shadow-[0_0_12px_-2px_var(--warning)/0.15]"
                  >
                    <p className="text-sm font-medium text-warning">
                      Total Courses
                    </p>
                    <p className="text-2xl font-bold text-foreground">
                      {stats.totalCourses}
                    </p>
                  </motion.div>
                  <motion.div
                    whileHover={{ scale: 1.05, y: -2 }}
                    className="rounded-lg bg-success/10 p-4 text-center transition-all duration-200 hover:shadow-[0_0_12px_-2px_var(--success)/0.15]"
                  >
                    <p className="text-sm font-medium text-success">
                      Credits Completed
                    </p>
                    <p className="text-2xl font-bold text-foreground">
                      {stats.totalCredits}
                    </p>
                  </motion.div>
                  <motion.div
                    whileHover={{ scale: 1.05, y: -2 }}
                    className="rounded-lg bg-surface-elevated p-4 text-center transition-all duration-200"
                  >
                    <p className="text-sm font-medium text-foreground-muted">
                      Semesters
                    </p>
                    <p className="text-2xl font-bold text-foreground">
                      {stats.semesterCount}
                    </p>
                  </motion.div>
                </div>
              </Card>
            </motion.div>

            {trends.length > 1 && (
              <motion.div variants={fadeUpItem}>
                <Card className="rounded-xl border border-border bg-surface p-4 shadow-md md:p-6">
                  <h2 className="mb-4 text-xl font-bold text-foreground">
                    Semester-by-Semester Trends
                  </h2>
                  <motion.div
                    initial="hidden"
                    animate="show"
                    variants={{
                      hidden: {},
                      show: { transition: { staggerChildren: 0.05 } },
                    }}
                    className="space-y-3"
                  >
                    {trends.map((t) => (
                      <motion.div
                        key={t.semester}
                        variants={{
                          hidden: { opacity: 0, x: -12 },
                          show: { opacity: 1, x: 0, transition: { type: "spring", stiffness: 200, damping: 24 } },
                        }}
                        whileHover={{ x: 4, backgroundColor: 'var(--surface-elevated)' }}
                        className="flex flex-col gap-2 rounded-lg border p-3 transition-colors sm:flex-row sm:items-center sm:justify-between"
                      >
                        <div className="flex items-center gap-2 min-w-0">
                          {t.trend === 'improving' ? (
                            <TrendingUp className="w-4 h-4 shrink-0 text-success" />
                          ) : t.trend === 'declining' ? (
                            <TrendingDown className="w-4 h-4 shrink-0 text-destructive" />
                          ) : (
                            <Minus className="w-4 h-4 shrink-0 text-foreground-subtle" />
                          )}
                          <span className="truncate font-medium text-foreground">
                            {t.semester}
                          </span>
                        </div>
                        <div className="flex flex-wrap items-center gap-x-3 gap-y-1 text-sm">
                          <span className="whitespace-nowrap text-foreground-muted">
                            GPA: <strong>{t.gpa.toFixed(2)}</strong>
                          </span>
                          <span className="whitespace-nowrap text-foreground-muted">
                            CGPA: <strong>{t.cgpa.toFixed(2)}</strong>
                          </span>
                          {t.improvementMarker && (
                             <span className="whitespace-nowrap text-xs text-success">
                               {t.improvementMarker}
                             </span>
                          )}
                        </div>
                      </motion.div>
                    ))}
                  </motion.div>
                </Card>
              </motion.div>
            )}
          </>
        )}
      </div>
    </motion.div>
  );
}
