import { useState, useMemo } from "react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import { ArrowLeft, Scale, GraduationCap } from "lucide-react";
import { useLocation } from "wouter";
import { getDegreeClass } from "@/engine/calculations";
import type { UniversityConfig } from "@/universities/types";
import { toast } from "sonner";
import { useUniversities } from "@/hooks/useUniversities";
import { useCGPA } from "@/hooks/useCGPA";
import { resolveUniversityGradingSystem } from "@/universities/nigeria";

const SCORE_SAMPLES = [95, 85, 75, 65, 55, 45, 40, 35, 20] as const;

function getGradeForScore(score: number, uni: UniversityConfig, admissionSession: string | null) {
  const active = resolveUniversityGradingSystem(uni, admissionSession);
  const match = active.grades.find(
    (g) => score >= g.min && score <= g.max,
  );
  return match ?? null;
}

export default function UniversityComparison() {
  const [, setLocation] = useLocation();
  const { universities } = useUniversities();
  const { settings } = useCGPA();
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const [gpaInput, setGpaInput] = useState("");

  const selectedUniversities = useMemo(
    () => universities.filter((u) => selectedIds.includes(u.id)),
    [selectedIds, universities],
  );

  const toggleUniversity = (id: string) => {
    setSelectedIds((prev) => {
      if (prev.includes(id)) return prev.filter((x) => x !== id);
      if (prev.length >= 4) {
        toast.info("You can compare up to 4 universities at a time");
        return prev;
      }
      return [...prev, id];
    });
  };

  const gpaValue = parseFloat(gpaInput);
  const isGpaValid = !Number.isNaN(gpaValue) && gpaValue >= 0 && gpaValue <= 5;

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-cyan-50 to-slate-50">
      {/* Header */}
      <div className="bg-gradient-to-r from-emerald-600 via-green-600 to-emerald-500 text-white py-12">
        <div className="container mx-auto px-4">
          <Button
            variant="ghost"
            className="text-white hover:bg-white/20 mb-4"
            onClick={() => setLocation("/")}
          >
            <ArrowLeft className="w-4 h-4 mr-2" />
            Back to Dashboard
          </Button>
          <h1 className="text-3xl md:text-4xl font-bold flex items-center gap-3">
            🏫 University Comparison
          </h1>
          <p className="text-green-100 mt-2 max-w-2xl">
            Compare grading systems, degree classifications, and academic
            policies across Nigerian universities side-by-side.
          </p>
        </div>
      </div>

      <div className="container mx-auto px-4 py-8 space-y-8">
        {/* University Selection */}
        <Card className="p-6 shadow-md border-0">
          <h2 className="text-xl font-semibold mb-1 flex items-center gap-2">
            <GraduationCap className="w-5 h-5 text-emerald-600" />
            Select Universities to Compare
          </h2>
          <p className="text-sm text-muted-foreground mb-4">
            Choose 2–4 universities to see a side-by-side comparison.
          </p>
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-3">
            {universities.map((uni) => {
              const checked = selectedIds.includes(uni.id);
              return (
                <label
                  key={uni.id}
                  className={`flex items-center gap-3 rounded-lg border p-3 cursor-pointer transition-all ${
                    checked
                      ? "ring-2 ring-emerald-400 bg-emerald-50/60 border-emerald-300"
                      : "hover:bg-slate-50 border-slate-200"
                  }`}
                >
                  <Checkbox
                    checked={checked}
                    onCheckedChange={() => toggleUniversity(uni.id)}
                  />
                  <div className="min-w-0">
                    <div className="font-medium text-sm truncate">
                      {uni.shortName}
                    </div>
                    <div className="text-xs text-muted-foreground truncate">
                      {uni.name}
                    </div>
                  </div>
                </label>
              );
            })}
          </div>
        </Card>

        {selectedUniversities.length < 2 && (
          <div className="text-center py-12 text-muted-foreground">
            <Scale className="w-12 h-12 mx-auto mb-3 opacity-40" />
            <p className="text-lg font-medium">
              Select at least 2 universities above to start comparing
            </p>
          </div>
        )}

        {/* Comparison Table */}
        {selectedUniversities.length >= 2 && (
          <>
            <Card className="p-6 shadow-md border-0">
              <h2 className="text-xl font-semibold mb-4 flex items-center gap-2">
                <Scale className="w-5 h-5 text-emerald-600" />
                Academic Policy Comparison
              </h2>
              <div className="overflow-x-auto -mx-6 px-6">
                <table className="w-full text-sm min-w-[640px]">
                  <thead>
                    <tr className="border-b">
                      <th className="text-left py-3 pr-4 font-semibold text-muted-foreground w-48">
                        Attribute
                      </th>
                      {selectedUniversities.map((uni) => (
                        <th
                          key={uni.id}
                          className="text-left py-3 px-3 font-semibold"
                        >
                          <span className="inline-flex items-center rounded-md bg-emerald-100 px-2 py-0.5 text-xs font-semibold text-emerald-700 border border-emerald-200">
                            {uni.shortName}
                          </span>
                        </th>
                      ))}
                    </tr>
                  </thead>
                  <tbody className="divide-y">
                    {/* GPA Scale */}
                    <tr className="hover:bg-slate-50/60">
                      <td className="py-3 pr-4 font-medium text-muted-foreground">
                        GPA Scale
                      </td>
                      {selectedUniversities.map((uni) => (
                        <td key={uni.id} className="py-3 px-3">
                          {resolveUniversityGradingSystem(uni, settings.admissionSession).scale}.0
                        </td>
                      ))}
                    </tr>

                    {/* Grade Letters */}
                    <tr className="hover:bg-slate-50/60">
                      <td className="py-3 pr-4 font-medium text-muted-foreground">
                        Grade Letters
                      </td>
                      {selectedUniversities.map((uni) => (
                        <td key={uni.id} className="py-3 px-3">
                          {resolveUniversityGradingSystem(uni, settings.admissionSession).grades.length} (
                          {resolveUniversityGradingSystem(uni, settings.admissionSession).grades
                            .map((g) => g.grade)
                            .join(", ")}
                          )
                        </td>
                      ))}
                    </tr>

                    {/* Degree Classifications */}
                    <tr className="hover:bg-slate-50/60">
                      <td className="py-3 pr-4 font-medium text-muted-foreground align-top">
                        Degree Classifications
                      </td>
                      {selectedUniversities.map((uni) => (
                        <td key={uni.id} className="py-3 px-3">
                          <ul className="space-y-0.5">
                            {uni.degreeClasses.map((dc) => (
                              <li key={dc.name} className="text-xs">
                                <span className="font-medium">{dc.name}</span>{" "}
                                <span className="text-muted-foreground">
                                  ({dc.minCGPA}–{dc.maxCGPA})
                                </span>
                              </li>
                            ))}
                          </ul>
                        </td>
                      ))}
                    </tr>

                    {/* Credits per Semester */}
                    <tr className="hover:bg-slate-50/60">
                      <td className="py-3 pr-4 font-medium text-muted-foreground">
                        Credits / Semester
                      </td>
                      {selectedUniversities.map((uni) => (
                        <td key={uni.id} className="py-3 px-3">
                          {uni.creditRules.minimumPerSemester}–
                          {uni.creditRules.maximumPerSemester}
                        </td>
                      ))}
                    </tr>

                    {/* Repeat Policy */}
                    <tr className="hover:bg-slate-50/60">
                      <td className="py-3 pr-4 font-medium text-muted-foreground align-top">
                        Repeat Policy
                      </td>
                      {selectedUniversities.map((uni) => (
                        <td key={uni.id} className="py-3 px-3">
                          <span className="inline-flex items-center rounded-full bg-cyan-100 px-2 py-0.5 text-xs font-medium text-cyan-700 border border-cyan-200 mb-1">
                            {uni.repeatPolicy.method}
                          </span>
                          <p className="text-xs text-muted-foreground">
                            {uni.repeatPolicy.description}
                          </p>
                        </td>
                      ))}
                    </tr>

                    {/* Probation Threshold */}
                    <tr className="hover:bg-slate-50/60">
                      <td className="py-3 pr-4 font-medium text-muted-foreground align-top">
                        Probation Threshold
                      </td>
                      {selectedUniversities.map((uni) => (
                        <td key={uni.id} className="py-3 px-3">
                          <span className="font-semibold">
                            CGPA &lt; {uni.probation.minCGPA}
                          </span>
                          <p className="text-xs text-muted-foreground mt-0.5">
                            {uni.probation.description}
                          </p>
                        </td>
                      ))}
                    </tr>

                    {/* Max Program Duration */}
                    <tr className="hover:bg-slate-50/60">
                      <td className="py-3 pr-4 font-medium text-muted-foreground">
                        Max Program Duration
                      </td>
                      {selectedUniversities.map((uni) => (
                        <td key={uni.id} className="py-3 px-3">
                          {uni.maxProgramDuration}
                        </td>
                      ))}
                    </tr>
                  </tbody>
                </table>
              </div>
            </Card>

            {/* Grade System Comparison */}
            <Card className="p-6 shadow-md border-0">
              <h2 className="text-xl font-semibold mb-1 flex items-center gap-2">
                <Scale className="w-5 h-5 text-emerald-600" />
                Grade System Comparison
              </h2>
              <p className="text-sm text-muted-foreground mb-4">
                See how the same score translates across different grading
                systems.
              </p>
              <div className="overflow-x-auto -mx-6 px-6">
                <table className="w-full text-sm min-w-[640px]">
                  <thead>
                    <tr className="border-b">
                      <th className="text-left py-3 pr-4 font-semibold text-muted-foreground w-24">
                        Score
                      </th>
                      {selectedUniversities.map((uni) => (
                        <th
                          key={uni.id}
                          className="text-left py-3 px-3 font-semibold"
                        >
                          <span className="inline-flex items-center rounded-md bg-emerald-100 px-2 py-0.5 text-xs font-semibold text-emerald-700 border border-emerald-200">
                            {uni.shortName}
                          </span>
                        </th>
                      ))}
                    </tr>
                  </thead>
                  <tbody className="divide-y">
                    {SCORE_SAMPLES.map((score) => (
                      <tr key={score} className="hover:bg-slate-50/60">
                        <td className="py-2.5 pr-4 font-medium">{score}%</td>
                        {selectedUniversities.map((uni) => {
                          const match = getGradeForScore(score, uni, settings.admissionSession);
                          return (
                            <td key={uni.id} className="py-2.5 px-3">
                              {match ? (
                                <span className="flex items-center gap-2">
                                  <span className="inline-flex items-center justify-center w-7 h-7 rounded-full bg-emerald-100 text-emerald-700 font-bold text-xs">
                                    {match.grade}
                                  </span>
                                  <span className="text-muted-foreground">
                                    {match.points} pts
                                  </span>
                                </span>
                              ) : (
                                <span className="text-muted-foreground">—</span>
                              )}
                            </td>
                          );
                        })}
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </Card>

            {/* What does my GPA mean? */}
            <Card className="p-6 shadow-md border-0">
              <h2 className="text-xl font-semibold mb-1 flex items-center gap-2">
                <GraduationCap className="w-5 h-5 text-emerald-600" />
                What does my GPA mean?
              </h2>
              <p className="text-sm text-muted-foreground mb-4">
                Enter your CGPA to see what degree classification it falls into
                at each selected university.
              </p>
              <div className="max-w-xs mb-6">
                <Label htmlFor="gpa-input" className="mb-1.5 block">
                  Your CGPA
                </Label>
                <Input
                  id="gpa-input"
                  type="number"
                  min={0}
                  max={5}
                  step={0.01}
                  placeholder="e.g. 3.85"
                  value={gpaInput}
                  onChange={(e) => setGpaInput(e.target.value)}
                />
              </div>

              {gpaInput && !isGpaValid && (
                <p className="text-sm text-red-500 mb-4">
                  Please enter a valid CGPA between 0 and 5.
                </p>
              )}

              {isGpaValid && (
                <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4">
                  {selectedUniversities.map((uni) => {
                    const degreeClass = getDegreeClass(
                      gpaValue,
                      uni.degreeClasses,
                    );
                    return (
                      <div
                        key={uni.id}
                        className="rounded-lg border p-4 text-center"
                      >
                        <div className="text-xs font-semibold text-muted-foreground mb-1">
                          {uni.shortName}
                        </div>
                        <div className="text-2xl font-bold text-emerald-700 mb-1">
                          {gpaValue.toFixed(2)}
                        </div>
                        <div className="inline-flex items-center rounded-full bg-emerald-100 px-3 py-1 text-sm font-semibold text-emerald-700 border border-emerald-200">
                          {degreeClass}
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </Card>
          </>
        )}
      </div>
    </div>
  );
}
