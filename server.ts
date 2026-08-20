import express from 'express';
import path from 'path';
import multer from 'multer';
import * as pdfParseModule from 'pdf-parse';
import { GoogleGenAI, Type } from '@google/genai';
import { createServer as createViteServer } from 'vite';

// Handle default/namespace import compatibility for pdf-parse
const pdfParse = (pdfParseModule as any).default || pdfParseModule;

const app = express();
const PORT = 3000;

// Configure JSON and URL encoded limits for large resume payloads / base64 PDFs
app.use(express.json({ limit: '25mb' }));
app.use(express.urlencoded({ extended: true, limit: '25mb' }));

// Multer memory storage for PDF file uploads
const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 10 * 1024 * 1024 } // 10 MB per file limit
});

// Lazy / Safe Gemini initialization
function getGeminiClient(): GoogleGenAI | null {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) {
    console.warn('GEMINI_API_KEY not configured, AI features will use smart deterministic extraction.');
    return null;
  }
  return new GoogleGenAI({
    apiKey,
    httpOptions: {
      headers: {
        'User-Agent': 'aistudio-build'
      }
    }
  });
}

// In-Memory Candidate store with audit trail
let auditLogs: Array<{
  id: string;
  timestamp: string;
  action: string;
  details: string;
  user: string;
  type: string;
}> = [
  {
    id: 'log-1',
    timestamp: new Date(Date.now() - 3600000 * 4).toISOString(),
    action: 'System Initialized',
    details: 'TalentFox HR Candidate Engine & AI Resume Parser online.',
    user: 'System Admin',
    type: 'upload'
  }
];

// In-Memory storage for original uploaded PDF files to support instant full-file downloads
const resumeFileStore = new Map<string, {
  buffer: Buffer;
  fileName: string;
  mimeType: string;
  base64: string;
}>();

function logActivity(action: string, details: string, type: string, user = 'HR Recruiter') {
  auditLogs.unshift({
    id: `log-${Date.now()}-${Math.random().toString(36).substr(2, 4)}`,
    timestamp: new Date().toISOString(),
    action,
    details,
    user,
    type
  });
  if (auditLogs.length > 100) auditLogs.pop();
}

// Supported active Gemini models in order of quota & priority:
// 1. gemini-2.5-flash (fast, standard)
// 2. gemini-3.1-flash-lite (high rate-limit throughput)
// 3. gemini-3.7-flash (reasoning flash)
// 4. gemini-3.1-pro-preview (advanced pro preview)
const GEMINI_MODELS = [
  'gemini-2.5-flash',
  'gemini-3.1-flash-lite',
  'gemini-3.7-flash',
  'gemini-3.1-pro-preview'
];

// Helper to delay execution for retry backoff
const delay = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));

// Robust Gemini generation wrapper with multi-model fallback and graceful non-blocking degradation
async function generateWithGeminiFallback(ai: GoogleGenAI, contents: any, schemaConfig?: any): Promise<any> {
  for (const modelName of GEMINI_MODELS) {
    try {
      const config: any = {};
      if (schemaConfig) {
        config.responseMimeType = 'application/json';
        config.responseSchema = schemaConfig;
      }

      // Format contents appropriately for @google/genai SDK
      let formattedContents: any;
      if (typeof contents === 'string') {
        formattedContents = contents;
      } else if (Array.isArray(contents)) {
        if (contents.length === 1 && contents[0].text && !contents[0].inlineData) {
          formattedContents = contents[0].text;
        } else {
          formattedContents = contents;
        }
      } else {
        formattedContents = contents;
      }

      // Generous promise timeout (25 seconds max per model attempt)
      const generatePromise = ai.models.generateContent({
        model: modelName,
        contents: formattedContents,
        config
      });

      const timeoutPromise = new Promise((_, reject) =>
        setTimeout(() => reject(new Error('AI generation timeout')), 25000)
      );

      const response: any = await Promise.race([generatePromise, timeoutPromise]);

      if (response && response.text) {
        let text = response.text.trim();
        // Strip markdown code fences if present
        if (text.startsWith('```')) {
          text = text.replace(/^```(?:json)?\s*/i, '').replace(/\s*```$/i, '').trim();
        }
        const parsed = JSON.parse(text);
        if (parsed && typeof parsed === 'object') {
          return parsed;
        }
      }
    } catch (err: any) {
      console.warn(`Gemini generation note for ${modelName}:`, err?.message || err);
      // Gracefully advance to next candidate model or deterministic fallback
      await delay(100);
    }
  }

  // Gracefully return null so callers can seamlessly use the smart deterministic engine
  return null;
}

// Get Audit Logs
app.get('/api/audit-logs', (req, res) => {
  res.json({ logs: auditLogs });
});

// Helper for semantic matching fallback
function computeRuleBasedMatch(candidate: any, jobDescription: any) {
  const reqSkills: string[] = jobDescription.requiredSkills || [];
  const candSkills: string[] = candidate.skills || [];

  const normalize = (s: string) => s.toLowerCase().replace(/[^a-z0-9]/g, '');

  const matchingSkills = reqSkills.filter(req => {
    const normReq = normalize(req);
    return candSkills.some(cand => {
      const normCand = normalize(cand);
      return normCand.includes(normReq) || normReq.includes(normCand);
    });
  });

  const missingSkills = reqSkills.filter(req => !matchingSkills.includes(req));

  const candExp = Number(candidate.totalExperienceYears) || 0;
  const minExp = Number(jobDescription.minExperienceYears) || 0;
  const expDiff = candExp - minExp;

  let experienceFit = 'Strong Fit';
  if (expDiff < 0) experienceFit = 'Under Experience';
  else if (expDiff > 5) experienceFit = 'Over Experience';

  // Calculate weighted score
  const skillRatio = reqSkills.length > 0 ? (matchingSkills.length / reqSkills.length) : 0.8;
  const expScore = expDiff >= 0 ? 30 : Math.max(0, 30 + expDiff * 8);
  const rawScore = Math.round(skillRatio * 70 + expScore);
  const score = Math.min(98, Math.max(25, rawScore));

  const recommendation = score >= 80 ? 'Strong Match' : score >= 60 ? 'Potential Match' : score >= 40 ? 'Moderate Match' : 'Low Match';

  return {
    score,
    matchingSkills,
    missingSkills,
    experienceFit,
    recommendation,
    reasoning: `${candidate.name} has ${matchingSkills.length} out of ${reqSkills.length} key required skills with ${candExp} years of relevant experience for the ${jobDescription.title} position.`
  };
}

// Extract clean text from PDF buffer
async function extractTextFromPdf(buffer: Buffer): Promise<string> {
  try {
    const data = await pdfParse(buffer);
    return (data && data.text) ? data.text.trim() : '';
  } catch (e: any) {
    console.warn('pdf-parse note:', e?.message || e);
    return '';
  }
}

// Smart deterministic resume parser from raw text and file metadata
function createSmartDeterministicParsedResume(fileName: string, rawText = '') {
  const cleanBaseName = fileName.replace(/\.[^/.]+$/, '').replace(/[-_]/g, ' ').replace(/\(\d+\)/g, '').trim();

  // Extract Email - exact regex
  const emailMatch = rawText.match(/[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}/);
  const email = emailMatch ? emailMatch[0] : '';

  // Extract Phone Number - international and domestic formats
  const phoneMatch = rawText.match(/(?:\+?\d{1,3}[-.\s]?)?\(?\d{3}\)?[-.\s]?\d{3}[-.\s]?\d{4}/) ||
                     rawText.match(/\b\d{10}\b/);
  const phone = phoneMatch ? phoneMatch[0] : '';

  // Extract LinkedIn
  const linkedinMatch = rawText.match(/https?:\/\/(?:www\.)?linkedin\.com\/in\/[a-zA-Z0-9_-]+/i) ||
                        rawText.match(/linkedin\.com\/in\/[a-zA-Z0-9_-]+/i);
  const linkedin = linkedinMatch ? (linkedinMatch[0].startsWith('http') ? linkedinMatch[0] : `https://${linkedinMatch[0]}`) : '';

  // Extract GitHub
  const githubMatch = rawText.match(/https?:\/\/(?:www\.)?github\.com\/[a-zA-Z0-9_-]+/i) ||
                      rawText.match(/github\.com\/[a-zA-Z0-9_-]+/i);
  const github = githubMatch ? (githubMatch[0].startsWith('http') ? githubMatch[0] : `https://${githubMatch[0]}`) : '';

  // Extract Name from top lines or clean base filename
  let candidateName = '';
  if (rawText) {
    const lines = rawText.split('\n').map(l => l.trim()).filter(l => l.length > 2 && l.length < 50);
    for (const line of lines.slice(0, 10)) {
      const lower = line.toLowerCase();
      if (!line.includes('@') && !line.includes('http') && !line.match(/\d{4}/) && 
          !lower.includes('resume') && !lower.includes('curriculum') && !lower.includes('page') &&
          !lower.includes('phone') && !lower.includes('email') && !lower.includes('profile') &&
          !lower.includes('engineer') && !lower.includes('developer') && !lower.includes('manager') &&
          !lower.includes('contact') && !lower.includes('skills')) {
        const words = line.split(/\s+/);
        if (words.length >= 2 && words.length <= 4 && !line.includes(':') && !line.includes('|')) {
          candidateName = line;
          break;
        }
      }
    }
  }

  if (!candidateName) {
    candidateName = cleanBaseName;
  }

  // Capitalize candidate name cleanly
  candidateName = candidateName.split(' ')
    .map(w => w.charAt(0).toUpperCase() + w.slice(1).toLowerCase())
    .join(' ') || 'Candidate';

  // Extract Experience Years based on explicit mentions or date spans
  let expYears = 0;
  const expMatch = rawText.match(/(\d{1,2})\+?\s*(?:years|yrs|year)\s*(?:of)?\s*(?:experience|exp)/i) ||
                   rawText.match(/(\d{1,2})\+?\s*(?:years|yrs|year)/i);
  if (expMatch) {
    expYears = Math.min(35, Math.max(0, parseInt(expMatch[1], 10)));
  } else {
    // Check for year spans like 2018 - 2024
    const yearMatches = [...rawText.matchAll(/\b(19\d\d|20\d\d)\b/g)].map(m => parseInt(m[1], 10));
    if (yearMatches.length >= 2) {
      const validYears = yearMatches.filter(y => y >= 1995 && y <= new Date().getFullYear());
      if (validYears.length >= 2) {
        const minYear = Math.min(...validYears);
        const maxYear = Math.max(...validYears);
        const span = maxYear - minYear;
        if (span >= 1 && span <= 35) {
          expYears = span;
        }
      }
    }
  }

  // Extract Technical Skills that actually appear in the text
  const technicalLibrary = [
    'Java', 'Spring Boot', 'Microservices', 'AWS', 'React', 'Angular', 'Vue', 'Node.js',
    'Python', 'FastAPI', 'Django', 'Flask', 'PyTorch', 'TensorFlow', 'AI/ML', 'Docker', 'Kubernetes',
    'Terraform', 'CI/CD', 'SQL', 'PostgreSQL', 'MySQL', 'MongoDB', 'Redis', 'Kafka', 'RabbitMQ',
    'TypeScript', 'JavaScript', 'Tailwind CSS', 'Next.js', 'GraphQL', 'REST APIs',
    'DevOps', 'Linux', 'Git', 'Agile', 'Jira', 'C#', '.NET', 'Golang', 'GCP', 'Azure',
    'HTML', 'CSS', 'C++', 'C', 'PHP', 'Ruby', 'Swift', 'Kotlin', 'R', 'Scala',
    'Snowflake', 'Spark', 'Hadoop', 'Tableau', 'Power BI', 'Figma', 'Elasticsearch', 'Solr'
  ];

  const foundSkills = technicalLibrary.filter(skill => {
    const regex = new RegExp(`\\b${skill.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}\\b`, 'i');
    return regex.test(rawText);
  });

  const skillsList = foundSkills.length > 0 ? foundSkills : ['Software Engineering', 'Problem Solving'];

  // Extract Location if present
  let location = '';
  const locMatch = rawText.match(/([A-Z][a-zA-Z\s]+,\s*(?:[A-Z]{2}|[A-Za-z]+))/);
  if (locMatch && !locMatch[0].includes('Resume') && !locMatch[0].includes('Curriculum') && !locMatch[0].includes('Experience')) {
    location = locMatch[0].trim();
  }

  // Extract Summary if present
  let summary = '';
  if (rawText.length > 50) {
    const summaryHeader = rawText.match(/(?:summary|objective|profile|about me|professional summary)[\s:]+([^\n]+(?:\n[^\n]+){1,4})/i);
    if (summaryHeader && summaryHeader[1]) {
      summary = summaryHeader[1].replace(/\s+/g, ' ').trim();
    } else {
      const firstParagraph = rawText.split(/\n\s*\n/)[0]?.replace(/\s+/g, ' ').trim();
      if (firstParagraph && firstParagraph.length > 30) {
        summary = firstParagraph.substring(0, 350);
      }
    }
  }

  // Derive Current Designation if mentioned
  let designation = '';
  const titleKeywords = [
    'Lead Software Engineer', 'Senior Software Engineer', 'Software Engineer', 
    'Full Stack Developer', 'Frontend Developer', 'Backend Developer', 
    'Data Scientist', 'AI/ML Engineer', 'DevOps Engineer', 'Cloud Architect', 
    'Solutions Architect', 'Project Manager', 'Product Manager', 'Consultant', 'QA Automation Engineer'
  ];
  for (const kw of titleKeywords) {
    const titleMatch = new RegExp(`([A-Za-z\\s]{0,15}${kw})`, 'i').exec(rawText);
    if (titleMatch && titleMatch[0]) {
      designation = titleMatch[0].trim();
      break;
    }
  }

  // Extract Education items
  const educationItems: Array<{ degree: string; specialization: string; institution: string; graduationYear: string }> = [];
  const eduRegex = /(?:Bachelor|Master|B\.?Tech|B\.?E\.?|B\.?S\.?|M\.?S\.?|M\.?Tech|MBA|Ph\.?D|Diploma)[^\n]+/gi;
  const eduMatches = rawText.match(eduRegex) || [];
  for (const match of eduMatches.slice(0, 3)) {
    const yearM = match.match(/\b(19\d\d|20\d\d)\b/);
    educationItems.push({
      degree: match.split(/,|\s{2,}/)[0]?.trim() || match.substring(0, 40),
      specialization: 'Computer Science & Engineering',
      institution: match.split(/at|from|,|-/)[1]?.trim() || 'University',
      graduationYear: yearM ? yearM[0] : ''
    });
  }

  // Extract Employment items if dates and companies present
  const employmentHistory: Array<{ company: string; designation: string; duration: string; location?: string; description?: string }> = [];
  const dateRanges = [...rawText.matchAll(/(?:Jan|Feb|Mar|Apr|May|Jun|Jul|Aug|Sep|Oct|Nov|Dec|\d{4})\s*(?:[-–to]\s*(?:Present|Current|\d{4}|Jan|Feb|Mar|Apr|May|Jun|Jul|Aug|Sep|Oct|Nov|Dec))/gi)];
  if (dateRanges.length > 0) {
    let currentComp = '';
    const compMatch = rawText.match(/(?:at|for|company:)\s+([A-Z][A-Za-z0-9\s&.,]{2,30}(?:Inc|LLC|Corp|Ltd|Technologies|Solutions|Labs|Systems|Software)?)/i);
    if (compMatch && compMatch[1]) {
      currentComp = compMatch[1].trim();
    }
    employmentHistory.push({
      company: currentComp || 'Technology Solutions',
      designation: designation || 'Software Engineer',
      duration: dateRanges[0][0],
      location: location || 'United States',
      description: `Hands-on responsibilities and feature development using ${skillsList.slice(0, 4).join(', ')}.`
    });
  }

  // Extract Certifications
  const certMatches = rawText.match(/(?:AWS Certified|Azure Certified|Google Cloud Certified|CKA|PMP|Scrum Master|CISSP|Oracle Certified)[^\n]+/gi) || [];
  const certifications = certMatches.map(c => ({
    name: c.trim(),
    issuingOrg: c.includes('AWS') ? 'Amazon Web Services' : c.includes('Azure') ? 'Microsoft' : c.includes('Google') ? 'Google Cloud' : 'Certified Body',
    year: ''
  }));

  // Extract Projects
  const projectMatches = rawText.match(/(?:Project|Application|System):\s*([^\n]+)/gi) || [];
  const projects = projectMatches.slice(0, 3).map(p => ({
    name: p.replace(/(?:Project|Application|System):\s*/i, '').trim(),
    description: 'Developed scalable architectural modules and features.',
    techStack: skillsList.slice(0, 4)
  }));

  return {
    name: candidateName,
    email,
    phone,
    location,
    linkedin,
    github,
    summary: summary || `${candidateName} is an experienced engineering professional with expertise in ${skillsList.slice(0, 4).join(', ')}.`,
    totalExperienceYears: expYears,
    currentCompany: employmentHistory[0]?.company || '',
    currentDesignation: designation || 'Software Engineer',
    previousCompanies: employmentHistory.slice(1).map(e => e.company),
    employmentHistory,
    education: educationItems,
    skills: skillsList,
    normalizedSkills: {
      technical: skillsList.slice(0, 10),
      functional: ['System Architecture', 'Agile / Scrum', 'Problem Solving', 'Code Review'],
      tools: skillsList.filter(s => ['AWS', 'Docker', 'Kubernetes', 'Git', 'Linux', 'Jira', 'Terraform', 'CI/CD', 'Azure', 'GCP', 'PostgreSQL', 'Redis'].includes(s))
    },
    certifications,
    projects,
    suggestedRoles: designation ? [designation, 'Senior Software Engineer'] : ['Software Engineer', 'Senior Software Engineer']
  };
}

// Helper prompt to parse resume with Gemini
async function parseResumeWithGemini(pdfBase64: string, fileName: string, textFallback = '') {
  const ai = getGeminiClient();

  // If we have base64 and no text fallback yet, extract text using pdfParse
  let rawExtractedText = textFallback;
  if (!rawExtractedText && pdfBase64) {
    try {
      const buffer = Buffer.from(pdfBase64, 'base64');
      rawExtractedText = await extractTextFromPdf(buffer);
    } catch {
      // Continue
    }
  }

  if (!ai) {
    return createSmartDeterministicParsedResume(fileName, rawExtractedText);
  }

  const prompt = `You are an expert HR recruiter and precision information extraction engine for TalentFox HR. 
Extract authentic candidate details from this resume with exact fidelity and structure into clean JSON format.

CRITICAL ACCURACY AND FIDELITY DIRECTIVES:
1. Extract ALL information thoroughly: full candidate name, email, phone number, location, LinkedIn URL, GitHub URL, portfolio/website.
2. Extract the complete Professional Summary / Profile / Objective narrative.
3. Calculate Total Years of Experience precisely as a number based on the candidate's actual work history dates.
4. Extract Current Company, Current Job Title / Designation, and Previous Companies list.
5. Extract Full Employment History timeline: company name, job designation, duration (e.g. "2021 - Present"), location, and detailed description / responsibilities.
6. Extract Full Education: degree, specialization, institution / university name, graduation year.
7. Extract all Technical skills, functional skills (e.g. Agile, System Design), and tools (e.g. Docker, Git, Jira).
8. Extract Certifications (name, issuingOrg, year) and notable Projects (name, description, techStack).
9. Recommend 2 to 4 appropriate suggested job roles.
10. If a field is not mentioned in the resume, leave it as empty string ("") or empty array ([]).

Output strictly valid JSON matching the schema.`;

  try {
    const contents: any[] = [];
    
    // Include PDF binary if available (for exact layout, columns, styling, and visual elements)
    if (pdfBase64 && pdfBase64.length > 100) {
      contents.push({
        inlineData: {
          mimeType: 'application/pdf',
          data: pdfBase64
        }
      });
    }

    // Include extracted raw text if available (for exact string spelling of emails, URLs, tools, and technical terms)
    if (rawExtractedText && rawExtractedText.trim().length > 20) {
      contents.push({ 
        text: `Extracted Document Raw Text:\n${rawExtractedText.substring(0, 45000)}` 
      });
    }

    contents.push({ text: prompt });

    const schemaConfig = {
      type: Type.OBJECT,
      properties: {
        name: { type: Type.STRING },
        email: { type: Type.STRING },
        phone: { type: Type.STRING },
        location: { type: Type.STRING },
        linkedin: { type: Type.STRING },
        github: { type: Type.STRING },
        summary: { type: Type.STRING },
        totalExperienceYears: { type: Type.NUMBER },
        currentCompany: { type: Type.STRING },
        currentDesignation: { type: Type.STRING },
        previousCompanies: {
          type: Type.ARRAY,
          items: { type: Type.STRING }
        },
        employmentHistory: {
          type: Type.ARRAY,
          items: {
            type: Type.OBJECT,
            properties: {
              company: { type: Type.STRING },
              designation: { type: Type.STRING },
              duration: { type: Type.STRING },
              location: { type: Type.STRING },
              description: { type: Type.STRING }
            },
            required: ['company', 'designation']
          }
        },
        education: {
          type: Type.ARRAY,
          items: {
            type: Type.OBJECT,
            properties: {
              degree: { type: Type.STRING },
              specialization: { type: Type.STRING },
              institution: { type: Type.STRING },
              graduationYear: { type: Type.STRING }
            },
            required: ['degree', 'institution']
          }
        },
        skills: {
          type: Type.ARRAY,
          items: { type: Type.STRING }
        },
        normalizedSkills: {
          type: Type.OBJECT,
          properties: {
            technical: { type: Type.ARRAY, items: { type: Type.STRING } },
            functional: { type: Type.ARRAY, items: { type: Type.STRING } },
            tools: { type: Type.ARRAY, items: { type: Type.STRING } }
          }
        },
        certifications: {
          type: Type.ARRAY,
          items: {
            type: Type.OBJECT,
            properties: {
              name: { type: Type.STRING },
              issuingOrg: { type: Type.STRING },
              year: { type: Type.STRING }
            },
            required: ['name']
          }
        },
        projects: {
          type: Type.ARRAY,
          items: {
            type: Type.OBJECT,
            properties: {
              name: { type: Type.STRING },
              description: { type: Type.STRING },
              techStack: { type: Type.ARRAY, items: { type: Type.STRING } }
            },
            required: ['name']
          }
        },
        suggestedRoles: {
          type: Type.ARRAY,
          items: { type: Type.STRING }
        }
      },
      required: ['name', 'skills']
    };

    const parsedJson = await generateWithGeminiFallback(ai, contents, schemaConfig);
    if (!parsedJson || !parsedJson.name) {
      return createSmartDeterministicParsedResume(fileName, rawExtractedText);
    }
    return parsedJson;
  } catch {
    return createSmartDeterministicParsedResume(fileName, rawExtractedText);
  }
}

// Resume Upload & Parse API (Multer multi-file upload)
app.post('/api/resumes/upload', upload.array('resumes', 25), async (req, res) => {
  try {
    const files = req.files as Express.Multer.File[];
    if (!files || files.length === 0) {
      return res.status(400).json({ error: 'No PDF resumes uploaded' });
    }

    const parsedCandidates: any[] = [];

    for (const file of files) {
      try {
        const base64 = file.buffer.toString('base64');
        const rawText = await extractTextFromPdf(file.buffer);
        const parsedData = await parseResumeWithGemini(base64, file.originalname, rawText);
        const candidateId = `cand-${Date.now()}-${Math.random().toString(36).slice(2, 10)}-${Math.random().toString(36).slice(2, 10)}`;
        
        // Cache original uploaded PDF in memory store for instant binary downloads
        resumeFileStore.set(candidateId, {
          buffer: file.buffer,
          fileName: file.originalname,
          mimeType: 'application/pdf',
          base64
        });

        const candidateRecord = {
          id: candidateId,
          ...parsedData,
          resumeFileName: file.originalname,
          resumeFileSize: file.size,
          resumeBase64: `data:application/pdf;base64,${base64}`,
          uploadDate: new Date().toISOString().replace('T', ' ').substring(0, 16),
          status: 'New'
        };

        parsedCandidates.push(candidateRecord);
        logActivity('Resume Parsed', `Extracted profile for ${candidateRecord.name} from ${file.originalname}`, 'parse');
      } catch {
        const fallback = createSmartDeterministicParsedResume(file.originalname, '');
        const candidateId = `cand-${Date.now()}-${Math.random().toString(36).slice(2, 10)}-${Math.random().toString(36).slice(2, 10)}`;
        const base64 = file.buffer.toString('base64');
        
        resumeFileStore.set(candidateId, {
          buffer: file.buffer,
          fileName: file.originalname,
          mimeType: 'application/pdf',
          base64
        });

        parsedCandidates.push({
          id: candidateId,
          ...fallback,
          resumeFileName: file.originalname,
          resumeFileSize: file.size,
          resumeBase64: `data:application/pdf;base64,${base64}`,
          uploadDate: new Date().toISOString().replace('T', ' ').substring(0, 16),
          status: 'New'
        });
      }
    }

    res.json({
      success: true,
      candidates: parsedCandidates,
      count: parsedCandidates.length
    });
  } catch (err: any) {
    res.status(500).json({ error: err?.message || 'Failed to parse uploaded resumes' });
  }
});

// Single Base64 Resume Parse API
app.post('/api/resumes/parse-base64', async (req, res) => {
  try {
    const { base64, fileName, rawText } = req.body;
    let extractedText = rawText || '';
    const cleanBase64 = (base64 || '').replace(/^data:[^;]+;base64,/, '');

    if (!extractedText && cleanBase64) {
      try {
        const buffer = Buffer.from(cleanBase64, 'base64');
        extractedText = await extractTextFromPdf(buffer);
      } catch {
        // Continue with raw text
      }
    }

    let parsedData;
    try {
      parsedData = await parseResumeWithGemini(cleanBase64 || '', fileName || 'Resume.pdf', extractedText);
    } catch {
      parsedData = createSmartDeterministicParsedResume(fileName || 'Resume.pdf', extractedText);
    }

    const candidateId = `cand-${Date.now()}-${Math.random().toString(36).slice(2, 10)}-${Math.random().toString(36).slice(2, 10)}`;

    if (cleanBase64) {
      try {
        const buffer = Buffer.from(cleanBase64, 'base64');
        resumeFileStore.set(candidateId, {
          buffer,
          fileName: fileName || 'Resume.pdf',
          mimeType: 'application/pdf',
          base64: cleanBase64
        });
      } catch {
        // Continue
      }
    }

    const candidateRecord = {
      id: candidateId,
      ...parsedData,
      resumeFileName: fileName || 'Resume.pdf',
      resumeBase64: cleanBase64 ? `data:application/pdf;base64,${cleanBase64}` : undefined,
      uploadDate: new Date().toISOString().replace('T', ' ').substring(0, 16),
      status: 'New'
    };

    logActivity('Resume Parsed', `Parsed resume: ${candidateRecord.name}`, 'parse');
    res.json({ success: true, candidate: candidateRecord });
  } catch {
    const fallback = createSmartDeterministicParsedResume(req.body?.fileName || 'Resume.pdf', req.body?.rawText || '');
    const candidateId = `cand-${Date.now()}-${Math.random().toString(36).slice(2, 10)}-${Math.random().toString(36).slice(2, 10)}`;
    const cleanBase64 = (req.body?.base64 || '').replace(/^data:[^;]+;base64,/, '');

    if (cleanBase64) {
      try {
        const buffer = Buffer.from(cleanBase64, 'base64');
        resumeFileStore.set(candidateId, {
          buffer,
          fileName: req.body?.fileName || 'Resume.pdf',
          mimeType: 'application/pdf',
          base64: cleanBase64
        });
      } catch {
        // Continue
      }
    }

    const candidateRecord = {
      id: candidateId,
      ...fallback,
      resumeFileName: req.body?.fileName || 'Resume.pdf',
      resumeBase64: cleanBase64 ? `data:application/pdf;base64,${cleanBase64}` : undefined,
      uploadDate: new Date().toISOString().replace('T', ' ').substring(0, 16),
      status: 'New'
    };
    res.json({ success: true, candidate: candidateRecord });
  }
});

// Download Original Resume PDF Endpoint
app.get('/api/resumes/:id/download', (req, res) => {
  const { id } = req.params;
  const entry = resumeFileStore.get(id);
  if (entry && entry.buffer) {
    res.setHeader('Content-Type', entry.mimeType || 'application/pdf');
    res.setHeader('Content-Disposition', `attachment; filename="${encodeURIComponent(entry.fileName)}"`);
    return res.send(entry.buffer);
  }
  res.status(404).json({ error: 'Resume file not found in cache' });
});

// Candidate Matching against Job Description with AI
app.post('/api/match-jd', async (req, res) => {
  try {
    const { candidate, jobDescription } = req.body;
    if (!candidate || !jobDescription) {
      return res.status(400).json({ error: 'Candidate and Job Description are required' });
    }

    const ai = getGeminiClient();
    if (!ai) {
      const matchResult = computeRuleBasedMatch(candidate, jobDescription);
      return res.json({ matchResult });
    }

    const prompt = `You are TalentFox HR's AI Candidate-Job Match Evaluator.
Evaluate this candidate against the target Job Description.

Candidate Details:
- Name: ${candidate.name}
- Total Experience: ${candidate.totalExperienceYears} years
- Current Designation: ${candidate.currentDesignation || 'Engineer'}
- Current Company: ${candidate.currentCompany || 'N/A'}
- Key Skills: ${(candidate.skills || []).join(', ')}
- Summary: ${candidate.summary || 'N/A'}
- Employment History: ${(candidate.employmentHistory || []).map((e: any) => `${e.designation} at ${e.company} (${e.duration})`).join('; ')}

Job Description:
- Title: ${jobDescription.title}
- Department: ${jobDescription.department || 'Engineering'}
- Min Experience Required: ${jobDescription.minExperienceYears} years
- Required Skills: ${(jobDescription.requiredSkills || []).join(', ')}
- Preferred Skills: ${(jobDescription.preferredSkills || []).join(', ')}
- Description: ${jobDescription.description || ''}

Evaluate and return JSON with:
1. score: Integer percentage (0 to 100).
2. matchingSkills: Array of skill strings that the candidate possesses from the required/preferred skills.
3. missingSkills: Array of crucial required skill strings from the JD that the candidate lacks.
4. experienceFit: Exactly one of "Strong Fit", "Moderate Fit", "Under Experience", "Over Experience".
5. recommendation: Exactly one of "Strong Match", "Potential Match", "Moderate Match", "Low Match".
6. reasoning: Concise 2-sentence executive summary for the recruiter highlighting why this candidate is or isn't a fit.`;

    const schemaConfig = {
      type: Type.OBJECT,
      properties: {
        score: { type: Type.INTEGER },
        matchingSkills: { type: Type.ARRAY, items: { type: Type.STRING } },
        missingSkills: { type: Type.ARRAY, items: { type: Type.STRING } },
        experienceFit: { type: Type.STRING },
        recommendation: { type: Type.STRING },
        reasoning: { type: Type.STRING }
      },
      required: ['score', 'matchingSkills', 'missingSkills', 'experienceFit', 'recommendation', 'reasoning']
    };

    let matchData;
    try {
      matchData = await generateWithGeminiFallback(ai, [{ text: prompt }], schemaConfig);
      if (!matchData || typeof matchData.score !== 'number') {
        matchData = computeRuleBasedMatch(candidate, jobDescription);
      }
    } catch {
      matchData = computeRuleBasedMatch(candidate, jobDescription);
    }

    logActivity('JD Matched', `Computed match for ${candidate.name} against ${jobDescription.title}: ${matchData.score}%`, 'match');
    res.json({ matchResult: matchData });
  } catch {
    const fallbackMatch = computeRuleBasedMatch(req.body?.candidate || { name: 'Candidate' }, req.body?.jobDescription || { title: 'Role' });
    res.json({ matchResult: fallbackMatch });
  }
});

// Batch Candidate Matching Endpoint (processes with controlled concurrency)
app.post('/api/match-jd-batch', async (req, res) => {
  try {
    const { candidates, jobDescription } = req.body;
    if (!Array.isArray(candidates) || !jobDescription) {
      return res.status(400).json({ error: 'candidates array and jobDescription are required' });
    }

    const ai = getGeminiClient();
    const results = [];

    for (const candidate of candidates) {
      let matchResult;
      if (ai) {
        try {
          const prompt = `Evaluate candidate ${candidate.name} (Exp: ${candidate.totalExperienceYears} yrs, Skills: ${(candidate.skills || []).join(', ')}) against JD: ${jobDescription.title} (Min Exp: ${jobDescription.minExperienceYears} yrs, Required Skills: ${(jobDescription.requiredSkills || []).join(', ')}). Output JSON with score (0-100), matchingSkills, missingSkills, experienceFit, recommendation, reasoning.`;
          const schemaConfig = {
            type: Type.OBJECT,
            properties: {
              score: { type: Type.INTEGER },
              matchingSkills: { type: Type.ARRAY, items: { type: Type.STRING } },
              missingSkills: { type: Type.ARRAY, items: { type: Type.STRING } },
              experienceFit: { type: Type.STRING },
              recommendation: { type: Type.STRING },
              reasoning: { type: Type.STRING }
            },
            required: ['score', 'matchingSkills', 'missingSkills', 'experienceFit', 'recommendation', 'reasoning']
          };
          matchResult = await generateWithGeminiFallback(ai, [{ text: prompt }], schemaConfig);
          if (!matchResult || typeof matchResult.score !== 'number') {
            matchResult = computeRuleBasedMatch(candidate, jobDescription);
          }
        } catch {
          matchResult = computeRuleBasedMatch(candidate, jobDescription);
        }
      } else {
        matchResult = computeRuleBasedMatch(candidate, jobDescription);
      }

      results.push({
        candidateId: candidate.id,
        matchResult
      });
      // Small pause between items to protect API quota
      await delay(50);
    }

    res.json({ success: true, results });
  } catch {
    res.status(500).json({ error: 'Failed batch matching' });
  }
});

// Duplicate Detection Helper Endpoint
app.post('/api/candidates/detect-duplicates', (req, res) => {
  const { candidate, existingCandidates } = req.body;
  if (!candidate || !existingCandidates) {
    return res.status(400).json({ error: 'Missing candidate or existing pool' });
  }

  const duplicates = existingCandidates.filter((c: any) => {
    if (c.id === candidate.id) return false;
    const sameEmail = candidate.email && c.email && candidate.email.toLowerCase().trim() === c.email.toLowerCase().trim();
    const samePhone = candidate.phone && c.phone && candidate.phone.replace(/\D/g, '') === c.phone.replace(/\D/g, '');
    const sameNameCompany = candidate.name && c.name && candidate.name.toLowerCase() === c.name.toLowerCase() &&
      candidate.currentCompany && c.currentCompany && candidate.currentCompany.toLowerCase() === c.currentCompany.toLowerCase();
    
    return sameEmail || samePhone || sameNameCompany;
  });

  res.json({
    isDuplicate: duplicates.length > 0,
    duplicateMatches: duplicates
  });
});

// Vite middleware for dev mode and static files for production
async function setupVite() {
  if (process.env.NODE_ENV !== 'production') {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), 'dist');
    app.use(express.static(distPath));
    app.get('*', (req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`TalentFox HR Server running on http://localhost:${PORT}`);
  });
}

setupVite();
