import React, { useState, useMemo } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { PeriodMatch, PlayerSlot, Position, Player } from '../types';
import { 
  Plus, 
  Trash2, 
  ArrowLeftRight, 
  Copy, 
  Clock, 
  Sparkles, 
  UserCheck, 
  Award,
  ChevronDown,
  FileText,
  Star,
  GripVertical,
  Users,
  Search,
  Check,
  ChevronRight,
  Shield,
  Zap,
  Info,
  ArrowUpDown,
  ArrowUpRight,
  ArrowDownToLine,
  X,
  Repeat
} from 'lucide-react';
import { RatingInput } from './RatingInput';
import { PlayerAvatar } from './PlayerAvatar';
import { CoachAutocompleteInput } from './CoachAutocompleteInput';
import { playGoalCelebrationSound, playSubstitutionSound } from '../utils/audio';

export interface DragPlayerData {
  id: string;
  name: string;
  position?: Position;
  source: 'roster' | 'starter' | 'sub';
  sourceTeam?: 'team1' | 'team2';
  sourceIndex?: number;
  sourceSlotId?: string;
  sourceRating?: number;
  sourceNote?: string;
}

interface MatchSheetTableProps {
  period: PeriodMatch;
  roster: Player[];
  allPeriods: PeriodMatch[];
  onUpdatePeriod: (updatedPeriod: PeriodMatch) => void;
  onCopyFromPeriod: (sourcePeriodId: number) => void;
  onDuplicateToAllPeriods?: (sourcePeriodId: number) => void;
  onOpenCopyModal?: () => void;
  onOpenDurationModal: () => void;
}

const POSITIONS: Position[] = ['Gardien', 'Défenseur', 'Milieu', 'Couloir', 'Attaquant'];

export const MatchSheetTable: React.FC<MatchSheetTableProps> = ({
  period,
  roster,
  allPeriods,
  onUpdatePeriod,
  onCopyFromPeriod,
  onDuplicateToAllPeriods,
  onOpenCopyModal,
  onOpenDurationModal,
}) => {
  const [showRosterPanel, setShowRosterPanel] = useState<boolean>(true);
  const [rosterSearch, setRosterSearch] = useState<string>('');
  const [draggedPlayer, setDraggedPlayer] = useState<Player | null>(null);
  const [activeDragItem, setActiveDragItem] = useState<DragPlayerData | null>(null);
  const [dropOverBench, setDropOverBench] = useState<'team1' | 'team2' | null>(null);

  // Real-time substitution feedback toast state
  const [recentSubstitution, setRecentSubstitution] = useState<{
    playerIn: string;
    playerOut: string;
    team: 'team1' | 'team2';
    type: 'sub' | 'swap' | 'bench' | 'in';
    key: number;
  } | null>(null);

  // Highlight recently substituted slots for visual confirmation
  const [recentlyChangedSlots, setRecentlyChangedSlots] = useState<{
    team: 'team1' | 'team2';
    type: 'starter' | 'sub';
    index: number;
  }[]>([]);

  const showSubstitutionFeedback = (params: {
    playerIn: string;
    playerOut: string;
    team: 'team1' | 'team2';
    type: 'sub' | 'swap' | 'bench' | 'in';
  }) => {
    setRecentSubstitution({
      ...params,
      key: Date.now(),
    });
    setTimeout(() => {
      setRecentSubstitution((curr) => (curr?.key === params.playerIn ? null : curr));
    }, 5500);
  };

  const highlightSlots = (slots: { team: 'team1' | 'team2'; type: 'starter' | 'sub'; index: number }[]) => {
    setRecentlyChangedSlots(slots);
    setTimeout(() => {
      setRecentlyChangedSlots([]);
    }, 2800);
  };

  const isSlotRecentlyChanged = (team: 'team1' | 'team2', type: 'starter' | 'sub', index: number) => {
    return recentlyChangedSlots.some(s => s.team === team && s.type === type && s.index === index);
  };

  const handleUpdateTeam1 = (updates: Partial<typeof period.team1>) => {
    onUpdatePeriod({
      ...period,
      team1: { ...period.team1, ...updates },
    });
  };

  const handleUpdateTeam2 = (updates: Partial<typeof period.team2>) => {
    onUpdatePeriod({
      ...period,
      team2: { ...period.team2, ...updates },
    });
  };

  const handleUpdateStarter = (team: 'team1' | 'team2', index: number, updates: Partial<PlayerSlot>) => {
    const currentList = team === 'team1' ? [...period.team1.titulaires] : [...period.team2.titulaires];
    currentList[index] = { ...currentList[index], ...updates };
    if (team === 'team1') {
      handleUpdateTeam1({ titulaires: currentList });
    } else {
      handleUpdateTeam2({ titulaires: currentList });
    }
  };

  const handleUpdateSub = (team: 'team1' | 'team2', index: number, updates: Partial<PlayerSlot>) => {
    const currentList = team === 'team1' ? [...period.team1.remplacants] : [...period.team2.remplacants];
    currentList[index] = { ...currentList[index], ...updates };
    if (team === 'team1') {
      handleUpdateTeam1({ remplacants: currentList });
    } else {
      handleUpdateTeam2({ remplacants: currentList });
    }
  };

  const handleAddSub = (team: 'team1' | 'team2', initialPlayer?: Player) => {
    const newSlot: PlayerSlot = {
      id: `${team}-sub-${Date.now()}`,
      playerId: initialPlayer ? initialPlayer.id : null,
      playerName: initialPlayer ? initialPlayer.name : '',
      position: initialPlayer?.defaultPosition || 'Milieu',
      note: '',
      shootout: '',
    };
    if (team === 'team1') {
      handleUpdateTeam1({ remplacants: [...period.team1.remplacants, newSlot] });
    } else {
      handleUpdateTeam2({ remplacants: [...period.team2.remplacants, newSlot] });
    }
  };

  const handleRemoveSub = (team: 'team1' | 'team2', index: number) => {
    if (team === 'team1') {
      const list = period.team1.remplacants.filter((_, i) => i !== index);
      handleUpdateTeam1({ remplacants: list });
    } else {
      const list = period.team2.remplacants.filter((_, i) => i !== index);
      handleUpdateTeam2({ remplacants: list });
    }
  };

  // Swap players between Team 1 and Team 2 for rotation
  const handleSwapTeamsStarters = (slotIndex: number) => {
    const t1Starters = [...period.team1.titulaires];
    const t2Starters = [...period.team2.titulaires];
    
    if (t1Starters[slotIndex] && t2Starters[slotIndex]) {
      const p1 = { ...t1Starters[slotIndex] };
      const p2 = { ...t2Starters[slotIndex] };

      t1Starters[slotIndex] = {
        ...t1Starters[slotIndex],
        playerName: p2.playerName,
        playerId: p2.playerId,
      };

      t2Starters[slotIndex] = {
        ...t2Starters[slotIndex],
        playerName: p1.playerName,
        playerId: p1.playerId,
      };

      onUpdatePeriod({
        ...period,
        team1: { ...period.team1, titulaires: t1Starters },
        team2: { ...period.team2, titulaires: t2Starters },
      });
    }
  };

  // Quick tactile substitution (Starter <-> Sub) via touch menu
  const handleQuickSubstitute = (team: 'team1' | 'team2', starterIndex: number, subIndex: number) => {
    const teamStarters = [...(team === 'team1' ? period.team1.titulaires : period.team2.titulaires)];
    const teamSubs = [...(team === 'team1' ? period.team1.remplacants : period.team2.remplacants)];

    const starter = teamStarters[starterIndex];
    const sub = teamSubs[subIndex];
    if (!starter || !sub) return;

    const starterName = starter.playerName;
    const starterId = starter.playerId;
    const subName = sub.playerName;
    const subId = sub.playerId;

    // Swap players
    teamStarters[starterIndex] = {
      ...starter,
      playerName: subName,
      playerId: subId,
    };

    teamSubs[subIndex] = {
      ...sub,
      playerName: starterName,
      playerId: starterId,
    };

    if (team === 'team1') {
      onUpdatePeriod({
        ...period,
        team1: { ...period.team1, titulaires: teamStarters, remplacants: teamSubs },
      });
    } else {
      onUpdatePeriod({
        ...period,
        team2: { ...period.team2, titulaires: teamStarters, remplacants: teamSubs },
      });
    }

    playSubstitutionSound();
    showSubstitutionFeedback({
      playerIn: subName || 'Entrant',
      playerOut: starterName || 'Sortant',
      team,
      type: 'sub',
    });
    highlightSlots([
      { team, type: 'starter', index: starterIndex },
      { team, type: 'sub', index: subIndex },
    ]);
  };

  // Move a starter to the bench (leaves the starter position open)
  const handleBenchStarter = (team: 'team1' | 'team2', starterIndex: number) => {
    const teamStarters = [...(team === 'team1' ? period.team1.titulaires : period.team2.titulaires)];
    const teamSubs = [...(team === 'team1' ? period.team1.remplacants : period.team2.remplacants)];
    const starter = teamStarters[starterIndex];
    if (!starter || !starter.playerName) return;

    const playerName = starter.playerName;
    const playerId = starter.playerId;

    teamStarters[starterIndex] = {
      ...starter,
      playerName: '',
      playerId: null,
    };

    const newSubSlot: PlayerSlot = {
      id: `${team}-sub-${Date.now()}`,
      playerId,
      playerName,
      position: starter.position || 'Milieu',
      note: starter.note || '',
      rating: starter.rating,
      shootout: starter.shootout || '',
    };
    teamSubs.push(newSubSlot);

    if (team === 'team1') {
      onUpdatePeriod({
        ...period,
        team1: { ...period.team1, titulaires: teamStarters, remplacants: teamSubs },
      });
    } else {
      onUpdatePeriod({
        ...period,
        team2: { ...period.team2, titulaires: teamStarters, remplacants: teamSubs },
      });
    }

    playSubstitutionSound();
    showSubstitutionFeedback({
      playerIn: 'Banc',
      playerOut: playerName,
      team,
      type: 'bench',
    });
    highlightSlots([
      { team, type: 'starter', index: starterIndex },
      { team, type: 'sub', index: teamSubs.length - 1 },
    ]);
  };

  // Master Drag & Drop Handler for assigning, swapping, and substituting players
  const handlePerformSubstitution = (
    targetTeam: 'team1' | 'team2',
    targetType: 'starter' | 'sub',
    targetIndex: number,
    data: DragPlayerData
  ) => {
    // 1. From Roster quick bar
    if (data.source === 'roster') {
      const updates: Partial<PlayerSlot> = {
        playerId: data.id,
        playerName: data.name,
      };
      if (targetType === 'starter') {
        handleUpdateStarter(targetTeam, targetIndex, updates);
      } else {
        handleUpdateSub(targetTeam, targetIndex, updates);
      }
      playSubstitutionSound();
      showSubstitutionFeedback({
        playerIn: data.name,
        playerOut: '',
        team: targetTeam,
        type: 'in',
      });
      highlightSlots([{ team: targetTeam, type: targetType, index: targetIndex }]);
      return;
    }

    const sourceTeam = data.sourceTeam || targetTeam;
    const sourceIndex = data.sourceIndex ?? 0;
    const sourceType = data.source;

    // Same slot drop
    if (sourceTeam === targetTeam && sourceType === targetType && sourceIndex === targetIndex) {
      return;
    }

    // Clone all 4 lists
    const t1Starters = [...period.team1.titulaires];
    const t1Subs = [...period.team1.remplacants];
    const t2Starters = [...period.team2.titulaires];
    const t2Subs = [...period.team2.remplacants];

    const getSlot = (tm: 'team1' | 'team2', tp: 'starter' | 'sub', idx: number) => {
      if (tm === 'team1') {
        return tp === 'starter' ? t1Starters[idx] : t1Subs[idx];
      } else {
        return tp === 'starter' ? t2Starters[idx] : t2Subs[idx];
      }
    };

    const setSlot = (tm: 'team1' | 'team2', tp: 'starter' | 'sub', idx: number, updated: PlayerSlot) => {
      if (tm === 'team1') {
        if (tp === 'starter') t1Starters[idx] = updated;
        else t1Subs[idx] = updated;
      } else {
        if (tp === 'starter') t2Starters[idx] = updated;
        else t2Subs[idx] = updated;
      }
    };

    const sourceSlot = getSlot(sourceTeam, sourceType, sourceIndex);
    const targetSlot = getSlot(targetTeam, targetType, targetIndex);

    if (!sourceSlot || !targetSlot) return;

    const sourcePlayerName = sourceSlot.playerName;
    const sourcePlayerId = sourceSlot.playerId;
    const targetPlayerName = targetSlot.playerName;
    const targetPlayerId = targetSlot.playerId;

    // Swap players between slots
    setSlot(targetTeam, targetType, targetIndex, {
      ...targetSlot,
      playerName: sourcePlayerName,
      playerId: sourcePlayerId,
    });

    setSlot(sourceTeam, sourceType, sourceIndex, {
      ...sourceSlot,
      playerName: targetPlayerName,
      playerId: targetPlayerId,
    });

    onUpdatePeriod({
      ...period,
      team1: {
        ...period.team1,
        titulaires: t1Starters,
        remplacants: t1Subs,
      },
      team2: {
        ...period.team2,
        titulaires: t2Starters,
        remplacants: t2Subs,
      },
    });

    playSubstitutionSound();

    const isRealSub = (sourceType === 'sub' && targetType === 'starter') || (sourceType === 'starter' && targetType === 'sub');
    const playerIn = sourceType === 'sub' ? sourcePlayerName : targetPlayerName;
    const playerOut = sourceType === 'sub' ? targetPlayerName : sourcePlayerName;

    showSubstitutionFeedback({
      playerIn: playerIn || 'Entrant',
      playerOut: playerOut || 'Sortant',
      team: targetTeam,
      type: isRealSub ? 'sub' : 'swap',
    });

    highlightSlots([
      { team: targetTeam, type: targetType, index: targetIndex },
      { team: sourceTeam, type: sourceType, index: sourceIndex },
    ]);
  };

  // Move a dragged player directly to the bench (Remplaçants list)
  const handleMovePlayerToBench = (targetTeam: 'team1' | 'team2', data: DragPlayerData) => {
    if (data.source === 'roster') {
      handleAddSub(targetTeam, {
        id: data.id,
        name: data.name,
        isPresent: true,
        defaultPosition: data.position,
      });
      playSubstitutionSound();
      showSubstitutionFeedback({
        playerIn: data.name,
        playerOut: '',
        team: targetTeam,
        type: 'in',
      });
      return;
    }

    if (data.source === 'starter') {
      const sourceTeam = data.sourceTeam || targetTeam;
      const sourceIndex = data.sourceIndex ?? 0;
      handleBenchStarter(sourceTeam, sourceIndex);
      return;
    }

    if (data.source === 'sub' && data.sourceTeam && data.sourceTeam !== targetTeam) {
      // Move between team benches
      const sourceTeam = data.sourceTeam;
      const sourceIndex = data.sourceIndex ?? 0;
      const sourceSubs = [...(sourceTeam === 'team1' ? period.team1.remplacants : period.team2.remplacants)];
      const targetSubs = [...(targetTeam === 'team1' ? period.team1.remplacants : period.team2.remplacants)];
      const subSlot = sourceSubs[sourceIndex];
      if (!subSlot) return;

      sourceSubs.splice(sourceIndex, 1);
      targetSubs.push({
        ...subSlot,
        id: `${targetTeam}-sub-${Date.now()}`,
      });

      onUpdatePeriod({
        ...period,
        team1: { ...period.team1, remplacants: sourceTeam === 'team1' ? sourceSubs : targetSubs },
        team2: { ...period.team2, remplacants: sourceTeam === 'team2' ? sourceSubs : targetSubs },
      });
      playSubstitutionSound();
    }
  };

  // Handle Drag Start from Roster
  const handleDragStartFromRoster = (e: React.DragEvent, player: Player) => {
    setDraggedPlayer(player);
    const dragData: DragPlayerData = {
      id: player.id,
      name: player.name,
      position: player.defaultPosition,
      source: 'roster',
    };
    setActiveDragItem(dragData);
    e.dataTransfer.setData('application/json', JSON.stringify(dragData));
    e.dataTransfer.effectAllowed = 'copyMove';
  };

  const handleDragEnd = () => {
    setDraggedPlayer(null);
    setActiveDragItem(null);
    setDropOverBench(null);
  };

  // State to track visual goal celebration / pulsation animation
  const [goalCelebration, setGoalCelebration] = useState<{ team: 'team1' | 'team2'; key: number } | null>(null);

  // Trigger rewarding visual pulsation and sound chime
  const triggerGoalCelebration = (team: 'team1' | 'team2') => {
    try {
      playGoalCelebrationSound();
    } catch (e) {
      // Audio fallback
    }
    setGoalCelebration({ team, key: Date.now() });
    setTimeout(() => {
      setGoalCelebration((curr) => (curr?.team === team ? null : curr));
    }, 2400);
  };

  // Quick auto-points & result calculation helper
  const handleScoreTeamChange = (team: 'team1' | 'team2', teamScore: string, oppScore: string) => {
    const prevScore = parseInt(team === 'team1' ? period.team1.scoreMatch : period.team2.scoreMatch, 10) || 0;
    const s1 = parseInt(teamScore, 10);
    const s2 = parseInt(oppScore, 10);

    // Goal scored by Footeco team! Trigger pulsating animation
    if (!isNaN(s1) && s1 > prevScore) {
      triggerGoalCelebration(team);
    }

    let result: 'Victoire' | 'Nul' | 'Défaite' | '' = '';
    let points = '0';

    if (!isNaN(s1) && !isNaN(s2)) {
      if (s1 === 0 && s2 === 0) {
        // Début de match à 0-0
        result = '';
        points = '0';
      } else if (s1 > s2) {
        result = 'Victoire';
        points = '3';
      } else if (s1 === s2) {
        result = 'Nul';
        points = '1';
      } else {
        result = 'Défaite';
        points = '0';
      }
    } else {
      points = '0';
    }

    if (team === 'team1') {
      handleUpdateTeam1({ scoreMatch: teamScore, scoreOpponent: oppScore, result, points });
    } else {
      handleUpdateTeam2({ scoreMatch: teamScore, scoreOpponent: oppScore, result, points });
    }
  };

  // Helper to increment/decrement Footeco score directly with tactile buttons
  const handleIncrementFootecoScore = (team: 'team1' | 'team2', delta: number) => {
    const currentScore = parseInt(team === 'team1' ? period.team1.scoreMatch : period.team2.scoreMatch, 10) || 0;
    const oppScore = team === 'team1' ? period.team1.scoreOpponent : period.team2.scoreOpponent;
    const newScore = Math.max(0, currentScore + delta);
    handleScoreTeamChange(team, newScore.toString(), oppScore);
  };

  // Helper to increment opponent score directly
  const handleIncrementOpponentScore = (team: 'team1' | 'team2', delta: number) => {
    const teamScore = team === 'team1' ? period.team1.scoreMatch : period.team2.scoreMatch;
    const currentOpp = parseInt(team === 'team1' ? period.team1.scoreOpponent : period.team2.scoreOpponent, 10) || 0;
    const newOpp = Math.max(0, currentOpp + delta);
    handleScoreTeamChange(team, teamScore, newOpp.toString());
  };

  // List of player names for autocomplete / suggestions
  const playerNames = roster.map(p => p.name);

  // Calculate roster usage in this current period
  const assignedPlayerNames = useMemo(() => {
    const names = new Set<string>();
    const checkSlot = (s: PlayerSlot) => {
      if (s.playerName && s.playerName.trim()) {
        names.add(s.playerName.trim().toLowerCase());
      }
    };
    period.team1.titulaires.forEach(checkSlot);
    period.team1.remplacants.forEach(checkSlot);
    period.team2.titulaires.forEach(checkSlot);
    period.team2.remplacants.forEach(checkSlot);
    return names;
  }, [period]);

  // Filtered Roster
  const filteredRoster = useMemo(() => {
    return roster.filter(p => {
      if (!p.isPresent) return false;
      if (!rosterSearch.trim()) return true;
      const query = rosterSearch.toLowerCase();
      return p.name.toLowerCase().includes(query) || (p.defaultPosition && p.defaultPosition.toLowerCase().includes(query));
    });
  }, [roster, rosterSearch]);

  return (
    <div className="space-y-4">

      {/* Interactive Drag & Drop Roster Quick Bar */}
      <div className="bg-slate-900 text-white rounded-2xl p-4 shadow-sm border border-slate-800 transition-all">
        <div className="flex flex-wrap items-center justify-between gap-3 pb-3 border-b border-slate-800">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-emerald-500/20 text-emerald-400 flex items-center justify-center font-bold border border-emerald-500/30">
              <Users className="w-4 h-4" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-sm font-black tracking-tight text-white">Effectif FE12 Disponible</h3>
                <span className="bg-emerald-500/20 text-emerald-300 text-[10px] font-bold px-2 py-0.5 rounded-full border border-emerald-500/30">
                  Glisser-Déposer actif ✋
                </span>
              </div>
              <p className="text-[11px] text-slate-400">
                Glissez un joueur directement sur une ligne de l'Équipe 1 ou Équipe 2 pour l'assigner instantanément
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            {/* Search Input */}
            <div className="relative">
              <Search className="w-3.5 h-3.5 text-slate-400 absolute left-2.5 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                placeholder="Filtrer joueur / poste..."
                value={rosterSearch}
                onChange={(e) => setRosterSearch(e.target.value)}
                className="bg-slate-800 text-white placeholder:text-slate-500 text-xs rounded-xl pl-8 pr-3 py-1.5 border border-slate-700 focus:outline-none focus:border-emerald-500 w-44"
              />
            </div>

            <button
              onClick={() => setShowRosterPanel(!showRosterPanel)}
              className="text-xs font-semibold text-slate-300 hover:text-white bg-slate-800 hover:bg-slate-700 px-3 py-1.5 rounded-xl border border-slate-700 flex items-center gap-1 transition-colors"
            >
              <span>{showRosterPanel ? 'Masquer' : 'Afficher'} ({filteredRoster.length})</span>
              <ChevronDown className={`w-3.5 h-3.5 transition-transform ${showRosterPanel ? 'rotate-180' : ''}`} />
            </button>
          </div>
        </div>

        {/* Draggable Players Chips Grid */}
        {showRosterPanel && (
          <div className="pt-3">
            <div className="flex flex-wrap gap-2 max-h-40 overflow-y-auto pr-1">
              {filteredRoster.map((player) => {
                const isAssigned = assignedPlayerNames.has(player.name.trim().toLowerCase());
                const isCurrentDrag = draggedPlayer?.id === player.id;

                return (
                  <div
                    key={player.id}
                    draggable
                    onDragStart={(e) => handleDragStartFromRoster(e, player)}
                    onDragEnd={handleDragEnd}
                    className={`group flex items-center gap-2 px-2.5 py-1.5 rounded-xl border text-xs font-semibold select-none cursor-grab active:cursor-grabbing transition-all ${
                      isCurrentDrag
                        ? 'opacity-40 scale-95 border-dashed border-emerald-400 bg-slate-800'
                        : isAssigned
                        ? 'bg-slate-800/80 border-slate-700 text-slate-300 hover:border-slate-600'
                        : 'bg-emerald-950/40 border-emerald-600/40 text-white hover:border-emerald-400 hover:bg-emerald-900/40 shadow-xs'
                    }`}
                    title="Glissez ce joueur vers un poste dans le tableau ou cliquez pour assigner"
                  >
                    <GripVertical className="w-3 h-3 text-slate-500 group-hover:text-emerald-400" />
                    
                    <PlayerAvatar
                      player={player}
                      size="xs"
                      showBorder={false}
                    />

                    <div className="flex items-center gap-1.5">
                      <span className="font-bold">{player.name}</span>
                      {player.number !== undefined && (
                        <span className="text-[10px] font-mono text-slate-400">
                          #{player.number}
                        </span>
                      )}
                    </div>

                    {player.defaultPosition && (
                      <span className="text-[9px] text-slate-400 px-1 py-0.2 rounded bg-slate-800/90 font-normal">
                        {player.defaultPosition.slice(0, 3)}
                      </span>
                    )}

                    {isAssigned && (
                      <span className="w-2 h-2 rounded-full bg-emerald-400 ring-2 ring-emerald-400/20" title="Déjà aligné dans cette période" />
                    )}
                  </div>
                );
              })}

              {filteredRoster.length === 0 && (
                <div className="text-xs text-slate-400 italic py-2">
                  Aucun joueur trouvé pour "{rosterSearch}".
                </div>
              )}
            </div>

            {/* Quick Helper Tips */}
            <div className="flex items-center justify-between mt-2 pt-2 border-t border-slate-800/80 text-[11px] text-slate-400">
              <span className="flex items-center gap-1">
                <Info className="w-3 h-3 text-emerald-400" />
                <span>Astuce : Vous pouvez aussi glisser-déplacer les joueurs d'un poste à un autre ou entre équipes.</span>
              </span>
              <span>Point vert = Aligné dans {period.title}</span>
            </div>
          </div>
        )}
      </div>

      {/* Real-time Substitution Notification Banner */}
      <AnimatePresence>
        {recentSubstitution && (
          <motion.div
            initial={{ opacity: 0, y: -10, scale: 0.98 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -10, scale: 0.98 }}
            className="p-3 px-4 rounded-xl bg-gradient-to-r from-emerald-600 via-teal-700 to-emerald-800 text-white shadow-md flex items-center justify-between text-xs"
          >
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 rounded-full bg-white/20 flex items-center justify-center shrink-0 shadow-inner">
                <Repeat className="w-4 h-4 text-white" />
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <span className="font-black uppercase tracking-wider text-[10px] text-emerald-200">
                    Changement en direct • {recentSubstitution.team === 'team1' ? (period.team1.teamName || 'Équipe 1') : (period.team2.teamName || 'Équipe 2')}
                  </span>
                  <span className="text-[10px] bg-white/20 text-white px-1.5 py-0.5 rounded font-mono font-bold">
                    {period.title}
                  </span>
                </div>
                <div className="flex items-center gap-2 text-xs font-semibold mt-0.5">
                  {recentSubstitution.type === 'sub' && (
                    <>
                      <span className="text-emerald-100 flex items-center gap-1">
                        <span className="text-emerald-300 font-extrabold">⬆️ Entrant :</span> {recentSubstitution.playerIn}
                      </span>
                      <span className="text-emerald-300/60">•</span>
                      <span className="text-emerald-100 flex items-center gap-1">
                        <span className="text-amber-300 font-extrabold">⬇️ Sortant :</span> {recentSubstitution.playerOut}
                      </span>
                    </>
                  )}
                  {recentSubstitution.type === 'swap' && (
                    <span className="text-emerald-100 flex items-center gap-1">
                      <span className="font-extrabold">⇄ Permutation :</span> {recentSubstitution.playerIn} ⇄ {recentSubstitution.playerOut}
                    </span>
                  )}
                  {recentSubstitution.type === 'bench' && (
                    <span className="text-emerald-100 flex items-center gap-1">
                      <span className="font-extrabold">⬇️ Sortie sur le banc :</span> {recentSubstitution.playerOut}
                    </span>
                  )}
                  {recentSubstitution.type === 'in' && (
                    <span className="text-emerald-100 flex items-center gap-1">
                      <span className="font-extrabold">⬆️ Entrée en jeu :</span> {recentSubstitution.playerIn}
                    </span>
                  )}
                </div>
              </div>
            </div>
            <button
              onClick={() => setRecentSubstitution(null)}
              className="p-1 hover:bg-white/20 rounded-lg text-white/80 hover:text-white transition-colors cursor-pointer"
            >
              <X className="w-4 h-4" />
            </button>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Active Drag Hint Bar */}
      {activeDragItem && (
        <div className="p-2.5 px-3.5 bg-emerald-50 border border-emerald-300 rounded-xl text-xs text-emerald-950 flex items-center justify-between shadow-2xs">
          <span className="flex items-center gap-2 font-medium">
            <span className="w-2.5 h-2.5 rounded-full bg-emerald-600 animate-pulse" />
            <span>
              Déplacement en direct de <strong className="font-bold text-emerald-900">{activeDragItem.name}</strong> ({activeDragItem.source === 'sub' ? 'Remplaçant' : activeDragItem.source === 'starter' ? 'Titulaire' : 'Effectif'}) :
            </span>
            <span className="text-emerald-700 font-normal">
              {activeDragItem.source === 'sub' 
                ? 'Déposez sur un titulaire pour le remplacer (changement direct) 🔁' 
                : activeDragItem.source === 'starter'
                ? 'Déposez sur un remplaçant pour permuter, ou sur le banc pour le faire sortir ⬇️'
                : 'Déposez sur un titulaire ou remplaçant pour l’assigner'}
            </span>
          </span>
          <button
            onClick={handleDragEnd}
            className="text-[11px] text-emerald-700 hover:text-emerald-950 underline font-bold cursor-pointer"
          >
            Terminer
          </button>
        </div>
      )}

      {/* Main Match Sheet Box */}
      <div className="bg-white rounded-2xl shadow-sm border border-slate-300 overflow-hidden">
        
        {/* Sub-header Bar with Quick Actions for this Period */}
        <div className="bg-slate-100/90 px-4 py-2.5 border-b border-slate-300 flex flex-wrap items-center justify-between gap-3 text-xs">
          <div className="flex items-center gap-2">
            <span className="font-bold text-slate-900 text-sm">{period.title}</span>
            <button
              onClick={onOpenDurationModal}
              className="flex items-center gap-1 bg-amber-100 hover:bg-amber-200 text-amber-900 px-2 py-0.5 rounded-full font-bold transition-colors"
              title="Modifier la durée de cette période"
            >
              <Clock className="w-3 h-3 text-amber-700" />
              <span>{period.durationMinutes || 15} minutes</span>
            </button>
          </div>

          {/* Copy / Preset Compo */}
          <div className="flex items-center flex-wrap gap-2">
            {allPeriods.length > 1 && (
              <div className="flex items-center flex-wrap gap-1">
                <span className="text-slate-500 font-medium text-xs">Copier compo :</span>
                {allPeriods
                  .filter(p => p.id !== period.id)
                  .map(p => (
                    <button
                      key={p.id}
                      onClick={() => onCopyFromPeriod(p.id)}
                      className="px-2 py-0.5 bg-white hover:bg-slate-200 border border-slate-300 rounded text-[11px] font-semibold text-slate-700 transition-colors cursor-pointer"
                      title={`Copier la composition du ${p.title} vers ${period.title}`}
                    >
                      depuis {p.title}
                    </button>
                  ))}
              </div>
            )}

            {/* Quick Duplicate to all other periods */}
            {onDuplicateToAllPeriods && allPeriods.length > 1 && (
              <button
                type="button"
                onClick={() => onDuplicateToAllPeriods(period.id)}
                className="inline-flex items-center gap-1 px-2.5 py-0.5 bg-indigo-50 hover:bg-indigo-100 text-indigo-700 border border-indigo-200 rounded text-[11px] font-bold transition-colors cursor-pointer"
                title={`Dupliquer la composition de ${period.title} sur TOUS les autres matchs`}
              >
                <Copy className="w-3 h-3" />
                <span>Dupliquer sur les 4 matchs</span>
              </button>
            )}

            {/* Open Copy / Swap Modal */}
            {onOpenCopyModal && (
              <button
                type="button"
                onClick={onOpenCopyModal}
                className="inline-flex items-center gap-1 px-2.5 py-0.5 bg-slate-800 hover:bg-slate-900 text-white rounded text-[11px] font-bold shadow-2xs transition-colors cursor-pointer"
                title="Ouvrir le gestionnaire complet de copie, duplication et permutation de compos"
              >
                <Copy className="w-3 h-3" />
                <span>Gestionnaire Compo</span>
              </button>
            )}
          </div>
        </div>

        {/* Main Table Structure (Mirroring the Official Footeco Sheet Format) */}
        <div className="overflow-x-auto">
          <table className="w-full border-collapse border-2 border-slate-900 text-sm">
            
            {/* Table Header: Score Column | Equipe 1 (Yellow) | Equipe 2 (Red) */}
            <thead>
              <tr>
                {/* Score Column Header */}
                <th className="w-52 bg-slate-200 border-2 border-slate-900 p-2 text-center align-middle font-bold text-slate-900 italic">
                  <div className="text-xs uppercase tracking-wider">{period.title}</div>
                  <div className="text-[11px] font-medium text-slate-600 font-sans">
                    Durée: {period.durationMinutes || 15} min
                  </div>
                </th>

                {/* Equipe 1 Header (Yellow) */}
                <th colSpan={4} className="bg-[#FFFF00] border-2 border-slate-900 p-2 text-slate-950">
                  <div className="flex items-center justify-between px-2">
                    <div className="flex items-center gap-2">
                      <span className="text-base font-extrabold tracking-wide uppercase font-sans">
                        {period.team1.teamName || 'Equipe 1'}
                      </span>
                    </div>
                    <div className="flex items-center gap-1.5 font-bold italic text-slate-900">
                      <span className="text-xs not-italic font-medium">Coach :</span>
                      <CoachAutocompleteInput
                        value={period.team1.coachName}
                        onChange={(val) => handleUpdateTeam1({ coachName: val })}
                        placeholder="Seb"
                        variant="yellow"
                        ariaLabel="Nom du coach équipe 1"
                      />
                    </div>
                  </div>
                </th>

                {/* Equipe 2 Header (Red) */}
                <th colSpan={4} className="bg-[#FF0000] border-2 border-slate-900 p-2 text-white">
                  <div className="flex items-center justify-between px-2">
                    <div className="flex items-center gap-2">
                      <span className="text-base font-extrabold tracking-wide uppercase font-sans">
                        {period.team2.teamName || 'Equipe 2'}
                      </span>
                    </div>
                    <div className="flex items-center gap-1.5 font-bold italic text-white">
                      <span className="text-xs not-italic font-medium">Coach :</span>
                      <CoachAutocompleteInput
                        value={period.team2.coachName}
                        onChange={(val) => handleUpdateTeam2({ coachName: val })}
                        placeholder="Miguel"
                        variant="red"
                        ariaLabel="Nom du coach équipe 2"
                      />
                    </div>
                  </div>
                </th>
              </tr>

              {/* Sub-headers: Positions & Columns */}
              <tr className="bg-slate-100 text-xs font-bold text-slate-900 border-b-2 border-slate-900">
                <th className="border-r-2 border-slate-900 p-1 text-center">Score & Résultats</th>

                {/* Equipe 1 Subheaders */}
                <th className="border-r border-slate-400 p-1 text-left pl-3 underline decoration-slate-400">Titulaires (7) :</th>
                <th className="border-r border-slate-400 p-1 text-left w-28 underline decoration-slate-400">Position</th>
                <th className="border-r border-slate-400 p-1 text-center w-36" title="Évaluation individuelle du joueur sur 4">
                  <span className="inline-flex items-center gap-1">
                    <Star className="w-3 h-3 text-amber-500 fill-amber-400" />
                    <span>Éval (1-4)</span>
                  </span>
                </th>
                <th className="border-r-2 border-slate-900 p-1 text-center w-24">Schootout</th>

                {/* Equipe 2 Subheaders */}
                <th className="border-r border-slate-400 p-1 text-left pl-3 underline decoration-slate-400">Titulaires (7) :</th>
                <th className="border-r border-slate-400 p-1 text-left w-28 underline decoration-slate-400">Position</th>
                <th className="border-r border-slate-400 p-1 text-center w-36" title="Évaluation individuelle du joueur sur 4">
                  <span className="inline-flex items-center gap-1">
                    <Star className="w-3 h-3 text-amber-500 fill-amber-400" />
                    <span>Éval (1-4)</span>
                  </span>
                </th>
                <th className="border-r-2 border-slate-900 p-1 text-center w-24">Schootout</th>
              </tr>
            </thead>

            {/* Table Body: 7 Starters + Subs */}
            <tbody>
              {/* Top row with Left Score Block */}
              <tr>
                {/* LEFT SCORE PANEL FOR EQUIPE 1 & EQUIPE 2 */}
                <td rowSpan={8} className="w-52 border-r-2 border-b-2 border-slate-900 p-2.5 align-top bg-slate-50/50 space-y-3.5">
                  
                  {/* Score Equipe 1 (Yellow banner) with Goal Pulsation */}
                  <motion.div
                    key={`score-card-t1-${period.id}-${goalCelebration?.key || 0}`}
                    animate={
                      goalCelebration?.team === 'team1'
                        ? {
                            scale: [1, 1.05, 0.98, 1.03, 1],
                            boxShadow: [
                              '0 0 0 0 rgba(16, 185, 129, 0)',
                              '0 0 0 6px rgba(16, 185, 129, 0.45)',
                              '0 0 0 10px rgba(16, 185, 129, 0.15)',
                              '0 0 0 0 rgba(16, 185, 129, 0)',
                            ],
                          }
                        : {}
                    }
                    transition={{ duration: 1.2, ease: 'easeOut' }}
                    className={`relative border rounded-xl overflow-visible bg-white shadow-xs transition-colors ${
                      goalCelebration?.team === 'team1'
                        ? 'border-emerald-500 ring-2 ring-emerald-400'
                        : 'border-slate-300'
                    }`}
                  >
                    {/* Goal Celebratory Popup Badge */}
                    <AnimatePresence>
                      {goalCelebration?.team === 'team1' && (
                        <motion.div
                          initial={{ opacity: 0, y: 12, scale: 0.5 }}
                          animate={{ opacity: 1, y: -6, scale: 1.08 }}
                          exit={{ opacity: 0, y: -16, scale: 0.8 }}
                          transition={{ type: 'spring', damping: 14, stiffness: 350 }}
                          className="absolute -top-3 left-1/2 -translate-x-1/2 z-30 bg-gradient-to-r from-emerald-600 to-teal-600 text-white font-black text-[10px] px-2.5 py-0.5 rounded-full shadow-lg border-2 border-white flex items-center gap-1 whitespace-nowrap animate-pulse"
                        >
                          <span>⚽</span>
                          <span>BUT FOOTECO !</span>
                          <Sparkles className="w-3 h-3 text-yellow-300 fill-yellow-300" />
                        </motion.div>
                      )}
                    </AnimatePresence>

                    <div className="bg-[#FFFF00] px-2 py-1 text-xs font-bold text-slate-950 flex items-center justify-between border-b border-slate-300 rounded-t-xl">
                      <span className="truncate pr-1">Score {period.team1.teamName || 'équipe 1'}</span>
                      <button
                        type="button"
                        onClick={() => handleUpdateTeam1({ scoreMatch: '0', scoreOpponent: '0', points: '0', result: '' })}
                        className="text-[10px] bg-white/80 hover:bg-white text-slate-800 font-bold px-1.5 py-0.5 rounded border border-slate-300/80 shadow-2xs transition-colors shrink-0 cursor-pointer"
                        title="Réinitialiser au début de match (0-0, 0 pt)"
                      >
                        0-0
                      </button>
                    </div>

                    <div className="p-2 space-y-2 text-xs">
                      {/* Score Input Row with Goal Pulsation & Stepper */}
                      <div className="space-y-1.5">
                        <div className="flex items-center justify-between gap-1">
                          <span className="font-semibold text-slate-700 text-[11px]">Score :</span>
                          <div className="flex items-center gap-1 font-bold">
                            {/* Footeco Team 1 Score Input with Pulsation */}
                            <div className="relative">
                              <motion.input
                                type="text"
                                value={period.team1.scoreMatch}
                                animate={
                                  goalCelebration?.team === 'team1'
                                    ? {
                                        scale: [1, 1.25, 1],
                                        backgroundColor: ['#ecfdf5', '#a7f3d0', '#ffffff'],
                                        borderColor: ['#10b981', '#059669', '#cbd5e1'],
                                      }
                                    : {}
                                }
                                transition={{ duration: 0.8 }}
                                onChange={(e) => handleScoreTeamChange('team1', e.target.value, period.team1.scoreOpponent)}
                                placeholder="0"
                                className={`w-8 text-center font-black rounded py-0.5 transition-all text-xs ${
                                  goalCelebration?.team === 'team1'
                                    ? 'bg-emerald-100 text-emerald-800 border-2 border-emerald-500 ring-2 ring-emerald-300'
                                    : 'bg-slate-100 border border-slate-300 text-slate-900'
                                }`}
                                title="Buts marqués par l'équipe Footeco 1"
                              />
                            </div>
                            <span className="text-slate-400 font-bold text-xs">à</span>
                            <input
                              type="text"
                              value={period.team1.scoreOpponent}
                              onChange={(e) => handleScoreTeamChange('team1', period.team1.scoreMatch, e.target.value)}
                              placeholder="0"
                              className="w-8 text-center font-bold bg-slate-100 border border-slate-300 rounded py-0.5 text-xs text-slate-900"
                              title="Buts marqués par l'adversaire"
                            />
                          </div>
                        </div>

                        {/* Tactile Quick Stepper Buttons (+1 Footeco / -1) */}
                        <div className="flex items-center justify-between gap-1 pt-1 border-t border-slate-100">
                          <div className="flex items-center gap-1">
                            <button
                              type="button"
                              onClick={() => handleIncrementFootecoScore('team1', 1)}
                              className="px-2 py-0.5 rounded-md bg-emerald-600 hover:bg-emerald-700 text-white font-black text-[10px] flex items-center gap-0.5 shadow-2xs active:scale-95 transition-all cursor-pointer"
                              title="Ajouter 1 but Footeco (+1) avec animation de célébration"
                            >
                              <span>+1 But</span>
                            </button>
                            <button
                              type="button"
                              onClick={() => handleIncrementFootecoScore('team1', -1)}
                              disabled={(parseInt(period.team1.scoreMatch, 10) || 0) <= 0}
                              className="w-5 h-5 rounded bg-slate-100 hover:bg-slate-200 text-slate-600 disabled:opacity-30 disabled:pointer-events-none font-bold text-[10px] flex items-center justify-center transition-colors cursor-pointer"
                              title="Retirer un but (-1)"
                            >
                              -
                            </button>
                          </div>
                          
                          <button
                            type="button"
                            onClick={() => handleIncrementOpponentScore('team1', 1)}
                            className="px-1.5 py-0.5 rounded bg-slate-100 hover:bg-slate-200 text-slate-600 font-semibold text-[9px] transition-colors cursor-pointer"
                            title="Ajouter 1 but adversaire"
                          >
                            +1 Adv
                          </button>
                        </div>
                      </div>

                      <div className="flex items-center justify-between gap-1 pt-1 border-t border-slate-100">
                        <span className="font-semibold text-slate-700">Shootout :</span>
                        <div className="flex items-center gap-1 font-bold">
                          <input
                            type="text"
                            value={period.team1.shootoutScore}
                            onChange={(e) => handleUpdateTeam1({ shootoutScore: e.target.value })}
                            placeholder="0"
                            className="w-8 text-center bg-slate-100 border border-slate-300 rounded py-0.5"
                          />
                          <span>à</span>
                          <input
                            type="text"
                            value={period.team1.shootoutOpponent}
                            onChange={(e) => handleUpdateTeam1({ shootoutOpponent: e.target.value })}
                            placeholder="0"
                            className="w-8 text-center bg-slate-100 border border-slate-300 rounded py-0.5"
                          />
                        </div>
                      </div>

                      <div className="flex items-center justify-between gap-1 pt-1 border-t border-slate-100">
                        <span className="font-semibold text-slate-700">Point =</span>
                        <input
                          type="text"
                          value={period.team1.points}
                          onChange={(e) => handleUpdateTeam1({ points: e.target.value })}
                          placeholder="0"
                          className="w-10 text-center font-bold bg-amber-50 border border-amber-300 rounded py-0.5 text-amber-900"
                        />
                      </div>

                      {/* Result Tag */}
                      <div className="flex gap-1 pt-1">
                        {(['Victoire', 'Nul', 'Défaite'] as const).map(res => (
                          <button
                            key={res}
                            onClick={() => handleUpdateTeam1({ result: res, points: res === 'Victoire' ? '3' : res === 'Nul' ? '1' : '0' })}
                            className={`flex-1 py-0.5 rounded text-[10px] font-bold border transition-colors ${
                              period.team1.result === res
                                ? res === 'Victoire'
                                  ? 'bg-emerald-600 text-white border-emerald-700'
                                  : res === 'Nul'
                                  ? 'bg-amber-500 text-white border-amber-600'
                                  : 'bg-rose-600 text-white border-rose-700'
                                : 'bg-slate-50 text-slate-600 border-slate-200 hover:bg-slate-100'
                            }`}
                          >
                            {res.charAt(0)}
                          </button>
                        ))}
                      </div>
                    </div>
                  </motion.div>

                  {/* Score Equipe 2 (Red banner) with Goal Pulsation */}
                  <motion.div
                    key={`score-card-t2-${period.id}-${goalCelebration?.key || 0}`}
                    animate={
                      goalCelebration?.team === 'team2'
                        ? {
                            scale: [1, 1.05, 0.98, 1.03, 1],
                            boxShadow: [
                              '0 0 0 0 rgba(16, 185, 129, 0)',
                              '0 0 0 6px rgba(16, 185, 129, 0.45)',
                              '0 0 0 10px rgba(16, 185, 129, 0.15)',
                              '0 0 0 0 rgba(16, 185, 129, 0)',
                            ],
                          }
                        : {}
                    }
                    transition={{ duration: 1.2, ease: 'easeOut' }}
                    className={`relative border rounded-xl overflow-visible bg-white shadow-xs transition-colors ${
                      goalCelebration?.team === 'team2'
                        ? 'border-emerald-500 ring-2 ring-emerald-400'
                        : 'border-slate-300'
                    }`}
                  >
                    {/* Goal Celebratory Popup Badge */}
                    <AnimatePresence>
                      {goalCelebration?.team === 'team2' && (
                        <motion.div
                          initial={{ opacity: 0, y: 12, scale: 0.5 }}
                          animate={{ opacity: 1, y: -6, scale: 1.08 }}
                          exit={{ opacity: 0, y: -16, scale: 0.8 }}
                          transition={{ type: 'spring', damping: 14, stiffness: 350 }}
                          className="absolute -top-3 left-1/2 -translate-x-1/2 z-30 bg-gradient-to-r from-emerald-600 to-teal-600 text-white font-black text-[10px] px-2.5 py-0.5 rounded-full shadow-lg border-2 border-white flex items-center gap-1 whitespace-nowrap animate-pulse"
                        >
                          <span>⚽</span>
                          <span>BUT FOOTECO !</span>
                          <Sparkles className="w-3 h-3 text-yellow-300 fill-yellow-300" />
                        </motion.div>
                      )}
                    </AnimatePresence>

                    <div className="bg-[#FF0000] px-2 py-1 text-xs font-bold text-white flex items-center justify-between border-b border-slate-300 rounded-t-xl">
                      <span className="truncate pr-1">Score {period.team2.teamName || 'équipe 2'}</span>
                      <button
                        type="button"
                        onClick={() => handleUpdateTeam2({ scoreMatch: '0', scoreOpponent: '0', points: '0', result: '' })}
                        className="text-[10px] bg-white/20 hover:bg-white/30 text-white font-bold px-1.5 py-0.5 rounded border border-white/40 shadow-2xs transition-colors shrink-0 cursor-pointer"
                        title="Réinitialiser au début de match (0-0, 0 pt)"
                      >
                        0-0
                      </button>
                    </div>

                    <div className="p-2 space-y-2 text-xs">
                      {/* Score Input Row with Goal Pulsation & Stepper */}
                      <div className="space-y-1.5">
                        <div className="flex items-center justify-between gap-1">
                          <span className="font-semibold text-slate-700 text-[11px]">Score :</span>
                          <div className="flex items-center gap-1 font-bold">
                            {/* Footeco Team 2 Score Input with Pulsation */}
                            <div className="relative">
                              <motion.input
                                type="text"
                                value={period.team2.scoreMatch}
                                animate={
                                  goalCelebration?.team === 'team2'
                                    ? {
                                        scale: [1, 1.25, 1],
                                        backgroundColor: ['#ecfdf5', '#a7f3d0', '#ffffff'],
                                        borderColor: ['#10b981', '#059669', '#cbd5e1'],
                                      }
                                    : {}
                                }
                                transition={{ duration: 0.8 }}
                                onChange={(e) => handleScoreTeamChange('team2', e.target.value, period.team2.scoreOpponent)}
                                placeholder="0"
                                className={`w-8 text-center font-black rounded py-0.5 transition-all text-xs ${
                                  goalCelebration?.team === 'team2'
                                    ? 'bg-emerald-100 text-emerald-800 border-2 border-emerald-500 ring-2 ring-emerald-300'
                                    : 'bg-slate-100 border border-slate-300 text-slate-900'
                                }`}
                                title="Buts marqués par l'équipe Footeco 2"
                              />
                            </div>
                            <span className="text-slate-400 font-bold text-xs">à</span>
                            <input
                              type="text"
                              value={period.team2.scoreOpponent}
                              onChange={(e) => handleScoreTeamChange('team2', period.team2.scoreMatch, e.target.value)}
                              placeholder="0"
                              className="w-8 text-center font-bold bg-slate-100 border border-slate-300 rounded py-0.5 text-xs text-slate-900"
                              title="Buts marqués par l'adversaire"
                            />
                          </div>
                        </div>

                        {/* Tactile Quick Stepper Buttons (+1 Footeco / -1) */}
                        <div className="flex items-center justify-between gap-1 pt-1 border-t border-slate-100">
                          <div className="flex items-center gap-1">
                            <button
                              type="button"
                              onClick={() => handleIncrementFootecoScore('team2', 1)}
                              className="px-2 py-0.5 rounded-md bg-emerald-600 hover:bg-emerald-700 text-white font-black text-[10px] flex items-center gap-0.5 shadow-2xs active:scale-95 transition-all cursor-pointer"
                              title="Ajouter 1 but Footeco (+1) avec animation de célébration"
                            >
                              <span>+1 But</span>
                            </button>
                            <button
                              type="button"
                              onClick={() => handleIncrementFootecoScore('team2', -1)}
                              disabled={(parseInt(period.team2.scoreMatch, 10) || 0) <= 0}
                              className="w-5 h-5 rounded bg-slate-100 hover:bg-slate-200 text-slate-600 disabled:opacity-30 disabled:pointer-events-none font-bold text-[10px] flex items-center justify-center transition-colors cursor-pointer"
                              title="Retirer un but (-1)"
                            >
                              -
                            </button>
                          </div>
                          
                          <button
                            type="button"
                            onClick={() => handleIncrementOpponentScore('team2', 1)}
                            className="px-1.5 py-0.5 rounded bg-slate-100 hover:bg-slate-200 text-slate-600 font-semibold text-[9px] transition-colors cursor-pointer"
                            title="Ajouter 1 but adversaire"
                          >
                            +1 Adv
                          </button>
                        </div>
                      </div>

                      <div className="flex items-center justify-between gap-1 pt-1 border-t border-slate-100">
                        <span className="font-semibold text-slate-700">Shootout :</span>
                        <div className="flex items-center gap-1 font-bold">
                          <input
                            type="text"
                            value={period.team2.shootoutScore}
                            onChange={(e) => handleUpdateTeam2({ shootoutScore: e.target.value })}
                            placeholder="0"
                            className="w-8 text-center bg-slate-100 border border-slate-300 rounded py-0.5"
                          />
                          <span>à</span>
                          <input
                            type="text"
                            value={period.team2.shootoutOpponent}
                            onChange={(e) => handleUpdateTeam2({ shootoutOpponent: e.target.value })}
                            placeholder="0"
                            className="w-8 text-center bg-slate-100 border border-slate-300 rounded py-0.5"
                          />
                        </div>
                      </div>

                      <div className="flex items-center justify-between gap-1 pt-1 border-t border-slate-100">
                        <span className="font-semibold text-slate-700">Point =</span>
                        <input
                          type="text"
                          value={period.team2.points}
                          onChange={(e) => handleUpdateTeam2({ points: e.target.value })}
                          placeholder="0"
                          className="w-10 text-center font-bold bg-red-50 border border-red-300 rounded py-0.5 text-red-900"
                        />
                      </div>

                      {/* Result Tag */}
                      <div className="flex gap-1 pt-1">
                        {(['Victoire', 'Nul', 'Défaite'] as const).map(res => (
                          <button
                            key={res}
                            onClick={() => handleUpdateTeam2({ result: res, points: res === 'Victoire' ? '3' : res === 'Nul' ? '1' : '0' })}
                            className={`flex-1 py-0.5 rounded text-[10px] font-bold border transition-colors ${
                              period.team2.result === res
                                ? res === 'Victoire'
                                  ? 'bg-emerald-600 text-white border-emerald-700'
                                  : res === 'Nul'
                                  ? 'bg-amber-500 text-white border-amber-600'
                                  : 'bg-rose-600 text-white border-rose-700'
                                : 'bg-slate-50 text-slate-600 border-slate-200 hover:bg-slate-100'
                            }`}
                          >
                            {res.charAt(0)}
                          </button>
                        ))}
                      </div>
                    </div>
                  </motion.div>

                </td>

                {/* Equipe 1 Slot 0 (Gardien) */}
                <StarterRowCells
                  slot={period.team1.titulaires[0]}
                  index={0}
                  team="team1"
                  playerNames={playerNames}
                  roster={roster}
                  substitutes={period.team1.remplacants}
                  activeDragItem={activeDragItem}
                  isRecentlyChanged={isSlotRecentlyChanged('team1', 'starter', 0)}
                  onUpdate={(updates) => handleUpdateStarter('team1', 0, updates)}
                  onSwapWithTeam2={() => handleSwapTeamsStarters(0)}
                  onDropPlayer={(data) => handlePerformSubstitution('team1', 'starter', 0, data)}
                  onDragStartSlot={(data) => setActiveDragItem(data)}
                  onDragEndSlot={handleDragEnd}
                  onQuickSubstitute={(subIndex) => handleQuickSubstitute('team1', 0, subIndex)}
                  onBenchStarter={() => handleBenchStarter('team1', 0)}
                />

                {/* Equipe 2 Slot 0 (Gardien) */}
                <StarterRowCells
                  slot={period.team2.titulaires[0]}
                  index={0}
                  team="team2"
                  playerNames={playerNames}
                  roster={roster}
                  substitutes={period.team2.remplacants}
                  activeDragItem={activeDragItem}
                  isRecentlyChanged={isSlotRecentlyChanged('team2', 'starter', 0)}
                  onUpdate={(updates) => handleUpdateStarter('team2', 0, updates)}
                  onSwapWithTeam2={() => handleSwapTeamsStarters(0)}
                  onDropPlayer={(data) => handlePerformSubstitution('team2', 'starter', 0, data)}
                  onDragStartSlot={(data) => setActiveDragItem(data)}
                  onDragEndSlot={handleDragEnd}
                  onQuickSubstitute={(subIndex) => handleQuickSubstitute('team2', 0, subIndex)}
                  onBenchStarter={() => handleBenchStarter('team2', 0)}
                />
              </tr>

              {/* Rows 1 to 6 (Starters 2 to 7) */}
              {[1, 2, 3, 4, 5, 6].map((slotIdx) => (
                <tr key={slotIdx} className="border-t border-slate-200">
                  {/* Equipe 1 Starter */}
                  <StarterRowCells
                    slot={period.team1.titulaires[slotIdx]}
                    index={slotIdx}
                    team="team1"
                    playerNames={playerNames}
                    roster={roster}
                    substitutes={period.team1.remplacants}
                    activeDragItem={activeDragItem}
                    isRecentlyChanged={isSlotRecentlyChanged('team1', 'starter', slotIdx)}
                    onUpdate={(updates) => handleUpdateStarter('team1', slotIdx, updates)}
                    onSwapWithTeam2={() => handleSwapTeamsStarters(slotIdx)}
                    onDropPlayer={(data) => handlePerformSubstitution('team1', 'starter', slotIdx, data)}
                    onDragStartSlot={(data) => setActiveDragItem(data)}
                    onDragEndSlot={handleDragEnd}
                    onQuickSubstitute={(subIndex) => handleQuickSubstitute('team1', slotIdx, subIndex)}
                    onBenchStarter={() => handleBenchStarter('team1', slotIdx)}
                  />

                  {/* Equipe 2 Starter */}
                  <StarterRowCells
                    slot={period.team2.titulaires[slotIdx]}
                    index={slotIdx}
                    team="team2"
                    playerNames={playerNames}
                    roster={roster}
                    substitutes={period.team2.remplacants}
                    activeDragItem={activeDragItem}
                    isRecentlyChanged={isSlotRecentlyChanged('team2', 'starter', slotIdx)}
                    onUpdate={(updates) => handleUpdateStarter('team2', slotIdx, updates)}
                    onSwapWithTeam2={() => handleSwapTeamsStarters(slotIdx)}
                    onDropPlayer={(data) => handlePerformSubstitution('team2', 'starter', slotIdx, data)}
                    onDragStartSlot={(data) => setActiveDragItem(data)}
                    onDragEndSlot={handleDragEnd}
                    onQuickSubstitute={(subIndex) => handleQuickSubstitute('team2', slotIdx, subIndex)}
                    onBenchStarter={() => handleBenchStarter('team2', slotIdx)}
                  />
                </tr>
              ))}

              {/* Remplaçants Header Row */}
              <tr className="bg-slate-100 text-xs font-bold text-slate-800 border-t-2 border-b border-slate-900">
                {/* Equipe 1 Remplaçants Title */}
                <td 
                  colSpan={4} 
                  onDragOver={(e) => {
                    e.preventDefault();
                    setDropOverBench('team1');
                  }}
                  onDragLeave={() => setDropOverBench(null)}
                  onDrop={(e) => {
                    e.preventDefault();
                    setDropOverBench(null);
                    const raw = e.dataTransfer.getData('application/json');
                    if (raw) {
                      try {
                        const parsed: DragPlayerData = JSON.parse(raw);
                        handleMovePlayerToBench('team1', parsed);
                      } catch (err) {}
                    }
                  }}
                  className={`p-1.5 pl-3 border-r-2 border-slate-900 transition-colors ${
                    dropOverBench === 'team1' ? 'bg-emerald-100 text-emerald-900 ring-2 ring-emerald-500' : ''
                  }`}
                >
                  <div className="flex items-center justify-between pr-2">
                    <div className="flex items-center gap-1.5">
                      <span className="font-extrabold text-slate-900">Remplaçants</span>
                      <span className="text-[10px] text-slate-500 font-normal">
                        ({period.team1.remplacants.filter(s => s.playerName).length} sur le banc)
                      </span>
                      {activeDragItem && (
                        <span className="text-[10px] font-bold text-emerald-800 bg-emerald-100 px-1.5 py-0.2 rounded animate-pulse">
                          ⬇️ Déposer sur le banc
                        </span>
                      )}
                    </div>
                    <button
                      onClick={() => handleAddSub('team1')}
                      className="text-[11px] font-semibold text-emerald-800 bg-emerald-100 hover:bg-emerald-200 px-2 py-0.5 rounded flex items-center gap-1 transition-colors cursor-pointer"
                    >
                      <Plus className="w-3 h-3" /> Ajouter remplaçant
                    </button>
                  </div>
                </td>

                {/* Equipe 2 Remplaçants Title */}
                <td 
                  colSpan={4} 
                  onDragOver={(e) => {
                    e.preventDefault();
                    setDropOverBench('team2');
                  }}
                  onDragLeave={() => setDropOverBench(null)}
                  onDrop={(e) => {
                    e.preventDefault();
                    setDropOverBench(null);
                    const raw = e.dataTransfer.getData('application/json');
                    if (raw) {
                      try {
                        const parsed: DragPlayerData = JSON.parse(raw);
                        handleMovePlayerToBench('team2', parsed);
                      } catch (err) {}
                    }
                  }}
                  className={`p-1.5 pl-3 border-r-2 border-slate-900 transition-colors ${
                    dropOverBench === 'team2' ? 'bg-emerald-100 text-emerald-900 ring-2 ring-emerald-500' : ''
                  }`}
                >
                  <div className="flex items-center justify-between pr-2">
                    <div className="flex items-center gap-1.5">
                      <span className="font-extrabold text-slate-900">Remplaçants</span>
                      <span className="text-[10px] text-slate-500 font-normal">
                        ({period.team2.remplacants.filter(s => s.playerName).length} sur le banc)
                      </span>
                      {activeDragItem && (
                        <span className="text-[10px] font-bold text-emerald-800 bg-emerald-100 px-1.5 py-0.2 rounded animate-pulse">
                          ⬇️ Déposer sur le banc
                        </span>
                      )}
                    </div>
                    <button
                      onClick={() => handleAddSub('team2')}
                      className="text-[11px] font-semibold text-emerald-800 bg-emerald-100 hover:bg-emerald-200 px-2 py-0.5 rounded flex items-center gap-1 transition-colors cursor-pointer"
                    >
                      <Plus className="w-3 h-3" /> Ajouter remplaçant
                    </button>
                  </div>
                </td>
              </tr>

              {/* Remplaçants Rows */}
              {Array.from({ length: Math.max(period.team1.remplacants.length, period.team2.remplacants.length, 1) }).map((_, subIdx) => {
                const t1Sub = period.team1.remplacants[subIdx];
                const t2Sub = period.team2.remplacants[subIdx];

                return (
                  <tr key={`sub-${subIdx}`} className="border-b border-slate-200 bg-slate-50/40">
                    {/* Score column empty cell for additional sub rows */}
                    <td className="border-r-2 border-slate-900 bg-slate-50/50"></td>

                    {/* Equipe 1 Sub */}
                    {t1Sub ? (
                      <SubRowCells
                        slot={t1Sub}
                        index={subIdx}
                        team="team1"
                        playerNames={playerNames}
                        roster={roster}
                        starters={period.team1.titulaires}
                        activeDragItem={activeDragItem}
                        isRecentlyChanged={isSlotRecentlyChanged('team1', 'sub', subIdx)}
                        onUpdate={(updates) => handleUpdateSub('team1', subIdx, updates)}
                        onRemove={() => handleRemoveSub('team1', subIdx)}
                        onDropPlayer={(data) => handlePerformSubstitution('team1', 'sub', subIdx, data)}
                        onDragStartSlot={(data) => setActiveDragItem(data)}
                        onDragEndSlot={handleDragEnd}
                        onQuickEnterPitch={(starterIndex) => handleQuickSubstitute('team1', starterIndex, subIdx)}
                      />
                    ) : (
                      <td 
                        colSpan={4} 
                        onDragOver={(e) => e.preventDefault()}
                        onDrop={(e) => {
                          e.preventDefault();
                          const raw = e.dataTransfer.getData('application/json');
                          if (raw) {
                            try {
                              const parsed: DragPlayerData = JSON.parse(raw);
                              handleMovePlayerToBench('team1', parsed);
                            } catch (err) {}
                          }
                        }}
                        className="border-r border-slate-400 p-2 text-slate-400 text-xs italic text-center border-dashed hover:bg-emerald-50 hover:border-emerald-400 transition-colors"
                      >
                        + Glisser un joueur ici pour le mettre sur le banc
                      </td>
                    )}

                    {/* Equipe 2 Sub */}
                    {t2Sub ? (
                      <SubRowCells
                        slot={t2Sub}
                        index={subIdx}
                        team="team2"
                        playerNames={playerNames}
                        roster={roster}
                        starters={period.team2.titulaires}
                        activeDragItem={activeDragItem}
                        isRecentlyChanged={isSlotRecentlyChanged('team2', 'sub', subIdx)}
                        onUpdate={(updates) => handleUpdateSub('team2', subIdx, updates)}
                        onRemove={() => handleRemoveSub('team2', subIdx)}
                        onDropPlayer={(data) => handlePerformSubstitution('team2', 'sub', subIdx, data)}
                        onDragStartSlot={(data) => setActiveDragItem(data)}
                        onDragEndSlot={handleDragEnd}
                        onQuickEnterPitch={(starterIndex) => handleQuickSubstitute('team2', starterIndex, subIdx)}
                      />
                    ) : (
                      <td 
                        colSpan={4} 
                        onDragOver={(e) => e.preventDefault()}
                        onDrop={(e) => {
                          e.preventDefault();
                          const raw = e.dataTransfer.getData('application/json');
                          if (raw) {
                            try {
                              const parsed: DragPlayerData = JSON.parse(raw);
                              handleMovePlayerToBench('team2', parsed);
                            } catch (err) {}
                          }
                        }}
                        className="border-r-2 border-slate-900 p-2 text-slate-400 text-xs italic text-center border-dashed hover:bg-emerald-50 hover:border-emerald-400 transition-colors"
                      >
                        + Glisser un joueur ici pour le mettre sur le banc
                      </td>
                    )}
                  </tr>
                );
              })}

            </tbody>
          </table>
        </div>

        {/* Specific Notes & Observations for this Match Period */}
        <div className="bg-slate-50 border-t border-slate-300 p-3.5">
          <div className="flex items-center justify-between gap-2 mb-1.5">
            <label 
              htmlFor={`period-notes-${period.id}`}
              className="flex items-center gap-1.5 text-xs font-bold text-slate-800"
            >
              <FileText className="w-3.5 h-3.5 text-slate-600" />
              <span>Notes & Observations ({period.title})</span>
            </label>
            <span className="text-[11px] text-slate-400">
              {period.notes ? `${period.notes.length} caractères` : 'Consignes tactiques, remplacements, remarques'}
            </span>
          </div>
          <textarea
            id={`period-notes-${period.id}`}
            value={period.notes || ''}
            onChange={(e) => onUpdatePeriod({ ...period, notes: e.target.value })}
            placeholder={`Ajouter des notes ou observations spécifiques pour ${period.title.toLowerCase()} (ex: points forts/faibles, consignes de pressing, comportement, faits marquants)...`}
            rows={2}
            className="w-full text-xs text-slate-900 bg-white border border-slate-300 rounded-lg p-2.5 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-transparent transition-all resize-y min-h-[56px]"
          />
        </div>

      </div>
    </div>
  );
};

// Sub-component for starter row cells
interface StarterRowCellsProps {
  slot?: PlayerSlot;
  index: number;
  team: 'team1' | 'team2';
  playerNames: string[];
  roster: Player[];
  substitutes: PlayerSlot[];
  activeDragItem: DragPlayerData | null;
  isRecentlyChanged?: boolean;
  onUpdate: (updates: Partial<PlayerSlot>) => void;
  onSwapWithTeam2: () => void;
  onDropPlayer: (playerData: DragPlayerData) => void;
  onDragStartSlot: (data: DragPlayerData) => void;
  onDragEndSlot: () => void;
  onQuickSubstitute: (subIndex: number) => void;
  onBenchStarter: () => void;
}

const StarterRowCells: React.FC<StarterRowCellsProps> = ({
  slot,
  index,
  team,
  playerNames,
  roster,
  substitutes,
  activeDragItem,
  isRecentlyChanged,
  onUpdate,
  onSwapWithTeam2,
  onDropPlayer,
  onDragStartSlot,
  onDragEndSlot,
  onQuickSubstitute,
  onBenchStarter,
}) => {
  const [isDragOver, setIsDragOver] = useState(false);
  const [showSubMenu, setShowSubMenu] = useState(false);

  if (!slot) {
    return <td colSpan={4} className="border-r border-slate-400 p-2 text-slate-400">-</td>;
  }

  // Find player object in roster
  const matchedPlayer = roster.find(
    p => (slot.playerId && p.id === slot.playerId) || (slot.playerName && p.name.trim().toLowerCase() === slot.playerName.trim().toLowerCase())
  );

  const handleNameChange = (newName: string) => {
    const found = roster.find(p => p.name.trim().toLowerCase() === newName.trim().toLowerCase());
    onUpdate({
      playerName: newName,
      playerId: found ? found.id : null,
    });
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = 'move';
    if (!isDragOver) setIsDragOver(true);
  };

  const handleDragLeave = () => {
    setIsDragOver(false);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(false);
    const rawData = e.dataTransfer.getData('application/json');
    if (rawData) {
      try {
        const parsed: DragPlayerData = JSON.parse(rawData);
        onDropPlayer(parsed);
      } catch (err) {
        console.error('Failed to parse dropped player data', err);
      }
    }
  };

  const handleDragStartFromSlot = (e: React.DragEvent) => {
    if (slot.playerName) {
      const dragData: DragPlayerData = {
        id: slot.playerId || matchedPlayer?.id || 'slot-' + slot.id,
        name: slot.playerName,
        position: slot.position,
        source: 'starter',
        sourceTeam: team,
        sourceIndex: index,
        sourceSlotId: slot.id,
        sourceRating: slot.rating,
        sourceNote: slot.note,
      };
      e.dataTransfer.setData('application/json', JSON.stringify(dragData));
      e.dataTransfer.effectAllowed = 'copyMove';
      onDragStartSlot(dragData);
    }
  };

  const availableSubs = substitutes.filter(s => s.playerName && s.playerName.trim());

  return (
    <>
      {/* Player Avatar + Name Input + Drag Handle + Quick Substitution */}
      <td 
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onDrop={handleDrop}
        className={`border-r border-slate-400 p-1.5 transition-all relative ${
          isDragOver 
            ? 'bg-emerald-100 ring-2 ring-emerald-500 scale-[1.01] shadow-md z-20' 
            : isRecentlyChanged
            ? 'bg-emerald-50 ring-2 ring-emerald-400 animate-pulse'
            : activeDragItem && activeDragItem.source === 'sub'
            ? 'bg-emerald-50/40 border-dashed border-emerald-400'
            : ''
        }`}
      >
        <div 
          draggable={!!slot.playerName}
          onDragStart={handleDragStartFromSlot}
          onDragEnd={onDragEndSlot}
          className="relative flex items-center gap-1.5 group cursor-grab active:cursor-grabbing"
        >
          <GripVertical 
            className="w-3.5 h-3.5 text-slate-400 opacity-60 group-hover:opacity-100 group-hover:text-emerald-600 transition-opacity shrink-0" 
            title="Glisser pour remplacer ou permuter de poste"
          />

          <PlayerAvatar
            player={matchedPlayer}
            name={slot.playerName}
            size="sm"
            className="shrink-0 shadow-2xs"
          />

          <div className="relative flex-1 min-w-0">
            <input
              type="text"
              list={`roster-suggestions-${team}`}
              value={slot.playerName}
              onChange={(e) => handleNameChange(e.target.value)}
              placeholder="Nom du joueur"
              className={`w-full text-xs font-bold text-slate-900 bg-transparent hover:bg-slate-100 focus:bg-white border rounded px-1.5 py-1 focus:outline-none transition-colors ${
                isRecentlyChanged 
                  ? 'border-emerald-400 text-emerald-950 font-black' 
                  : 'border-transparent hover:border-slate-300 focus:border-emerald-500'
              }`}
            />
            {isRecentlyChanged && (
              <span className="absolute right-1.5 top-1/2 -translate-y-1/2 text-[9px] font-black bg-emerald-600 text-white px-1 py-0.2 rounded shadow-2xs pointer-events-none">
                Changement 🔁
              </span>
            )}
          </div>

          <datalist id={`roster-suggestions-${team}`}>
            {playerNames.map((name) => (
              <option key={name} value={name} />
            ))}
          </datalist>

          {/* Quick Tactile Substitution Button (Click to Swap with Sub) */}
          <div className="relative">
            <button
              type="button"
              onClick={() => setShowSubMenu(!showSubMenu)}
              className={`p-1 rounded transition-all shrink-0 ${
                showSubMenu
                  ? 'bg-emerald-600 text-white'
                  : 'text-slate-400 hover:text-emerald-700 hover:bg-emerald-50 opacity-40 group-hover:opacity-100'
              }`}
              title="Changement de joueur en temps réel (remplacer)"
            >
              <ArrowUpDown className="w-3.5 h-3.5" />
            </button>

            {/* Substitution dropdown popover */}
            {showSubMenu && (
              <div 
                className="absolute left-0 top-full mt-1.5 z-50 bg-white border-2 border-emerald-500 rounded-xl shadow-2xl p-2.5 min-w-[230px] text-xs font-sans text-slate-800"
                onClick={(e) => e.stopPropagation()}
              >
                <div className="flex items-center justify-between pb-1.5 mb-1.5 border-b border-slate-200">
                  <div className="font-bold text-[11px] text-slate-900 flex items-center gap-1.5">
                    <ArrowUpDown className="w-3.5 h-3.5 text-emerald-600" />
                    <span>Remplacer {slot.playerName ? <strong>{slot.playerName}</strong> : 'ce poste'}</span>
                  </div>
                  <button 
                    type="button"
                    onClick={() => setShowSubMenu(false)} 
                    className="text-slate-400 hover:text-slate-700 p-0.5 rounded"
                  >
                    <X className="w-3.5 h-3.5" />
                  </button>
                </div>

                <div className="text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-1 px-1">
                  Remplaçants disponibles ({availableSubs.length}) :
                </div>

                <div className="space-y-1 max-h-48 overflow-y-auto pr-0.5">
                  {availableSubs.map((sub, sIdx) => {
                    const originalSubIndex = substitutes.indexOf(sub);
                    const subMatched = roster.find(p => (sub.playerId && p.id === sub.playerId) || (sub.playerName && p.name.trim().toLowerCase() === sub.playerName.trim().toLowerCase()));
                    return (
                      <button
                        key={sub.id || sIdx}
                        type="button"
                        onClick={() => {
                          onQuickSubstitute(originalSubIndex >= 0 ? originalSubIndex : sIdx);
                          setShowSubMenu(false);
                        }}
                        className="w-full flex items-center justify-between p-1.5 rounded-lg hover:bg-emerald-50 hover:border-emerald-300 border border-transparent text-left transition-colors group cursor-pointer"
                      >
                        <div className="flex items-center gap-1.5 min-w-0">
                          <PlayerAvatar player={subMatched} name={sub.playerName} size="xs" />
                          <div className="truncate">
                            <div className="font-bold text-slate-900 group-hover:text-emerald-800 truncate">{sub.playerName}</div>
                            <div className="text-[10px] text-slate-500">{sub.position}</div>
                          </div>
                        </div>
                        <span className="text-[10px] font-bold text-emerald-800 bg-emerald-100 px-1.5 py-0.5 rounded shrink-0">
                          ⬆️ Entrer
                        </span>
                      </button>
                    );
                  })}

                  {availableSubs.length === 0 && (
                    <div className="text-[11px] text-slate-400 italic p-2 text-center">
                      Aucun joueur sur le banc.
                    </div>
                  )}
                </div>

                {slot.playerName && (
                  <div className="pt-2 mt-2 border-t border-slate-200">
                    <button
                      type="button"
                      onClick={() => {
                        onBenchStarter();
                        setShowSubMenu(false);
                      }}
                      className="w-full text-left text-[11px] font-semibold text-slate-700 hover:text-amber-800 hover:bg-amber-50 p-1.5 rounded-lg flex items-center gap-1.5 transition-colors cursor-pointer"
                    >
                      <ArrowDownToLine className="w-3.5 h-3.5 text-amber-600" />
                      <span>Mettre <strong>{slot.playerName}</strong> sur le banc</span>
                    </button>
                  </div>
                )}
              </div>
            )}
          </div>

          {/* Quick swap button with other team */}
          <button
            onClick={onSwapWithTeam2}
            className="opacity-0 group-hover:opacity-100 p-1 text-slate-400 hover:text-slate-900 hover:bg-slate-200 rounded transition-all shrink-0"
            title="Échanger avec le joueur opposé"
          >
            <ArrowLeftRight className="w-3 h-3" />
          </button>
        </div>

        {/* Floating tooltip preview during drag over */}
        {isDragOver && activeDragItem && (
          <div className="absolute top-0 left-0 right-0 -translate-y-full bg-slate-900 text-white text-[10px] font-bold py-1 px-2 rounded-md shadow-lg flex items-center justify-center gap-1 z-30 pointer-events-none">
            {activeDragItem.source === 'sub' ? (
              <span>🔁 Remplacer par <strong>{activeDragItem.name}</strong> ⬆️</span>
            ) : activeDragItem.source === 'starter' ? (
              <span>⇄ Permuter de poste avec <strong>{activeDragItem.name}</strong></span>
            ) : (
              <span>Assigner <strong>{activeDragItem.name}</strong></span>
            )}
          </div>
        )}
      </td>

      {/* Position */}
      <td className="border-r border-slate-400 p-1.5 w-28">
        <select
          value={slot.position}
          onChange={(e) => onUpdate({ position: e.target.value as Position })}
          className="w-full text-xs text-slate-800 bg-transparent hover:bg-slate-100 focus:bg-white border border-transparent hover:border-slate-300 focus:border-emerald-500 rounded px-1 py-1 focus:outline-none"
        >
          {POSITIONS.map((pos) => (
            <option key={pos} value={pos}>
              {pos}
            </option>
          ))}
        </select>
      </td>

      {/* Note / Evaluation 1-5 */}
      <td className="border-r border-slate-400 p-1.5 w-36 text-center">
        <RatingInput
          rating={slot.rating}
          note={slot.note}
          onChangeRating={(newRating) => onUpdate({ rating: newRating })}
          onChangeNote={(newNote) => onUpdate({ note: newNote })}
        />
      </td>

      {/* Shootout */}
      <td className="border-r-2 border-slate-900 p-1.5 w-24 text-center">
        <input
          type="text"
          value={slot.shootout || ''}
          onChange={(e) => onUpdate({ shootout: e.target.value })}
          placeholder=""
          className="w-full text-center text-xs text-slate-800 bg-transparent hover:bg-slate-100 focus:bg-white border border-transparent hover:border-slate-300 focus:border-emerald-500 rounded px-1 py-1 focus:outline-none"
        />
      </td>
    </>
  );
};

// Sub-component for substitute row cells
interface SubRowCellsProps {
  slot: PlayerSlot;
  index: number;
  team: 'team1' | 'team2';
  playerNames: string[];
  roster: Player[];
  starters: PlayerSlot[];
  activeDragItem: DragPlayerData | null;
  isRecentlyChanged?: boolean;
  onUpdate: (updates: Partial<PlayerSlot>) => void;
  onRemove: () => void;
  onDropPlayer: (playerData: DragPlayerData) => void;
  onDragStartSlot: (data: DragPlayerData) => void;
  onDragEndSlot: () => void;
  onQuickEnterPitch: (starterIndex: number) => void;
}

const SubRowCells: React.FC<SubRowCellsProps> = ({
  slot,
  index,
  team,
  playerNames,
  roster,
  starters,
  activeDragItem,
  isRecentlyChanged,
  onUpdate,
  onRemove,
  onDropPlayer,
  onDragStartSlot,
  onDragEndSlot,
  onQuickEnterPitch,
}) => {
  const [isDragOver, setIsDragOver] = useState(false);
  const [showStarterMenu, setShowStarterMenu] = useState(false);

  // Find player object in roster
  const matchedPlayer = roster.find(
    p => (slot.playerId && p.id === slot.playerId) || (slot.playerName && p.name.trim().toLowerCase() === slot.playerName.trim().toLowerCase())
  );

  const handleNameChange = (newName: string) => {
    const found = roster.find(p => p.name.trim().toLowerCase() === newName.trim().toLowerCase());
    onUpdate({
      playerName: newName,
      playerId: found ? found.id : null,
    });
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = 'move';
    if (!isDragOver) setIsDragOver(true);
  };

  const handleDragLeave = () => {
    setIsDragOver(false);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(false);
    const rawData = e.dataTransfer.getData('application/json');
    if (rawData) {
      try {
        const parsed: DragPlayerData = JSON.parse(rawData);
        onDropPlayer(parsed);
      } catch (err) {
        console.error('Failed to parse dropped player data', err);
      }
    }
  };

  const handleDragStartFromSlot = (e: React.DragEvent) => {
    if (slot.playerName) {
      const dragData: DragPlayerData = {
        id: slot.playerId || matchedPlayer?.id || 'slot-' + slot.id,
        name: slot.playerName,
        position: slot.position,
        source: 'sub',
        sourceTeam: team,
        sourceIndex: index,
        sourceSlotId: slot.id,
        sourceRating: slot.rating,
        sourceNote: slot.note,
      };
      e.dataTransfer.setData('application/json', JSON.stringify(dragData));
      e.dataTransfer.effectAllowed = 'copyMove';
      onDragStartSlot(dragData);
    }
  };

  return (
    <>
      {/* Player Avatar + Name + Quick Enter Pitch Button */}
      <td 
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onDrop={handleDrop}
        className={`border-r border-slate-400 p-1.5 transition-all relative ${
          isDragOver 
            ? 'bg-emerald-100 ring-2 ring-emerald-500 scale-[1.01] shadow-md z-20' 
            : isRecentlyChanged
            ? 'bg-emerald-50 ring-2 ring-emerald-400 animate-pulse'
            : activeDragItem && activeDragItem.source === 'starter'
            ? 'bg-emerald-50/40 border-dashed border-emerald-400'
            : ''
        }`}
      >
        <div 
          draggable={!!slot.playerName}
          onDragStart={handleDragStartFromSlot}
          onDragEnd={onDragEndSlot}
          className="flex items-center gap-1.5 group cursor-grab active:cursor-grabbing relative"
        >
          <GripVertical 
            className="w-3.5 h-3.5 text-slate-400 opacity-60 group-hover:opacity-100 group-hover:text-emerald-600 transition-opacity shrink-0" 
            title="Glisser sur un titulaire pour le remplacer en direct"
          />

          <PlayerAvatar
            player={matchedPlayer}
            name={slot.playerName}
            size="sm"
            className="shrink-0 shadow-2xs"
          />

          <div className="relative flex-1 min-w-0">
            <input
              type="text"
              list={`roster-suggestions-${team}`}
              value={slot.playerName}
              onChange={(e) => handleNameChange(e.target.value)}
              placeholder="Nom remplaçant"
              className={`w-full text-xs font-semibold text-slate-800 bg-transparent hover:bg-slate-100 focus:bg-white border rounded px-1.5 py-1 focus:outline-none transition-colors ${
                isRecentlyChanged 
                  ? 'border-emerald-400 text-emerald-950 font-black' 
                  : 'border-transparent hover:border-slate-300 focus:border-emerald-500'
              }`}
            />
            {isRecentlyChanged && (
              <span className="absolute right-1.5 top-1/2 -translate-y-1/2 text-[9px] font-black bg-amber-500 text-white px-1 py-0.2 rounded shadow-2xs pointer-events-none">
                Sur le banc ⬇️
              </span>
            )}
          </div>

          {/* Quick Enter Pitch Button (Changement direct) */}
          {slot.playerName && (
            <div className="relative">
              <button
                type="button"
                onClick={() => setShowStarterMenu(!showStarterMenu)}
                className={`text-[10px] font-bold px-1.5 py-0.5 rounded flex items-center gap-0.5 transition-all shrink-0 ${
                  showStarterMenu
                    ? 'bg-emerald-600 text-white'
                    : 'bg-emerald-100 text-emerald-800 hover:bg-emerald-200'
                }`}
                title="Faire entrer ce remplaçant en jeu"
              >
                <ArrowUpRight className="w-3 h-3" />
                <span>Entrer ⬆️</span>
              </button>

              {/* Popup to pick which starter to replace */}
              {showStarterMenu && (
                <div 
                  className="absolute left-0 top-full mt-1.5 z-50 bg-white border-2 border-emerald-500 rounded-xl shadow-2xl p-2.5 min-w-[240px] text-xs font-sans text-slate-800"
                  onClick={(e) => e.stopPropagation()}
                >
                  <div className="flex items-center justify-between pb-1.5 mb-1.5 border-b border-slate-200">
                    <div className="font-bold text-[11px] text-slate-900 flex items-center gap-1.5">
                      <ArrowUpRight className="w-3.5 h-3.5 text-emerald-600" />
                      <span>Faire entrer <strong>{slot.playerName}</strong></span>
                    </div>
                    <button 
                      type="button"
                      onClick={() => setShowStarterMenu(false)} 
                      className="text-slate-400 hover:text-slate-700 p-0.5 rounded"
                    >
                      <X className="w-3.5 h-3.5" />
                    </button>
                  </div>

                  <div className="text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-1 px-1">
                    Remplacer quel titulaire ?
                  </div>

                  <div className="space-y-1 max-h-52 overflow-y-auto pr-0.5">
                    {starters.map((starter, stIdx) => {
                      const starterMatched = roster.find(p => (starter.playerId && p.id === starter.playerId) || (starter.playerName && p.name.trim().toLowerCase() === starter.playerName.trim().toLowerCase()));
                      return (
                        <button
                          key={starter.id || stIdx}
                          type="button"
                          onClick={() => {
                            onQuickEnterPitch(stIdx);
                            setShowStarterMenu(false);
                          }}
                          className="w-full flex items-center justify-between p-1.5 rounded-lg hover:bg-emerald-50 hover:border-emerald-300 border border-transparent text-left transition-colors group cursor-pointer"
                        >
                          <div className="flex items-center gap-1.5 min-w-0">
                            <span className="text-[10px] font-mono font-bold text-slate-400 w-4 shrink-0">{stIdx + 1}.</span>
                            <PlayerAvatar player={starterMatched} name={starter.playerName} size="xs" />
                            <div className="truncate">
                              <div className="font-bold text-slate-900 group-hover:text-emerald-800 truncate">
                                {starter.playerName || <span className="text-slate-400 italic">Poste vide</span>}
                              </div>
                              <div className="text-[10px] text-slate-500">{starter.position}</div>
                            </div>
                          </div>
                          <span className="text-[10px] font-bold text-amber-800 bg-amber-100 px-1.5 py-0.5 rounded shrink-0">
                            Sortir ⬇️
                          </span>
                        </button>
                      );
                    })}
                  </div>
                </div>
              )}
            </div>
          )}

          <button
            onClick={onRemove}
            className="opacity-0 group-hover:opacity-100 p-1 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded transition-all shrink-0"
            title="Supprimer ce remplaçant"
          >
            <Trash2 className="w-3 h-3" />
          </button>
        </div>

        {/* Floating tooltip preview during drag over */}
        {isDragOver && activeDragItem && (
          <div className="absolute top-0 left-0 right-0 -translate-y-full bg-slate-900 text-white text-[10px] font-bold py-1 px-2 rounded-md shadow-lg flex items-center justify-center gap-1 z-30 pointer-events-none">
            {activeDragItem.source === 'starter' ? (
              <span>🔁 Permuter : <strong>{activeDragItem.name}</strong> ⬇️ sur le banc</span>
            ) : (
              <span>⇄ Permuter avec <strong>{activeDragItem.name}</strong></span>
            )}
          </div>
        )}
      </td>

      {/* Position (usually blank or preferred) */}
      <td className="border-r border-slate-400 p-1.5 w-28">
        <select
          value={slot.position}
          onChange={(e) => onUpdate({ position: e.target.value as Position })}
          className="w-full text-xs text-slate-700 bg-transparent hover:bg-slate-100 focus:bg-white border border-transparent hover:border-slate-300 focus:border-emerald-500 rounded px-1 py-1 focus:outline-none"
        >
          {POSITIONS.map((pos) => (
            <option key={pos} value={pos}>
              {pos}
            </option>
          ))}
        </select>
      </td>

      {/* Note / Evaluation 1-5 */}
      <td className="border-r border-slate-400 p-1.5 w-36 text-center">
        <RatingInput
          rating={slot.rating}
          note={slot.note}
          onChangeRating={(newRating) => onUpdate({ rating: newRating })}
          onChangeNote={(newNote) => onUpdate({ note: newNote })}
        />
      </td>

      {/* Shootout */}
      <td className="border-r-2 border-slate-900 p-1.5 w-24 text-center">
        <input
          type="text"
          value={slot.shootout || ''}
          onChange={(e) => onUpdate({ shootout: e.target.value })}
          placeholder=""
          className="w-full text-center text-xs text-slate-700 bg-transparent hover:bg-slate-100 focus:bg-white border border-transparent hover:border-slate-300 focus:border-emerald-500 rounded px-1 py-1 focus:outline-none"
        />
      </td>
    </>
  );
};
