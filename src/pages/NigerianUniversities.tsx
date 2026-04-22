import { useMemo, useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import {
  ArrowLeft,
  GraduationCap,
  MapPin,
  Check,
  BadgeCheck,
  BookOpen,
  RefreshCw,
  FileText,
  Search,
  Plus,
} from 'lucide-react';
import { useLocation } from 'wouter';
import { getUnifiedUniversities, resolveUniversityGradingSystem } from '@/universities/nigeria';
import type { UniversityConfig } from '@/universities/types';
import { useCGPA } from '@/hooks/useCGPA';
import { Input } from '@/components/ui/input';
import { useUniversities } from '@/hooks/useUniversities';
import CustomUniversityForm from '@/pages/CustomUniversityForm';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog';
import { toast } from 'sonner';
import { appDb, type CustomUniversityEntry } from '@/storage/db';

const ADMISSION_SESSION_REGEX = /^(\d{4})\/(\d{4})$/;
const PAGE_SIZE = 18;

function getInstitutionBadge(type?: UniversityConfig['type']) {
  if (type === 'university') {
    return {
      label: 'NUC Verified',
      className:
        'bg-emerald-100 text-emerald-700 border-emerald-200',
    };
  }
  if (type === 'polytechnic') {
    return {
      label: 'NBTE Verified',
      className:
        'bg-blue-100 text-blue-700 border-blue-200',
    };
  }
  if (type === 'college') {
    return {
      label: 'NCCE Verified',
      className:
        'bg-amber-100 text-amber-700 border-amber-200',
    };
  }
  return {
    label: 'Community Added',
    className:
      'bg-surface-elevated text-foreground-muted border-border',
  };
}

interface NigerianUniversitiesProps {
  onboardingMode?: boolean;
  onUniversityApplied?: () => void | Promise<void>;
}

export default function NigerianUniversities({
  onboardingMode = false,
  onUniversityApplied,
}: NigerianUniversitiesProps) {
  const [, setLocation] = useLocation();
  const cgpa = useCGPA();
  const { universities, meta } = useUniversities();
  const [selectedUni, setSelectedUni] = useState<UniversityConfig | null>(null);
  const [selectedSession, setSelectedSession] = useState('');
  const [query, setQuery] = useState('');
  const [visibleCount, setVisibleCount] = useState(PAGE_SIZE);
  const [showCustomForm, setShowCustomForm] = useState(false);
  const [onboardingUniversities, setOnboardingUniversities] = useState<UniversityConfig[] | null>(null);

  const universitiesForList = onboardingUniversities ?? universities;
  const normalizedQuery = query.trim().toLowerCase();
  const sortedUniversities = useMemo(
    () =>
      [...universitiesForList].sort((a, b) =>
        a.name.localeCompare(b.name, 'en', { sensitivity: 'base' }),
      ),
    [universitiesForList],
  );
  const filteredUniversities = useMemo(() => {
    if (!normalizedQuery) return sortedUniversities;
    return sortedUniversities.filter((uni) => {
      const generatedAcronym = uni.name
        .toLowerCase()
        .split(/\s+/)
        .filter(Boolean)
        .map((w) => w[0])
        .join('');
      const haystack = `${uni.name} ${uni.shortName} ${uni.location} ${generatedAcronym}`.toLowerCase();
      return (
        haystack.includes(normalizedQuery) ||
        normalizedQuery
          .split(/\s+/)
          .filter(Boolean)
          .every((token) => haystack.includes(token))
      );
    });
  }, [normalizedQuery, sortedUniversities]);

  const visibleUniversities = useMemo(
    () => filteredUniversities.slice(0, visibleCount),
    [filteredUniversities, visibleCount],
  );

  const cardResolvedScales = useMemo(
    () =>
      Object.fromEntries(
        filteredUniversities.map((uni) => [
          uni.id,
          resolveUniversityGradingSystem(uni, cgpa.settings.admissionSession),
        ]),
      ),
    [filteredUniversities, cgpa.settings.admissionSession],
  );

  const resolvedSelected = useMemo(() => {
    if (!selectedUni) return null;
    return resolveUniversityGradingSystem(
      selectedUni,
      selectedSession.trim() || cgpa.settings.admissionSession,
    );
  }, [selectedSession, selectedUni, cgpa.settings.admissionSession]);

  const openSessionGate = (university: UniversityConfig) => {
    const fallbackSession =
      cgpa.settings.admissionSession ||
      university.gradingSystem[university.gradingSystem.length - 1]?.session_start ||
      '';
    setSelectedSession(fallbackSession);
    setSelectedUni(university);
  };

  const handleApply = async () => {
    if (!selectedUni || !resolvedSelected) return;
    const trimmedSession = selectedSession.trim();
    const sessionMatch = trimmedSession.match(ADMISSION_SESSION_REGEX);
    if (!sessionMatch || Number(sessionMatch[2]) !== Number(sessionMatch[1]) + 1) {
      toast.error('Please enter session in YYYY/YYYY format (e.g., 2023/2024).');
      return;
    }
    const now = new Date();
    const currentAcademicStartYear =
      now.getMonth() >= 7 ? now.getFullYear() : now.getFullYear() - 1;
    if (Number(sessionMatch[1]) > currentAcademicStartYear) {
      toast.error('Admission session cannot be in the future.');
      return;
    }

    const admissionSession =
      trimmedSession ||
      cgpa.settings.admissionSession ||
      resolvedSelected.session_start;

    cgpa.updateSettings({
      gpaScale: resolvedSelected.scale,
      gradeRanges: resolvedSelected.grades,
      activeUniversity: selectedUni.shortName,
      admissionSession,
      repeatPolicy: selectedUni.repeatPolicy.method,
    });

    await appDb.userProfile.put({
      id: 'active-profile',
      universityId: selectedUni.id,
      universityShortName: selectedUni.shortName,
      universityName: selectedUni.name,
      admissionSession,
      repeatPolicy: selectedUni.repeatPolicy.method,
      configuration: {
        ...selectedUni,
        gradingSystem: [resolvedSelected],
      },
      updatedAt: Date.now(),
    });

    setSelectedUni(null);
    toast.success(`✅ ${selectedUni.name} grading system applied!`);
    if (onUniversityApplied) {
      await onUniversityApplied();
    }
  };

  const handleCreateCustomSchool = () => {
    if (onboardingMode) {
      setSelectedUni(null);
      setShowCustomForm(true);
      return;
    }
    setLocation('/custom-university');
  };

  const handleOnboardingCustomSave = async (entry: CustomUniversityEntry) => {
    const merged = await getUnifiedUniversities();
    setOnboardingUniversities(merged);
    setShowCustomForm(false);
    const created = merged.find((uni) => uni.id === entry.id);
    if (!created) {
      toast.error('Custom school was saved but could not be loaded yet. Please search and select it.');
      return;
    }
    setSelectedSession(entry.gradingSystem[0]?.session_start ?? '');
    setSelectedUni(created);
  };

  if (onboardingMode && showCustomForm) {
    return (
      <CustomUniversityForm
        onSave={handleOnboardingCustomSave}
        onCancel={() => setShowCustomForm(false)}
      />
    );
  }

  return (
    <div className="space-y-8">
      <div className="rounded-xl border border-border bg-surface-elevated p-6 shadow-md">
        <div className="container mx-auto px-4">
          {!onboardingMode && (
            <Button
              variant="ghost"
              className="mb-4"
              onClick={() => setLocation('/')}
            >
              <ArrowLeft className="w-4 h-4 mr-2" />
              Back to Dashboard
            </Button>
          )}
          <h1 className="text-3xl md:text-4xl font-bold">🇳🇬 Nigerian Universities</h1>
          <p className="mt-2 text-foreground-muted">
            Select your university to apply its official grading system
          </p>
          <p className="mt-2 text-xs text-foreground-subtle">
            Data Version: {meta.version} · Last updated:{' '}
            {new Date(meta.lastUpdated).toLocaleDateString()}
          </p>
          {cgpa.settings.activeUniversity && (
            <div className="mt-3 inline-flex items-center gap-2 bg-surface/20 rounded-full px-4 py-1.5 text-sm">
              <Check className="w-4 h-4" />
              Active: {cgpa.settings.activeUniversity} ({cgpa.settings.gpaScale.toFixed(1)} Scale)
            </div>
          )}
        </div>
      </div>

      <div className="container mx-auto px-4 py-8">
        <Card className="sticky top-3 z-10 mb-4 p-4 shadow-md border-0 backdrop-blur supports-[backdrop-filter]:bg-surface/80">
          <div className="relative">
            <Search className="absolute left-3 top-3 h-4 w-4 text-slate-400" />
            <Input
              value={query}
              onChange={(e) => {
                setQuery(e.target.value);
                setVisibleCount(PAGE_SIZE);
              }}
              placeholder="Search by school name, acronym, or location (e.g., UI, ABU, Lagos)"
              className="pl-9"
            />
          </div>
        </Card>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <Card
            className="p-6 shadow-md border-2 border-dashed border-cyan-300 cursor-pointer hover:shadow-xl transition-all bg-cyan-50/40"
            onClick={handleCreateCustomSchool}
          >
            <div className="flex items-start gap-4">
              <div className="w-12 h-12 rounded-xl border-2 border-dashed border-cyan-400 bg-surface flex items-center justify-center text-primary shrink-0">
                <Plus className="w-6 h-6" />
              </div>
              <div className="flex-1 min-w-0">
                <h3 className="text-lg font-bold text-slate-900">Create Custom School</h3>
                <p className="text-sm text-foreground-muted mt-1">
                  Can't find your institution? Build and save your own grading profile.
                </p>
              </div>
            </div>
          </Card>

          {visibleUniversities.map((uni) => {
            const isActive = cgpa.settings.activeUniversity === uni.shortName;
            const resolved =
              cardResolvedScales[uni.id] ??
              resolveUniversityGradingSystem(uni, cgpa.settings.admissionSession);
            const institutionBadge = getInstitutionBadge(uni.type);
            return (
              <Card
                key={uni.id}
                className={`p-6 shadow-md border-0 cursor-pointer hover:shadow-xl transition-all ${
                  isActive ? 'ring-2 ring-green-400 bg-green-50/50' : ''
                }`}
                onClick={() => openSessionGate(uni)}
              >
                <div className="flex items-start gap-4">
                  <div className="w-12 h-12 rounded-xl bg-primary flex items-center justify-center text-foreground shrink-0">
                    <GraduationCap className="w-6 h-6" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <h3 className="text-lg font-bold text-slate-900">{uni.name}</h3>
                      <span
                        className={`inline-flex items-center rounded-full px-2 py-0.5 text-xs font-semibold border ${institutionBadge.className}`}
                      >
                          <BadgeCheck className="w-3 h-3 mr-1" />
                          {institutionBadge.label}
                      </span>
                      {isActive && (
                        <span className="inline-flex items-center rounded-full bg-green-100 px-2 py-0.5 text-xs font-medium text-green-700 border border-green-200">
                          ✅ Active
                        </span>
                      )}
                    </div>
                    <div className="flex items-center gap-2 mt-2 flex-wrap">
                      <span className="inline-flex items-center rounded-md bg-cyan-100 px-2 py-0.5 text-xs font-semibold text-primary border border-cyan-200">
                        {uni.shortName}
                      </span>
                      <span
                        className={`inline-flex items-center rounded-md px-2 py-0.5 text-xs font-semibold border ${
                          resolved.scale === 5
                            ? 'bg-purple-100 text-purple-700 border-purple-200'
                            : 'bg-blue-100 text-blue-700 border-blue-200'
                        }`}
                      >
                        {resolved.scale.toFixed(1)} Scale
                      </span>
                      <span className="inline-flex items-center gap-1 text-xs text-foreground-subtle">
                        <MapPin className="w-3 h-3" />
                        {uni.location}
                      </span>
                    </div>
                    <div className="flex items-center gap-2 mt-2 flex-wrap text-xs text-foreground-subtle">
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

        {normalizedQuery && filteredUniversities.length === 0 && (
          <Card className="mt-4 p-6 shadow-md border-0 text-center">
            <p className="text-foreground-muted mb-4">
              Don't see your school? Click here to build it manually.
            </p>
            <Button
              className="bg-primary text-foreground"
              onClick={handleCreateCustomSchool}
            >
              Open Custom School Form
            </Button>
          </Card>
        )}

        {visibleCount < filteredUniversities.length && (
          <div className="mt-6 flex justify-center">
            <Button
              variant="outline"
              onClick={() => setVisibleCount((count) => count + PAGE_SIZE)}
            >
              Load More Schools ({visibleCount}/{filteredUniversities.length})
            </Button>
          </div>
        )}

        <Card className="mt-8 p-6 shadow-md border-0 bg-surface-elevated">
          <h3 className="text-lg font-bold text-slate-900 mb-4">Current Grading System</h3>
          <div className="flex items-center gap-2 mb-4">
            <span className="text-sm text-foreground-muted">Scale:</span>
            <span className="font-bold text-primary">{cgpa.settings.gpaScale.toFixed(1)}</span>
            {cgpa.settings.activeUniversity && (
              <span className="text-sm text-foreground-subtle">({cgpa.settings.activeUniversity})</span>
            )}
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-border">
                  <th className="text-left py-2 pr-4 text-foreground-muted font-semibold">Grade</th>
                  <th className="text-left py-2 pr-4 text-foreground-muted font-semibold">Score Range</th>
                  <th className="text-left py-2 text-foreground-muted font-semibold">Grade Point</th>
                </tr>
              </thead>
              <tbody>
                {cgpa.settings.gradeRanges.map((range) => (
                  <tr key={range.grade} className="border-b border-slate-100">
                    <td className="py-2 pr-4 font-mono font-semibold text-slate-900">{range.grade}</td>
                    <td className="py-2 pr-4 text-foreground-muted">
                      {range.min} - {range.max}
                    </td>
                    <td className="py-2 font-mono font-semibold text-primary">
                      {range.points.toFixed(1)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </Card>
      </div>

      <Dialog open={selectedUni !== null} onOpenChange={(open) => !open && setSelectedUni(null)}>
        <DialogContent className="sm:max-w-[550px] max-h-[85vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Academic Session of Entry</DialogTitle>
            <DialogDescription>
              Enter your admission session (YYYY/YYYY) to load the correct grading configuration for{' '}
              {selectedUni?.shortName}.
            </DialogDescription>
          </DialogHeader>

          {selectedUni && resolvedSelected && (
            <div className="py-4 space-y-5">
              <div>
                <label htmlFor="session-of-entry" className="text-sm font-semibold text-foreground-muted">
                  Academic Session of Entry
                </label>
                <Input
                  id="session-of-entry"
                  value={selectedSession}
                  onChange={(e) => setSelectedSession(e.target.value)}
                  placeholder="e.g., 2023/2024"
                  className="mt-2"
                />
              </div>

              <div className="rounded-lg border border-border p-4 bg-surface-elevated">
                <p className="text-sm font-semibold text-foreground-muted mb-2">
                  Grading System ({resolvedSelected.scale.toFixed(1)} Scale)
                </p>
                <div className="overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="border-b border-border">
                        <th className="text-left py-1.5 pr-3 text-foreground-subtle font-medium text-xs">Grade</th>
                        <th className="text-left py-1.5 pr-3 text-foreground-subtle font-medium text-xs">
                          Score Range
                        </th>
                        <th className="text-left py-1.5 text-foreground-subtle font-medium text-xs">Points</th>
                      </tr>
                    </thead>
                    <tbody>
                      {resolvedSelected.grades.map((g) => (
                        <tr key={g.grade} className="border-b border-slate-100">
                          <td className="py-1.5 pr-3 font-mono font-semibold text-slate-900">{g.grade}</td>
                          <td className="py-1.5 pr-3 text-foreground-muted">
                            {g.min} – {g.max}
                          </td>
                          <td className="py-1.5 font-mono font-semibold text-primary">
                            {g.points.toFixed(1)}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>

              <div className="rounded-lg border border-border p-4 bg-surface-elevated">
                <p className="text-sm font-semibold text-foreground-muted mb-2">Matched Session Rule</p>
                <p className="text-sm text-foreground-muted">
                  {resolvedSelected.session_start} to {resolvedSelected.session_end}
                </p>
              </div>

              <div className="rounded-lg border border-border p-4 bg-surface-elevated">
                <p className="text-sm font-semibold text-foreground-muted mb-2">Degree Classifications</p>
                <div className="overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="border-b border-border">
                        <th className="text-left py-1.5 pr-3 text-foreground-subtle font-medium text-xs">Class</th>
                        <th className="text-left py-1.5 text-foreground-subtle font-medium text-xs">CGPA Range</th>
                      </tr>
                    </thead>
                    <tbody>
                      {selectedUni.degreeClasses.map((dc) => (
                        <tr key={dc.name} className="border-b border-slate-100">
                          <td className="py-1.5 pr-3 font-semibold text-slate-900">{dc.name}</td>
                          <td className="py-1.5 font-mono text-foreground-muted">
                            {dc.minCGPA.toFixed(2)} – {dc.maxCGPA.toFixed(2)}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>

              <div className="rounded-lg border border-border p-4 bg-surface-elevated">
                <p className="text-sm font-semibold text-foreground-muted mb-2">Credit Rules</p>
                <div className="grid grid-cols-2 gap-2 text-sm">
                  <div>
                    <span className="text-foreground-subtle text-xs">Min Credits</span>
                    <p className="font-semibold text-slate-900">{selectedUni.creditRules.minimumCredits}</p>
                  </div>
                  <div>
                    <span className="text-foreground-subtle text-xs">Max / Semester</span>
                    <p className="font-semibold text-slate-900">
                      {selectedUni.creditRules.maximumPerSemester}
                    </p>
                  </div>
                  <div>
                    <span className="text-foreground-subtle text-xs">Min / Semester</span>
                    <p className="font-semibold text-slate-900">
                      {selectedUni.creditRules.minimumPerSemester}
                    </p>
                  </div>
                  <div>
                    <span className="text-foreground-subtle text-xs">Max Program Duration</span>
                    <p className="font-semibold text-slate-900">{selectedUni.maxProgramDuration}</p>
                  </div>
                </div>
              </div>

              <div className="rounded-lg border border-border p-4 bg-surface-elevated">
                <div className="flex items-center gap-2 mb-1">
                  <RefreshCw className="w-3.5 h-3.5 text-foreground-subtle" />
                  <p className="text-sm font-semibold text-foreground-muted">Repeat Policy</p>
                </div>
                <span className="inline-flex items-center rounded-md bg-amber-100 px-2 py-0.5 text-xs font-semibold text-amber-700 border border-amber-200 mb-1">
                  {selectedUni.repeatPolicy.method}
                </span>
                <p className="text-sm text-foreground-muted">{selectedUni.repeatPolicy.description}</p>
              </div>

              <div className="rounded-lg border border-border p-4 bg-surface-elevated">
                <p className="text-sm font-semibold text-foreground-muted mb-2">Academic Standing</p>
                <div className="space-y-2 text-sm">
                  <div>
                    <span className="text-foreground-subtle text-xs">
                      Probation (below {selectedUni.probation.minCGPA.toFixed(2)} CGPA)
                    </span>
                    <p className="text-foreground-muted">{selectedUni.probation.description}</p>
                  </div>
                  <div>
                    <span className="text-foreground-subtle text-xs">Dismissal</span>
                    <p className="text-foreground-muted">{selectedUni.dismissal.description}</p>
                  </div>
                </div>
              </div>

              {selectedUni.sourceDocuments.length > 0 && (
                <div className="rounded-lg border border-border p-4 bg-surface-elevated">
                  <div className="flex items-center gap-2 mb-1">
                    <FileText className="w-3.5 h-3.5 text-foreground-subtle" />
                    <p className="text-sm font-semibold text-foreground-muted">Source Documents</p>
                  </div>
                  <ul className="text-sm text-foreground-muted space-y-1 list-disc list-inside">
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
              className="bg-primary hover:bg-primary-hover text-foreground"
              onClick={handleApply}
            >
              {onboardingMode ? 'Continue to App' : 'Apply'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
