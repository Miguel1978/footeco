import React, { useState, useMemo } from 'react';
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
  Info
} from 'lucide-react';
import { RatingInput } from './RatingInput';
import { PlayerAvatar } from './PlayerAvatar';
import { CoachAutocompleteInput } from './CoachAutocompleteInput';

interface MatchSheetTableProps {
  period: PeriodMatch;
  roster: Player[];
  allPeriods: PeriodMatch[];
  onUpdatePeriod: (updatedPeriod: PeriodMatch) => void;
  onCopyFromPeriod: (sourcePeriodId: number) => void;
  onOpenDurationModal: () => void;
}

const POSITIONS: Position[] = ['Gardien', 'Défenseur', 'Milieu', 'Couloir', 'Attaquant'];

export const MatchSheetTable: React.FC<MatchSheetTableProps> = ({
  period,
  roster,
  allPeriods,
  onUpdatePeriod,
  onCopyFromPeriod,
  onOpenDurationModal,
}) => {
  const [showRosterPanel, setShowRosterPanel] = useState<boolean>(true);
  const [rosterSearch, setRosterSearch] = useState<string>('');
  const [draggedPlayer, setDraggedPlayer] = useState<Player | null>(null);

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

  // Drag & Drop Handler for assigning a player to a specific slot
  const handleDropPlayerOnSlot = (
    team: 'team1' | 'team2', 
    type: 'starter' | 'sub', 
    index: number, 
    playerData: { id: string; name: string; position?: Position }
  ) => {
    const updates: Partial<PlayerSlot> = {
      playerId: playerData.id,
      playerName: playerData.name,
    };
    if (type === 'starter') {
      handleUpdateStarter(team, index, updates);
    } else {
      handleUpdateSub(team, index, updates);
    }
  };

  // Handle Drag Start from Roster or Slots
  const handleDragStartFromRoster = (e: React.DragEvent, player: Player) => {
    setDraggedPlayer(player);
    e.dataTransfer.setData('application/json', JSON.stringify({
      id: player.id,
      name: player.name,
      position: player.defaultPosition,
      source: 'roster'
    }));
    e.dataTransfer.effectAllowed = 'copyMove';
  };

  const handleDragEnd = () => {
    setDraggedPlayer(null);
  };

  // Quick auto-points & result calculation helper
  const handleScoreTeamChange = (team: 'team1' | 'team2', teamScore: string, oppScore: string) => {
    const s1 = parseInt(teamScore, 10);
    const s2 = parseInt(oppScore, 10);
    let result: 'Victoire' | 'Nul' | 'Défaite' | '' = '';
    let points = '';

    if (!isNaN(s1) && !isNaN(s2)) {
      if (s1 > s2) {
        result = 'Victoire';
        points = '3';
      } else if (s1 === s2) {
        result = 'Nul';
        points = '1';
      } else {
        result = 'Défaite';
        points = '0';
      }
    }

    if (team === 'team1') {
      handleUpdateTeam1({ scoreMatch: teamScore, scoreOpponent: oppScore, result, points });
    } else {
      handleUpdateTeam2({ scoreMatch: teamScore, scoreOpponent: oppScore, result, points });
    }
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
          <div className="flex items-center gap-2">
            {allPeriods.length > 1 && (
              <div className="flex items-center gap-1">
                <span className="text-slate-500 font-medium">Copier la compo depuis :</span>
                {allPeriods
                  .filter(p => p.id !== period.id)
                  .map(p => (
                    <button
                      key={p.id}
                      onClick={() => onCopyFromPeriod(p.id)}
                      className="px-2 py-0.5 bg-white hover:bg-slate-200 border border-slate-300 rounded text-[11px] font-semibold text-slate-700 transition-colors"
                      title={`Copier la composition du ${p.title}`}
                    >
                      {p.title}
                    </button>
                  ))}
              </div>
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
                <th className="w-48 bg-slate-200 border-2 border-slate-900 p-2 text-center align-middle font-bold text-slate-900 italic">
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
                <td rowSpan={8} className="w-48 border-r-2 border-b-2 border-slate-900 p-3 align-top bg-slate-50/50 space-y-4">
                  
                  {/* Score Equipe 1 (Yellow banner) */}
                  <div className="border border-slate-300 rounded-xl overflow-hidden bg-white shadow-xs">
                    <div className="bg-[#FFFF00] px-2 py-1 text-xs font-bold text-slate-950 text-center border-b border-slate-300">
                      Score {period.team1.teamName || 'équipe 1'}
                    </div>
                    <div className="p-2 space-y-2 text-xs">
                      <div className="flex items-center justify-between gap-1">
                        <span className="font-semibold text-slate-700">Score :</span>
                        <div className="flex items-center gap-1 font-bold">
                          <input
                            type="text"
                            value={period.team1.scoreMatch}
                            onChange={(e) => handleScoreTeamChange('team1', e.target.value, period.team1.scoreOpponent)}
                            placeholder="0"
                            className="w-8 text-center font-bold bg-slate-100 border border-slate-300 rounded py-0.5"
                          />
                          <span>à</span>
                          <input
                            type="text"
                            value={period.team1.scoreOpponent}
                            onChange={(e) => handleScoreTeamChange('team1', period.team1.scoreMatch, e.target.value)}
                            placeholder="0"
                            className="w-8 text-center font-bold bg-slate-100 border border-slate-300 rounded py-0.5"
                          />
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
                          placeholder="3"
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
                  </div>

                  {/* Score Equipe 2 (Red banner) */}
                  <div className="border border-slate-300 rounded-xl overflow-hidden bg-white shadow-xs">
                    <div className="bg-[#FF0000] px-2 py-1 text-xs font-bold text-white text-center border-b border-slate-300">
                      Score {period.team2.teamName || 'équipe 2'}
                    </div>
                    <div className="p-2 space-y-2 text-xs">
                      <div className="flex items-center justify-between gap-1">
                        <span className="font-semibold text-slate-700">Score :</span>
                        <div className="flex items-center gap-1 font-bold">
                          <input
                            type="text"
                            value={period.team2.scoreMatch}
                            onChange={(e) => handleScoreTeamChange('team2', e.target.value, period.team2.scoreOpponent)}
                            placeholder="0"
                            className="w-8 text-center font-bold bg-slate-100 border border-slate-300 rounded py-0.5"
                          />
                          <span>à</span>
                          <input
                            type="text"
                            value={period.team2.scoreOpponent}
                            onChange={(e) => handleScoreTeamChange('team2', period.team2.scoreMatch, e.target.value)}
                            placeholder="0"
                            className="w-8 text-center font-bold bg-slate-100 border border-slate-300 rounded py-0.5"
                          />
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
                          placeholder="3"
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
                  </div>

                </td>

                {/* Equipe 1 Slot 0 (Gardien) */}
                <StarterRowCells
                  slot={period.team1.titulaires[0]}
                  index={0}
                  team="team1"
                  playerNames={playerNames}
                  roster={roster}
                  onUpdate={(updates) => handleUpdateStarter('team1', 0, updates)}
                  onSwapWithTeam2={() => handleSwapTeamsStarters(0)}
                  onDropPlayer={(playerData) => handleDropPlayerOnSlot('team1', 'starter', 0, playerData)}
                />

                {/* Equipe 2 Slot 0 (Gardien) */}
                <StarterRowCells
                  slot={period.team2.titulaires[0]}
                  index={0}
                  team="team2"
                  playerNames={playerNames}
                  roster={roster}
                  onUpdate={(updates) => handleUpdateStarter('team2', 0, updates)}
                  onSwapWithTeam2={() => handleSwapTeamsStarters(0)}
                  onDropPlayer={(playerData) => handleDropPlayerOnSlot('team2', 'starter', 0, playerData)}
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
                    onUpdate={(updates) => handleUpdateStarter('team1', slotIdx, updates)}
                    onSwapWithTeam2={() => handleSwapTeamsStarters(slotIdx)}
                    onDropPlayer={(playerData) => handleDropPlayerOnSlot('team1', 'starter', slotIdx, playerData)}
                  />

                  {/* Equipe 2 Starter */}
                  <StarterRowCells
                    slot={period.team2.titulaires[slotIdx]}
                    index={slotIdx}
                    team="team2"
                    playerNames={playerNames}
                    roster={roster}
                    onUpdate={(updates) => handleUpdateStarter('team2', slotIdx, updates)}
                    onSwapWithTeam2={() => handleSwapTeamsStarters(slotIdx)}
                    onDropPlayer={(playerData) => handleDropPlayerOnSlot('team2', 'starter', slotIdx, playerData)}
                  />
                </tr>
              ))}

              {/* Remplaçants Header Row */}
              <tr className="bg-slate-100 text-xs font-bold text-slate-800 border-t-2 border-b border-slate-900">
                {/* Equipe 1 Remplaçants Title */}
                <td colSpan={4} className="p-1 pl-3 underline decoration-slate-400 border-r-2 border-slate-900">
                  <div className="flex items-center justify-between pr-2">
                    <span className="flex items-center gap-1.5">
                      <span>Remplaçants :</span>
                      <span className="text-[10px] text-slate-500 font-normal">(Déposer ici pour ajouter)</span>
                    </span>
                    <button
                      onClick={() => handleAddSub('team1')}
                      className="text-[11px] font-semibold text-emerald-800 bg-emerald-100 hover:bg-emerald-200 px-2 py-0.5 rounded flex items-center gap-1 transition-colors"
                    >
                      <Plus className="w-3 h-3" /> Ajouter remplaçant
                    </button>
                  </div>
                </td>

                {/* Equipe 2 Remplaçants Title */}
                <td colSpan={4} className="p-1 pl-3 underline decoration-slate-400 border-r-2 border-slate-900">
                  <div className="flex items-center justify-between pr-2">
                    <span className="flex items-center gap-1.5">
                      <span>Remplaçants :</span>
                      <span className="text-[10px] text-slate-500 font-normal">(Déposer ici pour ajouter)</span>
                    </span>
                    <button
                      onClick={() => handleAddSub('team2')}
                      className="text-[11px] font-semibold text-emerald-800 bg-emerald-100 hover:bg-emerald-200 px-2 py-0.5 rounded flex items-center gap-1 transition-colors"
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
                        onUpdate={(updates) => handleUpdateSub('team1', subIdx, updates)}
                        onRemove={() => handleRemoveSub('team1', subIdx)}
                        onDropPlayer={(playerData) => handleDropPlayerOnSlot('team1', 'sub', subIdx, playerData)}
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
                              const parsed = JSON.parse(raw);
                              handleAddSub('team1', parsed);
                            } catch (err) {}
                          }
                        }}
                        className="border-r border-slate-400 p-2 text-slate-400 text-xs italic text-center border-dashed hover:bg-emerald-50 hover:border-emerald-400 transition-colors"
                      >
                        + Glisser un remplaçant ici
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
                        onUpdate={(updates) => handleUpdateSub('team2', subIdx, updates)}
                        onRemove={() => handleRemoveSub('team2', subIdx)}
                        onDropPlayer={(playerData) => handleDropPlayerOnSlot('team2', 'sub', subIdx, playerData)}
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
                              const parsed = JSON.parse(raw);
                              handleAddSub('team2', parsed);
                            } catch (err) {}
                          }
                        }}
                        className="border-r-2 border-slate-900 p-2 text-slate-400 text-xs italic text-center border-dashed hover:bg-emerald-50 hover:border-emerald-400 transition-colors"
                      >
                        + Glisser un remplaçant ici
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
  onUpdate: (updates: Partial<PlayerSlot>) => void;
  onSwapWithTeam2: () => void;
  onDropPlayer: (playerData: { id: string; name: string; position?: Position }) => void;
}

const StarterRowCells: React.FC<StarterRowCellsProps> = ({
  slot,
  index,
  team,
  playerNames,
  roster,
  onUpdate,
  onSwapWithTeam2,
  onDropPlayer,
}) => {
  const [isDragOver, setIsDragOver] = useState(false);

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
    e.dataTransfer.dropEffect = 'copy';
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
        const parsed = JSON.parse(rawData);
        onDropPlayer(parsed);
      } catch (err) {
        console.error('Failed to parse dropped player data', err);
      }
    }
  };

  const handleDragStartFromSlot = (e: React.DragEvent) => {
    if (slot.playerName) {
      e.dataTransfer.setData('application/json', JSON.stringify({
        id: slot.playerId || matchedPlayer?.id || 'slot-' + slot.id,
        name: slot.playerName,
        position: slot.position,
        source: 'slot'
      }));
      e.dataTransfer.effectAllowed = 'copyMove';
    }
  };

  return (
    <>
      {/* Player Avatar + Name Input + Quick Suggestion / Roster Picker */}
      <td 
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onDrop={handleDrop}
        className={`border-r border-slate-400 p-1.5 transition-colors ${
          isDragOver ? 'bg-emerald-100 ring-2 ring-emerald-500' : ''
        }`}
      >
        <div 
          draggable={!!slot.playerName}
          onDragStart={handleDragStartFromSlot}
          className="relative flex items-center gap-1.5 group cursor-grab active:cursor-grabbing"
        >
          <GripVertical className="w-3 h-3 text-slate-300 opacity-0 group-hover:opacity-100 transition-opacity shrink-0" />

          <PlayerAvatar
            player={matchedPlayer}
            name={slot.playerName}
            size="sm"
            className="shrink-0 shadow-2xs"
          />
          <input
            type="text"
            list={`roster-suggestions-${team}`}
            value={slot.playerName}
            onChange={(e) => handleNameChange(e.target.value)}
            placeholder="Nom du joueur"
            className="w-full text-xs font-bold text-slate-900 bg-transparent hover:bg-slate-100 focus:bg-white border border-transparent hover:border-slate-300 focus:border-emerald-500 rounded px-1.5 py-1 focus:outline-none"
          />
          <datalist id={`roster-suggestions-${team}`}>
            {playerNames.map((name) => (
              <option key={name} value={name} />
            ))}
          </datalist>

          {/* Quick swap button with other team */}
          <button
            onClick={onSwapWithTeam2}
            className="opacity-0 group-hover:opacity-100 p-1 text-slate-400 hover:text-slate-900 hover:bg-slate-200 rounded transition-all shrink-0"
            title="Échanger avec le joueur opposé"
          >
            <ArrowLeftRight className="w-3 h-3" />
          </button>
        </div>
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
  onUpdate: (updates: Partial<PlayerSlot>) => void;
  onRemove: () => void;
  onDropPlayer: (playerData: { id: string; name: string; position?: Position }) => void;
}

const SubRowCells: React.FC<SubRowCellsProps> = ({
  slot,
  index,
  team,
  playerNames,
  roster,
  onUpdate,
  onRemove,
  onDropPlayer,
}) => {
  const [isDragOver, setIsDragOver] = useState(false);

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
    e.dataTransfer.dropEffect = 'copy';
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
        const parsed = JSON.parse(rawData);
        onDropPlayer(parsed);
      } catch (err) {
        console.error('Failed to parse dropped player data', err);
      }
    }
  };

  const handleDragStartFromSlot = (e: React.DragEvent) => {
    if (slot.playerName) {
      e.dataTransfer.setData('application/json', JSON.stringify({
        id: slot.playerId || matchedPlayer?.id || 'slot-' + slot.id,
        name: slot.playerName,
        position: slot.position,
        source: 'slot'
      }));
      e.dataTransfer.effectAllowed = 'copyMove';
    }
  };

  return (
    <>
      {/* Player Avatar + Name */}
      <td 
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onDrop={handleDrop}
        className={`border-r border-slate-400 p-1.5 transition-colors ${
          isDragOver ? 'bg-emerald-100 ring-2 ring-emerald-500' : ''
        }`}
      >
        <div 
          draggable={!!slot.playerName}
          onDragStart={handleDragStartFromSlot}
          className="flex items-center gap-1.5 group cursor-grab active:cursor-grabbing"
        >
          <GripVertical className="w-3 h-3 text-slate-300 opacity-0 group-hover:opacity-100 transition-opacity shrink-0" />

          <PlayerAvatar
            player={matchedPlayer}
            name={slot.playerName}
            size="sm"
            className="shrink-0 shadow-2xs"
          />
          <input
            type="text"
            list={`roster-suggestions-${team}`}
            value={slot.playerName}
            onChange={(e) => handleNameChange(e.target.value)}
            placeholder="Nom remplaçant"
            className="w-full text-xs font-semibold text-slate-800 bg-transparent hover:bg-slate-100 focus:bg-white border border-transparent hover:border-slate-300 focus:border-emerald-500 rounded px-1.5 py-1 focus:outline-none"
          />
          <button
            onClick={onRemove}
            className="opacity-0 group-hover:opacity-100 p-1 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded transition-all shrink-0"
            title="Supprimer ce remplaçant"
          >
            <Trash2 className="w-3 h-3" />
          </button>
        </div>
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
