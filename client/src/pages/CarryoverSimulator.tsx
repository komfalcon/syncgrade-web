import { useState, useMemo } from 'react';
import { useLocation } from 'wouter';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectTrigger,
  SelectValue,
  SelectContent,
  SelectItem,
} from '@/components/ui/select';
import { ArrowLeft, Plus, Trash2, RefreshCw } from 'lucide-react';
import { toast } from 'sonner';
import { useCGPA } from '@/hooks/useCGPA';
import { carryoverImpact } from '@/engine/calculations';
import { getAllUniversities } from '@/universities/nigeria';
import {
  DEFAULT_NIGERIAN_GRADES,
  DEFAULT_NIGERIAN_DEGREE_CLASSES,
} from '@/universities/types';
import type { GradeRange, DegreeClass } from '@/universities/types';
import type { CarryoverImpactResult } from '@/engine/types';

interface FailedCourse {
  name: string;
  credits: number;
  originalGrade: string;
  newGrade: string;
}

const EMPTY_COURSE: FailedCourse = {
  name: '',
  credits: 3,
  originalGrade: '',
  newGrade: '',
};

function getDegreeClass(cgpa: number, classes: DegreeClass[]): string {
  for (const dc of classes) {
    if (cgpa >= dc.minCGPA && cgpa <= dc.maxCGPA) return dc.name;
  }
  return 'N/A';
}

export default function CarryoverSimulator() {
  const { currentCGPA, totalCredits, settings } = useCGPA();
  const [, setLocation] = useLocation();
  const [courses, setCourses] = useState<FailedCourse[]>([{ ...EMPTY_COURSE }]);
  const [result, setResult] = useState<CarryoverImpactResult | null>(null);

  const universityConfig = useMemo(() => {
    if (settings.activeUniversity) {
      return getAllUniversities().find(
        (u) => u.shortName === settings.activeUniversity,
      ) ?? null;
    }
    return null;
  }, [settings.activeUniversity]);

  const grades: GradeRange[] = useMemo(
    () => universityConfig?.gradingSystem.grades ?? DEFAULT_NIGERIAN_GRADES,
    [universityConfig],
  );

  const degreeClasses: DegreeClass[] = useMemo(
    () => universityConfig?.degreeClasses ?? DEFAULT_NIGERIAN_DEGREE_CLASSES,
    [universityConfig],
  );

  const repeatPolicy: 'replace' | 'average' | 'both' = useMemo(
    () => universityConfig?.repeatPolicy?.method ?? 'replace',
    [universityConfig],
  );

  const updateCourse = (index: number, field: keyof FailedCourse, value: string | number) => {
    setCourses((prev) => {
      const updated = [...prev];
      updated[index] = { ...updated[index], [field]: value };
      return updated;
    });
    setResult(null);
  };

  const addCourse = () => {
    setCourses((prev) => [...prev, { ...EMPTY_COURSE }]);
  };

  const removeCourse = (index: number) => {
    setCourses((prev) => {
      if (prev.length <= 1) return prev;
      return prev.filter((_, i) => i !== index);
    });
    setResult(null);
  };

  const handleSimulate = () => {
    if (totalCredits <= 0) {
      toast.error('No semester data available. Add courses first.');
      return;
    }

    const invalid = courses.some(
      (c) => !c.name.trim() || c.credits <= 0 || !c.originalGrade || !c.newGrade,
    );
    if (invalid) {
      toast.error('Please fill in all fields for every course.');
      return;
    }

    const impact = carryoverImpact(currentCGPA, totalCredits, courses, grades, repeatPolicy);
    setResult(impact);
    toast.success('Simulation complete!');
  };

  const policyLabel: Record<string, string> = {
    replace: 'Grade Replacement – old grade is fully replaced',
    average: 'Grade Averaging – old & new grades are averaged',
    both: 'Both Counted – new attempt added alongside old',
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 p-4 md:p-8">
      <div className="mx-auto max-w-4xl space-y-6">
        {/* Header */}
        <div className="rounded-2xl bg-gradient-to-r from-orange-500 to-amber-500 p-6 text-white shadow-lg">
          <div className="flex items-center gap-3">
            <Button
              variant="ghost"
              size="icon"
              className="text-white hover:bg-white/20"
              onClick={() => setLocation('/')}
            >
              <ArrowLeft className="h-5 w-5" />
            </Button>
            <div>
              <h1 className="text-2xl font-bold md:text-3xl">🔄 Carryover Impact Simulator</h1>
              <p className="mt-1 text-sm text-orange-100">
                See how retaking failed courses affects your CGPA
              </p>
            </div>
          </div>
        </div>

        {/* Current Status */}
        <Card className="p-6">
          <h2 className="mb-4 text-lg font-semibold">📊 Current Status</h2>
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
            <div className="rounded-lg bg-teal-50 p-4 text-center">
              <p className="text-sm text-gray-500">Current CGPA</p>
              <p className="text-2xl font-bold text-teal-700">
                {totalCredits > 0 ? currentCGPA.toFixed(2) : '—'}
              </p>
            </div>
            <div className="rounded-lg bg-cyan-50 p-4 text-center">
              <p className="text-sm text-gray-500">Total Credits</p>
              <p className="text-2xl font-bold text-cyan-700">{totalCredits}</p>
            </div>
            <div className="rounded-lg bg-orange-50 p-4 text-center">
              <p className="text-sm text-gray-500">Repeat Policy</p>
              <p className="text-lg font-semibold capitalize text-orange-700">{repeatPolicy}</p>
              <p className="mt-1 text-xs text-gray-500">{policyLabel[repeatPolicy]}</p>
            </div>
          </div>
        </Card>

        {/* Failed Courses Form */}
        <Card className="p-6">
          <div className="mb-4 flex items-center justify-between">
            <h2 className="text-lg font-semibold">📝 Failed Courses to Retake</h2>
            <Button variant="outline" size="sm" onClick={addCourse}>
              <Plus className="mr-1 h-4 w-4" /> Add Course
            </Button>
          </div>

          <div className="space-y-4">
            {courses.map((course, index) => (
              <div
                key={index}
                className="rounded-lg border border-gray-200 bg-gray-50/50 p-4"
              >
                <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-5">
                  <div className="lg:col-span-1">
                    <Label htmlFor={`name-${index}`}>Course Name</Label>
                    <Input
                      id={`name-${index}`}
                      placeholder="e.g. MTH 101"
                      value={course.name}
                      onChange={(e) => updateCourse(index, 'name', e.target.value)}
                    />
                  </div>
                  <div>
                    <Label htmlFor={`credits-${index}`}>Credits</Label>
                    <Input
                      id={`credits-${index}`}
                      type="number"
                      min={1}
                      max={20}
                      value={course.credits}
                      onChange={(e) =>
                        updateCourse(index, 'credits', Math.max(1, Number(e.target.value)))
                      }
                    />
                  </div>
                  <div>
                    <Label>Original Grade</Label>
                    <Select
                      value={course.originalGrade}
                      onValueChange={(val) => updateCourse(index, 'originalGrade', val)}
                    >
                      <SelectTrigger id={`orig-${index}`}>
                        <SelectValue placeholder="Grade" />
                      </SelectTrigger>
                      <SelectContent>
                        {grades.map((g) => (
                          <SelectItem key={g.grade} value={g.grade}>
                            {g.grade} ({g.points.toFixed(1)} pts)
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div>
                    <Label>New Expected Grade</Label>
                    <Select
                      value={course.newGrade}
                      onValueChange={(val) => updateCourse(index, 'newGrade', val)}
                    >
                      <SelectTrigger id={`new-${index}`}>
                        <SelectValue placeholder="Grade" />
                      </SelectTrigger>
                      <SelectContent>
                        {grades.map((g) => (
                          <SelectItem key={g.grade} value={g.grade}>
                            {g.grade} ({g.points.toFixed(1)} pts)
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="flex items-end">
                    <Button
                      variant="ghost"
                      size="icon"
                      className="text-red-500 hover:bg-red-50 hover:text-red-700"
                      onClick={() => removeCourse(index)}
                      disabled={courses.length <= 1}
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              </div>
            ))}
          </div>

          <Button className="mt-6 w-full" onClick={handleSimulate}>
            <RefreshCw className="mr-2 h-4 w-4" /> Simulate Impact
          </Button>
        </Card>

        {/* Results */}
        {result && (
          <Card className="p-6">
            <h2 className="mb-4 text-lg font-semibold">📈 Simulation Results</h2>

            <div className="mb-6 grid grid-cols-1 gap-4 sm:grid-cols-3">
              <div className="rounded-lg bg-gray-50 p-4 text-center">
                <p className="text-sm text-gray-500">Current CGPA</p>
                <p className="text-2xl font-bold text-gray-700">
                  {result.currentCGPA.toFixed(2)}
                </p>
                <p className="mt-1 text-xs text-gray-500">
                  {getDegreeClass(result.currentCGPA, degreeClasses)}
                </p>
              </div>
              <div className="rounded-lg bg-teal-50 p-4 text-center">
                <p className="text-sm text-gray-500">Projected CGPA</p>
                <p className="text-2xl font-bold text-teal-700">
                  {result.projectedCGPA.toFixed(2)}
                </p>
                <p className="mt-1 text-xs text-gray-500">
                  {getDegreeClass(result.projectedCGPA, degreeClasses)}
                </p>
              </div>
              <div
                className={`rounded-lg p-4 text-center ${
                  result.cgpaChange > 0
                    ? 'bg-green-50'
                    : result.cgpaChange < 0
                      ? 'bg-red-50'
                      : 'bg-gray-50'
                }`}
              >
                <p className="text-sm text-gray-500">CGPA Change</p>
                <p
                  className={`text-2xl font-bold ${
                    result.cgpaChange > 0
                      ? 'text-green-600'
                      : result.cgpaChange < 0
                        ? 'text-red-600'
                        : 'text-gray-600'
                  }`}
                >
                  {result.cgpaChange > 0 ? '+' : ''}
                  {result.cgpaChange.toFixed(3)}
                </p>
              </div>
            </div>

            {/* New Degree Class */}
            <div className="mb-6 rounded-lg border border-teal-200 bg-teal-50/50 p-4 text-center">
              <p className="text-sm text-gray-500">New Projected Degree Class</p>
              <p className="text-xl font-bold text-teal-700">
                {getDegreeClass(result.projectedCGPA, degreeClasses)}
              </p>
            </div>

            {/* Per-course Analysis Table */}
            {result.coursesAnalyzed.length > 0 && (
              <div className="overflow-x-auto">
                <table className="w-full text-left text-sm">
                  <thead>
                    <tr className="border-b text-gray-500">
                      <th className="pb-2 pr-4">Course</th>
                      <th className="pb-2 pr-4">Credits</th>
                      <th className="pb-2 pr-4">Original</th>
                      <th className="pb-2 pr-4">New</th>
                      <th className="pb-2">Impact</th>
                    </tr>
                  </thead>
                  <tbody>
                    {result.coursesAnalyzed.map((c, i) => (
                      <tr key={i} className="border-b last:border-0">
                        <td className="py-2 pr-4 font-medium">{c.name}</td>
                        <td className="py-2 pr-4">{c.credits}</td>
                        <td className="py-2 pr-4">
                          {c.originalGrade}{' '}
                          <span className="text-gray-400">({c.originalPoints.toFixed(1)})</span>
                        </td>
                        <td className="py-2 pr-4">
                          {c.newGrade}{' '}
                          <span className="text-gray-400">({c.newPoints.toFixed(1)})</span>
                        </td>
                        <td
                          className={`py-2 font-semibold ${
                            c.creditImpact > 0
                              ? 'text-green-600'
                              : c.creditImpact < 0
                                ? 'text-red-600'
                                : 'text-gray-500'
                          }`}
                        >
                          {c.creditImpact > 0 ? '+' : ''}
                          {c.creditImpact.toFixed(2)}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </Card>
        )}
      </div>
    </div>
  );
}
