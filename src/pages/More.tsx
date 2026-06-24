import { Link } from "wouter";
import { motion } from "framer-motion";
import { Database, MessageSquare, Moon, Settings, Sun, Trash2 } from "lucide-react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import FeedbackForm from "@/components/FeedbackForm";
import UniversitySelector from "@/components/UniversitySelector";
import { useCGPA } from "@/hooks/useCGPA";
import { useTheme } from "@/contexts/ThemeContext";

import { User } from "lucide-react";

const MORE_ITEMS = [
  {
    href: "/profile",
    title: "Edit Profile",
    description: "Update your name, programme, and starting level.",
    icon: User,
  },
  {
    href: "/backup-restore",
    title: "Backup & Restore",
    description: "Export and recover your academic data securely.",
    icon: Database,
  },
] as const;

const staggerContainer = {
  hidden: {},
  show: { transition: { staggerChildren: 0.08 } },
};

const fadeUpItem = {
  hidden: { opacity: 0, y: 20 },
  show: { opacity: 1, y: 0, transition: { type: "spring" as const, stiffness: 200, damping: 24 } },
};

export default function More() {
  const { clearAllData } = useCGPA();
  const { theme, toggleTheme } = useTheme();
  const isDark = theme === "dark";

  return (
    <motion.div
      variants={staggerContainer}
      initial="hidden"
      animate="show"
      className="space-y-10"
    >
      <motion.header variants={fadeUpItem} className="mb-10 space-y-2">
        <h1 className="text-2xl font-bold text-foreground">More</h1>
        <p className="text-sm text-muted-foreground">Manage data, feedback, and app preferences.</p>
      </motion.header>

      <motion.section variants={staggerContainer} initial="hidden" animate="show" className="space-y-4">
        <motion.div variants={fadeUpItem} className="flex justify-end">
          <motion.div whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}>
            <Button
              variant="ghost"
              size="sm"
              className="border-0 bg-transparent text-destructive hover:bg-transparent hover:opacity-80"
              onClick={clearAllData}
            >
              <Trash2 className="mr-2 h-4 w-4 text-destructive" />
              Clear All Data
            </Button>
          </motion.div>
        </motion.div>

        {MORE_ITEMS.map(({ href, title, description, icon: Icon }) => (
          <motion.div key={href} variants={fadeUpItem}>
            <Card className="group rounded-xl border border-border bg-surface p-4 shadow-md transition-all duration-300 hover:shadow-[0_0_20px_-4px_var(--primary)/0.1] md:p-6">
              <div className="flex items-start gap-3">
                <motion.div
                  whileHover={{ scale: 1.1, rotate: 5 }}
                  className="rounded-md bg-muted p-2 text-foreground"
                >
                  <Icon className="h-5 w-5" />
                </motion.div>
                <div className="min-w-0 flex-1">
                  <h2 className="text-base font-semibold text-foreground">{title}</h2>
                  <p className="mt-1 text-sm text-muted-foreground">{description}</p>
                  <motion.div whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }} className="mt-4">
                    <Button asChild className="min-h-12 w-full">
                      <Link href={href}>Open {title}</Link>
                    </Button>
                  </motion.div>
                </div>
              </div>
            </Card>
          </motion.div>
        ))}

        <motion.div variants={fadeUpItem}>
          <Card className="rounded-xl border border-border bg-surface p-4 shadow-md transition-all duration-300 hover:shadow-[0_0_20px_-4px_var(--primary)/0.1] md:p-6">
            <motion.button
              type="button"
              onClick={toggleTheme}
              whileHover={{ x: 4 }}
              whileTap={{ scale: 0.98 }}
              className="flex w-full items-center justify-between gap-3 rounded-lg p-2 text-left transition-colors duration-150 hover:bg-surface-elevated"
            >
              <div className="flex items-center gap-3">
                <motion.div
                  key={isDark ? "sun" : "moon"}
                  initial={{ rotate: -90, opacity: 0 }}
                  animate={{ rotate: 0, opacity: 1 }}
                  transition={{ type: "spring", stiffness: 260, damping: 20 }}
                  className="rounded-md bg-muted p-2 text-foreground-muted"
                >
                  {isDark ? <Sun className="h-5 w-5" /> : <Moon className="h-5 w-5" />}
                </motion.div>
                <span className="text-base font-semibold text-foreground">Appearance</span>
              </div>
              <motion.span
                key={isDark ? "dark" : "light"}
                initial={{ opacity: 0, y: -8 }}
                animate={{ opacity: 1, y: 0 }}
                className="text-sm text-foreground-muted"
              >
                {isDark ? "Dark" : "Light"}
              </motion.span>
            </motion.button>
          </Card>
        </motion.div>

        <motion.div variants={fadeUpItem}>
          <Card className="rounded-xl border border-border bg-surface p-4 shadow-md transition-all duration-300 hover:shadow-[0_0_20px_-4px_var(--primary)/0.1] md:p-6">
            <div className="mb-4 flex items-center gap-2">
              <MessageSquare className="h-5 w-5 text-foreground" />
              <h2 className="text-base font-semibold text-foreground">Feedback</h2>
            </div>
            <FeedbackForm />
          </Card>
        </motion.div>

        <motion.div variants={fadeUpItem}>
          <Card className="rounded-xl border border-border bg-surface p-4 shadow-md transition-all duration-300 hover:shadow-[0_0_20px_-4px_var(--primary)/0.1] md:p-6">
            <div className="mb-2 flex items-center gap-2">
              <Settings className="h-5 w-5 text-foreground" />
              <h2 className="text-base font-semibold text-foreground">Settings</h2>
            </div>
            <p className="mb-4 text-sm text-muted-foreground">Update your institution to apply its grading system globally.</p>
            <UniversitySelector label="Institution profile" />
          </Card>
        </motion.div>
      </motion.section>
    </motion.div>
  );
}
