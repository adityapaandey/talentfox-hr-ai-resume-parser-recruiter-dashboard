import ExcelJS from 'exceljs';
import { Candidate } from '../types';

export async function exportCandidatesToExcel(candidates: Candidate[], fileName = 'TalentFox_HR_Candidates') {
  if (!candidates || candidates.length === 0) return;

  const workbook = new ExcelJS.Workbook();
  workbook.creator = 'TalentFox ATS';
  workbook.lastModifiedBy = 'TalentFox ATS';
  workbook.created = new Date();
  workbook.modified = new Date();

  const worksheet = workbook.addWorksheet('Candidate Pool', {
    views: [{ state: 'frozen', ySplit: 1 }] // Freeze header row
  });

  // Define 32 comprehensive columns with tailored widths and keys
  worksheet.columns = [
    { header: 'Candidate ID', key: 'id', width: 16 },
    { header: 'Full Name', key: 'name', width: 25 },
    { header: 'Email Address', key: 'email', width: 30 },
    { header: 'Phone Number', key: 'phone', width: 20 },
    { header: 'Current Location', key: 'location', width: 22 },
    { header: 'LinkedIn URL', key: 'linkedin', width: 32 },
    { header: 'GitHub URL', key: 'github', width: 28 },
    { header: 'Total Experience (Years)', key: 'totalExperience', width: 24 },
    { header: 'Current Company', key: 'currentCompany', width: 26 },
    { header: 'Current Designation', key: 'currentDesignation', width: 28 },
    { header: 'Previous Companies', key: 'previousCompanies', width: 32 },
    { header: 'Professional Summary', key: 'summary', width: 55 },
    { header: 'Employment History', key: 'employmentHistory', width: 60 },
    { header: 'Education Details', key: 'education', width: 45 },
    { header: 'Key Skills', key: 'skills', width: 45 },
    { header: 'Technical Skills', key: 'technicalSkills', width: 38 },
    { header: 'Functional Skills', key: 'functionalSkills', width: 32 },
    { header: 'Tools & Platforms', key: 'tools', width: 32 },
    { header: 'Certifications', key: 'certifications', width: 35 },
    { header: 'Key Projects', key: 'projects', width: 50 },
    { header: 'Recommended Roles', key: 'recommendedRoles', width: 32 },
    { header: 'Match Score (%)', key: 'matchScore', width: 18 },
    { header: 'Match Recommendation', key: 'matchRecommendation', width: 24 },
    { header: 'Experience Fit', key: 'experienceFit', width: 20 },
    { header: 'AI Match Reasoning', key: 'matchReasoning', width: 50 },
    { header: 'Candidate Status', key: 'status', width: 20 },
    { header: 'Interview Schedule', key: 'interviewSchedule', width: 35 },
    { header: 'Duplicate Flag', key: 'duplicateFlag', width: 22 },
    { header: 'Recruiter Notes', key: 'recruiterNotes', width: 35 },
    { header: 'Resume File Name', key: 'resumeFileName', width: 32 },
    { header: 'Resume Size (KB)', key: 'resumeSize', width: 18 },
    { header: 'Applied Date / Timestamp', key: 'appliedDate', width: 26 }
  ];

  // Populate data rows
  candidates.forEach(c => {
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

    const row = worksheet.addRow({
      id: c.id,
      name: c.name || '',
      email: c.email || '',
      phone: c.phone || '',
      location: c.location || '',
      linkedin: c.linkedin || '',
      github: c.github || '',
      totalExperience: typeof c.totalExperienceYears === 'number' ? c.totalExperienceYears : (Number(c.totalExperienceYears) || 0),
      currentCompany: c.currentCompany || '',
      currentDesignation: c.currentDesignation || '',
      previousCompanies: prevCompaniesString,
      summary: c.summary || '',
      employmentHistory: empHistoryString,
      education: eduString,
      skills: allSkillsString,
      technicalSkills: techSkillsString,
      functionalSkills: funcSkillsString,
      tools: toolsString,
      certifications: certsString,
      projects: projectsString,
      recommendedRoles: rolesString,
      matchScore: c.matchResult ? `${c.matchResult.score}%` : 'N/A',
      matchRecommendation: c.matchResult ? c.matchResult.recommendation : 'Not Evaluated',
      experienceFit: c.matchResult ? c.matchResult.experienceFit : 'N/A',
      matchReasoning: c.matchResult ? c.matchResult.reasoning : '',
      status: c.status || 'New',
      interviewSchedule: interviewString,
      duplicateFlag: c.isDuplicate ? 'Yes (Duplicate Detected)' : 'No',
      recruiterNotes: c.recruiterNotes || '',
      resumeFileName: c.resumeFileName || '',
      resumeSize: c.resumeFileSize ? Math.round(c.resumeFileSize / 1024) : 'N/A',
      appliedDate: c.uploadDate || ''
    });

    row.height = 22;
  });

  // Enable Auto-Filter on all 32 columns
  worksheet.autoFilter = {
    from: { row: 1, column: 1 },
    to: { row: 1, column: 32 }
  };

  // Format Header Row with Royal Olive Green Background, Bold White Text, and Borders
  const headerRow = worksheet.getRow(1);
  headerRow.height = 32;

  headerRow.eachCell((cell, colNumber) => {
    cell.font = {
      name: 'Segoe UI',
      size: 11,
      bold: true,
      color: { argb: 'FFFFFFFF' } // Crisp White Bold Text
    };

    // Rich Olive Green Solid Background (#445626)
    cell.fill = {
      type: 'pattern',
      pattern: 'solid',
      fgColor: { argb: 'FF445626' }
    };

    cell.alignment = {
      vertical: 'middle',
      horizontal: 'center',
      wrapText: false
    };

    cell.border = {
      top: { style: 'medium', color: { argb: 'FF2D381B' } },
      bottom: { style: 'medium', color: { argb: 'FF2D381B' } },
      left: { style: 'thin', color: { argb: 'FF556B2F' } },
      right: { style: 'thin', color: { argb: 'FF556B2F' } }
    };
  });

  // Format Data Rows with clean typography, borders, and subtle zebra striping
  for (let rowIndex = 2; rowIndex <= worksheet.rowCount; rowIndex++) {
    const row = worksheet.getRow(rowIndex);
    const isEven = rowIndex % 2 === 0;

    row.eachCell((cell, colNumber) => {
      cell.font = {
        name: 'Segoe UI',
        size: 10,
        color: { argb: 'FF1E293B' }
      };

      // Subtle alternating row tint
      cell.fill = {
        type: 'pattern',
        pattern: 'solid',
        fgColor: { argb: isEven ? 'FFFFFFFF' : 'FFF8FAFC' }
      };

      // Clean cell border
      cell.border = {
        top: { style: 'thin', color: { argb: 'FFE2E8F0' } },
        bottom: { style: 'thin', color: { argb: 'FFE2E8F0' } },
        left: { style: 'thin', color: { argb: 'FFF1F5F9' } },
        right: { style: 'thin', color: { argb: 'FFF1F5F9' } }
      };

      // Align numbers and badges center, text left
      if ([1, 4, 8, 22, 24, 26, 28, 31, 32].includes(colNumber)) {
        cell.alignment = { vertical: 'middle', horizontal: 'center' };
      } else {
        cell.alignment = { vertical: 'middle', horizontal: 'left', wrapText: false };
      }
    });
  }

  // Export buffer & trigger direct browser download
  const buffer = await workbook.xlsx.writeBuffer();
  const blob = new Blob([buffer], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' });
  const url = URL.createObjectURL(blob);
  const anchor = document.createElement('a');
  anchor.href = url;
  const dateStamp = new Date().toISOString().slice(0, 10);
  anchor.download = `${fileName}_${dateStamp}.xlsx`;
  document.body.appendChild(anchor);
  anchor.click();
  document.body.removeChild(anchor);
  URL.revokeObjectURL(url);
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
      .map(e => `${e.degree || ''} in ${e.specialization || 'Relevant Field'} (${e.institution || 'N/A'}${e.graduationYear ? `, ${e.graduationYear}` : ''})`.trim())
      .join(' | ');

    const prevCompaniesString = (c.previousCompanies || []).join(', ');
    const empHistoryString = (c.employmentHistory || [])
      .map(h => `${h.designation || 'Role'} at ${h.company || 'Company'} [${h.duration || 'N/A'}]${h.location ? ` (${h.location})` : ''}: ${h.description || ''}`.trim())
      .join(' | ');

    const allSkillsString = (c.skills || []).join(', ');
    const techSkillsString = (c.normalizedSkills?.technical || []).join(', ');
    const funcSkillsString = (c.normalizedSkills?.functional || []).join(', ');
    const toolsString = (c.normalizedSkills?.tools || []).join(', ');

    const certsString = (c.certifications || [])
      .map(cert => `${cert.name} (${cert.issuingOrg || 'N/A'}${cert.year ? `, ${cert.year}` : ''})`)
      .join(' | ');

    const projectsString = (c.projects || [])
      .map(p => `${p.name}: ${p.description || ''}${p.techStack && p.techStack.length ? ` [Tech: ${p.techStack.join(', ')}]` : ''}`.trim())
      .join(' | ');

    const rolesString = (c.suggestedRoles || []).join(', ');

    const interviewString = c.interviewSchedule
      ? `${c.interviewSchedule.date} at ${c.interviewSchedule.time} (${c.interviewSchedule.type}) with ${c.interviewSchedule.interviewer}${c.interviewSchedule.notes ? ` - Notes: ${c.interviewSchedule.notes}` : ''}`
      : 'None';

    return {
      'Candidate ID': escapeCSV(c.id),
      'Full Name': escapeCSV(c.name || ''),
      'Email Address': escapeCSV(c.email || ''),
      'Phone Number': escapeCSV(c.phone || ''),
      'Current Location': escapeCSV(c.location || ''),
      'LinkedIn URL': escapeCSV(c.linkedin || ''),
      'GitHub URL': escapeCSV(c.github || ''),
      'Total Experience (Years)': escapeCSV(c.totalExperienceYears),
      'Current Company': escapeCSV(c.currentCompany || ''),
      'Current Designation': escapeCSV(c.currentDesignation || ''),
      'Previous Companies': escapeCSV(prevCompaniesString),
      'Professional Summary': escapeCSV(c.summary || ''),
      'Employment History': escapeCSV(empHistoryString),
      'Education Details': escapeCSV(eduString),
      'Key Skills': escapeCSV(allSkillsString),
      'Technical Skills': escapeCSV(techSkillsString),
      'Functional Skills': escapeCSV(funcSkillsString),
      'Tools & Platforms': escapeCSV(toolsString),
      'Certifications': escapeCSV(certsString),
      'Key Projects': escapeCSV(projectsString),
      'Recommended Roles': escapeCSV(rolesString),
      'Match Score (%)': escapeCSV(c.matchResult ? `${c.matchResult.score}%` : 'N/A'),
      'Match Recommendation': escapeCSV(c.matchResult ? c.matchResult.recommendation : 'Not Evaluated'),
      'Experience Fit': escapeCSV(c.matchResult ? c.matchResult.experienceFit : 'N/A'),
      'AI Match Reasoning': escapeCSV(c.matchResult ? c.matchResult.reasoning : ''),
      'Candidate Status': escapeCSV(c.status || 'New'),
      'Interview Schedule': escapeCSV(interviewString),
      'Duplicate Flag': escapeCSV(c.isDuplicate ? 'Yes (Duplicate Detected)' : 'No'),
      'Recruiter Notes': escapeCSV(c.recruiterNotes || ''),
      'Resume File Name': escapeCSV(c.resumeFileName || ''),
      'Resume Size (KB)': escapeCSV(c.resumeFileSize ? Math.round(c.resumeFileSize / 1024) : 'N/A'),
      'Applied Date / Timestamp': escapeCSV(c.uploadDate || '')
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
  URL.revokeObjectURL(url);
}
