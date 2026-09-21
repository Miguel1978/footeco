import React, { useState, useEffect } from 'react';
import { 
  Star, 
  Bookmark, 
  Sparkles, 
  Sliders, 
  Shield, 
  Check, 
  ArrowRightLeft, 
  Info, 
  ChevronDown, 
  ChevronUp,
  RotateCcw,
  Zap,
  Users
} from 'lucide-react';
import { PeriodMatch, PlayerSlot, Player } from '../types';
import { PlayerAvatar } from './PlayerAvatar';
import { 
  TacticalFavorite, 
  loadTacticalFavorites, 
  loadActiveFavoriteId, 
  saveActiveFavoriteId,
  DEFAULT_TACTICAL_FAVORITES,
  BASE_TACTICAL_TEMPLATES 
} from '../utils/tacticalFavorites';
import { TacticalFavoritesModal } from './TacticalFavoritesModal';
import { 
  calculateTeamPlaytime, 
  generatePeriodRotationSuggestions, 
  executeSingleRotationSwap 
} from '../utils/rotationBalancer';
import { RotationSuggestionModal } from './RotationSuggestionModal';

interface PitchTacticalViewProps {
  period: PeriodMatch;
  roster?: Player[];
  allPeriods?: PeriodMatch[];
  onUpdatePeriod?: (updatedPeriod: PeriodMatch) => void;
  onUpdateAllPeriods?: (updatedPeriods: PeriodMatch[]) => void;
}

export const PitchTacticalView: React.FC<PitchTacticalViewProps> = ({ 
  period, 
  roster = [], 
  allPeriods = [],
  onUpdatePeriod,
  onUpdateAllPeriods
}) => {
  const [favorites, setFavorites] = useState<TacticalFavorite[]>(() => loadTacticalFavorites());
  const [team1FavId, setTeam1FavId] = useState<'fav-1' | 'fav-2' | 'fav-3'>(() => loadActiveFavoriteId());
  const [team2FavId, setTeam2FavId] = useState<'fav-1' | 'fav-2' | 'fav-3'>(() => loadActiveFavoriteId());
  const [applyScope, setApplyScope] = useState<'both' | 'team1' | 'team2'>('both');
  const [isManageModalOpen, setIsManageModalOpen] = useState(false);
  const [isRotationModalOpen, setIsRotationModalOpen] = useState(false);
  const [rotationTargetTeam, setRotationTargetTeam] = useState<'team1' | 'team2'>('team1');
  const [selectedPlayerForSwap, setSelectedPlayerForSwap] = useState<{
    team: 'team1' | 'team2';
    type: 'starter' | 'sub';
    index: number;
    name: string;
  } | null>(null);
  const [toastMessage, setToastMessage] = useState<string | null>(null);
  const [showTacticalDetails, setShowTacticalDetails] = useState<boolean>(false);

  // Playtime calculation over the 4 periods
  const effectiveAllPeriods = allPeriods && allPeriods.length > 0 ? allPeriods : [period];
  const t1Summary = calculateTeamPlaytime(effectiveAllPeriods, period.id, 'team1');
  const t2Summary = calculateTeamPlaytime(effectiveAllPeriods, period.id, 'team2');
  const t1Suggestions = generatePeriodRotationSuggestions(effectiveAllPeriods, period, 'team1');
  const t2Suggestions = generatePeriodRotationSuggestions(effectiveAllPeriods, period, 'team2');

  // Drag-and-drop state
  const [draggedPlayer, setDraggedPlayer] = useState<{
    team: 'team1' | 'team2';
    type: 'starter' | 'sub';
    index: number;
  } | null>(null);

  // Resolve active favorite objects
  const fav1 = favorites.find(f => f.id === 'fav-1') || DEFAULT_TACTICAL_FAVORITES[0];
  const fav2 = favorites.find(f => f.id === 'fav-2') || DEFAULT_TACTICAL_FAVORITES[1];
  const fav3 = favorites.find(f => f.id === 'fav-3') || DEFAULT_TACTICAL_FAVORITES[2];

  const currentTeam1Fav = favorites.find(f => f.id === team1FavId) || fav1;
  const currentTeam2Fav = favorites.find(f => f.id === team2FavId) || fav1;

  // Handle switching active tactical favorite
  const handleSelectFavorite = (favId: 'fav-1' | 'fav-2' | 'fav-3') => {
    saveActiveFavoriteId(favId);
    if (applyScope === 'both') {
      setTeam1FavId(favId);
      setTeam2FavId(favId);
    } else if (applyScope === 'team1') {
      setTeam1FavId(favId);
    } else {
      setTeam2FavId(favId);
    }

    const targetFav = favorites.find(f => f.id === favId);
    if (targetFav) {
      setToastMessage(`Schéma ${targetFav.code} chargé (${targetFav.name})`);
      setTimeout(() => setToastMessage(null), 2500);
    }
  };

  // Handle player swapping
  const handlePlayerClick = (
    team: 'team1' | 'team2',
    type: 'starter' | 'sub',
    index: number,
    slot?: PlayerSlot
  ) => {
    if (!onUpdatePeriod) return;

    if (!selectedPlayerForSwap) {
      // First click: select player
      const name = slot?.playerName || (type === 'starter' ? `Titulaire ${index + 1}` : `Remplaçant ${index + 1}`);
      setSelectedPlayerForSwap({ team, type, index, name });
    } else {
      // Second click: if same player, cancel selection
      if (
        selectedPlayerForSwap.team === team &&
        selectedPlayerForSwap.type === type &&
        selectedPlayerForSwap.index === index
      ) {
        setSelectedPlayerForSwap(null);
        return;
      }

      // If different teams, prevent cross-team direct swap for safety unless intended
      if (selectedPlayerForSwap.team !== team) {
        // Switch selection to this new team player
        const name = slot?.playerName || (type === 'starter' ? `Titulaire ${index + 1}` : `Remplaçant ${index + 1}`);
        setSelectedPlayerForSwap({ team, type, index, name });
        return;
      }

      // Perform swap within the same team
      executeSwap(team, selectedPlayerForSwap, { type, index });
      setSelectedPlayerForSwap(null);
    }
  };

  const executeSwap = (
    team: 'team1' | 'team2',
    source: { type: 'starter' | 'sub'; index: number; name?: string },
    target: { type: 'starter' | 'sub'; index: number }
  ) => {
    if (!onUpdatePeriod) return;
    const currentTeam = period[team];
    const newStarters = [...currentTeam.titulaires];
    const newSubs = [...currentTeam.remplacants];

    if (source.type === 'starter' && target.type === 'starter') {
      const temp = newStarters[source.index];
      newStarters[source.index] = newStarters[target.index];
      newStarters[target.index] = temp;
    } else if (source.type === 'starter' && target.type === 'sub') {
      const temp = newStarters[source.index];
      newStarters[source.index] = newSubs[target.index];
      newSubs[target.index] = temp;
    } else if (source.type === 'sub' && target.type === 'starter') {
      const temp = newSubs[source.index];
      newSubs[source.index] = newStarters[target.index];
      newStarters[target.index] = temp;
    }

    const updatedPeriod: PeriodMatch = {
      ...period,
      [team]: {
        ...currentTeam,
        titulaires: newStarters,
        remplacants: newSubs,
      },
    };
    onUpdatePeriod(updatedPeriod);
    setToastMessage(`Postes permutés dans ${currentTeam.teamName || team} !`);
    setTimeout(() => setToastMessage(null), 2000);
  };

  // Apply the tactical positions from the active favorite to the match sheet
  const handleApplyPositionsToPeriod = (team: 'team1' | 'team2') => {
    if (!onUpdatePeriod) return;
    const fav = team === 'team1' ? currentTeam1Fav : currentTeam2Fav;
    const currentTeam = period[team];
    const updatedStarters = [...currentTeam.titulaires];

    fav.lines.forEach((line) => {
      line.slots.forEach((s) => {
        if (updatedStarters[s.slotIndex]) {
          updatedStarters[s.slotIndex] = {
            ...updatedStarters[s.slotIndex],
            position: s.position,
          };
        }
      });
    });

    const updatedPeriod: PeriodMatch = {
      ...period,
      [team]: {
        ...currentTeam,
        titulaires: updatedStarters,
      },
    };
    onUpdatePeriod(updatedPeriod);
    setToastMessage(`Postes officiels FootEco appliqués (${fav.code}) pour ${currentTeam.teamName} !`);
    setTimeout(() => setToastMessage(null), 2500);
  };

  const handleApplyPositionsBoth = () => {
    if (!onUpdatePeriod) return;
    let updatedPeriod = { ...period };

    // Team 1
    const t1Starters = [...period.team1.titulaires];
    currentTeam1Fav.lines.forEach((line) => {
      line.slots.forEach((s) => {
        if (t1Starters[s.slotIndex]) {
          t1Starters[s.slotIndex] = {
            ...t1Starters[s.slotIndex],
            position: s.position,
          };
        }
      });
    });
    updatedPeriod.team1 = { ...period.team1, titulaires: t1Starters };

    // Team 2
    const t2Starters = [...period.team2.titulaires];
    currentTeam2Fav.lines.forEach((line) => {
      line.slots.forEach((s) => {
        if (t2Starters[s.slotIndex]) {
          t2Starters[s.slotIndex] = {
            ...t2Starters[s.slotIndex],
            position: s.position,
          };
        }
      });
    });
    updatedPeriod.team2 = { ...period.team2, titulaires: t2Starters };

    onUpdatePeriod(updatedPeriod);
    setToastMessage(`Rôles tactiques synchronisés sur la feuille pour les 2 équipes !`);
    setTimeout(() => setToastMessage(null), 2500);
  };

  return (
    <div className="pitch-tactical-view space-y-4 mb-8 print:hidden">
      
      {/* Tactical Favorites Toolbar */}
      <div className="bg-slate-900 text-white rounded-2xl p-4 border border-slate-800 shadow-md">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-3 pb-3.5 border-b border-slate-800">
          
          {/* Title & Badge */}
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-xl bg-amber-500 text-white flex items-center justify-center shadow-xs">
              <Bookmark className="w-4 h-4 fill-white text-white" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="font-extrabold text-sm text-white tracking-wide">
                  Favoris Tactiques 7v7
                </h3>
                <span className="text-[10px] bg-amber-500/20 text-amber-300 font-bold px-2 py-0.5 rounded-full border border-amber-500/30">
                  3 Schémas Rapides
                </span>
              </div>
              <p className="text-[11px] text-slate-400 mt-0.5">
                Chargez en 1 clic vos schémas préférentiels ou personnalisez vos 3 dispositions
              </p>
            </div>
          </div>

          {/* Controls: Target team & Manage favorites modal */}
          <div className="flex flex-wrap items-center gap-2">
            
            {/* Target Team Selector */}
            <div className="flex items-center bg-slate-800/90 rounded-xl p-1 border border-slate-700 text-xs">
              <span className="text-[10px] text-slate-400 font-bold px-2 hidden sm:inline">
                Appliquer à :
              </span>
              <button
                type="button"
                onClick={() => setApplyScope('both')}
                className={`px-2.5 py-1 rounded-lg font-bold text-[11px] transition-all cursor-pointer ${
                  applyScope === 'both'
                    ? 'bg-indigo-600 text-white shadow-xs'
                    : 'text-slate-400 hover:text-white'
                }`}
              >
                Les 2 équipes
              </button>
              <button
                type="button"
                onClick={() => setApplyScope('team1')}
                className={`px-2.5 py-1 rounded-lg font-bold text-[11px] transition-all flex items-center gap-1 cursor-pointer ${
                  applyScope === 'team1'
                    ? 'bg-yellow-400 text-slate-950 shadow-xs'
                    : 'text-slate-400 hover:text-white'
                }`}
              >
                <span className="w-2 h-2 rounded-full bg-yellow-400 inline-block" />
                <span>Eq. 1</span>
              </button>
              <button
                type="button"
                onClick={() => setApplyScope('team2')}
                className={`px-2.5 py-1 rounded-lg font-bold text-[11px] transition-all flex items-center gap-1 cursor-pointer ${
                  applyScope === 'team2'
                    ? 'bg-rose-600 text-white shadow-xs'
                    : 'text-slate-400 hover:text-white'
                }`}
              >
                <span className="w-2 h-2 rounded-full bg-rose-500 inline-block" />
                <span>Eq. 2</span>
              </button>
            </div>

            {/* Manage & Customize button */}
            <button
              type="button"
              onClick={() => setIsManageModalOpen(true)}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 hover:border-slate-600 text-xs font-bold transition-all active:scale-95 cursor-pointer"
              title="Personnaliser ou réinitialiser les 3 schémas de base"
            >
              <Sliders className="w-3.5 h-3.5 text-amber-400" />
              <span>Gérer Favoris</span>
            </button>

            {/* 4-Period Rotation Balancer Button */}
            <button
              type="button"
              onClick={() => {
                setRotationTargetTeam(applyScope === 'team2' ? 'team2' : 'team1');
                setIsRotationModalOpen(true);
              }}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-500 hover:to-purple-500 text-white text-xs font-extrabold shadow-md transition-all active:scale-95 cursor-pointer relative"
              title="Suggérer des rotations équilibrées sur les 4 périodes (FootEco)"
            >
              <ArrowRightLeft className="w-3.5 h-3.5 text-amber-300" />
              <span>Rotation 4 Périodes</span>
              {(t1Suggestions.length > 0 || t2Suggestions.length > 0) ? (
                <span className="px-1.5 py-0.2 rounded-full bg-amber-400 text-slate-950 text-[10px] font-black animate-pulse">
                  {t1Suggestions.length + t2Suggestions.length}
                </span>
              ) : (
                <span className="text-[10px] text-indigo-200 bg-indigo-800/80 px-1.5 py-0.2 rounded font-bold">
                  Équité
                </span>
              )}
            </button>

          </div>
        </div>

        {/* 3 Tactical Favorite Quick Buttons */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5 pt-3.5">
          
          {/* Favorite 1 */}
          <button
            type="button"
            onClick={() => handleSelectFavorite('fav-1')}
            className={`p-3 rounded-xl border text-left transition-all active:scale-[0.98] cursor-pointer relative overflow-hidden group ${
              (applyScope === 'both' && team1FavId === 'fav-1' && team2FavId === 'fav-1') ||
              (applyScope === 'team1' && team1FavId === 'fav-1') ||
              (applyScope === 'team2' && team2FavId === 'fav-1')
                ? 'bg-gradient-to-br from-amber-500/20 to-amber-600/10 border-amber-400 ring-2 ring-amber-400/40 shadow-sm'
                : 'bg-slate-800/70 border-slate-700 hover:border-slate-600 hover:bg-slate-800'
            }`}
          >
            <div className="flex items-center justify-between mb-1.5">
              <span className="inline-flex items-center gap-1 text-[11px] font-black uppercase text-amber-400">
                <Star className="w-3.5 h-3.5 fill-amber-400 text-amber-400" />
                <span>Favori 1</span>
              </span>
              <span className="font-mono text-xs font-black px-2 py-0.5 rounded bg-slate-900/90 text-amber-300 border border-slate-700">
                {fav1.code}
              </span>
            </div>
            <div className="font-bold text-xs text-white group-hover:text-amber-200 truncate">
              {fav1.name}
            </div>
            <div className="text-[10px] text-slate-400 truncate mt-0.5">
              {fav1.badge}
            </div>
          </button>

          {/* Favorite 2 */}
          <button
            type="button"
            onClick={() => handleSelectFavorite('fav-2')}
            className={`p-3 rounded-xl border text-left transition-all active:scale-[0.98] cursor-pointer relative overflow-hidden group ${
              (applyScope === 'both' && team1FavId === 'fav-2' && team2FavId === 'fav-2') ||
              (applyScope === 'team1' && team1FavId === 'fav-2') ||
              (applyScope === 'team2' && team2FavId === 'fav-2')
                ? 'bg-gradient-to-br from-indigo-500/20 to-indigo-600/10 border-indigo-400 ring-2 ring-indigo-400/40 shadow-sm'
                : 'bg-slate-800/70 border-slate-700 hover:border-slate-600 hover:bg-slate-800'
            }`}
          >
            <div className="flex items-center justify-between mb-1.5">
              <span className="inline-flex items-center gap-1 text-[11px] font-black uppercase text-indigo-300">
                <Star className="w-3.5 h-3.5 fill-indigo-400 text-indigo-400" />
                <span>Favori 2</span>
              </span>
              <span className="font-mono text-xs font-black px-2 py-0.5 rounded bg-slate-900/90 text-indigo-300 border border-slate-700">
                {fav2.code}
              </span>
            </div>
            <div className="font-bold text-xs text-white group-hover:text-indigo-200 truncate">
              {fav2.name}
            </div>
            <div className="text-[10px] text-slate-400 truncate mt-0.5">
              {fav2.badge}
            </div>
          </button>

          {/* Favorite 3 */}
          <button
            type="button"
            onClick={() => handleSelectFavorite('fav-3')}
            className={`p-3 rounded-xl border text-left transition-all active:scale-[0.98] cursor-pointer relative overflow-hidden group ${
              (applyScope === 'both' && team1FavId === 'fav-3' && team2FavId === 'fav-3') ||
              (applyScope === 'team1' && team1FavId === 'fav-3') ||
              (applyScope === 'team2' && team2FavId === 'fav-3')
                ? 'bg-gradient-to-br from-emerald-500/20 to-emerald-600/10 border-emerald-400 ring-2 ring-emerald-400/40 shadow-sm'
                : 'bg-slate-800/70 border-slate-700 hover:border-slate-600 hover:bg-slate-800'
            }`}
          >
            <div className="flex items-center justify-between mb-1.5">
              <span className="inline-flex items-center gap-1 text-[11px] font-black uppercase text-emerald-400">
                <Star className="w-3.5 h-3.5 fill-emerald-400 text-emerald-400" />
                <span>Favori 3</span>
              </span>
              <span className="font-mono text-xs font-black px-2 py-0.5 rounded bg-slate-900/90 text-emerald-300 border border-slate-700">
                {fav3.code}
              </span>
            </div>
            <div className="font-bold text-xs text-white group-hover:text-emerald-200 truncate">
              {fav3.name}
            </div>
            <div className="text-[10px] text-slate-400 truncate mt-0.5">
              {fav3.badge}
            </div>
          </button>

        </div>

        {/* Swap helper or toast indicator */}
        <div className="mt-3 pt-2.5 border-t border-slate-800/80 flex flex-wrap items-center justify-between text-xs text-slate-400 gap-2">
          <div className="flex items-center gap-2">
            <ArrowRightLeft className="w-3.5 h-3.5 text-amber-400 shrink-0" />
            <span>
              {selectedPlayerForSwap ? (
                <span className="text-amber-300 font-bold">
                  Joueur sélectionné : <strong>{selectedPlayerForSwap.name}</strong> • Cliquez sur un autre joueur pour permuter leurs postes
                </span>
              ) : (
                <span>Astuce : Cliquez ou glissez-déposez un joueur sur un autre pour échanger leurs postes instantanément.</span>
              )}
            </span>
          </div>

          <div className="flex items-center gap-2">
            {selectedPlayerForSwap && (
              <button
                type="button"
                onClick={() => setSelectedPlayerForSwap(null)}
                className="text-[11px] text-rose-400 hover:text-rose-300 font-bold underline cursor-pointer"
              >
                Annuler sélection
              </button>
            )}

            {onUpdatePeriod && (
              <button
                type="button"
                onClick={handleApplyPositionsBoth}
                className="inline-flex items-center gap-1 text-[11px] bg-slate-800 hover:bg-slate-700 text-amber-300 font-bold px-2 py-1 rounded-lg border border-slate-700 transition-colors cursor-pointer"
                title="Met à jour la colonne des postes de la feuille de match selon les schémas tactiques actifs"
              >
                <Check className="w-3 h-3 text-amber-400" />
                <span>Appliquer postes à la feuille</span>
              </button>
            )}

            <button
              type="button"
              onClick={() => setShowTacticalDetails(!showTacticalDetails)}
              className="inline-flex items-center gap-1 text-[11px] text-slate-300 hover:text-white font-semibold cursor-pointer"
            >
              <Info className="w-3 h-3 text-indigo-400" />
              <span>{showTacticalDetails ? 'Masquer consignes' : 'Voir consignes tactiques'}</span>
              {showTacticalDetails ? <ChevronUp className="w-3 h-3" /> : <ChevronDown className="w-3 h-3" />}
            </button>
          </div>
        </div>

        {/* Tactical Info Accordion */}
        {showTacticalDetails && (
          <div className="mt-3 p-3.5 rounded-xl bg-slate-800/80 border border-slate-700 text-xs text-slate-300 space-y-3 animate-in fade-in duration-150">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              
              {/* Equipe 1 Tactical Notes */}
              <div className="space-y-1.5 border-l-2 border-yellow-400 pl-3">
                <div className="flex items-center gap-1.5 font-bold text-yellow-300">
                  <span className="w-2 h-2 rounded-full bg-yellow-400" />
                  <span>Équipe 1 : {currentTeam1Fav.name} ({currentTeam1Fav.code})</span>
                </div>
                <p className="text-[11px] text-slate-300 leading-relaxed">
                  {currentTeam1Fav.description}
                </p>
                {currentTeam1Fav.coachingTips && currentTeam1Fav.coachingTips.length > 0 && (
                  <ul className="text-[11px] space-y-1 text-slate-400 pt-1">
                    {currentTeam1Fav.coachingTips.map((tip, idx) => (
                      <li key={idx} className="flex items-start gap-1.5">
                        <span className="text-yellow-400 font-bold">•</span>
                        <span>{tip}</span>
                      </li>
                    ))}
                  </ul>
                )}
              </div>

              {/* Equipe 2 Tactical Notes */}
              <div className="space-y-1.5 border-l-2 border-rose-500 pl-3">
                <div className="flex items-center gap-1.5 font-bold text-rose-300">
                  <span className="w-2 h-2 rounded-full bg-rose-500" />
                  <span>Équipe 2 : {currentTeam2Fav.name} ({currentTeam2Fav.code})</span>
                </div>
                <p className="text-[11px] text-slate-300 leading-relaxed">
                  {currentTeam2Fav.description}
                </p>
                {currentTeam2Fav.coachingTips && currentTeam2Fav.coachingTips.length > 0 && (
                  <ul className="text-[11px] space-y-1 text-slate-400 pt-1">
                    {currentTeam2Fav.coachingTips.map((tip, idx) => (
                      <li key={idx} className="flex items-start gap-1.5">
                        <span className="text-rose-400 font-bold">•</span>
                        <span>{tip}</span>
                      </li>
                    ))}
                  </ul>
                )}
              </div>

            </div>
          </div>
        )}

      </div>

      {/* Floating toast notification */}
      {toastMessage && (
        <div className="fixed top-20 right-5 z-50 bg-slate-900 text-white text-xs font-bold px-3.5 py-2.5 rounded-xl border border-slate-700 shadow-2xl flex items-center gap-2 animate-in fade-in slide-in-from-top-2">
          <Check className="w-4 h-4 text-emerald-400 shrink-0" />
          <span>{toastMessage}</span>
        </div>
      )}

      {/* The 2 Soccer Pitches (Team 1 Yellow, Team 2 Red) */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        
        {/* Equipe 1 Pitch (Yellow Accent) */}
        <div className="bg-slate-900 rounded-2xl p-4 shadow-md border border-slate-800 flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between mb-3 px-2">
              <div className="flex items-center gap-2">
                <span className="w-3 h-3 rounded-full bg-[#FFFF00]" />
                <span className="font-bold text-white text-sm">
                  {period.team1.teamName || 'Equipe 1'} (Coach: {period.team1.coachName || 'Seb'})
                </span>
                <span className="text-[11px] font-mono font-black text-amber-300 bg-slate-800 px-2 py-0.5 rounded border border-slate-700 ml-1">
                  {currentTeam1Fav.code}
                </span>
              </div>
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => {
                    setRotationTargetTeam('team1');
                    setIsRotationModalOpen(true);
                  }}
                  className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                    t1Suggestions.length > 0
                      ? 'bg-amber-500/20 text-amber-300 border border-amber-500/40 hover:bg-amber-500/30 shadow-xs'
                      : 'bg-slate-800 text-slate-300 border border-slate-700 hover:bg-slate-700'
                  }`}
                  title="Vérifier l'équité du temps de jeu et voir les suggestions de rotation"
                >
                  <ArrowRightLeft className="w-3 h-3 text-amber-400" />
                  <span>Rotation</span>
                  {t1Suggestions.length > 0 && (
                    <span className="px-1.5 py-0.2 rounded-full bg-amber-400 text-slate-950 text-[10px] font-black">
                      {t1Suggestions.length}
                    </span>
                  )}
                </button>
                <span className="text-xs text-amber-300 font-mono font-bold">
                  {period.durationMinutes || 15} min
                </span>
              </div>
            </div>

            {/* Dynamic 7v7 Pitch Graphic for Team 1 */}
            <div className="relative w-full aspect-[4/3] bg-emerald-700 rounded-xl border-2 border-emerald-500 overflow-hidden p-3 flex flex-col justify-between shadow-inner select-none">
              
              {/* Pitch Markings */}
              <div className="absolute inset-0 border-2 border-white/30 pointer-events-none m-2 rounded-lg" />
              <div className="absolute top-1/2 left-0 right-0 h-0.5 bg-white/30 -translate-y-1/2 pointer-events-none" />
              <div className="absolute top-1/2 left-1/2 w-20 h-20 border-2 border-white/30 rounded-full -translate-x-1/2 -translate-y-1/2 pointer-events-none" />
              <div className="absolute top-2 left-1/2 -translate-x-1/2 w-28 h-12 border-b-2 border-x-2 border-white/30 rounded-b-lg pointer-events-none" />
              <div className="absolute bottom-2 left-1/2 -translate-x-1/2 w-28 h-12 border-t-2 border-x-2 border-white/30 rounded-t-lg pointer-events-none" />

              {/* Dynamic Tactical Lines */}
              {currentTeam1Fav.lines.map((line, lineIdx) => {
                const isAttack = line.id === 'attack';
                const isGK = line.id === 'goalkeeper';
                const isDefense = line.id === 'defense';

                return (
                  <div
                    key={line.id}
                    className={`relative z-10 flex items-center ${
                      line.slots.length === 1
                        ? 'justify-center'
                        : line.slots.length === 2
                        ? isDefense ? 'justify-around px-8 sm:px-12' : 'justify-around px-6 sm:px-10'
                        : 'justify-between px-4 sm:px-6'
                    } ${isAttack ? 'pt-1 sm:pt-2' : ''} ${isGK ? 'pb-1 sm:pb-2' : ''}`}
                  >
                    {line.slots.map((posSlot) => {
                      const slotData = period.team1.titulaires[posSlot.slotIndex];
                      const isSelected = Boolean(
                        selectedPlayerForSwap &&
                        selectedPlayerForSwap.team === 'team1' &&
                        selectedPlayerForSwap.type === 'starter' &&
                        selectedPlayerForSwap.index === posSlot.slotIndex
                      );
                      const isRotCandidate = t1Suggestions.some(s => s.starterSlotIndex === posSlot.slotIndex);
                      const playerRep = t1Summary.reports.find(r => 
                        (slotData?.playerId && r.playerId === slotData.playerId) ||
                        (slotData?.playerName && r.playerName.trim().toLowerCase() === slotData.playerName.trim().toLowerCase())
                      );
                      const startsCount = playerRep ? playerRep.totalStarterPeriods : undefined;

                      return (
                        <div
                          key={posSlot.slotIndex}
                          draggable
                          onDragStart={() => setDraggedPlayer({ team: 'team1', type: 'starter', index: posSlot.slotIndex })}
                          onDragOver={(e) => e.preventDefault()}
                          onDrop={() => {
                            if (draggedPlayer && draggedPlayer.team === 'team1') {
                              executeSwap('team1', draggedPlayer, { type: 'starter', index: posSlot.slotIndex });
                              setDraggedPlayer(null);
                            }
                          }}
                        >
                          <PlayerPin
                            slot={slotData}
                            role={posSlot.role}
                            color="yellow"
                            isGK={isGK}
                            roster={roster}
                            isSelected={isSelected}
                            startsCount={startsCount}
                            isRotationCandidate={isRotCandidate}
                            onClick={() => handlePlayerClick('team1', 'starter', posSlot.slotIndex, slotData)}
                          />
                        </div>
                      );
                    })}
                  </div>
                );
              })}

            </div>
          </div>

          {/* Substitutes row below pitch */}
          <div className="mt-3 pt-3 border-t border-slate-800 flex items-center justify-between text-xs">
            <span className="text-slate-400 font-semibold shrink-0">Remplaçants :</span>
            <div className="flex flex-wrap gap-2 justify-end">
              {period.team1.remplacants.map((sub, idx) => {
                const matched = roster.find(
                  p => (sub.playerId && p.id === sub.playerId) || 
                       (sub.playerName && p.name.trim().toLowerCase() === sub.playerName.trim().toLowerCase())
                );
                const isSelected = Boolean(
                  selectedPlayerForSwap &&
                  selectedPlayerForSwap.team === 'team1' &&
                  selectedPlayerForSwap.type === 'sub' &&
                  selectedPlayerForSwap.index === idx
                );
                const isSubRotCandidate = t1Suggestions.some(s => s.subSlotIndex === idx);
                const subRep = t1Summary.reports.find(r => 
                  (sub?.playerId && r.playerId === sub.playerId) ||
                  (sub?.playerName && r.playerName.trim().toLowerCase() === sub.playerName.trim().toLowerCase())
                );
                const subStarts = subRep ? subRep.totalStarterPeriods : 0;

                return (
                  <div
                    key={idx}
                    draggable
                    onDragStart={() => setDraggedPlayer({ team: 'team1', type: 'sub', index: idx })}
                    onDragOver={(e) => e.preventDefault()}
                    onDrop={() => {
                      if (draggedPlayer && draggedPlayer.team === 'team1') {
                        executeSwap('team1', draggedPlayer, { type: 'sub', index: idx });
                        setDraggedPlayer(null);
                      }
                    }}
                    onClick={() => handlePlayerClick('team1', 'sub', idx, sub)}
                    className={`px-2 py-1 rounded-lg font-medium border flex items-center gap-1.5 shadow-2xs cursor-pointer transition-all active:scale-95 ${
                      isSelected
                        ? 'bg-amber-400 text-slate-950 border-amber-300 ring-2 ring-amber-300 font-bold'
                        : isSubRotCandidate
                        ? 'bg-slate-800 text-yellow-300 border-amber-400/80 ring-1 ring-amber-400/40 hover:border-yellow-400'
                        : 'bg-slate-800 text-yellow-300 border-slate-700 hover:border-yellow-400/60'
                    }`}
                    title={`Remplaçant (${subStarts}/4 titularisations)${isSubRotCandidate ? ' - Rotation conseillée pour équilibrer le temps de jeu' : ''} - Cliquez pour permuter`}
                  >
                    <PlayerAvatar player={matched} name={sub.playerName} size="xs" />
                    <span>{sub.playerName || 'Remplaçant'}</span>
                    <span className={`text-[10px] font-mono px-1 rounded ${
                      subStarts === 0 
                        ? 'bg-rose-500/30 text-rose-300 border border-rose-500/40 font-black' 
                        : subStarts === 1 
                        ? 'bg-amber-500/30 text-amber-300 border border-amber-500/40 font-bold'
                        : 'bg-slate-700/80 text-slate-300'
                    }`}>
                      {subStarts}/4
                    </span>
                    {isSubRotCandidate && (
                      <ArrowRightLeft className="w-3 h-3 text-emerald-400 animate-pulse" />
                    )}
                  </div>
                );
              })}
              {period.team1.remplacants.length === 0 && (
                <span className="text-slate-500 italic">Aucun remplaçant</span>
              )}
            </div>
          </div>
        </div>

        {/* Equipe 2 Pitch (Red Accent) */}
        <div className="bg-slate-900 rounded-2xl p-4 shadow-md border border-slate-800 flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between mb-3 px-2">
              <div className="flex items-center gap-2">
                <span className="w-3 h-3 rounded-full bg-[#FF0000]" />
                <span className="font-bold text-white text-sm">
                  {period.team2.teamName || 'Equipe 2'} (Coach: {period.team2.coachName || 'Miguel'})
                </span>
                <span className="text-[11px] font-mono font-black text-rose-300 bg-slate-800 px-2 py-0.5 rounded border border-slate-700 ml-1">
                  {currentTeam2Fav.code}
                </span>
              </div>
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => {
                    setRotationTargetTeam('team2');
                    setIsRotationModalOpen(true);
                  }}
                  className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                    t2Suggestions.length > 0
                      ? 'bg-amber-500/20 text-amber-300 border border-amber-500/40 hover:bg-amber-500/30 shadow-xs'
                      : 'bg-slate-800 text-slate-300 border border-slate-700 hover:bg-slate-700'
                  }`}
                  title="Vérifier l'équité du temps de jeu et voir les suggestions de rotation"
                >
                  <ArrowRightLeft className="w-3 h-3 text-amber-400" />
                  <span>Rotation</span>
                  {t2Suggestions.length > 0 && (
                    <span className="px-1.5 py-0.2 rounded-full bg-amber-400 text-slate-950 text-[10px] font-black">
                      {t2Suggestions.length}
                    </span>
                  )}
                </button>
                <span className="text-xs text-rose-300 font-mono font-bold">
                  {period.durationMinutes || 15} min
                </span>
              </div>
            </div>

            {/* Dynamic 7v7 Pitch Graphic for Team 2 */}
            <div className="relative w-full aspect-[4/3] bg-emerald-700 rounded-xl border-2 border-emerald-500 overflow-hidden p-3 flex flex-col justify-between shadow-inner select-none">
              
              {/* Pitch Markings */}
              <div className="absolute inset-0 border-2 border-white/30 pointer-events-none m-2 rounded-lg" />
              <div className="absolute top-1/2 left-0 right-0 h-0.5 bg-white/30 -translate-y-1/2 pointer-events-none" />
              <div className="absolute top-1/2 left-1/2 w-20 h-20 border-2 border-white/30 rounded-full -translate-x-1/2 -translate-y-1/2 pointer-events-none" />
              <div className="absolute top-2 left-1/2 -translate-x-1/2 w-28 h-12 border-b-2 border-x-2 border-white/30 rounded-b-lg pointer-events-none" />
              <div className="absolute bottom-2 left-1/2 -translate-x-1/2 w-28 h-12 border-t-2 border-x-2 border-white/30 rounded-t-lg pointer-events-none" />

              {/* Dynamic Tactical Lines */}
              {currentTeam2Fav.lines.map((line, lineIdx) => {
                const isAttack = line.id === 'attack';
                const isGK = line.id === 'goalkeeper';
                const isDefense = line.id === 'defense';

                return (
                  <div
                    key={line.id}
                    className={`relative z-10 flex items-center ${
                      line.slots.length === 1
                        ? 'justify-center'
                        : line.slots.length === 2
                        ? isDefense ? 'justify-around px-8 sm:px-12' : 'justify-around px-6 sm:px-10'
                        : 'justify-between px-4 sm:px-6'
                    } ${isAttack ? 'pt-1 sm:pt-2' : ''} ${isGK ? 'pb-1 sm:pb-2' : ''}`}
                  >
                    {line.slots.map((posSlot) => {
                      const slotData = period.team2.titulaires[posSlot.slotIndex];
                      const isSelected = Boolean(
                        selectedPlayerForSwap &&
                        selectedPlayerForSwap.team === 'team2' &&
                        selectedPlayerForSwap.type === 'starter' &&
                        selectedPlayerForSwap.index === posSlot.slotIndex
                      );
                      const isRotCandidate = t2Suggestions.some(s => s.starterSlotIndex === posSlot.slotIndex);
                      const playerRep = t2Summary.reports.find(r => 
                        (slotData?.playerId && r.playerId === slotData.playerId) ||
                        (slotData?.playerName && r.playerName.trim().toLowerCase() === slotData.playerName.trim().toLowerCase())
                      );
                      const startsCount = playerRep ? playerRep.totalStarterPeriods : undefined;

                      return (
                        <div
                          key={posSlot.slotIndex}
                          draggable
                          onDragStart={() => setDraggedPlayer({ team: 'team2', type: 'starter', index: posSlot.slotIndex })}
                          onDragOver={(e) => e.preventDefault()}
                          onDrop={() => {
                            if (draggedPlayer && draggedPlayer.team === 'team2') {
                              executeSwap('team2', draggedPlayer, { type: 'starter', index: posSlot.slotIndex });
                              setDraggedPlayer(null);
                            }
                          }}
                        >
                          <PlayerPin
                            slot={slotData}
                            role={posSlot.role}
                            color="red"
                            isGK={isGK}
                            roster={roster}
                            isSelected={isSelected}
                            startsCount={startsCount}
                            isRotationCandidate={isRotCandidate}
                            onClick={() => handlePlayerClick('team2', 'starter', posSlot.slotIndex, slotData)}
                          />
                        </div>
                      );
                    })}
                  </div>
                );
              })}

            </div>
          </div>

          {/* Substitutes row below pitch */}
          <div className="mt-3 pt-3 border-t border-slate-800 flex items-center justify-between text-xs">
            <span className="text-slate-400 font-semibold shrink-0">Remplaçants :</span>
            <div className="flex flex-wrap gap-2 justify-end">
              {period.team2.remplacants.map((sub, idx) => {
                const matched = roster.find(
                  p => (sub.playerId && p.id === sub.playerId) || 
                       (sub.playerName && p.name.trim().toLowerCase() === sub.playerName.trim().toLowerCase())
                );
                const isSelected = Boolean(
                  selectedPlayerForSwap &&
                  selectedPlayerForSwap.team === 'team2' &&
                  selectedPlayerForSwap.type === 'sub' &&
                  selectedPlayerForSwap.index === idx
                );
                const isSubRotCandidate = t2Suggestions.some(s => s.subSlotIndex === idx);
                const subRep = t2Summary.reports.find(r => 
                  (sub?.playerId && r.playerId === sub.playerId) ||
                  (sub?.playerName && r.playerName.trim().toLowerCase() === sub.playerName.trim().toLowerCase())
                );
                const subStarts = subRep ? subRep.totalStarterPeriods : 0;

                return (
                  <div
                    key={idx}
                    draggable
                    onDragStart={() => setDraggedPlayer({ team: 'team2', type: 'sub', index: idx })}
                    onDragOver={(e) => e.preventDefault()}
                    onDrop={() => {
                      if (draggedPlayer && draggedPlayer.team === 'team2') {
                        executeSwap('team2', draggedPlayer, { type: 'sub', index: idx });
                        setDraggedPlayer(null);
                      }
                    }}
                    onClick={() => handlePlayerClick('team2', 'sub', idx, sub)}
                    className={`px-2 py-1 rounded-lg font-medium border flex items-center gap-1.5 shadow-2xs cursor-pointer transition-all active:scale-95 ${
                      isSelected
                        ? 'bg-rose-500 text-white border-rose-400 ring-2 ring-rose-400 font-bold'
                        : isSubRotCandidate
                        ? 'bg-slate-800 text-rose-300 border-amber-400/80 ring-1 ring-amber-400/40 hover:border-rose-400'
                        : 'bg-slate-800 text-rose-300 border-slate-700 hover:border-rose-400/60'
                    }`}
                    title={`Remplaçant (${subStarts}/4 titularisations)${isSubRotCandidate ? ' - Rotation conseillée pour équilibrer le temps de jeu' : ''} - Cliquez pour permuter`}
                  >
                    <PlayerAvatar player={matched} name={sub.playerName} size="xs" />
                    <span>{sub.playerName || 'Remplaçant'}</span>
                    <span className={`text-[10px] font-mono px-1 rounded ${
                      subStarts === 0 
                        ? 'bg-rose-500/30 text-rose-300 border border-rose-500/40 font-black' 
                        : subStarts === 1 
                        ? 'bg-amber-500/30 text-amber-300 border border-amber-500/40 font-bold'
                        : 'bg-slate-700/80 text-slate-300'
                    }`}>
                      {subStarts}/4
                    </span>
                    {isSubRotCandidate && (
                      <ArrowRightLeft className="w-3 h-3 text-emerald-400 animate-pulse" />
                    )}
                  </div>
                );
              })}
              {period.team2.remplacants.length === 0 && (
                <span className="text-slate-500 italic">Aucun remplaçant</span>
              )}
            </div>
          </div>
        </div>

      </div>

      {/* Modal to manage & customize the 3 favorites */}
      <TacticalFavoritesModal
        isOpen={isManageModalOpen}
        onClose={() => setIsManageModalOpen(false)}
        favorites={favorites}
        activeFavoriteId={team1FavId}
        onFavoritesUpdated={(updated, newActiveId) => {
          setFavorites(updated);
          if (newActiveId) {
            handleSelectFavorite(newActiveId);
          }
        }}
      />

      {/* Modal for 4-period playtime rotation suggestions */}
      <RotationSuggestionModal
        isOpen={isRotationModalOpen}
        onClose={() => setIsRotationModalOpen(false)}
        period={period}
        allPeriods={effectiveAllPeriods}
        initialTeam={rotationTargetTeam}
        onUpdatePeriod={onUpdatePeriod}
        onUpdateAllPeriods={onUpdateAllPeriods}
      />

    </div>
  );
};

interface PlayerPinProps {
  slot?: PlayerSlot;
  role: string;
  color: 'yellow' | 'red';
  isGK?: boolean;
  roster: Player[];
  isSelected?: boolean;
  startsCount?: number;
  isRotationCandidate?: boolean;
  onClick?: () => void;
}

const PlayerPin: React.FC<PlayerPinProps> = ({ 
  slot, 
  role, 
  color, 
  isGK, 
  roster, 
  isSelected,
  startsCount,
  isRotationCandidate,
  onClick 
}) => {
  const name = slot?.playerName || '-';
  const hasName = Boolean(slot?.playerName);
  const matchedPlayer = roster.find(
    p => (slot?.playerId && p.id === slot.playerId) || 
         (slot?.playerName && p.name.trim().toLowerCase() === slot.playerName.trim().toLowerCase())
  );

  return (
    <div 
      onClick={onClick}
      className={`flex flex-col items-center group cursor-pointer transition-all ${
        isSelected ? 'scale-110 -translate-y-1' : 'hover:scale-105'
      }`}
      title={`${hasName ? name : 'Poste vacant'} (${role})${startsCount !== undefined ? ` • ${startsCount}/4 titularisations` : ''}${isRotationCandidate ? ' • Rotation conseillée pour équilibrer le temps de jeu' : ''} - Cliquez pour permuter`}
    >
      <div className={`relative transition-all rounded-full p-0.5 ${
        isSelected 
          ? 'ring-4 ring-amber-400 shadow-xl bg-amber-400/30 animate-pulse' 
          : 'group-hover:ring-2 group-hover:ring-white/80'
      }`}>
        {matchedPlayer ? (
          <PlayerAvatar player={matchedPlayer} size="md" showBorder />
        ) : (
          <div
            className={`w-7 h-7 sm:w-8 sm:h-8 rounded-full border-2 border-white shadow-md flex items-center justify-center text-xs font-black ${
              isGK
                ? 'bg-amber-400 text-slate-900'
                : color === 'yellow'
                ? 'bg-yellow-300 text-slate-900'
                : 'bg-red-600 text-white'
            }`}
          >
            {isGK ? 'G' : name.charAt(0) || '•'}
          </div>
        )}

        {/* Floating Rotation Candidate Badge */}
        {isRotationCandidate && (
          <div 
            className="absolute -top-1 -right-1 bg-amber-400 text-slate-950 p-0.5 rounded-full shadow-md border border-slate-900 animate-bounce"
            title="Rotation suggérée pour équilibrer le temps de jeu"
          >
            <ArrowRightLeft className="w-2.5 h-2.5" />
          </div>
        )}
      </div>

      <div className="flex items-center gap-1 mt-0.5 max-w-[85px] justify-center">
        <span className={`text-white text-[10px] font-bold px-1.5 py-0.5 rounded shadow-xs truncate text-center transition-colors ${
          isSelected
            ? 'bg-amber-500 text-slate-950 font-black'
            : 'bg-slate-950/85 backdrop-blur-xs'
        }`}>
          {hasName ? name : role}
        </span>

        {startsCount !== undefined && hasName && (
          <span 
            className={`text-[9px] font-mono font-bold px-1 rounded shadow-xs shrink-0 ${
              startsCount >= 3 
                ? 'bg-amber-400 text-slate-950' 
                : startsCount === 0 
                ? 'bg-rose-500 text-white' 
                : 'bg-slate-800 text-slate-300 border border-slate-700'
            }`}
            title={`${startsCount}/4 titularisations`}
          >
            {startsCount}P
          </span>
        )}
      </div>

      {/* Role tag under name */}
      <span className="text-[9px] font-semibold text-emerald-200/90 text-center tracking-tight truncate max-w-[80px] drop-shadow-xs">
        {role}
      </span>
    </div>
  );
};
