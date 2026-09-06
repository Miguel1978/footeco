// ASF FootEco Procedural Generator for FE12/FE13/FE14
// Official Swiss Football Association methodology (Jouer - Jouer - Jouer)
// Provides authentic FootEco training sessions with rich tactical drills, coaching accents,
// and variations (Standard, High Intensity, Goalkeepers, Reduced Space)

export interface ProceduralSessionParams {
  themeTitle: string;
  category?: string;
  phase?: 'DEF' | 'OFF' | 'DEF & OFF';
  focusTopic?: string;
  coach?: string;
  assistantCoach?: string;
  season?: string;
  specificInstructions?: string;
  variation?: 'standard' | 'intensity' | 'goalkeeper' | 'reduced_space' | string;
  regenerationAttempt?: number;
}

export function detectThemeArchetype(text: string): 'passe' | 'dribble' | 'tir' | 'technique' | 'tactique' | 'defense' | 'transition' | 'centres' {
  const t = text.toLowerCase();
  if (t.includes('centre') || t.includes('débord') || t.includes('couloir') || t.includes('reprise') || t.includes('volée') || t.includes('tête')) {
    return 'centres';
  }
  if (t.includes('tir') || t.includes('frappe') || t.includes('finition') || t.includes('but') || t.includes('face-à-face')) {
    return 'tir';
  }
  if (t.includes('dribble') || t.includes('1c1') || t.includes('1v1') || t.includes('feinte') || t.includes('crochet') || t.includes('élimin') || t.includes('percussion')) {
    return 'dribble';
  }
  if (t.includes('défense') || t.includes('defense') || t.includes('cadrer') || t.includes('fermer') || t.includes('interception') || t.includes('pressing') || t.includes('récupér') || t.includes('recul')) {
    return 'defense';
  }
  if (t.includes('transition') || t.includes('3s') || t.includes('3 sec') || t.includes('contre-attaque') || t.includes('repli') || t.includes('supériorité')) {
    return 'transition';
  }
  if (t.includes('passe') || t.includes('circul') || t.includes('appui') || t.includes('soutien') || t.includes('une-deux') || t.includes('intervalle') || t.includes('renversement')) {
    return 'passe';
  }
  if (t.includes('tactique') || t.includes('rondo') || t.includes('possession') || t.includes('relance') || t.includes('pression') || t.includes('bloc')) {
    return 'tactique';
  }
  return 'technique';
}

export function generateAsfSessionProcedural(params: ProceduralSessionParams) {
  const {
    themeTitle,
    category = 'FE12 Bas-Valais',
    phase = 'DEF & OFF',
    coach = 'Sébastien M.',
    assistantCoach = 'Miguel R.',
    season = '2025/2026',
    specificInstructions = '',
    variation = 'standard',
    regenerationAttempt = 0,
  } = params;

  const coach1 = coach ? coach.split(' ')[0] : 'SEB';
  const coach2 = assistantCoach ? assistantCoach.split(' ')[0] : 'Miguel';

  const combinedSearch = `${themeTitle} ${params.focusTopic || ''} ${specificInstructions}`;
  const archetype = detectThemeArchetype(combinedSearch);
  const variantIndex = (regenerationAttempt % 4);

  // Template banks per archetype with 4 distinct variations
  const sessionsBank: Record<string, any[]> = {
    passe: [
      {
        title: `Séance FootEco ${category} - Passes courtes au sol, appuis & 1ère touche`,
        themeTE: {
          description: "Précision et dosage de la passe courte au sol (intérieur du pied, cheville verrouillée) et première touche orientée active.",
          coachingAccents: "Prise d'information avant la passe (scan 360°), orientation du corps vers le jeu, pied d'appui stable dirigé vers la cible.",
        },
        themeTA: {
          description: "Création de lignes de passe, jeu en triangle et disponibilité permanente autour du porteur de balle.",
          defOrOff: "OFF",
          antagonism: "Sortir rapidement de la zone de densité vs Cadrer et couper les lignes de passe",
          coachingAccents: "S'écarter à la vue du ballon, appel franc dans les pieds ou dans la course, temporiser si l'axe est bouché.",
        },
        themePE: {
          description: "Concentration sur la justesse technique, communication verbale et gestuelle positive.",
          coachingAccents: "Nommer le partenaire avant de donner, encourager les initiatives, intensité constante.",
        },
        initialPart: {
          title: "Partie initiale - Focus TE/KO",
          focus: "Focus TE/KO",
          duration: "2X 15 min (Total 30 min)",
          description: `Dessin 1 (${coach1}) : Circuit en losange / carré technique avec passes au sol en une-deux, remise en un temps et contrôle orienté dans la course. Rotation continue sans temps d'attente.\n\nDessin 2 (${coach2}) : Slalom vivacité coordonné suivi d'une passe claquée dans une mini-porte et appel dans l'intervalle avec remise du coach.`,
          drawing1Caption: "Circuit losange en 1-2 touches & appuis",
          drawing1Coach: coach1,
          drawing2Caption: "Slalom vivacité & passe claquée",
          drawing2Coach: coach2,
          recommendedPreset1: "preset-init-1",
          recommendedPreset2: "preset-init-2",
        },
        playedForms: {
          title: "Formes jouées - Focus TA",
          focus: "Focus TA",
          duration: "2X 15 min (Total 30 min)",
          description: `Dessin 1 (${coach1}) : Rondo de possession 4 contre 2 en zone délimitée (15x15m). Objectif : 6 passes consécutives = 1 point. Si les défenseurs récupèrent, ils cherchent un mini-but en 5 secondes.\n\nDessin 2 (${coach2}) : Jeu de conservation 3 contre 3 + 2 jokers extérieurs. Recherche constante du troisième homme pour progresser d'une zone à l'autre.`,
          drawing1Caption: "Rondo 4v2 avec transition 5 secondes",
          drawing1Coach: coach1,
          drawing2Caption: "Jeu de position 3v3 + 2 jokers latéraux",
          drawing2Coach: coach2,
          recommendedPreset1: "preset-form-1",
          recommendedPreset2: "preset-form-2",
        },
        finalGame: {
          title: "Jeu final - Focus TE/TA",
          focus: "Focus TE/TA",
          duration: "30 min",
          description: `Match d'application 6 contre 6 sur terrain FootEco FE12.\nRègle provocatrice : Un but précédé d'une combinaison à 3 joueurs ou d'un une-deux réussi compte double (2 points).\nRemplaçants : Atelier jonglage synchronisé par paire (duo) ou devoirs techniques spécifiques.`,
          drawing1Caption: "Match 6 contre 6 FootEco avec bonus combinaisons",
          drawing1Coach: "",
          drawing2Caption: "",
          drawing2Coach: "",
          recommendedPreset1: "preset-game-6v6",
          recommendedPreset2: "",
        },
        remarksAndIndividualization: "Pour les joueurs en difficulté : autoriser une touche supplémentaire pour stabiliser. Pour les joueurs avancés : imposer 2 touches maximum strictes.",
        bilan: "Évaluer le pourcentage de passes réussies vers l'avant et la fluidité des réceptions orientées.",
      },
      {
        title: `Séance FootEco ${category} - Fixer pour donner & Passe dans l'intervalle`,
        themeTE: {
          description: "Conduite de balle de fixation rythmée et passe tranchante cassant une ligne adverse.",
          coachingAccents: "Attirer le défenseur, libérer le ballon au moment opportun (timing précis), doser la passe au sol.",
        },
        themeTA: {
          description: "Principe offensif FootEco : fixer un adversaire balle au pied pour libérer le partenaire dans le dos.",
          defOrOff: "OFF",
          antagonism: "Pénétration axiale vs Bloc resserré et couverture mutuelle",
          coachingAccents: "Appel coordonné du non-porteur au moment où le porteur fixe le défenseur.",
        },
        themePE: {
          description: "Vivacité dans la prise de décision et audace dans les transmissions vers l'avant.",
          coachingAccents: "Ne pas craindre l'échec de passe, valoriser la créativité et la vitesse de réaction.",
        },
        initialPart: {
          title: "Partie initiale - Focus TE/KO",
          focus: "Focus TE/KO",
          duration: "2X 15 min (Total 30 min)",
          description: `Dessin 1 (${coach1}) : Exercice en triangle avec fixation d'un mannequin, feinte de corps et passe appuyée dans l'intervalle pour le joueur lancé.\n\nDessin 2 (${coach2}) : Duels techniques 2 contre 1 en couloir : fixer le défenseur passif puis transmission tranchante avec accélération.`,
          drawing1Caption: "Triangle de fixation & passe tranchante",
          drawing1Coach: coach1,
          drawing2Caption: "2c1 fixation de couloir & accélération",
          drawing2Coach: coach2,
          recommendedPreset1: "preset-init-1",
          recommendedPreset2: "preset-init-2",
        },
        playedForms: {
          title: "Formes jouées - Focus TA",
          focus: "Focus TA",
          duration: "2X 15 min (Total 30 min)",
          description: `Dessin 1 (${coach1}) : Situation 3 contre 2 + gardien sur demi-terrain. Les attaquants doivent fixer un défenseur central pour trouver l'ailier libre à l'opposé.\n\nDessin 2 (${coach2}) : Forme jouée 4 contre 3 avec zone intermédiaire protégée. But valable uniquement après une passe qui traverse l'intervalle central.`,
          drawing1Caption: "3v2 avec décalage & tir rapide",
          drawing1Coach: coach1,
          drawing2Caption: "4v3 avec passe dans l'intervalle clé",
          drawing2Coach: coach2,
          recommendedPreset1: "preset-form-1",
          recommendedPreset2: "preset-form-2",
        },
        finalGame: {
          title: "Jeu final - Focus TE/TA",
          focus: "Focus TE/TA",
          duration: "30 min",
          description: `Match FootEco 6v6 avec zone médiane de 10m. Les passes traversant la zone médiane sans être touchées déclenchent une supériorité immédiate.\nActivité remplaçants : Devoirs techniques par 2 (passe volée, contrôle poitrine et remise au sol).`,
          drawing1Caption: "Match 6v6 avec zone de transition médiane",
          drawing1Coach: "",
          drawing2Caption: "",
          drawing2Coach: "",
          recommendedPreset1: "preset-game-6v6",
          recommendedPreset2: "",
        },
        remarksAndIndividualization: "Adapter la largeur des intervalles selon les aptitudes des joueurs pour valoriser la réussite.",
        bilan: "Constater la fréquence des passes qui cassent les lignes plutôt que les passes latérales stériles.",
      },
    ],
    dribble: [
      {
        title: `Séance FootEco ${category} - Dribbles 1c1, Feintes & Élimination`,
        themeTE: {
          description: "Maîtrise du passement de jambes, feinte de corps, crochet intérieur/extérieur et changement de rythme explosif.",
          coachingAccents: "Baisse du centre de gravité, déséquilibre franc du haut du corps, accélération nette après l'élimination.",
        },
        themeTA: {
          description: "Phase offensive : oser le duel 1c1 dans les zones de déséquilibre, reconnaître le moment favorable pour éliminer.",
          defOrOff: "OFF",
          antagonism: "Provoquer et passer en vitesse vs Cadrer, freiner et orienter",
          coachingAccents: "Prendre de la vitesse avant d'arriver sur le défenseur, attaquer le côté faible de l'adversaire.",
        },
        themePE: {
          description: "Courage, audace, confiance en soi et persévérance dans le duel.",
          coachingAccents: "Valoriser la prise de risque même en cas de ballon perdu, féliciter les gestes techniques créatifs.",
        },
        initialPart: {
          title: "Partie initiale - Focus TE/KO",
          focus: "Focus TE/KO",
          duration: "2X 15 min (Total 30 min)",
          description: `Dessin 1 (${coach1}) : Duels 1c1 continus dans deux couloirs parallèles. Départ face à face après contournement d'une assiette, feinte imposée (crochet ou passement) et finition dans mini-but.\n\nDessin 2 (${coach2}) : Slalom vivacité avec conduite de balle pied fort/pied faible, feinte sur piquet et frappe immédiate dans la foulée.`,
          drawing1Caption: "Duels 1c1 en couloir & finition rapide",
          drawing1Coach: coach1,
          drawing2Caption: "Slalom motricité & feinte sur piquet",
          drawing2Coach: coach2,
          recommendedPreset1: "preset-init-1",
          recommendedPreset2: "preset-init-2",
        },
        playedForms: {
          title: "Formes jouées - Focus TA",
          focus: "Focus TA",
          duration: "2X 15 min (Total 30 min)",
          description: `Dessin 1 (${coach1}) : Forme jouée 1c1 en 4 zones délimitées avec 2 mini-buts opposés. Chaque joueur défend 1 but et attaque 1 but. Temps limite : 8 secondes par duel.\n\nDessin 2 (${coach2}) : 1c1 avec joueur d'appui en retrait (soutien possible si le joueur est enfermé). Obligation de retenter le duel après la remise.`,
          drawing1Caption: "1c1 en 4 zones & 2 mini-buts",
          drawing1Coach: coach1,
          drawing2Caption: "1c1 avec appui en retrait & 2e tentative",
          drawing2Coach: coach2,
          recommendedPreset1: "preset-form-1",
          recommendedPreset2: "preset-form-2",
        },
        finalGame: {
          title: "Jeu final - Focus TE/TA",
          focus: "Focus TE/TA",
          duration: "30 min",
          description: `Match 6v6 FootEco : Tout but inscrit immédiatement après un duel 1c1 gagné compte triple !\nActivité remplaçants : Défi jonglage pieds alternés et travail de dextérité semelle.`,
          drawing1Caption: "Match 6v6 FootEco valorisation duels 1c1",
          drawing1Coach: "",
          drawing2Caption: "",
          drawing2Coach: "",
          recommendedPreset1: "preset-game-6v6",
          recommendedPreset2: "",
        },
        remarksAndIndividualization: "Ajuster la distance de départ pour donner l'avantage au joueur attaquant selon sa vitesse.",
        bilan: "Observer le nombre d'initiatives individuelles prises par l'ensemble des joueurs sans retenue.",
      },
      {
        title: `Séance FootEco ${category} - Changements de rythme, Crochets & Percussion`,
        themeTE: {
          description: "Alternance lenteur/explosivité balle au pied, crochets intérieur/extérieur nets et protection du cuir du bras opposé.",
          coachingAccents: "Toucher le ballon à chaque foulée avant d'accélérer brutalement pour distancer l'adversaire direct.",
        },
        themeTA: {
          description: "Attaquer l'intervalle libre dès que le défenseur recule ou se déséquilibre.",
          defOrOff: "OFF",
          antagonism: "Changement de vitesse déstabilisant vs Recul-frein défensif discipliné",
          coachingAccents: "Fixer avec le regard avant de déclencher le démarrage dans la zone opposée.",
        },
        themePE: {
          description: "Explosivité physique et vivacité de réaction.",
          coachingAccents: "Pousser les joueurs à sprinter à 100% lors de la sortie du crochet.",
        },
        initialPart: {
          title: "Partie initiale - Focus TE/KO",
          focus: "Focus TE/KO",
          duration: "2X 15 min (Total 30 min)",
          description: `Dessin 1 (${coach1}) : Circuit en losange avec double feinte : conduite ralentie vers le cône, crochet extérieur du droit, accélération 5m puis crochet intérieur du gauche.\n\nDessin 2 (${coach2}) : Vagues de motricité : passage d'échelles de rythme, prise de balle en l'air et percussion à pleine vitesse entre 2 piquets.`,
          drawing1Caption: "Circuit double crochet & accélération",
          drawing1Coach: coach1,
          drawing2Caption: "Motricité & percussion entre piquets",
          drawing2Coach: coach2,
          recommendedPreset1: "preset-init-1",
          recommendedPreset2: "preset-init-2",
        },
        playedForms: {
          title: "Formes jouées - Focus TA",
          focus: "Focus TA",
          duration: "2X 15 min (Total 30 min)",
          description: `Dessin 1 (${coach1}) : 1c1 avec portes de couleur : le coach annonce une couleur, l'attaquant doit feinter vers une porte puis franchir la couleur annoncée.\n\nDessin 2 (${coach2}) : 2c1 en vagues offensives : le porteur doit éliminer son vis-à-vis en un temps record avant de servir son coéquipier.`,
          drawing1Caption: "1c1 avec feinte sur portes de couleur",
          drawing1Coach: coach1,
          drawing2Caption: "2c1 élimination rapide & finition",
          drawing2Coach: coach2,
          recommendedPreset1: "preset-form-1",
          recommendedPreset2: "preset-form-2",
        },
        finalGame: {
          title: "Jeu final - Focus TE/TA",
          focus: "Focus TE/TA",
          duration: "30 min",
          description: `Match 6v6 : Deux couloirs latéraux de 5m protégés où seul le 1c1 est autorisé. Tout franchissement de ligne en dribble rapporte 1 point bonus.\nActivité remplaçants : Slalom en 8 et travail semelle/coup de pied.`,
          drawing1Caption: "Match 6v6 avec couloirs de percussion",
          drawing1Coach: "",
          drawing2Caption: "",
          drawing2Coach: "",
          recommendedPreset1: "preset-game-6v6",
          recommendedPreset2: "",
        },
        remarksAndIndividualization: "Varier la taille des portes pour encourager les feintes amples.",
        bilan: "Constater si les joueurs osent percuter vers l'avant dès qu'un couloir s'ouvre.",
      },
    ],
    tir: [
      {
        title: `Séance FootEco ${category} - Tirs précis, Sang-froid & Finition au but`,
        themeTE: {
          description: "Qualité de frappe (cou-de-pied puissant ou intérieur placé), orientation du pied d'appui et regard levé vers le gardien.",
          coachingAccents: "Pied d'appui à côté du ballon dirigé vers le poteau, corps penché au-dessus de la balle pour ne pas dévisser.",
        },
        themeTA: {
          description: "Créer un angle de tir favorable, déclencher en un minimum de touches (1 ou 2 touches maximum).",
          defOrOff: "OFF",
          antagonism: "Efficacité clinique devant le but vs Cadrage d'urgence et fermeture des angles",
          coachingAccents: "Suivre la frappe systématiquement pour le second ballon (rebond gardien).",
        },
        themePE: {
          description: "Détermination, lucidité sous pression et envie insatiable de marquer.",
          coachingAccents: "Célébrer chaque but avec les coéquipiers, encourager la répétition rapide.",
        },
        initialPart: {
          title: "Partie initiale - Focus TE/KO",
          focus: "Focus TE/KO",
          duration: "2X 15 min (Total 30 min)",
          description: `Dessin 1 (${coach1}) : Atelier enchaînement express contrôle orienté hors de la zone de cônes et frappe placée dans le petit filet face au gardien.\n\nDessin 2 (${coach2}) : Une-deux rapide avec le coach à l'entrée de la surface, prise d'élan et frappe instantanée du pied faible.`,
          drawing1Caption: "Contrôle orienté & frappe petit filet",
          drawing1Coach: coach1,
          drawing2Caption: "Une-deux avec coach & frappe spontanée",
          drawing2Coach: coach2,
          recommendedPreset1: "preset-init-1",
          recommendedPreset2: "preset-init-2",
        },
        playedForms: {
          title: "Formes jouées - Focus TA",
          focus: "Focus TA",
          duration: "2X 15 min (Total 30 min)",
          description: `Dessin 1 (${coach1}) : Situation 2 contre 1 + gardien : départ à 25m, les attaquants ont 6 secondes maximum pour déclencher une frappe cadrée.\n\nDessin 2 (${coach2}) : Vagues d'attaque 3 contre 2 avec tir obligatoire dans la zone des 12 mètres pour valider le but.`,
          drawing1Caption: "2c1 rapide avec chrono 6 secondes",
          drawing1Coach: coach1,
          drawing2Caption: "3c2 vagues offensives & frappes cadrées",
          drawing2Coach: coach2,
          recommendedPreset1: "preset-form-1",
          recommendedPreset2: "preset-form-2",
        },
        finalGame: {
          title: "Jeu final - Focus TE/TA",
          focus: "Focus TE/TA",
          duration: "30 min",
          description: `Match d'application 6v6 avec grands buts et 2 gardiens. Règle : But marqué en 1 touche de balle = 2 points. Tout tir non cadré donne une touche immédiate à l'adversaire.\nRemplaçants : Jonglage de la tête et tirs de précision sur cibles.`,
          drawing1Caption: "Match 6v6 FootEco avec 2 gardiens de but",
          drawing1Coach: "",
          drawing2Caption: "",
          drawing2Coach: "",
          recommendedPreset1: "preset-game-6v6",
          recommendedPreset2: "",
        },
        remarksAndIndividualization: "Rapprocher la ligne de tir de 3 mètres pour les joueurs manquant de puissance de frappe.",
        bilan: "Comptabiliser le ratio de tirs cadrés par rapport au nombre total de tentatives.",
      },
      {
        title: `Séance FootEco ${category} - Frappes instinctives en 1 touche & Face-à-face`,
        themeTE: {
          description: "Prise d'information immédiate, armé rapide sans élan excessif, frappe spontanée coup de pied ou piqué au-dessus du gardien.",
          coachingAccents: "Verrouiller la cheville au moment de l'impact, ne pas ralentir sa course avant la frappe.",
        },
        themeTA: {
          description: "Créer un décalage rapide à l'entrée de la surface pour armer avant le retour des défenseurs.",
          defOrOff: "OFF",
          antagonism: "Finition chirurgicale sous pression temporelle vs Sortie explosive du gardien",
          coachingAccents: "Anticiper la trajectoire du ballon pour frapper en première intention.",
        },
        themePE: {
          description: "Instinct de buteur, audace et concentration absolue sur la cible.",
          coachingAccents: "Encourager les tirs audacieux sans crainte de manquer le cadre.",
        },
        initialPart: {
          title: "Partie initiale - Focus TE/KO",
          focus: "Focus TE/KO",
          duration: "2X 15 min (Total 30 min)",
          description: `Dessin 1 (${coach1}) : Atelier enchaînement vivacité : passage de cerceaux, ballon lancé en cloche par le coach et reprise de demi-volée cadrée.\n\nDessin 2 (${coach2}) : Face-à-face avec gardien : départ lancé à 20m avec un défenseur à la poursuite à 3m de distance (défi chrono 4 secondes).`,
          drawing1Caption: "Demi-volée coordonnée sur ballon aérien",
          drawing1Coach: coach1,
          drawing2Caption: "Face-à-face lancé avec poursuiteur",
          drawing2Coach: coach2,
          recommendedPreset1: "preset-init-1",
          recommendedPreset2: "preset-init-2",
        },
        playedForms: {
          title: "Formes jouées - Focus TA",
          focus: "Focus TA",
          duration: "2X 15 min (Total 30 min)",
          description: `Dessin 1 (${coach1}) : 3 contre 2 en zone de finition : obligation de frapper dans les 5 secondes suivant l'entrée dans la zone des 16m.\n\nDessin 2 (${coach2}) : Duel de frappes 2v2 + 2 appuis latéraux avec tirs obligatoires en une touche de balle sur service de l'appui.`,
          drawing1Caption: "3c2 avec compte à rebours 5s",
          drawing1Coach: coach1,
          drawing2Caption: "2c2 finition 1 touche sur passe latérale",
          drawing2Coach: coach2,
          recommendedPreset1: "preset-form-1",
          recommendedPreset2: "preset-form-2",
        },
        finalGame: {
          title: "Jeu final - Focus TE/TA",
          focus: "Focus TE/TA",
          duration: "30 min",
          description: `Match 6v6 avec zones franches de tir : tout but inscrit d'en dehors de la surface vaut 2 points, tout but en 1 touche dans la surface vaut 3 points.\nActivité remplaçants : Tir de précision sur bâche avec cibles dans les lucarnes.`,
          drawing1Caption: "Match 6v6 avec bonus tirs lointains & 1 touche",
          drawing1Coach: "",
          drawing2Caption: "",
          drawing2Coach: "",
          recommendedPreset1: "preset-game-6v6",
          recommendedPreset2: "",
        },
        remarksAndIndividualization: "Adapter la taille des buts et autoriser un amorti orienté pour les joueurs en reprise.",
        bilan: "Constater le nombre de frappes déclenchées sans contrôle préalable superflu.",
      },
    ],
    defense: [
      {
        title: `Séance FootEco ${category} - Duels défensifs : Cadrer, freiner & Récupérer`,
        themeTE: {
          description: "Posture défensive fléchie, appuis dynamiques sur l'avant du pied, timing d'intervention pour chiper le ballon proprement.",
          coachingAccents: "Ne jamais se jeter, freiner la course de l'adversaire avec les bras équilibrés, intervenir sur une touche trop longue.",
        },
        themeTA: {
          description: "Orienter l'attaquant vers la ligne de touche, fermer l'axe du but et couper les trajectoires de passe.",
          defOrOff: "DEF",
          antagonism: "Empêcher la progression axiale vs Percussion et dribbles déstabilisants",
          coachingAccents: "Distance d'intervention : un bras de distance, recul-frein efficace tant que le joueur est dos au jeu.",
        },
        themePE: {
          description: "Agressivité saine, combativité, rigueur et solidarité défensive.",
          coachingAccents: "Prendre du plaisir à bien défendre et à récupérer le ballon pour lancer le contre.",
        },
        initialPart: {
          title: "Partie initiale - Focus TE/KO",
          focus: "Focus TE/KO",
          duration: "2X 15 min (Total 30 min)",
          description: `Dessin 1 (${coach1}) : Atelier spécifique cadrage : l'attaquant reçoit la passe, le défenseur sprinte sur 10m puis ralentit (pas chassés de recul-frein) pour bloquer l'accès au mini-but.\n\nDessin 2 (${coach2}) : Duel de réactivité : départ au signal sonore, contournement de piquet et bataille pour gagner la possession du ballon libre.`,
          drawing1Caption: "Sprint, décélération & recul-frein",
          drawing1Coach: coach1,
          drawing2Caption: "Duel de réactivité au signal sonore",
          drawing2Coach: coach2,
          recommendedPreset1: "preset-init-1",
          recommendedPreset2: "preset-init-2",
        },
        playedForms: {
          title: "Formes jouées - Focus TA",
          focus: "Focus TA",
          duration: "2X 15 min (Total 30 min)",
          description: `Dessin 1 (${coach1}) : 1c1 en couloir avec obligation pour le défenseur d'orienter l'attaquant vers la touche extérieure. 1 point si récupération propre.\n\nDessin 2 (${coach2}) : 2 contre 2 en zone axiale : coordination entre le premier défenseur qui cadre et le deuxième qui assure la couverture mutuelle.`,
          drawing1Caption: "1c1 orientation vers la ligne de touche",
          drawing1Coach: coach1,
          drawing2Caption: "2c2 cadrage et couverture mutuelle",
          drawing2Coach: coach2,
          recommendedPreset1: "preset-form-1",
          recommendedPreset2: "preset-form-2",
        },
        finalGame: {
          title: "Jeu final - Focus TE/TA",
          focus: "Focus TE/TA",
          duration: "30 min",
          description: `Match 6v6 : Récupérer le ballon dans la moitié de terrain adverse et marquer en moins de 6 secondes donne 3 points.\nActivité remplaçants : Atelier gainage dynamique avec ballon et têtes défensives.`,
          drawing1Caption: "Match 6v6 avec bonus récupération haute",
          drawing1Coach: "",
          drawing2Caption: "",
          drawing2Coach: "",
          recommendedPreset1: "preset-game-6v6",
          recommendedPreset2: "",
        },
        remarksAndIndividualization: "Travailler individuellement sur les appuis pied droit / pied gauche pour éviter que le défenseur soit pris à contre-pied.",
        bilan: "Vérifier que les défenseurs ne se jettent pas et qu'ils communiquent pour organiser le cadrage.",
      },
    ],
    transition: [
      {
        title: `Séance FootEco ${category} - Règle des 3 secondes & Transitions rapides`,
        themeTE: {
          description: "Changement immédiat d'attitude motrice à la perte/gain du ballon, première passe vers l'avant ou protection sous pressing.",
          coachingAccents: "Réaction réflexe, pas de temps d'hésitation, passe claquée dans la course ou harcèlement immédiat.",
        },
        themeTA: {
          description: "Transition OFF-DEF : Contre-pressing agressif pendant 3 secondes. Transition DEF-OFF : Exploiter la désorganisation adverse.",
          defOrOff: "DEF & OFF",
          antagonism: "Étouffer la relance adverse dans l'oeuf vs Sortie rapide et projection collective",
          coachingAccents: "Les 3 joueurs les plus proches du ballon chassent ensemble à la perte.",
        },
        themePE: {
          description: "Explosivité mentale, communication criée, volonté de ne jamais lâcher.",
          coachingAccents: "Féliciter la réaction immédiate plutôt que la plainte sur une erreur technique.",
        },
        initialPart: {
          title: "Partie initiale - Focus TE/KO",
          focus: "Focus TE/KO",
          duration: "2X 15 min (Total 30 min)",
          description: `Dessin 1 (${coach1}) : Rondo 4v1 de transition : dès que le défenseur touche le ballon, il devient attaquant et le joueur fautif sprinte pour changer de statut.\n\nDessin 2 (${coach2}) : Circuit vivacité avec saut de haies légères, récupération d'un ballon lancé par le coach et passe instantanée dans un mini-but à 20m.`,
          drawing1Caption: "Rondo de transition avec sprint immédiat",
          drawing1Coach: coach1,
          drawing2Caption: "Vivacité motrice & projection rapide",
          drawing2Coach: coach2,
          recommendedPreset1: "preset-init-1",
          recommendedPreset2: "preset-init-2",
        },
        playedForms: {
          title: "Formes jouées - Focus TA",
          focus: "Focus TA",
          duration: "2X 15 min (Total 30 min)",
          description: `Dessin 1 (${coach1}) : Rondo 4v2 dans un carré de 12x12m connecté à un second carré. Dès récupération, les 2 défenseurs jouent dans l'autre carré et 2 nouveaux joueurs chassent.\n\nDessin 2 (${coach2}) : Situation 3 contre 2 de transition : au signal, les 3 attaquants partent, mais à la perte, un 3e défenseur arrive en soutien à pleine vitesse.`,
          drawing1Caption: "Double carré de transition 4v2",
          drawing1Coach: coach1,
          drawing2Caption: "3c2 avec retour défensif chronométré",
          drawing2Coach: coach2,
          recommendedPreset1: "preset-form-1",
          recommendedPreset2: "preset-form-2",
        },
        finalGame: {
          title: "Jeu final - Focus TE/TA",
          focus: "Focus TE/TA",
          duration: "30 min",
          description: `Match 6v6 : But marqué après transition offensive en moins de 6 secondes compte double. Si l'équipe qui a perdu la balle la récupère dans les 3 secondes, elle obtient un penalty pédagogique.\nActivité remplaçants : Devoirs techniques individualisés en jonglage dynamique.`,
          drawing1Caption: "Match 6v6 Règle ASF des 3 secondes",
          drawing1Coach: "",
          drawing2Caption: "",
          drawing2Coach: "",
          recommendedPreset1: "preset-game-6v6",
          recommendedPreset2: "",
        },
        remarksAndIndividualization: "Donner un compte à rebours vocal à voix haute (3... 2... 1...) pour stimuler la perception temporelle.",
        bilan: "Mesurer la vivacité de réaction de l'équipe lors des phases de transition.",
      },
    ],
    tactique: [
      {
        title: `Séance FootEco ${category} - Sortie de balle sous pression & Jeu combiné`,
        themeTE: {
          description: "Jeu en une ou deux touches, passes diagonales appuyées, première prise de balle orientée vers l'extérieur.",
          coachingAccents: "Ouverture des angles de passe, buste orienté vers le jeu, communication claire ('Seul !', 'Ça vient !').",
        },
        themeTA: {
          description: "Relance propre depuis le gardien, étirement de la largeur, décrochage d'un milieu pour créer la supériorité.",
          defOrOff: "OFF",
          antagonism: "Sortir proprement sous fort pressing vs Bloquer les sorties et intercepter",
          coachingAccents: "Utiliser le gardien comme joueur de champ supplémentaire pour créer le 3v2 ou 4v3.",
        },
        themePE: {
          description: "Sang-froid dans les zones à risque, confiance mutuelle et discipline tactique.",
          coachingAccents: "Encourager la prise de risque calculée, pas de dégagement à l'aveugle.",
        },
        initialPart: {
          title: "Partie initiale - Focus TE/KO",
          focus: "Focus TE/KO",
          duration: "2X 15 min (Total 30 min)",
          description: `Dessin 1 (${coach1}) : Circuit de relance à 4 joueurs : Gardien -> Défenseur latéral -> Milieu décroché -> Appui axiale et renversement.\n\nDessin 2 (${coach2}) : Atelier vivacité et prise d'information : le joueur reçoit dos au jeu, reçoit un signal de couleur et doit orienter son contrôle vers la bonne porte.`,
          drawing1Caption: "Circuit de relance courte & décalage",
          drawing1Coach: coach1,
          drawing2Caption: "Prise d'information dos au jeu",
          drawing2Coach: coach2,
          recommendedPreset1: "preset-init-1",
          recommendedPreset2: "preset-init-2",
        },
        playedForms: {
          title: "Formes jouées - Focus TA",
          focus: "Focus TA",
          duration: "2X 15 min (Total 30 min)",
          description: `Dessin 1 (${coach1}) : 4 contre 3 avec gardien dans la zone défensive. Objectif : franchir la ligne médiane balle au pied ou par une passe dans une mini-porte.\n\nDessin 2 (${coach2}) : Rondo 5 contre 3 de conservation haute intensité avec 2 zones de progression.`,
          drawing1Caption: "Sortie de balle 4c3 + Gardien",
          drawing1Coach: coach1,
          drawing2Caption: "Conservation 5c3 & changement de zone",
          drawing2Coach: coach2,
          recommendedPreset1: "preset-form-1",
          recommendedPreset2: "preset-form-2",
        },
        finalGame: {
          title: "Jeu final - Focus TE/TA",
          focus: "Focus TE/TA",
          duration: "30 min",
          description: `Match 6v6 FootEco : But inscrit après une relance partie du gardien et au moins 4 passes réussies vaut 3 points.\nActivité remplaçants : Devoirs techniques par postes (défenseurs : passes longues brossées, ailiers : centres).`,
          drawing1Caption: "Match 6v6 avec valorisation de la relance",
          drawing1Coach: "",
          drawing2Caption: "",
          drawing2Coach: "",
          recommendedPreset1: "preset-game-6v6",
          recommendedPreset2: "",
        },
        remarksAndIndividualization: "Ajouter un joker neutre si la relance est trop compliquée face au pressing adverse.",
        bilan: "Observer le calme des défenseurs et du gardien lors des sorties de balle sous pression.",
      },
    ],
    technique: [
      {
        title: `Séance FootEco ${category} - Prise de balle orientée & Motricité FootEco`,
        themeTE: {
          description: "Qualité de la première touche (intérieur, extérieur, semelle) pour s'orienter vers l'espace libre en une demi-seconde.",
          coachingAccents: "Buste souple, scan visuel avant le contact avec le ballon, pied relâché au moment de l'amorti.",
        },
        themeTA: {
          description: "Supprimer les temps morts techniques pour accélérer la circulation collective.",
          defOrOff: "DEF & OFF",
          antagonism: "Vitesse d'enchaînement vs Pression directe sur la réception",
          coachingAccents: "Orienter le contrôle vers le sens opposé à la pression adverse.",
        },
        themePE: {
          description: "Répétition intensive, plaisir du beau geste et concentration.",
          coachingAccents: "Valoriser l'élégance technique et la vitesse d'exécution.",
        },
        initialPart: {
          title: "Partie initiale - Focus TE/KO",
          focus: "Focus TE/KO",
          duration: "2X 15 min (Total 30 min)",
          description: `Dessin 1 (${coach1}) : Étoile technique à 4 postes : passes croisées et contrôles orientés obligatoires dans le dos d'un cône.\n\nDessin 2 (${coach2}) : Échelle de rythme et coordination motrice TE/KO suivie d'un duel aérien et d'un contrôle de la poitrine.`,
          drawing1Caption: "Étoile technique & contrôles orientés",
          drawing1Coach: coach1,
          drawing2Caption: "Échelle de rythme & contrôle aérien",
          drawing2Coach: coach2,
          recommendedPreset1: "preset-init-1",
          recommendedPreset2: "preset-init-2",
        },
        playedForms: {
          title: "Formes jouées - Focus TA",
          focus: "Focus TA",
          duration: "2X 15 min (Total 30 min)",
          description: `Dessin 1 (${coach1}) : 2c2 en terrain réduit (20x15m) avec 4 mini-buts. Chaque joueur a 2 touches maximum pour stimuler la première touche active.\n\nDessin 2 (${coach2}) : Rondo 4 contre 2 avec bonus si le porteur élimine un défenseur sur sa première touche.`,
          drawing1Caption: "2c2 en 2 touches max & 4 mini-buts",
          drawing1Coach: coach1,
          drawing2Caption: "Rondo 4c2 première touche active",
          drawing2Coach: coach2,
          recommendedPreset1: "preset-form-1",
          recommendedPreset2: "preset-form-2",
        },
        finalGame: {
          title: "Jeu final - Focus TE/TA",
          focus: "Focus TE/TA",
          duration: "30 min",
          description: `Match 6v6 FootEco : Tout joueur touchant le ballon plus de 3 fois d'affilée concède un coup franc indirect (règle des 3 touches max).\nActivité remplaçants : Défi jonglage pied faible et défis techniques individualisés.`,
          drawing1Caption: "Match 6v6 FootEco en 3 touches de balle max",
          drawing1Coach: "",
          drawing2Caption: "",
          drawing2Coach: "",
          recommendedPreset1: "preset-game-6v6",
          recommendedPreset2: "",
        },
        remarksAndIndividualization: "Individualiser les devoirs techniques pour le pied faible chez les joueurs moins à l'aise.",
        bilan: "Vérifier si le nombre de touches de balle par possession diminue au profit de la fluidité.",
      },
      {
        title: `Séance FootEco ${category} - Coordination, Pied Faible & Gestuelle FE12`,
        themeTE: {
          description: "Utilisation équilibrée des deux pieds (pied faible obligatoire sur la passe ou la finition) et dissociation du haut et du bas du corps.",
          coachingAccents: "Posture dynamique sur la plante des pieds, appuis courts et rapides, regard dégagé du ballon.",
        },
        themeTA: {
          description: "Se réaxer ou s'ouvrir le jeu sans être limité par son pied fort.",
          defOrOff: "DEF & OFF",
          antagonism: "Prise de décision instantanée sur les deux côtés vs Cadrage asymétrique du défenseur",
          coachingAccents: "Orienter sa première touche vers le pied libre d'accès pour jouer sans temps d'arrêt.",
        },
        themePE: {
          description: "Détermination, dépassement de l'appréhension du pied faible et plaisir du jeu bilatéral.",
          coachingAccents: "Valoriser chaque tentative réussie avec le mauvais pied pour décomplexer les joueurs.",
        },
        initialPart: {
          title: "Partie initiale - Focus TE/KO",
          focus: "Focus TE/KO",
          duration: "2X 15 min (Total 30 min)",
          description: `Dessin 1 (${coach1}) : Slalom technique en huit avec conduite alternée pied droit / pied gauche et passe claquée pied faible dans une mini-porte.\n\nDessin 2 (${coach2}) : Travail de coordination motrice : échelle de vivacité, saut de cerceaux et reprise de volée amortie pied faible vers le coach.`,
          drawing1Caption: "Slalom en 8 & passe pied faible",
          drawing1Coach: coach1,
          drawing2Caption: "Coordination échelle & volée amortie",
          drawing2Coach: coach2,
          recommendedPreset1: "preset-init-1",
          recommendedPreset2: "preset-init-2",
        },
        playedForms: {
          title: "Formes jouées - Focus TA",
          focus: "Focus TA",
          duration: "2X 15 min (Total 30 min)",
          description: `Dessin 1 (${coach1}) : 3c3 sur terrain carré avec 4 mini-buts : tout but marqué du pied faible vaut double.\n\nDessin 2 (${coach2}) : Rondo 4c2 où les passes ne peuvent être effectuées qu'avec le pied opposé à celui qui a reçu le ballon.`,
          drawing1Caption: "3c3 avec 4 mini-buts & bonus pied faible",
          drawing1Coach: coach1,
          drawing2Caption: "Rondo 4c2 alternance des deux pieds",
          drawing2Coach: coach2,
          recommendedPreset1: "preset-form-1",
          recommendedPreset2: "preset-form-2",
        },
        finalGame: {
          title: "Jeu final - Focus TE/TA",
          focus: "Focus TE/TA",
          duration: "30 min",
          description: `Match 6v6 FootEco : But inscrit du pied faible validé à 3 points. Tout joueur réussissant un une-deux pied faible débloque une supériorité temporaire.\nActivité remplaçants : Défi jonglage pied faible exclusif.`,
          drawing1Caption: "Match 6v6 FootEco valorisation du pied faible",
          drawing1Coach: "",
          drawing2Caption: "",
          drawing2Coach: "",
          recommendedPreset1: "preset-game-6v6",
          recommendedPreset2: "",
        },
        remarksAndIndividualization: "Permettre aux joueurs très gauchers/droitiers de commencer avec une touche libre avant d'imposer le pied faible.",
        bilan: "Constater si la peur d'utiliser le mauvais pied diminue au fil de la séance.",
      },
    ],
    centres: [
      {
        title: `Séance FootEco ${category} - Débordements, Centres en retrait & Reprises`,
        themeTE: {
          description: "Qualité du centre (ras du sol en retrait, brossé tendu au 2e poteau) et geste de finition (reprise de volée, plat du pied 1ère intention).",
          coachingAccents: "Lever la tête avant de centrer, pied d'appui bien ancré, attaquer le ballon pour couper la trajectoire.",
        },
        themeTA: {
          description: "Animation des couloirs, décalage vers l'ailier et synchronisation des courses au 1er et 2e poteau.",
          defOrOff: "OFF",
          antagonism: "Qualité de livraison dans la zone de danger vs Interception des centres par la charnière défensive",
          coachingAccents: "Échelonner les arrivées : 1 joueur coupe au premier poteau, 1 joueur au deuxième, 1 joueur en retrait.",
        },
        themePE: {
          description: "Générosité dans les courses de débordement et détermination devant le but.",
          coachingAccents: "Courir avec conviction, fêter collectivement les beaux buts sur centre.",
        },
        initialPart: {
          title: "Partie initiale - Focus TE/KO",
          focus: "Focus TE/KO",
          duration: "2X 15 min (Total 30 min)",
          description: `Dessin 1 (${coach1}) : Circuit couloir : une-deux sur l'aile, accélération vers la ligne de sortie et centre en retrait sur un partenaire lancé qui frappe en 1 touche.\n\nDessin 2 (${coach2}) : Duel aérien et timing : lancer de balle en cloche, course d'élan et tête plongeante ou reprise demi-volée vers la cage.`,
          drawing1Caption: "Une-deux sur l'aile & centre en retrait",
          drawing1Coach: coach1,
          drawing2Caption: "Timing aérien & reprise de volée",
          drawing2Coach: coach2,
          recommendedPreset1: "preset-init-1",
          recommendedPreset2: "preset-init-2",
        },
        playedForms: {
          title: "Formes jouées - Focus TA",
          focus: "Focus TA",
          duration: "2X 15 min (Total 30 min)",
          description: `Dessin 1 (${coach1}) : Vagues offensives 3 contre 2 + gardien : obligation de passer par l'un des deux couloirs latéraux avant de marquer.\n\nDessin 2 (${coach2}) : 4 contre 4 avec 2 couloirs extérieurs infranchissables pour les défenseurs (centres protégés mais finition sous pression 2v2 dans l'axe).`,
          drawing1Caption: "3v2 avec débordement obligatoire",
          drawing1Coach: coach1,
          drawing2Caption: "4v4 avec couloirs protégés & centres",
          drawing2Coach: coach2,
          recommendedPreset1: "preset-form-1",
          recommendedPreset2: "preset-form-2",
        },
        finalGame: {
          title: "Jeu final - Focus TE/TA",
          focus: "Focus TE/TA",
          duration: "30 min",
          description: `Match 6v6 : Tout but marqué sur un centre en 1 touche de balle (tête, volée, plat du pied) rapporte 3 points.\nActivité remplaçants : Ateliers de volées acrobatiques et précision de centres au jalon.`,
          drawing1Caption: "Match 6v6 avec bonus buts sur centres",
          drawing1Coach: "",
          drawing2Caption: "",
          drawing2Coach: "",
          recommendedPreset1: "preset-game-6v6",
          recommendedPreset2: "",
        },
        remarksAndIndividualization: "Ajuster la distance du centre (10m à 18m) selon la force de frappe des ailiers.",
        bilan: "Observer si le joueur qui centre regarde la position de ses attaquants avant d'armer.",
      },
    ],
  };

  const pool = sessionsBank[archetype] || sessionsBank.technique;
  const baseSession = pool[variantIndex % pool.length];

  // Deep clone and customize with real user context and instructions
  const result = JSON.parse(JSON.stringify(baseSession));
  result.title = themeTitle.trim() ? `Séance FootEco ${category} - ${themeTitle}` : result.title;
  result.team = category;

  // Adapt to custom instructions if provided
  if (specificInstructions && specificInstructions.trim()) {
    result.remarksAndIndividualization += `\nConsigne spécifique entraîneur : ${specificInstructions.trim()}`;
  }

  // Adjust for variation type
  const safeVariation = (typeof variation === 'string' ? variation : 'standard').toLowerCase();

  if (safeVariation === 'intensity' || safeVariation.includes('intens')) {
    result.initialPart.description = `[Haute Intensité / 0 Attente]\n${result.initialPart.description}`;
    result.playedForms.description = `[Haute Intensité / 0 Attente]\n${result.playedForms.description}`;
    result.themePE.coachingAccents += " - Rythme effréné, encourager les joueurs à maintenir l'intensité constante sans relâcher l'effort.";
  } else if (safeVariation === 'goalkeeper' || safeVariation.includes('gardien')) {
    result.finalGame.description = `[Intégration Gardiens de but FootEco]\nMatch 6v6 avec grands buts. Les gardiens participent activement aux relances au pied et aux sorties aériennes.\n${result.finalGame.description}`;
    result.remarksAndIndividualization += "\nTravail spécifique gardiens : relances rapides au pied et communication vocale pour guider la ligne défensive.";
  } else if (safeVariation === 'reduced_space' || safeVariation.includes('reduit')) {
    result.playedForms.description = `[Espaces Réduits / 2 touches obligatoires]\nTerrain compact de 18x14m favorisant la rapidité d'exécution et la vision périphérique.\n${result.playedForms.description}`;
  }

  return result;
}
