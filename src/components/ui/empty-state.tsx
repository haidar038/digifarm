import { ReactNode } from "react";
import { LucideIcon, FileText, MessageSquare, Users, ShoppingBag, Search, Inbox } from "lucide-react";
import { Button } from "./button";
import { cn } from "@/lib/utils";

interface EmptyStateProps {
    icon?: LucideIcon;
    title: string;
    description?: string;
    action?: {
        label: string;
        onClick: () => void;
    };
    className?: string;
    children?: ReactNode;
}

/**
 * Reusable empty state component with consistent styling
 */
export function EmptyState({ icon: Icon = Inbox, title, description, action, className, children }: EmptyStateProps) {
    return (
        <div className={cn("flex flex-col items-center justify-center py-12 px-4 text-center", className)}>
            <div className="relative mb-6">
                <div className="w-20 h-20 rounded-2xl bg-muted/50 flex items-center justify-center">
                    <Icon className="w-10 h-10 text-muted-foreground/50" />
                </div>
                <div className="absolute -bottom-1 -right-1 w-8 h-8 rounded-full bg-muted flex items-center justify-center">
                    <Search className="w-4 h-4 text-muted-foreground/50" />
                </div>
            </div>
            <h3 className="font-semibold text-lg mb-2">{title}</h3>
            {description && <p className="text-muted-foreground text-sm max-w-sm mb-4">{description}</p>}
            {action && (
                <Button onClick={action.onClick} variant="outline">
                    {action.label}
                </Button>
            )}
            {children}
        </div>
    );
}

/**
 * Preset empty states for common scenarios
 */
export const EmptyStatePresets = {
    NoArticles: (props?: Partial<EmptyStateProps>) => <EmptyState icon={FileText} title="Tidak Ada Artikel" description="Belum ada artikel yang dipublikasi" {...props} />,

    NoThreads: (props?: Partial<EmptyStateProps>) => <EmptyState icon={MessageSquare} title="Tidak Ada Diskusi" description="Jadilah yang pertama memulai diskusi!" {...props} />,

    NoUsers: (props?: Partial<EmptyStateProps>) => <EmptyState icon={Users} title="Tidak Ada Pengguna" description="Tidak ada pengguna yang ditemukan" {...props} />,

    NoProducts: (props?: Partial<EmptyStateProps>) => <EmptyState icon={ShoppingBag} title="Tidak Ada Produk" description="Tidak ada produk yang tersedia" {...props} />,

    SearchNoResults: (message?: string) => <EmptyState icon={Search} title="Tidak Ada Hasil" description={message || "Tidak ada hasil yang cocok dengan pencarian Anda. Coba kata kunci lain."} />,
};
