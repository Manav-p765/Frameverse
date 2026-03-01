import React from "react";
import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import { describe, it, expect, vi, beforeEach } from "vitest";
import AutoPostSettings from "../AutoPostSettings";
import { useAutoPost } from "../../../features/autoPost/useAutoPost";

// Mock the useAutoPost hook
vi.mock("../../../features/autoPost/useAutoPost", () => ({
    useAutoPost: vi.fn(),
}));

describe("AutoPostSettings", () => {
    const mockGetSettings = vi.fn();
    const mockUpdateSettings = vi.fn();
    const mockRunNow = vi.fn();

    beforeEach(() => {
        vi.clearAllMocks();

        // Default mock implementation
        useAutoPost.mockReturnValue({
            loading: false,
            error: null,
            getSettings: mockGetSettings.mockResolvedValue({
                settings: {
                    enabled: true,
                    postTime: "09:00",
                    timezone: "Asia/Kolkata",
                    selectedApps: ["github"],
                },
                accounts: [{ platform: "github", username: "testgh" }],
            }),
            updateSettings: mockUpdateSettings.mockResolvedValue({}),
            runNow: mockRunNow.mockResolvedValue({}),
        });
    });

    it("renders loading state initially while fetching", () => {
        mockGetSettings.mockImplementationOnce(() => new Promise(() => { })); // Never resolves
        render(<AutoPostSettings />);
        // Look for a spinner
        expect(document.querySelector(".animate-spin")).toBeInTheDocument();
    });

    it("loads existing settings correctly and displays them", async () => {
        render(<AutoPostSettings />);

        // Wait for the data to load and remove the initial loader
        await waitFor(() => {
            expect(screen.queryByText("AutoPost Settings")).toBeInTheDocument();
        });

        // Check if the Master Toggle is enabled
        const toggles = screen.getAllByRole("checkbox");
        expect(toggles[0]).toBeChecked(); // Master toggle

        // Check time input
        expect(screen.getByDisplayValue("09:00")).toBeInTheDocument();
        expect(screen.getByDisplayValue("Asia/Kolkata")).toBeInTheDocument();

        // Check Github values
        expect(screen.getByPlaceholderText("eng-manav")).toHaveValue("testgh");

        // Check LeetCode is not selected
        expect(screen.getByPlaceholderText("manav_leetcode")).toHaveValue("");
        expect(screen.getByPlaceholderText("manav_leetcode")).toBeDisabled();
    });

    it("toggles application checkboxes and enables text inputs", async () => {
        render(<AutoPostSettings />);

        await waitFor(() => {
            expect(screen.getByText("LeetCode")).toBeInTheDocument();
        });

        const leetcodeInput = screen.getByPlaceholderText("manav_leetcode");
        expect(leetcodeInput).toBeDisabled();

        // Find the LeetCode checkbox (it's hidden via sr-only, but we can click the label or find by role)
        const checkboxes = screen.getAllByRole("checkbox");
        // [0] = Master, [1] = Github, [2] = LeetCode
        fireEvent.click(checkboxes[2]);

        expect(leetcodeInput).not.toBeDisabled();

        // Type a username
        fireEvent.change(leetcodeInput, { target: { value: "new_lc_user" } });
        expect(leetcodeInput).toHaveValue("new_lc_user");
    });

    it("calls updateSettings when Save is clicked", async () => {
        render(<AutoPostSettings />);

        await waitFor(() => {
            expect(screen.getByText("AutoPost Settings")).toBeInTheDocument();
        });

        const saveButton = screen.getByText("Save Settings");
        fireEvent.click(saveButton);

        await waitFor(() => {
            expect(mockUpdateSettings).toHaveBeenCalledWith({
                enabled: true,
                postTime: "09:00",
                timezone: "Asia/Kolkata",
                selectedApps: ["github"],
                githubUsername: "testgh",
                leetcodeUsername: "",
            });
        });
    });

    it("calls runNow when Generate Now is clicked and confirmed", async () => {
        // Mock window.confirm
        vi.spyOn(window, "confirm").mockReturnValue(true);

        render(<AutoPostSettings />);

        await waitFor(() => {
            expect(screen.getByText("Generate Now")).toBeInTheDocument();
        });

        const runButton = screen.getByText("Generate Now");
        fireEvent.click(runButton);

        await waitFor(() => {
            expect(mockRunNow).toHaveBeenCalled();
        });

        // Check if success UI appears
        expect(screen.getByText("Manual run completed! (Check feed if eligible)")).toBeInTheDocument();
    });
});
