import React, { useState, useMemo } from 'react';
import { MatchData, ScheduledMatch, EventType } from '../types';
import { 
  loadMatchSchedule, 
  saveMatchSchedule 
} from '../utils/storage';
import { 
  Calendar as CalendarIcon, 
  X, 
  Plus, 
  ChevronLeft, 
  ChevronRight, 
  Clock, 
  MapPin, 
  Shield, 
  Trophy, 
  Trash2, 
  Edit2, 
  CheckCircle2, 
  Save, 
  ArrowRight, 
  History, 
  CalendarDays,
  Sparkles,
  AlertCircle,
  Handshake,
  ClipboardCheck,
  Medal,
  CalendarRange,
  Filter
} from 'lucide-react';
import { 
  getSeasonFromDate, 
  getAvailableSeasons, 
  getEventTypeConfig, 
  EVENT_TYPES_CONFIG 
} from '../utils/season';

interface CalendarModalProps {
  isOpen: boolean;
  onClose: () => void;
  currentMatch: MatchData;
  onLoadMatchIntoSheet: (loadedMatch: MatchData) => void;
  onSetMatchDateAndOpponent: (date: string, opponent: string, title?: string) => void;
  onOpenTrainingModal?: () => void;
}

const MONTH_NAMES = [
  'Janvier', 'Février', 'Mars', 'Avril', 'Mai', 'Juin',
  'Juillet', 'Août', 'Septembre', 'Octobre', 'Novembre', 'Décembre'
];

const DAY_NAMES = ['Lun', 'Mar', 'Mer', 'Jeu', 'Ven', 'Sam', 'Dim'];

export const CalendarModal: React.FC<CalendarModalProps> = ({
  isOpen,
  onClose,
  currentMatch,
  onLoadMatchIntoSheet,
  onSetMatchDateAndOpponent,
  onOpenTrainingModal,
}) => {
  const [schedule, setSchedule] = useState<ScheduledMatch[]>(() => loadMatchSchedule());
  const [activeTab, setActiveTab] = useState<'calendar' | 'upcoming' | 'history'>('calendar');
  
  // Filters
  const [selectedSeasonFilter, setSelectedSeasonFilter] = useState<string>('all');
  const [selectedEventTypeFilter, setSelectedEventTypeFilter] = useState<string>('all');

  // Calendar navigation state
  const [currentMonthDate, setCurrentMonthDate] = useState<Date>(() => new Date());
  const [selectedDate, setSelectedDate] = useState<string>(() => {
    const today = new Date();
    return today.toISOString().split('T')[0];
  });

  // New / Edit match form state
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [editingMatchId, setEditingMatchId] = useState<string | null>(null);
  const [formData, setFormData] = useState({
    title: 'Championnat FE12',
    opponent: '',
    date: new Date().toISOString().split('T')[0],
    time: '10:00',
    location: '',
    isHome: true,
    season: getSeasonFromDate(new Date().toISOString().split('T')[0]),
    eventType: 'championnat' as EventType,
    status: 'scheduled' as 'scheduled' | 'completed' | 'cancelled',
    scoreTeam1: '',
    scoreTeam2: '',
    scoreOpponent: '',
    finalResult: '' as 'Victoire' | 'Nul' | 'Défaite' | '',
    notes: '',
  });

  const [saveSuccessMsg, setSaveSuccessMsg] = useState<string | null>(null);

  if (!isOpen) return null;

  const updateSchedule = (newSchedule: ScheduledMatch[]) => {
    setSchedule(newSchedule);
    saveMatchSchedule(newSchedule);
  };

  // Filtered schedule based on active Season & Event Type filters
  const filteredSchedule = useMemo(() => {
    return schedule.filter((m) => {
      const mSeason = m.season || getSeasonFromDate(m.date);
      const mType = m.eventType || 'championnat';

      if (selectedSeasonFilter !== 'all' && mSeason !== selectedSeasonFilter) {
        return false;
      }
      if (selectedEventTypeFilter !== 'all' && mType !== selectedEventTypeFilter) {
        return false;
      }
      return true;
    });
  }, [schedule, selectedSeasonFilter, selectedEventTypeFilter]);

  // Calendar Grid Calculations
  const year = currentMonthDate.getFullYear();
  const month = currentMonthDate.getMonth();

  const firstDayOfMonth = new Date(year, month, 1);
  const lastDayOfMonth = new Date(year, month + 1, 0);
  
  // Get day of week (0 = Sun, 1 = Mon, ..., 6 = Sat) -> convert to 0 = Mon ... 6 = Sun
  let startDayOfWeek = firstDayOfMonth.getDay() - 1;
  if (startDayOfWeek === -1) startDayOfWeek = 6;

  const daysInMonth = lastDayOfMonth.getDate();

  // Create grid cells
  const calendarDays: { dayNumber: number; dateStr: string; isCurrentMonth: boolean }[] = [];
  
  // Previous month padding
  const prevMonthLastDay = new Date(year, month, 0).getDate();
  for (let i = startDayOfWeek - 1; i >= 0; i--) {
    const d = prevMonthLastDay - i;
    const prevMonth = month === 0 ? 11 : month - 1;
    const prevYear = month === 0 ? year - 1 : year;
    const dateStr = `${prevYear}-${String(prevMonth + 1).padStart(2, '0')}-${String(d).padStart(2, '0')}`;
    calendarDays.push({ dayNumber: d, dateStr, isCurrentMonth: false });
  }

  // Current month days
  for (let d = 1; d <= daysInMonth; d++) {
    const dateStr = `${year}-${String(month + 1).padStart(2, '0')}-${String(d).padStart(2, '0')}`;
    calendarDays.push({ dayNumber: d, dateStr, isCurrentMonth: true });
  }

  // Next month padding to fill complete weeks (up to multiple of 7)
  const remainingCells = (7 - (calendarDays.length % 7)) % 7;
  for (let d = 1; d <= remainingCells; d++) {
    const nextMonth = month === 11 ? 0 : month + 1;
    const nextYear = month === 11 ? year + 1 : year;
    const dateStr = `${nextYear}-${String(nextMonth + 1).padStart(2, '0')}-${String(d).padStart(2, '0')}`;
    calendarDays.push({ dayNumber: d, dateStr, isCurrentMonth: false });
  }

  // Map matches by date (from filtered schedule)
  const matchesByDate = useMemo(() => {
    const map = new Map<string, ScheduledMatch[]>();
    filteredSchedule.forEach((m) => {
      if (!map.has(m.date)) {
        map.set(m.date, []);
      }
      map.get(m.date)!.push(m);
    });
    return map;
  }, [filteredSchedule]);

  // Handle month navigation
  const handlePrevMonth = () => {
    setCurrentMonthDate(new Date(year, month - 1, 1));
  };

  const handleNextMonth = () => {
    setCurrentMonthDate(new Date(year, month + 1, 1));
  };

  const handleToday = () => {
    const now = new Date();
    setCurrentMonthDate(new Date(now.getFullYear(), now.getMonth(), 1));
    setSelectedDate(now.toISOString().split('T')[0]);
  };

  // Open Form for creating new match or training
  const handleOpenAddForm = (defaultDate?: string, defaultType?: EventType) => {
    const dateToUse = defaultDate || selectedDate || new Date().toISOString().split('T')[0];
    const eventTypeToUse = defaultType || 'championnat';
    const typeCfg = getEventTypeConfig(eventTypeToUse);

    setEditingMatchId(null);
    setFormData({
      title: typeCfg.defaultTitle,
      opponent: eventTypeToUse === 'entrainement' ? 'Opposition interne' : '',
      date: dateToUse,
      time: '10:00',
      location: 'Domicile',
      isHome: true,
      season: getSeasonFromDate(dateToUse),
      eventType: eventTypeToUse,
      status: 'scheduled',
      scoreTeam1: '',
      scoreTeam2: '',
      scoreOpponent: '',
      finalResult: '',
      notes: '',
    });
    setIsFormOpen(true);
  };

  // Open Form for editing existing match
  const handleOpenEditForm = (m: ScheduledMatch) => {
    setEditingMatchId(m.id);
    setFormData({
      title: m.title || 'Championnat FE12',
      opponent: m.opponent || '',
      date: m.date || new Date().toISOString().split('T')[0],
      time: m.time || '10:00',
      location: m.location || '',
      isHome: m.isHome !== undefined ? m.isHome : true,
      season: m.season || getSeasonFromDate(m.date),
      eventType: m.eventType || 'championnat',
      status: m.status || 'scheduled',
      scoreTeam1: m.scoreTeam1 || '',
      scoreTeam2: m.scoreTeam2 || '',
      scoreOpponent: m.scoreOpponent || '',
      finalResult: m.finalResult || '',
      notes: m.notes || '',
    });
    setIsFormOpen(true);
  };

  const handleSaveForm = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.opponent.trim()) {
      alert('Veuillez renseigner le nom de l\'adversaire ou le cadre de la séance.');
      return;
    }

    if (editingMatchId) {
      const updated = schedule.map((m) =>
        m.id === editingMatchId
          ? {
              ...m,
              ...formData,
            }
          : m
      );
      updateSchedule(updated);
    } else {
      const newMatch: ScheduledMatch = {
        id: `match-${Date.now()}`,
        ...formData,
      };
      updateSchedule([...schedule, newMatch]);
    }

    setIsFormOpen(false);
    setEditingMatchId(null);
    setSaveSuccessMsg('Événement enregistré avec succès !');
    setTimeout(() => setSaveSuccessMsg(null), 2500);
  };

  const handleDeleteMatch = (id: string) => {
    if (confirm('Êtes-vous sûr de vouloir supprimer cet événement du planning ?')) {
      const updated = schedule.filter((m) => m.id !== id);
      updateSchedule(updated);
    }
  };

  // Archive current live match into history
  const handleArchiveCurrentMatch = () => {
    const opp = currentMatch.opponent || (currentMatch.eventType === 'entrainement' ? 'Opposition interne' : 'Adversaire');
    const d = currentMatch.date || new Date().toISOString().split('T')[0];

    // Compute final result & scores
    let t1Goals = 0;
    let t1Opp = 0;
    let t2Goals = 0;
    let t2Opp = 0;

    currentMatch.periods.forEach((p) => {
      const s1 = parseInt(p.team1.scoreMatch, 10);
      const o1 = parseInt(p.team1.scoreOpponent, 10);
      if (!isNaN(s1)) t1Goals += s1;
      if (!isNaN(o1)) t1Opp += o1;

      const s2 = parseInt(p.team2.scoreMatch, 10);
      const o2 = parseInt(p.team2.scoreOpponent, 10);
      if (!isNaN(s2)) t2Goals += s2;
      if (!isNaN(o2)) t2Opp += o2;
    });

    const totGoals = t1Goals + t2Goals;
    const totOpp = t1Opp + t2Opp;

    let res: 'Victoire' | 'Nul' | 'Défaite' | '' = '';
    if (totGoals > totOpp) res = 'Victoire';
    else if (totGoals === totOpp && (totGoals > 0 || totOpp > 0)) res = 'Nul';
    else if (totGoals < totOpp) res = 'Défaite';

    const newRecord: ScheduledMatch = {
      id: `archive-${Date.now()}`,
      title: currentMatch.matchTitle || getEventTypeConfig(currentMatch.eventType).defaultTitle,
      opponent: opp,
      date: d.includes('/') ? d.split('/').reverse().join('-') : d,
      season: currentMatch.season || getSeasonFromDate(d),
      eventType: currentMatch.eventType || 'championnat',
      status: 'completed',
      scoreTeam1: String(t1Goals),
      scoreTeam2: String(t2Goals),
      scoreOpponent: String(totOpp),
      finalResult: res,
      notes: `Archivé depuis la feuille de match en direct. (${getEventTypeConfig(currentMatch.eventType).label})`,
      matchDataSnapshot: JSON.parse(JSON.stringify(currentMatch)),
    };

    updateSchedule([newRecord, ...schedule]);
    setSaveSuccessMsg('La feuille active a été archivée dans l\'historique avec succès !');
    setTimeout(() => setSaveSuccessMsg(null), 3000);
  };

  // Load a scheduled match into the active sheet
  const handleLoadMatch = (m: ScheduledMatch) => {
    if (m.matchDataSnapshot) {
      if (confirm(`Charger l'ensemble de la feuille de match archivée "${m.title} vs ${m.opponent}" ?\n(Attention, cela remplacera la feuille en cours).`)) {
        onLoadMatchIntoSheet(m.matchDataSnapshot);
        onClose();
      }
    } else {
      if (confirm(`Appliquer la date (${m.date}), le type (${getEventTypeConfig(m.eventType).shortLabel}) et l'adversaire (${m.opponent}) à la feuille de match active ?`)) {
        onSetMatchDateAndOpponent(m.date, m.opponent, m.title);
        onClose();
      }
    }
  };

  // Sorted upcoming and history lists
  const upcomingMatches = useMemo(() => {
    return filteredSchedule
      .filter((m) => m.status === 'scheduled')
      .sort((a, b) => a.date.localeCompare(b.date));
  }, [filteredSchedule]);

  const completedMatches = useMemo(() => {
    return filteredSchedule
      .filter((m) => m.status === 'completed')
      .sort((a, b) => b.date.localeCompare(a.date));
  }, [filteredSchedule]);

  const selectedDateMatches = matchesByDate.get(selectedDate) || [];
  const todayStr = new Date().toISOString().split('T')[0];

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/70 backdrop-blur-xs">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-4xl max-h-[90vh] flex flex-col border border-slate-200 overflow-hidden animate-in fade-in zoom-in-95 duration-150">
        
        {/* Header */}
        <div className="px-6 py-4 bg-slate-900 text-white flex items-center justify-between border-b border-slate-800">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 flex items-center justify-center font-bold">
              <CalendarIcon className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-lg font-bold text-white tracking-tight flex items-center gap-2">
                <span>Calendrier & Historique des Matchs FE12</span>
              </h2>
              <p className="text-xs text-slate-400">
                Planification des rencontres, gestion des dates et archivage des feuilles de match
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={() => handleOpenAddForm(selectedDate)}
              className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-bold bg-emerald-500 hover:bg-emerald-600 text-slate-950 rounded-xl transition-all shadow-xs"
            >
              <Plus className="w-4 h-4" />
              <span>Planifier un match</span>
            </button>
            <button
              onClick={onClose}
              className="p-2 text-slate-400 hover:text-white hover:bg-slate-800 rounded-xl transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Success Alert */}
        {saveSuccessMsg && (
          <div className="bg-emerald-50 border-b border-emerald-200 text-emerald-900 px-4 py-2 text-xs font-semibold flex items-center justify-between animate-in fade-in">
            <div className="flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4 text-emerald-600" />
              <span>{saveSuccessMsg}</span>
            </div>
            <button onClick={() => setSaveSuccessMsg(null)} className="text-emerald-700 hover:text-emerald-900">
              <X className="w-3.5 h-3.5" />
            </button>
          </div>
        )}

        {/* Tab Navigation */}
        <div className="px-6 bg-slate-100/90 border-b border-slate-200 flex items-center justify-between gap-4">
          <div className="flex items-center gap-2 py-2">
            <button
              onClick={() => setActiveTab('calendar')}
              className={`flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl text-xs font-bold transition-all ${
                activeTab === 'calendar'
                  ? 'bg-white text-slate-900 shadow-xs border border-slate-200'
                  : 'text-slate-600 hover:text-slate-900 hover:bg-slate-200/60'
              }`}
            >
              <CalendarDays className="w-3.5 h-3.5 text-emerald-600" />
              <span>Vue Calendrier</span>
            </button>

            <button
              onClick={() => setActiveTab('upcoming')}
              className={`flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl text-xs font-bold transition-all ${
                activeTab === 'upcoming'
                  ? 'bg-white text-slate-900 shadow-xs border border-slate-200'
                  : 'text-slate-600 hover:text-slate-900 hover:bg-slate-200/60'
              }`}
            >
              <Clock className="w-3.5 h-3.5 text-blue-600" />
              <span>Matchs à venir ({upcomingMatches.length})</span>
            </button>

            <button
              onClick={() => setActiveTab('history')}
              className={`flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl text-xs font-bold transition-all ${
                activeTab === 'history'
                  ? 'bg-white text-slate-900 shadow-xs border border-slate-200'
                  : 'text-slate-600 hover:text-slate-900 hover:bg-slate-200/60'
              }`}
            >
              <History className="w-3.5 h-3.5 text-amber-600" />
              <span>Historique & Feuilles ({completedMatches.length})</span>
            </button>
          </div>

          {/* Quick Archive Current Sheet Button */}
          <button
            onClick={handleArchiveCurrentMatch}
            className="flex items-center gap-1.5 text-[11px] font-bold text-slate-700 bg-white hover:bg-slate-50 border border-slate-300 px-3 py-1 rounded-xl shadow-2xs transition-colors whitespace-nowrap"
            title="Enregistrer la feuille de match en cours dans l'historique"
          >
            <Save className="w-3 h-3 text-emerald-600" />
            <span>Archiver feuille active</span>
          </button>
        </div>

        {/* Season & Event Type Filter Toolbar */}
        <div className="px-6 py-2.5 bg-slate-50 border-b border-slate-200 flex flex-wrap items-center justify-between gap-3 text-xs">
          <div className="flex flex-wrap items-center gap-2">
            <span className="font-bold text-slate-500 flex items-center gap-1">
              <Filter className="w-3.5 h-3.5 text-slate-400" />
              <span>Filtres :</span>
            </span>

            {/* Event Type Filter Pills */}
            <div className="flex items-center gap-1 bg-white p-1 rounded-xl border border-slate-200 shadow-2xs">
              <button
                onClick={() => setSelectedEventTypeFilter('all')}
                className={`px-2.5 py-1 rounded-lg font-bold text-[11px] transition-colors ${
                  selectedEventTypeFilter === 'all'
                    ? 'bg-slate-900 text-white'
                    : 'text-slate-600 hover:bg-slate-100'
                }`}
              >
                Tous
              </button>
              {(Object.keys(EVENT_TYPES_CONFIG) as EventType[]).map((typeKey) => {
                const cfg = EVENT_TYPES_CONFIG[typeKey];
                const isSelected = selectedEventTypeFilter === typeKey;
                return (
                  <button
                    key={typeKey}
                    onClick={() => setSelectedEventTypeFilter(typeKey)}
                    className={`px-2.5 py-1 rounded-lg font-bold text-[11px] transition-colors flex items-center gap-1 ${
                      isSelected
                        ? `${cfg.badgeColor} ring-1 ring-black/10 shadow-2xs`
                        : 'text-slate-600 hover:bg-slate-100'
                    }`}
                  >
                    <span>{cfg.icon}</span>
                    <span>{cfg.shortLabel}</span>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Season Filter Dropdown */}
          <div className="flex items-center gap-2">
            <span className="font-semibold text-slate-500 flex items-center gap-1 text-[11px]">
              <CalendarRange className="w-3.5 h-3.5 text-emerald-600" />
              <span>Saison :</span>
            </span>
            <select
              value={selectedSeasonFilter}
              onChange={(e) => setSelectedSeasonFilter(e.target.value)}
              className="bg-white border border-slate-300 text-slate-800 text-xs font-bold rounded-xl px-2.5 py-1 focus:outline-none focus:border-emerald-500 shadow-2xs"
            >
              <option value="all">Toutes les saisons</option>
              {getAvailableSeasons().map((s) => (
                <option key={s} value={s}>
                  Saison {s}
                </option>
              ))}
            </select>
          </div>
        </div>

        {/* Modal Body */}
        <div className="flex-1 overflow-y-auto p-6">
          
          {/* TAB 1: CALENDAR VIEW */}
          {activeTab === 'calendar' && (
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              
              {/* Calendar Grid (2 cols) */}
              <div className="lg:col-span-2 bg-white rounded-2xl border border-slate-200 p-4 shadow-xs">
                
                {/* Month header & navigation */}
                <div className="flex items-center justify-between mb-4">
                  <div className="flex items-center gap-2">
                    <h3 className="text-base font-extrabold text-slate-900">
                      {MONTH_NAMES[month]} {year}
                    </h3>
                    <button
                      onClick={handleToday}
                      className="text-[11px] font-bold px-2 py-0.5 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-lg transition-colors border border-slate-200"
                    >
                      Aujourd'hui
                    </button>
                  </div>

                  <div className="flex items-center gap-1">
                    <button
                      onClick={handlePrevMonth}
                      className="p-1.5 text-slate-600 hover:text-slate-900 hover:bg-slate-100 rounded-lg transition-colors"
                      title="Mois précédent"
                    >
                      <ChevronLeft className="w-4 h-4" />
                    </button>
                    <button
                      onClick={handleNextMonth}
                      className="p-1.5 text-slate-600 hover:text-slate-900 hover:bg-slate-100 rounded-lg transition-colors"
                      title="Mois suivant"
                    >
                      <ChevronRight className="w-4 h-4" />
                    </button>
                  </div>
                </div>

                {/* Day name headers */}
                <div className="grid grid-cols-7 gap-1 mb-1 text-center">
                  {DAY_NAMES.map((dn) => (
                    <div key={dn} className="text-xs font-bold text-slate-500 py-1">
                      {dn}
                    </div>
                  ))}
                </div>

                {/* Days Grid */}
                <div className="grid grid-cols-7 gap-1.5">
                  {calendarDays.map((cd, idx) => {
                    const dayMatches = matchesByDate.get(cd.dateStr) || [];
                    const isSelected = cd.dateStr === selectedDate;
                    const isToday = cd.dateStr === todayStr;
                    const hasMatches = dayMatches.length > 0;

                    return (
                      <button
                        key={`${cd.dateStr}-${idx}`}
                        onClick={() => setSelectedDate(cd.dateStr)}
                        className={`min-h-[64px] p-1.5 rounded-xl border text-left flex flex-col justify-between transition-all relative ${
                          isSelected
                            ? 'bg-emerald-50/80 border-emerald-500 ring-2 ring-emerald-500/20'
                            : isToday
                            ? 'bg-amber-50/60 border-amber-300'
                            : cd.isCurrentMonth
                            ? 'bg-slate-50/50 hover:bg-slate-100/80 border-slate-200'
                            : 'bg-slate-50/20 text-slate-300 border-slate-100'
                        }`}
                      >
                        <div className="flex items-center justify-between w-full">
                          <span
                            className={`text-xs font-extrabold ${
                              isToday
                                ? 'w-5 h-5 rounded-full bg-amber-500 text-white flex items-center justify-center text-[10px]'
                                : isSelected
                                ? 'text-emerald-700'
                                : cd.isCurrentMonth
                                ? 'text-slate-800'
                                : 'text-slate-300'
                            }`}
                          >
                            {cd.dayNumber}
                          </span>
                          {hasMatches && (
                            <span className="w-2 h-2 rounded-full bg-emerald-500" />
                          )}
                        </div>

                        {/* Match Chips */}
                        <div className="space-y-0.5 mt-1 overflow-hidden w-full">
                          {dayMatches.slice(0, 2).map((m) => (
                            <div
                              key={m.id}
                              className={`text-[9px] font-bold truncate px-1 py-0.2 rounded ${
                                m.status === 'completed'
                                  ? m.finalResult === 'Victoire'
                                    ? 'bg-emerald-100 text-emerald-900'
                                    : m.finalResult === 'Défaite'
                                    ? 'bg-rose-100 text-rose-900'
                                    : 'bg-slate-200 text-slate-800'
                                  : 'bg-blue-100 text-blue-900'
                              }`}
                              title={`${m.title}: vs ${m.opponent}`}
                            >
                              vs {m.opponent}
                            </div>
                          ))}
                          {dayMatches.length > 2 && (
                            <div className="text-[8px] text-slate-500 font-semibold text-center">
                              +{dayMatches.length - 2} autre(s)
                            </div>
                          )}
                        </div>
                      </button>
                    );
                  })}
                </div>

                <div className="flex items-center gap-4 mt-3 pt-3 border-t border-slate-100 text-[11px] text-slate-500">
                  <div className="flex items-center gap-1.5">
                    <span className="w-2.5 h-2.5 rounded-full bg-blue-500" />
                    <span>Match planifié</span>
                  </div>
                  <div className="flex items-center gap-1.5">
                    <span className="w-2.5 h-2.5 rounded-full bg-emerald-500" />
                    <span>Match joué (Victoire)</span>
                  </div>
                  <div className="flex items-center gap-1.5">
                    <span className="w-2.5 h-2.5 rounded-full bg-amber-500" />
                    <span>Aujourd'hui</span>
                  </div>
                </div>

              </div>

              {/* Day Details Panel (1 col) */}
              <div className="bg-slate-50 rounded-2xl border border-slate-200 p-4 flex flex-col justify-between">
                <div>
                  <div className="flex items-center justify-between pb-3 border-b border-slate-200">
                    <div>
                      <span className="text-[10px] font-bold uppercase tracking-wider text-slate-500">Date sélectionnée</span>
                      <h4 className="text-sm font-extrabold text-slate-900">
                        {new Date(selectedDate + 'T00:00:00').toLocaleDateString('fr-CH', {
                          weekday: 'long',
                          day: 'numeric',
                          month: 'long',
                          year: 'numeric'
                        })}
                      </h4>
                    </div>
                    <button
                      onClick={() => handleOpenAddForm(selectedDate)}
                      className="p-1.5 text-emerald-700 bg-emerald-100 hover:bg-emerald-200 rounded-lg transition-colors"
                      title="Ajouter un match à cette date"
                    >
                      <Plus className="w-4 h-4" />
                    </button>
                  </div>

                  {/* Matches on this selected day */}
                  <div className="py-3 space-y-2.5">
                    {selectedDateMatches.length === 0 ? (
                      <div className="text-center py-6 text-slate-400 text-xs">
                        <CalendarIcon className="w-6 h-6 mx-auto mb-1.5 text-slate-300 opacity-60" />
                        <p>Aucun match prévu ce jour.</p>
                        <button
                          onClick={() => handleOpenAddForm(selectedDate)}
                          className="mt-2 text-[11px] font-bold text-emerald-700 hover:underline"
                        >
                          + Planifier un match
                        </button>
                      </div>
                    ) : (
                      selectedDateMatches.map((m) => (
                        <div
                          key={m.id}
                          className="bg-white p-3 rounded-xl border border-slate-200 shadow-2xs space-y-2"
                        >
                          <div className="flex items-center justify-between">
                            <span className="text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full bg-slate-100 text-slate-700">
                              {m.title}
                            </span>
                            <div className="flex items-center gap-1">
                              <button
                                onClick={() => handleOpenEditForm(m)}
                                className="p-1 text-slate-400 hover:text-slate-700 rounded"
                                title="Modifier"
                              >
                                <Edit2 className="w-3 h-3" />
                              </button>
                              <button
                                onClick={() => handleDeleteMatch(m.id)}
                                className="p-1 text-slate-400 hover:text-rose-600 rounded"
                                title="Supprimer"
                              >
                                <Trash2 className="w-3 h-3" />
                              </button>
                            </div>
                          </div>

                          <div className="font-extrabold text-sm text-slate-900 flex items-center justify-between">
                            <span>vs {m.opponent}</span>
                            <span className={`text-xs px-2 py-0.5 rounded-full font-bold ${
                              m.isHome ? 'bg-emerald-100 text-emerald-800' : 'bg-blue-100 text-blue-800'
                            }`}>
                              {m.isHome ? 'Domicile' : 'Extérieur'}
                            </span>
                          </div>

                          <div className="flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-slate-600">
                            {m.time && (
                              <div className="flex items-center gap-1">
                                <Clock className="w-3 h-3 text-slate-400" />
                                <span>{m.time}</span>
                              </div>
                            )}
                            {m.location && (
                              <div className="flex items-center gap-1">
                                <MapPin className="w-3 h-3 text-slate-400" />
                                <span className="truncate max-w-[140px]">{m.location}</span>
                              </div>
                            )}
                          </div>

                          {m.status === 'completed' && (
                            <div className="pt-1.5 border-t border-slate-100 flex items-center justify-between text-xs">
                              <span className="font-bold text-slate-700">Score :</span>
                              <span className="font-extrabold text-slate-900">
                                {m.scoreTeam1 || '0'} + {m.scoreTeam2 || '0'} à {m.scoreOpponent || '0'}
                              </span>
                              {m.finalResult && (
                                <span className={`text-[10px] font-bold px-2 py-0.5 rounded ${
                                  m.finalResult === 'Victoire'
                                    ? 'bg-emerald-600 text-white'
                                    : m.finalResult === 'Nul'
                                    ? 'bg-amber-500 text-white'
                                    : 'bg-rose-600 text-white'
                                }`}>
                                  {m.finalResult}
                                </span>
                              )}
                            </div>
                          )}

                          <div className="pt-2 border-t border-slate-100 flex items-center justify-between gap-2">
                            {m.eventType === 'entrainement' && onOpenTrainingModal ? (
                              <button
                                onClick={() => {
                                  onClose();
                                  onOpenTrainingModal();
                                }}
                                className="text-[11px] font-extrabold text-emerald-900 bg-emerald-100 hover:bg-emerald-200 px-2 py-1 rounded-lg transition-colors flex items-center gap-1"
                                title="Ouvrir les fiches de séances d'entraînement"
                              >
                                <ClipboardCheck className="w-3 h-3 text-emerald-700" />
                                <span>Fiche de séance</span>
                              </button>
                            ) : <div />}

                            <button
                              onClick={() => handleLoadMatch(m)}
                              className="text-[11px] font-bold text-emerald-800 hover:text-emerald-950 flex items-center gap-1 bg-emerald-50 hover:bg-emerald-100 px-2 py-1 rounded-lg transition-colors"
                            >
                              <span>{m.matchDataSnapshot ? 'Charger la feuille complète' : 'Appliquer à la feuille'}</span>
                              <ArrowRight className="w-3 h-3" />
                            </button>
                          </div>
                        </div>
                      ))
                    )}
                  </div>
                </div>

                {/* Footer Info */}
                <div className="pt-3 border-t border-slate-200 text-[11px] text-slate-500 flex items-center justify-between">
                  <span>{schedule.length} matchs enregistrés</span>
                  <button
                    onClick={() => handleOpenAddForm(selectedDate)}
                    className="font-bold text-emerald-700 hover:underline"
                  >
                    + Nouveau match
                  </button>
                </div>

              </div>

            </div>
          )}

          {/* TAB 2: UPCOMING MATCHES LIST */}
          {activeTab === 'upcoming' && (
            <div className="space-y-3">
              {upcomingMatches.length === 0 ? (
                <div className="text-center py-12 text-slate-400">
                  <CalendarDays className="w-10 h-10 mx-auto mb-2 text-slate-300" />
                  <p className="text-sm font-semibold">Aucun match à venir planifié.</p>
                  <button
                    onClick={() => handleOpenAddForm()}
                    className="mt-3 inline-flex items-center gap-1.5 px-3.5 py-1.5 text-xs font-bold text-white bg-emerald-600 hover:bg-emerald-700 rounded-xl"
                  >
                    <Plus className="w-4 h-4" /> Planifier une rencontre
                  </button>
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  {upcomingMatches.map((m) => (
                    <div
                      key={m.id}
                      className="bg-white p-4 rounded-2xl border border-slate-200 hover:border-slate-300 shadow-2xs space-y-3 transition-all"
                    >
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <span className="text-[10px] font-extrabold uppercase tracking-wider px-2 py-0.5 rounded-full bg-slate-100 text-slate-700">
                            {m.title}
                          </span>
                          <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                            m.isHome ? 'bg-emerald-100 text-emerald-800' : 'bg-blue-100 text-blue-800'
                          }`}>
                            {m.isHome ? 'Domicile' : 'Extérieur'}
                          </span>
                        </div>
                        <div className="flex items-center gap-1">
                          <button
                            onClick={() => handleOpenEditForm(m)}
                            className="p-1 text-slate-400 hover:text-slate-700 rounded"
                            title="Modifier"
                          >
                            <Edit2 className="w-3.5 h-3.5" />
                          </button>
                          <button
                            onClick={() => handleDeleteMatch(m.id)}
                            className="p-1 text-slate-400 hover:text-rose-600 rounded"
                            title="Supprimer"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </div>

                      <div>
                        <h4 className="text-base font-extrabold text-slate-900">
                          FE12 vs {m.opponent}
                        </h4>
                        <div className="flex items-center gap-3 text-xs text-slate-600 mt-1">
                          <div className="flex items-center gap-1 font-semibold">
                            <CalendarIcon className="w-3.5 h-3.5 text-emerald-600" />
                            <span>{new Date(m.date + 'T00:00:00').toLocaleDateString('fr-CH', { day: '2-digit', month: 'short', year: 'numeric' })}</span>
                          </div>
                          {m.time && (
                            <div className="flex items-center gap-1 text-slate-500">
                              <Clock className="w-3.5 h-3.5 text-slate-400" />
                              <span>{m.time}</span>
                            </div>
                          )}
                          {m.location && (
                            <div className="flex items-center gap-1 text-slate-500 truncate">
                              <MapPin className="w-3.5 h-3.5 text-slate-400" />
                              <span className="truncate max-w-[150px]">{m.location}</span>
                            </div>
                          )}
                        </div>
                      </div>

                      {m.notes && (
                        <p className="text-xs text-slate-500 bg-slate-50 p-2 rounded-lg italic">
                          {m.notes}
                        </p>
                      )}

                      <div className="pt-2 border-t border-slate-100 flex items-center justify-between">
                        <button
                          onClick={() => {
                            const updated = schedule.map(item => item.id === m.id ? { ...item, status: 'completed' as const } : item);
                            updateSchedule(updated);
                          }}
                          className="text-[11px] font-semibold text-slate-500 hover:text-slate-800"
                        >
                          Marquer comme joué
                        </button>
                        <button
                          onClick={() => handleLoadMatch(m)}
                          className="flex items-center gap-1 px-2.5 py-1 text-xs font-bold text-emerald-950 bg-emerald-100 hover:bg-emerald-200 rounded-lg transition-colors"
                        >
                          <span>Préparer la feuille</span>
                          <ArrowRight className="w-3 h-3" />
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* TAB 3: PLAYED MATCHES & ARCHIVED SHEETS */}
          {activeTab === 'history' && (
            <div className="space-y-3">
              <div className="flex items-center justify-between pb-2 border-b border-slate-200">
                <p className="text-xs text-slate-600">
                  Historique des rencontres terminées et des feuilles de match archivées
                </p>
                <button
                  onClick={handleArchiveCurrentMatch}
                  className="flex items-center gap-1.5 px-3 py-1 text-xs font-bold text-emerald-900 bg-emerald-100 hover:bg-emerald-200 border border-emerald-300 rounded-xl"
                >
                  <Save className="w-3.5 h-3.5 text-emerald-700" />
                  <span>Archiver le match en cours</span>
                </button>
              </div>

              {completedMatches.length === 0 ? (
                <div className="text-center py-12 text-slate-400">
                  <History className="w-10 h-10 mx-auto mb-2 text-slate-300" />
                  <p className="text-sm font-semibold">Aucun match archivé pour le moment.</p>
                  <p className="text-xs text-slate-400 mt-1">
                    Cliquez sur "Archiver le match en cours" pour sauvegarder une feuille de match complète.
                  </p>
                </div>
              ) : (
                <div className="space-y-2.5">
                  {completedMatches.map((m) => (
                    <div
                      key={m.id}
                      className="bg-white p-3.5 rounded-2xl border border-slate-200 hover:border-slate-300 shadow-2xs flex flex-wrap items-center justify-between gap-3 transition-all"
                    >
                      <div className="flex items-center gap-3">
                        <div className={`w-10 h-10 rounded-xl flex items-center justify-center font-bold text-white shadow-2xs ${
                          m.finalResult === 'Victoire'
                            ? 'bg-emerald-600'
                            : m.finalResult === 'Défaite'
                            ? 'bg-rose-600'
                            : 'bg-amber-500'
                        }`}>
                          <Trophy className="w-5 h-5" />
                        </div>

                        <div>
                          <div className="flex items-center gap-2">
                            <h4 className="text-sm font-extrabold text-slate-900">
                              FE12 vs {m.opponent}
                            </h4>
                            <span className="text-[10px] font-bold text-slate-500 bg-slate-100 px-2 py-0.5 rounded-full">
                              {m.title}
                            </span>
                            {m.matchDataSnapshot && (
                              <span className="text-[10px] font-bold text-purple-700 bg-purple-100 px-2 py-0.5 rounded-full flex items-center gap-1">
                                <Sparkles className="w-2.5 h-2.5" /> Feuille complète
                              </span>
                            )}
                          </div>

                          <div className="flex items-center gap-3 text-xs text-slate-500 mt-0.5">
                            <span>{new Date(m.date + 'T00:00:00').toLocaleDateString('fr-CH', { day: '2-digit', month: 'short', year: 'numeric' })}</span>
                            {m.location && <span>• {m.location}</span>}
                            {m.notes && <span className="italic max-w-xs truncate">• {m.notes}</span>}
                          </div>
                        </div>
                      </div>

                      <div className="flex items-center gap-3">
                        {/* Score Block */}
                        <div className="text-right">
                          <div className="text-sm font-black text-slate-900">
                            {m.scoreTeam1 ? `${m.scoreTeam1} + ${m.scoreTeam2 || 0} - ${m.scoreOpponent || 0}` : 'Match terminé'}
                          </div>
                          {m.finalResult && (
                            <span className={`text-[10px] font-bold px-2 py-0.5 rounded ${
                              m.finalResult === 'Victoire'
                                ? 'text-emerald-700'
                                : m.finalResult === 'Défaite'
                                ? 'text-rose-700'
                                : 'text-amber-700'
                            }`}>
                              {m.finalResult}
                            </span>
                          )}
                        </div>

                        {/* Actions */}
                        <div className="flex items-center gap-1.5 pl-2 border-l border-slate-200">
                          <button
                            onClick={() => handleLoadMatch(m)}
                            className="px-3 py-1.5 text-xs font-bold text-slate-800 bg-slate-100 hover:bg-slate-200 rounded-xl transition-colors"
                            title="Recharger cette feuille dans l'application"
                          >
                            {m.matchDataSnapshot ? 'Ouvrir feuille' : 'Charger'}
                          </button>
                          <button
                            onClick={() => handleDeleteMatch(m.id)}
                            className="p-1.5 text-slate-400 hover:text-rose-600 rounded-lg hover:bg-rose-50 transition-colors"
                            title="Supprimer"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

        </div>

        {/* Modal Footer */}
        <div className="px-6 py-3 bg-slate-100 border-t border-slate-200 flex items-center justify-between text-xs text-slate-500">
          <div className="flex items-center gap-2">
            <span className="font-semibold text-slate-700">Feuille en cours :</span>
            <span>{currentMatch.matchTitle || 'Match FE12'} vs {currentMatch.opponent || 'Adversaire'} ({currentMatch.date || 'Date'})</span>
          </div>
          <button
            onClick={onClose}
            className="px-4 py-1.5 font-bold text-slate-700 bg-white hover:bg-slate-200 border border-slate-300 rounded-xl transition-colors"
          >
            Fermer
          </button>
        </div>

      </div>

      {/* SUB-MODAL: Add / Edit Match Form */}
      {isFormOpen && (
        <div className="fixed inset-0 z-60 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs animate-in fade-in">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-lg border border-slate-200 overflow-hidden">
            <form onSubmit={handleSaveForm}>
              <div className="px-6 py-4 bg-slate-900 text-white flex items-center justify-between">
                <h3 className="text-base font-bold">
                  {editingMatchId ? 'Modifier la rencontre' : 'Planifier un nouveau match'}
                </h3>
                <button
                  type="button"
                  onClick={() => setIsFormOpen(false)}
                  className="p-1.5 text-slate-400 hover:text-white rounded-lg"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              <div className="p-6 space-y-4 text-xs text-slate-800 max-h-[75vh] overflow-y-auto">
                
                {/* Event Type Selector */}
                <div>
                  <label className="block font-bold mb-1.5 text-slate-700">Type d'événement</label>
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                    {(Object.keys(EVENT_TYPES_CONFIG) as EventType[]).map((typeKey) => {
                      const cfg = EVENT_TYPES_CONFIG[typeKey];
                      const isSelected = formData.eventType === typeKey;
                      return (
                        <button
                          key={typeKey}
                          type="button"
                          onClick={() => {
                            setFormData({
                              ...formData,
                              eventType: typeKey,
                              title: formData.title === EVENT_TYPES_CONFIG[formData.eventType].defaultTitle
                                ? cfg.defaultTitle
                                : formData.title,
                              opponent: typeKey === 'entrainement' && !formData.opponent
                                ? 'Opposition interne'
                                : formData.opponent,
                            });
                          }}
                          className={`p-2.5 rounded-xl border text-left flex items-center gap-2 font-bold transition-all ${
                            isSelected
                              ? `${cfg.badgeColor} ring-2 ring-emerald-500/30 border-emerald-500 shadow-2xs`
                              : 'bg-slate-50 hover:bg-slate-100 border-slate-200 text-slate-700'
                          }`}
                        >
                          <span className="text-base">{cfg.icon}</span>
                          <span className="text-[11px] leading-tight">{cfg.label}</span>
                        </button>
                      );
                    })}
                  </div>
                </div>

                {/* Season & Title */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="block font-bold mb-1 text-slate-700">Saison sportive</label>
                    <select
                      value={formData.season}
                      onChange={(e) => setFormData({ ...formData, season: e.target.value })}
                      className="w-full bg-slate-50 border border-slate-300 rounded-xl px-3 py-2 text-xs font-bold focus:bg-white focus:outline-none focus:border-emerald-500"
                    >
                      {getAvailableSeasons().map((s) => (
                        <option key={s} value={s}>
                          Saison {s}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label className="block font-bold mb-1 text-slate-700">Intitulé / Compétition</label>
                    <input
                      type="text"
                      value={formData.title}
                      onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                      placeholder="Championnat FE12, Séance spécifique..."
                      className="w-full bg-slate-50 border border-slate-300 rounded-xl px-3 py-2 text-xs font-semibold focus:bg-white focus:outline-none focus:border-emerald-500"
                      required
                    />
                  </div>
                </div>

                {/* Adversaire / Cadre */}
                <div>
                  <label className="block font-bold mb-1 text-slate-700">
                    {formData.eventType === 'entrainement'
                      ? 'Cadre de la séance / Opposition interne *'
                      : 'Équipe adverse *'}
                  </label>
                  <input
                    type="text"
                    value={formData.opponent}
                    onChange={(e) => setFormData({ ...formData, opponent: e.target.value })}
                    placeholder={
                      formData.eventType === 'entrainement'
                        ? 'Opposition interne, Rouges vs Jaunes, Évaluation technique...'
                        : 'FC Sion, Servette FC, Team Vaud...'
                    }
                    className="w-full bg-slate-50 border border-slate-300 rounded-xl px-3 py-2 text-xs font-bold focus:bg-white focus:outline-none focus:border-emerald-500"
                    required
                  />
                </div>

                {/* Date & Heure */}
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block font-bold mb-1 text-slate-700">Date</label>
                    <input
                      type="date"
                      value={formData.date}
                      onChange={(e) => {
                        const newDate = e.target.value;
                        setFormData({
                          ...formData,
                          date: newDate,
                          season: getSeasonFromDate(newDate),
                        });
                      }}
                      className="w-full bg-slate-50 border border-slate-300 rounded-xl px-3 py-2 text-xs font-semibold focus:bg-white focus:outline-none focus:border-emerald-500"
                      required
                    />
                  </div>
                  <div>
                    <label className="block font-bold mb-1 text-slate-700">Heure de début</label>
                    <input
                      type="time"
                      value={formData.time}
                      onChange={(e) => setFormData({ ...formData, time: e.target.value })}
                      className="w-full bg-slate-50 border border-slate-300 rounded-xl px-3 py-2 text-xs font-semibold focus:bg-white focus:outline-none focus:border-emerald-500"
                    />
                  </div>
                </div>

                {/* Domicile / Extérieur & Lieu */}
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block font-bold mb-1 text-slate-700">Terrain</label>
                    <div className="flex gap-2">
                      <button
                        type="button"
                        onClick={() => setFormData({ ...formData, isHome: true })}
                        className={`flex-1 py-1.5 rounded-xl font-bold border transition-colors ${
                          formData.isHome
                            ? 'bg-emerald-600 text-white border-emerald-700'
                            : 'bg-slate-100 text-slate-600 border-slate-200'
                        }`}
                      >
                        Domicile
                      </button>
                      <button
                        type="button"
                        onClick={() => setFormData({ ...formData, isHome: false })}
                        className={`flex-1 py-1.5 rounded-xl font-bold border transition-colors ${
                          !formData.isHome
                            ? 'bg-blue-600 text-white border-blue-700'
                            : 'bg-slate-100 text-slate-600 border-slate-200'
                        }`}
                      >
                        Extérieur
                      </button>
                    </div>
                  </div>

                  <div>
                    <label className="block font-bold mb-1 text-slate-700">Lieu / Stade</label>
                    <input
                      type="text"
                      value={formData.location}
                      onChange={(e) => setFormData({ ...formData, location: e.target.value })}
                      placeholder="Stade / Terrain n°1..."
                      className="w-full bg-slate-50 border border-slate-300 rounded-xl px-3 py-2 text-xs font-semibold focus:bg-white focus:outline-none focus:border-emerald-500"
                    />
                  </div>
                </div>

                {/* Statut & Résultats (si déjà joué) */}
                <div>
                  <label className="block font-bold mb-1 text-slate-700">Statut</label>
                  <select
                    value={formData.status}
                    onChange={(e) => setFormData({ ...formData, status: e.target.value as any })}
                    className="w-full bg-slate-50 border border-slate-300 rounded-xl px-3 py-2 text-xs font-semibold focus:bg-white focus:outline-none focus:border-emerald-500"
                  >
                    <option value="scheduled">Planifié (À venir)</option>
                    <option value="completed">Terminé (Archivé)</option>
                    <option value="cancelled">Annulé / Reporté</option>
                  </select>
                </div>

                {formData.status === 'completed' && (
                  <div className="p-3 bg-slate-100 rounded-xl space-y-2 border border-slate-200">
                    <span className="font-bold text-slate-800">Résultats :</span>
                    <div className="grid grid-cols-3 gap-2">
                      <div>
                        <label className="block text-[10px] text-slate-600 font-bold mb-0.5">Score Équipe 1</label>
                        <input
                          type="text"
                          value={formData.scoreTeam1}
                          onChange={(e) => setFormData({ ...formData, scoreTeam1: e.target.value })}
                          placeholder="3"
                          className="w-full bg-white border border-slate-300 rounded-lg p-1.5 text-center font-bold"
                        />
                      </div>
                      <div>
                        <label className="block text-[10px] text-slate-600 font-bold mb-0.5">Score Équipe 2</label>
                        <input
                          type="text"
                          value={formData.scoreTeam2}
                          onChange={(e) => setFormData({ ...formData, scoreTeam2: e.target.value })}
                          placeholder="2"
                          className="w-full bg-white border border-slate-300 rounded-lg p-1.5 text-center font-bold"
                        />
                      </div>
                      <div>
                        <label className="block text-[10px] text-slate-600 font-bold mb-0.5">Score Adversaire</label>
                        <input
                          type="text"
                          value={formData.scoreOpponent}
                          onChange={(e) => setFormData({ ...formData, scoreOpponent: e.target.value })}
                          placeholder="2"
                          className="w-full bg-white border border-slate-300 rounded-lg p-1.5 text-center font-bold"
                        />
                      </div>
                    </div>
                  </div>
                )}

                {/* Notes */}
                <div>
                  <label className="block font-bold mb-1 text-slate-700">Notes & Consignes</label>
                  <textarea
                    value={formData.notes}
                    onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                    placeholder="Consignes d'échauffement, thème de la séance d'évaluation..."
                    rows={2}
                    className="w-full bg-slate-50 border border-slate-300 rounded-xl p-2.5 text-xs focus:bg-white focus:outline-none focus:border-emerald-500 resize-none"
                  />
                </div>

              </div>

              <div className="px-6 py-3.5 bg-slate-100 border-t border-slate-200 flex items-center justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setIsFormOpen(false)}
                  className="px-4 py-2 text-xs font-semibold text-slate-700 hover:bg-slate-200 rounded-xl"
                >
                  Annuler
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 text-xs font-bold text-slate-950 bg-emerald-400 hover:bg-emerald-500 rounded-xl shadow-xs"
                >
                  {editingMatchId ? 'Mettre à jour' : 'Enregistrer la rencontre'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

    </div>
  );
};
