import React, { useState } from 'react';
import { MatchData, Player, Position } from '../types';
import { 
  Users, 
  Plus, 
  Trash2, 
  X, 
  Check, 
  FileText, 
  Sparkles, 
  Palette,
  Shuffle
} from 'lucide-react';
import { PlayerAvatar } from './PlayerAvatar';
import { PlayerAvatarPickerModal } from './PlayerAvatarPickerModal';
import { generateRandomAvatar, AVATAR_COLORS } from '../utils/avatarUtils';

interface RosterModalProps {
  isOpen: boolean;
  onClose: () => void;
  matchData: MatchData;
  onUpdateMatch: (updater: (prev: MatchData) => MatchData) => void;
}

const POSITIONS: Position[] = ['Gardien', 'Défenseur', 'Milieu', 'Couloir', 'Attaquant'];

export const RosterModal: React.FC<RosterModalProps> = ({
  isOpen,
  onClose,
  matchData,
  onUpdateMatch,
}) => {
  const [newPlayerName, setNewPlayerName] = useState('');
  const [newPlayerPos, setNewPlayerPos] = useState<Position>('Milieu');
  const [newPlayerNum, setNewPlayerNum] = useState<string>('');
  const [showBatchAdd, setShowBatchAdd] = useState(false);
  const [batchText, setBatchText] = useState('');

  // Selected player for avatar customization modal
  const [editingAvatarPlayer, setEditingAvatarPlayer] = useState<Player | null>(null);

  if (!isOpen) return null;

  const handleAddPlayer = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newPlayerName.trim()) return;

    const randomStyle = generateRandomAvatar(matchData.roster.length);

    const newPlayer: Player = {
      id: 'p-' + Date.now() + '-' + Math.random().toString(36).substr(2, 4),
      name: newPlayerName.trim(),
      defaultPosition: newPlayerPos,
      number: newPlayerNum ? parseInt(newPlayerNum, 10) : undefined,
      isPresent: true,
      avatarType: randomStyle.avatarType,
      avatarColor: randomStyle.avatarColor,
      avatarIcon: randomStyle.avatarIcon,
      avatarUrl: randomStyle.avatarUrl,
    };

    onUpdateMatch(prev => ({
      ...prev,
      roster: [...prev.roster, newPlayer],
    }));

    setNewPlayerName('');
    setNewPlayerNum('');
  };

  const handleBatchAdd = () => {
    if (!batchText.trim()) return;
    const lines = batchText.split(/[\n,;]+/).map(s => s.trim()).filter(Boolean);
    const newPlayers: Player[] = lines.map((name, idx) => {
      const rand = generateRandomAvatar(matchData.roster.length + idx);
      return {
        id: 'p-' + Date.now() + '-' + Math.random().toString(36).substr(2, 4),
        name,
        defaultPosition: 'Milieu',
        isPresent: true,
        avatarType: rand.avatarType,
        avatarColor: rand.avatarColor,
        avatarIcon: rand.avatarIcon,
        avatarUrl: rand.avatarUrl,
      };
    });

    onUpdateMatch(prev => ({
      ...prev,
      roster: [...prev.roster, ...newPlayers],
    }));

    setBatchText('');
    setShowBatchAdd(false);
  };

  const handleUpdatePlayer = (playerId: string, updates: Partial<Player>) => {
    onUpdateMatch(prev => ({
      ...prev,
      roster: prev.roster.map(p => (p.id === playerId ? { ...p, ...updates } : p)),
    }));
  };

  const handleDeletePlayer = (playerId: string) => {
    if (confirm('Voulez-vous retirer ce joueur de la liste ?')) {
      onUpdateMatch(prev => ({
        ...prev,
        roster: prev.roster.filter(p => p.id !== playerId),
      }));
    }
  };

  const handleTogglePresent = (playerId: string) => {
    onUpdateMatch(prev => ({
      ...prev,
      roster: prev.roster.map(p => (p.id === playerId ? { ...p, isPresent: !p.isPresent } : p)),
    }));
  };

  // Generate distinct colored avatars / icons for the whole team in 1 click
  const handleGenerateAllAvatars = () => {
    onUpdateMatch(prev => ({
      ...prev,
      roster: prev.roster.map((player, idx) => {
        const rand = generateRandomAvatar(idx);
        return {
          ...player,
          avatarType: rand.avatarType,
          avatarColor: rand.avatarColor,
          avatarIcon: rand.avatarIcon,
          avatarUrl: rand.avatarUrl,
        };
      }),
    }));
  };

  const presentCount = matchData.roster.filter(p => p.isPresent).length;

  return (
    <>
      <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs z-50 flex items-center justify-center p-4">
        <div className="bg-white rounded-2xl max-w-3xl w-full max-h-[90vh] flex flex-col shadow-2xl border border-slate-200 overflow-hidden">
          
          {/* Modal Header */}
          <div className="px-6 py-4 bg-slate-50 border-b border-slate-200 flex items-center justify-between">
            <div className="flex items-center gap-2.5">
              <div className="w-9 h-9 rounded-xl bg-emerald-600 text-white flex items-center justify-center font-bold shadow-sm">
                <Users className="w-5 h-5" />
              </div>
              <div>
                <h2 className="text-lg font-bold text-slate-900">Effectif & Avatars des Joueurs</h2>
                <p className="text-xs text-slate-500">
                  {matchData.roster.length} joueurs inscrits • <strong className="text-emerald-700">{presentCount} présents</strong>
                </p>
              </div>
            </div>
            
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={handleGenerateAllAvatars}
                className="hidden sm:flex items-center gap-1.5 px-3 py-1.5 bg-emerald-50 hover:bg-emerald-100 text-emerald-800 text-xs font-bold rounded-lg border border-emerald-200 transition-colors shadow-2xs"
                title="Attribuer automatiquement des icônes et couleurs distinctes à tous les joueurs"
              >
                <Sparkles className="w-3.5 h-3.5 text-emerald-600" />
                <span>Colorer tout l'effectif</span>
              </button>

              <button
                onClick={onClose}
                className="p-1.5 text-slate-400 hover:text-slate-700 hover:bg-slate-200 rounded-lg transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
          </div>

          {/* Content Body */}
          <div className="p-6 overflow-y-auto space-y-6 flex-1">
            
            {/* Add Player Form */}
            <form onSubmit={handleAddPlayer} className="bg-slate-50 p-4 rounded-xl border border-slate-200">
              <div className="flex items-center justify-between mb-2">
                <label className="text-xs font-bold text-slate-600 uppercase tracking-wider">
                  Ajouter un nouveau joueur
                </label>
                <button
                  type="button"
                  onClick={() => setShowBatchAdd(!showBatchAdd)}
                  className="text-xs text-emerald-700 hover:text-emerald-800 font-semibold flex items-center gap-1"
                >
                  <FileText className="w-3.5 h-3.5" />
                  {showBatchAdd ? 'Mode simple' : 'Import en masse (liste)'}
                </button>
              </div>

              {showBatchAdd ? (
                <div className="space-y-3">
                  <textarea
                    value={batchText}
                    onChange={(e) => setBatchText(e.target.value)}
                    placeholder="Collez ici les noms des joueurs (un par ligne ou séparés par des virgules)&#10;Exemple:&#10;Lucas&#10;Maxime&#10;Noah"
                    className="w-full h-24 p-3 bg-white border border-slate-300 rounded-lg text-sm focus:ring-2 focus:ring-emerald-500 focus:outline-none"
                  />
                  <div className="flex justify-end gap-2">
                    <button
                      type="button"
                      onClick={() => setShowBatchAdd(false)}
                      className="px-3 py-1.5 text-xs text-slate-600 bg-slate-200 rounded-lg"
                    >
                      Annuler
                    </button>
                    <button
                      type="button"
                      onClick={handleBatchAdd}
                      className="px-4 py-1.5 text-xs font-bold text-white bg-emerald-600 hover:bg-emerald-700 rounded-lg shadow-sm"
                    >
                      Ajouter la liste
                    </button>
                  </div>
                </div>
              ) : (
                <div className="flex flex-wrap sm:flex-nowrap gap-2">
                  <input
                    type="text"
                    placeholder="Nom du joueur (ex: Ilian)"
                    value={newPlayerName}
                    onChange={(e) => setNewPlayerName(e.target.value)}
                    className="flex-1 px-3 py-2 bg-white border border-slate-300 rounded-lg text-sm text-slate-900 focus:ring-2 focus:ring-emerald-500 focus:outline-none"
                  />
                  <input
                    type="number"
                    placeholder="N°"
                    value={newPlayerNum}
                    onChange={(e) => setNewPlayerNum(e.target.value)}
                    className="w-16 px-2 py-2 text-center bg-white border border-slate-300 rounded-lg text-sm text-slate-900 focus:ring-2 focus:ring-emerald-500 focus:outline-none"
                  />
                  <select
                    value={newPlayerPos}
                    onChange={(e) => setNewPlayerPos(e.target.value as Position)}
                    className="px-3 py-2 bg-white border border-slate-300 rounded-lg text-sm text-slate-800 focus:ring-2 focus:ring-emerald-500 focus:outline-none"
                  >
                    {POSITIONS.map(pos => (
                      <option key={pos} value={pos}>{pos}</option>
                    ))}
                  </select>
                  <button
                    type="submit"
                    className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg text-sm font-bold shadow-sm transition-colors flex items-center gap-1 shrink-0"
                  >
                    <Plus className="w-4 h-4" /> Ajouter
                  </button>
                </div>
              )}
            </form>

            {/* Player list with Avatar integration */}
            <div>
              <div className="flex items-center justify-between mb-2">
                <label className="text-xs font-bold text-slate-500 uppercase tracking-wider">
                  Effectif des joueurs inscrits ({matchData.roster.length})
                </label>
                <div className="flex items-center gap-2">
                  <span className="text-xs text-slate-400">
                    💡 Cliquez sur la photo ou l'icône pour personnaliser
                  </span>
                  <button
                    type="button"
                    onClick={handleGenerateAllAvatars}
                    className="sm:hidden text-xs text-emerald-700 font-bold"
                  >
                    🪄 Colorer tous
                  </button>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                {matchData.roster.map((player) => (
                  <div
                    key={player.id}
                    className={`flex items-center justify-between p-2 rounded-xl border transition-all ${
                      player.isPresent
                        ? 'bg-white border-slate-200 shadow-2xs hover:border-slate-300'
                        : 'bg-slate-100/70 border-slate-200 opacity-60'
                    }`}
                  >
                    {/* Left: Presence Checkbox + Avatar + Name + Jersey */}
                    <div className="flex items-center gap-2.5 flex-1 min-w-0">
                      {/* Presence Check */}
                      <button
                        onClick={() => handleTogglePresent(player.id)}
                        className={`w-5 h-5 rounded-md flex items-center justify-center text-xs transition-colors shrink-0 ${
                          player.isPresent ? 'bg-emerald-600 text-white' : 'border border-slate-300 bg-white'
                        }`}
                        title={player.isPresent ? 'Présent' : 'Absent'}
                      >
                        {player.isPresent && <Check className="w-3.5 h-3.5 stroke-[3]" />}
                      </button>

                      {/* Interactive Avatar Button */}
                      <button
                        type="button"
                        onClick={() => setEditingAvatarPlayer(player)}
                        className="relative group shrink-0 focus:outline-none"
                        title="Modifier la photo, l'avatar ou la couleur"
                      >
                        <PlayerAvatar
                          player={player}
                          size="md"
                          showBorder
                          className="group-hover:ring-2 group-hover:ring-emerald-500 transition-all"
                        />
                        <div className="absolute inset-0 bg-slate-900/40 rounded-full opacity-0 group-hover:opacity-100 flex items-center justify-center text-white transition-opacity">
                          <Palette className="w-3 h-3" />
                        </div>
                      </button>

                      {/* Player Name and Number */}
                      <div className="flex-1 min-w-0 flex items-center gap-1.5">
                        <input
                          type="text"
                          value={player.name}
                          onChange={(e) => handleUpdatePlayer(player.id, { name: e.target.value })}
                          className="w-full text-xs sm:text-sm font-bold text-slate-900 bg-transparent border-b border-transparent hover:border-slate-300 focus:border-emerald-500 focus:outline-none px-1"
                        />
                        {player.number !== undefined && (
                          <span className="text-[10px] font-mono font-bold px-1.5 py-0.5 rounded bg-slate-100 text-slate-600 shrink-0">
                            N°{player.number}
                          </span>
                        )}
                      </div>
                    </div>

                    {/* Right: Position + Customize icon + Delete */}
                    <div className="flex items-center gap-1.5 shrink-0">
                      <select
                        value={player.defaultPosition || 'Milieu'}
                        onChange={(e) => handleUpdatePlayer(player.id, { defaultPosition: e.target.value as Position })}
                        className="text-[11px] bg-slate-50 border border-slate-200 rounded px-1.5 py-1 text-slate-700 focus:outline-none"
                      >
                        {POSITIONS.map(pos => (
                          <option key={pos} value={pos}>{pos}</option>
                        ))}
                      </select>

                      <button
                        type="button"
                        onClick={() => setEditingAvatarPlayer(player)}
                        className="p-1 text-slate-400 hover:text-emerald-700 hover:bg-emerald-50 rounded transition-colors"
                        title="Personnaliser photo / icône"
                      >
                        <Palette className="w-3.5 h-3.5" />
                      </button>

                      <button
                        type="button"
                        onClick={() => handleDeletePlayer(player.id)}
                        className="p-1 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded transition-colors"
                        title="Supprimer le joueur"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>

          </div>

          {/* Footer */}
          <div className="px-6 py-3.5 bg-slate-50 border-t border-slate-200 flex items-center justify-between">
            <button
              type="button"
              onClick={handleGenerateAllAvatars}
              className="flex items-center gap-1.5 text-xs text-emerald-700 hover:text-emerald-800 font-bold"
            >
              <Sparkles className="w-3.5 h-3.5" />
              <span>Générer automatiquement des avatars colorés</span>
            </button>

            <button
              onClick={onClose}
              className="px-5 py-2 bg-slate-900 hover:bg-slate-800 text-white rounded-xl text-xs font-bold shadow-sm transition-colors"
            >
              Terminer
            </button>
          </div>

        </div>
      </div>

      {/* Avatar Customization Modal */}
      <PlayerAvatarPickerModal
        player={editingAvatarPlayer}
        isOpen={Boolean(editingAvatarPlayer)}
        onClose={() => setEditingAvatarPlayer(null)}
        onSave={handleUpdatePlayer}
      />
    </>
  );
};
