import { useEffect, useState } from "react";
import type { UniversityConfig } from "@/universities/types";
import {
  getUnifiedUniversities,
  getUniversityDbMeta,
  nigerianUniversities,
  type UniversityDbMeta,
} from "@/universities/nigeria";

export function useUniversities() {
  const [universities, setUniversities] = useState<UniversityConfig[]>(nigerianUniversities);
  const [meta, setMeta] = useState<UniversityDbMeta>(getUniversityDbMeta());

  useEffect(() => {
    let active = true;
    (async () => {
      const merged = await getUnifiedUniversities();
      if (!active) return;
      setUniversities(merged);
      setMeta(getUniversityDbMeta());
    })();
    return () => {
      active = false;
    };
  }, []);

  return { universities, meta };
}

