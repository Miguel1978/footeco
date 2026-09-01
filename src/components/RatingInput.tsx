import React, { useState } from 'react';
import { Star, MessageSquare, Check, X } from 'lucide-react';

interface RatingInputProps {
  rating?: number;
  note?: string;
  onChangeRating: (rating?: number) => void;
  onChangeNote: (note: string) => void;
  compact?: boolean;
}

export const RatingInput: React.FC<RatingInputProps> = ({
  rating,
  note = '',
  onChangeRating,
  onChangeNote,
  compact = false,
}) => {
  const [showNotePopover, setShowNotePopover] = useState(false);
  const [tempNote, setTempNote] = useState(note);

  const getRatingColor = (val: number) => {
    switch (val) {
      case 5:
        return 'bg-emerald-500 text-white hover:bg-emerald-600 border-emerald-600';
      case 4:
        return 'bg-emerald-100 text-emerald-800 hover:bg-emerald-200 border-emerald-300';
      case 3:
        return 'bg-blue-100 text-blue-800 hover:bg-blue-200 border-blue-300';
      case 2:
        return 'bg-amber-100 text-amber-800 hover:bg-amber-200 border-amber-300';
      case 1:
        return 'bg-rose-100 text-rose-800 hover:bg-rose-200 border-rose-300';
      default:
        return 'bg-slate-100 text-slate-600 hover:bg-slate-200 border-slate-200';
    }
  };

  const getActiveBadgeStyle = (val: number) => {
    switch (val) {
      case 4:
        return 'bg-emerald-600 text-white ring-2 ring-emerald-400 font-extrabold';
      case 3:
        return 'bg-blue-600 text-white ring-2 ring-blue-300 font-extrabold';
      case 2:
        return 'bg-amber-500 text-white ring-2 ring-amber-300 font-extrabold';
      case 1:
        return 'bg-rose-500 text-white ring-2 ring-rose-300 font-extrabold';
      default:
        return 'bg-slate-200 text-slate-800';
    }
  };

  const handleSelectRating = (num: number) => {
    if (rating === num) {
      onChangeRating(undefined); // unselect
    } else {
      onChangeRating(num);
    }
  };

  const handleSaveNote = () => {
    onChangeNote(tempNote);
    setShowNotePopover(false);
  };

  return (
    <div className="relative inline-flex items-center justify-center gap-1 group">
      {/* 1 to 4 Quick Rating Pill Selector */}
      <div className="flex items-center bg-slate-100/90 hover:bg-slate-200/90 rounded-md p-0.5 border border-slate-300 transition-colors">
        {[1, 2, 3, 4].map((num) => {
          const isSelected = rating === num;
          return (
            <button
              key={num}
              type="button"
              onClick={() => handleSelectRating(num)}
              title={`Évaluation ${num}/4 : ${
                num === 4 ? '4 - Très bon / Maîtrisé' : 
                num === 3 ? '3 - Bon / Acquis' : 
                num === 2 ? '2 - Moyen / En cours' : '1 - Insuffisant / À travailler'
              }`}
              className={`w-5 h-5 rounded text-[11px] font-bold flex items-center justify-center transition-all ${
                isSelected
                  ? getActiveBadgeStyle(num)
                  : 'text-slate-500 hover:text-slate-900 hover:bg-white/80'
              }`}
            >
              {num}
            </button>
          );
        })}
      </div>

      {/* Note / Comment trigger button */}
      <button
        type="button"
        onClick={() => {
          setTempNote(note || '');
          setShowNotePopover(!showNotePopover);
        }}
        title={note ? `Observation : "${note}"` : 'Ajouter une remarque pour ce joueur'}
        className={`p-1 rounded transition-colors ${
          note 
            ? 'text-indigo-600 bg-indigo-50 hover:bg-indigo-100 ring-1 ring-indigo-300' 
            : 'text-slate-400 hover:text-slate-700 hover:bg-slate-200 opacity-60 group-hover:opacity-100'
        }`}
      >
        <MessageSquare className="w-3.5 h-3.5" />
      </button>

      {/* Note Floating Popover */}
      {showNotePopover && (
        <div className="absolute top-full right-0 mt-1 z-30 w-56 p-2 bg-white rounded-xl shadow-xl border border-slate-300 text-left animate-in fade-in zoom-in-95 duration-100">
          <div className="flex items-center justify-between mb-1 text-[11px] font-bold text-slate-700">
            <span>Remarque joueur</span>
            <button
              type="button"
              onClick={() => setShowNotePopover(false)}
              className="text-slate-400 hover:text-slate-600 p-0.5"
            >
              <X className="w-3 h-3" />
            </button>
          </div>
          <textarea
            value={tempNote}
            onChange={(e) => setTempNote(e.target.value)}
            placeholder="Comportement, duel, progression..."
            rows={2}
            className="w-full text-xs text-slate-800 bg-slate-50 border border-slate-300 rounded p-1.5 focus:bg-white focus:outline-none focus:ring-1 focus:ring-emerald-500 resize-none"
            autoFocus
          />
          <div className="flex items-center justify-between mt-1.5">
            {rating && (
              <span className="text-[10px] font-bold text-slate-600">
                Éval : {rating}/4
              </span>
            )}
            <div className="flex items-center gap-1 ml-auto">
              <button
                type="button"
                onClick={() => {
                  setTempNote('');
                  onChangeNote('');
                  setShowNotePopover(false);
                }}
                className="px-1.5 py-0.5 text-[10px] text-slate-500 hover:text-rose-600"
              >
                Effacer
              </button>
              <button
                type="button"
                onClick={handleSaveNote}
                className="px-2 py-0.5 text-[10px] font-bold bg-emerald-600 text-white rounded hover:bg-emerald-700 flex items-center gap-0.5 shadow-xs"
              >
                <Check className="w-2.5 h-2.5" />
                Valider
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
