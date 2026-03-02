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
        <div className="max-w-4xl mx-auto p-4 sm:p-6 lg:p-8 text-white space-y-8 animate-in fade-in duration-500 pb-32 sm:pb-8">

            {/* Header */}
            <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
                <div>
                    <h1 className="text-3xl sm:text-4xl font-extrabold tracking-tight bg-gradient-to-r from-blue-400 via-indigo-400 to-purple-400 bg-clip-text text-transparent mb-2">
                        AutoPost Settings
                    </h1>
                    <p className="text-sm sm:text-base text-gray-400 max-w-lg">
                        Automate your progress tracking. We'll generate a stunning daily summary card and post it to your feed.
                    </p>
                </div>
            </div>

            {error && (
                <div className="bg-red-500/10 backdrop-blur-md border border-red-500/20 text-red-400 p-4 rounded-2xl flex items-center gap-3 shadow-lg shadow-red-500/5 animate-in slide-in-from-top-4">
                    <AlertCircle className="w-5 h-5 flex-shrink-0" />
                    <p className="text-sm font-medium">{error}</p>
                </div>
            )}

            {/* SECTION 1: Master Toggle */}
            <div className={`relative overflow-hidden border p-6 sm:p-8 rounded-3xl flex flex-col sm:flex-row gap-6 sm:items-center justify-between shadow-2xl transition-all duration-500 ${formData.enabled ? 'bg-gradient-to-br from-blue-500/10 to-purple-500/10 border-blue-500/30' : 'bg-white/5 border-white/10 backdrop-blur-xl'}`}>
                {formData.enabled && (
                    <div className="absolute top-[-50%] left-[-10%] w-64 h-64 bg-blue-500/20 rounded-full blur-[80px] pointer-events-none"></div>
                )}

                <div className="relative z-10 w-full sm:w-auto">
                    <h2 className="text-xl sm:text-2xl font-bold mb-2">Enable Automation</h2>
                    <p className="text-sm text-gray-400 max-w-sm">
                        Toggle to activate the background job that runs on your configured schedule.
                    </p>
                </div>
                <div className="relative z-10 flex items-center justify-between sm:justify-end shrink-0 w-full sm:w-auto">
                    <span className="sm:hidden text-sm font-semibold text-gray-300">Status</span>
                    <label className="relative inline-flex items-center cursor-pointer">
                        <input
                            type="checkbox"
                            className="sr-only peer"
                            checked={formData.enabled}
                            onChange={(e) => setFormData({ ...formData, enabled: e.target.checked })}
                        />
                        <div className="w-14 h-8 bg-black/40 border border-white/10 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[4px] after:left-[4px] after:bg-gray-300 peer-checked:after:bg-white after:rounded-full after:h-6 after:w-6 after:transition-all peer-checked:bg-gradient-to-r peer-checked:from-blue-500 peer-checked:to-purple-600 shadow-inner"></div>
                    </label>
                </div>
            </div>

            <div className={`space-y-8 transition-all duration-500 ${!formData.enabled ? 'opacity-40 grayscale-[50%] pointer-events-none' : ''}`}>

                {/* SECTION 2: Schedule */}
                <div className="bg-white/5 backdrop-blur-xl border border-white/10 p-6 sm:p-8 rounded-3xl shadow-xl">
                    <h2 className="text-lg font-semibold flex items-center gap-2 mb-6 text-gray-200">
                        <Clock className="w-5 h-5 text-blue-400" />
                        Posting Schedule
                    </h2>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                        <div className="space-y-2">
                            <label className="block text-sm font-medium text-gray-400">Time (24h format)</label>
                            <div className="relative">
                                <input
                                    type="time"
                                    value={formData.postTime}
                                    onChange={(e) => setFormData({ ...formData, postTime: e.target.value })}
                                    className="w-full bg-black/50 border border-white/10 rounded-2xl px-5 py-3.5 outline-none focus:border-blue-400 focus:ring-1 focus:ring-blue-400/50 transition-all text-white placeholder-gray-500"
                                />
                            </div>
                        </div>
                        <div className="space-y-2">
                            <label className="block text-sm font-medium text-gray-400">Timezone</label>
                            <div className="relative">
                                <select
                                    value={formData.timezone}
                                    onChange={(e) => setFormData({ ...formData, timezone: e.target.value })}
                                    className="w-full bg-black/50 border border-white/10 rounded-2xl px-5 py-3.5 outline-none focus:border-blue-400 focus:ring-1 focus:ring-blue-400/50 transition-all text-white appearance-none cursor-pointer"
                                >
                                    {timezones.map(tz => (
                                        <option key={tz} value={tz} className="bg-gray-900">{tz}</option>
                                    ))}
                                </select>
                                <div className="absolute right-4 top-1/2 -translate-y-1/2 pointer-events-none text-gray-500">
                                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 9l-7 7-7-7"></path></svg>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>

                {/* SECTION 3: App Connections & Data Selection */}
                <div>
                    <h2 className="text-lg font-semibold mb-4 text-gray-200 ml-2">Connected Platforms</h2>
                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">

                        {/* GitHub Card */}
                        <div className={`relative overflow-hidden group bg-white/5 backdrop-blur-xl border ${formData.selectedApps.includes('github') ? 'border-purple-500/40 bg-purple-500/5' : 'border-white/10'} p-6 sm:p-8 rounded-3xl shadow-xl transition-all duration-300 hover:border-purple-500/60`}>
                            {formData.selectedApps.includes('github') && (
                                <div className="absolute top-0 right-0 w-32 h-32 bg-purple-500/20 rounded-full blur-[60px] pointer-events-none transition-opacity"></div>
                            )}

                            <div className="relative z-10 flex flex-row items-center justify-between mb-6 sm:mb-8 gap-4">
                                <div className="flex items-center gap-3 sm:gap-4 shrink overflow-hidden">
                                    <div className="w-10 h-10 sm:w-12 sm:h-12 shrink-0 rounded-2xl bg-gradient-to-br from-[#24292e] to-black flex items-center justify-center shadow-lg shadow-black/50 border border-white/10">
                                        <Github className="w-5 h-5 sm:w-6 sm:h-6 text-white" />
                                    </div>
                                    <div className="min-w-0">
                                        <h3 className="font-bold text-base sm:text-lg truncate">GitHub</h3>
                                        <p className="text-xs sm:text-sm text-gray-400 truncate">Track daily commits</p>
                                    </div>
                                </div>
                                <label className="relative inline-flex items-center cursor-pointer shrink-0">
                                    <input
                                        type="checkbox"
                                        className="sr-only peer"
                                        checked={formData.selectedApps.includes('github')}
                                        onChange={() => handleToggleApp('github')}
                                    />
                                    <div className="w-12 h-7 bg-black/50 border border-white/10 rounded-full peer peer-checked:after:translate-x-full after:content-[''] after:absolute after:top-[4px] after:left-[4px] after:bg-gray-300 peer-checked:after:bg-white after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-purple-500"></div>
                                </label>
                            </div>

                            <div className="relative z-10 space-y-2">
                                <label className="text-sm font-medium text-gray-400">GitHub Username</label>
                                <input
                                    type="text"
                                    placeholder="e.g. eng-manav"
                                    value={githubUsername}
                                    onChange={(e) => setGithubUsername(e.target.value)}
                                    disabled={!formData.selectedApps.includes('github')}
                                    className="w-full bg-black/50 border border-white/10 rounded-2xl px-5 py-3.5 outline-none focus:border-purple-500 focus:ring-1 focus:ring-purple-500/50 disabled:opacity-40 transition-all font-mono text-sm"
                                />
                            </div>
                        </div>

                        {/* LeetCode Card */}
                        <div className={`relative overflow-hidden group bg-white/5 backdrop-blur-xl border ${formData.selectedApps.includes('leetcode') ? 'border-amber-500/40 bg-amber-500/5' : 'border-white/10'} p-6 sm:p-8 rounded-3xl shadow-xl transition-all duration-300 hover:border-amber-500/60`}>
                            {formData.selectedApps.includes('leetcode') && (
                                <div className="absolute top-0 right-0 w-32 h-32 bg-amber-500/20 rounded-full blur-[60px] pointer-events-none transition-opacity"></div>
                            )}

                            <div className="relative z-10 flex flex-row items-center justify-between mb-6 sm:mb-8 gap-4">
                                <div className="flex items-center gap-3 sm:gap-4 shrink overflow-hidden">
                                    <div className="w-10 h-10 sm:w-12 sm:h-12 shrink-0 rounded-2xl bg-gradient-to-br from-[#ffa116]/20 to-[#ffa116]/5 flex items-center justify-center shadow-lg shadow-black/50 border border-[#ffa116]/20">
                                        <Code2 className="w-5 h-5 sm:w-6 sm:h-6 text-[#ffa116]" />
                                    </div>
                                    <div className="min-w-0">
                                        <h3 className="font-bold text-base sm:text-lg truncate">LeetCode</h3>
                                        <p className="text-xs sm:text-sm text-gray-400 truncate">Track solved problems</p>
                                    </div>
                                </div>
                                <label className="relative inline-flex items-center cursor-pointer shrink-0">
                                    <input
                                        type="checkbox"
                                        className="sr-only peer"
                                        checked={formData.selectedApps.includes('leetcode')}
                                        onChange={() => handleToggleApp('leetcode')}
                                    />
                                    <div className="w-12 h-7 bg-black/50 border border-white/10 rounded-full peer peer-checked:after:translate-x-full after:content-[''] after:absolute after:top-[4px] after:left-[4px] after:bg-gray-300 peer-checked:after:bg-white after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-amber-500"></div>
                                </label>
                            </div>

                            <div className="relative z-10 space-y-2">
                                <label className="text-sm font-medium text-gray-400">LeetCode Username</label>
                                <input
                                    type="text"
                                    placeholder="e.g. manav_leetcode"
                                    value={leetcodeUsername}
                                    onChange={(e) => setLeetcodeUsername(e.target.value)}
                                    disabled={!formData.selectedApps.includes('leetcode')}
                                    className="w-full bg-black/50 border border-white/10 rounded-2xl px-5 py-3.5 outline-none focus:border-amber-500 focus:ring-1 focus:ring-amber-500/50 disabled:opacity-40 transition-all font-mono text-sm"
                                />
                            </div>
                        </div>

                    </div>
                </div>

            </div>

            {/* SECTION 4: Actions */}
            <div className="sticky bottom-4 z-40 bg-black/80 backdrop-blur-2xl border border-white/10 p-4 rounded-3xl mt-8 flex flex-col sm:flex-row gap-4 items-center justify-between shadow-2xl">
                {runStats ? (
                    <div className="text-sm text-green-400 font-medium flex items-center gap-2 px-2">
                        <CheckCircle2 className="w-5 h-5 flex-shrink-0" />
                        <span>Manual run completed! Check your profile.</span>
                    </div>
                ) : (
                    <button
                        onClick={handleRunNow}
                        disabled={loading || !formData.enabled}
                        className="group flex items-center justify-center gap-2 px-6 py-3 rounded-2xl bg-white/5 hover:bg-white/10 text-white font-medium border border-white/10 transition-all disabled:opacity-40 disabled:cursor-not-allowed w-full sm:w-auto hover:shadow-lg hover:shadow-white/5"
                    >
                        {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Play className="w-4 h-4 group-hover:scale-110 transition-transform" />}
                        Generate Now
                    </button>
                )}

                <div className="flex items-center gap-4 w-full sm:w-auto">
                    {saveSuccess && (
                        <span className="text-sm font-medium text-green-400 flex items-center gap-1.5 animate-in slide-in-from-right font-medium px-2">
                            <CheckCircle2 className="w-5 h-5" /> Saved
                        </span>
                    )}
                    <button
                        onClick={handleSave}
                        disabled={loading}
                        className="relative overflow-hidden group px-8 py-3 rounded-2xl bg-white text-black font-bold shadow-lg shadow-white/20 transition-all active:scale-95 disabled:opacity-50 w-full sm:w-auto min-w-[160px] flex items-center justify-center"
                    >
                        <span className="absolute inset-0 w-full h-full bg-gradient-to-r from-blue-400/20 to-purple-400/20 opacity-0 group-hover:opacity-100 transition-opacity"></span>
                        {loading ? <Loader2 className="w-5 h-5 animate-spin" /> : <span className="relative z-10">Save Changes</span>}
                    </button>
                </div>
            </div>

        </div>
    );
}
