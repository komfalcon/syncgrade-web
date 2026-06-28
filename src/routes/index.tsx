import { lazy, Suspense } from "react";
import { Route, Switch, useLocation, Redirect } from "wouter";
import { AnimatePresence, motion } from "framer-motion";
import { Spinner } from "@/components/ui/spinner";

const Home = lazy(() => import("@/pages/Home"));
const Analytics = lazy(() => import("@/pages/Analytics"));
const NigerianUniversities = lazy(() => import("@/pages/NigerianUniversities"));
const GradePredictor = lazy(() => import("@/pages/GradePredictor"));
const Tools = lazy(() => import("@/pages/Tools"));
const More = lazy(() => import("@/pages/More"));
const CarryoverSimulator = lazy(() => import("@/pages/CarryoverSimulator"));
const CustomUniversityForm = lazy(() => import("@/pages/CustomUniversityForm"));
const GradeConverter = lazy(() => import("@/pages/GradeConverter"));
const UniversityGpLanding = lazy(() => import("@/pages/UniversityGpLanding"));
const NotFound = lazy(() => import("@/pages/NotFound"));

function PageLoader() {
  return (
    <div className="flex min-h-[60vh] items-center justify-center">
      <Spinner className="size-5 text-primary" />
    </div>
  );
}

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
      <Suspense fallback={<PageLoader />}>{children}</Suspense>
    </motion.div>
  );
}

export function AppRoutes() {
  const [location] = useLocation();

  return (
    <AnimatePresence mode="wait">
      <Switch key={location}>
        <Route path={"/"}>
          <AnimatedPage>
            <Home />
          </AnimatedPage>
        </Route>
        <Route path={"/profile"}>
          <Redirect to="/more" />
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
          <Redirect to="/more" />
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
