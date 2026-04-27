import { useState } from 'react';
import { Outlet } from 'react-router';
import Sidebar from './Sidebar';
import Header from './Header';

export default function Layout() {
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const [mobileSidebarOpen, setMobileSidebarOpen] = useState(false);

  return (
    <div className="clinical-canvas">
      <Sidebar
        collapsed={sidebarCollapsed}
        mobileOpen={mobileSidebarOpen}
        onCollapseChange={setSidebarCollapsed}
        onMobileClose={() => setMobileSidebarOpen(false)}
      />
      <Header
        sidebarCollapsed={sidebarCollapsed}
        onMenuClick={() => setMobileSidebarOpen(true)}
      />
      <main
        className={`min-h-screen pt-[104px] transition-all duration-300 ${
          sidebarCollapsed ? 'lg:pl-[104px]' : 'lg:pl-[304px]'
        }`}
      >
        <div className="px-4 pb-8 sm:px-6 lg:pr-6">
          <Outlet />
        </div>
      </main>
    </div>
  );
}
