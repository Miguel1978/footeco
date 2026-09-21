import { PeriodMatch, PlayerSlot, Position } from '../types';

export interface PlayerPlaytimeReport {
  playerId: string | null;
  playerName: string;
  periodsAsStarter: number[]; // e.g. [1, 2]
  periodsAsSub: number[]; // e.g. [3, 4]
  totalStarterPeriods: number;
  totalMinutesPlayed: number;
  targetStarterPeriods: number; // calculated ideal starts (e.g. 2 or 3)
  equityScore: number; // difference from ideal: < 0 is deficit, > 0 is surplus
  status: 'deficit' | 'balanced' | 'surplus';
  isStarterInCurrentPeriod: boolean;
  isSubInCurrentPeriod: boolean;
  slotIndexInCurrentPeriod: number;
  currentPosition?: Position;
}

export interface RotationSuggestion {
  id: string;
  team: 'team1' | 'team2';
  starterSlotIndex: number;
  starterPlayerName: string;
  starterStartsCount: number;
  starterMinutes: number;
  subSlotIndex: number;
  subPlayerName: string;
  subStartsCount: number;
  subMinutes: number;
  reason: string;
  priority: 'urgent' | 'recommended' | 'optional';
}

export interface TeamPlaytimeSummary {
  reports: PlayerPlaytimeReport[];
  totalPlayers: number;
  averageStarts: number;
  minStarts: number;
  maxStarts: number;
  idealStartsRange: string;
  isFullyBalanced: boolean;
  unbalancedCount: number;
}

/**
 * Normalizes player key to safely aggregate across periods
 */
function getPlayerKey(slot: PlayerSlot): string {
  if (slot.playerId) return `id:${slot.playerId}`;
  if (slot.playerName && slot.playerName.trim().length > 0) {
    return `name:${slot.playerName.trim().toLowerCase()}`;
  }
  return `slot:${slot.id}`;
}

/**
 * Calculates playtime across all 4 periods for a specific team
 */
export function calculateTeamPlaytime(
  allPeriods: PeriodMatch[],
  currentPeriodId: number,
  team: 'team1' | 'team2'
): TeamPlaytimeSummary {
  const currentPeriod = allPeriods.find(p => p.id === currentPeriodId) || allPeriods[0];
  const playerMap = new Map<string, PlayerPlaytimeReport>();

  // Ensure all players present in any period or current period are tracked
  allPeriods.forEach(period => {
    const teamData = period[team];
    if (!teamData) return;

    const duration = period.durationMinutes || 15;

    // Track starters
    teamData.titulaires.forEach((slot, idx) => {
      const name = slot.playerName?.trim();
      if (!name) return;
      const key = getPlayerKey(slot);

      if (!playerMap.has(key)) {
        playerMap.set(key, {
          playerId: slot.playerId,
          playerName: name,
          periodsAsStarter: [],
          periodsAsSub: [],
          totalStarterPeriods: 0,
          totalMinutesPlayed: 0,
          targetStarterPeriods: 2,
          equityScore: 0,
          status: 'balanced',
          isStarterInCurrentPeriod: false,
          isSubInCurrentPeriod: false,
          slotIndexInCurrentPeriod: -1,
          currentPosition: undefined,
        });
      }

      const report = playerMap.get(key)!;
      if (!report.periodsAsStarter.includes(period.periodNumber)) {
        report.periodsAsStarter.push(period.periodNumber);
        report.totalStarterPeriods++;
        report.totalMinutesPlayed += duration;
      }
    });

    // Track substitutes
    teamData.remplacants.forEach((slot, idx) => {
      const name = slot.playerName?.trim();
      if (!name) return;
      const key = getPlayerKey(slot);

      if (!playerMap.has(key)) {
        playerMap.set(key, {
          playerId: slot.playerId,
          playerName: name,
          periodsAsStarter: [],
          periodsAsSub: [],
          totalStarterPeriods: 0,
          totalMinutesPlayed: 0,
          targetStarterPeriods: 2,
          equityScore: 0,
          status: 'balanced',
          isStarterInCurrentPeriod: false,
          isSubInCurrentPeriod: false,
          slotIndexInCurrentPeriod: -1,
          currentPosition: undefined,
        });
      }

      const report = playerMap.get(key)!;
      if (!report.periodsAsSub.includes(period.periodNumber)) {
        report.periodsAsSub.push(period.periodNumber);
      }
    });
  });

  // Mark status in current period
  if (currentPeriod && currentPeriod[team]) {
    currentPeriod[team].titulaires.forEach((slot, idx) => {
      const key = getPlayerKey(slot);
      const report = playerMap.get(key);
      if (report) {
        report.isStarterInCurrentPeriod = true;
        report.slotIndexInCurrentPeriod = idx;
        report.currentPosition = slot.position;
      }
    });

    currentPeriod[team].remplacants.forEach((slot, idx) => {
      const key = getPlayerKey(slot);
      const report = playerMap.get(key);
      if (report) {
        report.isSubInCurrentPeriod = true;
        report.slotIndexInCurrentPeriod = idx;
        report.currentPosition = slot.position;
      }
    });
  }

  const reports = Array.from(playerMap.values());
  const totalPlayers = reports.length;

  if (totalPlayers === 0) {
    return {
      reports: [],
      totalPlayers: 0,
      averageStarts: 0,
      minStarts: 0,
      maxStarts: 0,
      idealStartsRange: '0',
      isFullyBalanced: true,
      unbalancedCount: 0,
    };
  }

  // 4 periods * 7 starter slots = 28 total starter slots to distribute
  const totalPeriodsCount = Math.max(1, allPeriods.length);
  const totalAvailableStarterSlots = totalPeriodsCount * 7;
  const idealAvg = totalAvailableStarterSlots / totalPlayers;
  const floorIdeal = Math.floor(idealAvg);
  const ceilIdeal = Math.ceil(idealAvg);

  let minStarts = 999;
  let maxStarts = 0;
  let unbalancedCount = 0;

  reports.forEach(r => {
    r.targetStarterPeriods = Math.round(idealAvg * 10) / 10;
    r.equityScore = r.totalStarterPeriods - idealAvg;

    if (r.totalStarterPeriods < floorIdeal) {
      r.status = 'deficit';
      unbalancedCount++;
    } else if (r.totalStarterPeriods > ceilIdeal) {
      r.status = 'surplus';
      unbalancedCount++;
    } else {
      r.status = 'balanced';
    }

    if (r.totalStarterPeriods < minStarts) minStarts = r.totalStarterPeriods;
    if (r.totalStarterPeriods > maxStarts) maxStarts = r.totalStarterPeriods;
  });

  // Sort reports: deficits first, then balanced, then surplus
  reports.sort((a, b) => {
    if (a.totalStarterPeriods !== b.totalStarterPeriods) {
      return a.totalStarterPeriods - b.totalStarterPeriods;
    }
    return a.playerName.localeCompare(b.playerName);
  });

  return {
    reports,
    totalPlayers,
    averageStarts: Math.round(idealAvg * 10) / 10,
    minStarts: minStarts === 999 ? 0 : minStarts,
    maxStarts,
    idealStartsRange: floorIdeal === ceilIdeal ? `${floorIdeal}` : `${floorIdeal} à ${ceilIdeal}`,
    isFullyBalanced: unbalancedCount === 0 || maxStarts - minStarts <= 1,
    unbalancedCount,
  };
}

/**
 * Suggests smart player rotations for the active period to equalize playtime across the 4 periods
 */
export function generatePeriodRotationSuggestions(
  allPeriods: PeriodMatch[],
  currentPeriod: PeriodMatch,
  team: 'team1' | 'team2'
): RotationSuggestion[] {
  const summary = calculateTeamPlaytime(allPeriods, currentPeriod.id, team);
  const currentTeam = currentPeriod[team];
  if (!currentTeam || currentTeam.titulaires.length === 0 || currentTeam.remplacants.length === 0) {
    return [];
  }

  // Get current starters with their global stats
  const activeStarters = currentTeam.titulaires
    .map((slot, idx) => {
      const key = getPlayerKey(slot);
      const rep = summary.reports.find(r => getPlayerKey({ ...slot, playerName: r.playerName, playerId: r.playerId }) === key)
        || summary.reports.find(r => r.playerName.trim().toLowerCase() === slot.playerName.trim().toLowerCase());
      return {
        slot,
        idx,
        name: slot.playerName || `Titulaire ${idx + 1}`,
        totalStarts: rep ? rep.totalStarterPeriods : 1,
        totalMinutes: rep ? rep.totalMinutesPlayed : (currentPeriod.durationMinutes || 15),
        status: rep ? rep.status : 'balanced',
        isGoalkeeper: slot.position === 'Gardien' || idx === 0,
      };
    })
    .filter(s => Boolean(s.slot.playerName?.trim()));

  // Get current substitutes with their global stats
  const activeSubs = currentTeam.remplacants
    .map((slot, idx) => {
      const key = getPlayerKey(slot);
      const rep = summary.reports.find(r => getPlayerKey({ ...slot, playerName: r.playerName, playerId: r.playerId }) === key)
        || summary.reports.find(r => r.playerName.trim().toLowerCase() === slot.playerName.trim().toLowerCase());
      return {
        slot,
        idx,
        name: slot.playerName || `Remplaçant ${idx + 1}`,
        totalStarts: rep ? rep.totalStarterPeriods : 0,
        totalMinutes: rep ? rep.totalMinutesPlayed : 0,
        status: rep ? rep.status : 'deficit',
      };
    })
    .filter(s => Boolean(s.slot.playerName?.trim()));

  // Candidates for coming IN: substitutes with lowest starts (especially deficit)
  const subsNeedingTime = [...activeSubs].sort((a, b) => a.totalStarts - b.totalStarts);

  // Candidates for resting (rotating OUT): starters with highest starts (surplus or >= average)
  // We avoid forcing a goalkeeper swap unless explicitly beneficial
  const startersToRotate = [...activeStarters].sort((a, b) => {
    if (a.isGoalkeeper && !b.isGoalkeeper) return 1;
    if (!a.isGoalkeeper && b.isGoalkeeper) return -1;
    return b.totalStarts - a.totalStarts;
  });

  const suggestions: RotationSuggestion[] = [];
  const pairedSubIndices = new Set<number>();
  const pairedStarterIndices = new Set<number>();

  // Pair up starters with high starts and subs with low starts
  for (const sub of subsNeedingTime) {
    for (const starter of startersToRotate) {
      if (pairedSubIndices.has(sub.idx) || pairedStarterIndices.has(starter.idx)) {
        continue;
      }

      // If starter has played more starts than the sub
      const diff = starter.totalStarts - sub.totalStarts;
      if (diff >= 1) {
        pairedSubIndices.add(sub.idx);
        pairedStarterIndices.add(starter.idx);

        let priority: 'urgent' | 'recommended' | 'optional' = 'recommended';
        let reason = '';

        if (sub.totalStarts === 0 && starter.totalStarts >= 2) {
          priority = 'urgent';
          reason = `${sub.name} n'a aucune titularisation (${sub.totalStarts}/4) alors que ${starter.name} cumule déjà ${starter.totalStarts}/4 titularisations.`;
        } else if (diff >= 2) {
          priority = 'urgent';
          reason = `Écart important de temps de jeu : ${starter.name} (${starter.totalStarts}/4) vs ${sub.name} (${sub.totalStarts}/4).`;
        } else {
          priority = 'recommended';
          reason = `Équilibrage FootEco : faire entrer ${sub.name} (${sub.totalStarts}/4) à la place de ${starter.name} (${starter.totalStarts}/4).`;
        }

        suggestions.push({
          id: `rot-${starter.idx}-${sub.idx}-${Date.now()}`,
          team,
          starterSlotIndex: starter.idx,
          starterPlayerName: starter.name,
          starterStartsCount: starter.totalStarts,
          starterMinutes: starter.totalMinutes,
          subSlotIndex: sub.idx,
          subPlayerName: sub.name,
          subStartsCount: sub.totalStarts,
          subMinutes: sub.totalMinutes,
          reason,
          priority,
        });

        break;
      }
    }
  }

  return suggestions;
}

/**
 * Swaps one starter and one substitute cleanly in a PeriodMatch
 */
export function executeSingleRotationSwap(
  period: PeriodMatch,
  team: 'team1' | 'team2',
  starterSlotIndex: number,
  subSlotIndex: number
): PeriodMatch {
  const currentTeam = period[team];
  if (!currentTeam) return period;

  const newStarters = [...currentTeam.titulaires];
  const newSubs = [...currentTeam.remplacants];

  if (!newStarters[starterSlotIndex] || !newSubs[subSlotIndex]) {
    return period;
  }

  const starterSlot = newStarters[starterSlotIndex];
  const subSlot = newSubs[subSlotIndex];

  // Swap player data while preserving the tactical slot position
  newStarters[starterSlotIndex] = {
    ...starterSlot,
    playerId: subSlot.playerId,
    playerName: subSlot.playerName,
  };

  newSubs[subSlotIndex] = {
    ...subSlot,
    playerId: starterSlot.playerId,
    playerName: starterSlot.playerName,
  };

  return {
    ...period,
    [team]: {
      ...currentTeam,
      titulaires: newStarters,
      remplacants: newSubs,
    },
  };
}

/**
 * Optimizes and balances player rotations automatically across all 4 periods
 */
export function autoBalanceRosterAcrossAllPeriods(
  allPeriods: PeriodMatch[],
  team: 'team1' | 'team2'
): PeriodMatch[] {
  if (allPeriods.length === 0) return allPeriods;

  // Extract unique players present in this team across all periods
  const playerPool: { id: string | null; name: string }[] = [];
  const seen = new Set<string>();

  allPeriods.forEach(p => {
    const t = p[team];
    if (!t) return;
    [...t.titulaires, ...t.remplacants].forEach(slot => {
      const name = slot.playerName?.trim();
      if (!name) return;
      const key = slot.playerId || name.toLowerCase();
      if (!seen.has(key)) {
        seen.add(key);
        playerPool.push({ id: slot.playerId, name });
      }
    });
  });

  if (playerPool.length <= 7) {
    // If 7 players or fewer, all players must start every period
    return allPeriods;
  }

  // Determine balanced schedule
  // For each period (0 to 3), choose 7 starters and rest of pool as subs
  // We use round-robin rotation offset so each player gets equal starts
  const totalPeriods = allPeriods.length;
  const nPlayers = playerPool.length;

  // Track starts count for each player
  const startsCount = new Map<string, number>();
  playerPool.forEach(p => startsCount.set(p.name, 0));

  const updatedPeriods = allPeriods.map((period, pIdx) => {
    const currentTeam = period[team];
    if (!currentTeam) return period;

    // Sort players so those with fewest starts so far get picked first
    // For tie-breaking, use playerPool index shifted by pIdx
    const sortedPool = [...playerPool].sort((a, b) => {
      const countA = startsCount.get(a.name) || 0;
      const countB = startsCount.get(b.name) || 0;
      if (countA !== countB) return countA - countB;
      const origIdxA = playerPool.findIndex(p => p.name === a.name);
      const origIdxB = playerPool.findIndex(p => p.name === b.name);
      return ((origIdxA + pIdx * 2) % nPlayers) - ((origIdxB + pIdx * 2) % nPlayers);
    });

    const periodStarters = sortedPool.slice(0, 7);
    const periodSubs = sortedPool.slice(7);

    // Update start counts
    periodStarters.forEach(p => {
      startsCount.set(p.name, (startsCount.get(p.name) || 0) + 1);
    });

    // Populate existing slot objects preserving tactical positions
    const newStarters: PlayerSlot[] = currentTeam.titulaires.map((slot, sIdx) => {
      const chosen = periodStarters[sIdx];
      if (!chosen) return slot;
      return {
        ...slot,
        playerId: chosen.id,
        playerName: chosen.name,
      };
    });

    // If there were fewer starter slots than 7, fill up to 7
    while (newStarters.length < 7 && periodStarters[newStarters.length]) {
      const chosen = periodStarters[newStarters.length];
      newStarters.push({
        id: `${team}-p${period.id}-s${newStarters.length}-${Date.now()}`,
        playerId: chosen.id,
        playerName: chosen.name,
        position: 'Milieu',
        note: '',
        shootout: '',
      });
    }

    const newSubs: PlayerSlot[] = periodSubs.map((sub, subIdx) => {
      const existing = currentTeam.remplacants[subIdx];
      return {
        id: existing ? existing.id : `${team}-p${period.id}-sub${subIdx}-${Date.now()}`,
        playerId: sub.id,
        playerName: sub.name,
        position: existing?.position || 'Milieu',
        note: existing?.note || '',
        shootout: existing?.shootout || '',
      };
    });

    return {
      ...period,
      [team]: {
        ...currentTeam,
        titulaires: newStarters,
        remplacants: newSubs,
      },
    };
  });

  return updatedPeriods;
}
