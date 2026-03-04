import { useState, useCallback, useEffect } from "react";
import { NavLink, useLocation } from "react-router-dom";
import { Bell, Bot, Sun, Moon } from "lucide-react";
import AnimatedLogo from "./AnimatedLogo";
import { useSocketEvent } from "../hooks/useSocket";
import { useTheme } from "../context/ThemeContext";

const MobileTopNavbar = () => {
    const location = useLocation();
    const { theme, toggleTheme } = useTheme();
    const [notifUnread, setNotifUnread] = useState(0);

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

    return (
        <header
            className="
                md:hidden
                fixed top-0 left-0 right-0
                z-50
                flex items-center justify-between
                px-4 h-14
                dark:bg-brand-purple/20 bg-brand-purple/20
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
            </div>
        </header>
    );
};

export default MobileTopNavbar;
