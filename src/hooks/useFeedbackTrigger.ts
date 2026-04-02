import { useEffect, useMemo, useState } from "react";

const VISIT_COUNT_KEY = "syncgrade_visit_count";
const INTERACTION_COUNT_KEY = "syncgrade_interaction_count";
const VISIT_THRESHOLD = 3;
const INTERACTION_THRESHOLD = 5;

function readCount(key: string): number {
  if (typeof window === "undefined") return 0;
  const raw = window.localStorage.getItem(key);
  const parsed = Number.parseInt(raw ?? "0", 10);
  return Number.isFinite(parsed) ? Math.max(0, parsed) : 0;
}

function writeCount(key: string, value: number): void {
  if (typeof window === "undefined") return;
  window.localStorage.setItem(key, String(Math.max(0, Math.floor(value))));
}

export function incrementInteractionCount(): number {
  const next = readCount(INTERACTION_COUNT_KEY) + 1;
  writeCount(INTERACTION_COUNT_KEY, next);
  return next;
}

export function useFeedbackTrigger(): { shouldShowFeedback: boolean } {
  const [visitCount, setVisitCount] = useState(0);
  const [interactionCount, setInteractionCount] = useState(0);

  useEffect(() => {
    if (typeof window === "undefined") return;

    const nextVisitCount = readCount(VISIT_COUNT_KEY) + 1;
    writeCount(VISIT_COUNT_KEY, nextVisitCount);
    setVisitCount(nextVisitCount);
    setInteractionCount(readCount(INTERACTION_COUNT_KEY));
  }, []);

  const shouldShowFeedback = useMemo(
    () => interactionCount >= INTERACTION_THRESHOLD || visitCount >= VISIT_THRESHOLD,
    [interactionCount, visitCount],
  );

  return { shouldShowFeedback };
}

