import {
  LayoutDashboard,
  Sparkles,
  GitCompare,
  Palette,
  FileText,
  Settings,
  Activity,
  Menu,
  X,
  Brain,
} from 'lucide-react';
import { NAV_ITEMS, type PageId } from '@/lib/constants';
import type { QlooStatus } from '@/lib/types';

const ICON_MAP: Record<string, React.ComponentType<{ className?: string }>> = {
  LayoutDashboard,
  Sparkles,
  GitCompare,
  Palette,
  FileText,
  Settings,
};

interface SidebarProps {
  currentPage: PageId;
  onNavigate: (page: PageId) => void;
  qlooStatus: QlooStatus;
  qlooMessage: string;
  mobileOpen: boolean;
  onCloseMobile: () => void;
}

const STATUS_CONFIG: Record<QlooStatus, { color: string; label: string; dot: string }> = {
  connected: { color: 'text-teal-accent-400', label: 'Qloo Connected', dot: 'bg-teal-accent-400' },
  checking: { color: 'text-amber-400', label: 'Checking...', dot: 'bg-amber-400 animate-pulse' },
  'not-configured': { color: 'text-red-400', label: 'API Key Missing', dot: 'bg-red-400' },
  error: { color: 'text-red-400', label: 'Connection Error', dot: 'bg-red-400' },
  disconnected: { color: 'text-midnight-400', label: 'Disconnected', dot: 'bg-midnight-500' },
};

export function Sidebar({
  currentPage,
  onNavigate,
  qlooStatus,
  qlooMessage,
  mobileOpen,
  onCloseMobile,
}: SidebarProps) {
  const statusCfg = STATUS_CONFIG[qlooStatus];

  return (
    <>
      {mobileOpen && (
        <div
          className="fixed inset-0 bg-midnight-950/80 backdrop-blur-sm z-40 lg:hidden"
          onClick={onCloseMobile}
        />
      )}
      <aside
        className={`fixed lg:sticky top-0 left-0 h-screen w-72 bg-midnight-900/95 border-r border-midnight-800 z-50 transition-transform duration-300 flex flex-col ${
          mobileOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'
        }`}
      >
        <div className="flex items-center justify-between p-6 border-b border-midnight-800">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-violet-accent-600 to-teal-accent-600 flex items-center justify-center shadow-lg shadow-violet-accent-500/20">
              <Brain className="w-5 h-5 text-white" />
            </div>
            <div>
              <h1 className="font-display font-bold text-midnight-50 text-lg leading-none">CULTUREPULSE</h1>
              <p className="text-xs text-violet-accent-400 font-medium tracking-wide">AI CULTURAL INTELLIGENCE</p>
            </div>
          </div>
          <button onClick={onCloseMobile} className="lg:hidden btn-ghost p-2">
            <X className="w-5 h-5" />
          </button>
        </div>

        <nav className="flex-1 p-4 space-y-1 overflow-y-auto scrollbar-thin">
          {NAV_ITEMS.map((item) => {
            const Icon = ICON_MAP[item.icon] || Sparkles;
            const isActive = currentPage === item.id;
            return (
              <button
                key={item.id}
                onClick={() => {
                  onNavigate(item.id);
                  onCloseMobile();
                }}
                className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-medium transition-all duration-200 ${
                  isActive
                    ? 'bg-violet-accent-600/15 text-violet-accent-300 border border-violet-accent-500/20'
                    : 'text-midnight-300 hover:text-midnight-100 hover:bg-midnight-800/50 border border-transparent'
                }`}
              >
                <Icon className="w-5 h-5 flex-shrink-0" />
                <span>{item.label}</span>
              </button>
            );
          })}
        </nav>

        <div className="p-4 border-t border-midnight-800">
          <div className="card p-4">
            <div className="flex items-center gap-3 mb-2">
              <div className={`w-2.5 h-2.5 rounded-full ${statusCfg.dot}`} />
              <span className={`text-sm font-medium ${statusCfg.color}`}>{statusCfg.label}</span>
              <Activity className="w-4 h-4 text-midnight-500 ml-auto" />
            </div>
            <p className="text-xs text-midnight-400 leading-relaxed">{qlooMessage}</p>
          </div>
        </div>
      </aside>
    </>
  );
}

export function MobileTopBar({ onOpenMenu }: { onOpenMenu: () => void }) {
  return (
    <div className="lg:hidden sticky top-0 z-30 bg-midnight-900/95 border-b border-midnight-800 px-4 py-3 flex items-center justify-between backdrop-blur-sm">
      <div className="flex items-center gap-2">
        <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-violet-accent-600 to-teal-accent-600 flex items-center justify-center">
          <Brain className="w-4 h-4 text-white" />
        </div>
        <span className="font-display font-bold text-midnight-50 text-sm">CULTUREPULSE</span>
      </div>
      <button onClick={onOpenMenu} className="btn-ghost p-2">
        <Menu className="w-5 h-5" />
      </button>
    </div>
  );
}
