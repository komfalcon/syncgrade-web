import { useMemo, useState } from "react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

interface OnboardingProfileFormProps {
  onContinue: (payload: { studentName: string; programme: string; startingLevel: number }) => Promise<void> | void;
}

export default function OnboardingProfileForm({ onContinue }: OnboardingProfileFormProps) {
  const [studentName, setStudentName] = useState("");
  const [programme, setProgramme] = useState("");
  const [startingLevel, setStartingLevel] = useState("");
  const [submitting, setSubmitting] = useState(false);

  const canContinue = useMemo(
    () =>
      studentName.trim().length > 0 &&
      programme.trim().length > 0 &&
      startingLevel.trim().length > 0 &&
      !submitting,
    [programme, startingLevel, studentName, submitting],
  );

  const handleContinue = async () => {
    if (!canContinue) return;
    setSubmitting(true);
    try {
      await onContinue({
        studentName: studentName.trim(),
        programme: programme.trim(),
        startingLevel: Number(startingLevel),
      });
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="mx-auto flex min-h-screen w-full max-w-xl items-center justify-center p-4">
      <Card className="w-full space-y-6 rounded-xl border border-border bg-surface p-6 shadow-md">
        <div className="space-y-2">
          <h1 className="text-2xl font-bold text-foreground">Welcome to SyncGrade</h1>
          <p className="text-sm text-muted-foreground">
            Step 1 of 3 — Set up your profile to personalize your experience.
          </p>
        </div>

        <div className="space-y-2">
          <Label htmlFor="onboarding-student-name">Student full name</Label>
          <Input
            id="onboarding-student-name"
            value={studentName}
            onChange={(event) => setStudentName(event.target.value)}
            placeholder="e.g. Jane Doe"
            autoComplete="name"
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="onboarding-programme">Programme / Course of study</Label>
          <Input
            id="onboarding-programme"
            value={programme}
            onChange={(event) => setProgramme(event.target.value)}
            placeholder="e.g. Computer Science"
            autoComplete="organization-title"
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="onboarding-current-level">Current Level</Label>
          <select
            id="onboarding-current-level"
            value={startingLevel}
            onChange={(event) => setStartingLevel(event.target.value)}
            className="flex h-10 w-full rounded-md border border-input bg-transparent px-3 py-1 text-sm shadow-xs transition-colors placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
          >
            <option value="">Select your level</option>
            <option value="100">100 Level</option>
            <option value="200">200 Level</option>
            <option value="300">300 Level</option>
            <option value="400">400 Level</option>
            <option value="500">500 Level</option>
            <option value="600">600 Level</option>
            <option value="700">700 Level</option>
          </select>
        </div>

        <Button className="w-full" disabled={!canContinue} onClick={handleContinue}>
          {submitting ? "Saving..." : "Continue"}
        </Button>
      </Card>
    </div>
  );
}
