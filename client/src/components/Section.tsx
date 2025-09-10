import { ReactNode } from "react";
import { cn } from "@/lib/utils";

interface SectionProps {
  children: ReactNode;
  className?: string;
  containerClassName?: string;
}

export function Section({ children, className = "", containerClassName = "" }: SectionProps) {
  return (
    <section className={cn("py-20 md:py-28", className)}>
      <div className={cn("max-w-7xl mx-auto px-6 md:px-10", containerClassName)}>
        {children}
      </div>
    </section>
  );
}
