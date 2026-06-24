import { useMemo, useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

interface ProfileFormProps {
  onSaved?: () => void;
  title?: string;
  description?: string;
  settings?: { studentName: string; programme: string };
  onUpdateSettings?: (settings: { studentName: string; programme: string }) => void;
}

export default function ProfileForm({ 
  onSaved, 
  title = "Complete your profile", 
  description = "Set up your profile to personalize your experience and secure your data.",
  settings,
  onUpdateSettings
}: ProfileFormProps) {
  const [studentName, setStudentName] = useState(settings?.studentName || "");
  const [programme, setProgramme] = useState(settings?.programme || "");
  const [submitting, setSubmitting] = useState(false);

  const canContinue = useMemo(
    () =>
      studentName.trim().length > 0 &&
      programme.trim().length > 0 &&
      !submitting,
    [programme, studentName, submitting],
  );

  const handleSave = async () => {
    if (!canContinue) return;
    setSubmitting(true);
    try {
      if (onUpdateSettings) {
        onUpdateSettings({
          studentName: studentName.trim(),
          programme: programme.trim(),
        });
      }
      if (onSaved) onSaved();
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="space-y-6">
      <div className="space-y-2">
        <h2 className="text-xl font-bold text-foreground">{title}</h2>
        <p className="text-sm text-muted-foreground">{description}</p>
      </div>

      <div className="space-y-2">
        <Label htmlFor="profile-student-name">Student full name</Label>
        <Input
          id="profile-student-name"
          value={studentName}
          onChange={(event) => setStudentName(event.target.value)}
          placeholder="e.g. Jane Doe"
          autoComplete="name"
        />
      </div>

      <div className="space-y-2">
        <Label htmlFor="profile-programme">Programme / Course of study</Label>
        <Input
          id="profile-programme"
          value={programme}
          onChange={(event) => setProgramme(event.target.value)}
          placeholder="e.g. Computer Science"
          autoComplete="organization-title"
        />
      </div>

      <Button className="w-full" disabled={!canContinue} onClick={handleSave}>
        {submitting ? "Saving..." : "Save Profile"}
      </Button>
    </div>
  );
}
