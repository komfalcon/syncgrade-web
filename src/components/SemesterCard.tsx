import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Plus, Trash2, ChevronDown, ChevronUp } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
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
    if (gpa >= threshold) return 'bg-emerald-500/20 text-emerald-300 border-emerald-500/30';
    if (gpa >= midHigh) return 'bg-cyan-500/20 text-cyan-300 border-cyan-500/30';
    if (gpa >= mid) return 'bg-amber-500/20 text-amber-300 border-amber-500/30';
    return 'bg-orange-500/20 text-orange-300 border-orange-500/30';
  };

  return (
    <>
      <motion.div layout transition={{ type: "spring", stiffness: 260, damping: 26 }}>
        <Card
          className={`overflow-hidden border-0 shadow-lg transition-shadow duration-300 ${
            isExpanded ? 'shadow-[0_0_20px_-4px_var(--primary)/0.2]' : 'hover:shadow-xl'
          }`}
        >
          <motion.div
            whileHover={{ backgroundPosition: '100% 50%' }}
            onClick={onToggleExpand}
            className="cursor-pointer bg-gradient-to-r from-primary/20 via-primary/10 to-accent/20 bg-[length:200%_100%] p-6 transition-all"
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
                <motion.div
                  key={gpa.toFixed(2)}
                  initial={{ scale: 1.3, opacity: 0 }}
                  animate={{ scale: 1, opacity: 1 }}
                  transition={{ type: "spring", stiffness: 300, damping: 20 }}
                  className={`text-3xl font-bold gpa-value ${getGPAColor(gpa)}`}
                >
                  {gpa.toFixed(2)}
                </motion.div>
                <p className="text-foreground-muted text-xs mt-1">Semester GPA</p>
              </div>
              <motion.div
                animate={{ rotate: isExpanded ? 180 : 0 }}
                transition={{ type: "spring", stiffness: 260, damping: 20 }}
                className="text-foreground"
              >
                {isExpanded ? <ChevronUp className="w-6 h-6" /> : <ChevronDown className="w-6 h-6" />}
              </motion.div>
            </div>
          </motion.div>

          <AnimatePresence initial={false}>
            {isExpanded && (
              <motion.div
                key="content"
                initial={{ height: 0, opacity: 0 }}
                animate={{ height: "auto", opacity: 1 }}
                exit={{ height: 0, opacity: 0 }}
                transition={{ type: "spring", stiffness: 260, damping: 26 }}
                className="overflow-hidden"
              >
                <div className="p-6 bg-surface">
                  {semester.courses.length > 0 ? (
                    <motion.div
                      initial="hidden"
                      animate="show"
                      variants={{
                        hidden: {},
                        show: { transition: { staggerChildren: 0.05 } },
                      }}
                      className="space-y-3 mb-6"
                    >
                      {semester.courses.map(course => (
                        <motion.div
                          key={course.id}
                          variants={{
                            hidden: { opacity: 0, x: -12 },
                            show: { opacity: 1, x: 0, transition: { type: "spring", stiffness: 200, damping: 24 } },
                          }}
                          className={`flex items-center justify-between p-4 rounded-lg border transition-all duration-200 hover:shadow-md ${
                            course.isCarryover
                              ? 'bg-orange-500/5 border-orange-500/20 hover:border-orange-500/40'
                              : 'bg-surface-elevated border-border hover:border-primary/30'
                          }`}
                        >
                          <div className="flex-1">
                            <div className="flex items-center gap-2">
                              <p className="font-semibold text-foreground">{course.name}</p>
                              {course.isCarryover && (
                                <span className="inline-flex items-center rounded-full bg-orange-500/20 px-2 py-0.5 text-xs font-medium text-orange-300 border border-orange-500/30">
                                  🔄 Carryover
                                </span>
                              )}
                              {course.isCarryover && course.isCarryoverPassed && (
                                <span className="inline-flex items-center rounded-full bg-emerald-500/20 px-2 py-0.5 text-xs font-medium text-emerald-300 border border-emerald-500/30">
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
                              <p className="text-xs text-orange-400 mt-1">
                                Originally failed in: {course.originalSemester}
                              </p>
                            )}
                          </div>
                          <motion.div whileHover={{ scale: 1.1 }} whileTap={{ scale: 0.9 }}>
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => onRemoveCourse(course.id)}
                              className="text-destructive hover:bg-destructive/10 hover:text-destructive"
                            >
                              <Trash2 className="w-4 h-4" />
                            </Button>
                          </motion.div>
                        </motion.div>
                      ))}
                    </motion.div>
                  ) : (
                    <p className="text-foreground-subtle text-center py-6">No courses added yet</p>
                  )}

                  <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ delay: 0.2 }}
                    className="flex gap-3 pt-4 border-t border-border"
                  >
                    <motion.div className="flex-1" whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }}>
                      <Button
                        onClick={() => setShowAddCourse(true)}
                        className="w-full gap-2"
                      >
                        <Plus className="w-4 h-4" />
                        Add Course
                      </Button>
                    </motion.div>
                    <motion.div whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}>
                      <Button
                        onClick={onRemove}
                        variant="outline"
                        className="text-destructive border-destructive/30 hover:bg-destructive/10"
                      >
                        <Trash2 className="w-4 h-4" />
                      </Button>
                    </motion.div>
                  </motion.div>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </Card>
      </motion.div>

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
