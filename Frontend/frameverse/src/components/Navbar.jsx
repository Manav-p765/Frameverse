import {
  Home,
  Search,
  Compass,
  Film,
  MessageCircle,
  Heart,
  PlusSquare,
  User,
  LogOut,
} from "lucide-react";
import { NavLink } from "react-router-dom";
import { useNavigate } from "react-router-dom";

const navItems = [
  { to: "/", label: "Home", icon: Home },
  { to: "/search", label: "Search", icon: Search },
  { to: "/explore", label: "Explore", icon: Compass },
  { to: "/reels", label: "Reels", icon: Film },
  { to: "/messages", label: "Messages", icon: MessageCircle },
  { to: "/notifications", label: "Notifications", icon: Heart },
  { to: "/create", label: "Create", icon: PlusSquare },
  { to: "/profile", label: "Profile", icon: User },
];

const Navbar = () => {
  const navigate = useNavigate();
  return (
    // ✅ Only visible on md and above — mobile uses MobileNavbar
    <aside
      className="
        hidden md:flex
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
      <div className="flex h-full w-full flex-col justify-between px-3 py-6">
        {/* Logo */}
        <h1
          className="
            text-2xl font-bold mb-6
            overflow-hidden
            opacity-0 -translate-x-2
            group-hover:opacity-100 group-hover:translate-x-0
            transition-all duration-300
          "
        >
          Frameverse
        </h1>

        {/* Nav */}
        <nav className="flex flex-col pb-20 gap-1">
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
              <Icon size={24} className="shrink-0" />
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

        {/* Logout */}
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
    </aside>
  );
};

export default Navbar;