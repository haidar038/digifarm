import { Badge } from "@/components/ui/badge";
import { Award } from "lucide-react";

interface ExpertBadgeProps {
    className?: string;
    showIcon?: boolean;
}

export function ExpertBadge({ className = "", showIcon = true }: ExpertBadgeProps) {
    return (
        <Badge variant="secondary" className={`bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-300 ${className}`}>
            {showIcon && <Award className="w-3 h-3 mr-1" />}
            Expert
        </Badge>
    );
}
