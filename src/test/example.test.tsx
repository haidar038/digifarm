import { describe, it, expect } from "vitest";
import { render, screen } from "@testing-library/react";

// Example test to verify testing setup works
describe("Testing Setup", () => {
    it("should verify vitest is working", () => {
        expect(1 + 1).toBe(2);
    });

    it("should verify jest-dom matchers work", () => {
        render(<div data-testid="test-element">Hello World</div>);
        expect(screen.getByTestId("test-element")).toBeInTheDocument();
        expect(screen.getByTestId("test-element")).toHaveTextContent("Hello World");
    });
});
