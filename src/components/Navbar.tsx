import { Link } from "wouter";

export default function Navbar() {
  return (
    <header className="border-b bg-white/90 backdrop-blur">
      <nav className="container mx-auto flex flex-wrap items-center gap-4 px-4 py-3 text-sm">
        <Link href="/">
          <span className="font-semibold text-slate-900">SyncGrade</span>
        </Link>
        <Link href="/grade-converter">
          <span className="text-slate-700 hover:text-slate-900">Grade Converter</span>
        </Link>
      </nav>
    </header>
  );
}
