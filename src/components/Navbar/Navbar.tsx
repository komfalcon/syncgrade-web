import { useState } from "react";
import { Link, useLocation } from "wouter";
import { cn } from "@/lib/utils";
import { Menu, X } from "lucide-react";
import ThemeToggle from "@/components/ThemeToggle";
import { motion, AnimatePresence } from "framer-motion";

const NAV_ITEMS = [
  { href: "/", label: "Home" },
  { href: "/analytics", label: "Analytics" },
  { href: "/tools", label: "Tools" },
  { href: "/more", label: "More" },
] as const;

export default function Navbar() {
  const [location] = useLocation();
  const [menuOpen, setMenuOpen] = useState(false);

  const isActive = (href: string) => {
    if (href === "/") return location === "/";
    return location === href || location.startsWith(`${href}/`);
  };

  const handleNavClick = () => {
    setMenuOpen(false);
  };

  return (
    <header className="sticky top-0 z-50 border-b border-border bg-surface/95 backdrop-blur-sm">
      <nav className="mx-auto flex h-12 w-full max-w-7xl items-center justify-between gap-4 px-4 text-sm md:h-14 md:px-6">
        <Link href="/" onClick={handleNavClick}>
          <span className="text-sm font-bold tracking-tight text-foreground md:text-base">
            SyncGrade
          </span>
        </Link>

        <div className="flex items-center gap-1">
          {/* Desktop nav links */}
          <div className="hidden md:flex md:items-center md:gap-0.5">
            {NAV_ITEMS.map((item) => {
              const active = isActive(item.href);
              return (
                <Link key={item.href} href={item.href}>
                  <span
                    className={cn(
                      "inline-flex h-9 items-center rounded-md px-3 text-sm font-medium transition-colors",
                      active
                        ? "bg-surface-elevated text-foreground"
                        : "text-foreground-muted hover:text-foreground",
                    )}
                  >
                    {item.label}
                  </span>
                </Link>
              );
            })}
          </div>

          <ThemeToggle />

          {/* Mobile hamburger */}
          <button
            type="button"
            onClick={() => setMenuOpen((p) => !p)}
            aria-label={menuOpen ? "Close menu" : "Open menu"}
            aria-expanded={menuOpen}
            className="flex h-9 w-9 items-center justify-center rounded-md text-foreground-muted transition-colors hover:bg-surface-elevated hover:text-foreground md:hidden"
          >
            {menuOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
          </button>
        </div>
      </nav>

      {/* Mobile menu dropdown */}
      <AnimatePresence>
        {menuOpen && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: "auto", opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ type: "spring", stiffness: 300, damping: 28 }}
            className="overflow-hidden border-t border-border md:hidden"
          >
            <div className="space-y-0.5 px-4 pb-3 pt-2">
              {NAV_ITEMS.map((item) => {
                const active = isActive(item.href);
                return (
                  <Link key={item.href} href={item.href} onClick={handleNavClick}>
                    <span
                      className={cn(
                        "flex h-11 items-center rounded-lg px-3 text-sm font-medium transition-colors",
                        active
                          ? "bg-surface-elevated text-foreground"
                          : "text-foreground-muted hover:bg-surface-elevated hover:text-foreground",
                      )}
                    >
                      {item.label}
                    </span>
                  </Link>
                );
              })}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </header>
  );
}
