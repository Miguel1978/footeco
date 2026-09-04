import React, { useState } from 'react';
import { MatchData } from '../types';
import {
  ResponsiveContainer,
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
} from 'recharts';
import { TrendingUp, BarChart2, Shield, Swords, CheckCircle2 } from 'lucide-react';

interface ScoreEvolutionChartProps {
  matchData: MatchData;
  className?: string;
}

type ScopeType = 'global' | 'team1' | 'team2';
type ModeType = 'cumulative' | 'period';

export const ScoreEvolutionChart: React.FC<ScoreEvolutionChartProps> = ({
  matchData,
  className = '',
}) => {
  const [mode, setMode] = useState<ModeType>('cumulative');
  const [scope, setScope] = useState<ScopeType>('global');

  // Compute team labels
  const opponentName = matchData.opponent?.trim() || 'Adversaire';
  const team1Name = matchData.periods[0]?.team1?.teamName || 'Équipe 1';
  const team2Name = matchData.periods[0]?.team2?.teamName || 'Équipe 2';

  let currentTeamLabel = 'Notre Équipe (Total FE12)';
  if (scope === 'team1') currentTeamLabel = team1Name;
  if (scope === 'team2') currentTeamLabel = team2Name;

  // Process period-by-period data
  let runningTeam = 0;
  let runningOpponent = 0;

  const rawPeriodStats = matchData.periods.map((period, index) => {
    const s1 = parseInt(period.team1.scoreMatch, 10);
    const o1 = parseInt(period.team1.scoreOpponent, 10);
    const s2 = parseInt(period.team2.scoreMatch, 10);
    const o2 = parseInt(period.team2.scoreOpponent, 10);

    const t1Score = isNaN(s1) ? 0 : s1;
    const t1Opp = isNaN(o1) ? 0 : o1;
    const t2Score = isNaN(s2) ? 0 : s2;
    const t2Opp = isNaN(o2) ? 0 : o2;

    const globalScore = t1Score + t2Score;
    const globalOpp = t1Opp + t2Opp;

    let periodTeam = globalScore;
    let periodOpp = globalOpp;

    if (scope === 'team1') {
      periodTeam = t1Score;
      periodOpp = t1Opp;
    } else if (scope === 'team2') {
      periodTeam = t2Score;
      periodOpp = t2Opp;
    }

    runningTeam += periodTeam;
    runningOpponent += periodOpp;

    const periodDuration = period.durationMinutes || 15;
    const periodMinutes = (index + 1) * periodDuration;

    return {
      periodIndex: index + 1,
      periodTitle: period.title || `Période ${index + 1}`,
      name: `P${index + 1} (${periodMinutes}')`,
      shortName: `P${index + 1}`,
      periodTeam,
      periodOpp,
      cumulativeTeam: runningTeam,
      cumulativeOpponent: runningOpponent,
      t1Score,
      t1Opp,
      t2Score,
      t2Opp,
    };
  });

  // Build chart dataset
  const chartData: any[] = [];

  if (mode === 'cumulative') {
    // Start with 0-0 at kickoff
    chartData.push({
      name: "Début (0')",
      shortName: '0',
      teamScore: 0,
      opponentScore: 0,
      isKickoff: true,
      periodTeam: 0,
      periodOpp: 0,
    });

    rawPeriodStats.forEach((p) => {
      chartData.push({
        name: p.name,
        shortName: p.shortName,
        periodTitle: p.periodTitle,
        teamScore: p.cumulativeTeam,
        opponentScore: p.cumulativeOpponent,
        periodTeam: p.periodTeam,
        periodOpp: p.periodOpp,
        t1Score: p.t1Score,
        t1Opp: p.t1Opp,
        t2Score: p.t2Score,
        t2Opp: p.t2Opp,
      });
    });
  } else {
    // Score purely per period
    rawPeriodStats.forEach((p) => {
      chartData.push({
        name: p.name,
        shortName: p.shortName,
        periodTitle: p.periodTitle,
        teamScore: p.periodTeam,
        opponentScore: p.periodOpp,
        periodTeam: p.periodTeam,
        periodOpp: p.periodOpp,
        t1Score: p.t1Score,
        t1Opp: p.t1Opp,
        t2Score: p.t2Score,
        t2Opp: p.t2Opp,
      });
    });
  }

  const finalTeamScore = runningTeam;
  const finalOpponentScore = runningOpponent;
  const goalDiff = finalTeamScore - finalOpponentScore;

  // Custom Tooltip for Recharts Line Chart
  const CustomTooltip = ({ active, payload, label }: any) => {
    if (active && payload && payload.length) {
      const data = payload[0].payload;
      const isKickoff = data.isKickoff;

      return (
        <div className="bg-slate-900/95 text-white p-3 rounded-xl shadow-xl border border-slate-700 text-xs backdrop-blur-xs min-w-[200px]">
          <div className="font-extrabold text-sm text-slate-100 border-b border-slate-700 pb-1.5 mb-2 flex items-center justify-between">
            <span>{isKickoff ? "Coup d'envoi" : data.periodTitle || label}</span>
            <span className="text-[10px] font-bold px-1.5 py-0.5 rounded bg-slate-800 text-indigo-300">
              {mode === 'cumulative' ? 'Score Cumulé' : 'Buts Période'}
            </span>
          </div>

          <div className="space-y-1.5">
            <div className="flex items-center justify-between font-bold text-emerald-400">
              <span className="flex items-center gap-1.5">
                <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 inline-block" />
                {currentTeamLabel} :
              </span>
              <span className="text-sm font-mono">{data.teamScore}</span>
            </div>

            <div className="flex items-center justify-between font-bold text-rose-400">
              <span className="flex items-center gap-1.5">
                <span className="w-2.5 h-2.5 rounded-full bg-rose-500 inline-block" />
                {opponentName} :
              </span>
              <span className="text-sm font-mono">{data.opponentScore}</span>
            </div>
          </div>

          {!isKickoff && scope === 'global' && (
            <div className="mt-2.5 pt-2 border-t border-slate-700/80 text-[11px] text-slate-300 space-y-0.5">
              <div className="text-slate-400 font-semibold text-[10px] uppercase tracking-wider">
                Détail de cette période :
              </div>
              <div className="flex justify-between">
                <span>{team1Name} :</span>
                <span className="font-bold text-yellow-300">
                  {data.t1Score} à {data.t1Opp}
                </span>
              </div>
              <div className="flex justify-between">
                <span>{team2Name} :</span>
                <span className="font-bold text-red-300">
                  {data.t2Score} à {data.t2Opp}
                </span>
              </div>
            </div>
          )}
        </div>
      );
    }
    return null;
  };

  return (
    <div className={`bg-white rounded-2xl border border-slate-200 p-4 sm:p-5 shadow-xs space-y-4 ${className}`}>
      {/* Header & Controls */}
      <div className="flex flex-wrap items-center justify-between gap-3 pb-3 border-b border-slate-100">
        <div className="flex items-center gap-2.5">
          <div className="w-9 h-9 rounded-xl bg-indigo-50 text-indigo-700 border border-indigo-200/60 flex items-center justify-center font-bold shrink-0">
            <TrendingUp className="w-5 h-5" />
          </div>
          <div>
            <h3 className="text-sm font-extrabold text-slate-900 flex items-center gap-2">
              <span>Évolution du Score ({matchData.periods.length} Périodes)</span>
            </h3>
            <p className="text-[11px] text-slate-500">
              Graphique en ligne Recharts : {currentTeamLabel} vs {opponentName}
            </p>
          </div>
        </div>

        {/* View Controls: Scope (Global / Team 1 / Team 2) & Mode (Cumulative / Period) */}
        <div className="flex flex-wrap items-center gap-2">
          {/* Scope Selector */}
          <div className="flex items-center bg-slate-100 p-1 rounded-xl border border-slate-200 text-xs">
            <button
              type="button"
              onClick={() => setScope('global')}
              className={`px-2 py-1 rounded-lg font-bold transition-all text-[11px] ${
                scope === 'global' ? 'bg-white text-indigo-700 shadow-2xs' : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              Global (Éq 1+2)
            </button>
            <button
              type="button"
              onClick={() => setScope('team1')}
              className={`px-2 py-1 rounded-lg font-bold transition-all text-[11px] ${
                scope === 'team1' ? 'bg-white text-indigo-700 shadow-2xs' : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              {team1Name}
            </button>
            <button
              type="button"
              onClick={() => setScope('team2')}
              className={`px-2 py-1 rounded-lg font-bold transition-all text-[11px] ${
                scope === 'team2' ? 'bg-white text-indigo-700 shadow-2xs' : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              {team2Name}
            </button>
          </div>

          {/* Mode Selector (Cumulative vs Per-Period) */}
          <div className="flex items-center bg-slate-100 p-1 rounded-xl border border-slate-200 text-xs">
            <button
              type="button"
              onClick={() => setMode('cumulative')}
              className={`flex items-center gap-1 px-2 py-1 rounded-lg font-bold transition-all text-[11px] ${
                mode === 'cumulative' ? 'bg-white text-indigo-700 shadow-2xs' : 'text-slate-600 hover:text-slate-900'
              }`}
              title="Affiche le score cumulé filant au cours du match"
            >
              <TrendingUp className="w-3.5 h-3.5" />
              <span>Cumulé</span>
            </button>
            <button
              type="button"
              onClick={() => setMode('period')}
              className={`flex items-center gap-1 px-2 py-1 rounded-lg font-bold transition-all text-[11px] ${
                mode === 'period' ? 'bg-white text-indigo-700 shadow-2xs' : 'text-slate-600 hover:text-slate-900'
              }`}
              title="Affiche les buts marqués période par période"
            >
              <BarChart2 className="w-3.5 h-3.5" />
              <span>Par période</span>
            </button>
          </div>
        </div>
      </div>

      {/* KPI Summary Cards */}
      <div className="grid grid-cols-3 gap-2 text-center text-xs">
        <div className="bg-emerald-50/70 border border-emerald-200/80 rounded-xl p-2.5">
          <span className="text-[10px] font-bold uppercase tracking-wider text-emerald-800 block truncate">
            {currentTeamLabel}
          </span>
          <span className="text-xl font-black text-emerald-950 font-mono">{finalTeamScore}</span>
          <span className="text-[10px] text-emerald-700 block">buts au total</span>
        </div>

        <div className="bg-rose-50/70 border border-rose-200/80 rounded-xl p-2.5">
          <span className="text-[10px] font-bold uppercase tracking-wider text-rose-800 block truncate">
            {opponentName}
          </span>
          <span className="text-xl font-black text-rose-950 font-mono">{finalOpponentScore}</span>
          <span className="text-[10px] text-rose-700 block">buts au total</span>
        </div>

        <div className="bg-slate-50 border border-slate-200 rounded-xl p-2.5">
          <span className="text-[10px] font-bold uppercase tracking-wider text-slate-600 block">Différentiel</span>
          <span
            className={`text-xl font-black font-mono ${
              goalDiff > 0 ? 'text-emerald-700' : goalDiff < 0 ? 'text-rose-700' : 'text-slate-700'
            }`}
          >
            {goalDiff > 0 ? `+${goalDiff}` : goalDiff}
          </span>
          <span className="text-[10px] text-slate-500 block">
            {goalDiff > 0 ? 'Victoire' : goalDiff < 0 ? 'Déficit' : 'Égalité'}
          </span>
        </div>
      </div>

      {/* Simple Recharts LineChart */}
      <div className="w-full h-64 sm:h-72 pt-2">
        <ResponsiveContainer width="100%" height="100%">
          <LineChart data={chartData} margin={{ top: 15, right: 25, left: -15, bottom: 5 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" vertical={false} />
            <XAxis
              dataKey="name"
              tick={{ fontSize: 11, fontWeight: 700, fill: '#64748b' }}
              axisLine={{ stroke: '#cbd5e1' }}
              tickLine={false}
            />
            <YAxis
              allowDecimals={false}
              tick={{ fontSize: 11, fill: '#94a3b8' }}
              axisLine={{ stroke: '#cbd5e1' }}
              tickLine={false}
              domain={[0, 'auto']}
            />
            <Tooltip content={<CustomTooltip />} />
            <Legend
              verticalAlign="top"
              align="right"
              iconType="circle"
              wrapperStyle={{ fontSize: '11px', fontWeight: 'bold', paddingBottom: '12px' }}
              formatter={(val) => {
                if (val === 'teamScore') return `${currentTeamLabel} (${finalTeamScore})`;
                if (val === 'opponentScore') return `${opponentName} (${finalOpponentScore})`;
                return val;
              }}
            />
            <Line
              type="monotone"
              dataKey="teamScore"
              name="teamScore"
              stroke="#059669"
              strokeWidth={3}
              dot={{ r: 5, fill: '#059669', strokeWidth: 2, stroke: '#ffffff' }}
              activeDot={{ r: 7, strokeWidth: 0 }}
            />
            <Line
              type="monotone"
              dataKey="opponentScore"
              name="opponentScore"
              stroke="#e11d48"
              strokeWidth={3}
              strokeDasharray="4 4"
              dot={{ r: 5, fill: '#e11d48', strokeWidth: 2, stroke: '#ffffff' }}
              activeDot={{ r: 7, strokeWidth: 0 }}
            />
          </LineChart>
        </ResponsiveContainer>
      </div>

      {/* Period-by-Period Quick Recap Badges */}
      <div className="pt-3 border-t border-slate-100 flex flex-wrap items-center justify-between gap-2 text-xs">
        <div className="flex flex-wrap items-center gap-1.5">
          <span className="text-[11px] font-semibold text-slate-500 mr-1">Scores par période :</span>
          {rawPeriodStats.map((p) => {
            const isLead = p.periodTeam > p.periodOpp;
            const isDraw = p.periodTeam === p.periodOpp;
            return (
              <span
                key={p.periodIndex}
                className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-md font-mono text-[11px] border ${
                  isLead
                    ? 'bg-emerald-50 text-emerald-800 border-emerald-200'
                    : isDraw
                    ? 'bg-slate-50 text-slate-700 border-slate-200'
                    : 'bg-rose-50 text-rose-800 border-rose-200'
                }`}
              >
                <span className="font-bold">{p.shortName}:</span>
                <span>{p.periodTeam}-{p.periodOpp}</span>
              </span>
            );
          })}
        </div>

        <div className="text-[11px] text-slate-400 italic">
          Mis à jour automatiquement avec la feuille de match
        </div>
      </div>
    </div>
  );
};
