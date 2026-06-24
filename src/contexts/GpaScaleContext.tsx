import { createContext, useContext, useState } from "react";
import { normalizeToSupportedScale } from "../utils/gpaLogic";
import { STORAGE_KEYS } from "../lib/db";

export type SupportedGpaScale = 4.0 | 5.0;

interface GpaScaleContextType {
  scale: SupportedGpaScale;
  setScale: (scale: SupportedGpaScale) => void;
}

const GpaScaleContext = createContext<GpaScaleContextType>({ scale: 5.0, setScale: () => {} });

interface GpaScaleProviderProps {
  children: React.ReactNode;
}

export function GpaScaleProvider({ children }: GpaScaleProviderProps) {
  const [scale, setScaleState] = useState<SupportedGpaScale>(() => {
    if (typeof window === "undefined") return 5.0;
    try {
      const settingsRaw = localStorage.getItem(STORAGE_KEYS.settings);
      if (settingsRaw) {
        const parsed = JSON.parse(settingsRaw);
        if (typeof parsed.gpaScale === "number") {
          return normalizeToSupportedScale(parsed.gpaScale);
        }
      }
    } catch {}
    return 5.0;
  });

  const setScale = (newScale: SupportedGpaScale) => {
    setScaleState(newScale);
    if (typeof window !== "undefined") {
      try {
        const settingsRaw = localStorage.getItem(STORAGE_KEYS.settings);
        const parsed = settingsRaw ? JSON.parse(settingsRaw) : {};
        parsed.gpaScale = newScale;
        localStorage.setItem(STORAGE_KEYS.settings, JSON.stringify(parsed));
      } catch {}
    }
  };

  return <GpaScaleContext.Provider value={{ scale, setScale }}>{children}</GpaScaleContext.Provider>;
}

export function useGpaScale(): SupportedGpaScale {
  return useContext(GpaScaleContext).scale;
}

export function useSetGpaScale() {
  return useContext(GpaScaleContext).setScale;
}
