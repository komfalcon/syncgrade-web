import { Card } from '@/components/ui/card';
import { useCGPA } from '@/hooks/useCGPA';
import { TrendingUp, RefreshCw } from 'lucide-react';
import { useEffect, useState } from 'react';
import { normalizeToSupportedScale, getClassification } from '@/utils/gpaLogic';

interface CGPAOverviewProps {
  cgpa: ReturnType<typeof useCGPA>;
}

export default function CGPAOverview({ cgpa }: CGPAOverviewProps) {
  const [displayCGPA, setDisplayCGPA] = useState(0);
  const [displayCredits, setDisplayCredits] = useState(0);
  const scale = normalizeToSupportedScale(cgpa.settings.gpaScale);

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
    if (gpa >= scale * 0.74) return 'text-emerald-600';
    if (gpa >= scale * 0.66) return 'text-cyan-600';
    if (gpa >= scale * 0.6) return 'text-amber-600';
    return 'text-orange-600';
  };

  const getGPABgColor = (gpa: number) => {
    if (gpa >= scale * 0.74) return 'bg-emerald-50 border-emerald-200';
    if (gpa >= scale * 0.66) return 'bg-cyan-50 border-cyan-200';
    if (gpa >= scale * 0.6) return 'bg-amber-50 border-amber-200';
    return 'bg-orange-50 border-orange-200';
  };

  const getGPALabel = (gpa: number) => {
    if (gpa <= 0) return 'No Data';
    return getClassification(gpa, scale).label;
  };

  const getClassificationColor = (gpa: number) => {
    if (gpa <= 0) return 'text-slate-500';
    return getClassification(gpa, scale).color;
  };

  const getClassificationTierLabel = (gpa: number) => {
    if (gpa <= 0) return '';
    const classification = getClassification(gpa, scale);
    return `Tier ${classification.tier}`;
  };

  const getSafeScaleLabel = () => {
    if (scale === 4.0) return '4.0';
    if (scale === 5.0) return '5.0';
    return 'No Data';
  };

  return (
    <div className="mb-12">
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-6">
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
            <p className={`text-xs mt-1 ${getClassificationColor(cgpa.currentCGPA)}`}>
              {getClassificationTierLabel(cgpa.currentCGPA)}
            </p>
            <p className="text-xs text-slate-500 mt-1">{getSafeScaleLabel()} Scale</p>
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

      {/* Carryover Stats Row */}
      {cgpa.carryoverStats.total > 0 && (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <Card className="p-4 shadow-md border border-orange-200 bg-orange-50">
            <div className="flex items-center gap-3">
              <RefreshCw className="w-5 h-5 text-orange-600" />
              <div>
                <p className="text-xs font-semibold text-slate-600 uppercase tracking-wide">Carryover Courses</p>
                <p className="text-2xl font-bold text-orange-600">{cgpa.carryoverStats.total}</p>
              </div>
            </div>
          </Card>
          <Card className="p-4 shadow-md border border-emerald-200 bg-emerald-50">
            <div className="flex items-center gap-3">
              <span className="text-lg">✅</span>
              <div>
                <p className="text-xs font-semibold text-slate-600 uppercase tracking-wide">Cleared Carryovers</p>
                <p className="text-2xl font-bold text-emerald-600">{cgpa.carryoverStats.cleared}</p>
              </div>
            </div>
          </Card>
          <Card className="p-4 shadow-md border border-red-200 bg-red-50">
            <div className="flex items-center gap-3">
              <span className="text-lg">⚠️</span>
              <div>
                <p className="text-xs font-semibold text-slate-600 uppercase tracking-wide">Active Carryovers</p>
                <p className="text-2xl font-bold text-red-600">{cgpa.carryoverStats.active}</p>
              </div>
            </div>
          </Card>
        </div>
      )}
    </div>
  );
}
