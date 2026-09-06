import React, { useState } from 'react';
import {
  X,
  Download,
  FileSpreadsheet,
  FileText,
  Printer,
  Check,
  Loader2,
  Calendar,
  Layers,
  Sparkles,
  Award,
  Users,
  Shield,
  Clock,
  Eye,
  FileDown
} from 'lucide-react';
import { MatchData } from '../types';
import { exportPeriodToPdf, exportAllPeriodsToPdf } from '../utils/pdfExport';
import { exportPeriodToExcel, exportMatchToExcel } from '../utils/excelExport';
import { getEventTypeConfig } from '../utils/season';

interface ExportMatchModalProps {
  isOpen: boolean;
  onClose: () => void;
  matchData: MatchData;
  activePeriodIndex: number;
  onOpenPdfPreviewModal?: (periodIndex: number, viewAll: boolean) => void;
}

export const ExportMatchModal: React.FC<ExportMatchModalProps> = ({
  isOpen,
  onClose,
  matchData,
  activePeriodIndex,
  onOpenPdfPreviewModal,
}) => {
  const [selectedScope, setSelectedScope] = useState<'single' | 'all'>('single');
  const [targetPeriodIndex, setTargetPeriodIndex] = useState<number>(activePeriodIndex);
  
  // Loading & success states
  const [isExportingPdf, setIsExportingPdf] = useState(false);
  const [pdfSuccess, setPdfSuccess] = useState(false);
  const [isExportingExcel, setIsExportingExcel] = useState(false);
  const [excelSuccess, setExcelSuccess] = useState(false);

  if (!isOpen) return null;

  const currentPeriod = matchData.periods[targetPeriodIndex] || matchData.periods[0];
  const eventConfig = getEventTypeConfig(matchData.eventType);

  const handleExportPdf = async () => {
    setIsExportingPdf(true);
    try {
      if (selectedScope === 'single') {
        const success = await exportPeriodToPdf(matchData, targetPeriodIndex);
        if (success) {
          setPdfSuccess(true);
          setTimeout(() => setPdfSuccess(false), 3000);
        }
      } else {
        const success = await exportAllPeriodsToPdf(matchData);
        if (success) {
          setPdfSuccess(true);
          setTimeout(() => setPdfSuccess(false), 3000);
        }
      }
    } catch (err) {
      console.error('Erreur export PDF:', err);
    } finally {
      setIsExportingPdf(false);
    }
  };

  const handleExportExcel = () => {
    setIsExportingExcel(true);
    try {
      if (selectedScope === 'single') {
        exportPeriodToExcel(matchData, targetPeriodIndex);
      } else {
        exportMatchToExcel(matchData);
      }
      setExcelSuccess(true);
      setTimeout(() => setExcelSuccess(false), 3000);
    } catch (err) {
      console.error('Erreur export Excel:', err);
    } finally {
      setIsExportingExcel(false);
    }
  };

  const handleDirectPrint = () => {
    window.print();
  };

  const handleOpenPreview = () => {
    if (onOpenPdfPreviewModal) {
      onClose();
      onOpenPdfPreviewModal(targetPeriodIndex, selectedScope === 'all');
    } else {
      window.print();
    }
  };

  // Count players
  const t1Starters = currentPeriod?.team1?.titulaires?.filter(s => s.playerName) || [];
  const t1Subs = currentPeriod?.team1?.remplacants?.filter(s => s.playerName) || [];
  const t2Starters = currentPeriod?.team2?.titulaires?.filter(s => s.playerName) || [];
  const t2Subs = currentPeriod?.team2?.remplacants?.filter(s => s.playerName) || [];

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-5 bg-slate-950/75 backdrop-blur-xs animate-in fade-in duration-150"
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
      role="dialog"
      aria-modal="true"
    >
      <div className="relative flex flex-col bg-white rounded-2xl shadow-2xl border border-slate-200 w-full max-w-2xl overflow-hidden text-slate-900">
        
        {/* Header */}
        <div className="flex items-center justify-between px-5 py-4 border-b border-slate-200 bg-slate-50/80">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-indigo-600 text-white flex items-center justify-center font-bold shadow-xs">
              <FileDown className="w-5 h-5 text-white" />
            </div>
            <div>
              <h2 className="text-base font-extrabold text-slate-900 leading-tight">
                Exporter la Feuille de Match FootEco
              </h2>
              <p className="text-xs text-slate-500 mt-0.5">
                {eventConfig.label} • {matchData.opponent ? `vs ${matchData.opponent}` : 'Séance'} • {matchData.date || 'Aujourd’hui'}
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="p-1.5 text-slate-400 hover:text-slate-700 hover:bg-slate-200/70 rounded-lg transition-colors cursor-pointer"
            aria-label="Fermer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Modal Body */}
        <div className="p-5 space-y-5 overflow-y-auto max-h-[80vh]">
          
          {/* Step 1: Selection of Scope */}
          <div>
            <label className="block text-xs font-extrabold uppercase tracking-wider text-slate-500 mb-2">
              1. Choisir le périmètre d'exportation
            </label>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {/* Option A: Période active */}
              <button
                type="button"
                onClick={() => setSelectedScope('single')}
                className={`p-3.5 rounded-xl border text-left transition-all cursor-pointer flex flex-col justify-between ${
                  selectedScope === 'single'
                    ? 'border-indigo-600 bg-indigo-50/70 ring-2 ring-indigo-500/30'
                    : 'border-slate-200 hover:border-slate-300 hover:bg-slate-50'
                }`}
              >
                <div className="flex items-center justify-between mb-1.5">
                  <span className="font-extrabold text-sm text-slate-900 flex items-center gap-1.5">
                    <FileText className="w-4 h-4 text-indigo-600" />
                    <span>Feuille de match active</span>
                  </span>
                  {selectedScope === 'single' && (
                    <span className="w-2 h-2 rounded-full bg-indigo-600 animate-pulse" />
                  )}
                </div>
                <p className="text-xs text-slate-600 mb-3">
                  Exporte uniquement <strong>{currentPeriod?.title}</strong> ({currentPeriod?.durationMinutes || 15}m) avec ses scores, compositions et notes tactiques.
                </p>

                {/* Sub-selector if multiple periods */}
                <div className="flex items-center gap-1.5 pt-2 border-t border-indigo-200/60 mt-auto">
                  <span className="text-[11px] text-slate-500 font-medium">Période :</span>
                  <div className="inline-flex bg-white rounded-lg p-0.5 border border-slate-300 text-xs">
                    {matchData.periods.map((p, idx) => (
                      <button
                        key={p.id ?? idx}
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          setSelectedScope('single');
                          setTargetPeriodIndex(idx);
                        }}
                        className={`px-2 py-0.5 font-bold rounded-md transition-all ${
                          targetPeriodIndex === idx && selectedScope === 'single'
                            ? 'bg-indigo-600 text-white shadow-2xs'
                            : 'text-slate-600 hover:text-slate-900'
                        }`}
                      >
                        {p.title.replace('Match ', 'M')}
                      </button>
                    ))}
                  </div>
                </div>
              </button>

              {/* Option B: Les 4 Périodes */}
              <button
                type="button"
                onClick={() => setSelectedScope('all')}
                className={`p-3.5 rounded-xl border text-left transition-all cursor-pointer flex flex-col justify-between ${
                  selectedScope === 'all'
                    ? 'border-indigo-600 bg-indigo-50/70 ring-2 ring-indigo-500/30'
                    : 'border-slate-200 hover:border-slate-300 hover:bg-slate-50'
                }`}
              >
                <div>
                  <div className="flex items-center justify-between mb-1.5">
                    <span className="font-extrabold text-sm text-slate-900 flex items-center gap-1.5">
                      <Layers className="w-4 h-4 text-rose-600" />
                      <span>Les 4 Périodes de match</span>
                    </span>
                    {selectedScope === 'all' && (
                      <span className="w-2 h-2 rounded-full bg-rose-600 animate-pulse" />
                    )}
                  </div>
                  <p className="text-xs text-slate-600">
                    Exporte les 4 matchs FE12 complets (Match 1, 2, 3, 4), l'ensemble des scores, compositions, shootout, temps de jeu et observations.
                  </p>
                </div>
                <div className="pt-2 border-t border-slate-200/60 mt-3 text-[11px] font-bold text-slate-500 flex items-center gap-1">
                  <span>Format : 4 pages A4 paysage ou classeur multi-onglets</span>
                </div>
              </button>
            </div>
          </div>

          {/* Detailed Content Summary Box */}
          <div className="bg-slate-50 border border-slate-200 rounded-xl p-3.5 text-xs text-slate-700">
            <div className="font-bold text-slate-900 mb-2 flex items-center justify-between">
              <span className="flex items-center gap-1.5">
                <Shield className="w-4 h-4 text-emerald-600" />
                <span>Contenu inclus dans l'export ({selectedScope === 'single' ? currentPeriod?.title : 'Les 4 Matchs'})</span>
              </span>
              <span className="text-[11px] font-semibold text-slate-500">
                {selectedScope === 'single'
                  ? `${t1Starters.length + t2Starters.length} titulaires, ${t1Subs.length + t2Subs.length} remplaçants`
                  : '4 périodes complètes'}
              </span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-[11px]">
              <div className="flex items-start gap-1.5">
                <span className="text-emerald-600 font-bold">✓</span>
                <span>
                  <strong>Scores & Résultats :</strong> {selectedScope === 'single' 
                    ? `Eq.1 (${currentPeriod?.team1.scoreMatch || 0}-${currentPeriod?.team1.scoreOpponent || 0}) • Eq.2 (${currentPeriod?.team2.scoreMatch || 0}-${currentPeriod?.team2.scoreOpponent || 0})` 
                    : 'Scores, Shootout et Points des 4 périodes'}
                </span>
              </div>
              <div className="flex items-start gap-1.5">
                <span className="text-emerald-600 font-bold">✓</span>
                <span>
                  <strong>Compositions & Postes :</strong> 7v7 FootEco, gardien, défenseurs, milieux, attaquants et remplaçants.
                </span>
              </div>
              <div className="flex items-start gap-1.5">
                <span className="text-emerald-600 font-bold">✓</span>
                <span>
                  <strong>Évaluations & Notes joueurs :</strong> Notes de 1 à 4 étoiles (★) et remarques de coaching.
                </span>
              </div>
              <div className="flex items-start gap-1.5">
                <span className="text-emerald-600 font-bold">✓</span>
                <span>
                  <strong>Notes & Consignes tactiques :</strong> {selectedScope === 'single' 
                    ? (currentPeriod?.notes ? `"${currentPeriod.notes.slice(0, 45)}..."` : 'Observations & consignes de la période') 
                    : 'Observations spécifiques de chaque match'}
                </span>
              </div>
            </div>
          </div>

          {/* Step 2: Format Choice & Action Buttons */}
          <div>
            <label className="block text-xs font-extrabold uppercase tracking-wider text-slate-500 mb-2">
              2. Format de fichier souhaité
            </label>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
              
              {/* Option PDF */}
              <div className="p-4 rounded-xl border border-rose-200 bg-rose-50/30 flex flex-col justify-between">
                <div>
                  <div className="flex items-center gap-2 mb-1.5">
                    <div className="w-8 h-8 rounded-lg bg-rose-100 text-rose-700 flex items-center justify-center font-bold">
                      <FileText className="w-4 h-4" />
                    </div>
                    <div>
                      <h4 className="font-extrabold text-sm text-slate-900">Document PDF (.pdf)</h4>
                      <p className="text-[11px] text-slate-500">
                        {selectedScope === 'single' ? '1 page A4 Paysage' : '4 pages A4 Paysage officielles'}
                      </p>
                    </div>
                  </div>
                  <p className="text-xs text-slate-600 mt-2 mb-4 leading-relaxed">
                    Mise en page officielle FootEco prête pour l'impression, l'archivage ou l'envoi aux arbitres et responsables.
                  </p>
                </div>

                <div className="space-y-2">
                  <button
                    type="button"
                    onClick={handleExportPdf}
                    disabled={isExportingPdf}
                    className="w-full flex items-center justify-center gap-2 py-2.5 px-4 rounded-xl bg-rose-600 hover:bg-rose-700 text-white font-bold text-xs shadow-sm transition-all active:scale-95 disabled:opacity-50 cursor-pointer"
                  >
                    {isExportingPdf ? (
                      <>
                        <Loader2 className="w-4 h-4 animate-spin" />
                        <span>Génération PDF en cours...</span>
                      </>
                    ) : pdfSuccess ? (
                      <>
                        <Check className="w-4 h-4" />
                        <span>PDF téléchargé avec succès !</span>
                      </>
                    ) : (
                      <>
                        <Download className="w-4 h-4" />
                        <span>Télécharger en PDF</span>
                      </>
                    )}
                  </button>

                  <button
                    type="button"
                    onClick={handleOpenPreview}
                    className="w-full flex items-center justify-center gap-1.5 py-1.5 px-3 rounded-lg bg-white hover:bg-rose-100 text-rose-800 border border-rose-200 text-[11px] font-semibold transition-colors cursor-pointer"
                  >
                    <Eye className="w-3.5 h-3.5 text-rose-700" />
                    <span>Aperçu avant impression</span>
                  </button>
                </div>
              </div>

              {/* Option Excel */}
              <div className="p-4 rounded-xl border border-emerald-200 bg-emerald-50/30 flex flex-col justify-between">
                <div>
                  <div className="flex items-center gap-2 mb-1.5">
                    <div className="w-8 h-8 rounded-lg bg-emerald-100 text-emerald-800 flex items-center justify-center font-bold">
                      <FileSpreadsheet className="w-4 h-4" />
                    </div>
                    <div>
                      <h4 className="font-extrabold text-sm text-slate-900">Classeur Excel (.xlsx)</h4>
                      <p className="text-[11px] text-slate-500">
                        {selectedScope === 'single' ? 'Feuille active + Temps de jeu' : 'Classeur complet multi-feuilles'}
                      </p>
                    </div>
                  </div>
                  <p className="text-xs text-slate-600 mt-2 mb-4 leading-relaxed">
                    Tableur complet avec colonnes éditables, statistiques, temps de jeu calculés, effectif et notes tactiques intégrées.
                  </p>
                </div>

                <div className="space-y-2">
                  <button
                    type="button"
                    onClick={handleExportExcel}
                    disabled={isExportingExcel}
                    className="w-full flex items-center justify-center gap-2 py-2.5 px-4 rounded-xl bg-emerald-700 hover:bg-emerald-800 text-white font-bold text-xs shadow-sm transition-all active:scale-95 disabled:opacity-50 cursor-pointer"
                  >
                    {isExportingExcel ? (
                      <>
                        <Loader2 className="w-4 h-4 animate-spin" />
                        <span>Création du fichier Excel...</span>
                      </>
                    ) : excelSuccess ? (
                      <>
                        <Check className="w-4 h-4" />
                        <span>Fichier Excel téléchargé !</span>
                      </>
                    ) : (
                      <>
                        <FileSpreadsheet className="w-4 h-4" />
                        <span>Télécharger en Excel (.xlsx)</span>
                      </>
                    )}
                  </button>

                  <button
                    type="button"
                    onClick={handleDirectPrint}
                    className="w-full flex items-center justify-center gap-1.5 py-1.5 px-3 rounded-lg bg-white hover:bg-emerald-100 text-emerald-900 border border-emerald-200 text-[11px] font-semibold transition-colors cursor-pointer"
                  >
                    <Printer className="w-3.5 h-3.5 text-emerald-700" />
                    <span>Imprimer directement</span>
                  </button>
                </div>
              </div>

            </div>
          </div>

        </div>

        {/* Footer */}
        <div className="flex items-center justify-between px-5 py-3 border-t border-slate-200 bg-slate-50 text-xs text-slate-500">
          <div className="flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-emerald-500 inline-block" />
            <span>Format conforme Association Suisse de Football (FootEco FE12)</span>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="px-3 py-1 text-slate-600 hover:text-slate-900 font-semibold"
          >
            Fermer
          </button>
        </div>

      </div>
    </div>
  );
};
