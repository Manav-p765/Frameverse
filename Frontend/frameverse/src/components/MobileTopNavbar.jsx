import { useState, useCallback, useEffect, useRef } from "react";
import { NavLink, useLocation, useNavigate } from "react-router-dom";
import { Bell, Bot, Sun, Moon, MoreVertical, LogOut } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import AnimatedLogo from "./AnimatedLogo";
import { useSocketEvent } from "../hooks/useSocket";
import { useTheme } from "../context/ThemeContext";

const MobileTopNavbar = () => {
    const location = useLocation();
    const navigate = useNavigate();
    const { theme, toggleTheme } = useTheme();
    const [notifUnread, setNotifUnread] = useState(0);
    const [showMenu, setShowMenu] = useState(false);
    const menuRef = useRef(null);

    // Listen for new notifications
    useSocketEvent("new-notification", useCallback(() => {
        if (!location.pathname.startsWith("/notifications")) {
            setNotifUnread((n) => n + 1);
        }
    }, [location.pathname]));

    // Reset when on notifications page
    useEffect(() => {
        if (location.pathname.startsWith("/notifications")) {
            setNotifUnread(0);
        }
    }, [location.pathname]);

    // Close menu when clicking outside
    useEffect(() => {
        const handleClickOutside = (event) => {
            if (menuRef.current && !menuRef.current.contains(event.target)) {
                setShowMenu(false);
            }
        };
        document.addEventListener("mousedown", handleClickOutside);
        return () => document.removeEventListener("mousedown", handleClickOutside);
    }, []);

    return (
        <header
            className="
                md:hidden
                fixed top-0 left-0 right-0
                z-50
                flex items-center justify-between
                px-4 h-14
                bg-brand-purple/15 dark:bg-[#18181c]
                backdrop-blur-xl
                border-b border-border-color
            "
        >
            <AnimatedLogo className="w-48" />

            <div className="flex items-center gap-1">
                <button
                    onClick={toggleTheme}
                    aria-label="Toggle Theme"
                    className="relative w-9 h-9 rounded-full flex items-center justify-center transition-colors text-text-secondary hover:text-text-primary hover:bg-white/5"
                >
                    {theme === "dark" ? <Sun size={20} strokeWidth={1.5} /> : <Moon size={20} strokeWidth={1.5} />}
                </button>

                <NavLink
                    to="/autopost"
                    aria-label="AutoPost"
                    className={({ isActive }) =>
                        `relative w-9 h-9 rounded-full flex items-center justify-center transition-colors ${isActive
                            ? "bg-brand-orange/10 text-brand-orange"
                            : "text-text-secondary hover:text-brand-orange hover:bg-brand-orange/5"
                        }`
                    }
                >
                    <Bot size={20} strokeWidth={1.5} />
                </NavLink>

                <NavLink
                    to="/notifications"
                    aria-label="Notifications"
                    className={({ isActive }) =>
                        `relative w-9 h-9 rounded-full flex items-center justify-center transition-colors ${isActive
                            ? "bg-brand-pink/10 text-brand-pink"
                            : "text-text-secondary hover:text-brand-pink hover:bg-brand-pink/5"
                        }`
                    }
                >
                    <Bell size={20} strokeWidth={1.5} />
                    {notifUnread > 0 && (
                        <span className="absolute -top-0.5 -right-0.5 bg-brand-pink text-text-primary text-[9px] font-bold rounded-full min-w-3.5 h-3.5 flex items-center justify-center px-0.5 leading-none">
                            {notifUnread > 9 ? "9+" : notifUnread}
                        </span>
                    )}
                </NavLink>

                {/* More Menu */}
                <div className="relative" ref={menuRef}>
                    <button
                        onClick={() => setShowMenu(!showMenu)}
                        aria-label="More options"
                        className="w-9 h-9 rounded-full flex items-center justify-center transition-colors text-text-secondary hover:text-text-primary hover:bg-white/5"
                    >
                        <MoreVertical size={20} strokeWidth={1.5} />
                    </button>

                    <AnimatePresence>
                        {showMenu && (
                            <motion.div
                                initial={{ opacity: 0, scale: 0.95, y: -10 }}
                                animate={{ opacity: 1, scale: 1, y: 0 }}
                                exit={{ opacity: 0, scale: 0.95, y: -10 }}
                                transition={{ duration: 0.15, ease: "easeOut" }}
                                className="absolute right-0 mt-2 w-36 bg-bg-secondary border border-border-color rounded-xl shadow-xl overflow-hidden py-1 z-[60]"
                            >
                                <button
                                    onClick={() => {
                                        setShowMenu(false);
                                        navigate("/logout");
                                    }}
                                    className="w-full flex items-center gap-3 px-4 py-2.5 text-sm text-text-primary hover:bg-white/5 transition-colors"
                                >
                                    <LogOut size={16} strokeWidth={1.5} />
                                    <span>Logout</span>
                                </button>
                            </motion.div>
                        )}
                    </AnimatePresence>
                </div>
            </div>
        </header>
    );
};

export default MobileTopNavbar;
