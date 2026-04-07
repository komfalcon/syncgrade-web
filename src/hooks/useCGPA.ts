import { useState, useCallback, useEffect } from 'react';
import type { GradeRange } from '@/universities/types';
import { DEFAULT_NIGERIAN_GRADES } from '@/universities/types';
import { calculateCGPA as calculateEngineCGPA } from '@/engine/calculations';
import { appDb, getStoredValue, removeStoredValue, setStoredValue, STORAGE_KEYS } from '@/storage/db';
import { useUniversities } from '@/hooks/useUniversities';
import { normalizeToSupportedScale } from '@/utils/gpaLogic';
import { incrementInteractionCount } from '@/hooks/useFeedbackTrigger';

export interface Course {
  id: string;
  name: string;
  credits: number;
  gradePoint: number;
  isCarryover: boolean;
  originalSemester: string | null;
  isCarryoverPassed: boolean;
}

export interface Semester {
  id: string;
  name: string;
  courses: Course[];
}

export interface AppSettings {
  gpaScale: number;
  gradeRanges: GradeRange[];
  activeUniversity: string | null;
  admissionSession: string | null;
  repeatPolicy: 'replace' | 'average' | 'both' | 'highest';
  studentName: string;
  programme: string;
}

interface CGPAData {
  semesters: Semester[];
  currentCGPA: number;
  totalCredits: number;
  totalGradePoints: number;
  semesterGPAs: { [key: string]: number };
  settings: AppSettings;
}

const SETTINGS_KEY = 'cgpa-calculator-settings';
const DATA_KEY = 'cgpa-calculator-data';
export const GPA_SCALE_UPDATED_EVENT = 'syncgrade:gpa-scale-updated';

export const getDefaultSettings = (): AppSettings => ({
  gpaScale: 5.0,
  gradeRanges: [...DEFAULT_NIGERIAN_GRADES],
  activeUniversity: null,
  admissionSession: null,
  repeatPolicy: 'replace',
  studentName: "",
  programme: "",
});

const loadSettings = (): AppSettings => {
  return getDefaultSettings();
};

const getInitialData = (): CGPAData => ({
  semesters: [],
  currentCGPA: 0,
  totalCredits: 0,
  totalGradePoints: 0,
  semesterGPAs: {},
  settings: loadSettings(),
});

export function useCGPA() {
  const [data, setData] = useState<CGPAData>(getInitialData());
  const [hydrated, setHydrated] = useState(false);
  const { universities } = useUniversities();

  useEffect(() => {
    let active = true;
    (async () => {
      if (typeof window === 'undefined') return;
      try {
        const savedDataRaw = await getStoredValue(DATA_KEY);
        const savedSettingsRaw = await getStoredValue(SETTINGS_KEY);

        const parsedData = savedDataRaw ? (JSON.parse(savedDataRaw) as CGPAData) : null;
        const parsedSettings = savedSettingsRaw
          ? (JSON.parse(savedSettingsRaw) as AppSettings)
          : null;

        const next = parsedData ?? getInitialData();
        const rawSettings = parsedSettings ?? next.settings ?? getDefaultSettings();
        next.settings = { ...getDefaultSettings(), ...rawSettings };
        next.semesters = (next.semesters ?? []).map((sem) => ({
          ...sem,
          courses: (sem.courses ?? []).map((c) => ({
            ...c,
            isCarryover: c.isCarryover ?? false,
            originalSemester: c.originalSemester ?? null,
            isCarryoverPassed: c.isCarryoverPassed ?? false,
          })),
        }));

        if (active) {
          setData(next);
        }
      } catch {
        if (active) setData(getInitialData());
      } finally {
        if (active) setHydrated(true);
      }
    })();
    return () => {
      active = false;
    };
  }, []);

  // Persist full state snapshot
  useEffect(() => {
    if (!hydrated) return;
    void setStoredValue(STORAGE_KEYS.cgpaData, JSON.stringify(data));
  }, [data, hydrated]);

  // Persist settings separately
  useEffect(() => {
    if (!hydrated) return;
    void setStoredValue(STORAGE_KEYS.settings, JSON.stringify(data.settings));
  }, [data.settings, hydrated]);

  const calculateSemesterGPA = (courses: Course[]): number => {
    if (courses.length === 0) return 0;
    const totalPoints = courses.reduce((sum, course) => sum + course.gradePoint * course.credits, 0);
    const totalCredits = courses.reduce((sum, course) => sum + course.credits, 0);
    return totalCredits === 0 ? 0 : parseFloat((totalPoints / totalCredits).toFixed(2));
  };

  const getGradeFromPoints = (gradePoint: number, grades: GradeRange[]): string => {
    const sorted = [...grades].sort((a, b) => b.points - a.points);
    for (const grade of sorted) {
      if (gradePoint >= grade.points) return grade.grade;
    }
    return sorted[sorted.length - 1]?.grade ?? 'F';
  };

  // Policy-aware CGPA calculation driven by active university repeat policy
  const calculateProgramSummary = useCallback((
    semesters: Semester[],
    settings: AppSettings = data.settings,
  ): { cgpa: number; totalCredits: number; totalGradePoints: number } => {
    const activeUniversity = settings.activeUniversity ?? null;
    const activeUni = universities.find(
      (u) => u.shortName === activeUniversity,
    );
    const repeatPolicy = settings.repeatPolicy ?? activeUni?.repeatPolicy.method ?? 'replace';
    const grades = settings.gradeRanges ?? getDefaultSettings().gradeRanges;
    const semesterInputs = semesters.map((semester) => ({
      name: semester.name,
      courses: semester.courses.map((course) => {
        const grade =
          grades.find((g) => g.points === course.gradePoint)?.grade ??
          getGradeFromPoints(course.gradePoint, grades);
        return {
          name: course.name,
          credits: Math.round(course.credits),
          grade,
        };
      }),
    }));

    const result = calculateEngineCGPA(semesterInputs, grades, repeatPolicy);
    return {
      cgpa: result.cgpa,
      totalCredits: result.totalCredits,
      totalGradePoints: result.totalQualityPoints,
    };
  }, [data.settings, universities]);

  const addSemester = useCallback((semesterName: string) => {
    const newSemester: Semester = {
      id: Date.now().toString(),
      name: semesterName || `Semester ${data.semesters.length + 1}`,
      courses: [],
    };

    setData(prevData => {
      const updatedSemesters = [...prevData.semesters, newSemester];
      const { cgpa, totalCredits, totalGradePoints } = calculateProgramSummary(updatedSemesters, prevData.settings);
      return {
        ...prevData,
        semesters: updatedSemesters,
        currentCGPA: cgpa,
        totalCredits,
        totalGradePoints,
      };
    });
    incrementInteractionCount();
  }, [data.semesters.length, calculateProgramSummary]);

  const removeSemester = useCallback((semesterId: string) => {
    setData(prevData => {
      const updatedSemesters = prevData.semesters.filter(s => s.id !== semesterId);
      const { cgpa, totalCredits, totalGradePoints } = calculateProgramSummary(updatedSemesters, prevData.settings);
      const semesterGPAs = { ...prevData.semesterGPAs };
      delete semesterGPAs[semesterId];
      return {
        ...prevData,
        semesters: updatedSemesters,
        currentCGPA: cgpa,
        totalCredits,
        totalGradePoints,
        semesterGPAs,
      };
    });
    incrementInteractionCount();
  }, [calculateProgramSummary]);

  const addCourse = useCallback((semesterId: string, course: Omit<Course, 'id'>) => {
    setData(prevData => {
      const updatedSemesters = prevData.semesters.map(semester => {
        if (semester.id === semesterId) {
          return {
            ...semester,
            courses: [...semester.courses, { ...course, id: Date.now().toString() }],
          };
        }
        return semester;
      });

      const { cgpa, totalCredits, totalGradePoints } = calculateProgramSummary(updatedSemesters, prevData.settings);
      const semesterGPAs = { ...prevData.semesterGPAs };
      const semester = updatedSemesters.find(s => s.id === semesterId);
      if (semester) {
        semesterGPAs[semesterId] = calculateSemesterGPA(semester.courses);
      }

      return {
        ...prevData,
        semesters: updatedSemesters,
        currentCGPA: cgpa,
        totalCredits,
        totalGradePoints,
        semesterGPAs,
      };
    });
    incrementInteractionCount();
  }, [calculateProgramSummary]);

  const updateCourse = useCallback((semesterId: string, courseId: string, updates: Partial<Course>) => {
    setData(prevData => {
      const updatedSemesters = prevData.semesters.map(semester => {
        if (semester.id === semesterId) {
          return {
            ...semester,
            courses: semester.courses.map(course =>
              course.id === courseId ? { ...course, ...updates } : course
            ),
          };
        }
        return semester;
      });

      const { cgpa, totalCredits, totalGradePoints } = calculateProgramSummary(updatedSemesters, prevData.settings);
      const semesterGPAs = { ...prevData.semesterGPAs };
      const semester = updatedSemesters.find(s => s.id === semesterId);
      if (semester) {
        semesterGPAs[semesterId] = calculateSemesterGPA(semester.courses);
      }

      return {
        ...prevData,
        semesters: updatedSemesters,
        currentCGPA: cgpa,
        totalCredits,
        totalGradePoints,
        semesterGPAs,
      };
    });
    incrementInteractionCount();
  }, [calculateProgramSummary]);

  const removeCourse = useCallback((semesterId: string, courseId: string) => {
    setData(prevData => {
      const updatedSemesters = prevData.semesters.map(semester => {
        if (semester.id === semesterId) {
          return {
            ...semester,
            courses: semester.courses.filter(c => c.id !== courseId),
          };
        }
        return semester;
      });

      const { cgpa, totalCredits, totalGradePoints } = calculateProgramSummary(updatedSemesters, prevData.settings);
      const semesterGPAs = { ...prevData.semesterGPAs };
      const semester = updatedSemesters.find(s => s.id === semesterId);
      if (semester) {
        semesterGPAs[semesterId] = calculateSemesterGPA(semester.courses);
      }

      return {
        ...prevData,
        semesters: updatedSemesters,
        currentCGPA: cgpa,
        totalCredits,
        totalGradePoints,
        semesterGPAs,
      };
    });
  }, [calculateProgramSummary]);

  const clearAllData = useCallback(async () => {
    setData(getInitialData());
    await Promise.all([
      removeStoredValue(STORAGE_KEYS.cgpaData),
      removeStoredValue(STORAGE_KEYS.settings),
      removeStoredValue(STORAGE_KEYS.predictions),
      removeStoredValue(STORAGE_KEYS.onboardingComplete),
      appDb.customUniversities.clear(),
      appDb.userProfile.clear(),
      appDb.user_profile.clear(),
    ]);
    if (typeof window !== "undefined") {
      localStorage.removeItem(STORAGE_KEYS.syncgradeUser);
      window.location.reload();
    }
  }, []);

  const updateSettings = useCallback((newSettings: Partial<AppSettings>) => {
    setData(prevData => {
      const mergedSettings = { ...prevData.settings, ...newSettings };
      if (typeof window !== 'undefined' && typeof newSettings.gpaScale === 'number') {
        window.dispatchEvent(
          new CustomEvent(GPA_SCALE_UPDATED_EVENT, {
            detail: { scale: normalizeToSupportedScale(newSettings.gpaScale) },
          }),
        );
      }
      const { cgpa, totalCredits, totalGradePoints } = calculateProgramSummary(
        prevData.semesters,
        mergedSettings,
      );
      return {
        ...prevData,
        settings: mergedSettings,
        currentCGPA: cgpa,
        totalCredits,
        totalGradePoints,
      };
    });
  }, [calculateProgramSummary]);

  // Carryover statistics
  const carryoverStats = {
    total: data.semesters.reduce(
      (count, sem) => count + sem.courses.filter(c => c.isCarryover).length,
      0
    ),
    cleared: data.semesters.reduce(
      (count, sem) => count + sem.courses.filter(c => c.isCarryover && c.isCarryoverPassed).length,
      0
    ),
    active: data.semesters.reduce(
      (count, sem) => count + sem.courses.filter(c => c.isCarryover && !c.isCarryoverPassed).length,
      0
    ),
  };

  return {
    ...data,
    addSemester,
    removeSemester,
    addCourse,
    updateCourse,
    removeCourse,
    clearAllData,
    calculateSemesterGPA,
    updateSettings,
    carryoverStats,
  };
}
