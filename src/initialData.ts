import { MatchData, Player, PeriodMatch } from './types';
import { getSeasonFromDate } from './utils/season';

export const INITIAL_PLAYERS: Player[] = [
  // Equipe 1 starters & subs
  { id: 'p-1', name: 'Ilian', defaultPosition: 'Gardien', number: 1, isPresent: true, avatarType: 'icon', avatarColor: '#f59e0b', avatarIcon: 'shield' },
  { id: 'p-2', name: 'Romain', defaultPosition: 'Défenseur', number: 2, isPresent: true, avatarType: 'icon', avatarColor: '#0284c7', avatarIcon: 'shield' },
  { id: 'p-3', name: 'Inna', defaultPosition: 'Défenseur', number: 3, isPresent: true, avatarType: 'icon', avatarColor: '#059669', avatarIcon: 'shield' },
  { id: 'p-4', name: 'Jonathan', defaultPosition: 'Milieu', number: 6, isPresent: true, avatarType: 'icon', avatarColor: '#7c3aed', avatarIcon: 'zap' },
  { id: 'p-5', name: 'Mathis S.', defaultPosition: 'Couloir', number: 7, isPresent: true, avatarType: 'icon', avatarColor: '#ea580c', avatarIcon: 'flame' },
  { id: 'p-6', name: 'Mathis M.', defaultPosition: 'Couloir', number: 11, isPresent: true, avatarType: 'icon', avatarColor: '#0d9488', avatarIcon: 'compass' },
  { id: 'p-7', name: 'François', defaultPosition: 'Attaquant', number: 9, isPresent: true, avatarType: 'icon', avatarColor: '#e11d48', avatarIcon: 'target' },
  { id: 'p-8', name: 'Siem', defaultPosition: 'Milieu', number: 8, isPresent: true, avatarType: 'icon', avatarColor: '#4f46e5', avatarIcon: 'star' },
  
  // Equipe 2 starters & subs
  { id: 'p-9', name: 'Jost', defaultPosition: 'Gardien', number: 16, isPresent: true, avatarType: 'icon', avatarColor: '#d97706', avatarIcon: 'shield' },
  { id: 'p-10', name: 'Sacha', defaultPosition: 'Défenseur', number: 4, isPresent: true, avatarType: 'icon', avatarColor: '#2563eb', avatarIcon: 'shield' },
  { id: 'p-11', name: 'Kris', defaultPosition: 'Défenseur', number: 5, isPresent: true, avatarType: 'icon', avatarColor: '#0891b2', avatarIcon: 'shield' },
  { id: 'p-12', name: 'Jonas', defaultPosition: 'Milieu', number: 10, isPresent: true, avatarType: 'icon', avatarColor: '#9333ea', avatarIcon: 'crown' },
  { id: 'p-13', name: 'Rayan', defaultPosition: 'Couloir', number: 17, isPresent: true, avatarType: 'icon', avatarColor: '#16a34a', avatarIcon: 'zap' },
  { id: 'p-14', name: 'Tm', defaultPosition: 'Couloir', number: 18, isPresent: true, avatarType: 'icon', avatarColor: '#db2777', avatarIcon: 'sparkles' },
  { id: 'p-15', name: 'Basile', defaultPosition: 'Attaquant', number: 19, isPresent: true, avatarType: 'icon', avatarColor: '#dc2626', avatarIcon: 'flame' },
  { id: 'p-16', name: 'Maël', defaultPosition: 'Défenseur', number: 14, isPresent: true, avatarType: 'icon', avatarColor: '#475569', avatarIcon: 'shield' },
  { id: 'p-17', name: 'Dylan', defaultPosition: 'Attaquant', number: 20, isPresent: true, avatarType: 'icon', avatarColor: '#c026d3', avatarIcon: 'trophy' },
];

export const createDefaultPeriod = (periodNum: number, durationMin: number = 15): PeriodMatch => {
  return {
    id: periodNum,
    periodNumber: periodNum,
    title: `Match ${periodNum}`,
    durationMinutes: durationMin,
    team1: {
      teamName: 'Equipe 1',
      coachName: 'Seb',
      headerColor: 'yellow',
      scoreMatch: '',
      scoreOpponent: '',
      shootoutScore: '',
      shootoutOpponent: '',
      result: '',
      points: '',
      titulaires: [
        { id: `t1-p${periodNum}-1`, playerId: 'p-1', playerName: 'Ilian', position: 'Gardien', note: '', shootout: '' },
        { id: `t1-p${periodNum}-2`, playerId: 'p-2', playerName: 'Romain', position: 'Défenseur', note: '', shootout: '' },
        { id: `t1-p${periodNum}-3`, playerId: 'p-3', playerName: 'Inna', position: 'Défenseur', note: '', shootout: '' },
        { id: `t1-p${periodNum}-4`, playerId: 'p-4', playerName: 'Jonathan', position: 'Milieu', note: '', shootout: '' },
        { id: `t1-p${periodNum}-5`, playerId: 'p-5', playerName: 'Mathis S.', position: 'Couloir', note: '', shootout: '' },
        { id: `t1-p${periodNum}-6`, playerId: 'p-6', playerName: 'Mathis M.', position: 'Couloir', note: '', shootout: '' },
        { id: `t1-p${periodNum}-7`, playerId: 'p-7', playerName: 'François', position: 'Attaquant', note: '', shootout: '' },
      ],
      remplacants: [
        { id: `t1-p${periodNum}-r1`, playerId: 'p-8', playerName: 'Siem', position: 'Milieu', note: '', shootout: '' },
      ],
    },
    team2: {
      teamName: 'Equipe 2',
      coachName: 'Miguel',
      headerColor: 'red',
      scoreMatch: '',
      scoreOpponent: '',
      shootoutScore: '',
      shootoutOpponent: '',
      result: '',
      points: '',
      titulaires: [
        { id: `t2-p${periodNum}-1`, playerId: 'p-9', playerName: 'Jost', position: 'Gardien', note: '', shootout: '' },
        { id: `t2-p${periodNum}-2`, playerId: 'p-10', playerName: 'Sacha', position: 'Défenseur', note: '', shootout: '' },
        { id: `t2-p${periodNum}-3`, playerId: 'p-11', playerName: 'Kris', position: 'Défenseur', note: '', shootout: '' },
        { id: `t2-p${periodNum}-4`, playerId: 'p-12', playerName: 'Jonas', position: 'Milieu', note: '', shootout: '' },
        { id: `t2-p${periodNum}-5`, playerId: 'p-13', playerName: 'Rayan', position: 'Couloir', note: '', shootout: '' },
        { id: `t2-p${periodNum}-6`, playerId: 'p-14', playerName: 'Tm', position: 'Couloir', note: '', shootout: '' },
        { id: `t2-p${periodNum}-7`, playerId: 'p-15', playerName: 'Basile', position: 'Attaquant', note: '', shootout: '' },
      ],
      remplacants: [
        { id: `t2-p${periodNum}-r1`, playerId: 'p-16', playerName: 'Maël', position: 'Défenseur', note: '', shootout: '' },
        { id: `t2-p${periodNum}-r2`, playerId: 'p-17', playerName: 'Dylan', position: 'Attaquant', note: '', shootout: '' },
      ],
    },
  };
};

export const getInitialMatchData = (): MatchData => {
  const today = new Date().toISOString().split('T')[0];
  return {
    id: 'match-' + Date.now(),
    matchTitle: 'FE12 Bas-Valais',
    opponent: '',
    date: today,
    season: getSeasonFromDate(today),
    eventType: 'championnat',
    finalScore: '',
    periods: [
      createDefaultPeriod(1, 15),
      createDefaultPeriod(2, 15),
      createDefaultPeriod(3, 15),
      createDefaultPeriod(4, 15),
    ],
    roster: INITIAL_PLAYERS,
  };
};
