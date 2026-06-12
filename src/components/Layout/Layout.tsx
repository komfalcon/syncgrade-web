import { memo, type ReactNode } from "react";
import { motion } from "framer-motion";

import { Navbar } from "@/components/Navbar";
import { BottomNav } from "@/components/BottomNav";
import { AppFooter } from "@/components/AppFooter";

import type { LayoutProps } from "./Layout.types";

const TOP_CONTENT_ANIMATION = {
  initial: { opacity: 0, y: -20 },
  animate: { opacity: 1, y: 0 },
  transition: { type: "spring", stiffness: 200, damping: 24 } as const,
} satisfies React.ComponentProps<typeof motion.div>;

function Layout({ children, topContent, hideNavbar = false, hideFooter = false }: LayoutProps) {
  return (
    <div className="relative flex min-h-screen flex-col bg-background">
      {!hideNavbar && <Navbar />}

      {topContent != null && (
        <motion.div
          {...TOP_CONTENT_ANIMATION}
          className="mx-auto w-full max-w-7xl px-4 pt-4 md:px-6"
        >
          {topContent}
        </motion.div>
      )}

      <div className="flex-1 pb-20 md:pb-0">
        <main className="mx-auto w-full max-w-7xl px-4 py-6 md:px-6">
          {children}
        </main>
        {!hideFooter && <AppFooter />}
      </div>

      <BottomNav />
    </div>
  );
}

export default memo(Layout);
