export interface Education {
  degree: string;
  specialization: string;
  institution: string;
  graduationYear: string;
}

export interface ExperienceItem {
  company: string;
  designation: string;
  duration: string;
  location?: string;
  description?: string;
}

export interface Certification {
  name: string;
  issuingOrg: string;
  year?: string;
}

export interface Project {
  name: string;
  description: string;
  techStack?: string[];
}

export interface MatchResult {
  score: number;
  matchingSkills: string[];
  missingSkills: string[];
  experienceFit: 'Strong Fit' | 'Moderate Fit' | 'Under Experience' | 'Over Experience';
  recommendation: 'Strong Match' | 'Potential Match' | 'Moderate Match' | 'Low Match';
  reasoning: string;
}

export interface InterviewSchedule {
  date: string;
  time: string;
  type: 'Technical Round' | 'HR Screening' | 'System Design' | 'Leadership Fit' | 'Final Round';
  interviewer: string;
  meetLink?: string;
  notes?: string;
}

export type CandidateStatus = 
  | 'New' 
  | 'Screened' 
  | 'Interview Scheduled' 
  | 'Shortlisted' 
  | 'Offered' 
  | 'Rejected' 
  | 'Hired';

export interface Candidate {
  id: string;
  name: string;
  email: string;
  phone: string;
  location: string;
  linkedin: string;
  github: string;
  summary: string;
  totalExperienceYears: number;
  currentCompany: string;
  currentDesignation: string;
  previousCompanies: string[];
  employmentHistory: ExperienceItem[];
  education: Education[];
  skills: string[];
  normalizedSkills: {
    technical: string[];
    functional: string[];
    tools: string[];
  };
  certifications: Certification[];
  projects: Project[];
  suggestedRoles: string[];
  resumeFileName: string;
  resumeFileSize?: number;
  resumeBase64?: string;
  uploadDate: string;
  status: CandidateStatus;
  matchResult?: MatchResult;
  isDuplicate?: boolean;
  duplicateOfId?: string;
  interviewSchedule?: InterviewSchedule;
  recruiterNotes?: string;
}

export interface JobDescription {
  id: string;
  title: string;
  department: string;
  minExperienceYears: number;
  maxExperienceYears?: number;
  requiredSkills: string[];
  preferredSkills: string[];
  description: string;
  location?: string;
}

export interface AuditLog {
  id: string;
  timestamp: string;
  action: string;
  details: string;
  user: string;
  type: 'upload' | 'parse' | 'match' | 'status_change' | 'export' | 'delete' | 'interview';
}
