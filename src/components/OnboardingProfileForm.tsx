import { useMemo, useState } from "react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

interface OnboardingProfileFormProps {
  onContinue: (payload: { studentName: string; programme: string }) => Promise<void> | void;
}

export default function OnboardingProfileForm({ onContinue }: OnboardingProfileFormProps) {
  const [studentName, setStudentName] = useState("");
  const [programme, setProgramme] = useState("");
  const [submitting, setSubmitting] = useState(false);

  const canContinue = useMemo(
    () => studentName.trim().length > 0 && programme.trim().length > 0 && !submitting,
    [programme, studentName, submitting],
  );

  const handleContinue = async () => {
    if (!canContinue) return;
    setSubmitting(true);
    try {
      await onContinue({
        studentName: studentName.trim(),
        programme: programme.trim(),
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

        <Button className="w-full" disabled={!canContinue} onClick={handleContinue}>
          {submitting ? "Saving..." : "Continue"}
        </Button>
      </Card>
    </div>
  );
}
