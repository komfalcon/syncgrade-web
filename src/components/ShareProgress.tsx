import { Share2 } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { useGpaScale } from "@/contexts/GpaScaleContext";
import { getClassification } from "@/utils/gpaLogic";
import { generateShareCard } from "@/utils/generateShareCard";

interface ShareProgressProps {
  cgpa: number;
  totalCredits: number;
}

export default function ShareProgress({ cgpa, totalCredits }: ShareProgressProps) {
  const scale = useGpaScale();

  const handleShare = async (): Promise<void> => {
    const shareCopy =
      "Just calculated my CGPA in seconds. Try yours:\nhttps://syncgrade.aurikrex.tech";
    const classification = getClassification(cgpa, scale).label;

    try {
      let imageFile: File | null = null;

      try {
        imageFile = await generateShareCard(cgpa, classification, totalCredits);
      } catch {
        if (navigator.clipboard?.writeText) {
          await navigator.clipboard.writeText(shareCopy);
          toast.success("Link copied!");
          return;
        }
      }

      if (
        imageFile &&
        typeof navigator !== "undefined" &&
        typeof navigator.share === "function" &&
        typeof navigator.canShare === "function" &&
        navigator.canShare({ files: [imageFile] })
      ) {
        await navigator.share({
          files: [imageFile],
          title: "My CGPA — SyncGrade",
          text: "Just calculated my CGPA in seconds. Try yours:",
        });
        return;
      }

      if (imageFile) {
        const url = URL.createObjectURL(imageFile);
        const anchor = document.createElement("a");
        anchor.href = url;
        anchor.download = imageFile.name;
        document.body.appendChild(anchor);
        anchor.click();
        document.body.removeChild(anchor);
        URL.revokeObjectURL(url);
      }

      if (navigator.clipboard?.writeText) {
        await navigator.clipboard.writeText(shareCopy);
      }
      toast.success("Image downloaded & link copied!");
    } catch (err: unknown) {
      const error = err instanceof Error ? err : null;
      if (error?.name === "AbortError") return;
      console.error("Share failed:", err);
      toast.error("Could not share. Please try again.");
    }
  };

  return (
    <Button type="button" onClick={handleShare} className="gap-2">
      <Share2 className="h-4 w-4" />
      Share My Progress
    </Button>
  );
}
