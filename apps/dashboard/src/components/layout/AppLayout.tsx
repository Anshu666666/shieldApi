import React, { useState } from 'react';
import { Sidebar } from './Sidebar';
import { Topbar } from './Topbar';
import { ToastContainer } from '../common/ToastContainer';
import { CreateKeyModal } from '../modals/CreateKeyModal';
import { AddServiceModal } from '../modals/AddServiceModal';
import { BlockIpModal } from '../modals/BlockIpModal';
import { RequestDetailDrawer } from '../drawers/RequestDetailDrawer';
import { AnomalyDetailDrawer } from '../drawers/AnomalyDetailDrawer';

interface AppLayoutProps {
  children: React.ReactNode;
}

export const AppLayout: React.FC<AppLayoutProps> = ({ children }) => {
  const [isMobileOpen, setIsMobileOpen] = useState(false);

  return (
    <div className="min-h-screen bg-background text-textPrimary flex flex-col">
      <Sidebar isMobileOpen={isMobileOpen} setIsMobileOpen={setIsMobileOpen} />

      <div className="lg:pl-64 flex flex-col flex-1 min-h-screen">
        <Topbar onMenuClick={() => setIsMobileOpen(true)} />
        <main className="flex-1 p-4 lg:p-6 overflow-y-auto max-w-7xl w-full mx-auto space-y-6">
          {children}
        </main>
      </div>

      {/* Global Modals & Drawers */}
      <CreateKeyModal />
      <AddServiceModal />
      <BlockIpModal />
      <RequestDetailDrawer />
      <AnomalyDetailDrawer />
      <ToastContainer />
    </div>
  );
};
