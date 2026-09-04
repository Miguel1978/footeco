import React, { useState, useEffect, useRef } from 'react';
import {
  X,
  Download,
  Printer,
  Loader2,
  Check,
  ZoomIn,
  ZoomOut,
  Maximize2,
  FileText,
  Calendar,
  Layers,
  Sparkles,
  FileSpreadsheet,
} from 'lucide-react';
import { MatchData } from '../types';
import { PrintableOfficialSheet } from './PrintableOfficialSheet';
import { exportPeriodToPdf, exportAllPeriodsToPdf } from '../utils/pdfExport';
import { exportMatchToExcel } from '../utils/excelExport';
import { getEventTypeConfig } from '../utils/season';

interface PeriodPdfPreviewModalProps {
  isOpen: boolean;
  onClose: () => void;
  matchData: MatchData;
  initialPeriodIndex?: number;
}

export const PeriodPdfPreviewModal: React.FC<PeriodPdfPreviewModalProps> = ({
  isOpen,
  onClose,
  matchData,
  initialPeriodIndex = 0,
}) => {
  const [selectedPeriodIdx, setSelectedPeriodIdx] = useState<number>(initialPeriodIndex);
  const [viewAllPeriods, setViewAllPeriods] = useState<boolean>(false);
  const [zoomScale, setZoomScale] = useState<number>(0.85);
  const [isExportingSingle, setIsExportingSingle] = useState<boolean>(false);
  const [exportSingleSuccess, setExportSingleSuccess] = useState<boolean>(false);
  const [isExportingAllPdf, setIsExportingAllPdf] = useState<boolean>(false);
  const [exportAllPdfSuccess, setExportAllPdfSuccess] = useState<boolean>(false);
  const [isExportingExcel, setIsExportingExcel] = useState<boolean>(false);
  const [exportExcelSuccess, setExportExcelSuccess] = useState<boolean>(false);
  const previewContainerRef = useRef<HTMLDivElement>(null);

  // Sync initialPeriodIndex when modal opens or prop changes
  useEffect(() => {
    if (isOpen) {
      const validIndex =
        initialPeriodIndex >= 0 && initialPeriodIndex < matchData.periods.length
          ? initialPeriodIndex
          : 0;
      setSelectedPeriodIdx(validIndex);
      setViewAllPeriods(false);
      setExportSingleSuccess(false);
      setExportAllPdfSuccess(false);
      setExportExcelSuccess(false);

      // Automatically pick optimal initial zoom based on window width
      if (typeof window !== 'undefined') {
        if (window.innerWidth < 768) {
          setZoomScale(0.52);
        } else if (window.innerWidth < 1280) {
          setZoomScale(0.72);
        } else {
          setZoomScale(0.85);
        }
      }
    }
  }, [isOpen, initialPeriodIndex, matchData.periods.length]);

  // Handle Escape key to close modal
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && isOpen) {
        onClose();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  const currentPeriod = matchData.periods[selectedPeriodIdx] || matchData.periods[0];
  const eventConfig = getEventTypeConfig(matchData.eventType);

  const handleExportSinglePdf = async () => {
    setIsExportingSingle(true);
    try {
      const success = await exportPeriodToPdf(
        matchData,
        selectedPeriodIdx,
        'period-printable-sheet-preview'
      );
      if (success) {
        setExportSingleSuccess(true);
        setTimeout(() => setExportSingleSuccess(false), 3000);
      }
    } catch (err) {
      console.error('Erreur lors de l’export PDF de la période:', err);
    } finally {
      setIsExportingSingle(false);
    }
  };

  const handleExportAllPdf = async () => {
    setIsExportingAllPdf(true);
    try {
      const success = await exportAllPeriodsToPdf(matchData);
      if (success) {
        setExportAllPdfSuccess(true);
        setTimeout(() => setExportAllPdfSuccess(false), 3000);
      }
    } catch (err) {
      console.error('Erreur lors de l’export PDF des 4 matchs:', err);
    } finally {
      setIsExportingAllPdf(false);
    }
  };

  const handleExportExcel = () => {
    setIsExportingExcel(true);
    try {
      exportMatchToExcel(matchData);
      setExportExcelSuccess(true);
      setTimeout(() => setExportExcelSuccess(false), 3000);
    } catch (err) {
      console.error('Erreur lors de l’export Excel:', err);
    } finally {
      setIsExportingExcel(false);
    }
  };

  const handleDirectPrint = () => {
    const previewEl = document.getElementById(
      viewAllPeriods ? 'all-periods-preview-wrapper' : 'period-printable-sheet-preview'
    );
    if (!previewEl) {
      window.print();
      return;
    }

    const printWindow = window.open('', '_blank', 'width=1150,height=800');
    if (!printWindow) {
      window.print();
      return;
    }

    const htmlContent = `
      <!DOCTYPE html>
      <html>
        <head>
          <title>Feuille FootEco - ${viewAllPeriods ? 'Les 4 Matchs' : currentPeriod?.title || `Période ${selectedPeriodIdx + 1}`}</title>
          <meta charset="utf-8" />
          <style>
            @page { size: A4 landscape; margin: 8mm; }
            body { font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif; margin: 0; padding: 10px; background: white; color: black; }
            table { width: 100%; border-collapse: collapse; }
            td, th { border: 2px solid black; }
            .page-break { page-break-after: always; }
          </style>
          <link rel="stylesheet" href="${window.location.origin}/src/index.css" />
        </head>
        <body onload="window.print(); window.close();">
          ${previewEl.outerHTML}
        </body>
      </html>
    `;

    printWindow.document.open();
    printWindow.document.write(htmlContent);
    printWindow.document.close();
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-2 sm:p-4 md:p-6 bg-slate-950/75 backdrop-blur-xs animate-in fade-in duration-200"
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
      role="dialog"
      aria-modal="true"
      aria-labelledby="period-preview-modal-title"
    >
      <div className="relative flex flex-col bg-slate-100 rounded-2xl shadow-2xl border border-slate-300 w-full max-w-6xl max-h-[94vh] overflow-hidden text-slate-900">
        {/* Modal Top Header */}
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 px-4 sm:px-6 py-3 bg-white border-b border-slate-200 shrink-0">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl bg-indigo-100 text-indigo-700 flex items-center justify-center font-bold border border-indigo-200 shadow-2xs">
              <FileText className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 id="period-preview-modal-title" className="text-base font-extrabold text-slate-900">
                  {viewAllPeriods ? 'Aperçu des 4 Matchs Officiels' : `Aperçu & Export : ${currentPeriod?.title || `Période ${selectedPeriodIdx + 1}`}`}
                </h2>
                <span className="text-[10px] font-extrabold px-2 py-0.5 rounded-full bg-indigo-100 text-indigo-800 border border-indigo-200 uppercase tracking-wider">
                  {viewAllPeriods ? '4 Pages A4 Paysage' : 'Format A4 Paysage'}
                </span>
              </div>
              <p className="text-xs text-slate-500">
                {viewAllPeriods
                  ? 'Visualisez et téléchargez les 4 périodes du match dans le format officiel'
                  : `Mise en page officielle FootEco FE12 pour ${currentPeriod?.title || `Période ${selectedPeriodIdx + 1}`}`}
              </p>
            </div>
          </div>

          {/* Top Actions: Period Switcher & Close */}
          <div className="flex items-center flex-wrap gap-2 w-full sm:w-auto justify-between sm:justify-end">
            {/* Period Navigation Tabs */}
            <div className="inline-flex bg-slate-100 p-1 rounded-xl border border-slate-200 text-xs">
              {matchData.periods.map((p, idx) => {
                const isActive = !viewAllPeriods && idx === selectedPeriodIdx;
                return (
                  <button
                    key={p.id ?? idx}
                    type="button"
                    onClick={() => {
                      setViewAllPeriods(false);
                      setSelectedPeriodIdx(idx);
                    }}
                    className={`px-3 py-1 font-bold rounded-lg transition-all cursor-pointer ${
                      isActive
                        ? 'bg-indigo-600 text-white shadow-xs'
                        : 'text-slate-600 hover:text-slate-900 hover:bg-slate-200'
                    }`}
                  >
                    {p.title || `P${idx + 1}`}
                  </button>
                );
              })}

              <button
                type="button"
                onClick={() => setViewAllPeriods(true)}
                className={`flex items-center gap-1 px-3 py-1 font-bold rounded-lg transition-all cursor-pointer ${
                  viewAllPeriods
                    ? 'bg-indigo-600 text-white shadow-xs'
                    : 'text-slate-600 hover:text-slate-900 hover:bg-slate-200'
                }`}
              >
                <Layers className="w-3.5 h-3.5" />
                <span>Les 4 Matchs</span>
              </button>
            </div>

            {/* Close Button */}
            <button
              type="button"
              onClick={onClose}
              className="p-1.5 text-slate-400 hover:text-slate-700 hover:bg-slate-100 rounded-lg transition-colors ml-auto sm:ml-2 cursor-pointer"
              title="Fermer l'aperçu (Échap)"
              aria-label="Fermer"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Floating Controls Bar: Zoom & Export Controls */}
        <div className="flex flex-wrap items-center justify-between gap-2 px-4 sm:px-6 py-2.5 bg-slate-50 border-b border-slate-200 text-xs shrink-0">
          <div className="flex items-center gap-2">
            <span className="text-slate-500 font-semibold hidden sm:inline">Zoom :</span>
            <div className="inline-flex items-center bg-white border border-slate-300 rounded-lg shadow-2xs">
              <button
                type="button"
                onClick={() => setZoomScale((prev) => Math.max(0.4, Number((prev - 0.1).toFixed(2))))}
                className="p-1.5 hover:bg-slate-100 text-slate-600 rounded-l-lg cursor-pointer"
                title="Réduire le zoom"
              >
                <ZoomOut className="w-3.5 h-3.5" />
              </button>
              <span className="px-2 font-mono font-bold text-slate-700 text-[11px] min-w-[45px] text-center">
                {Math.round(zoomScale * 100)}%
              </span>
              <button
                type="button"
                onClick={() => setZoomScale((prev) => Math.min(1.4, Number((prev + 0.1).toFixed(2))))}
                className="p-1.5 hover:bg-slate-100 text-slate-600 rounded-r-lg cursor-pointer"
                title="Agrandir le zoom"
              >
                <ZoomIn className="w-3.5 h-3.5" />
              </button>
            </div>

            <button
              type="button"
              onClick={() => setZoomScale(0.85)}
              className="px-2 py-1 text-slate-600 hover:text-slate-900 bg-white border border-slate-300 rounded-lg text-[11px] font-semibold cursor-pointer"
              title="Réinitialiser l'échelle"
            >
              Ajuster
            </button>
          </div>

          <div className="flex items-center flex-wrap gap-2">
            {/* Direct Print */}
            <button
              type="button"
              onClick={handleDirectPrint}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-slate-700 bg-white hover:bg-slate-100 border border-slate-300 rounded-lg shadow-2xs transition-colors cursor-pointer"
              title="Imprimer directement"
            >
              <Printer className="w-3.5 h-3.5 text-slate-600" />
              <span className="hidden sm:inline">Imprimer</span>
            </button>

            {/* Export Excel (Les 4 Matchs) */}
            <button
              type="button"
              onClick={handleExportExcel}
              disabled={isExportingExcel}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-bold text-emerald-950 bg-emerald-100 hover:bg-emerald-200 border border-emerald-300 rounded-lg shadow-2xs transition-all active:scale-95 disabled:opacity-50 cursor-pointer"
              title="Exporter les 4 matchs et statistiques au format Excel (.xlsx)"
            >
              {isExportingExcel ? (
                <Loader2 className="w-3.5 h-3.5 animate-spin text-emerald-700" />
              ) : exportExcelSuccess ? (
                <Check className="w-3.5 h-3.5 text-emerald-700" />
              ) : (
                <FileSpreadsheet className="w-3.5 h-3.5 text-emerald-700" />
              )}
              <span>Excel (.xlsx)</span>
            </button>

            {/* Export Single Period PDF */}
            {!viewAllPeriods && (
              <button
                type="button"
                onClick={handleExportSinglePdf}
                disabled={isExportingSingle}
                className="inline-flex items-center gap-1.5 px-3.5 py-1.5 text-xs font-bold text-indigo-950 bg-indigo-100 hover:bg-indigo-200 border border-indigo-300 rounded-lg shadow-xs transition-all active:scale-95 disabled:opacity-50 cursor-pointer"
                title={`Télécharger ${currentPeriod?.title || `la période ${selectedPeriodIdx + 1}`} au format PDF (1 page)`}
              >
                {isExportingSingle ? (
                  <>
                    <Loader2 className="w-3.5 h-3.5 animate-spin text-indigo-700" />
                    <span>Génération PDF...</span>
                  </>
                ) : exportSingleSuccess ? (
                  <>
                    <Check className="w-3.5 h-3.5 text-indigo-700" />
                    <span>PDF Période Téléchargé !</span>
                  </>
                ) : (
                  <>
                    <Download className="w-3.5 h-3.5 text-indigo-700" />
                    <span>PDF Période {selectedPeriodIdx + 1}</span>
                  </>
                )}
              </button>
            )}

            {/* Export All 4 Periods PDF */}
            <button
              type="button"
              onClick={handleExportAllPdf}
              disabled={isExportingAllPdf}
              className="inline-flex items-center gap-1.5 px-4 py-1.5 text-xs font-bold text-white bg-rose-600 hover:bg-rose-700 active:scale-95 disabled:opacity-50 rounded-lg shadow-xs transition-all cursor-pointer"
              title="Télécharger toute la feuille avec les 4 matchs officiels (4 pages A4)"
            >
              {isExportingAllPdf ? (
                <>
                  <Loader2 className="w-3.5 h-3.5 animate-spin text-white" />
                  <span>Export des 4 matchs...</span>
                </>
              ) : exportAllPdfSuccess ? (
                <>
                  <Check className="w-3.5 h-3.5 text-white" />
                  <span>PDF 4 Matchs Téléchargé !</span>
                </>
              ) : (
                <>
                  <Download className="w-3.5 h-3.5 text-white" />
                  <span>PDF Les 4 Matchs (4 pages)</span>
                </>
              )}
            </button>
          </div>
        </div>

        {/* Modal Body: Scrollable Canvas Stage with Zoom Scale */}
        <div
          ref={previewContainerRef}
          className="flex-1 overflow-auto p-4 sm:p-6 bg-slate-300/70 flex justify-center items-start min-h-[420px]"
        >
          <div
            style={{
              transform: `scale(${zoomScale})`,
              transformOrigin: 'top center',
              transition: 'transform 0.15s ease-out',
            }}
            className="shrink-0 mb-8"
          >
            {viewAllPeriods ? (
              <div id="all-periods-preview-wrapper" className="flex flex-col gap-8">
                {matchData.periods.map((period, idx) => (
                  <div key={period.id ?? idx} className="flex flex-col items-center">
                    <div className="w-full flex items-center justify-between px-2 py-1 mb-2 text-xs font-extrabold text-slate-700">
                      <span>{period.title.toUpperCase()} (Page {idx + 1} / {matchData.periods.length})</span>
                      <span className="text-slate-500">Format A4 Paysage Officiel</span>
                    </div>
                    <div className="w-[1080px] min-w-[1080px] bg-white rounded-md shadow-2xl border border-slate-400 p-6 text-black">
                      <PrintableOfficialSheet
                        matchData={matchData}
                        periodIndex={idx}
                        id={`preview-period-page-${idx}`}
                        isPrintOnly={false}
                        className="font-sans text-black"
                      />
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="w-[1080px] min-w-[1080px] bg-white rounded-md shadow-2xl border border-slate-400 p-6 text-black">
                <PrintableOfficialSheet
                  matchData={matchData}
                  periodIndex={selectedPeriodIdx}
                  id="period-printable-sheet-preview"
                  isPrintOnly={false}
                  className="font-sans text-black"
                />
              </div>
            )}
          </div>
        </div>

        {/* Modal Footer Note */}
        <div className="flex flex-col sm:flex-row items-center justify-between gap-2 px-6 py-2.5 bg-white border-t border-slate-200 text-xs text-slate-500 shrink-0">
          <div className="flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-emerald-500 inline-block" />
            <span>
              Feuille officielle FootEco Bas-Valais • {eventConfig.label} ({matchData.season || '2026/2027'}) • {viewAllPeriods ? 'Les 4 Matchs' : currentPeriod?.title || `Période ${selectedPeriodIdx + 1}`}
            </span>
          </div>
          <div className="text-[11px] text-slate-400">
            Export vectoriel haute définition 4 pages A4 Paysage
          </div>
        </div>
      </div>
    </div>
  );
};
