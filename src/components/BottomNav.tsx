import { BarChart3, Grid2x2, Home, MoreHorizontal } from "lucide-react";
import { Link, useLocation } from "wouter";
import { motion } from "framer-motion";
import { cn } from "@/lib/utils";

const NAV_ITEMS = [
  { href: "/", label: "Home", icon: Home },
  { href: "/analytics", label: "Analytics", icon: BarChart3 },
  { href: "/tools", label: "Tools", icon: Grid2x2 },
  { href: "/more", label: "More", icon: MoreHorizontal },
] as const;

function isActive(pathname: string, href: string): boolean {
  if (href === "/") return pathname === "/";
  return pathname === href || pathname.startsWith(`${href}/`);
}

export default function BottomNav() {
  const [location] = useLocation();

  return (
    <motion.nav
      initial={{ y: 80 }}
      animate={{ y: 0 }}
      transition={{ type: "spring", stiffness: 260, damping: 24 }}
      aria-label="Primary"
      className="fixed inset-x-0 bottom-0 z-50 rounded-none border-t border-border bg-surface/90 backdrop-blur-xl md:hidden"
    >
      <ul className="mx-auto grid h-16 max-w-xl grid-cols-4">
        {NAV_ITEMS.map(({ href, label, icon: Icon }) => {
          const active = isActive(location, href);
          return (
            <li key={href} className="h-full">
              <Link href={href}>
                <motion.span
                  whileTap={{ scale: 0.9 }}
                  className={cn(
                    "relative flex h-full min-h-12 w-full min-w-12 flex-col items-center justify-center gap-1 text-xs",
                    active ? "text-primary" : "text-foreground-muted",
                  )}
                >
                  {active && (
                    <motion.span
                      layoutId="bottom-nav-active"
                      className="absolute -top-px h-0.5 w-10 rounded-full bg-primary"
                      transition={{ type: "spring", stiffness: 380, damping: 30 }}
                    />
                  )}
                  <Icon className="h-5 w-5" />
                  <span className="font-medium">{label}</span>
                </motion.span>
              </Link>
            </li>
          );
        })}
      </ul>
    </motion.nav>
  );
}
