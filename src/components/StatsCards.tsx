import React from 'react';
import { 
  Users, 
  Award, 
  Briefcase, 
  TrendingUp, 
  CheckCircle2, 
  FileText,
  Clock,
  Sparkles
} from 'lucide-react';
import { Candidate, CandidateStatus } from '../types';

interface StatsCardsProps {
  candidates: Candidate[];
  onFilterStatus?: (status: string) => void;
  selectedStatusFilter: string;
}

export const StatsCards: React.FC<StatsCardsProps> = ({
  candidates,
  onFilterStatus,
  selectedStatusFilter
}) => {
  const total = candidates.length;
  
  // Calculate average experience
  const avgExp = total > 0
    ? (candidates.reduce((sum, c) => sum + (c.totalExperienceYears || 0), 0) / total).toFixed(1)
    : '0';

  // High match score count (>= 80%)
  const highMatchCount = candidates.filter(c => c.matchResult && c.matchResult.score >= 80).length;

  // Status breakdown
  const statusCounts: Record<CandidateStatus, number> = {
    'New': 0,
    'Screened': 0,
    'Interview Scheduled': 0,
    'Shortlisted': 0,
    'Offered': 0,
    'Rejected': 0,
    'Hired': 0
  };

  candidates.forEach(c => {
    if (statusCounts[c.status] !== undefined) {
      statusCounts[c.status]++;
    }
  });

  // Top extracted skills aggregate
  const skillMap: Record<string, number> = {};
  candidates.forEach(c => {
    (c.skills || []).forEach(s => {
      skillMap[s] = (skillMap[s] || 0) + 1;
    });
  });
  const topSkills = Object.entries(skillMap)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 5);

  return (
    <div className="space-y-4">
      {/* Top 4 Quick Metric Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        
        {/* Total Resumes */}
        <div className="p-4 rounded-xl border bg-white dark:bg-slate-800/80 border-slate-200 dark:border-slate-700/80 shadow-xs flex items-center justify-between">
          <div>
            <p className="text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider">
              Total Resumes
            </p>
            <h3 className="text-2xl font-bold text-slate-900 dark:text-white mt-1">
              {total}
            </h3>
            <p className="text-xs text-emerald-600 dark:text-emerald-400 mt-1 flex items-center">
              <CheckCircle2 className="w-3.5 h-3.5 mr-1" />
              100% Parsed & Indexed
            </p>
          </div>
          <div className="w-12 h-12 rounded-xl bg-olive-50 dark:bg-olive-950/60 text-olive-700 dark:text-olive-400 flex items-center justify-center">
            <Users className="w-6 h-6" />
          </div>
        </div>

        {/* Avg Experience */}
        <div className="p-4 rounded-xl border bg-white dark:bg-slate-800/80 border-slate-200 dark:border-slate-700/80 shadow-xs flex items-center justify-between">
          <div>
            <p className="text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider">
              Avg Experience
            </p>
            <h3 className="text-2xl font-bold text-slate-900 dark:text-white mt-1">
              {avgExp} <span className="text-sm font-normal text-slate-500">Years</span>
            </h3>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
              Across candidate talent pool
            </p>
          </div>
          <div className="w-12 h-12 rounded-xl bg-blue-50 dark:bg-blue-950/60 text-blue-600 dark:text-blue-400 flex items-center justify-center">
            <Clock className="w-6 h-6" />
          </div>
        </div>

        {/* Strong JD Matches */}
        <div className="p-4 rounded-xl border bg-white dark:bg-slate-800/80 border-slate-200 dark:border-slate-700/80 shadow-xs flex items-center justify-between">
          <div>
            <p className="text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider">
              Strong JD Matches (≥80%)
            </p>
            <h3 className="text-2xl font-bold text-emerald-600 dark:text-emerald-400 mt-1">
              {highMatchCount} <span className="text-xs text-slate-400">/ {total}</span>
            </h3>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-1 flex items-center">
              <Sparkles className="w-3.5 h-3.5 mr-1 text-amber-500" />
              AI Evaluated Fit
            </p>
          </div>
          <div className="w-12 h-12 rounded-xl bg-emerald-50 dark:bg-emerald-950/60 text-emerald-600 dark:text-emerald-400 flex items-center justify-center">
            <Award className="w-6 h-6" />
          </div>
        </div>

        {/* Top Extracted Skills */}
        <div className="p-4 rounded-xl border bg-white dark:bg-slate-800/80 border-slate-200 dark:border-slate-700/80 shadow-xs">
          <p className="text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider mb-2">
            Top Skills In Pool
          </p>
          <div className="flex flex-wrap gap-1.5">
            {topSkills.map(([skill, count]) => (
              <span
                key={skill}
                className="inline-flex items-center px-2 py-0.5 rounded text-[11px] font-medium bg-slate-100 dark:bg-slate-700 text-slate-700 dark:text-slate-300"
              >
                {skill}
                <span className="ml-1 text-[10px] text-slate-400">({count})</span>
              </span>
            ))}
            {topSkills.length === 0 && (
              <span className="text-xs text-slate-400 italic">No skills extracted yet</span>
            )}
          </div>
        </div>

      </div>

      {/* Pipeline Quick Filter Badges */}
      <div className="flex items-center space-x-2 overflow-x-auto pb-1 text-xs">
        <span className="text-slate-400 font-semibold uppercase text-[10px] tracking-wider shrink-0 mr-1">
          Hiring Pipeline:
        </span>
        
        <button
          onClick={() => onFilterStatus && onFilterStatus('All')}
          className={`px-3 py-1 rounded-lg font-medium transition-all cursor-pointer ${
            selectedStatusFilter === 'All'
              ? 'bg-olive-700 text-white shadow-xs'
              : 'bg-white dark:bg-slate-800 text-slate-600 dark:text-slate-300 border border-slate-200 dark:border-slate-700 hover:bg-slate-50'
          }`}
        >
          All ({total})
        </button>

        {(['New', 'Screened', 'Interview Scheduled', 'Shortlisted', 'Offered', 'Hired', 'Rejected'] as CandidateStatus[]).map(status => {
          const count = statusCounts[status] || 0;
          const isActive = selectedStatusFilter === status;
          return (
            <button
              key={status}
              onClick={() => onFilterStatus && onFilterStatus(status)}
              className={`px-2.5 py-1 rounded-lg font-medium transition-all flex items-center space-x-1.5 shrink-0 ${
                isActive
                  ? 'bg-slate-900 dark:bg-white text-white dark:text-slate-900 shadow-xs'
                  : 'bg-white dark:bg-slate-800 text-slate-600 dark:text-slate-300 border border-slate-200 dark:border-slate-700 hover:bg-slate-50'
              }`}
            >
              <span>{status}</span>
              <span className={`text-[10px] px-1.5 py-0.2 rounded-full ${
                isActive ? 'bg-white/20 dark:bg-slate-900/20' : 'bg-slate-100 dark:bg-slate-700'
              }`}>
                {count}
              </span>
            </button>
          );
        })}
      </div>
    </div>
  );
};
