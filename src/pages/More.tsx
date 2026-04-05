import { Link } from "wouter";
import { Database, MessageSquare, Settings, Trash2 } from "lucide-react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import FeedbackForm from "@/components/FeedbackForm";
import UniversitySelector from "@/components/UniversitySelector";
import { useCGPA } from "@/hooks/useCGPA";

const MORE_ITEMS = [
  {
    href: "/backup-restore",
    title: "Backup & Restore",
    description: "Export and recover your academic data securely.",
    icon: Database,
  },
] as const;

export default function More() {
  const { clearAllData } = useCGPA();

  return (
    <div className="space-y-10">
        <header className="mb-10 space-y-2">
          <h1 className="text-2xl font-bold text-foreground">More</h1>
          <p className="text-sm text-muted-foreground">Manage data, feedback, and app preferences.</p>
        </header>

        <section className="space-y-4">
          <div className="flex justify-center md:justify-end">
            <Button
              variant="ghost"
              className="border-0 bg-transparent text-destructive hover:bg-transparent hover:opacity-80"
              onClick={clearAllData}
            >
              <Trash2 className="mr-2 h-4 w-4 text-destructive" />
              Clear All Data
            </Button>
          </div>

          {MORE_ITEMS.map(({ href, title, description, icon: Icon }) => (
            <Card key={href} className="rounded-xl border border-border bg-surface p-4 shadow-md md:p-6">
              <div className="flex items-start gap-3">
                <div className="rounded-md bg-muted p-2 text-foreground">
                  <Icon className="h-5 w-5" />
                </div>
                <div className="min-w-0 flex-1">
                  <h2 className="text-base font-semibold text-foreground">{title}</h2>
                  <p className="mt-1 text-sm text-muted-foreground">{description}</p>
                  <Button asChild className="mt-4 min-h-12 w-full bg-primary hover:bg-primary-hover">
                    <Link href={href}>Open {title}</Link>
                  </Button>
                </div>
              </div>
            </Card>
          ))}

          <Card className="rounded-xl border border-border bg-surface p-4 shadow-md md:p-6">
            <div className="mb-4 flex items-center gap-2">
              <MessageSquare className="h-5 w-5 text-foreground" />
              <h2 className="text-base font-semibold text-foreground">Feedback</h2>
            </div>
            <FeedbackForm />
          </Card>

          <Card className="rounded-xl border border-border bg-surface p-4 shadow-md md:p-6">
            <div className="mb-2 flex items-center gap-2">
              <Settings className="h-5 w-5 text-foreground" />
              <h2 className="text-base font-semibold text-foreground">Settings</h2>
            </div>
            <p className="mb-4 text-sm text-muted-foreground">Update your institution to apply its grading system globally.</p>
            <UniversitySelector label="Institution profile" />
          </Card>
        </section>
    </div>
  );
}
