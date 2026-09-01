import { TrainingSession, TrainingExercisePart } from '../types';
import { getPresetSvg } from './pitchDiagrams';
import { getSeasonFromDate } from './season';

export type ASFThemeCategory = 'Technique' | 'Tactique' | 'Passe' | 'Dribble' | 'Tir / Finition' | 'Défense' | 'Transition';

export interface ASFThematicPreset {
  id: string;
  label: string;
  category: ASFThemeCategory;
  phase: 'DEF' | 'OFF' | 'DEF & OFF';
  description: string;
  defaultPrompt: string;
}

export const ASF_THEMATIC_PRESETS: ASFThematicPreset[] = [
  // ==================== 1. PASSE & CIRCULATION ====================
  {
    id: 'passe-courte-appui',
    label: 'Passes courtes au sol, appuis & 1ère touche',
    category: 'Passe',
    phase: 'OFF',
    description: 'Passe appuyée au sol (intérieur du pied), orientation du corps, prise d\'information avant de recevoir.',
    defaultPrompt: 'Séance axée sur la qualité et le timing des passes courtes au sol, la première touche orientée vers le jeu et la disponibilité permanente.',
  },
  {
    id: 'passe-intervalle-fixer',
    label: 'Passe dans l\'intervalle & Fixer-Donner',
    category: 'Passe',
    phase: 'OFF',
    description: 'Fixer l\'adversaire balle au pied, attirer la pression pour libérer un coéquipier dans l\'intervalle.',
    defaultPrompt: 'Séance sur le principe "fixer pour donner", casser les lignes de passe adverses avec une transmission tranchante.',
  },
  {
    id: 'passe-une-deux-triangle',
    label: 'Une-Deux, Dédoublements & Jeu à 3',
    category: 'Passe',
    phase: 'OFF',
    description: 'Combinaisons rapides en une ou deux touches, jeu en appui/soutien et courses croisées dans l\'espace libre.',
    defaultPrompt: 'Séance sur les combinaisons offensives : une-deux rapides, troisième homme et dédoublements sur les côtés.',
  },
  {
    id: 'passe-renversement-long',
    label: 'Jeu court / Jeu long & Renversement',
    category: 'Passe',
    phase: 'OFF',
    description: 'Densifier d\'un côté pour renverser à l\'opposé sur le joueur libre avec passe longue brossée ou tendue.',
    defaultPrompt: 'Séance sur l\'alternance jeu court/jeu long, le changement d\'aile et la vision périphérique du porteur de balle.',
  },
  {
    id: 'passe-centres-retraits',
    label: 'Centres, ballons en retrait & Appels',
    category: 'Passe',
    phase: 'OFF',
    description: 'Variété des centres (ras du sol, retrait, tendu au 2e poteau) et coordination des courses des attaquants.',
    defaultPrompt: 'Séance sur le jeu dans les couloirs, décalages extérieurs, qualité du centre et synchronisation des appels au premier/deuxième poteau.',
  },

  // ==================== 2. DRIBBLE & FEINTES ====================
  {
    id: 'dribble-1v1-feintes',
    label: 'Dribbles 1c1 & Feintes de corps',
    category: 'Dribble',
    phase: 'OFF',
    description: 'Passement de jambes, feinte de corps, crochet dévastateur et accélération pour déposer le défenseur.',
    defaultPrompt: 'Séance sur les duels 1c1 offensifs, feintes de corps, déséquilibre individuel et prise de décision rapide dans les 30 derniers mètres.',
  },
  {
    id: 'dribble-crochets-rythme',
    label: 'Changement de rythme & Crochets Int/Ext',
    category: 'Dribble',
    phase: 'OFF',
    description: 'Variation des vitesses (lent-vite), utilisation des deux pieds, crochets intérieurs et extérieurs nets.',
    defaultPrompt: 'Séance sur la maîtrise des crochets intérieur/extérieur, les changements brutaux de direction et l\'explosivité balle au pied.',
  },
  {
    id: 'dribble-protection-dos',
    label: 'Protection de balle dos au jeu & Pivot',
    category: 'Dribble',
    phase: 'OFF',
    description: 'Utiliser son corps comme bouclier, orienter ses appuis, tourner autour de l\'adversaire ou rejouer en soutien.',
    defaultPrompt: 'Séance sur la conservation du ballon sous fort pressing dos au jeu, résistance aux impacts et pivot offensif.',
  },
  {
    id: 'dribble-percussion-vitesse',
    label: 'Percussion balle au pied & Prise d\'espace',
    category: 'Dribble',
    phase: 'OFF',
    description: 'Attaquer l\'espace libre à pleine vitesse, toucher le ballon à chaque foulée et provoquer le recul frein adverse.',
    defaultPrompt: 'Séance sur la conduite de balle agressive vers l\'avant, la percussion dans les zones ouvertes et le courage d\'éliminer.',
  },

  // ==================== 3. TIR & FINITION ====================
  {
    id: 'tir-frappes-placees',
    label: 'Tirs précis, cadrage & Frappes placées',
    category: 'Tir / Finition',
    phase: 'OFF',
    description: 'Pied d\'appui bien orienté, frappe de l\'intérieur du pied ou cou-de-pied, viser les petits filets.',
    defaultPrompt: 'Séance sur la précision et le sang-froid devant le but, cadrer systématiquement et choisir la bonne surface de contact.',
  },
  {
    id: 'tir-controle-frappe-rapide',
    label: 'Enchaînement express Contrôle-Frappe',
    category: 'Tir / Finition',
    phase: 'OFF',
    description: 'Première touche active pour se mettre dans le sens du but et frappe immédiate en 2 touches maximum.',
    defaultPrompt: 'Séance sur la vitesse d\'enchaînement contrôle orienté + frappe instantanée sous la pression d\'un défenseur revenant.',
  },
  {
    id: 'tir-face-a-face-gardien',
    label: 'Face-à-face avec le gardien & Sang-froid',
    category: 'Tir / Finition',
    phase: 'OFF',
    description: 'Lecture du positionnement du gardien, feinte de frappe, ballon piqué, frappe croisée ou contournement.',
    defaultPrompt: 'Séance sur les situations de face-à-face avec le gardien de but, duel psychologique, lucidité et variété de finition.',
  },
  {
    id: 'tir-reprise-premiere-intention',
    label: 'Reprises en première intention & Demi-volées',
    category: 'Tir / Finition',
    phase: 'OFF',
    description: 'Attaque du ballon en un temps, ajustement des appuis, équilibre du haut du corps sur centres ou seconds ballons.',
    defaultPrompt: 'Séance sur la reprise de volée, demi-volée et finition en un temps sur ballons aériens ou repoussés.',
  },

  // ==================== 4. TECHNIQUE & MOTRICITÉ ====================
  {
    id: 'technique-premiere-touche-scan',
    label: '1ère touche orientée & Scan visuel 360°',
    category: 'Technique',
    phase: 'OFF',
    description: 'Prise d\'information avant le contrôle (scan), contrôle actif vers l\'espace libre et enchaînement fluide.',
    defaultPrompt: 'Séance sur la prise de balle orientée, la vision du jeu avant réception et l\'utilisation des deux pieds.',
  },
  {
    id: 'technique-pied-faible',
    label: 'Maîtrise & Perfectionnement du pied faible',
    category: 'Technique',
    phase: 'OFF',
    description: 'Prise de confiance sur le pied opposé (contrôles, passes, conduites et tirs) pour devenir imprévisible.',
    defaultPrompt: 'Séance dédiée au développement du pied faible, équilibre corporel et désinhibition technique des jeunes joueurs.',
  },
  {
    id: 'technique-coordination-vivacite',
    label: 'Coordination motrice & Vivacité TE/KO',
    category: 'Technique',
    phase: 'DEF & OFF',
    description: 'Échelles de rythme, changements d\'appuis, dissociation motrice et vivacité gestuelle avec ballon.',
    defaultPrompt: 'Séance de motricité et agilité spécifique football avec ballon, dissociation motrice et réactivité gestuelle.',
  },
  {
    id: 'technique-jonglage-dexterite',
    label: 'Dextérité, jonglage & Maîtrise aérienne',
    category: 'Technique',
    phase: 'OFF',
    description: 'Sensibilité du pied, amortis poitrine/cuisse, contrôle de trajectoires aériennes complexes.',
    defaultPrompt: 'Séance sur la sensibilité tactile, le contrôle des trajectoires aériennes et la dextérité dans les airs.',
  },

  // ==================== 5. TACTIQUE & INTELLIGENCE DE JEU ====================
  {
    id: 'tactique-sortie-pression',
    label: 'Sortie sous pression & Relance courte (OFF)',
    category: 'Tactique',
    phase: 'OFF',
    description: 'Écartement des défenseurs, décrochage des milieux, jeu en appui avec le gardien et recherche de l\'homme libre.',
    defaultPrompt: 'Séance sur la relance propre depuis la zone défensive, gestion du pressing haut adverse et étirement du bloc.',
  },
  {
    id: 'tactique-rondos-possession',
    label: 'Rondos de position & Supériorités (3v1/4v2/4v4+3)',
    category: 'Tactique',
    phase: 'OFF',
    description: 'Rondos dynamiques, trouver l\'homme libre, conservation haute intensité et circulation fluide.',
    defaultPrompt: 'Séance de possession rythmée avec jokers pour créer la supériorité numérique et trouver les hommes libres.',
  },
  {
    id: 'tactique-jeu-couloirs',
    label: 'Jeu combiné dans les couloirs & Dédoublements',
    category: 'Tactique',
    phase: 'OFF',
    description: 'Animation latérale 2v1 ou 3v2 dans les couloirs, dédoublement de l\'ailier/latéral et attaque de surface.',
    defaultPrompt: 'Séance sur les circuits offensifs latéraux, combinaisons à 2 ou 3 dans les couloirs et centres dangereux.',
  },
  {
    id: 'tactique-gestion-tempo',
    label: 'Gestion du tempo : Conserver vs Accélérer',
    category: 'Tactique',
    phase: 'OFF',
    description: 'Reconnaître quand temporiser pour garder le ballon et quand déclencher l\'attaque verticale tranchante.',
    defaultPrompt: 'Séance sur la lecture des temps forts et temps faibles : faire tourner pour déplacer le bloc puis accélérer.',
  },

  // ==================== 6. DÉFENSE & RÉCUPÉRATION ====================
  {
    id: 'defense-duels-1v1-cadrer',
    label: 'Duels 1c1 défensifs : Cadrer, freiner & Orienter',
    category: 'Défense',
    phase: 'DEF',
    description: 'Appuis bas, ne pas se jeter, orienter l\'attaquant vers la ligne de touche et intervention propre.',
    defaultPrompt: 'Séance axée sur les fondamentaux du duel 1c1 défensif : attitude corporelle, timing de l\'intervention et orientation.',
  },
  {
    id: 'defense-fermer-axe-couper',
    label: 'Fermer l\'axe central & Couper les trajectoires',
    category: 'Défense',
    phase: 'DEF',
    description: 'Interdire le jeu dans l\'axe, fermer l\'espace entre les lignes et anticiper les passes adverses.',
    defaultPrompt: 'Séance sur l\'organisation défensive : verrouiller l\'axe du terrain, forcer le jeu vers l\'extérieur et intercepter.',
  },
  {
    id: 'defense-pressing-haut',
    label: 'Pressing haut coordonné & Chasse en meute',
    category: 'Défense',
    phase: 'DEF',
    description: 'Déclencheur de pressing (passe en retrait ou contrôle manqué), cadrage collectif et fermeture des sorties.',
    defaultPrompt: 'Séance sur le pressing haut synchronisé pour récupérer le ballon dans les 30m adverses et frapper aussitôt.',
  },
  {
    id: 'defense-couverture-bloc',
    label: 'Bloc compact & Couverture mutuelle (Glissement)',
    category: 'Défense',
    phase: 'DEF',
    description: 'Coulisser ensemble selon la position du ballon, assurer la sécurité derrière le joueur qui cadre.',
    defaultPrompt: 'Séance sur le glissement défensif collectif, distances réduites entre les lignes et couverture axiale.',
  },

  // ==================== 7. TRANSITIONS & DÉSÉQUILIBRES ====================
  {
    id: 'transition-regle-3sec',
    label: 'Règle des 3s : Contre-pressing immédiat (DEF)',
    category: 'Transition',
    phase: 'DEF & OFF',
    description: 'Réaction instantanée à la perte de balle : harceler le porteur pendant 3 secondes pour étouffer la relance.',
    defaultPrompt: 'Séance intensive sur la transition attaque-défense selon la règle ASF FootEco des 3 secondes de contre-pressing.',
  },
  {
    id: 'transition-attaque-rapide',
    label: 'Attaque rapide & Contre-attaque fulgurante (OFF)',
    category: 'Transition',
    phase: 'OFF',
    description: 'À la récupération, première passe verticale vers l\'avant, projection rapide des ailiers et finition express.',
    defaultPrompt: 'Séance sur la transition défense-attaque : verticalité immédiate, projection collective et tir en moins de 6 secondes.',
  },
  {
    id: 'transition-superiorite-3v2',
    label: 'Déséquilibres numériques rapides (2v1, 3v2, 4v3)',
    category: 'Transition',
    phase: 'DEF & OFF',
    description: 'Fixer le défenseur central, décaler sur le joueur démarqué, choix rapide entre tirer ou servir un partenaire.',
    defaultPrompt: 'Séance sur l\'exploitation des supériorités numériques rapides en phase de transition (2v1, 3v2, 4v3).',
  },
];

export async function generateFullSessionWithAI(params: {
  themeTitle: string;
  category?: string;
  phase?: 'DEF' | 'OFF' | 'DEF & OFF';
  focusTopic?: string;
  coach?: string;
  assistantCoach?: string;
  season?: string;
  specificInstructions?: string;
}): Promise<TrainingSession> {
  const response = await fetch('/api/ai/generate-training-session', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(params),
  });

  if (!response.ok) {
    const errorData = await response.json().catch(() => ({}));
    throw new Error(errorData.error || `Erreur serveur: ${response.status}`);
  }

  const data = await response.json();
  const raw = data.session;

  const today = new Date().toISOString().split('T')[0];
  const season = params.season || getSeasonFromDate(today);

  // Match presets and SVGs
  const initSvg1 = getPresetSvg(raw.initialPart?.recommendedPreset1 || 'preset-init-1') || '';
  const initSvg2 = getPresetSvg(raw.initialPart?.recommendedPreset2 || 'preset-init-2') || '';
  const formSvg1 = getPresetSvg(raw.playedForms?.recommendedPreset1 || 'preset-form-1') || '';
  const formSvg2 = getPresetSvg(raw.playedForms?.recommendedPreset2 || 'preset-form-2') || '';
  const gameSvg = getPresetSvg(raw.finalGame?.recommendedPreset1 || 'preset-game-6v6') || '';

  const finalSession: TrainingSession = {
    id: `session-ai-${Date.now()}`,
    title: raw.title || `Séance FootEco ${params.category || 'FE12'} - ${params.themeTitle}`,
    team: raw.team || params.category || 'FE12 Bas-Valais',
    date: today,
    season: season,
    coach: params.coach || 'Sébastien M.',
    assistantCoach: params.assistantCoach || 'Miguel R.',
    themeTE: {
      description: raw.themeTE?.description || '',
      coachingAccents: raw.themeTE?.coachingAccents || '',
    },
    themeTA: {
      description: raw.themeTA?.description || '',
      coachingAccents: raw.themeTA?.coachingAccents || '',
      defOrOff: raw.themeTA?.defOrOff || (params.phase || 'DEF & OFF'),
      antagonism: raw.themeTA?.antagonism || '',
    },
    themePE: {
      description: raw.themePE?.description || '',
      coachingAccents: raw.themePE?.coachingAccents || '',
    },
    initialPart: {
      title: raw.initialPart?.title || 'Partie initiale - Focus TE/KO',
      focus: raw.initialPart?.focus || 'Focus TE/KO',
      duration: raw.initialPart?.duration || '2X 15 min (Total 30 min)',
      description: raw.initialPart?.description || '',
      drawing1: {
        image: initSvg1,
        coach: raw.initialPart?.drawing1Coach || params.coach?.split(' ')[0] || 'SEB',
        caption: raw.initialPart?.drawing1Caption || 'Atelier TE/KO 1',
      },
      drawing2: {
        image: initSvg2,
        coach: raw.initialPart?.drawing2Coach || params.assistantCoach?.split(' ')[0] || 'Miguel',
        caption: raw.initialPart?.drawing2Caption || 'Atelier TE/KO 2',
      },
    },
    playedForms: {
      title: raw.playedForms?.title || 'Formes jouées - Focus TA',
      focus: raw.playedForms?.focus || 'Focus TA',
      duration: raw.playedForms?.duration || '2X 15 min (Total 30 min)',
      description: raw.playedForms?.description || '',
      drawing1: {
        image: formSvg1,
        coach: raw.playedForms?.drawing1Coach || params.coach?.split(' ')[0] || 'SEB',
        caption: raw.playedForms?.drawing1Caption || 'Forme jouée 1',
      },
      drawing2: {
        image: formSvg2,
        coach: raw.playedForms?.drawing2Coach || params.assistantCoach?.split(' ')[0] || 'Miguel',
        caption: raw.playedForms?.drawing2Caption || 'Forme jouée 2',
      },
    },
    finalGame: {
      title: raw.finalGame?.title || 'Jeu final - Focus TE/TA',
      focus: raw.finalGame?.focus || 'Focus TE/TA',
      duration: raw.finalGame?.duration || '30 min',
      description: raw.finalGame?.description || '',
      drawing1: {
        image: gameSvg,
        coach: '',
        caption: raw.finalGame?.drawing1Caption || 'Match final 6 contre 6 (FE12 FootEco)',
      },
      drawing2: {
        image: '',
        coach: '',
        caption: '',
      },
    },
    remarksAndIndividualization: raw.remarksAndIndividualization || 'Différenciation espace/temps et travail par poste.',
    bilan: raw.bilan || 'Évaluation globale de l\'engagement et des comportements observés.',
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  };

  return finalSession;
}

export async function generateExercisePartWithAI(params: {
  partType: 'initialPart' | 'playedForms' | 'finalGame';
  themeDescription?: string;
  focus?: string;
  category?: string;
  coach?: string;
  assistantCoach?: string;
  customPrompt?: string;
}): Promise<Partial<TrainingExercisePart>> {
  const response = await fetch('/api/ai/generate-exercise-part', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(params),
  });

  if (!response.ok) {
    throw new Error('Erreur lors de la génération de l\'atelier');
  }

  const data = await response.json();
  const raw = data.exercisePart;

  const svg1 = getPresetSvg(raw.recommendedPreset1) || '';
  const svg2 = getPresetSvg(raw.recommendedPreset2) || '';

  return {
    title: raw.title,
    focus: raw.focus,
    duration: raw.duration,
    description: raw.description,
    drawing1: {
      image: svg1,
      coach: raw.drawing1Coach,
      caption: raw.drawing1Caption,
    },
    drawing2: {
      image: svg2,
      coach: raw.drawing2Coach,
      caption: raw.drawing2Caption,
    },
  };
}

export async function refineThemeWithAI(params: {
  themeType: 'TE' | 'TA' | 'PE' | 'individualization';
  currentText: string;
  focusCategory?: string;
}): Promise<{ description: string; coachingAccents: string }> {
  const response = await fetch('/api/ai/refine-theme', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(params),
  });

  if (!response.ok) {
    throw new Error('Erreur lors du perfectionnement IA');
  }

  const data = await response.json();
  return data.data;
}
