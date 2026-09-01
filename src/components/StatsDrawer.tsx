import React, { useState } from 'react';
import { MatchData, ScheduledMatch } from '../types';
import { calculatePlayerStats, PlayerStats, loadMatchSchedule, saveMatchSchedule } from '../utils/storage';
import { exportMatchToExcel } from '../utils/excelExport';
import { exportMatchToPdf } from '../utils/pdfExport';
import { ScoreEvolutionChart } from './ScoreEvolutionChart';
import { 
  BarChart3, 
  X, 
  ShieldCheck, 
  Star, 
  Trophy, 
  TrendingUp, 
  Award, 
  Users, 
  Clock, 
  MessageSquare,
  Sparkles,
  ArrowUpDown,
  Filter,
  CheckCircle2,
  FileSpreadsheet,
  FileText,
  Loader2,
  Calendar,
  CalendarDays,
  Plus,
  MapPin,
  ArrowRight,
  History,
  Trash2
} from 'lucide-react';

interface StatsDrawerProps {
  isOpen: boolean;
  onClose: () => void;
  matchData: MatchData;
  onOpenCalendarModal?: () => void;
  onLoadMatchIntoSheet?: (loadedMatch: MatchData) => void;
  onSetMatchDateAndOpponent?: (date: string, opponent: string, title?: string) => void;
}

type TabType = 'evaluations' | 'playing_time' | 'periods' | 'calendar';
type SortField = 'rating' | 'minutes' | 'name';

export const StatsDrawer: React.FC<StatsDrawerProps> = ({
  isOpen,
  onClose,
  matchData,
  onOpenCalendarModal,
  onLoadMatchIntoSheet,
  onSetMatchDateAndOpponent,
}) => {
  const [activeTab, setActiveTab] = useState<TabType>('evaluations');
  const [sortField, setSortField] = useState<SortField>('rating');
  const [sortOrder, setSortOrder] = useState<'desc' | 'asc'>('desc');
  const [filterOnlyEvaluated, setFilterOnlyEvaluated] = useState(false);
  const [isExportingPdf, setIsExportingPdf] = useState(false);
  const [isExportingExcel, setIsExportingExcel] = useState(false);
  const [schedule, setSchedule] = useState<ScheduledMatch[]>(() => loadMatchSchedule());

  const handleExportPdf = async () => {
    setIsExportingPdf(true);
    try {
      await exportMatchToPdf(matchData);
    } catch (err) {
      console.error(err);
    } finally {
      setIsExportingPdf(false);
    }
  };

  const handleExportExcel = () => {
    setIsExportingExcel(true);
    try {
      exportMatchToExcel(matchData);
    } catch (err) {
      console.error(err);
      alert('Erreur lors de l\'export Excel');
    } finally {
      setIsExportingExcel(false);
    }
  };

  if (!isOpen) return null;

  const stats = calculatePlayerStats(matchData);
  const totalMatchMinutes = matchData.periods.reduce((acc, p) => acc + (p.durationMinutes || 15), 0);

  // Global rating metrics calculation
  const allRatings: number[] = [];
  const team1Ratings: number[] = [];
  const team2Ratings: number[] = [];
  const ratingsDistribution: Record<number, number> = { 1: 0, 2: 0, 3: 0, 4: 0 };
  const positionRatings: Record<string, number[]> = {
    Gardien: [],
    Défenseur: [],
    Milieu: [],
    Couloir: [],
    Attaquant: [],
  };

  stats.forEach(s => {
    s.evaluations.forEach(ev => {
      if (typeof ev.rating === 'number' && ev.rating >= 1 && ev.rating <= 4) {
        allRatings.push(ev.rating);
        ratingsDistribution[ev.rating] = (ratingsDistribution[ev.rating] || 0) + 1;
        if (ev.team === 'team1') team1Ratings.push(ev.rating);
        if (ev.team === 'team2') team2Ratings.push(ev.rating);
        if (positionRatings[ev.position]) {
          positionRatings[ev.position].push(ev.rating);
        }
      }
    });
  });

  const overallAverageRating = allRatings.length > 0
    ? (allRatings.reduce((a, b) => a + b, 0) / allRatings.length).toFixed(1)
    : null;

  const team1Average = team1Ratings.length > 0
    ? (team1Ratings.reduce((a, b) => a + b, 0) / team1Ratings.length).toFixed(1)
    : null;

  const team2Average = team2Ratings.length > 0
    ? (team2Ratings.reduce((a, b) => a + b, 0) / team2Ratings.length).toFixed(1)
    : null;

  // Sorting stats
  const sortedStats = [...stats].filter(s => {
    if (filterOnlyEvaluated) return s.totalRatingsCount > 0;
    return true;
  }).sort((a, b) => {
    let comparison = 0;
    if (sortField === 'rating') {
      const rateA = a.averageRating !== null ? a.averageRating : -1;
      const rateB = b.averageRating !== null ? b.averageRating : -1;
      comparison = rateB - rateA;
      if (comparison === 0) comparison = b.totalMinutesPlayed - a.totalMinutesPlayed;
    } else if (sortField === 'minutes') {
      comparison = b.totalMinutesPlayed - a.totalMinutesPlayed;
      if (comparison === 0) comparison = (b.averageRating || 0) - (a.averageRating || 0);
    } else if (sortField === 'name') {
      comparison = a.player.name.localeCompare(b.player.name);
    }
    return sortOrder === 'asc' ? -comparison : comparison;
  });

  // Top performers
  const topPlayers = [...stats]
    .filter(s => s.averageRating !== null && s.totalRatingsCount >= 1)
    .sort((a, b) => (b.averageRating || 0) - (a.averageRating || 0))
    .slice(0, 3);

  const getRatingBadge = (rating: number | null | undefined) => {
    if (rating === null || rating === undefined) {
      return (
        <span className="text-slate-400 text-xs italic">Non évalué</span>
      );
    }
    let bg = 'bg-emerald-100 text-emerald-800 border-emerald-300';
    if (rating >= 3.6) bg = 'bg-emerald-600 text-white font-extrabold shadow-xs';
    else if (rating >= 2.8) bg = 'bg-blue-100 text-blue-900 border border-blue-300 font-bold';
    else if (rating >= 1.8) bg = 'bg-amber-100 text-amber-900 border border-amber-300 font-bold';
    else bg = 'bg-rose-100 text-rose-900 border border-rose-300 font-bold';

    return (
      <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs ${bg}`}>
        <Star className="w-3 h-3 fill-current" />
        <span>{typeof rating === 'number' ? rating.toFixed(1) : rating} / 4</span>
      </span>
    );
  };

  const getSingleRatingPill = (val?: number) => {
    if (!val) return <span className="text-slate-300 text-[10px]">-</span>;
    let color = 'bg-slate-200 text-slate-800';
    if (val === 4) color = 'bg-emerald-600 text-white font-bold';
    else if (val === 3) color = 'bg-blue-600 text-white font-bold';
    else if (val === 2) color = 'bg-amber-500 text-white font-bold';
    else if (val === 1) color = 'bg-rose-500 text-white font-bold';

    return (
      <span className={`w-5 h-5 rounded-full inline-flex items-center justify-center text-[10px] shadow-xs ${color}`}>
        {val}
      </span>
    );
  };

  return (
    <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl max-w-4xl w-full max-h-[92vh] flex flex-col shadow-2xl border border-slate-200 overflow-hidden">
        
        {/* Header */}
        <div className="px-6 py-4 bg-slate-50 border-b border-slate-200 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-indigo-600 text-white flex items-center justify-center font-bold shadow-sm">
              <BarChart3 className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-lg font-bold text-slate-900">Bilan des Matches & Évaluations</h2>
                <span className="bg-amber-100 text-amber-800 text-[11px] font-bold px-2 py-0.5 rounded-full flex items-center gap-1">
                  <Star className="w-3 h-3 fill-amber-500 text-amber-600" /> 1-4 Étoiles
                </span>
              </div>
              <p className="text-xs text-slate-500">
                Synthèse des performances et répartition du temps de jeu sur {matchData.periods.length} périodes
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            {/* Export Excel */}
            <button
              onClick={handleExportExcel}
              disabled={isExportingExcel}
              className="flex items-center gap-1 px-2.5 py-1.5 text-xs font-semibold text-emerald-800 bg-emerald-100 hover:bg-emerald-200 border border-emerald-300 rounded-lg transition-all"
              title="Exporter les statistiques et bilans en fichier Excel (.xlsx)"
            >
              {isExportingExcel ? (
                <Loader2 className="w-3.5 h-3.5 animate-spin" />
              ) : (
                <FileSpreadsheet className="w-3.5 h-3.5 text-emerald-700" />
              )}
              <span>Excel (.xlsx)</span>
            </button>

            {/* Export PDF */}
            <button
              onClick={handleExportPdf}
              disabled={isExportingPdf}
              className="flex items-center gap-1 px-2.5 py-1.5 text-xs font-semibold text-rose-800 bg-rose-100 hover:bg-rose-200 border border-rose-300 rounded-lg transition-all"
              title="Exporter la feuille de match en format PDF officiel"
            >
              {isExportingPdf ? (
                <Loader2 className="w-3.5 h-3.5 animate-spin" />
              ) : (
                <FileText className="w-3.5 h-3.5 text-rose-700" />
              )}
              <span>PDF</span>
            </button>

            <button
              onClick={onClose}
              className="p-1.5 text-slate-400 hover:text-slate-700 hover:bg-slate-200 rounded-lg transition-colors ml-1"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Tab Navigation */}
        <div className="flex border-b border-slate-200 px-6 bg-slate-50/50">
          <button
            onClick={() => setActiveTab('evaluations')}
            className={`py-3 px-4 text-xs font-bold border-b-2 flex items-center gap-2 transition-colors ${
              activeTab === 'evaluations'
                ? 'border-indigo-600 text-indigo-600'
                : 'border-transparent text-slate-500 hover:text-slate-800'
            }`}
          >
            <Star className="w-4 h-4 text-amber-500 fill-amber-400" />
            <span>Bilan des Évaluations (1-4)</span>
          </button>
          <button
            onClick={() => setActiveTab('playing_time')}
            className={`py-3 px-4 text-xs font-bold border-b-2 flex items-center gap-2 transition-colors ${
              activeTab === 'playing_time'
                ? 'border-indigo-600 text-indigo-600'
                : 'border-transparent text-slate-500 hover:text-slate-800'
            }`}
          >
            <Clock className="w-4 h-4 text-emerald-600" />
            <span>Temps de Jeu & Équité Footeco</span>
          </button>
          <button
            onClick={() => setActiveTab('periods')}
            className={`py-3 px-4 text-xs font-bold border-b-2 flex items-center gap-2 transition-colors ${
              activeTab === 'periods'
                ? 'border-indigo-600 text-indigo-600'
                : 'border-transparent text-slate-500 hover:text-slate-800'
            }`}
          >
            <TrendingUp className="w-4 h-4 text-blue-600" />
            <span>Scores & Évolution ({matchData.periods.length} Périodes)</span>
          </button>
          <button
            onClick={() => setActiveTab('calendar')}
            className={`py-3 px-4 text-xs font-bold border-b-2 flex items-center gap-2 transition-colors ${
              activeTab === 'calendar'
                ? 'border-indigo-600 text-indigo-600'
                : 'border-transparent text-slate-500 hover:text-slate-800'
            }`}
          >
            <Calendar className="w-4 h-4 text-emerald-600" />
            <span>Calendrier & Historique ({schedule.length})</span>
          </button>
        </div>

        {/* Scrollable Content */}
        <div className="p-6 overflow-y-auto space-y-6 flex-1 bg-slate-50/30">
          
          {/* TAB 1: EVALUATIONS BREAKDOWN */}
          {activeTab === 'evaluations' && (
            <div className="space-y-6">
              
              {/* Summary KPI Cards */}
              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-3">
                
                {/* Overall Average */}
                <div className="bg-white p-3.5 rounded-xl border border-slate-200 shadow-xs flex flex-col justify-between">
                  <div className="flex items-center justify-between text-slate-500 text-xs font-semibold">
                    <span>Note moyenne générale</span>
                    <Award className="w-4 h-4 text-amber-500" />
                  </div>
                  <div className="mt-2 flex items-baseline gap-2">
                    <span className="text-2xl font-extrabold text-slate-900">
                      {overallAverageRating ? `${overallAverageRating}/4` : '-'}
                    </span>
                    <span className="text-xs text-slate-500">
                      ({allRatings.length} notes)
                    </span>
                  </div>
                  <div className="mt-1 flex gap-0.5 text-amber-400">
                    {[1, 2, 3, 4].map(star => (
                      <Star 
                        key={star} 
                        className={`w-3.5 h-3.5 ${
                          overallAverageRating && Number(overallAverageRating) >= star 
                            ? 'fill-amber-400 text-amber-500' 
                            : 'text-slate-300'
                        }`} 
                      />
                    ))}
                  </div>
                </div>

                {/* Team 1 vs Team 2 Average */}
                <div className="bg-white p-3.5 rounded-xl border border-slate-200 shadow-xs flex flex-col justify-between">
                  <div className="text-slate-500 text-xs font-semibold">
                    Moyenne par Équipe
                  </div>
                  <div className="mt-2 space-y-1 text-xs">
                    <div className="flex items-center justify-between">
                      <span className="font-bold text-yellow-700 bg-yellow-100 px-1.5 py-0.2 rounded">
                        Équipe 1 (Jaune)
                      </span>
                      <span className="font-extrabold text-slate-900">
                        {team1Average ? `${team1Average}/4` : '-'}
                      </span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="font-bold text-red-700 bg-red-100 px-1.5 py-0.2 rounded">
                        Équipe 2 (Rouge)
                      </span>
                      <span className="font-extrabold text-slate-900">
                        {team2Average ? `${team2Average}/4` : '-'}
                      </span>
                    </div>
                  </div>
                </div>

                {/* Rating Distribution */}
                <div className="bg-white p-3.5 rounded-xl border border-slate-200 shadow-xs">
                  <div className="text-slate-500 text-xs font-semibold mb-1.5">
                    Répartition des notes
                  </div>
                  <div className="space-y-1 text-[10px]">
                    {[4, 3, 2, 1].map(star => {
                      const count = ratingsDistribution[star] || 0;
                      const percent = allRatings.length > 0 ? Math.round((count / allRatings.length) * 100) : 0;
                      return (
                        <div key={star} className="flex items-center gap-1.5">
                          <span className="w-4 font-bold text-slate-700">{star}★</span>
                          <div className="flex-1 bg-slate-100 h-1.5 rounded-full overflow-hidden">
                            <div 
                              className={`h-full ${
                                star === 4 ? 'bg-emerald-500' :
                                star === 3 ? 'bg-blue-400' :
                                star === 2 ? 'bg-amber-400' : 'bg-rose-400'
                              }`} 
                              style={{ width: `${percent}%` }}
                            />
                          </div>
                          <span className="text-slate-400 w-6 text-right">{count}</span>
                        </div>
                      );
                    })}
                  </div>
                </div>

                {/* Top Performers Highlight */}
                <div className="bg-gradient-to-br from-indigo-50 to-emerald-50 p-3.5 rounded-xl border border-indigo-200 shadow-xs">
                  <div className="text-indigo-900 text-xs font-bold flex items-center gap-1 mb-1.5">
                    <Sparkles className="w-3.5 h-3.5 text-amber-500" />
                    <span>Top Évaluations</span>
                  </div>
                  {topPlayers.length > 0 ? (
                    <div className="space-y-1">
                      {topPlayers.map((tp, idx) => (
                        <div key={tp.player.id} className="flex items-center justify-between text-xs">
                          <span className="font-semibold text-slate-800 truncate max-w-[110px]">
                            {idx + 1}. {tp.player.name}
                          </span>
                          <span className="font-bold text-emerald-700 bg-emerald-100 px-1 rounded text-[11px]">
                            ⭐ {tp.averageRating}/4
                          </span>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <p className="text-[11px] text-slate-400 italic">Aucune note saisie pour l'instant.</p>
                  )}
                </div>

              </div>

              {/* Table Controls (Sorting & Filters) */}
              <div className="flex flex-wrap items-center justify-between gap-3 bg-white p-3 rounded-xl border border-slate-200">
                <div className="flex items-center gap-2">
                  <span className="text-xs font-bold text-slate-600 flex items-center gap-1">
                    <ArrowUpDown className="w-3.5 h-3.5 text-slate-400" /> Trier par :
                  </span>
                  <div className="flex items-center gap-1">
                    <button
                      onClick={() => {
                        if (sortField === 'rating') setSortOrder(prev => prev === 'desc' ? 'asc' : 'desc');
                        else { setSortField('rating'); setSortOrder('desc'); }
                      }}
                      className={`px-2.5 py-1 rounded-lg text-xs font-semibold transition-colors ${
                        sortField === 'rating' 
                          ? 'bg-indigo-600 text-white shadow-xs' 
                          : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                      }`}
                    >
                      Note moyenne {sortField === 'rating' && (sortOrder === 'desc' ? '↓' : '↑')}
                    </button>
                    <button
                      onClick={() => {
                        if (sortField === 'minutes') setSortOrder(prev => prev === 'desc' ? 'asc' : 'desc');
                        else { setSortField('minutes'); setSortOrder('desc'); }
                      }}
                      className={`px-2.5 py-1 rounded-lg text-xs font-semibold transition-colors ${
                        sortField === 'minutes' 
                          ? 'bg-indigo-600 text-white shadow-xs' 
                          : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                      }`}
                    >
                      Temps de jeu {sortField === 'minutes' && (sortOrder === 'desc' ? '↓' : '↑')}
                    </button>
                    <button
                      onClick={() => {
                        if (sortField === 'name') setSortOrder(prev => prev === 'desc' ? 'asc' : 'desc');
                        else { setSortField('name'); setSortOrder('asc'); }
                      }}
                      className={`px-2.5 py-1 rounded-lg text-xs font-semibold transition-colors ${
                        sortField === 'name' 
                          ? 'bg-indigo-600 text-white shadow-xs' 
                          : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                      }`}
                    >
                      Nom {sortField === 'name' && (sortOrder === 'desc' ? '↓' : '↑')}
                    </button>
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  <label className="flex items-center gap-1.5 text-xs text-slate-600 cursor-pointer select-none">
                    <input
                      type="checkbox"
                      checked={filterOnlyEvaluated}
                      onChange={(e) => setFilterOnlyEvaluated(e.target.checked)}
                      className="rounded text-indigo-600 focus:ring-indigo-500 w-3.5 h-3.5"
                    />
                    <span>Joueurs notés uniquement ({allRatings.length > 0 ? stats.filter(s => s.totalRatingsCount > 0).length : 0})</span>
                  </label>
                </div>
              </div>

              {/* Detailed Evaluation Table */}
              <div className="bg-white rounded-xl border border-slate-200 overflow-hidden shadow-xs">
                <table className="w-full text-left text-sm border-collapse">
                  <thead className="bg-slate-50 border-b border-slate-200 text-[11px] font-bold text-slate-500 uppercase tracking-wider">
                    <tr>
                      <th className="py-3 px-3.5">Joueur</th>
                      <th className="py-3 px-3 text-center">Temps de jeu</th>
                      <th className="py-3 px-3 text-center">Notes par Match</th>
                      <th className="py-3 px-3.5 text-right">Note Moyenne</th>
                      <th className="py-3 px-3.5">Remarques & Observations</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {sortedStats.map((stat) => {
                      const notesList = stat.evaluations.filter(e => e.note && e.note.trim() !== '');

                      return (
                        <tr key={stat.player.id} className="hover:bg-slate-50/80 transition-colors">
                          
                          {/* Player Identity */}
                          <td className="py-3 px-3.5">
                            <div className="font-bold text-slate-900 flex items-center gap-2">
                              <span>{stat.player.name}</span>
                              {!stat.player.isPresent && (
                                <span className="text-[10px] bg-slate-200 text-slate-600 px-1.5 py-0.2 rounded font-normal">
                                  Absent
                                </span>
                              )}
                            </div>
                            {stat.positionsPlayed.length > 0 && (
                              <div className="text-[11px] text-slate-500 mt-0.5">
                                Postes : {stat.positionsPlayed.join(', ')}
                              </div>
                            )}
                          </td>

                          {/* Minutes */}
                          <td className="py-3 px-3 text-center">
                            <span className="font-bold text-slate-800 text-xs">
                              {stat.totalMinutesPlayed} min
                            </span>
                            <span className="text-[11px] text-slate-400 block">
                              ({stat.totalPeriodsStarted} tit. / {stat.totalPeriodsSubbed} remp.)
                            </span>
                          </td>

                          {/* Period-by-Period Ratings */}
                          <td className="py-3 px-3">
                            <div className="flex items-center justify-center gap-1.5 flex-wrap">
                              {matchData.periods.map((period) => {
                                const evalItem = stat.evaluations.find(e => e.periodId === period.id);
                                return (
                                  <div
                                    key={period.id}
                                    className="flex flex-col items-center bg-slate-50 border border-slate-200 rounded-lg p-1 min-w-[38px]"
                                    title={`${period.title} : ${evalItem?.isStarter ? 'Titulaire' : 'Remplaçant'} (${evalItem?.position || 'N/A'}) - Note : ${evalItem?.rating ? `${evalItem.rating}/4` : 'Non noté'}`}
                                  >
                                    <span className="text-[9px] font-bold text-slate-500 uppercase">
                                      P{period.periodNumber}
                                    </span>
                                    <div className="mt-0.5">
                                      {evalItem ? getSingleRatingPill(evalItem.rating) : <span className="text-slate-300 text-[10px]">-</span>}
                                    </div>
                                  </div>
                                );
                              })}
                            </div>
                          </td>

                          {/* Average Rating */}
                          <td className="py-3 px-3.5 text-right">
                            {getRatingBadge(stat.averageRating)}
                            {stat.totalRatingsCount > 0 && (
                              <div className="text-[10px] text-slate-400 mt-0.5">
                                sur {stat.totalRatingsCount} note{stat.totalRatingsCount > 1 ? 's' : ''}
                              </div>
                            )}
                          </td>

                          {/* Text Notes */}
                          <td className="py-3 px-3.5 max-w-xs text-xs text-slate-600">
                            {notesList.length > 0 ? (
                              <div className="space-y-1">
                                {notesList.map((n, i) => (
                                  <div key={i} className="bg-slate-100/90 rounded p-1.5 text-[11px] leading-tight text-slate-700">
                                    <span className="font-bold text-indigo-700 mr-1">P{n.periodNumber}:</span>
                                    <span>{n.note}</span>
                                  </div>
                                ))}
                              </div>
                            ) : (
                              <span className="text-slate-300 text-xs italic">Aucune remarque</span>
                            )}
                          </td>

                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>

            </div>
          )}

          {/* TAB 2: PLAYING TIME & FOOTECO FAIRNESS */}
          {activeTab === 'playing_time' && (
            <div className="space-y-5">
              <div className="bg-emerald-50 border border-emerald-200 rounded-xl p-3.5 flex items-start gap-3">
                <ShieldCheck className="w-5 h-5 text-emerald-600 shrink-0 mt-0.5" />
                <div className="text-xs text-emerald-900 leading-relaxed">
                  <strong>Principe Footeco FE12 :</strong> Tous les joueurs présents doivent bénéficier d'un temps de jeu équilibré et expérimenter différentes positions au cours des 4 périodes de 15 minutes.
                </div>
              </div>

              {/* Stats Table */}
              <div className="overflow-x-auto border border-slate-200 rounded-xl bg-white shadow-xs">
                <table className="w-full text-left text-sm">
                  <thead className="bg-slate-50 border-b border-slate-200 text-[11px] font-bold text-slate-500 uppercase tracking-wider">
                    <tr>
                      <th className="py-2.5 px-3">Joueur</th>
                      <th className="py-2.5 px-3">Positions occupées</th>
                      <th className="py-2.5 px-3 text-center">Périodes titulaire</th>
                      <th className="py-2.5 px-3 text-center">Remplaçant</th>
                      <th className="py-2.5 px-3">Temps de jeu</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {stats.map(({ player, totalMinutesPlayed, totalPeriodsStarted, totalPeriodsSubbed, positionsPlayed, periodsAsStarter }) => {
                      const percentage = totalMatchMinutes > 0 ? Math.min(100, Math.round((totalMinutesPlayed / totalMatchMinutes) * 100)) : 0;

                      return (
                        <tr key={player.id} className="hover:bg-slate-50/80 transition-colors">
                          <td className="py-2.5 px-3 font-semibold text-slate-900 flex items-center gap-2">
                            <span>{player.name}</span>
                            {!player.isPresent && (
                              <span className="text-[10px] bg-slate-200 text-slate-600 px-1.5 py-0.5 rounded font-normal">
                                Absent
                              </span>
                            )}
                          </td>

                          <td className="py-2.5 px-3 text-xs text-slate-600">
                            {positionsPlayed.length > 0 ? (
                              <div className="flex flex-wrap gap-1">
                                {positionsPlayed.map(pos => (
                                  <span key={pos} className="bg-slate-100 text-slate-700 px-1.5 py-0.5 rounded text-[11px]">
                                    {pos}
                                  </span>
                                ))}
                              </div>
                            ) : (
                              <span className="text-slate-400 italic text-xs">Aucune</span>
                            )}
                          </td>

                          <td className="py-2.5 px-3 text-center text-xs">
                            <span className="font-bold text-slate-900">{totalPeriodsStarted}</span>
                            {periodsAsStarter.length > 0 && (
                              <span className="text-[11px] text-slate-400 block">
                                (P{periodsAsStarter.join(', P')})
                              </span>
                            )}
                          </td>

                          <td className="py-2.5 px-3 text-center text-xs font-medium text-slate-600">
                            {totalPeriodsSubbed}
                          </td>

                          <td className="py-2.5 px-3">
                            <div className="w-36">
                              <div className="flex items-center justify-between text-xs font-bold mb-1">
                                <span className="text-slate-900">{totalMinutesPlayed} min</span>
                                <span className="text-slate-500">{percentage}%</span>
                              </div>
                              <div className="w-full bg-slate-200 rounded-full h-2 overflow-hidden">
                                <div
                                  className={`h-full rounded-full transition-all duration-300 ${
                                    percentage >= 75
                                      ? 'bg-emerald-500'
                                      : percentage >= 50
                                      ? 'bg-blue-500'
                                      : percentage >= 25
                                      ? 'bg-amber-500'
                                      : 'bg-rose-400'
                                  }`}
                                  style={{ width: `${percentage}%` }}
                                />
                              </div>
                            </div>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* TAB 3: PERIOD BY PERIOD SUMMARY & SCORE EVOLUTION */}
          {activeTab === 'periods' && (
            <div className="space-y-6">
              {/* Recharts Score Evolution Chart */}
              <ScoreEvolutionChart matchData={matchData} />

              {/* Period Cards Grid */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {matchData.periods.map((period) => {
                const pRatings: number[] = [];
                [...period.team1.titulaires, ...period.team1.remplacants, ...period.team2.titulaires, ...period.team2.remplacants].forEach(slot => {
                  if (typeof slot.rating === 'number' && slot.rating >= 1 && slot.rating <= 5) {
                    pRatings.push(slot.rating);
                  }
                });

                const pAvg = pRatings.length > 0
                  ? (pRatings.reduce((a, b) => a + b, 0) / pRatings.length).toFixed(1)
                  : null;

                return (
                  <div key={period.id} className="bg-white rounded-xl border border-slate-200 p-4 shadow-xs flex flex-col justify-between">
                    <div>
                      <div className="flex items-center justify-between border-b border-slate-100 pb-2 mb-3">
                        <div className="flex items-center gap-2">
                          <span className="font-bold text-slate-900 text-sm">{period.title}</span>
                          <span className="text-xs bg-slate-100 text-slate-600 px-2 py-0.5 rounded font-medium">
                            {period.durationMinutes || 15} min
                          </span>
                        </div>
                        <div className="flex items-center gap-1">
                          {pAvg ? (
                            <span className="bg-emerald-50 text-emerald-800 border border-emerald-200 px-2 py-0.5 rounded-full text-xs font-bold flex items-center gap-1">
                              <Star className="w-3 h-3 fill-emerald-500 text-emerald-600" />
                              Moyenne : {pAvg}/4
                            </span>
                          ) : (
                            <span className="text-slate-400 text-xs italic">Non évalué</span>
                          )}
                        </div>
                      </div>

                      {/* Scores */}
                      <div className="grid grid-cols-2 gap-2 mb-3 text-xs">
                        <div className="bg-yellow-50/80 border border-yellow-200 rounded-lg p-2">
                          <div className="font-bold text-yellow-900">{period.team1.teamName || 'Équipe 1'}</div>
                          <div className="text-slate-700 mt-1">
                            Score : <strong>{period.team1.scoreMatch || '0'} à {period.team1.scoreOpponent || '0'}</strong>
                          </div>
                          {period.team1.result && (
                            <span className={`inline-block mt-1 px-1.5 py-0.2 text-[10px] font-bold rounded ${
                              period.team1.result === 'Victoire' ? 'bg-emerald-600 text-white' :
                              period.team1.result === 'Nul' ? 'bg-amber-500 text-white' : 'bg-rose-600 text-white'
                            }`}>
                              {period.team1.result} ({period.team1.points || '0'} pts)
                            </span>
                          )}
                        </div>

                        <div className="bg-red-50/80 border border-red-200 rounded-lg p-2">
                          <div className="font-bold text-red-900">{period.team2.teamName || 'Équipe 2'}</div>
                          <div className="text-slate-700 mt-1">
                            Score : <strong>{period.team2.scoreMatch || '0'} à {period.team2.scoreOpponent || '0'}</strong>
                          </div>
                          {period.team2.result && (
                            <span className={`inline-block mt-1 px-1.5 py-0.2 text-[10px] font-bold rounded ${
                              period.team2.result === 'Victoire' ? 'bg-emerald-600 text-white' :
                              period.team2.result === 'Nul' ? 'bg-amber-500 text-white' : 'bg-rose-600 text-white'
                            }`}>
                              {period.team2.result} ({period.team2.points || '0'} pts)
                            </span>
                          )}
                        </div>
                      </div>

                      {/* Period Notes if any */}
                      {period.notes && (
                        <div className="bg-slate-50 border border-slate-200 rounded-lg p-2 text-xs text-slate-700 mb-2">
                          <span className="font-bold block text-slate-800 mb-0.5">Observations période :</span>
                          <p className="italic text-slate-600">{period.notes}</p>
                        </div>
                      )}
                    </div>

                    <div className="text-[11px] text-slate-400 pt-2 border-t border-slate-100 flex items-center justify-between">
                      <span>{pRatings.length} joueur{pRatings.length > 1 ? 's' : ''} noté{pRatings.length > 1 ? 's' : ''}</span>
                      <span>Shootout Eq1: {period.team1.shootoutScore || '0'}-{period.team1.shootoutOpponent || '0'} | Eq2: {period.team2.shootoutScore || '0'}-{period.team2.shootoutOpponent || '0'}</span>
                    </div>
                  </div>
                );
              })}
              </div>
            </div>
          )}

          {/* TAB 4: CALENDAR & MATCH HISTORY */}
          {activeTab === 'calendar' && (
            <div className="space-y-4">
              <div className="bg-emerald-50/70 border border-emerald-200 rounded-2xl p-4 flex flex-wrap items-center justify-between gap-3">
                <div>
                  <h4 className="text-sm font-bold text-emerald-950 flex items-center gap-2">
                    <CalendarDays className="w-4 h-4 text-emerald-700" />
                    <span>Planification & Historique des Rencontres FE12</span>
                  </h4>
                  <p className="text-xs text-emerald-800 mt-0.5">
                    Gérez les dates de vos matches, planifiez vos futures rencontres et consultez l'historique complet.
                  </p>
                </div>
                {onOpenCalendarModal && (
                  <button
                    onClick={onOpenCalendarModal}
                    className="flex items-center gap-1.5 px-3.5 py-1.5 text-xs font-bold text-slate-950 bg-emerald-400 hover:bg-emerald-500 rounded-xl shadow-xs transition-colors"
                  >
                    <Calendar className="w-3.5 h-3.5" />
                    <span>Ouvrir le Calendrier Complet</span>
                  </button>
                )}
              </div>

              {/* Quick schedule overview */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {/* Upcoming */}
                <div className="bg-white rounded-2xl border border-slate-200 p-4 space-y-3">
                  <div className="flex items-center justify-between pb-2 border-b border-slate-100">
                    <span className="text-xs font-bold text-slate-800 flex items-center gap-1.5">
                      <Clock className="w-3.5 h-3.5 text-blue-600" />
                      <span>Prochains Matchs ({schedule.filter(m => m.status === 'scheduled').length})</span>
                    </span>
                  </div>

                  <div className="space-y-2">
                    {schedule.filter(m => m.status === 'scheduled').length === 0 ? (
                      <p className="text-xs text-slate-400 py-3 text-center">Aucun match planifié.</p>
                    ) : (
                      schedule
                        .filter(m => m.status === 'scheduled')
                        .slice(0, 4)
                        .map(m => (
                          <div key={m.id} className="p-2.5 rounded-xl border border-slate-200 bg-slate-50/50 flex items-center justify-between text-xs">
                            <div>
                              <div className="font-bold text-slate-900">vs {m.opponent}</div>
                              <div className="text-[11px] text-slate-500 flex items-center gap-2 mt-0.5">
                                <span>{m.date} {m.time ? `• ${m.time}` : ''}</span>
                                <span className={`px-1.5 py-0.2 rounded text-[10px] font-semibold ${m.isHome ? 'bg-emerald-100 text-emerald-800' : 'bg-blue-100 text-blue-800'}`}>
                                  {m.isHome ? 'Dom' : 'Ext'}
                                </span>
                              </div>
                            </div>
                            {onSetMatchDateAndOpponent && (
                              <button
                                onClick={() => {
                                  onSetMatchDateAndOpponent(m.date, m.opponent, m.title);
                                  onClose();
                                }}
                                className="px-2 py-1 text-[11px] font-bold text-emerald-800 bg-emerald-100 hover:bg-emerald-200 rounded-lg"
                                title="Appliquer à la feuille de match en cours"
                              >
                                Charger
                              </button>
                            )}
                          </div>
                        ))
                    )}
                  </div>
                </div>

                {/* History */}
                <div className="bg-white rounded-2xl border border-slate-200 p-4 space-y-3">
                  <div className="flex items-center justify-between pb-2 border-b border-slate-100">
                    <span className="text-xs font-bold text-slate-800 flex items-center gap-1.5">
                      <History className="w-3.5 h-3.5 text-amber-600" />
                      <span>Derniers Matchs Joués ({schedule.filter(m => m.status === 'completed').length})</span>
                    </span>
                  </div>

                  <div className="space-y-2">
                    {schedule.filter(m => m.status === 'completed').length === 0 ? (
                      <p className="text-xs text-slate-400 py-3 text-center">Aucun match archivé.</p>
                    ) : (
                      schedule
                        .filter(m => m.status === 'completed')
                        .slice(0, 4)
                        .map(m => (
                          <div key={m.id} className="p-2.5 rounded-xl border border-slate-200 bg-slate-50/50 flex items-center justify-between text-xs">
                            <div>
                              <div className="font-bold text-slate-900 flex items-center gap-2">
                                <span>vs {m.opponent}</span>
                                {m.finalResult && (
                                  <span className={`text-[10px] font-bold px-1.5 py-0.2 rounded ${
                                    m.finalResult === 'Victoire' ? 'bg-emerald-100 text-emerald-800' :
                                    m.finalResult === 'Défaite' ? 'bg-rose-100 text-rose-800' : 'bg-slate-200 text-slate-800'
                                  }`}>
                                    {m.finalResult}
                                  </span>
                                )}
                              </div>
                              <div className="text-[11px] text-slate-500 mt-0.5">
                                {m.date} {m.scoreTeam1 ? `• Score: ${m.scoreTeam1}+${m.scoreTeam2 || 0} à ${m.scoreOpponent || 0}` : ''}
                              </div>
                            </div>
                            {m.matchDataSnapshot && onLoadMatchIntoSheet && (
                              <button
                                onClick={() => {
                                  if (confirm(`Charger la feuille archivée "${m.title} vs ${m.opponent}" ?`)) {
                                    onLoadMatchIntoSheet(m.matchDataSnapshot!);
                                    onClose();
                                  }
                                }}
                                className="px-2 py-1 text-[11px] font-bold text-slate-800 bg-slate-200 hover:bg-slate-300 rounded-lg"
                                title="Recharger cette feuille"
                              >
                                Ouvrir
                              </button>
                            )}
                          </div>
                        ))
                    )}
                  </div>
                </div>
              </div>
            </div>
          )}

        </div>

        {/* Footer */}
        <div className="px-6 py-3.5 bg-slate-50 border-t border-slate-200 flex items-center justify-between">
          <div className="text-xs text-slate-500 flex items-center gap-2">
            <span>Échelle : <strong>1 = Insuffisant</strong> / <strong>2 = En cours</strong> / <strong>3 = Acquis</strong> / <strong>4 = Maîtrisé</strong></span>
          </div>
          <button
            onClick={onClose}
            className="px-5 py-2 bg-slate-900 hover:bg-slate-800 text-white rounded-xl text-xs font-bold shadow-sm transition-colors"
          >
            Fermer
          </button>
        </div>

      </div>
    </div>
  );
};
