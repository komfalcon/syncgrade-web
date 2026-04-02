import { useEffect, useMemo, useState } from "react";
import { Share2 } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { useGpaScale } from "@/contexts/GpaScaleContext";
import { getClassification } from "@/utils/gpaLogic";
import { getSyncgradeUserFromLocalStorage } from "@/storage/db";

interface ShareProgressProps {
  cgpa: number;
  totalCredits: number;
}

type TrophyTheme = {
  outerFrame: string;
  insetFrame: string;
  spotlight: string;
  sealBg: string;
  glowShadow: string;
  gpaText: string;
};

const TIER_THEME: Record<number, TrophyTheme> = {
  1: {
    outerFrame: "border-border-strong",
    insetFrame: "border-warning/80",
    spotlight: "bg-warning/20",
    sealBg: "bg-warning/20 border-warning/70",
    glowShadow: "shadow-[0_0_32px_color-mix(in_oklab,var(--warning)_65%,transparent)]",
    gpaText: "text-warning",
  },
  2: {
    outerFrame: "border-border-strong",
    insetFrame: "border-foreground-muted/80",
    spotlight: "bg-foreground-muted/20",
    sealBg: "bg-foreground-muted/20 border-foreground-muted/70",
    glowShadow:
      "shadow-[0_0_32px_color-mix(in_oklab,var(--foreground-muted)_65%,transparent)]",
    gpaText: "text-foreground",
  },
  3: {
    outerFrame: "border-border-strong",
    insetFrame: "border-destructive/75",
    spotlight: "bg-destructive/15",
    sealBg: "bg-destructive/15 border-destructive/60",
    glowShadow:
      "shadow-[0_0_32px_color-mix(in_oklab,var(--destructive)_65%,transparent)]",
    gpaText: "text-destructive",
  },
  4: {
    outerFrame: "border-border-strong",
    insetFrame: "border-primary/80",
    spotlight: "bg-primary/20",
    sealBg: "bg-primary/20 border-primary/70",
    glowShadow:
      "shadow-[0_0_32px_color-mix(in_oklab,var(--primary)_65%,transparent)]",
    gpaText: "text-primary",
  },
  5: {
    outerFrame: "border-border-strong",
    insetFrame: "border-accent/80",
    spotlight: "bg-accent/20",
    sealBg: "bg-accent/20 border-accent/70",
    glowShadow:
      "shadow-[0_0_32px_color-mix(in_oklab,var(--accent)_65%,transparent)]",
    gpaText: "text-accent",
  },
};

const cornerBase =
  "pointer-events-none absolute h-6 w-6 border-border-strong opacity-90 sm:h-8 sm:w-8";

export default function ShareProgress({ cgpa, totalCredits }: ShareProgressProps) {
  const scale = useGpaScale();
  const classification = useMemo(() => getClassification(cgpa, scale), [cgpa, scale]);
  const theme = TIER_THEME[classification.tier] ?? TIER_THEME[5];
  const [universityName, setUniversityName] = useState("Not Specified");

  useEffect(() => {
    const identity = getSyncgradeUserFromLocalStorage();
    if (identity?.university?.trim()) {
      setUniversityName(identity.university.trim());
    }
  }, []);

  const shareCopy = useMemo(
    () => `📜 SyncGrade Academic Report
🎓 Institution: ${universityName}
💎 Status: ${classification.label}
📈 Current CGPA: ${cgpa.toFixed(2)}

Verified via SyncGrade
Build your future at: https://syncgrade.aurikrex.tech`,
    [cgpa, classification.label, universityName],
  );

  const handleShare = async (): Promise<void> => {
    try {
      if (typeof navigator !== "undefined" && typeof navigator.share === "function") {
        await navigator.share({
          title: "SyncGrade Academic Report",
          text: shareCopy,
        });
        return;
      }

      if (typeof navigator !== "undefined" && navigator.clipboard?.writeText) {
        await navigator.clipboard.writeText(shareCopy);
        toast.success("Academic report copied to clipboard.");
        return;
      }

      toast.error("Sharing is unavailable on this device.");
    } catch (error: unknown) {
      const typed = error instanceof Error ? error : null;
      if (typed?.name === "AbortError") return;
      toast.error("Unable to share report right now.");
    }
  };

  return (
    <div className="group">
      <div className="mx-auto w-full max-w-full overflow-hidden rounded-xl border-2 p-2 shadow-xl backdrop-blur-xl transition-transform duration-150 group-hover:scale-[1.02] group-hover:rotate-1 sm:p-3">
        <article
          className={`relative overflow-hidden rounded-lg border-4 border-double ${theme.outerFrame} bg-background/80`}
        >
          <div className="pointer-events-none absolute inset-0 bg-gradient-to-br from-background via-surface-elevated to-background" />
          <div className="pointer-events-none absolute inset-0 opacity-20 [background-image:linear-gradient(to_right,var(--color-border)_1px,transparent_1px),linear-gradient(to_bottom,var(--color-border)_1px,transparent_1px)] [background-size:24px_24px]" />
          <div
            className={`pointer-events-none absolute left-1/2 top-1/2 h-64 w-64 -translate-x-1/2 -translate-y-1/2 rounded-full blur-3xl ${theme.spotlight}`}
          />
          <div className="pointer-events-none absolute inset-0 -rotate-45 select-none text-center text-6xl font-bold tracking-[0.35em] text-foreground-subtle/20 sm:text-8xl">
            SG
          </div>

          <div className={`pointer-events-none absolute inset-3 rounded-md border ${theme.insetFrame} opacity-80`} />

          <span className={`${cornerBase} left-3 top-3 border-l-2 border-t-2`} />
          <span className={`${cornerBase} right-3 top-3 border-r-2 border-t-2`} />
          <span className={`${cornerBase} bottom-3 left-3 border-b-2 border-l-2`} />
          <span className={`${cornerBase} bottom-3 right-3 border-b-2 border-r-2`} />

          <div className="relative space-y-4 px-4 py-5 sm:px-6 sm:py-6">
            <header className="text-center">
              <p className="text-xs font-medium uppercase tracking-[0.25em] text-foreground-muted">
                OFFICIAL ACADEMIC PROGRESS REPORT
              </p>
              <h3 className="mt-2 text-base font-semibold text-foreground sm:text-lg">
                {universityName}
              </h3>
            </header>

            <section className="space-y-2 text-center">
              <p className="text-xs uppercase tracking-[0.15em] text-foreground-muted">
                Current CGPA
              </p>
              <p
                className={`gpa-value text-6xl font-bold leading-none sm:text-7xl ${theme.gpaText} ${theme.glowShadow}`}
              >
                {cgpa.toFixed(2)}
              </p>
              <p className="text-sm text-foreground-muted">
                {classification.label} • {totalCredits} Credits
              </p>
            </section>

            <div
              className={`absolute bottom-4 right-4 h-20 w-20 rounded-full border border-dashed ${theme.sealBg} p-1`}
              aria-hidden="true"
            >
              <div className="flex h-full w-full items-center justify-center rounded-full border border-border bg-surface/60 text-center text-[10px] font-bold leading-tight text-foreground">
                {classification.tier}
                {classification.tier === 1
                  ? "st"
                  : classification.tier === 2
                    ? "nd"
                    : classification.tier === 3
                      ? "rd"
                      : "th"}{" "}
                Class Verified
              </div>
            </div>

            <footer className="pt-4 text-center text-xs text-foreground-subtle">
              Verified by SyncGrade Engine
            </footer>
          </div>
        </article>
      </div>

      <div className="mt-3 flex justify-center">
        <Button type="button" onClick={handleShare} className="min-h-12 gap-2">
          <Share2 className="h-4 w-4" />
          Share Digital Trophy
        </Button>
      </div>
    </div>
  );
}
