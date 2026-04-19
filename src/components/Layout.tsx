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
    // Change pb-40 to pb-20 (5rem/80px) or pb-24 (6rem/96px)
    <div className="flex min-h-screen flex-col bg-background pb-20 md:pb-0">
      <Navbar />
      {topContent ? <div className="mx-auto w-full max-w-7xl px-4 pt-4 md:px-6">{topContent}</div> : null}
      
      <main className="mx-auto flex-1 w-full max-w-7xl bg-background px-4 py-6 md:px-6">
        {children}
      </main>
      
      <BottomNav />
      <AppFooter />
    </div>
  );
}