// Tactical drill animation models and FootEco scenario definitions
export interface AnimatedActor {
  id: string;
  name: string;
  role: 'attacker' | 'defender' | 'goalkeeper' | 'coach' | 'neutral';
  color: string;
  number?: string;
  size?: number;
}

export interface ActorKeyframe {
  x: number; // 0 - 800
  y: number; // 0 - 520
  action?: 'idle' | 'run' | 'dribble' | 'pass' | 'shoot' | 'defend' | 'save';
  facingAngle?: number;
}

export interface BallKeyframe {
  x: number;
  y: number;
  height?: number; // 0 = ground, > 0 = in air
  action?: 'static' | 'dribble' | 'pass' | 'shot' | 'rebound';
}

export interface DrillPhase {
  id: number;
  timeStart: number; // 0 to 1
  timeEnd: number;   // 0 to 1
  title: string;
  subtitle: string;
  description: string;
  coachingAccents: string[];
  visualCue?: string;
  activeZoneName?: string;
  actors: Record<string, ActorKeyframe>;
  ball: BallKeyframe;
  trails?: Array<{
    from: [number, number];
    to: [number, number];
    type: 'pass' | 'run' | 'shot';
    label?: string;
  }>;
}

export interface PitchElement {
  id: string;
  type: 'goal' | 'mini-goal' | 'cone' | 'pole' | 'zone' | 'ladder';
  x: number;
  y: number;
  width?: number;
  height?: number;
  color?: string;
  label?: string;
  rotation?: number;
}

export interface DrillAnimationScenario {
  id: string;
  name: string;
  category: string;
  pitchType: 'half-pitch' | 'full-pitch' | 'grid-box';
  objective: string;
  duration: string;
  equipment: string;
  rules: string[];
  pedagogicalVariants: {
    easier: string;
    harder: string;
  };
  elements: PitchElement[];
  actors: AnimatedActor[];
  phases: DrillPhase[];
}

// -------------------------------------------------------------
// PRESET SCENARIO 1: Duel 1c1 Contournement & Finition (Focus TE/KO)
// -------------------------------------------------------------
export const SCENARIO_DUEL_1V1: DrillAnimationScenario = {
  id: 'scenario-duel-1v1',
  name: 'Duel 1c1 : Contournement, Vitesse & Finition',
  category: 'FE12 - Technique & Motricité',
  pitchType: 'half-pitch',
  objective: 'Éliminer en vitesse après prise d\'information, enchaîner frappe au but sous pression défensive.',
  duration: '2x 12 min (Rotation rapide)',
  equipment: '1 grand but avec gardien, 2 mini-buts latéraux, 4 piquets/coupelles, 8 ballons, chasubles rouges et bleus.',
  rules: [
    'Le coach envoie le ballon dans l\'axe.',
    'L\'attaquant et le défenseur contournent leur piquet respectif au signal.',
    'Duel 1 contre 1 direct : l\'attaquant marque dans le grand but.',
    'Si le défenseur récupère, transition en 3 secondes dans les mini-buts.'
  ],
  pedagogicalVariants: {
    easier: 'Donner 3 mètres d\'avance à l\'attaquant ou autoriser un deuxième ballon immédiat.',
    harder: 'Limiter l\'attaquant à 4 touches max ou obligation de frappe avant les 16 mètres.'
  },
  elements: [
    { id: 'goal-main', type: 'goal', x: 400, y: 38, width: 90, height: 26, color: '#FFFFFF' },
    { id: 'mini-goal-1', type: 'mini-goal', x: 140, y: 220, width: 32, height: 16, color: '#FACC15', rotation: 90 },
    { id: 'mini-goal-2', type: 'mini-goal', x: 660, y: 220, width: 32, height: 16, color: '#FACC15', rotation: -90 },
    { id: 'cone-p1', type: 'pole', x: 300, y: 340, color: '#EF4444', label: 'Piquet Attaquant' },
    { id: 'cone-p2', type: 'pole', x: 500, y: 340, color: '#3B82F6', label: 'Piquet Défenseur' },
    { id: 'cone-coach', type: 'cone', x: 400, y: 470, color: '#F59E0B' },
  ],
  actors: [
    { id: 'coach', name: 'Coach', role: 'coach', color: '#F59E0B', number: 'C' },
    { id: 'gk', name: 'Gardien', role: 'goalkeeper', color: '#10B981', number: '1' },
    { id: 'att1', name: 'Attaquant (Rouge)', role: 'attacker', color: '#EF4444', number: '9' },
    { id: 'def1', name: 'Défenseur (Bleu)', role: 'defender', color: '#3B82F6', number: '4' },
  ],
  phases: [
    {
      id: 1,
      timeStart: 0.0,
      timeEnd: 0.25,
      title: 'Étape 1 : Signal & Prise d\'élan',
      subtitle: 'Contournement des piquets et transmission du coach',
      description: 'Le coach donne le départ en envoyant le ballon vers la zone médiane. L\'attaquant contourne le piquet gauche à vive allure pendant que le défenseur sprinte autour du piquet droit.',
      coachingAccents: [
        'Vitesse de réaction au signal visuel/sonore',
        'Orientation du corps pour voir à la fois le ballon et le vis-à-vis',
        'Course dynamique sur l\'avant des pieds'
      ],
      visualCue: 'DÉPART & ENVOI DU BALLON !',
      actors: {
        coach: { x: 400, y: 470, action: 'pass' },
        gk: { x: 400, y: 55, action: 'idle' },
        att1: { x: 280, y: 320, action: 'run' },
        def1: { x: 520, y: 320, action: 'run' },
      },
      ball: { x: 360, y: 310, action: 'pass' },
      trails: [
        { from: [400, 460], to: [360, 310], type: 'pass', label: 'Passe coach' },
        { from: [300, 390], to: [280, 320], type: 'run', label: 'Contournement' },
        { from: [500, 390], to: [520, 320], type: 'run', label: 'Repli défensif' },
      ]
    },
    {
      id: 2,
      timeStart: 0.25,
      timeEnd: 0.55,
      title: 'Étape 2 : Contrôle orienté & Fixation',
      subtitle: 'Prise de balle et cadrage défensif',
      description: 'L\'attaquant prend l\'avantage sur son premier contrôle orienté vers l\'avant. Le défenseur freine sa course pour cadrer l\'adversaire, ferme l\'axe et tente d\'orienter vers le pied faible.',
      coachingAccents: [
        'Première touche agressive vers la cible',
        'Défenseur : freiner, baisser le centre de gravité, ne pas se jeter',
        'Attaquant : garder la tête levée pour lire la posture du défenseur'
      ],
      visualCue: 'CADRAGE & DUEL 1c1 !',
      actors: {
        coach: { x: 400, y: 470, action: 'idle' },
        gk: { x: 400, y: 65, action: 'idle' },
        att1: { x: 360, y: 220, action: 'dribble' },
        def1: { x: 420, y: 190, action: 'defend' },
      },
      ball: { x: 365, y: 205, action: 'dribble' },
      trails: [
        { from: [360, 310], to: [360, 220], type: 'run', label: 'Conduite de balle' },
        { from: [520, 320], to: [420, 190], type: 'run', label: 'Cadrage de l\'axe' },
      ]
    },
    {
      id: 3,
      timeStart: 0.55,
      timeEnd: 0.80,
      title: 'Étape 3 : Feinte, Crochet & Tir au but',
      subtitle: 'Élimination nette et frappe tendue',
      description: 'D\'une feinte de corps ou d\'un crochet intérieur, l\'attaquant crée une fenêtre de tir et déclenche une frappe tendue au sol. Le gardien plonge pour tenter la parade.',
      coachingAccents: [
        'Changement de rythme tranchant au moment de l\'élimination',
        'Pied d\'appui solide et bien orienté vers le poteau opposé',
        'Frappe rapide avant le retour du défenseur'
      ],
      visualCue: 'FRAPPE AU BUT ! ⚽',
      actors: {
        coach: { x: 400, y: 470, action: 'idle' },
        gk: { x: 375, y: 48, action: 'save' },
        att1: { x: 390, y: 145, action: 'shoot' },
        def1: { x: 430, y: 165, action: 'defend' },
      },
      ball: { x: 380, y: 42, action: 'shot' },
      trails: [
        { from: [365, 205], to: [390, 145], type: 'run', label: 'Crochet' },
        { from: [390, 145], to: [380, 42], type: 'shot', label: 'Tir' },
      ]
    },
    {
      id: 4,
      timeStart: 0.80,
      timeEnd: 1.0,
      title: 'Étape 4 : Transition FootEco 3 secondes',
      subtitle: 'Contre-attaque ou réorganisation immédiate',
      description: 'En cas d\'interception ou de repousse, le défenseur joue immédiatement vers l\'un des mini-buts latéraux dans la règle des 3 secondes. L\'attaquant effectue son contre-pressing.',
      coachingAccents: [
        'Règle des 3s : trouver la cible opposée sans temporiser',
        'Contre-pressing immédiat de l\'attaquant à la perte',
        'Intensité mentale jusqu\'à l\'arrêt complet du jeu'
      ],
      visualCue: 'TRANSITION 3 SECONDES ! 🔄',
      actors: {
        coach: { x: 400, y: 470, action: 'idle' },
        gk: { x: 390, y: 55, action: 'idle' },
        att1: { x: 405, y: 170, action: 'defend' },
        def1: { x: 230, y: 210, action: 'pass' },
      },
      ball: { x: 155, y: 220, action: 'pass' },
      trails: [
        { from: [420, 190], to: [230, 210], type: 'run', label: 'Relance' },
        { from: [230, 210], to: [155, 220], type: 'pass', label: 'Passe mini-but' },
      ]
    }
  ]
};

// -------------------------------------------------------------
// PRESET SCENARIO 2: Conservation & Rondo 4c2 (Focus TA)
// -------------------------------------------------------------
export const SCENARIO_RONDO_4V2: DrillAnimationScenario = {
  id: 'scenario-rondo-4v2',
  name: 'Conservation 4c2 : Prise d\'info, Triangle & Pressing',
  category: 'FE12 - Tactique & Circulation',
  pitchType: 'grid-box',
  objective: 'Conserver le ballon en supériorité numérique par des angles de passe permanents et casser les lignes.',
  duration: '3x 8 min (Changement de paire de chasseurs)',
  equipment: 'Espace délimité 20x15m, 4 cônes de coin, 4 mini-buts extérieurs, 6 ballons, 2 couleurs de chasubles.',
  rules: [
    '4 joueurs en périphérie (1 par côté) conservent le ballon.',
    '2 défenseurs axiaux chassent et cherchent à intercepter.',
    '10 passes consécutives = 1 point bonus.',
    'Si récupération par les 2 chasseurs : trouver un mini-but en 3 secondes.'
  ],
  pedagogicalVariants: {
    easier: 'Jeu libre en touches de balle ou agrandir le carré (22x18m).',
    harder: 'Limiter à 2 touches obligatoires, interdire les passes lobées.'
  },
  elements: [
    { id: 'box', type: 'zone', x: 250, y: 130, width: 300, height: 260, color: '#10B981' },
    { id: 'cone-1', type: 'cone', x: 250, y: 130, color: '#FACC15' },
    { id: 'cone-2', type: 'cone', x: 550, y: 130, color: '#FACC15' },
    { id: 'cone-3', type: 'cone', x: 550, y: 390, color: '#FACC15' },
    { id: 'cone-4', type: 'cone', x: 250, y: 390, color: '#FACC15' },
    { id: 'mg-top', type: 'mini-goal', x: 400, y: 70, width: 28, height: 14, color: '#EF4444' },
    { id: 'mg-bot', type: 'mini-goal', x: 400, y: 450, width: 28, height: 14, color: '#EF4444' },
  ],
  actors: [
    { id: 'p_top', name: 'Appui Haut', role: 'attacker', color: '#3B82F6', number: '10' },
    { id: 'p_bot', name: 'Appui Bas', role: 'attacker', color: '#3B82F6', number: '6' },
    { id: 'p_left', name: 'Soutien Gauche', role: 'attacker', color: '#3B82F6', number: '3' },
    { id: 'p_right', name: 'Soutien Droit', role: 'attacker', color: '#3B82F6', number: '7' },
    { id: 'def_1', name: 'Défenseur 1', role: 'defender', color: '#EF4444', number: 'D1' },
    { id: 'def_2', name: 'Défenseur 2', role: 'defender', color: '#EF4444', number: 'D2' },
  ],
  phases: [
    {
      id: 1,
      timeStart: 0.0,
      timeEnd: 0.3,
      title: 'Étape 1 : Fixation latérale & Décalage',
      subtitle: 'Passe latérale et coulissement du bloc',
      description: 'Le joueur bas donne au soutien gauche. Les deux défenseurs coulissent en bloc pour cadrer le porteur et fermer l\'axe intérieur.',
      coachingAccents: [
        'Passe appuyée au sol avec le plat du pied',
        'Orientation corporelle ouverte vers l\'ensemble du jeu',
        'Communication permanente (« Seul », « Ça vient »)'
      ],
      visualCue: 'CIRCULATION DU BALLON ! 🎯',
      actors: {
        p_top: { x: 400, y: 120, action: 'idle' },
        p_bot: { x: 400, y: 400, action: 'pass' },
        p_left: { x: 235, y: 260, action: 'run' },
        p_right: { x: 565, y: 260, action: 'idle' },
        def_1: { x: 340, y: 290, action: 'defend' },
        def_2: { x: 420, y: 240, action: 'defend' },
      },
      ball: { x: 245, y: 265, action: 'pass' },
      trails: [
        { from: [400, 400], to: [245, 265], type: 'pass', label: 'Passe diagonale' },
      ]
    },
    {
      id: 2,
      timeStart: 0.3,
      timeEnd: 0.65,
      title: 'Étape 2 : Passe cassante & Jeu en une touche',
      subtitle: 'Trouver l\'intervalle entre les deux presseurs',
      description: 'Le joueur gauche attire le défenseur D1 puis transmet directement dans l\'intervalle pour l\'appui haut qui s\'est démarqué.',
      coachingAccents: [
        'Timing de passe : attendre le moment où l\'intervalle s\'ouvre',
        'Appel synchronisé de l\'appui haut dans la zone aveugle',
        'Prise de balle vers l\'avant'
      ],
      visualCue: 'PASSE CASSANTE ! ⚡',
      actors: {
        p_top: { x: 380, y: 120, action: 'run' },
        p_bot: { x: 430, y: 400, action: 'run' },
        p_left: { x: 235, y: 260, action: 'pass' },
        p_right: { x: 565, y: 260, action: 'run' },
        def_1: { x: 290, y: 270, action: 'defend' },
        def_2: { x: 390, y: 230, action: 'defend' },
      },
      ball: { x: 380, y: 135, action: 'pass' },
      trails: [
        { from: [235, 260], to: [380, 135], type: 'pass', label: 'Passe entre les lignes' },
      ]
    },
    {
      id: 3,
      timeStart: 0.65,
      timeEnd: 1.0,
      title: 'Étape 3 : Renversement & Transition défensive',
      subtitle: 'Sortie rapide vers le côté opposé',
      description: 'L\'appui haut remet en une touche sur l\'aile droite. Les deux défenseurs doivent pivoter immédiatement pour empêcher la frappe.',
      coachingAccents: [
        'Jeu en 1 touche de balle (remise propre)',
        'Vitesse de circulation supérieure à la vitesse de replacement',
        'Équilibre permanent du rectangle'
      ],
      visualCue: 'DÉCALAGE COMPLET ! 🔄',
      actors: {
        p_top: { x: 380, y: 120, action: 'pass' },
        p_bot: { x: 430, y: 400, action: 'idle' },
        p_left: { x: 235, y: 260, action: 'idle' },
        p_right: { x: 565, y: 240, action: 'run' },
        def_1: { x: 360, y: 230, action: 'run' },
        def_2: { x: 460, y: 210, action: 'defend' },
      },
      ball: { x: 550, y: 240, action: 'pass' },
      trails: [
        { from: [380, 135], to: [550, 240], type: 'pass', label: 'Changement d\'aile' },
      ]
    }
  ]
};

// -------------------------------------------------------------
// PRESET SCENARIO 3: Attaque Rapide & Transition 3s (3c2)
// -------------------------------------------------------------
export const SCENARIO_TRANSITION_3V2: DrillAnimationScenario = {
  id: 'scenario-transition-3v2',
  name: 'Attaque Rapide & Transition 3s (3c2 avec finition)',
  category: 'FE12 - Formes Jouées / Transition',
  pitchType: 'half-pitch',
  objective: 'Exploiter une supériorité numérique en contre-attaque rapide en moins de 8 secondes.',
  duration: '4x 6 min (Séries dynamiques)',
  equipment: 'Grand but avec gardien, cônes de départ, 10 ballons, chasubles.',
  rules: [
    'Départ depuis le rond central sur perte de balle simulée.',
    '3 attaquants contre 2 défenseurs en recul-frein.',
    'Obligation de tirer en moins de 8 secondes.',
    'Si interception des défenseurs : passe vers le coach en 3 secondes.'
  ],
  pedagogicalVariants: {
    easier: 'Ajouter un retardateur de 3 secondes pour le second défenseur.',
    harder: 'Passer en 3 contre 3 avec repli défensif express d\'un milieu.'
  },
  elements: [
    { id: 'goal-main', type: 'goal', x: 400, y: 38, width: 90, height: 26, color: '#FFFFFF' },
    { id: 'line-half', type: 'zone', x: 100, y: 440, width: 600, height: 2, color: 'rgba(255,255,255,0.4)' },
  ],
  actors: [
    { id: 'gk', name: 'Gardien', role: 'goalkeeper', color: '#10B981', number: '1' },
    { id: 'att_c', name: 'Attaquant Axe', role: 'attacker', color: '#EF4444', number: '9' },
    { id: 'att_g', name: 'Ailier Gauche', role: 'attacker', color: '#EF4444', number: '11' },
    { id: 'att_d', name: 'Ailier Droit', role: 'attacker', color: '#EF4444', number: '7' },
    { id: 'def_1', name: 'Défenseur G', role: 'defender', color: '#3B82F6', number: '4' },
    { id: 'def_2', name: 'Défenseur D', role: 'defender', color: '#3B82F6', number: '5' },
  ],
  phases: [
    {
      id: 1,
      timeStart: 0.0,
      timeEnd: 0.35,
      title: 'Étape 1 : Récupération & Conduite verticale',
      subtitle: 'Fixation axiale et écartement des ailiers',
      description: 'L\'attaquant axial avance balle au pied à haute intensité. Les deux ailiers prennent la largeur pour étirer les deux défenseurs centraux.',
      coachingAccents: [
        'Conduite agressive vers le défenseur pour le fixer',
        'Courses des ailiers dans les couloirs à la limite du hors-jeu',
        'Défenseurs : recul-frein coordonné sans se faire éliminer d\'une passe'
      ],
      visualCue: 'PROJECTION OFFENSIVE ! ⚡',
      actors: {
        gk: { x: 400, y: 65, action: 'idle' },
        att_c: { x: 400, y: 300, action: 'dribble' },
        att_g: { x: 230, y: 260, action: 'run' },
        att_d: { x: 570, y: 260, action: 'run' },
        def_1: { x: 350, y: 220, action: 'defend' },
        def_2: { x: 450, y: 220, action: 'defend' },
      },
      ball: { x: 400, y: 285, action: 'dribble' },
      trails: [
        { from: [400, 440], to: [400, 300], type: 'run', label: 'Fixation axiale' },
        { from: [200, 440], to: [230, 260], type: 'run', label: 'Course extérieure' },
        { from: [600, 440], to: [570, 260], type: 'run', label: 'Course extérieure' },
      ]
    },
    {
      id: 2,
      timeStart: 0.35,
      timeEnd: 0.70,
      title: 'Étape 2 : Décalage & Appel dans l\'espace libre',
      subtitle: 'Passe tranchante vers le côté le plus vulnérable',
      description: 'Dès que le défenseur D2 sort au pressing sur le porteur, celui-ci glisse le ballon dans la course de l\'ailier droit démarqué.',
      coachingAccents: [
        'Peser sur la décision du défenseur avant de lâcher le ballon',
        'Passe millimétrée dans la course sans ralentir le partenaire',
        'L\'attaquant gauche plonge au second poteau pour la reprise'
      ],
      visualCue: 'DÉCALAGE SUR L\'AILE ! 🎯',
      actors: {
        gk: { x: 420, y: 65, action: 'idle' },
        att_c: { x: 400, y: 220, action: 'pass' },
        att_g: { x: 260, y: 150, action: 'run' },
        att_d: { x: 550, y: 170, action: 'run' },
        def_1: { x: 360, y: 170, action: 'defend' },
        def_2: { x: 430, y: 190, action: 'defend' },
      },
      ball: { x: 540, y: 160, action: 'pass' },
      trails: [
        { from: [400, 220], to: [540, 160], type: 'pass', label: 'Passe décisive' },
        { from: [230, 260], to: [260, 150], type: 'run', label: 'Course 2e poteau' },
      ]
    },
    {
      id: 3,
      timeStart: 0.70,
      timeEnd: 1.0,
      title: 'Étape 3 : Centre au cordeau & Finition',
      subtitle: 'Reprise de volée ou frappe croisée',
      description: 'L\'ailier droit centre en retrait pour l\'ailier gauche ou l\'attaquant axial qui reprend d\'une frappe instantanée dans le petit filet.',
      coachingAccents: [
        'Zone de finition : couper au premier poteau ou attendre le retrait',
        'Frapper en première intention',
        'Équilibre défensif maintenu derrière le ballon'
      ],
      visualCue: 'BUT ! ⚽🔥',
      actors: {
        gk: { x: 400, y: 48, action: 'save' },
        att_c: { x: 390, y: 130, action: 'run' },
        att_g: { x: 340, y: 120, action: 'shoot' },
        att_d: { x: 530, y: 140, action: 'pass' },
        def_1: { x: 360, y: 135, action: 'defend' },
        def_2: { x: 420, y: 160, action: 'defend' },
      },
      ball: { x: 360, y: 42, action: 'shot' },
      trails: [
        { from: [540, 160], to: [340, 120], type: 'pass', label: 'Centre en retrait' },
        { from: [340, 120], to: [360, 42], type: 'shot', label: 'Reprise' },
      ]
    }
  ]
};

// -------------------------------------------------------------
// PRESET SCENARIO 4: Match FootEco 6c6 (Jeu Final)
// -------------------------------------------------------------
export const SCENARIO_MATCH_6V6: DrillAnimationScenario = {
  id: 'scenario-match-6v6',
  name: 'Match FootEco FE12 (6c6) : Relance & Décalage',
  category: 'FE12 - Jeu Final / Compétition',
  pitchType: 'full-pitch',
  objective: 'Appliquer les principes d\'orientation du jeu, de progression collective et de déséquilibre en match réduit.',
  duration: '3x 15 min (Match d\'application FootEco)',
  equipment: 'Terrain 50x35m FootEco, 2 grands buts avec gardiens, cônes de zones, ballons.',
  rules: [
    'Règles officielles FootEco ASF : relance protégée du gardien.',
    'Pas de hors-jeu avant la ligne médiane.',
    'Privilégier le jeu au sol et le changement d\'aile.'
  ],
  pedagogicalVariants: {
    easier: 'Le but compte double après une séquence de 5 passes.',
    harder: 'Règle des 3 touches dans son propre camp, 2 touches dans le camp adverse.'
  },
  elements: [
    { id: 'goal-top', type: 'goal', x: 400, y: 30, width: 80, height: 22, color: '#FFFFFF' },
    { id: 'goal-bot', type: 'goal', x: 400, y: 490, width: 80, height: 22, color: '#FFFFFF', rotation: 180 },
    { id: 'center-circle', type: 'zone', x: 400, y: 260, width: 90, height: 90, color: 'rgba(255,255,255,0.2)' },
  ],
  actors: [
    // Team Blue (relance)
    { id: 'gk_b', name: 'Gardien Bleu', role: 'goalkeeper', color: '#3B82F6', number: '1' },
    { id: 'dc_b', name: 'Défenseur Central', role: 'attacker', color: '#3B82F6', number: '4' },
    { id: 'lg_b', name: 'Couloir Gauche', role: 'attacker', color: '#3B82F6', number: '3' },
    { id: 'ld_b', name: 'Couloir Droit', role: 'attacker', color: '#3B82F6', number: '2' },
    { id: 'mc_b', name: 'Milieu Central', role: 'attacker', color: '#3B82F6', number: '8' },
    { id: 'att_b', name: 'Attaquant', role: 'attacker', color: '#3B82F6', number: '9' },
    // Team Red (pressing)
    { id: 'gk_r', name: 'Gardien Rouge', role: 'goalkeeper', color: '#EF4444', number: '1' },
    { id: 'dc_r', name: 'Défenseur Rouge', role: 'defender', color: '#EF4444', number: '5' },
    { id: 'mc_r', name: 'Milieu Rouge', role: 'defender', color: '#EF4444', number: '6' },
    { id: 'att_r', name: 'Attaquant Rouge', role: 'defender', color: '#EF4444', number: '11' },
  ],
  phases: [
    {
      id: 1,
      timeStart: 0.0,
      timeEnd: 0.4,
      title: 'Étape 1 : Relance courte & Écartement',
      subtitle: 'Le gardien initie la relance sur le latéral droit',
      description: 'Le gardien bleu relance au sol sur son couloir droit démarqué. L\'attaquant adverse vient cadrer la relance.',
      coachingAccents: [
        'Disponibilité immédiate des latéraux dans les couloirs',
        'Passe au pied sûr du gardien',
        'Prise d\'information du latéral avant contrôle'
      ],
      visualCue: 'SORTIE DE BALLE COURTE ! ⚽',
      actors: {
        gk_b: { x: 400, y: 470, action: 'pass' },
        dc_b: { x: 330, y: 430, action: 'idle' },
        lg_b: { x: 180, y: 390, action: 'idle' },
        ld_b: { x: 620, y: 380, action: 'run' },
        mc_b: { x: 400, y: 330, action: 'run' },
        att_b: { x: 400, y: 200, action: 'idle' },
        gk_r: { x: 400, y: 50, action: 'idle' },
        dc_r: { x: 400, y: 150, action: 'idle' },
        mc_r: { x: 430, y: 260, action: 'defend' },
        att_r: { x: 530, y: 350, action: 'run' },
      },
      ball: { x: 600, y: 380, action: 'pass' },
      trails: [
        { from: [400, 470], to: [600, 380], type: 'pass', label: 'Passe latérale' },
      ]
    },
    {
      id: 2,
      timeStart: 0.4,
      timeEnd: 0.75,
      title: 'Étape 2 : Triangle milieu & Appel en profondeur',
      subtitle: 'Relais avec le milieu central et verticalisation',
      description: 'Le latéral droit joue en appui sur le milieu central qui remet en une touche dans la course de l\'attaquant lancé en profondeur.',
      coachingAccents: [
        'Création d\'un triangle de passe pour sortir de la pression',
        'Jeu dos au jeu du milieu : jouer simple vers l\'avant',
        'Appel tranchant entre les deux défenseurs axiaux'
      ],
      visualCue: 'COMBINAISON & PASSE EN PROFONDEUR ! ⚡',
      actors: {
        gk_b: { x: 400, y: 450, action: 'idle' },
        dc_b: { x: 350, y: 380, action: 'run' },
        lg_b: { x: 200, y: 320, action: 'run' },
        ld_b: { x: 590, y: 320, action: 'pass' },
        mc_b: { x: 440, y: 270, action: 'pass' },
        att_b: { x: 380, y: 130, action: 'run' },
        gk_r: { x: 400, y: 55, action: 'idle' },
        dc_r: { x: 420, y: 160, action: 'defend' },
        mc_r: { x: 480, y: 280, action: 'defend' },
        att_r: { x: 520, y: 320, action: 'idle' },
      },
      ball: { x: 390, y: 125, action: 'pass' },
      trails: [
        { from: [590, 320], to: [440, 270], type: 'pass', label: 'Passe intérieur' },
        { from: [440, 270], to: [390, 125], type: 'pass', label: 'Profondeur' },
      ]
    },
    {
      id: 3,
      timeStart: 0.75,
      timeEnd: 1.0,
      title: 'Étape 3 : Face à face & Finition',
      subtitle: 'Frappe placée hors de portée du gardien',
      description: 'L\'attaquant contrôle dans la course, élimine le retour du défenseur et trompe le gardien d\'une frappe croisée au ras du poteau.',
      coachingAccents: [
        'Sang-froid dans la surface de réparation',
        'Prendre l\'information sur la position avancée du gardien',
        'Finition chirurgicale dans le petit filet'
      ],
      visualCue: 'BUT MAGNIFIQUE ! ⚽🎉',
      actors: {
        gk_b: { x: 400, y: 420, action: 'idle' },
        dc_b: { x: 360, y: 340, action: 'idle' },
        lg_b: { x: 230, y: 250, action: 'run' },
        ld_b: { x: 560, y: 260, action: 'idle' },
        mc_b: { x: 430, y: 220, action: 'idle' },
        att_b: { x: 380, y: 80, action: 'shoot' },
        gk_r: { x: 410, y: 45, action: 'save' },
        dc_r: { x: 420, y: 110, action: 'defend' },
        mc_r: { x: 460, y: 240, action: 'idle' },
        att_r: { x: 500, y: 300, action: 'idle' },
      },
      ball: { x: 380, y: 35, action: 'shot' },
      trails: [
        { from: [390, 125], to: [380, 80], type: 'run', label: 'Prise d\'espace' },
        { from: [380, 80], to: [380, 35], type: 'shot', label: 'Finition' },
      ]
    }
  ]
};

// All presets
export const ALL_ANIMATION_SCENARIOS: DrillAnimationScenario[] = [
  SCENARIO_DUEL_1V1,
  SCENARIO_RONDO_4V2,
  SCENARIO_TRANSITION_3V2,
  SCENARIO_MATCH_6V6,
];

// Helper to determine the best matching scenario based on text
export function detectBestAnimationScenario(
  title: string = '',
  description: string = '',
  focus: string = ''
): DrillAnimationScenario {
  const fullText = `${title} ${description} ${focus}`.toLowerCase();

  if (fullText.includes('6v6') || fullText.includes('6c6') || fullText.includes('7v7') || fullText.includes('match') || fullText.includes('jeu final')) {
    return SCENARIO_MATCH_6V6;
  }
  if (fullText.includes('rondo') || fullText.includes('conservation') || fullText.includes('4v2') || fullText.includes('4c2') || fullText.includes('4 contre 2') || fullText.includes('triangle')) {
    return SCENARIO_RONDO_4V2;
  }
  if (fullText.includes('transition') || fullText.includes('3s') || fullText.includes('3 seconde') || fullText.includes('contre') || fullText.includes('3c2') || fullText.includes('2c1') || fullText.includes('supériorité')) {
    return SCENARIO_TRANSITION_3V2;
  }
  // Default to 1v1 duel
  return SCENARIO_DUEL_1V1;
}
