import { useState, useMemo } from 'react';
import { useLocation } from 'wouter';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { ArrowLeft, BookOpen, Target, Lightbulb } from 'lucide-react';
import { toast } from 'sonner';
import { useCGPA } from '@/hooks/useCGPA';
import { recommendStudyLoad } from '@/engine/calculations';
import type { StudyLoadRecommendation } from '@/engine/types';
import { useUniversities } from '@/hooks/useUniversities';
import { resolveUniversityGradingSystem } from '@/universities/nigeria';

export default function StudyLoadOptimizer() {
  const { currentCGPA, totalCredits, settings } = useCGPA();
  const [, setLocation] = useLocation();
  const { universities } = useUniversities();

  const universityConfig = useMemo(() => {
    if (settings.activeUniversity) {
      return (
        universities.find(
          (u) => u.shortName === settings.activeUniversity,
        ) ?? null
      );
    }
    return null;
  }, [settings.activeUniversity, universities]);

  const scale = universityConfig ? resolveUniversityGradingSystem(universityConfig, settings.admissionSession).scale : 5;
  const defaultTarget =
    totalCredits > 0
      ? Math.min(parseFloat((currentCGPA + 0.5).toFixed(2)), scale)
      : Math.min(3.5, scale);

  const [targetCGPA, setTargetCGPA] = useState<number>(defaultTarget);
  const [result, setResult] = useState<StudyLoadRecommendation | null>(null);

  const handleRecommend = () => {
    if (!universityConfig) {
      toast.error('Please select a university first.');
      return;
    }
    if (totalCredits <= 0) {
      toast.error('No semester data available. Add courses first.');
      return;
    }
    if (targetCGPA <= 0 || targetCGPA > scale) {
      toast.error(`Target CGPA must be between 0 and ${scale}.`);
      return;
    }

    const recommendation = recommendStudyLoad(
      currentCGPA,
      totalCredits,
      targetCGPA,
      universityConfig,
    );
    setResult(recommendation);
    toast.success('Recommendation generated!');
  };

  // No university selected
  if (!universityConfig) {
    return (
      <div className="space-y-6">
        <div className="mx-auto max-w-4xl space-y-6">
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
                  📚 Study Load Optimizer
                </h1>
              </div>
            </div>
          </div>

          <Card className="p-8 text-center">
            <BookOpen className="mx-auto mb-4 h-12 w-12 text-indigo-400" />
            <h2 className="mb-2 text-lg font-semibold">
              No University Selected
            </h2>
            <p className="mb-4 text-sm text-foreground-muted">
              Please select a university to use the Study Load Optimizer.
            </p>
            <Button onClick={() => setLocation('/nigerian-universities')}>
              Select University
            </Button>
          </Card>
        </div>
      </div>
    );
  }

  const { creditRules } = universityConfig;

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
                📚 Study Load Optimizer
              </h1>
              <p className="mt-1 text-sm text-foreground-muted">
                Get personalized credit load recommendations for your next
                semester
              </p>
            </div>
          </div>
        </div>

        {/* Current Status */}
        <Card className="p-6">
          <h2 className="mb-4 text-lg font-semibold">📊 Current Status</h2>
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
            <div className="rounded-lg bg-indigo-50 p-4 text-center">
              <p className="text-sm text-foreground-muted">Current CGPA</p>
              <p className="text-2xl font-bold text-indigo-700">
                {totalCredits > 0 ? currentCGPA.toFixed(2) : '—'}
              </p>
            </div>
            <div className="rounded-lg bg-cyan-50 p-4 text-center">
              <p className="text-sm text-foreground-muted">Completed Credits</p>
              <p className="text-2xl font-bold text-primary">{totalCredits}</p>
            </div>
            <div className="rounded-lg bg-violet-50 p-4 text-center">
              <p className="text-sm text-foreground-muted">University</p>
              <p className="text-lg font-semibold text-violet-700">
                {universityConfig.shortName}
              </p>
            </div>
          </div>
        </Card>

        {/* Input Section */}
        <Card className="p-6">
          <h2 className="mb-4 flex items-center gap-2 text-lg font-semibold">
            <Target className="h-5 w-5 text-indigo-500" />
            Set Your Target
          </h2>
          <div className="max-w-sm space-y-3">
            <div>
              <Label htmlFor="target-cgpa">Target CGPA</Label>
              <Input
                id="target-cgpa"
                type="number"
                step={0.01}
                min={0}
                max={scale}
                value={targetCGPA}
                onChange={(e) => setTargetCGPA(parseFloat(e.target.value) || 0)}
              />
              <p className="mt-1 text-xs text-foreground-subtle">
                Scale: 0 – {scale}
              </p>
            </div>
          </div>
          <Button className="mt-6 w-full" onClick={handleRecommend}>
            <Lightbulb className="mr-2 h-4 w-4" /> Get Recommendation
          </Button>
        </Card>

        {/* Recommendation Output */}
        {result && (
          <Card className="p-6">
            <h2 className="mb-4 text-lg font-semibold">
              📋 Recommendation
            </h2>

            <div className="mb-6 grid grid-cols-1 gap-4 sm:grid-cols-3">
              <div className="rounded-lg bg-indigo-50 p-4 text-center">
                <p className="text-sm text-foreground-muted">Recommended Credits</p>
                <p className="text-2xl font-bold text-indigo-700">
                  {result.recommendedCredits}
                </p>
              </div>
              <div className="rounded-lg bg-emerald-50 p-4 text-center">
                <p className="text-sm text-foreground-muted">Target GPA This Semester</p>
                <p className="text-2xl font-bold text-emerald-700">
                  {result.targetGPA.toFixed(2)}
                </p>
              </div>
              <div className="rounded-lg bg-amber-50 p-4 text-center">
                <p className="text-sm text-foreground-muted">Number of Courses</p>
                <p className="text-2xl font-bold text-amber-700">
                  {result.courses.length}
                </p>
              </div>
            </div>

            {/* Course Plan Breakdown */}
            {result.courses.length > 0 && (
              <div className="mb-6">
                <h3 className="mb-3 text-sm font-semibold text-foreground-muted">
                  Course Plan Breakdown
                </h3>
                <div className="overflow-x-auto">
                  <table className="w-full text-left text-sm">
                    <thead>
                      <tr className="border-b text-foreground-muted">
                        <th className="pb-2 pr-4">Course #</th>
                        <th className="pb-2 pr-4">Credits</th>
                        <th className="pb-2">Minimum Grade Needed</th>
                      </tr>
                    </thead>
                    <tbody>
                      {result.courses.map((course, index) => (
                        <tr key={index} className="border-b last:border-0">
                          <td className="py-2 pr-4 font-medium">
                            Course {index + 1}
                          </td>
                          <td className="py-2 pr-4">{course.credits}</td>
                          <td className="py-2 font-semibold text-indigo-600">
                            {course.minGrade}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            )}

            {/* Reason */}
            <div className="rounded-lg border border-indigo-200 bg-indigo-50/50 p-4">
              <div className="flex items-start gap-2">
                <Lightbulb className="mt-0.5 h-4 w-4 shrink-0 text-indigo-500" />
                <p className="text-sm text-foreground">{result.reason}</p>
              </div>
            </div>
          </Card>
        )}

        {/* Credit Rules Info */}
        <Card className="p-6">
          <h2 className="mb-4 flex items-center gap-2 text-lg font-semibold">
            <BookOpen className="h-5 w-5 text-indigo-500" />
            {universityConfig.shortName} Credit Rules
          </h2>
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <div className="rounded-lg bg-surface-elevated p-4">
              <p className="text-sm text-foreground-muted">Minimum Credits / Semester</p>
              <p className="text-xl font-bold text-foreground">
                {creditRules.minimumPerSemester}
              </p>
            </div>
            <div className="rounded-lg bg-surface-elevated p-4">
              <p className="text-sm text-foreground-muted">Maximum Credits / Semester</p>
              <p className="text-xl font-bold text-foreground">
                {creditRules.maximumPerSemester}
              </p>
            </div>
          </div>
        </Card>
      </div>
    </div>
  );
}
