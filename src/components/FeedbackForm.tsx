import { useEffect, useState } from "react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import type { FeedbackSubmission } from "@/types/sync";
import { useFeedbackTrigger } from "@/hooks/useFeedbackTrigger";
import { useCGPA } from "@/hooks/useCGPA";
import { useUniversities } from "@/hooks/useUniversities";

const DEFAULT_FEEDBACK_ENDPOINT = "/api/feedback";

export default function FeedbackForm() {
  const { shouldShowFeedback } = useFeedbackTrigger();
  const { settings } = useCGPA();
  const { universities } = useUniversities();
  const [form, setForm] = useState<FeedbackSubmission>({
    fullName: "",
    university: "",
    subject: "",
    context: "",
  });
  const [sending, setSending] = useState(false);

  const activeUniversityName =
    universities.find((uni) => uni.shortName === settings.activeUniversity)?.name ?? "";

  useEffect(() => {
    if (!activeUniversityName) return;
    setForm((prev) => (prev.university ? prev : { ...prev, university: activeUniversityName }));
  }, [activeUniversityName]);

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();
    if (sending) return;
    setSending(true);
    try {
      const endpoint = import.meta.env.VITE_FEEDBACK_ENDPOINT ?? DEFAULT_FEEDBACK_ENDPOINT;
      const response = await fetch(endpoint, {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify(form),
      });
      if (!response.ok) throw new Error("Request failed");
      toast.success("Feedback sent. Thank you!");
      setForm({
        fullName: "",
        university: "",
        subject: "",
        context: "",
      });
    } catch (error) {
      console.error("Feedback Error:", error);
      toast.error("Failed to send feedback. Please try again.");
    } finally {
      setSending(false);
    }
  };

  return (
    shouldShowFeedback && (
    <Card className="bg-background p-4 text-foreground sm:p-6">
      <h3 className="text-lg font-semibold text-foreground">Feedback</h3>
      <p className="mt-1 text-sm text-muted-foreground">Help us improve SyncGrade for your campus.</p>
      <form onSubmit={handleSubmit} className="mt-4 space-y-4">
        <div className="space-y-2">
          <Label htmlFor="feedback-fullname" className="text-foreground">Full Name</Label>
          <Input
            id="feedback-fullname"
            value={form.fullName}
            onChange={(e) => setForm((prev) => ({ ...prev, fullName: e.target.value }))}
            className="min-h-12 border-border bg-background text-foreground"
            required
          />
        </div>
        <div className="space-y-2">
          <Label htmlFor="feedback-university" className="text-foreground">University</Label>
          <Input
            id="feedback-university"
            value={form.university}
            onChange={(e) => setForm((prev) => ({ ...prev, university: e.target.value }))}
            className="min-h-12 border-border bg-background text-foreground"
            required
          />
        </div>
        <div className="space-y-2">
          <Label htmlFor="feedback-subject" className="text-foreground">Subject</Label>
          <Input
            id="feedback-subject"
            value={form.subject}
            onChange={(e) => setForm((prev) => ({ ...prev, subject: e.target.value }))}
            className="min-h-12 border-border bg-background text-foreground"
            required
          />
        </div>
        <div className="space-y-2">
          <Label htmlFor="feedback-context" className="text-foreground">Context</Label>
          <Textarea
            id="feedback-context"
            value={form.context}
            onChange={(e) => setForm((prev) => ({ ...prev, context: e.target.value }))}
            className="min-h-24 border-border bg-background text-foreground"
            required
            rows={4}
          />
        </div>
        <Button type="submit" disabled={sending}>
          {sending ? "Sending..." : "Submit Feedback"}
        </Button>
      </form>
    </Card>
    )
  );
}
