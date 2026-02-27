import { Home, PlusCircle, User, Bell, MessageCircle } from "lucide-react";
import { NavLink, useLocation } from "react-router-dom";
import { useState, useEffect, useCallback } from "react";
import { useSocketEvent } from "../hooks/useSocket";

const parseChatId = (pathname) => {
  const segment = pathname.replace(/^\/chats\/?/, "").split("/")[0];
  return (!segment || segment === "new") ? null : segment;
};

const mobileNavItems = [
  { to: "/", label: "Home", icon: Home },
  { to: "/notifications", label: "Notifications", icon: Bell },
  { to: "/create", label: "Create", icon: PlusCircle },
  { to: "/chats", label: "Chats", icon: MessageCircle },
  { to: "/profile", label: "Profile", icon: User },
];

const MobileNavbar = () => {
  const location = useLocation();
  const currentChatId = parseChatId(location.pathname);
  const [unreadCount, setUnreadCount] = useState(0);

  useSocketEvent("new-message", useCallback((msg) => {
    const cId = msg.chat?._id ?? msg.chat;
    if (cId === currentChatId) return;
    setUnreadCount((n) => n + 1);
  }, [currentChatId]));

  // Reset when entering any /chats route
  useEffect(() => {
    if (location.pathname.startsWith("/chats")) {
      setUnreadCount(0);
    }
  }, [location.pathname]);

  return (
    <nav
      aria-label="Mobile navigation"
      className="
        md:hidden
        fixed bottom-0 left-0 right-0
        z-50
        px-4
        bg-[#18181c]
        border-t border-white/5
        shadow-[0_-4px_24px_rgba(0,0,0,0.4)]
        flex items-center justify-around
      "
      style={{ paddingBottom: "env(safe-area-inset-bottom)" }}
    >
      {mobileNavItems.map(({ to, label, icon: Icon }) => (
        <NavLink
          key={label}
          to={to}
          end={to === "/"}
          aria-label={label}
          className="group relative flex flex-col items-center justify-center overflow-visible"
          style={{ minWidth: 52, minHeight: 56 }}
        >
          {({ isActive }) => (
            <>
              {/* Top indicator bar */}
              <span
                className="absolute top-0 left-1/2 -translate-x-1/2 rounded-full transition-all duration-300"
                style={{
                  width: isActive ? 28 : 0,
                  height: 3,
                  background: "linear-gradient(90deg, #fca5a5, #ec4899)",
                  boxShadow: isActive ? "0 0 10px 3px rgba(239,68,68,0.9)" : "none",
                  opacity: isActive ? 1 : 0,
                }}
              />

              {/* Umbrella beam */}
              <span
                className="absolute pointer-events-none transition-opacity duration-300"
                style={{
                  top: 3,
                  left: "50%",
                  transform: "translateX(-50%)",
                  width: 64,
                  height: 56,
                  opacity: isActive ? 1 : 0,
                  background: `radial-gradient(
                    ellipse 40% 100% at 50% 0%,
                    rgba(220, 38, 38, 0.35) 0%,
                    rgba(220, 38, 38, 0.12) 40%,
                    transparent 100%
                  )`,
                }}
              />

              {/* Icon */}
              <span
                className={`
                  relative flex items-center justify-center
                  w-11 h-11 rounded-full mt-1
                  transition-transform duration-200 ease-out
                  active:scale-90
                  ${isActive ? "scale-110" : "scale-100 group-hover:scale-105"}
                `}
              >
                <Icon
                  size={22}
                  strokeWidth={isActive ? 2 : 1.5}
                  className="transition-all duration-300"
                  style={
                    isActive
                      ? {
                          stroke: "url(#activeGrad)",
                          filter: "drop-shadow(0 0 6px rgba(239,68,68,0.8))",
                        }
                      : { color: "#6b7280" }
                  }
                />

                <svg width="0" height="0" className="absolute">
                  <defs>
                    <linearGradient id="activeGrad" x1="0%" y1="0%" x2="100%" y2="100%">
                      <stop offset="0%" stopColor="#fca5a5" />
                      <stop offset="100%" stopColor="#ec4899" />
                    </linearGradient>
                  </defs>
                </svg>

                {/* Unread badge — chats only */}
                {label === "Chats" && unreadCount > 0 && (
                  <span className="absolute -top-0.5 -right-0.5 bg-blue-500 text-white text-[10px] font-bold rounded-full min-w-4 h-4 flex items-center justify-center px-1 leading-none">
                    {unreadCount > 9 ? "9+" : unreadCount}
                  </span>
                )}
              </span>
            </>
          )}
        </NavLink>
      ))}
    </nav>
  );
};

export default MobileNavbar;