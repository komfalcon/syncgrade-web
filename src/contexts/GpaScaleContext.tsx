import { createContext, useContext } from "react";

export type SupportedGpaScale = 4.0 | 5.0;

const GpaScaleContext = createContext<SupportedGpaScale>(5.0);

interface GpaScaleProviderProps {
  value: SupportedGpaScale;
  children: React.ReactNode;
}

export function GpaScaleProvider({ value, children }: GpaScaleProviderProps) {
  return <GpaScaleContext.Provider value={value}>{children}</GpaScaleContext.Provider>;
}

export function useGpaScale(): SupportedGpaScale {
  return useContext(GpaScaleContext);
}
