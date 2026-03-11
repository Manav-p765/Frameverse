import { useState, useEffect, useRef, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import { userAPI } from "../../services/api";

export default function SearchBar() {
    const [query, setQuery] = useState("");
    const [results, setResults] = useState([]);
    const [loading, setLoading] = useState(false);
    const [showDropdown, setShowDropdown] = useState(false);
    const containerRef = useRef(null);
    const debounceRef = useRef(null);
    const navigate = useNavigate();

    // Close dropdown on outside click
    useEffect(() => {
        const handleClick = (e) => {
            if (containerRef.current && !containerRef.current.contains(e.target)) {
                setShowDropdown(false);
            }
        };
        document.addEventListener("mousedown", handleClick);
        return () => document.removeEventListener("mousedown", handleClick);
    }, []);

    // Debounced search
    const search = useCallback((q) => {
        clearTimeout(debounceRef.current);
        if (!q.trim()) {
            setResults([]);
            setShowDropdown(false);
            return;
        }
        setLoading(true);
        setShowDropdown(true);
        debounceRef.current = setTimeout(async () => {
            try {
                const data = await userAPI.search(q.trim());
                setResults(data);
            } catch {
                setResults([]);
            } finally {
                setLoading(false);
            }
        }, 300);
    }, []);

    const handleChange = (e) => {
        const val = e.target.value;
        setQuery(val);
        search(val);
    };

    const handleSelect = (userId) => {
        setShowDropdown(false);
        setQuery("");
        setResults([]);
        navigate(`/profile/${userId}`);
    };

    const handleClear = () => {
        setQuery("");
        setResults([]);
        setShowDropdown(false);
    };

    return (
        <div ref={containerRef} className="relative w-full max-w-xl mx-auto">
            {/* Input */}
            <div className="relative">
                {/* Search icon */}
                <svg
                    className="absolute left-3.5 top-1/2 -translate-y-1/2 text-[#5a5a6a] pointer-events-none"
                    width="18" height="18" viewBox="0 0 24 24"
                    fill="none" stroke="currentColor" strokeWidth="2"
                    strokeLinecap="round" strokeLinejoin="round"
                >
                    <circle cx="11" cy="11" r="8" />
                    <line x1="21" y1="21" x2="16.65" y2="16.65" />
                </svg>

                <input
                    id="explore-search"
                    type="text"
                    value={query}
                    onChange={handleChange}
                    onFocus={() => results.length && setShowDropdown(true)}
                    placeholder="Search users..."
                    autoComplete="off"
                    className="w-full pl-11 pr-10 py-3 rounded-xl bg-bg-secondary border border-border-color
                     text-text-primary placeholder-text-secondary text-sm
                     focus:outline-none focus:border-brand-purple/50 focus:ring-1 focus:ring-brand-purple/25
                     transition-all duration-200"
                />

                {/* Clear button */}
                {query && (
                    <button
                        onClick={handleClear}
                        className="absolute right-3 top-1/2 -translate-y-1/2 text-[#5a5a6a] hover:text-text-primary transition-colors"
                    >
                        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                            <line x1="18" y1="6" x2="6" y2="18" /><line x1="6" y1="6" x2="18" y2="18" />
                        </svg>
                    </button>
                )}
            </div>

            {/* Dropdown */}
            {showDropdown && (
                <div className="absolute z-50 mt-2 w-full rounded-xl bg-bg-secondary border border-border-color
                        shadow-2xl overflow-hidden animate-fade-in max-h-80 overflow-y-auto scrollbar-hide">
                    {loading ? (
                        <div className="flex items-center justify-center py-8">
                            <div className="w-5 h-5 border-2 border-brand-purple border-t-transparent rounded-full animate-spin" />
                        </div>
                    ) : results.length === 0 ? (
                        <div className="py-8 text-center text-[#5a5a6a] text-sm">
                            No users found
                        </div>
                    ) : (
                        results.map((user) => (
                            <button
                                key={user._id}
                                onClick={() => handleSelect(user._id)}
                                className="w-full flex items-center gap-3 px-4 py-3 hover:bg-[#26262e] transition-colors text-left"
                            >
                                {/* Avatar */}
                                <div className="w-10 h-10 rounded-full bg-bg-secondary shrink-0 overflow-hidden flex items-center justify-center">
                                    {user.profilePic ? (
                                        <img src={user.profilePic} alt={user.username} className="w-full h-full object-cover" />
                                    ) : (
                                        <span className="text-text-primary text-sm font-semibold">
                                            {user.username?.charAt(0).toUpperCase()}
                                        </span>
                                    )}
                                </div>

                                {/* Info */}
                                <div className="flex-1 min-w-0">
                                    <p className="text-text-primary text-sm font-medium truncate">{user.username}</p>
                                    {user.bio && (
                                        <p className="text-[#5a5a6a] text-xs truncate">{user.bio}</p>
                                    )}
                                </div>
                            </button>
                        ))
                    )}
                </div>
            )}
        </div>
    );
}
