import { Link, useLocation } from "wouter";
import { motion } from "framer-motion";
import { cn } from "@/lib/utils";
import ThemeToggle from "@/components/ThemeToggle";

const NAV_ITEMS = [
  { href: "/", label: "Home" },
  { href: "/analytics", label: "Analytics" },
  { href: "/tools", label: "Tools" },
  { href: "/more", label: "More" },
] as const;

export default function Navbar() {
  const [location] = useLocation();

  const isActive = (href: string) => {
    if (href === "/") return location === "/";
    return location === href || location.startsWith(`${href}/`);
  };

  return (
    <motion.header
      initial={{ y: -60, opacity: 0 }}
      animate={{ y: 0, opacity: 1 }}
      transition={{ type: "spring", stiffness: 200, damping: 24 }}
      className="hidden border-b border-border bg-surface/80 backdrop-blur-xl md:block"
    >
      <nav className="mx-auto flex min-h-16 w-full max-w-7xl items-center justify-between gap-4 px-4 py-3 text-sm md:px-6">
        <Link href="/">
          <motion.span
            whileHover={{ scale: 1.05 }}
            className="text-base font-semibold text-foreground"
          >
            <span className="bg-gradient-to-r from-primary to-accent bg-clip-text text-transparent">
              SyncGrade
            </span>
          </motion.span>
        </Link>
        <div className="flex items-center gap-1">
          {NAV_ITEMS.map((item) => {
            const active = isActive(item.href);
            return (
              <Link key={item.href} href={item.href}>
                <motion.span
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  className={cn(
                    "relative inline-flex min-h-12 items-center rounded-md px-3 font-medium transition-colors",
                    active
                      ? "text-primary"
                      : "text-foreground-muted hover:text-foreground",
                  )}
                >
                  {item.label}
                  {active && (
                    <motion.span
                      layoutId="nav-active"
                      className="absolute bottom-1 left-2 right-2 h-0.5 rounded-full bg-primary"
                      transition={{ type: "spring", stiffness: 380, damping: 30 }}
                    />
                  )}
                </motion.span>
              </Link>
            );
          })}
          <div className="ml-2">
            <ThemeToggle />
          </div>
        </div>
      </nav>
    </motion.header>
  );
}
