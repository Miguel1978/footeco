import { MatchData, Player, Position } from '../types';
import { getInitialMatchData } from '../initialData';

const STORAGE_KEY = 'fe12_match_sheet_data_v1';
const STORAGE_BACKUP_KEY = 'fe12_match_sheet_data_backup_v1';
const LAST_SAVED_KEY = 'fe12_match_sheet_last_saved_at';
const HISTORY_KEY = 'fe12_match_history_v1';

export function getLastLocalSaveTimestamp(): Date | null {
  try {
    const raw = localStorage.getItem(LAST_SAVED_KEY);
    return raw ? new Date(raw) : null;
  } catch {
    return null;
  }
}

export function loadMatchData(): MatchData {
  const tryParse = (rawStr: string | null): MatchData | null => {
    if (!rawStr) return null;
    try {
      const parsed = JSON.parse(rawStr);
      if (parsed && Array.isArray(parsed.periods) && parsed.periods.length > 0) {
        // Ensure starting scores and points are defaulted to '0' if empty
        const normalizedPeriods = parsed.periods.map((p: any) => ({
          ...p,
          team1: {
            ...p.team1,
            scoreMatch: p.team1?.scoreMatch !== undefined && p.team1?.scoreMatch !== '' ? p.team1.scoreMatch : '0',
            scoreOpponent: p.team1?.scoreOpponent !== undefined && p.team1?.scoreOpponent !== '' ? p.team1.scoreOpponent : '0',
            points: p.team1?.points !== undefined && p.team1?.points !== '' ? p.team1.points : '0',
          },
          team2: {
            ...p.team2,
            scoreMatch: p.team2?.scoreMatch !== undefined && p.team2?.scoreMatch !== '' ? p.team2.scoreMatch : '0',
            scoreOpponent: p.team2?.scoreOpponent !== undefined && p.team2?.scoreOpponent !== '' ? p.team2.scoreOpponent : '0',
            points: p.team2?.points !== undefined && p.team2?.points !== '' ? p.team2.points : '0',
          },
        }));

        return {
          ...parsed,
          finalScore: parsed.finalScore !== undefined && parsed.finalScore !== '' ? parsed.finalScore : '0 - 0',
          periods: normalizedPeriods,
        };
      }
    } catch (e) {
      console.error('Error parsing stored match data', e);
    }
    return null;
  };

  try {
    // 1. Try primary storage
    const primary = tryParse(localStorage.getItem(STORAGE_KEY));
    if (primary) return primary;

    // 2. Fallback to backup storage if primary was corrupted
    const backup = tryParse(localStorage.getItem(STORAGE_BACKUP_KEY));
    if (backup) {
      console.warn('Restored match data from local backup copy.');
      return backup;
    }
  } catch (e) {
    console.error('Error accessing localStorage on loadMatchData', e);
  }

  return getInitialMatchData();
}

export function saveMatchData(data: MatchData): boolean {
  if (!data || !Array.isArray(data.periods)) return false;
  try {
    const serialized = JSON.stringify(data);
    localStorage.setItem(STORAGE_KEY, serialized);
    const nowIso = new Date().toISOString();
    localStorage.setItem(LAST_SAVED_KEY, nowIso);

    // Also update backup key to prevent data loss
    try {
      localStorage.setItem(STORAGE_BACKUP_KEY, serialized);
    } catch {
      // Non-critical if backup fails due to space limits
    }
    return true;
  } catch (e) {
    console.error('Error saving match data to localStorage', e);
    return false;
  }
}

export interface PlayerPeriodEvaluation {
  periodId: number;
  periodNumber: number;
  periodTitle: string;
  rating?: number; // 1 to 4
  note?: string;
  position: Position;
  isStarter: boolean;
  team: 'team1' | 'team2';
  teamName: string;
}

export interface PlayerStats {
  player: Player;
  totalMinutesPlayed: number;
  totalPeriodsStarted: number;
  totalPeriodsSubbed: number;
  periodsAsStarter: number[];
  positionsPlayed: Position[];
  notesCount: number;
  evaluations: PlayerPeriodEvaluation[];
  averageRating: number | null;
  totalRatingsCount: number;
}

export function calculatePlayerStats(match: MatchData): PlayerStats[] {
  const statsMap = new Map<string, PlayerStats>();

  // Initialize for all roster players
  match.roster.forEach(p => {
    statsMap.set(p.name.trim().toLowerCase(), {
      player: p,
      totalMinutesPlayed: 0,
      totalPeriodsStarted: 0,
      totalPeriodsSubbed: 0,
      periodsAsStarter: [],
      positionsPlayed: [],
      notesCount: 0,
      evaluations: [],
      averageRating: null,
      totalRatingsCount: 0,
    });
  });

  match.periods.forEach(period => {
    const duration = period.durationMinutes || 15;

    const processSlot = (slot: import('../types').PlayerSlot, isStarter: boolean, team: 'team1' | 'team2') => {
      if (!slot.playerName.trim()) return;
      const key = slot.playerName.trim().toLowerCase();
      let stat = statsMap.get(key);
      if (!stat) {
        // dynamic player not in roster
        stat = {
          player: { id: slot.id, name: slot.playerName, defaultPosition: slot.position, isPresent: true },
          totalMinutesPlayed: 0,
          totalPeriodsStarted: 0,
          totalPeriodsSubbed: 0,
          periodsAsStarter: [],
          positionsPlayed: [],
          notesCount: 0,
          evaluations: [],
          averageRating: null,
          totalRatingsCount: 0,
        };
        statsMap.set(key, stat);
      }

      const teamObj = team === 'team1' ? period.team1 : period.team2;
      const parsedRating = slot.rating !== undefined && slot.rating >= 1 && slot.rating <= 4 
        ? slot.rating 
        : (slot.note && !isNaN(Number(slot.note)) && Number(slot.note) >= 1 && Number(slot.note) <= 4 ? Number(slot.note) : undefined);

      stat.evaluations.push({
        periodId: period.id,
        periodNumber: period.periodNumber,
        periodTitle: period.title,
        rating: parsedRating,
        note: slot.note,
        position: slot.position,
        isStarter,
        team,
        teamName: teamObj.teamName || (team === 'team1' ? 'Equipe 1' : 'Equipe 2'),
      });

      if (isStarter) {
        stat.totalMinutesPlayed += duration;
        stat.totalPeriodsStarted += 1;
        stat.periodsAsStarter.push(period.periodNumber);
        if (!stat.positionsPlayed.includes(slot.position)) {
          stat.positionsPlayed.push(slot.position);
        }
      } else {
        stat.totalPeriodsSubbed += 1;
      }

      if (slot.note) stat.notesCount++;
    };

    // Team 1
    period.team1.titulaires.forEach(slot => processSlot(slot, true, 'team1'));
    period.team1.remplacants.forEach(slot => processSlot(slot, false, 'team1'));

    // Team 2
    period.team2.titulaires.forEach(slot => processSlot(slot, true, 'team2'));
    period.team2.remplacants.forEach(slot => processSlot(slot, false, 'team2'));
  });

  // Calculate average ratings for each player
  const result = Array.from(statsMap.values()).map(stat => {
    const validRatings = stat.evaluations
      .map(e => e.rating)
      .filter((r): r is number => typeof r === 'number' && r >= 1 && r <= 4);

    const averageRating = validRatings.length > 0
      ? Number((validRatings.reduce((a, b) => a + b, 0) / validRatings.length).toFixed(1))
      : null;

    return {
      ...stat,
      averageRating,
      totalRatingsCount: validRatings.length,
    };
  });

  return result.sort((a, b) => {
    // Primary sort: minutes played, secondary: average rating
    if (b.totalMinutesPlayed !== a.totalMinutesPlayed) {
      return b.totalMinutesPlayed - a.totalMinutesPlayed;
    }
    return (b.averageRating || 0) - (a.averageRating || 0);
  });
}

export function exportMatchAsJSON(match: MatchData): void {
  const dataStr = 'data:text/json;charset=utf-8,' + encodeURIComponent(JSON.stringify(match, null, 2));
  const downloadAnchor = document.createElement('a');
  downloadAnchor.setAttribute('href', dataStr);
  const filename = `feuille_match_${match.matchTitle.replace(/\s+/g, '_')}_${match.date || 'date'}.json`;
  downloadAnchor.setAttribute('download', filename);
  document.body.appendChild(downloadAnchor);
  downloadAnchor.click();
  downloadAnchor.remove();
}

export const SCHEDULE_STORAGE_KEY = 'fe12_match_schedule_v1';

export function getInitialSchedule(): import('../types').ScheduledMatch[] {
  const today = new Date();
  const formatDate = (d: Date) => d.toISOString().split('T')[0];
  
  // Create some realistic default entries around current date
  const pastDate1 = new Date(today);
  pastDate1.setDate(today.getDate() - 7);
  
  const pastDate2 = new Date(today);
  pastDate2.setDate(today.getDate() - 14);

  const futureDate1 = new Date(today);
  futureDate1.setDate(today.getDate() + 6);

  const futureDate2 = new Date(today);
  futureDate2.setDate(today.getDate() + 13);

  const futureDate3 = new Date(today);
  futureDate3.setDate(today.getDate() + 20);

  return [
    {
      id: 'match-past-1',
      title: 'Championnat FE12 - J2',
      opponent: 'FC Sion FE12',
      date: formatDate(pastDate1),
      time: '10:30',
      location: 'Stade de Tourbillon, Terrain annexe',
      isHome: false,
      status: 'completed',
      scoreTeam1: '4',
      scoreTeam2: '3',
      scoreOpponent: '2',
      finalResult: 'Victoire',
      notes: 'Très bonne prestation collective et respect des temps de jeu.',
    },
    {
      id: 'match-past-2',
      title: 'Championnat FE12 - J1',
      opponent: 'FC Lausanne-Sport FE12',
      date: formatDate(pastDate2),
      time: '14:00',
      location: 'Centre Sportif Municipal',
      isHome: true,
      status: 'completed',
      scoreTeam1: '2',
      scoreTeam2: '2',
      scoreOpponent: '3',
      finalResult: 'Nul',
      notes: 'Match serré, belle combativité.',
    },
    {
      id: 'match-fut-1',
      title: 'Championnat FE12 - J3',
      opponent: 'Servette FC FE12',
      date: formatDate(futureDate1),
      time: '10:00',
      location: 'Terrain Principal A',
      isHome: true,
      status: 'scheduled',
      notes: 'Prévoir maillots jaunes et rouges.',
    },
    {
      id: 'match-fut-2',
      title: 'Tournoi FootEco Régional',
      opponent: 'Team Vaud Riviera',
      date: formatDate(futureDate2),
      time: '09:15',
      location: 'Complexe Sportif de la Tuilière',
      isHome: false,
      status: 'scheduled',
      notes: 'Rendez-vous au vestiaire 45 min avant.',
    },
    {
      id: 'match-fut-3',
      title: 'Championnat FE12 - J4',
      opponent: 'Yverdon Sport FC',
      date: formatDate(futureDate3),
      time: '13:30',
      location: 'Stade Municipal',
      isHome: true,
      status: 'scheduled',
      notes: '',
    },
  ];
}

export function loadMatchSchedule(): import('../types').ScheduledMatch[] {
  try {
    const raw = localStorage.getItem(SCHEDULE_STORAGE_KEY);
    if (raw) {
      const parsed = JSON.parse(raw);
      if (Array.isArray(parsed)) {
        return parsed;
      }
    }
  } catch (e) {
    console.error('Error loading schedule from localStorage', e);
  }
  const initial = getInitialSchedule();
  saveMatchSchedule(initial);
  return initial;
}

export function saveMatchSchedule(schedule: import('../types').ScheduledMatch[]): void {
  try {
    localStorage.setItem(SCHEDULE_STORAGE_KEY, JSON.stringify(schedule));
  } catch (e) {
    console.error('Error saving schedule to localStorage', e);
  }
}

// ----------------------------------------------------
// Coaches History Management (localStorage)
// ----------------------------------------------------
const COACHES_STORAGE_KEY = 'fe12_coaches_history_v1';
const DEFAULT_COACHES = ['Seb', 'Miguel', 'Alex', 'David', 'Thomas', 'Julien'];

export function loadCoachesHistory(): string[] {
  try {
    const raw = localStorage.getItem(COACHES_STORAGE_KEY);
    if (raw) {
      const parsed = JSON.parse(raw);
      if (Array.isArray(parsed) && parsed.length > 0) {
        const valid = parsed.filter(name => typeof name === 'string' && name.trim().length > 0);
        if (valid.length > 0) return valid;
      }
    }
  } catch (e) {
    console.error('Error loading coaches history from localStorage', e);
  }
  return DEFAULT_COACHES;
}

export function saveCoachToHistory(coachName: string): string[] {
  const trimmed = coachName.trim();
  if (!trimmed) return loadCoachesHistory();

  const current = loadCoachesHistory();
  // Filter out any existing case-insensitive duplicate and prepend the new/updated one
  const filtered = current.filter(c => c.toLowerCase() !== trimmed.toLowerCase());
  const updated = [trimmed, ...filtered].slice(0, 20); // Keep top 20 recent coaches

  try {
    localStorage.setItem(COACHES_STORAGE_KEY, JSON.stringify(updated));
  } catch (e) {
    console.error('Error saving coaches history to localStorage', e);
  }
  return updated;
}

export function deleteCoachFromHistory(coachName: string): string[] {
  const current = loadCoachesHistory();
  const updated = current.filter(c => c.toLowerCase() !== coachName.trim().toLowerCase());
  try {
    localStorage.setItem(COACHES_STORAGE_KEY, JSON.stringify(updated));
  } catch (e) {
    console.error('Error deleting coach from localStorage', e);
  }
  return updated;
}

