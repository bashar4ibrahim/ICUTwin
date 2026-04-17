import React from 'react';
import SidebarNav from './SidebarNav';
import TopHeader from './TopHeader';

export default function AppShell({
  navGroups,
  activeNavId,
  currentItem,
  groupItems,
  user,
  onNavigate,
  onToggleTheme,
  onOpenSettings,
  onOpenHelp,
  themeMode,
  effectiveTheme,
  sidebarOpen,
  onToggleSidebar,
  onCloseSidebar,
  onLogout,
  children,
}) {
  return (
    <div className="dashboard-shell">
      <div className="dashboard-page-bg" />
      <SidebarNav
        groups={navGroups}
        activeId={activeNavId}
        onNavigate={onNavigate}
        user={user}
        onLogout={onLogout}
        open={sidebarOpen}
        onClose={onCloseSidebar}
      />
      <main className="dashboard-main">
        <div className="dashboard-main__stack">
          <TopHeader
            currentItem={currentItem}
            groupItems={groupItems}
            onNavigate={onNavigate}
            onOpenSettings={onOpenSettings}
            onOpenHelp={onOpenHelp}
            onToggleTheme={onToggleTheme}
            themeMode={themeMode}
            effectiveTheme={effectiveTheme}
            user={user}
            onLogout={onLogout}
            onToggleSidebar={onToggleSidebar}
          />
          <div className="page-transition">{children}</div>
        </div>
      </main>
    </div>
  );
}
