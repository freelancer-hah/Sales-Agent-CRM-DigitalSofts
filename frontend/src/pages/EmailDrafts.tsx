import React, { useState, useEffect } from 'react';
import {
  Mail,
  CheckCircle,
  XCircle,
  Clock,
  Sparkles,
  ShieldAlert,
  ShieldCheck,
  Filter,
  Search,
  ExternalLink,
  Edit3,
  Trash2,
  RefreshCw,
  Eye,
  ChevronLeft,
  ChevronRight,
  Layers,
  Check,
  AlertTriangle,
  Lightbulb,
  Send,
  Loader2,
} from 'lucide-react';
import { api } from '../services/api';
import { IEmailDraft, DraftApprovalStatus, OutreachFramework } from '../types';
import { TableSkeleton } from '../components/Skeleton';
import { EmptyState } from '../components/EmptyState';
import { OutreachWorkspaceNav } from '../components/WorkspaceNav';
import { NavTab } from '../components/Sidebar';

export const EmailDrafts: React.FC<{
  onNavigateToLeads?: () => void;
  onNavigate?: (tab: NavTab) => void;
}> = ({ onNavigateToLeads, onNavigate }) => {
  const [drafts, setDrafts] = useState<IEmailDraft[]>([]);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalDrafts, setTotalDrafts] = useState(0);

  // Filters
  const [activeFilter, setActiveFilter] = useState<string>('all');
  const [selectedFramework, setSelectedFramework] = useState<string>('');

  // Review & Edit Modal
  const [selectedDraft, setSelectedDraft] = useState<IEmailDraft | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editedSubject, setEditedSubject] = useState('');
  const [editedBodyText, setEditedBodyText] = useState('');
  const [editedVariantIndex, setEditedVariantIndex] = useState<number>(0);
  const [viewMode, setViewMode] = useState<'text' | 'html'>('text');
  const [isSaving, setIsSaving] = useState(false);
  const [sendingDraftId, setSendingDraftId] = useState<string | null>(null);

  // Status feedback
  const [feedback, setFeedback] = useState<{
    type: 'success' | 'error';
    message: string;
  } | null>(null);

  useEffect(() => {
    loadDrafts();
  }, [page, activeFilter, selectedFramework]);

  const loadDrafts = async () => {
    setLoading(true);
    setFeedback(null);
    try {
      const res = await api.getDrafts({
        page,
        limit: 12,
        approvalStatus: activeFilter === 'all' ? undefined : activeFilter,
        framework: selectedFramework || undefined,
      });

      if (res.success) {
        setDrafts(res.data.drafts);
        setTotalPages(res.data.pagination.totalPages);
        setTotalDrafts(res.data.pagination.total);
      }
    } catch (err: any) {
      setFeedback({
        type: 'error',
        message: err.message || 'Failed to load email drafts',
      });
    } finally {
      setLoading(false);
    }
  };

  const handleOpenReview = (draft: IEmailDraft) => {
    setSelectedDraft(draft);
    setEditedSubject(draft.subject);
    setEditedBodyText(draft.bodyText);
    setEditedVariantIndex(draft.subjectVariantUsed || 0);
    setViewMode('text');
    setIsModalOpen(true);
  };

  const handleSelectVariant = (variant: string, index: number) => {
    setEditedSubject(variant);
    setEditedVariantIndex(index);
  };

  const handleUpdateStatus = async (
    draftId: string,
    newStatus: DraftApprovalStatus,
    saveEditsFirst: boolean = false
  ) => {
    setIsSaving(true);
    setFeedback(null);
    try {
      const payload: Record<string, any> = {
        approvalStatus: newStatus,
      };

      if (saveEditsFirst) {
        payload.subject = editedSubject;
        payload.bodyText = editedBodyText;
        payload.bodyHtml = editedBodyText
          .split('\n\n')
          .map((p: string) => `<p style="margin: 0 0 12px 0; line-height: 1.6; color: #1e293b;">${p.replace(/\n/g, '<br/>')}</p>`)
          .join('');
        payload.subjectVariantUsed = editedVariantIndex;
      }

      const res = await api.updateDraft(draftId, payload);
      if (res.success) {
        setFeedback({
          type: 'success',
          message:
            newStatus === 'approved'
              ? 'Draft approved successfully! Contact is now ready for outreach sending.'
              : newStatus === 'rejected'
              ? 'Draft marked as rejected.'
              : 'Draft updated successfully.',
        });

        setIsModalOpen(false);
        loadDrafts();
      }
    } catch (err: any) {
      setFeedback({
        type: 'error',
        message: err.message || 'Failed to update draft status',
      });
    } finally {
      setIsSaving(false);
    }
  };

  const handleDelete = async (draftId: string) => {
    if (!window.confirm('Are you sure you want to delete this email draft?')) {
      return;
    }

    try {
      const res = await api.deleteDraft(draftId);
      if (res.success) {
        setFeedback({
          type: 'success',
          message: 'Draft deleted successfully.',
        });
        loadDrafts();
      }
    } catch (err: any) {
      setFeedback({
        type: 'error',
        message: err.message || 'Failed to delete draft',
      });
    }
  };

  const getStatusBadge = (status: DraftApprovalStatus) => {
    switch (status) {
      case 'approved':
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-semibold bg-emerald-50 text-emerald-700 border border-emerald-200">
            <CheckCircle className="w-3 h-3 text-emerald-600" />
            Approved
          </span>
        );
      case 'rejected':
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-semibold bg-rose-50 text-rose-700 border border-rose-200">
            <XCircle className="w-3 h-3 text-rose-600" />
            Rejected
          </span>
        );
      case 'draft':
      default:
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-semibold bg-amber-50 text-amber-700 border border-amber-200">
            <Clock className="w-3 h-3 text-amber-600" />
            Pending Approval
          </span>
        );
    }
  };

  const getSpamScoreBadge = (score: number) => {
    if (score < 20) {
      return (
        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[10px] font-semibold bg-emerald-50 text-emerald-700 border border-emerald-200">
          <ShieldCheck className="w-3 h-3 text-emerald-600" />
          Clean ({score}/100)
        </span>
      );
    }
    if (score < 40) {
      return (
        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[10px] font-semibold bg-amber-50 text-amber-700 border border-amber-200">
          <AlertTriangle className="w-3 h-3 text-amber-600" />
          Moderate ({score}/100)
        </span>
      );
    }
    return (
      <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[10px] font-semibold bg-rose-50 text-rose-700 border border-rose-200">
        <ShieldAlert className="w-3 h-3 text-rose-600" />
        High Risk ({score}/100)
      </span>
    );
  };

  const getFrameworkLabel = (framework: OutreachFramework) => {
    switch (framework) {
      case 'question_value_cta':
        return 'Question - Value - CTA';
      case 'before_after_bridge':
        return 'Before - After - Bridge';
      case 'observation_idea_question':
        return 'Observation - Idea - Question';
      case 'pain_agitate_solve':
      default:
        return 'Problem - Agitate - Solve';
    }
  };

  return (
    <div className="space-y-6">
      {/* Top Banner */}
      <div className="bg-gradient-to-br from-[#FFF1E6] via-[#FFF8F3] to-card rounded-2xl p-5 text-text shadow-xs border border-border">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <div className="space-y-1">
            <div className="flex items-center gap-1.5 text-accent text-xs font-bold uppercase tracking-wider">
              <Sparkles className="w-3.5 h-3.5 text-accent" />
              <span>AI Cold Outreach & Cal.com Scheduling</span>
            </div>
            <h2 className="text-xl font-bold text-text">Outbound Email Drafts & Queue</h2>
            <p className="text-xs text-text-secondary max-w-2xl">
              Personalized cold pitches generated by Gemini AI with your Cal.com meeting link. Review, edit, and approve drafts before dispatch.
            </p>
          </div>
        </div>
      </div>

      {feedback && (
        <div
          className={`p-4 rounded-xl border flex items-center justify-between text-xs animate-in fade-in duration-200 ${
            feedback.type === 'success'
              ? 'bg-emerald-50 border-emerald-200 text-emerald-800'
              : 'bg-rose-50 border-rose-200 text-rose-800'
          }`}
        >
          <div className="flex items-center gap-2">
            {feedback.type === 'success' ? (
              <CheckCircle className="w-4 h-4 text-emerald-600 shrink-0" />
            ) : (
              <AlertTriangle className="w-4 h-4 text-rose-600 shrink-0" />
            )}
            <span className="font-medium">{feedback.message}</span>
          </div>
          <button
            onClick={() => setFeedback(null)}
            className="text-muted hover:text-text font-bold ml-4"
          >
            ×
          </button>
        </div>
      )}

      {/* Filter and Framework Bar */}
      <div className="bg-card rounded-2xl border border-border p-4 shadow-xs space-y-4">
        <div className="flex flex-col sm:flex-row items-center justify-between gap-3">
          {/* Status Tabs */}
          <div className="flex border border-border rounded-xl p-1 bg-track/70 w-full sm:w-auto">
            <button
              onClick={() => {
                setActiveFilter('all');
                setPage(1);
              }}
              className={`px-3 py-1.5 text-xs font-semibold rounded-lg transition-all ${
                activeFilter === 'all'
                  ? 'bg-card text-accent font-bold shadow-xs border border-border'
                  : 'text-text-secondary hover:text-text'
              }`}
            >
              All Drafts ({totalDrafts})
            </button>
            <button
              onClick={() => {
                setActiveFilter('draft');
                setPage(1);
              }}
              className={`px-3 py-1.5 text-xs font-semibold rounded-lg transition-all ${
                activeFilter === 'draft'
                  ? 'bg-card text-amber-700 font-bold shadow-xs border border-border'
                  : 'text-text-secondary hover:text-text'
              }`}
            >
              Pending Approval
            </button>
            <button
              onClick={() => {
                setActiveFilter('approved');
                setPage(1);
              }}
              className={`px-3 py-1.5 text-xs font-semibold rounded-lg transition-all ${
                activeFilter === 'approved'
                  ? 'bg-card text-emerald-700 font-bold shadow-xs border border-border'
                  : 'text-text-secondary hover:text-text'
              }`}
            >
              Approved (Ready)
            </button>
            <button
              onClick={() => {
                setActiveFilter('rejected');
                setPage(1);
              }}
              className={`px-3 py-1.5 text-xs font-semibold rounded-lg transition-all ${
                activeFilter === 'rejected'
                  ? 'bg-card text-rose-700 font-bold shadow-xs border border-border'
                  : 'text-text-secondary hover:text-text'
              }`}
            >
              Rejected
            </button>
          </div>

          <div className="flex items-center gap-3 w-full sm:w-auto justify-end text-xs">
            <div className="flex items-center gap-1.5 text-text-secondary font-medium">
              <Filter className="w-3.5 h-3.5 text-accent" />
              <span>Framework:</span>
            </div>
            <select
              value={selectedFramework}
              onChange={(e) => {
                setSelectedFramework(e.target.value);
                setPage(1);
              }}
              className="px-3 py-1.5 rounded-xl border border-border text-xs bg-card text-text shadow-2xs"
            >
              <option value="">All Copywriting Frameworks</option>
              <option value="pain_agitate_solve">Problem - Agitate - Solve (PAS)</option>
              <option value="question_value_cta">Question - Value - CTA (QVC)</option>
              <option value="before_after_bridge">Before - After - Bridge (BAB)</option>
              <option value="observation_idea_question">Observation - Idea - Question (OIQ)</option>
            </select>

            <button
              onClick={() => {
                setActiveFilter('all');
                setSelectedFramework('');
                setPage(1);
                loadDrafts();
              }}
              title="Refresh drafts"
              className="p-2 text-text-secondary hover:text-text rounded-xl border border-border hover:bg-card-hover shadow-2xs transition-colors"
            >
              <RefreshCw className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>
      </div>

      {/* Drafts List */}
      <div className="bg-card rounded-2xl border border-border overflow-hidden shadow-xs">
        {loading ? (
          <div className="p-6">
            <TableSkeleton rows={8} />
          </div>
        ) : drafts.length === 0 ? (
          <div className="p-8">
            <EmptyState
              icon={Mail}
              title="No Email Drafts Found"
              description={
                activeFilter !== 'all' || selectedFramework
                  ? 'No drafts match your current filter selection.'
                  : 'No outreach drafts have been generated yet. Go to Lead Management, select enrolled contacts, and generate AI personalized drafts.'
              }
              actionLabel={onNavigateToLeads ? 'Go to Lead Management' : undefined}
              onAction={onNavigateToLeads}
            />
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse text-xs min-w-[980px]">
              <thead>
                <tr className="bg-surface border-b border-border text-text-secondary font-semibold">
                  <th className="p-3.5 w-[240px]">Recipient & Company</th>
                  <th className="p-3.5">Subject & Preview</th>
                  <th className="p-3.5 w-[160px] whitespace-nowrap">Framework</th>
                  <th className="p-3.5 w-[140px] whitespace-nowrap">Deliverability</th>
                  <th className="p-3.5 w-[130px] whitespace-nowrap">Status</th>
                  <th className="p-3.5 text-right w-[210px] whitespace-nowrap">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border/60">
                {drafts.map((draft) => {
                  const contact = typeof draft.contactId === 'object' && draft.contactId !== null ? draft.contactId : ({} as any);
                  const company = typeof draft.companyId === 'object' && draft.companyId !== null ? draft.companyId : ({} as any);
                  const contactName = contact.contactName || 'General Contact';
                  const initials = contactName
                    .split(' ')
                    .map((n: string) => n[0])
                    .join('')
                    .substring(0, 2)
                    .toUpperCase();
                  const cleanSubject = (draft.subject || '').replace(/^Option\s*\d+\s*:\s*/i, '');

                  return (
                    <tr key={draft._id} className="hover:bg-card-hover transition-colors">
                      <td className="p-3.5">
                        <div className="flex items-center gap-2.5">
                          <div className="w-8 h-8 rounded-xl bg-gradient-to-br from-amber-100 to-orange-200 text-amber-900 border border-amber-300/40 flex items-center justify-center font-bold text-xs shrink-0 shadow-2xs">
                            {initials || 'GC'}
                          </div>
                          <div className="min-w-0">
                            <div className="font-bold text-text text-xs truncate">
                              {contactName}
                            </div>
                            <div className="text-[11px] text-text-secondary truncate">
                              {contact.jobTitle ? `${contact.jobTitle} • ` : ''}
                              <span className="font-semibold text-text">{company.companyName || '—'}</span>
                            </div>
                            <div className="text-[10px] font-mono text-muted mt-0.5 truncate">{contact.email}</div>
                          </div>
                        </div>
                      </td>
                      <td className="p-3.5 max-w-sm">
                        <div className="font-semibold text-text truncate" title={cleanSubject}>
                          {cleanSubject}
                        </div>
                        <div className="text-[11px] text-text-secondary line-clamp-1 mt-0.5" title={draft.bodyText}>
                          {draft.bodyText}
                        </div>
                      </td>
                      <td className="p-3.5 whitespace-nowrap">
                        <span className="inline-block px-2.5 py-1 rounded-lg text-[11px] font-medium bg-track/60 text-text border border-border">
                          {getFrameworkLabel(draft.framework)}
                        </span>
                      </td>
                      <td className="p-3.5 whitespace-nowrap">{getSpamScoreBadge(draft.spamScore)}</td>
                      <td className="p-3.5 whitespace-nowrap">{getStatusBadge(draft.approvalStatus)}</td>
                      <td className="p-3.5 text-right whitespace-nowrap">
                        <div className="flex items-center justify-end gap-1.5">
                          {draft.approvalStatus === 'approved' && (
                            <button
                              type="button"
                              disabled={sendingDraftId === draft._id}
                              onClick={async () => {
                                try {
                                  setSendingDraftId(draft._id);
                                  const res = await api.sendSingleApprovedMessage({ draftId: draft._id });
                                  if (res.success) {
                                    setFeedback({
                                      type: 'success',
                                      message: `Email dispatched successfully in Sandbox mode! Sent to: ${res.data.recipient}. Check your Gmail inbox now.`,
                                    });
                                  }
                                } catch (err: any) {
                                  setFeedback({
                                    type: 'error',
                                    message: err.message || 'Failed to dispatch email.',
                                  });
                                } finally {
                                  setSendingDraftId(null);
                                }
                              }}
                              className="inline-flex items-center gap-1 px-2.5 py-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white font-medium text-xs transition-all shadow-xs disabled:opacity-50 cursor-pointer"
                              title="Send email immediately to your sandbox inbox"
                            >
                              {sendingDraftId === draft._id ? (
                                <>
                                  <Loader2 className="w-3.5 h-3.5 animate-spin" />
                                  <span>Sending...</span>
                                </>
                              ) : (
                                <>
                                  <Send className="w-3.5 h-3.5" />
                                  <span>Send Test</span>
                                </>
                              )}
                            </button>
                          )}
                          <button
                            type="button"
                            onClick={() => handleOpenReview(draft)}
                            className="inline-flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg bg-accent/10 hover:bg-accent text-accent hover:text-white font-medium text-xs transition-all cursor-pointer shadow-2xs"
                          >
                            <Eye className="w-3.5 h-3.5" />
                            <span>Review & Edit</span>
                          </button>
                          <button
                            type="button"
                            onClick={() => handleDelete(draft._id)}
                            className="p-1.5 rounded-lg text-muted hover:text-rose-600 hover:bg-rose-50 transition-colors cursor-pointer"
                            title="Delete draft"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>

            {/* Pagination */}
            <div className="px-6 py-4 bg-surface border-t border-border flex items-center justify-between text-xs text-text-secondary">
              <div>
                Showing <span className="font-semibold text-text">{(page - 1) * 12 + 1}</span> to{' '}
                <span className="font-semibold text-text">
                  {Math.min(page * 12, totalDrafts)}
                </span>{' '}
                of <span className="font-semibold text-text">{totalDrafts}</span> drafts
              </div>

              <div className="flex items-center gap-2">
                <button
                  onClick={() => setPage((p) => Math.max(p - 1, 1))}
                  disabled={page <= 1}
                  className="p-1.5 rounded-lg border border-border bg-card text-text disabled:opacity-40 disabled:cursor-not-allowed hover:bg-card-hover transition-colors cursor-pointer"
                >
                  <ChevronLeft className="w-4 h-4" />
                </button>
                <span className="font-medium text-text">
                  Page {page} of {totalPages}
                </span>
                <button
                  onClick={() => setPage((p) => Math.min(p + 1, totalPages))}
                  disabled={page >= totalPages}
                  className="p-1.5 rounded-lg border border-border bg-card text-text disabled:opacity-40 disabled:cursor-not-allowed hover:bg-card-hover transition-colors cursor-pointer"
                >
                  <ChevronRight className="w-4 h-4" />
                </button>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Review & Edit Modal */}
      {isModalOpen && selectedDraft && (
        <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-xs flex items-center justify-center p-4 animate-in fade-in duration-150">
          <div className="bg-card rounded-2xl max-w-4xl w-full max-h-[92vh] flex flex-col shadow-2xl border border-border animate-in zoom-in-95 duration-150 overflow-hidden">
            {/* Modal Header */}
            <div className="p-5 border-b border-border bg-surface flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-accent-soft border border-accent/20 flex items-center justify-center text-accent">
                  <Mail className="w-5 h-5" />
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <h3 className="text-base font-bold text-text">Review & Approve Outreach Draft</h3>
                    {getStatusBadge(selectedDraft.approvalStatus)}
                  </div>
                  <p className="text-xs text-text-secondary">
                    Recipient:{' '}
                    <span className="font-semibold text-text">
                      {(selectedDraft.contactId as any)?.contactName || 'Prospect'}
                    </span>{' '}
                    ({(selectedDraft.contactId as any)?.email}) at{' '}
                    <span className="font-semibold text-text">
                      {(selectedDraft.companyId as any)?.companyName}
                    </span>
                  </p>
                </div>
              </div>
              <button
                onClick={() => setIsModalOpen(false)}
                className="text-muted hover:text-text text-xl font-bold p-1 rounded-lg hover:bg-card-hover transition-colors cursor-pointer"
              >
                ×
              </button>
            </div>

            {/* Modal Body: Two Column Layout */}
            <div className="flex-1 overflow-y-auto p-6 grid grid-cols-1 lg:grid-cols-3 gap-6 bg-card">
              {/* Left Column: Editor & Subject Variants (2 Cols) */}
              <div className="lg:col-span-2 space-y-5">
                {/* 3 AI Subject Options */}
                <div>
                  <label className="block text-xs font-bold text-text uppercase tracking-wider mb-2">
                    AI Subject Line Options (Select or Customize)
                  </label>
                  <div className="space-y-2">
                    {(selectedDraft.subjectOptions || []).map((opt, idx) => (
                      <div
                        key={idx}
                        onClick={() => handleSelectVariant(opt, idx)}
                        className={`p-3 rounded-xl border text-xs cursor-pointer transition-all flex items-start gap-2.5 ${
                          editedVariantIndex === idx
                            ? 'bg-accent-soft/30 border-accent ring-1 ring-accent'
                            : 'bg-surface border-border hover:border-accent/40 hover:bg-card-hover'
                        }`}
                      >
                        <div
                          className={`w-4 h-4 rounded-full mt-0.5 flex items-center justify-center text-[10px] shrink-0 font-bold ${
                            editedVariantIndex === idx
                              ? 'bg-accent text-on-accent'
                              : 'border border-border text-muted'
                          }`}
                        >
                          {idx + 1}
                        </div>
                        <div className="flex-1">
                          <span className="font-semibold text-text">{opt}</span>
                          <div className="text-[10px] text-muted mt-0.5">
                            {idx === 0 ? 'Curiosity Angle' : idx === 1 ? 'Pain-Point Angle' : 'Observation Angle'}
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Subject Editor */}
                <div>
                  <label className="block text-xs font-bold text-text uppercase tracking-wider mb-1">
                    Active Subject Line
                  </label>
                  <input
                    type="text"
                    value={editedSubject}
                    onChange={(e) => setEditedSubject(e.target.value)}
                    className="w-full px-3.5 py-2 border border-border rounded-xl text-xs font-semibold bg-surface text-text focus:ring-2 focus:ring-accent/20 focus:border-accent"
                  />
                </div>

                {/* Body Editor with Plain / HTML toggle */}
                <div>
                  <div className="flex items-center justify-between mb-1.5">
                    <label className="text-xs font-bold text-text uppercase tracking-wider">
                      Personalized Message Body
                    </label>
                    <div className="flex border border-border rounded-lg p-0.5 bg-surface text-[10px]">
                      <button
                        type="button"
                        onClick={() => setViewMode('text')}
                        className={`px-2.5 py-1 rounded-md font-semibold transition-all cursor-pointer ${
                          viewMode === 'text' ? 'bg-card shadow-xs text-text font-bold' : 'text-text-secondary hover:text-text'
                        }`}
                      >
                        Plain Text
                      </button>
                      <button
                        type="button"
                        onClick={() => setViewMode('html')}
                        className={`px-2.5 py-1 rounded-md font-semibold transition-all cursor-pointer ${
                          viewMode === 'html' ? 'bg-card shadow-xs text-text font-bold' : 'text-text-secondary hover:text-text'
                        }`}
                      >
                        HTML Preview
                      </button>
                    </div>
                  </div>

                  {viewMode === 'text' ? (
                    <textarea
                      rows={10}
                      value={editedBodyText}
                      onChange={(e) => setEditedBodyText(e.target.value)}
                      className="w-full p-3.5 border border-border rounded-xl text-xs font-mono leading-relaxed bg-surface text-text focus:ring-2 focus:ring-accent/20 focus:border-accent"
                    />
                  ) : (
                    <div
                      className="p-4 border border-border rounded-xl bg-surface/50 text-xs text-text leading-relaxed max-h-72 overflow-y-auto prose prose-xs"
                      dangerouslySetInnerHTML={{ __html: selectedDraft.bodyHtml }}
                    />
                  )}
                </div>
              </div>

              {/* Right Column: Grounded Evidence & Deliverability Audit */}
              <div className="space-y-5">
                {/* Personalization Evidence Panel */}
                <div className="bg-surface border border-border rounded-2xl p-4 space-y-3 shadow-2xs">
                  <div className="flex items-center gap-1.5 text-xs font-bold text-text uppercase tracking-wider">
                    <Lightbulb className="w-4 h-4 text-amber-500" />
                    <span>Grounding Evidence (Phase 1)</span>
                  </div>

                  <div className="space-y-2 text-xs">
                    <div>
                      <span className="text-[10px] font-bold text-muted uppercase">Cybells Capability Matched:</span>
                      <p className="font-semibold text-accent mt-0.5">
                        {selectedDraft.personalizationEvidence?.cybellsCapabilityUsed || 'General AI Automation'}
                      </p>
                    </div>

                    <div>
                      <span className="text-[10px] font-bold text-muted uppercase">Phase 1 Problems Targeted:</span>
                      <ul className="list-disc list-inside space-y-1 text-text-secondary font-medium text-[11px] mt-1">
                        {(selectedDraft.personalizationEvidence?.phase1ProblemsUsed || []).map((prob, i) => (
                          <li key={i}>{prob}</li>
                        ))}
                      </ul>
                    </div>

                    <div>
                      <span className="text-[10px] font-bold text-muted uppercase">Strategic Alignment:</span>
                      <p className="text-text-secondary italic text-[11px] mt-0.5 leading-relaxed">
                        "{selectedDraft.personalizationEvidence?.matchedReasoning}"
                      </p>
                    </div>
                  </div>
                </div>

                {/* Spam Scorer & Deliverability Check */}
                <div className="bg-surface border border-border rounded-2xl p-4 space-y-3 shadow-2xs">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-1.5 text-xs font-bold text-text uppercase tracking-wider">
                      <ShieldAlert className="w-4 h-4 text-accent" />
                      <span>Deliverability Audit</span>
                    </div>
                    {getSpamScoreBadge(selectedDraft.spamScore)}
                  </div>

                  {selectedDraft.spamFlags && selectedDraft.spamFlags.length > 0 ? (
                    <div className="space-y-1.5">
                      <span className="text-[10px] font-semibold text-rose-600">Flagged Risk Triggers:</span>
                      <ul className="space-y-1">
                        {selectedDraft.spamFlags.map((flag, idx) => (
                          <li
                            key={idx}
                            className="text-[11px] text-rose-700 bg-rose-500/10 border border-rose-500/20 px-2 py-1 rounded-lg"
                          >
                            • {flag}
                          </li>
                        ))}
                      </ul>
                    </div>
                  ) : (
                    <div className="text-[11px] text-emerald-700 dark:text-emerald-400 bg-emerald-500/10 border border-emerald-500/20 p-3 rounded-xl flex items-center gap-2">
                      <CheckCircle className="w-4 h-4 text-emerald-600 shrink-0" />
                      <span>Pristine email copy. No aggressive spam trigger phrases or formatting flags.</span>
                    </div>
                  )}

                  <div className="pt-2 border-t border-border text-[10px] text-muted">
                    Model: <span className="font-mono text-text font-medium">{selectedDraft.geminiModel || 'gemini'}</span>
                  </div>
                </div>

                {/* Unsubscribe & Postal Notice Warning */}
                <div className="bg-accent-soft/30 border border-accent/20 rounded-2xl p-3 text-[11px] text-text flex items-start gap-2 shadow-2xs">
                  <ShieldCheck className="w-4 h-4 text-accent shrink-0 mt-0.5" />
                  <p className="text-text-secondary leading-relaxed">
                    Compliant one-click unsubscribe token and postal address are automatically injected into the footer
                    prior to dispatch.
                  </p>
                </div>
              </div>
            </div>

            {/* Modal Footer: Action Buttons */}
            <div className="p-4 border-t border-border bg-surface flex items-center justify-between">
              <button
                type="button"
                onClick={() => handleUpdateStatus(selectedDraft._id, 'rejected', false)}
                disabled={isSaving}
                className="px-4 py-2 border border-rose-500/30 text-rose-600 hover:bg-rose-500/10 text-xs font-semibold rounded-xl transition-colors cursor-pointer"
              >
                Reject Draft
              </button>

              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => handleUpdateStatus(selectedDraft._id, 'draft', true)}
                  disabled={isSaving}
                  className="px-4 py-2 border border-border text-text-secondary hover:text-text hover:bg-card-hover text-xs font-semibold rounded-xl transition-colors shadow-2xs cursor-pointer"
                >
                  Save Edits (Keep as Draft)
                </button>

                <button
                  type="button"
                  onClick={() => handleUpdateStatus(selectedDraft._id, 'approved', true)}
                  disabled={isSaving || !editedBodyText.trim() || editedBodyText.replace(/---\s*If you prefer[\s\S]*$/i, '').trim().length < 20}
                  className="px-5 py-2 bg-accent hover:bg-accent-hover text-on-accent text-xs font-bold rounded-xl shadow-xs shadow-accent/20 transition-all flex items-center gap-1.5 cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
                  title={!editedBodyText.trim() ? "Cannot approve empty body" : "Approve for outreach"}
                >
                  <Check className="w-4 h-4" />
                  <span>Approve for Outreach</span>
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

