import React from 'react';
import { PeriodMatch } from '../types';
import { Clock, Plus, LayoutGrid, Eye, Shield, TrendingUp } from 'lucide-react';

interface PeriodTabsProps {
  periods: PeriodMatch[];
  selectedPeriodIndex: number;
  onSelectPeriodIndex: (index: number) => void;
  viewMode: 'single' | 'all' | 'tactical' | 'chart';
  onChangeViewMode: (mode: 'single' | 'all' | 'tactical' | 'chart') => void;
  onOpenDurationModal: () => void;
  isQuickChartOpen?: boolean;
  onToggleQuickChart?: () => void;
}

export const PeriodTabs: React.FC<PeriodTabsProps> = ({
  periods,
  selectedPeriodIndex,
  onSelectPeriodIndex,
  viewMode,
  onChangeViewMode,
  onOpenDurationModal,
  isQuickChartOpen,
  onToggleQuickChart,
}) => {
  return (
    <div className="flex flex-wrap items-center justify-between gap-3 mb-6 print:hidden">
      
      {/* Period Selection Pills */}
      <div className="flex items-center gap-1.5 overflow-x-auto pb-1 max-w-full">
        {periods.map((period, idx) => {
          const isSelected = viewMode === 'single' && selectedPeriodIndex === idx;
          return (
            <button
              key={period.id}
              onClick={() => {
                onChangeViewMode('single');
                onSelectPeriodIndex(idx);
              }}
              className={`px-3.5 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-2 shrink-0 ${
                isSelected
                  ? 'bg-slate-900 text-white shadow-sm'
                  : 'bg-white text-slate-700 hover:bg-slate-100 border border-slate-200'
              }`}
            >
              <span>{period.title}</span>
              <span
                className={`text-[10px] px-1.5 py-0.5 rounded-md font-mono ${
                  isSelected
                    ? 'bg-slate-800 text-amber-400'
                    : 'bg-slate-100 text-slate-500'
                }`}
              >
                {period.durationMinutes || 15}m
              </span>
            </button>
          );
        })}

        {/* Quick Add or Manage Durations */}
        <button
          onClick={onOpenDurationModal}
          className="p-2 text-slate-600 hover:text-slate-900 bg-white hover:bg-slate-100 border border-slate-200 rounded-xl text-xs font-bold transition-colors shrink-0 flex items-center gap-1"
          title="Modifier ou ajouter des périodes (4x 15m)"
        >
          <Plus className="w-3.5 h-3.5" />
          <Clock className="w-3.5 h-3.5 text-amber-600" />
        </button>
      </div>

      {/* View Mode Switcher: Single Period | All Periods | Pitch Formation */}
      <div className="flex items-center bg-slate-100 p-1 rounded-xl border border-slate-200 shrink-0">
        <button
          onClick={() => onChangeViewMode('single')}
          className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-colors flex items-center gap-1.5 ${
            viewMode === 'single'
              ? 'bg-white text-slate-900 shadow-xs'
              : 'text-slate-600 hover:text-slate-900'
          }`}
        >
          <span>Période active</span>
        </button>

        <button
          onClick={() => onChangeViewMode('all')}
          className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-colors flex items-center gap-1.5 ${
            viewMode === 'all'
              ? 'bg-white text-slate-900 shadow-xs'
              : 'text-slate-600 hover:text-slate-900'
          }`}
        >
          <LayoutGrid className="w-3.5 h-3.5" />
          <span>Toutes les feuilles</span>
        </button>

        <button
          onClick={() => onChangeViewMode('tactical')}
          className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-colors flex items-center gap-1.5 ${
            viewMode === 'tactical'
              ? 'bg-white text-slate-900 shadow-xs'
              : 'text-slate-600 hover:text-slate-900'
          }`}
        >
          <Shield className="w-3.5 h-3.5 text-emerald-600" />
          <span>Terrain 7v7</span>
        </button>

        <button
          onClick={() => onChangeViewMode('chart')}
          className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-colors flex items-center gap-1.5 ${
            viewMode === 'chart'
              ? 'bg-white text-slate-900 shadow-xs'
              : 'text-slate-600 hover:text-slate-900'
          }`}
        >
          <TrendingUp className="w-3.5 h-3.5 text-indigo-600" />
          <span>Graphique</span>
        </button>
      </div>

      {/* Quick Chart Inline Toggle when on single or all view */}
      {onToggleQuickChart && viewMode !== 'chart' && (
        <button
          type="button"
          onClick={onToggleQuickChart}
          className={`px-3 py-1.5 rounded-xl text-xs font-semibold transition-colors flex items-center gap-1.5 border shrink-0 ${
            isQuickChartOpen
              ? 'bg-indigo-50 border-indigo-200 text-indigo-700 shadow-2xs'
              : 'bg-white border-slate-200 text-slate-700 hover:bg-slate-50'
          }`}
          title="Afficher/masquer le graphique d'évolution du score directement au-dessus de la feuille"
        >
          <TrendingUp className="w-3.5 h-3.5 text-indigo-600" />
          <span>{isQuickChartOpen ? 'Masquer le graphique' : 'Aperçu Graphique'}</span>
        </button>
      )}

    </div>
  );
};
