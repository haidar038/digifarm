import { describe, it, expect, vi, beforeEach } from "vitest";
import { AppError, ErrorCode, getErrorMessage, getErrorCode, handleError, handleApiError, isNetworkError, isRetryableError } from "@/lib/error-utils";

// Mock toast
vi.mock("@/hooks/use-toast", () => ({
    toast: vi.fn(),
}));

describe("AppError", () => {
    it("should create error with default code", () => {
        const error = new AppError("Test error");

        expect(error.message).toBe("Test error");
        expect(error.code).toBe(ErrorCode.UNKNOWN_ERROR);
        expect(error.name).toBe("AppError");
        expect(error.timestamp).toBeInstanceOf(Date);
    });

    it("should create error with custom code", () => {
        const error = new AppError("Network failed", ErrorCode.NETWORK_ERROR);

        expect(error.code).toBe(ErrorCode.NETWORK_ERROR);
    });

    it("should create error with context", () => {
        const error = new AppError("Test", ErrorCode.API_ERROR, {
            context: { userId: "123" },
        });

        expect(error.context).toEqual({ userId: "123" });
    });

    it("should create error with originalError", () => {
        const originalError = new Error("Original");
        const error = new AppError("Wrapped", ErrorCode.UNKNOWN_ERROR, {
            originalError,
        });

        expect(error.originalError).toBe(originalError);
    });

    it("should return user message", () => {
        const error = new AppError("User friendly message");
        expect(error.getUserMessage()).toBe("User friendly message");
    });

    it("should serialize to JSON", () => {
        const error = new AppError("Test", ErrorCode.API_ERROR);
        const json = error.toJSON();

        expect(json).toHaveProperty("name", "AppError");
        expect(json).toHaveProperty("message", "Test");
        expect(json).toHaveProperty("code", ErrorCode.API_ERROR);
        expect(json).toHaveProperty("timestamp");
    });
});

describe("getErrorMessage", () => {
    it("should handle null/undefined", () => {
        expect(getErrorMessage(null)).toBe("An unknown error occurred");
        expect(getErrorMessage(undefined)).toBe("An unknown error occurred");
    });

    it("should handle string errors", () => {
        expect(getErrorMessage("Something went wrong")).toBe("Something went wrong");
    });

    it("should handle AppError", () => {
        const error = new AppError("App error message");
        expect(getErrorMessage(error)).toBe("App error message");
    });

    it("should handle standard Error", () => {
        const error = new Error("Standard error");
        expect(getErrorMessage(error)).toBe("Standard error");
    });

    it("should handle Supabase duplicate entry error", () => {
        const error = Object.assign(new Error("duplicate"), {
            code: "23505",
            details: "Key already exists",
        });
        expect(getErrorMessage(error)).toBe("This record already exists. Please use a unique value.");
    });

    it("should handle Supabase foreign key error", () => {
        const error = Object.assign(new Error("foreign key"), {
            code: "23503",
            details: "violates foreign key",
        });
        expect(getErrorMessage(error)).toBe("Cannot complete this action due to related records.");
    });

    it("should handle permission error", () => {
        const error = Object.assign(new Error("permission"), {
            code: "42501",
            details: "denied",
        });
        expect(getErrorMessage(error)).toBe("You don't have permission to perform this action.");
    });

    it("should handle not found error", () => {
        const error = Object.assign(new Error("not found"), {
            code: "PGRST116",
            details: "not found",
        });
        expect(getErrorMessage(error)).toBe("Record not found.");
    });

    it("should handle objects with message property", () => {
        expect(getErrorMessage({ message: "Object message" })).toBe("Object message");
    });
});

describe("getErrorCode", () => {
    it("should return code from AppError", () => {
        const error = new AppError("Test", ErrorCode.FORBIDDEN);
        expect(getErrorCode(error)).toBe(ErrorCode.FORBIDDEN);
    });

    it("should detect network errors", () => {
        const error = new TypeError("Failed to fetch");
        expect(getErrorCode(error)).toBe(ErrorCode.NETWORK_ERROR);
    });

    it("should detect timeout errors", () => {
        // Create error with name property set to AbortError
        const error = new Error("Aborted");
        error.name = "AbortError";
        expect(getErrorCode(error)).toBe(ErrorCode.TIMEOUT);
    });

    it("should detect duplicate entry from Supabase", () => {
        const error = Object.assign(new Error("dup"), { code: "23505" });
        expect(getErrorCode(error)).toBe(ErrorCode.DUPLICATE_ENTRY);
    });

    it("should return UNKNOWN_ERROR for unknown errors", () => {
        expect(getErrorCode("string error")).toBe(ErrorCode.UNKNOWN_ERROR);
        expect(getErrorCode({})).toBe(ErrorCode.UNKNOWN_ERROR);
    });
});

describe("handleError", () => {
    beforeEach(() => {
        vi.clearAllMocks();
    });

    it("should return AppError", () => {
        const result = handleError(new Error("Test"), { showToast: false });
        expect(result).toBeInstanceOf(AppError);
    });

    it("should log to console by default", () => {
        const consoleSpy = vi.spyOn(console, "error").mockImplementation(() => {});
        handleError(new Error("Test"), { showToast: false });
        expect(consoleSpy).toHaveBeenCalled();
        consoleSpy.mockRestore();
    });

    it("should not log when disabled", () => {
        const consoleSpy = vi.spyOn(console, "error").mockImplementation(() => {});
        handleError(new Error("Test"), { showToast: false, logToConsole: false });
        expect(consoleSpy).not.toHaveBeenCalled();
        consoleSpy.mockRestore();
    });
});

describe("handleApiError", () => {
    beforeEach(() => {
        vi.clearAllMocks();
    });

    it("should return AppError with operation in context", () => {
        const result = handleApiError(new Error("Test"), "fetching data");
        expect(result).toBeInstanceOf(AppError);
        expect(result.context?.operation).toBe("fetching data");
    });
});

describe("isNetworkError", () => {
    it("should return true for network errors", () => {
        expect(isNetworkError(new AppError("Net", ErrorCode.NETWORK_ERROR))).toBe(true);
        expect(isNetworkError(new AppError("Timeout", ErrorCode.TIMEOUT))).toBe(true);
    });

    it("should return false for other errors", () => {
        expect(isNetworkError(new AppError("API", ErrorCode.API_ERROR))).toBe(false);
        expect(isNetworkError(new Error("Random"))).toBe(false);
    });
});

describe("isRetryableError", () => {
    it("should return true for retryable errors", () => {
        expect(isRetryableError(new AppError("Net", ErrorCode.NETWORK_ERROR))).toBe(true);
        expect(isRetryableError(new AppError("Timeout", ErrorCode.TIMEOUT))).toBe(true);
        expect(isRetryableError(new AppError("API", ErrorCode.API_ERROR))).toBe(true);
    });

    it("should return false for non-retryable errors", () => {
        expect(isRetryableError(new AppError("Not found", ErrorCode.NOT_FOUND))).toBe(false);
        expect(isRetryableError(new AppError("Forbidden", ErrorCode.FORBIDDEN))).toBe(false);
    });
});
