import { Component, ErrorInfo, ReactNode } from "react";
import { ErrorFallback } from "@/components/error/ErrorFallback";
import { AppError, ErrorCode } from "@/lib/error-utils";

interface Props {
    children: ReactNode;
    fallback?: ReactNode;
    onError?: (error: Error, errorInfo: ErrorInfo) => void;
    onReset?: () => void;
}

interface State {
    hasError: boolean;
    error: Error | null;
}

/**
 * Error Boundary component that catches JavaScript errors in child components
 * and displays a fallback UI instead of crashing the whole app.
 */
export class ErrorBoundary extends Component<Props, State> {
    constructor(props: Props) {
        super(props);
        this.state = { hasError: false, error: null };
    }

    static getDerivedStateFromError(error: Error): State {
        return { hasError: true, error };
    }

    componentDidCatch(error: Error, errorInfo: ErrorInfo): void {
        // Log error
        console.error("[ErrorBoundary] Caught error:", error);
        console.error("[ErrorBoundary] Component stack:", errorInfo.componentStack);

        // Create AppError for consistent handling
        const appError = new AppError(error.message || "An unexpected error occurred in the application", ErrorCode.RENDER_ERROR, {
            context: {
                componentStack: errorInfo.componentStack,
            },
            originalError: error,
        });

        console.error("[ErrorBoundary] AppError:", appError.toJSON());

        // Call optional error handler
        this.props.onError?.(error, errorInfo);
    }

    handleReset = (): void => {
        this.setState({ hasError: false, error: null });
        this.props.onReset?.();
    };

    render(): ReactNode {
        if (this.state.hasError) {
            // Use custom fallback if provided
            if (this.props.fallback) {
                return this.props.fallback;
            }

            // Use default ErrorFallback
            return <ErrorFallback error={this.state.error} onReset={this.handleReset} />;
        }

        return this.props.children;
    }
}
