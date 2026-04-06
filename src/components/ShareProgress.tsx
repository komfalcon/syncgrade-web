import { useMemo, useState } from "react";
import { Loader2, Share2 } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { useGpaScale } from "@/contexts/GpaScaleContext";
import { getClassification } from "@/utils/gpaLogic";
import { useCGPA } from "@/hooks/useCGPA";
import { generateShareCard } from "@/utils/generateShareCard";

interface ShareProgressProps {
  cgpa: number;
  totalCredits: number;
}

const SHARE_MESSAGE = `Yo, I just checked my CGPA on SyncGrade. It's way faster than
manual calculation. Check yours here:
https://syncgrade.aurikrex.tech`;

function getFirstName(value: string): string {
  const trimmed = value.trim();
  if (!trimmed) return "student";
  return trimmed.split(/\s+/)[0]?.toLowerCase() ?? "student";
}

export default function ShareProgress({ cgpa, totalCredits }: ShareProgressProps) {
  const scale = useGpaScale();
  const { settings, semesterGPAs, semesters } = useCGPA();
  const classification = useMemo(() => getClassification(cgpa, scale), [cgpa, scale]);
  const [isSharing, setIsSharing] = useState(false);
  const semesterGpasArray = useMemo(
    () => semesters.map((semester) => semesterGPAs[semester.id] || 0),
    [semesterGPAs, semesters],
  );

  const handleShare = async (): Promise<void> => {
    try {
      setIsSharing(true);
      let imageFile: File | null = null;

      try {
        imageFile = await generateShareCard(
          cgpa,
          classification.label,
          totalCredits,
          settings.studentName,
          settings.programme,
          semesterGpasArray,
          scale,
          semesters,
          settings.admissionSession,
        );
      } catch {
        if (typeof navigator !== "undefined" && navigator.clipboard?.writeText) {
          await navigator.clipboard.writeText(SHARE_MESSAGE);
          toast.success("Link copied!");
          return;
        }
        toast.error("Could not share. Please try again.");
        return;
      }

      if (
        typeof window !== "undefined" &&
        typeof navigator !== "undefined" &&
        typeof navigator.share === "function" &&
        typeof navigator.canShare === "function" &&
        navigator.canShare({ files: [imageFile] })
      ) {
        await navigator.share({
          files: [imageFile],
          title: "My CGPA — SyncGrade",
          text: SHARE_MESSAGE,
        });
        return;
      }

      const downloadUrl = URL.createObjectURL(imageFile);
      const anchor = document.createElement("a");
      anchor.href = downloadUrl;
      anchor.download = `syncgrade-cgpa-${getFirstName(settings.studentName)}.png`;
      document.body.appendChild(anchor);
      anchor.click();
      document.body.removeChild(anchor);
      URL.revokeObjectURL(downloadUrl);

      if (typeof navigator !== "undefined" && navigator.clipboard?.writeText) {
        await navigator.clipboard.writeText(SHARE_MESSAGE);
      }
      toast.success("Image saved! Link copied to clipboard.");
    } catch (error: unknown) {
      const typed = error instanceof Error ? error : null;
      if (typed?.name === "AbortError") return;
      console.error("Share failed:", error);
      toast.error("Could not share. Please try again.");
    } finally {
      setIsSharing(false);
    }
  };

  return (
    <div className="group">
      <div className="mt-3 flex justify-center">
        <Button
          type="button"
          onClick={handleShare}
          disabled={isSharing}
          className={`min-h-12 gap-2 ${isSharing ? "opacity-50" : ""}`}
        >
          {isSharing ? <Loader2 className="h-4 w-4 animate-spin" /> : <Share2 className="h-4 w-4" />}
          {isSharing ? "Generating..." : "Share Progress"}
        </Button>
      </div>
    </div>
  );
}
