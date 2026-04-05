import { Link } from "wouter";
import {
  ArrowDownToLine,
  BarChart3,
  BookOpen,
  Calculator,
  ChartNoAxesColumn,
  GraduationCap,
  RefreshCw,
  Scale,
  Target,
} from "lucide-react";
import { cn } from "@/lib/utils";

type ToolRow = {
  href: string;
  title: string;
  description: string;
  icon: typeof Calculator;
  iconBg?: string;
};

const PREDICTION_TOOLS: ToolRow[] = [
  {
    href: "/grade-predictor",
    title: "Grade Predictor",
    description: "Plan your target CGPA",
    icon: Target,
    iconBg: "linear-gradient(135deg, var(--tool-gradient-start), var(--tool-gradient-end))",
  },
  {
    href: "/carryover-simulator",
    title: "Carryover Simulator",
    description: "Retake impact analysis",
    icon: RefreshCw,
    iconBg: "var(--tool-carryover)",
  },
  {
    href: "/study-load-optimizer",
    title: "Study Load",
    description: "Optimize your schedule",
    icon: BookOpen,
    iconBg: "var(--tool-study-load)",
  },
];

const COMPARISON_TOOLS: ToolRow[] = [
  {
    href: "/nigerian-universities",
    title: "🇳🇬 Universities",
    description: "Apply grading systems",
    icon: GraduationCap,
    iconBg: "var(--tool-universities)",
  },
  {
    href: "/university-comparison",
    title: "Compare Unis",
    description: "Side-by-side comparison",
    icon: Scale,
    iconBg: "linear-gradient(135deg, var(--tool-gradient-start), var(--tool-compare-gradient-end))",
  },
  {
    href: "/analytics",
    title: "Analytics",
    description: "Performance insights",
    icon: BarChart3,
    iconBg: "var(--tool-analytics)",
  },
];

const BACKUP_TOOLS: ToolRow[] = [
  {
    href: "/backup-restore",
    title: "Backup & Restore",
    description: "Export/import data",
    icon: ArrowDownToLine,
    iconBg: "var(--border-strong)",
  },
];

export default function Tools() {
  const renderRows = (items: ToolRow[]) =>
    items.map(({ href, title, description, icon: Icon, iconBg }, index) => (
      <Link key={href} href={href}>
        <div
          className={cn(
            "flex items-center gap-4 bg-surface py-4 px-4 cursor-pointer transition-colors duration-150 hover:bg-surface-elevated",
            index < items.length - 1 ? "border-b border-border" : "",
          )}
        >
          <div
            className="flex h-14 w-14 items-center justify-center rounded-2xl"
            style={{ background: iconBg }}
          >
            <Icon className="h-6 w-6 text-white" />
          </div>
          <div className="min-w-0 flex-1">
            <h3 className="text-base font-semibold text-foreground">{title}</h3>
            <p className="mt-0.5 text-sm text-foreground-muted">{description}</p>
          </div>
        </div>
      </Link>
    ));

  return (
    <div className="space-y-10">
      <header className="mb-10">
        <h1 className="text-2xl font-bold text-foreground">Tools &amp; Insights</h1>
      </header>

      <section className="mb-10">
        <h2 className="mb-3 mt-6 text-lg font-semibold text-foreground">Prediction Tools</h2>
        <div className="rounded-xl border border-border bg-surface shadow-md">{renderRows(PREDICTION_TOOLS)}</div>
      </section>

      <section className="mb-10">
        <h2 className="mb-3 mt-6 text-lg font-semibold text-foreground">Comparison Tools</h2>
        <div className="rounded-xl border border-border bg-surface shadow-md">{renderRows(COMPARISON_TOOLS)}</div>
      </section>

      <section className="mb-10">
        <h2 className="mb-3 mt-6 text-lg font-semibold text-foreground">Backup/Export</h2>
        <div className="rounded-xl border border-border bg-surface shadow-md">{renderRows(BACKUP_TOOLS)}</div>
      </section>

      <section className="mb-10">
        <h2 className="mb-3 mt-6 text-lg font-semibold text-foreground">Secondary Graphs</h2>
        <Link href="/analytics">
          <div className="cursor-pointer rounded-xl border border-border bg-surface py-4 px-4 transition-colors duration-150 hover:bg-surface-elevated shadow-md">
            <div className="flex items-center gap-2">
              <ChartNoAxesColumn className="h-4 w-4 text-accent" />
              <h3 className="font-semibold text-foreground">Performance Timeline</h3>
            </div>
            <p className="mt-2 text-sm text-foreground-muted">First semester&nbsp;&nbsp;3.63&nbsp;&nbsp;—</p>
          </div>
        </Link>
      </section>
    </div>
  );
}
