import jsPDF from 'jspdf';
import html2canvas from 'html2canvas';
import { MatchData } from '../types';
import { getEventTypeConfig } from './season';

export interface GenerateOfficialSheetPdfOptions {
  /**
   * Période spécifique à exporter (0, 1, 2, 3).
   * Si non renseigné (undefined), exporte toutes les périodes sous forme de pages A4 paysage dédiées (les 4 matchs).
   */
  periodIndex?: number;

  /**
   * Identifiant de l'élément HTML à capturer dans le DOM (ex: 'official-printable-sheet',
   * 'period-printable-sheet-preview', etc.).
   */
  targetElementId?: string;

  /**
   * Référence directe vers un élément HTML du DOM contenant le composant PrintableOfficialSheet.
   */
  targetElement?: HTMLElement | null;

  /**
   * Si vrai et periodIndex n'est pas spécifié, génère un document PDF multi-pages A4 où chaque période
   * dispose de sa propre page officielle A4 dédiée.
   * Si faux, exporte l'ensemble de la feuille sur un flux unique.
   * Défaut : true.
   */
  allPeriodsMultiPage?: boolean;

  /**
   * Nom du fichier PDF à enregistrer.
   * Défaut : généré automatiquement avec le type de rencontre, l'adversaire et la date.
   */
  filename?: string;

  /**
   * Orientation du document PDF ('landscape' recommandé pour la feuille officielle 7v7, ou 'portrait').
   * Défaut : 'landscape'.
   */
  orientation?: 'landscape' | 'portrait';

  /**
   * Échelle de résolution pour html2canvas (défaut : 2 pour un rendu très net et haute définition).
   */
  scale?: number;

  /**
   * Qualité de compression de l'image (0.1 à 1.0, défaut : 0.98).
   */
  quality?: number;

  /**
   * Callback facultatif appelé pour suivre la progression (étape, pourcentage 0-100).
   */
  onProgress?: (step: string, progress: number) => void;
}

/**
 * Capture un élément DOM vers un canvas HTML via la bibliothèque html2canvas,
 * en créant un clone hors-écran optimisé pour un rendu A4 paysage haute résolution (1120px).
 */
async function captureElementWithHtml2Canvas(
  element: HTMLElement,
  scale: number = 2
): Promise<HTMLCanvasElement> {
  const clone = element.cloneNode(true) as HTMLElement;
  clone.id = `temp-pdf-capture-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`;
  clone.style.display = 'block';
  clone.style.position = 'fixed';
  clone.style.left = '-99999px';
  clone.style.top = '0';
  clone.style.width = '1120px';
  clone.style.minHeight = 'auto';
  clone.style.backgroundColor = '#ffffff';
  clone.style.color = '#000000';
  clone.style.padding = '20px';
  clone.style.zIndex = '-9999';
  clone.style.transform = 'none';
  clone.style.boxShadow = 'none';

  // Supprime les restrictions d'affichage print/hidden
  clone.classList.remove('hidden');
  clone.classList.remove('print:block');

  document.body.appendChild(clone);

  try {
    const canvas = await html2canvas(clone, {
      scale,
      useCORS: true,
      logging: false,
      backgroundColor: '#ffffff',
      windowWidth: 1120,
    });
    return canvas;
  } finally {
    if (document.body.contains(clone)) {
      document.body.removeChild(clone);
    }
  }
}

/**
 * Fonction principale de génération de PDF pour la feuille de match officielle (PrintableOfficialSheet)
 * utilisant les bibliothèques jsPDF et html2canvas.
 *
 * Supporte :
 * - L'export complet multi-pages (A4 paysage avec 1 page dédiée par période/match)
 * - L'export d'une période spécifique (1 page officielle A4 paysage)
 * - La capture d'éléments spécifiques dans le DOM ou par référence directe
 * - Les métadonnées complètes du document (Titre, Auteur, Sujet FootEco FE12, etc.)
 */
export async function generateOfficialSheetPdf(
  matchData: MatchData,
  options: GenerateOfficialSheetPdfOptions = {}
): Promise<boolean> {
  const {
    periodIndex,
    targetElementId,
    targetElement,
    allPeriodsMultiPage = true,
    filename: customFilename,
    orientation = 'landscape',
    scale = 2,
    quality = 0.98,
    onProgress,
  } = options;

  const opponent = matchData.opponent ? matchData.opponent.trim().replace(/\s+/g, '_') : 'Adversaire';
  const dateStr = matchData.date ? matchData.date.replace(/[\/\\]/g, '-') : 'Match';
  const isSinglePeriod = typeof periodIndex === 'number' && periodIndex >= 0;
  const currentPeriod = isSinglePeriod ? matchData.periods[periodIndex] : null;
  const periodSlug = currentPeriod
    ? (currentPeriod.title || `Periode_${periodIndex! + 1}`).trim().replace(/\s+/g, '_')
    : '';

  const defaultFilename = isSinglePeriod
    ? `Feuille_FootEco_FE12_${opponent}_${periodSlug}_${dateStr}.pdf`
    : `Feuille_FootEco_FE12_Les_4_Matchs_${opponent}_${dateStr}.pdf`;

  const finalFilename = customFilename || defaultFilename;

  // Dimensions standard A4 (en mm)
  const isLandscape = orientation === 'landscape';
  const pdfWidth = isLandscape ? 297 : 210;
  const pdfHeight = isLandscape ? 210 : 297;
  const margin = 8;
  const usableWidth = pdfWidth - margin * 2;
  const usableHeight = pdfHeight - margin * 2;

  const pdf = new jsPDF({
    orientation,
    unit: 'mm',
    format: 'a4',
  });

  // CAS 1 : Export d'une période individuelle
  if (isSinglePeriod) {
    onProgress?.('Capture de la période...', 20);

    let elementToCapture: HTMLElement | null = targetElement || null;
    if (!elementToCapture && targetElementId) {
      elementToCapture = document.getElementById(targetElementId);
    }
    if (!elementToCapture) {
      elementToCapture =
        document.getElementById(`preview-period-page-${periodIndex}`) ||
        document.getElementById(`printable-period-page-${periodIndex}`) ||
        document.getElementById(`official-period-sheet-${periodIndex}`) ||
        document.getElementById('period-printable-sheet-preview') ||
        document.getElementById('official-printable-sheet');
    }

    if (!elementToCapture) {
      console.warn(`[PDF] Aucun élément trouvé pour la période ${periodIndex}, tentative avec l'impression système.`);
      window.print();
      return false;
    }

    try {
      onProgress?.('Rendu du canvas haute résolution...', 50);
      const canvas = await captureElementWithHtml2Canvas(elementToCapture, scale);
      const imgData = canvas.toDataURL('image/jpeg', quality);
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
            pdf.addPage('a4', orientation);
            page++;
            position = margin - (page - 1) * usableHeight;
          }
        }
      }

      onProgress?.('Finalisation du PDF...', 90);
      const eventConfig = getEventTypeConfig(matchData.eventType);
      pdf.setProperties({
        title: `Feuille FootEco FE12 - ${currentPeriod?.title || `Période ${(periodIndex ?? 0) + 1}`} - ${matchData.opponent || 'Match'}`,
        subject: `Feuille officielle FootEco Bas-Valais - ${eventConfig.label}`,
        author: 'FootEco FE12 Match Sheet App',
        keywords: 'footeco, fe12, football, feuille de match, asf, acvf',
        creator: 'FootEco FE12 Application (jsPDF + html2canvas)',
      });

      pdf.save(finalFilename);
      onProgress?.('Téléchargement terminé', 100);
      return true;
    } catch (err) {
      console.error('[PDF] Erreur lors de la capture/génération avec html2canvas et jsPDF:', err);
      return false;
    }
  }

  // CAS 2 : Export de toutes les périodes en multi-pages A4
  if (allPeriodsMultiPage) {
    let anyRendered = false;
    const totalPeriods = matchData.periods.length;

    for (let idx = 0; idx < totalPeriods; idx++) {
      onProgress?.(`Capture du match ${idx + 1}/${totalPeriods}...`, Math.round((idx / totalPeriods) * 80));

      let periodEl: HTMLElement | null = null;
      if (idx === 0 && targetElement) {
        periodEl = targetElement;
      }
      if (!periodEl) {
        periodEl =
          document.getElementById(`preview-period-page-${idx}`) ||
          document.getElementById(`printable-period-page-${idx}`) ||
          document.getElementById(`official-period-sheet-${idx}`);
      }

      if (!periodEl) continue;

      try {
        const canvas = await captureElementWithHtml2Canvas(periodEl, scale);
        const imgData = canvas.toDataURL('image/jpeg', quality);

        if (anyRendered) {
          pdf.addPage('a4', orientation);
        }

        const imgProps = pdf.getImageProperties(imgData);
        const renderedHeight = (imgProps.height * usableWidth) / imgProps.width;
        const yOffset = margin + Math.max(0, (usableHeight - renderedHeight) / 4);

        pdf.addImage(imgData, 'JPEG', margin, yOffset, usableWidth, renderedHeight, undefined, 'FAST');
        anyRendered = true;
      } catch (err) {
        console.error(`[PDF] Erreur lors de la capture de la période ${idx}:`, err);
      }
    }

    if (anyRendered) {
      onProgress?.('Finalisation du PDF complet...', 90);
      const eventConfig = getEventTypeConfig(matchData.eventType);
      pdf.setProperties({
        title: `Feuille FootEco FE12 - Les 4 Matchs - ${matchData.opponent || 'Match'}`,
        subject: `Feuille officielle FootEco Bas-Valais - ${eventConfig.label}`,
        author: 'FootEco FE12 Match Sheet App',
        keywords: 'footeco, fe12, football, feuille de match, 4 matchs, asf',
        creator: 'FootEco FE12 Application (jsPDF + html2canvas)',
      });

      pdf.save(finalFilename);
      onProgress?.('Téléchargement terminé', 100);
      return true;
    }
  }

  // CAS 3 : Fallback vers la feuille officielle globale (#official-printable-sheet)
  onProgress?.('Capture de la feuille globale...', 50);
  const globalEl = document.getElementById('official-printable-sheet');
  if (!globalEl) {
    console.warn('[PDF] Aucun élément de feuille officielle trouvé dans le DOM.');
    window.print();
    return false;
  }

  try {
    const canvas = await captureElementWithHtml2Canvas(globalEl, scale);
    const imgData = canvas.toDataURL('image/jpeg', quality);
    const imgProps = pdf.getImageProperties(imgData);
    const renderedHeight = (imgProps.height * usableWidth) / imgProps.width;

    if (renderedHeight <= usableHeight) {
      const yOffset = margin + (usableHeight - renderedHeight) / 4;
      pdf.addImage(imgData, 'JPEG', margin, yOffset, usableWidth, renderedHeight, undefined, 'FAST');
    } else {
      let heightLeft = renderedHeight;
      let position = margin;
      let page = 1;

      while (heightLeft > 0) {
        pdf.addImage(imgData, 'JPEG', margin, position, usableWidth, renderedHeight, undefined, 'FAST');
        heightLeft -= usableHeight;
        if (heightLeft > 0) {
          pdf.addPage('a4', orientation);
          page++;
          position = margin - (page - 1) * usableHeight;
        }
      }
    }

    const eventConfig = getEventTypeConfig(matchData.eventType);
    pdf.setProperties({
      title: `Feuille de Match FootEco FE12 - ${matchData.opponent || 'Match'}`,
      subject: `Feuille officielle FootEco Bas-Valais - ${eventConfig.label}`,
      author: 'FootEco FE12 Match Sheet App',
      keywords: 'footeco, fe12, football, match sheet, asf',
      creator: 'FootEco FE12 Application (jsPDF + html2canvas)',
    });

    pdf.save(finalFilename);
    return true;
  } catch (err) {
    console.error('[PDF] Erreur lors de la capture de la feuille globale:', err);
    window.print();
    return false;
  }
}

/**
 * Alias de compatibilité explicite pour la génération de PDF depuis PrintableOfficialSheet
 */
export const generatePrintableOfficialSheetPdf = generateOfficialSheetPdf;
export const exportPrintableOfficialSheetToPdf = generateOfficialSheetPdf;
export const exportOfficialSheetToPdf = generateOfficialSheetPdf;

/**
 * Exporte l'ensemble des 4 périodes dans un fichier PDF A4 paysage multi-pages.
 */
export async function exportAllPeriodsToPdf(matchData: MatchData): Promise<boolean> {
  return generateOfficialSheetPdf(matchData, { allPeriodsMultiPage: true });
}

/**
 * Exporte une période individuelle dans un fichier PDF A4 paysage.
 */
export async function exportPeriodToPdf(
  matchData: MatchData,
  periodIndex: number,
  targetElementId?: string
): Promise<boolean> {
  return generateOfficialSheetPdf(matchData, {
    periodIndex,
    targetElementId,
  });
}

/**
 * Exporte la feuille de match au format PDF (par défaut tous les matchs).
 */
export const exportMatchToPdf = exportAllPeriodsToPdf;

