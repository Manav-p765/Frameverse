/**
 * Desktop Sidebar Navigation
 *
 * Collapsible sidebar (76px → 256px on hover) with animated labels.
 * Features:
 *   - Real-time unread badges for Chats and Notifications via socket events
 *   - Badges auto-reset when navigating to the respective page
 *   - Theme toggle (light/dark mode)
 *   - Per-item hover colors (purple default, orange for AutoPost, pink for Notifications)
 *   - Only visible on md+ screens (mobile uses MobileNavbar)
 */

import {
  Home,
  Compass,
  MessageCircle,
  PlusSquare,
  User,
  LogOut,
  Bell,
  Bot,
  Sun,
  Moon,
  BarChart2,
} from "lucide-react";
import { NavLink, useLocation, useNavigate } from "react-router-dom";
import { useState, useEffect, useCallback } from "react";
import { useSocketEvent } from "../hooks/useSocket";
import { useTheme } from "../context/ThemeContext";

const parseChatId = (pathname) => {
  const segment = pathname.replace(/^\/chats\/?/, "").split("/")[0];
  return (!segment || segment === "new") ? null : segment;
};

const navItems = [
  { to: "/", label: "Home", icon: Home },
  { to: "/explore", label: "Explore", icon: Compass },
  { to: "/chats", label: "Chats", icon: MessageCircle },
  { to: "/create", label: "Create", icon: PlusSquare },
  { to: "/profile", label: "Profile", icon: User },
  { to: "/autopost", label: "AutoPost", icon: Bot },
  { to: "/dashboard/analytics", label: "Analytics", icon: BarChart2 },
];

const Navbar = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { theme, toggleTheme } = useTheme();
  const currentChatId = parseChatId(location.pathname);
  const [unreadCount, setUnreadCount] = useState(0);
  const [notifUnread, setNotifUnread] = useState(0);

  // Listen for new messages — chat badge
  useSocketEvent("chat-updated", useCallback(({ chatId: cId, newMessage }) => {
    if (!newMessage) return;
    if (cId === currentChatId) return;
    setUnreadCount((n) => n + 1);
  }, [currentChatId]));

  // Listen for new notifications
  useSocketEvent("new-notification", useCallback(() => {
    if (!location.pathname.startsWith("/notifications")) {
      setNotifUnread((n) => n + 1);
    }
  }, [location.pathname]));

  // Reset chat badge when entering any /chats route
  useEffect(() => {
    if (location.pathname.startsWith("/chats")) {
      setUnreadCount(0);
    }
    if (location.pathname.startsWith("/notifications")) {
      setNotifUnread(0);
    }
  }, [location.pathname]);

  return (
    // ✅ Only visible on md and above — mobile uses MobileNavbar
    <aside
      className={`
        hidden md:flex
        flex-col
        group
        h-screen
        bg-bg-primary
        transition-all
        duration-300
        ease-in-out
        w-[76px] hover:w-64
        text-text-primary
        relative
      `}
    >
      {/* Expanding purple background to cover logo transition (Light mode only) */}
      <div className="absolute inset-0 bg-brand-purple z-0 transition-opacity duration-300 opacity-0 group-hover:opacity-100 dark:group-hover:opacity-0"></div>
      {/* Inner container */}
      <div className="flex h-full w-full flex-col px-3 relative z-10 bg-transparent dark:bg-bg-primary transition-colors duration-300 ease-in-out">
        {/* Empty spacer for absolute logo */}
        <div className="h-24 shrink-0"></div>

        {/* Nav — perfectly centered vertically */}
        <nav className="flex-1 flex flex-col justify-center gap-2">
          {navItems.map(({ to, label, icon: Icon }) => {
            // Determine active color based on label
            const getActiveColor = (isActive) => {
              if (!isActive) {
                return "text-text-secondary group-hover:text-white dark:group-hover:text-text-secondary";
              }
              if (label === "AutoPost") return "text-brand-orange bg-brand-orange/10 font-bold group-hover:text-brand-orange";
              if (label === "Notifications") return "text-brand-pink bg-brand-pink/10 font-bold group-hover:text-brand-pink";
              return "text-brand-purple bg-brand-purple/10 font-bold group-hover:text-white dark:group-hover:text-brand-purple";
            };

            const getHoverColor = () => {
              if (label === "AutoPost") return "hover:bg-brand-orange/20 dark:hover:bg-brand-orange/5 dark:hover:text-brand-orange";
              if (label === "Notifications") return "hover:bg-brand-pink/20 dark:hover:bg-brand-pink/5 dark:hover:text-brand-pink";
              return "hover:bg-white/20 dark:hover:bg-brand-purple/5 dark:hover:text-brand-purple";
            };

            return (
              <NavLink
                key={label}
                to={to}
                end={to === "/"}
                className={({ isActive }) =>
                  `
                flex items-center gap-4
                px-3 py-3 rounded-xl
                transition-all duration-200
                ${getActiveColor(isActive)}
                ${!isActive ? getHoverColor() : ""}
              `
                }
              >
                {({ isActive }) => (
                  <>
                    <span className="relative shrink-0 flex items-center justify-center w-6 h-6">
                      <Icon size={24} strokeWidth={isActive ? 2.5 : 2} />
                      {/* Unread badge — Chats */}
                      {label === "Chats" && unreadCount > 0 && (
                        <span className="absolute -top-1.5 -right-1.5 bg-brand-purple text-white text-[10px] font-bold rounded-full min-w-4 h-4 flex items-center justify-center px-1 leading-none">
                          {unreadCount > 9 ? "9+" : unreadCount}
                        </span>
                      )}
                      {/* Unread badge — Notifications */}
                      {label === "Notifications" && notifUnread > 0 && (
                        <span className="absolute -top-1.5 -right-1.5 bg-brand-pink text-white text-[10px] font-bold rounded-full min-w-4 h-4 flex items-center justify-center px-1 leading-none">
                          {notifUnread > 9 ? "9+" : notifUnread}
                        </span>
                      )}
                    </span>
                    <span
                      className={`
                        overflow-hidden whitespace-nowrap
                        transition-all duration-300 ease-in-out
                        ${"max-w-0 opacity-0 -translate-x-2 group-hover:max-w-[150px] group-hover:opacity-100 group-hover:translate-x-0"}
                      `}
                    >
                      {label}
                    </span>
                  </>
                )}
              </NavLink>
            );
          })}
        </nav>

        {/* Theme Toggle & Logout — pushed to bottom */}
        <div className="mt-auto shrink-0 pb-6 pt-4 border-t border-border-color group-hover:border-white/20 flex flex-col gap-2 relative z-10 transition-colors duration-300">
          <button
            onClick={toggleTheme}
            className={`flex items-center gap-4 px-3 py-3 w-full rounded-xl transition-colors
              text-text-secondary group-hover:text-white hover:bg-white/20 dark:hover:bg-brand-purple/5 dark:group-hover:text-text-secondary
            `}
          >
            <span className="relative shrink-0 flex items-center justify-center w-6 h-6">
              {theme === "dark" ? <Sun size={24} /> : <Moon size={24} />}
            </span>
            <span
              className={`
                overflow-hidden whitespace-nowrap
                transition-all duration-300 ease-in-out font-medium
                ${"max-w-0 opacity-0 -translate-x-2 group-hover:max-w-[150px] group-hover:opacity-100 group-hover:translate-x-0"}
              `}
            >
              {theme === "dark" ? "Light Mode" : "Dark Mode"}
            </span>
          </button>

          <button
            onClick={() => navigate("/logout")}
            className={`flex items-center gap-4 px-3 py-3 w-full rounded-xl transition-colors
              text-brand-pink/80 group-hover:text-brand-pink hover:bg-white/20 dark:hover:bg-brand-pink/10 dark:group-hover:text-brand-pink/80
            `}
          >
            <span className="relative shrink-0 flex items-center justify-center w-6 h-6">
              <LogOut size={24} />
            </span>
            <span
              className={`
                overflow-hidden whitespace-nowrap
                transition-all duration-300 ease-in-out font-medium
                ${"max-w-0 opacity-0 -translate-x-2 group-hover:max-w-[150px] group-hover:opacity-100 group-hover:translate-x-0"}
              `}
            >
              Logout
            </span>
          </button>
        </div>
      </div>
    </aside>
  );
};

export default Navbar;