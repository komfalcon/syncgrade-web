import { useMemo, useRef, useState } from "react";
import { toPng } from "html-to-image";
import { Share2 } from "lucide-react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";

interface ShareCardProps {
  cgpa: number;
  scale: number;
}

const WHATSAPP_MESSAGE =
  "Yo, I just checked my CGPA on SyncGrade. It's way faster than manual calculation. Check yours here: https://syncgrade.aurikrex.tech";

function getLevel(cgpa: number, scale: number): string {
  const normalized = scale === 0 ? 0 : cgpa / scale;
  if (normalized >= 0.74) return "First Class";
  if (normalized >= 0.6) return "2:1";
  if (normalized >= 0.5) return "2:2";
  if (normalized > 0) return "Third Class";
  return "Starter";
}

export default function ShareCard({ cgpa, scale }: ShareCardProps) {
  const cardRef = useRef<HTMLDivElement>(null);
  const [busy, setBusy] = useState(false);
  const level = useMemo(() => getLevel(cgpa, scale), [cgpa, scale]);

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
        backgroundColor: "#020617",
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
    <Card className="border-slate-700 bg-slate-950 p-5 text-slate-100 shadow-xl">
      <div
        ref={cardRef}
        className="rounded-xl border border-slate-800 bg-gradient-to-br from-slate-950 via-slate-900 to-cyan-950 p-6"
      >
        <p className="text-xs uppercase tracking-[0.2em] text-cyan-300">Semester Summary</p>
        <h3 className="mt-2 text-3xl font-extrabold text-white">{cgpa.toFixed(2)}</h3>
        <p className="text-sm text-slate-300">CGPA on a {scale.toFixed(1)} scale</p>
        <div className="mt-5 inline-flex rounded-full border border-cyan-500/40 bg-cyan-500/10 px-3 py-1 text-xs font-semibold text-cyan-200">
          Level Up: {level}
        </div>
        <p className="mt-6 text-xs text-slate-400">SyncGrade-- | Aim Higher.</p>
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
