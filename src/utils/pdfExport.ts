import html2pdf from 'html2pdf.js';
import { MatchData } from '../types';

/**
 * Exports the official printable sheet element (PrintableOfficialSheet) to a clean, formatted PDF file
 */
export async function exportMatchToPdf(matchData: MatchData): Promise<boolean> {
  const opponent = matchData.opponent ? matchData.opponent.trim().replace(/\s+/g, '_') : 'Adversaire';
  const dateStr = matchData.date ? matchData.date.replace(/[\/\\]/g, '-') : 'Match';
  const filename = `Feuille_de_Match_FootEco_FE12_${opponent}_${dateStr}.pdf`;

  // Find or clone the printable sheet rendered by PrintableOfficialSheet (#official-printable-sheet)
  const original = document.getElementById('official-printable-sheet');
  if (!original) {
    console.warn('Element #official-printable-sheet not found, falling back to window.print()');
    window.print();
    return false;
  }

  // Clone element to ensure full visibility and high quality during html2canvas capture
  const clone = original.cloneNode(true) as HTMLElement;
  clone.id = 'temp-pdf-export-sheet';
  clone.classList.remove('hidden');
  clone.style.display = 'block';
  clone.style.position = 'absolute';
  clone.style.left = '-9999px';
  clone.style.top = '0';
  clone.style.width = '1050px';
  clone.style.background = '#ffffff';
  clone.style.color = '#000000';
  clone.style.padding = '15px';
  document.body.appendChild(clone);

  const opt = {
    margin: [6, 6, 6, 6] as [number, number, number, number],
    filename: filename,
    image: { type: 'jpeg' as const, quality: 0.98 },
    html2canvas: { 
      scale: 2, 
      useCORS: true, 
      logging: false,
      scrollY: 0,
      backgroundColor: '#ffffff'
    },
    jsPDF: { 
      unit: 'mm' as const, 
      format: 'a4' as const, 
      orientation: 'landscape' as const
    },
    pagebreak: { mode: ['avoid-all', 'css', 'legacy'] }
  };

  try {
    await (html2pdf as any)().set(opt).from(clone).save();
    return true;
  } catch (err) {
    console.error('PDF export failed with html2pdf:', err);
    window.print();
    return false;
  } finally {
    if (document.body.contains(clone)) {
      document.body.removeChild(clone);
    }
  }
}
