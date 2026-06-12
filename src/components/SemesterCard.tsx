import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Plus, Trash2, ChevronDown, ChevronUp } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { Semester, Course } from "@/hooks/useCGPA";
import { useState } from "react";
import AddCourseDialog from "./AddCourseDialog";
import type { CourseHistory } from "@/utils/carryoverDetector";
import { cn } from "@/lib/utils";

interface SemesterCardProps {
  semester: Semester;
  gpa: number;
  isExpanded: boolean;
  onToggleExpand: () => void;
  onRemove: () => void;
  onAddCourse: (course: Omit<Course, "id">) => void;
  onUpdateCourse: (courseId: string, updates: Partial<Course>) => void;
  onRemoveCourse: (courseId: string) => void;
  gpaScale?: number;
  semesterNames?: string[];
  previousCourses?: CourseHistory[];
  passThreshold?: number;
}

const gpaBarColor = (gpa: number, scale: number) => {
  const pct = gpa / scale;
  if (pct >= 0.7) return "bg-success";
  if (pct >= 0.5) return "bg-warning";
  return "bg-destructive/70";
};

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
  const gpaPercent = (gpa / gpaScale) * 100;

  return (
    <>
      <motion.div layout transition={{ type: "spring", stiffness: 260, damping: 26 }}>
        <Card className="overflow-hidden">
          {/* Header — always visible */}
          <button
            type="button"
            onClick={onToggleExpand}
            className="flex w-full items-center justify-between gap-4 px-4 py-3.5 text-left transition-colors hover:bg-surface-elevated/50 sm:px-5"
          >
            <div className="min-w-0 flex-1">
              <div className="flex items-center gap-2">
                <h3 className="text-sm font-semibold text-foreground">
                  {semester.name}
                </h3>
                {semester.courses.some((c) => c.isCarryover) && (
                  <span className="inline-flex items-center rounded-full bg-warning/10 px-2 py-0.5 text-[10px] font-medium text-warning">
                    {semester.courses.filter((c) => c.isCarryover).length} carryover
                  </span>
                )}
              </div>
              <p className="mt-0.5 text-xs text-foreground-subtle">
                {semester.courses.length} course{semester.courses.length !== 1 ? "s" : ""}
              </p>
            </div>

            <div className="flex items-center gap-3">
              {/* GPA badge */}
              <div className="text-right">
                <div className="flex items-baseline gap-0.5">
                  <span className={cn(
                    "font-mono text-lg font-bold tracking-tight",
                    gpa >= gpaScale * 0.7 ? "text-success" : gpa >= gpaScale * 0.5 ? "text-warning" : "text-destructive"
                  )}>
                    {gpa.toFixed(2)}
                  </span>
                  <span className="text-[10px] text-foreground-subtle">/ {gpaScale.toFixed(1)}</span>
                </div>
              </div>

              {/* Mini progress ring */}
              <div className="relative h-8 w-8 flex-shrink-0">
                <svg className="h-8 w-8 -rotate-90" viewBox="0 0 32 32">
                  <circle cx="16" cy="16" r="13" fill="none" stroke="#e4e4e7" strokeWidth="3" />
                  <circle
                    cx="16" cy="16" r="13"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="3"
                    strokeLinecap="round"
                    strokeDasharray={`${(gpaPercent / 100) * 81.68} 81.68`}
                    className={cn(
                      "transition-all duration-700",
                      gpa >= gpaScale * 0.7 ? "text-success" : gpa >= gpaScale * 0.5 ? "text-warning" : "text-destructive"
                    )}
                  />
                </svg>
              </div>

              <div className="text-foreground-subtle transition-transform duration-200" style={{ transform: isExpanded ? "rotate(180deg)" : "rotate(0deg)" }}>
                <ChevronDown className="h-4 w-4" />
              </div>
            </div>
          </button>

          {/* Expandable course list */}
          <AnimatePresence initial={false}>
            {isExpanded && (
              <motion.div
                key="content"
                initial={{ height: 0, opacity: 0 }}
                animate={{ height: "auto", opacity: 1 }}
                exit={{ height: 0, opacity: 0 }}
                transition={{ type: "spring", stiffness: 260, damping: 26 }}
                className="overflow-hidden border-t border-border"
              >
                <div className="px-4 pb-4 pt-3 sm:px-5">
                  {semester.courses.length > 0 ? (
                    <div className="space-y-2">
                      {semester.courses.map((course, index) => (
                        <motion.div
                          key={course.id}
                          initial={{ opacity: 0, y: -8 }}
                          animate={{ opacity: 1, y: 0 }}
                          transition={{ delay: index * 0.03 }}
                          className={cn(
                            "group relative flex items-center justify-between gap-3 rounded-lg border px-3.5 py-3 transition-all sm:px-4",
                            course.isCarryover
                              ? "border-warning/20 bg-warning/[0.03]"
                              : "border-border bg-surface hover:border-border-strong hover:shadow-soft"
                          )}
                        >
                          <div className="min-w-0 flex-1">
                            <div className="flex items-center gap-2">
                              <span className="truncate text-sm font-medium text-foreground">
                                {course.name}
                              </span>
                              {course.isCarryover && !course.isCarryoverPassed && (
                                <span className="inline-flex shrink-0 items-center rounded-full border border-warning/20 bg-warning/10 px-1.5 py-0.5 text-[10px] font-medium text-warning">
                                  Carryover
                                </span>
                              )}
                              {course.isCarryoverPassed && (
                                <span className="inline-flex shrink-0 items-center rounded-full border border-success/20 bg-success/10 px-1.5 py-0.5 text-[10px] font-medium text-success">
                                  Cleared
                                </span>
                              )}
                            </div>
                            <div className="mt-1 flex items-center gap-3 text-xs text-foreground-subtle">
                              <span>
                                Credits: <span className="font-medium text-foreground-muted">{course.credits}</span>
                              </span>
                              <span className="text-[10px]">·</span>
                              <span>
                                Grade:{" "}
                                <span className={cn(
                                  "font-mono font-medium",
                                  course.gradePoint >= passThreshold ? "text-success" : "text-destructive"
                                )}>
                                  {course.gradePoint.toFixed(1)}
                                </span>
                              </span>
                              {course.isCarryover && course.originalSemester && (
                                <>
                                  <span className="text-[10px]">·</span>
                                  <span className="text-foreground-subtle">from {course.originalSemester}</span>
                                </>
                              )}
                            </div>
                          </div>

                          <button
                            type="button"
                            onClick={() => onRemoveCourse(course.id)}
                            className="flex h-8 w-8 shrink-0 items-center justify-center rounded-md text-foreground-subtle opacity-0 transition-all hover:bg-destructive/10 hover:text-destructive group-hover:opacity-100 focus-visible:opacity-100 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring/30 focus-visible:ring-offset-2"
                            aria-label={`Remove ${course.name}`}
                          >
                            <Trash2 className="h-3.5 w-3.5" />
                          </button>
                        </motion.div>
                      ))}
                    </div>
                  ) : (
                    <div className="flex flex-col items-center justify-center py-8 text-center">
                      <p className="text-sm text-foreground-subtle">No courses yet</p>
                      <p className="mt-0.5 text-xs text-foreground-subtle/70">
                        Add your first course to this semester
                      </p>
                    </div>
                  )}

                  <div className="mt-3 flex items-center gap-2">
                    <Button
                      onClick={() => setShowAddCourse(true)}
                      variant="outline"
                      size="sm"
                      className="gap-1.5"
                    >
                      <Plus className="h-3.5 w-3.5" />
                      Add Course
                    </Button>
                    <Button
                      onClick={onRemove}
                      variant="ghost"
                      size="sm"
                      className="text-foreground-subtle hover:text-destructive"
                    >
                      <Trash2 className="h-3.5 w-3.5" />
                      Delete semester
                    </Button>
                  </div>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </Card>
      </motion.div>

      <AddCourseDialog
        open={showAddCourse}
        onOpenChange={setShowAddCourse}
        onAdd={(course: Omit<Course, "id">) => {
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
