import { useState } from "react";
import { useLocation } from "react-router-dom";
import Navbar from "./Navbar";
import Sidebar from "./Sidebar";
import BackToTop from "./BackToTop";

export default function DashboardLayout({ children }) {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [collapsed, setCollapsed] = useState(
    () => localStorage.getItem('sidebarCollapsed') === 'true'
  );
  const location = useLocation();

  const handleCollapse = () => {
    const next = !collapsed;
    setCollapsed(next);
    localStorage.setItem('sidebarCollapsed', String(next));
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <Navbar
        onToggleSidebar={() => setSidebarOpen(!sidebarOpen)}
        collapsed={collapsed}
        onCollapse={handleCollapse}
      />
      <div className="flex">
        <Sidebar
          open={sidebarOpen}
          onClose={() => setSidebarOpen(false)}
          collapsed={collapsed}
          onCollapse={handleCollapse}
        />
        <main
          key={location.pathname}
          className="flex-1 p-4 sm:p-6 lg:p-8 min-h-[calc(100vh-57px)] animate-slide-up transition-all duration-200"
        >
          {children}
        </main>
      </div>
      <BackToTop />
    </div>
  );
}
