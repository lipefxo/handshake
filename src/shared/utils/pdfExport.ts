import html2canvas from 'html2canvas-pro';
import { jsPDF } from 'jspdf';

export interface PdfExportOptions {
  filename?: string;
  quality?: number;
  onProgress?: (current: number, total: number) => void;
}

/**
 * Resolve CSS custom properties for font and color styles by reading computed
 * values from the live DOM and writing them as inline styles on the cloned DOM.
 * html2canvas operates on the clone, so this ensures vars are resolved.
 */
function inlineFontStyles(clonedDoc: Document, original: HTMLElement) {
  const props = [
    'fontFamily',
    'fontSize',
    'fontWeight',
    'fontStyle',
    'letterSpacing',
    'lineHeight',
    'textTransform',
    'color',
  ] as const;

  // html2canvas clones the full document, so walk both trees in the same order
  const origEls = [original, ...original.querySelectorAll<HTMLElement>('*')];

  // Find the matching root in the clone via data attribute
  original.dataset.pdfRoot = '1';
  const cloneRoot = clonedDoc.querySelector<HTMLElement>('[data-pdf-root]');
  delete original.dataset.pdfRoot;
  if (!cloneRoot) return;

  const cloneEls = [cloneRoot, ...cloneRoot.querySelectorAll<HTMLElement>('*')];

  const len = Math.min(origEls.length, cloneEls.length);
  for (let i = 0; i < len; i++) {
    const computed = window.getComputedStyle(origEls[i]);
    for (const prop of props) {
      const val = computed[prop];
      if (val) cloneEls[i].style[prop] = val;
    }
    // Inline background for elements using CSS vars
    const bg = computed.backgroundColor;
    if (bg && bg !== 'rgba(0, 0, 0, 0)') {
      cloneEls[i].style.backgroundColor = bg;
    }
  }
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

  // Wait for all fonts to be fully loaded before capturing
  await document.fonts.ready;

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
      onclone: (clonedDoc) => {
        inlineFontStyles(clonedDoc, section);
      },
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
