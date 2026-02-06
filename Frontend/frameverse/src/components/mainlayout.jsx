import Navbar from "./Navbar"
import { Outlet } from "react-router-dom";

const MainLayout = ({  }) => {
  return (
    <div className="flex h-screen w-full bg-[#18181c]">
      {/* Navigation */}
      <aside className="w-64 bg-[#18181c]">
        <Navbar />
      </aside>

      {/* Content */}
      <main className="flex-1 min-h-screen bg-[#18181c] overflow-y-auto p-4">
        <Outlet/>
      </main>
    </div>
  );
};

export default MainLayout;