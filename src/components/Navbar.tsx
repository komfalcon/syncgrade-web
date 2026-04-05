import { Link, useLocation } from "wouter";
import { cn } from "@/lib/utils";

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
    <header className="hidden border-b border-border bg-surface md:block">
      <nav className="mx-auto flex min-h-16 w-full max-w-7xl items-center justify-between gap-4 px-4 py-3 text-sm md:px-6">
        <Link href="/">
          <span className="text-base font-semibold text-foreground">SyncGrade</span>
        </Link>
        <div className="flex items-center gap-2">
          {NAV_ITEMS.map((item) => (
            <Link key={item.href} href={item.href}>
              <span
                className={cn(
                  "inline-flex min-h-12 items-center rounded-md px-3 font-medium transition-colors",
                  isActive(item.href)
                    ? "bg-primary/10 text-primary"
                    : "text-foreground-muted hover:bg-surface-elevated hover:text-foreground",
                )}
              >
                {item.label}
              </span>
            </Link>
          ))}
        </div>
      </nav>
    </header>
  );
}
