import { Link } from "wouter";
import { Twitter, Instagram, Linkedin, Mail } from "lucide-react";
import { Tiktok } from "./Tiktok";

const socialLinks = [
  { href: "https://x.com/aurikrex", label: "X (Twitter)", icon: Twitter },
  { href: "https://www.instagram.com/falcon.omotosho", label: "Instagram", icon: Instagram },
  { href: "https://linkedin.com/in/falcon-omotosho", label: "LinkedIn", icon: Linkedin },
  { href: "https://www.tiktok.com/@aurikrexacademy", label: "TikTok", icon: Tiktok },
];

const quickLinks = [
  { href: "/analytics", label: "Analytics" },
  { href: "/tools", label: "Tools" },
  { href: "/more", label: "More" },
  { href: "/grade-predictor", label: "Grade Predictor" },
];

const resources = [
  { href: "/nigerian-universities", label: "Nigerian Universities" },
  { href: "/carryover-simulator", label: "Carryover Simulator" },
  { href: "/backup-restore", label: "Backup & Restore" },
  { href: "/grade-converter", label: "Grade Converter" },
];

export default function AppFooter() {
  return (
    <footer className="border-t border-border bg-surface/50">
      <div className="mx-auto max-w-7xl px-4 py-8 md:px-6 md:py-10">
        <div className="grid gap-8 sm:grid-cols-2 lg:grid-cols-4">
          {/* Brand */}
          <div className="space-y-3 sm:col-span-2 lg:col-span-1">
            <Link href="/">
              <span className="text-base font-semibold text-foreground">
                <span className="text-foreground">
                  SyncGrade
                </span>
              </span>
            </Link>
            <p className="max-w-xs text-xs leading-relaxed text-foreground-muted">
              CGPA tracking made simple. Calculate, analyze, and project your academic performance across semesters.
            </p>
            <div className="flex items-center gap-3 pt-1">
              {socialLinks.map(({ href, label, icon: Icon }) => (
                <a
                  key={label}
                  href={href}
                  target="_blank"
                  rel="noopener noreferrer"
                  aria-label={label}
                  className="rounded-full border border-border/60 p-2 text-foreground-subtle transition-all hover:border-primary/40 hover:text-foreground"
                >
                  <Icon className="size-3.5" />
                </a>
              ))}
            </div>
          </div>

          {/* Quick Links */}
          <div className="space-y-3">
            <p className="text-[11px] font-semibold uppercase tracking-widest text-foreground-muted">
              Quick Links
            </p>
            <ul className="space-y-2">
              {quickLinks.map(({ href, label }) => (
                <li key={href}>
                  <Link href={href}>
                    <span className="text-xs text-foreground-subtle transition-colors hover:text-foreground">
                      {label}
                    </span>
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          {/* Resources */}
          <div className="space-y-3">
            <p className="text-[11px] font-semibold uppercase tracking-widest text-foreground-muted">
              Resources
            </p>
            <ul className="space-y-2">
              {resources.map(({ href, label }) => (
                <li key={href}>
                  <Link href={href}>
                    <span className="text-xs text-foreground-subtle transition-colors hover:text-foreground">
                      {label}
                    </span>
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          {/* Contact */}
          <div className="space-y-3">
            <p className="text-[11px] font-semibold uppercase tracking-widest text-foreground-muted">
              Contact
            </p>
            <ul className="space-y-2">
              <li>
                <a
                  href="mailto:falcon@aurikrex.tech"
                  className="inline-flex items-center gap-2 text-xs text-foreground-subtle transition-colors hover:text-foreground"
                >
                  <Mail className="size-3.5" />
                  falcon@aurikrex.tech
                </a>
              </li>
            </ul>
          </div>
        </div>
      </div>

      {/* Bottom bar */}
      <div className="border-t border-border/60 px-4 py-4 md:px-6">
        <div className="mx-auto flex w-full max-w-7xl flex-col items-center justify-between gap-2 text-[11px] text-foreground-subtle sm:flex-row">
          <p>&copy; {new Date().getFullYear()} Korede Omotosho. All rights reserved.</p>
          <p>
            Powered by{" "}
            <a
              href="https://aurikrex.tech"
              target="_blank"
              rel="noopener noreferrer"
              className="font-medium text-foreground-muted transition-colors hover:text-foreground"
            >
              Aurikrex
            </a>
          </p>
        </div>
      </div>
    </footer>
  );
}
