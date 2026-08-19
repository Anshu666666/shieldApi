import React from 'react';
import { useTelemetry } from '../../context/TelemetryContext';
import {
  Shield,
  LayoutDashboard,
  Globe,
  Key,
  Hourglass,
  ShieldAlert,
  FileText,
  Activity,
  Settings,
  Database,
  Radio,
  Cpu,
  ChevronRight
} from 'lucide-react';

interface SidebarProps {
  isMobileOpen: boolean;
  setIsMobileOpen: (open: boolean) => void;
}

export const Sidebar: React.FC<SidebarProps> = ({ isMobileOpen, setIsMobileOpen }) => {
  const { activeTab, setActiveTab, blockedIps, services, apiKeys, metrics } = useTelemetry();

  const navItems = [
    { id: 'overview', label: 'Command Center', icon: <LayoutDashboard className="w-4 h-4" /> },
    {
      id: 'services',
      label: 'API Services',
      icon: <Globe className="w-4 h-4" />,
      badge: services.length.toString()
    },
    {
      id: 'keys',
      label: 'API Keys',
      icon: <Key className="w-4 h-4" />,
      badge: apiKeys.filter(k => k.status === 'ACTIVE').length.toString()
    },
    { id: 'limits', label: 'Rate Limits', icon: <Hourglass className="w-4 h-4" /> },
    {
      id: 'anomalies',
      label: 'Anomaly Center',
      icon: <ShieldAlert className="w-4 h-4" />,
      badge: blockedIps.length > 0 ? blockedIps.length.toString() : undefined,
      badgeColor: 'bg-rose-900/80 text-rose-300 border-rose-700/60'
    },
    { id: 'logs', label: 'Traffic Logs', icon: <FileText className="w-4 h-4" /> },
    { id: 'health', label: 'System Health', icon: <Activity className="w-4 h-4" /> },
    { id: 'settings', label: 'Settings & Sim', icon: <Settings className="w-4 h-4" /> }
  ];

  return (
    <>
      {/* Mobile Backdrop */}
      {isMobileOpen && (
        <div
          className="fixed inset-0 bg-background/80 backdrop-blur-sm z-40 lg:hidden"
          onClick={() => setIsMobileOpen(false)}
        />
      )}

      <aside
        className={`fixed top-0 bottom-0 left-0 z-40 w-64 bg-card border-r border-border flex flex-col transition-transform duration-200 lg:translate-x-0 ${
          isMobileOpen ? 'translate-x-0' : '-translate-x-full'
        }`}
      >
        {/* Brand Header */}
        <div className="h-16 px-5 flex items-center gap-3 border-b border-border">
          <div className="relative flex items-center justify-center w-9 h-9 rounded-lg bg-surface border border-shieldCyan/40 glow-cyan">
            <Shield className="w-5 h-5 text-shieldCyan" />
            <span className="absolute -top-1 -right-1 w-2.5 h-2.5 rounded-full bg-emerald-400 border-2 border-card" />
          </div>
          <div>
            <div className="font-extrabold text-sm tracking-tight text-textPrimary flex items-center gap-1.5">
              <span>SHIELD<span className="text-shieldCyan font-mono">API</span></span>
              <span className="text-[9px] font-mono font-normal px-1.5 py-0.5 rounded bg-surface border border-border text-textSecondary">
                v1.0
              </span>
            </div>
            <div className="text-[10px] text-textSecondary font-mono tracking-wide">
              API GATEWAY & GUARDIAN
            </div>
          </div>
        </div>

        {/* Navigation Items */}
        <nav className="flex-1 overflow-y-auto px-3 py-4 space-y-1">
          <div className="text-[10px] font-mono uppercase text-textMuted px-3 mb-2 tracking-wider">
            Management & Telemetry
          </div>
          {navItems.map(item => {
            const isActive = activeTab === item.id;
            return (
              <button
                key={item.id}
                onClick={() => {
                  setActiveTab(item.id);
                  setIsMobileOpen(false);
                }}
                className={`w-full flex items-center justify-between px-3 py-2 rounded-md text-xs font-medium transition-all duration-150 group cursor-pointer ${
                  isActive
                    ? 'bg-surface text-shieldCyan border border-shieldCyan/30 shadow-xs'
                    : 'text-textSecondary hover:text-textPrimary hover:bg-surface/50'
                }`}
              >
                <div className="flex items-center gap-2.5">
                  <span
                    className={`transition-colors ${
                      isActive ? 'text-shieldCyan' : 'text-textSecondary group-hover:text-textPrimary'
                    }`}
                  >
                    {item.icon}
                  </span>
                  <span>{item.label}</span>
                </div>
                <div className="flex items-center gap-1.5">
                  {item.badge && (
                    <span
                      className={`text-[10px] font-mono px-1.5 py-0.2 rounded border ${
                        item.badgeColor || 'bg-surface border-border text-textSecondary'
                      }`}
                    >
                      {item.badge}
                    </span>
                  )}
                  {isActive && <ChevronRight className="w-3.5 h-3.5 text-shieldCyan" />}
                </div>
              </button>
            );
          })}
        </nav>

        {/* Infrastructure Status Box */}
        <div className="p-3 border-t border-border bg-background/50">
          <div className="text-[10px] font-mono text-textMuted uppercase mb-2 px-1 flex items-center justify-between">
            <span>Cluster Status</span>
            <span className="text-emerald-400 flex items-center gap-1">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" /> 100% HEALTHY
            </span>
          </div>
          <div className="space-y-1.5 text-[11px] font-mono">
            <div className="flex items-center justify-between px-2 py-1 rounded bg-card border border-border/80">
              <span className="text-textSecondary flex items-center gap-1.5">
                <Radio className="w-3 h-3 text-sky-400" /> Gateway Proxy
              </span>
              <span className="text-emerald-400 font-medium">Port 8000</span>
            </div>
            <div className="flex items-center justify-between px-2 py-1 rounded bg-card border border-border/80">
              <span className="text-textSecondary flex items-center gap-1.5">
                <Database className="w-3 h-3 text-rose-400" /> Redis Broker
              </span>
              <span className="text-emerald-400 font-medium">0.8ms PING</span>
            </div>
            <div className="flex items-center justify-between px-2 py-1 rounded bg-card border border-border/80">
              <span className="text-textSecondary flex items-center gap-1.5">
                <Cpu className="w-3 h-3 text-purple-400" /> Anomaly Guardian
              </span>
              <span className="text-emerald-400 font-medium">ACTIVE</span>
            </div>
          </div>
        </div>

        {/* User Footer */}
        <div className="p-3 border-t border-border flex items-center justify-between bg-card">
          <div className="flex items-center gap-2.5">
            <div className="w-7 h-7 rounded bg-surface border border-border flex items-center justify-center font-mono text-xs font-bold text-shieldCyan">
              SA
            </div>
            <div className="overflow-hidden">
              <div className="text-xs font-semibold text-textPrimary truncate">Admin Operator</div>
              <div className="text-[10px] text-textSecondary font-mono truncate">admin@shieldapi.local</div>
            </div>
          </div>
        </div>
      </aside>
    </>
  );
};
