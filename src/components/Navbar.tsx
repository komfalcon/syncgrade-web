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
        <details className="relative">
          <summary className="cursor-pointer text-slate-700 hover:text-slate-900">University Tools</summary>
          <div className="absolute left-0 top-full z-10 mt-2 min-w-52 rounded-md border bg-white p-2 shadow">
            <Link href="/calculate/gp-in-unilag">
              <span className="block rounded px-2 py-1 text-slate-700 hover:bg-slate-100 hover:text-slate-900">
                UNILAG GP Calculator
              </span>
            </Link>
          </div>
        </details>
      </nav>
    </header>
  );
}
