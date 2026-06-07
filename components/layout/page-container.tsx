import { cn } from "@/lib/utils";
import { pageColumnClass, pageGutterClass } from "@/lib/ui/classes";

interface PageColumnProps {
  children: React.ReactNode;
  className?: string;
  /** Apply 18px horizontal gutters (default true). */
  gutter?: boolean;
}

/** Standard content column: max 960px, optional 18px side padding. */
export function PageColumn({ children, className, gutter = true }: PageColumnProps) {
  return <div className={cn(pageColumnClass, gutter && pageGutterClass, className)}>{children}</div>;
}

interface PageContainerProps {
  children: React.ReactNode;
  className?: string;
}

/** @deprecated Prefer PageColumn */
export function PageContainer({ children, className }: PageContainerProps) {
  return <PageColumn className={cn("flex-1 py-4 pb-20", className)}>{children}</PageColumn>;
}
