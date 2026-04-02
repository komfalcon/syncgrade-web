import { Toaster } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import NotFound from "@/pages/NotFound";
import FirstTimeSetup from "@/components/FirstTimeSetup";
import { Route, Switch } from "wouter";
import { useEffect, useState } from "react";
import ErrorBoundary from "./components/ErrorBoundary";
import { ThemeProvider } from "./contexts/ThemeContext";
import Home from "./pages/Home";
import NigerianUniversities from "./pages/NigerianUniversities";
import GradePredictor from "./pages/GradePredictor";
import Analytics from "./pages/Analytics";
import CarryoverSimulator from "./pages/CarryoverSimulator";
import StudyLoadOptimizer from "./pages/StudyLoadOptimizer";
import UniversityComparison from "./pages/UniversityComparison";
import BackupRestore from "./pages/BackupRestore";
import CustomUniversityForm from "./pages/CustomUniversityForm";
import { STORAGE_KEYS } from "./storage/db";
import GradeConverter from "./pages/GradeConverter";
import UniversityGpLanding from "./pages/UniversityGpLanding";
import PwaInstallBanner, { type BeforeInstallPromptEvent } from "./components/PwaInstallBanner";
import { FIRST_SYNC_SUCCESS_EVENT, FIRST_SYNC_SUCCESS_KEY } from "./lib/cloudSync";
import AppFooter from "./components/AppFooter";
import Navbar from "./components/Navbar";
import { GpaScaleProvider, type SupportedGpaScale } from "./contexts/GpaScaleContext";
import { GPA_SCALE_UPDATED_EVENT } from "./hooks/useCGPA";
import { normalizeToSupportedScale } from "./utils/gpaLogic";


function Router() {
  return (
    <Switch>
      <Route path={"/"} component={Home} />
      <Route path={"/nigerian-universities"} component={NigerianUniversities} />
      <Route path={"/grade-predictor"} component={GradePredictor} />
      <Route path={"/analytics"} component={Analytics} />
      <Route path={"/carryover-simulator"} component={CarryoverSimulator} />
      <Route path={"/study-load-optimizer"} component={StudyLoadOptimizer} />
      <Route path={"/university-comparison"} component={UniversityComparison} />
      <Route path={"/backup-restore"} component={BackupRestore} />
      <Route path={"/custom-university"} component={CustomUniversityForm} />
      <Route path={"/grade-converter"} component={GradeConverter} />
      <Route path={"/calculate/gp-in-:slug"}>
        {(params) => <UniversityGpLanding slug={params.slug} />}
      </Route>
      <Route path={"/404"} component={NotFound} />
      {/* Final fallback route */}
      <Route component={NotFound} />
    </Switch>
  );
}

// NOTE: About Theme
// - First choose a default theme according to your design style (dark or light bg), than change color palette in index.css
//   to keep consistent foreground/background color across components
// - If you want to make theme switchable, pass `switchable` ThemeProvider and use `useTheme` hook

function App() {
  const [setupCheckComplete, setSetupCheckComplete] = useState(false);
  const [showFirstTimeSetup, setShowFirstTimeSetup] = useState(false);
  const [installPromptEvent, setInstallPromptEvent] = useState<BeforeInstallPromptEvent | null>(null);
  const [showInstallBanner, setShowInstallBanner] = useState(false);
  const [canShowInstallBanner, setCanShowInstallBanner] = useState(false);
  const [gpaScale, setGpaScale] = useState<SupportedGpaScale>(5.0);

  useEffect(() => {
    if (typeof window === "undefined") return;
    const localUserExists = localStorage.getItem(STORAGE_KEYS.syncgradeUser);
    setShowFirstTimeSetup(!localUserExists);
    setCanShowInstallBanner(localStorage.getItem(FIRST_SYNC_SUCCESS_KEY) === "1");
    try {
      const settingsRaw = localStorage.getItem(STORAGE_KEYS.settings);
      if (settingsRaw) {
        const parsed = JSON.parse(settingsRaw) as { gpaScale?: number };
        if (typeof parsed.gpaScale === "number") {
          setGpaScale(normalizeToSupportedScale(parsed.gpaScale));
        }
      }
    } catch {
      setGpaScale(5.0);
    }
    setSetupCheckComplete(true);
  }, []);

  useEffect(() => {
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

  return (
    <ErrorBoundary>
      <ThemeProvider
        defaultTheme="light"
        // switchable
      >
        <GpaScaleProvider value={gpaScale}>
          <TooltipProvider>
            <Toaster />
            <FirstTimeSetup open={showFirstTimeSetup} onComplete={() => setShowFirstTimeSetup(false)} />
            {setupCheckComplete && !showFirstTimeSetup && (
              <>
                {showInstallBanner && canShowInstallBanner && (
                  <div className="container mx-auto px-4 pt-4">
                    <PwaInstallBanner event={installPromptEvent} />
                  </div>
                )}
                <Navbar />
                <Router />
                <AppFooter />
              </>
            )}
          </TooltipProvider>
        </GpaScaleProvider>
      </ThemeProvider>
    </ErrorBoundary>
  );
}

export default App;
