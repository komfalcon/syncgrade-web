import { useEffect, useMemo, useState } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { BookOpen, ChevronDown, ChevronUp } from 'lucide-react';
import type { GradeRange } from '@/universities/types';

const STORAGE_KEY = 'syncgrade_grading_guide_seen';

interface GradingGuideProps {
  gradeRanges: GradeRange[];
  universityName?: string | null;
}

function getGradeClass(grade: string): string {
  const normalized = grade.toUpperCase();
  if (normalized === 'A') return 'text-success font-bold';
  if (normalized === 'B') return 'text-accent font-bold';
  if (normalized === 'C') return 'text-warning font-bold';
  if (normalized === 'D' || normalized === 'E') return 'text-destructive font-bold';
  if (normalized === 'F') return 'text-foreground-subtle';
  return 'text-foreground font-bold';
}

export default function GradingGuide({ gradeRanges, universityName }: GradingGuideProps) {
  const [expanded, setExpanded] = useState(true);

  useEffect(() => {
    if (typeof window === 'undefined') return;
    setExpanded(localStorage.getItem(STORAGE_KEY) !== 'true');
  }, []);

  const sortedGradeRanges = useMemo(
    () => [...gradeRanges].sort((a, b) => b.points - a.points || b.max - a.max),
    [gradeRanges],
  );

  const collapseGuide = () => {
    setExpanded(false);
    if (typeof window !== 'undefined') {
      localStorage.setItem(STORAGE_KEY, 'true');
    }
  };

  const toggleGuide = () => {
    if (expanded) {
      collapseGuide();
      return;
    }
    setExpanded(true);
  };

  return (
    <div className="rounded-xl border border-border bg-surface">
      <button
        type="button"
        onClick={toggleGuide}
        className="w-full cursor-pointer rounded-xl p-3 text-sm text-foreground-muted transition-colors duration-150 hover:bg-surface-elevated"
      >
        <div className={`flex items-center justify-between gap-2 ${expanded ? 'border-b border-border pb-3' : ''}`}>
          <div className="flex items-center gap-2">
            <BookOpen className="h-4 w-4" />
            <span>How does grading work?</span>
          </div>
          {expanded ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
        </div>
      </button>

      <AnimatePresence initial={false}>
        {expanded ? (
          <motion.div
            key="guide-body"
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.2 }}
            className="overflow-hidden"
          >
            <div className="space-y-4 p-3 pt-0">
              <section>
                <h4 className="text-sm font-semibold text-foreground">What is a Credit Unit?</h4>
                <p className="mt-1 text-xs leading-relaxed text-foreground-muted">
                  Each course has a credit unit value (usually 1–6). Think of it as the weight of that course. A
                  3-unit course counts more towards your CGPA than a 1-unit course. Your lecturer will tell you how
                  many units each course carries — it&apos;s also on your course registration form.
                </p>
              </section>

              <section>
                <h4 className="text-sm font-semibold text-foreground">Your Grading System</h4>
                <p className="text-xs text-foreground-muted">
                  {universityName ? `${universityName}'s grade scale` : 'Standard Nigerian 5-point grade scale'}
                </p>
                <div className="mt-2 overflow-x-auto rounded-lg border border-border">
                  <table className="w-full">
                    <thead className="bg-surface-elevated">
                      <tr className="text-xs font-semibold uppercase tracking-wide text-foreground-muted">
                        <th className="px-3 py-2 text-left">Grade</th>
                        <th className="px-3 py-2 text-left">Score Range</th>
                        <th className="px-3 py-2 text-left">Points</th>
                      </tr>
                    </thead>
                    <tbody>
                      {sortedGradeRanges.map((range, index) => (
                        <tr
                          key={`${range.grade}-${range.points}`}
                          className={`border-b border-border text-xs text-foreground last:border-b-0 ${
                            index % 2 === 0 ? 'bg-surface' : 'bg-surface-elevated'
                          }`}
                        >
                          <td className={`px-3 py-2 ${getGradeClass(range.grade)}`}>{range.grade}</td>
                          <td className="px-3 py-2">
                            {range.min} – {range.max}
                          </td>
                          <td className="px-3 py-2">{range.points.toFixed(1)} pts</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </section>

              <section>
                <h4 className="text-sm font-semibold text-foreground">How is CGPA calculated?</h4>
                <p className="mt-1 text-xs leading-relaxed text-foreground-muted">
                  For each course, multiply your grade points by the credit units. Add all of these together, then
                  divide by your total credit units. SyncGrade does all of this automatically — just enter your
                  courses and grades.
                </p>
                <pre className="mt-2 rounded-lg bg-surface-elevated p-3 font-mono text-xs text-foreground-muted">
{`MTH 201 (3 units) × A (5.0 pts) = 15.0
ENG 201 (2 units) × B (4.0 pts) = 8.0
─────────────────────────────────
Total: 23.0 ÷ 5 units = GPA of 4.60`}
                </pre>
              </section>

              <button
                type="button"
                onClick={collapseGuide}
                className="mt-3 w-full cursor-pointer text-center text-xs text-foreground-subtle underline"
              >
                Got it, hide this
              </button>
            </div>
          </motion.div>
        ) : null}
      </AnimatePresence>
    </div>
  );
}
