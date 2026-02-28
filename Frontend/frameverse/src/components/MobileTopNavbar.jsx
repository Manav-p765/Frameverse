import { useState, useCallback, useEffect } from "react";
import { NavLink, useLocation } from "react-router-dom";
import { Bell } from "lucide-react";
import AnimatedLogo from "./AnimatedLogo";
import { useSocketEvent } from "../hooks/useSocket";

const MobileTopNavbar = () => {
    const location = useLocation();
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
                bg-[#18181c]/70
                backdrop-blur-xl
                border-b border-white/5
            "
        >
            <AnimatedLogo className="w-48" />

            <NavLink
                to="/notifications"
                aria-label="Notifications"
                className={({ isActive }) =>
                    `relative w-9 h-9 rounded-full flex items-center justify-center transition-colors ${isActive
                        ? "bg-white/10 text-white"
                        : "text-[#9a9aaa] hover:text-white hover:bg-white/5"
                    }`
                }
            >
                <Bell size={20} strokeWidth={1.5} />
                {notifUnread > 0 && (
                    <span className="absolute -top-0.5 -right-0.5 bg-red-500 text-white text-[9px] font-bold rounded-full min-w-3.5 h-3.5 flex items-center justify-center px-0.5 leading-none">
                        {notifUnread > 9 ? "9+" : notifUnread}
                    </span>
                )}
            </NavLink>
        </header>
    );
};

export default MobileTopNavbar;
