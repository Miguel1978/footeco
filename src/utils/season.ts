import { EventType } from '../types';

export type { EventType };

export interface EventTypeConfig {
  type: EventType;
  label: string;
  shortLabel: string;
  icon: string;
  iconName: string;
  badgeBg: string;
  badgeText: string;
  badgeBorder: string;
  badgeColor: string;
  description: string;
  defaultOpponentPlaceholder: string;
  defaultTitle: string;
}

export const EVENT_TYPES_CONFIG: Record<EventType, EventTypeConfig> = {
  championnat: {
    type: 'championnat',
    label: 'Match de Championnat',
    shortLabel: 'Championnat',
    icon: '🏆',
    iconName: 'Trophy',
    badgeBg: 'bg-amber-500/15',
    badgeText: 'text-amber-700',
    badgeBorder: 'border-amber-500/30',
    badgeColor: 'bg-amber-100 text-amber-900 border border-amber-300',
    description: 'Match officiel de championnat FootEco FE12',
    defaultOpponentPlaceholder: 'Ex: Team Vaud, FC Sion...',
    defaultTitle: 'Championnat FE12',
  },
  amical: {
    type: 'amical',
    label: 'Match Amical',
    shortLabel: 'Amical',
    icon: '🤝',
    iconName: 'Handshake',
    badgeBg: 'bg-blue-500/15',
    badgeText: 'text-blue-700',
    badgeBorder: 'border-blue-500/30',
    badgeColor: 'bg-blue-100 text-blue-900 border border-blue-300',
    description: 'Rencontre amicale de préparation',
    defaultOpponentPlaceholder: 'Ex: FC Martigny, FC Monthey...',
    defaultTitle: 'Match Amical FE12',
  },
  entrainement: {
    type: 'entrainement',
    label: 'Entraînement & Évaluation',
    shortLabel: 'Entraînement',
    icon: '📋',
    iconName: 'ClipboardCheck',
    badgeBg: 'bg-emerald-500/15',
    badgeText: 'text-emerald-700',
    badgeBorder: 'border-emerald-500/30',
    badgeColor: 'bg-emerald-100 text-emerald-900 border border-emerald-300',
    description: 'Séance d\'entraînement, opposition interne et évaluation',
    defaultOpponentPlaceholder: 'Opposition interne / Jaunes vs Rouges',
    defaultTitle: 'Entraînement & Évaluation FE12',
  },
  tournoi: {
    type: 'tournoi',
    label: 'Tournoi',
    shortLabel: 'Tournoi',
    icon: '🥇',
    iconName: 'Medal',
    badgeBg: 'bg-purple-500/15',
    badgeText: 'text-purple-700',
    badgeBorder: 'border-purple-500/30',
    badgeColor: 'bg-purple-100 text-purple-900 border border-purple-300',
    description: 'Tournoi ou rassemblement inter-régional',
    defaultOpponentPlaceholder: 'Ex: Tournoi de rentrée...',
    defaultTitle: 'Tournoi FE12',
  },
};

/**
 * Computes the football season based on a date (e.g. '2026-08-31' -> '2026/2027')
 * In football, a new season starts around July 1st (month >= 7).
 */
export function getSeasonFromDate(dateStr?: string): string {
  const date = dateStr ? new Date(dateStr) : new Date();
  if (isNaN(date.getTime())) {
    const currentYear = new Date().getFullYear();
    return `${currentYear}/${currentYear + 1}`;
  }

  const year = date.getFullYear();
  const month = date.getMonth() + 1; // 1-12

  if (month >= 7) {
    // July to December -> start of season (e.g. July 2026 belongs to 2026/2027)
    return `${year}/${year + 1}`;
  } else {
    // January to June -> second half of season (e.g. March 2026 belongs to 2025/2026)
    return `${year - 1}/${year}`;
  }
}

/**
 * Returns a list of relevant seasons around the current year (5 seasons)
 */
export function getAvailableSeasons(currentDate?: string): string[] {
  const baseSeason = getSeasonFromDate(currentDate);
  const baseYear = parseInt(baseSeason.split('/')[0], 10) || new Date().getFullYear();

  const seasons: string[] = [];
  // 1 next season, current season, 3 previous seasons
  for (let offset = 1; offset >= -3; offset--) {
    const y = baseYear + offset;
    seasons.push(`${y}/${y + 1}`);
  }
  return seasons;
}

export function getEventTypeConfig(type?: EventType): EventTypeConfig {
  return EVENT_TYPES_CONFIG[type || 'championnat'] || EVENT_TYPES_CONFIG.championnat;
}
