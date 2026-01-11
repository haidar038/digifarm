import { ReactNode } from "react";
import { cn } from "@/lib/utils";

interface PageTransitionProps {
    children: ReactNode;
    className?: string;
}

/**
 * Wrapper component for page transitions
 * Provides a subtle fade-in animation when pages mount
 */
export function PageTransition({ children, className }: PageTransitionProps) {
    return <div className={cn("animate-in fade-in slide-in-from-bottom-2 duration-300", className)}>{children}</div>;
}

/**
 * Wrapper for content sections that fade in
 */
export function FadeIn({ children, className, delay = 0 }: PageTransitionProps & { delay?: number }) {
    return (
        <div className={cn("animate-in fade-in duration-500", className)} style={{ animationDelay: `${delay}ms`, animationFillMode: "backwards" }}>
            {children}
        </div>
    );
}

/**
 * Staggered animation for list items
 */
export function StaggeredList({ children, className }: PageTransitionProps) {
    return <div className={cn("space-y-4", className)}>{children}</div>;
}

interface StaggeredItemProps {
    children: ReactNode;
    index: number;
    className?: string;
}

export function StaggeredItem({ children, index, className }: StaggeredItemProps) {
    return (
        <div className={cn("animate-in fade-in slide-in-from-bottom-2 duration-300", className)} style={{ animationDelay: `${index * 50}ms`, animationFillMode: "backwards" }}>
            {children}
        </div>
    );
}
