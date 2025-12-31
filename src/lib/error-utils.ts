/**
 * Centralized error handling utilities for DigiFarm
 */

import { toast } from "@/hooks/use-toast";

/**
 * Error codes for consistent error identification
 */
export const ErrorCode = {
    // Network errors
    NETWORK_ERROR: "NETWORK_ERROR",
    TIMEOUT: "TIMEOUT",

    // API errors
    API_ERROR: "API_ERROR",
    NOT_FOUND: "NOT_FOUND",
    UNAUTHORIZED: "UNAUTHORIZED",
    FORBIDDEN: "FORBIDDEN",
    VALIDATION_ERROR: "VALIDATION_ERROR",

    // Database errors
    DATABASE_ERROR: "DATABASE_ERROR",
    DUPLICATE_ENTRY: "DUPLICATE_ENTRY",
    FOREIGN_KEY_VIOLATION: "FOREIGN_KEY_VIOLATION",

    // Client errors
    UNKNOWN_ERROR: "UNKNOWN_ERROR",
    RENDER_ERROR: "RENDER_ERROR",
} as const;

export type ErrorCodeType = (typeof ErrorCode)[keyof typeof ErrorCode];

/**
 * Custom Application Error class with additional context
 */
export class AppError extends Error {
    public readonly code: ErrorCodeType;
    public readonly context?: Record<string, unknown>;
    public readonly originalError?: Error;
    public readonly timestamp: Date;

    constructor(
        message: string,
        code: ErrorCodeType = ErrorCode.UNKNOWN_ERROR,
        options?: {
            context?: Record<string, unknown>;
            originalError?: Error;
        }
    ) {
        super(message);
        this.name = "AppError";
        this.code = code;
        this.context = options?.context;
        this.originalError = options?.originalError;
        this.timestamp = new Date();

        // Maintains proper stack trace for where our error was thrown (V8 engines)
        const ErrorWithCaptureStackTrace = Error as typeof Error & {
            captureStackTrace?: (target: object, constructor?: new (...args: unknown[]) => unknown) => void;
        };
        if (typeof ErrorWithCaptureStackTrace.captureStackTrace === "function") {
            ErrorWithCaptureStackTrace.captureStackTrace(this, AppError);
        }
    }

    /**
     * Get user-friendly error message
     */
    getUserMessage(): string {
        return this.message;
    }

    /**
     * Serialize error for logging
     */
    toJSON(): Record<string, unknown> {
        return {
            name: this.name,
            message: this.message,
            code: this.code,
            context: this.context,
            timestamp: this.timestamp.toISOString(),
            stack: this.stack,
        };
    }
}

/**
 * Extract user-friendly error message from various error types
 * Handles Supabase errors, network errors, and general errors
 */
export function getErrorMessage(error: unknown): string {
    // Handle null/undefined
    if (!error) {
        return "An unknown error occurred";
    }

    // Handle string errors
    if (typeof error === "string") {
        return error;
    }

    // Handle AppError
    if (error instanceof AppError) {
        return error.getUserMessage();
    }

    // Handle standard Error objects
    if (error instanceof Error) {
        // Supabase PostgrestError
        if ("code" in error && "details" in error) {
            const pgError = error as { code: string; message: string; details?: string };

            // Handle common Supabase/Postgres error codes
            switch (pgError.code) {
                case "23505":
                    return "This record already exists. Please use a unique value.";
                case "23503":
                    return "Cannot complete this action due to related records.";
                case "42501":
                    return "You don't have permission to perform this action.";
                case "PGRST116":
                    return "Record not found.";
                default:
                    return pgError.message || "A database error occurred";
            }
        }

        // Network errors
        if (error.name === "TypeError" && error.message.includes("fetch")) {
            return "Unable to connect to the server. Please check your internet connection.";
        }

        // Timeout errors
        if (error.name === "AbortError") {
            return "The request timed out. Please try again.";
        }

        return error.message || "An error occurred";
    }

    // Handle objects with message property
    if (typeof error === "object" && error !== null && "message" in error) {
        return String((error as { message: unknown }).message);
    }

    return "An unexpected error occurred";
}

/**
 * Get error code from various error types
 */
export function getErrorCode(error: unknown): ErrorCodeType {
    if (error instanceof AppError) {
        return error.code;
    }

    if (error instanceof Error) {
        // Check for network errors
        if (error.name === "TypeError" && error.message.includes("fetch")) {
            return ErrorCode.NETWORK_ERROR;
        }

        if (error.name === "AbortError") {
            return ErrorCode.TIMEOUT;
        }

        // Check for Supabase/Postgres errors
        if ("code" in error) {
            const code = (error as { code: string }).code;
            switch (code) {
                case "23505":
                    return ErrorCode.DUPLICATE_ENTRY;
                case "23503":
                    return ErrorCode.FOREIGN_KEY_VIOLATION;
                case "42501":
                    return ErrorCode.FORBIDDEN;
                case "PGRST116":
                    return ErrorCode.NOT_FOUND;
                default:
                    return ErrorCode.DATABASE_ERROR;
            }
        }
    }

    return ErrorCode.UNKNOWN_ERROR;
}

/**
 * Centralized error handler that logs and optionally shows toast
 */
export function handleError(
    error: unknown,
    options?: {
        title?: string;
        showToast?: boolean;
        logToConsole?: boolean;
        context?: Record<string, unknown>;
    }
): AppError {
    const { title = "Error", showToast = true, logToConsole = true, context } = options ?? {};

    const message = getErrorMessage(error);
    const code = getErrorCode(error);

    // Create AppError for consistent handling
    const appError = new AppError(message, code, {
        context,
        originalError: error instanceof Error ? error : undefined,
    });

    // Log to console in development
    if (logToConsole) {
        console.error("[AppError]", appError.toJSON());
        if (appError.originalError?.stack) {
            console.error("[Original Stack]", appError.originalError.stack);
        }
    }

    // Show toast notification
    if (showToast) {
        toast({
            title,
            description: message,
            variant: "destructive",
        });
    }

    return appError;
}

/**
 * Handle API/Supabase errors specifically
 * Convenience wrapper for handleError with API-specific defaults
 */
export function handleApiError(error: unknown, operation?: string): AppError {
    const title = operation ? `Error: ${operation}` : "API Error";
    return handleError(error, {
        title,
        showToast: true,
        logToConsole: true,
        context: { operation },
    });
}

/**
 * Check if error is a network-related error
 */
export function isNetworkError(error: unknown): boolean {
    const code = getErrorCode(error);
    return code === ErrorCode.NETWORK_ERROR || code === ErrorCode.TIMEOUT;
}

/**
 * Check if error is retryable
 */
export function isRetryableError(error: unknown): boolean {
    const code = getErrorCode(error);
    const retryableCodes: ErrorCodeType[] = [ErrorCode.NETWORK_ERROR, ErrorCode.TIMEOUT, ErrorCode.API_ERROR];
    return retryableCodes.includes(code);
}
