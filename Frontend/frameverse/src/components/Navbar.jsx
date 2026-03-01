import {
  Home,
  Compass,
  Film,
  MessageCircle,
  PlusSquare,
  User,
  LogOut,
  Bell,
} from "lucide-react";
import { NavLink, useLocation, useNavigate } from "react-router-dom";
import { useState, useEffect, useCallback } from "react";
import { useSocketEvent } from "../hooks/useSocket";

const parseChatId = (pathname) => {
  const segment = pathname.replace(/^\/chats\/?/, "").split("/")[0];
  return (!segment || segment === "new") ? null : segment;
};

const navItems = [
  { to: "/", label: "Home", icon: Home },
  { to: "/explore", label: "Explore", icon: Compass },
  { to: "/reels", label: "Reels", icon: Film },
  { to: "/chats", label: "Chats", icon: MessageCircle },
  { to: "/notifications", label: "Notifications", icon: Bell },
  { to: "/create", label: "Create", icon: PlusSquare },
  { to: "/profile", label: "Profile", icon: User },
];

import AnimatedLogo from "./AnimatedLogo";

const Navbar = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const currentChatId = parseChatId(location.pathname);
  const [unreadCount, setUnreadCount] = useState(0);
  const [notifUnread, setNotifUnread] = useState(0);

  // Listen for new messages — chat badge
  useSocketEvent("new-message", useCallback((msg) => {
    const cId = msg.chat?._id ?? msg.chat;
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
      className="
        hidden md:flex
        flex-col
        group
        h-screen
        bg-[#18181c]
        transition-all
        duration-300
        ease-in-out
        w-18
        hover:w-60
        text-gray-100
      "
    >
      {/* Logo - Always visible, completely independent of the bounding box */}
      <div className="absolute top-6 left-5 z-50 pointer-events-none">
        <AnimatedLogo className="w-48" />
      </div>

      {/* Inner container */}
      <div className="flex h-full w-full flex-col px-3 overflow-hidden">
        {/* Nav — offset above center */}
        <nav className="flex flex-col gap-1 mt-auto mb-[40%]">
          {navItems.map(({ to, label, icon: Icon }) => (
            <NavLink
              key={label}
              to={to}
              end={to === "/"}
              className={({ isActive }) =>
                `
                flex items-center gap-4
                px-3 py-3 rounded-xl
                hover:bg-black/40 transition
                ${isActive ? "bg-black/50 font-semibold" : ""}
              `
              }
            >
              <span className="relative shrink-0">
                <Icon size={24} />
                {/* Unread badge — Chats */}
                {label === "Chats" && unreadCount > 0 && (
                  <span className="absolute -top-1.5 -right-1.5 bg-blue-500 text-white text-[10px] font-bold rounded-full min-w-4 h-4 flex items-center justify-center px-1 leading-none">
                    {unreadCount > 9 ? "9+" : unreadCount}
                  </span>
                )}
                {/* Unread badge — Notifications */}
                {label === "Notifications" && notifUnread > 0 && (
                  <span className="absolute -top-1.5 -right-1.5 bg-red-500 text-white text-[10px] font-bold rounded-full min-w-4 h-4 flex items-center justify-center px-1 leading-none">
                    {notifUnread > 9 ? "9+" : notifUnread}
                  </span>
                )}
              </span>
              <span
                className="
                  overflow-hidden whitespace-nowrap
                  opacity-0 -translate-x-2.5
                  group-hover:opacity-100 group-hover:translate-x-0
                  transition-all duration-300
                "
              >
                {label}
              </span>
            </NavLink>
          ))}
        </nav>

        {/* Logout — pushed below the centered nav */}
        <div className="mt-auto pt-4">
          <button
            onClick={() => navigate("/logout")}
            className="flex items-center gap-4 px-3 py-3 rounded-xl hover:bg-black/40 transition text-red-500"
          >
            <LogOut size={24} className="shrink-0" />
            <span
              className="
                overflow-hidden whitespace-nowrap
                opacity-0 -translate-x-2.5
                group-hover:opacity-100 group-hover:translate-x-0
                transition-all duration-300
              "
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