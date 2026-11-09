import type { ReactNode } from "react";

import { Header } from "@/components/layout/header";
import { Footer } from "@/components/layout/footer";
import { poppins } from "@/lib/fonts";
import { cn } from "@/lib/utils";

/** Header + padded main + footer for the inner pages. */
export default function PageShell({ children }: { children: ReactNode }) {
  return (
    <>
      <Header />
      <main
        className={cn(
          poppins.className,
          "min-h-svh bg-trasparent pt-28 text-white md:pt-32",
        )}
      >
        {children}
      </main>
      <Footer />
    </>
  );
}