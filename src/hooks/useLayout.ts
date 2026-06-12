import { useState, useCallback } from "react";

export interface LayoutState {
  isBannerVisible: boolean;
  showBanner: () => void;
  hideBanner: () => void;
}

export function useLayout(): LayoutState {
  const [isBannerVisible, setIsBannerVisible] = useState(false);

  const showBanner = useCallback(() => setIsBannerVisible(true), []);
  const hideBanner = useCallback(() => setIsBannerVisible(false), []);

  return { isBannerVisible, showBanner, hideBanner };
}
