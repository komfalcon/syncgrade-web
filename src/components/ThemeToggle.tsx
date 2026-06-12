import { Moon, Sun } from "lucide-react";
import { motion } from "framer-motion";
import { useTheme } from "@/contexts/ThemeContext";

export default function ThemeToggle() {
  const { theme, toggleTheme } = useTheme();
  const isDark = theme === "dark";
  const label = isDark ? "Switch to light mode" : "Switch to dark mode";

  return (
    <motion.button
      type="button"
      onClick={toggleTheme}
      aria-label={label}
      title={label}
      whileHover={{ scale: 1.1 }}
      whileTap={{ scale: 0.85, rotate: 30 }}
      className="rounded-lg bg-transparent p-2 text-foreground-muted transition-colors duration-150 hover:bg-surface-elevated hover:text-foreground"
    >
      <motion.div
        key={isDark ? "sun" : "moon"}
        initial={{ rotate: -90, opacity: 0, scale: 0.5 }}
        animate={{ rotate: 0, opacity: 1, scale: 1 }}
        exit={{ rotate: 90, opacity: 0, scale: 0.5 }}
        transition={{ type: "spring", stiffness: 260, damping: 20 }}
      >
        {isDark ? <Sun className="h-5 w-5" /> : <Moon className="h-5 w-5" />}
      </motion.div>
    </motion.button>
  );
}
