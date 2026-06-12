import { BarChart3, Grid2x2, Home, MoreHorizontal } from "lucide-react";
import { Link, useLocation } from "wouter";
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
    <nav
      aria-label="Primary"
      className="fixed inset-x-0 bottom-0 z-50 border-t border-border bg-surface/95 backdrop-blur-sm md:hidden"
    >
      <ul className="mx-auto grid h-14 max-w-xl grid-cols-4">
        {NAV_ITEMS.map(({ href, label, icon: Icon }) => {
          const active = isActive(location, href);
          return (
            <li key={href} className="h-full">
              <Link href={href}>
                <span
                  className={cn(
                    "flex h-full flex-col items-center justify-center gap-0.5 text-[11px] font-medium transition-colors",
                    active
                      ? "text-foreground"
                      : "text-foreground-subtle",
                  )}
                >
                  <Icon className="h-5 w-5" />
                  <span>{label}</span>
                </span>
              </Link>
            </li>
          );
        })}
      </ul>
    </nav>
  );
}
