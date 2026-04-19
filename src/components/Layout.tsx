import type { ReactNode } from "react";
import AppFooter from "@/components/AppFooter";
import BottomNav from "@/components/BottomNav";
import Navbar from "@/components/Navbar";

interface LayoutProps {
  children: ReactNode;
  topContent?: ReactNode;
}

export default function Layout({ children, topContent }: LayoutProps) {
  return (
    <div className="flex min-h-screen flex-col bg-background">
      <Navbar />
      
      {topContent && (
        <div className="mx-auto w-full max-w-7xl px-4 pt-4 md:px-6">
          {topContent}
        </div>
      )}
      
      {/* 1. Removed pb-40
          2. Added a container for main + footer that handles the bottom clearance
      */}
      <div className="flex-1 pb-20 md:pb-0"> 
        <main className="mx-auto w-full max-w-7xl px-4 py-6 md:px-6">
          {children}
        </main>
        <AppFooter />
      </div>

      <BottomNav />
    </div>
  );
}
