import { useEffect, useState } from "react";
import { Toaster } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import ErrorBoundary from "./components/ErrorBoundary";
import { ThemeProvider } from "./contexts/ThemeContext";
import { Layout } from "@/components/Layout";
import { AppRoutes } from "@/routes";
import { GpaScaleProvider } from "./contexts/GpaScaleContext";
import PwaInstallBanner, { type BeforeInstallPromptEvent } from "./components/PwaInstallBanner";
import { STORAGE_KEYS } from "./lib/db";
import { registerSW } from "virtual:pwa-register";
import { toast } from "sonner";
import { migrateD1DataToFirebaseUser } from "@/lib/cloudSync";
import { auth, isConfigured } from "@/lib/firebase";
import { onAuthStateChanged } from "firebase/auth";

const APP_SESSIONS_KEY = "syncgrade_session_count";

function App() {
  const [installPromptEvent, setInstallPromptEvent] = useState<BeforeInstallPromptEvent | null>(null);
  const [showInstallBanner, setShowInstallBanner] = useState(false);
  const [canShowInstallBanner, setCanShowInstallBanner] = useState(false);

  useEffect(() => {
    if (typeof window === "undefined") return;

    // Listen for auth state changes to trigger D1 data migration
    let unsubscribe = () => {};
    if (isConfigured) {
      unsubscribe = onAuthStateChanged(auth, (user) => {
        if (user) {
          void migrateD1DataToFirebaseUser(user);
        }
      });
    }

    const updateSW = registerSW({
      onNeedRefresh() {
        toast.info("A new version of SyncGrade is available!", {
          action: {
            label: "Reload",
            onClick: () => {
              updateSW(true);
            },
          },
          duration: Infinity,
        });
      },
      onOfflineReady() {
        toast.success("SyncGrade is ready to work offline!");
      },
    });

    // Track sessions to delay PWA install prompt
    let sessionCount = 0;
    try {
      const storedCount = localStorage.getItem(APP_SESSIONS_KEY);
      sessionCount = storedCount ? parseInt(storedCount, 10) : 0;
      sessionCount += 1;
      localStorage.setItem(APP_SESSIONS_KEY, sessionCount.toString());
    } catch {}

    // Show after 3 successful visits
    setCanShowInstallBanner(sessionCount >= 3);

    return () => unsubscribe();
  }, []);

  useEffect(() => {
    if (typeof window === "undefined") return;
    const onBeforeInstallPrompt = (event: Event) => {
      event.preventDefault();
      setInstallPromptEvent(event as BeforeInstallPromptEvent);
      if (canShowInstallBanner) setShowInstallBanner(true);
    };
    window.addEventListener("beforeinstallprompt", onBeforeInstallPrompt);
    return () => {
      window.removeEventListener("beforeinstallprompt", onBeforeInstallPrompt);
    };
  }, [canShowInstallBanner]);

  return (
    <ErrorBoundary>
      <ThemeProvider>
        <GpaScaleProvider>
          <TooltipProvider>
            <Toaster />
            <Layout
              topContent={
                showInstallBanner && canShowInstallBanner
                  ? <PwaInstallBanner event={installPromptEvent} />
                  : null
              }
            >
              <AppRoutes />
            </Layout>
          </TooltipProvider>
        </GpaScaleProvider>
      </ThemeProvider>
    </ErrorBoundary>
  );
}

export default App;

