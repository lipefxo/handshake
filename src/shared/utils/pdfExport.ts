import html2canvas from 'html2canvas-pro';
import { jsPDF } from 'jspdf';

export interface PdfExportOptions {
  filename?: string;
  quality?: number;
  onProgress?: (current: number, total: number) => void;
}

/**
 * Captures all `.slide-section` elements within the given container
 * and composes them into a landscape PDF.
 */
export async function exportProposalToPdf(
  container: HTMLElement,
  options: PdfExportOptions = {},
): Promise<void> {
  const {
    filename = 'proposal.pdf',
    quality = 0.92,
    onProgress,
  } = options;

  const sections = container.querySelectorAll<HTMLElement>('.slide-section');
  if (sections.length === 0) return;

  const pdf = new jsPDF({ orientation: 'landscape', unit: 'px', format: 'a4' });
  const pageWidth = pdf.internal.pageSize.getWidth();
  const pageHeight = pdf.internal.pageSize.getHeight();

  for (let i = 0; i < sections.length; i++) {
    const section = sections[i];
    onProgress?.(i + 1, sections.length);

    const canvas = await html2canvas(section, {
      scale: 2,
      useCORS: true,
      allowTaint: true,
      backgroundColor: null,
      logging: false,
      windowWidth: 1280,
      windowHeight: 720,
    });

    const imgData = canvas.toDataURL('image/jpeg', quality);

    // Fit the captured slide to the PDF page, preserving aspect ratio
    const canvasRatio = canvas.width / canvas.height;
    const pageRatio = pageWidth / pageHeight;

    let drawWidth: number;
    let drawHeight: number;

    if (canvasRatio > pageRatio) {
      drawWidth = pageWidth;
      drawHeight = pageWidth / canvasRatio;
    } else {
      drawHeight = pageHeight;
      drawWidth = pageHeight * canvasRatio;
    }

    const x = (pageWidth - drawWidth) / 2;
    const y = (pageHeight - drawHeight) / 2;

    if (i > 0) pdf.addPage();
    pdf.addImage(imgData, 'JPEG', x, y, drawWidth, drawHeight);
  }

  pdf.save(filename);
}
