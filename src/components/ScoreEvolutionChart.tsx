import React, { useState } from 'react';
import { MatchData } from '../types';
import {
  ResponsiveContainer,
  LineChart,
  Line,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ReferenceLine
} from 'recharts';
import { TrendingUp, BarChart2, Award, Shield, Swords } from 'lucide-react';

interface ScoreEvolutionChartProps {
  matchData: MatchData;
}

export const ScoreEvolutionChart: React.FC<ScoreEvolutionChartProps> = ({ matchData }) => {
  const [chartType, setChartType] = useState<'cumulative' | 'period'>('cumulative');

  // Compute period data & cumulative scores
  let runningFE12 = 0;
  let runningOpponent = 0;

  const chartData = matchData.periods.map((period, index) => {
    const s1 = parseInt(period.team1.scoreMatch, 10);
    const o1 = parseInt(period.team1.scoreOpponent, 10);
    const s2 = parseInt(period.team2.scoreMatch, 10);
    const o2 = parseInt(period.team2.scoreOpponent, 10);

    const t1Score = isNaN(s1) ? 0 : s1;
    const t1Opp = isNaN(o1) ? 0 : o1;
    const t2Score = isNaN(s2) ? 0 : s2;
    const t2Opp = isNaN(o2) ? 0 : o2;

    const periodFE12 = t1Score + t2Score;
    const periodOpponent = t1Opp + t2Opp;

    runningFE12 += periodFE12;
    runningOpponent += periodOpponent;

    return {
      name: `P${index + 1}`,
      periodName: period.title || `Période ${index + 1}`,
      periodFE12,
      periodOpponent,
      cumulativeFE12: runningFE12,
      cumulativeOpponent: runningOpponent,
      team1Score: t1Score,
      team1Opp: t1Opp,
      team2Score: t2Score,
      team2Opp: t2Opp,
      team1Name: period.team1.teamName || 'Équipe 1',
      team2Name: period.team2.teamName || 'Équipe 2',
    };
  });

  const totalFE12 = runningFE12;
  const totalOpponent = runningOpponent;
  const goalDiff = totalFE12 - totalOpponent;

  // Custom Tooltip component for recharts
  const CustomTooltip = ({ active, payload, label }: any) => {
    if (active && payload && payload.length) {
      const data = payload[0].payload;
      return (
        <div className="bg-slate-900/95 text-white p-3 rounded-xl shadow-xl border border-slate-700 text-xs backdrop-blur-xs min-w-[190px]">
          <div className="font-extrabold text-sm text-slate-100 border-b border-slate-700 pb-1.5 mb-2 flex items-center justify-between">
            <span>{data.periodName}</span>
            <span className="text-[10px] font-bold px-1.5 py-0.5 rounded bg-slate-800 text-slate-300">
              {chartType === 'cumulative' ? 'Score Cumulé' : 'Buts Période'}
            </span>
          </div>

          <div className="space-y-1.5">
            <div className="flex items-center justify-between font-bold text-emerald-400">
              <span className="flex items-center gap-1.5">
                <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 inline-block" />
                Total FE12 :
              </span>
              <span className="text-sm">
                {chartType === 'cumulative' ? data.cumulativeFE12 : data.periodFE12} buts
              </span>
            </div>

            <div className="flex items-center justify-between font-bold text-rose-400">
              <span className="flex items-center gap-1.5">
                <span className="w-2.5 h-2.5 rounded-full bg-rose-500 inline-block" />
                {matchData.opponent || 'Adversaire'} :
              </span>
              <span className="text-sm">
                {chartType === 'cumulative' ? data.cumulativeOpponent : data.periodOpponent} buts
              </span>
            </div>
          </div>

          <div className="mt-2.5 pt-2 border-t border-slate-700/80 text-[11px] text-slate-300 space-y-0.5">
            <div className="text-slate-400 font-semibold text-[10px] uppercase tracking-wider">Détail par sous-équipe :</div>
            <div className="flex justify-between">
              <span>{data.team1Name} :</span>
              <span className="font-bold text-yellow-300">{data.team1Score} à {data.team1Opp}</span>
            </div>
            <div className="flex justify-between">
              <span>{data.team2Name} :</span>
              <span className="font-bold text-red-300">{data.team2Score} à {data.team2Opp}</span>
            </div>
          </div>
        </div>
      );
    }
    return null;
  };

  return (
    <div className="bg-white rounded-2xl border border-slate-200 p-4 sm:p-5 shadow-xs space-y-4">
      {/* Header & Controls */}
      <div className="flex flex-wrap items-center justify-between gap-3 pb-3 border-b border-slate-100">
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-xl bg-indigo-50 text-indigo-700 border border-indigo-200/60 flex items-center justify-center font-bold">
            <TrendingUp className="w-4 h-4" />
          </div>
          <div>
            <h3 className="text-sm font-extrabold text-slate-900 flex items-center gap-2">
              <span>Évolution du Score ({matchData.periods.length} Périodes)</span>
            </h3>
            <p className="text-[11px] text-slate-500">
              Progression en temps réel : FE12 ({totalFE12}) vs {matchData.opponent || 'Adversaire'} ({totalOpponent})
            </p>
          </div>
        </div>

        {/* Chart View Toggle */}
        <div className="flex items-center bg-slate-100 p-1 rounded-xl border border-slate-200 text-xs">
          <button
            type="button"
            onClick={() => setChartType('cumulative')}
            className={`flex items-center gap-1 px-2.5 py-1 rounded-lg font-bold transition-all ${
              chartType === 'cumulative'
                ? 'bg-white text-indigo-700 shadow-2xs'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            <TrendingUp className="w-3.5 h-3.5" />
            <span>Score Cumulé</span>
          </button>
          <button
            type="button"
            onClick={() => setChartType('period')}
            className={`flex items-center gap-1 px-2.5 py-1 rounded-lg font-bold transition-all ${
              chartType === 'period'
                ? 'bg-white text-indigo-700 shadow-2xs'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            <BarChart2 className="w-3.5 h-3.5" />
            <span>Buts par Période</span>
          </button>
        </div>
      </div>

      {/* Mini KPI summary banners */}
      <div className="grid grid-cols-3 gap-2 text-center text-xs">
        <div className="bg-emerald-50/70 border border-emerald-200/80 rounded-xl p-2">
          <span className="text-[10px] font-bold uppercase tracking-wider text-emerald-800 block">Total FE12</span>
          <span className="text-lg font-black text-emerald-950">{totalFE12}</span>
          <span className="text-[10px] text-emerald-700 block">buts marqués</span>
        </div>

        <div className="bg-rose-50/70 border border-rose-200/80 rounded-xl p-2">
          <span className="text-[10px] font-bold uppercase tracking-wider text-rose-800 block truncate">
            {matchData.opponent || 'Adversaire'}
          </span>
          <span className="text-lg font-black text-rose-950">{totalOpponent}</span>
          <span className="text-[10px] text-rose-700 block">buts concédés</span>
        </div>

        <div className="bg-slate-50 border border-slate-200 rounded-xl p-2">
          <span className="text-[10px] font-bold uppercase tracking-wider text-slate-600 block">Différentiel</span>
          <span className={`text-lg font-black ${
            goalDiff > 0 ? 'text-emerald-700' : goalDiff < 0 ? 'text-rose-700' : 'text-slate-700'
          }`}>
            {goalDiff > 0 ? `+${goalDiff}` : goalDiff}
          </span>
          <span className="text-[10px] text-slate-500 block">
            {goalDiff > 0 ? 'Avantage FE12' : goalDiff < 0 ? 'Déficit' : 'Égalité'}
          </span>
        </div>
      </div>

      {/* Recharts Chart Container */}
      <div className="w-full h-56 pt-2">
        <ResponsiveContainer width="100%" height="100%">
          {chartType === 'cumulative' ? (
            <LineChart
              data={chartData}
              margin={{ top: 10, right: 20, left: -10, bottom: 5 }}
            >
              <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" vertical={false} />
              <XAxis
                dataKey="name"
                tick={{ fontSize: 12, fontWeight: 700, fill: '#64748b' }}
                axisLine={{ stroke: '#cbd5e1' }}
                tickLine={false}
              />
              <YAxis
                allowDecimals={false}
                tick={{ fontSize: 11, fill: '#94a3b8' }}
                axisLine={{ stroke: '#cbd5e1' }}
                tickLine={false}
              />
              <Tooltip content={<CustomTooltip />} />
              <Legend
                verticalAlign="top"
                align="right"
                iconType="circle"
                wrapperStyle={{ fontSize: '11px', fontWeight: 'bold', paddingBottom: '10px' }}
                formatter={(value) => {
                  if (value === 'cumulativeFE12') return 'FE12 (Cumulé)';
                  if (value === 'cumulativeOpponent') return `${matchData.opponent || 'Adversaire'} (Cumulé)`;
                  return value;
                }}
              />
              <Line
                type="monotone"
                dataKey="cumulativeFE12"
                name="cumulativeFE12"
                stroke="#059669"
                strokeWidth={3}
                dot={{ r: 5, fill: '#059669', strokeWidth: 2, stroke: '#ffffff' }}
                activeDot={{ r: 7, strokeWidth: 0 }}
              />
              <Line
                type="monotone"
                dataKey="cumulativeOpponent"
                name="cumulativeOpponent"
                stroke="#e11d48"
                strokeWidth={3}
                strokeDasharray="4 4"
                dot={{ r: 5, fill: '#e11d48', strokeWidth: 2, stroke: '#ffffff' }}
                activeDot={{ r: 7, strokeWidth: 0 }}
              />
            </LineChart>
          ) : (
            <BarChart
              data={chartData}
              margin={{ top: 10, right: 20, left: -10, bottom: 5 }}
            >
              <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" vertical={false} />
              <XAxis
                dataKey="name"
                tick={{ fontSize: 12, fontWeight: 700, fill: '#64748b' }}
                axisLine={{ stroke: '#cbd5e1' }}
                tickLine={false}
              />
              <YAxis
                allowDecimals={false}
                tick={{ fontSize: 11, fill: '#94a3b8' }}
                axisLine={{ stroke: '#cbd5e1' }}
                tickLine={false}
              />
              <Tooltip content={<CustomTooltip />} />
              <Legend
                verticalAlign="top"
                align="right"
                iconType="rect"
                wrapperStyle={{ fontSize: '11px', fontWeight: 'bold', paddingBottom: '10px' }}
                formatter={(value) => {
                  if (value === 'periodFE12') return 'FE12 (Buts Période)';
                  if (value === 'periodOpponent') return `${matchData.opponent || 'Adversaire'} (Buts Période)`;
                  return value;
                }}
              />
              <Bar
                dataKey="periodFE12"
                name="periodFE12"
                fill="#10b981"
                radius={[6, 6, 0, 0]}
              />
              <Bar
                dataKey="periodOpponent"
                name="periodOpponent"
                fill="#f43f5e"
                radius={[6, 6, 0, 0]}
              />
            </BarChart>
          )}
        </ResponsiveContainer>
      </div>

      <div className="flex items-center justify-between text-[11px] text-slate-500 pt-2 border-t border-slate-100">
        <div className="flex items-center gap-3">
          <span className="flex items-center gap-1">
            <span className="w-2.5 h-2.5 rounded-full bg-emerald-500" /> Total FE12 (Éq. 1 + Éq. 2)
          </span>
          <span className="flex items-center gap-1">
            <span className="w-2.5 h-2.5 rounded-full bg-rose-500" /> {matchData.opponent || 'Adversaire'}
          </span>
        </div>
        <span className="italic text-slate-400">P1 à P{matchData.periods.length}</span>
      </div>
    </div>
  );
};
