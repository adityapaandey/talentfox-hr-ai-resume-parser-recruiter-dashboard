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
  UserCheck,
  LogOut,
  SlidersHorizontal
} from 'lucide-react';
import { JobDescription, AuthUser } from '../types';

interface NavbarProps {
  darkMode: boolean;
  setDarkMode: (val: boolean) => void;
  userRole: 'Recruiter' | 'Admin';
  setUserRole: (role: 'Recruiter' | 'Admin') => void;
  activeJd: JobDescription | null;
  onOpenUpload: () => void;
  onOpenJdModal: () => void;
  onOpenAuditLogs: () => void;
  onOpenUserManagement?: () => void;
  onExportExcel: () => void;
  onExportCSV: () => void;
  totalCandidates: number;
  matchedCount: number;
  activeNavTab?: 'candidates' | 'jobs' | 'analytics';
  onSelectNavTab?: (tab: 'candidates' | 'jobs' | 'analytics') => void;
  currentUser?: AuthUser | null;
  onLogout?: () => void;
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
  onOpenUserManagement,
  onExportExcel,
  onExportCSV,
  totalCandidates,
  matchedCount,
  activeNavTab = 'candidates',
  onSelectNavTab,
  currentUser,
  onLogout
}) => {
  return (
    <header className="sticky top-0 z-30 w-full bg-white dark:bg-slate-900 border-b border-slate-200 dark:border-slate-800 shadow-xs transition-colors">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          
          {/* Logo & Brand */}
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 bg-olive-700 rounded-lg flex items-center justify-center text-white shadow-xs">
              <Users className="w-5 h-5" />
            </div>
            <div className="flex items-center gap-2">
              <h1 className="text-xl font-bold text-slate-800 dark:text-white tracking-tight">
                TalentFox <span className="text-olive-700 dark:text-olive-400">HR</span>
              </h1>
              <span className="hidden sm:inline-flex items-center px-1.5 py-0.5 rounded text-[10px] font-bold bg-olive-50 text-olive-800 dark:bg-olive-950/60 dark:text-olive-300 border border-olive-200/60 dark:border-olive-800">
                <Sparkles className="w-3 h-3 mr-0.5 text-olive-600" />
                AI 3.7
              </span>
            </div>
          </div>

          {/* Navigation Links */}
          <nav className="hidden md:flex items-center gap-6 text-sm font-medium">
            <button
              onClick={() => onSelectNavTab?.('candidates')}
              className={`transition-colors pb-1 cursor-pointer ${
                activeNavTab === 'candidates'
                  ? 'text-olive-700 dark:text-olive-400 border-b-2 border-olive-700 dark:border-olive-400 font-semibold'
                  : 'text-slate-600 dark:text-slate-400 hover:text-olive-700 dark:hover:text-olive-400'
              }`}
            >
              Candidates
            </button>
            <button
              onClick={onOpenJdModal}
              className="text-slate-600 dark:text-slate-400 hover:text-olive-700 dark:hover:text-olive-400 transition-colors pb-1 flex items-center gap-1.5 cursor-pointer"
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
              className="text-slate-600 dark:text-slate-400 hover:text-olive-700 dark:hover:text-olive-400 transition-colors pb-1 cursor-pointer"
            >
              Analytics & Logs
            </button>

            {/* Admin User / Access Management link */}
            {userRole === 'Admin' && onOpenUserManagement && (
              <button
                onClick={onOpenUserManagement}
                className="text-slate-600 dark:text-slate-400 hover:text-olive-700 dark:hover:text-olive-400 transition-colors pb-1 flex items-center gap-1 cursor-pointer"
                title="Manage Roles and Access"
              >
                <ShieldCheck className="w-3.5 h-3.5 text-olive-600" />
                <span>User Access</span>
              </button>
            )}
          </nav>

          {/* User Profile & Actions */}
          <div className="flex items-center gap-3 sm:gap-4">
            
            {/* Dark / Light Toggle */}
            <button
              onClick={() => setDarkMode(!darkMode)}
              id="theme-toggle-btn"
              className="p-2 rounded-lg text-slate-500 hover:text-slate-800 dark:text-slate-400 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors cursor-pointer"
              title={darkMode ? 'Light mode' : 'Dark mode'}
            >
              {darkMode ? <Sun className="w-4 h-4 text-amber-400" /> : <Moon className="w-4 h-4" />}
            </button>

            {/* Quick Upload Button */}
            <button
              onClick={onOpenUpload}
              id="upload-resume-main-btn"
              className="flex items-center gap-1.5 px-3 py-1.5 bg-olive-700 text-white rounded-lg text-xs font-semibold shadow-xs hover:bg-olive-800 transition-colors cursor-pointer"
            >
              <UploadCloud className="w-4 h-4" />
              <span>Upload PDF</span>
            </button>

            {/* User Profile Badge & Role Tag */}
            <div className="flex items-center gap-2 pl-3 sm:pl-4 border-l border-slate-200 dark:border-slate-800">
              <div 
                onClick={onOpenUserManagement}
                className={`w-8 h-8 rounded-full bg-gradient-to-tr from-olive-700 to-olive-500 text-white font-bold text-xs flex items-center justify-center shadow-xs ${onOpenUserManagement ? 'cursor-pointer hover:ring-2 hover:ring-olive-500/50' : ''}`}
                title={userRole === 'Admin' ? 'Admin Profile - Click to manage roles' : 'Recruiter Profile'}
              >
                {currentUser?.avatarInitials || (userRole === 'Admin' ? 'SJ' : 'AR')}
              </div>
              <div className="hidden lg:block text-left">
                <div className="text-xs font-semibold text-slate-700 dark:text-slate-200 leading-tight flex items-center gap-1.5">
                  <span>{currentUser?.name || (userRole === 'Admin' ? 'Sarah Jenkins' : 'Alex Rivera')}</span>
                  <span className={`px-1.5 py-0.2 rounded text-[9px] font-bold ${
                    userRole === 'Admin' 
                      ? 'bg-purple-100 text-purple-800 dark:bg-purple-950 dark:text-purple-300' 
                      : 'bg-olive-100 text-olive-800 dark:bg-olive-950 dark:text-olive-300'
                  }`}>
                    {userRole}
                  </span>
                </div>
                <div className="text-[10px] text-slate-400">
                  {currentUser?.title || (userRole === 'Admin' ? 'Lead Talent Admin' : 'Technical Recruiter')}
                </div>
              </div>

              {onLogout && (
                <button
                  type="button"
                  onClick={onLogout}
                  id="navbar-logout-btn"
                  className="p-1.5 ml-1 rounded-lg text-slate-400 hover:text-rose-600 dark:hover:text-rose-400 hover:bg-rose-50 dark:hover:bg-rose-950/40 transition-colors cursor-pointer"
                  title="Sign out"
                >
                  <LogOut className="w-4 h-4" />
                </button>
              )}
            </div>

          </div>
        </div>
      </div>
    </header>
  );
};
