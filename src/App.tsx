import { useEffect, useState } from "react";
import { useLocation } from "wouter";
import { Toaster } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { Spinner } from "@/components/ui/spinner";
import ErrorBoundary from "./components/ErrorBoundary";
import { ThemeProvider } from "./contexts/ThemeContext";
import { Layout } from "@/components/Layout";
import { AppRoutes } from "@/routes";
import { GpaScaleProvider, type SupportedGpaScale } from "./contexts/GpaScaleContext";
import { getOnboardingComplete, setOnboardingComplete, getStoredValue, setStoredValue, STORAGE_KEYS } from "./lib/db";
import { normalizeToSupportedScale } from "./utils/gpaLogic";
import { GPA_SCALE_UPDATED_EVENT } from "./hooks/useCGPA";
import { getBootOnboardingStep, getOnboardingStepAfterProfile, getOnboardingStepAfterUniversity } from "./lib/onboardingFlow";
import PwaInstallBanner, { type BeforeInstallPromptEvent } from "./components/PwaInstallBanner";
import { FIRST_SYNC_SUCCESS_EVENT, FIRST_SYNC_SUCCESS_KEY } from "./lib/cloudSync";
import type { AppSettings } from "./hooks/useCGPA";

function App() {
  const [, setLocation] = useLocation();
  const [onboardingStep, setOnboardingStep] = useState<"loading" | "profile" | "university" | "app">("loading");
  const [installPromptEvent, setInstallPromptEvent] = useState<BeforeInstallPromptEvent | null>(null);
  const [showInstallBanner, setShowInstallBanner] = useState(false);
  const [canShowInstallBanner, setCanShowInstallBanner] = useState(false);
  const [gpaScale, setGpaScale] = useState<SupportedGpaScale>(5.0);

  useEffect(() => {
    if (typeof window === "undefined") return;
    setCanShowInstallBanner(localStorage.getItem(FIRST_SYNC_SUCCESS_KEY) === "1");
    let active = true;
    (async () => {
      try {
        const settingsRaw = localStorage.getItem(STORAGE_KEYS.settings);
        if (settingsRaw) {
          const parsed = JSON.parse(settingsRaw) as { gpaScale?: number };
          if (active && typeof parsed.gpaScale === "number") {
            setGpaScale(normalizeToSupportedScale(parsed.gpaScale));
          }
        }
      } catch {
        if (active) setGpaScale(5.0);
      }

      const onboardingComplete = await getOnboardingComplete();
      if (!active) return;
      const bootStep = getBootOnboardingStep(onboardingComplete);
      setOnboardingStep(bootStep);
      if (bootStep === "app") {
        setLocation("/");
        return;
      }
    })();
    return () => { active = false; };
  }, [setLocation]);

  useEffect(() => {
    if (typeof window === "undefined") return;
    const onScaleUpdated = (event: Event) => {
      const customEvent = event as CustomEvent<{ scale?: number }>;
      if (typeof customEvent.detail?.scale === "number") {
        setGpaScale(normalizeToSupportedScale(customEvent.detail.scale));
      }
    };
    window.addEventListener(GPA_SCALE_UPDATED_EVENT, onScaleUpdated);
    return () => window.removeEventListener(GPA_SCALE_UPDATED_EVENT, onScaleUpdated);
  }, []);

  useEffect(() => {
    if (typeof window === "undefined") return;
    const onBeforeInstallPrompt = (event: Event) => {
      event.preventDefault();
      setInstallPromptEvent(event as BeforeInstallPromptEvent);
      if (canShowInstallBanner) setShowInstallBanner(true);
    };
    const onSyncSuccess = () => {
      setCanShowInstallBanner(true);
      if (installPromptEvent) setShowInstallBanner(true);
    };
    window.addEventListener("beforeinstallprompt", onBeforeInstallPrompt);
    window.addEventListener(FIRST_SYNC_SUCCESS_EVENT, onSyncSuccess);
    return () => {
      window.removeEventListener("beforeinstallprompt", onBeforeInstallPrompt);
      window.removeEventListener(FIRST_SYNC_SUCCESS_EVENT, onSyncSuccess);
    };
  }, [canShowInstallBanner, installPromptEvent]);

  const handleProfileContinue = async ({ studentName, programme, startingLevel }: {
    studentName: string; programme: string; startingLevel: number;
  }) => {
    const rawSettings = await getStoredValue(STORAGE_KEYS.settings);
    let existingSettings: Partial<AppSettings> = {};
    if (rawSettings) {
      try { existingSettings = JSON.parse(rawSettings) as Partial<AppSettings>; }
      catch { existingSettings = {}; }
    }
    await setStoredValue(
      STORAGE_KEYS.settings,
      JSON.stringify({ ...existingSettings, studentName, programme, startingLevel }),
    );
    setOnboardingStep(getOnboardingStepAfterProfile());
  };

  const handleUniversityApplied = async () => {
    await setOnboardingComplete(true);
    setOnboardingStep(getOnboardingStepAfterUniversity());
    setLocation("/");
  };

  if (onboardingStep === "loading") {
    return (
      <div className="flex min-h-screen items-center justify-center bg-background">
        <Spinner className="size-5 text-primary" />
      </div>
    );
  }

  return (
    <ErrorBoundary>
      <ThemeProvider>
        <GpaScaleProvider value={gpaScale}>
          <TooltipProvider>
            <Toaster />
            <Layout
              hideNavbar={onboardingStep === "profile"}
              hideFooter={onboardingStep === "profile"}
              topContent={
                showInstallBanner && canShowInstallBanner
                  ? <PwaInstallBanner event={installPromptEvent} />
                  : null
              }
            >
              <AppRoutes
                onboardingStep={onboardingStep}
                onProfileContinue={handleProfileContinue}
                onUniversityApplied={handleUniversityApplied}
              />
            </Layout>
          </TooltipProvider>
        </GpaScaleProvider>
      </ThemeProvider>
    </ErrorBoundary>
  );
}

export default App;
