import { Facebook, Instagram, Linkedin, Twitter } from "lucide-react";

export default function AppFooter() {
  return (
    <footer className="border-t border-border bg-surface px-4 py-6 md:px-6">
      <div className="mx-auto w-full max-w-7xl text-left text-sm text-foreground-muted">
        <p>Copyright @2026 | Founder: Korede Omotosho</p>
        <p>Powered by Aurikrex</p>
        <div className="mt-4 mb-4 border-t border-border" />
        <div className="flex items-center justify-center gap-5 mt-1">
          <a
            href="https://x.com/aurikrex"
            target="_blank"
            rel="noopener noreferrer"
            aria-label="Follow Aurikrex on X"
            className="text-foreground-muted transition-colors duration-150 hover:text-foreground"
          >
            <Twitter className="h-5 w-5" />
          </a>
          <a
            href="https://www.facebook.com/share/18xoDKFWWT/"
            target="_blank"
            rel="noopener noreferrer"
            aria-label="Follow Aurikrex on Facebook"
            className="text-foreground-muted transition-colors duration-150 hover:text-foreground"
          >
            <Facebook className="h-5 w-5" />
          </a>
          <a
            href="https://www.instagram.com/aurikrex?igsh=dDNneDF3NXEycmE="
            target="_blank"
            rel="noopener noreferrer"
            aria-label="Follow Aurikrex on Instagram"
            className="text-foreground-muted transition-colors duration-150 hover:text-foreground"
          >
            <Instagram className="h-5 w-5" />
          </a>
          <a
            href="https://www.linkedin.com/in/korede-omotosho-a0a1b42b7"
            target="_blank"
            rel="noopener noreferrer"
            aria-label="Connect on LinkedIn"
            className="text-foreground-muted transition-colors duration-150 hover:text-foreground"
          >
            <Linkedin className="h-5 w-5" />
          </a>
          <a
            href="https://www.tiktok.com/@aurikrexacademy"
            target="_blank"
            rel="noopener noreferrer"
            aria-label="Follow Aurikrex on TikTok"
            className="text-foreground-muted transition-colors duration-150 hover:text-foreground"
          >
            <svg
              viewBox="0 0 24 24"
              className="h-5 w-5"
              fill="currentColor"
              aria-hidden="true"
            >
              <path d="M12.525.02c1.31-.02 2.61-.01 3.91-.02.08 1.53.63 3.09 1.75 4.17 1.12 1.11 2.7 1.62 4.24 1.79v4.03c-1.44-.05-2.89-.35-4.2-.97-.57-.26-1.1-.59-1.62-.93-.01 2.92.01 5.84-.02 8.75-.08 1.4-.54 2.79-1.35 3.94-1.31 1.92-3.58 3.17-5.91 3.21-1.43.08-2.86-.31-4.08-1.03-2.02-1.19-3.44-3.37-3.65-5.71-.02-.5-.03-1-.01-1.49.18-1.9 1.12-3.72 2.58-4.96 1.66-1.44 3.98-2.13 6.15-1.72.02 1.48-.04 2.96-.04 4.44-.99-.32-2.15-.23-3.02.37-.63.41-1.11 1.04-1.36 1.75-.21.51-.15 1.07-.14 1.61.24 1.64 1.82 3.02 3.5 2.87 1.12-.01 2.19-.66 2.77-1.61.19-.33.4-.67.41-1.06.1-1.79.06-3.57.07-5.36.01-4.03-.01-8.05.02-12.07z" />
            </svg>
          </a>
        </div>
        <div className="mt-3 text-center">
          <a
            href="mailto:falcon@aurikrex.tech"
            className="text-xs text-foreground-subtle transition-colors duration-150 hover:text-foreground-muted underline-offset-2 hover:underline"
          >
            falcon@aurikrex.tech
          </a>
        </div>
      </div>
    </footer>
  );
}
