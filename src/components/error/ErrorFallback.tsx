import { AlertTriangle, RefreshCw, Home } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";

interface ErrorFallbackProps {
    error?: Error | null;
    onReset?: () => void;
    showHomeButton?: boolean;
    title?: string;
    description?: string;
}

/**
 * Fallback UI component displayed when an error is caught by ErrorBoundary
 * Provides user-friendly error message and recovery options
 */
export function ErrorFallback({ error, onReset, showHomeButton = true, title = "Something went wrong", description }: ErrorFallbackProps) {
    const errorMessage = description || error?.message || "An unexpected error occurred. Please try again.";

    const handleGoHome = () => {
        window.location.href = "/";
    };

    return (
        <div className="min-h-[400px] flex items-center justify-center p-4">
            <Card className="w-full max-w-md">
                <CardHeader className="text-center pb-2">
                    <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-destructive/10 flex items-center justify-center">
                        <AlertTriangle className="w-8 h-8 text-destructive" />
                    </div>
                    <CardTitle className="text-xl">{title}</CardTitle>
                </CardHeader>
                <CardContent className="text-center">
                    <p className="text-muted-foreground">{errorMessage}</p>
                    {import.meta.env.DEV && error?.stack && (
                        <details className="mt-4 text-left">
                            <summary className="text-sm text-muted-foreground cursor-pointer hover:text-foreground">Technical details</summary>
                            <pre className="mt-2 p-3 bg-muted rounded-md text-xs overflow-auto max-h-32">{error.stack}</pre>
                        </details>
                    )}
                </CardContent>
                <CardFooter className="flex justify-center gap-3">
                    {onReset && (
                        <Button onClick={onReset} variant="default">
                            <RefreshCw className="w-4 h-4 mr-2" />
                            Try Again
                        </Button>
                    )}
                    {showHomeButton && (
                        <Button onClick={handleGoHome} variant="outline">
                            <Home className="w-4 h-4 mr-2" />
                            Go Home
                        </Button>
                    )}
                </CardFooter>
            </Card>
        </div>
    );
}

/**
 * Inline error display for smaller error states within a page
 */
export function InlineError({ message, onRetry }: { message: string; onRetry?: () => void }) {
    return (
        <div className="flex flex-col items-center justify-center py-8 text-center">
            <AlertTriangle className="w-8 h-8 text-destructive mb-3" />
            <p className="text-sm text-muted-foreground mb-3">{message}</p>
            {onRetry && (
                <Button onClick={onRetry} variant="outline" size="sm">
                    <RefreshCw className="w-3 h-3 mr-2" />
                    Retry
                </Button>
            )}
        </div>
    );
}
