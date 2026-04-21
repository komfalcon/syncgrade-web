import { useEffect, useMemo, useState } from 'react';
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

interface AddSemesterDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onAdd: (name: string, level: number) => void;
  existingSemesterCount: number;
  startingLevel: number;
}

const LEVEL_OPTIONS = [100, 200, 300, 400, 500, 600, 700] as const;

const getSuggestedLevel = (startingLevel: number, existingSemesterCount: number): number => {
  const increment = Math.min(Math.floor(existingSemesterCount / 2) * 100, 500);
  const suggestion = startingLevel + increment;
  return Math.min(Math.max(suggestion, 100), 700);
};

export default function AddSemesterDialog({
  open,
  onOpenChange,
  onAdd,
  existingSemesterCount,
  startingLevel,
}: AddSemesterDialogProps) {
  const [semesterName, setSemesterName] = useState('');
  const [level, setLevel] = useState(100);
  const suggestedLevel = useMemo(
    () => getSuggestedLevel(startingLevel, existingSemesterCount),
    [existingSemesterCount, startingLevel],
  );

  useEffect(() => {
    if (!open) return;
    setLevel(suggestedLevel);
  }, [open, suggestedLevel]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (semesterName.trim()) {
      onAdd(semesterName, level);
      setSemesterName('');
      setLevel(suggestedLevel);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>Add New Semester</DialogTitle>
          <DialogDescription>
            Enter the name of your semester (e.g., 100L First Semester)
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit}>
          <div className="grid gap-4 py-4">
            <div className="grid gap-2">
              <Label htmlFor="semester-name">Semester Name</Label>
              <Input
                id="semester-name"
                placeholder="e.g. 100L First Semester"
                value={semesterName}
                onChange={(e) => setSemesterName(e.target.value)}
                autoFocus
              />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="semester-level">Level</Label>
              <select
                id="semester-level"
                className="flex h-9 w-full rounded-md border border-input bg-transparent px-3 py-1 text-sm shadow-xs transition-colors placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
                value={level}
                onChange={(e) => setLevel(Number(e.target.value))}
              >
                {LEVEL_OPTIONS.map((levelOption) => (
                  <option key={levelOption} value={levelOption}>
                    {levelOption} Level
                  </option>
                ))}
              </select>
            </div>
          </div>
          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              onClick={() => {
                onOpenChange(false);
                setSemesterName('');
                setLevel(suggestedLevel);
              }}
            >
              Cancel
            </Button>
            <Button
              type="submit"
              className="bg-primary hover:bg-primary-hover text-foreground"
              disabled={!semesterName.trim()}
            >
              Add Semester
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
