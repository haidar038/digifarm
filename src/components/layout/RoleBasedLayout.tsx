import { useRole } from "@/hooks/useRole";
import { useAuth } from "@/contexts/auth-context";
import { DashboardLayout } from "./DashboardLayout";
import { ExpertLayout } from "./ExpertLayout";
import { PublicForumLayout } from "./PublicForumLayout";

interface RoleBasedLayoutProps {
    children: React.ReactNode;
    title: string;
    description?: string;
}

/**
 * A layout wrapper specifically for forum pages.
 * - Admin, Manager, Observer: Use public layout (they access forum as visitors)
 * - Expert, Farmer: Use their dashboard layouts (forum is part of their work)
 * - Unauthenticated: Use public layout
 */
export function RoleBasedLayout({ children, title, description }: RoleBasedLayoutProps) {
    const { user } = useAuth();
    const { isAdmin, isManager, isObserver, isExpert } = useRole();

    // If user is not authenticated, use public layout
    if (!user) {
        return <PublicForumLayout>{children}</PublicForumLayout>;
    }

    // Admin, Manager, Observer use public layout for forum (standalone)
    if (isAdmin || isManager || isObserver) {
        return <PublicForumLayout>{children}</PublicForumLayout>;
    }

    // Expert uses their layout
    if (isExpert) {
        return <ExpertLayout>{children}</ExpertLayout>;
    }

    // Default: Farmer layout
    return (
        <DashboardLayout title={title} description={description}>
            {children}
        </DashboardLayout>
    );
}
