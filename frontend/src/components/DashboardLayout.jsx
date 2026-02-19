import { useState } from "react";
import { useLocation } from "react-router-dom";
import Navbar from "./Navbar";
import Sidebar from "./Sidebar";

export default function DashboardLayout({ children }) {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const location = useLocation();

  return (
    <div className="min-h-screen bg-gray-50">
      <Navbar onToggleSidebar={() => setSidebarOpen(!sidebarOpen)} />
      <div className="flex">
        <Sidebar open={sidebarOpen} onClose={() => setSidebarOpen(false)} />
        <main
          key={location.pathname}
          className="flex-1 p-4 sm:p-6 lg:p-8 min-h-[calc(100vh-57px)] animate-slide-up"
        >
          {children}
        </main>
      </div>
    </div>
  );
}
