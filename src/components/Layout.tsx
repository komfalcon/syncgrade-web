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
    <div className="min-h-screen bg-background">
      <Navbar />
      {topContent ? <div className="container mx-auto px-4 pt-4">{topContent}</div> : null}
      <main className="container mx-auto px-4 py-6 pb-24 md:pb-8">{children}</main>
      <BottomNav />
      <AppFooter />
    </div>
  );
}

