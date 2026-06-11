import { jsPDF } from 'jspdf';
import autoTable from 'jspdf-autotable';
import * as XLSX from 'xlsx';
import html2canvas from 'html2canvas';
import { ExamCenter, Officer } from '../types';

let cachedFontBase64: string | null = null;

/**
 * Dynamically downloads Noto Sans Devanagari from google fonts repository or retrieves from localStorage cache
 */
async function getDevanagariFont(): Promise<string | null> {
  if (cachedFontBase64) return cachedFontBase64;
  
  // Clean up any old, potentially corrupted cache entries
  try {
    localStorage.removeItem('__devanagari_font_b64');
  } catch (e) {}

  const storageKey = '__noto_sans_devanagari_b64_v3';

  try {
    const saved = localStorage.getItem(storageKey);
    if (saved && saved.length > 50000) {
      cachedFontBase64 = saved;
      return saved;
    }
  } catch (e) {
    console.warn('LocalStorage read warning:', e);
  }

  try {
    const url = 'https://cdn.jsdelivr.net/gh/google/fonts@main/ofl/notosansdevanagari/NotoSansDevanagari-Regular.ttf';
    const res = await fetch(url);
    if (!res.ok) throw new Error('CDN font download failed');
    const buffer = await res.arrayBuffer();
    
    // Safety check - solid TTFs are at least ~100KB+
    if (buffer.byteLength < 50000) {
      throw new Error(`Downloaded font is too small: ${buffer.byteLength} bytes. Likely corrupted.`);
    }

    // Safely convert binary buffer to base64
    const bytes = new Uint8Array(buffer);
    let binary = '';
    const len = bytes.byteLength;
    for (let i = 0; i < len; i++) {
      binary += String.fromCharCode(bytes[i]);
    }
    const base64 = btoa(binary);
    
    try {
      localStorage.setItem(storageKey, base64);
    } catch (e) {
      console.warn('LocalStorage write warning:', e);
    }
    
    cachedFontBase64 = base64;
    return base64;
  } catch (err) {
    console.error('Failed to load Devanagari font online, fallback active:', err);
    return null;
  }
}

/**
 * Clean up Hindi text for PDF to avoid glyph errors in default jsPDF fonts
 * Default PDF Helvetica does not support Devanagari characters, so if font registration fails,
 * we provide an English lookup/transliteration or clean Latin fallback representation.
 */
function cleanTextForPdf(text: string, hasFont: boolean): string {
  if (hasFont) {
    return text; // Keep pristine original Hindi Unicode text if font is loaded!
  }
  
  // Extract English text in parenthesis if there is Hindi + English, e.g. "रमेश कुमार (Ramesh Kumar)" -> "Ramesh Kumar"
  const matches = text.match(/\(([^)]+)\)/);
  if (matches && matches[1]) {
    // If it is mobile or numbers, keep it
    return matches[1].trim();
  }
  // Remove non-ASCII characters to prevent PDF generation errors
  return text.replace(/[^\x00-\x7F]/g, "").trim() || text;
}

/**
 * Export results to a multi-sheet Excel file
 */
export function exportToExcel(centers: ExamCenter[], officers: Officer[]): void {
  const wb = XLSX.utils.book_new();

  // Sheet 1: Center-wise Allotment Data representation
  const centerData: any[] = [];
  centers.forEach(center => {
    const assignedOfficers = officers.filter(o => o.assignedCenterCode === center.code);
    
    if (assignedOfficers.length === 0) {
      centerData.push({
        'परीक्षा केंद्र कोड (Center Code)': center.code,
        'परीक्षा केंद्र का नाम (Center Name)': center.name,
        'कुल आवश्यक अधिकारी (Required)': center.capacity,
        'अधिकारी का नाम (Officer)': 'कोई नहीं आवंटित (No Officer Assigned)',
        'पद (Designation)': '-',
        'विभाग (Department)': '-',
        'मोबाइल नंबर (Mobile)': '-'
      });
    } else {
      assignedOfficers.forEach((off, idx) => {
        centerData.push({
          'परीक्षा केंद्र कोड (Center Code)': center.code,
          'परीक्षा केंद्र का नाम (Center Name)': center.name,
          'कुल आवश्यक अधिकारी (Required)': center.capacity,
          'अधिकारी का नाम (Officer)': off.name,
          'पद (Designation)': off.designation,
          'विभाग (Department)': off.department,
          'मोबाइल नंबर (Mobile)': off.mobile
        });
      });
    }
  });

  const wsCenters = XLSX.utils.json_to_sheet(centerData);
  XLSX.utils.book_append_sheet(wb, wsCenters, "केंद्रवार आवंटन (Center Duties)");

  // Sheet 2: Officers Master Status Data representation
  const officerData = officers.map(off => {
    const assignedCenter = centers.find(c => c.code === off.assignedCenterCode);
    return {
      'अधिकारी का नाम (Officer Name)': off.name,
      'पद (Designation)': off.designation,
      'विभाग (Department)': off.department,
      'मोबाइल number (Mobile)': off.mobile,
      'आवंटित परीक्षा केंद्र कोड (Assigned Code)': off.assignedCenterCode || 'N/A',
      'आवंटित केंद्र का नाम (Assigned Center)': assignedCenter ? assignedCenter.name : 'सुरक्षित सूची (Reserve/Unassigned)'
    };
  });

  const wsOfficers = XLSX.utils.json_to_sheet(officerData);
  XLSX.utils.book_append_sheet(wb, wsOfficers, "अधिकारी मास्टर सूची (Officers)");

  // Save/Download spreadsheet
  const dateStr = new Date().toISOString().slice(0, 10);
  XLSX.writeFile(wb, `Exam_Duty_Randomization_Report_${dateStr}.xlsx`);
}

/**
 * Export results to a high-quality, print-ready PDF using standard html2canvas for absolute Hindi Devanagari ligature accuracy
 */
export async function exportToPDF(
  centers: ExamCenter[], 
  officers: Officer[], 
  reportTitle: string = "OFFICIAL RANDOMIZATION DUTY ALLOTMENT REPORT"
): Promise<void> {
  const container = document.createElement('div');
  container.style.position = 'absolute';
  container.style.left = '-9999px';
  container.style.top = '-9999px';
  container.style.width = '794px'; // standard A4 pixel width at 96 DPI
  container.style.backgroundColor = '#ffffff';
  container.style.color = '#111827';
  container.style.fontFamily = '"Inter", "system-ui", "BlinkMacSystemFont", "Segoe UI", Roboto, sans-serif';
  container.style.padding = '45px 35px';
  container.style.boxSizing = 'border-box';
  
  const timestamp = new Date().toLocaleString('hi-IN', { timeZone: 'Asia/Kolkata' });
  const assignedCount = officers.filter(o => o.assignedCenterCode !== null).length;
  const unassignedOfficers = officers.filter(o => o.assignedCenterCode === null);

  container.innerHTML = `
    <style>
      @import url('https://fonts.googleapis.com/css2?family=Noto+Sans+Devanagari:wght@400;500;600;700&family=Inter:wght@400;500;600;700&display=swap');
      .pdf-root {
        font-family: 'Noto Sans Devanagari', 'Inter', system-ui, sans-serif !important;
        line-height: 1.4;
      }
      .pdf-title-banner {
        background-color: #1e1b4b; /* Indigo-950 */
        color: #ffffff;
        text-align: center;
        padding: 14px 10px;
        font-weight: 700;
        font-size: 15px;
        border-bottom: 4px solid #6366f1; /* Indigo-500 */
        margin-bottom: 20px;
        border-radius: 4px;
        text-transform: uppercase;
      }
      .pdf-meta-box {
        display: flex;
        justify-content: space-between;
        margin-bottom: 22px;
        font-size: 11px;
        color: #374151;
        background-color: #f8fafc;
        border: 1px solid #e2e8f0;
        border-radius: 8px;
        padding: 12px 14px;
      }
      .pdf-meta-box div p {
        margin: 3px 0;
      }
      .pdf-table {
        width: 100%;
        border-collapse: collapse;
        font-size: 11.5px;
        margin-bottom: 25px;
      }
      .pdf-table th {
        background-color: #1e293b; /* Slate-800 */
        color: #ffffff;
        font-weight: 600;
        text-align: left;
        padding: 9px 10px;
        border: 1px solid #334155;
        font-size: 11px;
      }
      .pdf-table td {
        padding: 9px 10px;
        border: 1px solid #cbd5e1;
        vertical-align: top;
      }
      .pdf-table tr:nth-child(even) td {
        background-color: #f8fafc;
      }
      .reserve-box {
        background-color: #f1f5f9;
        border: 1.5px dashed #cbd5e1;
        padding: 14px;
        border-radius: 8px;
        margin-top: 25px;
        font-size: 10.5px;
      }
      .reserve-title {
        font-weight: 700;
        color: #475569;
        margin-bottom: 8px;
        font-size: 11px;
      }
      .reserve-grid {
        display: grid;
        grid-template-columns: repeat(3, 1fr);
        gap: 8px;
      }
      .reserve-card {
        background: #ffffff;
        border: 1px solid #e2e8f0;
        padding: 6px 10px;
        border-radius: 6px;
      }
      .signature-row {
        display: flex;
        justify-content: space-between;
        margin-top: 60px;
        margin-bottom: 10px;
        font-size: 11.5px;
        font-weight: 600;
        color: #1e293b;
      }
      .footer-note {
        text-align: center;
        font-size: 9px;
        color: #94a3b8;
        border-top: 1px solid #f1f5f9;
        padding-top: 15px;
        margin-top: 40px;
      }
    </style>
    <div class="pdf-root">
      <div class="pdf-title-banner">
        ${reportTitle}
      </div>
      
      <div class="pdf-meta-box">
        <div>
          <p><strong>आबंटन दिनांक व समय (Timestamp):</strong> ${timestamp}</p>
          <p><strong>कुल परीक्षा केंद्र (Total Centers):</strong> ${centers.length}</p>
        </div>
        <div style="text-align: right;">
          <p><strong>पदाधिकारी/कर्मी (Assigned Staff):</strong> ${assignedCount} / ${officers.length}</p>
        </div>
      </div>
      
      <table class="pdf-table">
        <thead>
          <tr>
            <th style="width: 50px;">S.No (क्र०)</th>
            <th style="width: 230px;">Center Detail (परीक्षा केंद्र विवरण)</th>
            <th style="width: 170px;">Assigned Officer (नियुक्त अधिकारी)</th>
            <th style="width: 150px;">Designation (पद एवं विभाग)</th>
            <th style="width: 120px;">Mobile (मोबाइल सं०)</th>
          </tr>
        </thead>
        <tbody>
          ${centers.map((center, index) => {
            const assigned = officers.filter(o => o.assignedCenterCode === center.code);
            
            if (assigned.length === 0) {
              return `
                <tr>
                  <td>${index + 1}</td>
                  <td><strong>${center.code}</strong><br/>${center.name}</td>
                  <td colspan="3" style="color: #ea580c; font-weight: 500; font-style: italic; background-color: #fffbeb;">
                    कोई अधिकारी आवंटित नहीं है (No Officer Assigned)
                  </td>
                </tr>
              `;
            }
            
            return assigned.map((off, offIdx) => `
              <tr>
                <td>${offIdx === 0 ? index + 1 : ''}</td>
                <td>${offIdx === 0 ? `<strong>${center.code}</strong><br/>${center.name}` : ''}</td>
                <td style="font-weight: 700; color: #0f172a;">${off.name}</td>
                <td>
                  <div style="font-weight: 600;">${off.designation}</div>
                  <div style="font-size: 8.5px; color: #64748b;">${off.department}</div>
                </td>
                <td style="font-family: monospace; font-size: 11px; font-weight: 500; color: #334155;">
                  ${off.mobile}
                </td>
              </tr>
            `).join('');
          }).join('')}
        </tbody>
      </table>

      ${unassignedOfficers.length > 0 ? `
        <div class="reserve-box">
          <div class="reserve-title">
            आरक्षित अतिरिक्त बल सूची (Standby / Reserve Officer Pool - ${unassignedOfficers.length}):
          </div>
          <div class="reserve-grid">
            ${unassignedOfficers.map(uo => `
              <div class="reserve-card">
                <strong>${uo.name}</strong>
                <div style="font-size: 8.5px; color: #64748b; margin-top: 1px;">${uo.designation} (${uo.department.split(' ')[0]})</div>
              </div>
            `).join('')}
          </div>
        </div>
      ` : ''}
    </div>
  `;

  document.body.appendChild(container);

  // Wait briefly for CSS and Google Fonts to apply perfectly before capture
  await new Promise(resolve => setTimeout(resolve, 500));

  try {
    const canvas = await html2canvas(container, {
      scale: 2, // High DPI capture for razor-sharp text quality
      useCORS: true,
      allowTaint: true,
      backgroundColor: '#ffffff',
      logging: false
    });

    const imgData = canvas.toDataURL('image/jpeg', 0.95);
    
    const doc = new jsPDF({
      orientation: 'portrait',
      unit: 'mm',
      format: 'a4'
    });

    const pdfWidth = doc.internal.pageSize.getWidth(); // 210mm
    const pdfHeight = doc.internal.pageSize.getHeight(); // 297mm

    // Convert pixels to standard mm representation
    const imgWidth = pdfWidth;
    const imgHeight = (canvas.height * pdfWidth) / canvas.width;

    let heightLeft = imgHeight;
    let position = 0;

    // Draw first page
    doc.addImage(imgData, 'JPEG', 0, position, imgWidth, imgHeight, undefined, 'FAST');
    heightLeft -= pdfHeight;

    // Append subsequent slices if list overflows A4 size limit
    while (heightLeft > 0) {
      position = heightLeft - imgHeight;
      doc.addPage();
      doc.addImage(imgData, 'JPEG', 0, position, imgWidth, imgHeight, undefined, 'FAST');
      heightLeft -= pdfHeight;
    }

    const dateStr = new Date().toISOString().slice(0, 10);
    doc.save(`Exam_Duty_Randomization_Report_${dateStr}.pdf`);
  } catch (error) {
    console.error("html2canvas PDF generation failed:", error);
  } finally {
    document.body.removeChild(container);
  }
}
