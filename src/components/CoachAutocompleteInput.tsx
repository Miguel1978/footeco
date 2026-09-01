import React, { useState, useEffect, useRef } from 'react';
import { User, Check, X, ChevronDown, Sparkles } from 'lucide-react';
import { loadCoachesHistory, saveCoachToHistory, deleteCoachFromHistory } from '../utils/storage';

interface CoachAutocompleteInputProps {
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  variant?: 'yellow' | 'red' | 'default';
  className?: string;
  ariaLabel?: string;
}

export const CoachAutocompleteInput: React.FC<CoachAutocompleteInputProps> = ({
  value,
  onChange,
  placeholder = 'Nom coach',
  variant = 'default',
  className = '',
  ariaLabel = 'Nom du coach',
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const [suggestions, setSuggestions] = useState<string[]>([]);
  const [highlightedIndex, setHighlightedIndex] = useState<number>(-1);
  const wrapperRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  // Load history on mount or when opened
  const refreshHistory = () => {
    const history = loadCoachesHistory();
    setSuggestions(history);
  };

  useEffect(() => {
    refreshHistory();
  }, []);

  // Filter suggestions according to current typed input
  const filteredSuggestions = suggestions.filter(coach => {
    if (!value || value.trim() === '') return true;
    return coach.toLowerCase().includes(value.trim().toLowerCase());
  });

  // Handle outside click to close dropdown
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (wrapperRef.current && !wrapperRef.current.contains(event.target as Node)) {
        setIsOpen(false);
        // Persist non-empty value to history on blur/closing
        if (value && value.trim().length >= 2) {
          const updated = saveCoachToHistory(value);
          setSuggestions(updated);
        }
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [value]);

  const handleSelectCoach = (coach: string) => {
    onChange(coach);
    const updated = saveCoachToHistory(coach);
    setSuggestions(updated);
    setIsOpen(false);
    setHighlightedIndex(-1);
  };

  const handleDeleteCoach = (e: React.MouseEvent, coachToDelete: string) => {
    e.stopPropagation();
    const updated = deleteCoachFromHistory(coachToDelete);
    setSuggestions(updated);
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'ArrowDown') {
      e.preventDefault();
      if (!isOpen) {
        setIsOpen(true);
        setHighlightedIndex(0);
      } else {
        setHighlightedIndex(prev => 
          prev < filteredSuggestions.length - 1 ? prev + 1 : 0
        );
      }
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      if (!isOpen) {
        setIsOpen(true);
        setHighlightedIndex(filteredSuggestions.length - 1);
      } else {
        setHighlightedIndex(prev => 
          prev > 0 ? prev - 1 : filteredSuggestions.length - 1
        );
      }
    } else if (e.key === 'Enter') {
      if (isOpen && highlightedIndex >= 0 && highlightedIndex < filteredSuggestions.length) {
        e.preventDefault();
        handleSelectCoach(filteredSuggestions[highlightedIndex]);
      } else if (value.trim()) {
        setIsOpen(false);
        const updated = saveCoachToHistory(value);
        setSuggestions(updated);
      }
    } else if (e.key === 'Escape') {
      setIsOpen(false);
    }
  };

  // Base styling depending on the theme variant
  let variantStyles = 'bg-slate-100 text-slate-900 border-slate-300 focus:bg-white';
  if (variant === 'yellow') {
    variantStyles = 'bg-yellow-200/90 text-slate-950 border-slate-900/30 hover:bg-white focus:bg-white';
  } else if (variant === 'red') {
    variantStyles = 'bg-red-700/80 text-white border-white/40 hover:bg-white hover:text-slate-900 focus:bg-white focus:text-slate-900 placeholder:text-red-200';
  }

  return (
    <div ref={wrapperRef} className="relative inline-block text-left">
      <div className="relative flex items-center">
        <input
          ref={inputRef}
          type="text"
          value={value}
          onChange={(e) => {
            onChange(e.target.value);
            if (!isOpen) setIsOpen(true);
          }}
          onFocus={() => {
            refreshHistory();
            setIsOpen(true);
          }}
          onKeyDown={handleKeyDown}
          placeholder={placeholder}
          aria-label={ariaLabel}
          autoComplete="off"
          className={`px-2 py-0.5 pr-6 text-sm font-bold border-b rounded transition-all focus:outline-none focus:ring-1 focus:ring-indigo-500 w-28 text-right not-italic ${variantStyles} ${className}`}
        />
        
        {/* Toggle / Indicator icon */}
        <button
          type="button"
          tabIndex={-1}
          onClick={() => {
            refreshHistory();
            setIsOpen(!isOpen);
            inputRef.current?.focus();
          }}
          className={`absolute right-1 p-0.5 rounded hover:bg-black/10 transition-colors ${
            variant === 'red' && !value ? 'text-white/80' : 'text-slate-700'
          }`}
          title="Afficher les suggestions de coachs"
        >
          <ChevronDown className={`w-3 h-3 transition-transform duration-150 ${isOpen ? 'rotate-180' : ''}`} />
        </button>
      </div>

      {/* Autocomplete Dropdown Popup */}
      {isOpen && (
        <div 
          className="absolute right-0 top-full mt-1 w-56 max-h-56 overflow-y-auto bg-white rounded-xl shadow-2xl border border-slate-200 py-1.5 z-50 animate-in fade-in-50 zoom-in-95 text-xs text-slate-800 font-sans not-italic"
          style={{ minWidth: '180px' }}
        >
          {/* Header */}
          <div className="px-3 py-1 text-[10px] font-extrabold uppercase tracking-wider text-slate-500 flex items-center justify-between border-b border-slate-100 mb-1">
            <span className="flex items-center gap-1">
              <Sparkles className="w-3 h-3 text-amber-500" />
              <span>Coachs enregistrés</span>
            </span>
            <span className="text-[9px] font-normal text-slate-400">({filteredSuggestions.length})</span>
          </div>

          {filteredSuggestions.length > 0 ? (
            <div className="space-y-0.5 px-1">
              {filteredSuggestions.map((coach, index) => {
                const isSelected = coach.toLowerCase() === value.trim().toLowerCase();
                const isHighlighted = index === highlightedIndex;

                return (
                  <div
                    key={coach}
                    onClick={() => handleSelectCoach(coach)}
                    onMouseEnter={() => setHighlightedIndex(index)}
                    className={`flex items-center justify-between px-2.5 py-1.5 rounded-lg cursor-pointer transition-colors select-none ${
                      isHighlighted || isSelected
                        ? 'bg-indigo-50 text-indigo-900 font-bold'
                        : 'text-slate-700 hover:bg-slate-50 font-medium'
                    }`}
                  >
                    <div className="flex items-center gap-2 min-w-0">
                      <div className={`w-5 h-5 rounded-full flex items-center justify-center text-[10px] font-black ${
                        isSelected 
                          ? 'bg-indigo-600 text-white' 
                          : 'bg-slate-200 text-slate-700'
                      }`}>
                        {coach.charAt(0).toUpperCase()}
                      </div>
                      <span className="truncate">{coach}</span>
                    </div>

                    <div className="flex items-center gap-1">
                      {isSelected && (
                        <Check className="w-3.5 h-3.5 text-indigo-600 flex-shrink-0" />
                      )}
                      <button
                        type="button"
                        onClick={(e) => handleDeleteCoach(e, coach)}
                        className="p-1 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded transition-colors opacity-60 hover:opacity-100"
                        title={`Supprimer "${coach}" des suggestions`}
                      >
                        <X className="w-3 h-3" />
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          ) : (
            <div className="px-3 py-2 text-center text-slate-500 italic">
              {value.trim() ? (
                <button
                  type="button"
                  onClick={() => handleSelectCoach(value.trim())}
                  className="w-full text-left font-semibold text-indigo-600 hover:text-indigo-800 text-[11px] py-0.5"
                >
                  + Enregistrer "{value.trim()}"
                </button>
              ) : (
                'Aucun coach enregistré'
              )}
            </div>
          )}

          {/* Quick tip footer */}
          <div className="px-2.5 pt-1.5 mt-1 border-t border-slate-100 text-[9px] text-slate-400 flex items-center justify-between">
            <span>Sélectionnez ou tapez un nouveau nom</span>
          </div>
        </div>
      )}
    </div>
  );
};
