import { useState } from "react";
import { Download } from "lucide-react";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";

export interface BeforeInstallPromptEvent extends Event {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: "accepted" | "dismissed"; platform: string }>;
}

interface PwaInstallBannerProps {
  event: BeforeInstallPromptEvent | null;
}

export default function PwaInstallBanner({ event }: PwaInstallBannerProps) {
  const [dismissed, setDismissed] = useState(false);
  const [installing, setInstalling] = useState(false);

  if (!event || dismissed) return null;

  const handleInstall = async () => {
    setInstalling(true);
    try {
      await event.prompt();
      const choice = await event.userChoice;
      if (choice.outcome === "accepted") {
        setDismissed(true);
      }
    } finally {
      setInstalling(false);
    }
  };

  return (
    <Alert className="border-cyan-200 bg-cyan-50 text-cyan-900">
      <Download className="h-4 w-4" />
      <AlertTitle>Add SyncGrade to Home Screen</AlertTitle>
      <AlertDescription className="mt-2 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <span>Get offline access and faster loading for quick GPA checks anywhere.</span>
        <div className="flex gap-2">
          <Button size="sm" onClick={handleInstall} disabled={installing}>
            {installing ? "Opening..." : "Add to Home Screen"}
          </Button>
          <Button size="sm" variant="outline" onClick={() => setDismissed(true)}>
            Later
          </Button>
        </div>
      </AlertDescription>
    </Alert>
  );
}
