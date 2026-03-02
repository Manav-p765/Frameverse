import {
  Home,
  Compass,
  Film,
  MessageCircle,
  PlusSquare,
  User,
  LogOut,
  Bell,
  Bot,
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
  { to: "/autopost", label: "AutoPost", icon: Bot },
];

const Navbar = () => {
  const navigate = useNavigate();
  const location = useLocation();
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
      className="
        hidden md:flex
        flex-col
        group
        h-screen
        bg-[#18181c]
        transition-all
        duration-300
        ease-in-out
        w-[76px]
        hover:w-64
        text-gray-100
        relative
      "
    >
      {/* Inner container */}
      <div className="flex h-full w-full flex-col px-3 relative z-10">
        {/* Empty spacer for absolute logo */}
        <div className="h-24 shrink-0"></div>

        {/* Nav — perfectly centered vertically */}
        <nav className="flex-1 flex flex-col justify-center gap-2">
          {navItems.map(({ to, label, icon: Icon }) => (
            <NavLink
              key={label}
              to={to}
              end={to === "/"}
              className={({ isActive }) =>
                `
                flex items-center gap-4
                px-3 py-3 rounded-xl
                hover:bg-white/10 transition-colors
                ${isActive ? "bg-white/10 font-semibold text-white" : "text-gray-400 hover:text-white"}
              `
              }
            >
              {({ isActive }) => (
                <>
                  <span className="relative shrink-0 flex items-center justify-center w-6 h-6">
                    <Icon size={24} strokeWidth={isActive ? 2.5 : 2} />
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
                          max-w-0 opacity-0 -translate-x-2
                          group-hover:max-w-[150px] group-hover:opacity-100 group-hover:translate-x-0
                          transition-all duration-300 ease-in-out
                        "
                  >
                    {label}
                  </span>
                </>
              )}
            </NavLink>
          ))}
        </nav>

        {/* Logout — pushed to bottom */}
        <div className="mt-auto shrink-0 pb-6 pt-4 border-t border-white/5">
          <button
            onClick={() => navigate("/logout")}
            className="flex items-center gap-4 px-3 py-3 w-full rounded-xl hover:bg-red-500/10 transition-colors text-red-500/80 hover:text-red-500"
          >
            <span className="relative shrink-0 flex items-center justify-center w-6 h-6">
              <LogOut size={24} />
            </span>
            <span
              className="
                overflow-hidden whitespace-nowrap
                max-w-0 opacity-0 -translate-x-2
                group-hover:max-w-[150px] group-hover:opacity-100 group-hover:translate-x-0
                transition-all duration-300 ease-in-out
                font-medium
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