import { Link, useLocation } from "wouter";
import { cn } from "@/lib/utils";
import ThemeToggle from "@/components/ThemeToggle";

const NAV_ITEMS = [
  { href: "/", label: "Home" },
  { href: "/analytics", label: "Analytics" },
  { href: "/tools", label: "Tools" },
  { href: "/more", label: "Profile" },
] as const;

export default function Navbar() {
  const [location] = useLocation();

  const isActive = (href: string) => {
    if (href === "/") return location === "/";
    return location === href || location.startsWith(`${href}/`);
  };

  return (
    <header className="sticky top-0 z-50 border-b border-border bg-surface/95 backdrop-blur-sm">
      <nav className="mx-auto flex h-12 w-full max-w-7xl items-center justify-between gap-4 px-4 text-sm md:h-14 md:px-6">
        <Link href="/" className="flex items-center gap-2">
          <img
            src="/logo.jpeg"
            alt="SyncGrade Logo"
            className="h-7 w-7 rounded-lg object-cover shadow-soft"
          />
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
        </div>
      </nav>
    </header>
  );
}
