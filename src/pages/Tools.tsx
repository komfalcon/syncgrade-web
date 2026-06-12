import { Link } from "wouter";
import { motion } from "framer-motion";
import {
  ArrowDownToLine,
  BarChart3,
  Calculator,
  ChartNoAxesColumn,
  GraduationCap,
  RefreshCw,
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

const staggerContainer = {
  hidden: {},
  show: { transition: { staggerChildren: 0.06 } },
};

const fadeUpItem = {
  hidden: { opacity: 0, y: 16 },
  show: { opacity: 1, y: 0, transition: { type: "spring" as const, stiffness: 200, damping: 24 } },
};

export default function Tools() {
  const renderRows = (items: ToolRow[]) =>
    items.map(({ href, title, description, icon: Icon, iconBg }, index) => (
      <motion.div key={href} variants={fadeUpItem}>
        <Link href={href}>
          <motion.div
            whileHover={{ x: 6, backgroundColor: "var(--surface-elevated)" }}
            whileTap={{ scale: 0.98 }}
            className={cn(
              "flex items-center gap-4 bg-surface py-4 px-4 cursor-pointer transition-colors duration-150",
              index < items.length - 1 ? "border-b border-border" : "",
            )}
          >
            <motion.div
              whileHover={{ scale: 1.1, rotate: 5 }}
              className="flex h-14 w-14 items-center justify-center rounded-2xl"
              style={{ background: iconBg }}
            >
              <Icon className="h-6 w-6 text-white" />
            </motion.div>
            <div className="min-w-0 flex-1">
              <h3 className="text-base font-semibold text-foreground">{title}</h3>
              <p className="mt-0.5 text-sm text-foreground-muted">{description}</p>
            </div>
          </motion.div>
        </Link>
      </motion.div>
    ));

  return (
    <motion.div
      variants={staggerContainer}
      initial="hidden"
      animate="show"
      className="space-y-10"
    >
      <motion.header variants={fadeUpItem} className="mb-10">
        <h1 className="text-2xl font-bold text-foreground">Tools &amp; Insights</h1>
      </motion.header>

      <motion.section variants={fadeUpItem} className="mb-10">
        <h2 className="mb-3 mt-6 text-lg font-semibold text-foreground">Prediction Tools</h2>
        <motion.div
          variants={staggerContainer}
          initial="hidden"
          animate="show"
          className="rounded-xl border border-border bg-surface shadow-md overflow-hidden"
        >
          {renderRows(PREDICTION_TOOLS)}
        </motion.div>
      </motion.section>

      <motion.section variants={fadeUpItem} className="mb-10">
        <h2 className="mb-3 mt-6 text-lg font-semibold text-foreground">Comparison Tools</h2>
        <motion.div
          variants={staggerContainer}
          initial="hidden"
          animate="show"
          className="rounded-xl border border-border bg-surface shadow-md overflow-hidden"
        >
          {renderRows(COMPARISON_TOOLS)}
        </motion.div>
      </motion.section>

      <motion.section variants={fadeUpItem} className="mb-10">
        <h2 className="mb-3 mt-6 text-lg font-semibold text-foreground">Backup/Export</h2>
        <motion.div
          variants={staggerContainer}
          initial="hidden"
          animate="show"
          className="rounded-xl border border-border bg-surface shadow-md overflow-hidden"
        >
          {renderRows(BACKUP_TOOLS)}
        </motion.div>
      </motion.section>

      <motion.section variants={fadeUpItem} className="mb-10">
        <h2 className="mb-3 mt-6 text-lg font-semibold text-foreground">Secondary Graphs</h2>
        <Link href="/analytics">
          <motion.div
            whileHover={{ scale: 1.01, x: 4 }}
            whileTap={{ scale: 0.98 }}
            className="cursor-pointer rounded-xl border border-border bg-surface py-4 px-4 transition-colors duration-150 hover:bg-surface-elevated shadow-md"
          >
            <div className="flex items-center gap-2">
              <ChartNoAxesColumn className="h-4 w-4 text-primary" />
              <h3 className="font-semibold text-foreground">Performance Timeline</h3>
            </div>
            <p className="mt-2 text-sm text-foreground-muted">First semester&nbsp;&nbsp;3.63&nbsp;&nbsp;—</p>
          </motion.div>
        </Link>
      </motion.section>
    </motion.div>
  );
}
