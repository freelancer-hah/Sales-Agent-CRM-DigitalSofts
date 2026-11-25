import React from 'react';
import { Search, RefreshCw } from 'lucide-react';
import { NavTab, getWorkspaceForTab } from './Sidebar';

interface NavbarProps {
  activeTab: NavTab;
  onNavigate: (tab: NavTab) => void;
  dbConnected: boolean;
  geminiConfigured: boolean;
  onRefresh?: () => void;
  isRefreshing?: boolean;
}

const workspaceLabels: Record<string, string> = {
  overview: 'Command Center',
  leads: 'Lead Finder & Companies',
  outreach: 'Outreach & Campaigns',
  inbox: 'Inbox & Sentiment',
  qualifications: 'Qualification & Deals',
  meetings: 'Sales Meetings Hub',
  settings: 'Settings & Agency KB',
};

const titles: Record<NavTab, { title: string; subtitle: string }> = {
  overview: {
    title: 'Dashboard Overview',
    subtitle: 'Unified sales funnel metrics, discovery performance, and booked calls',
  },
  find: {
    title: 'Find Leads & Companies',
    subtitle: 'Discover targeted businesses via Google Maps & SearXNG with JobSpy hiring pain points',
  },
  companies: {
    title: 'All Discovered Companies',
    subtitle: 'Verified company database with contact details, websites, and lead scores',
  },
  'decision-makers': {
    title: 'Executive Decision Makers',
    subtitle: 'Publicly identified founders, C-level executives, and operations leaders',
  },
  'ai-opportunities': {
    title: 'AI Automation Opportunities',
    subtitle: 'Gemini-generated business pain points and tailored Cybells AI solutions',
  },
  saved: {
    title: 'Saved Leads & Prospects',
    subtitle: 'High-priority business leads earmarked for review and qualification',
  },
  history: {
    title: 'Search Job History',
    subtitle: 'Audit log and status of previous multi-source discovery queries',
  },
  settings: {
    title: 'System & Integrations',
    subtitle: 'MongoDB, Gemini API key, Scrapers (SearXNG/GMaps), and Cal.com configuration',
  },
  'lead-management': {
    title: 'Outreach Lead Management',
    subtitle: 'Enroll qualified companies and decision-makers into automated sequences',
  },
  'email-drafts': {
    title: 'Outbound AI Email Drafts',
    subtitle: 'Review, edit, and approve Gemini-crafted outreach messages with Cal.com booking link',
  },
  campaigns: {
    title: 'Campaign Sequences & Engine',
    subtitle: 'Manage multi-step automated sequences, delivery schedules, and sandbox safety',
  },
  inbox: {
    title: 'Inbound Inbox & AI Sentiment',
    subtitle: 'Two-way email sync, AI intent classification, and 1-click meeting booking insertion',
  },
  'cybells-settings': {
    title: 'Cybells Agency Knowledge Base',
    subtitle: 'Agency capabilities, verified case studies, and email transport rules',
  },
  'suppression-list': {
    title: 'Suppression Registry',
    subtitle: 'Manage unsubscribed prospects, hard bounces, and manual exclusions',
  },
  qualifications: {
    title: 'Lead Qualification & Deals Pipeline',
    subtitle: 'Evaluate prospect business systems, compute AI BANT scores, and convert SQLs',
  },
  meetings: {
    title: 'Pipeline & Sales Meetings',
    subtitle: 'Manage booked discovery sessions, closer dossiers, and Cal.com appointments',
  },
};

export const Navbar: React.FC<NavbarProps> = ({
  activeTab,
  onNavigate,
  dbConnected,
  geminiConfigured,
  onRefresh,
  isRefreshing = false,
}) => {
  const current = titles[activeTab] || { title: 'LeadGen AI', subtitle: '' };
  const currentWs = getWorkspaceForTab(activeTab);
  const wsLabel = workspaceLabels[currentWs] || 'Workspace';

  return (
    <header className="bg-card/95 backdrop-blur-md border-b border-border px-6 sm:px-8 py-3.5 shrink-0 z-20 flex items-center justify-between">
      <div>
        <div className="flex items-center gap-1.5 text-[11px] font-semibold text-text-secondary mb-0.5">
          <span>{wsLabel}</span>
          <span className="text-muted">/</span>
          <span className="text-accent font-bold">{current.title}</span>
        </div>
        <h2 className="text-base sm:text-lg font-bold text-text tracking-tight leading-tight">{current.title}</h2>
        <p className="text-xs text-text-secondary mt-0.5 hidden sm:block">{current.subtitle}</p>
      </div>

      <div className="flex items-center gap-2.5 sm:gap-3">
        {/* Refresh button */}
        {onRefresh && (
          <button
            onClick={onRefresh}
            disabled={isRefreshing}
            className="p-2 text-text-secondary hover:text-text hover:bg-card-hover rounded-xl transition-all border border-border shadow-xs"
            title="Refresh data"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${isRefreshing ? 'animate-spin text-accent' : ''}`} />
          </button>
        )}

        {/* Quick CTA */}
        {activeTab !== 'find' && (
          <button
            onClick={() => onNavigate('find')}
            className="flex items-center gap-1.5 px-3 py-1.5 bg-accent hover:bg-accent-hover text-on-accent rounded-xl text-xs font-semibold shadow-xs hover:shadow transition-all shadow-accent/20 active:scale-98"
          >
            <Search className="w-3.5 h-3.5" />
            <span>Discover Leads 📍</span>
          </button>
        )}
      </div>
    </header>
  );
};
