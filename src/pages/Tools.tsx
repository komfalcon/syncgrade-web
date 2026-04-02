import { Link } from "wouter";
import { BookOpen, Calculator, GitCompare, RefreshCw, Scale } from "lucide-react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";

const TOOL_ITEMS = [
  {
    href: "/grade-predictor",
    title: "Grade Predictor",
    description: "Plan your target CGPA and required performance.",
    icon: Calculator,
  },
  {
    href: "/carryover-simulator",
    title: "Carryover Simulator",
    description: "Simulate retake outcomes and CGPA impact.",
    icon: RefreshCw,
  },
  {
    href: "/university-comparison",
    title: "University Comparison",
    description: "Compare grading systems across universities.",
    icon: GitCompare,
  },
  {
    href: "/study-load-optimizer",
    title: "Study Load Optimizer",
    description: "Optimize semester load for your targets.",
    icon: BookOpen,
  },
  {
    href: "/grade-converter",
    title: "Grade Converter",
    description: "Convert GPA across scale systems quickly.",
    icon: Scale,
  },
] as const;

export default function Tools() {
  return (
    <div className="min-h-screen bg-background pb-20 md:pb-8">
      <main className="container mx-auto space-y-6 px-4 py-6">
        <header className="space-y-2">
          <h1 className="text-2xl font-bold text-foreground">Tools</h1>
          <p className="text-sm text-muted-foreground">Open any tool to continue your workflow.</p>
        </header>
        <section className="grid grid-cols-1 gap-4 md:grid-cols-2">
          {TOOL_ITEMS.map(({ href, title, description, icon: Icon }) => (
            <Card key={href} className="border-border bg-card p-5">
              <div className="flex items-start gap-3">
                <div className="rounded-md bg-muted p-2 text-foreground">
                  <Icon className="h-5 w-5" />
                </div>
                <div className="min-w-0 flex-1">
                  <h2 className="text-base font-semibold text-foreground">{title}</h2>
                  <p className="mt-1 text-sm text-muted-foreground">{description}</p>
                  <Button asChild className="mt-4 min-h-12 w-full">
                    <Link href={href}>Open {title}</Link>
                  </Button>
                </div>
              </div>
            </Card>
          ))}
        </section>
      </main>
    </div>
  );
}
