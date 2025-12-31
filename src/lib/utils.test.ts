import { describe, it, expect } from "vitest";
import { cn } from "@/lib/utils";

describe("cn (class name utility)", () => {
    describe("basic functionality", () => {
        it("should merge single class name", () => {
            expect(cn("text-red-500")).toBe("text-red-500");
        });

        it("should merge multiple class names", () => {
            expect(cn("text-red-500", "bg-blue-500")).toBe("text-red-500 bg-blue-500");
        });

        it("should handle empty inputs", () => {
            expect(cn()).toBe("");
            expect(cn("")).toBe("");
        });
    });

    describe("conditional classes", () => {
        it("should filter out falsy values", () => {
            const isHidden = false;
            expect(cn("text-red-500", isHidden && "hidden")).toBe("text-red-500");
            expect(cn("text-red-500", null, undefined)).toBe("text-red-500");
        });

        it("should include truthy conditional classes", () => {
            const isVisible = true;
            expect(cn("text-red-500", isVisible && "visible")).toBe("text-red-500 visible");
        });
    });

    describe("tailwind merge functionality", () => {
        it("should merge conflicting tailwind classes (last wins)", () => {
            // text-red-500 and text-blue-500 conflict, last one should win
            expect(cn("text-red-500", "text-blue-500")).toBe("text-blue-500");
        });

        it("should merge conflicting padding classes", () => {
            expect(cn("p-4", "p-8")).toBe("p-8");
            expect(cn("px-4", "px-8")).toBe("px-8");
        });

        it("should merge conflicting margin classes", () => {
            expect(cn("m-4", "m-8")).toBe("m-8");
            expect(cn("mt-4", "mt-8")).toBe("mt-8");
        });

        it("should not merge non-conflicting classes", () => {
            expect(cn("p-4", "m-4")).toBe("p-4 m-4");
            expect(cn("text-red-500", "bg-blue-500")).toBe("text-red-500 bg-blue-500");
        });

        it("should handle flex and grid classes", () => {
            expect(cn("flex", "flex-col")).toBe("flex flex-col");
            expect(cn("flex", "grid")).toBe("grid"); // flex and grid conflict
        });
    });

    describe("object syntax", () => {
        it("should handle clsx object syntax", () => {
            expect(cn({ "text-red-500": true, hidden: false })).toBe("text-red-500");
        });

        it("should handle mixed array and object syntax", () => {
            expect(cn("base-class", { active: true, disabled: false })).toBe("base-class active");
        });
    });

    describe("array syntax", () => {
        it("should handle array of classes", () => {
            expect(cn(["text-red-500", "bg-blue-500"])).toBe("text-red-500 bg-blue-500");
        });

        it("should handle nested arrays", () => {
            expect(cn(["text-red-500", ["bg-blue-500", "p-4"]])).toBe("text-red-500 bg-blue-500 p-4");
        });
    });

    describe("real-world use cases", () => {
        it("should handle button variant classes", () => {
            const baseClasses = "px-4 py-2 rounded font-medium";
            const variantClasses = "bg-primary text-white";
            const sizeClasses = "text-sm";

            expect(cn(baseClasses, variantClasses, sizeClasses)).toBe("px-4 py-2 rounded font-medium bg-primary text-white text-sm");
        });

        it("should handle responsive classes", () => {
            expect(cn("w-full", "md:w-1/2", "lg:w-1/3")).toBe("w-full md:w-1/2 lg:w-1/3");
        });

        it("should handle state classes", () => {
            expect(cn("bg-white", "hover:bg-gray-100", "focus:ring-2")).toBe("bg-white hover:bg-gray-100 focus:ring-2");
        });
    });
});
