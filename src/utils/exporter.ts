import { jsPDF } from 'jspdf';
import autoTable from 'jspdf-autotable';
import * as XLSX from 'xlsx';
import { ExamCenter, Officer } from '../types';

/**
 * Clean up Hindi text for PDF to avoid glyph errors in default jsPDF fonts
 * Default PDF Helvetica does not support Devanagari characters, so we provide an English lookup/transliteration
 * but also write the exact text with clean Latin fallback representation.
 */
function cleanTextForPdf(text: string): string {
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
      'मोबाइल नंबर (Mobile)': off.mobile,
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
 * Export results to a high-quality, print-ready PDF using standard AutoTable
 */
export function exportToPDF(centers: ExamCenter[], officers: Officer[]): void {
  const doc = new jsPDF({
    orientation: 'portrait',
    unit: 'mm',
    format: 'a4'
  });

  const timestamp = new Date().toLocaleString('hi-IN', { timeZone: 'Asia/Kolkata' });

  // Draw Header Border & Title
  doc.setFillColor(31, 41, 55); // Gray-800
  doc.rect(10, 10, 190, 8, 'F');
  
  doc.setTextColor(255, 255, 255);
  doc.setFontSize(11);
  doc.setFont("helvetica", "bold");
  doc.text("OFFICIAL RANDOMIZATION DUTY ALLOTMENT REPORT", 105, 15.5, { align: "center" });

  doc.setTextColor(17, 24, 39);
  doc.setFontSize(10);
  doc.setFont("helvetica", "normal");
  doc.text(`Generated on: ${timestamp}`, 15, 26);
  doc.text(`Total Exam Centers: ${centers.length}`, 15, 31);
  doc.text(`Total Assigned Officers: ${officers.filter(o => o.assignedCenterCode !== null).length}`, 150, 31);

  // Line Separator
  doc.setDrawColor(209, 213, 219);
  doc.line(10, 35, 200, 35);

  let currentY = 40;

  // Render Table of Contents or Continuous assignment list
  const tableRows: any[] = [];
  
  centers.forEach((center, index) => {
    const assigned = officers.filter(o => o.assignedCenterCode === center.code);
    const centerCleanName = cleanTextForPdf(center.name);
    
    if (assigned.length === 0) {
      tableRows.push([
        index + 1,
        `${center.code}\n${centerCleanName}`,
        "No officer assigned / Reserve duty",
        "-",
        "-"
      ]);
    } else {
      assigned.forEach((off, offIdx) => {
        tableRows.push([
          offIdx === 0 ? index + 1 : "",
          offIdx === 0 ? `${center.code}\n${centerCleanName}` : "",
          cleanTextForPdf(off.name),
          cleanTextForPdf(off.designation),
          off.mobile
        ]);
      });
    }
  });

  // Call autoTable to draw the high-quality styled table
  autoTable(doc, {
    startY: currentY,
    head: [['S.No', 'Center Detail (Code & Name)', 'Assigned Officer', 'Designation', 'Mobile']],
    body: tableRows,
    theme: 'striped',
    headStyles: {
      fillColor: [31, 41, 55],
      textColor: [255, 255, 255],
      fontSize: 9,
      fontStyle: 'bold',
      halign: 'left'
    },
    bodyStyles: {
      fontSize: 8.5,
      valign: 'top'
    },
    columnStyles: {
      0: { cellWidth: 12 },
      1: { cellWidth: 65 },
      2: { cellWidth: 50 },
      3: { cellWidth: 35 },
      4: { cellWidth: 28 }
    },
    didDrawPage: (data) => {
      // Add Footer on each page
      doc.setFontSize(8);
      doc.setTextColor(156, 163, 175);
      const str = `Page ${data.pageNumber} | Confidential - Internal Duty Report`;
      doc.text(str, 105, 287, { align: "center" });
    },
    margin: { top: 40, bottom: 20 }
  });

  // Save the PDF
  const dateStr = new Date().toISOString().slice(0, 10);
  doc.save(`Exam_Duty_Randomization_Report_${dateStr}.pdf`);
}
