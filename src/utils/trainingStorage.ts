import { TrainingSession } from '../types';
import { getPresetSvg } from './pitchDiagrams';
import { getSeasonFromDate } from './season';

const TRAINING_STORAGE_KEY = 'fe12_training_sessions_v1';

export function getInitialTrainingSessions(): TrainingSession[] {
  const initSvg1 = getPresetSvg('preset-init-1') || '';
  const initSvg2 = getPresetSvg('preset-init-2') || '';
  const formSvg1 = getPresetSvg('preset-form-1') || '';
  const formSvg2 = getPresetSvg('preset-form-2') || '';
  const gameSvg = getPresetSvg('preset-game-6v6') || '';

  return [
    {
      id: 'session-2025-08-04-fe12',
      title: 'Séance FootEco FE12 - Récupération & Duels 1c1',
      team: 'FE12 Bas-Valais',
      date: '2025-08-04',
      season: '2025/2026',
      coach: 'Sébastien M.',
      assistantCoach: 'Miguel R.',
      themeTE: {
        description: 'Geste technique à la récupération du ballon\nPasse, contrôle, dribble, ...',
        coachingAccents: 'Placement défensif\nDétermination et volonté de vouloir le ballon\nDéfendre ensemble',
      },
      themeTA: {
        description: 'Freiner et orienter l\'adversaire\nCouper les lignes de passe\nFermer l\'axe',
        defOrOff: 'OFF',
        antagonism: 'Volonté de vouloir gagner le ballon',
        coachingAccents: 'DEF ou OFF: OFF\nAntagonisme OFF et DEF: Volonté de vouloir gagner le ballon',
      },
      themePE: {
        description: 'Vitesse de réaction et engagement physique',
        coachingAccents: 'Concentration, intensité dans les transitions',
      },
      initialPart: {
        title: 'Partie initiale - Focus TE/KO',
        focus: 'Focus TE/KO',
        duration: '2X 15 min\nTotal 30 min',
        description: 'Dessin 1 = Duel 1 contre 1 passer derrière les assiettes et l\'entraîneur remet le ballon entre les deux piquets\n\nDessin 2 = Duel 1 contre 1 le ballon est remis au premier joueur qui passe les deux piquets et contourne le piquet et l\'autre joueur devient défenseur',
        drawing1: {
          image: initSvg1,
          coach: 'SEB',
          caption: 'Duel 1c1 contournement assiettes & piquets',
        },
        drawing2: {
          image: initSvg2,
          coach: 'Miguel',
          caption: 'Duel 1c1 slalom & transition défenseur',
        },
      },
      playedForms: {
        title: 'Formes jouées - Focus TA',
        focus: 'Focus TA',
        duration: '2 X 15min\nTotal 30 min',
        description: 'Dessin 1 = 1 contre 1, 4 zones et 2 petits buts\n\nDessin 2 = Idem',
        drawing1: {
          image: formSvg1,
          coach: 'SEB',
          caption: '1 contre 1 en 4 zones & 2 petits buts (SEB)',
        },
        drawing2: {
          image: formSvg2,
          coach: 'Miguel',
          caption: '1 contre 1 en 4 zones & 2 petits buts (Miguel)',
        },
      },
      finalGame: {
        title: 'Jeu final - Focus TE/TA',
        focus: 'Focus TE/TA',
        duration: '30 min',
        description: 'Match 6 contre 6\n- Positionnement def\n- Détermination\n- Def et off ensemble',
        drawing1: {
          image: gameSvg,
          coach: '',
          caption: 'Match final 6 contre 6 (Les remplaçants jonglent en groupe)',
        },
        drawing2: {
          image: '',
          coach: '',
          caption: '',
        },
      },
      remarksAndIndividualization: 'Séance modèle officielle FootEco FE12 Bas-Valais. Excellente implication dans les duels.',
      bilan: 'Séance réussie avec un bon engagement défensif collectif et une excellente réactivité à la perte du ballon.',
      createdAt: '2025-08-04T18:00:00.000Z',
      updatedAt: '2025-08-04T19:30:00.000Z',
    },
    {
      id: 'session-2026-09-10-conservation',
      title: 'Séance FootEco FE12 - Conservation & Sortie sous Pression',
      team: 'FE12 Bas-Valais',
      date: '2026-09-10',
      season: '2026/2027',
      coach: 'Miguel R.',
      assistantCoach: 'Sébastien M.',
      themeTE: {
        description: 'Qualité de la première touche orientée et passe claquée au sol',
        coachingAccents: 'Prise d\'information avant de recevoir le ballon (scan 360°)',
      },
      themeTA: {
        description: 'Création d\'angles de passe, jeu en triangle et recherche du joueur libre',
        defOrOff: 'DEF & OFF',
        antagonism: 'Pression constante du premier rideau',
        coachingAccents: 'Fixer dans une zone pour renverser à l\'opposé',
      },
      themePE: {
        description: 'Coordination motrice et tonicité des appuis',
        coachingAccents: 'Communication verbale et non verbale',
      },
      initialPart: {
        title: 'Partie initiale - Focus TE/KO',
        focus: 'Focus TE/KO',
        duration: '20 min',
        description: 'Rondo 4v1 avec 2 touches obligatoires puis 1 touche libre sur 3ème passe',
        drawing1: {
          image: initSvg1,
          coach: 'Miguel',
          caption: 'Échauffement technique et rondo dynamique',
        },
        drawing2: {
          image: '',
          coach: '',
          caption: '',
        },
      },
      playedForms: {
        title: 'Formes jouées - Focus TA',
        focus: 'Focus TA',
        duration: '35 min',
        description: 'Jeu de position 4v4 + 3 jokers axiaux et latéraux',
        drawing1: {
          image: getPresetSvg('preset-conservation') || '',
          coach: 'SEB',
          caption: 'Conservation 4v4 + 3 jokers',
        },
        drawing2: {
          image: '',
          coach: '',
          caption: '',
        },
      },
      finalGame: {
        title: 'Jeu final - Focus TE/TA',
        focus: 'Focus TE/TA',
        duration: '30 min',
        description: 'Match 7 contre 7 FootEco avec contrainte de ressortir par les couloirs',
        drawing1: {
          image: gameSvg,
          coach: '',
          caption: 'Match d\'application 7v7 FootEco',
        },
        drawing2: {
          image: '',
          coach: '',
          caption: '',
        },
      },
      remarksAndIndividualization: 'Travail spécifique appuis pour les milieux axiaux.',
      bilan: 'Bonne circulation du ballon avec de nettes améliorations dans les prises de balle orientées.',
      createdAt: '2026-09-10T17:00:00.000Z',
      updatedAt: '2026-09-10T19:00:00.000Z',
    },
  ];
}

export function loadTrainingSessions(): TrainingSession[] {
  try {
    const raw = localStorage.getItem(TRAINING_STORAGE_KEY);
    if (raw) {
      const parsed = JSON.parse(raw);
      if (Array.isArray(parsed) && parsed.length > 0) {
        return parsed;
      }
    }
  } catch (e) {
    console.error('Error loading training sessions from localStorage', e);
  }
  const initial = getInitialTrainingSessions();
  saveAllTrainingSessions(initial);
  return initial;
}

export function saveAllTrainingSessions(sessions: TrainingSession[]): void {
  try {
    localStorage.setItem(TRAINING_STORAGE_KEY, JSON.stringify(sessions));
  } catch (e) {
    console.error('Error saving all training sessions to localStorage', e);
  }
}

export function saveTrainingSession(session: TrainingSession): TrainingSession[] {
  const current = loadTrainingSessions();
  const existingIdx = current.findIndex(s => s.id === session.id);
  const now = new Date().toISOString();

  let updated: TrainingSession[];
  if (existingIdx >= 0) {
    updated = [...current];
    updated[existingIdx] = {
      ...session,
      updatedAt: now,
    };
  } else {
    updated = [
      {
        ...session,
        createdAt: session.createdAt || now,
        updatedAt: now,
      },
      ...current,
    ];
  }

  saveAllTrainingSessions(updated);
  return updated;
}

export function deleteTrainingSession(sessionId: string): TrainingSession[] {
  const current = loadTrainingSessions();
  const updated = current.filter(s => s.id !== sessionId);
  saveAllTrainingSessions(updated);
  return updated;
}

export function duplicateTrainingSession(session: TrainingSession): TrainingSession {
  const today = new Date().toISOString().split('T')[0];
  const newSession: TrainingSession = {
    ...JSON.parse(JSON.stringify(session)),
    id: `session-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`,
    title: `${session.title} (Copie)`,
    date: today,
    season: getSeasonFromDate(today),
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  };

  const all = saveTrainingSession(newSession);
  return newSession;
}

export function createNewEmptyTrainingSession(
  defaultDate?: string,
  defaultSeason?: string,
  defaultCoach?: string,
  defaultTeam: string = 'FE12 Bas-Valais'
): TrainingSession {
  const dateToUse = defaultDate || new Date().toISOString().split('T')[0];
  const seasonToUse = defaultSeason || getSeasonFromDate(dateToUse);
  const coachToUse = defaultCoach || 'Sébastien M.';
  const initSvg1 = getPresetSvg('preset-init-1') || '';
  const formSvg1 = getPresetSvg('preset-form-1') || '';
  const gameSvg = getPresetSvg('preset-game-6v6') || '';

  return {
    id: `session-${Date.now()}`,
    title: `Séance Entraînement FE12 du ${dateToUse.split('-').reverse().join('.')}`,
    team: defaultTeam,
    date: dateToUse,
    season: seasonToUse,
    coach: coachToUse,
    assistantCoach: 'Miguel R.',
    themeTE: {
      description: 'Geste technique à la récupération du ballon\nPasse, contrôle, dribble, ...',
      coachingAccents: 'Placement défensif\nDétermination et volonté de vouloir le ballon\nDéfendre ensemble',
    },
    themeTA: {
      description: 'Freiner et orienter l\'adversaire\nCouper les lignes de passe\nFermer l\'axe',
      defOrOff: 'OFF',
      antagonism: 'Volonté de vouloir gagner le ballon',
      coachingAccents: '',
    },
    themePE: {
      description: '',
      coachingAccents: '',
    },
    initialPart: {
      title: 'Partie initiale - Focus TE/KO',
      focus: 'Focus TE/KO',
      duration: '2X 15 min\nTotal 30 min',
      description: 'Dessin 1 = Duel 1 contre 1 passer derrière les assiettes et l\'entraîneur remet le ballon entre les deux piquets\n\nDessin 2 = Duel 1 contre 1 le ballon est remis au premier joueur qui passe les deux piquets et contourne le piquet',
      drawing1: {
        image: initSvg1,
        coach: 'SEB',
        caption: 'Duel 1c1 contournement assiettes & piquets',
      },
      drawing2: {
        image: '',
        coach: 'Miguel',
        caption: '',
      },
    },
    playedForms: {
      title: 'Formes jouées - Focus TA',
      focus: 'Focus TA',
      duration: '2 X 15min\nTotal 30 min',
      description: 'Dessin 1 = 1 contre 1, 4 zones et 2 petits buts\n\nDessin 2 = Idem',
      drawing1: {
        image: formSvg1,
        coach: 'SEB',
        caption: '1 contre 1 en 4 zones & 2 petits buts (SEB)',
      },
      drawing2: {
        image: '',
        coach: 'Miguel',
        caption: '',
      },
    },
    finalGame: {
      title: 'Jeu final - Focus TE/TA',
      focus: 'Focus TE/TA',
      duration: '30 min',
      description: 'Match 6 contre 6\n- Positionnement def\n- Détermination\n- Def et off ensemble',
      drawing1: {
        image: gameSvg,
        coach: '',
        caption: 'Match final 6 contre 6 (Les remplaçants jonglent en groupe)',
      },
      drawing2: {
        image: '',
        coach: '',
        caption: '',
      },
    },
    remarksAndIndividualization: '',
    bilan: '',
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  };
}
