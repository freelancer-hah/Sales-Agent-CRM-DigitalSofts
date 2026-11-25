import React, { useState, useEffect } from 'react';
import {
  UserCheck,
  Search,
  Sparkles,
  CheckCircle2,
  XCircle,
  HelpCircle,
  Clock,
  ShieldCheck,
  Building2,
  Mail,
  RefreshCw,
  Sliders,
  Send,
  AlertTriangle,
  Award,
  ChevronRight,
  X,
  FileText,
  Database,
  ArrowRight,
  TrendingUp,
  Download,
  Share2,
  Calendar,
  Plus,
  Video,
  Kanban,
  List,
} from 'lucide-react';
import { api } from '../services/api';
import { ILeadQualification } from '../types';

interface QualificationDashboardProps {
  onNavigateToMeetings?: () => void;
}

export const QualificationDashboard: React.FC<QualificationDashboardProps> = ({ onNavigateToMeetings }) => {
  const [qualifications, setQualifications] = useState<ILeadQualification[]>([]);
  const [stats, setStats] = useState<any>({
    total: 0,
    inProgress: 0,
    awaitingInfo: 0,
    readyForReview: 0,
    qualified: 0,
    disqualified: 0,
    highPotential: 0,
  });
  const [loading, setLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState('all');
  const [viewMode, setViewMode] = useState<'kanban' | 'table'>('kanban');
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedLeadId, setSelectedLeadId] = useState<string | null>(null);
  const [activeDetail, setActiveDetail] = useState<{
    qualification: ILeadQualification | null;
    questions: any[];
    activities: any[];
  }>({
    qualification: null,
    questions: [],
    activities: [],
  });
  const [detailLoading, setDetailLoading] = useState(false);
  const [actionLoading, setActionLoading] = useState(false);
  const [feedbackMsg, setFeedbackMsg] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  // Review Form States
  const [reviewDecision, setReviewDecision] = useState<'approved_qualified' | 'disqualified' | 'more_info_needed'>('approved_qualified');
  const [reviewerNotes, setReviewerNotes] = useState('');
  const [reviewerName, setReviewerName] = useState('Hafiz (Sales Team)');
  const [manualScoreOverride, setManualScoreOverride] = useState<number | ''>('');
  const [disqualificationReason, setDisqualificationReason] = useState('');

  // AI Contextual Tool States
  const [inboundReplyText, setInboundReplyText] = useState('');
  const [questionCategory, setQuestionCategory] = useState('current_systems');
  const [assignedAE, setAssignedAE] = useState('Account Executive');

  // Manual Enrollment State
  const [enrollModalOpen, setEnrollModalOpen] = useState(false);
  const [enrollContacts, setEnrollContacts] = useState<any[]>([]);
  const [enrollLoading, setEnrollLoading] = useState(false);
  const [selectedContactToEnroll, setSelectedContactToEnroll] = useState('');

  // Book Meeting Modal State
  const [bookMeetingModalOpen, setBookMeetingModalOpen] = useState(false);
  const [targetQualForMeeting, setTargetQualForMeeting] = useState<any>(null);
  const [meetingStartTime, setMeetingStartTime] = useState('');
  const [meetingDuration, setMeetingDuration] = useState(30);
  const [meetingTitle, setMeetingTitle] = useState('');
  const [meetingCloser, setMeetingCloser] = useState('Hafiz (Sales Closer)');
  const [aiTimePrompt, setAiTimePrompt] = useState('');
  const [aiTimeLoading, setAiTimeLoading] = useState(false);
  const [aiTimeFeedback, setAiTimeFeedback] = useState<{ type: 'success' | 'warn' | 'error'; text: string } | null>(null);

  useEffect(() => {
    loadQualifications();
  }, [statusFilter]);

  const loadQualifications = async () => {
    try {
      setLoading(true);
      const res = await api.getQualifications({
        status: statusFilter !== 'all' ? statusFilter : undefined,
        search: searchQuery.trim() || undefined,
        limit: 50,
      });

      if (res.success && res.data) {
        setQualifications(res.data.qualifications || []);
        if (res.data.stats) {
          setStats(res.data.stats);
        }
      }
    } catch (err: any) {
      setFeedbackMsg({ type: 'error', text: err.message || 'Failed to load qualifications' });
    } finally {
      setLoading(false);
    }
  };

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    loadQualifications();
  };

  const handleOpenEnrollModal = async () => {
    setEnrollModalOpen(true);
    setEnrollLoading(true);
    try {
      const res = await api.getOutreachContacts({ limit: 50 });
      if (res.success && res.data) {
        setEnrollContacts(res.data.contacts || res.data || []);
      }
    } catch (err: any) {
      setFeedbackMsg({ type: 'error', text: err.message || 'Failed to load outreach contacts' });
    } finally {
      setEnrollLoading(false);
    }
  };

  const handleEnrollSubmit = async () => {
    if (!selectedContactToEnroll) {
      setFeedbackMsg({ type: 'error', text: 'Please select an outreach contact to enroll.' });
      return;
    }
    setActionLoading(true);
    try {
      const res = await api.startQualification({
        contactId: selectedContactToEnroll,
        allowManual: true,
        sourceType: 'manual',
      });
      if (res.success) {
        setFeedbackMsg({ type: 'success', text: 'Prospect enrolled into Lead Qualification pipeline successfully!' });
        setEnrollModalOpen(false);
        setSelectedContactToEnroll('');
        await loadQualifications();
      }
    } catch (err: any) {
      setFeedbackMsg({ type: 'error', text: err.message || 'Failed to enroll contact' });
    } finally {
      setActionLoading(false);
    }
  };

  const getTomorrowDefaultIsoString = () => {
    const d = new Date();
    d.setDate(d.getDate() + 1);
    d.setHours(15, 0, 0, 0);
    const pad = (n: number) => n.toString().padStart(2, '0');
    return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`;
  };

  const handleOpenBookMeetingModal = async (qual: any) => {
    if (!qual) return;
    setTargetQualForMeeting(qual);
    const compName = qual.companyId?.companyName || 'Target Company';
    const compId = typeof qual.companyId === 'object' ? qual.companyId?._id : qual.companyId;
    const contId = typeof qual.contactId === 'object' ? qual.contactId?._id : qual.contactId;

    setMeetingTitle(`Cybells AI Automation Discovery — ${compName}`);
    setMeetingStartTime(getTomorrowDefaultIsoString());
    setMeetingDuration(30);
    setMeetingCloser('Hafiz (Sales Closer)');
    setAiTimePrompt('');
    setAiTimeFeedback(null);
    setBookMeetingModalOpen(true);

    // AUTO-LOAD: Query prospect's latest inbound reply from DB & parse time automatically!
    if (contId || compId) {
      setAiTimeLoading(true);
      try {
        const res = await api.parseMeetingSlots({ contactId: contId, companyId: compId });
        if (res.success && res.data) {
          const data = res.data;
          if (data.sourceMessage) {
            setAiTimePrompt(data.sourceMessage);
          }
          if (data.parsedDateTime) {
            const d = new Date(data.parsedDateTime);
            const pad = (n: number) => n.toString().padStart(2, '0');
            const formattedLocal = `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`;
            setMeetingStartTime(formattedLocal);
            if (data.durationMinutes) {
              setMeetingDuration(data.durationMinutes);
            }
            if (data.isSlotAvailable === false) {
              setAiTimeFeedback({
                type: 'warn',
                text: `Auto-loaded from prospect's email: ${d.toLocaleString()} (Note: Host has a conflict: ${data.conflictReason || 'slot unavailable'})`,
              });
            } else {
              setAiTimeFeedback({
                type: 'success',
                text: `✨ Auto-detected from client's latest reply: ${d.toLocaleString()} (${data.durationMinutes || 30} mins) — Host free & auto-filled below!`,
              });
            }
          } else if (data.sourceMessage) {
            setAiTimeFeedback({
              type: 'warn',
              text: `Auto-loaded prospect's latest reply, but no specific date/time was stated. Default set to tomorrow 3:00 PM (feel free to adjust below).`,
            });
          }
        }
      } catch {
        // Fallback gracefully
      } finally {
        setAiTimeLoading(false);
      }
    }
  };

  const handleExtractTimeWithGemini = async () => {
    if (!aiTimePrompt.trim()) return;
    setAiTimeLoading(true);
    setAiTimeFeedback(null);
    try {
      const compId = typeof targetQualForMeeting?.companyId === 'object' ? targetQualForMeeting?.companyId?._id : targetQualForMeeting?.companyId;
      const contId = typeof targetQualForMeeting?.contactId === 'object' ? targetQualForMeeting?.contactId?._id : targetQualForMeeting?.contactId;
      const res = await api.parseMeetingSlots({ messageText: aiTimePrompt, contactId: contId, companyId: compId });
      if (res.success && res.data) {
        const data = res.data;
        if (data.parsedDateTime) {
          const d = new Date(data.parsedDateTime);
          const pad = (n: number) => n.toString().padStart(2, '0');
          const formattedLocal = `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`;
          setMeetingStartTime(formattedLocal);
          if (data.durationMinutes) {
            setMeetingDuration(data.durationMinutes);
          }
          if (data.isSlotAvailable === false) {
            setAiTimeFeedback({
              type: 'warn',
              text: `Detected: ${d.toLocaleString()} (Note: Host is outside business hours or has a calendar conflict: ${data.conflictReason || 'overlap'})`,
            });
          } else {
            setAiTimeFeedback({
              type: 'success',
              text: `✨ Successfully extracted: ${d.toLocaleString()} (${data.durationMinutes || 30} mins) — Host free & verified!`,
            });
          }
        } else {
          setAiTimeFeedback({
            type: 'error',
            text: data.notes || 'No specific date or time detected in this snippet. Please specify or pick manually below.',
          });
        }
      }
    } catch (err: any) {
      setAiTimeFeedback({
        type: 'error',
        text: err.message || 'Failed to extract meeting time with AI',
      });
    } finally {
      setAiTimeLoading(false);
    }
  };

  const handleConfirmBookMeeting = async () => {
    if (!targetQualForMeeting || !meetingStartTime) {
      setFeedbackMsg({ type: 'error', text: 'Please select a meeting start time.' });
      return;
    }
    const compId =
      typeof targetQualForMeeting.companyId === 'object'
        ? targetQualForMeeting.companyId?._id
        : targetQualForMeeting.companyId;
    const contId =
      typeof targetQualForMeeting.contactId === 'object'
        ? targetQualForMeeting.contactId?._id
        : targetQualForMeeting.contactId;

    if (!compId || !contId) {
      setFeedbackMsg({ type: 'error', text: 'Missing company or contact reference for booking.' });
      return;
    }

    setActionLoading(true);
    try {
      const res = await api.createMeeting({
        companyId: compId,
        contactId: contId,
        qualificationId: targetQualForMeeting._id,
        startTime: new Date(meetingStartTime).toISOString(),
        durationMinutes: meetingDuration,
        title: meetingTitle,
        assignedAE: meetingCloser,
        force: true,
      });

      if (res.success) {
        setBookMeetingModalOpen(false);
        setFeedbackMsg({
          type: 'success',
          text: 'Sales discovery meeting confirmed! Google Meet link and calendar invite generated. Redirecting to Meetings Hub...',
        });
        if (onNavigateToMeetings) {
          setTimeout(onNavigateToMeetings, 700);
        }
      }
    } catch (err: any) {
      setFeedbackMsg({ type: 'error', text: err.message || 'Failed to book sales meeting' });
    } finally {
      setActionLoading(false);
    }
  };

  const openLeadDetail = async (id: string) => {
    setSelectedLeadId(id);
    setDetailLoading(true);
    setFeedbackMsg(null);
    try {
      const res = await api.getQualificationById(id);
      if (res.success && res.data) {
        setActiveDetail({
          qualification: res.data.qualification,
          questions: res.data.questions || [],
          activities: res.data.activities || [],
        });
        setManualScoreOverride(res.data.qualification.qualificationScore || '');
        setReviewerNotes(res.data.qualification.humanReview?.reviewerNotes || '');
      }
    } catch (err: any) {
      setFeedbackMsg({ type: 'error', text: err.message || 'Failed to load lead details' });
    } finally {
      setDetailLoading(false);
    }
  };

  const closeDetail = () => {
    setSelectedLeadId(null);
    setActiveDetail({ qualification: null, questions: [], activities: [] });
    setFeedbackMsg(null);
  };

  // 1. Trigger AI Scoring
  const handleScoreWithAI = async () => {
    if (!selectedLeadId) return;
    setActionLoading(true);
    setFeedbackMsg(null);
    try {
      const res = await api.scoreQualification(selectedLeadId);
      if (res.success) {
        setFeedbackMsg({ type: 'success', text: `Score updated: ${res.data.scoringResult.qualificationScore}/100 with recommendation "${res.data.scoringResult.aiRecommendation}".` });
        await openLeadDetail(selectedLeadId);
        loadQualifications();
      }
    } catch (err: any) {
      setFeedbackMsg({ type: 'error', text: err.message || 'Failed to score qualification' });
    } finally {
      setActionLoading(false);
    }
  };

  // 2. Submit Human Review Decision
  const handleSubmitReview = async () => {
    if (!selectedLeadId) return;
    setActionLoading(true);
    setFeedbackMsg(null);
    try {
      const res = await api.submitQualificationReview(selectedLeadId, {
        decision: reviewDecision,
        reviewerNotes,
        reviewerName,
        manualScore: typeof manualScoreOverride === 'number' ? manualScoreOverride : undefined,
        disqualificationReason: reviewDecision === 'disqualified' ? (disqualificationReason || reviewerNotes) : undefined,
      });

      if (res.success) {
        setFeedbackMsg({ type: 'success', text: `Decision recorded: Status updated to "${res.data.qualificationStatus}".` });
        await openLeadDetail(selectedLeadId);
        loadQualifications();
      }
    } catch (err: any) {
      setFeedbackMsg({ type: 'error', text: err.message || 'Failed to submit review' });
    } finally {
      setActionLoading(false);
    }
  };

  // 3. Extract Facts from Inbound Message
  const handleExtractFromMessage = async () => {
    if (!selectedLeadId || !inboundReplyText.trim()) return;
    setActionLoading(true);
    setFeedbackMsg(null);
    try {
      const res = await api.extractQualificationInfo(selectedLeadId, {
        messageText: inboundReplyText,
        sourceChannel: 'email',
      });

      if (res.success) {
        setFeedbackMsg({ type: 'success', text: 'Information extracted and merged into lead profile.' });
        setInboundReplyText('');
        await openLeadDetail(selectedLeadId);
        loadQualifications();
      }
    } catch (err: any) {
      setFeedbackMsg({ type: 'error', text: err.message || 'Extraction failed' });
    } finally {
      setActionLoading(false);
    }
  };

  // 4. Generate Next Contextual Question
  const handleGenerateQuestion = async () => {
    if (!selectedLeadId) return;
    setActionLoading(true);
    setFeedbackMsg(null);
    try {
      const res = await api.generateQualificationQuestion(selectedLeadId, {
        focusCategory: questionCategory,
      });

      if (res.success) {
        setFeedbackMsg({ type: 'success', text: `Generated question: "${res.data.question}"` });
        await openLeadDetail(selectedLeadId);
      }
    } catch (err: any) {
      setFeedbackMsg({ type: 'error', text: err.message || 'Failed to generate question' });
    } finally {
      setActionLoading(false);
    }
  };

  // 5. Hand Off to Sales Team
  const handleHandoffToSales = async () => {
    if (!selectedLeadId) return;
    setActionLoading(true);
    setFeedbackMsg(null);
    try {
      const res = await api.handoffQualification(selectedLeadId, {
        assignedSalesAgent: assignedAE || 'Account Executive',
        actorName: 'Sales Lead',
      });

      if (res.success) {
        setFeedbackMsg({
          type: 'success',
          text: `Lead handed off to ${res.data.assignedSalesAgent}. Dossier generated (${res.data.handoffId}).`,
        });
        await openLeadDetail(selectedLeadId);
        loadQualifications();
      }
    } catch (err: any) {
      setFeedbackMsg({ type: 'error', text: err.message || 'Failed to hand off lead' });
    } finally {
      setActionLoading(false);
    }
  };

  // Helpers for Status & Score Badges
  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'qualified':
        return <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-emerald-100 text-emerald-800 border border-emerald-200"><CheckCircle2 className="w-3.5 h-3.5" /> Qualified (SQL)</span>;
      case 'ready_for_review':
        return <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-indigo-100 text-indigo-800 border border-indigo-200"><Award className="w-3.5 h-3.5" /> Ready for Review</span>;
      case 'awaiting_information':
        return <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-amber-100 text-amber-800 border border-amber-200"><Clock className="w-3.5 h-3.5" /> Awaiting Info</span>;
      case 'in_progress':
        return <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-blue-100 text-blue-800 border border-blue-200"><RefreshCw className="w-3.5 h-3.5 animate-spin" /> In Discovery</span>;
      case 'disqualified':
        return <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-rose-100 text-rose-800 border border-rose-200"><XCircle className="w-3.5 h-3.5" /> Disqualified</span>;
      default:
        return <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-medium bg-slate-100 text-slate-700">{status}</span>;
    }
  };

  const getRecommendationBadge = (rec: string) => {
    switch (rec) {
      case 'potentially_qualified':
        return <span className="px-2 py-0.5 rounded text-[11px] font-semibold bg-emerald-50 text-emerald-700 border border-emerald-300">Potentially Qualified</span>;
      case 'needs_more_info':
        return <span className="px-2 py-0.5 rounded text-[11px] font-semibold bg-amber-50 text-amber-700 border border-amber-300">Needs More Info</span>;
      case 'not_qualified':
        return <span className="px-2 py-0.5 rounded text-[11px] font-semibold bg-rose-50 text-rose-700 border border-rose-300">Not Qualified</span>;
      default:
        return <span className="px-2 py-0.5 rounded text-[11px] font-medium bg-slate-100 text-slate-600">Pending Evaluation</span>;
    }
  };

  const getScoreColor = (score: number) => {
    if (score >= 70) return 'text-emerald-600 bg-emerald-50 border-emerald-200';
    if (score >= 40) return 'text-amber-600 bg-amber-50 border-amber-200';
    return 'text-rose-600 bg-rose-50 border-rose-200';
  };

  return (
    <div className="p-8 max-w-7xl mx-auto space-y-6">
      {/* Top Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-slate-200 pb-6">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="px-2 py-0.5 text-xs font-semibold bg-emerald-100 text-emerald-800 rounded">Phase 3</span>
            <span className="text-xs text-slate-500 font-medium">Production AI Engine</span>
          </div>
          <h1 className="text-2xl font-bold text-slate-900 tracking-tight flex items-center gap-2.5">
            <UserCheck className="w-7 h-7 text-emerald-600" />
            AI-Powered Lead Qualification Pipeline
          </h1>
          <p className="text-sm text-slate-600 mt-1">
            Convert engaged prospects into Sales Qualified Leads (SQL) through structured B2B discovery, multi-dimensional scoring, and human validation.
          </p>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={handleOpenEnrollModal}
            className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-accent hover:bg-accent-hover text-on-accent text-xs font-semibold transition shadow-xs shadow-accent/20 active:scale-98"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>+ Enroll Prospect</span>
          </button>
          <a
            href={api.getQualificationsExportCsvUrl({ status: statusFilter !== 'all' ? statusFilter : undefined })}
            download="cybells_qualified_leads.csv"
            className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-card border border-border text-text text-xs font-semibold hover:bg-card-hover transition shadow-2xs"
          >
            <Download className="w-3.5 h-3.5 text-muted" />
            Download CSV
          </a>
          <button
            onClick={loadQualifications}
            disabled={loading}
            className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-card border border-border text-text text-xs font-semibold hover:bg-card-hover transition shadow-2xs"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} />
            Refresh
          </button>
        </div>
      </div>

      {/* Pipeline Metric Cards */}
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3.5">
        <div className="bg-card p-4 rounded-2xl border border-border shadow-xs hover:border-[#D6CEBE] hover:shadow-md transition-all flex flex-col justify-between">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold uppercase tracking-wider text-muted">Total Leads</span>
            <span className="w-2 h-2 rounded-full bg-muted" />
          </div>
          <p className="text-2xl font-bold text-text tabular-nums mt-2">{stats.total || 0}</p>
        </div>

        <div className="bg-card p-4 rounded-2xl border border-border shadow-xs hover:border-[#D6CEBE] hover:shadow-md transition-all flex flex-col justify-between">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold uppercase tracking-wider text-accent">In Discovery</span>
            <span className="w-2 h-2 rounded-full bg-accent animate-pulse" />
          </div>
          <p className="text-2xl font-bold text-accent tabular-nums mt-2">{stats.inProgress || 0}</p>
        </div>

        <div className="bg-card p-4 rounded-2xl border border-border shadow-xs hover:border-[#D6CEBE] hover:shadow-md transition-all flex flex-col justify-between">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold uppercase tracking-wider text-amber-700">Awaiting Info</span>
            <span className="w-2 h-2 rounded-full bg-amber-500" />
          </div>
          <p className="text-2xl font-bold text-amber-700 tabular-nums mt-2">{stats.awaitingInfo || 0}</p>
        </div>

        <div className="bg-card p-4 rounded-2xl border border-border shadow-xs hover:border-[#D6CEBE] hover:shadow-md transition-all flex flex-col justify-between">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold uppercase tracking-wider text-accent-mid">Ready for Review</span>
            <span className="w-2 h-2 rounded-full bg-accent-mid animate-pulse" />
          </div>
          <p className="text-2xl font-bold text-accent-mid tabular-nums mt-2">{stats.readyForReview || 0}</p>
        </div>

        <div className="bg-card p-4 rounded-2xl border border-emerald-200 bg-emerald-50/20 shadow-xs hover:border-emerald-300 hover:shadow-md transition-all flex flex-col justify-between">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold uppercase tracking-wider text-emerald-700">Qualified (SQL)</span>
            <span className="w-2 h-2 rounded-full bg-emerald-500" />
          </div>
          <p className="text-2xl font-extrabold text-emerald-800 tabular-nums mt-2">{stats.qualified || 0}</p>
        </div>

        <div className="bg-card p-4 rounded-2xl border border-border shadow-xs hover:border-[#D6CEBE] hover:shadow-md transition-all flex flex-col justify-between">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold uppercase tracking-wider text-accent">Score &ge; 75</span>
            <Sparkles className="w-3.5 h-3.5 text-accent" />
          </div>
          <p className="text-2xl font-bold text-accent tabular-nums mt-2">{stats.highPotential || 0}</p>
        </div>
      </div>

      {/* Filter, View Switcher and Search Bar */}
      <div className="bg-card p-4 rounded-2xl border border-border shadow-xs flex flex-col md:flex-row items-center justify-between gap-4">
        {/* Status Tabs */}
        <div className="flex flex-wrap gap-1.5 w-full md:w-auto">
          {[
            { id: 'all', label: 'All' },
            { id: 'in_progress', label: 'In Discovery' },
            { id: 'awaiting_information', label: 'Awaiting Info' },
            { id: 'ready_for_review', label: 'Ready for Review' },
            { id: 'qualified', label: 'Qualified' },
            { id: 'disqualified', label: 'Disqualified' },
          ].map((tab) => (
            <button
              key={tab.id}
              onClick={() => setStatusFilter(tab.id)}
              className={`px-3 py-1.5 rounded-xl text-xs font-semibold transition-all ${statusFilter === tab.id
                ? 'bg-accent text-on-accent shadow-xs shadow-accent/20'
                : 'text-text-secondary hover:text-text hover:bg-card-hover'
                }`}
            >
              {tab.label}
            </button>
          ))}
        </div>

        <div className="flex items-center gap-3 w-full md:w-auto justify-end">
          {/* Kanban / Table View Switcher */}
          <div className="flex items-center bg-track/70 p-1 rounded-xl border border-border shrink-0">
            <button
              type="button"
              onClick={() => setViewMode('kanban')}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition ${
                viewMode === 'kanban'
                  ? 'bg-card text-accent font-bold shadow-xs border border-border'
                  : 'text-text-secondary hover:text-text'
              }`}
            >
              <Kanban className="w-3.5 h-3.5" />
              <span>Kanban</span>
            </button>
            <button
              type="button"
              onClick={() => setViewMode('table')}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition ${
                viewMode === 'table'
                  ? 'bg-card text-accent font-bold shadow-xs border border-border'
                  : 'text-text-secondary hover:text-text'
              }`}
            >
              <List className="w-3.5 h-3.5" />
              <span>Table</span>
            </button>
          </div>

          {/* Search Bar */}
          <form onSubmit={handleSearchSubmit} className="flex items-center gap-2 w-full md:w-64">
            <div className="relative flex-1">
              <Search className="w-4 h-4 absolute left-3 top-2.5 text-slate-400" />
              <input
                type="text"
                placeholder="Search leads..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-9 pr-3 py-1.5 text-xs rounded-lg border border-slate-300 focus:outline-none focus:ring-2 focus:ring-emerald-500"
              />
            </div>
          </form>
        </div>
      </div>

      {/* Qualifications Content: Kanban View or Table View */}
      {viewMode === 'kanban' ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 items-start">
          {[
            {
              id: 'in_progress',
              title: 'In Discovery',
              accentColor: 'border-t-blue-500',
              badgeClass: 'bg-blue-50 text-blue-700 border-blue-200',
              status: 'in_progress',
            },
            {
              id: 'awaiting_information',
              title: 'Awaiting Info',
              accentColor: 'border-t-amber-500',
              badgeClass: 'bg-amber-50 text-amber-700 border-amber-200',
              status: 'awaiting_information',
            },
            {
              id: 'ready_for_review',
              title: 'Ready for Review',
              accentColor: 'border-t-purple-500',
              badgeClass: 'bg-purple-50 text-purple-700 border-purple-200',
              status: 'ready_for_review',
            },
            {
              id: 'qualified',
              title: 'Qualified (SQL)',
              accentColor: 'border-t-emerald-500',
              badgeClass: 'bg-emerald-50 text-emerald-700 border-emerald-200',
              status: 'qualified',
            },
          ].map((col) => {
            const columnLeads = qualifications.filter((q) => q.qualificationStatus === col.status);

            return (
              <div
                key={col.id}
                className={`bg-surface rounded-2xl border border-border border-t-4 ${col.accentColor} p-3.5 shadow-2xs flex flex-col space-y-3 min-h-[320px]`}
              >
                {/* Column Header */}
                <div className="flex items-center justify-between pb-2 border-b border-border">
                  <div className="flex items-center gap-2">
                    <span className="font-bold text-xs text-text">{col.title}</span>
                  </div>
                  <span className={`text-[11px] font-bold px-2 py-0.5 rounded-full border ${col.badgeClass}`}>
                    {columnLeads.length}
                  </span>
                </div>

                {/* Column Cards */}
                <div className="space-y-2.5 flex-1">
                  {columnLeads.length === 0 ? (
                    <div className="py-12 text-center text-muted text-xs">
                      No leads in this stage
                    </div>
                  ) : (
                    columnLeads.map((q) => {
                      const company = q.companyId || {};
                      const contact = q.contactId || {};

                      return (
                        <div
                          key={q._id}
                          onClick={() => openLeadDetail(q._id)}
                          className="bg-card p-3.5 rounded-xl border border-border hover:border-accent hover:shadow-sm transition-all cursor-pointer space-y-2.5 group"
                        >
                          <div className="flex items-start justify-between gap-1.5">
                            <div className="min-w-0">
                              <h4 className="font-bold text-text text-xs truncate group-hover:text-accent transition-colors">
                                {company.companyName || 'Unknown Company'}
                              </h4>
                              <p className="text-[10px] text-text-secondary truncate mt-0.5">
                                {company.industry || company.city || 'Lead Target'}
                              </p>
                            </div>
                            <span className={`px-1.5 py-0.5 rounded text-[10px] font-bold border shrink-0 ${getScoreColor(q.qualificationScore)}`}>
                              {q.qualificationScore}/100
                            </span>
                          </div>

                          <div className="flex items-center gap-2 pt-1 border-t border-border/50 text-xs">
                            <div className="w-5 h-5 rounded-full bg-accent-soft text-accent font-bold text-[9px] flex items-center justify-center shrink-0">
                              {(contact.contactName || 'E')[0]}
                            </div>
                            <div className="min-w-0 flex-1">
                              <div className="font-medium text-text text-[11px] truncate">
                                {contact.contactName || 'Executive'}
                              </div>
                            </div>
                          </div>

                          <div className="flex items-center justify-between pt-1">
                            <span className="text-[10px] text-muted">
                              {q.lastInteractionAt ? new Date(q.lastInteractionAt).toLocaleDateString() : 'New'}
                            </span>
                            {q.qualificationStatus === 'qualified' && (
                              <button
                                type="button"
                                onClick={(e) => {
                                  e.stopPropagation();
                                  handleOpenBookMeetingModal(q);
                                }}
                                className="px-2 py-0.5 rounded bg-emerald-600 text-white text-[10px] font-bold hover:bg-emerald-700 transition flex items-center gap-1 shadow-2xs cursor-pointer"
                              >
                                <Calendar className="w-2.5 h-2.5" />
                                Book Call
                              </button>
                            )}
                          </div>
                        </div>
                      );
                    })
                  )}
                </div>
              </div>
            );
          })}
        </div>
      ) : (
        /* Qualifications List Table */
        <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
          {loading ? (
            <div className="py-20 flex flex-col items-center justify-center text-slate-400 gap-2">
              <RefreshCw className="w-6 h-6 animate-spin text-emerald-600" />
              <p className="text-sm">Loading qualification pipeline...</p>
            </div>
          ) : qualifications.length === 0 ? (
            <div className="py-16 text-center text-slate-500">
              <UserCheck className="w-10 h-10 mx-auto text-slate-300 mb-2" />
              <p className="text-sm font-medium">No leads currently match this filter.</p>
              <p className="text-xs text-slate-400 mt-1">Leads enter qualification upon receiving positive Phase 2 replies or manual enrollment.</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="bg-slate-50 border-b border-slate-200 text-[11px] font-semibold text-slate-500 uppercase tracking-wider">
                    <th className="py-3 px-4">Company & Target</th>
                    <th className="py-3 px-4">Decision Maker</th>
                    <th className="py-3 px-4">AI Score</th>
                    <th className="py-3 px-4">AI Recommendation</th>
                    <th className="py-3 px-4">Status</th>
                    <th className="py-3 px-4">Last Activity</th>
                    <th className="py-3 px-4 text-right">Action</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 text-xs">
                  {qualifications.map((q) => {
                    const company = q.companyId || {};
                    const contact = q.contactId || {};
                    return (
                      <tr
                        key={q._id}
                        onClick={() => openLeadDetail(q._id)}
                        className="hover:bg-slate-50/80 cursor-pointer transition"
                      >
                        <td className="py-3.5 px-4">
                          <div className="font-semibold text-slate-900">{company.companyName || 'Unknown Company'}</div>
                          <div className="text-[11px] text-slate-500">{company.industry || 'Industry N/A'} &bull; {company.city || company.country || ''}</div>
                        </td>
                        <td className="py-3.5 px-4">
                          <div className="font-medium text-slate-800">{contact.contactName || 'Executive'}</div>
                          <div className="text-[11px] text-slate-500">{contact.jobTitle || 'Decision Maker'}</div>
                        </td>
                        <td className="py-3.5 px-4">
                          <div className="flex items-center gap-2">
                            <span className={`px-2 py-0.5 rounded font-bold border ${getScoreColor(q.qualificationScore)}`}>
                              {q.qualificationScore}/100
                            </span>
                            <div className="w-16 h-1.5 bg-slate-100 rounded-full overflow-hidden">
                              <div
                                className={`h-full ${q.qualificationScore >= 70 ? 'bg-emerald-500' : q.qualificationScore >= 40 ? 'bg-amber-500' : 'bg-rose-500'}`}
                                style={{ width: `${Math.min(100, q.qualificationScore)}%` }}
                              />
                            </div>
                          </div>
                        </td>
                        <td className="py-3.5 px-4">
                          {getRecommendationBadge(q.aiRecommendation)}
                        </td>
                        <td className="py-3.5 px-4">
                          {getStatusBadge(q.qualificationStatus)}
                        </td>
                        <td className="py-3.5 px-4 text-slate-500">
                          {q.lastInteractionAt ? new Date(q.lastInteractionAt).toLocaleDateString() : 'New'}
                        </td>
                        <td className="py-3.5 px-4 text-right">
                          <div className="flex items-center justify-end gap-1.5">
                            {(q.qualificationStatus === 'qualified' || q.qualificationScore >= 70) && (
                              <button
                                onClick={(e) => {
                                  e.stopPropagation();
                                  handleOpenBookMeetingModal(q);
                                }}
                                title="Book Sales Discovery Meeting"
                                className="inline-flex items-center gap-1 px-2.5 py-1 bg-blue-50 text-blue-700 hover:bg-blue-100 border border-blue-200 rounded text-xs font-semibold transition"
                              >
                                <Calendar className="w-3 h-3 text-blue-600" />
                                Book Call
                              </button>
                            )}
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                openLeadDetail(q._id);
                              }}
                              className="inline-flex items-center gap-1 px-3 py-1 bg-slate-900 hover:bg-slate-800 text-white rounded text-xs font-medium transition"
                            >
                              Review &amp; Details <ChevronRight className="w-3 h-3" />
                            </button>
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}

      {/* Review & Qualification Detail Modal */}
      {selectedLeadId && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-sm p-4 overflow-y-auto">
          <div className="bg-white rounded-2xl max-w-5xl w-full max-h-[90vh] shadow-2xl border border-slate-200 flex flex-col overflow-hidden">
            {/* Modal Header */}
            <div className="p-6 border-b border-slate-200 flex items-start justify-between bg-slate-50/50">
              <div className="flex items-start gap-4">
                <div className="w-12 h-12 rounded-xl bg-emerald-600 text-white flex items-center justify-center font-bold text-lg shadow-md shadow-emerald-500/20">
                  <UserCheck className="w-6 h-6" />
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <h2 className="text-lg font-bold text-slate-900">
                      {activeDetail.qualification?.companyId?.companyName || 'Lead Detail'}
                    </h2>
                    {activeDetail.qualification && getStatusBadge(activeDetail.qualification.qualificationStatus)}
                    {activeDetail.qualification && getRecommendationBadge(activeDetail.qualification.aiRecommendation)}
                  </div>
                  <p className="text-xs text-slate-600 mt-0.5">
                    Prospect: <span className="font-semibold text-slate-800">{activeDetail.qualification?.contactId?.contactName}</span> ({activeDetail.qualification?.contactId?.jobTitle}) &bull; {activeDetail.qualification?.contactId?.email}
                  </p>
                </div>
              </div>
              <button
                onClick={closeDetail}
                className="text-slate-400 hover:text-slate-600 p-1.5 rounded-lg hover:bg-slate-200/60 transition"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Notification alert */}
            {feedbackMsg && (
              <div className={`px-6 py-2.5 text-xs font-medium flex items-center justify-between ${feedbackMsg.type === 'success' ? 'bg-emerald-50 text-emerald-800 border-b border-emerald-200' : 'bg-rose-50 text-rose-800 border-b border-rose-200'}`}>
                <span>{feedbackMsg.text}</span>
                <button onClick={() => setFeedbackMsg(null)} className="font-bold ml-2">&times;</button>
              </div>
            )}

            {/* Modal Body */}
            {detailLoading ? (
              <div className="p-20 text-center text-slate-400 flex flex-col items-center gap-2">
                <RefreshCw className="w-6 h-6 animate-spin text-emerald-600" />
                <p className="text-sm">Fetching qualification dossier and facts...</p>
              </div>
            ) : activeDetail.qualification ? (
              <div className="flex-1 overflow-y-auto p-6 space-y-6">
                {/* 1. Multidimensional Score Breakdown Banner */}
                <div className="bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 text-white rounded-xl p-6 shadow-md border border-slate-700">
                  <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-6 pb-6 border-b border-slate-700/60">
                    <div>
                      <div className="text-[11px] font-semibold text-emerald-400 uppercase tracking-wider">AI Qualification Score</div>
                      <div className="flex items-baseline gap-3 mt-1">
                        <span className="text-4xl font-extrabold text-white">{activeDetail.qualification.qualificationScore}</span>
                        <span className="text-slate-400 text-sm font-medium">/ 100 Points</span>
                      </div>
                      <p className="text-xs text-slate-300 mt-1 max-w-xl">
                        {activeDetail.qualification.qualificationSummary || 'No AI executive summary generated yet. Click re-calculate to evaluate.'}
                      </p>
                    </div>
                    <button
                      onClick={handleScoreWithAI}
                      disabled={actionLoading}
                      className="inline-flex items-center gap-2 px-4 py-2.5 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-semibold shadow-lg shadow-emerald-600/30 transition disabled:opacity-50"
                    >
                      <Sparkles className="w-4 h-4" />
                      {actionLoading ? 'Evaluating...' : 'Re-Calculate AI Score'}
                    </button>
                  </div>

                  {/* 6 Dimension Grid */}
                  <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4 pt-4 text-xs">
                    <div>
                      <div className="text-slate-400 font-medium">Need Clarity</div>
                      <div className="text-base font-bold text-white mt-0.5">
                        {activeDetail.qualification.scoreBreakdown?.needClarity ?? 0} <span className="text-[10px] text-slate-500 font-normal">/25</span>
                      </div>
                      <div className="w-full bg-slate-700 h-1.5 rounded-full mt-1.5 overflow-hidden">
                        <div className="bg-emerald-400 h-full" style={{ width: `${((activeDetail.qualification.scoreBreakdown?.needClarity ?? 0) / 25) * 100}%` }} />
                      </div>
                    </div>

                    <div>
                      <div className="text-slate-400 font-medium">Solution Fit</div>
                      <div className="text-base font-bold text-white mt-0.5">
                        {activeDetail.qualification.scoreBreakdown?.solutionFit ?? 0} <span className="text-[10px] text-slate-500 font-normal">/25</span>
                      </div>
                      <div className="w-full bg-slate-700 h-1.5 rounded-full mt-1.5 overflow-hidden">
                        <div className="bg-emerald-400 h-full" style={{ width: `${((activeDetail.qualification.scoreBreakdown?.solutionFit ?? 0) / 25) * 100}%` }} />
                      </div>
                    </div>

                    <div>
                      <div className="text-slate-400 font-medium">Engagement</div>
                      <div className="text-base font-bold text-white mt-0.5">
                        {activeDetail.qualification.scoreBreakdown?.engagement ?? 0} <span className="text-[10px] text-slate-500 font-normal">/20</span>
                      </div>
                      <div className="w-full bg-slate-700 h-1.5 rounded-full mt-1.5 overflow-hidden">
                        <div className="bg-emerald-400 h-full" style={{ width: `${((activeDetail.qualification.scoreBreakdown?.engagement ?? 0) / 20) * 100}%` }} />
                      </div>
                    </div>

                    <div>
                      <div className="text-slate-400 font-medium">Timeline</div>
                      <div className="text-base font-bold text-white mt-0.5">
                        {activeDetail.qualification.scoreBreakdown?.timeline ?? 0} <span className="text-[10px] text-slate-500 font-normal">/15</span>
                      </div>
                      <div className="w-full bg-slate-700 h-1.5 rounded-full mt-1.5 overflow-hidden">
                        <div className="bg-emerald-400 h-full" style={{ width: `${((activeDetail.qualification.scoreBreakdown?.timeline ?? 0) / 15) * 100}%` }} />
                      </div>
                    </div>

                    <div>
                      <div className="text-slate-400 font-medium">Authority</div>
                      <div className="text-base font-bold text-white mt-0.5">
                        {activeDetail.qualification.scoreBreakdown?.authority ?? 0} <span className="text-[10px] text-slate-500 font-normal">/10</span>
                      </div>
                      <div className="w-full bg-slate-700 h-1.5 rounded-full mt-1.5 overflow-hidden">
                        <div className="bg-emerald-400 h-full" style={{ width: `${((activeDetail.qualification.scoreBreakdown?.authority ?? 0) / 10) * 100}%` }} />
                      </div>
                    </div>

                    <div>
                      <div className="text-slate-400 font-medium">Budget Readiness</div>
                      <div className="text-base font-bold text-white mt-0.5">
                        {activeDetail.qualification.scoreBreakdown?.budgetReadiness ?? 0} <span className="text-[10px] text-slate-500 font-normal">/5</span>
                      </div>
                      <div className="w-full bg-slate-700 h-1.5 rounded-full mt-1.5 overflow-hidden">
                        <div className="bg-emerald-400 h-full" style={{ width: `${((activeDetail.qualification.scoreBreakdown?.budgetReadiness ?? 0) / 5) * 100}%` }} />
                      </div>
                    </div>
                  </div>
                </div>

                {/* 2. Grounded Extracted Facts Grid */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {/* Operational Challenges & Systems */}
                  <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-sm space-y-4">
                    <h3 className="text-xs font-bold text-slate-900 uppercase tracking-wider flex items-center gap-1.5">
                      <Database className="w-4 h-4 text-indigo-600" />
                      Extracted Systems &amp; Challenges
                    </h3>

                    <div>
                      <label className="text-[11px] font-semibold text-slate-600">Business Challenges &amp; Bottlenecks:</label>
                      <div className="flex flex-wrap gap-1.5 mt-1">
                        {(activeDetail.qualification.businessChallenges || []).length > 0 ? (
                          activeDetail.qualification.businessChallenges.map((c, i) => (
                            <span key={i} className="px-2 py-1 bg-rose-50 text-rose-700 border border-rose-200 rounded text-xs">
                              {c}
                            </span>
                          ))
                        ) : (
                          <span className="text-xs text-slate-400 italic">None extracted yet</span>
                        )}
                      </div>
                    </div>

                    <div>
                      <label className="text-[11px] font-semibold text-slate-600">Current Software &amp; Tech Stack:</label>
                      <div className="flex flex-wrap gap-1.5 mt-1">
                        {(activeDetail.qualification.currentSystems || []).length > 0 ? (
                          activeDetail.qualification.currentSystems.map((s, i) => (
                            <span key={i} className="px-2 py-1 bg-blue-50 text-blue-700 border border-blue-200 rounded text-xs">
                              {s}
                            </span>
                          ))
                        ) : (
                          <span className="text-xs text-slate-400 italic">None extracted yet</span>
                        )}
                      </div>
                    </div>

                    <div>
                      <label className="text-[11px] font-semibold text-slate-600">Existing Workflows:</label>
                      <div className="flex flex-wrap gap-1.5 mt-1">
                        {(activeDetail.qualification.existingWorkflows || []).length > 0 ? (
                          activeDetail.qualification.existingWorkflows.map((w, i) => (
                            <span key={i} className="px-2 py-1 bg-slate-100 text-slate-700 rounded text-xs">
                              {w}
                            </span>
                          ))
                        ) : (
                          <span className="text-xs text-slate-400 italic">None described</span>
                        )}
                      </div>
                    </div>
                  </div>

                  {/* Purchasing Readiness: BANT */}
                  <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-sm space-y-4">
                    <h3 className="text-xs font-bold text-slate-900 uppercase tracking-wider flex items-center gap-1.5">
                      <TrendingUp className="w-4 h-4 text-emerald-600" />
                      Purchasing Readiness (BANT Dimensions)
                    </h3>

                    <div className="grid grid-cols-2 gap-3 text-xs">
                      <div className="bg-slate-50 p-3 rounded-lg border border-slate-200">
                        <span className="text-[11px] text-slate-500 font-medium">Timeline Status</span>
                        <div className="font-bold text-slate-800 capitalize mt-0.5">
                          {activeDetail.qualification.purchasingTimeline?.status?.replace(/_/g, ' ') || 'Unknown'}
                        </div>
                        <p className="text-[11px] text-slate-600 mt-1">{activeDetail.qualification.purchasingTimeline?.details || 'No timeline stated.'}</p>
                      </div>

                      <div className="bg-slate-50 p-3 rounded-lg border border-slate-200">
                        <span className="text-[11px] text-slate-500 font-medium">Budget Status</span>
                        <div className="font-bold text-slate-800 capitalize mt-0.5">
                          {activeDetail.qualification.budgetInformation?.status?.replace(/_/g, ' ') || 'Not discussed'}
                        </div>
                        <p className="text-[11px] text-slate-600 mt-1">
                          {activeDetail.qualification.budgetInformation?.rangeEstimated || activeDetail.qualification.budgetInformation?.details || 'No budget stated.'}
                        </p>
                      </div>

                      <div className="bg-slate-50 p-3 rounded-lg border border-slate-200 col-span-2">
                        <span className="text-[11px] text-slate-500 font-medium">Decision-Making Authority</span>
                        <div className="font-bold text-slate-800 capitalize mt-0.5">
                          {activeDetail.qualification.decisionMakingAuthority?.status?.replace(/_/g, ' ') || 'Unknown'}
                        </div>
                        <p className="text-[11px] text-slate-600 mt-1">{activeDetail.qualification.decisionMakingAuthority?.details || 'Sign-off authority pending validation.'}</p>
                      </div>
                    </div>
                  </div>
                </div>

                {/* 3. Human Sales Team Review & Decision Panel */}
                <div className="bg-white p-6 rounded-xl border-2 border-indigo-200 shadow-sm space-y-4">
                  <div className="flex items-center justify-between">
                    <h3 className="text-sm font-bold text-slate-900 flex items-center gap-2">
                      <ShieldCheck className="w-5 h-5 text-indigo-600" />
                      Human Sales Team Review &amp; Approval
                    </h3>
                    <span className="text-xs text-indigo-600 font-medium bg-indigo-50 px-2.5 py-1 rounded-full border border-indigo-200">
                      Mandatory Human Gate
                    </span>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                    <button
                      type="button"
                      onClick={() => setReviewDecision('approved_qualified')}
                      className={`p-3 rounded-xl border text-left transition ${reviewDecision === 'approved_qualified'
                        ? 'bg-emerald-50 border-emerald-500 ring-2 ring-emerald-500/20 text-emerald-900'
                        : 'border-slate-200 hover:bg-slate-50 text-slate-700'
                        }`}
                    >
                      <div className="font-bold text-xs flex items-center gap-1.5 text-emerald-700">
                        <CheckCircle2 className="w-4 h-4" /> Approve as Qualified (SQL)
                      </div>
                      <p className="text-[11px] text-slate-600 mt-1">
                        Moves lead to sales pipeline; ready for demo or technical meeting.
                      </p>
                    </button>

                    <button
                      type="button"
                      onClick={() => setReviewDecision('more_info_needed')}
                      className={`p-3 rounded-xl border text-left transition ${reviewDecision === 'more_info_needed'
                        ? 'bg-amber-50 border-amber-500 ring-2 ring-amber-500/20 text-amber-900'
                        : 'border-slate-200 hover:bg-slate-50 text-slate-700'
                        }`}
                    >
                      <div className="font-bold text-xs flex items-center gap-1.5 text-amber-700">
                        <HelpCircle className="w-4 h-4" /> Request More Info
                      </div>
                      <p className="text-[11px] text-slate-600 mt-1">
                        Keep in discovery; triggers another contextual follow-up question.
                      </p>
                    </button>

                    <button
                      type="button"
                      onClick={() => setReviewDecision('disqualified')}
                      className={`p-3 rounded-xl border text-left transition ${reviewDecision === 'disqualified'
                        ? 'bg-rose-50 border-rose-500 ring-2 ring-rose-500/20 text-rose-900'
                        : 'border-slate-200 hover:bg-slate-50 text-slate-700'
                        }`}
                    >
                      <div className="font-bold text-xs flex items-center gap-1.5 text-rose-700">
                        <XCircle className="w-4 h-4" /> Disqualify Lead
                      </div>
                      <p className="text-[11px] text-slate-600 mt-1">
                        No fit, technical mismatch, or outside enterprise scope.
                      </p>
                    </button>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-2">
                    <div>
                      <label className="text-xs font-semibold text-slate-700">Reviewer Notes &amp; Rationale:</label>
                      <textarea
                        rows={2}
                        value={reviewerNotes}
                        onChange={(e) => setReviewerNotes(e.target.value)}
                        placeholder="e.g. Strong fit for warehouse manifest extraction; client requested Oracle EBS sync demo."
                        className="w-full mt-1 p-2 text-xs rounded-lg border border-slate-300 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                      />
                    </div>

                    <div className="space-y-2">
                      <div>
                        <label className="text-xs font-semibold text-slate-700">Manual Score Override (Optional 0–100):</label>
                        <input
                          type="number"
                          min="0"
                          max="100"
                          value={manualScoreOverride}
                          onChange={(e) => setManualScoreOverride(e.target.value === '' ? '' : parseInt(e.target.value, 10))}
                          className="w-full mt-1 p-2 text-xs rounded-lg border border-slate-300 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                          placeholder="Override score if human reviewer deems necessary"
                        />
                      </div>

                      {reviewDecision === 'disqualified' && (
                        <div>
                          <label className="text-xs font-semibold text-rose-700">Disqualification Reason:</label>
                          <input
                            type="text"
                            value={disqualificationReason}
                            onChange={(e) => setDisqualificationReason(e.target.value)}
                            className="w-full mt-1 p-2 text-xs rounded-lg border border-rose-300 focus:outline-none focus:ring-2 focus:ring-rose-500"
                            placeholder="e.g. Incompatible legacy architecture"
                          />
                        </div>
                      )}
                    </div>
                  </div>

                  <div className="flex justify-end pt-2">
                    <button
                      onClick={handleSubmitReview}
                      disabled={actionLoading}
                      className="px-5 py-2.5 rounded-lg bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold shadow-md transition disabled:opacity-50"
                    >
                      {actionLoading ? 'Recording Decision...' : 'Submit Review & Update Status'}
                    </button>
                  </div>
                </div>

                {/* 4. Sales Team Handoff & Dossier Export */}
                <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-sm space-y-3">
                  <div className="flex items-center justify-between">
                    <h3 className="text-xs font-bold text-slate-900 uppercase tracking-wider flex items-center gap-1.5">
                      <Share2 className="w-4 h-4 text-emerald-600" />
                      Sales Handoff Package &amp; Export
                    </h3>
                    {activeDetail.qualification.assignedTo && (
                      <span className="text-[11px] bg-emerald-50 text-emerald-700 border border-emerald-200 px-2.5 py-0.5 rounded-full font-medium">
                        Assigned Rep: {activeDetail.qualification.assignedTo}
                      </span>
                    )}
                  </div>
                  <p className="text-xs text-slate-500">
                    Package all discovery findings, score breakdown, BANT metrics, and activity history into a sales-ready dossier.
                  </p>

                  <div className="flex flex-col sm:flex-row items-center gap-2.5 pt-1">
                    <div className="relative flex-1 w-full">
                      <input
                        type="text"
                        value={assignedAE}
                        onChange={(e) => setAssignedAE(e.target.value)}
                        placeholder="Assign to Account Executive name..."
                        className="w-full p-2 text-xs rounded-lg border border-slate-300 focus:outline-none focus:ring-2 focus:ring-emerald-500"
                      />
                    </div>
                    <button
                      onClick={handleHandoffToSales}
                      disabled={actionLoading}
                      className="w-full sm:w-auto px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold rounded-lg transition shadow-sm disabled:opacity-50"
                    >
                      Hand Off to Sales
                    </button>
                    <button
                      onClick={() => handleOpenBookMeetingModal(activeDetail.qualification)}
                      className="w-full sm:w-auto px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold rounded-lg transition shadow-sm inline-flex items-center justify-center gap-1.5"
                    >
                      <Calendar className="w-3.5 h-3.5" />
                      Book Discovery Call
                    </button>
                    <a
                      href={api.getQualificationExportJsonUrl(activeDetail.qualification._id)}
                      download={`qualification_${activeDetail.qualification._id}.json`}
                      className="w-full sm:w-auto px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-semibold rounded-lg transition border border-slate-200 text-center"
                    >
                      Export JSON Dossier
                    </a>
                  </div>
                </div>

                {/* 5. Conversational Discovery Tools (Extract Reply & Generate Question) */}
                <div className="bg-slate-50 p-5 rounded-xl border border-slate-200 shadow-sm space-y-4">
                  <h3 className="text-xs font-bold text-slate-900 uppercase tracking-wider flex items-center gap-1.5">
                    <Mail className="w-4 h-4 text-emerald-600" />
                    Conversational AI Discovery Tools
                  </h3>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {/* Tool A: Ingest Prospect Reply */}
                    <div className="bg-white p-4 rounded-lg border border-slate-200">
                      <div className="text-xs font-semibold text-slate-800 mb-1">Ingest Prospect Reply (Extract Facts)</div>
                      <textarea
                        rows={3}
                        value={inboundReplyText}
                        onChange={(e) => setInboundReplyText(e.target.value)}
                        placeholder="Paste prospect email or chat message..."
                        className="w-full p-2 text-xs rounded-lg border border-slate-300 focus:outline-none focus:ring-2 focus:ring-emerald-500"
                      />
                      <button
                        onClick={handleExtractFromMessage}
                        disabled={actionLoading || !inboundReplyText.trim()}
                        className="mt-2 w-full py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-medium rounded transition disabled:opacity-50"
                      >
                        Extract B2B Facts from Message
                      </button>
                    </div>

                    {/* Tool B: Generate Contextual Question */}
                    <div className="bg-white p-4 rounded-lg border border-slate-200">
                      <div className="text-xs font-semibold text-slate-800 mb-1">Generate Single Contextual Question</div>
                      <label className="text-[11px] text-slate-500">Category Focus:</label>
                      <select
                        value={questionCategory}
                        onChange={(e) => setQuestionCategory(e.target.value)}
                        className="w-full mt-1 p-2 text-xs rounded-lg border border-slate-300 focus:outline-none focus:ring-2 focus:ring-emerald-500"
                      >
                        <option value="business_challenges">Business Challenges</option>
                        <option value="current_systems">Current Systems &amp; Software</option>
                        <option value="required_solutions">Required AI Solutions</option>
                        <option value="business_priorities">Business Priorities</option>
                        <option value="budget_timeline">Budget &amp; Timeline</option>
                        <option value="decision_authority">Decision Authority</option>
                      </select>
                      <button
                        onClick={handleGenerateQuestion}
                        disabled={actionLoading}
                        className="mt-3.5 w-full py-1.5 bg-slate-900 hover:bg-slate-800 text-white text-xs font-medium rounded transition disabled:opacity-50"
                      >
                        Generate Next Consultative Question
                      </button>
                    </div>
                  </div>
                </div>

                {/* 5. Questions & Audit Timeline */}
                <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-sm space-y-3">
                  <h3 className="text-xs font-bold text-slate-900 uppercase tracking-wider flex items-center gap-1.5">
                    <Clock className="w-4 h-4 text-slate-500" />
                    Discovery Questions &amp; Audit Trail
                  </h3>

                  {activeDetail.questions.length > 0 ? (
                    <div className="space-y-2">
                      {activeDetail.questions.map((q) => (
                        <div key={q._id} className="p-3 bg-slate-50 rounded-lg border border-slate-200 text-xs">
                          <div className="flex items-center justify-between text-[11px] text-slate-500 mb-1">
                            <span className="font-semibold text-indigo-700 capitalize">{q.category?.replace(/_/g, ' ')}</span>
                            <span className="px-1.5 py-0.5 rounded text-[10px] bg-slate-200">{q.questionStatus}</span>
                          </div>
                          <div className="font-medium text-slate-800">&ldquo;{q.question}&rdquo;</div>
                          {q.answerText && (
                            <div className="mt-1 text-slate-600 bg-white p-2 rounded border border-slate-100">
                              <span className="font-semibold text-emerald-700">Answer:</span> {q.answerText}
                            </div>
                          )}
                        </div>
                      ))}
                    </div>
                  ) : (
                    <p className="text-xs text-slate-400 italic">No qualification questions asked yet.</p>
                  )}
                </div>
              </div>
            ) : null}
          </div>
        </div>
      )}

      {/* Manual Prospect Enrollment Modal */}
      {enrollModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-xs p-4">
          <div className="bg-white rounded-2xl max-w-lg w-full shadow-2xl border border-slate-200 overflow-hidden">
            <div className="p-5 border-b border-slate-200 flex items-center justify-between bg-slate-50">
              <div className="flex items-center gap-2.5">
                <div className="w-9 h-9 rounded-xl bg-emerald-100 text-emerald-700 flex items-center justify-center">
                  <UserCheck className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="font-bold text-slate-900 text-sm">Enroll Prospect into Qualification</h3>
                  <p className="text-xs text-slate-500">Select an outreach contact to initiate discovery &amp; scoring</p>
                </div>
              </div>
              <button
                onClick={() => setEnrollModalOpen(false)}
                className="text-slate-400 hover:text-slate-600 p-1.5 rounded-lg hover:bg-slate-200 transition"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="p-6 space-y-4">
              {enrollLoading ? (
                <div className="py-8 text-center text-slate-400">
                  <RefreshCw className="w-6 h-6 animate-spin mx-auto text-emerald-600 mb-2" />
                  <p className="text-xs">Loading available outreach contacts...</p>
                </div>
              ) : enrollContacts.length === 0 ? (
                <div className="py-8 text-center text-slate-500">
                  <p className="text-sm font-semibold">No outreach contacts found.</p>
                  <p className="text-xs text-slate-400 mt-1">Please enroll companies in Lead Management (Phase 2) first.</p>
                </div>
              ) : (
                <div>
                  <label className="text-xs font-semibold text-slate-700 mb-1.5 block">
                    Choose Prospect Contact:
                  </label>
                  <select
                    value={selectedContactToEnroll}
                    onChange={(e) => setSelectedContactToEnroll(e.target.value)}
                    className="w-full p-2.5 text-xs rounded-xl border border-slate-300 focus:outline-none focus:ring-2 focus:ring-emerald-500 bg-white"
                  >
                    <option value="">-- Select Contact --</option>
                    {enrollContacts.map((c) => (
                      <option key={c._id} value={c._id}>
                        {c.contactName || 'Executive'} ({c.email}) — {c.companyId?.companyName || 'Company'}
                      </option>
                    ))}
                  </select>
                  <p className="text-[11px] text-slate-500 mt-2">
                    Once enrolled, this prospect enters active discovery. You can ingest their replies, extract operational facts, and calculate their AI BANT score.
                  </p>
                </div>
              )}
            </div>

            <div className="p-4 bg-slate-50 border-t border-slate-200 flex justify-end gap-2.5">
              <button
                type="button"
                onClick={() => setEnrollModalOpen(false)}
                className="px-4 py-2 text-xs font-semibold text-slate-600 hover:bg-slate-200 rounded-lg transition"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleEnrollSubmit}
                disabled={actionLoading || !selectedContactToEnroll}
                className="px-4 py-2 text-xs font-bold text-white bg-emerald-600 hover:bg-emerald-700 rounded-lg transition shadow-xs disabled:opacity-50"
              >
                {actionLoading ? 'Enrolling...' : 'Start Qualification'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Schedule Discovery Meeting Modal — Premium Wide 2-Column Layout */}
      {bookMeetingModalOpen && targetQualForMeeting && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-xs p-4 overflow-y-auto">
          <div className="bg-white rounded-2xl max-w-2xl w-full shadow-2xl border border-slate-200 overflow-hidden animate-fade-in my-auto">
            {/* Modal Header */}
            <div className="px-6 py-4 border-b border-slate-100 flex items-center justify-between bg-slate-50/70">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-blue-500 to-indigo-600 text-white flex items-center justify-center shadow-xs">
                  <Calendar className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="font-bold text-slate-900 text-sm">Schedule Sales Discovery Meeting</h3>
                  <p className="text-xs text-slate-500">
                    With {targetQualForMeeting.contactId?.contactName || 'Decision Maker'} at {targetQualForMeeting.companyId?.companyName || 'Target Company'}
                  </p>
                </div>
              </div>
              <button
                onClick={() => setBookMeetingModalOpen(false)}
                className="text-slate-400 hover:text-slate-600 p-1.5 rounded-lg hover:bg-slate-200 transition"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Top AI Context / Quote Pill (Sleek, Compact) */}
            <div className="p-5 pb-0">
              {aiTimePrompt || aiTimeFeedback ? (
                <div className="p-3 bg-gradient-to-r from-indigo-50/80 via-blue-50/50 to-slate-50 border border-indigo-100 rounded-xl flex flex-col sm:flex-row sm:items-center justify-between gap-2.5">
                  <div className="flex items-start gap-2.5 min-w-0">
                    <div className="p-1 rounded-lg bg-indigo-100 text-indigo-700 shrink-0 mt-0.5">
                      <Sparkles className="w-4 h-4" />
                    </div>
                    <div className="min-w-0 text-xs">
                      <div className="text-slate-500 text-[11px] font-medium flex items-center gap-1.5">
                        <span>Prospect Email Snippet:</span>
                        {aiTimeLoading && <span className="text-indigo-600 font-bold animate-pulse">Parsing with Gemini...</span>}
                      </div>
                      <p className="font-semibold text-slate-800 italic truncate max-w-md">
                        "{aiTimePrompt || 'Checking inbox for message...'}"
                      </p>
                      {aiTimeFeedback && (
                        <span className={`inline-flex items-center gap-1 text-[11px] font-semibold mt-0.5 ${aiTimeFeedback.type === 'success' ? 'text-emerald-700' : aiTimeFeedback.type === 'warn' ? 'text-amber-700' : 'text-rose-700'
                          }`}>
                          {aiTimeFeedback.type === 'success' && <CheckCircle2 className="w-3 h-3 shrink-0" />}
                          {aiTimeFeedback.type === 'warn' && <AlertTriangle className="w-3 h-3 shrink-0" />}
                          {aiTimeFeedback.type === 'error' && <XCircle className="w-3 h-3 shrink-0" />}
                          <span>{aiTimeFeedback.text}</span>
                        </span>
                      )}
                    </div>
                  </div>
                  <div className="flex items-center gap-1.5 shrink-0 self-end sm:self-center">
                    <input
                      type="text"
                      value={aiTimePrompt}
                      onChange={(e) => setAiTimePrompt(e.target.value)}
                      placeholder="Edit snippet or paste time..."
                      className="w-44 text-[11px] p-1.5 bg-white border border-indigo-200 rounded-lg focus:outline-none focus:ring-1 focus:ring-indigo-500"
                      onKeyDown={(e) => {
                        if (e.key === 'Enter') {
                          e.preventDefault();
                          handleExtractTimeWithGemini();
                        }
                      }}
                    />
                    <button
                      type="button"
                      onClick={handleExtractTimeWithGemini}
                      disabled={aiTimeLoading || !aiTimePrompt.trim()}
                      className="px-2.5 py-1.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg text-xs font-bold transition disabled:opacity-50"
                      title="Re-extract time with Gemini"
                    >
                      {aiTimeLoading ? <RefreshCw className="w-3.5 h-3.5 animate-spin" /> : 'Re-parse'}
                    </button>
                  </div>
                </div>
              ) : (
                <div className="p-2.5 bg-slate-50 border border-slate-200 rounded-xl flex items-center justify-between gap-2 text-xs">
                  <div className="flex items-center gap-2 text-slate-600">
                    <Sparkles className="w-4 h-4 text-indigo-500" />
                    <span className="text-[11px]">Paste any client message to auto-detect time:</span>
                  </div>
                  <div className="flex items-center gap-1.5 flex-1 max-w-sm">
                    <input
                      type="text"
                      value={aiTimePrompt}
                      onChange={(e) => setAiTimePrompt(e.target.value)}
                      placeholder="e.g. 'Can we do Thursday at 3:30 PM?'"
                      className="w-full text-[11px] p-1.5 bg-white border border-slate-300 rounded-lg focus:outline-none focus:ring-1 focus:ring-indigo-500"
                      onKeyDown={(e) => {
                        if (e.key === 'Enter') {
                          e.preventDefault();
                          handleExtractTimeWithGemini();
                        }
                      }}
                    />
                    <button
                      type="button"
                      onClick={handleExtractTimeWithGemini}
                      disabled={aiTimeLoading || !aiTimePrompt.trim()}
                      className="px-2.5 py-1.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg text-xs font-bold transition shrink-0 disabled:opacity-50"
                    >
                      {aiTimeLoading ? <RefreshCw className="w-3.5 h-3.5 animate-spin" /> : 'Auto-Fill'}
                    </button>
                  </div>
                </div>
              )}
            </div>

            {/* Main Form: 2 Balanced Columns */}
            <div className="p-5 grid grid-cols-1 md:grid-cols-2 gap-4 text-xs">
              {/* LEFT COLUMN: Prospect Details & Title */}
              <div className="space-y-3">
                <div className="p-3 bg-slate-50 border border-slate-200/80 rounded-xl space-y-1">
                  <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block">Target Prospect</span>
                  <div className="font-bold text-slate-900 text-xs">
                    {targetQualForMeeting.contactId?.contactName || 'Executive'}
                  </div>
                  <div className="text-[11px] text-slate-500 truncate">
                    {targetQualForMeeting.companyId?.companyName || 'Target Organization'} • {targetQualForMeeting.contactId?.email || 'email'}
                  </div>
                </div>

                <div>
                  <label className="font-bold text-slate-700 block mb-1">Meeting Title:</label>
                  <input
                    type="text"
                    value={meetingTitle}
                    onChange={(e) => setMeetingTitle(e.target.value)}
                    className="w-full p-2 text-xs rounded-xl border border-slate-300 focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>

                <div>
                  <label className="font-bold text-slate-700 block mb-1">Assigned Sales Closer (AE):</label>
                  <input
                    type="text"
                    value={meetingCloser}
                    onChange={(e) => setMeetingCloser(e.target.value)}
                    placeholder="e.g. Hafiz (Sales Closer)"
                    className="w-full p-2 text-xs rounded-xl border border-slate-300 focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>
              </div>

              {/* RIGHT COLUMN: Date/Time, Duration Pills, Google Meet Badge */}
              <div className="space-y-3">
                <div>
                  <label className="font-bold text-slate-700 block mb-1">Start Date &amp; Time:</label>
                  <input
                    type="datetime-local"
                    value={meetingStartTime}
                    onChange={(e) => setMeetingStartTime(e.target.value)}
                    className="w-full p-2 text-xs rounded-xl border border-slate-300 focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white"
                  />
                </div>

                <div>
                  <label className="font-bold text-slate-700 block mb-1">Meeting Duration:</label>
                  <div className="grid grid-cols-4 gap-2">
                    {[15, 30, 45, 60].map((dur) => (
                      <button
                        key={dur}
                        type="button"
                        onClick={() => setMeetingDuration(dur)}
                        className={`py-2 px-1 text-center text-xs rounded-xl font-bold transition border ${meetingDuration === dur
                          ? 'bg-blue-600 border-blue-600 text-white shadow-xs'
                          : 'bg-white border-slate-200 text-slate-700 hover:bg-slate-100'
                          }`}
                      >
                        {dur} mins
                      </button>
                    ))}
                  </div>
                </div>

                <div className="p-3 bg-blue-50/70 border border-blue-200/80 rounded-xl flex items-center gap-3 mt-1">
                  <div className="w-9 h-9 rounded-xl bg-blue-600 text-white flex items-center justify-center shrink-0 shadow-xs">
                    <Video className="w-4 h-4" />
                  </div>
                  <div className="text-[11px] leading-tight text-blue-900">
                    <span className="font-bold block">Instant Google Meet &amp; Calendar (.ics)</span>
                    <span className="text-blue-700 text-[10px]">Secure room link generated and added to your calendar</span>
                  </div>
                </div>
              </div>
            </div>

            {/* Modal Footer */}
            <div className="px-6 py-3.5 bg-slate-50 border-t border-slate-200 flex items-center justify-between">
              <div className="text-[11px] text-slate-500 font-medium hidden sm:flex items-center gap-1.5">
                <span className="w-2 h-2 rounded-full bg-emerald-500"></span>
                <span>Host Zone: Asia/Karachi (09:00 - 18:00)</span>
              </div>
              <div className="flex items-center gap-2.5 ml-auto">
                <button
                  type="button"
                  onClick={() => setBookMeetingModalOpen(false)}
                  className="px-4 py-2 text-xs font-semibold text-slate-600 hover:bg-slate-200 rounded-xl transition"
                >
                  Cancel
                </button>
                <button
                  type="button"
                  onClick={handleConfirmBookMeeting}
                  disabled={actionLoading || !meetingStartTime}
                  className="px-5 py-2 text-xs font-bold text-white bg-blue-600 hover:bg-blue-700 rounded-xl transition shadow-xs disabled:opacity-50 inline-flex items-center gap-1.5"
                >
                  {actionLoading ? (
                    <>
                      <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                      <span>Scheduling...</span>
                    </>
                  ) : (
                    <>
                      <span>Confirm &amp; Schedule Call</span>
                      <ChevronRight className="w-3.5 h-3.5" />
                    </>
                  )}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

