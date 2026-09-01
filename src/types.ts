export type Position = 'Gardien' | 'Défenseur' | 'Milieu' | 'Couloir' | 'Attaquant';

export interface Player {
  id: string;
  name: string;
  number?: number;
  defaultPosition?: Position;
  isPresent: boolean;
  avatarType?: 'icon' | 'preset' | 'photo' | 'initials';
  avatarColor?: string;
  avatarIcon?: string;
  avatarUrl?: string;
}

export interface PlayerSlot {
  id: string;
  playerId: string | null;
  playerName: string;
  position: Position;
  note: string;
  rating?: number; // 1 to 4
  shootout: string; // e.g. "But", "Raté", "Arrêt", or text
  goals?: number;
}

export interface TeamMatchData {
  coachName: string;
  teamName: string; // "Equipe 1" or "Equipe 2"
  headerColor: 'yellow' | 'red' | string;
  scoreMatch: string; // "3 à 1" or "3"
  scoreOpponent: string; // opponent score if separated
  shootoutScore: string; // "2 à 1"
  shootoutOpponent: string;
  result: 'Victoire' | 'Nul' | 'Défaite' | '';
  points: string; // e.g. "3", "1", "0"
  titulaires: PlayerSlot[];
  remplacants: PlayerSlot[];
}

export interface PeriodMatch {
  id: number;
  periodNumber: number;
  title: string; // "Match 1", "Période 1", etc.
  durationMinutes: number; // e.g. 15
  team1: TeamMatchData;
  team2: TeamMatchData;
  notes?: string;
}

export type EventType = 'championnat' | 'amical' | 'entrainement' | 'tournoi';

export interface MatchData {
  id: string;
  matchTitle: string; // "Match FE12 Bas-Valais"
  opponent: string; // "Adversaire"
  date: string;
  season?: string; // e.g. "2026/2027"
  eventType?: EventType; // "championnat" | "amical" | "entrainement" | "tournoi"
  finalScore: string;
  periods: PeriodMatch[];
  roster: Player[];
}

export interface ScheduledMatch {
  id: string;
  title: string;
  opponent: string;
  date: string; // YYYY-MM-DD
  time?: string; // HH:mm
  location?: string;
  isHome?: boolean; // true = Domicile, false = Extérieur
  season?: string;
  eventType?: EventType;
  status: 'scheduled' | 'completed' | 'cancelled';
  scoreTeam1?: string;
  scoreTeam2?: string;
  scoreOpponent?: string;
  finalResult?: 'Victoire' | 'Nul' | 'Défaite' | '';
  notes?: string;
  matchDataSnapshot?: MatchData; // complete archived match data
}

export interface TrainingDrawing {
  image?: string; // Data URL / SVG / URL
  coach?: string; // Coach initial or name (e.g. "SEB", "Miguel")
  caption?: string; // Caption or drill sub-title
}

export interface TrainingExercisePart {
  title: string; // e.g. "Partie initiale - Focus TE/KO", "Formes jouées - Focus TA", "Jeu final - Focus TE/TA"
  focus?: string; // e.g. "Focus TE/KO", "Focus TA", "Focus TE/TA"
  duration: string; // e.g. "2X 15 min / Total 30 min"
  description: string; // Detail of drills (Dessin 1 = ..., Dessin 2 = ...)
  drawing1: TrainingDrawing;
  drawing2: TrainingDrawing;
}

export interface TrainingSession {
  id: string;
  title: string; // e.g. "Entraînement FE12 - Récupération & Duels"
  team: string; // e.g. "FE12 Bas-Valais"
  date: string; // YYYY-MM-DD
  coach: string; // e.g. "Sébastien M."
  assistantCoach?: string; // e.g. "Miguel R."
  season: string; // e.g. "2025/2026", "2026/2027"
  
  // Thème TE (Technique)
  themeTE: {
    description: string;
    coachingAccents: string;
  };

  // Thème TA (Tactique)
  themeTA: {
    description: string;
    coachingAccents?: string;
    defOrOff: 'DEF' | 'OFF' | 'DEF & OFF' | '';
    antagonism: string; // e.g. "Volonté de vouloir gagner le ballon"
  };

  // Thème PE (Physique / Psycho-émotionnel)
  themePE: {
    description: string;
    coachingAccents: string;
  };

  // 3 Core Parts matching official FootEco template
  initialPart: TrainingExercisePart;
  playedForms: TrainingExercisePart;
  finalGame: TrainingExercisePart;

  // Remarques, Individualisation & Bilan
  remarksAndIndividualization: string;
  bilan: string;

  createdAt?: string;
  updatedAt?: string;
}

export type UserRole = 'admin' | 'coach' | 'viewer';

export interface UserProfile {
  uid: string;
  email: string | null;
  displayName: string | null;
  photoURL?: string | null;
  role: UserRole;
  createdAt?: string;
  lastLoginAt?: string;
}

declare module 'html2pdf.js';


