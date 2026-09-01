import React from 'react';
import { PeriodMatch, PlayerSlot, Player } from '../types';
import { PlayerAvatar } from './PlayerAvatar';

interface PitchTacticalViewProps {
  period: PeriodMatch;
  roster?: Player[];
}

export const PitchTacticalView: React.FC<PitchTacticalViewProps> = ({ period, roster = [] }) => {
  return (
    <div className="space-y-6 mb-8 print:hidden">
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        
        {/* Equipe 1 Field (Yellow Accent) */}
        <div className="bg-slate-900 rounded-2xl p-4 shadow-md border border-slate-800">
          <div className="flex items-center justify-between mb-3 px-2">
            <div className="flex items-center gap-2">
              <span className="w-3 h-3 rounded-full bg-[#FFFF00]" />
              <span className="font-bold text-white text-sm">
                {period.team1.teamName || 'Equipe 1'} (Coach: {period.team1.coachName || 'Seb'})
              </span>
            </div>
            <span className="text-xs text-amber-300 font-mono font-bold">
              {period.durationMinutes || 15} min
            </span>
          </div>

          {/* 7v7 Soccer Pitch Graphic */}
          <div className="relative w-full aspect-[4/3] bg-emerald-700 rounded-xl border-2 border-emerald-500 overflow-hidden p-3 flex flex-col justify-between shadow-inner">
            {/* Pitch Markings */}
            <div className="absolute inset-0 border-2 border-white/30 pointer-events-none m-2 rounded-lg" />
            <div className="absolute top-1/2 left-0 right-0 h-0.5 bg-white/30 -translate-y-1/2" />
            <div className="absolute top-1/2 left-1/2 w-20 h-20 border-2 border-white/30 rounded-full -translate-x-1/2 -translate-y-1/2" />
            <div className="absolute top-2 left-1/2 -translate-x-1/2 w-28 h-12 border-b-2 border-x-2 border-white/30 rounded-b-lg" />
            <div className="absolute bottom-2 left-1/2 -translate-x-1/2 w-28 h-12 border-t-2 border-x-2 border-white/30 rounded-t-lg" />

            {/* Line 1: Attaquant */}
            <div className="relative z-10 flex justify-center pt-2">
              <PlayerPin slot={period.team1.titulaires[6]} role="Attaquant" color="yellow" roster={roster} />
            </div>

            {/* Line 2: Couloirs & Milieu */}
            <div className="relative z-10 flex justify-between px-6 items-center">
              <PlayerPin slot={period.team1.titulaires[4]} role="Couloir G" color="yellow" roster={roster} />
              <PlayerPin slot={period.team1.titulaires[3]} role="Milieu" color="yellow" roster={roster} />
              <PlayerPin slot={period.team1.titulaires[5]} role="Couloir D" color="yellow" roster={roster} />
            </div>

            {/* Line 3: 2 Défenseurs */}
            <div className="relative z-10 flex justify-around px-10">
              <PlayerPin slot={period.team1.titulaires[1]} role="Défenseur G" color="yellow" roster={roster} />
              <PlayerPin slot={period.team1.titulaires[2]} role="Défenseur D" color="yellow" roster={roster} />
            </div>

            {/* Line 4: Gardien */}
            <div className="relative z-10 flex justify-center pb-2">
              <PlayerPin slot={period.team1.titulaires[0]} role="Gardien" color="yellow" isGK roster={roster} />
            </div>
          </div>

          {/* Substitutes row below pitch */}
          <div className="mt-3 pt-3 border-t border-slate-800 flex items-center justify-between text-xs">
            <span className="text-slate-400 font-semibold">Remplaçants :</span>
            <div className="flex flex-wrap gap-2">
              {period.team1.remplacants.map((sub, idx) => {
                const matched = roster.find(p => (sub.playerId && p.id === sub.playerId) || (sub.playerName && p.name.trim().toLowerCase() === sub.playerName.trim().toLowerCase()));
                return (
                  <div key={idx} className="bg-slate-800 text-yellow-300 px-2 py-1 rounded-lg font-medium border border-slate-700 flex items-center gap-1.5 shadow-2xs">
                    <PlayerAvatar player={matched} name={sub.playerName} size="xs" />
                    <span>{sub.playerName || 'Remplaçant'}</span>
                  </div>
                );
              })}
              {period.team1.remplacants.length === 0 && (
                <span className="text-slate-500 italic">Aucun remplaçant</span>
              )}
            </div>
          </div>
        </div>

        {/* Equipe 2 Field (Red Accent) */}
        <div className="bg-slate-900 rounded-2xl p-4 shadow-md border border-slate-800">
          <div className="flex items-center justify-between mb-3 px-2">
            <div className="flex items-center gap-2">
              <span className="w-3 h-3 rounded-full bg-[#FF0000]" />
              <span className="font-bold text-white text-sm">
                {period.team2.teamName || 'Equipe 2'} (Coach: {period.team2.coachName || 'Miguel'})
              </span>
            </div>
            <span className="text-xs text-rose-300 font-mono font-bold">
              {period.durationMinutes || 15} min
            </span>
          </div>

          {/* 7v7 Soccer Pitch Graphic */}
          <div className="relative w-full aspect-[4/3] bg-emerald-700 rounded-xl border-2 border-emerald-500 overflow-hidden p-3 flex flex-col justify-between shadow-inner">
            {/* Pitch Markings */}
            <div className="absolute inset-0 border-2 border-white/30 pointer-events-none m-2 rounded-lg" />
            <div className="absolute top-1/2 left-0 right-0 h-0.5 bg-white/30 -translate-y-1/2" />
            <div className="absolute top-1/2 left-1/2 w-20 h-20 border-2 border-white/30 rounded-full -translate-x-1/2 -translate-y-1/2" />
            <div className="absolute top-2 left-1/2 -translate-x-1/2 w-28 h-12 border-b-2 border-x-2 border-white/30 rounded-b-lg" />
            <div className="absolute bottom-2 left-1/2 -translate-x-1/2 w-28 h-12 border-t-2 border-x-2 border-white/30 rounded-t-lg" />

            {/* Line 1: Attaquant */}
            <div className="relative z-10 flex justify-center pt-2">
              <PlayerPin slot={period.team2.titulaires[6]} role="Attaquant" color="red" roster={roster} />
            </div>

            {/* Line 2: Couloirs & Milieu */}
            <div className="relative z-10 flex justify-between px-6 items-center">
              <PlayerPin slot={period.team2.titulaires[4]} role="Couloir G" color="red" roster={roster} />
              <PlayerPin slot={period.team2.titulaires[3]} role="Milieu" color="red" roster={roster} />
              <PlayerPin slot={period.team2.titulaires[5]} role="Couloir D" color="red" roster={roster} />
            </div>

            {/* Line 3: 2 Défenseurs */}
            <div className="relative z-10 flex justify-around px-10">
              <PlayerPin slot={period.team2.titulaires[1]} role="Défenseur G" color="red" roster={roster} />
              <PlayerPin slot={period.team2.titulaires[2]} role="Défenseur D" color="red" roster={roster} />
            </div>

            {/* Line 4: Gardien */}
            <div className="relative z-10 flex justify-center pb-2">
              <PlayerPin slot={period.team2.titulaires[0]} role="Gardien" color="red" isGK roster={roster} />
            </div>
          </div>

          {/* Substitutes row below pitch */}
          <div className="mt-3 pt-3 border-t border-slate-800 flex items-center justify-between text-xs">
            <span className="text-slate-400 font-semibold">Remplaçants :</span>
            <div className="flex flex-wrap gap-2">
              {period.team2.remplacants.map((sub, idx) => {
                const matched = roster.find(p => (sub.playerId && p.id === sub.playerId) || (sub.playerName && p.name.trim().toLowerCase() === sub.playerName.trim().toLowerCase()));
                return (
                  <div key={idx} className="bg-slate-800 text-rose-300 px-2 py-1 rounded-lg font-medium border border-slate-700 flex items-center gap-1.5 shadow-2xs">
                    <PlayerAvatar player={matched} name={sub.playerName} size="xs" />
                    <span>{sub.playerName || 'Remplaçant'}</span>
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
    </div>
  );
};

interface PlayerPinProps {
  slot?: PlayerSlot;
  role: string;
  color: 'yellow' | 'red';
  isGK?: boolean;
  roster: Player[];
}

const PlayerPin: React.FC<PlayerPinProps> = ({ slot, role, color, isGK, roster }) => {
  const name = slot?.playerName || '-';
  const hasName = Boolean(slot?.playerName);
  const matchedPlayer = roster.find(
    p => (slot?.playerId && p.id === slot.playerId) || (slot?.playerName && p.name.trim().toLowerCase() === slot.playerName.trim().toLowerCase())
  );

  return (
    <div className="flex flex-col items-center group cursor-pointer">
      <div className="transition-transform group-hover:scale-110">
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
      </div>
      <span className="mt-0.5 bg-slate-950/80 backdrop-blur-xs text-white text-[10px] font-bold px-1.5 py-0.5 rounded shadow-sm max-w-[75px] truncate text-center">
        {hasName ? name : role}
      </span>
    </div>
  );
};
