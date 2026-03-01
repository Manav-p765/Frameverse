import React from "react";
import { render, screen, waitFor } from "@testing-library/react";
import { describe, it, expect, vi, beforeEach } from "vitest";
import TodayPreview from "../TodayPreview";
import { useAutoPost } from "../../../features/autoPost/useAutoPost";
import dayjs from "dayjs";
import relativeTime from "dayjs/plugin/relativeTime";

dayjs.extend(relativeTime);

vi.mock("../../../features/autoPost/useAutoPost", () => ({
    useAutoPost: vi.fn(),
}));

describe("TodayPreview", () => {
    const mockGetTodayStats = vi.fn();

    beforeEach(() => {
        vi.clearAllMocks();
        useAutoPost.mockReturnValue({
            loading: false,
            error: null,
            getTodayStats: mockGetTodayStats.mockResolvedValue({ stats: null }),
        });
    });

    it("renders a loading skeleton initially", () => {
        // Make the promise unresolved to freeze the loading state
        mockGetTodayStats.mockReturnValueOnce(new Promise(() => { }));

        const { container } = render(<TodayPreview />);

        // Check for skeleton classes
        expect(container.querySelector(".animate-pulse")).toBeInTheDocument();
    });

    it("renders empty state when no activity recorded today", async () => {
        render(<TodayPreview />);

        await waitFor(() => {
            expect(screen.getByText("No activity yet today")).toBeInTheDocument();
        });

        expect(screen.getByText(/Your stats will appear here once you push code to GitHub or solve problems on LeetCode/)).toBeInTheDocument();
    });

    it("renders stats and caption when activity exists", async () => {
        mockGetTodayStats.mockResolvedValueOnce({
            stats: {
                githubCommits: 8,
                leetcodeSolved: 2,
                caption: "Awesome day!",
                imageUrl: "https://example.com/img.png",
                posted: true,
                updatedAt: new Date().toISOString()
            }
        });

        render(<TodayPreview />);

        await waitFor(() => {
            expect(screen.getByText("Awesome day!")).toBeInTheDocument();
        });

        expect(screen.getByText("8")).toBeInTheDocument(); // GitHub
        expect(screen.getByText("2")).toBeInTheDocument(); // Leetcode
        expect(screen.getByText("Posted to Feed")).toBeInTheDocument();
        expect(screen.getByText("View Image")).toHaveAttribute("href", "https://example.com/img.png");
    });

    it("renders partial stats without caption if not posted", async () => {
        mockGetTodayStats.mockResolvedValueOnce({
            stats: {
                githubCommits: 5,
                leetcodeSolved: 0,
                caption: null,
                imageUrl: null,
                posted: false,
                updatedAt: new Date().toISOString()
            }
        });

        render(<TodayPreview />);

        await waitFor(() => {
            expect(screen.getByText("5")).toBeInTheDocument();
        });

        expect(screen.queryByText("Posted to Feed")).not.toBeInTheDocument();
    });
});
