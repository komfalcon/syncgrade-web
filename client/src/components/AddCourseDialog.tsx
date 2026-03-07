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

interface AddCourseDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onAdd: (course: Omit<Course, 'id'>) => void;
  gpaScale?: number;
  semesterNames?: string[];
}

export default function AddCourseDialog({ open, onOpenChange, onAdd, gpaScale = 5.0, semesterNames = [] }: AddCourseDialogProps) {
  const [courseName, setCourseName] = useState('');
  const [credits, setCredits] = useState('3');
  const [gradePoint, setGradePoint] = useState(gpaScale.toFixed(1));
  const [isCarryover, setIsCarryover] = useState(false);
  const [originalSemester, setOriginalSemester] = useState('');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (courseName.trim() && credits && gradePoint) {
      onAdd({
        name: courseName,
        credits: parseFloat(credits),
        gradePoint: parseFloat(gradePoint),
        isCarryover,
        originalSemester: isCarryover && originalSemester ? originalSemester : null,
        isCarryoverPassed: isCarryover ? parseFloat(gradePoint) > 0 : false,
      });
      setCourseName('');
      setCredits('3');
      setGradePoint(gpaScale.toFixed(1));
      setIsCarryover(false);
      setOriginalSemester('');
    }
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
                onChange={(e) => setCourseName(e.target.value)}
                autoFocus
              />
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
            <div className="flex items-center justify-between rounded-lg border border-slate-200 p-3">
              <div>
                <Label htmlFor="carryover-toggle" className="text-sm font-medium">
                  🔄 Carryover Course
                </Label>
                <p className="text-xs text-slate-500 mt-0.5">Mark if this is a repeated course</p>
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
              }}
            >
              Cancel
            </Button>
            <Button
              type="submit"
              className="bg-gradient-to-r from-cyan-600 to-teal-600 hover:from-cyan-700 hover:to-teal-700 text-white"
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
