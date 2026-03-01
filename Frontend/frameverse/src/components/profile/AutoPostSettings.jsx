import React, { useState, useEffect } from "react";
import { useAutoPost } from "../../features/autoPost/useAutoPost";
import { Github, Code2, Clock, CheckCircle2, Play, AlertCircle, Loader2 } from "lucide-react";

export default function AutoPostSettings() {
    const {
        loading,
        error,
        getSettings,
        updateSettings,
        runNow,
        getTodayStats,
    } = useAutoPost();

    const [formData, setFormData] = useState({
        enabled: false,
        postTime: "09:00",
        timezone: "Asia/Kolkata",
        selectedApps: [], // ['github', 'leetcode']
    });

    const [githubUsername, setGithubUsername] = useState("");
    const [leetcodeUsername, setLeetcodeUsername] = useState("");

    const [saveSuccess, setSaveSuccess] = useState(false);
    const [runStats, setRunStats] = useState(null);
    const [initialLoad, setInitialLoad] = useState(true);

    // Timezones for the dropdown
    const timezones = [
        "Asia/Kolkata",
        "America/New_York",
        "America/Los_Angeles",
        "Europe/London",
        "Europe/Paris",
        "Asia/Tokyo",
        "Australia/Sydney",
        "UTC"
    ];

    // Fetch initial data
    useEffect(() => {
        const fetchData = async () => {
            try {
                const data = await getSettings();
                if (data.settings) {
                    setFormData({
                        enabled: data.settings.enabled,
                        postTime: data.settings.postTime || "09:00",
                        timezone: data.settings.timezone || "Asia/Kolkata",
                        selectedApps: data.settings.selectedApps || [],
                    });
                }

                // Map connected accounts
                if (data.accounts) {
                    const gh = data.accounts.find(a => a.platform === "github");
                    const lc = data.accounts.find(a => a.platform === "leetcode");
                    if (gh) setGithubUsername(gh.username);
                    if (lc) setLeetcodeUsername(lc.username);
                }
            } catch (err) {
                // Error handled by hook
            } finally {
                setInitialLoad(false);
            }
        };
        fetchData();
    }, [getSettings]);

    const handleToggleApp = (appId) => {
        setFormData((prev) => {
            const isSelected = prev.selectedApps.includes(appId);
            return {
                ...prev,
                selectedApps: isSelected
                    ? prev.selectedApps.filter(a => a !== appId)
                    : [...prev.selectedApps, appId]
            };
        });
    };

    const handleSave = async () => {
        try {
            setSaveSuccess(false);
            // Pass the form data + the usernames to save everything in one request
            await updateSettings({
                ...formData,
                githubUsername,
                leetcodeUsername
            });
            setSaveSuccess(true);
            setTimeout(() => setSaveSuccess(false), 3000);
        } catch (err) {
            // Error handled by hook
        }
    };

    const handleRunNow = async () => {
        if (!window.confirm("This will trigger a manual auto-post run. Depending on your stats, it might create a new post immediately. Continue?")) {
            return;
        }

        try {
            const stats = await runNow();
            setRunStats(stats);
        } catch (err) {
            // Error handled by hook
        }
    };

    if (initialLoad) {
        return (
            <div className="flex justify-center py-20">
                <Loader2 className="w-8 h-8 text-blue-500 animate-spin" />
            </div>
        );
    }

    return (
        <div className="max-w-3xl mx-auto p-4 sm:p-6 text-white space-y-8">

            {/* Header */}
            <div>
                <h1 className="text-3xl font-bold bg-gradient-to-r from-blue-400 to-purple-500 bg-clip-text text-transparent mb-2">
                    AutoPost Settings
                </h1>
                <p className="text-gray-400">
                    Automatically generate daily stats cards and post them to your feed.
                </p>
            </div>

            {error && (
                <div className="bg-red-500/10 border border-red-500/20 text-red-500 p-4 rounded-xl flex items-start gap-3">
                    <AlertCircle className="w-5 h-5 mt-0.5 flex-shrink-0" />
                    <p className="text-sm">{error}</p>
                </div>
            )}

            {/* SECTION 1: Master Toggle */}
            <div className="bg-white/5 border border-white/10 p-6 rounded-2xl flex items-center justify-between shadow-lg">
                <div>
                    <h2 className="text-xl font-semibold mb-1">Enable AutoPost</h2>
                    <p className="text-sm text-gray-400">Turn daily automated posting on or off.</p>
                </div>
                <label className="relative inline-flex items-center cursor-pointer">
                    <input
                        type="checkbox"
                        className="sr-only peer"
                        checked={formData.enabled}
                        onChange={(e) => setFormData({ ...formData, enabled: e.target.checked })}
                    />
                    <div className="w-14 h-7 bg-white/10 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-6 after:w-6 after:transition-all peer-checked:bg-blue-500 shadow-inner"></div>
                </label>
            </div>

            <div className={`space-y-8 transition-opacity duration-300 ${!formData.enabled ? 'opacity-50 pointer-events-none' : ''}`}>

                {/* SECTION 2: Schedule */}
                <div className="bg-white/5 border border-white/10 p-6 flex flex-col sm:flex-row gap-6 rounded-2xl shadow-lg">
                    <div className="flex-1">
                        <h2 className="text-lg font-semibold flex items-center gap-2 mb-4">
                            <Clock className="w-5 h-5 text-blue-400" />
                            Schedule
                        </h2>
                        <div className="space-y-4">
                            <div>
                                <label className="block text-sm font-medium text-gray-400 mb-1">Time (24h format)</label>
                                <input
                                    type="time"
                                    value={formData.postTime}
                                    onChange={(e) => setFormData({ ...formData, postTime: e.target.value })}
                                    className="w-full bg-black/40 border border-white/10 rounded-xl px-4 py-2.5 outline-none focus:border-blue-500 transition-colors"
                                />
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-gray-400 mb-1">Timezone</label>
                                <select
                                    value={formData.timezone}
                                    onChange={(e) => setFormData({ ...formData, timezone: e.target.value })}
                                    className="w-full bg-black/40 border border-white/10 rounded-xl px-4 py-2.5 outline-none focus:border-blue-500 transition-colors appearance-none"
                                >
                                    {timezones.map(tz => (
                                        <option key={tz} value={tz}>{tz}</option>
                                    ))}
                                </select>
                            </div>
                        </div>
                    </div>
                </div>

                {/* SECTION 3: App Connections & Data Selection */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">

                    {/* GitHub Card */}
                    <div className={`bg-white/5 border ${formData.selectedApps.includes('github') ? 'border-purple-500/50' : 'border-white/10'} p-6 rounded-2xl shadow-lg transition-all`}>
                        <div className="flex justify-between items-start mb-6">
                            <div className="flex items-center gap-3">
                                <div className="w-10 h-10 rounded-full bg-[#24292e] flex items-center justify-center">
                                    <Github className="w-5 h-5 text-white" />
                                </div>
                                <div>
                                    <h3 className="font-semibold text-lg">GitHub</h3>
                                    <p className="text-xs text-gray-400">Track daily commits</p>
                                </div>
                            </div>
                            <label className="relative inline-flex items-center cursor-pointer">
                                <input
                                    type="checkbox"
                                    className="sr-only peer"
                                    checked={formData.selectedApps.includes('github')}
                                    onChange={() => handleToggleApp('github')}
                                />
                                <div className="w-11 h-6 bg-white/10 rounded-full peer peer-checked:after:translate-x-full after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-purple-500"></div>
                            </label>
                        </div>

                        <div className="space-y-2">
                            <label className="text-sm font-medium text-gray-400">GitHub Username</label>
                            <input
                                type="text"
                                placeholder="eng-manav"
                                value={githubUsername}
                                onChange={(e) => setGithubUsername(e.target.value)}
                                disabled={!formData.selectedApps.includes('github')}
                                className="w-full bg-black/40 border border-white/10 rounded-xl px-4 py-2.5 outline-none focus:border-purple-500 disabled:opacity-50 transition-colors"
                            />
                        </div>
                    </div>

                    {/* LeetCode Card */}
                    <div className={`bg-white/5 border ${formData.selectedApps.includes('leetcode') ? 'border-amber-500/50' : 'border-white/10'} p-6 rounded-2xl shadow-lg transition-all`}>
                        <div className="flex justify-between items-start mb-6">
                            <div className="flex items-center gap-3">
                                <div className="w-10 h-10 rounded-full bg-[#ffa116]/20 flex items-center justify-center">
                                    <Code2 className="w-5 h-5 text-[#ffa116]" />
                                </div>
                                <div>
                                    <h3 className="font-semibold text-lg">LeetCode</h3>
                                    <p className="text-xs text-gray-400">Track solved problems</p>
                                </div>
                            </div>
                            <label className="relative inline-flex items-center cursor-pointer">
                                <input
                                    type="checkbox"
                                    className="sr-only peer"
                                    checked={formData.selectedApps.includes('leetcode')}
                                    onChange={() => handleToggleApp('leetcode')}
                                />
                                <div className="w-11 h-6 bg-white/10 rounded-full peer peer-checked:after:translate-x-full after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-amber-500"></div>
                            </label>
                        </div>

                        <div className="space-y-2">
                            <label className="text-sm font-medium text-gray-400">LeetCode Username</label>
                            <input
                                type="text"
                                placeholder="manav_leetcode"
                                value={leetcodeUsername}
                                onChange={(e) => setLeetcodeUsername(e.target.value)}
                                disabled={!formData.selectedApps.includes('leetcode')}
                                className="w-full bg-black/40 border border-white/10 rounded-xl px-4 py-2.5 outline-none focus:border-amber-500 disabled:opacity-50 transition-colors"
                            />
                        </div>
                    </div>

                </div>
            </div>

            {/* SECTION 4: Actions */}
            <div className="border-t border-white/10 pt-6 mt-8 flex flex-col sm:flex-row gap-4 items-center justify-between">

                {runStats ? (
                    <div className="text-sm text-green-400 flex items-center gap-2">
                        <CheckCircle2 className="w-4 h-4" />
                        Manual run completed! (Check feed if eligible)
                    </div>
                ) : (
                    <button
                        onClick={handleRunNow}
                        disabled={loading || !formData.enabled}
                        className="flex items-center gap-2 px-5 py-2.5 rounded-xl bg-white/5 hover:bg-white/10 text-white font-medium border border-white/10 transition-colors disabled:opacity-50 disabled:cursor-not-allowed w-full sm:w-auto justify-center"
                    >
                        {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Play className="w-4 h-4" />}
                        Generate Now
                    </button>
                )}

                <div className="flex items-center gap-4 w-full sm:w-auto">
                    {saveSuccess && (
                        <span className="text-sm text-green-400 flex items-center gap-1.5 animate-pulse">
                            <CheckCircle2 className="w-4 h-4" /> Saved!
                        </span>
                    )}
                    <button
                        onClick={handleSave}
                        disabled={loading}
                        className="px-8 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-medium shadow-lg shadow-blue-500/20 transition-all active:scale-95 disabled:opacity-50 w-full sm:w-auto flex items-center justify-center min-w-[140px]"
                    >
                        {loading ? <Loader2 className="w-5 h-5 animate-spin" /> : "Save Settings"}
                    </button>
                </div>
            </div>

        </div>
    );
}
