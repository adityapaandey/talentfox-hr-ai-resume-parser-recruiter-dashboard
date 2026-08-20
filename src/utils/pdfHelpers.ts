import { Candidate } from '../types';

// Convert File to Base64
export function fileToBase64(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.readAsDataURL(file);
    reader.onload = () => {
      const result = reader.result as string;
      // Extract base64 portion after data:application/pdf;base64,
      const base64 = result.split(',')[1] || result;
      resolve(base64);
    };
    reader.onerror = error => reject(error);
  });
}

// Convert Base64 string to binary PDF Blob
export function base64ToPdfBlob(base64Data: string): Blob {
  const cleanBase64 = base64Data.replace(/^data:[^;]+;base64,/, '').trim();
  const byteCharacters = atob(cleanBase64);
  const byteArrays: Uint8Array[] = [];

  const sliceSize = 1024;
  for (let offset = 0; offset < byteCharacters.length; offset += sliceSize) {
    const slice = byteCharacters.slice(offset, offset + sliceSize);
    const byteNumbers = new Array(slice.length);
    for (let i = 0; i < slice.length; i++) {
      byteNumbers[i] = slice.charCodeAt(i);
    }
    const byteArray = new Uint8Array(byteNumbers);
    byteArrays.push(byteArray);
  }

  return new Blob(byteArrays, { type: 'application/pdf' });
}

// Trigger browser download for a Blob
export function triggerBlobDownload(blob: Blob, fileName: string) {
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = fileName;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  setTimeout(() => URL.revokeObjectURL(url), 1000);
}

// Helper to escape PDF text strings
function escapePdfText(str: string): string {
  return (str || '')
    .replace(/\\/g, '\\\\')
    .replace(/\(/g, '\\(')
    .replace(/\)/g, '\\)')
    .replace(/[^\x20-\x7E]/g, ' '); // keep printable ASCII
}

// Generate formatted PDF Blob for candidates when raw PDF binary is unavailable
export function generateComprehensiveCandidatePdfBlob(candidate: Partial<Candidate>): Blob {
  const name = escapePdfText(candidate.name || 'Candidate');
  const title = escapePdfText(candidate.currentDesignation || 'Professional');
  const company = escapePdfText(candidate.currentCompany || 'N/A');
  const email = escapePdfText(candidate.email || '');
  const phone = escapePdfText(candidate.phone || '');
  const location = escapePdfText(candidate.location || '');
  const exp = escapePdfText(`${candidate.totalExperienceYears || 0} Years`);
  const summary = escapePdfText(candidate.summary || '');
  const skills = escapePdfText((candidate.skills || []).join(', '));
  
  // Format employment history lines
  const expLines = (candidate.employmentHistory || []).slice(0, 3).map(e => 
    `(${escapePdfText(`* ${e.designation || 'Role'} - ${e.company || 'Company'} (${e.duration || ''})`)}) Tj T* (${escapePdfText(`  ${(e.description || '').substring(0, 90)}`)}) Tj T*`
  ).join('\n');

  // Format education lines
  const eduLines = (candidate.education || []).slice(0, 2).map(ed => 
    `(${escapePdfText(`* ${ed.degree || 'Degree'} - ${ed.institution || 'University'} (${ed.graduationYear || ''})`)}) Tj T*`
  ).join('\n');

  const pdfStream = `
BT
/F1 18 Tf
50 740 Td
(${name}) Tj
/F2 11 Tf
0 -18 Td
(${title} | ${company}) Tj
/F3 9 Tf
0 -16 Td
(Email: ${email} | Phone: ${phone} | Location: ${location} | Experience: ${exp}) Tj
0 -22 Td
/F1 12 Tf
(PROFESSIONAL SUMMARY) Tj
/F3 9 Tf
0 -14 Td
(${summary.substring(0, 110)}) Tj
0 -12 Td
(${summary.substring(110, 220)}) Tj
0 -20 Td
/F1 12 Tf
(TECHNICAL SKILLS) Tj
/F3 9 Tf
0 -14 Td
(${skills.substring(0, 110)}) Tj
0 -12 Td
(${skills.substring(110, 220)}) Tj
0 -20 Td
/F1 12 Tf
(WORK EXPERIENCE) Tj
/F3 9 Tf
0 -14 Td
${expLines || '(Details extracted from profile document)'}
0 -14 Td
/F1 12 Tf
(EDUCATION) Tj
/F3 9 Tf
0 -14 Td
${eduLines || '(Details extracted from profile document)'}
ET
`;

  const content = `%PDF-1.4
1 0 obj
<< /Title (${name} Resume) /Author (${name}) >>
endobj
2 0 obj
<< /Type /Catalog /Pages 3 0 R >>
endobj
3 0 obj
<< /Type /Pages /Kids [4 0 R] /Count 1 >>
endobj
4 0 obj
<< /Type /Page /Parent 3 0 R /MediaBox [0 0 612 792] /Contents 5 0 R /Resources << /Font << /F1 6 0 R /F2 7 0 R /F3 8 0 R >> >> >>
endobj
5 0 obj
<< /Length ${pdfStream.length + 50} >>
stream${pdfStream}
endstream
endobj
6 0 obj
<< /Type /Font /Subtype /Type1 /BaseFont /Helvetica-Bold >>
endobj
7 0 obj
<< /Type /Font /Subtype /Type1 /BaseFont /Helvetica-Oblique >>
endobj
8 0 obj
<< /Type /Font /Subtype /Type1 /BaseFont /Helvetica >>
endobj
xref
0 9
0000000000 65535 f 
0000000010 00000 n 
0000000078 00000 n 
0000000131 00000 n 
0000000193 00000 n 
0000000325 00000 n 
0000000950 00000 n 
0000001025 00000 n 
0000001105 00000 n 
trailer
<< /Size 9 /Root 2 0 R /Info 1 0 R >>
startxref
1185
%%EOF`;

  return new Blob([content], { type: 'application/pdf' });
}

// Download Original Resume: Priority order:
// 1. Direct candidate.resumeBase64 (client-side binary decode)
// 2. Server binary endpoint GET /api/resumes/:id/download
// 3. Formatted authentic candidate profile PDF document
export async function downloadOriginalResume(candidate: Candidate) {
  const fileName = candidate.resumeFileName || `${(candidate.name || 'Candidate').replace(/\s+/g, '_')}_Resume.pdf`;

  // 1. If we have full base64 on the candidate object
  if (candidate.resumeBase64 && candidate.resumeBase64.length > 200) {
    try {
      const blob = base64ToPdfBlob(candidate.resumeBase64);
      triggerBlobDownload(blob, fileName);
      return;
    } catch (e) {
      console.warn('Base64 decode failed, trying server download endpoint:', e);
    }
  }

  // 2. Try server endpoint
  if (candidate.id) {
    try {
      const response = await fetch(`/api/resumes/${encodeURIComponent(candidate.id)}/download`);
      if (response.ok) {
        const blob = await response.blob();
        if (blob.size > 200) {
          triggerBlobDownload(blob, fileName);
          return;
        }
      }
    } catch {
      // Continue to generated PDF fallback
    }
  }

  // 3. Formatted PDF generator with candidate's actual extracted details
  const blob = generateComprehensiveCandidatePdfBlob(candidate);
  triggerBlobDownload(blob, fileName);
}

// Alias for backward compatibility
export const downloadSampleResume = downloadOriginalResume;

