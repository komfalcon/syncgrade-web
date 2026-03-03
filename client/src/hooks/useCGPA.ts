import { useState, useCallback, useEffect } from 'react';

export interface Course {
  id: string;
  name: string;
  credits: number;
  gradePoint: number;
}

export interface Semester {
  id: string;
  name: string;
  courses: Course[];
}

interface CGPAData {
  semesters: Semester[];
  currentCGPA: number;
  totalCredits: number;
  totalGradePoints: number;
  semesterGPAs: { [key: string]: number };
}

const GPA_SCALE = 4.0;

const getInitialData = (): CGPAData => ({
  semesters: [],
  currentCGPA: 0,
  totalCredits: 0,
  totalGradePoints: 0,
  semesterGPAs: {},
});

export function useCGPA() {
  const [data, setData] = useState<CGPAData>(() => {
    if (typeof window === 'undefined') return getInitialData();
    const saved = localStorage.getItem('cgpa-calculator-data');
    if (saved) {
      try {
        return JSON.parse(saved);
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

  const calculateSemesterGPA = (courses: Course[]): number => {
    if (courses.length === 0) return 0;
    const totalPoints = courses.reduce((sum, course) => sum + course.gradePoint * course.credits, 0);
    const totalCredits = courses.reduce((sum, course) => sum + course.credits, 0);
    return totalCredits === 0 ? 0 : parseFloat((totalPoints / totalCredits).toFixed(2));
  };

  const calculateCGPA = useCallback((semesters: Semester[]): { cgpa: number; totalCredits: number; totalGradePoints: number } => {
    let totalGradePoints = 0;
    let totalCredits = 0;

    semesters.forEach(semester => {
      semester.courses.forEach(course => {
        totalGradePoints += course.gradePoint * course.credits;
        totalCredits += course.credits;
      });
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

  return {
    ...data,
    addSemester,
    removeSemester,
    addCourse,
    updateCourse,
    removeCourse,
    clearAllData,
    calculateSemesterGPA,
  };
}
