import Navbar from "./Navbar";
import MobileNavbar from "./MobileNavbar";
import { Outlet, useLocation } from "react-router-dom";

/**
 * Hide the mobile navbar when a specific chat is open.
 *
 * Show navbar:   /chats          (list)
 *                /chats/new      (following list)
 *
 * Hide navbar:   /chats/:id      (open chat)
 *                /chats/:id/info (info panel)
 */
const useChatOpen = () => {
  const { pathname } = useLocation();
  if (!pathname.startsWith("/chats")) return false;
  const segment = pathname.replace(/^\/chats\/?/, "").split("/")[0];
  return Boolean(segment) && segment !== "new";
};

const MainLayout = () => {
  const chatOpen = useChatOpen();

  return (
    <div className="flex h-screen w-full bg-[#18181c]">
      {/* Desktop sidebar */}
      <aside className="w-64 hidden md:block bg-[#18181c]">
        <Navbar />
      </aside>

      {/*
        Content area.
        - When chat is open on mobile: no padding, no bottom space (navbar is hidden)
        - All other pages: p-4 + pb-20 on mobile so content clears the fixed navbar
      */}
      <main
        className={`flex-1 bg-[#18181c] overflow-y-auto scrollbar-hide
          ${chatOpen ? "p-0" : "p-4 pb-20 md:pb-4"}`}
      >
        <Outlet />
      </main>

      {/* Fixed bottom navbar — hidden when a chat is open on mobile */}
      {!chatOpen && <MobileNavbar />}
    </div>
  );
};

export default MainLayout;