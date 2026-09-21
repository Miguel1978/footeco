import React, { useState } from 'react';
import { Download, Loader2, Check, FileText } from 'lucide-react';
import { MatchData } from '../types';
import { getEventTypeConfig } from '../utils/season';
import { generateOfficialSheetPdf } from '../utils/pdfExport';

export { generateOfficialSheetPdf, generatePrintableOfficialSheetPdf } from '../utils/pdfExport';

interface PrintableOfficialSheetProps {
  matchData: MatchData;
  periodIndex?: number;
  id?: string;
  isPrintOnly?: boolean;
  className?: string;
  showExportButton?: boolean;
  onExportPdf?: () => void;
}

export const PrintableOfficialSheet: React.FC<PrintableOfficialSheetProps> = ({
  matchData,
  periodIndex,
  id = 'official-printable-sheet',
  isPrintOnly = true,
  className,
  showExportButton = false,
  onExportPdf,
}) => {
  const [isGeneratingPdf, setIsGeneratingPdf] = useState(false);
  const [pdfSuccess, setPdfSuccess] = useState(false);

  const eventConfig = getEventTypeConfig(matchData.eventType);

  const periodsToRender =
    typeof periodIndex === 'number' && periodIndex >= 0 && periodIndex < matchData.periods.length
      ? [matchData.periods[periodIndex]]
      : matchData.periods;

  const currentPeriod = typeof periodIndex === 'number' ? matchData.periods[periodIndex] : null;

  const handleInternalExportPdf = async () => {
    if (onExportPdf) {
      onExportPdf();
      return;
    }
    setIsGeneratingPdf(true);
    try {
      const success = await generateOfficialSheetPdf(matchData, {
        periodIndex: typeof periodIndex === 'number' ? periodIndex : undefined,
        targetElementId: id,
      });
      if (success) {
        setPdfSuccess(true);
        setTimeout(() => setPdfSuccess(false), 3000);
      }
    } catch (err) {
      console.error('[PrintableOfficialSheet] Erreur export PDF jsPDF + html2canvas:', err);
    } finally {
      setIsGeneratingPdf(false);
    }
  };

  return (
    <div
      id={id}
      data-printable-sheet="true"
      className={
        className
          ? className
          : isPrintOnly
          ? 'hidden print:block font-sans text-black p-4 bg-white min-h-screen'
          : 'font-sans text-black p-4 bg-white'
      }
    >
      {/* Optional Direct Action Bar (Hidden in Print/PDF output) */}
      {showExportButton && (
        <div className="print:hidden mb-4 p-3 bg-slate-100 border border-slate-300 rounded-lg flex items-center justify-between gap-3 shadow-xs">
          <div className="flex items-center gap-2 text-xs font-semibold text-slate-700">
            <FileText className="w-4 h-4 text-rose-600" />
            <span>Feuille de match officielle FootEco FE12</span>
            {currentPeriod && (
              <span className="px-2 py-0.5 rounded bg-amber-200/80 text-amber-900 font-bold">
                {currentPeriod.title}
              </span>
            )}
          </div>
          <button
            type="button"
            onClick={handleInternalExportPdf}
            disabled={isGeneratingPdf}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-bold text-white bg-rose-600 hover:bg-rose-700 active:scale-95 disabled:opacity-50 rounded-md shadow-xs transition-all cursor-pointer"
            title="Générer et télécharger le PDF officiel avec jsPDF et html2canvas"
          >
            {isGeneratingPdf ? (
              <>
                <Loader2 className="w-3.5 h-3.5 animate-spin" />
                <span>Génération PDF (jsPDF + html2canvas)...</span>
              </>
            ) : pdfSuccess ? (
              <>
                <Check className="w-3.5 h-3.5 text-emerald-200" />
                <span>PDF téléchargé !</span>
              </>
            ) : (
              <>
                <Download className="w-3.5 h-3.5" />
                <span>Télécharger PDF (jsPDF + html2canvas)</span>
              </>
            )}
          </button>
        </div>
      )}

      {/* Printable Header Bar matching screenshot */}
      <table className="w-full border-collapse border-2 border-black text-sm mb-4">
        <tbody>
          <tr>
            <td className="border-2 border-black p-2 font-bold italic w-1/4">
              Type & Saison<br />
              <span className="text-base font-extrabold not-italic">
                {eventConfig.label} • {matchData.season || '2026/2027'}
              </span>
              {currentPeriod && (
                <div className="text-xs font-bold text-slate-800 uppercase mt-0.5">
                  ▶ {currentPeriod.title} ({currentPeriod.durationMinutes || 15} min)
                </div>
              )}
            </td>
            <td className="border-2 border-black p-2 font-bold italic w-1/4">
              {matchData.eventType === 'entrainement' ? 'Cadre / Séance' : 'Adversaire'}<br />
              <span className="text-base font-normal not-italic">{matchData.opponent || '____________________'}</span>
            </td>
            <td className="border-2 border-black p-2 font-bold italic w-1/4 text-center">
              {currentPeriod ? 'Score période / match' : 'Score final'}<br />
              <span className="text-base font-bold not-italic">
                {currentPeriod
                  ? `${currentPeriod.team1.scoreMatch || '0'} - ${currentPeriod.team2.scoreMatch || '0'}${matchData.finalScore ? ` (Total: ${matchData.finalScore})` : ''}`
                  : matchData.finalScore || '-'}
              </span>
            </td>
            <td className="border-2 border-black p-2 font-bold italic w-1/4 text-center">
              Date<br />
              <span className="text-base font-normal not-italic">{matchData.date || '____ / ____ / 2026'}</span>
            </td>
          </tr>
        </tbody>
      </table>

      {/* For each period in periodsToRender */}
      {periodsToRender.map((period) => (
        <div key={period.id} className="mb-6 page-break-inside-avoid">
          <table className="w-full border-collapse border-2 border-black text-xs">
            <thead>
              {/* Header: Score | Equipe 1 (Yellow) | Equipe 2 (Red) */}
              <tr>
                <th className="w-40 border-2 border-black bg-slate-200 p-1 text-center font-bold italic">
                  Score {period.title.toLowerCase()} ({period.durationMinutes || 15} min)
                </th>
                <th colSpan={4} className="border-2 border-black bg-[#FFFF00] p-1 text-black">
                  <div className="flex justify-between items-center px-2">
                    <span className="font-extrabold uppercase">{period.team1.teamName || 'Equipe 1'}</span>
                    <span className="font-bold italic">{period.team1.coachName || 'Seb'}</span>
                  </div>
                </th>
                <th colSpan={4} className="border-2 border-black bg-[#FF0000] p-1 text-white">
                  <div className="flex justify-between items-center px-2">
                    <span className="font-extrabold uppercase">{period.team2.teamName || 'Equipe 2'}</span>
                    <span className="font-bold italic">{period.team2.coachName || 'Miguel'}</span>
                  </div>
                </th>
              </tr>

              {/* Sub-headers */}
              <tr className="border-b-2 border-black bg-slate-100 font-bold">
                <th className="border-r-2 border-black p-1"></th>
                <th className="border-r border-black p-1 text-left underline">Titulaires :</th>
                <th className="border-r border-black p-1 text-left w-24 underline">Position</th>
                <th className="border-r border-black p-1 text-center w-20">Éval (1-4)</th>
                <th className="border-r-2 border-black p-1 text-center w-20">Schootout</th>

                <th className="border-r border-black p-1 text-left underline">Titulaires :</th>
                <th className="border-r border-black p-1 text-left w-24 underline">Position</th>
                <th className="border-r border-black p-1 text-center w-20">Éval (1-4)</th>
                <th className="border-2 border-black p-1 text-center w-20">Schootout</th>
              </tr>
            </thead>

            <tbody>
              {/* Row 0 to 6 */}
              {[0, 1, 2, 3, 4, 5, 6].map((idx) => {
                const t1 = period.team1.titulaires[idx];
                const t2 = period.team2.titulaires[idx];

                const renderSlotEval = (slot?: import('../types').PlayerSlot) => {
                  if (!slot) return '';
                  const parts: string[] = [];
                  if (slot.rating) parts.push(`★${slot.rating}/4`);
                  if (slot.note) parts.push(slot.note);
                  return parts.join(' ');
                };

                return (
                  <tr key={idx} className="border-b border-black">
                    {/* Left Score Cell on Row 0 */}
                    {idx === 0 && (
                      <td rowSpan={7} className="border-r-2 border-black p-2 align-top text-center">
                        <div className="bg-[#FFFF00] font-bold py-0.5 mb-1 border border-black text-[11px]">
                          Score équipe 1
                        </div>
                        <div className="mb-2">
                          <span className="font-bold">{period.team1.scoreMatch ?? '0'}</span> à <span className="font-bold">{period.team1.scoreOpponent ?? '0'}</span>
                        </div>
                        <div className="font-bold text-[11px]">Schootout</div>
                        <div className="mb-2">
                          <span className="font-bold">{period.team1.shootoutScore || '___'}</span> à <span className="font-bold">{period.team1.shootoutOpponent || '___'}</span>
                        </div>
                        <div className="font-bold text-[11px] mb-2">
                          Point = {period.team1.points ?? '0'}
                        </div>
                        <div className="text-[10px] font-semibold text-slate-700 mb-3">
                          {period.team1.result || 'Victoire / Défaite'}
                        </div>

                        <div className="bg-[#FF0000] text-white font-bold py-0.5 mb-1 border border-black text-[11px]">
                          Score équipe 2
                        </div>
                        <div className="mb-2">
                          <span className="font-bold">{period.team2.scoreMatch ?? '0'}</span> à <span className="font-bold">{period.team2.scoreOpponent ?? '0'}</span>
                        </div>
                        <div className="font-bold text-[11px]">Schootout</div>
                        <div className="mb-2">
                          <span className="font-bold">{period.team2.shootoutScore || '___'}</span> à <span className="font-bold">{period.team2.shootoutOpponent || '___'}</span>
                        </div>
                        <div className="font-bold text-[11px] mb-2">
                          Point = {period.team2.points ?? '0'}
                        </div>
                        <div className="text-[10px] font-semibold text-slate-700">
                          {period.team2.result || 'Victoire / Défaite'}
                        </div>
                      </td>
                    )}

                    {/* Equipe 1 Starter */}
                    <td className="border-r border-black p-1.5 font-bold">
                      {t1?.playerName || ''}
                    </td>
                    <td className="border-r border-black p-1.5">
                      {t1?.position || ''}
                    </td>
                    <td className="border-r border-black p-1.5 text-center text-[10px]">
                      {renderSlotEval(t1)}
                    </td>
                    <td className="border-r-2 border-black p-1.5 text-center font-semibold">
                      {t1?.shootout || ''}
                    </td>

                    {/* Equipe 2 Starter */}
                    <td className="border-r border-black p-1.5 font-bold">
                      {t2?.playerName || ''}
                    </td>
                    <td className="border-r border-black p-1.5">
                      {t2?.position || ''}
                    </td>
                    <td className="border-r border-black p-1.5 text-center text-[10px]">
                      {renderSlotEval(t2)}
                    </td>
                    <td className="border-2 border-black p-1.5 text-center font-semibold">
                      {t2?.shootout || ''}
                    </td>
                  </tr>
                );
              })}

              {/* Remplaçants Header Row */}
              <tr className="border-t-2 border-b border-black bg-slate-100 font-bold">
                <td className="border-r-2 border-black p-1"></td>
                <td colSpan={4} className="border-r-2 border-black p-1 underline">
                  Remplaçants :
                </td>
                <td colSpan={4} className="border-2 border-black p-1 underline">
                  Remplaçants :
                </td>
              </tr>

              {/* Remplaçants Rows */}
              {Array.from({ length: Math.max(period.team1.remplacants.length, period.team2.remplacants.length, 1) }).map((_, rIdx) => {
                const sub1 = period.team1.remplacants[rIdx];
                const sub2 = period.team2.remplacants[rIdx];

                const renderSlotEval = (slot?: import('../types').PlayerSlot) => {
                  if (!slot) return '';
                  const parts: string[] = [];
                  if (slot.rating) parts.push(`★${slot.rating}/4`);
                  if (slot.note) parts.push(slot.note);
                  return parts.join(' ');
                };

                return (
                  <tr key={`print-sub-${rIdx}`} className="border-b border-black">
                    <td className="border-r-2 border-black p-1"></td>
                    <td className="border-r border-black p-1 font-semibold">{sub1?.playerName || ''}</td>
                    <td className="border-r border-black p-1">{sub1?.position || ''}</td>
                    <td className="border-r border-black p-1 text-center text-[10px]">{renderSlotEval(sub1)}</td>
                    <td className="border-r-2 border-black p-1 text-center">{sub1?.shootout || ''}</td>

                    <td className="border-r border-black p-1 font-semibold">{sub2?.playerName || ''}</td>
                    <td className="border-r border-black p-1">{sub2?.position || ''}</td>
                    <td className="border-r border-black p-1 text-center text-[10px]">{renderSlotEval(sub2)}</td>
                    <td className="border-2 border-black p-1 text-center">{sub2?.shootout || ''}</td>
                  </tr>
                );
              })}
            </tbody>
          </table>

          {period.notes && period.notes.trim() ? (
            <div className="mt-2 p-2 border-2 border-black bg-slate-50 text-xs">
              <span className="font-extrabold uppercase text-[11px] text-slate-900 mr-2">
                📋 Notes & Consignes Tactiques ({period.title}) :
              </span>
              <span className="text-slate-900 whitespace-pre-wrap leading-relaxed">{period.notes}</span>
            </div>
          ) : (
            <div className="mt-1.5 p-1.5 border border-slate-300 bg-slate-50/60 text-[11px] text-slate-600">
              <span className="font-bold uppercase text-[10px] text-slate-700 mr-2">
                📋 Notes Tactiques ({period.title}) :
              </span>
              <span className="italic text-slate-400">Aucune consigne ou observation renseignée pour cette période</span>
            </div>
          )}
        </div>
      ))}
    </div>
  );
};
