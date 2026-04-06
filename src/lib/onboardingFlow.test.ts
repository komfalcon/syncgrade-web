import { describe, expect, it } from "vitest";
import {
  getBootOnboardingStep,
  getOnboardingStepAfterProfile,
  getOnboardingStepAfterUniversity,
  shouldShowFullApp,
} from "@/lib/onboardingFlow";

describe("onboarding flow", () => {
  it("starts new users at profile step", () => {
    expect(getBootOnboardingStep(false)).toBe("profile");
  });

  it("skips onboarding for returning users", () => {
    expect(getBootOnboardingStep(true)).toBe("app");
  });

  it("advances profile to university to app", () => {
    expect(getOnboardingStepAfterProfile()).toBe("university");
    expect(getOnboardingStepAfterUniversity()).toBe("app");
  });

  it("only unlocks full app at app step", () => {
    expect(shouldShowFullApp("loading")).toBe(false);
    expect(shouldShowFullApp("profile")).toBe(false);
    expect(shouldShowFullApp("university")).toBe(false);
    expect(shouldShowFullApp("app")).toBe(true);
  });
});
