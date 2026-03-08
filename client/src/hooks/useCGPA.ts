import { useState, useCallback, useEffect } from 'react';
import type { GradeRange } from '@/universities/types';
import { DEFAULT_NIGERIAN_GRADES } from '@/universities/types';

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

const getDefaultSettings = (): AppSettings => ({
  gpaScale: 5.0,
  gradeRanges: [...DEFAULT_NIGERIAN_GRADES],
  activeUniversity: null,
});

const loadSettings = (): AppSettings => {
  if (typeof window === 'undefined') return getDefaultSettings();
  const saved = localStorage.getItem(SETTINGS_KEY);
  if (saved) {
    try {
      return JSON.parse(saved) as AppSettings;
    } catch {
      return getDefaultSettings();
    }
  }
  // First launch: save defaults
  const defaults = getDefaultSettings();
  localStorage.setItem(SETTINGS_KEY, JSON.stringify(defaults));
  return defaults;
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
  const [data, setData] = useState<CGPAData>(() => {
    if (typeof window === 'undefined') return getInitialData();
    const saved = localStorage.getItem('cgpa-calculator-data');
    if (saved) {
      try {
        const parsed = JSON.parse(saved) as CGPAData;
        // Migrate old data: ensure settings exist
        if (!parsed.settings) {
          parsed.settings = loadSettings();
        }
        // Migrate old courses: ensure carryover fields exist
        parsed.semesters = parsed.semesters.map(sem => ({
          ...sem,
          courses: sem.courses.map(c => ({
            ...c,
            isCarryover: c.isCarryover ?? false,
            originalSemester: c.originalSemester ?? null,
            isCarryoverPassed: c.isCarryoverPassed ?? false,
          })),
        }));
        return parsed;
      } catch {
        return getInitialData();
      }
    }
    return getInitialData();
  });

  // Save to localStorage whenever data changes
  useEffect(() => {
    localStorage.setItem('cgpa-calculator-data', JSON.stringify(data));
  }, [data]);

  // Save settings separately for persistence
  useEffect(() => {
    localStorage.setItem(SETTINGS_KEY, JSON.stringify(data.settings));
  }, [data.settings]);

  const calculateSemesterGPA = (courses: Course[]): number => {
    if (courses.length === 0) return 0;
    const totalPoints = courses.reduce((sum, course) => sum + course.gradePoint * course.credits, 0);
    const totalCredits = courses.reduce((sum, course) => sum + course.credits, 0);
    return totalCredits === 0 ? 0 : parseFloat((totalPoints / totalCredits).toFixed(2));
  };

  // Carryover-aware CGPA calculation: only counts latest attempt for repeated courses
  const calculateCGPA = useCallback((semesters: Semester[]): { cgpa: number; totalCredits: number; totalGradePoints: number } => {
    // Build a set of normalized carryover course names for O(1) lookups
    const carryoverNames = new Set<string>();
    semesters.forEach(semester => {
      semester.courses.forEach(course => {
        if (course.isCarryover) {
          carryoverNames.add(course.name.toLowerCase().replace(/\s+/g, ''));
        }
      });
    });

    // Collect all courses, tracking latest attempt per course name for carryovers
    const courseMap = new Map<string, { gradePoint: number; credits: number; semesterIndex: number }>();
    const nonCarryoverCourses: { gradePoint: number; credits: number }[] = [];

    semesters.forEach((semester, semesterIndex) => {
      semester.courses.forEach(course => {
        const key = course.name.toLowerCase().replace(/\s+/g, '');
        if (course.isCarryover || carryoverNames.has(key)) {
          // This course has a carryover relationship — track latest attempt only
          const existing = courseMap.get(key);
          if (!existing || semesterIndex > existing.semesterIndex) {
            courseMap.set(key, {
              gradePoint: course.gradePoint,
              credits: course.credits,
              semesterIndex,
            });
          }
        } else {
          nonCarryoverCourses.push({
            gradePoint: course.gradePoint,
            credits: course.credits,
          });
        }
      });
    });

    let totalGradePoints = 0;
    let totalCredits = 0;

    // Add non-carryover courses
    nonCarryoverCourses.forEach(course => {
      totalGradePoints += course.gradePoint * course.credits;
      totalCredits += course.credits;
    });

    // Add only latest attempt for carryover courses
    courseMap.forEach(course => {
      totalGradePoints += course.gradePoint * course.credits;
      totalCredits += course.credits;
    });

    const cgpa = totalCredits === 0 ? 0 : parseFloat((totalGradePoints / totalCredits).toFixed(2));
    return { cgpa, totalCredits, totalGradePoints };
  }, []);

  const addSemester = useCallback((semesterName: string) => {
    const newSemester: Semester = {
      id: Date.now().toString(),
      name: semesterName || `Semester ${data.semesters.length + 1}`,
      courses: [],
    };

    setData(prevData => {
      const updatedSemesters = [...prevData.semesters, newSemester];
      const { cgpa, totalCredits, totalGradePoints } = calculateCGPA(updatedSemesters);
      return {
        ...prevData,
        semesters: updatedSemesters,
        currentCGPA: cgpa,
        totalCredits,
        totalGradePoints,
      };
    });
  }, [data.semesters.length, calculateCGPA]);

  const removeSemester = useCallback((semesterId: string) => {
    setData(prevData => {
      const updatedSemesters = prevData.semesters.filter(s => s.id !== semesterId);
      const { cgpa, totalCredits, totalGradePoints } = calculateCGPA(updatedSemesters);
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
  }, [calculateCGPA]);

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

      const { cgpa, totalCredits, totalGradePoints } = calculateCGPA(updatedSemesters);
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
  }, [calculateCGPA]);

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

      const { cgpa, totalCredits, totalGradePoints } = calculateCGPA(updatedSemesters);
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
  }, [calculateCGPA]);

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

      const { cgpa, totalCredits, totalGradePoints } = calculateCGPA(updatedSemesters);
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
  }, [calculateCGPA]);

  const clearAllData = useCallback(() => {
    setData(getInitialData());
  }, []);

  const updateSettings = useCallback((newSettings: Partial<AppSettings>) => {
    setData(prevData => ({
      ...prevData,
      settings: { ...prevData.settings, ...newSettings },
    }));
  }, []);

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
