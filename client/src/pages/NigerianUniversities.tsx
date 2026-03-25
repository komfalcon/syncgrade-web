import { useMemo, useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { ArrowLeft, GraduationCap, MapPin, Check, BookOpen, RefreshCw, FileText, Search } from 'lucide-react';
import { useLocation } from 'wouter';
import { getUniversityDbMeta } from '@/universities/nigeria';
import type { UniversityConfig } from '@/universities/types';
import { useCGPA } from '@/hooks/useCGPA';
import { Input } from '@/components/ui/input';
import { useUniversities } from '@/hooks/useUniversities';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog';
import { toast } from 'sonner';

export default function NigerianUniversities() {
  const [, setLocation] = useLocation();
  const cgpa = useCGPA();
  const { universities } = useUniversities();
  const [selectedUni, setSelectedUni] = useState<UniversityConfig | null>(null);
  const [query, setQuery] = useState('');
  const meta = getUniversityDbMeta();

  const normalizedQuery = query.trim().toLowerCase();
  const filteredUniversities = useMemo(() => {
    if (!normalizedQuery) return universities;
    return universities.filter((uni) => {
      const words = uni.name.toLowerCase().split(/\s+/).filter(Boolean);
      const acronym = words.map((w) => w[0]).join('');
      return (
        uni.name.toLowerCase().includes(normalizedQuery) ||
        uni.shortName.toLowerCase().includes(normalizedQuery) ||
        uni.location.toLowerCase().includes(normalizedQuery) ||
        acronym.includes(normalizedQuery)
      );
    });
  }, [normalizedQuery, universities]);

  const handleApply = (university: UniversityConfig) => {
    cgpa.updateSettings({
      gpaScale: university.gradingSystem.scale,
      gradeRanges: university.gradingSystem.grades,
      activeUniversity: university.shortName,
    });
    setSelectedUni(null);
    toast.success(`✅ ${university.name} grading system applied!`);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-cyan-50 to-slate-50">
      {/* Header */}
      <div className="bg-gradient-to-r from-green-600 via-emerald-600 to-green-500 text-white py-12">
        <div className="container mx-auto px-4">
          <Button
            variant="ghost"
            className="text-white hover:bg-white/20 mb-4"
            onClick={() => setLocation('/')}
          >
            <ArrowLeft className="w-4 h-4 mr-2" />
            Back to Dashboard
          </Button>
          <h1 className="text-3xl md:text-4xl font-bold">🇳🇬 Nigerian Universities</h1>
          <p className="text-green-100 mt-2">
            Select your university to apply its official grading system
          </p>
          <p className="text-xs text-green-200 mt-2">
            Data Version: {meta.version} · Last updated: {new Date(meta.lastUpdated).toLocaleDateString()}
          </p>
          {cgpa.settings.activeUniversity && (
            <div className="mt-3 inline-flex items-center gap-2 bg-white/20 rounded-full px-4 py-1.5 text-sm">
              <Check className="w-4 h-4" />
              Active: {cgpa.settings.activeUniversity} ({cgpa.settings.gpaScale.toFixed(1)} Scale)
            </div>
          )}
        </div>
      </div>

      {/* University List */}
      <div className="container mx-auto px-4 py-8">
        <Card className="mb-4 p-4 shadow-md border-0">
          <div className="relative">
            <Search className="absolute left-3 top-3 h-4 w-4 text-slate-400" />
            <Input
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Search by name, acronym, or location (e.g., ABU, UI)"
              className="pl-9"
            />
          </div>
        </Card>

        {filteredUniversities.length === 0 && (
          <Card className="p-6 shadow-md border-0 text-center">
            <p className="text-slate-600 mb-4">No university matched your search.</p>
            <Button
              className="bg-gradient-to-r from-cyan-600 to-teal-600 text-white"
              onClick={() => setLocation('/custom-university')}
            >
              Can't find your school? Create a Custom Profile
            </Button>
          </Card>
        )}

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {filteredUniversities.map(uni => {
            const isActive = cgpa.settings.activeUniversity === uni.shortName;
            return (
              <Card
                key={uni.id}
                className={`p-6 shadow-md border-0 cursor-pointer hover:shadow-xl transition-all ${
                  isActive ? 'ring-2 ring-green-400 bg-green-50/50' : ''
                }`}
                onClick={() => setSelectedUni(uni)}
              >
                <div className="flex items-start gap-4">
                  <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-green-500 to-emerald-600 flex items-center justify-center text-white shrink-0">
                    <GraduationCap className="w-6 h-6" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <h3 className="text-lg font-bold text-slate-900">{uni.name}</h3>
                      {isActive && (
                        <span className="inline-flex items-center rounded-full bg-green-100 px-2 py-0.5 text-xs font-medium text-green-700 border border-green-200">
                          ✅ Active
                        </span>
                      )}
                    </div>
                    <div className="flex items-center gap-2 mt-2 flex-wrap">
                      <span className="inline-flex items-center rounded-md bg-cyan-100 px-2 py-0.5 text-xs font-semibold text-cyan-700 border border-cyan-200">
                        {uni.shortName}
                      </span>
                      <span className={`inline-flex items-center rounded-md px-2 py-0.5 text-xs font-semibold border ${
                        uni.gradingSystem.scale === 5.0
                          ? 'bg-purple-100 text-purple-700 border-purple-200'
                          : 'bg-blue-100 text-blue-700 border-blue-200'
                      }`}>
                        {uni.gradingSystem.scale.toFixed(1)} Scale
                      </span>
                      <span className="inline-flex items-center gap-1 text-xs text-slate-500">
                        <MapPin className="w-3 h-3" />
                        {uni.location}
                      </span>
                    </div>
                    <div className="flex items-center gap-2 mt-2 flex-wrap text-xs text-slate-500">
                      <span className="inline-flex items-center gap-1">
                        <BookOpen className="w-3 h-3" />
                        {uni.degreeClasses.length} degree classes
                      </span>
                      <span>·</span>
                      <span className="inline-flex items-center gap-1">
                        <RefreshCw className="w-3 h-3" />
                        Repeat: {uni.repeatPolicy.method}
                      </span>
                    </div>
                  </div>
                </div>
              </Card>
            );
          })}
        </div>

        {/* Grade Ranges Info */}
        <Card className="mt-8 p-6 shadow-md border-0 bg-slate-50">
          <h3 className="text-lg font-bold text-slate-900 mb-4">Current Grading System</h3>
          <div className="flex items-center gap-2 mb-4">
            <span className="text-sm text-slate-600">Scale:</span>
            <span className="font-bold text-cyan-600">{cgpa.settings.gpaScale.toFixed(1)}</span>
            {cgpa.settings.activeUniversity && (
              <span className="text-sm text-slate-500">({cgpa.settings.activeUniversity})</span>
            )}
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-slate-200">
                  <th className="text-left py-2 pr-4 text-slate-600 font-semibold">Grade</th>
                  <th className="text-left py-2 pr-4 text-slate-600 font-semibold">Score Range</th>
                  <th className="text-left py-2 text-slate-600 font-semibold">Grade Point</th>
                </tr>
              </thead>
              <tbody>
                {cgpa.settings.gradeRanges.map(range => (
                  <tr key={range.grade} className="border-b border-slate-100">
                    <td className="py-2 pr-4 font-mono font-semibold text-slate-900">{range.grade}</td>
                    <td className="py-2 pr-4 text-slate-600">{range.min} - {range.max}</td>
                    <td className="py-2 font-mono font-semibold text-cyan-600">{range.points.toFixed(1)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </Card>
      </div>

      {/* Detail Dialog */}
      <Dialog open={selectedUni !== null} onOpenChange={(open) => !open && setSelectedUni(null)}>
        <DialogContent className="sm:max-w-[550px] max-h-[85vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Apply {selectedUni?.name} Grading System?</DialogTitle>
            <DialogDescription>
              This will update your GPA scale to {selectedUni?.gradingSystem.scale.toFixed(1)} and grade ranges to match {selectedUni?.shortName}'s official system.
            </DialogDescription>
          </DialogHeader>
          {selectedUni && (
            <div className="py-4 space-y-5">
              {/* Grading System */}
              <div className="rounded-lg border border-slate-200 p-4 bg-slate-50">
                <p className="text-sm font-semibold text-slate-700 mb-2">Grading System ({selectedUni.gradingSystem.scale.toFixed(1)} Scale)</p>
                <div className="overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="border-b border-slate-200">
                        <th className="text-left py-1.5 pr-3 text-slate-500 font-medium text-xs">Grade</th>
                        <th className="text-left py-1.5 pr-3 text-slate-500 font-medium text-xs">Score Range</th>
                        <th className="text-left py-1.5 text-slate-500 font-medium text-xs">Points</th>
                      </tr>
                    </thead>
                    <tbody>
                      {selectedUni.gradingSystem.grades.map(g => (
                        <tr key={g.grade} className="border-b border-slate-100">
                          <td className="py-1.5 pr-3 font-mono font-semibold text-slate-900">{g.grade}</td>
                          <td className="py-1.5 pr-3 text-slate-600">{g.min} – {g.max}</td>
                          <td className="py-1.5 font-mono font-semibold text-cyan-600">{g.points.toFixed(1)}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>

              {/* Degree Classifications */}
              <div className="rounded-lg border border-slate-200 p-4 bg-slate-50">
                <p className="text-sm font-semibold text-slate-700 mb-2">Degree Classifications</p>
                <div className="overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="border-b border-slate-200">
                        <th className="text-left py-1.5 pr-3 text-slate-500 font-medium text-xs">Class</th>
                        <th className="text-left py-1.5 text-slate-500 font-medium text-xs">CGPA Range</th>
                      </tr>
                    </thead>
                    <tbody>
                      {selectedUni.degreeClasses.map(dc => (
                        <tr key={dc.name} className="border-b border-slate-100">
                          <td className="py-1.5 pr-3 font-semibold text-slate-900">{dc.name}</td>
                          <td className="py-1.5 font-mono text-slate-600">{dc.minCGPA.toFixed(2)} – {dc.maxCGPA.toFixed(2)}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>

              {/* Credit Rules */}
              <div className="rounded-lg border border-slate-200 p-4 bg-slate-50">
                <p className="text-sm font-semibold text-slate-700 mb-2">Credit Rules</p>
                <div className="grid grid-cols-2 gap-2 text-sm">
                  <div>
                    <span className="text-slate-500 text-xs">Min Credits</span>
                    <p className="font-semibold text-slate-900">{selectedUni.creditRules.minimumCredits}</p>
                  </div>
                  <div>
                    <span className="text-slate-500 text-xs">Max / Semester</span>
                    <p className="font-semibold text-slate-900">{selectedUni.creditRules.maximumPerSemester}</p>
                  </div>
                  <div>
                    <span className="text-slate-500 text-xs">Min / Semester</span>
                    <p className="font-semibold text-slate-900">{selectedUni.creditRules.minimumPerSemester}</p>
                  </div>
                  <div>
                    <span className="text-slate-500 text-xs">Max Program Duration</span>
                    <p className="font-semibold text-slate-900">{selectedUni.maxProgramDuration}</p>
                  </div>
                </div>
              </div>

              {/* Repeat Policy */}
              <div className="rounded-lg border border-slate-200 p-4 bg-slate-50">
                <div className="flex items-center gap-2 mb-1">
                  <RefreshCw className="w-3.5 h-3.5 text-slate-500" />
                  <p className="text-sm font-semibold text-slate-700">Repeat Policy</p>
                </div>
                <span className="inline-flex items-center rounded-md bg-amber-100 px-2 py-0.5 text-xs font-semibold text-amber-700 border border-amber-200 mb-1">
                  {selectedUni.repeatPolicy.method}
                </span>
                <p className="text-sm text-slate-600">{selectedUni.repeatPolicy.description}</p>
              </div>

              {/* Academic Standing */}
              <div className="rounded-lg border border-slate-200 p-4 bg-slate-50">
                <p className="text-sm font-semibold text-slate-700 mb-2">Academic Standing</p>
                <div className="space-y-2 text-sm">
                  <div>
                    <span className="text-slate-500 text-xs">Probation (below {selectedUni.probation.minCGPA.toFixed(2)} CGPA)</span>
                    <p className="text-slate-600">{selectedUni.probation.description}</p>
                  </div>
                  <div>
                    <span className="text-slate-500 text-xs">Dismissal</span>
                    <p className="text-slate-600">{selectedUni.dismissal.description}</p>
                  </div>
                </div>
              </div>

              {/* Source Documents */}
              {selectedUni.sourceDocuments.length > 0 && (
                <div className="rounded-lg border border-slate-200 p-4 bg-slate-50">
                  <div className="flex items-center gap-2 mb-1">
                    <FileText className="w-3.5 h-3.5 text-slate-500" />
                    <p className="text-sm font-semibold text-slate-700">Source Documents</p>
                  </div>
                  <ul className="text-sm text-slate-600 space-y-1 list-disc list-inside">
                    {selectedUni.sourceDocuments.map((doc, i) => (
                      <li key={i}>{doc}</li>
                    ))}
                  </ul>
                </div>
              )}
            </div>
          )}
          <DialogFooter>
            <Button variant="outline" onClick={() => setSelectedUni(null)}>
              Cancel
            </Button>
            <Button
              className="bg-gradient-to-r from-cyan-600 to-teal-600 hover:from-cyan-700 hover:to-teal-700 text-white"
              onClick={() => selectedUni && handleApply(selectedUni)}
            >
              Apply
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
