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
      {topContent ? <div className="container mx-auto px-4 pt-4">{topContent}</div> : null}
      <main className="container mx-auto flex-1 px-4 py-6 pb-28 md:pb-12">{children}</main>
      <BottomNav />
      <AppFooter />
    </div>
  );
}
