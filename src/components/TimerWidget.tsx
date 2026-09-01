import React from 'react';
import { Play, Pause, RotateCcw, Volume2, Plus, Minus, X, Bell } from 'lucide-react';
import { playWhistleSound, playBeep } from '../utils/audio';

interface TimerWidgetProps {
  isOpen: boolean;
  onClose: () => void;
  periodTitle: string;
  durationMinutes: number;
  secondsLeft: number;
  isRunning: boolean;
  onToggle: () => void;
  onReset: () => void;
  onAdjustSeconds: (deltaSeconds: number) => void;
}

export const TimerWidget: React.FC<TimerWidgetProps> = ({
  isOpen,
  onClose,
  periodTitle,
  durationMinutes,
  secondsLeft,
  isRunning,
  onToggle,
  onReset,
  onAdjustSeconds,
}) => {
  if (!isOpen) return null;

  const totalSeconds = (durationMinutes || 15) * 60;
  const elapsedSeconds = Math.max(0, totalSeconds - secondsLeft);
  const progressPercent = totalSeconds > 0 ? Math.min(100, Math.max(0, (elapsedSeconds / totalSeconds) * 100)) : 0;

  const minutes = Math.floor(secondsLeft / 60);
  const seconds = secondsLeft % 60;

  return (
    <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <div className="bg-slate-900 text-white rounded-3xl max-w-md w-full p-6 shadow-2xl border border-slate-700 flex flex-col items-center relative overflow-hidden">
        
        {/* Close Button */}
        <button
          onClick={onClose}
          className="absolute top-4 right-4 p-2 text-slate-400 hover:text-white hover:bg-slate-800 rounded-full transition-colors"
        >
          <X className="w-5 h-5" />
        </button>

        {/* Title & Period Tag */}
        <div className="flex items-center gap-2 mb-2">
          <span className="bg-emerald-500/20 text-emerald-300 text-xs font-bold px-3 py-1 rounded-full border border-emerald-500/30">
            {periodTitle} • {durationMinutes} min
          </span>
        </div>

        <h3 className="text-sm font-semibold text-slate-400 mb-6">Chronomètre de Match</h3>

        {/* Circular / Large Digital Display */}
        <div className="relative mb-6">
          <div className="text-6xl sm:text-7xl font-mono font-black tracking-tight text-white select-none">
            {minutes.toString().padStart(2, '0')}:{seconds.toString().padStart(2, '0')}
          </div>
          {secondsLeft === 0 && (
            <div className="text-center font-bold text-amber-400 animate-pulse text-sm mt-1">
              Fin de la période ! Coup de sifflet
            </div>
          )}
        </div>

        {/* Progress Bar */}
        <div className="w-full bg-slate-800 rounded-full h-3 mb-6 overflow-hidden border border-slate-700">
          <div
            className={`h-full transition-all duration-300 ${
              secondsLeft < 60 ? 'bg-rose-500' : secondsLeft < 180 ? 'bg-amber-500' : 'bg-emerald-500'
            }`}
            style={{ width: `${progressPercent}%` }}
          />
        </div>

        {/* Action Controls */}
        <div className="flex items-center gap-4 mb-6">
          {/* Reset */}
          <button
            onClick={onReset}
            className="p-3.5 bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white rounded-2xl transition-all shadow-sm"
            title="Réinitialiser le chronomètre"
          >
            <RotateCcw className="w-6 h-6" />
          </button>

          {/* Main Play / Pause */}
          <button
            onClick={() => {
              playBeep(isRunning ? 440 : 880, 0.1);
              onToggle();
            }}
            className={`w-20 h-20 rounded-3xl flex items-center justify-center shadow-lg transition-all transform active:scale-95 ${
              isRunning
                ? 'bg-amber-500 text-slate-950 hover:bg-amber-400'
                : 'bg-emerald-500 text-slate-950 hover:bg-emerald-400'
            }`}
            title={isRunning ? 'Pause' : 'Démarrer'}
          >
            {isRunning ? <Pause className="w-9 h-9 fill-current" /> : <Play className="w-9 h-9 fill-current ml-1" />}
          </button>

          {/* Manual Whistle sound button */}
          <button
            onClick={playWhistleSound}
            className="p-3.5 bg-slate-800 hover:bg-slate-700 text-amber-400 rounded-2xl transition-all shadow-sm flex flex-col items-center"
            title="Coup de sifflet d'arbitre"
          >
            <Volume2 className="w-6 h-6" />
          </button>
        </div>

        {/* Quick Add/Subtract Time Buttons */}
        <div className="flex items-center gap-2 w-full justify-center text-xs">
          <button
            onClick={() => onAdjustSeconds(-60)}
            className="px-3 py-1.5 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-xl font-medium transition-colors"
          >
            -1 min
          </button>
          <button
            onClick={() => onAdjustSeconds(60)}
            className="px-3 py-1.5 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-xl font-medium transition-colors"
          >
            +1 min
          </button>
          <button
            onClick={() => onAdjustSeconds(300)}
            className="px-3 py-1.5 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-xl font-medium transition-colors"
          >
            +5 min
          </button>
        </div>

      </div>
    </div>
  );
};
