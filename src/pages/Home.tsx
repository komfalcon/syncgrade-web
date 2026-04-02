import { useState, useMemo } from 'react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import {
  Plus, Trash2, BarChart3, Target, GraduationCap,
  RefreshCw, BookOpen, Scale, Download, TrendingUp,
  TrendingDown, Minus, Shield, AlertTriangle, BarChart2,
} from 'lucide-react';
import { useCGPA } from '@/hooks/useCGPA';
import SemesterCard from '@/components/SemesterCard';
import CGPAOverview from '@/components/CGPAOverview';
import AddSemesterDialog from '@/components/AddSemesterDialog';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, LineChart, Line } from 'recharts';
import { useLocation } from 'wouter';
import { analyzePerformanceTrends, assessDegreeRisk } from '@/engine/calculations';
import { DEFAULT_NIGERIAN_DEGREE_CLASSES } from '@/universities/types';
import { useUniversities } from '@/hooks/useUniversities';
import ShareProgress from '@/components/ShareProgress';
import { useGpaScale } from '@/contexts/GpaScaleContext';
import { getClassification } from '@/utils/gpaLogic';

const POLYTECHNIC_CRITICAL_CGPA = 2.0;
const UNIVERSITY_OR_COLLEGE_WITHDRAWAL_CGPA = 1.0;
const UNIVERSITY_OR_COLLEGE_PROBATION_CGPA = 1.5;

/**
 * Design Philosophy: Vibrant Data Dashboard
 * - Teal (#0891b2) to Cyan (#06b6d4) gradient primary colors
 * - Animated counters and progress indicators
 * - Interactive semester cards with color-coded GPA status
 * - Data visualization with charts
 * - Poppins typography for modern, energetic feel
 * - Generous spacing and depth with shadows
 */

export default function Home() {
  const cgpa = useCGPA();
  const [showAddSemester, setShowAddSemester] = useState(false);
  const [expandedSemesterId, setExpandedSemesterId] = useState<string | null>(null);
  const [, setLocation] = useLocation();
  const { universities } = useUniversities();
  const scale = useGpaScale();
  const chartTheme = useMemo(
    () => ({
      axis: "hsl(var(--muted-foreground))",
      grid: "hsl(var(--border))",
      tooltipBg: "hsl(var(--card))",
      tooltipText: "hsl(var(--card-foreground))",
      line: "hsl(var(--chart-2))",
      bar: "hsl(var(--chart-1))",
      dot: "hsl(var(--chart-1))",
    }),
    [],
  );

  // Prepare data for charts
  const chartData = cgpa.semesters.map(semester => ({
    name: semester.name,
    gpa: cgpa.semesterGPAs[semester.id] || 0,
    courses: semester.courses.length,
  }));

  const semesterNames = cgpa.semesters.map(s => s.name);
  const activeUniversityConfig = useMemo(
    () => universities.find((u) => u.shortName === cgpa.settings.activeUniversity),
    [universities, cgpa.settings.activeUniversity],
  );
  const standingAlert = useMemo(() => {
    if (!activeUniversityConfig) return null;
    const institutionType = activeUniversityConfig.type;
    if (institutionType === 'polytechnic') {
      if (cgpa.currentCGPA < POLYTECHNIC_CRITICAL_CGPA) {
        return {
          level: 'critical' as const,
          title: 'Standing: Critical Risk',
          message: `Your CGPA (${cgpa.currentCGPA.toFixed(2)}) is below ${POLYTECHNIC_CRITICAL_CGPA.toFixed(2)} for ${activeUniversityConfig.shortName}.`,
          cardClass: 'border-red-300 bg-red-50',
          iconClass: 'text-red-700',
          textClass: 'text-red-800',
          titleClass: 'text-red-900',
          linkClass: 'text-red-900 hover:text-red-700',
        };
      }
      return null;
    }

    if (cgpa.currentCGPA < UNIVERSITY_OR_COLLEGE_WITHDRAWAL_CGPA) {
      return {
        level: 'critical' as const,
        title: 'Standing: Withdrawal Risk',
        message: `Your CGPA (${cgpa.currentCGPA.toFixed(2)}) is below ${UNIVERSITY_OR_COLLEGE_WITHDRAWAL_CGPA.toFixed(2)} for ${activeUniversityConfig.shortName}.`,
        cardClass: 'border-red-300 bg-red-50',
        iconClass: 'text-red-700',
        textClass: 'text-red-800',
        titleClass: 'text-red-900',
        linkClass: 'text-red-900 hover:text-red-700',
      };
    }

    if (cgpa.currentCGPA < UNIVERSITY_OR_COLLEGE_PROBATION_CGPA) {
      return {
        level: 'warning' as const,
        title: 'Standing: Probation Risk',
        message: `Your CGPA (${cgpa.currentCGPA.toFixed(2)}) is below ${UNIVERSITY_OR_COLLEGE_PROBATION_CGPA.toFixed(2)} for ${activeUniversityConfig.shortName}.`,
        cardClass: 'border-amber-300 bg-amber-50',
        iconClass: 'text-amber-700',
        textClass: 'text-amber-800',
        titleClass: 'text-amber-900',
        linkClass: 'text-amber-900 hover:text-amber-700',
      };
    }
    return null;
  }, [activeUniversityConfig, cgpa.currentCGPA]);

  const handleClearAll = () => {
    if (window.confirm('Are you sure you want to clear all data? This cannot be undone.')) {
      cgpa.clearAllData();
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-cyan-50 to-slate-50">
      {/* Hero Section */}
      <div
        className="relative overflow-hidden bg-gradient-to-r from-cyan-600 via-teal-600 to-cyan-500 text-white py-16 md:py-24"
        style={{
          backgroundImage: `url('/assets/hero-background.svg')`,
          backgroundSize: 'cover',
          backgroundPosition: 'center',
        }}
      >
        <div className="absolute inset-0 bg-black/30"></div>
        <div className="relative container mx-auto px-4 text-center">
          <h1 className="text-4xl md:text-5xl font-bold mb-4 drop-shadow-lg">SyncGrade</h1>
          <p className="text-lg md:text-xl text-cyan-50 drop-shadow-md max-w-2xl mx-auto">
            Track your academic performance across semesters and achieve your GPA goals
          </p>
        </div>
      </div>

      {/* Main Content */}
      <div className="container mx-auto px-4 py-12">
        {/* Overview Cards */}
        <CGPAOverview cgpa={cgpa} />

        <div className="mb-8">
          {cgpa.semesters.length > 0 ? (
            <details>
              <summary className="cursor-pointer list-none">
                <div className="mb-4">
                  <ShareProgress cgpa={cgpa.currentCGPA} totalCredits={cgpa.totalCredits} />
                </div>
              </summary>
            </details>
          ) : null}
        </div>

        {/* Degree Risk Warning */}
        {cgpa.semesters.length > 0 && (() => {
          const degreeClasses = activeUniversityConfig?.degreeClasses ?? DEFAULT_NIGERIAN_DEGREE_CLASSES;
          const risk = assessDegreeRisk(cgpa.currentCGPA, degreeClasses, cgpa.totalCredits, 150);
           const currentClass = getClassification(cgpa.currentCGPA, scale).label;
          const riskColors = {
            safe: 'from-green-500 to-emerald-600',
            warning: 'from-yellow-500 to-amber-600',
            danger: 'from-orange-500 to-red-500',
            critical: 'from-red-600 to-red-800',
          };
          const riskIcons = {
            safe: <Shield className="w-5 h-5" />,
            warning: <AlertTriangle className="w-5 h-5" />,
            danger: <AlertTriangle className="w-5 h-5" />,
            critical: <AlertTriangle className="w-5 h-5" />,
          };
          return (
            <Card className="p-6 shadow-lg border-0 mb-8">
              <div className="flex items-center gap-4">
                <div className={`w-12 h-12 rounded-xl bg-gradient-to-br ${riskColors[risk.level]} flex items-center justify-center text-white shrink-0`}>
                  {riskIcons[risk.level]}
                </div>
                <div className="flex-1">
                  <div className="flex items-center gap-2">
                    <h3 className="text-lg font-bold text-slate-900">Degree Classification: {currentClass}</h3>
                    <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${
                      risk.level === 'safe' ? 'bg-green-100 text-green-700' :
                      risk.level === 'warning' ? 'bg-yellow-100 text-yellow-700' :
                      risk.level === 'danger' ? 'bg-orange-100 text-orange-700' :
                      'bg-red-100 text-red-700'
                    }`}>
                      {risk.level.toUpperCase()}
                    </span>
                  </div>
                  <p className="text-sm text-slate-600 mt-1">{risk.message}</p>
                </div>
              </div>
            </Card>
          );
        })()}

        {cgpa.semesters.length > 0 && standingAlert && activeUniversityConfig && (
          <Card className={`p-6 shadow-lg border mb-8 ${standingAlert.cardClass}`}>
            <div className="flex items-start gap-3">
              <AlertTriangle className={`w-5 h-5 mt-0.5 shrink-0 ${standingAlert.iconClass}`} />
              <div>
                <h3 className={`text-lg font-bold ${standingAlert.titleClass}`}>{standingAlert.title}</h3>
                <p className={`text-sm mt-1 ${standingAlert.textClass}`}>{standingAlert.message}</p>
                <a
                  href="/study-load-optimizer"
                  className={`inline-flex mt-2 text-sm font-semibold underline underline-offset-2 ${standingAlert.linkClass}`}
                >
                  Open Survival Guide
                </a>
              </div>
            </div>
          </Card>
        )}

        {/* Semesters Section */}
        <div className="mb-12">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-2xl font-bold text-slate-900">Your Semesters</h2>
            <Button
              onClick={() => setShowAddSemester(true)}
              className="bg-gradient-to-r from-cyan-600 to-teal-600 hover:from-cyan-700 hover:to-teal-700 text-white gap-2"
            >
              <Plus className="w-4 h-4" />
              Add Semester
            </Button>
          </div>

          {cgpa.semesters.length === 0 ? (
            <Card className="p-12 text-center border-2 border-dashed border-cyan-200 bg-cyan-50/50">
              <img
                src="/assets/empty-state-illustration.svg"
                alt="Empty state"
                className="w-48 h-48 mx-auto mb-6 object-contain"
              />
              <h3 className="text-xl font-semibold text-slate-700 mb-2">No Semesters Yet</h3>
              <p className="text-slate-600 mb-6">Start by adding your first semester to begin tracking your CGPA</p>
              <Button
                onClick={() => setShowAddSemester(true)}
                className="bg-gradient-to-r from-cyan-600 to-teal-600 hover:from-cyan-700 hover:to-teal-700 text-white"
              >
                Add Your First Semester
              </Button>
            </Card>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {cgpa.semesters.map(semester => (
                <SemesterCard
                  key={semester.id}
                  semester={semester}
                  gpa={cgpa.semesterGPAs[semester.id] || 0}
                  isExpanded={expandedSemesterId === semester.id}
                  onToggleExpand={() =>
                    setExpandedSemesterId(expandedSemesterId === semester.id ? null : semester.id)
                  }
                  onRemove={() => cgpa.removeSemester(semester.id)}
                  onAddCourse={(course) => cgpa.addCourse(semester.id, course)}
                  onUpdateCourse={(courseId: string, updates: Partial<typeof semester.courses[0]>) =>
                    cgpa.updateCourse(semester.id, courseId, updates)
                  }
                  onRemoveCourse={(courseId: string) => cgpa.removeCourse(semester.id, courseId)}
                  gpaScale={scale}
                  semesterNames={semesterNames}
                />
              ))}
            </div>
          )}
        </div>

        {/* Primary Trend Graph */}
        {chartData.length > 0 && (
          <Card className="p-6 shadow-lg border-0 mb-12">
            <h3 className="text-lg font-semibold text-slate-900 mb-4">Primary Trend: GPA Progression</h3>
            <ResponsiveContainer width="100%" height={300}>
              <LineChart data={chartData}>
                <CartesianGrid strokeDasharray="3 3" stroke={chartTheme.grid} />
                <XAxis dataKey="name" stroke={chartTheme.axis} />
                <YAxis domain={[0, scale]} stroke={chartTheme.axis} />
                <Tooltip
                  contentStyle={{
                    backgroundColor: chartTheme.tooltipBg,
                    color: chartTheme.tooltipText,
                    border: `1px solid ${chartTheme.grid}`,
                    borderRadius: '0.5rem',
                  }}
                />
                <Line
                  type="monotone"
                  dataKey="gpa"
                  stroke={chartTheme.line}
                  strokeWidth={3}
                  dot={{ fill: chartTheme.dot, r: 6 }}
                  activeDot={{ r: 8, fill: chartTheme.line }}
                />
              </LineChart>
            </ResponsiveContainer>
          </Card>
        )}

        {/* Tools & Insights */}
        <Card className="p-6 shadow-lg border mb-12 bg-background/95">
          <h2 className="text-2xl font-bold text-slate-900 mb-6">Tools & Insights</h2>

          <div className="space-y-8">
            <section>
              <h3 className="text-lg font-semibold text-slate-900 mb-4">Prediction Tools</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                <Card className="p-5 min-h-12 shadow-lg border-0 cursor-pointer hover:shadow-xl transition-all group" onClick={() => setLocation('/grade-predictor')}>
                  <div className="flex items-center gap-3">
                    <div className="w-12 h-12 rounded-lg bg-gradient-to-br from-cyan-500 to-teal-600 flex items-center justify-center text-white shrink-0">
                      <Target className="w-5 h-5" />
                    </div>
                    <div>
                      <h4 className="font-bold text-slate-900 group-hover:text-cyan-600 transition-colors">Grade Predictor</h4>
                      <p className="text-xs text-slate-500">Plan your target CGPA</p>
                    </div>
                  </div>
                </Card>
                <Card className="p-5 min-h-12 shadow-lg border-0 cursor-pointer hover:shadow-xl transition-all group" onClick={() => setLocation('/carryover-simulator')}>
                  <div className="flex items-center gap-3">
                    <div className="w-12 h-12 rounded-lg bg-gradient-to-br from-orange-500 to-red-500 flex items-center justify-center text-white shrink-0">
                      <RefreshCw className="w-5 h-5" />
                    </div>
                    <div>
                      <h4 className="font-bold text-slate-900 group-hover:text-cyan-600 transition-colors">Carryover Simulator</h4>
                      <p className="text-xs text-slate-500">Retake impact analysis</p>
                    </div>
                  </div>
                </Card>
                <Card className="p-5 min-h-12 shadow-lg border-0 cursor-pointer hover:shadow-xl transition-all group" onClick={() => setLocation('/study-load-optimizer')}>
                  <div className="flex items-center gap-3">
                    <div className="w-12 h-12 rounded-lg bg-gradient-to-br from-indigo-500 to-blue-600 flex items-center justify-center text-white shrink-0">
                      <BookOpen className="w-5 h-5" />
                    </div>
                    <div>
                      <h4 className="font-bold text-slate-900 group-hover:text-cyan-600 transition-colors">Study Load</h4>
                      <p className="text-xs text-slate-500">Optimize your schedule</p>
                    </div>
                  </div>
                </Card>
              </div>
            </section>

            <section>
              <h3 className="text-lg font-semibold text-slate-900 mb-4">Comparison Tools</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                <Card className="p-5 min-h-12 shadow-lg border-0 cursor-pointer hover:shadow-xl transition-all group" onClick={() => setLocation('/nigerian-universities')}>
                  <div className="flex items-center gap-3">
                    <div className="w-12 h-12 rounded-lg bg-gradient-to-br from-green-500 to-emerald-600 flex items-center justify-center text-white shrink-0">
                      <GraduationCap className="w-5 h-5" />
                    </div>
                    <div>
                      <h4 className="font-bold text-slate-900 group-hover:text-cyan-600 transition-colors">🇳🇬 Universities</h4>
                      <p className="text-xs text-slate-500">Apply grading systems</p>
                    </div>
                  </div>
                </Card>
                <Card className="p-5 min-h-12 shadow-lg border-0 cursor-pointer hover:shadow-xl transition-all group" onClick={() => setLocation('/university-comparison')}>
                  <div className="flex items-center gap-3">
                    <div className="w-12 h-12 rounded-lg bg-gradient-to-br from-emerald-500 to-teal-600 flex items-center justify-center text-white shrink-0">
                      <Scale className="w-5 h-5" />
                    </div>
                    <div>
                      <h4 className="font-bold text-slate-900 group-hover:text-cyan-600 transition-colors">Compare Unis</h4>
                      <p className="text-xs text-slate-500">Side-by-side comparison</p>
                    </div>
                  </div>
                </Card>
                <Card className="p-5 min-h-12 shadow-lg border-0 cursor-pointer hover:shadow-xl transition-all group" onClick={() => setLocation('/analytics')}>
                  <div className="flex items-center gap-3">
                    <div className="w-12 h-12 rounded-lg bg-gradient-to-br from-purple-500 to-violet-600 flex items-center justify-center text-white shrink-0">
                      <BarChart2 className="w-5 h-5" />
                    </div>
                    <div>
                      <h4 className="font-bold text-slate-900 group-hover:text-cyan-600 transition-colors">Analytics</h4>
                      <p className="text-xs text-slate-500">Performance insights</p>
                    </div>
                  </div>
                </Card>
              </div>
            </section>

            <section>
              <h3 className="text-lg font-semibold text-slate-900 mb-4">Backup/Export</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                <Card className="p-5 min-h-12 shadow-lg border-0 cursor-pointer hover:shadow-xl transition-all group" onClick={() => setLocation('/backup-restore')}>
                  <div className="flex items-center gap-3">
                    <div className="w-12 h-12 rounded-lg bg-gradient-to-br from-slate-500 to-gray-600 flex items-center justify-center text-white shrink-0">
                      <Download className="w-5 h-5" />
                    </div>
                    <div>
                      <h4 className="font-bold text-slate-900 group-hover:text-cyan-600 transition-colors">Backup & Restore</h4>
                      <p className="text-xs text-slate-500">Export/import data</p>
                    </div>
                  </div>
                </Card>
              </div>
            </section>

            <section>
              <h3 className="text-lg font-semibold text-slate-900 mb-4">Secondary Graphs</h3>
              <div className="space-y-6">
                {cgpa.semesters.length >= 2 && (() => {
                  const trendData = analyzePerformanceTrends(
                    cgpa.semesters.map(s => ({
                      name: s.name,
                      gpa: cgpa.semesterGPAs[s.id] || 0,
                      credits: s.courses.reduce((sum, c) => sum + c.credits, 0),
                    }))
                  );
                  return (
                    <Card className="p-6 shadow-lg border-0">
                      <h4 className="text-base font-semibold text-slate-900 mb-4 flex items-center gap-2">
                        <BarChart3 className="w-5 h-5 text-cyan-600" />
                        Performance Timeline
                      </h4>
                      <div className="flex flex-wrap gap-3">
                        {trendData.map((t, i) => (
                          <div key={i} className="flex items-center gap-2 bg-slate-50 rounded-lg px-3 py-2">
                            <div className="text-xs font-medium text-slate-500">{t.semester}</div>
                            <div className="font-bold text-slate-900">{t.gpa.toFixed(2)}</div>
                            {t.trend === 'improving' && <TrendingUp className="w-4 h-4 text-green-500" />}
                            {t.trend === 'declining' && <TrendingDown className="w-4 h-4 text-red-500" />}
                            {t.trend === 'stable' && <Minus className="w-4 h-4 text-slate-400" />}
                            {t.improvementMarker && (
                              <span className="text-xs text-green-600 font-medium">{t.improvementMarker}</span>
                            )}
                          </div>
                        ))}
                      </div>
                    </Card>
                  );
                })()}

                {chartData.length > 0 && (
                  <Card className="p-6 shadow-lg border-0">
                    <h4 className="text-base font-semibold text-slate-900 mb-4 flex items-center gap-2">
                      <BarChart3 className="w-5 h-5 text-cyan-600" />
                      Semester GPA Comparison
                    </h4>
                    <ResponsiveContainer width="100%" height={300}>
                      <BarChart data={chartData}>
                        <CartesianGrid strokeDasharray="3 3" stroke={chartTheme.grid} />
                        <XAxis dataKey="name" stroke={chartTheme.axis} />
                        <YAxis domain={[0, scale]} stroke={chartTheme.axis} />
                        <Tooltip
                          contentStyle={{
                            backgroundColor: chartTheme.tooltipBg,
                            color: chartTheme.tooltipText,
                            border: `1px solid ${chartTheme.grid}`,
                            borderRadius: '0.5rem',
                          }}
                        />
                        <Bar dataKey="gpa" fill={chartTheme.bar} radius={[8, 8, 0, 0]} />
                      </BarChart>
                    </ResponsiveContainer>
                  </Card>
                )}
              </div>
            </section>
          </div>
        </Card>

        {/* Action Buttons */}
        {cgpa.semesters.length > 0 && (
          <div className="flex justify-center gap-4 mb-8">
            <Button
              onClick={handleClearAll}
              variant="outline"
              className="text-red-600 border-red-200 hover:bg-red-50"
            >
              <Trash2 className="w-4 h-4 mr-2" />
              Clear All Data
            </Button>
          </div>
        )}
      </div>

      {/* Add Semester Dialog */}
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
