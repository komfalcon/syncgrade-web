import { useEffect, useMemo } from "react";
import { useLocation } from "wouter";
import universityDb from "@/data/university_db.json";

type UniversityRow = {
  id: string;
  name: string;
  acronym: string;
  templateId?: string;
  configurations?: Array<{ templateId: string }>;
};

function getScale(uni: UniversityRow): "4.0" | "5.0" {
  const template = uni.templateId ?? uni.configurations?.[0]?.templateId ?? "nuc_standard_5";
  return template.includes("_4") ? "4.0" : "5.0";
}

export default function UniversityGpLanding() {
  const [location] = useLocation();
  const slug = location
    .replace(/^\/calculate\/gp-in-/, "")
    .replace(/\/$/, "")
    .trim()
    .toLowerCase();

  const uni = useMemo(() => {
    const rows = universityDb.universities as UniversityRow[];
    return rows.find((row) => row.id.toLowerCase() === slug);
  }, [slug]);

  if (!uni) {
    return (
      <div className="container mx-auto px-4 py-10">
        <h1 className="text-2xl font-bold">University page not found</h1>
      </div>
    );
  }

  const scale = getScale(uni);
  const title = `How to calculate GP in ${uni.name} using the ${scale} system`;

  useEffect(() => {
    document.title = `${uni.name} Grading System | SyncGrade`;
    const previousDescription = document
      .querySelector('meta[name="description"]')
      ?.getAttribute("content");
    let descriptionTag = document.querySelector('meta[name="description"]');
    if (!descriptionTag) {
      descriptionTag = document.createElement("meta");
      descriptionTag.setAttribute("name", "description");
      document.head.appendChild(descriptionTag);
    }
    descriptionTag.setAttribute(
      "content",
      `How to calculate GP in ${uni.name} using the ${scale} grading system. Learn ${uni.name} grading rules and CGPA tips with SyncGrade.`,
    );
    return () => {
      if (previousDescription) {
        descriptionTag?.setAttribute("content", previousDescription);
      }
    };
  }, [scale, uni.name]);

  return (
    <article className="container mx-auto max-w-3xl space-y-6 px-4 py-10">
      <h1 className="text-3xl font-extrabold">{title}</h1>
      <h2 className="text-xl font-semibold">{uni.name} Grading System</h2>
      <p className="text-slate-700">
        SyncGrade helps you calculate GP in {uni.name} with the {scale} grading scale used in your
        coursework. Add your courses, units, and grade points to get instant semester GPA and CGPA.
      </p>
      <h2 className="text-xl font-semibold">Step-by-step GP calculation for {uni.acronym}</h2>
      <p className="text-slate-700">
        Multiply each course unit by its grade point, sum all quality points, then divide by the
        total registered units. SyncGrade automates this process and reduces manual errors.
      </p>
      <p className="text-slate-700">
        Looking for "{uni.name} grading system", "{uni.acronym} GP calculator", or "{uni.name}
        CGPA scale"? This page is built to provide direct answers and practical calculation guidance.
      </p>
    </article>
  );
}
