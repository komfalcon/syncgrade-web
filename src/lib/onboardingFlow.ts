export type OnboardingStep = "loading" | "profile" | "university" | "app";

export function getBootOnboardingStep(onboardingComplete: boolean): OnboardingStep {
  return onboardingComplete ? "app" : "profile";
}

export function getOnboardingStepAfterProfile(): OnboardingStep {
  return "university";
}

export function getOnboardingStepAfterUniversity(): OnboardingStep {
  return "app";
}

export function shouldShowFullApp(step: OnboardingStep): boolean {
  return step === "app";
}
