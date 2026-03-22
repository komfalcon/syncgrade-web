import { useRef } from "react";

type AnyFn = (...args: any[]) => any;

/**
 * Returns a stable callback identity that always invokes the latest function.
 */
export function useStableCallback<T extends AnyFn>(fn: T): T {
  const fnRef = useRef<T>(fn);
  fnRef.current = fn;

  const stableRef = useRef<T | null>(null);
  if (!stableRef.current) {
    stableRef.current = function (this: unknown, ...args: Parameters<T>) {
      return fnRef.current.apply(this, args);
    } as T;
  }

  return stableRef.current;
}
