import { useMemo, useState } from "react";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { saveSyncgradeUserProfile } from "@/storage/db";
import { syncAcademicSnapshot } from "@/lib/cloudSync";
import { toast } from "sonner";
import UniversitySelector from "@/components/UniversitySelector";

interface FirstTimeSetupProps {
  open: boolean;
  onComplete: () => void;
}

export default function FirstTimeSetup({ open, onComplete }: FirstTimeSetupProps) {
  const [name, setName] = useState("");
  const [department, setDepartment] = useState("");
  const [university, setUniversity] = useState("");
  const [submitting, setSubmitting] = useState(false);

  const canSubmit = useMemo(() => {
    return name.trim().length > 0 && department.trim().length > 0 && university.trim().length > 0;
  }, [name, department, university]);

  const handleSubmit = async () => {
    if (!canSubmit || submitting) return;
    setSubmitting(true);
    try {
      const uuid = crypto.randomUUID();
      await saveSyncgradeUserProfile({
        uuid,
        name: name.trim(),
        department: department.trim(),
        university,
      });
      const synced = await syncAcademicSnapshot();
      if (!synced) {
        toast.message("Profile saved locally. Cloud sync will retry later.");
      }
      onComplete();
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <Dialog open={open}>
      <DialogContent
        showCloseButton={false}
        className="sm:max-w-md"
        onEscapeKeyDown={(e) => e.preventDefault()}
        onInteractOutside={(e) => e.preventDefault()}
      >
        <DialogHeader>
          <DialogTitle>Welcome to SyncGrade</DialogTitle>
          <DialogDescription>
            Complete this one-time setup to create your sync identity.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="setup-full-name">Full Name</Label>
            <Input
              id="setup-full-name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="e.g. Jane Doe"
              autoComplete="name"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="setup-department">Department/Major</Label>
            <Input
              id="setup-department"
              value={department}
              onChange={(e) => setDepartment(e.target.value)}
              placeholder="e.g. Computer Science"
              autoComplete="organization-title"
            />
          </div>

          <div className="space-y-2">
            <UniversitySelector
              label="University"
              selectedName={university}
              onSelectedNameChange={setUniversity}
            />
          </div>

          <Button
            className="w-full"
            onClick={handleSubmit}
            disabled={!canSubmit || submitting}
          >
            {submitting ? "Saving..." : "Continue"}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
