import React, { useState } from 'react';
import { 
  X, 
  Briefcase, 
  Plus, 
  Sparkles, 
  Check, 
  Layers, 
  Building2, 
  CheckCircle2,
  ListPlus,
  Loader2,
  Trash2
} from 'lucide-react';
import { JobDescription } from '../types';
import { PRESET_JOB_DESCRIPTIONS } from '../data/sampleCandidates';

interface JobDescriptionModalProps {
  isOpen: boolean;
  onClose: () => void;
  activeJd: JobDescription | null;
  onSelectJd: (jd: JobDescription) => void;
  onRunMatchAll: (jd: JobDescription) => Promise<void>;
  isMatchingAll: boolean;
}

export const JobDescriptionModal: React.FC<JobDescriptionModalProps> = ({
  isOpen,
  onClose,
  activeJd,
  onSelectJd,
  onRunMatchAll,
  isMatchingAll
}) => {
  const [jds, setJds] = useState<JobDescription[]>(PRESET_JOB_DESCRIPTIONS);
  const [isCreatingCustom, setIsCreatingCustom] = useState(false);

  // Form states for new JD
  const [customTitle, setCustomTitle] = useState('');
  const [customDept, setCustomDept] = useState('Engineering');
  const [customMinExp, setCustomMinExp] = useState(5);
  const [customReqSkills, setCustomReqSkills] = useState('');
  const [customPrefSkills, setCustomPrefSkills] = useState('');
  const [customDescription, setCustomDescription] = useState('');

  if (!isOpen) return null;

  const handleCreateJd = (e: React.FormEvent) => {
    e.preventDefault();
    if (!customTitle.trim()) return;

    const newJd: JobDescription = {
      id: `custom-jd-${Date.now()}`,
      title: customTitle.trim(),
      department: customDept.trim() || 'Engineering',
      minExperienceYears: Number(customMinExp) || 3,
      requiredSkills: customReqSkills.split(',').map(s => s.trim()).filter(Boolean),
      preferredSkills: customPrefSkills.split(',').map(s => s.trim()).filter(Boolean),
      description: customDescription.trim() || `Position for ${customTitle}`
    };

    setJds(prev => [newJd, ...prev]);
    onSelectJd(newJd);
    setIsCreatingCustom(false);
  };

  const handleSelectAndMatch = async (jd: JobDescription) => {
    onSelectJd(jd);
    await onRunMatchAll(jd);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
      <div className="relative w-full max-w-3xl rounded-2xl bg-white dark:bg-slate-900 shadow-2xl border border-slate-200 dark:border-slate-800 overflow-hidden">
        
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-200 dark:border-slate-800">
          <div className="flex items-center space-x-2.5">
            <div className="w-8 h-8 rounded-lg bg-olive-50 dark:bg-olive-950/60 text-olive-700 dark:text-olive-400 flex items-center justify-center">
              <Briefcase className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-base font-bold text-slate-900 dark:text-white">
                Job Description Matcher & Scoring
              </h3>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                Select a target role or define a custom JD to score candidate suitability
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="p-6 space-y-5 max-h-[75vh] overflow-y-auto">
          
          {/* Custom JD Toggle Button */}
          {!isCreatingCustom ? (
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">
                Available Job Requisitions ({jds.length})
              </span>
              <button
                type="button"
                onClick={() => setIsCreatingCustom(true)}
                className="flex items-center space-x-1 px-3 py-1.5 rounded-lg text-xs font-semibold bg-olive-50 text-olive-800 dark:bg-olive-950/60 dark:text-olive-300 border border-olive-200 dark:border-olive-800 hover:bg-olive-100 transition-colors cursor-pointer"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>Create Custom JD</span>
              </button>
            </div>
          ) : (
            /* Custom JD Form */
            <form onSubmit={handleCreateJd} className="p-4 rounded-xl border bg-slate-50 dark:bg-slate-800/60 border-slate-200 dark:border-slate-700 space-y-3.5">
              <div className="flex items-center justify-between">
                <h4 className="text-xs font-bold text-slate-900 dark:text-white uppercase tracking-wider">
                  New Job Description Profile
                </h4>
                <button
                  type="button"
                  onClick={() => setIsCreatingCustom(false)}
                  className="text-xs text-slate-500 hover:text-slate-700 dark:hover:text-slate-300 cursor-pointer"
                >
                  Cancel
                </button>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div className="sm:col-span-2">
                  <label className="block text-[11px] font-semibold text-slate-600 dark:text-slate-300 mb-1">
                    Job Title *
                  </label>
                  <input
                    type="text"
                    required
                    value={customTitle}
                    onChange={e => setCustomTitle(e.target.value)}
                    placeholder="e.g. Lead Full Stack Java Developer"
                    className="w-full px-3 py-1.5 text-xs rounded-lg border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-700 text-slate-900 dark:text-white focus:ring-2 focus:ring-olive-500/20"
                  />
                </div>

                <div>
                  <label className="block text-[11px] font-semibold text-slate-600 dark:text-slate-300 mb-1">
                    Min Exp (Years) *
                  </label>
                  <input
                    type="number"
                    min="0"
                    max="25"
                    value={customMinExp}
                    onChange={e => setCustomMinExp(Number(e.target.value))}
                    className="w-full px-3 py-1.5 text-xs rounded-lg border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-700 text-slate-900 dark:text-white"
                  />
                </div>
              </div>

              <div>
                <label className="block text-[11px] font-semibold text-slate-600 dark:text-slate-300 mb-1">
                  Required Skills (Comma separated) *
                </label>
                <input
                  type="text"
                  required
                  value={customReqSkills}
                  onChange={e => setCustomReqSkills(e.target.value)}
                  placeholder="e.g. Java, Spring Boot, Microservices, AWS, React, SQL"
                  className="w-full px-3 py-1.5 text-xs rounded-lg border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-700 text-slate-900 dark:text-white"
                />
              </div>

              <div>
                <label className="block text-[11px] font-semibold text-slate-600 dark:text-slate-300 mb-1">
                  Preferred / Nice-to-Have Skills
                </label>
                <input
                  type="text"
                  value={customPrefSkills}
                  onChange={e => setCustomPrefSkills(e.target.value)}
                  placeholder="e.g. Kubernetes, Kafka, Terraform, Docker"
                  className="w-full px-3 py-1.5 text-xs rounded-lg border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-700 text-slate-900 dark:text-white"
                />
              </div>

              <div>
                <label className="block text-[11px] font-semibold text-slate-600 dark:text-slate-300 mb-1">
                  Role Summary & Job Description Text
                </label>
                <textarea
                  rows={2}
                  value={customDescription}
                  onChange={e => setCustomDescription(e.target.value)}
                  placeholder="Describe core responsibilities and technical expectations..."
                  className="w-full px-3 py-1.5 text-xs rounded-lg border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-700 text-slate-900 dark:text-white"
                />
              </div>

              <div className="flex justify-end space-x-2">
                <button
                  type="submit"
                  className="px-4 py-1.5 text-xs font-semibold rounded-lg bg-olive-700 hover:bg-olive-800 text-white shadow-xs cursor-pointer"
                >
                  Save & Select JD
                </button>
              </div>
            </form>
          )}

          {/* Job Descriptions List */}
          <div className="space-y-3">
            {jds.map(jd => {
              const isSelected = activeJd?.id === jd.id;

              return (
                <div
                  key={jd.id}
                  className={`p-4 rounded-xl border transition-all ${
                    isSelected
                      ? 'border-olive-700 bg-olive-50/40 dark:bg-olive-950/30 ring-1 ring-olive-600/30'
                      : 'border-slate-200 dark:border-slate-700/80 bg-white dark:bg-slate-800/80 hover:border-slate-300 dark:hover:border-slate-600'
                  }`}
                >
                  <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-3">
                    <div className="space-y-1.5 flex-1">
                      <div className="flex items-center space-x-2">
                        <h4 className="text-sm font-bold text-slate-900 dark:text-white">
                          {jd.title}
                        </h4>
                        {isSelected && (
                          <span className="inline-flex items-center px-2 py-0.5 rounded text-[10px] font-bold bg-olive-700 text-white">
                            <Check className="w-3 h-3 mr-0.5" />
                            Active JD
                          </span>
                        )}
                      </div>

                      <p className="text-xs text-slate-500 dark:text-slate-400">
                        {jd.department} • <span className="font-medium text-slate-700 dark:text-slate-300">{jd.minExperienceYears}+ Years Experience</span> • {jd.location || 'Remote'}
                      </p>

                      <p className="text-xs text-slate-600 dark:text-slate-300 line-clamp-2 leading-relaxed">
                        {jd.description}
                      </p>

                      {/* Required skills tags */}
                      <div className="pt-2 flex flex-wrap gap-1.5 items-center">
                        <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 mr-1">
                          Must-Have:
                        </span>
                        {jd.requiredSkills.map((skill, sIdx) => (
                          <span
                            key={`${jd.id}-skill-${skill}-${sIdx}`}
                            className="px-2 py-0.5 text-[11px] font-semibold rounded bg-slate-100 dark:bg-slate-700 text-slate-800 dark:text-slate-200"
                          >
                            {skill}
                          </span>
                        ))}
                      </div>
                    </div>

                    {/* Action buttons */}
                    <div className="flex sm:flex-col items-center sm:items-end gap-2 shrink-0 pt-2 sm:pt-0">
                      <button
                        type="button"
                        onClick={() => handleSelectAndMatch(jd)}
                        disabled={isMatchingAll}
                        className="w-full sm:w-auto flex items-center justify-center space-x-1.5 px-3.5 py-1.5 text-xs font-semibold rounded-lg bg-olive-700 hover:bg-olive-800 text-white shadow-xs disabled:opacity-50 transition-colors cursor-pointer"
                      >
                        {isMatchingAll && isSelected ? (
                          <>
                            <Loader2 className="w-3.5 h-3.5 animate-spin" />
                            <span>Scoring Candidates...</span>
                          </>
                        ) : (
                          <>
                            <Sparkles className="w-3.5 h-3.5" />
                            <span>Match All Candidates</span>
                          </>
                        )}
                      </button>

                      <button
                        type="button"
                        onClick={() => onSelectJd(jd)}
                        className={`text-xs px-2.5 py-1 rounded font-medium cursor-pointer ${
                          isSelected ? 'text-olive-700 dark:text-olive-400 font-semibold' : 'text-slate-500 hover:text-slate-800 dark:hover:text-slate-200'
                        }`}
                      >
                        {isSelected ? 'Selected' : 'Set as Active'}
                      </button>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>

        </div>

        {/* Footer */}
        <div className="flex items-center justify-between px-6 py-4 border-t border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-800/50">
          <p className="text-xs text-slate-500 dark:text-slate-400">
            Matching evaluates candidate skills, experience years, and project relevance against the selected JD.
          </p>

          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 text-xs font-semibold rounded-lg text-slate-700 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-700 transition-colors"
          >
            Close
          </button>
        </div>

      </div>
    </div>
  );
};
