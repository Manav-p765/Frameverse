import { NavLink } from "react-router-dom";
import { Bell } from "lucide-react";
import AnimatedLogo from "./AnimatedLogo";

const MobileTopNavbar = () => {
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
            </NavLink>
        </header>
    );
};

export default MobileTopNavbar;
