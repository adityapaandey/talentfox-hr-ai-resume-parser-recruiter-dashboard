import React, { useState, useRef } from 'react';
import { 
  X, 
  UploadCloud, 
  FileText, 
  CheckCircle2, 
  AlertCircle, 
  Loader2, 
  Sparkles, 
  Layers, 
  Plus, 
  FileCheck,
  AlertTriangle,
  UserPlus,
  Trash2
} from 'lucide-react';
import { Candidate } from '../types';
import { fileToBase64 } from '../utils/pdfHelpers';

interface ResumeUploadModalProps {
  isOpen: boolean;
  onClose: () => void;
  onAddCandidates: (candidates: Candidate[]) => void;
  existingCandidates: Candidate[];
}

interface UploadQueueItem {
  id: string;
  file: File;
  name: string;
  size: number;
  progress: number;
  status: 'pending' | 'reading' | 'parsing_ai' | 'dedup' | 'completed' | 'error';
  errorMessage?: string;
  parsedCandidate?: Candidate;
  isDuplicate?: boolean;
}

export const ResumeUploadModal: React.FC<ResumeUploadModalProps> = ({
  isOpen,
  onClose,
  onAddCandidates,
  existingCandidates
}) => {
  const [dragOver, setDragOver] = useState(false);
  const [queue, setQueue] = useState<UploadQueueItem[]>([]);
  const [isProcessing, setIsProcessing] = useState(false);
  const [fileValidationError, setFileValidationError] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  if (!isOpen) return null;

  const handleFiles = (files: FileList | null) => {
    if (!files || files.length === 0) return;
    setFileValidationError(null);

    const newItems: UploadQueueItem[] = [];
    for (let i = 0; i < files.length; i++) {
      const file = files[i];
      if (file.type === 'application/pdf' || file.name.toLowerCase().endsWith('.pdf')) {
        if (file.size > 10 * 1024 * 1024) {
          setFileValidationError(`File "${file.name}" exceeds maximum allowed 10 MB limit.`);
          continue;
        }
        newItems.push({
          id: `upload-${Date.now()}-${i}-${Math.random().toString(36).substr(2, 4)}`,
          file,
          name: file.name,
          size: file.size,
          progress: 0,
          status: 'pending'
        });
      } else {
        setFileValidationError(`File "${file.name}" is not a PDF. Only .pdf format is accepted.`);
      }
    }

    if (newItems.length > 0) {
      setQueue(prev => [...prev, ...newItems]);
    }
  };

  const onDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setDragOver(true);
  };

  const onDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    setDragOver(false);
  };

  const onDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setDragOver(false);
    handleFiles(e.dataTransfer.files);
  };

  const handleStartParsing = async () => {
    const pendingIndices = queue
      .map((item, idx) => ({ item, idx }))
      .filter(({ item }) => item.status !== 'completed');

    if (pendingIndices.length === 0) return;
    setIsProcessing(true);

    const parseSingleItem = async (targetId: string) => {
      // 1. Mark as reading
      setQueue(prev =>
        prev.map(it => (it.id === targetId ? { ...it, status: 'reading', progress: 25 } : it))
      );

      try {
        const currentItem = queue.find(q => q.id === targetId);
        if (!currentItem) return;

        const base64 = await fileToBase64(currentItem.file);

        // 2. Mark as AI parsing
        setQueue(prev =>
          prev.map(it => (it.id === targetId ? { ...it, status: 'parsing_ai', progress: 65 } : it))
        );

        const response = await fetch('/api/resumes/parse-base64', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            base64,
            fileName: currentItem.name
          })
        });

        if (!response.ok) {
          const errData = await response.json().catch(() => ({}));
          throw new Error(errData.error || `Server responded with status ${response.status}`);
        }

        const data = await response.json();
        const fullBase64 = base64.startsWith('data:') ? base64 : `data:application/pdf;base64,${base64}`;
        const candidate: Candidate = {
          ...data.candidate,
          resumeFileName: currentItem.name,
          resumeFileSize: currentItem.size,
          resumeBase64: fullBase64
        };

        // 3. Duplicate Detection Check
        const isDuplicate = existingCandidates.some(ec => 
          (ec.email && candidate.email && ec.email.toLowerCase().trim() === candidate.email.toLowerCase().trim()) ||
          (ec.phone && candidate.phone && ec.phone.replace(/\D/g, '') === candidate.phone.replace(/\D/g, '')) ||
          (ec.name && candidate.name && ec.name.toLowerCase() === candidate.name.toLowerCase() && ec.currentCompany?.toLowerCase() === candidate.currentCompany?.toLowerCase())
        );

        candidate.isDuplicate = isDuplicate;

        setQueue(prev =>
          prev.map(it =>
            it.id === targetId
              ? {
                  ...it,
                  status: 'completed',
                  progress: 100,
                  isDuplicate,
                  parsedCandidate: candidate
                }
              : it
          )
        );
      } catch (err: any) {
        console.error('Error parsing item:', err);
        setQueue(prev =>
          prev.map(it =>
            it.id === targetId
              ? {
                  ...it,
                  status: 'error',
                  progress: 0,
                  errorMessage: err.message || 'Parsing failed'
                }
              : it
          )
        );
      }
    };

    // Process concurrently with up to 3 parallel requests for optimal speed without rate-limiting
    const poolLimit = 3;
    const pool: Promise<void>[] = [];
    for (const { item } of pendingIndices) {
      const p = parseSingleItem(item.id).then(() => {
        pool.splice(pool.indexOf(p), 1);
      });
      pool.push(p);
      if (pool.length >= poolLimit) {
        await Promise.race(pool);
      }
    }
    await Promise.all(pool);

    setIsProcessing(false);
  };

  const handleApplyToDatabase = () => {
    const completedItems = queue.filter(item => item.status === 'completed' && item.parsedCandidate);
    const parsed = completedItems.map(item => item.parsedCandidate as Candidate);

    if (parsed.length > 0) {
      onAddCandidates(parsed);
      // Remove all added parsed candidates from queue
      const completedIds = new Set(completedItems.map(i => i.id));
      setQueue(prev => prev.filter(item => !completedIds.has(item.id)));
      onClose();
    }
  };

  const handleAddSingleCandidate = (item: UploadQueueItem) => {
    if (!item.parsedCandidate) return;
    onAddCandidates([item.parsedCandidate]);
    // Remove the parsed candidate from queue once added to the list
    setQueue(prev => prev.filter(q => q.id !== item.id));
  };

  const handleRemoveQueueItem = (id: string) => {
    setQueue(prev => prev.filter(q => q.id !== id));
  };

  // Quick-load demo candidates helper
  const handleLoadDemoResumes = (count: number) => {
    const demoCandidatesPool = [
      {
        id: `demo-${Date.now()}-1`,
        name: 'Rohan Deshmukh',
        email: 'rohan.deshmukh@cloudmatrix.com',
        phone: '+1 (415) 902-1144',
        location: 'San Francisco, CA',
        linkedin: 'https://linkedin.com/in/rohan-deshmukh',
        github: 'https://github.com/rohand-cloud',
        summary: 'Cloud-Native Java & Microservices Architect with 9 years designing high-concurrency Spring Boot systems, Apache Kafka event streaming, and Kubernetes deployment architectures on AWS.',
        totalExperienceYears: 9,
        currentCompany: 'OmniCloud Systems',
        currentDesignation: 'Principal Java Architect',
        previousCompanies: ['Wipro Enterprise', 'Cognizant'],
        employmentHistory: [
          {
            company: 'OmniCloud Systems',
            designation: 'Principal Java Architect',
            duration: '2021 - Present',
            location: 'San Francisco, CA',
            description: 'Led architecture of multi-region microservices handling 80M messages/day with Spring Boot and Kafka.'
          }
        ],
        education: [
          {
            degree: 'Master of Technology (M.Tech)',
            specialization: 'Software Engineering',
            institution: 'IIT Bombay',
            graduationYear: '2015'
          }
        ],
        skills: ['Java', 'Spring Boot', 'Microservices', 'AWS', 'Kafka', 'Docker', 'Kubernetes', 'SQL', 'PostgreSQL', 'Redis', 'React'],
        normalizedSkills: {
          technical: ['Java', 'Spring Boot', 'Microservices', 'Kafka', 'SQL', 'PostgreSQL', 'Redis'],
          functional: ['System Architecture', 'High Availability Design', 'Mentorship'],
          tools: ['AWS', 'Kubernetes', 'Docker', 'Git']
        },
        certifications: [
          {
            name: 'AWS Certified Solutions Architect – Professional',
            issuingOrg: 'Amazon Web Services',
            year: '2023'
          }
        ],
        projects: [
          {
            name: 'Real-Time Global Settlement Engine',
            description: 'Engineered multi-currency settlement platform processing $100M+ volume daily.',
            techStack: ['Java', 'Spring Boot', 'Kafka', 'AWS']
          }
        ],
        suggestedRoles: ['Principal Java Architect', 'Lead Cloud Engineer', 'Engineering Manager'],
        resumeFileName: 'Rohan_Deshmukh_Principal_Java.pdf',
        resumeFileSize: 260000,
        uploadDate: new Date().toISOString().replace('T', ' ').substring(0, 16),
        status: 'New' as const
      },
      {
        id: `demo-${Date.now()}-2`,
        name: 'Jessica Reynolds',
        email: 'jessica.reynolds@aipulse.ai',
        phone: '+1 (650) 412-8873',
        location: 'Palo Alto, CA',
        linkedin: 'https://linkedin.com/in/jessicareynolds-ai',
        github: 'https://github.com/jreynolds-nlp',
        summary: 'Senior AI & LLM Systems Engineer with 6 years experience in building generative AI agents, fine-tuning transformer models, and deploying low-latency FastAPI inference clusters on AWS & GCP.',
        totalExperienceYears: 6,
        currentCompany: 'Synthetix AI',
        currentDesignation: 'Senior Generative AI Engineer',
        previousCompanies: ['Google AI Research (Contract)', 'Scale AI'],
        employmentHistory: [
          {
            company: 'Synthetix AI',
            designation: 'Senior Generative AI Engineer',
            duration: '2022 - Present',
            location: 'Palo Alto, CA',
            description: 'Designed agentic LLM workflows with LangChain and vector databases, reducing token costs by 40%.'
          }
        ],
        education: [
          {
            degree: 'Master of Science (M.S.)',
            specialization: 'Artificial Intelligence',
            institution: 'Stanford University',
            graduationYear: '2019'
          }
        ],
        skills: ['Python', 'PyTorch', 'FastAPI', 'AI/ML', 'NLP', 'LangChain', 'Docker', 'AWS', 'SQL', 'Vector Databases', 'MLOps'],
        normalizedSkills: {
          technical: ['Python', 'PyTorch', 'FastAPI', 'NLP', 'LangChain', 'SQL'],
          functional: ['LLM Alignment', 'Prompt Engineering', 'AI Architecture'],
          tools: ['Docker', 'AWS SageMaker', 'Weaviate', 'Git']
        },
        certifications: [
          {
            name: 'TensorFlow Developer Certificate',
            issuingOrg: 'Google Developers',
            year: '2021'
          }
        ],
        projects: [
          {
            name: 'DocuMind Semantic Search Engine',
            description: 'Vector-grounded document search platform over 2M legal PDFs.',
            techStack: ['Python', 'FastAPI', 'PyTorch', 'Docker']
          }
        ],
        suggestedRoles: ['Lead AI Engineer', 'NLP Architect', 'AI Platform Lead'],
        resumeFileName: 'Jessica_Reynolds_AI_Lead.pdf',
        resumeFileSize: 310000,
        uploadDate: new Date().toISOString().replace('T', ' ').substring(0, 16),
        status: 'New' as const
      },
      {
        id: `demo-${Date.now()}-3`,
        name: 'Carlos Mendez',
        email: 'carlos.mendez@cloudgrid.io',
        phone: '+1 (720) 881-3920',
        location: 'Denver, CO',
        linkedin: 'https://linkedin.com/in/carlosmendez-devops',
        github: 'https://github.com/cmendez-infra',
        summary: 'Senior SRE & Cloud Architect with 7 years hands-on mastery in AWS, Kubernetes (EKS), Terraform IaC, Prometheus observability, and CI/CD pipeline modernization.',
        totalExperienceYears: 7,
        currentCompany: 'Skyline Cloud Services',
        currentDesignation: 'Staff SRE Engineer',
        previousCompanies: ['Oracle Cloud Infrastructure', 'Red Hat'],
        employmentHistory: [
          {
            company: 'Skyline Cloud Services',
            designation: 'Staff SRE Engineer',
            duration: '2021 - Present',
            location: 'Denver, CO',
            description: 'Automated 100% of cloud provisioning via Terraform and managed 30+ Kubernetes clusters.'
          }
        ],
        education: [
          {
            degree: 'Bachelor of Science (B.S.)',
            specialization: 'Computer Systems Engineering',
            institution: 'University of Colorado Boulder',
            graduationYear: '2017'
          }
        ],
        skills: ['DevOps', 'AWS', 'Kubernetes', 'Terraform', 'CI/CD', 'Docker', 'Linux', 'Python', 'SQL', 'Prometheus'],
        normalizedSkills: {
          technical: ['AWS', 'Kubernetes', 'Terraform', 'Docker', 'Linux', 'Python', 'CI/CD'],
          functional: ['Site Reliability Engineering', 'Incident Command', 'Cost Optimization'],
          tools: ['ArgoCD', 'Prometheus', 'Grafana', 'Vault']
        },
        certifications: [
          {
            name: 'Certified Kubernetes Administrator (CKA)',
            issuingOrg: 'Cloud Native Computing Foundation',
            year: '2023'
          }
        ],
        projects: [
          {
            name: 'Zero-Downtime Multi-Region Disaster Recovery',
            description: 'Constructed automated failover between AWS us-east-1 and us-west-2.',
            techStack: ['Terraform', 'AWS', 'Kubernetes', 'Route53']
          }
        ],
        suggestedRoles: ['Staff Site Reliability Engineer', 'Cloud Architect', 'DevOps Team Lead'],
        resumeFileName: 'Carlos_Mendez_Staff_SRE.pdf',
        resumeFileSize: 275000,
        uploadDate: new Date().toISOString().replace('T', ' ').substring(0, 16),
        status: 'New' as const
      }
    ];

    const selectedDemos = demoCandidatesPool.slice(0, count);
    const newItems: UploadQueueItem[] = selectedDemos.map((cand, idx) => {
      const uniqueCandId = `cand-demo-${Date.now()}-${idx}-${Math.random().toString(36).substr(2, 9)}`;
      return {
        id: `queue-${Date.now()}-${idx}-${Math.random().toString(36).substr(2, 9)}`,
        file: new File(['mock pdf content'], cand.resumeFileName, { type: 'application/pdf' }),
        name: cand.resumeFileName,
        size: cand.resumeFileSize,
        progress: 100,
        status: 'completed',
        parsedCandidate: {
          ...cand,
          id: uniqueCandId
        } as Candidate,
        isDuplicate: existingCandidates.some(ec => ec.email && cand.email && ec.email.toLowerCase() === cand.email.toLowerCase())
      };
    });

    setQueue(prev => [...prev, ...newItems]);
  };

  const completedCount = queue.filter(q => q.status === 'completed').length;

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
      <div className="relative w-full max-w-3xl rounded-2xl bg-white dark:bg-slate-900 shadow-2xl border border-slate-200 dark:border-slate-800 overflow-hidden">
               {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-200 dark:border-slate-800">
          <div className="flex items-center space-x-2.5">
            <div className="w-8 h-8 rounded-lg bg-olive-50 dark:bg-olive-950/60 text-olive-700 dark:text-olive-400 flex items-center justify-center">
              <UploadCloud className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-base font-bold text-slate-900 dark:text-white">
                Upload & Parse PDF Resumes
              </h3>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                Single or batch PDF processing with Gemini AI entity extraction
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
          
          {/* Drag & Drop Area */}
          <div
            onDragOver={onDragOver}
            onDragLeave={onDragLeave}
            onDrop={onDrop}
            onClick={() => fileInputRef.current?.click()}
            className={`cursor-pointer border-2 border-dashed rounded-xl p-8 text-center transition-all ${
              dragOver
                ? 'border-olive-500 bg-olive-50/50 dark:bg-olive-950/30 scale-[0.99]'
                : 'border-slate-300 dark:border-slate-700 bg-slate-50/60 dark:bg-slate-800/40 hover:bg-slate-100/60 dark:hover:bg-slate-800/80 hover:border-olive-400'
            }`}
          >
            <input
              ref={fileInputRef}
              type="file"
              multiple
              accept="application/pdf,.pdf"
              onChange={e => handleFiles(e.target.files)}
              className="hidden"
            />

            <div className="flex flex-col items-center justify-center space-y-3">
              <div className="w-14 h-14 rounded-full bg-olive-100 dark:bg-olive-900/40 text-olive-700 dark:text-olive-400 flex items-center justify-center shadow-xs">
                <UploadCloud className="w-7 h-7" />
              </div>
              
              <div>
                <p className="text-sm font-semibold text-slate-800 dark:text-slate-200">
                  <span className="text-olive-700 dark:text-olive-400 hover:underline">Click to browse</span> or drag and drop PDF resumes here
                </p>
                <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
                  Supports Single & Batch PDF Resumes (Max 10 MB per file)
                </p>
              </div>

              <div className="flex items-center space-x-2 text-[11px] text-slate-400 dark:text-slate-500 bg-white dark:bg-slate-800/90 px-3 py-1 rounded-full border border-slate-200 dark:border-slate-700">
                <Sparkles className="w-3.5 h-3.5 text-olive-600" />
                <span>Auto-Extracts Contact, Skills, Experience, Education & Roles</span>
              </div>
            </div>
          </div>

          {/* File validation warning banner */}
          {fileValidationError && (
            <div className="flex items-center space-x-2 p-3 bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-800 rounded-xl text-xs text-rose-700 dark:text-rose-300">
              <AlertTriangle className="w-4 h-4 text-rose-500 shrink-0" />
              <span>{fileValidationError}</span>
            </div>
          )}

          {/* Quick Demo Pre-load Helper */}
          <div className="bg-slate-100/70 dark:bg-slate-800/60 rounded-xl p-3.5 border border-slate-200/80 dark:border-slate-700/60 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
            <div>
              <p className="text-xs font-semibold text-slate-800 dark:text-slate-200 flex items-center">
                <Layers className="w-4 h-4 mr-1.5 text-olive-700 dark:text-olive-400" />
                Want to test without uploading your own PDF files?
              </p>
              <p className="text-[11px] text-slate-500 dark:text-slate-400">
                Instantly load simulated rich PDF candidate profiles (Java Lead, AI Engineer, SRE).
              </p>
            </div>
            
            <div className="flex items-center space-x-2">
              <button
                type="button"
                onClick={() => handleLoadDemoResumes(3)}
                className="px-3 py-1.5 text-xs font-semibold rounded-lg bg-olive-50 hover:bg-olive-100 text-olive-800 dark:bg-olive-950/70 dark:text-olive-300 dark:hover:bg-olive-900/80 border border-olive-200 dark:border-olive-800 transition-colors flex items-center cursor-pointer"
              >
                <Plus className="w-3.5 h-3.5 mr-1" />
                Add 3 Sample Resumes
              </button>
            </div>
          </div>

          {/* Upload Queue List */}
          {queue.length > 0 && (
            <div className="space-y-2">
              <div className="flex items-center justify-between text-xs font-semibold text-slate-700 dark:text-slate-300">
                <span>Queue ({queue.length} files)</span>
                <span className="text-slate-500">
                  {completedCount} of {queue.length} ready
                </span>
              </div>

              <div className="space-y-2 max-h-60 overflow-y-auto pr-1">
                {queue.map(item => (
                  <div
                    key={item.id}
                    className="p-3 rounded-lg border bg-white dark:bg-slate-800/90 border-slate-200 dark:border-slate-700 flex items-center justify-between text-xs space-x-3 shadow-2xs"
                  >
                    <div className="flex items-center space-x-2.5 min-w-0 flex-1">
                      <div className="w-8 h-8 rounded-md bg-rose-50 dark:bg-rose-950/50 text-rose-600 dark:text-rose-400 flex items-center justify-center shrink-0">
                        <FileText className="w-4 h-4" />
                      </div>
                      
                      <div className="min-w-0 flex-1">
                        <p className="font-medium text-slate-900 dark:text-white truncate">
                          {item.name}
                        </p>
                        <div className="flex items-center space-x-2 text-[11px] text-slate-400 mt-0.5">
                          <span>{(item.size / 1024).toFixed(0)} KB</span>
                          <span>•</span>
                          {item.status === 'pending' && <span className="text-slate-500">Waiting to parse</span>}
                          {item.status === 'reading' && <span className="text-blue-500">Reading PDF data...</span>}
                          {item.status === 'parsing_ai' && <span className="text-olive-600 flex items-center"><Sparkles className="w-3 h-3 mr-0.5 animate-spin" /> Gemini AI extracting fields...</span>}
                          {item.status === 'completed' && (
                            <span className="text-emerald-600 dark:text-emerald-400 font-semibold flex items-center">
                              <CheckCircle2 className="w-3.5 h-3.5 mr-1" />
                              Parsed: {item.parsedCandidate?.name} ({item.parsedCandidate?.totalExperienceYears} yrs exp)
                            </span>
                          )}
                          {item.status === 'error' && (
                            <span className="text-rose-500 flex items-center">
                              <AlertCircle className="w-3.5 h-3.5 mr-1" />
                              {item.errorMessage}
                            </span>
                          )}
                        </div>
                      </div>
                    </div>

                    {/* Duplicate Badge */}
                    {item.isDuplicate && (
                      <span className="inline-flex items-center px-2 py-0.5 rounded text-[10px] font-semibold bg-amber-50 text-amber-700 dark:bg-amber-950/60 dark:text-amber-300 border border-amber-200 dark:border-amber-800">
                        <AlertTriangle className="w-3 h-3 mr-1 text-amber-500" />
                        Duplicate
                      </span>
                    )}

                    {/* Progress indicator and actions */}
                    <div className="flex items-center space-x-2 shrink-0">
                      {item.status === 'completed' && item.parsedCandidate ? (
                        <>
                          <button
                            type="button"
                            onClick={() => handleAddSingleCandidate(item)}
                            className="inline-flex items-center px-2.5 py-1 rounded-md text-[11px] font-semibold bg-emerald-50 text-emerald-700 dark:bg-emerald-950/70 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800 hover:bg-emerald-100 dark:hover:bg-emerald-900/60 transition-colors shadow-2xs cursor-pointer"
                            title="Add this candidate to the dashboard list and remove from queue"
                          >
                            <Plus className="w-3.5 h-3.5 mr-1" />
                            Add to List
                          </button>

                          <button
                            type="button"
                            onClick={() => handleRemoveQueueItem(item.id)}
                            className="p-1 rounded text-slate-400 hover:text-rose-500 hover:bg-rose-50 dark:hover:bg-rose-950/40 transition-colors cursor-pointer"
                            title="Remove from queue"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </>
                      ) : item.status === 'error' ? (
                        <>
                          <span className="text-xs text-rose-500 font-medium">Failed</span>
                          <button
                            type="button"
                            onClick={() => handleRemoveQueueItem(item.id)}
                            className="p-1 rounded text-slate-400 hover:text-rose-500 hover:bg-rose-50 dark:hover:bg-rose-950/40 transition-colors cursor-pointer"
                            title="Dismiss error"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </>
                      ) : (
                        <div className="w-20">
                          <div className="w-full bg-slate-100 dark:bg-slate-700 h-1.5 rounded-full overflow-hidden">
                            <div
                              className="bg-olive-700 h-full rounded-full transition-all duration-300"
                              style={{ width: `${item.progress}%` }}
                            />
                          </div>
                        </div>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

        </div>

        {/* Footer */}
        <div className="flex items-center justify-between px-6 py-4 border-t border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-800/50">
          <button
            type="button"
            onClick={() => setQueue([])}
            disabled={queue.length === 0 || isProcessing}
            className="text-xs text-slate-500 hover:text-slate-800 dark:hover:text-slate-300 disabled:opacity-40 cursor-pointer"
          >
            Clear Queue
          </button>

          <div className="flex items-center space-x-2">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-xs font-semibold rounded-lg text-slate-700 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-700 transition-colors cursor-pointer"
            >
              Cancel
            </button>

            {queue.some(q => q.status === 'pending') ? (
              <button
                type="button"
                onClick={handleStartParsing}
                disabled={isProcessing}
                className="flex items-center space-x-1.5 px-4 py-2 text-xs font-semibold rounded-lg bg-olive-700 hover:bg-olive-800 text-white shadow-sm disabled:opacity-50 transition-colors cursor-pointer"
              >
                {isProcessing ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    <span>Parsing with AI...</span>
                  </>
                ) : (
                  <>
                    <Sparkles className="w-4 h-4" />
                    <span>Start AI Parsing ({queue.filter(q => q.status === 'pending').length})</span>
                  </>
                )}
              </button>
            ) : (
              <button
                type="button"
                onClick={handleApplyToDatabase}
                disabled={completedCount === 0}
                className="flex items-center space-x-1.5 px-5 py-2 text-xs font-semibold rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white shadow-sm disabled:opacity-50 transition-colors cursor-pointer"
              >
                <UserPlus className="w-4 h-4" />
                <span>Add {completedCount} Candidate{completedCount > 1 ? 's' : ''} to Dashboard</span>
              </button>
            )}
          </div>
        </div>

      </div>
    </div>
  );
};
