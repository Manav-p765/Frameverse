import Navbar from "./Navbar"
import { Outlet } from "react-router-dom";
import MobileNavbar from "./MobileNavbar";

const MainLayout = ({ }) => {
  return (
    <div className="flex h-screen w-full bg-[#18181c]">
      {/* Navigation */}
      <aside className="w-64 hidden md:block bg-[#18181c]">
        <Navbar />
      </aside>

      {/* Content */}
      <main className="flex-1 min-h-screen bg-[#18181c] overflow-y-auto scrollbar-hide p-4">
        <Outlet />
      </main>
      <MobileNavbar />
    </div>
  );
};

export default MainLayout;