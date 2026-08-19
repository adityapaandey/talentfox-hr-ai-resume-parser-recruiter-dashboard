import { Candidate, JobDescription } from '../types';

export const PRESET_JOB_DESCRIPTIONS: JobDescription[] = [
  {
    id: 'jd-1',
    title: 'Senior Full Stack Java & Cloud Engineer',
    department: 'Engineering - Backend & Cloud',
    minExperienceYears: 5,
    maxExperienceYears: 10,
    location: 'San Francisco, CA / Remote',
    requiredSkills: ['Java', 'Spring Boot', 'Microservices', 'AWS', 'React', 'SQL', 'Docker'],
    preferredSkills: ['Kubernetes', 'Kafka', 'Redis', 'CI/CD', 'GraphQL'],
    description: `We are looking for a Senior Full Stack Java Engineer to lead our core transaction platform. 
Responsibilities include designing resilient microservices using Spring Boot & AWS, building responsive React dashboards, architecting relational SQL schemas, and driving CI/CD automation.`
  },
  {
    id: 'jd-2',
    title: 'Lead AI / ML Platform Engineer',
    department: 'AI & Data Intelligence',
    minExperienceYears: 4,
    maxExperienceYears: 8,
    location: 'New York, NY / Hybrid',
    requiredSkills: ['Python', 'PyTorch', 'FastAPI', 'AI/ML', 'Docker', 'SQL', 'NLP'],
    preferredSkills: ['LangChain', 'Kubernetes', 'Vector Databases', 'AWS SageMaker', 'MLOps'],
    description: `Seeking an experienced AI / ML Platform Engineer to build LLM pipelines, fine-tune transformer models, implement high-throughput FastAPI inference services, and manage vector indexing for generative applications.`
  },
  {
    id: 'jd-3',
    title: 'DevOps & Site Reliability Architect',
    department: 'Infrastructure & SRE',
    minExperienceYears: 6,
    maxExperienceYears: 12,
    location: 'Austin, TX / Remote',
    requiredSkills: ['AWS', 'Kubernetes', 'Terraform', 'CI/CD', 'DevOps', 'Docker', 'Linux'],
    preferredSkills: ['Prometheus', 'Grafana', 'Ansible', 'Python', 'Security Hardening'],
    description: `Looking for a Senior DevOps Architect to scale multi-region AWS cloud infrastructure with Infrastructure as Code (Terraform), manage Kubernetes clusters (EKS), and maintain zero-downtime deployment pipelines.`
  },
  {
    id: 'jd-4',
    title: 'Senior Frontend React Architect',
    department: 'Product Engineering',
    minExperienceYears: 5,
    maxExperienceYears: 9,
    location: 'Seattle, WA / Remote',
    requiredSkills: ['React', 'TypeScript', 'Tailwind CSS', 'Redux / Zustand', 'Next.js', 'Web Performance'],
    preferredSkills: ['GraphQL', 'Jest / Cypress', 'Micro-frontends', 'UI/UX Design Systems'],
    description: `We are hiring a Lead Frontend Architect specializing in React, TypeScript, and modern state architectures. You will lead UI engineering for enterprise data-intensive analytics web portals.`
  }
];

// Default candidate roster is clean/empty for user-uploaded resumes
export const INITIAL_CANDIDATES: Candidate[] = [];

// Sample profile detection to purge demo data cleanly
const SAMPLE_IDS = new Set(['cand-1', 'cand-2', 'cand-3', 'cand-4', 'cand-5']);
const SAMPLE_EMAILS = new Set([
  'aarav.sharma@techsphere.io',
  'elena.rostova@dataweave.ai',
  'marcus.vance@cloudops.net',
  'priya.patel@uxengine.dev',
  'david.chen@enterpriseflow.org'
]);

export function isSampleCandidate(c: Candidate): boolean {
  if (!c) return false;
  if (SAMPLE_IDS.has(c.id)) return true;
  if (c.email && SAMPLE_EMAILS.has(c.email.toLowerCase().trim())) return true;
  if (c.name && ['Aarav Sharma', 'Elena Rostova', 'Marcus Vance', 'David Chen', 'Priya Patel'].includes(c.name)) return true;
  return false;
}
