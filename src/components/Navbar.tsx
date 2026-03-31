import { Link } from "wouter";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

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
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <button type="button" className="text-slate-700 hover:text-slate-900">
              University Tools
            </button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="start">
            <DropdownMenuItem asChild>
              <Link href="/calculate/gp-in-unilag">
                <span>UNILAG GP Calculator</span>
              </Link>
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </nav>
    </header>
  );
}
