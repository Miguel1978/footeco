import * as XLSX from 'xlsx';
import { MatchData, PlayerSlot } from '../types';
import { getEventTypeConfig } from './season';

export function exportMatchToExcel(matchData: MatchData, filename?: string) {
  const wb = XLSX.utils.book_new();

  const matchTitle = matchData.matchTitle || 'Match FE12 FootEco';
  const opponent = matchData.opponent || 'Non renseigné';
  const matchDate = matchData.date || new Date().toLocaleDateString('fr-CH');
  const season = matchData.season || '2026/2027';
  const eventConfig = getEventTypeConfig(matchData.eventType);
  const totalPossibleMinutes = matchData.periods.reduce((acc, p) => acc + (p.durationMinutes || 15), 0);

  // ==========================================
  // SHEET 1: FEUILLE DE MATCH COMPLÈTE
  // ==========================================
  const sheet1Data: (string | number)[][] = [];

  sheet1Data.push(['FE12 - FEUILLE DE MATCH OFFICIELLE FOOTECO 7v7']);
  sheet1Data.push([`Titre : ${matchTitle}`, `Type : ${eventConfig.label}`, `Saison : ${season}`, `Date : ${matchDate}`, `Adversaire/Cadre : ${opponent}`]);
  sheet1Data.push(['Format : 7 contre 7 • 4 périodes de jeu']);
  sheet1Data.push([]); // blank line

  matchData.periods.forEach((period) => {
    sheet1Data.push([
      `=== ${period.title.toUpperCase()} (${period.durationMinutes || 15} MIN) ===`,
      '',
      '',
      '',
      '',
      '',
      '',
      '',
      '',
      ''
    ]);

    // Scores header
    const t1ScoreStr = `${period.team1.scoreMatch || '0'} - ${period.team1.scoreOpponent || '0'}`;
    const t2ScoreStr = `${period.team2.scoreMatch || '0'} - ${period.team2.scoreOpponent || '0'}`;
    const t1Shootout = `${period.team1.shootoutScore || '0'} - ${period.team1.shootoutOpponent || '0'}`;
    const t2Shootout = `${period.team2.shootoutScore || '0'} - ${period.team2.shootoutOpponent || '0'}`;

    sheet1Data.push([
      `ÉQUIPE 1 (JAUNE) - Coach: ${period.team1.coachName || 'Seb'}`,
      `Score: ${t1ScoreStr}`,
      `Shootout: ${t1Shootout}`,
      `Pts: ${period.team1.points || '0'} (${period.team1.result || '-'})`,
      '',
      `ÉQUIPE 2 (ROUGE) - Coach: ${period.team2.coachName || 'Miguel'}`,
      `Score: ${t2ScoreStr}`,
      `Shootout: ${t2Shootout}`,
      `Pts: ${period.team2.points || '0'} (${period.team2.result || '-'})`,
      ''
    ]);

    const eval1 = (s: PlayerSlot | undefined) => {
      if (!s) return '';
      const r = s.rating ? `${s.rating}★` : '';
      const n = s.note ? ` (${s.note})` : '';
      return `${r}${n}`.trim();
    };

    sheet1Data.push([
      'N°',
      'Joueur Équipe 1',
      'Poste',
      'Éval & Notes',
      'Shootout',
      'N°',
      'Joueur Équipe 2',
      'Poste',
      'Éval & Notes',
      'Shootout'
    ]);

    // 7 Starters rows
    for (let i = 0; i < 7; i++) {
      const s1: PlayerSlot | undefined = period.team1.titulaires[i];
      const s2: PlayerSlot | undefined = period.team2.titulaires[i];

      sheet1Data.push([
        i + 1,
        s1?.playerName || '—',
        s1?.position || '',
        eval1(s1),
        s1?.shootout || '',
        i + 1,
        s2?.playerName || '—',
        s2?.position || '',
        eval1(s2),
        s2?.shootout || ''
      ]);
    }

    // Subs header
    sheet1Data.push([
      'Remp.',
      'Remplaçants Équipe 1',
      '',
      '',
      '',
      'Remp.',
      'Remplaçants Équipe 2',
      '',
      '',
      ''
    ]);

    const maxSubs = Math.max(period.team1.remplacants.length, period.team2.remplacants.length, 1);
    for (let i = 0; i < maxSubs; i++) {
      const sub1 = period.team1.remplacants[i];
      const sub2 = period.team2.remplacants[i];

      sheet1Data.push([
        sub1 ? `R${i + 1}` : '',
        sub1?.playerName || (i === 0 && !sub1 ? '(Aucun)' : ''),
        sub1?.position || '',
        eval1(sub1),
        sub1?.shootout || '',
        sub2 ? `R${i + 1}` : '',
        sub2?.playerName || (i === 0 && !sub2 ? '(Aucun)' : ''),
        sub2?.position || '',
        eval1(sub2),
        sub2?.shootout || ''
      ]);
    }

    if (period.notes && period.notes.trim()) {
      sheet1Data.push([`📝 NOTES TACTIQUES & OBSERVATIONS (${period.title.toUpperCase()}) :`]);
      sheet1Data.push([period.notes]);
    } else {
      sheet1Data.push([`📝 NOTES TACTIQUES (${period.title}) : (Aucune observation saisie)`]);
    }

    sheet1Data.push([]); // blank line between periods
  });

  const ws1 = XLSX.utils.aoa_to_sheet(sheet1Data);

  // Set column widths for Sheet 1
  ws1['!cols'] = [
    { wch: 6 },
    { wch: 24 },
    { wch: 14 },
    { wch: 22 },
    { wch: 12 },
    { wch: 6 },
    { wch: 24 },
    { wch: 14 },
    { wch: 22 },
    { wch: 12 }
  ];

  XLSX.utils.book_append_sheet(wb, ws1, 'Les 4 Matchs');

  // ==========================================
  // INDIVIDUAL SHEETS FOR EACH OF THE 4 MATCHES
  // ==========================================
  matchData.periods.forEach((period, idx) => {
    const periodSheetData: (string | number)[][] = [];
    const sheetTitle = period.title || `Match ${idx + 1}`;

    periodSheetData.push([`FE12 - ${sheetTitle.toUpperCase()} (${period.durationMinutes || 15} MIN)`]);
    periodSheetData.push([`Type : ${eventConfig.label}`, `Saison : ${season}`, `Date : ${matchDate}`, `Adversaire : ${opponent}`]);
    periodSheetData.push([]);

    const t1ScoreStr = `${period.team1.scoreMatch || '0'} - ${period.team1.scoreOpponent || '0'}`;
    const t2ScoreStr = `${period.team2.scoreMatch || '0'} - ${period.team2.scoreOpponent || '0'}`;
    const t1Shootout = `${period.team1.shootoutScore || '0'} - ${period.team1.shootoutOpponent || '0'}`;
    const t2Shootout = `${period.team2.shootoutScore || '0'} - ${period.team2.shootoutOpponent || '0'}`;

    periodSheetData.push([
      `ÉQUIPE 1 (JAUNE) - Coach: ${period.team1.coachName || 'Seb'}`,
      `Score: ${t1ScoreStr}`,
      `Shootout: ${t1Shootout}`,
      `Pts: ${period.team1.points || '0'} (${period.team1.result || '-'})`,
      '',
      `ÉQUIPE 2 (ROUGE) - Coach: ${period.team2.coachName || 'Miguel'}`,
      `Score: ${t2ScoreStr}`,
      `Shootout: ${t2Shootout}`,
      `Pts: ${period.team2.points || '0'} (${period.team2.result || '-'})`,
      ''
    ]);

    const evalSlot = (s: PlayerSlot | undefined) => {
      if (!s) return '';
      const r = s.rating ? `${s.rating}★` : '';
      const n = s.note ? ` (${s.note})` : '';
      return `${r}${n}`.trim();
    };

    periodSheetData.push([
      'N°',
      'Joueur Équipe 1',
      'Poste',
      'Éval & Notes',
      'Shootout',
      'N°',
      'Joueur Équipe 2',
      'Poste',
      'Éval & Notes',
      'Shootout'
    ]);

    for (let i = 0; i < 7; i++) {
      const s1 = period.team1.titulaires[i];
      const s2 = period.team2.titulaires[i];
      periodSheetData.push([
        i + 1,
        s1?.playerName || '—',
        s1?.position || '',
        evalSlot(s1),
        s1?.shootout || '',
        i + 1,
        s2?.playerName || '—',
        s2?.position || '',
        evalSlot(s2),
        s2?.shootout || ''
      ]);
    }

    periodSheetData.push([
      'Remp.',
      'Remplaçants Équipe 1',
      '',
      '',
      '',
      'Remp.',
      'Remplaçants Équipe 2',
      '',
      '',
      ''
    ]);

    const maxSubs = Math.max(period.team1.remplacants.length, period.team2.remplacants.length, 1);
    for (let i = 0; i < maxSubs; i++) {
      const sub1 = period.team1.remplacants[i];
      const sub2 = period.team2.remplacants[i];
      periodSheetData.push([
        sub1 ? `R${i + 1}` : '',
        sub1?.playerName || (i === 0 && !sub1 ? '(Aucun)' : ''),
        sub1?.position || '',
        evalSlot(sub1),
        sub1?.shootout || '',
        sub2 ? `R${i + 1}` : '',
        sub2?.playerName || (i === 0 && !sub2 ? '(Aucun)' : ''),
        sub2?.position || '',
        evalSlot(sub2),
        sub2?.shootout || ''
      ]);
    }

    periodSheetData.push([]);
    if (period.notes && period.notes.trim()) {
      periodSheetData.push([`📝 NOTES TACTIQUES & OBSERVATIONS (${period.title.toUpperCase()}) :`]);
      periodSheetData.push([period.notes]);
    } else {
      periodSheetData.push([`📝 NOTES TACTIQUES (${period.title}) : (Aucune observation saisie)`]);
    }

    const wsPeriod = XLSX.utils.aoa_to_sheet(periodSheetData);
    wsPeriod['!cols'] = ws1['!cols'];
    XLSX.utils.book_append_sheet(wb, wsPeriod, sheetTitle);
  });

  // ==========================================
  // SHEET 2: STATISTIQUES & TEMPS DE JEU
  // ==========================================
  const sheet2Data: (string | number)[][] = [];

  sheet2Data.push(['STATISTIQUES DE TEMPS DE JEU & ÉVALUATIONS DES JOUEURS']);
  sheet2Data.push([`Total Match : ${totalPossibleMinutes} minutes`, `Objectif FootEco 50% min : ${totalPossibleMinutes / 2} min / joueur`]);
  sheet2Data.push([]);

  sheet2Data.push([
    'Nom Joueur',
    'N°',
    'Poste Défaut',
    'Période 1 (min)',
    'Période 2 (min)',
    'Période 3 (min)',
    'Période 4 (min)',
    'Total Min Jouées',
    '% Temps de Jeu',
    'Règle 50% Respectée',
    'Note P1',
    'Note P2',
    'Note P3',
    'Note P4',
    'Moyenne Évaluation (★)'
  ]);

  // Aggregate stats per player
  const playerStatsMap = new Map<string, {
    name: string;
    number?: number;
    defaultPosition?: string;
    minutesByPeriod: number[];
    ratingsByPeriod: (number | null)[];
    totalMinutes: number;
  }>();

  // Initialize from roster
  matchData.roster.forEach((player) => {
    const key = player.name.trim().toLowerCase();
    playerStatsMap.set(key, {
      name: player.name,
      number: player.number,
      defaultPosition: player.defaultPosition,
      minutesByPeriod: [0, 0, 0, 0],
      ratingsByPeriod: [null, null, null, null],
      totalMinutes: 0
    });
  });

  // Calculate from periods
  matchData.periods.forEach((period, pIdx) => {
    const periodDur = period.durationMinutes || 15;

    const processSlots = (slots: PlayerSlot[]) => {
      slots.forEach((s) => {
        if (!s.playerName || !s.playerName.trim()) return;
        const key = s.playerName.trim().toLowerCase();
        let stat = playerStatsMap.get(key);
        if (!stat) {
          stat = {
            name: s.playerName.trim(),
            minutesByPeriod: [0, 0, 0, 0],
            ratingsByPeriod: [null, null, null, null],
            totalMinutes: 0
          };
          playerStatsMap.set(key, stat);
        }

        if (pIdx < 4) {
          stat.minutesByPeriod[pIdx] = periodDur;
          stat.totalMinutes += periodDur;
          if (s.rating) {
            stat.ratingsByPeriod[pIdx] = s.rating;
          }
        }
      });
    };

    processSlots(period.team1.titulaires);
    processSlots(period.team1.remplacants);
    processSlots(period.team2.titulaires);
    processSlots(period.team2.remplacants);
  });

  const playerStatsList = Array.from(playerStatsMap.values());
  playerStatsList.sort((a, b) => b.totalMinutes - a.totalMinutes);

  const targetMinutes = totalPossibleMinutes / 2;

  playerStatsList.forEach((st) => {
    const percent = totalPossibleMinutes > 0 ? Math.round((st.totalMinutes / totalPossibleMinutes) * 100) : 0;
    const meets50 = st.totalMinutes >= targetMinutes ? 'OUI' : 'NON (< 50%)';

    const validRatings = st.ratingsByPeriod.filter((r): r is number => r !== null);
    const avgRating = validRatings.length > 0
      ? (validRatings.reduce((a, b) => a + b, 0) / validRatings.length).toFixed(2)
      : 'Non noté';

    sheet2Data.push([
      st.name,
      st.number !== undefined ? st.number : '',
      st.defaultPosition || '',
      st.minutesByPeriod[0],
      st.minutesByPeriod[1],
      st.minutesByPeriod[2],
      st.minutesByPeriod[3],
      st.totalMinutes,
      `${percent}%`,
      meets50,
      st.ratingsByPeriod[0] !== null ? `${st.ratingsByPeriod[0]}★` : '-',
      st.ratingsByPeriod[1] !== null ? `${st.ratingsByPeriod[1]}★` : '-',
      st.ratingsByPeriod[2] !== null ? `${st.ratingsByPeriod[2]}★` : '-',
      st.ratingsByPeriod[3] !== null ? `${st.ratingsByPeriod[3]}★` : '-',
      avgRating
    ]);
  });

  const ws2 = XLSX.utils.aoa_to_sheet(sheet2Data);
  ws2['!cols'] = [
    { wch: 20 },
    { wch: 6 },
    { wch: 14 },
    { wch: 14 },
    { wch: 14 },
    { wch: 14 },
    { wch: 14 },
    { wch: 16 },
    { wch: 15 },
    { wch: 18 },
    { wch: 10 },
    { wch: 10 },
    { wch: 10 },
    { wch: 10 },
    { wch: 22 }
  ];

  XLSX.utils.book_append_sheet(wb, ws2, 'Temps de Jeu & Évals');

  // ==========================================
  // SHEET 3: EFFECTIF DU GROUPE
  // ==========================================
  const sheet3Data: (string | number)[][] = [
    ['EFFECTIF DES JOUEURS FE12'],
    ['Nom', 'Numéro', 'Poste de prédilection', 'Présent au match'],
    ...matchData.roster.map((p) => [
      p.name,
      p.number !== undefined ? p.number : '',
      p.defaultPosition || '',
      p.isPresent ? 'OUI' : 'ABSENT'
    ])
  ];

  const ws3 = XLSX.utils.aoa_to_sheet(sheet3Data);
  ws3['!cols'] = [
    { wch: 22 },
    { wch: 10 },
    { wch: 20 },
    { wch: 18 }
  ];

  XLSX.utils.book_append_sheet(wb, ws3, 'Effectif');

  // Write and download Excel file
  const outFilename = filename || `Feuille_FootEco_FE12_Les_4_Matchs_${opponent.replace(/\s+/g, '_')}_${matchDate.replace(/\//g, '-')}.xlsx`;
  XLSX.writeFile(wb, outFilename);
  return true;
}

/**
 * Exports a single active match sheet/period to an Excel workbook (.xlsx).
 * Includes scores, full lineups (starters + substitutes), positions, evaluations & player notes,
 * shootout details, and the period's tactical notes & observations.
 */
export function exportPeriodToExcel(
  matchData: MatchData,
  periodIndex: number,
  filename?: string
): boolean {
  const period = matchData.periods[periodIndex] || matchData.periods[0];
  if (!period) return false;

  const wb = XLSX.utils.book_new();

  const matchTitle = matchData.matchTitle || 'Match FE12 FootEco';
  const opponent = matchData.opponent || 'Non renseigné';
  const matchDate = matchData.date || new Date().toLocaleDateString('fr-CH');
  const season = matchData.season || '2026/2027';
  const eventConfig = getEventTypeConfig(matchData.eventType);
  const periodTitle = period.title || `Période ${periodIndex + 1}`;
  const periodDuration = period.durationMinutes || 15;

  // ==========================================
  // SHEET 1: FEUILLE DE MATCH - CETTE PÉRIODE
  // ==========================================
  const sheetData: (string | number)[][] = [];

  sheetData.push([`FE12 - FEUILLE OFFICIELLE FOOTECO 7v7 - ${periodTitle.toUpperCase()} (${periodDuration} MIN)`]);
  sheetData.push([`Titre : ${matchTitle}`, `Type : ${eventConfig.label}`, `Saison : ${season}`, `Date : ${matchDate}`, `Adversaire/Cadre : ${opponent}`]);
  sheetData.push([`Période active : ${periodTitle}`, `Durée : ${periodDuration} minutes`, `Format : 7 contre 7 FootEco`]);
  sheetData.push([]);

  // Scores header
  const t1ScoreStr = `${period.team1.scoreMatch || '0'} - ${period.team1.scoreOpponent || '0'}`;
  const t2ScoreStr = `${period.team2.scoreMatch || '0'} - ${period.team2.scoreOpponent || '0'}`;
  const t1Shootout = `${period.team1.shootoutScore || '0'} - ${period.team1.shootoutOpponent || '0'}`;
  const t2Shootout = `${period.team2.shootoutScore || '0'} - ${period.team2.shootoutOpponent || '0'}`;

  sheetData.push([
    `ÉQUIPE 1 (JAUNE) - Coach: ${period.team1.coachName || 'Seb'}`,
    `Score: ${t1ScoreStr}`,
    `Shootout: ${t1Shootout}`,
    `Pts: ${period.team1.points || '0'} (${period.team1.result || '-'})`,
    '',
    `ÉQUIPE 2 (ROUGE) - Coach: ${period.team2.coachName || 'Miguel'}`,
    `Score: ${t2ScoreStr}`,
    `Shootout: ${t2Shootout}`,
    `Pts: ${period.team2.points || '0'} (${period.team2.result || '-'})`,
    ''
  ]);

  const evalSlot = (s: PlayerSlot | undefined) => {
    if (!s) return '';
    const r = s.rating ? `${s.rating}★` : '';
    const n = s.note ? ` (${s.note})` : '';
    return `${r}${n}`.trim();
  };

  sheetData.push([
    'N°',
    'Joueur Équipe 1',
    'Poste',
    'Éval & Notes',
    'Shootout',
    'N°',
    'Joueur Équipe 2',
    'Poste',
    'Éval & Notes',
    'Shootout'
  ]);

  // 7 Starters rows
  for (let i = 0; i < 7; i++) {
    const s1 = period.team1.titulaires[i];
    const s2 = period.team2.titulaires[i];
    sheetData.push([
      i + 1,
      s1?.playerName || '—',
      s1?.position || '',
      evalSlot(s1),
      s1?.shootout || '',
      i + 1,
      s2?.playerName || '—',
      s2?.position || '',
      evalSlot(s2),
      s2?.shootout || ''
    ]);
  }

  // Subs header
  sheetData.push([
    'Remp.',
    'Remplaçants Équipe 1',
    '',
    '',
    '',
    'Remp.',
    'Remplaçants Équipe 2',
    '',
    '',
    ''
  ]);

  const maxSubs = Math.max(period.team1.remplacants.length, period.team2.remplacants.length, 1);
  for (let i = 0; i < maxSubs; i++) {
    const sub1 = period.team1.remplacants[i];
    const sub2 = period.team2.remplacants[i];
    sheetData.push([
      sub1 ? `R${i + 1}` : '',
      sub1?.playerName || (i === 0 && !sub1 ? '(Aucun)' : ''),
      sub1?.position || '',
      evalSlot(sub1),
      sub1?.shootout || '',
      sub2 ? `R${i + 1}` : '',
      sub2?.playerName || (i === 0 && !sub2 ? '(Aucun)' : ''),
      sub2?.position || '',
      evalSlot(sub2),
      sub2?.shootout || ''
    ]);
  }

  // Tactical notes section
  sheetData.push([]);
  if (period.notes && period.notes.trim()) {
    sheetData.push([`📝 NOTES TACTIQUES & OBSERVATIONS (${periodTitle.toUpperCase()}) :`]);
    sheetData.push([period.notes]);
  } else {
    sheetData.push([`📝 NOTES TACTIQUES (${periodTitle}) : (Aucune observation saisie)`]);
  }

  const ws1 = XLSX.utils.aoa_to_sheet(sheetData);
  ws1['!cols'] = [
    { wch: 6 },
    { wch: 24 },
    { wch: 14 },
    { wch: 22 },
    { wch: 12 },
    { wch: 6 },
    { wch: 24 },
    { wch: 14 },
    { wch: 22 },
    { wch: 12 }
  ];
  XLSX.utils.book_append_sheet(wb, ws1, periodTitle);

  // ==========================================
  // SHEET 2: PARTICIPATION DE LA PÉRIODE
  // ==========================================
  const sheet2Data: (string | number)[][] = [];
  sheet2Data.push([`PARTICIPATION & ÉVALUATIONS - ${periodTitle.toUpperCase()}`]);
  sheet2Data.push([`Durée de jeu effective : ${periodDuration} minutes`]);
  sheet2Data.push([]);
  sheet2Data.push(['Équipe', 'Statut', 'Nom Joueur', 'Poste occupé', 'Évaluation (★)', 'Note / Consigne', 'Shootout']);

  const addPlayersToStats = (teamName: string, status: string, slots: PlayerSlot[]) => {
    slots.forEach((slot) => {
      if (slot.playerName && slot.playerName.trim()) {
        sheet2Data.push([
          teamName,
          status,
          slot.playerName.trim(),
          slot.position || '',
          slot.rating ? `${slot.rating}★` : '-',
          slot.note || '',
          slot.shootout || ''
        ]);
      }
    });
  };

  addPlayersToStats('Équipe 1', 'Titulaire', period.team1.titulaires);
  addPlayersToStats('Équipe 1', 'Remplaçant', period.team1.remplacants);
  addPlayersToStats('Équipe 2', 'Titulaire', period.team2.titulaires);
  addPlayersToStats('Équipe 2', 'Remplaçant', period.team2.remplacants);

  const ws2 = XLSX.utils.aoa_to_sheet(sheet2Data);
  ws2['!cols'] = [
    { wch: 12 },
    { wch: 14 },
    { wch: 24 },
    { wch: 16 },
    { wch: 14 },
    { wch: 30 },
    { wch: 12 }
  ];
  XLSX.utils.book_append_sheet(wb, ws2, 'Joueurs & Évals');

  // ==========================================
  // SHEET 3: EFFECTIF DU GROUPE
  // ==========================================
  const sheet3Data: (string | number)[][] = [
    ['EFFECTIF DES JOUEURS FE12'],
    ['Nom', 'Numéro', 'Poste de prédilection', 'Présent au match'],
    ...matchData.roster.map((p) => [
      p.name,
      p.number !== undefined ? p.number : '',
      p.defaultPosition || '',
      p.isPresent ? 'OUI' : 'ABSENT'
    ])
  ];

  const ws3 = XLSX.utils.aoa_to_sheet(sheet3Data);
  ws3['!cols'] = [
    { wch: 22 },
    { wch: 10 },
    { wch: 20 },
    { wch: 18 }
  ];
  XLSX.utils.book_append_sheet(wb, ws3, 'Effectif');

  // Download
  const outFilename =
    filename ||
    `Feuille_FootEco_FE12_${periodTitle.replace(/\s+/g, '_')}_${opponent.replace(/\s+/g, '_')}_${matchDate.replace(/\//g, '-')}.xlsx`;
  XLSX.writeFile(wb, outFilename);
  return true;
}
