import { Card } from '@/components/ui/card';
import { useCGPA } from '@/hooks/useCGPA';
import { TrendingUp } from 'lucide-react';
import { useEffect, useState } from 'react';

interface CGPAOverviewProps {
  cgpa: ReturnType<typeof useCGPA>;
}

export default function CGPAOverview({ cgpa }: CGPAOverviewProps) {
  const [displayCGPA, setDisplayCGPA] = useState(0);
  const [displayCredits, setDisplayCredits] = useState(0);

  // Animate numbers on change
  useEffect(() => {
    const interval = setInterval(() => {
      setDisplayCGPA(prev => {
        const diff = cgpa.currentCGPA - prev;
        if (Math.abs(diff) < 0.01) return cgpa.currentCGPA;
        return prev + diff * 0.1;
      });
    }, 16);
    return () => clearInterval(interval);
  }, [cgpa.currentCGPA]);

  useEffect(() => {
    const interval = setInterval(() => {
      setDisplayCredits(prev => {
        const diff = cgpa.totalCredits - prev;
        if (Math.abs(diff) < 0.1) return cgpa.totalCredits;
        return prev + diff * 0.1;
      });
    }, 16);
    return () => clearInterval(interval);
  }, [cgpa.totalCredits]);

  const getGPAColor = (gpa: number) => {
    if (gpa >= 3.7) return 'text-emerald-600';
    if (gpa >= 3.3) return 'text-cyan-600';
    if (gpa >= 3.0) return 'text-amber-600';
    return 'text-orange-600';
  };

  const getGPABgColor = (gpa: number) => {
    if (gpa >= 3.7) return 'bg-emerald-50 border-emerald-200';
    if (gpa >= 3.3) return 'bg-cyan-50 border-cyan-200';
    if (gpa >= 3.0) return 'bg-amber-50 border-amber-200';
    return 'bg-orange-50 border-orange-200';
  };

  const getGPALabel = (gpa: number) => {
    if (gpa >= 3.7) return 'Excellent';
    if (gpa >= 3.3) return 'Very Good';
    if (gpa >= 3.0) return 'Good';
    if (gpa > 0) return 'Fair';
    return 'No Data';
  };

  return (
    <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-12">
      {/* Current CGPA Card */}
      <Card
        className={`p-8 shadow-lg border-2 relative overflow-hidden ${getGPABgColor(cgpa.currentCGPA)}`}
      >
        <div className="absolute top-0 right-0 w-32 h-32 bg-gradient-to-br from-cyan-400/20 to-teal-400/20 rounded-full -mr-16 -mt-16"></div>
        <div className="relative z-10">
          <p className="text-sm font-semibold text-slate-600 uppercase tracking-wide mb-2">Current CGPA</p>
          <div className={`gpa-value ${getGPAColor(cgpa.currentCGPA)}`}>
            {displayCGPA.toFixed(2)}
          </div>
          <p className={`text-sm font-medium mt-2 ${getGPAColor(cgpa.currentCGPA)}`}>
            {getGPALabel(cgpa.currentCGPA)}
          </p>
        </div>
      </Card>

      {/* Total Credits Card */}
      <Card className="p-8 shadow-lg border-2 border-blue-200 bg-blue-50 relative overflow-hidden">
        <div className="absolute top-0 right-0 w-32 h-32 bg-gradient-to-br from-blue-400/20 to-cyan-400/20 rounded-full -mr-16 -mt-16"></div>
        <div className="relative z-10">
          <p className="text-sm font-semibold text-slate-600 uppercase tracking-wide mb-2">Total Credits</p>
          <div className="text-4xl font-bold text-blue-600">
            {Math.round(displayCredits)}
          </div>
          <p className="text-sm text-slate-600 mt-2">Credits Completed</p>
        </div>
      </Card>

      {/* Semesters Card */}
      <Card className="p-8 shadow-lg border-2 border-purple-200 bg-purple-50 relative overflow-hidden">
        <div className="absolute top-0 right-0 w-32 h-32 bg-gradient-to-br from-purple-400/20 to-pink-400/20 rounded-full -mr-16 -mt-16"></div>
        <div className="relative z-10">
          <p className="text-sm font-semibold text-slate-600 uppercase tracking-wide mb-2">Semesters</p>
          <div className="text-4xl font-bold text-purple-600">{cgpa.semesters.length}</div>
          <p className="text-sm text-slate-600 mt-2 flex items-center gap-1">
            <TrendingUp className="w-4 h-4" />
            Track Your Progress
          </p>
        </div>
      </Card>
    </div>
  );
}
