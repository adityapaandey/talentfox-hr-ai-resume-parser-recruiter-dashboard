import React, { useState } from 'react';
import { 
  X, 
  Mail, 
  Phone, 
  MapPin, 
  Linkedin, 
  Github, 
  Briefcase, 
  GraduationCap, 
  Award, 
  Code, 
  FolderGit2, 
  Sparkles, 
  CheckCircle2, 
  XCircle, 
  Calendar, 
  Download, 
  Clock, 
  FileText, 
  Edit3, 
  Save,
  Check,
  Share2,
  ExternalLink,
  Trash2
} from 'lucide-react';
import { Candidate, CandidateStatus, JobDescription } from '../types';
import { downloadSampleResume } from '../utils/pdfHelpers';

interface CandidateProfileModalProps {
  candidate: Candidate | null;
  isOpen: boolean;
  onClose: () => void;
  activeJd: JobDescription | null;
  userRole?: 'Admin' | 'Recruiter';
  onUpdateStatus: (candidateId: string, status: CandidateStatus) => void;
  onScheduleInterview: (candidate: Candidate) => void;
  onSaveNotes: (candidateId: string, notes: string) => void;
  onDeleteCandidate?: (candidateId: string) => void;
}

export const CandidateProfileModal: React.FC<CandidateProfileModalProps> = ({
  candidate,
  isOpen,
  onClose,
  activeJd,
  userRole = 'Admin',
  onUpdateStatus,
  onScheduleInterview,
  onSaveNotes,
  onDeleteCandidate
}) => {
  if (!isOpen || !candidate) return null;

  const [activeTab, setActiveTab] = useState<'overview' | 'skills_match' | 'experience' | 'education_certs' | 'notes'>('overview');
  const [notes, setNotes] = useState(candidate.recruiterNotes || '');
  const [notesSaved, setNotesSaved] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);

  const handleSaveNotes = () => {
    onSaveNotes(candidate.id, notes);
    setNotesSaved(true);
    setTimeout(() => setNotesSaved(false), 2000);
  };

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-3 sm:p-4">
      <div className="relative w-full max-w-4xl rounded-2xl bg-white dark:bg-slate-900 shadow-2xl border border-slate-200 dark:border-slate-800 overflow-hidden flex flex-col max-h-[90vh]">
        
        {/* Header with Candidate Banner */}
        <div className="px-6 py-5 border-b border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-800/40">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            
            {/* Candidate Identity */}
            <div className="flex items-start space-x-3.5">
              <div className="w-13 h-13 rounded-2xl bg-gradient-to-tr from-olive-700 to-olive-500 text-white font-bold flex items-center justify-center text-lg shadow-md shrink-0">
                {candidate.name.split(' ').map(n => n[0]).join('').substring(0, 2).toUpperCase()}
              </div>

              <div>
                <div className="flex items-center space-x-2">
                  <h2 className="text-xl font-bold text-slate-900 dark:text-white">
                    {candidate.name}
                  </h2>
                  
                  {candidate.isDuplicate && (
                    <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-amber-100 text-amber-800 dark:bg-amber-950 dark:text-amber-300">
                      Duplicate Record
                    </span>
                  )}
                </div>

                <p className="text-xs font-semibold text-olive-700 dark:text-olive-400 mt-0.5">
                  {candidate.currentDesignation || 'Software Engineer'} • <span className="text-slate-600 dark:text-slate-300">{candidate.currentCompany || 'Independent'}</span>
                </p>

                {/* Contact Row */}
                <div className="flex flex-wrap items-center gap-3 text-xs text-slate-500 dark:text-slate-400 mt-2">
                  <span className="flex items-center">
                    <Mail className="w-3.5 h-3.5 mr-1 text-slate-400" />
                    {candidate.email}
                  </span>
                  <span className="flex items-center">
                    <Phone className="w-3.5 h-3.5 mr-1 text-slate-400" />
                    {candidate.phone}
                  </span>
                  <span className="flex items-center">
                    <MapPin className="w-3.5 h-3.5 mr-1 text-slate-400" />
                    {candidate.location}
                  </span>
                </div>
              </div>
            </div>

            {/* Quick Actions & Close */}
            <div className="flex items-center space-x-2 shrink-0 self-end sm:self-auto">
              <button
                type="button"
                onClick={() => downloadSampleResume(candidate)}
                className="flex items-center space-x-1 px-3 py-1.5 text-xs font-semibold rounded-lg bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-200 hover:bg-slate-200 transition-colors cursor-pointer"
                title="Download original resume PDF"
              >
                <Download className="w-3.5 h-3.5" />
                <span>Resume PDF</span>
              </button>

              <button
                type="button"
                onClick={() => onScheduleInterview(candidate)}
                className="flex items-center space-x-1 px-3 py-1.5 text-xs font-semibold rounded-lg bg-olive-700 hover:bg-olive-800 text-white shadow-xs transition-colors cursor-pointer"
              >
                <Calendar className="w-3.5 h-3.5" />
                <span>Schedule</span>
              </button>

              {/* Deletion: strictly forbidden for Recruiters */}
              {userRole === 'Admin' && onDeleteCandidate && (
                showDeleteConfirm ? (
                  <div className="flex items-center space-x-1 bg-rose-50 dark:bg-rose-950/60 p-1 rounded-lg border border-rose-200 dark:border-rose-800 animate-fadeIn">
                    <span className="text-[11px] font-semibold text-rose-700 dark:text-rose-300 px-1">
                      Confirm Delete?
                    </span>
                    <button
                      type="button"
                      onClick={() => {
                        onDeleteCandidate(candidate.id);
                        onClose();
                      }}
                      className="px-2 py-1 text-[11px] font-bold rounded bg-rose-600 hover:bg-rose-700 text-white shadow-2xs transition-colors cursor-pointer"
                    >
                      Delete
                    </button>
                    <button
                      type="button"
                      onClick={() => setShowDeleteConfirm(false)}
                      className="px-1.5 py-1 text-[11px] text-slate-500 hover:text-slate-700 dark:hover:text-slate-300 cursor-pointer"
                    >
                      Cancel
                    </button>
                  </div>
                ) : (
                  <button
                    type="button"
                    onClick={() => setShowDeleteConfirm(true)}
                    className="p-1.5 rounded-lg text-slate-400 hover:text-rose-600 dark:hover:text-rose-400 hover:bg-rose-50 dark:hover:bg-rose-950/30 transition-colors cursor-pointer"
                    title="Delete Candidate"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                )
              )}

              <button
                onClick={onClose}
                className="p-1.5 rounded-lg text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

          </div>

          {/* Social Links & Status Strip */}
          <div className="flex flex-wrap items-center justify-between gap-3 mt-4 pt-3 border-t border-slate-200/80 dark:border-slate-700/60 text-xs">
            <div className="flex items-center space-x-3">
              {candidate.linkedin && (
                <a
                  href={candidate.linkedin}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center space-x-1 text-blue-600 dark:text-blue-400 hover:underline font-medium"
                >
                  <Linkedin className="w-3.5 h-3.5" />
                  <span>LinkedIn Profile</span>
                  <ExternalLink className="w-2.5 h-2.5 ml-0.5" />
                </a>
              )}
              {candidate.github && (
                <a
                  href={candidate.github}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center space-x-1 text-slate-700 dark:text-slate-300 hover:underline font-medium"
                >
                  <Github className="w-3.5 h-3.5" />
                  <span>GitHub Profile</span>
                  <ExternalLink className="w-2.5 h-2.5 ml-0.5" />
                </a>
              )}
            </div>

            <div className="flex items-center space-x-2">
              <span className="text-slate-400 font-medium text-[11px]">Hiring Status:</span>
              <select
                value={candidate.status}
                onChange={e => onUpdateStatus(candidate.id, e.target.value as CandidateStatus)}
                className="text-xs font-semibold px-2.5 py-1 rounded-md border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-800 text-slate-900 dark:text-white cursor-pointer"
              >
                <option value="New">New</option>
                <option value="Screened">Screened</option>
                <option value="Interview Scheduled">Interview Scheduled</option>
                <option value="Shortlisted">Shortlisted</option>
                <option value="Offered">Offered</option>
                <option value="Hired">Hired</option>
                <option value="Rejected">Rejected</option>
              </select>
            </div>
          </div>
        </div>

        {/* Tab Navigation */}
        <div className="px-6 border-b border-slate-200 dark:border-slate-800 flex space-x-4 overflow-x-auto text-xs font-semibold select-none bg-white dark:bg-slate-900">
          <button
            onClick={() => setActiveTab('overview')}
            className={`py-3 border-b-2 transition-colors flex items-center space-x-1.5 whitespace-nowrap cursor-pointer ${
              activeTab === 'overview'
                ? 'border-olive-600 text-olive-700 dark:text-olive-400'
                : 'border-transparent text-slate-500 hover:text-slate-800 dark:hover:text-slate-300'
            }`}
          >
            <FileText className="w-3.5 h-3.5" />
            <span>Overview & Summary</span>
          </button>

          <button
            onClick={() => setActiveTab('skills_match')}
            className={`py-3 border-b-2 transition-colors flex items-center space-x-1.5 whitespace-nowrap cursor-pointer ${
              activeTab === 'skills_match'
                ? 'border-olive-600 text-olive-700 dark:text-olive-400'
                : 'border-transparent text-slate-500 hover:text-slate-800 dark:hover:text-slate-300'
            }`}
          >
            <Sparkles className="w-3.5 h-3.5" />
            <span>JD Match & Skills</span>
            {candidate.matchResult && (
              <span className="px-1.5 py-0.2 rounded-full text-[10px] bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300 font-bold">
                {candidate.matchResult.score}%
              </span>
            )}
          </button>

          <button
            onClick={() => setActiveTab('experience')}
            className={`py-3 border-b-2 transition-colors flex items-center space-x-1.5 whitespace-nowrap cursor-pointer ${
              activeTab === 'experience'
                ? 'border-olive-600 text-olive-700 dark:text-olive-400'
                : 'border-transparent text-slate-500 hover:text-slate-800 dark:hover:text-slate-300'
            }`}
          >
            <Briefcase className="w-3.5 h-3.5" />
            <span>Work History ({candidate.totalExperienceYears} yrs)</span>
          </button>

          <button
            onClick={() => setActiveTab('education_certs')}
            className={`py-3 border-b-2 transition-colors flex items-center space-x-1.5 whitespace-nowrap cursor-pointer ${
              activeTab === 'education_certs'
                ? 'border-olive-600 text-olive-700 dark:text-olive-400'
                : 'border-transparent text-slate-500 hover:text-slate-800 dark:hover:text-slate-300'
            }`}
          >
            <GraduationCap className="w-3.5 h-3.5" />
            <span>Education & Certs</span>
          </button>

          <button
            onClick={() => setActiveTab('notes')}
            className={`py-3 border-b-2 transition-colors flex items-center space-x-1.5 whitespace-nowrap cursor-pointer ${
              activeTab === 'notes'
                ? 'border-olive-600 text-olive-700 dark:text-olive-400'
                : 'border-transparent text-slate-500 hover:text-slate-800 dark:hover:text-slate-300'
            }`}
          >
            <Edit3 className="w-3.5 h-3.5" />
            <span>Recruiter Notes</span>
          </button>
        </div>

        {/* Tab Body Content */}
        <div className="p-6 space-y-6 overflow-y-auto flex-1 text-xs">
          
          {/* TAB 1: OVERVIEW */}
          {activeTab === 'overview' && (
            <div className="space-y-5">
              
              {/* Professional Summary */}
              <div className="p-4 rounded-xl border bg-slate-50 dark:bg-slate-800/60 border-slate-200 dark:border-slate-700">
                <h4 className="font-bold text-slate-900 dark:text-white uppercase tracking-wider text-[11px] mb-2 flex items-center">
                  <FileText className="w-3.5 h-3.5 mr-1.5 text-olive-600" />
                  Professional Summary
                </h4>
                <p className="text-slate-700 dark:text-slate-300 leading-relaxed">
                  {candidate.summary || 'No professional summary found in resume.'}
                </p>
              </div>

              {/* AI Recommended Roles */}
              {candidate.suggestedRoles && candidate.suggestedRoles.length > 0 && (
                <div>
                  <h4 className="font-bold text-slate-900 dark:text-white uppercase tracking-wider text-[11px] mb-2 flex items-center">
                    <Sparkles className="w-3.5 h-3.5 mr-1.5 text-amber-500" />
                    AI Recommended Job Roles
                  </h4>
                  <div className="flex flex-wrap gap-2">
                    {candidate.suggestedRoles.map((role, rIdx) => (
                      <span
                        key={`${role}-${rIdx}`}
                        className="px-3 py-1 rounded-lg font-semibold bg-olive-50 dark:bg-olive-950/60 text-olive-800 dark:text-olive-300 border border-olive-200 dark:border-olive-800"
                      >
                        {role}
                      </span>
                    ))}
                  </div>
                </div>
              )}

              {/* Original Resume Document Card */}
              <div className="p-4 rounded-xl border border-olive-200 dark:border-olive-850 bg-gradient-to-r from-olive-50/70 via-white to-slate-50/70 dark:from-olive-950/40 dark:via-slate-850 dark:to-slate-900/40 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
                <div className="flex items-center space-x-3">
                  <div className="p-2.5 rounded-lg bg-olive-700 text-white shadow-xs">
                    <FileText className="w-5 h-5" />
                  </div>
                  <div>
                    <h5 className="font-bold text-slate-900 dark:text-white text-xs">
                      {candidate.resumeFileName || `${candidate.name}_Resume.pdf`}
                    </h5>
                    <p className="text-[11px] text-slate-500 dark:text-slate-400">
                      Original Uploaded Resume • {candidate.resumeFileSize ? `${(candidate.resumeFileSize / 1024).toFixed(1)} KB • ` : ''}Uploaded {candidate.uploadDate}
                    </p>
                  </div>
                </div>

                <button
                  type="button"
                  onClick={() => downloadSampleResume(candidate)}
                  className="flex items-center space-x-1.5 px-4 py-2 text-xs font-bold rounded-lg bg-olive-700 hover:bg-olive-800 text-white shadow-xs transition-colors shrink-0 cursor-pointer"
                >
                  <Download className="w-4 h-4" />
                  <span>Download Original Resume</span>
                </button>
              </div>

              {/* Key Quick Overview Grid */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div className="p-3 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800/80">
                  <span className="text-[10px] uppercase font-bold text-slate-400">Total Experience</span>
                  <p className="text-base font-bold text-slate-900 dark:text-white mt-0.5">
                    {candidate.totalExperienceYears} Years
                  </p>
                </div>

                <div className="p-3 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800/80">
                  <span className="text-[10px] uppercase font-bold text-slate-400">Current Employer</span>
                  <p className="text-base font-bold text-slate-900 dark:text-white mt-0.5 truncate">
                    {candidate.currentCompany || 'N/A'}
                  </p>
                </div>

                <div className="p-3 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800/80">
                  <span className="text-[10px] uppercase font-bold text-slate-400">Upload Date</span>
                  <p className="text-base font-bold text-slate-900 dark:text-white mt-0.5">
                    {candidate.uploadDate}
                  </p>
                </div>
              </div>

              {/* Projects Spotlight */}
              {candidate.projects && candidate.projects.length > 0 && (
                <div>
                  <h4 className="font-bold text-slate-900 dark:text-white uppercase tracking-wider text-[11px] mb-2 flex items-center">
                    <FolderGit2 className="w-3.5 h-3.5 mr-1.5 text-olive-600" />
                    Key Projects & Technical Deliverables
                  </h4>
                  <div className="space-y-2">
                    {candidate.projects.map((proj, idx) => (
                      <div
                        key={idx}
                        className="p-3 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800/80 space-y-1"
                      >
                        <h5 className="font-bold text-slate-900 dark:text-white">
                          {proj.name}
                        </h5>
                        <p className="text-slate-600 dark:text-slate-300">
                          {proj.description}
                        </p>
                        {proj.techStack && proj.techStack.length > 0 && (
                          <div className="flex flex-wrap gap-1 pt-1">
                            {proj.techStack.map((tech, tIdx) => (
                              <span key={`proj-${idx}-tech-${tech}-${tIdx}`} className="px-1.5 py-0.2 rounded text-[10px] bg-slate-100 dark:bg-slate-700 text-slate-700 dark:text-slate-300">
                                {tech}
                              </span>
                            ))}
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                </div>
              )}

            </div>
          )}

          {/* TAB 2: SKILLS & JD MATCH */}
          {activeTab === 'skills_match' && (
            <div className="space-y-5">
              
              {/* JD Fit Evaluation Card */}
              {candidate.matchResult ? (
                <div className="p-4 rounded-xl border bg-gradient-to-r from-olive-50/50 to-slate-50/50 dark:from-olive-950/30 dark:to-slate-900/30 border-olive-200 dark:border-olive-800 space-y-3">
                  <div className="flex items-center justify-between">
                    <div>
                      <span className="text-[10px] font-bold uppercase tracking-wider text-olive-700 dark:text-olive-400">
                        Target Position: {activeJd?.title || 'General Engineering Role'}
                      </span>
                      <h4 className="text-base font-bold text-slate-900 dark:text-white">
                        AI Fit Verdict: {candidate.matchResult.recommendation}
                      </h4>
                    </div>
                    
                    <div className="text-right">
                      <div className="text-2xl font-black text-olive-700 dark:text-olive-400">
                        {candidate.matchResult.score}%
                      </div>
                      <span className="text-[10px] font-semibold text-slate-500">
                        Experience: {candidate.matchResult.experienceFit}
                      </span>
                    </div>
                  </div>

                  <p className="text-slate-700 dark:text-slate-300 leading-relaxed border-t border-olive-200/60 dark:border-olive-800/60 pt-2">
                    {candidate.matchResult.reasoning}
                  </p>

                  {/* Matching vs Missing Skills */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-2">
                    
                    {/* Matching Skills */}
                    <div className="p-3 rounded-lg bg-emerald-50/70 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-800/60">
                      <p className="font-bold text-emerald-800 dark:text-emerald-300 mb-2 flex items-center text-[11px]">
                        <CheckCircle2 className="w-3.5 h-3.5 mr-1" />
                        Matching Skills ({candidate.matchResult.matchingSkills?.length || 0})
                      </p>
                      <div className="flex flex-wrap gap-1.5">
                        {(candidate.matchResult.matchingSkills || []).map((skill, sIdx) => (
                          <span key={`match-${skill}-${sIdx}`} className="px-2 py-0.5 rounded text-[10px] font-bold bg-emerald-100 text-emerald-800 dark:bg-emerald-900 dark:text-emerald-200">
                            ✓ {skill}
                          </span>
                        ))}
                      </div>
                    </div>

                    {/* Missing Skills */}
                    <div className="p-3 rounded-lg bg-rose-50/70 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-800/60">
                      <p className="font-bold text-rose-800 dark:text-rose-300 mb-2 flex items-center text-[11px]">
                        <XCircle className="w-3.5 h-3.5 mr-1" />
                        Missing Required Skills ({candidate.matchResult.missingSkills?.length || 0})
                      </p>
                      <div className="flex flex-wrap gap-1.5">
                        {(candidate.matchResult.missingSkills || []).map((skill, sIdx) => (
                          <span key={`miss-${skill}-${sIdx}`} className="px-2 py-0.5 rounded text-[10px] font-bold bg-rose-100 text-rose-800 dark:bg-rose-900 dark:text-rose-200">
                            ✗ {skill}
                          </span>
                        ))}
                        {(candidate.matchResult.missingSkills || []).length === 0 && (
                          <span className="text-[11px] text-emerald-600 font-medium">None! Meets all core JD skill requirements.</span>
                        )}
                      </div>
                    </div>

                  </div>
                </div>
              ) : (
                <div className="p-4 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800/60 text-center">
                  <p className="text-slate-500">This candidate has not been matched against a Job Description yet.</p>
                </div>
              )}

              {/* Normalized Skill Taxonomy */}
              <div className="space-y-4 pt-2">
                <h4 className="font-bold text-slate-900 dark:text-white uppercase tracking-wider text-[11px] flex items-center">
                  <Code className="w-3.5 h-3.5 mr-1.5 text-olive-600" />
                  Extracted & Categorized Skills
                </h4>

                {/* Technical Skills */}
                <div>
                  <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400">Technical & Programming Skills</span>
                  <div className="flex flex-wrap gap-1.5 mt-1.5">
                    {(candidate.normalizedSkills?.technical || candidate.skills || []).map((skill, sIdx) => (
                      <span
                        key={`tech-${skill}-${sIdx}`}
                        className="px-2.5 py-1 rounded-md font-semibold bg-olive-50 dark:bg-olive-950/60 text-olive-800 dark:text-olive-300 border border-olive-200/80 dark:border-olive-800/80"
                      >
                        {skill}
                      </span>
                    ))}
                  </div>
                </div>

                {/* Cloud & Tools */}
                {candidate.normalizedSkills?.tools && candidate.normalizedSkills.tools.length > 0 && (
                  <div>
                    <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400">Cloud, DevOps & Tools</span>
                    <div className="flex flex-wrap gap-1.5 mt-1.5">
                      {candidate.normalizedSkills.tools.map((tool, tIdx) => (
                        <span
                          key={`tool-${tool}-${tIdx}`}
                          className="px-2.5 py-1 rounded-md font-semibold bg-blue-50 dark:bg-blue-950/60 text-blue-700 dark:text-blue-300 border border-blue-200/80 dark:border-blue-800/80"
                        >
                          {tool}
                        </span>
                      ))}
                    </div>
                  </div>
                )}

                {/* Functional Skills */}
                {candidate.normalizedSkills?.functional && candidate.normalizedSkills.functional.length > 0 && (
                  <div>
                    <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400">Functional & Domain Competencies</span>
                    <div className="flex flex-wrap gap-1.5 mt-1.5">
                      {candidate.normalizedSkills.functional.map((f, fIdx) => (
                        <span
                          key={`func-${f}-${fIdx}`}
                          className="px-2.5 py-1 rounded-md font-semibold bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300"
                        >
                          {f}
                        </span>
                      ))}
                    </div>
                  </div>
                )}

              </div>

            </div>
          )}

          {/* TAB 3: WORK HISTORY */}
          {activeTab === 'experience' && (
            <div className="space-y-4">
              <h4 className="font-bold text-slate-900 dark:text-white uppercase tracking-wider text-[11px] flex items-center">
                <Briefcase className="w-3.5 h-3.5 mr-1.5 text-olive-600" />
                Employment History & Timeline
              </h4>

              <div className="relative pl-6 space-y-6 before:absolute before:left-2.5 before:top-2 before:bottom-2 before:w-0.5 before:bg-olive-200 dark:before:bg-olive-900">
                {(candidate.employmentHistory || []).map((exp, idx) => (
                  <div key={idx} className="relative group">
                    {/* Timeline Node Icon */}
                    <div className="absolute -left-6 top-0.5 w-5 h-5 rounded-full bg-olive-700 text-white flex items-center justify-center ring-4 ring-white dark:ring-slate-900">
                      <Briefcase className="w-2.5 h-2.5" />
                    </div>

                    <div className="p-4 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800/90 shadow-2xs space-y-1">
                      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-1">
                        <h5 className="text-sm font-bold text-slate-900 dark:text-white">
                          {exp.designation}
                        </h5>
                        <span className="text-[11px] font-semibold text-olive-700 dark:text-olive-400 bg-olive-50 dark:bg-olive-950/60 px-2 py-0.5 rounded">
                          {exp.duration}
                        </span>
                      </div>

                      <p className="font-medium text-slate-700 dark:text-slate-300">
                        {exp.company} {exp.location ? `• ${exp.location}` : ''}
                      </p>

                      {exp.description && (
                        <p className="text-slate-600 dark:text-slate-400 pt-1 leading-relaxed">
                          {exp.description}
                        </p>
                      )}
                    </div>
                  </div>
                ))}

                {(!candidate.employmentHistory || candidate.employmentHistory.length === 0) && (
                  <p className="text-slate-400 italic">No structured employment history found.</p>
                )}
              </div>
            </div>
          )}

          {/* TAB 4: EDUCATION & CERTS */}
          {activeTab === 'education_certs' && (
            <div className="space-y-6">
              
              {/* Education Section */}
              <div className="space-y-3">
                <h4 className="font-bold text-slate-900 dark:text-white uppercase tracking-wider text-[11px] flex items-center">
                  <GraduationCap className="w-3.5 h-3.5 mr-1.5 text-olive-600" />
                  Academic Qualifications
                </h4>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  {(candidate.education || []).map((edu, idx) => (
                    <div
                      key={idx}
                      className="p-4 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800/90 space-y-1"
                    >
                      <h5 className="font-bold text-slate-900 dark:text-white">
                        {edu.degree}
                      </h5>
                      <p className="font-medium text-olive-700 dark:text-olive-400">
                        {edu.specialization}
                      </p>
                      <p className="text-slate-600 dark:text-slate-300">
                        {edu.institution}
                      </p>
                      {edu.graduationYear && (
                        <p className="text-[11px] text-slate-400">
                          Graduated: {edu.graduationYear}
                        </p>
                      )}
                    </div>
                  ))}
                </div>
              </div>

              {/* Certifications Section */}
              <div className="space-y-3">
                <h4 className="font-bold text-slate-900 dark:text-white uppercase tracking-wider text-[11px] flex items-center">
                  <Award className="w-3.5 h-3.5 mr-1.5 text-amber-500" />
                  Professional Certifications
                </h4>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  {(candidate.certifications || []).map((cert, idx) => (
                    <div
                      key={idx}
                      className="p-3.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800/90 flex items-start space-x-3"
                    >
                      <div className="w-8 h-8 rounded-lg bg-amber-50 dark:bg-amber-950/50 text-amber-600 dark:text-amber-400 flex items-center justify-center shrink-0">
                        <Award className="w-4 h-4" />
                      </div>
                      <div>
                        <h5 className="font-bold text-slate-900 dark:text-white">
                          {cert.name}
                        </h5>
                        <p className="text-slate-500 dark:text-slate-400">
                          Issued by {cert.issuingOrg} {cert.year ? `(${cert.year})` : ''}
                        </p>
                      </div>
                    </div>
                  ))}
                  {(!candidate.certifications || candidate.certifications.length === 0) && (
                    <p className="text-slate-400 italic">No certifications listed.</p>
                  )}
                </div>
              </div>

            </div>
          )}

          {/* TAB 5: RECRUITER NOTES */}
          {activeTab === 'notes' && (
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <h4 className="font-bold text-slate-900 dark:text-white uppercase tracking-wider text-[11px]">
                    Private Recruiter Notes & Evaluation Log
                  </h4>
                  <p className="text-[11px] text-slate-400">
                    Internal feedback visible only to the HR recruiting team.
                  </p>
                </div>

                <button
                  type="button"
                  onClick={handleSaveNotes}
                  className="flex items-center space-x-1 px-3 py-1.5 text-xs font-semibold rounded-lg bg-olive-700 hover:bg-olive-800 text-white shadow-xs cursor-pointer"
                >
                  {notesSaved ? (
                    <>
                      <Check className="w-3.5 h-3.5 text-emerald-300" />
                      <span>Saved!</span>
                    </>
                  ) : (
                    <>
                      <Save className="w-3.5 h-3.5" />
                      <span>Save Notes</span>
                    </>
                  )}
                </button>
              </div>

              <textarea
                rows={6}
                value={notes}
                onChange={e => setNotes(e.target.value)}
                placeholder="Type interview impressions, salary expectations, notice period, team feedback..."
                className="w-full p-3.5 text-xs rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white focus:ring-2 focus:ring-olive-500/20"
              />

              {candidate.interviewSchedule && (
                <div className="p-4 rounded-xl border border-blue-200 dark:border-blue-800 bg-blue-50/60 dark:bg-blue-950/30 space-y-1">
                  <h5 className="font-bold text-blue-900 dark:text-blue-200 flex items-center">
                    <Calendar className="w-3.5 h-3.5 mr-1" />
                    Scheduled Interview
                  </h5>
                  <p className="text-slate-700 dark:text-slate-300">
                    Round: <span className="font-semibold">{candidate.interviewSchedule.type}</span> on <span className="font-semibold">{candidate.interviewSchedule.date} at {candidate.interviewSchedule.time}</span>
                  </p>
                  <p className="text-slate-600 dark:text-slate-400">
                    Interviewer: {candidate.interviewSchedule.interviewer}
                  </p>
                  {candidate.interviewSchedule.meetLink && (
                    <a
                      href={candidate.interviewSchedule.meetLink}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-olive-700 dark:text-olive-400 font-semibold hover:underline inline-block pt-1"
                    >
                      Open Video Meeting Room →
                    </a>
                  )}
                </div>
              )}
            </div>
          )}

        </div>

        {/* Footer */}
        <div className="flex items-center justify-between px-6 py-4 border-t border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-800/50">
          <span className="text-slate-400 text-[11px]">
            Candidate ID: {candidate.id} • Parsed from {candidate.resumeFileName}
          </span>

          <button
            type="button"
            onClick={onClose}
            className="px-5 py-2 text-xs font-semibold rounded-lg bg-slate-200 dark:bg-slate-700 text-slate-800 dark:text-slate-200 hover:bg-slate-300 transition-colors cursor-pointer"
          >
            Close
          </button>
        </div>

      </div>
    </div>
  );
};
