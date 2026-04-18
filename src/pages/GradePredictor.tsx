import { useEffect, useMemo, useRef, useState } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import {
  BookOpen,
  CheckCircle2,
  ChevronDown,
  ChevronUp,
  ClipboardList,
  Info,
  Loader2,
  Plus,
  Rocket,
  Scale,
  Shield,
  Target,
  Trash2,
  XCircle,
} from 'lucide-react';
import { useCGPA } from '@/hooks/useCGPA';
import { useUniversities } from '@/hooks/useUniversities';
import { getClassification, normalizeToSupportedScale } from '@/utils/gpaLogic';
import {
  calculateMaxCGPA,
  deriveGradeOptions,
  generateStrategies,
  type Course,
  type PredictorResult,
  type Strategy,
  type StrategyType,
} from '@/utils/gradePredictorEngine';

const HOW_TO_SEEN_KEY = 'syncgrade_predictor_howto_seen';
const MAX_COURSES = 12;

type CourseRow = {
  id: string;
  name: string;
  units: string;
};

const makeCourseRow = (): CourseRow => ({
  id: crypto.randomUUID(),
  name: '',
  units: '',
});

const clamp = (value: number, min: number, max: number): number => Math.min(max, Math.max(min, value));

const parseNumber = (value: string, fallback = 0): number => {
  const parsed = Number.parseFloat(value);
  return Number.isFinite(parsed) ? parsed : fallback;
};

const round2 = (value: number): number => Math.round(value * 100) / 100;

const getFeasibilityClasses = (score: number): string => {
  if (score >= 80) return 'text-success';
  if (score >= 50) return 'text-warning';
  return 'text-destructive';
};

const getFeasibilityBarClasses = (score: number): string => {
  if (score >= 80) return 'bg-success';
  if (score >= 50) return 'bg-warning';
  return 'bg-destructive';
};

const getTierBadgeClasses = (tier: number): string => {
  if (tier === 1) return 'bg-success/10 text-success';
  if (tier === 2) return 'bg-accent/15 text-accent';
  if (tier === 3) return 'bg-warning/15 text-warning';
  return 'bg-destructive/10 text-destructive';
};

const getStrategyMeta = (type: StrategyType): { icon: React.ReactNode; borderClass: string } => {
  if (type === 'safe') {
    return { icon: <Shield className="h-5 w-5" />, borderClass: 'border-l-4 border-success' };
  }
  if (type === 'balanced') {
    return { icon: <Scale className="h-5 w-5" />, borderClass: 'border-l-4 border-accent' };
  }
  return { icon: <Rocket className="h-5 w-5" />, borderClass: 'border-l-4 border-warning' };
};

const getScoreClass = (gradeLabel: string): string => {
  const normalized = gradeLabel.trim().toUpperCase();
  if (normalized === 'A') return 'text-success font-semibold';
  if (normalized === 'B') return 'text-accent font-semibold';
  if (normalized === 'C') return 'text-warning font-semibold';
  if (normalized === 'D' || normalized === 'E') return 'text-destructive font-semibold';
  return 'text-foreground-muted font-semibold';
};

export default function GradePredictor() {
  const cgpa = useCGPA();
  const { universities } = useUniversities();

  const [isHowToExpanded, setIsHowToExpanded] = useState(true);

  const initialScale = normalizeToSupportedScale(cgpa.settings.gpaScale);
  const [currentCGPAInput, setCurrentCGPAInput] = useState(cgpa.currentCGPA.toFixed(2));
  const [completedCreditsInput, setCompletedCreditsInput] = useState(String(Math.round(cgpa.totalCredits)));
  const [scaleInput, setScaleInput] = useState<'5.0' | '4.0'>(initialScale === 4 ? '4.0' : '5.0');
  const [semesterLabel, setSemesterLabel] = useState('');

  const [stage1Locked, setStage1Locked] = useState(false);
  const [stage2Locked, setStage2Locked] = useState(false);
  const [stage3Locked, setStage3Locked] = useState(false);

  const [courses, setCourses] = useState<CourseRow[]>([makeCourseRow()]);
  const [courseErrors, setCourseErrors] = useState<Record<string, { name?: string; units?: string }>>({});

  const [targetCGPAInput, setTargetCGPAInput] = useState('');
  const [isCalculatingStrategies, setIsCalculatingStrategies] = useState(false);
  const [strategyResult, setStrategyResult] = useState<PredictorResult | null>(null);
  const [expandedCards, setExpandedCards] = useState<Record<StrategyType, boolean>>({
    safe: false,
    balanced: false,
    highEffort: false,
  });

  const stage2Ref = useRef<HTMLDivElement | null>(null);
  const stage3Ref = useRef<HTMLDivElement | null>(null);
  const stage4Ref = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    if (typeof window === 'undefined') return;
    const seen = window.localStorage.getItem(HOW_TO_SEEN_KEY) === 'true';
    setIsHowToExpanded(!seen);
  }, []);

  useEffect(() => {
    setCurrentCGPAInput(cgpa.currentCGPA.toFixed(2));
    setCompletedCreditsInput(String(Math.round(cgpa.totalCredits)));
    const nextScale = normalizeToSupportedScale(cgpa.settings.gpaScale);
    setScaleInput(nextScale === 4 ? '4.0' : '5.0');
  }, [cgpa.currentCGPA, cgpa.totalCredits, cgpa.settings.gpaScale]);

  const scale = useMemo(() => normalizeToSupportedScale(parseNumber(scaleInput, initialScale)), [scaleInput, initialScale]);
  const currentCGPA = useMemo(() => round2(clamp(parseNumber(currentCGPAInput, 0), 0, scale)), [currentCGPAInput, scale]);
  const completedCredits = useMemo(() => Math.max(0, Math.round(parseNumber(completedCreditsInput, 0))), [completedCreditsInput]);

  const activeUniversityName = useMemo(() => {
    const active = universities.find((uni) => uni.shortName === cgpa.settings.activeUniversity);
    return active?.name ?? 'Your University';
  }, [universities, cgpa.settings.activeUniversity]);

  const gradeOptions = useMemo(() => deriveGradeOptions(cgpa.settings.gradeRanges), [cgpa.settings.gradeRanges]);

  const validCourses = useMemo<Course[]>(() => {
    return courses
      .map((course) => ({
        name: course.name.trim(),
        units: Math.round(parseNumber(course.units, 0)),
      }))
      .filter((course) => course.name.length > 0 && course.units >= 1 && course.units <= 6);
  }, [courses]);

  const totalNextUnits = useMemo(() => validCourses.reduce((sum, course) => sum + course.units, 0), [validCourses]);
  const enteredTotalUnits = useMemo(
    () =>
      courses.reduce((sum, course) => {
        const units = Math.round(parseNumber(course.units, 0));
        return sum + (units > 0 ? units : 0);
      }, 0),
    [courses],
  );

  const maxAttainableCGPA = useMemo(() => {
    if (validCourses.length === 0) return null;
    return calculateMaxCGPA(currentCGPA, completedCredits, validCourses, scale);
  }, [currentCGPA, completedCredits, validCourses, scale]);

  const maxClassification = useMemo(() => {
    if (maxAttainableCGPA === null) return null;
    return getClassification(maxAttainableCGPA, scale);
  }, [maxAttainableCGPA, scale]);

  const highestGradeLabel = gradeOptions[0]?.label ?? 'A';

  const targetValue = parseNumber(targetCGPAInput, NaN);
  const targetValidation = useMemo(() => {
    if (!Number.isFinite(targetValue) || maxAttainableCGPA === null) {
      return { isValid: false as const, state: 'empty' as const, message: '' };
    }
    if (targetValue > maxAttainableCGPA) {
      return {
        isValid: false as const,
        state: 'high' as const,
        message: `Exceeds your maximum of ${maxAttainableCGPA.toFixed(2)}. Try ${maxAttainableCGPA.toFixed(2)}.`,
      };
    }
    if (targetValue <= currentCGPA) {
      return {
        isValid: false as const,
        state: 'low' as const,
        message: `Must be higher than your current CGPA of ${currentCGPA.toFixed(2)}.`,
      };
    }
    const normalizedTarget = round2(targetValue);
    const targetClass = getClassification(normalizedTarget, scale);
    return {
      isValid: true as const,
      state: 'valid' as const,
      message: `Achievable ✓ This puts you in ${targetClass.label}`,
    };
  }, [targetValue, maxAttainableCGPA, currentCGPA, scale]);

  const handleHowToToggle = () => {
    setIsHowToExpanded((prev) => {
      const next = !prev;
      if (!next && typeof window !== 'undefined') {
        window.localStorage.setItem(HOW_TO_SEEN_KEY, 'true');
      }
      return next;
    });
  };

  const scrollTo = (ref: React.RefObject<HTMLDivElement | null>) => {
    ref.current?.scrollIntoView({ behavior: 'smooth', block: 'start' });
  };

  const handleStage1Continue = () => {
    setStage1Locked(true);
    setTimeout(() => scrollTo(stage2Ref), 80);
  };

  const updateCourse = (id: string, patch: Partial<CourseRow>) => {
    setCourses((prev) => prev.map((course) => (course.id === id ? { ...course, ...patch } : course)));
  };

  const addCourse = () => {
    if (stage2Locked || courses.length >= MAX_COURSES) return;
    setCourses((prev) => [...prev, makeCourseRow()]);
  };

  const removeCourse = (id: string) => {
    if (stage2Locked || courses.length <= 1) return;
    setCourses((prev) => prev.filter((course) => course.id !== id));
    setCourseErrors((prev) => {
      const next = { ...prev };
      delete next[id];
      return next;
    });
  };

  const validateCourses = (): boolean => {
    const nextErrors: Record<string, { name?: string; units?: string }> = {};

    courses.forEach((course) => {
      const rowErrors: { name?: string; units?: string } = {};
      if (!course.name.trim()) rowErrors.name = 'Course name required';
      const units = Math.round(parseNumber(course.units, 0));
      if (!Number.isFinite(units) || units < 1 || units > 6) {
        rowErrors.units = 'Enter credit units (1–6)';
      }
      if (rowErrors.name || rowErrors.units) {
        nextErrors[course.id] = rowErrors;
      }
    });

    setCourseErrors(nextErrors);
    return Object.keys(nextErrors).length === 0;
  };

  const handleStage2Continue = () => {
    const isValid = validateCourses();
    if (!isValid) return;
    setStage2Locked(true);
    setTimeout(() => scrollTo(stage3Ref), 80);
  };

  const handleFindStrategies = async () => {
    if (!targetValidation.isValid || maxAttainableCGPA === null || gradeOptions.length === 0) return;
    setIsCalculatingStrategies(true);
    const startedAt = Date.now();

    const generated = generateStrategies(
      currentCGPA,
      completedCredits,
      validCourses,
      round2(targetValue),
      gradeOptions,
      scale,
    );

    const elapsed = Date.now() - startedAt;
    const wait = Math.max(0, 400 - elapsed);
    await new Promise((resolve) => setTimeout(resolve, wait));

    setStrategyResult(generated);
    setStage3Locked(true);
    setExpandedCards({ safe: false, balanced: false, highEffort: false });
    setIsCalculatingStrategies(false);
    setTimeout(() => scrollTo(stage4Ref), 80);
  };

  const handleTryAgain = () => {
    setTargetCGPAInput('');
    setStage3Locked(false);
    setStrategyResult(null);
    scrollTo(stage3Ref);
  };

  const handleStartOver = () => {
    setIsHowToExpanded(true);
    setCurrentCGPAInput(cgpa.currentCGPA.toFixed(2));
    setCompletedCreditsInput(String(Math.round(cgpa.totalCredits)));
    const resetScale = normalizeToSupportedScale(cgpa.settings.gpaScale);
    setScaleInput(resetScale === 4 ? '4.0' : '5.0');
    setSemesterLabel('');
    setStage1Locked(false);
    setStage2Locked(false);
    setStage3Locked(false);
    setCourses([makeCourseRow()]);
    setCourseErrors({});
    setTargetCGPAInput('');
    setStrategyResult(null);
    setExpandedCards({ safe: false, balanced: false, highEffort: false });
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const stage2CanContinue = validCourses.length > 0;

  return (
    <div className="space-y-6">
      <header>
        <h1 className="text-2xl font-bold text-foreground">Grade Predictor</h1>
        <p className="mt-1 text-sm text-foreground-muted">Plan what you need to score next semester</p>
      </header>

      <div className="rounded-xl border border-border bg-surface p-3">
        <button
          type="button"
          onClick={handleHowToToggle}
          className="flex w-full items-center justify-between gap-2 text-left text-sm text-foreground-muted"
        >
          <span className="flex items-center gap-2">
            <Info className="h-4 w-4" />
            <span>How does this work?</span>
          </span>
          {isHowToExpanded ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
        </button>

        <AnimatePresence initial={false}>
          {isHowToExpanded && (
            <motion.div
              key="how-to"
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: 'auto', opacity: 1 }}
              exit={{ height: 0, opacity: 0 }}
              transition={{ duration: 0.2, ease: 'easeInOut' }}
              className="overflow-hidden"
            >
              <div className="pt-3 text-sm text-foreground-muted leading-relaxed">
                <ul className="space-y-2">
                  <li className="flex items-start gap-2">
                    <ClipboardList className="mt-0.5 h-4 w-4 shrink-0" />
                    <span>Enter your current CGPA and credits — we pull these from your profile automatically.</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <BookOpen className="mt-0.5 h-4 w-4 shrink-0" />
                    <span>Add the courses you'll take next semester with their credit units.</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <Target className="mt-0.5 h-4 w-4 shrink-0" />
                    <span>Set your target CGPA — we show you the maximum you can realistically achieve.</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0" />
                    <span>Get 3 clear strategies showing exactly what to score in each course.</span>
                  </li>
                </ul>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      <section className="rounded-xl border border-border bg-surface p-5">
        <h2 className="text-lg font-semibold text-foreground">Your Current Standing</h2>
        <p className="text-xs text-foreground-subtle">Pulled from your profile. Edit only if needed.</p>

        <div className="mt-4 grid grid-cols-2 gap-3">
          <label className="space-y-1">
            <span className="text-xs text-foreground-muted">Current CGPA</span>
            <input
              type="number"
              step="0.01"
              min={0}
              max={scale}
              value={currentCGPAInput}
              onChange={(event) => setCurrentCGPAInput(event.target.value)}
              disabled={stage1Locked}
              className="w-full rounded-lg border border-border bg-surface px-4 py-3 text-sm text-foreground transition-colors duration-150 focus:border-primary focus:ring-1 focus:ring-primary disabled:opacity-70"
            />
          </label>

          <label className="space-y-1">
            <span className="text-xs text-foreground-muted">Credits Completed</span>
            <input
              type="number"
              min={0}
              step={1}
              value={completedCreditsInput}
              onChange={(event) => setCompletedCreditsInput(event.target.value)}
              disabled={stage1Locked}
              className="w-full rounded-lg border border-border bg-surface px-4 py-3 text-sm text-foreground transition-colors duration-150 focus:border-primary focus:ring-1 focus:ring-primary disabled:opacity-70"
            />
          </label>

          <label className="space-y-1">
            <span className="text-xs text-foreground-muted">GPA Scale</span>
            <select
              value={scaleInput}
              onChange={(event) => setScaleInput(event.target.value === '4.0' ? '4.0' : '5.0')}
              disabled={stage1Locked}
              className="w-full rounded-lg border border-border bg-surface px-4 py-3 text-sm text-foreground transition-colors duration-150 focus:border-primary focus:ring-1 focus:ring-primary disabled:opacity-70"
            >
              <option value="5.0">5.0</option>
              <option value="4.0">4.0</option>
            </select>
          </label>

          <label className="space-y-1">
            <span className="text-xs text-foreground-muted">Planning For</span>
            <input
              type="text"
              value={semesterLabel}
              onChange={(event) => setSemesterLabel(event.target.value)}
              disabled={stage1Locked}
              placeholder="e.g. 300L First Semester"
              className="w-full rounded-lg border border-border bg-surface px-4 py-3 text-sm text-foreground transition-colors duration-150 focus:border-primary focus:ring-1 focus:ring-primary disabled:opacity-70"
            />
          </label>
        </div>

        <div className="mt-4">
          <p className="text-xs text-foreground-subtle">Grading system: {activeUniversityName}</p>
          <div className="mt-2 flex flex-wrap gap-2">
            {gradeOptions.map((grade) => (
              <span
                key={`${grade.label}-${grade.point}`}
                className="rounded-full border border-border bg-surface-elevated px-3 py-1 text-xs text-foreground-muted"
              >
                {grade.label} = {grade.point.toFixed(1)}pts
              </span>
            ))}
          </div>
        </div>

        <button
          type="button"
          onClick={handleStage1Continue}
          className="mt-6 w-full rounded-full bg-primary px-8 py-3 font-semibold text-white transition-colors duration-150 hover:bg-primary-hover"
        >
          Continue →
        </button>
      </section>

      {stage1Locked && (
        <section ref={stage2Ref} className="rounded-xl border border-border bg-surface p-5">
          <h2 className="text-lg font-semibold text-foreground">Next Semester Courses</h2>
          <p className="text-sm text-foreground-muted">Add your courses and credit units.</p>

          <div className="sticky top-0 z-20 mb-4 mt-4 rounded-xl border border-border bg-surface-elevated p-3">
            <div className="flex items-center justify-between">
              <span className="text-xs text-foreground-muted">Max attainable CGPA</span>
              {maxAttainableCGPA === null ? (
                <span className="text-xl font-bold text-foreground-muted">—</span>
              ) : (
                <span className={`text-xl font-bold ${maxClassification?.color ?? 'text-foreground'}`}>
                  {maxAttainableCGPA.toFixed(2)}
                </span>
              )}
            </div>
            <div className="mt-3 h-1.5 w-full rounded-full bg-border">
              <motion.div
                className="h-1.5 rounded-full bg-primary"
                initial={false}
                animate={{ width: `${maxAttainableCGPA === null ? 0 : (maxAttainableCGPA / scale) * 100}%` }}
                transition={{ duration: 0.2, ease: 'easeInOut' }}
              />
            </div>
          </div>

          <div className="rounded-xl border border-border">
            {courses.map((course, index) => (
              <div
                key={course.id}
                className={`p-3 ${index < courses.length - 1 ? 'border-b border-border' : ''}`}
              >
                <div className="flex items-start gap-2">
                  <div className="flex-1">
                    <input
                      type="text"
                      placeholder="e.g. MTH 301"
                      value={course.name}
                      onChange={(event) => updateCourse(course.id, { name: event.target.value })}
                      disabled={stage2Locked}
                      className="w-full rounded-lg border border-border bg-surface px-4 py-3 text-sm text-foreground transition-colors duration-150 focus:border-primary focus:ring-1 focus:ring-primary disabled:opacity-70"
                    />
                    {courseErrors[course.id]?.name && (
                      <p className="mt-1 text-xs text-destructive">{courseErrors[course.id].name}</p>
                    )}
                  </div>

                  <div className="w-20">
                    {index === 0 && <p className="mb-1 text-xs text-foreground-muted">Units</p>}
                    <input
                      type="number"
                      min={1}
                      max={6}
                      step={1}
                      value={course.units}
                      onChange={(event) => updateCourse(course.id, { units: event.target.value })}
                      disabled={stage2Locked}
                      className="w-20 rounded-lg border border-border bg-surface px-2 py-3 text-center text-sm text-foreground transition-colors duration-150 focus:border-primary focus:ring-1 focus:ring-primary disabled:opacity-70"
                    />
                    {courseErrors[course.id]?.units && (
                      <p className="mt-1 text-xs text-destructive">{courseErrors[course.id].units}</p>
                    )}
                  </div>

                  {courses.length > 1 && (
                    <button
                      type="button"
                      onClick={() => removeCourse(course.id)}
                      disabled={stage2Locked}
                      className="rounded-lg p-2 text-destructive transition-colors hover:bg-destructive/10 disabled:opacity-70"
                    >
                      <Trash2 className="h-4 w-4" />
                    </button>
                  )}
                </div>
              </div>
            ))}
          </div>

          <button
            type="button"
            onClick={addCourse}
            disabled={stage2Locked || courses.length >= MAX_COURSES}
            className="mt-3 flex w-full items-center justify-center gap-2 rounded-lg border border-dashed border-border bg-transparent px-4 py-2 text-sm text-foreground-muted transition-colors duration-150 hover:border-primary hover:text-primary disabled:cursor-not-allowed disabled:opacity-70"
          >
            <Plus className="h-4 w-4" />
            {courses.length >= MAX_COURSES ? 'Maximum 12 courses' : 'Add Course'}
          </button>

          <p className="mt-3 text-right text-sm text-foreground-muted">Total units next semester: {enteredTotalUnits}</p>

          <button
            type="button"
            onClick={handleStage2Continue}
            disabled={!stage2CanContinue || stage2Locked}
            className="mt-6 w-full rounded-full bg-primary px-8 py-3 font-semibold text-white transition-colors duration-150 hover:bg-primary-hover disabled:cursor-not-allowed disabled:opacity-70"
          >
            Calculate Maximum CGPA →
          </button>
        </section>
      )}

      {stage2Locked && (
        <section ref={stage3Ref} className="rounded-xl border border-border bg-surface p-5">
          <div className="rounded-xl border border-border bg-surface p-5 text-center">
            <p className="text-sm text-foreground-muted">Your Maximum Attainable CGPA</p>
            <motion.p
              key={maxAttainableCGPA ?? 'none'}
              initial={{ opacity: 0, scale: 0.92 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ duration: 0.2 }}
              className={`mt-2 text-5xl font-bold ${maxClassification?.color ?? 'text-foreground'}`}
            >
              {maxAttainableCGPA?.toFixed(2) ?? '—'}
            </motion.p>
            {maxClassification && (
              <p className={`mx-auto mt-3 inline-flex rounded-full px-3 py-1 text-sm ${getTierBadgeClasses(maxClassification.tier)}`}>
                {maxClassification.label}
              </p>
            )}
            <p className="mt-2 text-xs text-foreground-subtle">
              If you score {highestGradeLabel} in all {totalNextUnits} units
            </p>
          </div>

          <div className="mt-6">
            <p className="text-base font-semibold text-foreground">What CGPA are you targeting?</p>
            <p className="mb-3 mt-1 text-xs text-foreground-muted">
              Must be between your current CGPA and the maximum above.
            </p>
            <input
              type="number"
              inputMode="decimal"
              step="0.01"
              min={currentCGPA}
              max={maxAttainableCGPA ?? scale}
              placeholder="e.g. 3.50"
              value={targetCGPAInput}
              onChange={(event) => setTargetCGPAInput(event.target.value)}
              disabled={stage3Locked}
              className={`w-full rounded-lg border bg-surface px-4 py-3 text-sm text-foreground transition-colors duration-150 focus:ring-1 ${
                targetValidation.state === 'high' || targetValidation.state === 'low'
                  ? 'border-destructive focus:border-destructive focus:ring-destructive'
                  : targetValidation.state === 'valid'
                    ? 'border-success focus:border-success focus:ring-success'
                    : 'border-border focus:border-primary focus:ring-primary'
              } disabled:opacity-70`}
            />

            {targetValidation.message && (
              <p
                className={`mt-2 text-xs ${
                  targetValidation.state === 'valid' ? 'text-success' : 'text-destructive'
                }`}
              >
                {targetValidation.message}
              </p>
            )}

            <button
              type="button"
              onClick={handleFindStrategies}
              disabled={!targetValidation.isValid || stage3Locked || isCalculatingStrategies}
              className="mt-6 flex w-full items-center justify-center gap-2 rounded-full bg-primary px-8 py-3 font-semibold text-white transition-colors duration-150 hover:bg-primary-hover disabled:cursor-not-allowed disabled:opacity-70"
            >
              {isCalculatingStrategies && <Loader2 className="h-4 w-4 animate-spin" />}
              {isCalculatingStrategies ? 'Calculating...' : 'Find My Strategies →'}
            </button>
          </div>
        </section>
      )}

      {stage3Locked && strategyResult && (
        <section ref={stage4Ref} className="space-y-4 rounded-xl border border-border bg-surface p-5">
          <div>
            <h2 className="text-xl font-bold text-foreground">
              Ways to achieve {round2(targetValue).toFixed(2)}
              {semesterLabel.trim() ? ` in ${semesterLabel.trim()}` : ''}
            </h2>
            <p className="text-sm text-foreground-muted">
              {strategyResult.strategies.length} {strategyResult.strategies.length === 1 ? 'strategy' : 'strategies'} found
            </p>
          </div>

          {strategyResult.hasNoSolution ? (
            <div className="rounded-xl border border-border bg-surface p-5">
              <p className="flex items-center gap-2 text-lg font-semibold text-destructive">
                <XCircle className="h-5 w-5" />
                Target Not Achievable
              </p>
              <p className="mt-2 text-sm text-foreground-muted">
                Your target CGPA of {round2(targetValue).toFixed(2)} is not achievable with {totalNextUnits} units next semester.
                Your maximum is {strategyResult.maxAttainableCGPA.toFixed(2)}. Try lowering your target or consider registering
                for more credit units.
              </p>
              <button
                type="button"
                onClick={handleTryAgain}
                className="mt-4 rounded-full bg-primary px-6 py-2 text-sm font-semibold text-white transition-colors hover:bg-primary-hover"
              >
                Try Again
              </button>
            </div>
          ) : (
            strategyResult.strategies.map((strategy) => {
              const meta = getStrategyMeta(strategy.type);
              const classification = getClassification(strategy.resultingCGPA, scale);
              const isOpen = expandedCards[strategy.type];
              const feasibilityTextClass = getFeasibilityClasses(strategy.feasibilityScore);
              const feasibilityBarClass = getFeasibilityBarClasses(strategy.feasibilityScore);

              return (
                <div
                  key={strategy.type}
                  className={`mb-4 rounded-xl border border-border bg-surface ${meta.borderClass}`}
                >
                  <button
                    type="button"
                    onClick={() =>
                      setExpandedCards((prev) => ({
                        ...prev,
                        [strategy.type]: !prev[strategy.type],
                      }))
                    }
                    className="w-full px-4 py-4 text-left"
                  >
                    <div className="flex items-start justify-between gap-3">
                      <div className="flex items-start gap-2">
                        <span className="mt-0.5 text-foreground-muted">{meta.icon}</span>
                        <div>
                          <p className="text-base font-bold text-foreground">{strategy.label}</p>
                          <p className="text-xs text-foreground-muted">{strategy.description}</p>
                        </div>
                      </div>

                      <div className="text-right">
                        <p className={`text-lg font-bold ${classification.color}`}>{strategy.resultingCGPA.toFixed(2)}</p>
                        <p className={`text-xs ${classification.color}`}>{classification.label}</p>
                      </div>
                    </div>

                    <div className="mt-3">
                      <div className="mb-1 flex items-center justify-between text-xs">
                        <span className="text-foreground-muted">Feasibility</span>
                        <span className={feasibilityTextClass}>{strategy.feasibilityScore}%</span>
                      </div>
                      <div className="h-1.5 w-full rounded-full bg-border">
                        <motion.div
                          className={`h-1.5 rounded-full ${feasibilityBarClass}`}
                          initial={{ width: 0 }}
                          animate={{ width: `${strategy.feasibilityScore}%` }}
                          transition={{ duration: 0.25, ease: 'easeOut' }}
                        />
                      </div>
                      <p className="mt-1 text-xs text-foreground-subtle">
                        Minimum grade needed: {strategy.minimumGradeRequired}
                      </p>
                    </div>

                    <div className="mt-2 flex justify-end text-foreground-muted">
                      {isOpen ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
                    </div>
                  </button>

                  <AnimatePresence initial={false}>
                    {isOpen && (
                      <motion.div
                        initial={{ height: 0, opacity: 0 }}
                        animate={{ height: 'auto', opacity: 1 }}
                        exit={{ height: 0, opacity: 0 }}
                        transition={{ duration: 0.2, ease: 'easeInOut' }}
                        className="overflow-hidden border-t border-border"
                      >
                        <div>
                          <div className="grid grid-cols-[1.8fr_0.8fr_0.8fr_1.2fr] bg-surface-elevated px-3 py-2 text-xs font-semibold uppercase tracking-wide text-foreground-muted">
                            <span>Course</span>
                            <span>Units</span>
                            <span>Score</span>
                            <span>Grade Point</span>
                          </div>

                          {strategy.assignments.map((assignment, index) => (
                            <div
                              key={`${strategy.type}-${assignment.courseName}`}
                              className={`grid grid-cols-[1.8fr_0.8fr_0.8fr_1.2fr] items-center border-b border-border px-3 py-3 text-sm text-foreground ${
                                index % 2 === 0 ? 'bg-surface' : 'bg-surface-elevated'
                              }`}
                            >
                              <span>{assignment.courseName}</span>
                              <span>{assignment.units}</span>
                              <span className={getScoreClass(assignment.gradeLabel)}>{assignment.minScore}+</span>
                              <span className="text-foreground-muted">
                                {assignment.gradeLabel} ({assignment.gradePoint.toFixed(1)})
                              </span>
                            </div>
                          ))}

                          <div className="bg-surface-elevated py-3 text-center text-sm font-semibold text-foreground">
                            Resulting CGPA: {strategy.resultingCGPA.toFixed(2)} · Classification: {classification.label}
                          </div>
                        </div>
                      </motion.div>
                    )}
                  </AnimatePresence>
                </div>
              );
            })
          )}

          <button
            type="button"
            onClick={handleStartOver}
            className="w-full rounded-full border border-border bg-transparent px-6 py-2 text-sm text-foreground-muted transition-colors duration-150 hover:bg-surface-elevated hover:text-foreground"
          >
            START OVER
          </button>
        </section>
      )}
    </div>
  );
}
