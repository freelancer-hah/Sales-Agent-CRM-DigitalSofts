import React from 'react';
import {
  LayoutDashboard,
  Search,
  Mail,
  MessageSquare,
  Kanban,
  Calendar,
  Settings,
  Bot,
} from 'lucide-react';

export type NavTab =
  | 'overview'
  | 'find'
  | 'companies'
  | 'decision-makers'
  | 'ai-opportunities'
  | 'saved'
  | 'history'
  | 'settings'
  | 'lead-management'
  | 'email-drafts'
  | 'campaigns'
  | 'inbox'
  | 'cybells-settings'
  | 'suppression-list'
  | 'qualifications'
  | 'meetings';

interface SidebarProps {
  activeTab: NavTab;
  onSelectTab: (tab: NavTab) => void;
  savedCount?: number;
}

export type WorkspaceId =
  | 'overview'
  | 'leads'
  | 'outreach'
  | 'inbox'
  | 'qualifications'
  | 'meetings'
  | 'settings';

export const getWorkspaceForTab = (tab: NavTab): WorkspaceId => {
  switch (tab) {
    case 'overview':
      return 'overview';
    case 'find':
    case 'companies':
    case 'decision-makers':
    case 'ai-opportunities':
    case 'saved':
    case 'history':
      return 'leads';
    case 'campaigns':
    case 'email-drafts':
    case 'lead-management':
      return 'outreach';
    case 'inbox':
      return 'inbox';
    case 'qualifications':
      return 'qualifications';
    case 'meetings':
      return 'meetings';
    case 'settings':
    case 'cybells-settings':
    case 'suppression-list':
      return 'settings';
    default:
      return 'overview';
  }
};

export const Sidebar: React.FC<SidebarProps> = ({
  activeTab,
  onSelectTab,
  savedCount = 0,
}) => {
  const navItems: {
    id: NavTab;
    label: string;
    icon: React.ElementType;
    badge?: number;
    matchTabs: NavTab[];
  }[] = [
    {
      id: 'overview',
      label: 'Dashboard',
      icon: LayoutDashboard,
      matchTabs: ['overview'],
    },
    {
      id: 'find',
      label: 'Find Leads 📍',
      icon: Search,
      badge: savedCount > 0 ? savedCount : undefined,
      matchTabs: ['find', 'companies', 'saved', 'decision-makers', 'ai-opportunities', 'history'],
    },
    {
      id: 'email-drafts',
      label: 'Outbound & Drafts',
      icon: Mail,
      matchTabs: ['email-drafts', 'campaigns', 'lead-management'],
    },
    {
      id: 'inbox',
      label: 'Inbound Inbox',
      icon: MessageSquare,
      matchTabs: ['inbox'],
    },
    {
      id: 'qualifications',
      label: 'Kanban Pipeline',
      icon: Kanban,
      matchTabs: ['qualifications'],
    },
    {
      id: 'meetings',
      label: 'Sales Meetings',
      icon: Calendar,
      matchTabs: ['meetings'],
    },
    {
      id: 'settings',
      label: 'Settings',
      icon: Settings,
      matchTabs: ['settings', 'cybells-settings', 'suppression-list'],
    },
  ];

  return (
    <aside className="w-[230px] bg-sidebar text-text-secondary flex flex-col shrink-0 h-screen border-r border-border select-none">
      {/* Brand Header */}
      <div className="p-4 border-b border-border flex items-center gap-2.5">
        <div className="w-8 h-8 rounded-xl bg-accent text-white flex items-center justify-center shadow-sm shadow-accent/25 shrink-0">
          <Bot size={18} />
        </div>
        <div className="min-w-0 flex-1">
          <div className="font-bold text-sm text-text tracking-tight leading-none truncate">
            Cybells AI
          </div>
          <div className="text-[10px] text-accent font-semibold tracking-wider uppercase mt-1 truncate">
            Autonomous SDR Agent
          </div>
        </div>
      </div>

      {/* Navigation Links */}
      <nav className="flex-1 p-3 space-y-1.5 overflow-y-auto">
        <div className="text-[10px] font-bold text-muted uppercase tracking-wider px-2.5 py-1">
          Main Menu
        </div>

        {navItems.map((item) => {
          const Icon = item.icon;
          const isActive = item.matchTabs.includes(activeTab);

          return (
            <button
              key={item.id}
              type="button"
              onClick={() => onSelectTab(item.id)}
              className={`w-full flex items-center justify-between px-3 py-2.5 rounded-xl text-xs font-medium transition-all cursor-pointer ${
                isActive
                  ? 'bg-accent text-on-accent font-bold shadow-sm shadow-accent/20'
                  : 'text-text-secondary hover:text-text hover:bg-black/[0.03]'
              }`}
            >
              <div className="flex items-center gap-2.5 min-w-0">
                <Icon
                  size={16}
                  className={isActive ? 'text-on-accent' : 'text-muted'}
                />
                <span className="truncate">{item.label}</span>
              </div>

              {item.badge !== undefined && item.badge > 0 && (
                <span
                  className={`text-[10px] px-2 py-0.5 rounded-full font-bold font-mono ${
                    isActive
                      ? 'bg-white/20 text-on-accent'
                      : 'bg-black/[0.04] text-text-secondary'
                  }`}
                >
                  {item.badge}
                </span>
              )}
            </button>
          );
        })}
      </nav>
    </aside>
  );
};
