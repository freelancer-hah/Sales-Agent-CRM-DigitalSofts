import React from 'react';
import { NavTab } from './Sidebar';

interface WorkspaceNavProps {
  activeTab: NavTab;
  onNavigate: (tab: NavTab) => void;
  savedCount?: number;
}

// Clean minimal components: returning null removes redundant horizontal sub-tabs from screens
export const LeadWorkspaceNav: React.FC<WorkspaceNavProps> = () => null;
export const OutreachWorkspaceNav: React.FC<WorkspaceNavProps> = () => null;
export const SettingsWorkspaceNav: React.FC<WorkspaceNavProps> = () => null;
