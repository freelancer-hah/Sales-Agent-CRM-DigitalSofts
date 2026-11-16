import React, { useState } from 'react';
import {
  X,
  Globe,
  Mail,
  Phone,
  MapPin,
  Building2,
  Users,
  Sparkles,
  ExternalLink,
  Edit2,
  Save,
  CheckCircle2,
  AlertCircle,
  FileText,
  Bookmark,
  BookmarkCheck,
  RefreshCw,
  Award,
  TrendingUp,
  Target,
  ArrowUpRight,
  ShieldCheck,
  PhoneCall,
  Star,
  MessageSquare,
  ThumbsDown,
  Briefcase,
  Calendar,
} from 'lucide-react';
import { ICompany, IDecisionMaker, ISource } from '../types';
import { Badge, ScoreBadge } from './Badge';
import { CalBookingModal } from './CalBookingModal';

interface CompanyModalProps {
  company: ICompany | null;
  onClose: () => void;
  onUpdate: (id: string, updates: Partial<ICompany>) => Promise<void>;
  onAnalyze?: (id: string) => Promise<void>;
  onScrape?: (id: string) => Promise<void>;
  onDiscoverDecisionMakers?: (id: string) => Promise<void>;
  onScrapeJobs?: (id: string) => Promise<void>;
  onReScore?: (id: string) => Promise<void>;
}

type SheetTab = 'overview' | 'ai' | 'decision-makers' | 'reviews' | 'jobs' | 'sources';

export const CompanyModal: React.FC<CompanyModalProps> = ({
  company,
  onClose,
  onUpdate,
  onAnalyze,
  onScrape,
  onDiscoverDecisionMakers,
  onScrapeJobs,
  onReScore,
}) => {
  if (!company) return null;

  const [activeTab, setActiveTab] = useState<SheetTab>('overview');
  const [isEditing, setIsEditing] = useState(false);
  const [editedName, setEditedName] = useState(company.companyName);
  const [editedIndustry, setEditedIndustry] = useState(company.industry);
  const [editedDescription, setEditedDescription] = useState(company.description);
  const [editedSize, setEditedSize] = useState(company.companySize);
  const [editedNotes, setEditedNotes] = useState(company.notes || '');
  const [reviewStatus, setReviewStatus] = useState(company.reviewStatus || 'new');
  const [isSaved, setIsSaved] = useState(company.isSaved || false);
  const [isSaving, setIsSaving] = useState(false);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [isScraping, setIsScraping] = useState(false);
  const [isDiscoveringDMs, setIsDiscoveringDMs] = useState(false);
  const [isScrapingJobs, setIsScrapingJobs] = useState(false);
  const [isReScoring, setIsReScoring] = useState(false);
  const [calModalOpen, setCalModalOpen] = useState(false);
  const [isAddingEmail, setIsAddingEmail] = useState(false);
  const [customEmailInput, setCustomEmailInput] = useState('');

  const handleAddEmail = async () => {
    if (!customEmailInput.trim() || !customEmailInput.includes('@')) return;
    const currentEmails = company.emails || [];
    const updatedEmails = Array.from(new Set([...currentEmails, customEmailInput.trim().toLowerCase()]));
    try {
      await onUpdate(company._id, { emails: updatedEmails });
      setCustomEmailInput('');
      setIsAddingEmail(false);
    } catch (err: any) {
      alert('Failed to add email: ' + err.message);
    }
  };

  const handleSaveEdits = async () => {
    setIsSaving(true);
    try {
      await onUpdate(company._id, {
        companyName: editedName,
        industry: editedIndustry,
        description: editedDescription,
        companySize: editedSize as any,
        notes: editedNotes,
        reviewStatus,
        isSaved,
      });
      setIsEditing(false);
    } finally {
      setIsSaving(false);
    }
  };

  const handleToggleSave = async () => {
    const nextSaved = !isSaved;
    setIsSaved(nextSaved);
    await onUpdate(company._id, { isSaved: nextSaved });
  };

  const handleTriggerAnalysis = async () => {
    if (!onAnalyze) return;
    setIsAnalyzing(true);
    try {
      await onAnalyze(company._id);
    } finally {
      setIsAnalyzing(false);
    }
  };

  const handleTriggerScrape = async () => {
    if (!onScrape) return;
    setIsScraping(true);
    try {
      await onScrape(company._id);
    } finally {
      setIsScraping(false);
    }
  };

  const handleTriggerDiscoverDMs = async () => {
    if (!onDiscoverDecisionMakers) return;
    setIsDiscoveringDMs(true);
    try {
      await onDiscoverDecisionMakers(company._id);
    } finally {
      setIsDiscoveringDMs(false);
    }
  };

  const handleTriggerScrapeJobs = async () => {
    if (!onScrapeJobs || isScrapingJobs) return;
    setIsScrapingJobs(true);
    try {
      await onScrapeJobs(company._id);
      setActiveTab('jobs');
    } finally {
      setIsScrapingJobs(false);
    }
  };

  const handleTriggerReScore = async () => {
    if (!onReScore) return;
    setIsReScoring(true);
    try {
      await onReScore(company._id);
    } finally {
      setIsReScoring(false);
    }
  };

  const oppCount = company.aiAnalysis?.opportunities?.length || 0;
  const dmCount = company.decisionMakers?.length || 0;
  const srcCount = company.sources?.length || 0;

  return (
    <div className="fixed inset-0 z-50 overflow-hidden">
      {/* Backdrop */}
      <div
        className="fixed inset-0 bg-slate-900/50 backdrop-blur-xs transition-opacity animate-fade-in"
        onClick={onClose}
      />

      {/* Slide-over Drawer Sheet */}
      <div className="fixed inset-y-0 right-0 max-w-2xl w-full bg-white shadow-2xl border-l border-slate-200 flex flex-col z-50 animate-slide-in-right">
        {/* Pinned Top Bar */}
        <div className="px-6 py-4 border-b border-slate-200 bg-slate-50/90 backdrop-blur flex items-center justify-between shrink-0">
          <div className="flex items-center gap-3 min-w-0">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-indigo-600 to-indigo-500 text-white flex items-center justify-center font-bold text-lg shadow-sm shrink-0">
              {company.companyName.charAt(0).toUpperCase()}
            </div>
            <div className="min-w-0">
              <div className="flex items-center gap-2">
                <h2 className="text-base font-bold text-slate-900 truncate">{company.companyName}</h2>
                <ScoreBadge score={company.leadScore} />
              </div>
              <div className="flex items-center gap-2 text-xs text-slate-500">
                <span className="truncate">{company.industry}</span>
                {company.domain && (
                  <>
                    <span>•</span>
                    <a
                      href={company.website || `https://${company.domain}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-indigo-600 hover:underline flex items-center gap-1 font-mono text-[11px]"
                    >
                      <span>{company.domain}</span>
                      <ExternalLink className="w-3 h-3" />
                    </a>
                  </>
                )}
              </div>
            </div>
          </div>

          <div className="flex items-center gap-1.5 shrink-0">
            <button
              type="button"
              onClick={handleToggleSave}
              className={`p-1.5 rounded-lg border transition-colors ${
                isSaved
                  ? 'bg-amber-50 text-amber-600 border-amber-200'
                  : 'bg-white text-slate-400 hover:text-slate-600 border-slate-200'
              }`}
              title={isSaved ? 'Lead Saved' : 'Save Lead'}
            >
              {isSaved ? <BookmarkCheck className="w-4 h-4 fill-amber-500" /> : <Bookmark className="w-4 h-4" />}
            </button>

            {!isEditing ? (
              <button
                type="button"
                onClick={() => setIsEditing(true)}
                className="p-1.5 bg-white border border-slate-200 text-slate-700 hover:bg-slate-50 rounded-lg text-xs font-medium transition-colors"
                title="Edit basic info"
              >
                <Edit2 className="w-3.5 h-3.5" />
              </button>
            ) : (
              <button
                type="button"
                onClick={handleSaveEdits}
                disabled={isSaving}
                className="flex items-center gap-1 px-2.5 py-1.5 bg-indigo-600 text-white rounded-lg text-xs font-semibold hover:bg-indigo-700 transition-colors shadow-xs"
              >
                <Save className="w-3.5 h-3.5" />
                <span>{isSaving ? 'Saving...' : 'Save'}</span>
              </button>
            )}

            <button
              type="button"
              onClick={onClose}
              className="p-1.5 text-slate-400 hover:text-slate-700 rounded-lg hover:bg-slate-200/60 transition-colors ml-1"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Quick Action Toolbar */}
        <div className="px-6 py-2.5 bg-white border-b border-slate-100 flex items-center justify-between gap-2 overflow-x-auto shrink-0 text-xs">
          <div className="flex items-center gap-2">
            {company.website && onScrape && (
              <button
                type="button"
                onClick={handleTriggerScrape}
                disabled={isScraping}
                className="flex items-center gap-1.5 px-2.5 py-1.5 bg-emerald-50 text-emerald-700 hover:bg-emerald-100 border border-emerald-200 rounded-lg font-semibold transition-colors shadow-2xs"
              >
                <Globe className="w-3.5 h-3.5" />
                <span>{isScraping ? 'Scraping...' : 'Scrape Web'}</span>
              </button>
            )}

            {onAnalyze && (
              <button
                type="button"
                onClick={handleTriggerAnalysis}
                disabled={isAnalyzing}
                className={`flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg font-semibold transition-colors shadow-2xs ${
                  company.analysisStatus === 'pending'
                    ? 'bg-indigo-600 text-white hover:bg-indigo-700 ring-2 ring-indigo-200'
                    : 'bg-indigo-50 text-indigo-700 hover:bg-indigo-100 border border-indigo-200'
                }`}
                title="Generate AI pain points, opportunities, and lead score"
              >
                <Sparkles className={`w-3.5 h-3.5 ${company.analysisStatus === 'pending' ? 'text-white' : 'text-indigo-600'}`} />
                <span>{isAnalyzing ? 'Analyzing...' : company.analysisStatus === 'pending' ? 'Run Gemini AI' : 'Gemini AI'}</span>
              </button>
            )}

            {onDiscoverDecisionMakers && (
              <button
                type="button"
                onClick={handleTriggerDiscoverDMs}
                disabled={isDiscoveringDMs}
                className="flex items-center gap-1.5 px-2.5 py-1.5 bg-sky-50 text-sky-700 hover:bg-sky-100 border border-sky-200 rounded-lg font-semibold transition-colors shadow-2xs"
              >
                <Users className="w-3.5 h-3.5" />
                <span>{isDiscoveringDMs ? 'Finding...' : 'Find DMs'}</span>
              </button>
            )}

            {onScrapeJobs && (
              <button
                type="button"
                onClick={handleTriggerScrapeJobs}
                disabled={isScrapingJobs}
                className="flex items-center gap-1.5 px-2.5 py-1.5 bg-blue-50 text-blue-700 hover:bg-blue-100 border border-blue-200 rounded-lg font-semibold transition-colors shadow-2xs cursor-pointer"
                title="Search active job postings on LinkedIn, Indeed, Glassdoor via JobSpy"
              >
                <Briefcase className="w-3.5 h-3.5 text-blue-600" />
                <span>{isScrapingJobs ? 'Searching Jobs...' : 'JobSpy Jobs'}</span>
              </button>
            )}

            <button
              type="button"
              onClick={() => setCalModalOpen(true)}
              className="flex items-center gap-1.5 px-2.5 py-1.5 bg-emerald-50 text-emerald-700 hover:bg-emerald-100 border border-emerald-200 rounded-lg font-semibold transition-colors shadow-2xs cursor-pointer"
              title="Schedule a discovery call via Cal.diy"
            >
              <Calendar className="w-3.5 h-3.5 text-emerald-600" />
              <span>Schedule Call</span>
            </button>
          </div>

          {onReScore && (
            <button
              type="button"
              onClick={handleTriggerReScore}
              disabled={isReScoring}
              className="flex items-center gap-1 text-[11px] font-medium text-slate-500 hover:text-slate-800 transition-colors"
            >
              <RefreshCw className={`w-3 h-3 ${isReScoring ? 'animate-spin text-indigo-600' : ''}`} />
              <span>Re-Score</span>
            </button>
          )}
        </div>

        {/* Tab Navigation */}
        <div className="px-6 bg-slate-50 border-b border-slate-200 flex items-center gap-4 text-xs font-semibold shrink-0">
          <button
            type="button"
            onClick={() => setActiveTab('overview')}
            className={`py-3 border-b-2 transition-all flex items-center gap-1.5 ${
              activeTab === 'overview'
                ? 'border-indigo-600 text-indigo-600 font-bold'
                : 'border-transparent text-slate-500 hover:text-slate-800'
            }`}
          >
            <Building2 className="w-3.5 h-3.5" />
            <span>Profile & Contact</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('ai')}
            className={`py-3 border-b-2 transition-all flex items-center gap-1.5 ${
              activeTab === 'ai'
                ? 'border-indigo-600 text-indigo-600 font-bold'
                : 'border-transparent text-slate-500 hover:text-slate-800'
            }`}
          >
            <Sparkles className="w-3.5 h-3.5 text-indigo-500" />
            <span>AI Opportunities</span>
            {oppCount > 0 && (
              <span className="text-[10px] px-1.5 py-0.2 rounded-full bg-indigo-100 text-indigo-700 font-bold">
                {oppCount}
              </span>
            )}
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('decision-makers')}
            className={`py-3 border-b-2 transition-all flex items-center gap-1.5 ${
              activeTab === 'decision-makers'
                ? 'border-indigo-600 text-indigo-600 font-bold'
                : 'border-transparent text-slate-500 hover:text-slate-800'
            }`}
          >
            <Users className="w-3.5 h-3.5 text-sky-500" />
            <span>Decision Makers</span>
            {dmCount > 0 && (
              <span className="text-[10px] px-1.5 py-0.2 rounded-full bg-sky-100 text-sky-700 font-bold">
                {dmCount}
              </span>
            )}
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('reviews')}
            className={`py-3 border-b-2 transition-all flex items-center gap-1.5 cursor-pointer ${
              activeTab === 'reviews'
                ? 'border-accent text-accent font-bold'
                : 'border-transparent text-text-secondary hover:text-text'
            }`}
          >
            <Star className="w-3.5 h-3.5 text-amber-500 fill-amber-500" />
            <span>Google Reviews & Pain Points</span>
            {(company.reviews?.length || company.googleRating) ? (
              <span className="text-[10px] px-1.5 py-0.2 rounded-full bg-amber-100 text-amber-800 font-bold">
                {company.reviews?.length ? company.reviews.length : `${company.googleRating}★`}
              </span>
            ) : null}
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('jobs')}
            className={`py-3 border-b-2 transition-all flex items-center gap-1.5 cursor-pointer ${
              activeTab === 'jobs'
                ? 'border-accent text-accent font-bold'
                : 'border-transparent text-text-secondary hover:text-text'
            }`}
          >
            <Briefcase className="w-3.5 h-3.5 text-blue-500" />
            <span>Active Hirings (JobSpy)</span>
            {company.jobPostings && company.jobPostings.length > 0 && (
              <span className="text-[10px] px-1.5 py-0.2 rounded-full bg-blue-100 text-blue-800 font-bold">
                {company.jobPostings.length}
              </span>
            )}
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('sources')}
            className={`py-3 border-b-2 transition-all flex items-center gap-1.5 ${
              activeTab === 'sources'
                ? 'border-indigo-600 text-indigo-600 font-bold'
                : 'border-transparent text-slate-500 hover:text-slate-800'
            }`}
          >
            <ShieldCheck className="w-3.5 h-3.5 text-emerald-500" />
            <span>Sources</span>
            {srcCount > 0 && (
              <span className="text-[10px] px-1.5 py-0.2 rounded-full bg-slate-200 text-slate-700 font-mono">
                {srcCount}
              </span>
            )}
          </button>
        </div>

        {/* Tab Body */}
        <div className="flex-1 overflow-y-auto p-6 space-y-6 text-xs text-slate-700">
          {/* TAB 1: OVERVIEW & PROFILE */}
          {activeTab === 'overview' && (
            <div className="space-y-6">
              {/* Lead Relevance Summary Pill */}
              <div className="bg-slate-900 rounded-xl p-4 text-white shadow-xs flex items-center justify-between gap-4">
                <div className="flex items-center gap-3">
                  <div className="w-9 h-9 rounded-lg bg-indigo-500/20 text-indigo-300 border border-indigo-500/30 flex items-center justify-center shrink-0">
                    <Award className="w-4 h-4 text-amber-400" />
                  </div>
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="font-bold text-xs text-white">Qualification Score</span>
                      <span className={`text-[10px] px-1.5 py-0.2 rounded-full font-bold uppercase tracking-wider ${
                        company.leadScore >= 75
                          ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-400/30'
                          : company.leadScore >= 50
                          ? 'bg-amber-500/20 text-amber-300 border border-amber-400/30'
                          : 'bg-slate-500/20 text-slate-300 border border-slate-400/30'
                      }`}>
                        {company.leadScore >= 75 ? '🔥 Hot Lead' : company.leadScore >= 50 ? '⚡ Priority' : '❄️ Low'}
                      </span>
                    </div>
                    <p className="text-[11px] text-slate-400">
                      Calculated from verified phone, website, industry alignment & Google Maps presence.
                    </p>
                  </div>
                </div>
                <div className="text-right shrink-0">
                  <span className="text-2xl font-black text-white">{company.leadScore}</span>
                  <span className="text-[10px] text-slate-400 block font-mono">/ 100 PTS</span>
                </div>
              </div>

              {/* Google Maps Reputation & Pain Point Detector */}
              {(company.googleRating !== undefined || (company.reviews && company.reviews.length > 0)) && (
                <div className="bg-gradient-to-r from-amber-50/70 via-orange-50/50 to-white border border-amber-200/80 rounded-xl p-3.5 flex items-center justify-between gap-3 shadow-2xs">
                  <div className="flex items-center gap-2.5">
                    <div className="w-8 h-8 rounded-lg bg-amber-500/10 text-amber-600 flex items-center justify-center shrink-0">
                      <Star className="w-4 h-4 fill-amber-500 text-amber-500" />
                    </div>
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="font-bold text-xs text-text">Google Maps Rating: {company.googleRating ? company.googleRating.toFixed(1) : 'Unrated'}★</span>
                        <span className="text-[10px] px-1.5 py-0.2 rounded-full font-mono bg-amber-100 text-amber-800 font-bold">
                          {company.googleReviewsCount || company.reviews?.length || 0} Reviews
                        </span>
                      </div>
                      <p className="text-[11px] text-text-secondary mt-0.5">
                        {company.reviews && company.reviews.some((r) => (r.rating || 5) <= 3)
                          ? '⚠️ Critical customer complaints detected — real pain points identified for outreach!'
                          : 'Customer sentiment scanned via Google Maps microservice.'}
                      </p>
                    </div>
                  </div>
                  <button
                    type="button"
                    onClick={() => setActiveTab('reviews')}
                    className="px-2.5 py-1.5 rounded-lg bg-card border border-border hover:border-accent text-accent font-semibold text-xs transition-all shrink-0 cursor-pointer shadow-2xs hover:shadow-xs"
                  >
                    View Reviews & Pain Points →
                  </button>
                </div>
              )}

              {/* Verified Contact Details Card */}
              <div className="bg-white border border-slate-200/80 rounded-xl p-4 space-y-3 shadow-2xs">
                <h3 className="text-xs font-bold uppercase tracking-wider text-slate-900 flex items-center gap-1.5">
                  <Phone className="w-3.5 h-3.5 text-indigo-600" />
                  <span>Direct Business Contacts</span>
                </h3>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-1">
                  {/* Phone */}
                  <div className="p-3 rounded-lg bg-slate-50 border border-slate-200/60 space-y-1">
                    <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">Phone Numbers</span>
                    {company.phoneNumbers && company.phoneNumbers.length > 0 ? (
                      company.phoneNumbers.map((phone, idx) => (
                        <a
                          key={idx}
                          href={`tel:${phone}`}
                          className="flex items-center gap-1.5 font-semibold text-slate-800 hover:text-indigo-600 transition-colors font-mono"
                        >
                          <PhoneCall className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
                          <span>{phone}</span>
                        </a>
                      ))
                    ) : (
                      <span className="text-slate-400 italic">No phone recorded</span>
                    )}
                  </div>

                  {/* Emails */}
                  <div className="p-3 rounded-lg bg-slate-50 border border-slate-200/60 space-y-1">
                    <div className="flex items-center justify-between">
                      <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">Public Emails</span>
                      {!isAddingEmail && (
                        <button
                          type="button"
                          onClick={() => setIsAddingEmail(true)}
                          className="text-[10px] text-indigo-600 hover:text-indigo-800 font-semibold cursor-pointer"
                        >
                          + Add Email
                        </button>
                      )}
                    </div>
                    {isAddingEmail && (
                      <div className="flex items-center gap-1.5 py-1">
                        <input
                          type="email"
                          placeholder="e.g. info@company.com"
                          value={customEmailInput}
                          onChange={(e) => setCustomEmailInput(e.target.value)}
                          className="px-2 py-1 text-xs border border-indigo-300 rounded font-mono flex-1 focus:ring-1 focus:ring-indigo-500 bg-white"
                        />
                        <button
                          type="button"
                          onClick={handleAddEmail}
                          className="px-2.5 py-1 bg-indigo-600 text-white text-[11px] font-semibold rounded hover:bg-indigo-700 cursor-pointer"
                        >
                          Save
                        </button>
                        <button
                          type="button"
                          onClick={() => setIsAddingEmail(false)}
                          className="px-1.5 py-1 text-slate-400 hover:text-slate-600 text-xs cursor-pointer"
                        >
                          Cancel
                        </button>
                      </div>
                    )}
                    {company.emails && company.emails.length > 0 ? (
                      company.emails.map((email, idx) => (
                        <a
                          key={idx}
                          href={`mailto:${email}`}
                          className="flex items-center gap-1.5 font-medium text-slate-800 hover:text-indigo-600 transition-colors font-mono truncate"
                        >
                          <Mail className="w-3.5 h-3.5 text-indigo-600 shrink-0" />
                          <span className="truncate">{email}</span>
                        </a>
                      ))
                    ) : !isAddingEmail ? (
                      <span className="text-slate-400 italic">No public email found</span>
                    ) : null}
                  </div>
                </div>

                {/* Address */}
                {company.address && (
                  <div className="p-2.5 rounded-lg bg-slate-50 border border-slate-200/60 flex items-start gap-2">
                    <MapPin className="w-3.5 h-3.5 text-rose-500 mt-0.5 shrink-0" />
                    <div>
                      <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">Physical Location</span>
                      <span className="text-slate-700 font-medium leading-relaxed">{company.address}</span>
                    </div>
                  </div>
                )}
              </div>

              {/* Description & Core Profile */}
              <div className="bg-white border border-slate-200/80 rounded-xl p-4 space-y-3 shadow-2xs">
                <h3 className="text-xs font-bold uppercase tracking-wider text-slate-900 flex items-center gap-1.5">
                  <Building2 className="w-3.5 h-3.5 text-indigo-600" />
                  <span>Company Profile</span>
                </h3>

                {!isEditing ? (
                  <p className="text-slate-600 leading-relaxed">{company.description || 'No description recorded yet.'}</p>
                ) : (
                  <textarea
                    rows={3}
                    value={editedDescription}
                    onChange={(e) => setEditedDescription(e.target.value)}
                    className="w-full text-xs p-2.5 border border-slate-300 rounded-lg focus:ring-2 focus:ring-indigo-500"
                  />
                )}

                {/* Services & Products */}
                {company.services && company.services.length > 0 && (
                  <div className="pt-2">
                    <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block mb-1.5">
                      Core Offerings &amp; Services
                    </span>
                    <div className="flex flex-wrap gap-1.5">
                      {company.services.map((srv, idx) => (
                        <span key={idx} className="px-2 py-0.5 rounded-md bg-slate-100 text-slate-700 font-medium text-[11px] border border-slate-200">
                          {srv}
                        </span>
                      ))}
                    </div>
                  </div>
                )}

                {/* Notes */}
                <div className="pt-2 border-t border-slate-100">
                  <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block mb-1">
                    Internal Sales Notes
                  </span>
                  {!isEditing ? (
                    <p className="text-slate-500 italic">{company.notes || 'No sales notes added.'}</p>
                  ) : (
                    <textarea
                      rows={2}
                      value={editedNotes}
                      onChange={(e) => setEditedNotes(e.target.value)}
                      placeholder="Add prospect notes, AE thoughts, or qualification context..."
                      className="w-full text-xs p-2.5 border border-slate-300 rounded-lg focus:ring-2 focus:ring-indigo-500"
                    />
                  )}
                </div>
              </div>
            </div>
          )}

          {/* TAB 2: AI OPPORTUNITIES */}
          {activeTab === 'ai' && (
            <div className="space-y-4">
              {company.analysisStatus === 'failed' && (
                <div className="bg-rose-50 border border-rose-200 text-rose-900 rounded-xl p-4 text-xs space-y-2">
                  <div className="flex items-center gap-2 font-bold text-rose-800">
                    <AlertCircle className="w-4 h-4 text-rose-600 shrink-0" />
                    <span>Gemini AI Analysis Failed</span>
                  </div>
                  <p className="text-[11px] text-rose-700">
                    Google Gemini could not analyze this company. This usually happens if the API key in <code className="bg-rose-100 px-1 py-0.5 rounded font-mono">backend/.env</code> is invalid, quota has been exhausted, or the Google model is temporarily unavailable.
                  </p>
                  {onAnalyze && (
                    <button
                      type="button"
                      onClick={handleTriggerAnalysis}
                      disabled={isAnalyzing}
                      className="mt-1 px-3 py-1.5 bg-rose-600 text-white rounded-lg text-xs font-semibold hover:bg-rose-700 transition-colors shadow-2xs"
                    >
                      {isAnalyzing ? 'Retrying Gemini AI...' : 'Retry Gemini AI Analysis'}
                    </button>
                  )}
                </div>
              )}

              {company.aiAnalysis?.modelUsed && (
                <div className="flex items-center justify-between text-xs px-1 text-slate-500">
                  <span>Engine: <strong className="text-indigo-600 font-semibold">{company.aiAnalysis.modelUsed}</strong></span>
                  <span className="text-[11px] text-slate-400">
                    Analyzed on {company.aiAnalysis.analyzedAt ? new Date(company.aiAnalysis.analyzedAt).toLocaleDateString() : 'recent'}
                  </span>
                </div>
              )}

              {company.aiAnalysis?.opportunities && company.aiAnalysis.opportunities.length > 0 ? (
                company.aiAnalysis.opportunities.map((opp, idx) => (
                  <div key={idx} className="bg-white border border-indigo-100 rounded-xl p-4 space-y-3 shadow-2xs hover:border-indigo-200 transition-colors">
                    <div className="flex items-start justify-between gap-3">
                      <div className="flex items-start gap-2.5">
                        <div className="w-7 h-7 rounded-lg bg-indigo-50 text-indigo-600 flex items-center justify-center shrink-0 font-bold text-xs">
                          {idx + 1}
                        </div>
                        <div>
                          <h4 className="font-bold text-slate-900 text-xs">{opp.title}</h4>
                          <span className="text-[10px] text-slate-400">Confidence: {opp.confidence}</span>
                        </div>
                      </div>
                      <div className="flex items-center gap-1.5">
                        {opp.potentialImpact && (
                          <span className="px-2 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider bg-emerald-50 text-emerald-700 border border-emerald-200">
                            {opp.potentialImpact} Impact
                          </span>
                        )}
                      </div>
                    </div>

                    <div className="space-y-2 text-xs">
                      <div className="bg-slate-50 p-2.5 rounded-lg border border-slate-200/60">
                        <span className="font-bold text-slate-700 block text-[11px] mb-0.5">Problem / Bottleneck:</span>
                        <p className="text-slate-600">{opp.businessProblem}</p>
                      </div>

                      <div className="bg-indigo-50/50 p-2.5 rounded-lg border border-indigo-100">
                        <span className="font-bold text-indigo-900 block text-[11px] mb-0.5">Recommended Cybells Solution:</span>
                        <p className="text-indigo-950 font-medium">{opp.recommendedSolution}</p>
                      </div>

                      <div className="p-2.5 rounded-lg bg-emerald-50/40 border border-emerald-100">
                        <span className="font-bold text-emerald-900 block text-[11px] mb-0.5">Quantified Benefits &amp; ROI:</span>
                        <p className="text-emerald-950">{opp.benefits}</p>
                      </div>
                    </div>
                  </div>
                ))
              ) : (
                <div className="text-center py-10 bg-slate-50 rounded-xl border border-dashed border-slate-200 space-y-3">
                  <Sparkles className="w-8 h-8 text-indigo-400 mx-auto" />
                  <div>
                    <h4 className="text-xs font-bold text-slate-800">No AI Opportunities Generated Yet</h4>
                    <p className="text-[11px] text-slate-500 mt-1 max-w-sm mx-auto">
                      Click the "Gemini AI" button above to analyze this business profile, identify automation bottlenecks, and formulate pitch angles.
                    </p>
                  </div>
                  {onAnalyze && (
                    <button
                      type="button"
                      onClick={handleTriggerAnalysis}
                      disabled={isAnalyzing}
                      className="px-3.5 py-1.5 bg-indigo-600 text-white rounded-lg text-xs font-semibold hover:bg-indigo-700 transition-colors shadow-xs"
                    >
                      {isAnalyzing ? 'Analyzing with Gemini...' : 'Analyze with Gemini AI'}
                    </button>
                  )}
                </div>
              )}
            </div>
          )}

          {/* TAB 3: DECISION MAKERS */}
          {activeTab === 'decision-makers' && (
            <div className="space-y-4">
              {company.decisionMakers && company.decisionMakers.length > 0 ? (
                company.decisionMakers.map((dm, idx) => (
                  <div key={idx} className="bg-white border border-slate-200/80 rounded-xl p-4 flex items-center justify-between gap-3 shadow-2xs hover:border-slate-300 transition-colors">
                    <div className="flex items-center gap-3 min-w-0">
                      <div className="w-9 h-9 rounded-full bg-indigo-50 border border-indigo-200 text-indigo-700 flex items-center justify-center font-bold text-xs shrink-0">
                        {dm.fullName.charAt(0)}
                      </div>
                      <div className="min-w-0">
                        <h4 className="font-bold text-slate-900 text-xs truncate">{dm.fullName}</h4>
                        <span className="text-[11px] text-slate-500 block truncate">{dm.jobTitle}</span>
                        {(dm.publicBusinessEmail || (dm as any).email) && (
                          <a
                            href={`mailto:${dm.publicBusinessEmail || (dm as any).email}`}
                            className="text-indigo-600 font-mono text-[11px] hover:underline flex items-center gap-1 mt-0.5"
                          >
                            <Mail className="w-3 h-3" />
                            <span>{dm.publicBusinessEmail || (dm as any).email}</span>
                          </a>
                        )}
                      </div>
                    </div>

                    <div className="text-right shrink-0">
                      <span className={`text-[10px] px-2 py-0.5 rounded-full font-bold uppercase tracking-wider ${
                        dm.confidence === 'high'
                          ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                          : 'bg-slate-100 text-slate-600'
                      }`}>
                        {dm.confidence}
                      </span>
                    </div>
                  </div>
                ))
              ) : (
                <div className="text-center py-10 bg-slate-50 rounded-xl border border-dashed border-slate-200 space-y-3">
                  <Users className="w-8 h-8 text-sky-400 mx-auto" />
                  <div>
                    <h4 className="text-xs font-bold text-slate-800">No Decision Makers Discovered Yet</h4>
                    <p className="text-[11px] text-slate-500 mt-1 max-w-sm mx-auto">
                      Search official company website team pages and public listings for founders, CEOs, and managing directors.
                    </p>
                  </div>
                  {onDiscoverDecisionMakers && (
                    <button
                      type="button"
                      onClick={handleTriggerDiscoverDMs}
                      disabled={isDiscoveringDMs}
                      className="px-3.5 py-1.5 bg-sky-600 text-white rounded-lg text-xs font-semibold hover:bg-sky-700 transition-colors shadow-xs"
                    >
                      {isDiscoveringDMs ? 'Finding Leaders...' : 'Find Decision Makers'}
                    </button>
                  )}
                </div>
              )}
            </div>
          )}

          {/* TAB 4: GOOGLE REVIEWS & SENTIMENT */}
          {activeTab === 'reviews' && (
            <div className="space-y-4">
              {/* Header Sentiment Card */}
              <div className="p-4 rounded-xl bg-gradient-to-br from-amber-50/80 via-orange-50/50 to-card border border-amber-200/80 shadow-2xs space-y-2">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <div className="flex items-center text-amber-500">
                      {[1, 2, 3, 4, 5].map((star) => (
                        <Star
                          key={star}
                          className={`w-4 h-4 ${
                            star <= Math.round(company.googleRating || 0)
                              ? 'fill-amber-400 text-amber-400'
                              : 'text-amber-200'
                          }`}
                        />
                      ))}
                    </div>
                    <span className="font-bold text-sm text-text">
                      {company.googleRating ? company.googleRating.toFixed(1) : 'Unrated'} out of 5.0
                    </span>
                  </div>
                  <span className="text-[11px] font-semibold text-text-secondary">
                    {company.googleReviewsCount || company.reviews?.length || 0} Total Reviews on Google Maps
                  </span>
                </div>
                <p className="text-[11px] text-text-secondary leading-relaxed">
                  These verified reviews are parsed from the Google Maps microservice. Gemini AI inspects customer complaints (1★–3★) to isolate <strong>real operational pain points</strong> for high-converting sales outreach.
                </p>
              </div>

              {/* Reviews List */}
              {company.reviews && company.reviews.length > 0 ? (
                <div className="space-y-3">
                  {company.reviews.map((rev, idx) => {
                    const isComplaint = (rev.rating || 5) <= 3;
                    return (
                      <div
                        key={idx}
                        className={`p-3.5 rounded-xl border transition-all ${
                          isComplaint
                            ? 'bg-rose-50/30 border-rose-200/80 shadow-2xs'
                            : 'bg-card border-border shadow-2xs'
                        }`}
                      >
                        <div className="flex items-center justify-between gap-2 mb-1.5">
                          <div className="flex items-center gap-2">
                            <span className="font-semibold text-text text-xs">{rev.author || 'Google User'}</span>
                            <div className="flex items-center text-amber-500">
                              {[1, 2, 3, 4, 5].map((star) => (
                                <Star
                                  key={star}
                                  className={`w-3 h-3 ${
                                    star <= (rev.rating || 0)
                                      ? 'fill-amber-400 text-amber-400'
                                      : 'text-border'
                                  }`}
                                />
                              ))}
                            </div>
                            <span className="text-[11px] font-bold text-text-secondary">({rev.rating || '?'}★)</span>
                          </div>
                          <div className="flex items-center gap-1.5">
                            {isComplaint ? (
                              <span className="text-[10px] px-2 py-0.5 rounded-full font-bold bg-rose-100 text-rose-700 border border-rose-200/60 flex items-center gap-1">
                                <ThumbsDown className="w-2.5 h-2.5" />
                                <span>Pain Point Signal</span>
                              </span>
                            ) : (
                              <span className="text-[10px] px-2 py-0.5 rounded-full font-semibold bg-emerald-50 text-emerald-700 border border-emerald-200/60">
                                Positive Feedback
                              </span>
                            )}
                            {rev.publishAt && (
                              <span className="text-[10px] text-muted font-mono">{rev.publishAt}</span>
                            )}
                          </div>
                        </div>

                        <p className="text-xs text-text leading-relaxed whitespace-pre-wrap pl-1 italic">
                          "{rev.text || 'No written text review.'}"
                        </p>

                        {isComplaint && (
                          <div className="mt-2.5 pt-2 border-t border-rose-200/60 flex items-center justify-between text-[11px]">
                            <span className="text-rose-700 font-medium">
                              💡 Customer frustration detected — solvable via Cybells AI Automation.
                            </span>
                            <button
                              type="button"
                              onClick={() => setActiveTab('ai')}
                              className="text-accent font-semibold hover:underline cursor-pointer"
                            >
                              Check AI Solution →
                            </button>
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              ) : (
                <div className="text-center py-10 bg-card rounded-xl border border-dashed border-border space-y-3">
                  <MessageSquare className="w-8 h-8 text-muted mx-auto" />
                  <div>
                    <h4 className="text-xs font-bold text-text">No Customer Reviews Scraped Yet</h4>
                    <p className="text-[11px] text-text-secondary mt-1 max-w-sm mx-auto">
                      Run a new company discovery search with Google Maps microservice to automatically pull customer reviews and sentiment signals.
                    </p>
                  </div>
                </div>
              )}
            </div>
          )}

          {/* TAB 5: ACTIVE HIRINGS (JOBSPY) */}
          {activeTab === 'jobs' && (
            <div className="space-y-4">
              {/* Header Intelligence Card */}
              <div className="p-4 rounded-xl bg-gradient-to-br from-blue-50/80 via-sky-50/50 to-card border border-blue-200/80 shadow-2xs space-y-2">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <div className="w-8 h-8 rounded-lg bg-blue-500/10 text-blue-600 flex items-center justify-center shrink-0">
                      <Briefcase className="w-4 h-4 text-blue-600" />
                    </div>
                    <div>
                      <h4 className="font-bold text-sm text-text">JobSpy Hiring Intelligence</h4>
                      <p className="text-[11px] text-text-secondary">
                        {company.jobPostings?.length || 0} Open Roles Scraped from LinkedIn, Indeed, Glassdoor & Google Jobs
                      </p>
                    </div>
                  </div>
                  {onScrapeJobs && (
                    <button
                      type="button"
                      onClick={handleTriggerScrapeJobs}
                      disabled={isScrapingJobs}
                      className="px-2.5 py-1.5 rounded-lg bg-card border border-border hover:border-blue-300 text-blue-700 font-semibold text-xs transition-all shrink-0 cursor-pointer shadow-2xs hover:shadow-xs flex items-center gap-1.5"
                    >
                      <RefreshCw className={`w-3.5 h-3.5 ${isScrapingJobs ? 'animate-spin text-blue-600' : ''}`} />
                      <span>{isScrapingJobs ? 'Scanning Jobs...' : 'Refresh Jobs'}</span>
                    </button>
                  )}
                </div>
                <p className="text-[11px] text-text-secondary leading-relaxed">
                  Active job postings reveal internal operational bottlenecks, repetitive manual tasks, and costly human shift staffing. Gemini AI inspects these postings to formulate high-ROI Cybells AI automation solutions.
                </p>
              </div>

              {/* Jobs List */}
              {company.jobPostings && company.jobPostings.length > 0 ? (
                <div className="space-y-3">
                  {company.jobPostings.map((job, idx) => (
                    <div
                      key={idx}
                      className="p-3.5 rounded-xl border border-border bg-card shadow-2xs space-y-2 hover:border-[#D6CEBE] transition-all"
                    >
                      <div className="flex items-start justify-between gap-3">
                        <div className="space-y-1 min-w-0">
                          <div className="flex items-center gap-2 flex-wrap">
                            <span className="font-bold text-xs text-text">{job.title}</span>
                            <span className={`text-[10px] px-2 py-0.5 rounded-full font-bold uppercase tracking-wider ${
                              job.platform.toLowerCase().includes('linkedin')
                                ? 'bg-blue-100 text-blue-700 border border-blue-200'
                                : job.platform.toLowerCase().includes('indeed')
                                ? 'bg-indigo-100 text-indigo-700 border border-indigo-200'
                                : job.platform.toLowerCase().includes('glassdoor')
                                ? 'bg-emerald-100 text-emerald-700 border border-emerald-200'
                                : 'bg-slate-100 text-slate-700 border border-slate-200'
                            }`}>
                              {job.platform}
                            </span>
                            {job.salary && (
                              <span className="text-[10px] px-2 py-0.5 rounded-full font-semibold font-mono bg-emerald-50 text-emerald-700 border border-emerald-200">
                                💰 {job.salary}
                              </span>
                            )}
                          </div>
                          <div className="flex items-center gap-2 text-[11px] text-text-secondary">
                            {job.location && <span>📍 {job.location}</span>}
                            {job.datePosted && <span>• Posted: {job.datePosted}</span>}
                          </div>
                        </div>

                        {job.jobUrl && (
                          <a
                            href={job.jobUrl}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="p-1.5 rounded-lg bg-sidebar hover:bg-card-hover border border-border text-text-secondary hover:text-accent transition-colors shrink-0"
                            title="View live job posting"
                          >
                            <ExternalLink className="w-3.5 h-3.5" />
                          </a>
                        )}
                      </div>

                      {job.descriptionSnippet && (
                        <p className="text-[11px] text-text-secondary leading-relaxed line-clamp-3 bg-sidebar/50 p-2 rounded-lg border border-border/60 italic">
                          "{job.descriptionSnippet}"
                        </p>
                      )}

                      <div className="pt-2 border-t border-border flex items-center justify-between text-[11px]">
                        <span className="text-blue-700 font-medium">
                          💡 Staffing cost signal: Prime candidate for Cybells AI workflow automation.
                        </span>
                        <button
                          type="button"
                          onClick={() => setActiveTab('ai')}
                          className="text-accent font-semibold hover:underline cursor-pointer"
                        >
                          Check AI Solution →
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-10 bg-card rounded-xl border border-dashed border-border space-y-3">
                  <Briefcase className="w-8 h-8 text-blue-400 mx-auto" />
                  <div>
                    <h4 className="text-xs font-bold text-text">
                      {company.jobsScrapedAt ? 'No Open Postings on LinkedIn / Indeed' : 'No Job Postings Scraped Yet'}
                    </h4>
                    <p className="text-[11px] text-text-secondary mt-1 max-w-md mx-auto leading-relaxed">
                      {company.jobsScrapedAt ? (
                        <>
                          JobSpy searched LinkedIn, Indeed, Glassdoor, and Google Jobs, but found no active listings for <strong className="text-text">{company.companyName}</strong>.
                          <br />
                          <span className="text-[10px] text-muted mt-1 block">
                            💡 Small local businesses (restaurants, local retail, cafes) typically hire locally via word-of-mouth rather than paying for corporate job boards like LinkedIn. JobSpy is most effective for B2B tech, manufacturing, healthcare, and agencies.
                          </span>
                        </>
                      ) : (
                        'Search LinkedIn, Indeed, Glassdoor, and Google Jobs concurrently using JobSpy to discover what positions this company is paying to recruit.'
                      )}
                    </p>
                  </div>
                  {onScrapeJobs && (
                    <button
                      type="button"
                      onClick={handleTriggerScrapeJobs}
                      disabled={isScrapingJobs}
                      className="px-3.5 py-1.5 bg-blue-600 text-white rounded-lg text-xs font-semibold hover:bg-blue-700 transition-colors shadow-xs cursor-pointer inline-flex items-center gap-1.5"
                    >
                      <Briefcase className="w-3.5 h-3.5" />
                      <span>{isScrapingJobs ? 'Searching Job Boards...' : company.jobsScrapedAt ? 'Re-check Job Boards' : 'Find Jobs via JobSpy'}</span>
                    </button>
                  )}
                </div>
              )}
            </div>
          )}

          {/* TAB 6: VERIFIED SOURCES */}
          {activeTab === 'sources' && (
            <div className="space-y-3">
              {company.sources && company.sources.length > 0 ? (
                company.sources.map((src, idx) => (
                  <div key={idx} className="bg-slate-50 border border-slate-200 rounded-lg p-3 text-xs flex items-start justify-between gap-4">
                    <div className="space-y-1 min-w-0">
                      <div className="flex items-center gap-2">
                        <Badge size="sm" variant={src.sourceType === 'google_maps' ? 'success' : 'slate'}>
                          {src.sourceType === 'google_maps' ? '📍 Google Maps' : src.sourceType}
                        </Badge>
                        {src.extractedField && (
                          <span className="font-semibold text-slate-700 text-[11px]">Field: {src.extractedField}</span>
                        )}
                      </div>
                      {src.supportingText && (
                        <p className="text-slate-600 italic text-[11px]">"{src.supportingText}"</p>
                      )}
                      <a
                        href={src.sourceUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-indigo-600 hover:underline flex items-center gap-1 font-mono text-[11px] truncate max-w-md"
                      >
                        <span className="truncate">{src.sourceUrl}</span>
                        <ExternalLink className="w-3 h-3 shrink-0" />
                      </a>
                    </div>
                    <span className="text-[10px] text-slate-400 shrink-0 font-mono">
                      {new Date(src.fetchedAt).toLocaleDateString()}
                    </span>
                  </div>
                ))
              ) : (
                <div className="text-xs text-slate-400 italic py-6 text-center">
                  No verified provenance sources recorded.
                </div>
              )}
            </div>
          )}
        </div>
      </div>

      {/* Cal.diy Booking Modal with prefilled lead details */}
      <CalBookingModal
        isOpen={calModalOpen}
        onClose={() => setCalModalOpen(false)}
        contact={{
          name: company.decisionMakers?.[0]?.fullName,
          email: company.decisionMakers?.[0]?.publicBusinessEmail || (company.emails && company.emails[0]),
        }}
        company={{
          companyName: company.companyName,
        }}
      />
    </div>
  );
};
