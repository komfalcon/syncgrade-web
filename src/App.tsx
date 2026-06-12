import { Toaster } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import NotFound from "@/pages/NotFound";
import { Route, Switch, useLocation } from "wouter";
import { useEffect, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import ErrorBoundary from "./components/ErrorBoundary";
import { ThemeProvider } from "./contexts/ThemeContext";
import Home from "./pages/Home";
import NigerianUniversities from "./pages/NigerianUniversities";
import GradePredictor from "./pages/GradePredictor";
import Analytics from "./pages/Analytics";
import CarryoverSimulator from "./pages/CarryoverSimulator";
import BackupRestore from "./pages/BackupRestore";
import CustomUniversityForm from "./pages/CustomUniversityForm";
import { getOnboardingComplete, getStoredValue, setOnboardingComplete, setStoredValue, STORAGE_KEYS } from "./storage/db";
import GradeConverter from "./pages/GradeConverter";
import UniversityGpLanding from "./pages/UniversityGpLanding";
import PwaInstallBanner, { type BeforeInstallPromptEvent } from "./components/PwaInstallBanner";
import { FIRST_SYNC_SUCCESS_EVENT, FIRST_SYNC_SUCCESS_KEY } from "./lib/cloudSync";
import { GpaScaleProvider, type SupportedGpaScale } from "./contexts/GpaScaleContext";
import { GPA_SCALE_UPDATED_EVENT } from "./hooks/useCGPA";
import { normalizeToSupportedScale } from "./utils/gpaLogic";
import Tools from "./pages/Tools";
import More from "./pages/More";
import Layout from "./components/Layout";
import { Spinner } from "./components/ui/spinner";
import OnboardingProfileForm from "./components/OnboardingProfileForm";
import type { AppSettings } from "./hooks/useCGPA";
import {
  getBootOnboardingStep,
  getOnboardingStepAfterProfile,
  getOnboardingStepAfterUniversity,
  shouldShowFullApp,
} from "./lib/onboardingFlow";

const pageTransition = {
  type: "spring" as const,
  stiffness: 260,
  damping: 28,
};

const pageVariants = {
  initial: { opacity: 0, y: 16, scale: 0.98 },
  animate: { opacity: 1, y: 0, scale: 1 },
  exit: { opacity: 0, y: -12, scale: 0.98 },
};

function AnimatedPage({ children }: { children: React.ReactNode }) {
  return (
    <motion.div
      variants={pageVariants}
      initial="initial"
      animate="animate"
      exit="exit"
      transition={pageTransition}
    >
      {children}
    </motion.div>
  );
}

function Router() {
  const [location] = useLocation();

  return (
    <AnimatePresence mode="wait">
      <Switch key={location}>
        <Route path={"/"}>
          <AnimatedPage><Home /></AnimatedPage>
        </Route>
        <Route path={"/nigerian-universities"}>
          <AnimatedPage><NigerianUniversities /></AnimatedPage>
        </Route>
        <Route path={"/grade-predictor"}>
          <AnimatedPage><GradePredictor /></AnimatedPage>
        </Route>
        <Route path={"/analytics"}>
          <AnimatedPage><Analytics /></AnimatedPage>
        </Route>
        <Route path={"/tools"}>
          <AnimatedPage><Tools /></AnimatedPage>
        </Route>
        <Route path={"/more"}>
          <AnimatedPage><More /></AnimatedPage>
        </Route>
        <Route path={"/carryover-simulator"}>
          <AnimatedPage><CarryoverSimulator /></AnimatedPage>
        </Route>
        <Route path={"/backup-restore"}>
          <AnimatedPage><BackupRestore /></AnimatedPage>
        </Route>
        <Route path={"/custom-university"}>
          <AnimatedPage><CustomUniversityForm /></AnimatedPage>
        </Route>
        <Route path={"/grade-converter"}>
          <AnimatedPage><GradeConverter /></AnimatedPage>
        </Route>
        <Route path={"/calculate/gp-in-:slug"}>
          {(params) => <AnimatedPage><UniversityGpLanding slug={params.slug} /></AnimatedPage>}
        </Route>
        <Route path={"/404"}>
          <AnimatedPage><NotFound /></AnimatedPage>
        </Route>
        <Route>
          <AnimatedPage><NotFound /></AnimatedPage>
        </Route>
      </Switch>
    </AnimatePresence>
  );
}

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
        if (active) {
          setGpaScale(5.0);
        }
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
    return () => {
      active = false;
    };
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
      if (canShowInstallBanner) {
        setShowInstallBanner(true);
      }
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
      try {
        existingSettings = JSON.parse(rawSettings) as Partial<AppSettings>;
      } catch {
        existingSettings = {};
      }
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
        <div className="animated-bg" />
        <Spinner className="size-6 text-primary" />
      </div>
    );
  }

  return (
    <ErrorBoundary>
      <ThemeProvider>
        <GpaScaleProvider value={gpaScale}>
          <TooltipProvider>
            <div className="animated-bg" />
            <Toaster />
            {onboardingStep === "profile" ? (
              <OnboardingProfileForm onContinue={handleProfileContinue} />
            ) : null}
            {onboardingStep === "university" ? (
              <NigerianUniversities onboardingMode onUniversityApplied={handleUniversityApplied} />
            ) : null}
            {shouldShowFullApp(onboardingStep) ? (
              <Layout
                topContent={
                  showInstallBanner && canShowInstallBanner ? (
                    <PwaInstallBanner event={installPromptEvent} />
                  ) : null
                }
              >
                <Router />
              </Layout>
            ) : null}
          </TooltipProvider>
        </GpaScaleProvider>
      </ThemeProvider>
    </ErrorBoundary>
  );
}

export default App;
