import { useMemo, useState } from "react";
import { Check, ChevronDown, Search } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from "@/components/ui/command";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Label } from "@/components/ui/label";
import { useUniversities } from "@/hooks/useUniversities";
import { useCGPA } from "@/hooks/useCGPA";
import { resolveUniversityGradingSystem } from "@/universities/nigeria";
import type { UniversityConfig } from "@/universities/types";

type InstitutionFilter = "all" | "university" | "polytechnic" | "college";

interface UniversitySelectorProps {
  label?: string;
  selectedName?: string;
  onSelectedNameChange?: (name: string) => void;
}

export default function UniversitySelector({
  label = "Institution",
  selectedName,
  onSelectedNameChange,
}: UniversitySelectorProps) {
  const { universities } = useUniversities();
  const cgpa = useCGPA();
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState("");
  const [filter, setFilter] = useState<InstitutionFilter>("all");

  const activeUniversity = useMemo(() => {
    if (selectedName) {
      return universities.find((uni) => uni.name === selectedName) ?? null;
    }
    if (!cgpa.settings.activeUniversity) return null;
    return (
      universities.find((uni) => uni.shortName === cgpa.settings.activeUniversity) ?? null
    );
  }, [cgpa.settings.activeUniversity, selectedName, universities]);

  const filteredUniversities = useMemo(() => {
    const normalized = query.trim().toLowerCase();
    return universities.filter((uni) => {
      if (filter !== "all" && uni.type !== filter) return false;
      if (!normalized) return true;
      const haystack = `${uni.name} ${uni.shortName} ${uni.location}`.toLowerCase();
      return haystack.includes(normalized);
    });
  }, [filter, query, universities]);

  const applyUniversity = (uni: UniversityConfig) => {
    const admissionSession =
      cgpa.settings.admissionSession ||
      uni.gradingSystem[uni.gradingSystem.length - 1]?.session_start ||
      null;
    const resolved = resolveUniversityGradingSystem(uni, admissionSession);
    cgpa.updateSettings({
      activeUniversity: uni.shortName,
      gpaScale: resolved.scale,
      gradeRanges: resolved.grades,
      admissionSession,
      repeatPolicy: uni.repeatPolicy.method,
    });
    onSelectedNameChange?.(uni.name);
    setOpen(false);
  };

  return (
    <div className="space-y-2">
      <Label>{label}</Label>
      <div className="flex flex-col gap-2 sm:flex-row">
        <select
          value={filter}
          onChange={(event) => setFilter(event.target.value as InstitutionFilter)}
          className="h-12 rounded-lg border border-border bg-surface px-3 text-sm text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary"
        >
          <option value="all">All institution types</option>
          <option value="university">University</option>
          <option value="polytechnic">Polytechnic</option>
          <option value="college">College of Education</option>
        </select>
        <Popover open={open} onOpenChange={setOpen}>
          <PopoverTrigger asChild>
            <Button
              type="button"
              variant="outline"
              role="combobox"
              aria-expanded={open}
              className="min-h-12 w-full justify-between rounded-lg bg-surface"
            >
              <span className="truncate text-left">
                {activeUniversity ? activeUniversity.name : "Search and select institution"}
              </span>
              <ChevronDown className="h-4 w-4 opacity-60" />
            </Button>
          </PopoverTrigger>
          <PopoverContent className="w-[min(100vw-2rem,28rem)] rounded-xl bg-surface-elevated p-0">
            <Command className="bg-surface-elevated">
              <div className="flex items-center border-b border-border px-3">
                <Search className="h-4 w-4 text-foreground-subtle" />
                <CommandInput
                  value={query}
                  onValueChange={setQuery}
                  placeholder="Search by name, acronym, or location..."
                  className="h-12 border-0"
                />
              </div>
              <CommandList>
                <CommandEmpty>No institution found.</CommandEmpty>
                <CommandGroup>
                  {filteredUniversities.map((uni) => {
                    const isActive = activeUniversity?.id === uni.id;
                    return (
                      <CommandItem
                        key={uni.id}
                        value={`${uni.name} ${uni.shortName} ${uni.location}`}
                        onSelect={() => applyUniversity(uni)}
                        className="min-h-12 rounded-lg"
                      >
                        <div className="min-w-0 flex-1">
                          <p className="truncate text-sm font-medium">{uni.name}</p>
                          <p className="truncate text-xs text-foreground-muted">
                            {uni.shortName} • {uni.type ?? "custom"} • {uni.location}
                          </p>
                        </div>
                        {isActive ? <Check className="h-4 w-4 text-primary" /> : null}
                      </CommandItem>
                    );
                  })}
                </CommandGroup>
              </CommandList>
            </Command>
          </PopoverContent>
        </Popover>
      </div>
    </div>
  );
}

