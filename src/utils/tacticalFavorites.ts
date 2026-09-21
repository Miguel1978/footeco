import { Position } from '../types';

export interface TacticalPositionSlot {
  slotIndex: number; // Index in the 7-player starters array (0 to 6)
  role: string;      // e.g. "Attaquant", "Couloir G", "Défenseur Centre"
  position: Position;// 'Gardien' | 'Défenseur' | 'Milieu' | 'Couloir' | 'Attaquant'
  gridCol?: string;  // CSS positioning class or column hint
}

export interface TacticalLine {
  id: string;
  name: string; // 'Attaque' | 'Milieu' | 'Défense' | 'Gardien'
  slots: TacticalPositionSlot[];
}

export interface TacticalFavorite {
  id: 'fav-1' | 'fav-2' | 'fav-3';
  slotNumber: 1 | 2 | 3;
  code: string; // '2-3-1' | '3-2-1' | '2-2-2' | '3-1-2' | string
  name: string;
  badge: string; // e.g. 'Classique FE12', 'Bloc compact', 'Deux pointes'
  description: string;
  coachingTips: string[];
  lines: TacticalLine[];
  updatedAt?: string;
}

export const BASE_TACTICAL_TEMPLATES: Record<string, Omit<TacticalFavorite, 'id' | 'slotNumber'>> = {
  '2-3-1': {
    code: '2-3-1',
    name: '2-3-1 FootEco Classique',
    badge: 'Standard ASF / FE12',
    description: 'Schéma de référence FootEco FE12 préconisé par l’Association Suisse de Football. Favorise le jeu en triangle, l’exploitation des couloirs et la prise d’initiative en 1v1.',
    coachingTips: [
      'Encourager les deux joueurs de couloir à monter et offrir des solutions en largeur.',
      'Le milieu axial est le métronome et doit orienter le jeu vers l’espace libre.',
      'Les deux défenseurs relancent au sol sans paniquer sous pression.'
    ],
    lines: [
      {
        id: 'attack',
        name: 'Attaque',
        slots: [
          { slotIndex: 6, role: 'Attaquant (Pivot/Pointe)', position: 'Attaquant' }
        ]
      },
      {
        id: 'midfield',
        name: 'Milieu & Couloirs',
        slots: [
          { slotIndex: 4, role: 'Couloir Gauche', position: 'Couloir' },
          { slotIndex: 3, role: 'Milieu Axe', position: 'Milieu' },
          { slotIndex: 5, role: 'Couloir Droit', position: 'Couloir' }
        ]
      },
      {
        id: 'defense',
        name: 'Défense',
        slots: [
          { slotIndex: 1, role: 'Défenseur Gauche', position: 'Défenseur' },
          { slotIndex: 2, role: 'Défenseur Droit', position: 'Défenseur' }
        ]
      },
      {
        id: 'goalkeeper',
        name: 'Gardien',
        slots: [
          { slotIndex: 0, role: 'Gardien', position: 'Gardien' }
        ]
      }
    ]
  },
  '3-2-1': {
    code: '3-2-1',
    name: '3-2-1 Bloc Compact',
    badge: 'Sécurité & Relance',
    description: 'Schéma renforçant l’assise défensive avec une ligne de 3 à l’arrière. Idéal contre des adversaires percutants dans l’axe ou pour sécuriser les transitions défensives.',
    coachingTips: [
      'Le défenseur central coordonne la ligne et gère la profondeur.',
      'Les deux milieux axiaux se partagent le terrain : un en couverture, un en soutien de l’attaquant.',
      'L’attaquant garde le ballon en point d’appui pour faire remonter le bloc.'
    ],
    lines: [
      {
        id: 'attack',
        name: 'Attaque',
        slots: [
          { slotIndex: 6, role: 'Attaquant de pointe', position: 'Attaquant' }
        ]
      },
      {
        id: 'midfield',
        name: 'Milieu de terrain',
        slots: [
          { slotIndex: 4, role: 'Milieu Gauche / Relanceur', position: 'Milieu' },
          { slotIndex: 5, role: 'Milieu Droit / Relanceur', position: 'Milieu' }
        ]
      },
      {
        id: 'defense',
        name: 'Défense à 3',
        slots: [
          { slotIndex: 1, role: 'Défenseur Gauche', position: 'Défenseur' },
          { slotIndex: 3, role: 'Défenseur Centre (Axe)', position: 'Défenseur' },
          { slotIndex: 2, role: 'Défenseur Droit', position: 'Défenseur' }
        ]
      },
      {
        id: 'goalkeeper',
        name: 'Gardien',
        slots: [
          { slotIndex: 0, role: 'Gardien', position: 'Gardien' }
        ]
      }
    ]
  },
  '2-2-2': {
    code: '2-2-2',
    name: '2-2-2 Pressing & Deux Pointes',
    badge: 'Offensif Équilibré',
    description: 'Schéma symétrique à deux attaquants. Idéal pour exercer un pressing haut sur la relance adverse et combiner rapidement à deux dans les 20 derniers mètres.',
    coachingTips: [
      'Les deux attaquants chassent ensemble dès la perte pour récupérer haut (règle des 3 secondes).',
      'Les deux milieux couvrent le cœur du jeu et alimentent les courses croisées.',
      'Les deux défenseurs restent attentifs aux longs ballons dans leur dos.'
    ],
    lines: [
      {
        id: 'attack',
        name: 'Doublette Attaquante',
        slots: [
          { slotIndex: 3, role: 'Attaquant Gauche', position: 'Attaquant' },
          { slotIndex: 6, role: 'Attaquant Droit', position: 'Attaquant' }
        ]
      },
      {
        id: 'midfield',
        name: 'Milieu à 2',
        slots: [
          { slotIndex: 4, role: 'Milieu Gauche', position: 'Milieu' },
          { slotIndex: 5, role: 'Milieu Droit', position: 'Milieu' }
        ]
      },
      {
        id: 'defense',
        name: 'Défense à 2',
        slots: [
          { slotIndex: 1, role: 'Défenseur Gauche', position: 'Défenseur' },
          { slotIndex: 2, role: 'Défenseur Droit', position: 'Défenseur' }
        ]
      },
      {
        id: 'goalkeeper',
        name: 'Gardien',
        slots: [
          { slotIndex: 0, role: 'Gardien', position: 'Gardien' }
        ]
      }
    ]
  },
  '3-1-2': {
    code: '3-1-2',
    name: '3-1-2 Flèche Offensive',
    badge: 'Contre & Stabilité',
    description: 'Structure arrière très solide à 3 défenseurs avec une sentinelle pivot et deux attaquants rapides prêts à piquer en contre-attaque.',
    coachingTips: [
      'Le milieu défensif sentinelle équilibre et coupe les trajectoires axiales.',
      'Les 2 attaquants s’écartent pour étirer la défense adverse.',
      'Les latéraux participent à la relance basse.'
    ],
    lines: [
      {
        id: 'attack',
        name: 'Attaque à deux',
        slots: [
          { slotIndex: 5, role: 'Attaquant G', position: 'Attaquant' },
          { slotIndex: 6, role: 'Attaquant D', position: 'Attaquant' }
        ]
      },
      {
        id: 'midfield',
        name: 'Sentinelle',
        slots: [
          { slotIndex: 4, role: 'Milieu Sentinelle (Axe)', position: 'Milieu' }
        ]
      },
      {
        id: 'defense',
        name: 'Défense à 3',
        slots: [
          { slotIndex: 1, role: 'Défenseur G', position: 'Défenseur' },
          { slotIndex: 3, role: 'Défenseur Centre', position: 'Défenseur' },
          { slotIndex: 2, role: 'Défenseur D', position: 'Défenseur' }
        ]
      },
      {
        id: 'goalkeeper',
        name: 'Gardien',
        slots: [
          { slotIndex: 0, role: 'Gardien', position: 'Gardien' }
        ]
      }
    ]
  },
  '2-1-2-1': {
    code: '2-1-2-1',
    name: '2-1-2-1 Sapin de Noël',
    badge: 'Maîtrise Technique',
    description: 'Système en étages favorisant les passes courtes, le dédoublement et une excellente occupation spatiale entre les lignes adverses.',
    coachingTips: [
      'Trouver le joueur libre entre les lignes avec des passes tranchantes.',
      'Les milieux offensifs viennent chercher le ballon dans les demi-espaces.',
      'La sentinelle sécurise les pertes de balle.'
    ],
    lines: [
      {
        id: 'attack',
        name: 'Attaquant',
        slots: [
          { slotIndex: 6, role: 'Attaquant de pointe', position: 'Attaquant' }
        ]
      },
      {
        id: 'offensive-mid',
        name: 'Milieux Offensifs',
        slots: [
          { slotIndex: 4, role: 'Milieu Offensif G', position: 'Milieu' },
          { slotIndex: 5, role: 'Milieu Offensif D', position: 'Milieu' }
        ]
      },
      {
        id: 'defensive-mid',
        name: 'Milieu Défensif',
        slots: [
          { slotIndex: 3, role: 'Milieu Défensif (Relance)', position: 'Milieu' }
        ]
      },
      {
        id: 'defense',
        name: 'Défense à 2',
        slots: [
          { slotIndex: 1, role: 'Défenseur G', position: 'Défenseur' },
          { slotIndex: 2, role: 'Défenseur D', position: 'Défenseur' }
        ]
      },
      {
        id: 'goalkeeper',
        name: 'Gardien',
        slots: [
          { slotIndex: 0, role: 'Gardien', position: 'Gardien' }
        ]
      }
    ]
  }
};

export const DEFAULT_TACTICAL_FAVORITES: TacticalFavorite[] = [
  {
    id: 'fav-1',
    slotNumber: 1,
    ...BASE_TACTICAL_TEMPLATES['2-3-1'],
    updatedAt: new Date().toISOString()
  },
  {
    id: 'fav-2',
    slotNumber: 2,
    ...BASE_TACTICAL_TEMPLATES['3-2-1'],
    updatedAt: new Date().toISOString()
  },
  {
    id: 'fav-3',
    slotNumber: 3,
    ...BASE_TACTICAL_TEMPLATES['2-2-2'],
    updatedAt: new Date().toISOString()
  }
];

const TACTICAL_FAVORITES_STORAGE_KEY = 'fe12_tactical_favorites_v1';
const ACTIVE_FAVORITE_STORAGE_KEY = 'fe12_active_tactical_fav_id_v1';

export function loadTacticalFavorites(): TacticalFavorite[] {
  try {
    const raw = localStorage.getItem(TACTICAL_FAVORITES_STORAGE_KEY);
    if (!raw) return DEFAULT_TACTICAL_FAVORITES;
    const parsed = JSON.parse(raw);
    if (Array.isArray(parsed) && parsed.length === 3) {
      // Validate structure of each favorite
      const isValid = parsed.every(f => f && f.id && f.lines && Array.isArray(f.lines));
      if (isValid) {
        return parsed as TacticalFavorite[];
      }
    }
  } catch (err) {
    console.warn('Erreur chargement favoris tactiques, retour aux valeurs par défaut:', err);
  }
  return DEFAULT_TACTICAL_FAVORITES;
}

export function saveTacticalFavorites(favorites: TacticalFavorite[]): void {
  try {
    localStorage.setItem(TACTICAL_FAVORITES_STORAGE_KEY, JSON.stringify(favorites));
  } catch (err) {
    console.error('Erreur sauvegarde favoris tactiques:', err);
  }
}

export function saveSingleFavorite(
  slotNumber: 1 | 2 | 3,
  updatedData: Partial<TacticalFavorite>
): TacticalFavorite[] {
  const current = loadTacticalFavorites();
  const index = current.findIndex(f => f.slotNumber === slotNumber);
  if (index >= 0) {
    current[index] = {
      ...current[index],
      ...updatedData,
      updatedAt: new Date().toISOString()
    };
  }
  saveTacticalFavorites(current);
  return current;
}

export function resetTacticalFavorites(): TacticalFavorite[] {
  saveTacticalFavorites(DEFAULT_TACTICAL_FAVORITES);
  return DEFAULT_TACTICAL_FAVORITES;
}

export function loadActiveFavoriteId(): 'fav-1' | 'fav-2' | 'fav-3' {
  try {
    const raw = localStorage.getItem(ACTIVE_FAVORITE_STORAGE_KEY);
    if (raw === 'fav-1' || raw === 'fav-2' || raw === 'fav-3') {
      return raw;
    }
  } catch {
    // fallback
  }
  return 'fav-1';
}

export function saveActiveFavoriteId(id: 'fav-1' | 'fav-2' | 'fav-3'): void {
  try {
    localStorage.setItem(ACTIVE_FAVORITE_STORAGE_KEY, id);
  } catch (err) {
    console.warn('Erreur sauvegarde favori actif:', err);
  }
}
