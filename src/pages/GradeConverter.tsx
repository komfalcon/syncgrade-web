import { useMemo, useState } from "react";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

const scales = ["4.0", "5.0", "7.0"] as const;

export default function GradeConverter() {
  const [value, setValue] = useState("3.5");
  const [sourceScale, setSourceScale] = useState<(typeof scales)[number]>("5.0");
  const [targetScale, setTargetScale] = useState<(typeof scales)[number]>("4.0");

  const result = useMemo(() => {
    const oldGp = Number(value);
    const oldMax = Number(sourceScale);
    const newMax = Number(targetScale);
    if (!Number.isFinite(oldGp) || !Number.isFinite(oldMax) || !Number.isFinite(newMax) || oldMax === 0) {
      return 0;
    }
    return (oldGp / oldMax) * newMax;
  }, [value, sourceScale, targetScale]);

  return (
    <div className="container mx-auto px-4 py-10">
      <Card className="mx-auto max-w-xl space-y-5 p-6">
        <h1 className="text-2xl font-bold">Cross-Scale Grade Converter</h1>
        <p className="text-sm text-foreground-muted">Convert between 4.0, 5.0, and 7.0 GPA systems.</p>
        <div className="space-y-2">
          <Label htmlFor="source-gp">Current GP</Label>
          <Input id="source-gp" type="number" value={value} onChange={(e) => setValue(e.target.value)} />
        </div>
        <div className="grid gap-4 sm:grid-cols-2">
          <div className="space-y-2">
            <Label>Source Scale</Label>
            <Select value={sourceScale} onValueChange={(v) => setSourceScale(v as (typeof scales)[number])}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {scales.map((scale) => (
                  <SelectItem key={scale} value={scale}>
                    {scale}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-2">
            <Label>Target Scale</Label>
            <Select value={targetScale} onValueChange={(v) => setTargetScale(v as (typeof scales)[number])}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {scales.map((scale) => (
                  <SelectItem key={scale} value={scale}>
                    {scale}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>
        <div className="rounded-lg border bg-surface-elevated p-4">
          <p className="text-sm text-foreground-subtle">Result</p>
          <p className="text-3xl font-bold text-primary">{result.toFixed(2)}</p>
          <p className="text-xs text-foreground-subtle">NewGP = (OldGP / OldMax) × NewMax</p>
        </div>
      </Card>
    </div>
  );
}
