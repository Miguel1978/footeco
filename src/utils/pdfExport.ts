import jsPDF from 'jspdf';
import html2canvas from 'html2canvas-pro';
import { MatchData } from '../types';
import { getEventTypeConfig } from './season';

/**
 * Exports all 4 matches/periods into a clean, multi-page A4 landscape PDF
 * where each period has its own dedicated official page.
 */
export async function exportAllPeriodsToPdf(matchData: MatchData): Promise<boolean> {
  const opponent = matchData.opponent ? matchData.opponent.trim().replace(/\s+/g, '_') : 'Adversaire';
  const dateStr = matchData.date ? matchData.date.replace(/[\/\\]/g, '-') : 'Match';
  const filename = `Feuille_FootEco_FE12_Les_4_Matchs_${opponent}_${dateStr}.pdf`;

  const pdf = new jsPDF({
    orientation: 'landscape',
    unit: 'mm',
    format: 'a4',
  });

  const pdfWidth = 297;
  const pdfHeight = 210;
  const margin = 8;
  const usableWidth = pdfWidth - margin * 2;
  const usableHeight = pdfHeight - margin * 2;

  let anyRendered = false;

  for (let idx = 0; idx < matchData.periods.length; idx++) {
    const periodEl = document.getElementById(`printable-period-page-${idx}`);
    if (!periodEl) continue;

    const clone = periodEl.cloneNode(true) as HTMLElement;
    clone.id = `temp-multi-pdf-sheet-${idx}`;
    clone.style.display = 'block';
    clone.style.position = 'fixed';
    clone.style.left = '-99999px';
    clone.style.top = '0';
    clone.style.width = '1120px';
    clone.style.minHeight = 'auto';
    clone.style.background = '#ffffff';
    clone.style.color = '#000000';
    clone.style.padding = '20px';
    clone.style.zIndex = '-9999';
    clone.style.transform = 'none';
    clone.classList.remove('hidden');
    clone.classList.remove('print:block');

    document.body.appendChild(clone);

    try {
      const canvas = await html2canvas(clone, {
        scale: 2,
        useCORS: true,
        logging: false,
        backgroundColor: '#ffffff',
        windowWidth: 1120,
      });

      const imgData = canvas.toDataURL('image/jpeg', 0.98);
      if (anyRendered) {
        pdf.addPage('a4', 'landscape');
      }

      const imgProps = pdf.getImageProperties(imgData);
      const renderedHeight = (imgProps.height * usableWidth) / imgProps.width;
      const yOffset = margin + Math.max(0, (usableHeight - renderedHeight) / 4);

      pdf.addImage(imgData, 'JPEG', margin, yOffset, usableWidth, renderedHeight, undefined, 'FAST');
      anyRendered = true;
    } catch (err) {
      console.error(`Error rendering period ${idx} for PDF:`, err);
    } finally {
      if (document.body.contains(clone)) {
        document.body.removeChild(clone);
      }
    }
  }

  if (!anyRendered) {
    return exportMatchToPdfLegacy(matchData);
  }

  const eventConfig = getEventTypeConfig(matchData.eventType);
  pdf.setProperties({
    title: `Feuille FootEco FE12 - Les 4 Matchs - ${matchData.opponent || 'Match'}`,
    subject: `Feuille officielle FootEco Bas-Valais - ${eventConfig.label}`,
    author: 'FootEco FE12 Match Sheet App',
    keywords: 'footeco, fe12, football, match sheet, 4 matchs',
    creator: 'FootEco FE12 Application',
  });

  pdf.save(filename);
  return true;
}

export const exportMatchToPdf = exportAllPeriodsToPdf;

/**
 * Legacy fallback export if individual pages are not present in DOM
 */
async function exportMatchToPdfLegacy(matchData: MatchData): Promise<boolean> {

  const opponent = matchData.opponent ? matchData.opponent.trim().replace(/\s+/g, '_') : 'Adversaire';
  const dateStr = matchData.date ? matchData.date.replace(/[\/\\]/g, '-') : 'Match';
  const filename = `Feuille_de_Match_FootEco_FE12_${opponent}_${dateStr}.pdf`;

  // Find the printable element rendered in DOM
  const original = document.getElementById('official-printable-sheet');
  if (!original) {
    console.warn('Element #official-printable-sheet not found, triggering print dialog');
    window.print();
    return false;
  }

  // Create an offscreen cloned container specifically styled for PDF rendering
  const clone = original.cloneNode(true) as HTMLElement;
  clone.id = 'temp-pdf-export-sheet';
  clone.style.display = 'block';
  clone.style.position = 'fixed';
  clone.style.left = '-99999px';
  clone.style.top = '0';
  clone.style.width = '1120px';
  clone.style.minHeight = 'auto';
  clone.style.background = '#ffffff';
  clone.style.color = '#000000';
  clone.style.padding = '20px';
  clone.style.zIndex = '-9999';

  // Force removal of hidden or print-only restriction on clone
  clone.classList.remove('hidden');
  clone.classList.remove('print:block');

  document.body.appendChild(clone);

  try {
    // Render the DOM node to high-res canvas (scale 2 for crisp vector-like text)
    const canvas = await html2canvas(clone, {
      scale: 2,
      useCORS: true,
      logging: false,
      backgroundColor: '#ffffff',
      windowWidth: 1120,
    });

    const imgData = canvas.toDataURL('image/jpeg', 0.98);

    // Standard A4 Landscape: 297mm x 210mm
    const pdf = new jsPDF({
      orientation: 'landscape',
      unit: 'mm',
      format: 'a4',
    });

    const pdfWidth = 297;
    const pdfHeight = 210;
    const margin = 8; // 8mm margin
    const usableWidth = pdfWidth - margin * 2;
    const usableHeight = pdfHeight - margin * 2;

    const imgProps = pdf.getImageProperties(imgData);
    const renderedHeight = (imgProps.height * usableWidth) / imgProps.width;

    if (renderedHeight <= usableHeight) {
      // Single page fits perfectly
      const yOffset = margin + (usableHeight - renderedHeight) / 4;
      pdf.addImage(imgData, 'JPEG', margin, yOffset, usableWidth, renderedHeight, undefined, 'FAST');
    } else {
      // Multi-page slicing if the sheet is long (e.g. 4+ periods with stats)
      let heightLeft = renderedHeight;
      let position = margin;
      let page = 1;

      while (heightLeft > 0) {
        pdf.addImage(
          imgData,
          'JPEG',
          margin,
          position,
          usableWidth,
          renderedHeight,
          undefined,
          'FAST'
        );
        heightLeft -= usableHeight;

        if (heightLeft > 0) {
          pdf.addPage('a4', 'landscape');
          page++;
          position = margin - (page - 1) * usableHeight;
        }
      }
    }

    // Set PDF Document Properties
    const eventConfig = getEventTypeConfig(matchData.eventType);
    pdf.setProperties({
      title: `Feuille de Match FootEco FE12 - ${matchData.opponent || 'Match'}`,
      subject: `Feuille officielle FootEco Bas-Valais - ${eventConfig.label}`,
      author: 'FootEco FE12 Match Sheet App',
      keywords: 'footece, fe12, football, match sheet, asf',
      creator: 'FootEco FE12 Application',
    });

    pdf.save(filename);
    return true;
  } catch (err) {
    console.error('PDF generation error with jsPDF/html2canvas:', err);
    // Fallback to native browser print if canvas rendering fails
    window.print();
    return false;
  } finally {
    if (document.body.contains(clone)) {
      document.body.removeChild(clone);
    }
  }
}

/**
 * Exports a single period's official printable sheet to a high-resolution A4 landscape PDF.
 */
export async function exportPeriodToPdf(
  matchData: MatchData,
  periodIndex: number,
  targetElementId: string = 'period-printable-sheet-preview'
): Promise<boolean> {
  const period = matchData.periods[periodIndex] || matchData.periods[0];
  const opponent = matchData.opponent ? matchData.opponent.trim().replace(/\s+/g, '_') : 'Adversaire';
  const dateStr = matchData.date ? matchData.date.replace(/[\/\\]/g, '-') : 'Match';
  const periodSlug = (period?.title || `Periode_${periodIndex + 1}`).trim().replace(/\s+/g, '_');
  const filename = `Feuille_FootEco_FE12_${opponent}_${periodSlug}_${dateStr}.pdf`;

  // Look for target element
  const original = document.getElementById(targetElementId);
  if (!original) {
    console.warn(`Element #${targetElementId} not found, falling back to full export`);
    return exportMatchToPdf(matchData);
  }

  // Create an offscreen cloned container specifically styled for PDF rendering
  const clone = original.cloneNode(true) as HTMLElement;
  clone.id = 'temp-period-pdf-export-sheet';
  clone.style.display = 'block';
  clone.style.position = 'fixed';
  clone.style.left = '-99999px';
  clone.style.top = '0';
  clone.style.width = '1120px';
  clone.style.minHeight = 'auto';
  clone.style.background = '#ffffff';
  clone.style.color = '#000000';
  clone.style.padding = '20px';
  clone.style.zIndex = '-9999';
  clone.style.transform = 'none';

  // Force removal of hidden or print-only restriction on clone
  clone.classList.remove('hidden');
  clone.classList.remove('print:block');

  document.body.appendChild(clone);

  try {
    const canvas = await html2canvas(clone, {
      scale: 2,
      useCORS: true,
      logging: false,
      backgroundColor: '#ffffff',
      windowWidth: 1120,
    });

    const imgData = canvas.toDataURL('image/jpeg', 0.98);

    // Standard A4 Landscape: 297mm x 210mm
    const pdf = new jsPDF({
      orientation: 'landscape',
      unit: 'mm',
      format: 'a4',
    });

    const pdfWidth = 297;
    const pdfHeight = 210;
    const margin = 8;
    const usableWidth = pdfWidth - margin * 2;
    const usableHeight = pdfHeight - margin * 2;

    const imgProps = pdf.getImageProperties(imgData);
    const renderedHeight = (imgProps.height * usableWidth) / imgProps.width;

    if (renderedHeight <= usableHeight) {
      const yOffset = margin + Math.max(0, (usableHeight - renderedHeight) / 4);
      pdf.addImage(imgData, 'JPEG', margin, yOffset, usableWidth, renderedHeight, undefined, 'FAST');
    } else {
      let heightLeft = renderedHeight;
      let position = margin;
      let page = 1;

      while (heightLeft > 0) {
        pdf.addImage(imgData, 'JPEG', margin, position, usableWidth, renderedHeight, undefined, 'FAST');
        heightLeft -= usableHeight;
        if (heightLeft > 0) {
          pdf.addPage('a4', 'landscape');
          page++;
          position = margin - (page - 1) * usableHeight;
        }
      }
    }

    const eventConfig = getEventTypeConfig(matchData.eventType);
    pdf.setProperties({
      title: `Feuille FootEco FE12 - ${period?.title || `Période ${periodIndex + 1}`} - ${matchData.opponent || 'Match'}`,
      subject: `Feuille officielle FootEco Bas-Valais - ${eventConfig.label}`,
      author: 'FootEco FE12 Match Sheet App',
      keywords: 'footece, fe12, football, match sheet, asf',
      creator: 'FootEco FE12 Application',
    });

    pdf.save(filename);
    return true;
  } catch (err) {
    console.error('Period PDF generation error with jsPDF/html2canvas:', err);
    return false;
  } finally {
    if (document.body.contains(clone)) {
      document.body.removeChild(clone);
    }
  }
}
