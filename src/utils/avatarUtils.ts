import { Player } from '../types';

export interface AvatarColorOption {
  id: string;
  name: string;
  bg: string;
  text: string;
  border: string;
}

export const AVATAR_COLORS: AvatarColorOption[] = [
  { id: 'emerald', name: 'Émeraude', bg: '#059669', text: '#ffffff', border: '#047857' },
  { id: 'blue', name: 'Bleu Roi', bg: '#2563EB', text: '#ffffff', border: '#1D4ED8' },
  { id: 'indigo', name: 'Indigo', bg: '#4F46E5', text: '#ffffff', border: '#4338CA' },
  { id: 'purple', name: 'Violet', bg: '#7C3AED', text: '#ffffff', border: '#6D28D9' },
  { id: 'pink', name: 'Rose', bg: '#DB2777', text: '#ffffff', border: '#BE185D' },
  { id: 'red', name: 'Rouge Vif', bg: '#DC2626', text: '#ffffff', border: '#B91C1C' },
  { id: 'orange', name: 'Orange', bg: '#EA580C', text: '#ffffff', border: '#C2410C' },
  { id: 'amber', name: 'Ambre / Or', bg: '#D97706', text: '#ffffff', border: '#B45309' },
  { id: 'lime', name: 'Lime', bg: '#65A30D', text: '#ffffff', border: '#4D7C0F' },
  { id: 'teal', name: 'Turquoise', bg: '#0D9488', text: '#ffffff', border: '#0F766E' },
  { id: 'cyan', name: 'Cyan', bg: '#0891B2', text: '#ffffff', border: '#0E7490' },
  { id: 'slate', name: 'Anthracite', bg: '#475569', text: '#ffffff', border: '#334155' },
];

export interface AvatarIconOption {
  id: string;
  name: string;
  label: string;
}

export const AVATAR_ICONS: AvatarIconOption[] = [
  { id: 'zap', name: 'Éclair', label: 'Vitesse & Dynamisme' },
  { id: 'star', name: 'Étoile', label: 'Talent & Étoile' },
  { id: 'shield', name: 'Bouclier', label: 'Défenseur solide' },
  { id: 'flame', name: 'Flamme', label: 'Énergie & Puissance' },
  { id: 'target', name: 'Cible', label: 'Précision & Finisseur' },
  { id: 'crown', name: 'Couronne', label: 'Capitaine & Leader' },
  { id: 'trophy', name: 'Trophée', label: 'Compétiteur' },
  { id: 'medal', name: 'Médaille', label: 'Fair-play' },
  { id: 'foot', name: 'Ballon', label: 'Meneur de jeu' },
  { id: 'compass', name: 'Boussole', label: 'Vision de jeu' },
  { id: 'heart', name: 'Cœur', label: 'Générosité & Courage' },
  { id: 'sparkles', name: 'Étincelle', label: 'Créativité & Dribble' },
];

// Pre-generated illustrated avatar presets for young players (FE12)
export interface AvatarPresetOption {
  id: string;
  name: string;
  svgDataUri: string;
}

// Generate high quality SVG cartoon player portraits
function generateSvgAvatar(hairColor: string, skinColor: string, jerseyColor: string, hairStyle: 'short' | 'spiky' | 'curls' | 'cap' | 'headband' | 'long', number: string = '10'): string {
  const svg = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100" width="100" height="100">
    <circle cx="50" cy="50" r="48" fill="${jerseyColor}" opacity="0.15"/>
    <circle cx="50" cy="50" r="46" fill="#f8fafc" stroke="${jerseyColor}" stroke-width="3"/>
    
    <!-- Shoulders & Jersey -->
    <path d="M 22 92 C 22 75, 78 75, 78 92 Z" fill="${jerseyColor}"/>
    <path d="M 40 76 L 50 86 L 60 76 Z" fill="#ffffff" opacity="0.4"/>
    <text x="50" y="93" font-size="12" font-weight="900" font-family="system-ui, sans-serif" fill="#ffffff" text-anchor="middle">${number}</text>

    <!-- Neck -->
    <rect x="44" y="65" width="12" height="14" rx="3" fill="${skinColor}"/>

    <!-- Head -->
    <ellipse cx="50" cy="50" rx="19" ry="22" fill="${skinColor}"/>

    <!-- Ears -->
    <circle cx="31" cy="52" r="5" fill="${skinColor}"/>
    <circle cx="69" cy="52" r="5" fill="${skinColor}"/>

    <!-- Eyes & Brows -->
    <ellipse cx="43" cy="48" rx="2.5" ry="3" fill="#1e293b"/>
    <ellipse cx="57" cy="48" rx="2.5" ry="3" fill="#1e293b"/>
    <circle cx="44" cy="47" r="1" fill="#ffffff"/>
    <circle cx="58" cy="47" r="1" fill="#ffffff"/>
    <path d="M 39 43 Q 44 41 47 43" stroke="#334155" stroke-width="1.8" fill="none" stroke-linecap="round"/>
    <path d="M 53 43 Q 56 41 61 43" stroke="#334155" stroke-width="1.8" fill="none" stroke-linecap="round"/>

    <!-- Nose & Smile -->
    <path d="M 50 49 L 49 54 L 51 54" stroke="#64748b" stroke-width="1.5" fill="none" stroke-linecap="round"/>
    <path d="M 44 59 Q 50 64 56 59" stroke="#1e293b" stroke-width="2" fill="none" stroke-linecap="round"/>
    
    <!-- Blush -->
    <circle cx="38" cy="55" r="3" fill="#f43f5e" opacity="0.25"/>
    <circle cx="62" cy="55" r="3" fill="#f43f5e" opacity="0.25"/>

    <!-- Hair styles -->
    ${
      hairStyle === 'cap'
        ? `<path d="M 28 42 C 28 26, 72 26, 72 42 Z" fill="${jerseyColor}"/>
           <path d="M 24 42 C 24 40, 76 40, 78 42 L 85 45 C 80 48, 60 48, 50 48 C 35 48, 22 47, 24 42 Z" fill="${jerseyColor}"/>
           <circle cx="50" cy="30" r="3" fill="#ffffff"/>`
        : hairStyle === 'headband'
        ? `<path d="M 29 44 C 28 26, 72 26, 71 44 Z" fill="${hairColor}"/>
           <rect x="29" y="38" width="42" height="6" rx="2" fill="#ef4444"/>`
        : hairStyle === 'spiky'
        ? `<path d="M 29 44 C 28 28, 40 22, 50 20 C 60 22, 72 28, 71 44 Q 65 30 50 30 Q 35 30 29 44 Z" fill="${hairColor}"/>
           <polygon points="36,28 42,16 48,27" fill="${hairColor}"/>
           <polygon points="46,26 52,14 58,26" fill="${hairColor}"/>
           <polygon points="56,27 62,17 66,29" fill="${hairColor}"/>`
        : hairStyle === 'curls'
        ? `<circle cx="35" cy="34" r="8" fill="${hairColor}"/>
           <circle cx="45" cy="28" r="9" fill="${hairColor}"/>
           <circle cx="55" cy="28" r="9" fill="${hairColor}"/>
           <circle cx="65" cy="34" r="8" fill="${hairColor}"/>
           <circle cx="31" cy="42" r="7" fill="${hairColor}"/>
           <circle cx="69" cy="42" r="7" fill="${hairColor}"/>
           <path d="M 32 42 C 32 30, 68 30, 68 42 Z" fill="${hairColor}"/>`
        : hairStyle === 'long'
        ? `<path d="M 28 45 C 28 24, 72 24, 72 45 C 75 58, 72 68, 68 70 C 64 60, 68 48, 68 42 C 68 30, 32 30, 32 42 C 32 48, 36 60, 32 70 C 28 68, 25 58, 28 45 Z" fill="${hairColor}"/>`
        : `<path d="M 29 44 C 28 26, 72 26, 71 44 Q 65 32 50 32 Q 35 32 29 44 Z" fill="${hairColor}"/>`
    }
  </svg>`;
  return 'data:image/svg+xml;utf8,' + encodeURIComponent(svg);
}

export const AVATAR_PRESETS: AvatarPresetOption[] = [
  { id: 'preset-1', name: 'Lucas (Brun, Jaune)', svgDataUri: generateSvgAvatar('#332211', '#fed7aa', '#eab308', 'spiky', '7') },
  { id: 'preset-2', name: 'Maxime (Châtain, Rouge)', svgDataUri: generateSvgAvatar('#573418', '#ffedd5', '#dc2626', 'short', '9') },
  { id: 'preset-3', name: 'Noah (Blond, Bleu)', svgDataUri: generateSvgAvatar('#ca8a04', '#ffedd5', '#2563eb', 'headband', '10') },
  { id: 'preset-4', name: 'Liam (Boucles, Vert)', svgDataUri: generateSvgAvatar('#1c1917', '#d6a374', '#16a34a', 'curls', '8') },
  { id: 'preset-5', name: 'Emma (Queue de cheval, Violet)', svgDataUri: generateSvgAvatar('#92400e', '#fed7aa', '#9333ea', 'long', '11') },
  { id: 'preset-6', name: 'Ilian (Casquette, Cyan)', svgDataUri: generateSvgAvatar('#1e293b', '#ffedd5', '#0891b2', 'cap', '1') },
  { id: 'preset-7', name: 'Romain (Court, Orange)', svgDataUri: generateSvgAvatar('#451a03', '#fde68a', '#ea580c', 'short', '4') },
  { id: 'preset-8', name: 'Inna (Bandeau, Rose)', svgDataUri: generateSvgAvatar('#18181b', '#fed7aa', '#db2777', 'headband', '5') },
  { id: 'preset-9', name: 'Jonathan (Brun, Émeraude)', svgDataUri: generateSvgAvatar('#292524', '#ffedd5', '#059669', 'spiky', '6') },
  { id: 'preset-10', name: 'François (Châtain, Or)', svgDataUri: generateSvgAvatar('#78350f', '#ffedd5', '#d97706', 'short', '11') },
  { id: 'preset-11', name: 'Basile (Boucles, Rouge)', svgDataUri: generateSvgAvatar('#172554', '#d6a374', '#ef4444', 'curls', '10') },
  { id: 'preset-12', name: 'Jost (Gardien Jaune)', svgDataUri: generateSvgAvatar('#365314', '#fed7aa', '#facc15', 'cap', '1') },
];

/**
 * Deterministic color/icon assignment based on string hash
 */
export function getDeterministicAvatar(player: Partial<Player>): {
  color: AvatarColorOption;
  icon: AvatarIconOption;
  preset: AvatarPresetOption;
} {
  const seed = (player.id || player.name || 'player').split('').reduce((acc, char) => acc + char.charCodeAt(0), 0);
  const color = AVATAR_COLORS[seed % AVATAR_COLORS.length];
  const icon = AVATAR_ICONS[seed % AVATAR_ICONS.length];
  const preset = AVATAR_PRESETS[seed % AVATAR_PRESETS.length];
  return { color, icon, preset };
}

/**
 * Generate randomized custom avatar properties for a player
 */
export function generateRandomAvatar(existingIndex: number = 0): {
  avatarType: 'icon' | 'preset' | 'initials';
  avatarColor: string;
  avatarIcon: string;
  avatarUrl?: string;
} {
  const colorIndex = (existingIndex + Math.floor(Math.random() * 3)) % AVATAR_COLORS.length;
  const iconIndex = (existingIndex + Math.floor(Math.random() * 5)) % AVATAR_ICONS.length;
  const presetIndex = (existingIndex + Math.floor(Math.random() * 4)) % AVATAR_PRESETS.length;

  const color = AVATAR_COLORS[colorIndex].bg;
  const icon = AVATAR_ICONS[iconIndex].id;
  const preset = AVATAR_PRESETS[presetIndex].svgDataUri;

  // 50% preset cartoon, 50% icon badge
  const usePreset = Math.random() > 0.4;

  if (usePreset) {
    return {
      avatarType: 'preset',
      avatarColor: color,
      avatarIcon: icon,
      avatarUrl: preset,
    };
  }

  return {
    avatarType: 'icon',
    avatarColor: color,
    avatarIcon: icon,
  };
}
