import GradePredictor from "@/pages/GradePredictor";
import CarryoverSimulator from "@/pages/CarryoverSimulator";
import UniversityComparison from "@/pages/UniversityComparison";
import StudyLoadOptimizer from "@/pages/StudyLoadOptimizer";
import GradeConverter from "@/pages/GradeConverter";

export default function Tools() {
  return (
    <div className="space-y-8 pb-20 md:pb-8">
      <GradePredictor />
      <CarryoverSimulator />
      <UniversityComparison />
      <StudyLoadOptimizer />
      <GradeConverter />
    </div>
  );
}
