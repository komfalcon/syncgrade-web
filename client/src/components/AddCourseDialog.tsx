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
import { Course } from '@/hooks/useCGPA';

interface AddCourseDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onAdd: (course: Omit<Course, 'id'>) => void;
}

export default function AddCourseDialog({ open, onOpenChange, onAdd }: AddCourseDialogProps) {
  const [courseName, setCourseName] = useState('');
  const [credits, setCredits] = useState('3');
  const [gradePoint, setGradePoint] = useState('4.0');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (courseName.trim() && credits && gradePoint) {
      onAdd({
        name: courseName,
        credits: parseFloat(credits),
        gradePoint: parseFloat(gradePoint),
      });
      setCourseName('');
      setCredits('3');
      setGradePoint('4.0');
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
                <Label htmlFor="grade-point">Grade Point (0-4)</Label>
                <Input
                  id="grade-point"
                  type="number"
                  min="0"
                  max="4"
                  step="0.1"
                  value={gradePoint}
                  onChange={(e) => setGradePoint(e.target.value)}
                />
              </div>
            </div>
          </div>
          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              onClick={() => {
                onOpenChange(false);
                setCourseName('');
                setCredits('3');
                setGradePoint('4.0');
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
