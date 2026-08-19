import * as XLSX from 'xlsx';
import { Candidate } from '../types';

export function exportCandidatesToExcel(candidates: Candidate[], fileName = 'TalentFox_HR_Candidates') {
  if (!candidates || candidates.length === 0) return;

  const rows = candidates.map(c => {
    // Format Education string
    const eduString = (c.education || [])
      .map(e => `${e.degree || ''} in ${e.specialization || 'Relevant Field'} (${e.institution || 'N/A'}${e.graduationYear ? `, ${e.graduationYear}` : ''})`.trim())
      .join(' | ');

    // Format Previous Companies
    const prevCompaniesString = (c.previousCompanies || []).join(', ');

    // Format Employment History summary
    const empHistoryString = (c.employmentHistory || [])
      .map(h => `${h.designation || 'Role'} at ${h.company || 'Company'} [${h.duration || 'N/A'}]${h.location ? ` (${h.location})` : ''}: ${h.description || ''}`.trim())
      .join(' | ');

    // Format Skills
    const allSkillsString = (c.skills || []).join(', ');
    const techSkillsString = (c.normalizedSkills?.technical || []).join(', ');
    const funcSkillsString = (c.normalizedSkills?.functional || []).join(', ');
    const toolsString = (c.normalizedSkills?.tools || []).join(', ');

    // Format Certifications
    const certsString = (c.certifications || [])
      .map(cert => `${cert.name} (${cert.issuingOrg || 'N/A'}${cert.year ? `, ${cert.year}` : ''})`)
      .join(' | ');

    // Format Projects
    const projectsString = (c.projects || [])
      .map(p => `${p.name}: ${p.description || ''}${p.techStack && p.techStack.length ? ` [Tech: ${p.techStack.join(', ')}]` : ''}`.trim())
      .join(' | ');

    // Format Recommended Roles
    const rolesString = (c.suggestedRoles || []).join(', ');

    // Format Interview Schedule if any
    const interviewString = c.interviewSchedule
      ? `${c.interviewSchedule.date} at ${c.interviewSchedule.time} (${c.interviewSchedule.type}) with ${c.interviewSchedule.interviewer}${c.interviewSchedule.notes ? ` - Notes: ${c.interviewSchedule.notes}` : ''}`
      : 'None';

    return {
      'Candidate ID': c.id,
      'Full Name': c.name || '',
      'Email Address': c.email || '',
      'Phone Number': c.phone || '',
      'Current Location': c.location || '',
      'LinkedIn URL': c.linkedin || '',
      'GitHub URL': c.github || '',
      'Total Experience (Years)': typeof c.totalExperienceYears === 'number' ? c.totalExperienceYears : (Number(c.totalExperienceYears) || 0),
      'Current Company': c.currentCompany || '',
      'Current Designation': c.currentDesignation || '',
      'Previous Companies': prevCompaniesString,
      'Professional Summary': c.summary || '',
      'Employment History': empHistoryString,
      'Education Details': eduString,
      'Key Skills': allSkillsString,
      'Technical Skills': techSkillsString,
      'Functional Skills': funcSkillsString,
      'Tools & Platforms': toolsString,
      'Certifications': certsString,
      'Key Projects': projectsString,
      'Recommended Roles': rolesString,
      'Match Score (%)': c.matchResult ? `${c.matchResult.score}%` : 'N/A',
      'Match Recommendation': c.matchResult ? c.matchResult.recommendation : 'Not Evaluated',
      'Experience Fit': c.matchResult ? c.matchResult.experienceFit : 'N/A',
      'AI Match Reasoning': c.matchResult ? c.matchResult.reasoning : '',
      'Candidate Status': c.status || 'New',
      'Interview Schedule': interviewString,
      'Duplicate Flag': c.isDuplicate ? 'Yes (Duplicate Detected)' : 'No',
      'Recruiter Notes': c.recruiterNotes || '',
      'Resume File Name': c.resumeFileName || '',
      'Resume Size (KB)': c.resumeFileSize ? Math.round(c.resumeFileSize / 1024) : 'N/A',
      'Upload Date / Timestamp': c.uploadDate || ''
    };
  });

  const worksheet = XLSX.utils.json_to_sheet(rows);

  // Auto-fit column widths for clear readability in Excel
  worksheet['!cols'] = [
    { wch: 14 }, // Candidate ID
    { wch: 22 }, // Full Name
    { wch: 28 }, // Email Address
    { wch: 18 }, // Phone Number
    { wch: 20 }, // Current Location
    { wch: 32 }, // LinkedIn URL
    { wch: 28 }, // GitHub URL
    { wch: 22 }, // Total Experience (Years)
    { wch: 26 }, // Current Company
    { wch: 26 }, // Current Designation
    { wch: 30 }, // Previous Companies
    { wch: 50 }, // Professional Summary
    { wch: 60 }, // Employment History
    { wch: 45 }, // Education Details
    { wch: 45 }, // Key Skills
    { wch: 35 }, // Technical Skills
    { wch: 30 }, // Functional Skills
    { wch: 30 }, // Tools & Platforms
    { wch: 35 }, // Certifications
    { wch: 50 }, // Key Projects
    { wch: 30 }, // Recommended Roles
    { wch: 16 }, // Match Score (%)
    { wch: 22 }, // Match Recommendation
    { wch: 18 }, // Experience Fit
    { wch: 50 }, // AI Match Reasoning
    { wch: 18 }, // Candidate Status
    { wch: 35 }, // Interview Schedule
    { wch: 22 }, // Duplicate Flag
    { wch: 35 }, // Recruiter Notes
    { wch: 32 }, // Resume File Name
    { wch: 16 }, // Resume Size (KB)
    { wch: 22 }  // Upload Date / Timestamp
  ];

  const workbook = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(workbook, worksheet, 'Candidates');

  const dateStamp = new Date().toISOString().slice(0, 10);
  XLSX.writeFile(workbook, `${fileName}_${dateStamp}.xlsx`);
}

export function exportCandidatesToCSV(candidates: Candidate[], fileName = 'TalentFox_HR_Candidates') {
  if (!candidates || candidates.length === 0) return;

  const escapeCSV = (val: any) => {
    if (val === null || val === undefined) return '""';
    const str = String(val).replace(/"/g, '""');
    return `"${str}"`;
  };

  const rows = candidates.map(c => {
    const eduString = (c.education || [])
      .map(e => `${e.degree || ''} in ${e.specialization || ''} (${e.institution || ''}${e.graduationYear ? `, ${e.graduationYear}` : ''})`)
      .join(' | ');

    const prevCompaniesString = (c.previousCompanies || []).join(', ');
    const empHistoryString = (c.employmentHistory || [])
      .map(h => `${h.designation} at ${h.company} [${h.duration}]`)
      .join(' | ');

    const allSkillsString = (c.skills || []).join(', ');
    const certsString = (c.certifications || []).map(cert => cert.name).join(' | ');
    const projectsString = (c.projects || []).map(p => p.name).join(' | ');

    return {
      'Candidate ID': escapeCSV(c.id),
      'Full Name': escapeCSV(c.name),
      'Email Address': escapeCSV(c.email),
      'Phone Number': escapeCSV(c.phone),
      'Current Location': escapeCSV(c.location),
      'LinkedIn URL': escapeCSV(c.linkedin),
      'GitHub URL': escapeCSV(c.github || ''),
      'Total Experience (Years)': escapeCSV(c.totalExperienceYears),
      'Current Company': escapeCSV(c.currentCompany),
      'Current Designation': escapeCSV(c.currentDesignation),
      'Previous Companies': escapeCSV(prevCompaniesString),
      'Professional Summary': escapeCSV(c.summary),
      'Employment History': escapeCSV(empHistoryString),
      'Education Details': escapeCSV(eduString),
      'Key Skills': escapeCSV(allSkillsString),
      'Certifications': escapeCSV(certsString),
      'Key Projects': escapeCSV(projectsString),
      'Match Score (%)': escapeCSV(c.matchResult ? `${c.matchResult.score}%` : 'N/A'),
      'Match Recommendation': escapeCSV(c.matchResult ? c.matchResult.recommendation : 'Not Evaluated'),
      'Candidate Status': escapeCSV(c.status),
      'Resume File Name': escapeCSV(c.resumeFileName),
      'Upload Date': escapeCSV(c.uploadDate)
    };
  });

  const headers = Object.keys(rows[0]).join(',');
  const csvContent = [
    headers,
    ...rows.map(r => Object.values(r).join(','))
  ].join('\n');

  const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.setAttribute('href', url);
  link.setAttribute('download', `${fileName}_${new Date().toISOString().slice(0, 10)}.csv`);
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
}
