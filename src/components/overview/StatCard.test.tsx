import { describe, it, expect } from "vitest";
import { render, screen } from "@testing-library/react";
import { StatCard } from "@/components/overview/StatCard";
import { Leaf, TrendingUp, MapPin } from "lucide-react";

describe("StatCard", () => {
    describe("basic rendering", () => {
        it("should render title and value", () => {
            render(<StatCard title="Total Lands" value={10} icon={MapPin} />);

            expect(screen.getByText("Total Lands")).toBeInTheDocument();
            expect(screen.getByText("10")).toBeInTheDocument();
        });

        it("should render string value", () => {
            render(<StatCard title="Status" value="Active" icon={Leaf} />);

            expect(screen.getByText("Active")).toBeInTheDocument();
        });

        it("should render icon", () => {
            const { container } = render(<StatCard title="Crops" value={5} icon={Leaf} />);

            // Check that the icon container exists
            const iconContainer = container.querySelector(".w-12.h-12");
            expect(iconContainer).toBeInTheDocument();
        });
    });

    describe("subtitle rendering", () => {
        it("should render subtitle when provided", () => {
            render(<StatCard title="Total Harvest" value="500 kg" subtitle="This Month" subtitleValue="50 kg" icon={TrendingUp} />);

            expect(screen.getByText("This Month:")).toBeInTheDocument();
            expect(screen.getByText("50 kg")).toBeInTheDocument();
        });

        it("should not render subtitle when not provided", () => {
            render(<StatCard title="Total Harvest" value="500 kg" icon={TrendingUp} />);

            expect(screen.queryByText("This Month:")).not.toBeInTheDocument();
        });
    });

    describe("trend rendering", () => {
        it("should render upward trend with arrow", () => {
            render(<StatCard title="Production" value={100} icon={TrendingUp} trend="up" trendValue="+15%" />);

            expect(screen.getByText("↑")).toBeInTheDocument();
            expect(screen.getByText("+15%")).toBeInTheDocument();
        });

        it("should render downward trend with arrow", () => {
            render(<StatCard title="Production" value={100} icon={TrendingUp} trend="down" trendValue="-10%" />);

            expect(screen.getByText("↓")).toBeInTheDocument();
            expect(screen.getByText("-10%")).toBeInTheDocument();
        });

        it("should render neutral trend with arrow", () => {
            render(<StatCard title="Production" value={100} icon={TrendingUp} trend="neutral" trendValue="0%" />);

            expect(screen.getByText("→")).toBeInTheDocument();
            expect(screen.getByText("0%")).toBeInTheDocument();
        });

        it("should not render trend when not provided", () => {
            render(<StatCard title="Production" value={100} icon={TrendingUp} />);

            expect(screen.queryByText("↑")).not.toBeInTheDocument();
            expect(screen.queryByText("↓")).not.toBeInTheDocument();
            expect(screen.queryByText("→")).not.toBeInTheDocument();
        });

        it("should not render trend when only trend is provided without trendValue", () => {
            render(<StatCard title="Production" value={100} icon={TrendingUp} trend="up" />);

            // Should not render because both trend and trendValue are required
            expect(screen.queryByText("↑")).not.toBeInTheDocument();
        });
    });

    describe("styling", () => {
        it("should apply custom className", () => {
            const { container } = render(<StatCard title="Test" value={1} icon={Leaf} className="custom-class" />);

            const card = container.firstChild;
            expect(card).toHaveClass("custom-class");
        });
    });

    describe("value types", () => {
        it("should handle large numbers", () => {
            render(<StatCard title="Total Area" value={1000000} icon={MapPin} />);

            expect(screen.getByText("1000000")).toBeInTheDocument();
        });

        it("should handle decimal values as string", () => {
            render(<StatCard title="Average Yield" value="45.5 kg" icon={TrendingUp} />);

            expect(screen.getByText("45.5 kg")).toBeInTheDocument();
        });

        it("should handle zero value", () => {
            render(<StatCard title="Empty" value={0} icon={Leaf} />);

            expect(screen.getByText("0")).toBeInTheDocument();
        });
    });
});
