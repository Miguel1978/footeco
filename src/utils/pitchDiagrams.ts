// Vector Drill Illustrations & Tactical Pitch Generator for FootEco Training Sessions

export interface DrillPreset {
  id: string;
  title: string;
  category: 'init' | 'forms' | 'game' | 'general';
  description: string;
  svgContent: string;
  defaultCoach?: string;
  caption?: string;
  keywords?: string[];
}

// Reusable SVG snippets
const PITCH_BASE = `
  <defs>
    <linearGradient id="grassGrad" x1="0" y1="0" x2="0" y2="1">
      <stop offset="0%" stop-color="#2d8a39" />
      <stop offset="50%" stop-color="#349a42" />
      <stop offset="100%" stop-color="#23742d" />
    </linearGradient>
    <linearGradient id="skyGrad" x1="0" y1="0" x2="0" y2="1">
      <stop offset="0%" stop-color="#4a90e2" />
      <stop offset="100%" stop-color="#7fb5f5" />
    </linearGradient>
    <pattern id="stripes" width="40" height="20" patternUnits="userSpaceOnUse">
      <rect width="40" height="10" fill="rgba(255,255,255,0.05)" />
      <rect y="10" width="40" height="10" fill="rgba(0,0,0,0.03)" />
    </pattern>
    <marker id="arrowSolid" viewBox="0 0 10 10" refX="6" refY="5" markerWidth="6" markerHeight="6" orient="auto-start-reverse">
      <path d="M 0 1 L 8 5 L 0 9 z" fill="#facc15" />
    </marker>
    <marker id="arrowPass" viewBox="0 0 10 10" refX="6" refY="5" markerWidth="6" markerHeight="6" orient="auto-start-reverse">
      <path d="M 0 1 L 8 5 L 0 9 z" fill="#ffffff" />
    </marker>
    <marker id="arrowWhite" viewBox="0 0 10 10" refX="6" refY="5" markerWidth="6" markerHeight="6" orient="auto-start-reverse">
      <path d="M 0 1 L 8 5 L 0 9 z" fill="#ffffff" />
    </marker>
    <marker id="arrowYellow" viewBox="0 0 10 10" refX="6" refY="5" markerWidth="6" markerHeight="6" orient="auto-start-reverse">
      <path d="M 0 1 L 8 5 L 0 9 z" fill="#fbbf24" />
    </marker>
  </defs>
`;

// 1. Initial Part - Drawing 1: Duel 1 contre 1 (contournement assiettes + passe entre piquets)
const SVG_INIT_1 = `<svg viewBox="0 0 400 240" xmlns="http://www.w3.org/2000/svg" class="w-full h-full rounded">
  ${PITCH_BASE}
  <!-- Sky background -->
  <rect width="400" height="70" fill="url(#skyGrad)" />
  <!-- Pitch in perspective -->
  <polygon points="40,65 360,65 395,235 5,235" fill="url(#grassGrad)" stroke="#ffffff" stroke-width="2" />
  <rect x="5" y="65" width="390" height="170" fill="url(#stripes)" clip-path="url(#pitchClip)" opacity="0.6"/>

  <!-- Field lines in perspective -->
  <polygon points="120,65 280,65 310,130 90,130" fill="none" stroke="rgba(255,255,255,0.7)" stroke-width="1.5" />
  <line x1="200" y1="65" x2="200" y2="130" stroke="rgba(255,255,255,0.7)" stroke-width="1.5" />
  <ellipse cx="200" cy="130" rx="45" ry="16" fill="none" stroke="rgba(255,255,255,0.7)" stroke-width="1.5" />

  <!-- Goal top -->
  <rect x="170" y="55" width="60" height="10" fill="none" stroke="#ffffff" stroke-width="2" />
  <rect x="172" y="56" width="56" height="8" fill="rgba(255,255,255,0.2)" />

  <!-- Cones / Assiettes (yellow, red, orange) -->
  <circle cx="150" cy="180" r="4" fill="#fbbf24" stroke="#d97706" stroke-width="1" />
  <circle cx="250" cy="180" r="4" fill="#fbbf24" stroke="#d97706" stroke-width="1" />
  <circle cx="170" cy="205" r="4" fill="#ef4444" stroke="#b91c1c" stroke-width="1" />
  <circle cx="230" cy="205" r="4" fill="#ef4444" stroke="#b91c1c" stroke-width="1" />

  <!-- Piquets (vertical poles) -->
  <line x1="185" y1="165" x2="185" y2="180" stroke="#f59e0b" stroke-width="3" stroke-linecap="round" />
  <line x1="215" y1="165" x2="215" y2="180" stroke="#f59e0b" stroke-width="3" stroke-linecap="round" />

  <!-- Movement Lines (Yellow curves with arrows) -->
  <path d="M 120,210 Q 80,170 120,130 Q 170,110 200,165" fill="none" stroke="#fbbf24" stroke-width="2" stroke-dasharray="4,3" marker-end="url(#arrowYellow)" />
  <path d="M 280,210 Q 320,170 280,130 Q 230,110 200,165" fill="none" stroke="#fbbf24" stroke-width="2" stroke-dasharray="4,3" marker-end="url(#arrowYellow)" />

  <!-- Ball pass line -->
  <line x1="200" y1="215" x2="200" y2="175" stroke="#ffffff" stroke-width="2" stroke-dasharray="3,3" marker-end="url(#arrowPass)" />

  <!-- Players -->
  <!-- Coach -->
  <circle cx="200" cy="218" r="6" fill="#1e293b" stroke="#ffffff" stroke-width="1.5" />
  <circle cx="200" cy="210" r="3" fill="#f8fafc" />
  <text x="200" y="232" font-size="8" font-family="sans-serif" font-weight="bold" fill="#ffffff" text-anchor="middle">Coach</text>

  <!-- Attacker 1 (Blue) -->
  <circle cx="120" cy="215" r="5.5" fill="#2563eb" stroke="#ffffff" stroke-width="1.5" />
  <circle cx="120" cy="210" r="2.5" fill="#f8fafc" />
  <text x="108" y="218" font-size="8" font-family="sans-serif" font-weight="bold" fill="#ffffff">J1</text>

  <!-- Defender 2 (White/Red) -->
  <circle cx="280" cy="215" r="5.5" fill="#ef4444" stroke="#ffffff" stroke-width="1.5" />
  <circle cx="280" cy="210" r="2.5" fill="#f8fafc" />
  <text x="292" y="218" font-size="8" font-family="sans-serif" font-weight="bold" fill="#ffffff">J2</text>

  <!-- Soccer Ball -->
  <circle cx="200" cy="200" r="3.5" fill="#ffffff" stroke="#000000" stroke-width="1" />

  <!-- Small corner players waiting -->
  <circle cx="50" cy="85" r="4" fill="#2563eb" />
  <circle cx="60" cy="85" r="4" fill="#2563eb" />
  <circle cx="340" cy="85" r="4" fill="#ef4444" />
  <circle cx="350" cy="85" r="4" fill="#ef4444" />
</svg>`;

// 2. Initial Part - Drawing 2: Duel 1c1 contournement piquets & transition
const SVG_INIT_2 = `<svg viewBox="0 0 400 240" xmlns="http://www.w3.org/2000/svg" class="w-full h-full rounded">
  ${PITCH_BASE}
  <!-- Sky background -->
  <rect width="400" height="70" fill="url(#skyGrad)" />
  <!-- Pitch in perspective -->
  <polygon points="40,65 360,65 395,235 5,235" fill="url(#grassGrad)" stroke="#ffffff" stroke-width="2" />
  <rect x="5" y="65" width="390" height="170" fill="url(#stripes)" opacity="0.6"/>

  <!-- Field lines -->
  <polygon points="120,65 280,65 310,130 90,130" fill="none" stroke="rgba(255,255,255,0.7)" stroke-width="1.5" />
  <ellipse cx="200" cy="130" rx="45" ry="16" fill="none" stroke="rgba(255,255,255,0.7)" stroke-width="1.5" />

  <!-- Goals -->
  <rect x="170" y="55" width="60" height="10" fill="none" stroke="#ffffff" stroke-width="2" />

  <!-- Piquets slalom -->
  <line x1="170" y1="180" x2="170" y2="195" stroke="#f59e0b" stroke-width="3" stroke-linecap="round" />
  <line x1="230" y1="180" x2="230" y2="195" stroke="#f59e0b" stroke-width="3" stroke-linecap="round" />

  <!-- Zigzag dribble arrow -->
  <path d="M 90,100 L 140,140 L 110,170 L 180,185" fill="none" stroke="#ffffff" stroke-width="2" stroke-dasharray="3,3" marker-end="url(#arrowWhite)" />
  <path d="M 310,100 L 260,140 L 290,170 L 220,185" fill="none" stroke="#fbbf24" stroke-width="2.5" marker-end="url(#arrowYellow)" />

  <!-- Curved contournement -->
  <path d="M 180,195 Q 200,225 220,195" fill="none" stroke="#fbbf24" stroke-width="2" marker-end="url(#arrowYellow)" />

  <!-- Players -->
  <circle cx="90" cy="95" r="5" fill="#2563eb" stroke="#ffffff" stroke-width="1" />
  <circle cx="80" cy="95" r="5" fill="#2563eb" stroke="#ffffff" stroke-width="1" />
  <circle cx="310" cy="95" r="5" fill="#ef4444" stroke="#ffffff" stroke-width="1" />
  <circle cx="320" cy="95" r="5" fill="#ef4444" stroke="#ffffff" stroke-width="1" />

  <circle cx="190" cy="205" r="5.5" fill="#2563eb" stroke="#ffffff" stroke-width="1.5" />
  <circle cx="210" cy="205" r="5.5" fill="#ef4444" stroke="#ffffff" stroke-width="1.5" />

  <!-- Coach bottom -->
  <circle cx="200" cy="225" r="5" fill="#0f172a" stroke="#ffffff" stroke-width="1" />
</svg>`;

// 3. Formes jouées - Drawing 1: 1v1, 4 zones et 2 petits buts (SEB)
const SVG_FORM_1 = `<svg viewBox="0 0 400 240" xmlns="http://www.w3.org/2000/svg" class="w-full h-full rounded">
  ${PITCH_BASE}
  <rect width="400" height="70" fill="url(#skyGrad)" />
  <polygon points="40,65 360,65 395,235 5,235" fill="url(#grassGrad)" stroke="#ffffff" stroke-width="2" />
  <rect x="5" y="65" width="390" height="170" fill="url(#stripes)" opacity="0.6"/>

  <!-- 4 Zones dividers (dashed white lines) -->
  <line x1="200" y1="65" x2="200" y2="235" stroke="#ffffff" stroke-width="2" stroke-dasharray="6,4" />
  <line x1="25" y1="145" x2="375" y2="145" stroke="#ffffff" stroke-width="2" stroke-dasharray="6,4" />

  <!-- Mini Goals (2 petits buts) -->
  <!-- Top Left mini goal -->
  <rect x="100" y="60" width="30" height="6" fill="#fbbf24" stroke="#d97706" stroke-width="1.5" />
  <!-- Top Right mini goal -->
  <rect x="270" y="60" width="30" height="6" fill="#fbbf24" stroke="#d97706" stroke-width="1.5" />
  <!-- Bottom Left mini goal -->
  <rect x="90" y="228" width="35" height="6" fill="#fbbf24" stroke="#d97706" stroke-width="1.5" />
  <!-- Bottom Right mini goal -->
  <rect x="275" y="228" width="35" height="6" fill="#fbbf24" stroke="#d97706" stroke-width="1.5" />

  <!-- Zone 1 (Top Left) -->
  <circle cx="110" cy="100" r="5" fill="#2563eb" stroke="#ffffff" stroke-width="1.5" />
  <circle cx="140" cy="110" r="5" fill="#ef4444" stroke="#ffffff" stroke-width="1.5" />
  <circle cx="125" cy="105" r="3" fill="#ffffff" stroke="#000" stroke-width="0.8" />

  <!-- Zone 2 (Top Right) -->
  <circle cx="260" cy="100" r="5" fill="#2563eb" stroke="#ffffff" stroke-width="1.5" />
  <circle cx="290" cy="110" r="5" fill="#ef4444" stroke="#ffffff" stroke-width="1.5" />

  <!-- Zone 3 (Bottom Left) -->
  <circle cx="95" cy="180" r="6" fill="#2563eb" stroke="#ffffff" stroke-width="1.5" />
  <circle cx="135" cy="190" r="6" fill="#ef4444" stroke="#ffffff" stroke-width="1.5" />

  <!-- Zone 4 (Bottom Right) -->
  <circle cx="265" cy="180" r="6" fill="#2563eb" stroke="#ffffff" stroke-width="1.5" />
  <circle cx="305" cy="190" r="6" fill="#ef4444" stroke="#ffffff" stroke-width="1.5" />

  <!-- Cones marking corners -->
  <circle cx="45" cy="70" r="3" fill="#ef4444" />
  <circle cx="355" cy="70" r="3" fill="#ef4444" />
  <circle cx="15" cy="230" r="4" fill="#ef4444" />
  <circle cx="385" cy="230" r="4" fill="#ef4444" />

  <!-- Coach Tag Box -->
  <g transform="translate(15, 205)">
    <rect width="50" height="20" rx="4" fill="#0f172a" opacity="0.85" />
    <text x="25" y="14" font-size="11" font-family="sans-serif" font-weight="900" fill="#38bdf8" text-anchor="middle">SEB</text>
  </g>
</svg>`;

// 4. Formes jouées - Drawing 2: 1v1, 4 zones et 2 petits buts (Miguel)
const SVG_FORM_2 = `<svg viewBox="0 0 400 240" xmlns="http://www.w3.org/2000/svg" class="w-full h-full rounded">
  ${PITCH_BASE}
  <rect width="400" height="70" fill="url(#skyGrad)" />
  <polygon points="40,65 360,65 395,235 5,235" fill="url(#grassGrad)" stroke="#ffffff" stroke-width="2" />
  <rect x="5" y="65" width="390" height="170" fill="url(#stripes)" opacity="0.6"/>

  <!-- 4 Zones dividers -->
  <line x1="200" y1="65" x2="200" y2="235" stroke="#ffffff" stroke-width="2" stroke-dasharray="6,4" />
  <line x1="25" y1="145" x2="375" y2="145" stroke="#ffffff" stroke-width="2" stroke-dasharray="6,4" />

  <!-- Mini Goals -->
  <rect x="100" y="60" width="30" height="6" fill="#fbbf24" stroke="#d97706" stroke-width="1.5" />
  <rect x="270" y="60" width="30" height="6" fill="#fbbf24" stroke="#d97706" stroke-width="1.5" />
  <rect x="90" y="228" width="35" height="6" fill="#fbbf24" stroke="#d97706" stroke-width="1.5" />
  <rect x="275" y="228" width="35" height="6" fill="#fbbf24" stroke="#d97706" stroke-width="1.5" />

  <!-- Players with dynamic movement arrows -->
  <!-- Top Left -->
  <circle cx="120" cy="95" r="5" fill="#2563eb" stroke="#ffffff" stroke-width="1.5" />
  <circle cx="150" cy="115" r="5" fill="#ef4444" stroke="#ffffff" stroke-width="1.5" />
  <path d="M 120,95 L 140,80" stroke="#facc15" stroke-width="1.5" marker-end="url(#arrowYellow)" />

  <!-- Top Right -->
  <circle cx="280" cy="95" r="5" fill="#2563eb" stroke="#ffffff" stroke-width="1.5" />
  <circle cx="250" cy="115" r="5" fill="#ef4444" stroke="#ffffff" stroke-width="1.5" />

  <!-- Bottom Left -->
  <circle cx="110" cy="175" r="6" fill="#2563eb" stroke="#ffffff" stroke-width="1.5" />
  <circle cx="145" cy="195" r="6" fill="#ef4444" stroke="#ffffff" stroke-width="1.5" />
  <path d="M 110,175 Q 130,160 150,175" fill="none" stroke="#facc15" stroke-width="2" marker-end="url(#arrowYellow)" />

  <!-- Bottom Right -->
  <circle cx="290" cy="175" r="6" fill="#2563eb" stroke="#ffffff" stroke-width="1.5" />
  <circle cx="255" cy="195" r="6" fill="#ef4444" stroke="#ffffff" stroke-width="1.5" />

  <!-- Coach Tag Box -->
  <g transform="translate(15, 205)">
    <rect width="65" height="20" rx="4" fill="#0f172a" opacity="0.85" />
    <text x="32" y="14" font-size="11" font-family="sans-serif" font-weight="900" fill="#38bdf8" text-anchor="middle">Miguel</text>
  </g>
</svg>`;

// 5. Final Game - 6 contre 6 avec remplaçants
const SVG_GAME_6V6 = `<svg viewBox="0 0 400 240" xmlns="http://www.w3.org/2000/svg" class="w-full h-full rounded">
  ${PITCH_BASE}
  <rect width="400" height="70" fill="url(#skyGrad)" />
  <polygon points="40,65 360,65 395,235 5,235" fill="url(#grassGrad)" stroke="#ffffff" stroke-width="2" />
  <rect x="5" y="65" width="390" height="170" fill="url(#stripes)" opacity="0.6"/>

  <!-- Field lines -->
  <polygon points="120,65 280,65 310,130 90,130" fill="none" stroke="rgba(255,255,255,0.7)" stroke-width="1.5" />
  <polygon points="90,170 310,170 340,235 60,235" fill="none" stroke="rgba(255,255,255,0.7)" stroke-width="1.5" />
  <line x1="25" y1="150" x2="375" y2="150" stroke="rgba(255,255,255,0.8)" stroke-width="2" />
  <ellipse cx="200" cy="150" rx="45" ry="16" fill="none" stroke="rgba(255,255,255,0.8)" stroke-width="2" />

  <!-- Goals -->
  <rect x="170" y="55" width="60" height="10" fill="none" stroke="#ffffff" stroke-width="2" />
  <rect x="160" y="232" width="80" height="8" fill="none" stroke="#ffffff" stroke-width="2" />

  <!-- Team Blue (6 players: 1 GK + 2 DEF + 2 MID + 1 ATT) -->
  <circle cx="200" cy="72" r="5" fill="#facc15" stroke="#ffffff" stroke-width="1.5" /> <!-- GK Blue -->
  <circle cx="160" cy="95" r="5" fill="#2563eb" stroke="#ffffff" stroke-width="1.5" />
  <circle cx="240" cy="95" r="5" fill="#2563eb" stroke="#ffffff" stroke-width="1.5" />
  <circle cx="170" cy="130" r="5" fill="#2563eb" stroke="#ffffff" stroke-width="1.5" />
  <circle cx="230" cy="130" r="5" fill="#2563eb" stroke="#ffffff" stroke-width="1.5" />
  <circle cx="200" cy="160" r="5.5" fill="#2563eb" stroke="#ffffff" stroke-width="1.5" />

  <!-- Team Red (6 players: 1 GK + 2 DEF + 2 MID + 1 ATT) -->
  <circle cx="200" cy="225" r="6" fill="#10b981" stroke="#ffffff" stroke-width="1.5" /> <!-- GK Red -->
  <circle cx="150" cy="205" r="6" fill="#ef4444" stroke="#ffffff" stroke-width="1.5" />
  <circle cx="250" cy="205" r="6" fill="#ef4444" stroke="#ffffff" stroke-width="1.5" />
  <circle cx="170" cy="170" r="6" fill="#ef4444" stroke="#ffffff" stroke-width="1.5" />
  <circle cx="230" cy="170" r="6" fill="#ef4444" stroke="#ffffff" stroke-width="1.5" />
  <circle cx="200" cy="138" r="5.5" fill="#ef4444" stroke="#ffffff" stroke-width="1.5" />

  <!-- Soccer Ball -->
  <circle cx="200" cy="148" r="3.5" fill="#ffffff" stroke="#000" stroke-width="1" />

  <!-- Substitutes juggling in sideline group -->
  <g transform="translate(320, 160)">
    <rect x="-10" y="-12" width="75" height="35" rx="6" fill="#0f172a" opacity="0.8" />
    <circle cx="10" cy="0" r="4.5" fill="#2563eb" stroke="#fff" stroke-width="1" />
    <circle cx="25" cy="0" r="4.5" fill="#ef4444" stroke="#fff" stroke-width="1" />
    <circle cx="40" cy="0" r="4.5" fill="#2563eb" stroke="#fff" stroke-width="1" />
    <text x="27" y="16" font-size="7" font-family="sans-serif" font-weight="bold" fill="#f8fafc" text-anchor="middle">Jonglages</text>
  </g>
</svg>`;

// 6. Conservation / Rondo 4v4+3
const SVG_CONSERVATION = `<svg viewBox="0 0 400 240" xmlns="http://www.w3.org/2000/svg" class="w-full h-full rounded">
  ${PITCH_BASE}
  <rect width="400" height="240" fill="url(#grassGrad)" stroke="#ffffff" stroke-width="2" />
  <!-- Playing Grid -->
  <rect x="60" y="30" width="280" height="180" fill="rgba(0,0,0,0.1)" stroke="#ffffff" stroke-width="2" stroke-dasharray="6,4" />
  <!-- Cones -->
  <circle cx="60" cy="30" r="4" fill="#fbbf24" />
  <circle cx="340" cy="30" r="4" fill="#fbbf24" />
  <circle cx="60" cy="210" r="4" fill="#fbbf24" />
  <circle cx="340" cy="210" r="4" fill="#fbbf24" />

  <!-- Team Blue (4 players on edges) -->
  <circle cx="200" cy="30" r="6" fill="#2563eb" stroke="#fff" stroke-width="1.5" />
  <circle cx="200" cy="210" r="6" fill="#2563eb" stroke="#fff" stroke-width="1.5" />
  <circle cx="60" cy="120" r="6" fill="#2563eb" stroke="#fff" stroke-width="1.5" />
  <circle cx="340" cy="120" r="6" fill="#2563eb" stroke="#fff" stroke-width="1.5" />

  <!-- Team Red (4 defenders inside) -->
  <circle cx="150" cy="90" r="6" fill="#ef4444" stroke="#fff" stroke-width="1.5" />
  <circle cx="250" cy="90" r="6" fill="#ef4444" stroke="#fff" stroke-width="1.5" />
  <circle cx="150" cy="150" r="6" fill="#ef4444" stroke="#fff" stroke-width="1.5" />
  <circle cx="250" cy="150" r="6" fill="#ef4444" stroke="#fff" stroke-width="1.5" />

  <!-- 3 Jokers (Yellow inside & center) -->
  <circle cx="200" cy="120" r="6" fill="#fbbf24" stroke="#000" stroke-width="1.5" />
  <circle cx="120" cy="120" r="6" fill="#fbbf24" stroke="#000" stroke-width="1.5" />
  <circle cx="280" cy="120" r="6" fill="#fbbf24" stroke="#000" stroke-width="1.5" />

  <!-- Passing lines -->
  <path d="M 200,30 L 280,120 L 340,120" fill="none" stroke="#ffffff" stroke-width="2" stroke-dasharray="4,3" marker-end="url(#arrowWhite)" />
  <circle cx="270" cy="110" r="3.5" fill="#fff" stroke="#000" stroke-width="1" />
</svg>`;

// 7. Dribble & Conduite de balle - Slalom, feintes & élimination
const SVG_DRIBBLE = `<svg viewBox="0 0 400 240" xmlns="http://www.w3.org/2000/svg" class="w-full h-full rounded">
  ${PITCH_BASE}
  <rect width="400" height="70" fill="url(#skyGrad)" />
  <polygon points="40,65 360,65 395,235 5,235" fill="url(#grassGrad)" stroke="#ffffff" stroke-width="2" />
  <rect x="5" y="65" width="390" height="170" fill="url(#stripes)" opacity="0.6"/>
  <!-- Slalom cones -->
  <circle cx="120" cy="180" r="4" fill="#fbbf24" stroke="#d97706" stroke-width="1" />
  <circle cx="160" cy="150" r="4" fill="#ef4444" stroke="#b91c1c" stroke-width="1" />
  <circle cx="200" cy="180" r="4" fill="#fbbf24" stroke="#d97706" stroke-width="1" />
  <circle cx="240" cy="150" r="4" fill="#ef4444" stroke="#b91c1c" stroke-width="1" />
  <circle cx="280" cy="180" r="4" fill="#fbbf24" stroke="#d97706" stroke-width="1" />
  <!-- Dribble snake path -->
  <path d="M 80,200 Q 120,210 140,165 Q 160,130 180,185 Q 200,215 220,165 Q 240,130 260,185 Q 280,210 320,170" fill="none" stroke="#fbbf24" stroke-width="2.5" stroke-dasharray="4,3" marker-end="url(#arrowYellow)" />
  <!-- Mini goals at finish -->
  <rect x="320" y="140" width="30" height="6" fill="#fbbf24" stroke="#d97706" stroke-width="1.5" />
  <circle cx="80" cy="200" r="5.5" fill="#2563eb" stroke="#fff" stroke-width="1.5" />
  <circle cx="90" cy="195" r="3" fill="#fff" stroke="#000" stroke-width="0.8" />
  <circle cx="65" cy="205" r="4.5" fill="#2563eb" stroke="#fff" stroke-width="1" />
  <!-- Coach standing -->
  <circle cx="200" cy="95" r="5.5" fill="#0f172a" stroke="#fff" stroke-width="1.5" />
  <text x="200" y="85" font-size="8" font-family="sans-serif" font-weight="bold" fill="#ffffff" text-anchor="middle">Coach (Chrono)</text>
</svg>`;

// 8. Transition rapide (3s) & Contre-Attaque
const SVG_TRANSITION_3S = `<svg viewBox="0 0 400 240" xmlns="http://www.w3.org/2000/svg" class="w-full h-full rounded">
  ${PITCH_BASE}
  <rect width="400" height="70" fill="url(#skyGrad)" />
  <polygon points="40,65 360,65 395,235 5,235" fill="url(#grassGrad)" stroke="#ffffff" stroke-width="2" />
  <rect x="5" y="65" width="390" height="170" fill="url(#stripes)" opacity="0.6"/>
  <!-- Goal top -->
  <rect x="170" y="55" width="60" height="10" fill="none" stroke="#ffffff" stroke-width="2" />
  <!-- Central recovery circle -->
  <ellipse cx="200" cy="180" rx="60" ry="25" fill="rgba(251,191,36,0.15)" stroke="#fbbf24" stroke-width="1.5" stroke-dasharray="4,4" />
  <!-- Defensive recovery -->
  <circle cx="180" cy="180" r="5.5" fill="#2563eb" stroke="#fff" stroke-width="1.5" />
  <circle cx="210" cy="185" r="5.5" fill="#ef4444" stroke="#fff" stroke-width="1.5" />
  <!-- Fast counter attack arrows to goal -->
  <path d="M 180,180 L 140,120 L 180,75" fill="none" stroke="#ffffff" stroke-width="2" stroke-dasharray="4,3" marker-end="url(#arrowWhite)" />
  <path d="M 220,180 L 260,120 L 215,75" fill="none" stroke="#facc15" stroke-width="2.5" marker-end="url(#arrowYellow)" />
  <!-- Attacking runners -->
  <circle cx="140" cy="120" r="5.5" fill="#2563eb" stroke="#fff" stroke-width="1.5" />
  <circle cx="260" cy="120" r="5.5" fill="#2563eb" stroke="#fff" stroke-width="1.5" />
  <circle cx="200" cy="130" r="5.5" fill="#ef4444" stroke="#fff" stroke-width="1.5" />
  <!-- 3s Banner -->
  <g transform="translate(15, 80)">
    <rect width="65" height="22" rx="6" fill="#dc2626" />
    <text x="32" y="15" font-size="10" font-family="sans-serif" font-weight="900" fill="#ffffff" text-anchor="middle">⚡ TRANSITION 3s</text>
  </g>
</svg>`;

// 9. Tir & Finition au but
const SVG_SHOOTING = `<svg viewBox="0 0 400 240" xmlns="http://www.w3.org/2000/svg" class="w-full h-full rounded">
  ${PITCH_BASE}
  <rect width="400" height="70" fill="url(#skyGrad)" />
  <polygon points="40,65 360,65 395,235 5,235" fill="url(#grassGrad)" stroke="#ffffff" stroke-width="2" />
  <rect x="5" y="65" width="390" height="170" fill="url(#stripes)" opacity="0.6"/>
  <!-- Goal top with goalkeeper -->
  <rect x="160" y="55" width="80" height="12" fill="none" stroke="#ffffff" stroke-width="2" />
  <circle cx="200" cy="65" r="5.5" fill="#10b981" stroke="#fff" stroke-width="1.5" />
  <!-- Penalty box -->
  <polygon points="120,65 280,65 300,120 100,120" fill="none" stroke="#ffffff" stroke-width="1.5" />
  <!-- Pass to pivot, return pass & shoot -->
  <circle cx="200" cy="130" r="6" fill="#2563eb" stroke="#fff" stroke-width="1.5" /> <!-- Pivot -->
  <circle cx="200" cy="205" r="6" fill="#2563eb" stroke="#fff" stroke-width="1.5" /> <!-- Shooter -->
  <circle cx="210" cy="135" r="5.5" fill="#ef4444" stroke="#fff" stroke-width="1.5" /> <!-- Defender -->
  <!-- Pass arrow -->
  <line x1="200" y1="200" x2="200" y2="140" stroke="#ffffff" stroke-width="2" stroke-dasharray="3,3" marker-end="url(#arrowWhite)" />
  <!-- Layoff pass -->
  <path d="M 200,130 Q 230,145 225,160" fill="none" stroke="#ffffff" stroke-width="2" stroke-dasharray="3,3" marker-end="url(#arrowWhite)" />
  <!-- Powerful shot arrow to corner -->
  <path d="M 220,165 L 170,68" fill="none" stroke="#fbbf24" stroke-width="3" marker-end="url(#arrowYellow)" />
</svg>`;

// 10. Pressing en bloc & Récupération haute
const SVG_PRESSING = `<svg viewBox="0 0 400 240" xmlns="http://www.w3.org/2000/svg" class="w-full h-full rounded">
  ${PITCH_BASE}
  <rect width="400" height="70" fill="url(#skyGrad)" />
  <polygon points="40,65 360,65 395,235 5,235" fill="url(#grassGrad)" stroke="#ffffff" stroke-width="2" />
  <rect x="5" y="65" width="390" height="170" fill="url(#stripes)" opacity="0.6"/>
  <!-- Target zones -->
  <polygon points="120,65 280,65 310,130 90,130" fill="rgba(239,68,68,0.1)" stroke="#ef4444" stroke-width="1.5" stroke-dasharray="4,4" />
  <!-- Opponent carrying ball -->
  <circle cx="160" cy="100" r="5.5" fill="#ef4444" stroke="#fff" stroke-width="1.5" />
  <circle cx="150" cy="98" r="3" fill="#fff" stroke="#000" stroke-width="0.8" />
  <circle cx="240" cy="100" r="5.5" fill="#ef4444" stroke="#fff" stroke-width="1.5" />
  <!-- 3 Pressing players closing angle -->
  <circle cx="130" cy="140" r="6" fill="#2563eb" stroke="#fff" stroke-width="1.5" />
  <circle cx="180" cy="135" r="6" fill="#2563eb" stroke="#fff" stroke-width="1.5" />
  <circle cx="220" cy="145" r="6" fill="#2563eb" stroke="#fff" stroke-width="1.5" />
  <path d="M 130,140 L 155,108" stroke="#fbbf24" stroke-width="2" marker-end="url(#arrowYellow)" />
  <path d="M 180,135 L 165,108" stroke="#fbbf24" stroke-width="2" marker-end="url(#arrowYellow)" />
  <path d="M 220,145 L 235,108" stroke="#fbbf24" stroke-width="2" marker-end="url(#arrowYellow)" />
</svg>`;

export const DRILL_PRESETS: DrillPreset[] = [
  {
    id: 'preset-init-1',
    title: 'Duel 1c1 - Assiettes & Remise entre Piquets',
    category: 'init',
    description: 'Duel 1 contre 1 : passer derrière les assiettes et l\'entraîneur remet le ballon entre les deux piquets',
    svgContent: SVG_INIT_1,
    defaultCoach: 'SEB',
    caption: 'Duel 1c1 après contournement assiettes',
    keywords: ['1v1', '1c1', 'duel', 'dribble', 'vitesse', 'finition', 'frappe', 'te/ko'],
  },
  {
    id: 'preset-init-2',
    title: 'Duel 1c1 - Slalom & Changement de Rôle',
    category: 'init',
    description: 'Duel 1 contre 1 : le ballon est remis au premier joueur qui passe les deux piquets et contourne le piquet, l\'autre joueur devient défenseur',
    svgContent: SVG_INIT_2,
    defaultCoach: 'Miguel',
    caption: 'Duel 1c1 avec slalom et transition',
    keywords: ['1v1', '1c1', 'duel', 'slalom', 'transition', 'vitesse', 'défense', 'te/ko'],
  },
  {
    id: 'preset-form-1',
    title: '1 contre 1 en 4 Zones & 2 Petits Buts (SEB)',
    category: 'forms',
    description: '1 contre 1, 4 zones et 2 petits buts - Travail orienté et duel défensif/offensif',
    svgContent: SVG_FORM_1,
    defaultCoach: 'SEB',
    caption: '1v1 en 4 zones avec mini-buts (SEB)',
    keywords: ['1v1', '1c1', 'duel', 'formes jouées', 'mini-buts', 'transition', 'ta'],
  },
  {
    id: 'preset-form-2',
    title: '1 contre 1 en 4 Zones & 2 Petits Buts (Miguel)',
    category: 'forms',
    description: '1 contre 1, 4 zones et 2 petits buts - Travail orienté et duel défensif/offensif',
    svgContent: SVG_FORM_2,
    defaultCoach: 'Miguel',
    caption: '1v1 en 4 zones avec mini-buts (Miguel)',
    keywords: ['1v1', '1c1', 'duel', 'formes jouées', 'mini-buts', 'transition', 'ta'],
  },
  {
    id: 'preset-dribble-slalom',
    title: 'Dribble & Conduite - Slalom, Feintes & Élimination',
    category: 'init',
    description: 'Atelier de motricité et conduite de balle : slalom rapide entre coupelles, feintes de corps et finition dans mini-buts',
    svgContent: SVG_DRIBBLE,
    defaultCoach: 'Miguel',
    caption: 'Slalom dribble et feintes',
    keywords: ['dribble', 'feinte', 'conduite', 'motricité', 'slalom', 'coordination', '1v1', 'te/ko'],
  },
  {
    id: 'preset-transition-3s',
    title: 'Transition Rapide (3s) & Contre-Attaque 3v2',
    category: 'forms',
    description: 'Récupération de balle dans le rond central et projection immédiate vers le but adverse en moins de 3 secondes à 3 contre 2',
    svgContent: SVG_TRANSITION_3S,
    defaultCoach: 'SEB',
    caption: 'Transition rapide 3s et contre-attaque 3v2',
    keywords: ['transition', '3s', 'contre-attaque', '3v2', '3c2', 'vitesse', 'projection', 'surnombre', 'ta'],
  },
  {
    id: 'preset-shooting-finition',
    title: 'Jeu Combiné, Passe au Pivot & Frappe au But',
    category: 'forms',
    description: 'Appui sur le joueur pivot, remise en une touche et tir cadré sous la pression d\'un défenseur en retrait',
    svgContent: SVG_SHOOTING,
    defaultCoach: 'SEB',
    caption: 'Combinaison avec pivot et frappe',
    keywords: ['tir', 'finition', 'frappe', 'passe', 'une-deux', 'pivot', 'centre', 'gardien', 'te/ko', 'ta'],
  },
  {
    id: 'preset-pressing-bloc',
    title: 'Pressing en Bloc & Récupération Haute',
    category: 'forms',
    description: 'Cadrage du porteur, coulissement du bloc défensif, fermeture des lignes de passes axiales et interception',
    svgContent: SVG_PRESSING,
    defaultCoach: 'Miguel',
    caption: 'Pressing coordonné et fermeture de l\'axe',
    keywords: ['pressing', 'défense', 'récupération', 'cadrage', 'bloc', 'interception', 'ta'],
  },
  {
    id: 'preset-conservation',
    title: 'Conservation & Transition 4v4 + 3 Jokers',
    category: 'forms',
    description: 'Jeu de possession, fixation et transition rapide à la récupération',
    svgContent: SVG_CONSERVATION,
    defaultCoach: 'SEB',
    caption: 'Conservation 4v4+3',
    keywords: ['conservation', 'rondo', 'possession', 'passe', 'transition', '4v4', '4c4', 'jokers', 'ta'],
  },
  {
    id: 'preset-game-6v6',
    title: 'Match Final 6 contre 6 (FE12 FootEco)',
    category: 'game',
    description: 'Match 6 contre 6 : Positionnement défensif, détermination, défendre et attaquer ensemble. Remplaçants en jonglage de groupe.',
    svgContent: SVG_GAME_6V6,
    defaultCoach: '',
    caption: 'Match final 6 contre 6 (Remplaçants jonglent en groupe)',
    keywords: ['match', '6v6', '6c6', 'jeu final', 'footeco', 'tactique', 'jonglages'],
  },
];

export function getPresetSvg(id: string): string | undefined {
  return DRILL_PRESETS.find(p => p.id === id)?.svgContent;
}
