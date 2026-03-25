import { useState, useMemo, useCallback, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { ArrowLeft, Target, Plus, Trash2, Save, Clock } from 'lucide-react';
import { useLocation } from 'wouter';
import { useCGPA } from '@/hooks/useCGPA';
import { toast } from 'sonner';
import { projectCGPA, simulateWhatIf } from '@/engine/calculations';
import { DEFAULT_NIGERIAN_DEGREE_CLASSES } from '@/universities/types';
import { DEFAULT_MAX_SEMESTER_UNITS } from '@shared/const';
import { getStoredValue, setStoredValue, STORAGE_KEYS } from '@/storage/db';
import { useUniversities } from '@/hooks/useUniversities';

const MAX_WHAT_IF_COURSES = 20;

interface PredictionResult {
  requiredGPA: number;
  letterGrade: string;
  verdict: string;
  verdictIcon: string;
  isAchievable: boolean;
}

interface WhatIfCourse {
  id: string;
  name: string;
  credits: number;
  gradePoint: number;
}

interface SavedPrediction {
  id: string;
  timestamp: number;
  currentCGPA: number;
  completedCredits: number;
  targetCGPA: number;
  remainingCredits: number;
  requiredGPA: number;
  verdict: string;
}

export default function GradePredictor() {
  const [, setLocation] = useLocation();
  const cgpa = useCGPA();
  const { universities } = useUniversities();
  const scale = cgpa.settings.gpaScale;
  const universityConfig = useMemo(
    () =>
      universities.find(
        (u) => u.shortName === cgpa.settings.activeUniversity,
      ) ?? null,
    [cgpa.settings.activeUniversity, universities],
  );
  const maxSemesterUnits =
    universityConfig?.creditRules.maximumPerSemester ?? DEFAULT_MAX_SEMESTER_UNITS;

  // Section 1 - Current Standing
  const [currentCGPAInput, setCurrentCGPAInput] = useState(
    cgpa.currentCGPA > 0 ? cgpa.currentCGPA.toString() : ''
  );
  const [completedCredits, setCompletedCredits] = useState(
    cgpa.totalCredits > 0 ? cgpa.totalCredits.toString() : ''
  );
  const [targetCGPA, setTargetCGPA] = useState('');
  const [remainingCredits, setRemainingCredits] = useState('');

  // Results
  const [result, setResult] = useState<PredictionResult | null>(null);
  const [hasCalculated, setHasCalculated] = useState(false);

  // What-If courses
  const [whatIfCourses, setWhatIfCourses] = useState<WhatIfCourse[]>([
    { id: '1', name: 'Course 1', credits: 3, gradePoint: scale },
  ]);

  // Saved predictions
  const [savedPredictions, setSavedPredictions] = useState<SavedPrediction[]>([]);

  useEffect(() => {
    let active = true;
    (async () => {
      try {
        const saved = await getStoredValue(STORAGE_KEYS.predictions);
        if (!active) return;
        setSavedPredictions(saved ? (JSON.parse(saved) as SavedPrediction[]) : []);
      } catch {
        if (active) setSavedPredictions([]);
      }
    })();
    return () => {
      active = false;
    };
  }, []);

  useEffect(() => {
    void setStoredValue(STORAGE_KEYS.predictions, JSON.stringify(savedPredictions));
  }, [savedPredictions]);

  const getLetterGrade = useCallback(
    (gpa: number): string => {
      const ranges = cgpa.settings.gradeRanges;
      // Find the grade whose points is closest to (but not less than) the GPA
      // Ranges are sorted descending by points
      const sorted = [...ranges].sort((a, b) => b.points - a.points);
      for (const range of sorted) {
        if (gpa >= range.points) {
          return range.grade;
        }
      }
      // If GPA is below all grade points, return the lowest grade
      return sorted.length > 0 ? sorted[sorted.length - 1].grade : 'F';
    },
    [cgpa.settings.gradeRanges]
  );

  const getVerdict = useCallback(
    (requiredGPA: number): { verdict: string; icon: string; achievable: boolean } => {
      if (requiredGPA > scale) {
        return {
          verdict: 'Impossible',
          icon: '❌',
          achievable: false,
        };
      }
      if (requiredGPA <= scale * 0.6) {
        return { verdict: 'Achievable', icon: '✅', achievable: true };
      }
      if (requiredGPA <= scale * 0.8) {
        return { verdict: 'Challenging', icon: '⚠️', achievable: true };
      }
      return { verdict: 'Very Difficult', icon: '🔴', achievable: true };
    },
    [scale]
  );

  const handleCalculate = () => {
    const current = parseFloat(currentCGPAInput);
    const completed = parseFloat(completedCredits);
    const target = parseFloat(targetCGPA);
    const remaining = parseFloat(remainingCredits);

    if (isNaN(current) || isNaN(completed) || isNaN(target) || isNaN(remaining) || remaining <= 0) {
      toast.error('Please fill in all fields with valid numbers');
      return;
    }

    if (remaining > maxSemesterUnits) {
      toast.error(`Remaining units cannot exceed ${maxSemesterUnits} for this university.`);
      return;
    }

    const projection = projectCGPA(
      current,
      Math.round(completed),
      target,
      Math.round(remaining),
      scale,
    );
    const { verdict, icon, achievable } = getVerdict(projection.requiredGPA);

    setResult({
      requiredGPA: projection.requiredGPA,
      letterGrade: getLetterGrade(projection.requiredGPA),
      verdict,
      verdictIcon: icon,
      isAchievable: achievable,
    });
    setHasCalculated(true);
  };

  const handleSavePrediction = () => {
    if (!result) return;
    const prediction: SavedPrediction = {
      id: Date.now().toString(),
      timestamp: Date.now(),
      currentCGPA: parseFloat(currentCGPAInput),
      completedCredits: parseFloat(completedCredits),
      targetCGPA: parseFloat(targetCGPA),
      remainingCredits: parseFloat(remainingCredits),
      requiredGPA: result.requiredGPA,
      verdict: `${result.verdictIcon} ${result.verdict}`,
    };
    const updated = [prediction, ...savedPredictions];
    setSavedPredictions(updated);
    toast.success('Prediction saved!');
  };

  const handleDeletePrediction = (id: string) => {
    const updated = savedPredictions.filter(p => p.id !== id);
    setSavedPredictions(updated);
  };

  // Uniform distribution table
  const uniformRows = useMemo(() => {
    const target = parseFloat(targetCGPA);
    const completed = parseFloat(completedCredits);
    const remaining = parseFloat(remainingCredits);
    if (isNaN(target) || isNaN(completed) || isNaN(remaining) || remaining <= 0) return [];

    const current = parseFloat(currentCGPAInput);
    if (isNaN(current)) return [];

    const offsets = [-0.4, -0.2, 0, 0.2, 0.4];

    return offsets.map(offset => {
      const t = Math.max(0, Math.min(scale, target + offset));
      const projection = projectCGPA(
        current,
        Math.round(completed),
        t,
        Math.round(remaining),
        scale,
      );
      const { verdict, icon } = getVerdict(projection.requiredGPA);
      return {
        target: t.toFixed(2),
        requiredGPA: projection.requiredGPA.toFixed(2),
        grade: getLetterGrade(projection.requiredGPA),
        verdict: `${icon} ${verdict}`,
        isTarget: offset === 0,
      };
    });
  }, [targetCGPA, completedCredits, remainingCredits, currentCGPAInput, scale, getVerdict, getLetterGrade]);

  // What-If predicted CGPA
  const predictedCGPA = useMemo(() => {
    const current = parseFloat(currentCGPAInput);
    const completed = parseFloat(completedCredits);
    if (isNaN(current) || isNaN(completed)) return null;

    const totalWhatIfUnits = whatIfCourses.reduce((sum, c) => sum + c.credits, 0);
    if (totalWhatIfUnits > maxSemesterUnits) return null;

    const grades = cgpa.settings.gradeRanges;
    const result = simulateWhatIf(
      current,
      Math.round(completed),
      {
        semesterName: 'What-If',
        courses: whatIfCourses.map((c) => ({
          name: c.name,
          credits: Math.round(c.credits),
          grade:
            grades.find((g) => g.points === c.gradePoint)?.grade ??
            grades[grades.length - 1]?.grade ??
            'F',
        })),
      },
      grades,
      universityConfig?.degreeClasses ?? DEFAULT_NIGERIAN_DEGREE_CLASSES,
    );
    return result.projectedCGPA;
  }, [currentCGPAInput, completedCredits, whatIfCourses, cgpa.settings.gradeRanges, universityConfig, maxSemesterUnits]);

  const getCGPAColor = (gpa: number | null) => {
    if (gpa === null) return 'text-slate-600';
    if (gpa >= scale * 0.74) return 'text-emerald-600';
    if (gpa >= scale * 0.6) return 'text-amber-600';
    return 'text-red-600';
  };

  const addWhatIfCourse = () => {
    if (whatIfCourses.length >= MAX_WHAT_IF_COURSES) return;
    const currentUnits = whatIfCourses.reduce((sum, c) => sum + c.credits, 0);
    if (currentUnits + 3 > maxSemesterUnits) {
      toast.error(`Cannot exceed ${maxSemesterUnits} units.`);
      return;
    }
    setWhatIfCourses(prev => [
      ...prev,
      {
        id: Date.now().toString(),
        name: `Course ${prev.length + 1}`,
        credits: 3,
        gradePoint: scale,
      },
    ]);
  };

  const updateWhatIfCourse = (id: string, updates: Partial<WhatIfCourse>) => {
    setWhatIfCourses((prev) => {
      const next = prev.map((c) => (c.id === id ? { ...c, ...updates } : c));
      const totalUnits = next.reduce((sum, c) => sum + c.credits, 0);
      if (totalUnits > maxSemesterUnits) {
        toast.error(`What-if course load cannot exceed ${maxSemesterUnits} units.`);
        return prev;
      }
      return next;
    });
  };

  const removeWhatIfCourse = (id: string) => {
    setWhatIfCourses(prev => prev.filter(c => c.id !== id));
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-cyan-50 to-slate-50">
      {/* Header */}
      <div className="bg-gradient-to-r from-cyan-600 via-teal-600 to-cyan-500 text-white py-12">
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
            <Target className="w-8 h-8" />
            <div>
              <h1 className="text-3xl md:text-4xl font-bold">Grade Predictor</h1>
              <p className="text-cyan-100 mt-1">Plan your target CGPA</p>
            </div>
          </div>
        </div>
      </div>

      <div className="container mx-auto px-4 py-8">
        {/* Section 1: Current Standing */}
        <Card className="p-6 shadow-lg border-0 mb-6">
          <h2 className="text-xl font-bold text-slate-900 mb-4">Current Standing</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="grid gap-2">
              <Label htmlFor="current-cgpa">Current CGPA</Label>
              <Input
                id="current-cgpa"
                type="number"
                min="0"
                max={scale}
                step="0.01"
                placeholder={`0.00 - ${scale.toFixed(2)}`}
                value={currentCGPAInput}
                onChange={e => setCurrentCGPAInput(e.target.value)}
              />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="completed-credits">Total Credit Units Completed</Label>
              <Input
                id="completed-credits"
                type="number"
                min="0"
                step="1"
                placeholder="e.g., 60"
                value={completedCredits}
                onChange={e => setCompletedCredits(e.target.value)}
              />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="target-cgpa">Target CGPA</Label>
              <Input
                id="target-cgpa"
                type="number"
                min="0"
                max={scale}
                step="0.01"
                placeholder={`0.00 - ${scale.toFixed(2)}`}
                value={targetCGPA}
                onChange={e => setTargetCGPA(e.target.value)}
              />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="remaining-credits">Remaining Credit Units</Label>
              <Input
                id="remaining-credits"
                type="number"
                min="1"
                step="1"
                placeholder="e.g., 30"
                value={remainingCredits}
                onChange={e => setRemainingCredits(e.target.value)}
              />
              <p className="text-xs text-slate-500">
                Max per semester: {maxSemesterUnits} units
              </p>
            </div>
          </div>
        </Card>

        {/* Section 2: Calculate Button */}
        <Button
          className="w-full bg-gradient-to-r from-cyan-600 to-teal-600 hover:from-cyan-700 hover:to-teal-700 text-white text-lg py-6 mb-6"
          onClick={handleCalculate}
        >
          Calculate Required GPA
        </Button>

        {/* Section 3: Results */}
        {hasCalculated && result && (
          <Card className="p-6 shadow-lg border-0 mb-6">
            <Tabs defaultValue="summary">
              <TabsList className="w-full mb-4">
                <TabsTrigger value="summary" className="flex-1">Summary</TabsTrigger>
                <TabsTrigger value="uniform" className="flex-1">Uniform Distribution</TabsTrigger>
                <TabsTrigger value="whatif" className="flex-1">Interactive What-If</TabsTrigger>
              </TabsList>

              {/* View 1: Summary */}
              <TabsContent value="summary">
                <div className="space-y-4">
                  <div className="rounded-lg border border-slate-200 p-6 bg-slate-50">
                    <p className="text-slate-600 mb-1">
                      To achieve a CGPA of <span className="font-bold text-cyan-600">{targetCGPA}</span>:
                    </p>
                    <p className="text-2xl font-bold text-slate-900 mb-2">
                      You need an average GPA of:{' '}
                      <span className="font-mono text-cyan-600">{result.requiredGPA.toFixed(2)}</span>
                    </p>
                    <p className="text-slate-600 mb-4">
                      That's approximately: <span className="font-bold">{result.letterGrade}</span> in all remaining courses
                    </p>
                    <div
                      className={`inline-flex items-center gap-2 rounded-full px-4 py-2 text-sm font-semibold ${
                        result.verdict === 'Achievable'
                          ? 'bg-emerald-100 text-emerald-700'
                          : result.verdict === 'Challenging'
                            ? 'bg-amber-100 text-amber-700'
                            : result.verdict === 'Very Difficult'
                              ? 'bg-red-100 text-red-700'
                              : 'bg-slate-100 text-slate-700'
                      }`}
                    >
                      {result.verdictIcon} {result.verdict}
                    </div>
                    {!result.isAchievable && (
                      <p className="text-sm text-red-600 mt-3">
                        This target is not mathematically achievable. Consider adjusting your target CGPA.
                      </p>
                    )}
                  </div>

                  <Button
                    variant="outline"
                    className="gap-2"
                    onClick={handleSavePrediction}
                  >
                    <Save className="w-4 h-4" />
                    Save Prediction
                  </Button>
                </div>
              </TabsContent>

              {/* View 2: Uniform Distribution */}
              <TabsContent value="uniform">
                <div>
                  <p className="text-sm text-slate-600 mb-4">
                    If you score uniformly across all remaining courses:
                  </p>
                  <div className="overflow-x-auto">
                    <table className="w-full text-sm">
                      <thead>
                        <tr className="border-b border-slate-200">
                          <th className="text-left py-2 pr-4 text-slate-600 font-semibold">Target CGPA</th>
                          <th className="text-left py-2 pr-4 text-slate-600 font-semibold">Required GPA</th>
                          <th className="text-left py-2 pr-4 text-slate-600 font-semibold">Grade</th>
                          <th className="text-left py-2 text-slate-600 font-semibold">Verdict</th>
                        </tr>
                      </thead>
                      <tbody>
                        {uniformRows.map((row, i) => (
                          <tr
                            key={i}
                            className={`border-b border-slate-100 ${row.isTarget ? 'bg-cyan-50 font-semibold' : ''}`}
                          >
                            <td className="py-2 pr-4 font-mono">{row.target}</td>
                            <td className="py-2 pr-4 font-mono text-cyan-600">{row.requiredGPA}</td>
                            <td className="py-2 pr-4 font-mono">{row.grade}</td>
                            <td className="py-2">{row.verdict}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              </TabsContent>

              {/* View 3: Interactive What-If */}
              <TabsContent value="whatif">
                <div>
                  {/* Live predicted CGPA */}
                  <div className="rounded-lg border border-slate-200 p-4 bg-slate-50 mb-4">
                    <div className="flex items-center justify-between">
                      <p className="text-sm font-semibold text-slate-600">Predicted Final CGPA:</p>
                      <span className={`gpa-value ${getCGPAColor(predictedCGPA)}`}>
                        {predictedCGPA !== null ? predictedCGPA.toFixed(2) : '—'}
                      </span>
                    </div>
                    <p className="mt-1 text-xs text-slate-500">
                      Load cap: {maxSemesterUnits} units
                    </p>
                  </div>

                  {/* Course rows */}
                  <div className="space-y-3 mb-4">
                    {whatIfCourses.map(course => (
                      <div
                        key={course.id}
                        className="flex items-center gap-3 p-3 rounded-lg border border-slate-200 bg-white"
                      >
                        <Input
                          className="flex-1 min-w-0"
                          value={course.name}
                          onChange={e => updateWhatIfCourse(course.id, { name: e.target.value })}
                          placeholder="Course Name"
                        />
                        <Input
                          className="w-20"
                          type="number"
                          min="0.5"
                          max="12"
                          step="0.5"
                          value={course.credits}
                          onChange={e =>
                            updateWhatIfCourse(course.id, { credits: parseFloat(e.target.value) || 0 })
                          }
                          placeholder="Credits"
                        />
                        <select
                          className="flex h-9 rounded-md border border-input bg-transparent px-3 py-1 text-sm shadow-xs focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
                          value={course.gradePoint}
                          onChange={e =>
                            updateWhatIfCourse(course.id, { gradePoint: parseFloat(e.target.value) })
                          }
                        >
                          {cgpa.settings.gradeRanges.map(range => (
                            <option key={range.grade} value={range.points}>
                              {range.grade} ({range.points.toFixed(1)})
                            </option>
                          ))}
                        </select>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => removeWhatIfCourse(course.id)}
                          className="text-red-600 hover:bg-red-50 shrink-0"
                          disabled={whatIfCourses.length <= 1}
                        >
                          <Trash2 className="w-4 h-4" />
                        </Button>
                      </div>
                    ))}
                  </div>

                  <Button
                    variant="outline"
                    className="w-full gap-2"
                    onClick={addWhatIfCourse}
                    disabled={whatIfCourses.length >= MAX_WHAT_IF_COURSES}
                  >
                    <Plus className="w-4 h-4" />
                    Add Course ({whatIfCourses.length}/{MAX_WHAT_IF_COURSES})
                  </Button>
                </div>
              </TabsContent>
            </Tabs>
          </Card>
        )}

        {/* Saved Predictions History */}
        {savedPredictions.length > 0 && (
          <Card className="p-6 shadow-lg border-0">
            <div className="flex items-center gap-2 mb-4">
              <Clock className="w-5 h-5 text-cyan-600" />
              <h2 className="text-xl font-bold text-slate-900">Prediction History</h2>
            </div>
            <div className="space-y-3">
              {savedPredictions.map(prediction => (
                <div
                  key={prediction.id}
                  className="flex items-center justify-between p-4 rounded-lg border border-slate-200 bg-slate-50"
                >
                  <div>
                    <p className="text-sm text-slate-500">
                      {new Date(prediction.timestamp).toLocaleDateString()} at{' '}
                      {new Date(prediction.timestamp).toLocaleTimeString()}
                    </p>
                    <p className="font-semibold text-slate-900">
                      Target: {prediction.targetCGPA.toFixed(2)} → Required GPA:{' '}
                      <span className="font-mono text-cyan-600">{prediction.requiredGPA.toFixed(2)}</span>
                    </p>
                    <p className="text-sm text-slate-600">
                      Current: {prediction.currentCGPA.toFixed(2)} | Completed: {prediction.completedCredits} |
                      Remaining: {prediction.remainingCredits} | {prediction.verdict}
                    </p>
                  </div>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => handleDeletePrediction(prediction.id)}
                    className="text-red-600 hover:bg-red-50 shrink-0"
                  >
                    <Trash2 className="w-4 h-4" />
                  </Button>
                </div>
              ))}
            </div>
          </Card>
        )}
      </div>
    </div>
  );
}
