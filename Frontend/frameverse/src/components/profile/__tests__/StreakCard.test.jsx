import React from "react";
import { render, screen } from "@testing-library/react";
import { describe, it, expect } from "vitest";
import StreakCard from "../StreakCard";

describe("StreakCard", () => {
    it("renders a 0 day idle streak gracefully with right message", () => {
        render(<StreakCard streakCount={0} longestStreak={10} />);

        // Number
        expect(screen.getByText("0")).toBeInTheDocument();

        // Message
        expect(screen.getByText("Start your coding journey today.")).toBeInTheDocument();

        // Longest streak
        expect(screen.getByText("10 days")).toBeInTheDocument();
    });

    it("renders active streak styling with proper motivation text", () => {
        const { container } = render(<StreakCard streakCount={5} longestStreak={5} />);

        expect(screen.getByText("5")).toBeInTheDocument();
        expect(screen.getByText("You're building a strong habit.")).toBeInTheDocument();

        // Should have active glow styling
        const glowElement = container.querySelector(".bg-orange-500\\/10");
        expect(glowElement).toBeInTheDocument();
    });

    it("renders high streak message for streaks >= 14", () => {
        render(<StreakCard streakCount={20} longestStreak={40} />);
        expect(screen.getByText("20")).toBeInTheDocument();
        expect(screen.getByText("Unstoppable streak. Keep pushing.")).toBeInTheDocument();
    });
});
