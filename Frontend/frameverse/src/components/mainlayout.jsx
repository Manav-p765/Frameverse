import Navbar from "./Navbar";
import MobileNavbar from "./MobileNavbar";
import MobileTopNavbar from "./MobileTopNavbar";
import { Outlet, useLocation } from "react-router-dom";
import AnimatedLogo from "./AnimatedLogo";

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

const useIsChatsPage = () => {
  const { pathname } = useLocation();
  return pathname.startsWith("/chats");
};

const MainLayout = () => {
  const chatOpen = useChatOpen();
  const isChatsPage = useIsChatsPage();

  return (
    <div className="flex h-screen w-full bg-bg-primary overflow-hidden">
      {/* Desktop sidebar — on chat page: fixed overlay so it doesn't push content.
          On other pages: normal flow with w-18 reserved space. */}
      {isChatsPage ? (
        <div className="hidden md:block relative shrink-0">
          <div className="fixed top-0 left-0 h-screen z-40">
            <Navbar />
          </div>
          <div className="w-18" />
        </div>
      ) : (
        <aside className="hidden md:block bg-bg-primary relative z-40 transition-all duration-300 w-[76px]">
          <Navbar />
        </aside>
      )}

      {/* Global Logo - Pinned to Top Left on Desktop */}
      <div className="hidden md:block fixed top-6 left-6 z-50 pointer-events-none">
        <AnimatedLogo className="w-40" />
      </div>

      {/*
        Content area.
        - Mobile: pt-14 to clear the fixed top navbar (except when chat is open)
        - When chat is open on mobile: no padding (full screen chat)
        - Chat page on desktop: no padding (Chats.jsx is full-screen)
        - All other pages: p-4 + pb-20 on mobile so content clears the fixed navbar
      */}
      <main
        className={`flex-1 min-h-0 bg-bg-primary flex flex-col scrollbar-hide
          ${isChatsPage ? "overflow-hidden" : "overflow-y-auto"}
          ${chatOpen ? "" : isChatsPage ? "pt-14 pb-[56px] md:pt-0 md:pb-0" : "pt-14 pb-20 md:pt-0 md:p-4 md:pb-4"}
        `}
      >
        <Outlet />
      </main>

      {/* Fixed top navbar — mobile only, hidden when a chat is open */}
      {!chatOpen && <MobileTopNavbar />}

      {/* Fixed bottom navbar — hidden when a chat is open on mobile */}
      {!chatOpen && <MobileNavbar />}
    </div>
  );
};

export default MainLayout;