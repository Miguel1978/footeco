import React, { useState } from 'react';
import { 
  X, 
  Check, 
  Star, 
  RotateCcw, 
  Bookmark, 
  Sliders, 
  Shield, 
  Sparkles,
  Info
} from 'lucide-react';
import { 
  TacticalFavorite, 
  BASE_TACTICAL_TEMPLATES, 
  saveSingleFavorite, 
  resetTacticalFavorites 
} from '../utils/tacticalFavorites';

interface TacticalFavoritesModalProps {
  isOpen: boolean;
  onClose: () => void;
  favorites: TacticalFavorite[];
  activeFavoriteId: 'fav-1' | 'fav-2' | 'fav-3';
  onFavoritesUpdated: (updatedFavorites: TacticalFavorite[], selectedId?: 'fav-1' | 'fav-2' | 'fav-3') => void;
}

export const TacticalFavoritesModal: React.FC<TacticalFavoritesModalProps> = ({
  isOpen,
  onClose,
  favorites,
  activeFavoriteId,
  onFavoritesUpdated,
}) => {
  const [selectedSlot, setSelectedSlot] = useState<1 | 2 | 3>(() => {
    if (activeFavoriteId === 'fav-2') return 2;
    if (activeFavoriteId === 'fav-3') return 3;
    return 1;
  });

  const currentFav = favorites.find(f => f.slotNumber === selectedSlot) || favorites[0];

  const [selectedBaseCode, setSelectedBaseCode] = useState<string>(currentFav.code || '2-3-1');
  const [customName, setCustomName] = useState<string>(currentFav.name || '');
  const [customBadge, setCustomBadge] = useState<string>(currentFav.badge || '');
  const [customDescription, setCustomDescription] = useState<string>(currentFav.description || '');
  const [saveToast, setSaveToast] = useState<string | null>(null);

  // Sync when user switches the slot tab
  const handleSelectSlot = (slot: 1 | 2 | 3) => {
    setSelectedSlot(slot);
    const fav = favorites.find(f => f.slotNumber === slot) || favorites[0];
    setSelectedBaseCode(fav.code || '2-3-1');
    setCustomName(fav.name || '');
    setCustomBadge(fav.badge || '');
    setCustomDescription(fav.description || '');
  };

  // When picking a base template
  const handlePickBaseTemplate = (code: string) => {
    const template = BASE_TACTICAL_TEMPLATES[code];
    if (template) {
      setSelectedBaseCode(code);
      setCustomName(template.name);
      setCustomBadge(template.badge);
      setCustomDescription(template.description);
    }
  };

  const handleSaveFavorite = () => {
    const template = BASE_TACTICAL_TEMPLATES[selectedBaseCode] || BASE_TACTICAL_TEMPLATES['2-3-1'];
    const updatedFav: Partial<TacticalFavorite> = {
      code: selectedBaseCode,
      name: customName.trim() || template.name,
      badge: customBadge.trim() || template.badge,
      description: customDescription.trim() || template.description,
      coachingTips: template.coachingTips,
      lines: template.lines,
      updatedAt: new Date().toISOString()
    };

    const newFavorites = saveSingleFavorite(selectedSlot, updatedFav);
    const favId = `fav-${selectedSlot}` as 'fav-1' | 'fav-2' | 'fav-3';
    onFavoritesUpdated(newFavorites, favId);

    setSaveToast(`Favori ${selectedSlot} (${customName || selectedBaseCode}) enregistré avec succès !`);
    setTimeout(() => {
      setSaveToast(null);
      onClose();
    }, 1200);
  };

  const handleResetAll = () => {
    if (window.confirm('Rétablir les 3 favoris tactiques par défaut (2-3-1, 3-2-1, 2-2-2) ?')) {
      const defaults = resetTacticalFavorites();
      onFavoritesUpdated(defaults, 'fav-1');
      handleSelectSlot(1);
      setSaveToast('Les 3 favoris tactiques ont été réinitialisés aux valeurs FootEco officielles.');
      setTimeout(() => setSaveToast(null), 2500);
    }
  };

  if (!isOpen) return null;

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-xs animate-in fade-in duration-150"
      role="dialog"
      aria-modal="true"
    >
      <div className="relative flex flex-col bg-white rounded-2xl shadow-2xl border border-slate-200 w-full max-w-2xl overflow-hidden text-slate-900">
        
        {/* Header */}
        <div className="flex items-center justify-between px-5 py-4 border-b border-slate-200 bg-slate-50/90">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-amber-500 text-white flex items-center justify-center shadow-xs">
              <Star className="w-5 h-5 fill-white text-white" />
            </div>
            <div>
              <h2 className="text-base font-extrabold text-slate-900 leading-tight">
                Gérer les 3 Favoris Tactiques
              </h2>
              <p className="text-xs text-slate-500 mt-0.5">
                Personnalisez ou choisissez les 3 schémas de base accessibles en 1 clic
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-1.5 rounded-lg text-slate-400 hover:text-slate-700 hover:bg-slate-200/60 transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Modal Body */}
        <div className="p-5 space-y-5 overflow-y-auto max-h-[78vh]">
          
          {/* Step 1: Select which favorite slot to edit */}
          <div>
            <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-2">
              1. Emplacement du favori à modifier / sauvegarder
            </label>
            <div className="grid grid-cols-3 gap-2 sm:gap-3">
              {favorites.map((fav) => {
                const isSelected = fav.slotNumber === selectedSlot;
                return (
                  <button
                    key={fav.id}
                    type="button"
                    onClick={() => handleSelectSlot(fav.slotNumber)}
                    className={`p-3 rounded-xl border text-left transition-all cursor-pointer flex flex-col justify-between ${
                      isSelected
                        ? 'border-amber-500 bg-amber-50/80 ring-2 ring-amber-300 shadow-sm'
                        : 'border-slate-200 hover:border-slate-300 hover:bg-slate-50 bg-white'
                    }`}
                  >
                    <div className="flex items-center justify-between mb-1">
                      <span className={`text-xs font-black px-1.5 py-0.5 rounded ${
                        isSelected ? 'bg-amber-500 text-white' : 'bg-slate-100 text-slate-700'
                      }`}>
                        ★ Favori {fav.slotNumber}
                      </span>
                      <span className="text-[11px] font-mono font-bold text-slate-700">
                        {fav.code}
                      </span>
                    </div>
                    <span className="text-xs font-bold text-slate-900 truncate block">
                      {fav.name}
                    </span>
                    <span className="text-[10px] text-slate-500 truncate block mt-0.5">
                      {fav.badge}
                    </span>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Step 2: Choose a base tactical schema */}
          <div>
            <div className="flex items-center justify-between mb-2">
              <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider">
                2. Schéma tactique de base pour le Favori {selectedSlot}
              </label>
              <span className="text-[11px] text-slate-500">7 contre 7 FootEco</span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
              {Object.entries(BASE_TACTICAL_TEMPLATES).map(([code, tmpl]) => {
                const isChosen = selectedBaseCode === code;
                return (
                  <div
                    key={code}
                    onClick={() => handlePickBaseTemplate(code)}
                    className={`p-3 rounded-xl border transition-all cursor-pointer flex flex-col justify-between ${
                      isChosen
                        ? 'border-indigo-500 bg-indigo-50/70 ring-2 ring-indigo-300 shadow-xs'
                        : 'border-slate-200 hover:border-slate-300 hover:bg-slate-50/80 bg-white'
                    }`}
                  >
                    <div className="flex items-start justify-between">
                      <div className="flex items-center gap-2">
                        <span className={`text-sm font-black px-2 py-0.5 rounded font-mono ${
                          isChosen ? 'bg-indigo-600 text-white' : 'bg-slate-100 text-slate-800'
                        }`}>
                          {code}
                        </span>
                        <div>
                          <h4 className="font-bold text-xs text-slate-900 leading-tight">
                            {tmpl.name}
                          </h4>
                          <span className="text-[10px] text-indigo-700 font-semibold">
                            {tmpl.badge}
                          </span>
                        </div>
                      </div>
                      {isChosen && (
                        <span className="w-5 h-5 rounded-full bg-indigo-600 text-white flex items-center justify-center text-xs shrink-0">
                          ✓
                        </span>
                      )}
                    </div>
                    <p className="text-[11px] text-slate-600 mt-2 line-clamp-2 leading-relaxed">
                      {tmpl.description}
                    </p>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Step 3: Customize labels (Optional) */}
          <div className="bg-slate-50 border border-slate-200 rounded-xl p-3.5 space-y-3">
            <div className="flex items-center gap-1.5 text-xs font-bold text-slate-800">
              <Sliders className="w-4 h-4 text-indigo-600" />
              <span>Personnaliser les libellés (optionnel)</span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="block text-[11px] font-semibold text-slate-600 mb-1">
                  Nom affiché :
                </label>
                <input
                  type="text"
                  value={customName}
                  onChange={(e) => setCustomName(e.target.value)}
                  placeholder="Ex: 2-3-1 FootEco Classique"
                  className="w-full text-xs font-bold px-3 py-1.5 rounded-lg border border-slate-300 bg-white text-slate-900 focus:outline-none focus:ring-2 focus:ring-indigo-400"
                />
              </div>

              <div>
                <label className="block text-[11px] font-semibold text-slate-600 mb-1">
                  Badge / Style :
                </label>
                <input
                  type="text"
                  value={customBadge}
                  onChange={(e) => setCustomBadge(e.target.value)}
                  placeholder="Ex: Standard ASF / FE12"
                  className="w-full text-xs font-medium px-3 py-1.5 rounded-lg border border-slate-300 bg-white text-slate-900 focus:outline-none focus:ring-2 focus:ring-indigo-400"
                />
              </div>
            </div>

            <div>
              <label className="block text-[11px] font-semibold text-slate-600 mb-1">
                Description / Consignes prioritaires :
              </label>
              <textarea
                value={customDescription}
                onChange={(e) => setCustomDescription(e.target.value)}
                rows={2}
                placeholder="Consignes tactiques du schéma..."
                className="w-full text-xs px-3 py-1.5 rounded-lg border border-slate-300 bg-white text-slate-900 focus:outline-none focus:ring-2 focus:ring-indigo-400 resize-none"
              />
            </div>
          </div>

          {/* Toast Notification */}
          {saveToast && (
            <div className="p-3 rounded-xl bg-emerald-50 border border-emerald-300 text-emerald-800 text-xs font-bold flex items-center gap-2 animate-in fade-in">
              <Check className="w-4 h-4 text-emerald-600 shrink-0" />
              <span>{saveToast}</span>
            </div>
          )}

        </div>

        {/* Footer */}
        <div className="flex items-center justify-between px-5 py-3.5 border-t border-slate-200 bg-slate-50 text-xs">
          <button
            type="button"
            onClick={handleResetAll}
            className="inline-flex items-center gap-1 text-slate-500 hover:text-rose-600 font-semibold transition-colors cursor-pointer"
            title="Rétablir les 3 favoris initiaux"
          >
            <RotateCcw className="w-3.5 h-3.5" />
            <span>Rétablir les 3 favoris par défaut</span>
          </button>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={onClose}
              className="px-3.5 py-1.5 rounded-xl border border-slate-300 text-slate-700 hover:bg-slate-100 font-bold transition-all cursor-pointer"
            >
              Fermer
            </button>
            <button
              type="button"
              onClick={handleSaveFavorite}
              className="inline-flex items-center gap-1.5 px-4 py-1.5 rounded-xl bg-amber-500 hover:bg-amber-600 text-white font-extrabold shadow-sm transition-all active:scale-95 cursor-pointer"
            >
              <Star className="w-3.5 h-3.5 fill-white" />
              <span>Sauvegarder dans Favori {selectedSlot}</span>
            </button>
          </div>
        </div>

      </div>
    </div>
  );
};
