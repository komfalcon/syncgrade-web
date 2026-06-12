import type { ReactNode } from "react";
import { motion } from "framer-motion";
import AppFooter from "@/components/AppFooter";
import BottomNav from "@/components/BottomNav";
import Navbar from "@/components/Navbar";

interface LayoutProps {
  children: ReactNode;
  topContent?: ReactNode;
}

export default function Layout({ children, topContent }: LayoutProps) {
  return (
    <div className="relative flex min-h-screen flex-col bg-background">
      <Navbar />
      
      {topContent && (
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ type: "spring", stiffness: 200, damping: 24 }}
          className="mx-auto w-full max-w-7xl px-4 pt-4 md:px-6"
        >
          {topContent}
        </motion.div>
      )}
      
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
