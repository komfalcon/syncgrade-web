import { Link } from "wouter";
import { motion } from "framer-motion";
import {
  Calculator,
  GraduationCap,
  RefreshCw,
  Target,
  ArrowRight,
} from "lucide-react";
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "@/components/ui/card";

type ToolRow = {
  href: string;
  title: string;
  description: string;
  icon: any;
  iconBg: string;
};

const PLANNERS: ToolRow[] = [
  {
    href: "/grade-predictor",
    title: "Grade Predictor",
    description: "Determine the exact grades needed in future courses to hit your target cumulative CGPA.",
    icon: Target,
    iconBg: "linear-gradient(135deg, #a3e635, #84cc16)",
  },
  {
    href: "/carryover-simulator",
    title: "Carryover Simulator",
    description: "Analyze the mathematical impact of retaking a failed course under various university policies.",
    icon: RefreshCw,
    iconBg: "linear-gradient(135deg, #fbbf24, #d97706)",
  },
  {
    href: "/grade-converter",
    title: "GPA Scale Converter",
    description: "Convert your GPA or grade points instantly between 4.0, 5.0, and 7.0 academic scales.",
    icon: Calculator,
    iconBg: "linear-gradient(135deg, #ec4899, #be185d)",
  },
  {
    href: "/nigerian-universities",
    title: "Nigerian Institutions",
    description: "Search local tertiary institutions and review their default grading systems and repeat policies.",
    icon: GraduationCap,
    iconBg: "linear-gradient(135deg, #3b82f6, #1d4ed8)",
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
  return (
    <motion.div
      variants={staggerContainer}
      initial="hidden"
      animate="show"
      className="space-y-8 pb-20 md:pb-6"
    >
      <motion.header variants={fadeUpItem} className="space-y-1.5 border-b border-border pb-4">
        <h1 className="text-2xl font-bold tracking-tight text-foreground md:text-3xl">Planners &amp; Simulators</h1>
        <p className="text-sm text-foreground-muted">Explore mathematical modeling tools to forecast grades and plan your GPA goals.</p>
      </motion.header>

      <motion.div
        variants={staggerContainer}
        initial="hidden"
        animate="show"
        className="grid gap-6 sm:grid-cols-2"
      >
        {PLANNERS.map(({ href, title, description, icon: Icon, iconBg }) => (
          <motion.div key={href} variants={fadeUpItem}>
            <Link href={href}>
              <Card className="group h-full rounded-2xl border border-border bg-surface p-5 shadow-card hover:shadow-elevated transition-all duration-300 cursor-pointer flex flex-col justify-between hover:-translate-y-1">
                <div className="space-y-4">
                  <div
                    className="flex h-12 w-12 items-center justify-center rounded-2xl text-white shadow-soft transition-transform duration-300 group-hover:scale-105 group-hover:rotate-3"
                    style={{ background: iconBg }}
                  >
                    <Icon className="h-5 w-5" />
                  </div>
                  <div className="space-y-1.5">
                    <h3 className="text-base font-bold text-foreground flex items-center gap-1.5">
                      {title}
                    </h3>
                    <p className="text-xs text-foreground-muted leading-relaxed">
                      {description}
                    </p>
                  </div>
                </div>

                <div className="flex items-center gap-1.5 mt-5 pt-3 border-t border-border/40 text-xs font-semibold text-primary transition-colors group-hover:text-primary-hover">
                  Open simulator
                  <ArrowRight className="h-3.5 w-3.5 transition-transform duration-200 group-hover:translate-x-1" />
                </div>
              </Card>
            </Link>
          </motion.div>
        ))}
      </motion.div>
    </motion.div>
  );
}
