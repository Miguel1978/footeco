import React, { useState } from 'react';
import {
  X,
  Copy,
  Check,
  ArrowRight,
  ArrowLeftRight,
  Sparkles,
  ClipboardCheck,
  Users,
  ShieldAlert,
} from 'lucide-react';
import { MatchData, PeriodMatch, PlayerSlot } from '../types';

interface CopyCompoModalProps {
  isOpen: boolean;
  onClose: () => void;
  matchData: MatchData;
  activePeriodIndex: number;
  onUpdatePeriods: (updatedPeriods: PeriodMatch[], notificationMsg?: string) => void;
}

export const CopyCompoModal: React.FC<CopyCompoModalProps> = ({
  isOpen,
  onClose,
  matchData,
  activePeriodIndex,
  onUpdatePeriods,
}) => {
  const [sourceIndex, setSourceIndex] = useState<number>(
    activePeriodIndex >= 0 && activePeriodIndex < matchData.periods.length ? activePeriodIndex : 0
  );
  const [targetIndices, setTargetIndices] = useState<number[]>(() => {
    // Default to all other periods
    return matchData.periods
      .map((_, idx) => idx)
      .filter((idx) => idx !== (activePeriodIndex >= 0 ? activePeriodIndex : 0));
  });

  const [copyTeam1, setCopyTeam1] = useState(true);
  const [copyTeam2, setCopyTeam2] = useState(true);
  const [copySubs, setCopySubs] = useState(true);
  const [preserveEvaluations, setPreserveEvaluations] = useState(false);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  // Sync state if modal reopens
  React.useEffect(() => {
    if (isOpen) {
      const validIndex =
        activePeriodIndex >= 0 && activePeriodIndex < matchData.periods.length
          ? activePeriodIndex
          : 0;
      setSourceIndex(validIndex);
      setTargetIndices(
        matchData.periods.map((_, idx) => idx).filter((idx) => idx !== validIndex)
      );
      setSuccessMessage(null);
    }
  }, [isOpen, activePeriodIndex, matchData.periods.length]);

  if (!isOpen) return null;

  const sourcePeriod = matchData.periods[sourceIndex] || matchData.periods[0];

  const toggleTargetIndex = (idx: number) => {
    if (targetIndices.includes(idx)) {
      setTargetIndices(targetIndices.filter((i) => i !== idx));
    } else {
      setTargetIndices([...targetIndices, idx]);
    }
  };

  const selectAllTargets = () => {
    setTargetIndices(
      matchData.periods.map((_, idx) => idx).filter((idx) => idx !== sourceIndex)
    );
  };

  const cloneSlots = (slots: PlayerSlot[], targetPeriodId: number, prefix: string): PlayerSlot[] => {
    return slots.map((slot, idx) => ({
      ...slot,
      id: `${prefix}-p${targetPeriodId}-${idx}-${Date.now()}`,
      note: preserveEvaluations ? slot.note : '',
      rating: preserveEvaluations ? slot.rating : undefined,
      shootout: preserveEvaluations ? slot.shootout : '',
      goals: preserveEvaluations ? slot.goals : undefined,
    }));
  };

  // Perform standard copy from source to selected targets
  const handleApplyCopy = () => {
    if (targetIndices.length === 0) return;

    const newPeriods = matchData.periods.map((period, idx) => {
      if (!targetIndices.includes(idx)) return period;

      let updatedTeam1 = { ...period.team1 };
      let updatedTeam2 = { ...period.team2 };

      if (copyTeam1) {
        updatedTeam1 = {
          ...updatedTeam1,
          coachName: sourcePeriod.team1.coachName || updatedTeam1.coachName,
          titulaires: cloneSlots(sourcePeriod.team1.titulaires, period.id, 't1'),
          remplacants: copySubs
            ? cloneSlots(sourcePeriod.team1.remplacants, period.id, 't1-sub')
            : updatedTeam1.remplacants,
        };
      }

      if (copyTeam2) {
        updatedTeam2 = {
          ...updatedTeam2,
          coachName: sourcePeriod.team2.coachName || updatedTeam2.coachName,
          titulaires: cloneSlots(sourcePeriod.team2.titulaires, period.id, 't2'),
          remplacants: copySubs
            ? cloneSlots(sourcePeriod.team2.remplacants, period.id, 't2-sub')
            : updatedTeam2.remplacants,
        };
      }

      return {
        ...period,
        team1: updatedTeam1,
        team2: updatedTeam2,
      };
    });

    const targetNames = targetIndices.map((idx) => matchData.periods[idx]?.title || `Match ${idx + 1}`).join(', ');
    const msg = `Composition de ${sourcePeriod.title} copiée vers : ${targetNames}`;
    onUpdatePeriods(newPeriods, msg);
    setSuccessMessage(msg);
    setTimeout(() => {
      onClose();
    }, 1200);
  };

  // 1-Click Quick duplicate to all 3 other matches
  const handleDuplicateToAll = () => {
    const allOtherIndices = matchData.periods
      .map((_, idx) => idx)
      .filter((idx) => idx !== sourceIndex);

    const newPeriods = matchData.periods.map((period, idx) => {
      if (idx === sourceIndex) return period;

      return {
        ...period,
        team1: {
          ...period.team1,
          coachName: sourcePeriod.team1.coachName || period.team1.coachName,
          titulaires: cloneSlots(sourcePeriod.team1.titulaires, period.id, 't1'),
          remplacants: cloneSlots(sourcePeriod.team1.remplacants, period.id, 't1-sub'),
        },
        team2: {
          ...period.team2,
          coachName: sourcePeriod.team2.coachName || period.team2.coachName,
          titulaires: cloneSlots(sourcePeriod.team2.titulaires, period.id, 't2'),
          remplacants: cloneSlots(sourcePeriod.team2.remplacants, period.id, 't2-sub'),
        },
      };
    });

    const msg = `Composition de ${sourcePeriod.title} dupliquée sur tous les autres matchs !`;
    onUpdatePeriods(newPeriods, msg);
    setSuccessMessage(msg);
    setTimeout(() => {
      onClose();
    }, 1200);
  };

  // Swap Team 1 and Team 2 in the source match
  const handleSwapTeams = () => {
    const newPeriods = matchData.periods.map((period, idx) => {
      if (idx !== sourceIndex) return period;

      return {
        ...period,
        team1: {
          ...period.team1,
          titulaires: period.team2.titulaires.map((s, i) => ({ ...s, id: `t1-p${period.id}-${i}` })),
          remplacants: period.team2.remplacants.map((s, i) => ({ ...s, id: `t1-r${period.id}-${i}` })),
        },
        team2: {
          ...period.team2,
          titulaires: period.team1.titulaires.map((s, i) => ({ ...s, id: `t2-p${period.id}-${i}` })),
          remplacants: period.team1.remplacants.map((s, i) => ({ ...s, id: `t2-r${period.id}-${i}` })),
        },
      };
    });

    const msg = `Équipe 1 (Jaune) et Équipe 2 (Rouge) inversées pour ${sourcePeriod.title}`;
    onUpdatePeriods(newPeriods, msg);
    setSuccessMessage(msg);
    setTimeout(() => {
      setSuccessMessage(null);
    }, 2000);
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-slate-950/75 backdrop-blur-xs animate-in fade-in duration-200"
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
      role="dialog"
      aria-modal="true"
      aria-labelledby="copy-compo-title"
    >
      <div className="relative flex flex-col bg-white rounded-2xl shadow-2xl border border-slate-300 w-full max-w-xl overflow-hidden text-slate-900">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-200 bg-slate-50">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-indigo-100 text-indigo-700 flex items-center justify-center font-bold border border-indigo-200 shadow-2xs">
              <Copy className="w-5 h-5" />
            </div>
            <div>
              <h2 id="copy-compo-title" className="text-base font-extrabold text-slate-900">
                Copier & Dupliquer les Compositions
              </h2>
              <p className="text-xs text-slate-500">
                Transférez facilement la composition d'un match vers les autres
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-1.5 text-slate-400 hover:text-slate-700 hover:bg-slate-200 rounded-lg transition-colors cursor-pointer"
            aria-label="Fermer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Modal Body */}
        <div className="p-6 space-y-5 max-h-[75vh] overflow-y-auto">
          {/* Success Banner */}
          {successMessage && (
            <div className="flex items-center gap-2 p-3 bg-emerald-50 border border-emerald-300 text-emerald-900 rounded-xl text-xs font-bold animate-in fade-in">
              <Check className="w-4 h-4 text-emerald-600 shrink-0" />
              <span>{successMessage}</span>
            </div>
          )}

          {/* Quick Actions 1-Click bar */}
          <div className="p-3.5 bg-indigo-50/70 border border-indigo-200/80 rounded-xl space-y-2">
            <span className="text-[11px] font-extrabold uppercase tracking-wider text-indigo-900 flex items-center gap-1.5">
              <Sparkles className="w-3.5 h-3.5 text-indigo-600" />
              Actions Rapides en 1 clic
            </span>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
              <button
                type="button"
                onClick={handleDuplicateToAll}
                className="flex items-center justify-center gap-2 px-3 py-2 bg-indigo-600 hover:bg-indigo-700 active:scale-98 text-white rounded-lg text-xs font-bold shadow-2xs transition-all cursor-pointer"
                title={`Dupliquer la composition du ${sourcePeriod.title} sur les 3 autres matchs`}
              >
                <Copy className="w-3.5 h-3.5" />
                <span>Dupliquer sur les 4 matchs</span>
              </button>

              <button
                type="button"
                onClick={handleSwapTeams}
                className="flex items-center justify-center gap-2 px-3 py-2 bg-white hover:bg-slate-100 active:scale-98 text-slate-800 border border-slate-300 rounded-lg text-xs font-bold shadow-2xs transition-all cursor-pointer"
                title={`Inverser Équipe 1 (Jaune) et Équipe 2 (Rouge) pour ${sourcePeriod.title}`}
              >
                <ArrowLeftRight className="w-3.5 h-3.5 text-amber-600" />
                <span>Inverser Équipe 1 ⇄ Équipe 2</span>
              </button>
            </div>
          </div>

          {/* 1. Select Source Match */}
          <div className="space-y-2">
            <label className="text-xs font-extrabold uppercase tracking-wider text-slate-600 block">
              1. Choisir le match source (à copier) :
            </label>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
              {matchData.periods.map((p, idx) => {
                const isSelected = idx === sourceIndex;
                const countT1 = p.team1.titulaires.filter((s) => s.playerName).length;
                const countT2 = p.team2.titulaires.filter((s) => s.playerName).length;

                return (
                  <button
                    key={p.id ?? idx}
                    type="button"
                    onClick={() => {
                      setSourceIndex(idx);
                      // Remove new source from targets if it was there
                      setTargetIndices((prev) => prev.filter((i) => i !== idx));
                    }}
                    className={`p-2.5 rounded-xl border text-left transition-all cursor-pointer ${
                      isSelected
                        ? 'border-indigo-600 bg-indigo-50/80 ring-2 ring-indigo-500/20'
                        : 'border-slate-200 bg-white hover:border-slate-300 hover:bg-slate-50'
                    }`}
                  >
                    <div className="flex items-center justify-between mb-1">
                      <span className={`text-xs font-extrabold ${isSelected ? 'text-indigo-900' : 'text-slate-800'}`}>
                        {p.title || `Match ${idx + 1}`}
                      </span>
                      {isSelected && <Check className="w-3.5 h-3.5 text-indigo-600" />}
                    </div>
                    <div className="text-[10px] text-slate-500">
                      🟡 {countT1}/7 • 🔴 {countT2}/7
                    </div>
                  </button>
                );
              })}
            </div>
          </div>

          {/* 2. Select Target Matches */}
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <label className="text-xs font-extrabold uppercase tracking-wider text-slate-600">
                2. Vers quel(s) match(s) appliquer la compo ?
              </label>
              <button
                type="button"
                onClick={selectAllTargets}
                className="text-[11px] font-bold text-indigo-600 hover:text-indigo-800 cursor-pointer"
              >
                Tous les autres
              </button>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
              {matchData.periods.map((p, idx) => {
                if (idx === sourceIndex) return null;
                const isTarget = targetIndices.includes(idx);

                return (
                  <button
                    key={p.id ?? idx}
                    type="button"
                    onClick={() => toggleTargetIndex(idx)}
                    className={`p-3 rounded-xl border flex items-center justify-between transition-all cursor-pointer ${
                      isTarget
                        ? 'border-indigo-600 bg-indigo-50 text-indigo-950 font-bold shadow-2xs'
                        : 'border-slate-200 bg-slate-50 text-slate-600 hover:bg-slate-100'
                    }`}
                  >
                    <span className="text-xs">{p.title || `Match ${idx + 1}`}</span>
                    <div
                      className={`w-4 h-4 rounded border flex items-center justify-center ${
                        isTarget ? 'bg-indigo-600 border-indigo-600 text-white' : 'border-slate-300 bg-white'
                      }`}
                    >
                      {isTarget && <Check className="w-3 h-3" />}
                    </div>
                  </button>
                );
              })}
            </div>
            {targetIndices.length === 0 && (
              <p className="text-[11px] text-amber-700 font-semibold">
                ⚠️ Veuillez cocher au moins un match cible.
              </p>
            )}
          </div>

          {/* 3. Options to copy */}
          <div className="space-y-2 pt-2 border-t border-slate-200">
            <label className="text-xs font-extrabold uppercase tracking-wider text-slate-600 block">
              3. Éléments à copier :
            </label>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs">
              <label className="flex items-center gap-2 p-2 bg-slate-50 rounded-lg border border-slate-200 cursor-pointer hover:bg-slate-100">
                <input
                  type="checkbox"
                  checked={copyTeam1}
                  onChange={(e) => setCopyTeam1(e.target.checked)}
                  className="rounded text-indigo-600 focus:ring-indigo-500"
                />
                <span className="font-semibold text-slate-800">🟡 Équipe 1 (Jaune)</span>
              </label>

              <label className="flex items-center gap-2 p-2 bg-slate-50 rounded-lg border border-slate-200 cursor-pointer hover:bg-slate-100">
                <input
                  type="checkbox"
                  checked={copyTeam2}
                  onChange={(e) => setCopyTeam2(e.target.checked)}
                  className="rounded text-indigo-600 focus:ring-indigo-500"
                />
                <span className="font-semibold text-slate-800">🔴 Équipe 2 (Rouge)</span>
              </label>

              <label className="flex items-center gap-2 p-2 bg-slate-50 rounded-lg border border-slate-200 cursor-pointer hover:bg-slate-100">
                <input
                  type="checkbox"
                  checked={copySubs}
                  onChange={(e) => setCopySubs(e.target.checked)}
                  className="rounded text-indigo-600 focus:ring-indigo-500"
                />
                <span className="font-semibold text-slate-800">Remplaçants</span>
              </label>

              <label className="flex items-center gap-2 p-2 bg-slate-50 rounded-lg border border-slate-200 cursor-pointer hover:bg-slate-100">
                <input
                  type="checkbox"
                  checked={preserveEvaluations}
                  onChange={(e) => setPreserveEvaluations(e.target.checked)}
                  className="rounded text-indigo-600 focus:ring-indigo-500"
                />
                <span className="text-slate-600">Copier aussi notes/évals</span>
              </label>
            </div>
            {!preserveEvaluations && (
              <p className="text-[11px] text-slate-500 italic">
                ℹ️ Les notes, shootout et évaluations seront remises à zéro sur le match de destination.
              </p>
            )}
          </div>
        </div>

        {/* Footer */}
        <div className="flex items-center justify-between px-6 py-3.5 bg-slate-50 border-t border-slate-200">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 text-xs font-semibold text-slate-600 hover:text-slate-900 bg-white border border-slate-300 rounded-lg hover:bg-slate-100 transition-colors cursor-pointer"
          >
            Annuler
          </button>

          <button
            type="button"
            onClick={handleApplyCopy}
            disabled={targetIndices.length === 0 || (!copyTeam1 && !copyTeam2)}
            className="flex items-center gap-2 px-5 py-2 text-xs font-extrabold text-white bg-indigo-600 hover:bg-indigo-700 active:scale-95 disabled:opacity-50 rounded-lg shadow-xs transition-all cursor-pointer"
          >
            <Check className="w-4 h-4" />
            <span>Appliquer la composition</span>
          </button>
        </div>
      </div>
    </div>
  );
};
