import React, { useState, useEffect } from 'react';
import { 
  Users, 
  UploadCloud, 
  FileSpreadsheet, 
  Briefcase, 
  Sparkles, 
  FileDown, 
  Plus, 
  CheckCircle2, 
  Search, 
  AlertCircle,
  HelpCircle,
  FileText
} from 'lucide-react';
import { Candidate, CandidateStatus, JobDescription, AuditLog, InterviewSchedule } from './types';
import { INITIAL_CANDIDATES, PRESET_JOB_DESCRIPTIONS, isSampleCandidate } from './data/sampleCandidates';
import { Navbar } from './components/Navbar';
import { StatsCards } from './components/StatsCards';
import { CandidateTable } from './components/CandidateTable';
import { ResumeUploadModal } from './components/ResumeUploadModal';
import { JobDescriptionModal } from './components/JobDescriptionModal';
import { CandidateProfileModal } from './components/CandidateProfileModal';
import { InterviewSchedulerModal } from './components/InterviewSchedulerModal';
import { AuditLogsDrawer } from './components/AuditLogsDrawer';
import { exportCandidatesToExcel, exportCandidatesToCSV } from './utils/excelExporter';

export default function App() {
  // Theme & User Role State
  const [darkMode, setDarkMode] = useState<boolean>(false);
  const [userRole, setUserRole] = useState<'Recruiter' | 'Admin'>('Recruiter');

  // Candidate Pool State - filter out all sample candidates so user sees only real uploaded candidates
  const [candidates, setCandidates] = useState<Candidate[]>(() => {
    const saved = localStorage.getItem('talentfox_candidates') || localStorage.getItem('talentfor_candidates');
    if (saved) {
      try {
        const parsed: Candidate[] = JSON.parse(saved);
        const seenIds = new Set<string>();
        const cleaned: Candidate[] = [];
        for (const c of parsed) {
          if (!c || isSampleCandidate(c)) continue;
          let uniqueId = c.id;
          if (!uniqueId || seenIds.has(uniqueId)) {
            uniqueId = `cand-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
          }
          seenIds.add(uniqueId);
          cleaned.push({ ...c, id: uniqueId });
        }
        return cleaned;
      } catch (e) {
        return [];
      }
    }
    return [];
  });

  // Active Job Description
  const [activeJd, setActiveJd] = useState<JobDescription | null>(PRESET_JOB_DESCRIPTIONS[0]);
  const [isMatchingAll, setIsMatchingAll] = useState(false);

  // Status Filter State
  const [selectedStatusFilter, setSelectedStatusFilter] = useState<string>('All');

  // Modals & Drawers State
  const [isUploadOpen, setIsUploadOpen] = useState(false);
  const [isJdModalOpen, setIsJdModalOpen] = useState(false);
  const [isAuditLogsOpen, setIsAuditLogsOpen] = useState(false);
  const [selectedCandidate, setSelectedCandidate] = useState<Candidate | null>(null);
  const [isProfileOpen, setIsProfileOpen] = useState(false);
  const [isSchedulerOpen, setIsSchedulerOpen] = useState(false);
  const [schedulingCandidate, setSchedulingCandidate] = useState<Candidate | null>(null);

  // Audit Logs State
  const [auditLogs, setAuditLogs] = useState<AuditLog[]>([
    {
      id: 'log-init-1',
      timestamp: new Date(Date.now() - 3600000 * 2).toISOString(),
      action: 'Candidate Pool Initialized',
      details: 'Loaded initial enterprise candidates with skill matrix and resume indices.',
      user: 'System Admin',
      type: 'upload'
    },
    {
      id: 'log-init-2',
      timestamp: new Date(Date.now() - 3600000 * 1).toISOString(),
      action: 'JD Scoring Online',
      details: 'Target Job Description set to Senior Full Stack Java & Cloud Engineer.',
      user: 'HR Recruiter',
      type: 'match'
    }
  ]);

  // Toast Notification
  const [toastMessage, setToastMessage] = useState<string | null>(null);
  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 3500);
  };

  // Sync candidates with local storage for persistence across reloads
  useEffect(() => {
    try {
      localStorage.setItem('talentfox_candidates', JSON.stringify(candidates));
    } catch (e) {
      console.warn('Storage limit reached, caching in memory.');
    }
  }, [candidates]);

  // Log activity helper
  const addAuditLog = (action: string, details: string, type: AuditLog['type']) => {
    const newLog: AuditLog = {
      id: `log-${Date.now()}-${Math.random().toString(36).substr(2, 4)}`,
      timestamp: new Date().toISOString(),
      action,
      details,
      user: `${userRole} (HR)`,
      type
    };
    setAuditLogs(prev => [newLog, ...prev]);
  };

  // Add new parsed candidates (from Upload modal)
  const handleAddCandidates = async (newCandidates: Candidate[]) => {
    // If active JD exists, auto-score newly added candidates
    let scoredCandidates = [...newCandidates];
    
    if (activeJd) {
      showToast(`Scoring ${newCandidates.length} new candidates against ${activeJd.title}...`);
      scoredCandidates = await Promise.all(
        newCandidates.map(async (c) => {
          try {
            const res = await fetch('/api/match-jd', {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({ candidate: c, jobDescription: activeJd })
            });
            if (res.ok) {
              const data = await res.json();
              return { ...c, matchResult: data.matchResult };
            }
          } catch (e) {
            console.error('Auto scoring failed for', c.name, e);
          }
          return c;
        })
      );
    }

    setCandidates(prev => {
      const existingIds = new Set(prev.map(c => c.id));
      const processedNew: Candidate[] = scoredCandidates.map((sc, idx) => {
        let uniqueId = sc.id;
        if (!uniqueId || existingIds.has(uniqueId)) {
          uniqueId = `cand-${Date.now()}-${idx}-${Math.random().toString(36).substr(2, 9)}`;
        }
        existingIds.add(uniqueId);
        return { ...sc, id: uniqueId };
      });
      return [...processedNew, ...prev];
    });
    addAuditLog(
      'Resumes Uploaded & Parsed',
      `Added ${newCandidates.length} candidate(s) to dashboard.`,
      'upload'
    );
    showToast(`Successfully added ${newCandidates.length} candidate(s)!`);
  };

  // Run Match on All Candidates for a given Job Description
  const handleRunMatchAll = async (jd: JobDescription) => {
    if (candidates.length === 0) return;
    setIsMatchingAll(true);
    showToast(`AI scoring all ${candidates.length} candidates against "${jd.title}"...`);

    try {
      // 1. Try batch endpoint first
      const batchRes = await fetch('/api/match-jd-batch', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ candidates, jobDescription: jd })
      });

      if (batchRes.ok) {
        const data = await batchRes.json();
        if (data.results && Array.isArray(data.results)) {
          const resultMap = new Map<string, any>(data.results.map((r: any) => [r.candidateId, r.matchResult]));
          setCandidates(prev => prev.map(c => ({
            ...c,
            matchResult: resultMap.get(c.id) || c.matchResult
          })));

          addAuditLog(
            'Batch JD Matching Completed',
            `Re-scored entire candidate pool against ${jd.title}.`,
            'match'
          );
          showToast(`Candidate matching complete for ${jd.title}!`);
          return;
        }
      }

      // Fallback: Individual paced matching
      const updatedCandidates = [...candidates];
      for (let i = 0; i < updatedCandidates.length; i++) {
        const cand = updatedCandidates[i];
        try {
          const res = await fetch('/api/match-jd', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ candidate: cand, jobDescription: jd })
          });
          if (res.ok) {
            const data = await res.json();
            updatedCandidates[i] = { ...cand, matchResult: data.matchResult };
          }
        } catch (e) {
          console.error('Failed to match', cand.name, e);
        }
      }

      setCandidates(updatedCandidates);
      addAuditLog(
        'Batch JD Matching Completed',
        `Re-scored candidate pool against ${jd.title}.`,
        'match'
      );
      showToast(`Candidate matching complete for ${jd.title}!`);
    } catch (err) {
      console.error('Error during batch JD matching:', err);
      showToast('Error matching candidates.');
    } finally {
      setIsMatchingAll(false);
    }
  };

  // Status updates
  const handleUpdateStatus = (candidateId: string, status: CandidateStatus) => {
    setCandidates(prev => prev.map(c => c.id === candidateId ? { ...c, status } : c));
    const cand = candidates.find(c => c.id === candidateId);
    if (cand) {
      addAuditLog('Status Updated', `Changed status of ${cand.name} to ${status}`, 'status_change');
      showToast(`Status of ${cand.name} updated to ${status}`);
    }
    if (selectedCandidate && selectedCandidate.id === candidateId) {
      setSelectedCandidate(prev => prev ? { ...prev, status } : null);
    }
  };

  // Save recruiter notes
  const handleSaveNotes = (candidateId: string, notes: string) => {
    setCandidates(prev => prev.map(c => c.id === candidateId ? { ...c, recruiterNotes: notes } : c));
    showToast('Recruiter notes saved.');
  };

  // Schedule Interview
  const handleSaveSchedule = (candidateId: string, schedule: InterviewSchedule) => {
    setCandidates(prev => prev.map(c => {
      if (c.id === candidateId) {
        return {
          ...c,
          status: 'Interview Scheduled' as CandidateStatus,
          interviewSchedule: schedule
        };
      }
      return c;
    }));

    const cand = candidates.find(c => c.id === candidateId);
    addAuditLog(
      'Interview Scheduled',
      `Scheduled ${schedule.type} for ${cand?.name} on ${schedule.date} at ${schedule.time}`,
      'interview'
    );
    showToast(`Interview scheduled for ${cand?.name || 'candidate'}!`);
  };

  // Delete Candidate
  const handleDeleteCandidate = (candidateId: string) => {
    const cand = candidates.find(c => c.id === candidateId);
    setCandidates(prev => prev.filter(c => c.id !== candidateId));
    if (cand) {
      addAuditLog('Candidate Deleted', `Removed candidate record ${cand.name}`, 'delete');
      showToast(`Removed candidate ${cand.name}`);
    }
    if (selectedCandidate?.id === candidateId) {
      setIsProfileOpen(false);
    }
  };

  // Bulk Delete
  const handleBulkDelete = (candidateIds: string[]) => {
    setCandidates(prev => prev.filter(c => !candidateIds.includes(c.id)));
    addAuditLog('Bulk Candidates Deleted', `Removed ${candidateIds.length} candidate records`, 'delete');
    showToast(`Deleted ${candidateIds.length} candidate records.`);
  };

  // Export handlers
  const handleExportAllExcel = () => {
    exportCandidatesToExcel(candidates, 'TalentFox_HR_Full_Candidate_Pool');
    addAuditLog('Excel Export', `Exported all ${candidates.length} candidates to Excel (.xlsx)`, 'export');
    showToast('Exported candidates to Excel spreadsheet (.xlsx)');
  };

  const handleExportAllCSV = () => {
    exportCandidatesToCSV(candidates, 'TalentFox_HR_Full_Candidate_Pool');
    addAuditLog('CSV Export', `Exported all ${candidates.length} candidates to CSV`, 'export');
    showToast('Exported candidates to CSV file');
  };

  const handleExportSelected = (selected: Candidate[]) => {
    exportCandidatesToExcel(selected, 'TalentFox_HR_Selected_Candidates');
    addAuditLog('Excel Export', `Exported ${selected.length} selected candidates to Excel`, 'export');
    showToast(`Exported ${selected.length} selected candidates to Excel (.xlsx)`);
  };

  // Candidate View Trigger
  const handleViewCandidate = (candidate: Candidate) => {
    setSelectedCandidate(candidate);
    setIsProfileOpen(true);
  };

  const handleOpenScheduler = (candidate: Candidate) => {
    setSchedulingCandidate(candidate);
    setIsSchedulerOpen(true);
  };

  const highMatchCandidates = candidates.filter(c => c.matchResult && c.matchResult.score >= 80);

  return (
    <div className={darkMode ? 'dark' : ''}>
      <div className="min-h-screen bg-slate-100/60 dark:bg-slate-950 text-slate-900 dark:text-slate-100 flex flex-col font-sans selection:bg-indigo-500 selection:text-white transition-colors duration-200">
        
        {/* Navigation Bar */}
        <Navbar
          darkMode={darkMode}
          setDarkMode={setDarkMode}
          userRole={userRole}
          setUserRole={setUserRole}
          activeJd={activeJd}
          onOpenUpload={() => setIsUploadOpen(true)}
          onOpenJdModal={() => setIsJdModalOpen(true)}
          onOpenAuditLogs={() => setIsAuditLogsOpen(true)}
          onExportExcel={handleExportAllExcel}
          onExportCSV={handleExportAllCSV}
          totalCandidates={candidates.length}
          matchedCount={highMatchCandidates.length}
        />

        {/* Main Content Area */}
        <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-6 space-y-6">
          
          {/* Active Job Description Banner */}
          <div className="p-4 sm:p-5 rounded-2xl border bg-white dark:bg-slate-900/90 border-slate-200 dark:border-slate-800 shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div className="space-y-1">
              <div className="flex items-center space-x-2">
                <span className="px-2.5 py-0.5 rounded-md text-[10px] font-bold uppercase tracking-wider bg-indigo-50 text-indigo-700 dark:bg-indigo-950/60 dark:text-indigo-300 border border-indigo-200 dark:border-indigo-800">
                  Target Job Requisition
                </span>
                <span className="text-xs text-slate-500 dark:text-slate-400">
                  {activeJd?.department || 'Engineering'} • {activeJd?.minExperienceYears}+ Years Minimum Exp
                </span>
              </div>
              
              <h2 className="text-lg font-bold text-slate-900 dark:text-white flex items-center">
                <Briefcase className="w-5 h-5 mr-2 text-indigo-600 dark:text-indigo-400" />
                {activeJd?.title || 'No Job Description Active'}
              </h2>

              <div className="flex flex-wrap items-center gap-1.5 pt-1">
                <span className="text-[11px] font-semibold text-slate-500 dark:text-slate-400 mr-1">Required Skills:</span>
                {(activeJd?.requiredSkills || []).map(skill => (
                  <span
                    key={skill}
                    className="px-2 py-0.5 rounded text-[11px] font-semibold bg-slate-100 dark:bg-slate-800 text-slate-800 dark:text-slate-200 border border-slate-200 dark:border-slate-700"
                  >
                    {skill}
                  </span>
                ))}
              </div>
            </div>

            <div className="flex items-center space-x-2 shrink-0">
              <button
                type="button"
                onClick={() => setIsJdModalOpen(true)}
                className="px-3.5 py-2 text-xs font-semibold rounded-xl bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-700 transition-colors"
              >
                Change Role
              </button>

              <button
                type="button"
                onClick={() => activeJd && handleRunMatchAll(activeJd)}
                disabled={isMatchingAll || candidates.length === 0}
                className="flex items-center space-x-1.5 px-4 py-2 text-xs font-semibold rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white shadow-sm shadow-indigo-500/20 disabled:opacity-50 transition-colors"
              >
                <Sparkles className="w-4 h-4" />
                <span>{isMatchingAll ? 'Scoring...' : 'Auto-Match All'}</span>
              </button>
            </div>
          </div>

          {/* Stats & Pipeline Cards */}
          <StatsCards
            candidates={candidates}
            selectedStatusFilter={selectedStatusFilter}
            onFilterStatus={setSelectedStatusFilter}
          />

          {/* Candidate Table Data Grid */}
          <div className="space-y-3">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
              <div>
                <h3 className="text-base font-bold text-slate-900 dark:text-white flex items-center">
                  <Users className="w-5 h-5 mr-2 text-indigo-600 dark:text-indigo-400" />
                  Candidate Talent Roster
                </h3>
                <p className="text-xs text-slate-500 dark:text-slate-400">
                  Search, filter, evaluate skills, schedule interviews, and export records
                </p>
              </div>

              <div className="flex items-center space-x-2">
                <button
                  type="button"
                  onClick={handleExportAllCSV}
                  className="px-3 py-1.5 text-xs font-semibold rounded-lg bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-200 hover:bg-slate-50 transition-colors flex items-center space-x-1"
                >
                  <FileText className="w-3.5 h-3.5" />
                  <span>Export CSV</span>
                </button>

                <button
                  type="button"
                  onClick={handleExportAllExcel}
                  className="px-3.5 py-1.5 text-xs font-semibold rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white shadow-xs transition-colors flex items-center space-x-1.5"
                >
                  <FileSpreadsheet className="w-3.5 h-3.5" />
                  <span>Export All to Excel</span>
                </button>
              </div>
            </div>

            <CandidateTable
              candidates={candidates}
              onViewCandidate={handleViewCandidate}
              onScheduleInterview={handleOpenScheduler}
              onUpdateStatus={handleUpdateStatus}
              onDeleteCandidate={handleDeleteCandidate}
              onBulkDelete={handleBulkDelete}
              onExportSelectedExcel={handleExportSelected}
              selectedStatusFilter={selectedStatusFilter}
              onFilterStatus={setSelectedStatusFilter}
              onOpenUpload={() => setIsUploadOpen(true)}
            />
          </div>

        </main>

        {/* Footer */}
        <footer className="border-t border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 py-6 text-xs text-slate-500 dark:text-slate-400">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex flex-col sm:flex-row items-center justify-between gap-3">
            <div className="flex items-center space-x-2">
              <span className="font-bold text-slate-900 dark:text-white">TalentFox HR</span>
              <span>•</span>
              <span>Enterprise AI Resume Parsing & Candidate Intelligence</span>
            </div>
            <div>
              <span>Powered by Gemini 3.7 Flash & Node.js Engine</span>
            </div>
          </div>
        </footer>

        {/* Upload Resume Modal */}
        <ResumeUploadModal
          isOpen={isUploadOpen}
          onClose={() => setIsUploadOpen(false)}
          onAddCandidates={handleAddCandidates}
          existingCandidates={candidates}
        />

        {/* Job Description Switcher & Creator Modal */}
        <JobDescriptionModal
          isOpen={isJdModalOpen}
          onClose={() => setIsJdModalOpen(false)}
          activeJd={activeJd}
          onSelectJd={jd => setActiveJd(jd)}
          onRunMatchAll={handleRunMatchAll}
          isMatchingAll={isMatchingAll}
        />

        {/* Candidate Detail Profile Drawer */}
        <CandidateProfileModal
          candidate={selectedCandidate}
          isOpen={isProfileOpen}
          onClose={() => setIsProfileOpen(false)}
          activeJd={activeJd}
          onUpdateStatus={handleUpdateStatus}
          onScheduleInterview={handleOpenScheduler}
          onSaveNotes={handleSaveNotes}
          onDeleteCandidate={handleDeleteCandidate}
        />

        {/* Interview Scheduler Modal */}
        <InterviewSchedulerModal
          candidate={schedulingCandidate}
          isOpen={isSchedulerOpen}
          onClose={() => setIsSchedulerOpen(false)}
          onSaveSchedule={handleSaveSchedule}
        />

        {/* Audit Logs Drawer */}
        <AuditLogsDrawer
          isOpen={isAuditLogsOpen}
          onClose={() => setIsAuditLogsOpen(false)}
          logs={auditLogs}
          onRefreshLogs={async () => {
            try {
              const res = await fetch('/api/audit-logs');
              if (res.ok) {
                const data = await res.json();
                if (data.logs) setAuditLogs(data.logs);
              }
            } catch (e) {
              console.error(e);
            }
          }}
        />

        {/* Floating Toast Notification */}
        {toastMessage && (
          <div className="fixed bottom-6 right-6 z-50 px-4 py-3 rounded-xl bg-slate-900 dark:bg-white text-white dark:text-slate-900 shadow-2xl text-xs font-semibold flex items-center space-x-2 animate-bounce-short">
            <CheckCircle2 className="w-4 h-4 text-emerald-400 dark:text-emerald-600" />
            <span>{toastMessage}</span>
          </div>
        )}

      </div>
    </div>
  );
}
