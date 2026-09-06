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

// -------------------------------------------------------------
// PRESET SCENARIO 5: Débordement Couloir & Centre en Retrait (Focus TE/TA)
// -------------------------------------------------------------
export const SCENARIO_CENTRES_FINITION: DrillAnimationScenario = {
  id: 'scenario-centres-finition',
  name: 'Débordement Couloir & Centre en Retrait',
  category: 'FE12 - Animation Offensive / Couloirs',
  pitchType: 'half-pitch',
  objective: 'Créer un décalage sur l\'aile, déborder jusqu\'à la ligne de sortie et délivrer un centre en retrait pour les attaquants lancés.',
  duration: '2x 15 min (Rotation ailier / attaquants)',
  equipment: '1 grand but avec gardien, cônes de couloir, piquets de démarquage, 10 ballons, chasubles.',
  rules: [
    'Le milieu lance l\'ailier dans le couloir extérieur.',
    'L\'ailier sprinte vers la ligne de but et lève la tête.',
    'Attaquant 1 coupe au 1er poteau pour fixer le défenseur.',
    'Attaquant 2 arrive lancé au point de penalty en retrait.',
    'Finition obligatoire en 1 seule touche de balle.'
  ],
  pedagogicalVariants: {
    easier: 'Pas de défenseur axial (opposition passive) ou centre à mi-distance.',
    harder: 'Ajouter un défenseur qui sprinte au 2e poteau et limiter l\'ailier à 2 touches de balle.'
  },
  elements: [
    { id: 'goal-main', type: 'goal', x: 400, y: 38, width: 90, height: 26, color: '#FFFFFF' },
    { id: 'zone-couloir', type: 'zone', x: 570, y: 50, width: 200, height: 410, color: 'rgba(239,68,68,0.12)' },
    { id: 'cone-w1', type: 'cone', x: 650, y: 400, color: '#FACC15' },
    { id: 'cone-w2', type: 'cone', x: 650, y: 240, color: '#FACC15' },
    { id: 'cone-w3', type: 'cone', x: 650, y: 100, color: '#FACC15' },
  ],
  actors: [
    { id: 'gk', name: 'Gardien', role: 'goalkeeper', color: '#10B981', number: '1' },
    { id: 'mil', name: 'Milieu (Passe)', role: 'attacker', color: '#EF4444', number: '8' },
    { id: 'ail', name: 'Ailier (Centre)', role: 'attacker', color: '#EF4444', number: '7' },
    { id: 'att1', name: 'Attaquant 1er Pot.', role: 'attacker', color: '#EF4444', number: '9' },
    { id: 'att2', name: 'Attaquant Retrait', role: 'attacker', color: '#EF4444', number: '10' },
    { id: 'def1', name: 'Défenseur Central', role: 'defender', color: '#3B82F6', number: '4' },
  ],
  phases: [
    {
      id: 1,
      timeStart: 0.0,
      timeEnd: 0.25,
      title: 'Étape 1 : Appel sur l\'aile & Lancement',
      subtitle: 'Passe tranchante dans la course de l\'ailier démarqué',
      description: 'Le milieu oriente le jeu vers le couloir. L\'ailier déclenche sa course d\'appel le long de la ligne de touche pour attaquer l\'espace libre.',
      coachingAccents: [
        'Course d\'appel dans le dos du couloir',
        'Passe bien dosée qui ne freine pas la course de l\'ailier',
        'Regard périphérique du passeur'
      ],
      visualCue: 'APPEL DANS LE COULOIR ! ⚡',
      actors: {
        gk: { x: 400, y: 55, action: 'idle' },
        mil: { x: 420, y: 390, action: 'pass' },
        ail: { x: 640, y: 340, action: 'run' },
        att1: { x: 370, y: 280, action: 'idle' },
        att2: { x: 440, y: 310, action: 'idle' },
        def1: { x: 390, y: 200, action: 'defend' },
      },
      ball: { x: 630, y: 290, action: 'pass' },
      trails: [
        { from: [420, 390], to: [630, 290], type: 'pass', label: 'Passe dans la course' },
        { from: [650, 420], to: [640, 340], type: 'run', label: 'Course ailier' }
      ]
    },
    {
      id: 2,
      timeStart: 0.25,
      timeEnd: 0.55,
      title: 'Étape 2 : Débordement & Levée de tête',
      subtitle: 'Accélération vers la ligne de but et observation des arrivées',
      description: 'L\'ailier pousse son ballon en vitesse le long du couloir. Avant d\'armer, il lève la tête pour identifier le timing d\'arrivée des attaquants dans les 16 mètres.',
      coachingAccents: [
        'Toucher de balle rapide de l\'avant du pied',
        'Prise d\'information visuelle AVANT le centre',
        'Synchronisation des courses d\'attaque dans la surface'
      ],
      visualCue: 'DÉBORDEMENT & TÊTE LEVÉE ! 👀',
      actors: {
        gk: { x: 400, y: 55, action: 'idle' },
        mil: { x: 430, y: 350, action: 'run' },
        ail: { x: 640, y: 130, action: 'dribble' },
        att1: { x: 350, y: 190, action: 'run' },
        att2: { x: 430, y: 230, action: 'run' },
        def1: { x: 380, y: 160, action: 'defend' },
      },
      ball: { x: 640, y: 120, action: 'dribble' },
      trails: [
        { from: [630, 290], to: [640, 130], type: 'run', label: 'Débordement' },
        { from: [370, 280], to: [350, 190], type: 'run', label: 'Appel 1er poteau' }
      ]
    },
    {
      id: 3,
      timeStart: 0.55,
      timeEnd: 0.80,
      title: 'Étape 3 : Centre tendu en retrait',
      subtitle: 'Feinte au premier poteau et livraison au point de penalty',
      description: 'L\'attaquant 1 coupe au premier poteau pour emmener le défenseur. L\'ailier brosse son centre au sol en retrait vers l\'attaquant 2 arrivé lancé.',
      coachingAccents: [
        'Centre ras de terre puissant, impossible à couper par le gardien',
        'Échelonnement des attaquants (1er poteau, penalty, 2e poteau)',
        'Pied d\'appui bien orienté vers la zone de retrait'
      ],
      visualCue: 'CENTRE EN RETRAIT ! 🎯',
      actors: {
        gk: { x: 385, y: 50, action: 'idle' },
        mil: { x: 440, y: 320, action: 'idle' },
        ail: { x: 630, y: 100, action: 'pass' },
        att1: { x: 330, y: 110, action: 'run' },
        att2: { x: 410, y: 160, action: 'run' },
        def1: { x: 345, y: 120, action: 'defend' },
      },
      ball: { x: 415, y: 155, action: 'pass' },
      trails: [
        { from: [630, 100], to: [415, 155], type: 'pass', label: 'Centre en retrait' },
        { from: [430, 230], to: [410, 160], type: 'run', label: 'Arrivée lancée' }
      ]
    },
    {
      id: 4,
      timeStart: 0.80,
      timeEnd: 1.0,
      title: 'Étape 4 : Reprise en 1 touche & But',
      subtitle: 'Finition chirurgicale plat du pied ou demi-volée',
      description: 'L\'attaquant 2 reprend en première intention sans contrôler. Le gardien plonge mais le ballon termine dans le petit filet opposé.',
      coachingAccents: [
        'Cheville verrouillée à l\'impact',
        'Corps au-dessus du ballon pour ne pas envoyer la frappe au-dessus',
        'Finition en une touche obligatoire'
      ],
      visualCue: 'BUT EN UNE TOUCHE ! ⚽🎉',
      actors: {
        gk: { x: 380, y: 45, action: 'save' },
        mil: { x: 440, y: 310, action: 'idle' },
        ail: { x: 610, y: 110, action: 'idle' },
        att1: { x: 325, y: 100, action: 'idle' },
        att2: { x: 405, y: 140, action: 'shoot' },
        def1: { x: 345, y: 125, action: 'defend' },
      },
      ball: { x: 385, y: 38, action: 'shot' },
      trails: [
        { from: [415, 155], to: [385, 38], type: 'shot', label: 'Frappe cadrée' }
      ]
    }
  ]
};

// -------------------------------------------------------------
// PRESET SCENARIO 6: Vagues Offensives 2 contre 1 (Focus TA)
// -------------------------------------------------------------
export const SCENARIO_VAGUES_2V1: DrillAnimationScenario = {
  id: 'scenario-vagues-2v1',
  name: 'Vagues Offensives 2c1 : Fixation & Décalage',
  category: 'FE12 - Supériorité Numérique / Décision',
  pitchType: 'half-pitch',
  objective: 'Fixer le défenseur central, provoquer son intervention et délivrer la passe au bon moment pour finir seul au but.',
  duration: '3x 8 min (Rotations rapides)',
  equipment: '1 grand but avec gardien, 2 mini-buts de transition, cônes de départ, 8 ballons.',
  rules: [
    '2 attaquants partent à pleine vitesse contre 1 défenseur axial.',
    'Le porteur avance pour attirer le défenseur.',
    'Décision : frapper soi-même ou décaler le partenaire.',
    'Le défenseur doit temporiser (recul-frein). Si récupération : mini-but en 3s.'
  ],
  pedagogicalVariants: {
    easier: 'Le défenseur ne peut pas sortir avant les 16m.',
    harder: 'Compte à rebours de 5 secondes pour marquer.'
  },
  elements: [
    { id: 'goal-main', type: 'goal', x: 400, y: 38, width: 90, height: 26, color: '#FFFFFF' },
    { id: 'mini-goal-1', type: 'mini-goal', x: 140, y: 280, width: 30, height: 16, color: '#FACC15', rotation: 90 },
    { id: 'mini-goal-2', type: 'mini-goal', x: 660, y: 280, width: 30, height: 16, color: '#FACC15', rotation: -90 },
  ],
  actors: [
    { id: 'gk', name: 'Gardien', role: 'goalkeeper', color: '#10B981', number: '1' },
    { id: 'att1', name: 'Porteur (Rouge)', role: 'attacker', color: '#EF4444', number: '9' },
    { id: 'att2', name: 'Soutien (Rouge)', role: 'attacker', color: '#EF4444', number: '10' },
    { id: 'def', name: 'Défenseur (Bleu)', role: 'defender', color: '#3B82F6', number: '4' },
  ],
  phases: [
    {
      id: 1,
      timeStart: 0.0,
      timeEnd: 0.30,
      title: 'Étape 1 : Départ en vague & Fixation',
      subtitle: 'Conduite de balle agressive vers le défenseur',
      description: 'L\'attaquant 1 avance balle au pied directement sur le défenseur axial. L\'attaquant 2 s\'écarte légèrement pour créer un angle de passe.',
      coachingAccents: [
        'Conduite dynamique tête haute',
        'Écartement du partenaire pour étirer l\'intervention',
        'Défenseur : recul-frein coordonné'
      ],
      visualCue: 'VAGUE 2c1 DÉMARRÉE ! ⚡',
      actors: {
        gk: { x: 400, y: 55, action: 'idle' },
        att1: { x: 380, y: 310, action: 'dribble' },
        att2: { x: 500, y: 300, action: 'run' },
        def: { x: 410, y: 220, action: 'defend' },
      },
      ball: { x: 380, y: 295, action: 'dribble' },
      trails: [
        { from: [380, 420], to: [380, 310], type: 'run', label: 'Conduite' },
        { from: [500, 420], to: [500, 300], type: 'run', label: 'Appel large' }
      ]
    },
    {
      id: 2,
      timeStart: 0.30,
      timeEnd: 0.65,
      title: 'Étape 2 : Provocation & Passe glissée',
      subtitle: 'Attirer le défenseur au point de déséquilibre',
      description: 'Dès que le défenseur bloque la trajectoire du porteur, celui-ci délivre une passe appuyée dans la course de son coéquipier démarqué.',
      coachingAccents: [
        'Lâcher la balle au moment où le défenseur s\'engage',
        'Passe au sol, millimétrée dans la course',
        'Appel synchronisé à la limite du hors-jeu'
      ],
      visualCue: 'DÉCALAGE PARFAIT ! 🎯',
      actors: {
        gk: { x: 420, y: 55, action: 'idle' },
        att1: { x: 390, y: 210, action: 'pass' },
        att2: { x: 520, y: 170, action: 'run' },
        def: { x: 405, y: 190, action: 'defend' },
      },
      ball: { x: 510, y: 165, action: 'pass' },
      trails: [
        { from: [390, 210], to: [510, 165], type: 'pass', label: 'Passe décisive' }
      ]
    },
    {
      id: 3,
      timeStart: 0.65,
      timeEnd: 1.0,
      title: 'Étape 3 : Face-à-face & Finition',
      subtitle: 'Frappe instantanée hors de portée du gardien',
      description: 'L\'attaquant 2 se présente seul devant le gardien et conclut d\'une frappe croisée au ras du poteau gauche.',
      coachingAccents: [
        'Sang-froid dans la surface',
        'Regard sur la sortie du gardien',
        'Finition en 1 ou 2 touches maximum'
      ],
      visualCue: 'BUT EN VAGUE 2c1 ! ⚽🔥',
      actors: {
        gk: { x: 420, y: 45, action: 'save' },
        att1: { x: 385, y: 170, action: 'run' },
        att2: { x: 500, y: 110, action: 'shoot' },
        def: { x: 430, y: 160, action: 'defend' },
      },
      ball: { x: 385, y: 40, action: 'shot' },
      trails: [
        { from: [510, 165], to: [500, 110], type: 'run', label: 'Course' },
        { from: [500, 110], to: [385, 40], type: 'shot', label: 'Finition' }
      ]
    }
  ]
};

// -------------------------------------------------------------
// PRESET SCENARIO 7: Slalom Technique, Crochets & Tir (Focus TE)
// -------------------------------------------------------------
export const SCENARIO_SLALOM_FRAPPE: DrillAnimationScenario = {
  id: 'scenario-slalom-frappe',
  name: 'Slalom Technique, Feintes & Frappe Instinctive',
  category: 'FE12 - Motricité, Conduite & Frappe',
  pitchType: 'half-pitch',
  objective: 'Enchaîner changements de rythme balle au pied entre cônes, feinte de frappe et tir spontané au sol.',
  duration: '2x 12 min',
  equipment: '1 grand but avec gardien, 6 cônes en losange/slalom, 1 piquet de feinte, 10 ballons.',
  rules: [
    'Départ lancé au coup de sifflet.',
    'Slalom serré semelle / intérieur / extérieur.',
    'Crochet vif au niveau du mannequin.',
    'Armé et frappe immédiate avant la ligne des 16 mètres.'
  ],
  pedagogicalVariants: {
    easier: 'Espacer les cônes de 2 mètres ou autoriser un contrôle d\'ajustement.',
    harder: 'Slalom uniquement du pied faible et tir obligatoire 1er poteau.'
  },
  elements: [
    { id: 'goal-main', type: 'goal', x: 400, y: 38, width: 90, height: 26, color: '#FFFFFF' },
    { id: 'c1', type: 'cone', x: 400, y: 410, color: '#F59E0B' },
    { id: 'c2', type: 'cone', x: 360, y: 340, color: '#F59E0B' },
    { id: 'c3', type: 'cone', x: 440, y: 280, color: '#F59E0B' },
    { id: 'c4', type: 'cone', x: 370, y: 220, color: '#F59E0B' },
    { id: 'pole-mannequin', type: 'pole', x: 410, y: 160, color: '#EF4444', label: 'Obstacle' },
  ],
  actors: [
    { id: 'gk', name: 'Gardien', role: 'goalkeeper', color: '#10B981', number: '1' },
    { id: 'att', name: 'Attaquant', role: 'attacker', color: '#EF4444', number: '9' },
  ],
  phases: [
    {
      id: 1,
      timeStart: 0.0,
      timeEnd: 0.35,
      title: 'Étape 1 : Slalom serré & Appuis courts',
      subtitle: 'Changements de pied et toucher de balle à chaque pas',
      description: 'Le joueur slalome entre les cônes en alternant intérieur et extérieur. Les appuis sont vifs et dynamiques.',
      coachingAccents: [
        'Toucher le ballon à chaque foulée',
        'Regard dégagé du ballon',
        'Baisse du centre de gravité dans les virages'
      ],
      visualCue: 'SLALOM VIF & TECHNIQUE ! ⚡',
      actors: {
        gk: { x: 400, y: 55, action: 'idle' },
        att: { x: 370, y: 250, action: 'dribble' },
      },
      ball: { x: 375, y: 240, action: 'dribble' },
      trails: [
        { from: [400, 420], to: [360, 340], type: 'run', label: 'Crochet intérieur' },
        { from: [360, 340], to: [440, 280], type: 'run', label: 'Crochet extérieur' },
        { from: [440, 280], to: [370, 250], type: 'run', label: 'Sortie slalom' }
      ]
    },
    {
      id: 2,
      timeStart: 0.35,
      timeEnd: 0.70,
      title: 'Étape 2 : Feinte de corps & Crochet d\'élimination',
      subtitle: 'Effacer l\'obstacle d\'un changement de direction tranchant',
      description: 'À l\'approche du piquet défensif, feinte de frappe du pied droit, crochet intérieur du gauche et accélération pour ouvrir la fenêtre de tir.',
      coachingAccents: [
        'Amplitude de la feinte de corps pour tromper le défenseur',
        'Sortie explosive du crochet',
        'Préparation immédiate du pied d\'appui'
      ],
      visualCue: 'CROCHET DÉVASTATEUR ! 🔄',
      actors: {
        gk: { x: 390, y: 55, action: 'idle' },
        att: { x: 430, y: 140, action: 'dribble' },
      },
      ball: { x: 435, y: 130, action: 'dribble' },
      trails: [
        { from: [370, 250], to: [400, 170], type: 'run', label: 'Fixation piquet' },
        { from: [400, 170], to: [430, 140], type: 'run', label: 'Crochet droit' }
      ]
    },
    {
      id: 3,
      timeStart: 0.70,
      timeEnd: 1.0,
      title: 'Étape 3 : Frappe placée au ras du poteau',
      subtitle: 'Armé rapide et tir précis sans élan superflu',
      description: 'L\'attaquant décoche une frappe tendue coup de pied / plat du pied sécurité dans le petit filet opposé. Le gardien se détend mais ne peut l\'intercepter.',
      coachingAccents: [
        'Cheville ferme et solide',
        'Tête et buste penchés au-dessus du ballon',
        'Rechercher la précision des coins plutôt que la seule puissance'
      ],
      visualCue: 'BUT DANS LE PETIT FILET ! ⚽🎯',
      actors: {
        gk: { x: 375, y: 48, action: 'save' },
        att: { x: 430, y: 125, action: 'shoot' },
      },
      ball: { x: 380, y: 38, action: 'shot' },
      trails: [
        { from: [435, 130], to: [380, 38], type: 'shot', label: 'Frappe enroulée' }
      ]
    }
  ]
};

// -------------------------------------------------------------
// PRESET SCENARIO 8: Cadrage Défensif, Recul-Frein & Transition 3s
// -------------------------------------------------------------
export const SCENARIO_CADRAGE_DEFENSE: DrillAnimationScenario = {
  id: 'scenario-cadrage-defense',
  name: 'Duel Défensif : Recul-frein, Cadrage & Relance 3s',
  category: 'FE12 - Principes Défensifs / Récupération',
  pitchType: 'half-pitch',
  objective: 'Freiner la course de l\'attaquant, fermer l\'axe intérieur, intervenir au bon moment et relancer en 3s.',
  duration: '3x 8 min (Rotations duels)',
  equipment: '2 mini-buts cibles, coupelles, 8 ballons, chasubles bleus et rouges.',
  rules: [
    'L\'attaquant démarre avec le ballon.',
    'Le défenseur sprinte pour cadrer à 2 mètres sans se jeter.',
    'Recul-frein profilé pour orienter vers la ligne de touche.',
    'Dès récupération du ballon : trouver un mini-but en moins de 3 secondes.'
  ],
  pedagogicalVariants: {
    easier: 'L\'attaquant a un espace restreint en largeur.',
    harder: 'L\'attaquant dispose de 2 touches libres puis doit marquer en moins de 5 secondes.'
  },
  elements: [
    { id: 'mb-g', type: 'mini-goal', x: 160, y: 360, width: 30, height: 16, color: '#FACC15', rotation: 90 },
    { id: 'mb-d', type: 'mini-goal', x: 640, y: 360, width: 30, height: 16, color: '#FACC15', rotation: -90 },
    { id: 'c-zone', type: 'zone', x: 260, y: 160, width: 280, height: 260, color: 'rgba(59,130,246,0.12)' },
  ],
  actors: [
    { id: 'att', name: 'Attaquant (Rouge)', role: 'attacker', color: '#EF4444', number: '9' },
    { id: 'def', name: 'Défenseur (Bleu)', role: 'defender', color: '#3B82F6', number: '4' },
    { id: 'coach', name: 'Coach Relais', role: 'coach', color: '#F59E0B', number: 'C' },
  ],
  phases: [
    {
      id: 1,
      timeStart: 0.0,
      timeEnd: 0.30,
      title: 'Étape 1 : Course d\'approche & Freinage profilé',
      subtitle: 'Réduire l\'espace sans se faire éliminer sur le premier crochet',
      description: 'Le défenseur accélère vers le porteur puis freine à 2 mètres. Il adopte une posture de trois-quarts pour interdire l\'axe central.',
      coachingAccents: [
        'Freiner avant le contact (petits pas d\'ajustement)',
        'Appuis sur l\'avant des pieds, genoux fléchis',
        'Orienter l\'attaquant vers la ligne de touche'
      ],
      visualCue: 'CADRAGE & POSTURE DE PROFIL ! 🛡️',
      actors: {
        att: { x: 400, y: 380, action: 'dribble' },
        def: { x: 415, y: 300, action: 'defend' },
        coach: { x: 400, y: 470, action: 'idle' },
      },
      ball: { x: 400, y: 365, action: 'dribble' },
      trails: [
        { from: [400, 430], to: [400, 380], type: 'run', label: 'Conduite' },
        { from: [415, 220], to: [415, 300], type: 'run', label: 'Course de cadrage' }
      ]
    },
    {
      id: 2,
      timeStart: 0.30,
      timeEnd: 0.65,
      title: 'Étape 2 : Recul-frein & Tacle d\'interception',
      subtitle: 'Attendre la touche de balle trop longue pour jaillir',
      description: 'L\'attaquant tente un crochet vers l\'extérieur. Le défenseur anticipe, pose son pied d\'appui et tacle proprement pour subtiliser le cuir.',
      coachingAccents: [
        'Ne jamais se jeter sur la première feinte',
        'Intervenir au moment où le ballon échappe d\'un mètre au porteur',
        'Utiliser le corps pour protéger la sortie'
      ],
      visualCue: 'INTERCEPTION PROPRE ! 💥',
      actors: {
        att: { x: 440, y: 320, action: 'dribble' },
        def: { x: 450, y: 310, action: 'defend' },
        coach: { x: 400, y: 470, action: 'idle' },
      },
      ball: { x: 455, y: 305, action: 'dribble' },
      trails: [
        { from: [400, 365], to: [440, 320], type: 'run', label: 'Tentative crochet' },
        { from: [415, 300], to: [450, 310], type: 'run', label: 'Intervention' }
      ]
    },
    {
      id: 3,
      timeStart: 0.65,
      timeEnd: 1.0,
      title: 'Étape 3 : Transition FootEco 3 secondes',
      subtitle: 'Trouver la cible opposée sans temporiser',
      description: 'Le défenseur récupère le ballon et transmet immédiatement dans le mini-but latéral dans la règle des 3 secondes. L\'attaquant tente le contre-pressing.',
      coachingAccents: [
        'Règle des 3 secondes : passe directe sans conduite superflue',
        'Tête levée dès la récupération',
        'Attaquant : réaction immédiate à la perte de balle'
      ],
      visualCue: 'TRANSITION EN 3 SECONDES ! 🔄🎯',
      actors: {
        att: { x: 430, y: 330, action: 'defend' },
        def: { x: 380, y: 340, action: 'pass' },
        coach: { x: 400, y: 470, action: 'idle' },
      },
      ball: { x: 175, y: 360, action: 'pass' },
      trails: [
        { from: [450, 310], to: [380, 340], type: 'run', label: 'Prise de balle' },
        { from: [380, 340], to: [175, 360], type: 'pass', label: 'Passe mini-but (3s)' }
      ]
    }
  ]
};

// -------------------------------------------------------------
// PRESET SCENARIO 9: Dédoublement Couloir & Jeu en Triangle
// -------------------------------------------------------------
export const SCENARIO_DEDOUBLEMENT_PASSES: DrillAnimationScenario = {
  id: 'scenario-dedoublement-passes',
  name: 'Jeu Combiné : Dédoublement & Triangle sur l\'Aile',
  category: 'FE12 - Combinaisons & Circulation',
  pitchType: 'half-pitch',
  objective: 'Créer un dédoublement extérieur synchronisé avec un appui axial pour casser le bloc adverse.',
  duration: '2x 15 min',
  equipment: '1 grand but avec gardien, piquets couloirs, 10 ballons, chasubles.',
  rules: [
    'Le latéral joue sur l\'ailier et déclenche son dédoublement extérieur.',
    'L\'ailier remet en appui sur le milieu.',
    'Le milieu verticalise en 1 touche dans la course du latéral lancé.',
    'Centre en retrait et reprise de volée.'
  ],
  pedagogicalVariants: {
    easier: 'Sans défenseur (travail de circuits de passes chorégraphiés).',
    harder: 'Le défenseur adverse peut anticiper le dédoublement.'
  },
  elements: [
    { id: 'goal-main', type: 'goal', x: 400, y: 38, width: 90, height: 26, color: '#FFFFFF' },
    { id: 'cone-1', type: 'cone', x: 620, y: 350, color: '#F59E0B' },
    { id: 'cone-2', type: 'cone', x: 620, y: 150, color: '#F59E0B' },
  ],
  actors: [
    { id: 'gk', name: 'Gardien', role: 'goalkeeper', color: '#10B981', number: '1' },
    { id: 'lat', name: 'Latéral', role: 'attacker', color: '#EF4444', number: '2' },
    { id: 'ail', name: 'Ailier', role: 'attacker', color: '#EF4444', number: '7' },
    { id: 'mil', name: 'Milieu', role: 'attacker', color: '#EF4444', number: '8' },
    { id: 'att', name: 'Buteur', role: 'attacker', color: '#EF4444', number: '9' },
    { id: 'def', name: 'Défenseur', role: 'defender', color: '#3B82F6', number: '3' },
  ],
  phases: [
    {
      id: 1,
      timeStart: 0.0,
      timeEnd: 0.30,
      title: 'Étape 1 : Passe d\'amorce & Dédoublement extérieur',
      subtitle: 'Le latéral sert l\'ailier et sprinte dans son dos',
      description: 'Le latéral transmet à l\'ailier dos au jeu, puis enchaîne immédiatement une course de dédoublement à pleine vitesse par l\'extérieur.',
      coachingAccents: [
        'Vitesse de démarrage du latéral dès que le ballon quitte son pied',
        'Ailier : protection du ballon dos au défenseur',
        'Timing de la course extérieure'
      ],
      visualCue: 'DÉDOUBLEMENT EXTÉRIEUR ! ⚡',
      actors: {
        gk: { x: 400, y: 55, action: 'idle' },
        lat: { x: 600, y: 380, action: 'pass' },
        ail: { x: 570, y: 270, action: 'idle' },
        mil: { x: 420, y: 290, action: 'idle' },
        att: { x: 380, y: 180, action: 'idle' },
        def: { x: 550, y: 250, action: 'defend' },
      },
      ball: { x: 570, y: 270, action: 'pass' },
      trails: [
        { from: [600, 440], to: [570, 270], type: 'pass', label: 'Passe d\'appui' },
        { from: [600, 440], to: [660, 280], type: 'run', label: 'Course de dédoublement' }
      ]
    },
    {
      id: 2,
      timeStart: 0.30,
      timeEnd: 0.65,
      title: 'Étape 2 : Appui milieu & Passe dans l\'intervalle',
      subtitle: 'Triangle de passe rapide et passe en profondeur',
      description: 'L\'ailier remet en 1 touche sur le milieu axial venu en soutien. Le milieu glisse en une touche dans la course du latéral dédoublé.',
      coachingAccents: [
        'Jeu en 1 touche de balle impératif pour conserver la vitesse',
        'Passe millimétrée dans l\'espace libre sans ralentir la course',
        'Plongée des attaquants dans la surface'
      ],
      visualCue: 'TRIANGLE & PROFONDEUR ! 🎯',
      actors: {
        gk: { x: 400, y: 55, action: 'idle' },
        lat: { x: 650, y: 170, action: 'run' },
        ail: { x: 560, y: 250, action: 'pass' },
        mil: { x: 440, y: 270, action: 'pass' },
        att: { x: 380, y: 140, action: 'run' },
        def: { x: 540, y: 230, action: 'defend' },
      },
      ball: { x: 640, y: 160, action: 'pass' },
      trails: [
        { from: [570, 270], to: [440, 270], type: 'pass', label: 'Remise milieu' },
        { from: [440, 270], to: [640, 160], type: 'pass', label: 'Passe dans la course' }
      ]
    },
    {
      id: 3,
      timeStart: 0.65,
      timeEnd: 1.0,
      title: 'Étape 3 : Centre tendu & Finition clinique',
      subtitle: 'Reprise en une touche au point de penalty',
      description: 'Le latéral centre en retrait pour l\'attaquant qui conclut d\'une frappe croisée puissante au ras du sol.',
      coachingAccents: [
        'Qualité du centre brossé en retrait',
        'Frappe spontanée en 1ère intention',
        'Équilibre permanent de l\'équipe'
      ],
      visualCue: 'BUT SUR DÉDOUBLEMENT ! ⚽🎉',
      actors: {
        gk: { x: 380, y: 48, action: 'save' },
        lat: { x: 630, y: 120, action: 'pass' },
        ail: { x: 550, y: 200, action: 'idle' },
        mil: { x: 440, y: 250, action: 'idle' },
        att: { x: 390, y: 100, action: 'shoot' },
        def: { x: 510, y: 180, action: 'defend' },
      },
      ball: { x: 380, y: 38, action: 'shot' },
      trails: [
        { from: [640, 160], to: [390, 100], type: 'pass', label: 'Centre retrait' },
        { from: [390, 100], to: [380, 38], type: 'shot', label: 'Reprise but' }
      ]
    }
  ]
};

// All presets
export const ALL_ANIMATION_SCENARIOS: DrillAnimationScenario[] = [
  SCENARIO_DUEL_1V1,
  SCENARIO_CENTRES_FINITION,
  SCENARIO_DEDOUBLEMENT_PASSES,
  SCENARIO_VAGUES_2V1,
  SCENARIO_SLALOM_FRAPPE,
  SCENARIO_CADRAGE_DEFENSE,
  SCENARIO_RONDO_4V2,
  SCENARIO_TRANSITION_3V2,
  SCENARIO_MATCH_6V6,
];

// Helper to extract clean drill text for a slot from a full part description
export function extractDrillSlotText(description: string = '', slotName?: string): string {
  if (!description) return '';
  if (!slotName || slotName === 'Complet') return description;

  const d1Match = description.match(/Dessin 1(?:\s*\([^)]*\))?\s*:\s*([\s\S]*?)(?=Dessin 2|$)/i);
  const d2Match = description.match(/Dessin 2(?:\s*\([^)]*\))?\s*:\s*([\s\S]*?)$/i);

  if (slotName === 'Dessin 1' && d1Match && d1Match[1]?.trim()) {
    return d1Match[1].trim();
  }
  if (slotName === 'Dessin 2' && d2Match && d2Match[1]?.trim()) {
    return d2Match[1].trim();
  }

  return description;
}

// Helper to determine the best matching scenario based on text
export function detectBestAnimationScenario(
  title: string = '',
  description: string = '',
  focus: string = '',
  slotName?: string
): DrillAnimationScenario {
  const specificText = extractDrillSlotText(description, slotName);
  const fullText = `${title} ${specificText} ${focus}`.toLowerCase();

  // 1. Centres & Débordements
  if (fullText.includes('centre') || fullText.includes('débord') || fullText.includes('couloir') || fullText.includes('retrait') || fullText.includes('volée') || fullText.includes('tête')) {
    return SCENARIO_CENTRES_FINITION;
  }
  // 2. Dédoublement & Combinaisons
  if (fullText.includes('dédoubl') || fullText.includes('une-deux') || fullText.includes('combinaison') || fullText.includes('triangle')) {
    return SCENARIO_DEDOUBLEMENT_PASSES;
  }
  // 3. Vagues 2c1 / Surnombre
  if (fullText.includes('2c1') || fullText.includes('2v1') || fullText.includes('2 contre 1') || fullText.includes('vague')) {
    return SCENARIO_VAGUES_2V1;
  }
  // 4. Slalom, Motricité & Crochets
  if (fullText.includes('slalom') || fullText.includes('crochet') || fullText.includes('feinte') || fullText.includes('motricité') || fullText.includes('échelle') || fullText.includes('cerceau')) {
    return SCENARIO_SLALOM_FRAPPE;
  }
  // 5. Cadrage & Récupération défensive
  if (fullText.includes('cadr') || fullText.includes('recul') || fullText.includes('interception') || fullText.includes('frein') || fullText.includes('défens')) {
    return SCENARIO_CADRAGE_DEFENSE;
  }
  // 6. Match & Jeu Final
  if (fullText.includes('6v6') || fullText.includes('6c6') || fullText.includes('7v7') || fullText.includes('match') || fullText.includes('jeu final')) {
    return SCENARIO_MATCH_6V6;
  }
  // 7. Rondo & Conservation
  if (fullText.includes('rondo') || fullText.includes('conservation') || fullText.includes('4v2') || fullText.includes('4c2') || fullText.includes('possession')) {
    return SCENARIO_RONDO_4V2;
  }
  // 8. Transition rapide & 3s
  if (fullText.includes('transition') || fullText.includes('3s') || fullText.includes('3 seconde') || fullText.includes('3c2')) {
    return SCENARIO_TRANSITION_3V2;
  }

  // Default to 1v1 duel
  return SCENARIO_DUEL_1V1;
}

// Procedural builder that constructs an animation scenario tailored to the exact déroulement of an exercise
export function buildScenarioFromExercise(
  partTitle: string,
  partDescription: string,
  partFocus: string = '',
  slotName?: 'Dessin 1' | 'Dessin 2' | 'Complet',
  customDrawingCaption?: string
): DrillAnimationScenario {
  // Base scenario detection
  const baseScenario = detectBestAnimationScenario(partTitle, partDescription, partFocus, slotName);
  const specificText = extractDrillSlotText(partDescription, slotName);
  
  const drillTitle = customDrawingCaption?.trim() 
    ? customDrawingCaption.trim() 
    : (specificText.split(/[:\n]/)[0] || baseScenario.name);

  // Extract key sentences or action clauses
  const sentences = specificText
    .split(/[,;\n.]/)
    .map(s => s.trim())
    .filter(s => s.length > 5);

  // Clone base scenario so we don't mutate the preset
  const scenario: DrillAnimationScenario = JSON.parse(JSON.stringify(baseScenario));
  scenario.id = `custom-${slotName || 'full'}-${Date.now()}`;
  scenario.name = drillTitle.length > 4 ? drillTitle : `${baseScenario.name} (${slotName || 'Exercice'})`;
  if (partFocus) {
    scenario.objective = `${partFocus} : ${specificText.slice(0, 130)}...`;
  }

  // Refine phases based on extracted sentences if possible
  if (sentences.length >= 2 && scenario.phases.length >= 2) {
    scenario.phases.forEach((ph, idx) => {
      const matchedSentence = sentences[idx] || sentences[sentences.length - 1];
      if (matchedSentence) {
        ph.description = matchedSentence.charAt(0).toUpperCase() + matchedSentence.slice(1) + '.';
      }
    });
  }

  return scenario;
}

