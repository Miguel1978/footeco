import React from 'react';
import { MatchData } from '../types';
import { getEventTypeConfig } from '../utils/season';

interface PrintableOfficialSheetProps {
  matchData: MatchData;
}

export const PrintableOfficialSheet: React.FC<PrintableOfficialSheetProps> = ({ matchData }) => {
  const eventConfig = getEventTypeConfig(matchData.eventType);

  return (
    <div id="official-printable-sheet" className="hidden print:block font-sans text-black p-4 bg-white min-h-screen">
      {/* Printable Header Bar matching screenshot */}
      <table className="w-full border-collapse border-2 border-black text-sm mb-4">
        <tbody>
          <tr>
            <td className="border-2 border-black p-2 font-bold italic w-1/4">
              Type & Saison<br />
              <span className="text-base font-extrabold not-italic">
                {eventConfig.label} • Saison {matchData.season || '2026/2027'}
              </span>
            </td>
            <td className="border-2 border-black p-2 font-bold italic w-1/4">
              {matchData.eventType === 'entrainement' ? 'Cadre / Séance' : 'Adversaire'}<br />
              <span className="text-base font-normal not-italic">{matchData.opponent || '____________________'}</span>
            </td>
            <td className="border-2 border-black p-2 font-bold italic w-1/4 text-center">
              Score final<br />
              <span className="text-base font-bold not-italic">{matchData.finalScore || '-'}</span>
            </td>
            <td className="border-2 border-black p-2 font-bold italic w-1/4 text-center">
              Date<br />
              <span className="text-base font-normal not-italic">{matchData.date || '____ / ____ / 2026'}</span>
            </td>
          </tr>
        </tbody>
      </table>

      {/* For each period in matchData */}
      {matchData.periods.map((period) => (
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
                          <span className="font-bold">{period.team1.scoreMatch || '___'}</span> à <span className="font-bold">{period.team1.scoreOpponent || '___'}</span>
                        </div>
                        <div className="font-bold text-[11px]">Schootout</div>
                        <div className="mb-2">
                          <span className="font-bold">{period.team1.shootoutScore || '___'}</span> à <span className="font-bold">{period.team1.shootoutOpponent || '___'}</span>
                        </div>
                        <div className="font-bold text-[11px] mb-2">
                          Point = {period.team1.points || '___'}
                        </div>
                        <div className="text-[10px] font-semibold text-slate-700 mb-3">
                          {period.team1.result || 'Victoire / Défaite'}
                        </div>

                        <div className="bg-[#FF0000] text-white font-bold py-0.5 mb-1 border border-black text-[11px]">
                          Score équipe 2
                        </div>
                        <div className="mb-2">
                          <span className="font-bold">{period.team2.scoreMatch || '___'}</span> à <span className="font-bold">{period.team2.scoreOpponent || '___'}</span>
                        </div>
                        <div className="font-bold text-[11px]">Schootout</div>
                        <div className="mb-2">
                          <span className="font-bold">{period.team2.shootoutScore || '___'}</span> à <span className="font-bold">{period.team2.shootoutOpponent || '___'}</span>
                        </div>
                        <div className="font-bold text-[11px] mb-2">
                          Point = {period.team2.points || '___'}
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

          {period.notes && (
            <div className="mt-1 p-1.5 border-2 border-black bg-slate-50 text-xs">
              <span className="font-bold">Observations / Remarques : </span>
              <span className="italic">{period.notes}</span>
            </div>
          )}
        </div>
      ))}
    </div>
  );
};
