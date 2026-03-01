import { jest } from "@jest/globals";
import { getTodayCommits } from "../services/activity/github.service.js";
import { getTodayLeetCodeSolved } from "../services/activity/leetcode.service.js";

// Mock global fetch for both GitHub and LeetCode
global.fetch = jest.fn();

describe("Activity Services", () => {
    afterEach(() => {
        jest.clearAllMocks();
    });

    describe("getTodayCommits (GitHub)", () => {
        it("should return correct commit count for today", async () => {
            const mockData = [
                {
                    type: "PushEvent",
                    created_at: new Date().toISOString(),
                    payload: { commits: [{}, {}, {}] },
                },
                {
                    type: "PullRequestEvent",
                    created_at: new Date().toISOString(),
                },
            ];

            global.fetch.mockResolvedValueOnce({
                ok: true,
                json: async () => mockData,
            });

            const commits = await getTodayCommits("testuser");
            expect(commits).toBe(3);
        });

        it("should ignore commits from yesterday", async () => {
            const yesterday = new Date();
            yesterday.setDate(yesterday.getDate() - 1);

            const mockData = [
                {
                    type: "PushEvent",
                    created_at: yesterday.toISOString(),
                    payload: { commits: [{}, {}] },
                },
            ];

            global.fetch.mockResolvedValueOnce({
                ok: true,
                json: async () => mockData,
            });

            const commits = await getTodayCommits("testuser");
            expect(commits).toBe(0);
        });

        it("should handle empty response gracefully", async () => {
            global.fetch.mockResolvedValueOnce({
                ok: true,
                json: async () => [],
            });
            const commits = await getTodayCommits("testuser");
            expect(commits).toBe(0);
        });

        it("should handle API failure gracefully (return 0)", async () => {
            global.fetch.mockRejectedValueOnce(new Error("API Down"));
            const commits = await getTodayCommits("testuser");
            expect(commits).toBe(0);
        });
    });

    describe("getTodayLeetCodeSolved (LeetCode)", () => {
        it("should return correct solved count for today", async () => {
            const todaySeconds = Math.floor(Date.now() / 1000);

            const mockResponse = {
                data: {
                    recentAcSubmissionList: [
                        { timestamp: todaySeconds.toString() },
                        { timestamp: todaySeconds.toString() },
                    ],
                },
            };

            global.fetch.mockResolvedValueOnce({
                ok: true,
                json: async () => mockResponse,
            });

            const solved = await getTodayLeetCodeSolved("testuser");
            expect(solved).toBe(2);
        });

        it("should ignore submissions from yesterday", async () => {
            const yesterdaySeconds = Math.floor(Date.now() / 1000) - 86400;

            const mockResponse = {
                data: {
                    recentAcSubmissionList: [
                        { timestamp: yesterdaySeconds.toString() },
                    ],
                },
            };

            global.fetch.mockResolvedValueOnce({
                ok: true,
                json: async () => mockResponse,
            });

            const solved = await getTodayLeetCodeSolved("testuser");
            expect(solved).toBe(0);
        });

        it("should handle empty response gracefully", async () => {
            const mockResponse = {
                data: {
                    recentAcSubmissionList: [],
                },
            };

            global.fetch.mockResolvedValueOnce({
                ok: true,
                json: async () => mockResponse,
            });

            const solved = await getTodayLeetCodeSolved("testuser");
            expect(solved).toBe(0);
        });

        it("should handle API failure gracefully (return 0)", async () => {
            global.fetch.mockRejectedValueOnce(new Error("Network Error"));
            const solved = await getTodayLeetCodeSolved("testuser");
            expect(solved).toBe(0);
        });
    });
});
