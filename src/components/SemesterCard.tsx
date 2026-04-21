import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Plus, Trash2, ChevronDown, ChevronUp } from 'lucide-react';
import { Semester, Course } from '@/hooks/useCGPA';
import { useState } from 'react';
import AddCourseDialog from './AddCourseDialog';
import type { CourseHistory } from '@/utils/carryoverDetector';

interface SemesterCardProps {
  semester: Semester;
  gpa: number;
  isExpanded: boolean;
  onToggleExpand: () => void;
  onRemove: () => void;
  onAddCourse: (course: Omit<Course, 'id'>) => void;
  onUpdateCourse: (courseId: string, updates: Partial<Course>) => void;
  onRemoveCourse: (courseId: string) => void;
  gpaScale?: number;
  semesterNames?: string[];
  previousCourses?: CourseHistory[];
  passThreshold?: number;
}

export default function SemesterCard({
  semester,
  gpa,
  isExpanded,
  onToggleExpand,
  onRemove,
  onAddCourse,
  onUpdateCourse,
  onRemoveCourse,
  gpaScale = 5.0,
  semesterNames = [],
  previousCourses = [],
  passThreshold = 1.0,
}: SemesterCardProps) {
  const [showAddCourse, setShowAddCourse] = useState(false);

  const getGPAColor = (gpa: number) => {
    const threshold = gpaScale * 0.74;
    const midHigh = gpaScale * 0.66;
    const mid = gpaScale * 0.6;
    if (gpa >= threshold) return 'bg-emerald-100 text-emerald-700 border-emerald-300';
    if (gpa >= midHigh) return 'bg-cyan-100 text-primary border-cyan-300';
    if (gpa >= mid) return 'bg-amber-100 text-amber-700 border-amber-300';
    return 'bg-orange-100 text-orange-700 border-orange-300';
  };

  return (
    <>
      <Card
        className={`overflow-hidden shadow-lg border-0 transition-all duration-300 hover:shadow-xl ${
          isExpanded ? 'ring-2 ring-cyan-400' : ''
        }`}
      >
        {/* Header */}
        <div
          className="bg-primary p-6 cursor-pointer hover:from-cyan-700 hover:to-teal-700 transition-all"
          onClick={onToggleExpand}
        >
          <div className="flex items-center justify-between">
            <div className="flex-1">
              <h3 className="text-lg font-bold text-foreground">{semester.name}</h3>
              <p className="text-foreground-muted text-sm mt-1">
                {semester.courses.length} courses
                {semester.courses.some(c => c.isCarryover) && (
                  <span className="ml-2 inline-flex items-center rounded bg-orange-500/20 px-1.5 py-0.5 text-xs font-medium text-foreground-muted">
                    🔄 {semester.courses.filter(c => c.isCarryover).length} carryover
                  </span>
                )}
              </p>
            </div>
            <div className="text-right mr-4">
              <div className={`text-3xl font-bold text-foreground gpa-value`}>{gpa.toFixed(2)}</div>
              <p className="text-foreground-muted text-xs mt-1">Semester GPA</p>
            </div>
            <div className="text-foreground">
              {isExpanded ? <ChevronUp className="w-6 h-6" /> : <ChevronDown className="w-6 h-6" />}
            </div>
          </div>
        </div>

        {/* Content */}
        {isExpanded && (
          <div className="p-6 bg-surface">
            {/* Courses List */}
            {semester.courses.length > 0 ? (
              <div className="space-y-3 mb-6">
                {semester.courses.map(course => (
                  <div
                    key={course.id}
                    className={`flex items-center justify-between p-4 rounded-lg border transition-colors ${
                      course.isCarryover
                        ? 'bg-orange-50 border-orange-200 hover:border-orange-300'
                        : 'bg-surface-elevated border-border hover:border-cyan-300'
                    }`}
                  >
                    <div className="flex-1">
                      <div className="flex items-center gap-2">
                        <p className="font-semibold text-slate-900">{course.name}</p>
                        {course.isCarryover && (
                          <span className="inline-flex items-center rounded-full bg-orange-100 px-2 py-0.5 text-xs font-medium text-orange-700 border border-orange-200">
                            🔄 Carryover
                          </span>
                        )}
                        {course.isCarryover && course.isCarryoverPassed && (
                          <span className="inline-flex items-center rounded-full bg-emerald-100 px-2 py-0.5 text-xs font-medium text-emerald-700 border border-emerald-200">
                            ✅ Cleared
                          </span>
                        )}
                      </div>
                      <div className="flex gap-4 mt-2 text-sm text-foreground-muted">
                        <span>Credits: {course.credits}</span>
                        <span className="font-mono font-semibold text-primary">
                          Grade Point: {course.gradePoint.toFixed(1)}
                        </span>
                      </div>
                      {course.isCarryover && course.originalSemester && (
                        <p className="text-xs text-orange-600 mt-1">
                          Originally failed in: {course.originalSemester}
                        </p>
                      )}
                    </div>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => onRemoveCourse(course.id)}
                      className="text-red-600 hover:bg-red-50 hover:text-red-700"
                    >
                      <Trash2 className="w-4 h-4" />
                    </Button>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-foreground-subtle text-center py-6">No courses added yet</p>
            )}

            {/* Action Buttons */}
            <div className="flex gap-3 pt-4 border-t border-border">
              <Button
                onClick={() => setShowAddCourse(true)}
                className="flex-1 bg-primary hover:bg-primary-hover text-foreground gap-2"
              >
                <Plus className="w-4 h-4" />
                Add Course
              </Button>
              <Button
                onClick={onRemove}
                variant="outline"
                className="text-red-600 border-red-200 hover:bg-red-50"
              >
                <Trash2 className="w-4 h-4" />
              </Button>
            </div>
          </div>
        )}
      </Card>

      {/* Add Course Dialog */}
      <AddCourseDialog
        open={showAddCourse}
        onOpenChange={setShowAddCourse}
        onAdd={(course: Omit<Course, 'id'>) => {
          onAddCourse(course);
          setShowAddCourse(false);
        }}
        gpaScale={gpaScale}
        semesterNames={semesterNames}
        previousCourses={previousCourses}
        passThreshold={passThreshold}
      />
    </>
  );
}
