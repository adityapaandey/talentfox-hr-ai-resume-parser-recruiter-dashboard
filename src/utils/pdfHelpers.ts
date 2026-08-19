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

// Generate simple mock PDF Blob for sample candidate downloads
export function generateSimplePdfBlob(candidate: Partial<Candidate>): Blob {
  const content = `
%PDF-1.4
1 0 obj
<< /Title (${candidate.name || 'Candidate'} Resume)
   /Author (${candidate.name || 'Candidate'})
>>
endobj
2 0 obj
<< /Type /Catalog /Pages 3 0 R >>
endobj
3 0 obj
<< /Type /Pages /Kids [4 0 R] /Count 1 >>
endobj
4 0 obj
<< /Type /Page /Parent 3 0 R /MediaBox [0 0 612 792] /Contents 5 0 R /Resources << /Font << /F1 6 0 R >> >> >>
endobj
5 0 obj
<< /Length 450 >>
stream
BT
/F1 18 Tf
50 720 Td
(${candidate.name || 'Candidate Name'} - ${candidate.currentDesignation || 'Software Engineer'}) Tj
/F1 10 Tf
0 -25 Td
(Email: ${candidate.email || 'email@example.com'} | Phone: ${candidate.phone || '+1 555 0100'} | Location: ${candidate.location || 'USA'}) Tj
0 -20 Td
(Total Experience: ${candidate.totalExperienceYears || 5} Years | Current: ${candidate.currentCompany || 'Tech Corp'}) Tj
0 -25 Td
(Skills: ${(candidate.skills || ['Java', 'Spring Boot', 'AWS', 'React']).join(', ')}) Tj
0 -30 Td
(Professional Summary:) Tj
0 -15 Td
(${((candidate.summary || 'Experienced engineering professional with hands-on software development and cloud background.').substring(0, 100))}) Tj
ET
endstream
endobj
6 0 obj
<< /Type /Font /Subtype /Type1 /BaseFont /Helvetica >>
endobj
xref
0 7
0000000000 65535 f 
0000000010 00000 n 
0000000095 00000 n 
0000000148 00000 n 
0000000210 00000 n 
0000000325 00000 n 
0000000825 00000 n 
trailer
<< /Size 7 /Root 2 0 R /Info 1 0 R >>
startxref
900
%%EOF
`;

  return new Blob([content], { type: 'application/pdf' });
}

export function downloadSampleResume(candidate: Candidate) {
  const blob = generateSimplePdfBlob(candidate);
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = candidate.resumeFileName || `${candidate.name.replace(/\s+/g, '_')}_Resume.pdf`;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}
