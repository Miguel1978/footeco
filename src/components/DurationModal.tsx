import React, { useState } from 'react';
import { MatchData, PeriodMatch } from '../types';
import { Clock, Plus, Trash2, Check, Sparkles, X } from 'lucide-react';
import { createDefaultPeriod } from '../initialData';

interface DurationModalProps {
  isOpen: boolean;
  onClose: () => void;
  matchData: MatchData;
  onUpdateMatch: (updater: (prev: MatchData) => MatchData) => void;
}

export const DurationModal: React.FC<DurationModalProps> = ({
  isOpen,
  onClose,
  matchData,
  onUpdateMatch,
}) => {
  const [globalDuration, setGlobalDuration] = useState<number>(15);

  if (!isOpen) return null;

  const handleSetAllDurations = (min: number) => {
    onUpdateMatch(prev => ({
      ...prev,
      periods: prev.periods.map(p => ({
        ...p,
        durationMinutes: min,
      })),
    }));
  };

  const handleUpdateSingleDuration = (periodId: number, duration: number) => {
    const valid = Math.max(1, Math.min(120, duration || 1));
    onUpdateMatch(prev => ({
      ...prev,
      periods: prev.periods.map(p => (p.id === periodId ? { ...p, durationMinutes: valid } : p)),
    }));
  };

  const handleUpdatePeriodTitle = (periodId: number, title: string) => {
    onUpdateMatch(prev => ({
      ...prev,
      periods: prev.periods.map(p => (p.id === periodId ? { ...p, title } : p)),
    }));
  };

  const handleAddPeriod = () => {
    const nextNum = matchData.periods.length + 1;
    const newPeriod = createDefaultPeriod(nextNum, globalDuration || 15);
    onUpdateMatch(prev => ({
      ...prev,
      periods: [...prev.periods, newPeriod],
    }));
  };

  const handleRemovePeriod = (periodId: number) => {
    if (matchData.periods.length <= 1) {
      alert('Le match doit comporter au moins 1 période.');
      return;
    }
    onUpdateMatch(prev => ({
      ...prev,
      periods: prev.periods
        .filter(p => p.id !== periodId)
        .map((p, idx) => ({ ...p, periodNumber: idx + 1, title: p.title.startsWith('Match') ? `Match ${idx + 1}` : p.title })),
    }));
  };

  const handleResetToStandard4x15 = () => {
    onUpdateMatch(prev => {
      // Keep existing player compositions if 4 periods, just reset to 4 periods of 15m
      let newPeriods: PeriodMatch[] = [];
      for (let i = 1; i <= 4; i++) {
        const existing = prev.periods.find(p => p.id === i);
        if (existing) {
          newPeriods.push({ ...existing, durationMinutes: 15, periodNumber: i, title: `Match ${i}` });
        } else {
          newPeriods.push(createDefaultPeriod(i, 15));
        }
      }
      return {
        ...prev,
        periods: newPeriods,
      };
    });
  };

  const totalDuration = matchData.periods.reduce((sum, p) => sum + (p.durationMinutes || 0), 0);

  return (
    <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl max-w-2xl w-full max-h-[90vh] flex flex-col shadow-2xl border border-slate-200 overflow-hidden">
        
        {/* Header */}
        <div className="px-6 py-4 bg-slate-50 border-b border-slate-200 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl bg-amber-500 text-white flex items-center justify-center font-bold shadow-sm">
              <Clock className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-lg font-bold text-slate-900">Gestion des Périodes & Durées</h2>
              <p className="text-xs text-slate-500">
                Configuration libre des parties (format officiel 4x 15 min ou sur mesure)
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 text-slate-400 hover:text-slate-700 hover:bg-slate-200 rounded-lg transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content Body */}
        <div className="p-6 overflow-y-auto space-y-6 flex-1">
          
          {/* Quick Presets */}
          <div>
            <label className="text-xs font-bold text-slate-500 uppercase tracking-wider block mb-2">
              Presets rapides
            </label>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
              <button
                onClick={handleResetToStandard4x15}
                className="p-2.5 text-left rounded-xl border border-emerald-300 bg-emerald-50/80 hover:bg-emerald-100 transition-all text-xs font-semibold text-emerald-900 flex flex-col gap-0.5"
              >
                <span className="flex items-center gap-1 font-bold text-emerald-700">
                  <Sparkles className="w-3.5 h-3.5" /> 4 x 15 min
                </span>
                <span className="text-[11px] text-emerald-600 font-normal">Standard Footeco (60m)</span>
              </button>

              <button
                onClick={() => handleSetAllDurations(20)}
                className="p-2.5 text-left rounded-xl border border-slate-200 bg-slate-50 hover:bg-slate-100 transition-all text-xs font-semibold text-slate-800 flex flex-col gap-0.5"
              >
                <span className="font-bold text-slate-900">{matchData.periods.length} x 20 min</span>
                <span className="text-[11px] text-slate-500 font-normal">Parties prolongées</span>
              </button>

              <button
                onClick={() => handleSetAllDurations(12)}
                className="p-2.5 text-left rounded-xl border border-slate-200 bg-slate-50 hover:bg-slate-100 transition-all text-xs font-semibold text-slate-800 flex flex-col gap-0.5"
              >
                <span className="font-bold text-slate-900">{matchData.periods.length} x 12 min</span>
                <span className="text-[11px] text-slate-500 font-normal">Format tournoi court</span>
              </button>

              <button
                onClick={() => handleSetAllDurations(25)}
                className="p-2.5 text-left rounded-xl border border-slate-200 bg-slate-50 hover:bg-slate-100 transition-all text-xs font-semibold text-slate-800 flex flex-col gap-0.5"
              >
                <span className="font-bold text-slate-900">{matchData.periods.length} x 25 min</span>
                <span className="text-[11px] text-slate-500 font-normal">Format long</span>
              </button>
            </div>
          </div>

          {/* Batch Apply Duration to all */}
          <div className="bg-amber-50/70 border border-amber-200 rounded-xl p-3.5 flex flex-wrap items-center justify-between gap-3">
            <div>
              <span className="text-xs font-bold text-amber-900 block">Appliquer une durée identique à toutes les périodes</span>
              <span className="text-[11px] text-amber-700">Modifie instantanément les {matchData.periods.length} périodes actuelles</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="relative">
                <input
                  type="number"
                  min={1}
                  max={90}
                  value={globalDuration}
                  onChange={(e) => setGlobalDuration(parseInt(e.target.value, 10) || 15)}
                  className="w-16 px-2 py-1 text-center font-bold text-sm bg-white border border-amber-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-amber-500"
                />
                <span className="absolute right-2 top-1 text-xs text-slate-400 font-medium">m</span>
              </div>
              <button
                onClick={() => handleSetAllDurations(globalDuration)}
                className="px-3 py-1 bg-amber-600 hover:bg-amber-700 text-white rounded-lg text-xs font-bold shadow-sm transition-colors flex items-center gap-1"
              >
                <Check className="w-3.5 h-3.5" /> Appliquer
              </button>
            </div>
          </div>

          {/* Individual Periods List */}
          <div>
            <div className="flex items-center justify-between mb-2">
              <label className="text-xs font-bold text-slate-500 uppercase tracking-wider">
                Détail individuel de chaque période ({matchData.periods.length} périodes - Total {totalDuration} min)
              </label>
              <button
                onClick={handleAddPeriod}
                className="flex items-center gap-1 text-xs font-bold text-emerald-700 hover:text-emerald-800 bg-emerald-50 hover:bg-emerald-100 border border-emerald-200 px-2.5 py-1 rounded-lg transition-colors"
              >
                <Plus className="w-3.5 h-3.5" /> Ajouter une période
              </button>
            </div>

            <div className="space-y-2.5">
              {matchData.periods.map((period, index) => (
                <div
                  key={period.id}
                  className="flex items-center justify-between p-3 rounded-xl border border-slate-200 bg-white hover:border-slate-300 transition-colors shadow-xs"
                >
                  <div className="flex items-center gap-3 flex-1">
                    <span className="w-7 h-7 rounded-lg bg-slate-900 text-white text-xs font-bold flex items-center justify-center">
                      #{index + 1}
                    </span>
                    <input
                      type="text"
                      value={period.title}
                      onChange={(e) => handleUpdatePeriodTitle(period.id, e.target.value)}
                      className="text-sm font-semibold text-slate-900 border-b border-transparent hover:border-slate-300 focus:border-emerald-500 focus:outline-none px-1 py-0.5 max-w-[140px]"
                      placeholder={`Match ${index + 1}`}
                    />
                  </div>

                  <div className="flex items-center gap-2">
                    {/* Quick increment/decrement buttons */}
                    <div className="flex items-center border border-slate-300 rounded-lg overflow-hidden bg-slate-50">
                      <button
                        onClick={() => handleUpdateSingleDuration(period.id, (period.durationMinutes || 15) - 1)}
                        className="px-2 py-1 text-slate-600 hover:bg-slate-200 text-xs font-bold"
                        title="-1 minute"
                      >
                        -
                      </button>
                      <input
                        type="number"
                        min={1}
                        max={120}
                        value={period.durationMinutes || 15}
                        onChange={(e) => handleUpdateSingleDuration(period.id, parseInt(e.target.value, 10))}
                        className="w-12 text-center text-sm font-bold bg-white text-slate-900 focus:outline-none"
                      />
                      <span className="text-[11px] font-medium text-slate-400 pr-1.5">min</span>
                      <button
                        onClick={() => handleUpdateSingleDuration(period.id, (period.durationMinutes || 15) + 1)}
                        className="px-2 py-1 text-slate-600 hover:bg-slate-200 text-xs font-bold"
                        title="+1 minute"
                      >
                        +
                      </button>
                    </div>

                    {/* Quick presets for this period */}
                    <div className="hidden sm:flex items-center gap-1">
                      {[10, 15, 20].map((mins) => (
                        <button
                          key={mins}
                          onClick={() => handleUpdateSingleDuration(period.id, mins)}
                          className={`px-2 py-1 rounded text-xs font-medium transition-colors ${
                            period.durationMinutes === mins
                              ? 'bg-slate-800 text-white'
                              : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                          }`}
                        >
                          {mins}m
                        </button>
                      ))}
                    </div>

                    {/* Delete period button */}
                    <button
                      onClick={() => handleRemovePeriod(period.id)}
                      disabled={matchData.periods.length <= 1}
                      className="p-1.5 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
                      title="Supprimer cette période"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>

        </div>

        {/* Footer */}
        <div className="px-6 py-3.5 bg-slate-50 border-t border-slate-200 flex items-center justify-between">
          <div className="text-xs text-slate-600 font-medium">
            Total match : <strong className="text-slate-900">{matchData.periods.length} périodes</strong> = <strong className="text-slate-900">{totalDuration} minutes</strong> de jeu
          </div>
          <button
            onClick={onClose}
            className="px-5 py-2 bg-slate-900 hover:bg-slate-800 text-white rounded-xl text-xs font-bold shadow-sm transition-colors"
          >
            Fermer et Enregistrer
          </button>
        </div>

      </div>
    </div>
  );
};
