import { useMemo, useRef, useState } from "react";
import { toPng } from "html-to-image";
import { Share2 } from "lucide-react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { getClassification, normalizeToSupportedScale } from "@/utils/gpaLogic";

interface ShareCardProps {
  cgpa: number;
  scale: number;
}

const WHATSAPP_MESSAGE =
  "Yo, I just checked my CGPA on SyncGrade. It's way faster than manual calculation. Check yours here: https://syncgrade.aurikrex.tech";

export default function ShareCard({ cgpa, scale }: ShareCardProps) {
  const cardRef = useRef<HTMLDivElement>(null);
  const [busy, setBusy] = useState(false);
  const normalizedScale = normalizeToSupportedScale(scale);
  const level = useMemo(() => getClassification(cgpa, normalizedScale).label, [cgpa, normalizedScale]);

  const shareToWhatsApp = () => {
    const url = `whatsapp://send?text=${encodeURIComponent(WHATSAPP_MESSAGE)}`;
    window.location.href = url;
  };

  const downloadCard = async () => {
    if (!cardRef.current || busy) return;
    setBusy(true);
    try {
      const dataUrl = await toPng(cardRef.current, {
        cacheBust: true,
        pixelRatio: 2,
        backgroundColor: "hsl(var(--background))",
      });
      const link = document.createElement("a");
      link.download = "syncgrade-semester-summary.png";
      link.href = dataUrl;
      link.click();
    } finally {
      setBusy(false);
    }
  };

  return (
    <Card className="rounded-xl border border-border bg-surface p-4 text-foreground shadow-md">
      <div
        ref={cardRef}
        className="rounded-xl border border-border bg-surface-elevated p-6"
      >
        <p className="text-xs uppercase tracking-[0.2em] text-accent">Semester Summary</p>
        <h3 className="mt-2 text-3xl font-extrabold text-primary-foreground">{cgpa.toFixed(2)}</h3>
        <p className="text-sm text-foreground-muted">CGPA on a {scale.toFixed(1)} scale</p>
        <div className="mt-5 inline-flex rounded-full border border-accent/40 bg-accent/10 px-3 py-1 text-xs font-semibold text-accent">
          Level Up: {level}
        </div>
        <p className="mt-6 text-xs text-foreground-muted">SyncGrade-- | Aim Higher.</p>
      </div>
      <div className="mt-4 flex flex-wrap gap-2">
        <Button onClick={downloadCard} disabled={busy} className="gap-2">
          <Share2 className="h-4 w-4" />
          {busy ? "Generating..." : "Download Share Card"}
        </Button>
        <Button variant="outline" onClick={shareToWhatsApp}>
          Share to WhatsApp
        </Button>
      </div>
    </Card>
  );
}

export { WHATSAPP_MESSAGE };
