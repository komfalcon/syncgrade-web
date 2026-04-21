import { useState } from 'react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Course } from '@/hooks/useCGPA';
import { detectCarryover, type CarryoverMatch, type CourseHistory } from '@/utils/carryoverDetector';

interface AddCourseDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onAdd: (course: Omit<Course, 'id'>) => void;
  gpaScale?: number;
  semesterNames?: string[];
  previousCourses?: CourseHistory[];
  passThreshold?: number;
}

export default function AddCourseDialog({
  open,
  onOpenChange,
  onAdd,
  gpaScale = 5.0,
  semesterNames = [],
  previousCourses = [],
  passThreshold = 1.0,
}: AddCourseDialogProps) {
  const [courseName, setCourseName] = useState('');
  const [credits, setCredits] = useState('3');
  const [gradePoint, setGradePoint] = useState(gpaScale.toFixed(1));
  const [isCarryover, setIsCarryover] = useState(false);
  const [originalSemester, setOriginalSemester] = useState('');
  const [carryoverSuggestion, setCarryoverSuggestion] = useState<CarryoverMatch | null>(null);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (courseName.trim() && credits && gradePoint) {
      onAdd({
        name: courseName,
        credits: parseFloat(credits),
        gradePoint: parseFloat(gradePoint),
        isCarryover,
        originalSemester: isCarryover && originalSemester ? originalSemester : null,
        isCarryoverPassed: isCarryover ? parseFloat(gradePoint) >= passThreshold : false,
      });
      setCourseName('');
      setCredits('3');
      setGradePoint(gpaScale.toFixed(1));
      setIsCarryover(false);
      setOriginalSemester('');
      setCarryoverSuggestion(null);
    }
  };

  const handleCourseNameBlur = () => {
    const trimmedName = courseName.trim();
    if (!trimmedName || isCarryover) return;
    const match = detectCarryover(trimmedName, previousCourses, passThreshold);
    setCarryoverSuggestion(match);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>Add New Course</DialogTitle>
          <DialogDescription>
            Enter the course details including name, credits, and grade point
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit}>
          <div className="grid gap-4 py-4">
            <div className="grid gap-2">
              <Label htmlFor="course-name">Course Name</Label>
              <Input
                id="course-name"
                placeholder="e.g., Data Structures"
                value={courseName}
                onChange={(e) => {
                  setCourseName(e.target.value);
                  setCarryoverSuggestion(null);
                }}
                onBlur={handleCourseNameBlur}
                autoFocus
              />
              {carryoverSuggestion && !isCarryover && (
                <div className="bg-warning/10 border border-warning rounded-lg p-3 mt-2 text-sm">
                  <p className="font-semibold text-warning text-sm">⚠️ Looks like a repeated course</p>
                  <p className="text-foreground-muted text-xs mt-1">{carryoverSuggestion.reason}</p>
                  <div className="mt-2 flex items-center gap-2">
                    <button
                      type="button"
                      className="bg-warning text-white rounded-lg px-3 py-1.5 text-xs font-semibold"
                      onClick={() => {
                        setIsCarryover(true);
                        if (!originalSemester) {
                          setOriginalSemester(carryoverSuggestion.matchedCourse.semesterName);
                        }
                        setCarryoverSuggestion(null);
                      }}
                    >
                      Yes, mark as carryover
                    </button>
                    <button
                      type="button"
                      className="bg-transparent border border-border text-foreground-muted rounded-lg px-3 py-1.5 text-xs"
                      onClick={() => setCarryoverSuggestion(null)}
                    >
                      No, it's a new course
                    </button>
                  </div>
                </div>
              )}
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="grid gap-2">
                <Label htmlFor="credits">Credits</Label>
                <Input
                  id="credits"
                  type="number"
                  min="0.5"
                  max="12"
                  step="0.5"
                  value={credits}
                  onChange={(e) => setCredits(e.target.value)}
                />
              </div>
              <div className="grid gap-2">
                <Label htmlFor="grade-point">Grade Point (0-{gpaScale})</Label>
                <Input
                  id="grade-point"
                  type="number"
                  min="0"
                  max={gpaScale}
                  step="0.1"
                  value={gradePoint}
                  onChange={(e) => setGradePoint(e.target.value)}
                />
              </div>
            </div>
            <div className="flex items-center justify-between rounded-lg border border-border p-3">
              <div>
                <Label htmlFor="carryover-toggle" className="text-sm font-medium">
                  🔄 Carryover Course
                </Label>
                <p className="text-xs text-foreground-subtle mt-0.5">Mark if this is a repeated course</p>
              </div>
              <Switch
                id="carryover-toggle"
                checked={isCarryover}
                onCheckedChange={setIsCarryover}
              />
            </div>
            {isCarryover && semesterNames.length > 0 && (
              <div className="grid gap-2">
                <Label htmlFor="original-semester">Originally Failed In</Label>
                <select
                  id="original-semester"
                  className="flex h-9 w-full rounded-md border border-input bg-transparent px-3 py-1 text-sm shadow-xs transition-colors placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
                  value={originalSemester}
                  onChange={(e) => setOriginalSemester(e.target.value)}
                >
                  <option value="">Select semester...</option>
                  {semesterNames.map(name => (
                    <option key={name} value={name}>{name}</option>
                  ))}
                </select>
              </div>
            )}
          </div>
          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              onClick={() => {
                onOpenChange(false);
                setCourseName('');
                setCredits('3');
                setGradePoint(gpaScale.toFixed(1));
                setIsCarryover(false);
                setOriginalSemester('');
                setCarryoverSuggestion(null);
              }}
            >
              Cancel
            </Button>
            <Button
              type="submit"
              className="bg-primary hover:bg-primary-hover text-foreground"
              disabled={!courseName.trim() || !credits || !gradePoint}
            >
              Add Course
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
