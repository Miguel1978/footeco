import React, { useState, useMemo } from 'react';
import { MatchData, PlayerSlot } from '../types';
import {
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ReferenceLine,
  Cell
} from 'recharts';
import {
  Clock,
  CheckCircle2,
  AlertTriangle,
  TrendingUp,
  ShieldCheck,
  Filter,
  BarChart3,
  Layers,
  ArrowUpDown,
  Sparkles,
  ChevronDown
} from 'lucide-react';

interface PlayingTimeRotationChartProps {
  matchData: MatchData;
}

export const PlayingTimeRotationChart: React.FC<PlayingTimeRotationChartProps> = ({ matchData }) => {
  const [chartMode, setChartMode] = useState<'stacked' | 'total'>('stacked');
  const [filterMode, setFilterMode] = useState<'present' | 'all'>('present');
  const [sortBy, setSortBy] = useState<'minutes_desc' | 'minutes_asc' | 'name'>('minutes_desc');
  const [showMatrix, setShowMatrix] = useState(false);

  // Calculate rotation metrics per player across all periods
  const rotationStats = useMemo(() => {
    const totalMatchDuration = matchData.periods.reduce((acc, p) => acc + (p.durationMinutes || 15), 0);
    const periodsCount = matchData.periods.length || 4;

    // Track players map
    const playerMap = new Map<string, {
      id: string;
      name: string;
      number?: number;
      isPresent: boolean;
      defaultPosition?: string;
      pMinutes: number[]; // index matches period index
      pPositions: (string | null)[];
      pRoles: ('titulaire' | 'remplacant' | 'repos')[];
      pTeams: ('team1' | 'team2' | null)[];
      totalMinutes: number;
      periodsStartedCount: number;
      periodsSubbedCount: number;
      positionsPlayed: string[];
    }>();

    // Initialize from roster
    matchData.roster.forEach(player => {
      playerMap.set(player.name.trim().toLowerCase(), {
        id: player.id,
        name: player.name,
        number: player.number,
        isPresent: player.isPresent,
        defaultPosition: player.defaultPosition,
        pMinutes: new Array(periodsCount).fill(0),
        pPositions: new Array(periodsCount).fill(null),
        pRoles: new Array(periodsCount).fill('repos'),
        pTeams: new Array(periodsCount).fill(null),
        totalMinutes: 0,
        periodsStartedCount: 0,
        periodsSubbedCount: 0,
        positionsPlayed: [],
      });
    });

    // Populate from each period
    matchData.periods.forEach((period, pIndex) => {
      const duration = period.durationMinutes || 15;

      const recordSlot = (slot: PlayerSlot, role: 'titulaire' | 'remplacant', team: 'team1' | 'team2') => {
        if (!slot.playerName.trim()) return;
        const key = slot.playerName.trim().toLowerCase();
        let entry = playerMap.get(key);
        if (!entry) {
          entry = {
            id: slot.id,
            name: slot.playerName,
            number: undefined,
            isPresent: true,
            defaultPosition: slot.position,
            pMinutes: new Array(periodsCount).fill(0),
            pPositions: new Array(periodsCount).fill(null),
            pRoles: new Array(periodsCount).fill('repos'),
            pTeams: new Array(periodsCount).fill(null),
            totalMinutes: 0,
            periodsStartedCount: 0,
            periodsSubbedCount: 0,
            positionsPlayed: [],
          };
          playerMap.set(key, entry);
        }

        entry.pRoles[pIndex] = role;
        entry.pTeams[pIndex] = team;
        entry.pPositions[pIndex] = slot.position;

        if (role === 'titulaire') {
          entry.pMinutes[pIndex] = duration;
          entry.totalMinutes += duration;
          entry.periodsStartedCount += 1;
          if (!entry.positionsPlayed.includes(slot.position)) {
            entry.positionsPlayed.push(slot.position);
          }
        } else {
          entry.periodsSubbedCount += 1;
        }
      };

      period.team1.titulaires.forEach(s => recordSlot(s, 'titulaire', 'team1'));
      period.team1.remplacants.forEach(s => recordSlot(s, 'remplacant', 'team1'));
      period.team2.titulaires.forEach(s => recordSlot(s, 'titulaire', 'team2'));
      period.team2.remplacants.forEach(s => recordSlot(s, 'remplacant', 'team2'));
    });

    const allPlayers = Array.from(playerMap.values());
    const presentPlayers = allPlayers.filter(p => p.isPresent);

    // Theoretical balanced target per present player in FE12:
    // Total slot-minutes available = periodsCount * (team1Starters + team2Starters) * 15 min
    // In FE12, usually 50% to 75% of the match (30 to 45 min)
    const targetMinOptimal = 30;
    const targetMaxOptimal = 45;

    const dataWithBalance = allPlayers.map(p => {
      let status: 'optimal' | 'low' | 'high' | 'absent' = 'optimal';
      let statusLabel = 'Équilibré (30-45 min)';
      let statusColor = '#10B981'; // emerald

      if (!p.isPresent) {
        status = 'absent';
        statusLabel = 'Absent';
        statusColor = '#94A3B8'; // slate
      } else if (p.totalMinutes < targetMinOptimal) {
        status = 'low';
        statusLabel = `Temps faible (< ${targetMinOptimal} min)`;
        statusColor = '#F59E0B'; // amber
      } else if (p.totalMinutes > targetMaxOptimal) {
        status = 'high';
        statusLabel = `Temps élevé (> ${targetMaxOptimal} min)`;
        statusColor = '#3B82F6'; // blue
      }

      const p1 = p.pMinutes[0] || 0;
      const p2 = p.pMinutes[1] || 0;
      const p3 = p.pMinutes[2] || 0;
      const p4 = p.pMinutes[3] || 0;

      return {
        ...p,
        P1: p1,
        P2: p2,
        P3: p3,
        P4: p4,
        status,
        statusLabel,
        statusColor,
        percentageOfMatch: totalMatchDuration > 0 ? Math.round((p.totalMinutes / totalMatchDuration) * 100) : 0,
        displayName: p.number !== undefined ? `#${p.number} ${p.name}` : p.name,
      };
    });

    // Summary calculations
    const presentList = dataWithBalance.filter(p => p.isPresent);
    const avgMinutes = presentList.length > 0
      ? Math.round(presentList.reduce((acc, p) => acc + p.totalMinutes, 0) / presentList.length)
      : 0;

    const balancedCount = presentList.filter(p => p.status === 'optimal').length;
    const lowCount = presentList.filter(p => p.status === 'low').length;
    const highCount = presentList.filter(p => p.status === 'high').length;

    // Equity index: percentage of present players within the optimal range
    const equityIndex = presentList.length > 0
      ? Math.round((balancedCount / presentList.length) * 100)
      : 100;

    return {
      players: dataWithBalance,
      presentCount: presentList.length,
      avgMinutes,
      balancedCount,
      lowCount,
      highCount,
      equityIndex,
      totalMatchDuration,
      periodsCount,
    };
  }, [matchData]);

  // Filter and Sort for the chart
  const filteredAndSortedPlayers = useMemo(() => {
    let list = [...rotationStats.players];

    if (filterMode === 'present') {
      list = list.filter(p => p.isPresent);
    }

    if (sortBy === 'minutes_desc') {
      list.sort((a, b) => b.totalMinutes - a.totalMinutes || a.name.localeCompare(b.name));
    } else if (sortBy === 'minutes_asc') {
      list.sort((a, b) => a.totalMinutes - b.totalMinutes || a.name.localeCompare(b.name));
    } else if (sortBy === 'name') {
      list.sort((a, b) => a.name.localeCompare(b.name));
    }

    return list;
  }, [rotationStats.players, filterMode, sortBy]);

  // Custom Recharts Tooltip
  const CustomTooltip = ({ active, payload }: any) => {
    if (active && payload && payload.length) {
      const data = payload[0].payload;
      return (
        <div className="bg-slate-900/95 text-white p-3 rounded-xl shadow-xl border border-slate-700 text-xs space-y-2 min-w-[210px] z-50">
          <div className="flex items-center justify-between border-b border-slate-700/80 pb-1.5">
            <span className="font-bold text-sm text-white">{data.name}</span>
            <span
              className="text-[10px] px-2 py-0.5 rounded-full font-bold uppercase tracking-wider"
              style={{
                backgroundColor: data.statusColor + '30',
                color: data.statusColor,
                border: `1px solid ${data.statusColor}`
              }}
            >
              {data.statusLabel}
            </span>
          </div>

          <div className="space-y-1 text-slate-300">
            <div className="flex justify-between">
              <span>Temps total joué :</span>
              <span className="font-extrabold text-white">{data.totalMinutes} min ({data.percentageOfMatch}%)</span>
            </div>
            <div className="flex justify-between">
              <span>Périodes titulaire :</span>
              <span className="font-semibold text-emerald-400">{data.periodsStartedCount} sur {rotationStats.periodsCount}</span>
            </div>
            <div className="flex justify-between">
              <span>Périodes remplaçant :</span>
              <span className="font-semibold text-amber-400">{data.periodsSubbedCount}</span>
            </div>
          </div>

          {/* Breakdown per period */}
          <div className="pt-1.5 border-t border-slate-800 grid grid-cols-4 gap-1 text-center text-[10px]">
            {[0, 1, 2, 3].map(idx => {
              const role = data.pRoles[idx];
              const minutes = data.pMinutes[idx];
              const pos = data.pPositions[idx];
              const isStarter = role === 'titulaire';
              return (
                <div
                  key={idx}
                  className={`p-1 rounded ${
                    isStarter
                      ? 'bg-emerald-950/80 text-emerald-300 border border-emerald-700/50'
                      : role === 'remplacant'
                      ? 'bg-amber-950/80 text-amber-300 border border-amber-700/50'
                      : 'bg-slate-800 text-slate-400'
                  }`}
                >
                  <div className="font-bold">P{idx + 1}</div>
                  <div>{minutes > 0 ? `${minutes}'` : '0\''}</div>
                  {pos && <div className="truncate text-[8px] text-slate-300">{pos.slice(0, 3)}</div>}
                </div>
              );
            })}
          </div>

          {data.positionsPlayed.length > 0 && (
            <div className="text-[10px] text-slate-400 pt-1 border-t border-slate-800">
              Postes : <span className="text-slate-200">{data.positionsPlayed.join(', ')}</span>
            </div>
          )}
        </div>
      );
    }
    return null;
  };

  return (
    <div className="bg-white rounded-2xl border border-slate-200 p-5 shadow-xs space-y-5">
      {/* Header & Controls */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-3 border-b border-slate-100 pb-4">
        <div>
          <div className="flex items-center gap-2">
            <div className="p-1.5 bg-emerald-100 text-emerald-800 rounded-lg">
              <BarChart3 className="w-4 h-4" />
            </div>
            <h3 className="text-sm font-bold text-slate-900">
              Temps de Jeu & Équilibre des Rotations (4 Périodes)
            </h3>
          </div>
          <p className="text-xs text-slate-500 mt-0.5">
            Calcul cumulé des 4 périodes de 15 minutes pour vérifier la parité Footeco FE12 (objectif 30 à 45 min par joueur présent).
          </p>
        </div>

        {/* View Mode & Filter Controls */}
        <div className="flex flex-wrap items-center gap-2 text-xs">
          {/* Chart Type Toggle */}
          <div className="flex items-center bg-slate-100 p-0.5 rounded-lg border border-slate-200">
            <button
              type="button"
              onClick={() => setChartMode('stacked')}
              className={`flex items-center gap-1 px-2.5 py-1 rounded-md font-semibold transition-all cursor-pointer ${
                chartMode === 'stacked'
                  ? 'bg-white text-indigo-700 shadow-2xs'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
              title="Afficher la décomposition P1 à P4 empilée"
            >
              <Layers className="w-3.5 h-3.5" />
              <span>Empilé (P1-P4)</span>
            </button>
            <button
              type="button"
              onClick={() => setChartMode('total')}
              className={`flex items-center gap-1 px-2.5 py-1 rounded-md font-semibold transition-all cursor-pointer ${
                chartMode === 'total'
                  ? 'bg-white text-emerald-700 shadow-2xs'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
              title="Afficher les minutes totales avec indicateur d'équilibre"
            >
              <Clock className="w-3.5 h-3.5" />
              <span>Total & Équité</span>
            </button>
          </div>

          {/* Filter Present Only */}
          <button
            type="button"
            onClick={() => setFilterMode(filterMode === 'present' ? 'all' : 'present')}
            className={`flex items-center gap-1 px-2.5 py-1.5 rounded-lg border font-semibold transition-all cursor-pointer ${
              filterMode === 'present'
                ? 'bg-emerald-50 text-emerald-800 border-emerald-200'
                : 'bg-white text-slate-600 border-slate-200 hover:bg-slate-50'
            }`}
            title="Filtrer uniquement les joueurs présents"
          >
            <Filter className="w-3 h-3" />
            <span>{filterMode === 'present' ? `Présents (${rotationStats.presentCount})` : 'Tous les joueurs'}</span>
          </button>

          {/* Sorting */}
          <div className="flex items-center bg-white border border-slate-200 rounded-lg px-2 py-1">
            <ArrowUpDown className="w-3 h-3 text-slate-400 mr-1" />
            <select
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value as any)}
              className="bg-transparent text-slate-700 text-xs font-semibold focus:outline-none cursor-pointer"
            >
              <option value="minutes_desc">Temps décroissant</option>
              <option value="minutes_asc">Temps croissant</option>
              <option value="name">Nom alphabétique</option>
            </select>
          </div>
        </div>
      </div>

      {/* KPI Cards: Rotation Equity Summary */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        {/* Equity index */}
        <div className="bg-slate-50 border border-slate-200 rounded-xl p-3 flex flex-col justify-between">
          <div className="text-[11px] font-bold text-slate-500 uppercase tracking-wider flex items-center justify-between">
            <span>Indice d'Équité</span>
            <ShieldCheck className={`w-4 h-4 ${rotationStats.equityIndex >= 80 ? 'text-emerald-600' : 'text-amber-500'}`} />
          </div>
          <div className="mt-1 flex items-baseline gap-1.5">
            <span className="text-2xl font-black text-slate-900">{rotationStats.equityIndex}%</span>
            <span className="text-[10px] text-slate-500 font-medium">conformité</span>
          </div>
          <div className="text-[10px] text-slate-500 mt-0.5">
            {rotationStats.balancedCount} sur {rotationStats.presentCount} joueurs au temps idéal
          </div>
        </div>

        {/* Average playing time */}
        <div className="bg-slate-50 border border-slate-200 rounded-xl p-3 flex flex-col justify-between">
          <div className="text-[11px] font-bold text-slate-500 uppercase tracking-wider flex items-center justify-between">
            <span>Moyenne de jeu</span>
            <Clock className="w-4 h-4 text-indigo-600" />
          </div>
          <div className="mt-1 flex items-baseline gap-1.5">
            <span className="text-2xl font-black text-slate-900">{rotationStats.avgMinutes}</span>
            <span className="text-xs font-bold text-slate-600">min / joueur</span>
          </div>
          <div className="text-[10px] text-slate-500 mt-0.5">
            Sur {rotationStats.totalMatchDuration} min de match total
          </div>
        </div>

        {/* Low playing time warning */}
        <div className="bg-amber-50/70 border border-amber-200 rounded-xl p-3 flex flex-col justify-between">
          <div className="text-[11px] font-bold text-amber-800 uppercase tracking-wider flex items-center justify-between">
            <span>Temps faible (&lt;30')</span>
            <AlertTriangle className="w-4 h-4 text-amber-600" />
          </div>
          <div className="mt-1 flex items-baseline gap-1.5">
            <span className="text-2xl font-black text-amber-900">{rotationStats.lowCount}</span>
            <span className="text-[10px] text-amber-700 font-medium">joueur{rotationStats.lowCount > 1 ? 's' : ''}</span>
          </div>
          <div className="text-[10px] text-amber-700 mt-0.5">
            {rotationStats.lowCount > 0 ? 'À faire jouer en priorité !' : 'Aucun joueur sous-utilisé'}
          </div>
        </div>

        {/* Optimal balanced */}
        <div className="bg-emerald-50/70 border border-emerald-200 rounded-xl p-3 flex flex-col justify-between">
          <div className="text-[11px] font-bold text-emerald-800 uppercase tracking-wider flex items-center justify-between">
            <span>Temps idéal (30-45')</span>
            <CheckCircle2 className="w-4 h-4 text-emerald-600" />
          </div>
          <div className="mt-1 flex items-baseline gap-1.5">
            <span className="text-2xl font-black text-emerald-900">{rotationStats.balancedCount}</span>
            <span className="text-[10px] text-emerald-700 font-medium">joueur{rotationStats.balancedCount > 1 ? 's' : ''}</span>
          </div>
          <div className="text-[10px] text-emerald-700 mt-0.5">
            2 à 3 périodes complètes
          </div>
        </div>
      </div>

      {/* Main Recharts Bar Graph */}
      <div className="w-full bg-slate-50/50 rounded-xl border border-slate-200/80 p-3">
        <div className="h-64 sm:h-72 w-full">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart
              data={filteredAndSortedPlayers}
              margin={{ top: 20, right: 15, left: -10, bottom: 25 }}
            >
              <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#E2E8F0" />
              <XAxis
                dataKey="name"
                tick={{ fill: '#475569', fontSize: 11, fontWeight: 600 }}
                interval={0}
                angle={-30}
                textAnchor="end"
                height={50}
              />
              <YAxis
                domain={[0, Math.max(60, rotationStats.totalMatchDuration)]}
                ticks={[0, 15, 30, 45, 60]}
                unit=" min"
                tick={{ fill: '#64748B', fontSize: 11 }}
              />
              <Tooltip content={<CustomTooltip />} />
              <Legend
                verticalAlign="top"
                align="right"
                wrapperStyle={{ paddingBottom: '8px', fontSize: '11px' }}
              />

              {/* Reference Guidelines for Footeco Balance */}
              <ReferenceLine
                y={30}
                stroke="#10B981"
                strokeDasharray="4 4"
                strokeWidth={1.5}
                label={{
                  value: 'Min. Footeco (30 min)',
                  fill: '#059669',
                  fontSize: 10,
                  position: 'insideTopLeft'
                }}
              />
              <ReferenceLine
                y={45}
                stroke="#6366F1"
                strokeDasharray="4 4"
                strokeWidth={1.5}
                label={{
                  value: 'Seuil Élevé (45 min)',
                  fill: '#4F46E5',
                  fontSize: 10,
                  position: 'insideTopLeft'
                }}
              />

              {chartMode === 'stacked' ? (
                <>
                  <Bar dataKey="P1" name="Période 1 (15')" stackId="periods" fill="#10B981" radius={[0, 0, 0, 0]} />
                  <Bar dataKey="P2" name="Période 2 (15')" stackId="periods" fill="#06B6D4" radius={[0, 0, 0, 0]} />
                  <Bar dataKey="P3" name="Période 3 (15')" stackId="periods" fill="#6366F1" radius={[0, 0, 0, 0]} />
                  <Bar dataKey="P4" name="Période 4 (15')" stackId="periods" fill="#8B5CF6" radius={[4, 4, 0, 0]} />
                </>
              ) : (
                <Bar dataKey="totalMinutes" name="Temps total joué" radius={[5, 5, 0, 0]}>
                  {filteredAndSortedPlayers.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.statusColor} />
                  ))}
                </Bar>
              )}
            </BarChart>
          </ResponsiveContainer>
        </div>

        {/* Chart footer legend & guidelines */}
        <div className="flex flex-wrap items-center justify-between gap-2 mt-2 pt-2 border-t border-slate-200/60 text-[11px] text-slate-500">
          <div className="flex items-center gap-3">
            <span className="flex items-center gap-1">
              <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 inline-block" />
              <span>30 à 45 min (Temps équilibré)</span>
            </span>
            <span className="flex items-center gap-1">
              <span className="w-2.5 h-2.5 rounded-full bg-amber-500 inline-block" />
              <span>&lt; 30 min (À faire jouer)</span>
            </span>
            <span className="flex items-center gap-1">
              <span className="w-2.5 h-2.5 rounded-full bg-blue-500 inline-block" />
              <span>&gt; 45 min (Forte charge)</span>
            </span>
          </div>

          <button
            type="button"
            onClick={() => setShowMatrix(!showMatrix)}
            className="text-indigo-600 hover:text-indigo-800 font-bold flex items-center gap-1 cursor-pointer"
          >
            <span>{showMatrix ? 'Masquer la grille détaillée P1-P4' : 'Voir la grille détaillée P1-P4'}</span>
            <ChevronDown className={`w-3.5 h-3.5 transition-transform ${showMatrix ? 'rotate-180' : ''}`} />
          </button>
        </div>
      </div>

      {/* Optional Breakdown Matrix Table */}
      {showMatrix && (
        <div className="overflow-x-auto border border-slate-200 rounded-xl bg-white shadow-2xs">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-50 border-b border-slate-200 text-[10px] font-bold text-slate-500 uppercase tracking-wider">
              <tr>
                <th className="py-2.5 px-3">Joueur</th>
                <th className="py-2.5 px-2 text-center">P1</th>
                <th className="py-2.5 px-2 text-center">P2</th>
                <th className="py-2.5 px-2 text-center">P3</th>
                <th className="py-2.5 px-2 text-center">P4</th>
                <th className="py-2.5 px-3 text-center">Total Joué</th>
                <th className="py-2.5 px-3">Statut Équité</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {filteredAndSortedPlayers.map(p => (
                <tr key={p.id} className="hover:bg-slate-50/80 transition-colors">
                  <td className="py-2 px-3 font-semibold text-slate-900">
                    <div className="flex items-center gap-1.5">
                      {p.number !== undefined && (
                        <span className="w-5 h-5 rounded-full bg-slate-100 border border-slate-200 text-slate-600 font-bold text-[10px] flex items-center justify-center">
                          {p.number}
                        </span>
                      )}
                      <span>{p.name}</span>
                    </div>
                  </td>

                  {/* P1 to P4 */}
                  {[0, 1, 2, 3].map(idx => {
                    const isStarter = p.pRoles[idx] === 'titulaire';
                    const isSub = p.pRoles[idx] === 'remplacant';
                    const pos = p.pPositions[idx];
                    const team = p.pTeams[idx];
                    return (
                      <td key={idx} className="py-2 px-2 text-center">
                        {isStarter ? (
                          <span className={`inline-flex flex-col items-center justify-center px-1.5 py-0.5 rounded text-[10px] font-bold ${
                            team === 'team1'
                              ? 'bg-yellow-100 text-yellow-800 border border-yellow-300'
                              : 'bg-red-100 text-red-800 border border-red-300'
                          }`}>
                            <span>15'</span>
                            {pos && <span className="text-[8px] font-normal opacity-80">{pos.slice(0, 3)}</span>}
                          </span>
                        ) : isSub ? (
                          <span className="inline-block px-1 py-0.5 rounded bg-slate-100 text-slate-500 text-[10px] font-medium border border-slate-200">
                            Remp.
                          </span>
                        ) : (
                          <span className="text-slate-300 text-[10px]">-</span>
                        )}
                      </td>
                    );
                  })}

                  <td className="py-2 px-3 text-center font-extrabold text-slate-900">
                    {p.totalMinutes} min
                    <span className="text-[10px] font-normal text-slate-400 block">
                      ({p.periodsStartedCount}/4 tit.)
                    </span>
                  </td>

                  <td className="py-2 px-3">
                    <span
                      className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold"
                      style={{
                        backgroundColor: p.statusColor + '20',
                        color: p.statusColor,
                        border: `1px solid ${p.statusColor}50`
                      }}
                    >
                      {p.status === 'optimal' && <CheckCircle2 className="w-3 h-3" />}
                      {p.status === 'low' && <AlertTriangle className="w-3 h-3" />}
                      <span>{p.statusLabel}</span>
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
};
