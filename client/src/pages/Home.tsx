import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Plus, Trash2, BarChart3 } from 'lucide-react';
import { useCGPA } from '@/hooks/useCGPA';
import SemesterCard from '@/components/SemesterCard';
import CGPAOverview from '@/components/CGPAOverview';
import AddSemesterDialog from '@/components/AddSemesterDialog';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, LineChart, Line } from 'recharts';

/**
 * Design Philosophy: Vibrant Data Dashboard
 * - Teal (#0891b2) to Cyan (#06b6d4) gradient primary colors
 * - Animated counters and progress indicators
 * - Interactive semester cards with color-coded GPA status
 * - Data visualization with charts
 * - Poppins typography for modern, energetic feel
 * - Generous spacing and depth with shadows
 */

export default function Home() {
  const cgpa = useCGPA();
  const [showAddSemester, setShowAddSemester] = useState(false);
  const [expandedSemesterId, setExpandedSemesterId] = useState<string | null>(null);

  // Prepare data for charts
  const chartData = cgpa.semesters.map(semester => ({
    name: semester.name,
    gpa: cgpa.semesterGPAs[semester.id] || 0,
    courses: semester.courses.length,
  }));

  const handleClearAll = () => {
    if (window.confirm('Are you sure you want to clear all data? This cannot be undone.')) {
      cgpa.clearAllData();
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-cyan-50 to-slate-50">
      {/* Hero Section */}
      <div
        className="relative overflow-hidden bg-gradient-to-r from-cyan-600 via-teal-600 to-cyan-500 text-white py-16 md:py-24"
        style={{
          backgroundImage: `url('https://d2xsxph8kpxj0f.cloudfront.net/310519663370303140/R495SLkMAAXYH4T4Q3Hu88/hero-background-LY43fuC9vm4gxQJGTuFAyU.webp')`,
          backgroundSize: 'cover',
          backgroundPosition: 'center',
        }}
      >
        <div className="absolute inset-0 bg-black/30"></div>
        <div className="relative container mx-auto px-4 text-center">
          <h1 className="text-4xl md:text-5xl font-bold mb-4 drop-shadow-lg">CGPA Calculator</h1>
          <p className="text-lg md:text-xl text-cyan-50 drop-shadow-md max-w-2xl mx-auto">
            Track your academic performance across semesters and achieve your GPA goals
          </p>
        </div>
      </div>

      {/* Main Content */}
      <div className="container mx-auto px-4 py-12">
        {/* Overview Cards */}
        <CGPAOverview cgpa={cgpa} />

        {/* Charts Section */}
        {chartData.length > 0 && (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-12">
            {/* GPA Trend Chart */}
            <Card className="p-6 shadow-lg border-0">
              <div className="flex items-center gap-2 mb-4">
                <BarChart3 className="w-5 h-5 text-cyan-600" />
                <h3 className="text-lg font-semibold text-slate-900">Semester GPA Comparison</h3>
              </div>
              <ResponsiveContainer width="100%" height={300}>
                <BarChart data={chartData}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
                  <XAxis dataKey="name" stroke="#64748b" />
                  <YAxis domain={[0, 4]} stroke="#64748b" />
                  <Tooltip
                    contentStyle={{
                      backgroundColor: '#ffffff',
                      border: '1px solid #e2e8f0',
                      borderRadius: '0.5rem',
                    }}
                  />
                  <Bar dataKey="gpa" fill="#06b6d4" radius={[8, 8, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </Card>

            {/* GPA Trend Line */}
            <Card className="p-6 shadow-lg border-0">
              <h3 className="text-lg font-semibold text-slate-900 mb-4">GPA Progression</h3>
              <ResponsiveContainer width="100%" height={300}>
                <LineChart data={chartData}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
                  <XAxis dataKey="name" stroke="#64748b" />
                  <YAxis domain={[0, 4]} stroke="#64748b" />
                  <Tooltip
                    contentStyle={{
                      backgroundColor: '#ffffff',
                      border: '1px solid #e2e8f0',
                      borderRadius: '0.5rem',
                    }}
                  />
                  <Line
                    type="monotone"
                    dataKey="gpa"
                    stroke="#0891b2"
                    strokeWidth={3}
                    dot={{ fill: '#06b6d4', r: 6 }}
                    activeDot={{ r: 8 }}
                  />
                </LineChart>
              </ResponsiveContainer>
            </Card>
          </div>
        )}

        {/* Semesters Section */}
        <div className="mb-12">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-2xl font-bold text-slate-900">Your Semesters</h2>
            <Button
              onClick={() => setShowAddSemester(true)}
              className="bg-gradient-to-r from-cyan-600 to-teal-600 hover:from-cyan-700 hover:to-teal-700 text-white gap-2"
            >
              <Plus className="w-4 h-4" />
              Add Semester
            </Button>
          </div>

          {cgpa.semesters.length === 0 ? (
            <Card className="p-12 text-center border-2 border-dashed border-cyan-200 bg-cyan-50/50">
              <img
                src="https://d2xsxph8kpxj0f.cloudfront.net/310519663370303140/R495SLkMAAXYH4T4Q3Hu88/empty-state-illustration-9BY5MtVBJPMMCeqd5q2NEA.webp"
                alt="Empty state"
                className="w-48 h-48 mx-auto mb-6 object-contain"
              />
              <h3 className="text-xl font-semibold text-slate-700 mb-2">No Semesters Yet</h3>
              <p className="text-slate-600 mb-6">Start by adding your first semester to begin tracking your CGPA</p>
              <Button
                onClick={() => setShowAddSemester(true)}
                className="bg-gradient-to-r from-cyan-600 to-teal-600 hover:from-cyan-700 hover:to-teal-700 text-white"
              >
                Add Your First Semester
              </Button>
            </Card>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {cgpa.semesters.map(semester => (
                <SemesterCard
                  key={semester.id}
                  semester={semester}
                  gpa={cgpa.semesterGPAs[semester.id] || 0}
                  isExpanded={expandedSemesterId === semester.id}
                  onToggleExpand={() =>
                    setExpandedSemesterId(expandedSemesterId === semester.id ? null : semester.id)
                  }
                  onRemove={() => cgpa.removeSemester(semester.id)}
                  onAddCourse={(course) => cgpa.addCourse(semester.id, course)}
                  onUpdateCourse={(courseId: string, updates: any) =>
                    cgpa.updateCourse(semester.id, courseId, updates)
                  }
                  onRemoveCourse={(courseId: string) => cgpa.removeCourse(semester.id, courseId)}
                />
              ))}
            </div>
          )}
        </div>

        {/* Action Buttons */}
        {cgpa.semesters.length > 0 && (
          <div className="flex justify-center gap-4 mb-8">
            <Button
              onClick={handleClearAll}
              variant="outline"
              className="text-red-600 border-red-200 hover:bg-red-50"
            >
              <Trash2 className="w-4 h-4 mr-2" />
              Clear All Data
            </Button>
          </div>
        )}
      </div>

      {/* Add Semester Dialog */}
      <AddSemesterDialog
        open={showAddSemester}
        onOpenChange={setShowAddSemester}
        onAdd={(name: string) => {
          cgpa.addSemester(name);
          setShowAddSemester(false);
        }}
      />
    </div>
  );
}
