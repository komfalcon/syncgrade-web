import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { ArrowLeft, GraduationCap, MapPin, Check } from 'lucide-react';
import { useLocation } from 'wouter';
import { NIGERIAN_UNIVERSITIES, NigerianUniversity, GradeRange } from '@/data/nigerianUniversities';
import { useCGPA } from '@/hooks/useCGPA';
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
  const [selectedUni, setSelectedUni] = useState<NigerianUniversity | null>(null);

  const handleApply = (university: NigerianUniversity) => {
    cgpa.updateSettings({
      gpaScale: university.gpaScale,
      gradeRanges: [...university.gradeRanges] as GradeRange[],
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
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {NIGERIAN_UNIVERSITIES.map(uni => {
            const isActive = cgpa.settings.activeUniversity === uni.shortName;
            return (
              <Card
                key={uni.shortName}
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
                        uni.gpaScale === 5.0
                          ? 'bg-purple-100 text-purple-700 border-purple-200'
                          : 'bg-blue-100 text-blue-700 border-blue-200'
                      }`}>
                        {uni.gpaScale.toFixed(1)} Scale
                      </span>
                      <span className="inline-flex items-center gap-1 text-xs text-slate-500">
                        <MapPin className="w-3 h-3" />
                        {uni.location}
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
                    <td className="py-2 pr-4 text-slate-600">{range.minScore} - {range.maxScore}</td>
                    <td className="py-2 font-mono font-semibold text-cyan-600">{range.gradePoint.toFixed(1)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </Card>
      </div>

      {/* Confirmation Dialog */}
      <Dialog open={selectedUni !== null} onOpenChange={(open) => !open && setSelectedUni(null)}>
        <DialogContent className="sm:max-w-[425px]">
          <DialogHeader>
            <DialogTitle>Apply {selectedUni?.name} Grading System?</DialogTitle>
            <DialogDescription>
              This will update your GPA scale to {selectedUni?.gpaScale.toFixed(1)} and grade ranges to match {selectedUni?.shortName}'s official system.
            </DialogDescription>
          </DialogHeader>
          {selectedUni && (
            <div className="py-4">
              <div className="rounded-lg border border-slate-200 p-4 bg-slate-50">
                <p className="text-sm font-semibold text-slate-700 mb-2">Grade Ranges:</p>
                <div className="grid grid-cols-2 gap-1 text-sm">
                  {selectedUni.gradeRanges.map(range => (
                    <div key={range.grade} className="flex justify-between">
                      <span className="font-mono text-slate-600">{range.grade}: {range.minScore}-{range.maxScore}</span>
                      <span className="font-mono font-semibold text-cyan-600">→ {range.gradePoint.toFixed(1)}</span>
                    </div>
                  ))}
                </div>
              </div>
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
