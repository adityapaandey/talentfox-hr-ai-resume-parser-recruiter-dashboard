import React, { useState, useMemo } from 'react';
import { 
  Search, 
  Filter, 
  ArrowUpDown, 
  ArrowUp, 
  ArrowDown, 
  FileText, 
  Eye, 
  Download, 
  Calendar, 
  CheckSquare, 
  Square, 
  Sparkles, 
  ChevronLeft, 
  ChevronRight, 
  ChevronDown,
  ChevronUp,
  Trash2, 
  MoreVertical,
  AlertTriangle,
  FileSpreadsheet,
  CheckCircle2,
  XCircle,
  UploadCloud,
  Mail,
  Phone,
  MapPin,
  Linkedin,
  Github,
  Briefcase,
  GraduationCap,
  Award,
  Layers,
  Clock
} from 'lucide-react';
import { Candidate, CandidateStatus } from '../types';
import { downloadSampleResume } from '../utils/pdfHelpers';

interface CandidateTableProps {
  candidates: Candidate[];
  onViewCandidate: (candidate: Candidate) => void;
  onScheduleInterview: (candidate: Candidate) => void;
  onUpdateStatus: (candidateId: string, status: CandidateStatus) => void;
  onDeleteCandidate: (candidateId: string) => void;
  onBulkDelete: (candidateIds: string[]) => void;
  onExportSelectedExcel: (candidates: Candidate[]) => void;
  selectedStatusFilter: string;
  onFilterStatus: (status: string) => void;
  onOpenUpload?: () => void;
  userRole?: 'Recruiter' | 'Admin';
}

type SortField = 'name' | 'totalExperienceYears' | 'score' | 'uploadDate' | 'currentCompany';
type SortOrder = 'asc' | 'desc';

export const CandidateTable: React.FC<CandidateTableProps> = ({
  candidates,
  onViewCandidate,
  onScheduleInterview,
  onUpdateStatus,
  onDeleteCandidate,
  onBulkDelete,
  onExportSelectedExcel,
  selectedStatusFilter,
  onFilterStatus,
  onOpenUpload,
  userRole = 'Admin'
}) => {
  // Search & Filters state
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedSkillFilter, setSelectedSkillFilter] = useState<string>('All');
  const [minScoreFilter, setMinScoreFilter] = useState<number>(0);
  const [minExpFilter, setMinExpFilter] = useState<string>('All');
  const [onlyDuplicates, setOnlyDuplicates] = useState(false);

  // Sorting state
  const [sortField, setSortField] = useState<SortField>('score');
  const [sortOrder, setSortOrder] = useState<SortOrder>('desc');

  // Selection state
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const [expandedIds, setExpandedIds] = useState<string[]>([]);

  // Pagination state
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);

  // Deletion Confirmation States
  const [deletingCandidate, setDeletingCandidate] = useState<Candidate | null>(null);
  const [showBulkDeleteConfirm, setShowBulkDeleteConfirm] = useState(false);

  // Extract all unique skills for filter dropdown
  const allUniqueSkills = useMemo(() => {
    const skills = new Set<string>();
    candidates.forEach(c => (c.skills || []).forEach(s => skills.add(s)));
    return Array.from(skills).sort();
  }, [candidates]);

  // Handle Sort Toggle
  const handleSort = (field: SortField) => {
    if (sortField === field) {
      setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc');
    } else {
      setSortField(field);
      setSortOrder('desc');
    }
  };

  // Filtered & Sorted Candidates
  const filteredCandidates = useMemo(() => {
    return candidates.filter(c => {
      // Global Search
      if (searchTerm.trim()) {
        const query = searchTerm.toLowerCase().trim();
        const nameMatch = c.name?.toLowerCase().includes(query);
        const emailMatch = c.email?.toLowerCase().includes(query);
        const companyMatch = c.currentCompany?.toLowerCase().includes(query);
        const desigMatch = c.currentDesignation?.toLowerCase().includes(query);
        const locMatch = c.location?.toLowerCase().includes(query);
        const skillsMatch = (c.skills || []).some(s => s.toLowerCase().includes(query));
        if (!nameMatch && !emailMatch && !companyMatch && !desigMatch && !locMatch && !skillsMatch) {
          return false;
        }
      }

      // Status Filter
      if (selectedStatusFilter !== 'All' && c.status !== selectedStatusFilter) {
        return false;
      }

      // Skill Filter
      if (selectedSkillFilter !== 'All') {
        const hasSkill = (c.skills || []).some(s => s.toLowerCase() === selectedSkillFilter.toLowerCase());
        if (!hasSkill) return false;
      }

      // Min Score Filter
      if (minScoreFilter > 0) {
        const score = c.matchResult?.score || 0;
        if (score < minScoreFilter) return false;
      }

      // Min Experience Filter
      if (minExpFilter !== 'All') {
        const exp = c.totalExperienceYears || 0;
        if (minExpFilter === '<3' && exp >= 3) return false;
        if (minExpFilter === '3-5' && (exp < 3 || exp > 5)) return false;
        if (minExpFilter === '5-8' && (exp < 5 || exp > 8)) return false;
        if (minExpFilter === '8+' && exp < 8) return false;
      }

      // Duplicates Filter
      if (onlyDuplicates && !c.isDuplicate) {
        return false;
      }

      return true;
    }).sort((a, b) => {
      let valA: any = 0;
      let valB: any = 0;

      if (sortField === 'name') {
        valA = a.name.toLowerCase();
        valB = b.name.toLowerCase();
      } else if (sortField === 'totalExperienceYears') {
        valA = a.totalExperienceYears || 0;
        valB = b.totalExperienceYears || 0;
      } else if (sortField === 'score') {
        valA = a.matchResult?.score || 0;
        valB = b.matchResult?.score || 0;
      } else if (sortField === 'uploadDate') {
        valA = a.uploadDate || '';
        valB = b.uploadDate || '';
      } else if (sortField === 'currentCompany') {
        valA = (a.currentCompany || '').toLowerCase();
        valB = (b.currentCompany || '').toLowerCase();
      }

      if (valA < valB) return sortOrder === 'asc' ? -1 : 1;
      if (valA > valB) return sortOrder === 'asc' ? 1 : -1;
      return 0;
    });
  }, [candidates, searchTerm, selectedStatusFilter, selectedSkillFilter, minScoreFilter, minExpFilter, onlyDuplicates, sortField, sortOrder]);

  // Paginated Slice
  const totalPages = Math.max(1, Math.ceil(filteredCandidates.length / pageSize));
  const paginatedCandidates = useMemo(() => {
    const start = (currentPage - 1) * pageSize;
    return filteredCandidates.slice(start, start + pageSize);
  }, [filteredCandidates, currentPage, pageSize]);

  // Selection helpers
  const isAllSelected = paginatedCandidates.length > 0 && paginatedCandidates.every(c => selectedIds.includes(c.id));
  const toggleSelectAll = () => {
    if (isAllSelected) {
      setSelectedIds(prev => prev.filter(id => !paginatedCandidates.some(c => c.id === id)));
    } else {
      const pageIds = paginatedCandidates.map(c => c.id);
      setSelectedIds(prev => Array.from(new Set([...prev, ...pageIds])));
    }
  };

  const toggleSelectOne = (id: string) => {
    setSelectedIds(prev => prev.includes(id) ? prev.filter(i => i !== id) : [...prev, id]);
  };

  const selectedCandidatesList = candidates.filter(c => selectedIds.includes(c.id));

  // Render match score badge
  const renderMatchBadge = (c: Candidate) => {
    if (!c.matchResult) {
      return (
        <span className="text-[11px] text-slate-400 italic">Not evaluated</span>
      );
    }

    const score = c.matchResult.score;
    let barColor = 'bg-emerald-500';
    let textColor = 'text-emerald-700 dark:text-emerald-400';
    
    if (score < 50) {
      barColor = 'bg-slate-400 dark:bg-slate-500';
      textColor = 'text-slate-700 dark:text-slate-300';
    } else if (score < 75) {
      barColor = 'bg-amber-400 dark:bg-amber-500';
      textColor = 'text-amber-700 dark:text-amber-400';
    }

    return (
      <div className="flex items-center gap-2" title={c.matchResult.reasoning}>
        <div className="w-12 h-1.5 bg-slate-100 dark:bg-slate-800 rounded-full overflow-hidden shrink-0">
          <div className={`h-full ${barColor}`} style={{ width: `${score}%` }}></div>
        </div>
        <span className={`text-xs font-bold ${textColor}`}>
          {score}%
        </span>
      </div>
    );
  };

  return (
    <div className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 shadow-xs overflow-hidden flex flex-col">
      
      {/* Table Toolbar & Search Bar */}
      <div className="p-4 border-b border-slate-100 dark:border-slate-800 space-y-3">
        
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-3">
          
          {/* Search Input */}
          <div className="relative flex-1 max-w-md">
            <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
            <input
              type="text"
              id="candidate-search-input"
              value={searchTerm}
              onChange={e => { setSearchTerm(e.target.value); setCurrentPage(1); }}
              placeholder="Search candidates, skills, or companies..."
              className="w-full pl-9 pr-4 py-2 border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 rounded-lg text-sm text-slate-900 dark:text-white placeholder-slate-400 focus:outline-hidden focus:ring-2 focus:ring-olive-500/20 focus:border-olive-500 transition-all"
            />
            {searchTerm && (
              <button
                onClick={() => setSearchTerm('')}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-xs text-slate-400 hover:text-slate-600"
              >
                Clear
              </button>
            )}
          </div>

          {/* Quick Filters */}
          <div className="flex flex-wrap items-center gap-2">
            
            {/* Skill Filter Dropdown */}
            <div className="flex items-center space-x-1 bg-white dark:bg-slate-800 px-3 py-1.5 rounded-lg border border-slate-200 dark:border-slate-700 text-xs shadow-2xs">
              <span className="text-slate-400 font-medium">Skill:</span>
              <select
                value={selectedSkillFilter}
                onChange={e => { setSelectedSkillFilter(e.target.value); setCurrentPage(1); }}
                className="bg-transparent text-slate-800 dark:text-slate-200 font-semibold focus:outline-hidden cursor-pointer"
              >
                <option value="All">All Skills</option>
                {allUniqueSkills.map(s => (
                  <option key={s} value={s}>{s}</option>
                ))}
              </select>
            </div>

            {/* Experience Filter */}
            <div className="flex items-center space-x-1 bg-white dark:bg-slate-800 px-3 py-1.5 rounded-lg border border-slate-200 dark:border-slate-700 text-xs shadow-2xs">
              <span className="text-slate-400 font-medium">Exp:</span>
              <select
                value={minExpFilter}
                onChange={e => { setMinExpFilter(e.target.value); setCurrentPage(1); }}
                className="bg-transparent text-slate-800 dark:text-slate-200 font-semibold focus:outline-hidden cursor-pointer"
              >
                <option value="All">Any Experience</option>
                <option value="<3">&lt; 3 Years</option>
                <option value="3-5">3 - 5 Years</option>
                <option value="5-8">5 - 8 Years</option>
                <option value="8+">8+ Years</option>
              </select>
            </div>

            {/* Min Match % Filter */}
            <div className="flex items-center space-x-1 bg-white dark:bg-slate-800 px-3 py-1.5 rounded-lg border border-slate-200 dark:border-slate-700 text-xs shadow-2xs">
              <span className="text-slate-400 font-medium">Min Fit:</span>
              <select
                value={minScoreFilter}
                onChange={e => { setMinScoreFilter(Number(e.target.value)); setCurrentPage(1); }}
                className="bg-transparent text-slate-800 dark:text-slate-200 font-semibold focus:outline-hidden cursor-pointer"
              >
                <option value={0}>All Scores</option>
                <option value={80}>≥ 80% (Strong Match)</option>
                <option value={60}>≥ 60% (Potential Match)</option>
                <option value={40}>≥ 40% (Moderate Match)</option>
              </select>
            </div>

            {/* Duplicate Filter Toggle */}
            <button
              onClick={() => { setOnlyDuplicates(!onlyDuplicates); setCurrentPage(1); }}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold border transition-colors flex items-center space-x-1 shadow-2xs ${
                onlyDuplicates
                  ? 'bg-amber-500 text-white border-amber-600'
                  : 'bg-white dark:bg-slate-800 text-slate-600 dark:text-slate-300 border-slate-200 dark:border-slate-700 hover:bg-slate-50'
              }`}
            >
              <AlertTriangle className="w-3.5 h-3.5" />
              <span>Duplicates</span>
            </button>

            {/* Expand / Collapse All Details */}
            <button
              onClick={() => {
                if (expandedIds.length === paginatedCandidates.length) {
                  setExpandedIds([]);
                } else {
                  setExpandedIds(paginatedCandidates.map(c => c.id));
                }
              }}
              className="px-3 py-1.5 rounded-lg text-xs font-semibold border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 hover:bg-slate-50 dark:hover:bg-slate-750 text-slate-700 dark:text-slate-300 transition-colors flex items-center space-x-1 shadow-2xs cursor-pointer"
            >
              <Layers className="w-3.5 h-3.5 text-olive-600 dark:text-olive-400" />
              <span>{expandedIds.length > 0 ? 'Collapse Details' : 'Expand All Details'}</span>
            </button>

          </div>

        </div>

        {/* Bulk Actions Banner if items are selected */}
        {selectedIds.length > 0 && (
          <div className="p-2.5 rounded-lg bg-olive-50 dark:bg-olive-950/60 border border-olive-200 dark:border-olive-800 flex items-center justify-between text-xs animate-fadeIn">
            <div className="flex items-center space-x-2">
              <span className="font-bold text-olive-900 dark:text-olive-200">
                {selectedIds.length} candidate{selectedIds.length > 1 ? 's' : ''} selected
              </span>
            </div>

            <div className="flex items-center space-x-2">
              <button
                type="button"
                onClick={() => onExportSelectedExcel(selectedCandidatesList)}
                className="flex items-center space-x-1 px-3 py-1 font-semibold rounded-md bg-emerald-600 hover:bg-emerald-700 text-white shadow-2xs cursor-pointer"
              >
                <FileSpreadsheet className="w-3.5 h-3.5" />
                <span>Export Selected</span>
              </button>

              {/* Bulk delete: ONLY allowed for Admin */}
              {userRole === 'Admin' && (
                <button
                  type="button"
                  onClick={() => setShowBulkDeleteConfirm(true)}
                  className="flex items-center space-x-1 px-3 py-1 font-semibold rounded-md bg-rose-600 hover:bg-rose-700 text-white shadow-2xs transition-colors cursor-pointer"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                  <span>Delete Selected ({selectedIds.length})</span>
                </button>
              )}

              <button
                type="button"
                onClick={() => setSelectedIds([])}
                className="text-slate-500 hover:text-slate-700 dark:hover:text-slate-300 px-2 cursor-pointer"
              >
                Deselect
              </button>
            </div>
          </div>
        )}

      </div>

      {/* Candidate Data Grid Table */}
      <div className="overflow-x-auto min-h-[350px]">
        <table className="w-full text-left border-collapse">
          
          {/* Table Header */}
          <thead className="bg-slate-50 dark:bg-slate-800/70 sticky top-0 z-10 select-none">
            <tr>
              
              {/* Checkbox Header */}
              <th className="px-4 py-3 w-10 text-center border-b border-slate-200 dark:border-slate-800">
                <button
                  type="button"
                  onClick={toggleSelectAll}
                  className="text-slate-400 hover:text-olive-600 transition-colors"
                >
                  {isAllSelected ? (
                    <CheckSquare className="w-4 h-4 text-olive-600" />
                  ) : (
                    <Square className="w-4 h-4" />
                  )}
                </button>
              </th>

              {/* Name Column */}
              <th 
                onClick={() => handleSort('name')}
                className="px-6 py-3 text-[11px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider border-b border-slate-200 dark:border-slate-800 cursor-pointer hover:text-olive-600 transition-colors"
              >
                <div className="flex items-center space-x-1">
                  <span>Candidate</span>
                  {sortField === 'name' ? (
                    sortOrder === 'asc' ? <ArrowUp className="w-3 h-3" /> : <ArrowDown className="w-3 h-3" />
                  ) : <ArrowUpDown className="w-3 h-3 text-slate-400" />}
                </div>
              </th>

              {/* Experience Column */}
              <th 
                onClick={() => handleSort('totalExperienceYears')}
                className="px-6 py-3 text-[11px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider border-b border-slate-200 dark:border-slate-800 cursor-pointer hover:text-olive-600 transition-colors"
              >
                <div className="flex items-center space-x-1">
                  <span>Experience</span>
                  {sortField === 'totalExperienceYears' ? (
                    sortOrder === 'asc' ? <ArrowUp className="w-3 h-3" /> : <ArrowDown className="w-3 h-3" />
                  ) : <ArrowUpDown className="w-3 h-3 text-slate-400" />}
                </div>
              </th>

              {/* Current Company & Designation */}
              <th 
                onClick={() => handleSort('currentCompany')}
                className="px-6 py-3 text-[11px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider border-b border-slate-200 dark:border-slate-800 cursor-pointer hover:text-olive-600 transition-colors"
              >
                <div className="flex items-center space-x-1">
                  <span>Current Company</span>
                  {sortField === 'currentCompany' ? (
                    sortOrder === 'asc' ? <ArrowUp className="w-3 h-3" /> : <ArrowDown className="w-3 h-3" />
                  ) : <ArrowUpDown className="w-3 h-3 text-slate-400" />}
                </div>
              </th>

              {/* Top Skills */}
              <th className="px-6 py-3 text-[11px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider border-b border-slate-200 dark:border-slate-800 min-w-[200px]">
                <span>Primary Skills</span>
              </th>

              {/* Match % Column */}
              <th 
                onClick={() => handleSort('score')}
                className="px-6 py-3 text-[11px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider border-b border-slate-200 dark:border-slate-800 cursor-pointer hover:text-olive-600 transition-colors"
              >
                <div className="flex items-center space-x-1">
                  <span>Match %</span>
                  {sortField === 'score' ? (
                    sortOrder === 'asc' ? <ArrowUp className="w-3 h-3" /> : <ArrowDown className="w-3 h-3" />
                  ) : <ArrowUpDown className="w-3 h-3 text-slate-400" />}
                </div>
              </th>

              {/* Status Column */}
              <th className="px-6 py-3 text-[11px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider border-b border-slate-200 dark:border-slate-800 min-w-[130px]">
                <span>Status</span>
              </th>

              {/* Actions */}
              <th className="px-6 py-3 text-[11px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider border-b border-slate-200 dark:border-slate-800 text-right">
                <span>Action</span>
              </th>

            </tr>
          </thead>

          {/* Table Body */}
          <tbody className="divide-y divide-slate-100 dark:divide-slate-800/80">
            {paginatedCandidates.map((c, idx) => {
              const isSelected = selectedIds.includes(c.id);
              const isExpanded = expandedIds.includes(c.id);

              return (
                <React.Fragment key={c.id || `candidate-row-${idx}`}>
                  <tr
                    className={`hover:bg-olive-50/30 dark:hover:bg-slate-800/40 transition-colors ${
                      isSelected ? 'bg-olive-50/50 dark:bg-olive-950/30' : ''
                    } ${isExpanded ? 'border-b-0 bg-slate-50/60 dark:bg-slate-800/30' : ''}`}
                  >
                    
                    {/* Select Checkbox & Expand Toggle */}
                    <td className="px-4 py-4 text-center">
                      <div className="flex items-center justify-center space-x-1.5">
                        <button
                          type="button"
                          onClick={() => {
                            setExpandedIds(prev =>
                              prev.includes(c.id) ? prev.filter(id => id !== c.id) : [...prev, c.id]
                            );
                          }}
                          className="p-1 text-slate-400 hover:text-olive-600 rounded transition-colors"
                          title={isExpanded ? 'Collapse row details' : 'Expand all candidate details'}
                        >
                          {isExpanded ? (
                            <ChevronUp className="w-4 h-4 text-olive-600" />
                          ) : (
                            <ChevronDown className="w-4 h-4" />
                          )}
                        </button>

                        <button
                          type="button"
                          onClick={() => toggleSelectOne(c.id)}
                          className="text-slate-400 hover:text-olive-600"
                        >
                          {isSelected ? (
                            <CheckSquare className="w-4 h-4 text-olive-600" />
                          ) : (
                            <Square className="w-4 h-4" />
                          )}
                        </button>
                      </div>
                    </td>

                    {/* Candidate Name & Contact Details */}
                    <td className="px-6 py-4">
                      <div className="flex flex-col">
                        <div className="flex items-center space-x-1.5">
                          <button
                            type="button"
                            onClick={() => onViewCandidate(c)}
                            className="text-sm font-bold text-slate-800 dark:text-white hover:text-olive-600 dark:hover:text-olive-400 text-left truncate cursor-pointer"
                          >
                            {c.name}
                          </button>
                          {c.isDuplicate && (
                            <span 
                              className="px-1.5 py-0.2 rounded text-[9px] font-bold bg-amber-100 text-amber-800 dark:bg-amber-950 dark:text-amber-300"
                              title="Possible duplicate candidate profile"
                            >
                              Duplicate
                            </span>
                          )}
                        </div>
                        
                        <div className="flex items-center space-x-2 text-xs text-slate-500 dark:text-slate-400 truncate">
                          <span>{c.email}</span>
                          {c.phone && (
                            <>
                              <span>•</span>
                              <span>{c.phone}</span>
                            </>
                          )}
                        </div>
                      </div>
                    </td>

                    {/* Experience */}
                    <td className="px-6 py-4 text-sm text-slate-600 dark:text-slate-300">
                      <div className="font-semibold">{c.totalExperienceYears} Years</div>
                      {c.location && (
                        <div className="text-[11px] text-slate-400 flex items-center gap-0.5 truncate max-w-[140px]">
                          <MapPin className="w-3 h-3 shrink-0" />
                          <span>{c.location}</span>
                        </div>
                      )}
                    </td>

                    {/* Current Company & Designation */}
                    <td className="px-6 py-4 text-sm text-slate-600 dark:text-slate-300 font-medium">
                      <div className="truncate max-w-[170px]">
                        {c.currentCompany || 'Independent'}
                      </div>
                      <div className="text-[11px] text-slate-400 truncate max-w-[170px]">
                        {c.currentDesignation || 'Engineer'}
                      </div>
                    </td>

                    {/* Primary Skills */}
                    <td className="px-6 py-4">
                      <div className="flex flex-wrap gap-1 max-w-[240px]">
                        {(c.skills || []).slice(0, 3).map((skill, sIdx) => (
                          <span
                            key={`${c.id}-skill-${skill}-${sIdx}`}
                            className="px-1.5 py-0.5 bg-olive-100 dark:bg-olive-950 text-olive-800 dark:text-olive-300 text-[10px] font-bold rounded"
                          >
                            {skill}
                          </span>
                        ))}
                        {(c.skills || []).length > 3 && (
                          <span 
                            className="px-1 py-0.5 rounded text-[10px] text-slate-400 bg-slate-100 dark:bg-slate-800 font-medium"
                            title={(c.skills || []).slice(3).join(', ')}
                          >
                            +{(c.skills || []).length - 3}
                          </span>
                        )}
                      </div>
                    </td>

                    {/* Match % */}
                    <td className="px-6 py-4">
                      {renderMatchBadge(c)}
                    </td>

                    {/* Pipeline Status Select */}
                    <td className="px-6 py-4">
                      <select
                        value={c.status}
                        onChange={e => onUpdateStatus(c.id, e.target.value as CandidateStatus)}
                        className="text-xs font-semibold px-2 py-1 rounded-md border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-800 dark:text-slate-200 cursor-pointer focus:outline-hidden"
                      >
                        <option value="New">New</option>
                        <option value="Screened">Screened</option>
                        <option value="Interview Scheduled">Interview Scheduled</option>
                        <option value="Shortlisted">Shortlisted</option>
                        <option value="Offered">Offered</option>
                        <option value="Hired">Hired</option>
                        <option value="Rejected">Rejected</option>
                      </select>
                    </td>

                    {/* Action */}
                    <td className="px-6 py-4 text-right">
                      <div className="flex items-center justify-end space-x-1.5">
                        <button
                          type="button"
                          onClick={() => onViewCandidate(c)}
                          className="text-olive-700 dark:text-olive-400 text-xs font-bold hover:underline px-1.5 py-1 cursor-pointer"
                        >
                          View Profile
                        </button>

                        <button
                          type="button"
                          onClick={() => downloadSampleResume(c)}
                          title="Download original resume"
                          className="p-1 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 transition-colors cursor-pointer"
                        >
                          <Download className="w-3.5 h-3.5" />
                        </button>

                        {/* Delete: ONLY allowed for Admin */}
                        {userRole === 'Admin' && (
                          <button
                            type="button"
                            onClick={() => setDeletingCandidate(c)}
                            title={`Delete ${c.name}`}
                            className="p-1 text-slate-400 hover:text-rose-600 dark:hover:text-rose-400 hover:bg-rose-50 dark:hover:bg-rose-950/40 rounded transition-colors cursor-pointer"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        )}
                      </div>
                    </td>

                  </tr>

                  {/* Expandable Comprehensive Details Drawer */}
                  {isExpanded && (
                    <tr className="bg-slate-50/80 dark:bg-slate-850/60 border-b border-slate-200 dark:border-slate-800">
                      <td colSpan={8} className="p-4 sm:p-5">
                        <div className="space-y-4 rounded-xl border border-olive-200/80 dark:border-olive-900/60 bg-white dark:bg-slate-900 p-4 shadow-xs">
                          
                          {/* Top Row: Meta Badges & IDs */}
                          <div className="flex flex-wrap items-center justify-between gap-2 pb-3 border-b border-slate-100 dark:border-slate-800 text-xs">
                            <div className="flex flex-wrap items-center gap-2">
                              <span className="px-2 py-0.5 rounded bg-slate-100 dark:bg-slate-800 font-mono text-[11px] text-slate-600 dark:text-slate-300">
                                ID: {c.id}
                              </span>
                              <span className="text-slate-400">•</span>
                              <span className="text-slate-600 dark:text-slate-400 flex items-center gap-1">
                                <Clock className="w-3.5 h-3.5 text-slate-400" />
                                Applied: {c.uploadDate || 'Recent'}
                              </span>
                              {c.resumeFileName && (
                                <>
                                  <span className="text-slate-400">•</span>
                                  <span className="text-slate-600 dark:text-slate-400 font-mono text-[11px]">
                                    File: {c.resumeFileName} {c.resumeFileSize ? `(${Math.round(c.resumeFileSize / 1024)} KB)` : ''}
                                  </span>
                                </>
                              )}
                            </div>

                            <div className="flex items-center gap-2">
                              {c.linkedin && (
                                <a
                                  href={c.linkedin.startsWith('http') ? c.linkedin : `https://${c.linkedin}`}
                                  target="_blank"
                                  rel="noopener noreferrer"
                                  className="inline-flex items-center gap-1 px-2.5 py-1 rounded bg-blue-50 dark:bg-blue-950/60 text-blue-700 dark:text-blue-300 hover:bg-blue-100 text-xs font-semibold transition-colors"
                                >
                                  <Linkedin className="w-3.5 h-3.5" />
                                  <span>LinkedIn</span>
                                </a>
                              )}
                              {c.github && (
                                <a
                                  href={c.github.startsWith('http') ? c.github : `https://${c.github}`}
                                  target="_blank"
                                  rel="noopener noreferrer"
                                  className="inline-flex items-center gap-1 px-2.5 py-1 rounded bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 hover:bg-slate-200 text-xs font-semibold transition-colors"
                                >
                                  <Github className="w-3.5 h-3.5" />
                                  <span>GitHub</span>
                                </a>
                              )}
                              <button
                                type="button"
                                onClick={() => downloadSampleResume(c)}
                                className="inline-flex items-center gap-1 px-2.5 py-1 rounded bg-olive-50 dark:bg-olive-950/60 text-olive-700 dark:text-olive-300 hover:bg-olive-100 text-xs font-semibold transition-colors cursor-pointer"
                              >
                                <Download className="w-3.5 h-3.5" />
                                <span>Download PDF</span>
                              </button>
                            </div>
                          </div>

                          {/* Grid 1: Summary & Experience Info */}
                          <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                            <div className="md:col-span-2 p-3 rounded-lg bg-slate-50 dark:bg-slate-800/50 border border-slate-100 dark:border-slate-800">
                              <h5 className="text-xs font-bold text-slate-700 dark:text-slate-300 mb-1 flex items-center gap-1.5">
                                <Briefcase className="w-3.5 h-3.5 text-olive-600 dark:text-olive-400" />
                                <span>Professional Summary</span>
                              </h5>
                              <p className="text-xs text-slate-600 dark:text-slate-300 leading-relaxed">
                                {c.summary || 'No summary extracted.'}
                              </p>
                            </div>

                            <div className="p-3 rounded-lg bg-slate-50 dark:bg-slate-800/50 border border-slate-100 dark:border-slate-800 space-y-2">
                              <h5 className="text-xs font-bold text-slate-700 dark:text-slate-300 mb-1 flex items-center gap-1.5">
                                <Sparkles className="w-3.5 h-3.5 text-amber-500" />
                                <span>AI Match & Fit</span>
                              </h5>
                              <div className="text-xs space-y-1">
                                <div><span className="text-slate-400">Match Score:</span> <span className="font-bold text-olive-700 dark:text-olive-400">{c.matchResult?.score ?? 'N/A'}%</span></div>
                                <div><span className="text-slate-400">Recommendation:</span> <span className="font-semibold text-slate-800 dark:text-slate-200">{c.matchResult?.recommendation || 'Evaluated'}</span></div>
                                <div><span className="text-slate-400">Experience Fit:</span> <span className="font-semibold text-slate-800 dark:text-slate-200">{c.matchResult?.experienceFit || 'Verified'}</span></div>
                              </div>
                            </div>
                          </div>

                          {/* Grid 2: Categorized Skills & Education & Employment */}
                          <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                            {/* Skills Breakdown */}
                            <div className="p-3 rounded-lg bg-slate-50 dark:bg-slate-800/50 border border-slate-100 dark:border-slate-800 space-y-2">
                              <h5 className="text-xs font-bold text-slate-700 dark:text-slate-300 flex items-center gap-1.5">
                                <Layers className="w-3.5 h-3.5 text-olive-600 dark:text-olive-400" />
                                <span>Categorized Skills</span>
                              </h5>
                              {c.normalizedSkills?.technical && c.normalizedSkills.technical.length > 0 && (
                                <div>
                                  <span className="text-[10px] font-bold text-slate-400 uppercase">Technical:</span>
                                  <div className="flex flex-wrap gap-1 mt-0.5">
                                    {c.normalizedSkills.technical.map((s, idx) => (
                                      <span key={idx} className="px-1.5 py-0.5 rounded bg-olive-100 dark:bg-olive-950 text-olive-800 dark:text-olive-300 text-[10px] font-semibold">{s}</span>
                                    ))}
                                  </div>
                                </div>
                              )}
                              {c.normalizedSkills?.functional && c.normalizedSkills.functional.length > 0 && (
                                <div>
                                  <span className="text-[10px] font-bold text-slate-400 uppercase">Functional:</span>
                                  <div className="flex flex-wrap gap-1 mt-0.5">
                                    {c.normalizedSkills.functional.map((s, idx) => (
                                      <span key={idx} className="px-1.5 py-0.5 rounded bg-blue-100 dark:bg-blue-950 text-blue-700 dark:text-blue-300 text-[10px] font-semibold">{s}</span>
                                    ))}
                                  </div>
                                </div>
                              )}
                              {c.normalizedSkills?.tools && c.normalizedSkills.tools.length > 0 && (
                                <div>
                                  <span className="text-[10px] font-bold text-slate-400 uppercase">Tools & Platforms:</span>
                                  <div className="flex flex-wrap gap-1 mt-0.5">
                                    {c.normalizedSkills.tools.map((s, idx) => (
                                      <span key={idx} className="px-1.5 py-0.5 rounded bg-slate-200 dark:bg-slate-750 text-slate-700 dark:text-slate-300 text-[10px] font-semibold">{s}</span>
                                    ))}
                                  </div>
                                </div>
                              )}
                            </div>

                            {/* Education Details */}
                            <div className="p-3 rounded-lg bg-slate-50 dark:bg-slate-800/50 border border-slate-100 dark:border-slate-800 space-y-1.5">
                              <h5 className="text-xs font-bold text-slate-700 dark:text-slate-300 flex items-center gap-1.5">
                                <GraduationCap className="w-3.5 h-3.5 text-olive-600 dark:text-olive-400" />
                                <span>Education Details</span>
                              </h5>
                              {(c.education || []).length > 0 ? (
                                c.education.map((edu, eIdx) => (
                                  <div key={eIdx} className="text-xs pb-1 border-b border-slate-200/60 dark:border-slate-700/60 last:border-0">
                                    <div className="font-semibold text-slate-800 dark:text-slate-200">{edu.degree} in {edu.specialization || 'Engineering'}</div>
                                    <div className="text-[11px] text-slate-500">{edu.institution} {edu.graduationYear ? `(${edu.graduationYear})` : ''}</div>
                                  </div>
                                ))
                              ) : (
                                <p className="text-xs text-slate-400 italic">No formal education listed.</p>
                              )}
                            </div>

                            {/* Employment & Previous Companies */}
                            <div className="p-3 rounded-lg bg-slate-50 dark:bg-slate-800/50 border border-slate-100 dark:border-slate-800 space-y-1.5">
                              <h5 className="text-xs font-bold text-slate-700 dark:text-slate-300 flex items-center gap-1.5">
                                <Briefcase className="w-3.5 h-3.5 text-olive-600 dark:text-olive-400" />
                                <span>Employment History</span>
                              </h5>
                              {(c.employmentHistory || []).length > 0 ? (
                                c.employmentHistory.slice(0, 2).map((emp, empIdx) => (
                                  <div key={empIdx} className="text-xs pb-1 border-b border-slate-200/60 dark:border-slate-700/60 last:border-0">
                                    <div className="font-semibold text-slate-800 dark:text-slate-200">{emp.designation}</div>
                                    <div className="text-[11px] text-slate-500">{emp.company} [{emp.duration}]</div>
                                  </div>
                                ))
                              ) : (
                                <div className="text-xs text-slate-600 dark:text-slate-300">
                                  <div>Current: <span className="font-semibold">{c.currentCompany || 'N/A'}</span> ({c.currentDesignation || 'N/A'})</div>
                                  {c.previousCompanies && c.previousCompanies.length > 0 && (
                                    <div className="mt-1 text-[11px] text-slate-500">Previous: {c.previousCompanies.join(', ')}</div>
                                  )}
                                </div>
                              )}
                            </div>
                          </div>

                        </div>
                      </td>
                    </tr>
                  )}
                </React.Fragment>
              );
            })}

            {filteredCandidates.length === 0 && (
              <tr>
                <td colSpan={8} className="p-12 text-center">
                  <div className="max-w-sm mx-auto space-y-3">
                    <div className="w-12 h-12 rounded-full bg-slate-100 dark:bg-slate-800 text-slate-400 flex items-center justify-center mx-auto">
                      {candidates.length === 0 ? <FileText className="w-6 h-6 text-olive-600" /> : <Search className="w-6 h-6" />}
                    </div>
                    <h4 className="text-sm font-bold text-slate-800 dark:text-slate-200">
                      {candidates.length === 0 ? 'No Resumes Uploaded Yet' : 'No candidates found'}
                    </h4>
                    <p className="text-xs text-slate-500 dark:text-slate-400">
                      {candidates.length === 0
                        ? 'Upload candidate PDF resumes to automatically extract details, score against job requirements, and manage the hiring pipeline.'
                        : 'Try adjusting your search query or clearing active skill/experience filters.'}
                    </p>
                    {candidates.length === 0 ? (
                      onOpenUpload && (
                        <button
                          type="button"
                          onClick={onOpenUpload}
                          className="mt-2 inline-flex items-center px-4 py-2 text-xs font-semibold rounded-lg bg-olive-600 hover:bg-olive-700 text-white shadow-xs transition-colors cursor-pointer"
                        >
                          <UploadCloud className="w-4 h-4 mr-1.5" />
                          Upload PDF Resumes
                        </button>
                      )
                    ) : (
                      <button
                        type="button"
                        onClick={() => {
                          setSearchTerm('');
                          setSelectedSkillFilter('All');
                          setMinExpFilter('All');
                          setMinScoreFilter(0);
                          setOnlyDuplicates(false);
                          onFilterStatus('All');
                        }}
                        className="mt-2 px-3 py-1.5 text-xs font-semibold text-olive-700 dark:text-olive-400 hover:underline cursor-pointer"
                      >
                        Reset All Filters
                      </button>
                    )}
                  </div>
                </td>
              </tr>
            )}
          </tbody>

        </table>
      </div>

      {/* Pagination Footer */}
      <div className="p-4 bg-slate-50 dark:bg-slate-800/50 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between text-xs text-slate-500 dark:text-slate-400">
        <span>
          Showing <span className="font-semibold text-slate-700 dark:text-slate-200">{filteredCandidates.length > 0 ? (currentPage - 1) * pageSize + 1 : 0}</span> to <span className="font-semibold text-slate-700 dark:text-slate-200">{Math.min(currentPage * pageSize, filteredCandidates.length)}</span> of <span className="font-semibold text-slate-700 dark:text-slate-200">{filteredCandidates.length}</span> candidates
        </span>

        <div className="flex items-center gap-2">
          <button
            type="button"
            disabled={currentPage === 1}
            onClick={() => setCurrentPage(prev => Math.max(1, prev - 1))}
            className="px-3 py-1 border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 rounded text-xs font-semibold text-slate-600 dark:text-slate-300 disabled:opacity-50 hover:bg-slate-50 transition-colors"
          >
            Previous
          </button>

          <button
            type="button"
            disabled={currentPage >= totalPages}
            onClick={() => setCurrentPage(prev => Math.min(totalPages, prev + 1))}
            className="px-3 py-1 border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 rounded text-xs font-semibold text-slate-600 dark:text-slate-300 disabled:opacity-50 hover:bg-slate-50 transition-colors"
          >
            Next
          </button>
        </div>
      </div>

      {/* Single Candidate Deletion Confirmation Modal */}
      {deletingCandidate && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="relative w-full max-w-md rounded-2xl bg-white dark:bg-slate-900 p-6 shadow-2xl border border-slate-200 dark:border-slate-800 space-y-4">
            <div className="flex items-center space-x-3 text-rose-600 dark:text-rose-400">
              <div className="w-10 h-10 rounded-full bg-rose-100 dark:bg-rose-950/60 flex items-center justify-center">
                <Trash2 className="w-5 h-5" />
              </div>
              <div>
                <h3 className="text-base font-bold text-slate-900 dark:text-white">
                  Delete Candidate Profile
                </h3>
                <p className="text-xs text-slate-500 dark:text-slate-400">
                  This action cannot be undone.
                </p>
              </div>
            </div>

            <div className="p-3 bg-slate-50 dark:bg-slate-800/60 rounded-xl border border-slate-200 dark:border-slate-700 text-xs space-y-1">
              <p className="font-bold text-slate-900 dark:text-white">
                {deletingCandidate.name}
              </p>
              <p className="text-slate-500 dark:text-slate-400">
                {deletingCandidate.currentDesignation || 'Engineer'} • {deletingCandidate.email}
              </p>
            </div>

            <div className="flex items-center justify-end space-x-2 pt-2">
              <button
                type="button"
                onClick={() => setDeletingCandidate(null)}
                className="px-4 py-2 text-xs font-semibold rounded-lg bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-700 transition-colors"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={() => {
                  onDeleteCandidate(deletingCandidate.id);
                  setDeletingCandidate(null);
                }}
                className="px-4 py-2 text-xs font-semibold rounded-lg bg-rose-600 hover:bg-rose-700 text-white shadow-xs transition-colors"
              >
                Yes, Delete Candidate
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Bulk Deletion Confirmation Modal */}
      {showBulkDeleteConfirm && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="relative w-full max-w-md rounded-2xl bg-white dark:bg-slate-900 p-6 shadow-2xl border border-slate-200 dark:border-slate-800 space-y-4">
            <div className="flex items-center space-x-3 text-rose-600 dark:text-rose-400">
              <div className="w-10 h-10 rounded-full bg-rose-100 dark:bg-rose-950/60 flex items-center justify-center">
                <Trash2 className="w-5 h-5" />
              </div>
              <div>
                <h3 className="text-base font-bold text-slate-900 dark:text-white">
                  Delete {selectedIds.length} Selected Candidates
                </h3>
                <p className="text-xs text-slate-500 dark:text-slate-400">
                  Permanently remove the selected candidate records from the pool.
                </p>
              </div>
            </div>

            <div className="flex items-center justify-end space-x-2 pt-2">
              <button
                type="button"
                onClick={() => setShowBulkDeleteConfirm(false)}
                className="px-4 py-2 text-xs font-semibold rounded-lg bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-700 transition-colors"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={() => {
                  onBulkDelete(selectedIds);
                  setSelectedIds([]);
                  setShowBulkDeleteConfirm(false);
                }}
                className="px-4 py-2 text-xs font-semibold rounded-lg bg-rose-600 hover:bg-rose-700 text-white shadow-xs transition-colors"
              >
                Delete All {selectedIds.length} Candidates
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
};
