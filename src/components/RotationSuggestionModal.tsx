import React, { useState } from 'react';
import { 
  X, 
  ArrowRightLeft, 
  Sparkles, 
  Check, 
  AlertCircle, 
  Clock, 
  TrendingUp, 
  TrendingDown, 
  Users, 
  RotateCcw,
  Zap,
  CheckCircle2
} from 'lucide-react';
import { PeriodMatch } from '../types';
import { 
  calculateTeamPlaytime, 
  generatePeriodRotationSuggestions, 
  executeSingleRotationSwap,
  autoBalanceRosterAcrossAllPeriods,
  RotationSuggestion
} from '../utils/rotationBalancer';

interface RotationSuggestionModalProps {
  isOpen: boolean;
  onClose: () => void;
  period: PeriodMatch;
  allPeriods: PeriodMatch[];
  initialTeam?: 'team1' | 'team2';
  onUpdatePeriod?: (updatedPeriod: PeriodMatch) => void;
  onUpdateAllPeriods?: (updatedPeriods: PeriodMatch[]) => void;
}

export const RotationSuggestionModal: React.FC<RotationSuggestionModalProps> = ({
  isOpen,
  onClose,
  period,
  allPeriods,
  initialTeam = 'team1',
  onUpdatePeriod,
  onUpdateAllPeriods,
}) => {
  const [selectedTeam, setSelectedTeam] = useState<'team1' | 'team2'>(initialTeam);
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  if (!isOpen) return null;

  // Calculate stats and suggestions for current team
  const summary = calculateTeamPlaytime(allPeriods, period.id, selectedTeam);
  const suggestions = generatePeriodRotationSuggestions(allPeriods, period, selectedTeam);
  const currentTeamData = period[selectedTeam];

  const handleApplySingleSwap = (sug: RotationSuggestion) => {
    if (!onUpdatePeriod) return;
    const updated = executeSingleRotationSwap(
      period,
      selectedTeam,
      sug.starterSlotIndex,
      sug.subSlotIndex
    );
    onUpdatePeriod(updated);
    showToast(`Rotation appliquée : ${sug.subPlayerName} entre à la place de ${sug.starterPlayerName}`);
  };

  const handleApplyAllSuggestions = () => {
    if (!onUpdatePeriod || suggestions.length === 0) return;
    let updated = { ...period };
    for (const sug of suggestions) {
      updated = executeSingleRotationSwap(
        updated,
        selectedTeam,
        sug.starterSlotIndex,
        sug.subSlotIndex
      );
    }
    onUpdatePeriod(updated);
    showToast(`${suggestions.length} rotation(s) appliquée(s) pour ${period.title} !`);
  };

  const handleAutoBalanceAll4Periods = () => {
    if (!onUpdateAllPeriods) {
      alert("La mise à jour globale n'est pas disponible.");
      return;
    }

    if (
      !confirm(
        `Voulez-vous équilibrer automatiquement le temps de jeu sur les 4 périodes pour ${currentTeamData.teamName || selectedTeam} ?\n\nChaque joueur jouera un nombre égal de titularisations (respect de la règle ASF FootEco).`
      )
    ) {
      return;
    }

    const balancedPeriods = autoBalanceRosterAcrossAllPeriods(allPeriods, selectedTeam);
    onUpdateAllPeriods(balancedPeriods);
    showToast(`Temps de jeu équilibré avec succès sur les 4 périodes pour ${currentTeamData.teamName} !`);
  };

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 3000);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-slate-950/80 backdrop-blur-xs animate-in fade-in duration-200">
      <div className="bg-slate-900 border border-slate-700 w-full max-w-4xl rounded-2xl shadow-2xl flex flex-col max-h-[92vh] overflow-hidden text-slate-100">
        
        {/* Header */}
        <div className="px-5 py-4 border-b border-slate-800 bg-slate-900/90 flex items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center text-white shadow-md shrink-0">
              <ArrowRightLeft className="w-5 h-5 text-white" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="font-extrabold text-base sm:text-lg text-white">
                  Rotation & Temps de Jeu Équilibré
                </h2>
                <span className="text-[11px] font-bold px-2 py-0.5 rounded-full bg-indigo-500/20 text-indigo-300 border border-indigo-500/30">
                  FootEco ASF
                </span>
              </div>
              <p className="text-xs text-slate-400 mt-0.5">
                Calcul d'équité sur les 4 périodes pour {period.title} ({period.durationMinutes || 15} min)
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={onClose}
              className="p-1.5 text-slate-400 hover:text-white rounded-lg hover:bg-slate-800 transition-colors cursor-pointer"
              title="Fermer"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Team Selector Tab */}
        <div className="px-5 py-2.5 bg-slate-800/60 border-b border-slate-800 flex flex-wrap items-center justify-between gap-3">
          <div className="flex items-center gap-2">
            <span className="text-xs text-slate-400 font-semibold mr-1">Équipe :</span>
            <button
              onClick={() => setSelectedTeam('team1')}
              className={`px-3 py-1.5 rounded-xl font-bold text-xs flex items-center gap-2 transition-all cursor-pointer ${
                selectedTeam === 'team1'
                  ? 'bg-yellow-400 text-slate-950 shadow-md font-extrabold'
                  : 'bg-slate-800 text-slate-300 hover:bg-slate-700'
              }`}
            >
              <span className="w-2.5 h-2.5 rounded-full bg-yellow-400 inline-block border border-slate-900" />
              <span>{period.team1.teamName || 'Équipe 1'}</span>
            </button>

            <button
              onClick={() => setSelectedTeam('team2')}
              className={`px-3 py-1.5 rounded-xl font-bold text-xs flex items-center gap-2 transition-all cursor-pointer ${
                selectedTeam === 'team2'
                  ? 'bg-rose-600 text-white shadow-md font-extrabold'
                  : 'bg-slate-800 text-slate-300 hover:bg-slate-700'
              }`}
            >
              <span className="w-2.5 h-2.5 rounded-full bg-rose-500 inline-block border border-white/40" />
              <span>{period.team2.teamName || 'Équipe 2'}</span>
            </button>
          </div>

          {/* Quick Auto-Balance All 4 Periods button */}
          {onUpdateAllPeriods && (
            <button
              onClick={handleAutoBalanceAll4Periods}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-bold shadow-md transition-all active:scale-95 cursor-pointer"
              title="Harmonise le temps de jeu sur les 4 périodes pour que chaque joueur ait le même nombre de titularisations"
            >
              <Zap className="w-3.5 h-3.5 text-amber-300" />
              <span>Équilibrer les 4 Périodes (Auto)</span>
            </button>
          )}
        </div>

        {/* Modal Body */}
        <div className="p-5 overflow-y-auto space-y-5">
          
          {/* Toast Notification */}
          {toastMessage && (
            <div className="p-3 rounded-xl bg-emerald-500/20 border border-emerald-500/40 text-emerald-300 text-xs font-bold flex items-center gap-2 animate-in fade-in">
              <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
              <span>{toastMessage}</span>
            </div>
          )}

          {/* Metrics summary cards */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            <div className="bg-slate-800/80 border border-slate-700/80 rounded-xl p-3">
              <div className="flex items-center justify-between text-slate-400 text-xs mb-1">
                <span>Joueurs suivis</span>
                <Users className="w-3.5 h-3.5 text-slate-400" />
              </div>
              <div className="text-xl font-black text-white">
                {summary.totalPlayers}
              </div>
              <div className="text-[10px] text-slate-400 mt-0.5">
                Sur les 4 périodes
              </div>
            </div>

            <div className="bg-slate-800/80 border border-slate-700/80 rounded-xl p-3">
              <div className="flex items-center justify-between text-slate-400 text-xs mb-1">
                <span>Cible de titularisations</span>
                <Clock className="w-3.5 h-3.5 text-indigo-400" />
              </div>
              <div className="text-xl font-black text-indigo-300">
                {summary.idealStartsRange} <span className="text-xs font-normal text-slate-400">/ 4</span>
              </div>
              <div className="text-[10px] text-slate-400 mt-0.5">
                Moyenne : {summary.averageStarts} matchs
              </div>
            </div>

            <div className="bg-slate-800/80 border border-slate-700/80 rounded-xl p-3">
              <div className="flex items-center justify-between text-slate-400 text-xs mb-1">
                <span>Écart min - max</span>
                <TrendingUp className="w-3.5 h-3.5 text-amber-400" />
              </div>
              <div className="text-xl font-black text-white">
                {summary.minStarts} à {summary.maxStarts}
              </div>
              <div className="text-[10px] text-slate-400 mt-0.5">
                {summary.maxStarts - summary.minStarts <= 1 ? (
                  <span className="text-emerald-400 font-bold">✓ Écart exemplaire (≤ 1)</span>
                ) : (
                  <span className="text-amber-400 font-bold">Écart de {summary.maxStarts - summary.minStarts} matchs</span>
                )}
              </div>
            </div>

            <div className="bg-slate-800/80 border border-slate-700/80 rounded-xl p-3">
              <div className="flex items-center justify-between text-slate-400 text-xs mb-1">
                <span>Diagnostic Équité</span>
                {summary.isFullyBalanced ? (
                  <Check className="w-3.5 h-3.5 text-emerald-400" />
                ) : (
                  <AlertCircle className="w-3.5 h-3.5 text-amber-400" />
                )}
              </div>
              <div className={`text-sm font-extrabold ${summary.isFullyBalanced ? 'text-emerald-300' : 'text-amber-300'}`}>
                {summary.isFullyBalanced ? 'Équilibré ASF' : `${summary.unbalancedCount} en déséquilibre`}
              </div>
              <div className="text-[10px] text-slate-400 mt-0.5">
                {summary.isFullyBalanced ? 'Tous les joueurs tournent bien' : 'Rotations suggérées ci-dessous'}
              </div>
            </div>
          </div>

          {/* Section: Suggested Rotations for active period */}
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Sparkles className="w-4 h-4 text-amber-400" />
                <h3 className="font-extrabold text-sm text-white">
                  Suggestions de rotation pour {period.title}
                </h3>
                {suggestions.length > 0 && (
                  <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-amber-500/20 text-amber-300 border border-amber-500/30">
                    {suggestions.length} proposition{suggestions.length > 1 ? 's' : ''}
                  </span>
                )}
              </div>

              {suggestions.length > 1 && onUpdatePeriod && (
                <button
                  onClick={handleApplyAllSuggestions}
                  className="text-xs bg-amber-500 hover:bg-amber-400 text-slate-950 font-extrabold px-3 py-1.5 rounded-xl transition-all shadow-sm active:scale-95 cursor-pointer flex items-center gap-1.5"
                >
                  <Check className="w-3.5 h-3.5" />
                  <span>Tout appliquer ({suggestions.length})</span>
                </button>
              )}
            </div>

            {suggestions.length === 0 ? (
              <div className="p-4 rounded-xl bg-slate-800/40 border border-slate-700/60 text-center text-slate-300">
                <div className="w-8 h-8 rounded-full bg-emerald-500/20 text-emerald-400 mx-auto flex items-center justify-center mb-2">
                  <Check className="w-4 h-4" />
                </div>
                <p className="text-xs font-bold text-white">
                  Aucune rotation urgente requise pour cette période.
                </p>
                <p className="text-[11px] text-slate-400 mt-0.5">
                  La composition de {period.title} offre déjà un excellent compromis entre les titulaires et les remplaçants.
                </p>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                {suggestions.map((sug) => (
                  <div
                    key={sug.id}
                    className="p-3.5 rounded-xl bg-slate-800/90 border border-slate-700 hover:border-slate-600 transition-all flex flex-col justify-between gap-3 shadow-xs"
                  >
                    <div>
                      {/* Priority tag */}
                      <div className="flex items-center justify-between mb-2">
                        <span
                          className={`text-[10px] font-black uppercase px-2 py-0.5 rounded ${
                            sug.priority === 'urgent'
                              ? 'bg-rose-500/20 text-rose-300 border border-rose-500/30'
                              : 'bg-amber-500/20 text-amber-300 border border-amber-500/30'
                          }`}
                        >
                          {sug.priority === 'urgent' ? 'Rotation Forte Recommandée' : 'Équilibrage Conseillé'}
                        </span>
                        <span className="text-[11px] text-slate-400 font-mono">
                          Écart : +{sug.starterStartsCount - sug.subStartsCount} match{sug.starterStartsCount - sug.subStartsCount > 1 ? 's' : ''}
                        </span>
                      </div>

                      {/* Swap cards */}
                      <div className="flex items-center justify-between gap-2 p-2.5 rounded-lg bg-slate-900/90 border border-slate-800">
                        {/* Out: Starter */}
                        <div className="flex-1 text-left">
                          <span className="text-[9px] uppercase font-bold text-rose-400 block">
                            Sortant (Titulaire)
                          </span>
                          <span className="text-xs font-bold text-white block truncate">
                            {sug.starterPlayerName}
                          </span>
                          <span className="text-[10px] text-slate-400 font-mono">
                            {sug.starterStartsCount}/4 titul. ({sug.starterMinutes} min)
                          </span>
                        </div>

                        {/* Arrow Icon */}
                        <div className="w-7 h-7 rounded-full bg-slate-800 text-amber-400 flex items-center justify-center shrink-0 border border-slate-700">
                          <ArrowRightLeft className="w-3.5 h-3.5" />
                        </div>

                        {/* In: Substitute */}
                        <div className="flex-1 text-right">
                          <span className="text-[9px] uppercase font-bold text-emerald-400 block">
                            Entrant (Remplaçant)
                          </span>
                          <span className="text-xs font-bold text-white block truncate">
                            {sug.subPlayerName}
                          </span>
                          <span className="text-[10px] text-slate-400 font-mono">
                            {sug.subStartsCount}/4 titul. ({sug.subMinutes} min)
                          </span>
                        </div>
                      </div>

                      {/* Reason */}
                      <p className="text-[11px] text-slate-300 mt-2 leading-relaxed">
                        {sug.reason}
                      </p>
                    </div>

                    {/* Apply button */}
                    {onUpdatePeriod && (
                      <button
                        onClick={() => handleApplySingleSwap(sug)}
                        className="w-full py-1.5 px-3 rounded-lg bg-indigo-600 hover:bg-indigo-500 text-white font-bold text-xs transition-all flex items-center justify-center gap-1.5 cursor-pointer shadow-xs"
                      >
                        <Check className="w-3.5 h-3.5" />
                        <span>Permuter {sug.subPlayerName} ⇄ {sug.starterPlayerName}</span>
                      </button>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Section: Full Player Playtime Table across the 4 periods */}
          <div className="space-y-3 pt-2">
            <div className="flex items-center justify-between">
              <h3 className="font-extrabold text-sm text-white flex items-center gap-2">
                <span>Temps de jeu par joueur sur les 4 périodes</span>
                <span className="text-xs text-slate-400 font-normal">
                  ({period.team1.teamName || 'Équipe'} • FootEco FE-12)
                </span>
              </h3>
            </div>

            <div className="bg-slate-800/60 rounded-xl border border-slate-700 overflow-hidden">
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs border-collapse">
                  <thead>
                    <tr className="bg-slate-800/90 text-slate-300 border-b border-slate-700 text-[11px] font-bold">
                      <th className="py-2.5 px-3">Joueur</th>
                      <th className="py-2.5 px-3 text-center">Statut ({period.title})</th>
                      <th className="py-2.5 px-3 text-center">Titularisations</th>
                      <th className="py-2.5 px-3 text-center">Présence P1-P4</th>
                      <th className="py-2.5 px-3 text-right">Temps total</th>
                      <th className="py-2.5 px-3 text-center">Diagnostic</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-700/60 text-slate-200">
                    {summary.reports.map((rep) => {
                      const startsCount = rep.totalStarterPeriods;
                      return (
                        <tr key={rep.playerName} className="hover:bg-slate-800/50 transition-colors">
                          <td className="py-2.5 px-3 font-bold text-white flex items-center gap-2">
                            <span className="w-2 h-2 rounded-full bg-slate-400 inline-block" />
                            <span>{rep.playerName}</span>
                          </td>

                          <td className="py-2.5 px-3 text-center">
                            {rep.isStarterInCurrentPeriod ? (
                              <span className="px-2 py-0.5 rounded bg-emerald-500/20 text-emerald-300 text-[10px] font-black border border-emerald-500/30">
                                Titulaire
                              </span>
                            ) : rep.isSubInCurrentPeriod ? (
                              <span className="px-2 py-0.5 rounded bg-slate-700 text-slate-300 text-[10px] font-semibold">
                                Remplaçant
                              </span>
                            ) : (
                              <span className="text-slate-500 text-[10px]">-</span>
                            )}
                          </td>

                          <td className="py-2.5 px-3 text-center font-mono font-bold">
                            <span className={startsCount === 0 ? 'text-rose-400' : startsCount >= 3 ? 'text-amber-300' : 'text-emerald-400'}>
                              {startsCount} / 4
                            </span>
                          </td>

                          {/* 4 Periods Tracker Pills */}
                          <td className="py-2.5 px-3 text-center">
                            <div className="flex items-center justify-center gap-1">
                              {[1, 2, 3, 4].map((pNum) => {
                                const isStart = rep.periodsAsStarter.includes(pNum);
                                const isSub = rep.periodsAsSub.includes(pNum);
                                return (
                                  <span
                                    key={pNum}
                                    className={`w-5 h-5 rounded text-[10px] font-mono font-bold flex items-center justify-center border ${
                                      isStart
                                        ? 'bg-emerald-600 text-white border-emerald-500'
                                        : isSub
                                        ? 'bg-slate-700 text-slate-400 border-slate-600'
                                        : 'bg-slate-900 text-slate-600 border-slate-800'
                                    }`}
                                    title={`P${pNum} : ${isStart ? 'Titulaire' : isSub ? 'Remplaçant' : 'Non inscrit'}`}
                                  >
                                    P{pNum}
                                  </span>
                                );
                              })}
                            </div>
                          </td>

                          <td className="py-2.5 px-3 text-right font-mono text-slate-300">
                            {rep.totalMinutesPlayed} min
                          </td>

                          <td className="py-2.5 px-3 text-center">
                            {rep.status === 'deficit' ? (
                              <span className="inline-flex items-center gap-1 text-[10px] font-bold text-rose-400">
                                <TrendingDown className="w-3 h-3" />
                                <span>Temps insuffisant</span>
                              </span>
                            ) : rep.status === 'surplus' ? (
                              <span className="inline-flex items-center gap-1 text-[10px] font-bold text-amber-400">
                                <TrendingUp className="w-3 h-3" />
                                <span>Temps élevé</span>
                              </span>
                            ) : (
                              <span className="inline-flex items-center gap-1 text-[10px] font-bold text-emerald-400">
                                <Check className="w-3 h-3" />
                                <span>Équilibré</span>
                              </span>
                            )}
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </div>
          </div>

        </div>

        {/* Modal Footer */}
        <div className="px-5 py-3 border-t border-slate-800 bg-slate-900/90 flex flex-wrap items-center justify-between gap-2 text-xs text-slate-400">
          <div className="flex items-center gap-2">
            <span className="w-2.5 h-2.5 rounded bg-emerald-600 inline-block border border-emerald-500" />
            <span>Titulaire</span>
            <span className="w-2.5 h-2.5 rounded bg-slate-700 inline-block border border-slate-600 ml-2" />
            <span>Remplaçant</span>
          </div>

          <button
            onClick={onClose}
            className="px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-white font-bold transition-colors cursor-pointer"
          >
            Fermer
          </button>
        </div>

      </div>
    </div>
  );
};
