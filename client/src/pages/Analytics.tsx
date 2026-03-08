import { useState, useMemo } from 'react';
import { useLocation } from 'wouter';
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
} from 'lucide-react';
import {
  ResponsiveContainer,
  LineChart,
  Line,
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
import { getAllUniversities } from '@/universities/nigeria';
import { DEFAULT_NIGERIAN_DEGREE_CLASSES } from '@/universities/types';

export default function Analytics() {
  const { semesters, currentCGPA, totalCredits, semesterGPAs, settings } =
    useCGPA();
  const [, setLocation] = useLocation();
  const [remainingCredits, setRemainingCredits] = useState(60);

  const scale = settings.gpaScale;

  // Resolve degree classes from the active university or use defaults
  const degreeClasses = useMemo(() => {
    if (settings.activeUniversity) {
      const config = getAllUniversities().find(
        (u) => u.shortName === settings.activeUniversity,
      );
      if (config) return config.degreeClasses;
    }
    return DEFAULT_NIGERIAN_DEGREE_CLASSES;
  }, [settings.activeUniversity]);

  // Build semester data for the engine
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

  // Summary statistics
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

  // Overall trend direction
  const overallTrend = useMemo(() => {
    if (trends.length < 2) return 'stable' as const;
    const last = trends[trends.length - 1];
    return last.trend;
  }, [trends]);

  const riskColors: Record<string, string> = {
    safe: 'bg-green-100 text-green-800 border-green-300',
    warning: 'bg-yellow-100 text-yellow-800 border-yellow-300',
    danger: 'bg-orange-100 text-orange-800 border-orange-300',
    critical: 'bg-red-100 text-red-800 border-red-300',
  };

  const riskIcons: Record<string, React.ReactNode> = {
    safe: <Shield className="w-6 h-6 text-green-600" />,
    warning: <AlertTriangle className="w-6 h-6 text-yellow-600" />,
    danger: <AlertTriangle className="w-6 h-6 text-orange-600" />,
    critical: <AlertTriangle className="w-6 h-6 text-red-600" />,
  };

  const trendIcon =
    overallTrend === 'improving' ? (
      <TrendingUp className="w-5 h-5 text-green-600" />
    ) : overallTrend === 'declining' ? (
      <TrendingDown className="w-5 h-5 text-red-600" />
    ) : (
      <Minus className="w-5 h-5 text-slate-500" />
    );

  const trendLabel =
    overallTrend === 'improving'
      ? 'Improving'
      : overallTrend === 'declining'
        ? 'Declining'
        : 'Stable';

  const trendColor =
    overallTrend === 'improving'
      ? 'text-green-600'
      : overallTrend === 'declining'
        ? 'text-red-600'
        : 'text-slate-600';

  const hasSemesters = semesters.length > 0;

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-purple-50 to-slate-50">
      {/* Header */}
      <div className="bg-gradient-to-r from-purple-600 via-violet-600 to-purple-500 text-white py-12">
        <div className="container mx-auto px-4">
          <Button
            variant="ghost"
            className="text-white hover:bg-white/20 mb-4"
            onClick={() => setLocation('/')}
          >
            <ArrowLeft className="w-4 h-4 mr-2" />
            Back to Dashboard
          </Button>
          <div className="flex items-center gap-3">
            <span className="text-3xl">📊</span>
            <div>
              <h1 className="text-3xl md:text-4xl font-bold">
                Academic Analytics
              </h1>
              <p className="text-purple-100 mt-1">
                Deep insights into your academic performance
              </p>
            </div>
          </div>
        </div>
      </div>

      <div className="container mx-auto px-4 py-12 space-y-8">
        {!hasSemesters ? (
          <Card className="p-12 text-center shadow-lg border-0">
            <p className="text-slate-500 text-lg">
              Add semesters and courses on the dashboard to see your analytics.
            </p>
            <Button
              className="mt-4"
              onClick={() => setLocation('/')}
            >
              Go to Dashboard
            </Button>
          </Card>
        ) : (
          <>
            {/* Trend Indicator */}
            <Card className="p-6 shadow-lg border-0">
              <div className="flex items-center gap-3">
                {trendIcon}
                <div>
                  <h2 className="text-lg font-bold text-slate-900">
                    Overall Trend
                  </h2>
                  <p className={`text-sm font-semibold ${trendColor}`}>
                    Your performance is <span className="lowercase">{trendLabel}</span>
                  </p>
                </div>
              </div>
            </Card>

            {/* Performance Trends Chart */}
            <Card className="p-6 shadow-lg border-0">
              <h2 className="text-xl font-bold text-slate-900 mb-4">
                Performance Trends
              </h2>
              {trends.length > 0 ? (
                <ResponsiveContainer width="100%" height={320}>
                  <LineChart data={trends}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="semester" fontSize={12} />
                    <YAxis domain={[0, scale]} fontSize={12} />
                    <Tooltip />
                    <Legend />
                    <Line
                      type="monotone"
                      dataKey="gpa"
                      name="Semester GPA"
                      stroke="#8b5cf6"
                      strokeWidth={2}
                      dot={{ r: 4 }}
                      activeDot={{ r: 6 }}
                    />
                    <Line
                      type="monotone"
                      dataKey="cgpa"
                      name="Cumulative CGPA"
                      stroke="#06b6d4"
                      strokeWidth={2}
                      dot={{ r: 4 }}
                      activeDot={{ r: 6 }}
                    />
                  </LineChart>
                </ResponsiveContainer>
              ) : (
                <p className="text-slate-500 text-center py-8">
                  Not enough data for trends yet.
                </p>
              )}
            </Card>

            {/* Degree Risk Assessment */}
            {riskAssessment && (
              <Card className="p-6 shadow-lg border-0">
                <h2 className="text-xl font-bold text-slate-900 mb-4">
                  Degree Risk Assessment
                </h2>
                <div
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
                </div>
              </Card>
            )}

            {/* Best / Worst Case Projection */}
            <Card className="p-6 shadow-lg border-0">
              <h2 className="text-xl font-bold text-slate-900 mb-4">
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
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                {/* Best Case */}
                <div className="rounded-lg border border-green-300 bg-green-50 p-4 text-center">
                  <TrendingUp className="w-6 h-6 text-green-600 mx-auto mb-2" />
                  <p className="text-sm text-green-700 font-medium">
                    Best Case
                  </p>
                  <p className="text-2xl font-bold text-green-800">
                    {projection.bestCase.cgpa.toFixed(2)}
                  </p>
                  <p className="text-sm text-green-600">
                    {projection.bestCase.degreeClass}
                  </p>
                </div>

                {/* Current Case */}
                <div className="rounded-lg border border-purple-300 bg-purple-50 p-4 text-center">
                  <Target className="w-6 h-6 text-purple-600 mx-auto mb-2" />
                  <p className="text-sm text-purple-700 font-medium">
                    Current
                  </p>
                  <p className="text-2xl font-bold text-purple-800">
                    {projection.currentCase.cgpa.toFixed(2)}
                  </p>
                  <p className="text-sm text-purple-600">
                    {projection.currentCase.degreeClass}
                  </p>
                </div>

                {/* Worst Case */}
                <div className="rounded-lg border border-red-300 bg-red-50 p-4 text-center">
                  <TrendingDown className="w-6 h-6 text-red-600 mx-auto mb-2" />
                  <p className="text-sm text-red-700 font-medium">
                    Worst Case
                  </p>
                  <p className="text-2xl font-bold text-red-800">
                    {projection.worstCase.cgpa.toFixed(2)}
                  </p>
                  <p className="text-sm text-red-600">
                    {projection.worstCase.degreeClass}
                  </p>
                </div>
              </div>
            </Card>

            {/* Performance Summary Stats */}
            <Card className="p-6 shadow-lg border-0">
              <h2 className="text-xl font-bold text-slate-900 mb-4">
                Performance Summary
              </h2>
              <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                <div className="rounded-lg bg-purple-50 p-4 text-center">
                  <p className="text-sm text-purple-600 font-medium">
                    Highest GPA
                  </p>
                  <p className="text-2xl font-bold text-purple-800">
                    {stats.highest.toFixed(2)}
                  </p>
                </div>
                <div className="rounded-lg bg-red-50 p-4 text-center">
                  <p className="text-sm text-red-600 font-medium">
                    Lowest GPA
                  </p>
                  <p className="text-2xl font-bold text-red-800">
                    {stats.lowest.toFixed(2)}
                  </p>
                </div>
                <div className="rounded-lg bg-cyan-50 p-4 text-center">
                  <p className="text-sm text-cyan-600 font-medium">
                    Average GPA
                  </p>
                  <p className="text-2xl font-bold text-cyan-800">
                    {stats.average.toFixed(2)}
                  </p>
                </div>
                <div className="rounded-lg bg-amber-50 p-4 text-center">
                  <p className="text-sm text-amber-600 font-medium">
                    Total Courses
                  </p>
                  <p className="text-2xl font-bold text-amber-800">
                    {stats.totalCourses}
                  </p>
                </div>
                <div className="rounded-lg bg-emerald-50 p-4 text-center">
                  <p className="text-sm text-emerald-600 font-medium">
                    Credits Completed
                  </p>
                  <p className="text-2xl font-bold text-emerald-800">
                    {stats.totalCredits}
                  </p>
                </div>
                <div className="rounded-lg bg-violet-50 p-4 text-center">
                  <p className="text-sm text-violet-600 font-medium">
                    Semesters
                  </p>
                  <p className="text-2xl font-bold text-violet-800">
                    {stats.semesterCount}
                  </p>
                </div>
              </div>
            </Card>

            {/* Per-semester Trend Details */}
            {trends.length > 1 && (
              <Card className="p-6 shadow-lg border-0">
                <h2 className="text-xl font-bold text-slate-900 mb-4">
                  Semester-by-Semester Trends
                </h2>
                <div className="space-y-3">
                  {trends.map((t) => (
                    <div
                      key={t.semester}
                      className="flex items-center justify-between rounded-lg border p-3"
                    >
                      <div className="flex items-center gap-3">
                        {t.trend === 'improving' ? (
                          <TrendingUp className="w-4 h-4 text-green-600" />
                        ) : t.trend === 'declining' ? (
                          <TrendingDown className="w-4 h-4 text-red-600" />
                        ) : (
                          <Minus className="w-4 h-4 text-slate-400" />
                        )}
                        <span className="font-medium text-slate-900">
                          {t.semester}
                        </span>
                      </div>
                      <div className="flex items-center gap-4 text-sm">
                        <span className="text-slate-600">
                          GPA: <strong>{t.gpa.toFixed(2)}</strong>
                        </span>
                        <span className="text-slate-600">
                          CGPA: <strong>{t.cgpa.toFixed(2)}</strong>
                        </span>
                        {t.improvementMarker && (
                          <span className="text-green-600 text-xs">
                            {t.improvementMarker}
                          </span>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </Card>
            )}
          </>
        )}
      </div>
    </div>
  );
}
