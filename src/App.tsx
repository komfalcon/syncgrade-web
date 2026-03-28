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
import { STORAGE_KEYS, getSyncgradeUserProfile } from "./storage/db";


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
  const [showFirstTimeSetup, setShowFirstTimeSetup] = useState(false);

  useEffect(() => {
    let active = true;
    (async () => {
      const localUserExists = typeof window !== "undefined" && localStorage.getItem(STORAGE_KEYS.syncgradeUser);
      if (localUserExists) {
        if (active) setShowFirstTimeSetup(false);
        return;
      }
      const profile = await getSyncgradeUserProfile();
      if (active) {
        setShowFirstTimeSetup(!profile);
      }
    })();
    return () => {
      active = false;
    };
  }, []);

  return (
    <ErrorBoundary>
      <ThemeProvider
        defaultTheme="light"
        // switchable
      >
        <TooltipProvider>
          <Toaster />
          <FirstTimeSetup open={showFirstTimeSetup} onComplete={() => setShowFirstTimeSetup(false)} />
          <Router />
        </TooltipProvider>
      </ThemeProvider>
    </ErrorBoundary>
  );
}

export default App;
