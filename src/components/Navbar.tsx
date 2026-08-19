import React from 'react';
import { 
  Users, 
  UploadCloud, 
  FileSpreadsheet, 
  Briefcase, 
  ShieldCheck, 
  Sparkles, 
  Sun, 
  Moon, 
  History,
  FileText,
  UserCheck
} from 'lucide-react';
import { JobDescription } from '../types';

interface NavbarProps {
  darkMode: boolean;
  setDarkMode: (val: boolean) => void;
  userRole: 'Recruiter' | 'Admin';
  setUserRole: (role: 'Recruiter' | 'Admin') => void;
  activeJd: JobDescription | null;
  onOpenUpload: () => void;
  onOpenJdModal: () => void;
  onOpenAuditLogs: () => void;
  onExportExcel: () => void;
  onExportCSV: () => void;
  totalCandidates: number;
  matchedCount: number;
  activeNavTab?: 'candidates' | 'jobs' | 'analytics';
  onSelectNavTab?: (tab: 'candidates' | 'jobs' | 'analytics') => void;
}

export const Navbar: React.FC<NavbarProps> = ({
  darkMode,
  setDarkMode,
  userRole,
  setUserRole,
  activeJd,
  onOpenUpload,
  onOpenJdModal,
  onOpenAuditLogs,
  onExportExcel,
  onExportCSV,
  totalCandidates,
  matchedCount,
  activeNavTab = 'candidates',
  onSelectNavTab
}) => {
  return (
    <header className="sticky top-0 z-30 w-full bg-white dark:bg-slate-900 border-b border-slate-200 dark:border-slate-800 shadow-xs transition-colors">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          
          {/* Logo & Brand */}
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 bg-indigo-600 rounded-lg flex items-center justify-center text-white shadow-xs">
              <Users className="w-5 h-5" />
            </div>
            <div className="flex items-center gap-2">
              <h1 className="text-xl font-bold text-slate-800 dark:text-white tracking-tight">
                TalentFox <span className="text-indigo-600 dark:text-indigo-400">HR</span>
              </h1>
              <span className="hidden sm:inline-flex items-center px-1.5 py-0.5 rounded text-[10px] font-bold bg-indigo-50 text-indigo-700 dark:bg-indigo-950/60 dark:text-indigo-300 border border-indigo-200/60 dark:border-indigo-800">
                <Sparkles className="w-3 h-3 mr-0.5 text-indigo-500" />
                AI 3.7
              </span>
            </div>
          </div>

          {/* Navigation Links */}
          <nav className="hidden md:flex items-center gap-6 text-sm font-medium">
            <button
              onClick={() => onSelectNavTab?.('candidates')}
              className={`transition-colors pb-1 ${
                activeNavTab === 'candidates'
                  ? 'text-indigo-600 dark:text-indigo-400 border-b-2 border-indigo-600 dark:border-indigo-400 font-semibold'
                  : 'text-slate-600 dark:text-slate-400 hover:text-indigo-600 dark:hover:text-indigo-400'
              }`}
            >
              Candidates
            </button>
            <button
              onClick={onOpenJdModal}
              className="text-slate-600 dark:text-slate-400 hover:text-indigo-600 dark:hover:text-indigo-400 transition-colors pb-1 flex items-center gap-1.5"
            >
              <span>Jobs</span>
              {activeJd && (
                <span className="px-1.5 py-0.2 rounded text-[10px] bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300">
                  {activeJd.title.split(' ')[0]}
                </span>
              )}
            </button>
            <button
              onClick={onOpenAuditLogs}
              className="text-slate-600 dark:text-slate-400 hover:text-indigo-600 dark:hover:text-indigo-400 transition-colors pb-1"
            >
              Analytics & Logs
            </button>
          </nav>

          {/* User Profile & Actions */}
          <div className="flex items-center gap-3 sm:gap-4">
            
            {/* Dark / Light Toggle */}
            <button
              onClick={() => setDarkMode(!darkMode)}
              id="theme-toggle-btn"
              className="p-2 rounded-lg text-slate-500 hover:text-slate-800 dark:text-slate-400 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
              title={darkMode ? 'Light mode' : 'Dark mode'}
            >
              {darkMode ? <Sun className="w-4 h-4 text-amber-400" /> : <Moon className="w-4 h-4" />}
            </button>

            {/* Quick Upload Button */}
            <button
              onClick={onOpenUpload}
              id="upload-resume-main-btn"
              className="flex items-center gap-1.5 px-3 py-1.5 bg-indigo-600 text-white rounded-lg text-xs font-semibold shadow-xs hover:bg-indigo-700 transition-colors"
            >
              <UploadCloud className="w-4 h-4" />
              <span>Upload PDF</span>
            </button>

            {/* User Profile Badge */}
            <div className="flex items-center gap-2 pl-3 sm:pl-4 border-l border-slate-200 dark:border-slate-800">
              <div className="w-8 h-8 rounded-full bg-gradient-to-tr from-indigo-600 to-purple-600 text-white font-bold text-xs flex items-center justify-center shadow-xs">
                SJ
              </div>
              <div className="hidden lg:block text-left">
                <div className="text-xs font-semibold text-slate-700 dark:text-slate-200 leading-tight">
                  Sarah Jenkins
                </div>
                <div className="text-[10px] text-slate-400">
                  Lead HR Partner
                </div>
              </div>
            </div>

          </div>
        </div>
      </div>
    </header>
  );
};
