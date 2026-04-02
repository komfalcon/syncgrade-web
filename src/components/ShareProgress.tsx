import { Share2 } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";

interface ShareProgressProps {
  cgpa: number;
  totalCredits: number;
}

export default function ShareProgress({ cgpa, totalCredits }: ShareProgressProps) {
  const handleShare = async (): Promise<void> => {
    const shareText = `CGPA: ${cgpa.toFixed(2)} | Total Credits: ${totalCredits}`;
    const sharePayload: ShareData = {
      title: "My SyncGrade Progress",
      text: shareText,
    };

    try {
      if (typeof window !== "undefined" && typeof navigator.share === "function") {
        await navigator.share(sharePayload);
        return;
      }

      if (typeof navigator !== "undefined" && navigator.clipboard?.writeText) {
        await navigator.clipboard.writeText(shareText);
        toast.success("Copied to clipboard!");
      }
    } catch (err: unknown) {
      const error = err instanceof Error ? err : null;
      if (error?.name === "AbortError") return;

      if (typeof navigator !== "undefined" && navigator.clipboard?.writeText) {
        try {
          await navigator.clipboard.writeText(shareText);
          toast.success("Copied to clipboard!");
          return;
        } catch (clipboardError: unknown) {
          console.error("Share fallback failed:", clipboardError);
        }
      }

      console.error("Share failed:", err);
    }
  };

  return (
    <Button type="button" onClick={handleShare} className="gap-2">
      <Share2 className="h-4 w-4" />
      Share My Progress
    </Button>
  );
}
