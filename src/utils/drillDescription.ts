/**
 * Utility functions for parsing, splitting and formatting drill descriptions
 * specifically separating Atelier 1 (Dessin 1) and Atelier 2 (Dessin 2) for FootEco sessions.
 */

export interface DrillSubAtelier {
  id: 'atelier1' | 'atelier2';
  slotName: 'Dessin 1' | 'Dessin 2';
  title: string;
  coach?: string;
  rawText: string;
  rules: string[];
  variants: string[];
  coachingPoints: string[];
  cleanParagraphs: string[];
}

export interface SplitDrillResult {
  isSplit: boolean;
  atelier1: DrillSubAtelier | null;
  atelier2: DrillSubAtelier | null;
  fullDescription: string;
}

/**
 * Split a part description into Atelier 1 and Atelier 2 if present.
 */
export function splitDrillDescription(
  description: string = '',
  drawing1Caption?: string,
  drawing2Caption?: string,
  drawing1Coach?: string,
  drawing2Coach?: string
): SplitDrillResult {
  const clean = (description || '').trim();
  if (!clean) {
    return {
      isSplit: false,
      atelier1: null,
      atelier2: null,
      fullDescription: '',
    };
  }

  // Regex patterns to identify Atelier 1 / Dessin 1 / Formes Jouées 1 and Atelier 2 / Dessin 2 / Formes Jouées 2
  const regexA1 = /(?:📍\s*)?(?:(?:Atelier|Dessin|Formes?\s*jouées?|Situation|Exercice)\s*1\s*(?:\([^)]*\))?)\s*[:=\-]?\s*([\s\S]*?)(?=(?:📍\s*)?(?:(?:Atelier|Dessin|Formes?\s*jouées?|Situation|Exercice)\s*2\s*(?:\([^)]*\))?)\s*[:=\-]|$)/i;
  const regexA2 = /(?:📍\s*)?(?:(?:Atelier|Dessin|Formes?\s*jouées?|Situation|Exercice)\s*2\s*(?:\([^)]*\))?)\s*[:=\-]?\s*([\s\S]*?)$/i;

  const matchA1 = clean.match(regexA1);
  const matchA2 = clean.match(regexA2);

  // Extract coach in parentheses if present e.g. "Dessin 1 (Miguel R.) :"
  const coachMatch1 = clean.match(/(?:Atelier|Dessin|Formes?\s*jouées?|Situation|Exercice)\s*1\s*\(([^)]+)\)/i);
  const coachMatch2 = clean.match(/(?:Atelier|Dessin|Formes?\s*jouées?|Situation|Exercice)\s*2\s*\(([^)]+)\)/i);

  const detectedCoach1 = drawing1Coach || (coachMatch1 ? coachMatch1[1].trim() : undefined);
  const detectedCoach2 = drawing2Coach || (coachMatch2 ? coachMatch2[1].trim() : undefined);

  const text1 = matchA1 && matchA1[1] ? matchA1[1].trim() : '';
  const text2 = matchA2 && matchA2[1] ? matchA2[1].trim() : '';

  // If both parts are found, we have a proper split
  if (text1 && text2) {
    return {
      isSplit: true,
      atelier1: parseSubAtelier('atelier1', 'Dessin 1', drawing1Caption || 'Atelier 1', text1, detectedCoach1),
      atelier2: parseSubAtelier('atelier2', 'Dessin 2', drawing2Caption || 'Atelier 2', text2, detectedCoach2),
      fullDescription: clean,
    };
  }

  // Fallback: Check if there's a clear paragraph or double newline separator that mentions atelier/dessin/forme jouée
  const lines = clean.split('\n');
  let splitIndex = -1;
  for (let i = 1; i < lines.length; i++) {
    const l = lines[i].toLowerCase();
    if (
      l.includes('atelier 2') || 
      l.includes('dessin 2') || 
      l.includes('forme jouée 2') || 
      l.includes('formes jouées 2') || 
      l.includes('exercice 2') ||
      l.includes('situation 2')
    ) {
      splitIndex = i;
      break;
    }
  }

  if (splitIndex > 0) {
    const p1 = lines.slice(0, splitIndex).join('\n').trim();
    const p2 = lines.slice(splitIndex).join('\n').trim();
    // Clean headers if present
    const cleanP1 = p1.replace(/^(?:📍\s*)?(?:(?:Atelier|Dessin|Formes?\s*jouées?|Situation|Exercice)\s*1\s*(?:\([^)]*\))?)\s*[:=\-]?\s*/i, '');
    const cleanP2 = p2.replace(/^(?:📍\s*)?(?:(?:Atelier|Dessin|Formes?\s*jouées?|Situation|Exercice)\s*2\s*(?:\([^)]*\))?)\s*[:=\-]?\s*/i, '');
    return {
      isSplit: true,
      atelier1: parseSubAtelier('atelier1', 'Dessin 1', drawing1Caption || 'Atelier 1', cleanP1, detectedCoach1),
      atelier2: parseSubAtelier('atelier2', 'Dessin 2', drawing2Caption || 'Atelier 2', cleanP2, detectedCoach2),
      fullDescription: clean,
    };
  }

  return {
    isSplit: false,
    atelier1: null,
    atelier2: null,
    fullDescription: clean,
  };
}

/**
 * Parses individual sub-atelier text into rules, variants, and structured paragraphs.
 */
function parseSubAtelier(
  id: 'atelier1' | 'atelier2',
  slotName: 'Dessin 1' | 'Dessin 2',
  title: string,
  text: string,
  coach?: string
): DrillSubAtelier {
  const lines = text.split('\n').map((l) => l.trim()).filter(Boolean);
  const rules: string[] = [];
  const variants: string[] = [];
  const coachingPoints: string[] = [];
  const cleanParagraphs: string[] = [];

  let currentSection: 'general' | 'rules' | 'variants' | 'coaching' = 'general';

  for (const line of lines) {
    const lower = line.toLowerCase();
    if (lower.startsWith('règle') || lower.startsWith('regle') || lower.startsWith('consigne') || lower.startsWith('fonctionnement')) {
      currentSection = 'rules';
      const cleanLine = line.replace(/^(?:règles?|regles?|consignes?|fonctionnement)\s*[:\-]?\s*/i, '').trim();
      if (cleanLine) rules.push(cleanLine);
      continue;
    }
    if (lower.startsWith('variante') || lower.startsWith('progression') || lower.startsWith('évolution')) {
      currentSection = 'variants';
      const cleanLine = line.replace(/^(?:variantes?|progressions?|évolutions?)\s*[:\-]?\s*/i, '').trim();
      if (cleanLine) variants.push(cleanLine);
      continue;
    }
    if (lower.startsWith('coaching') || lower.startsWith('accent') || lower.startsWith('attention')) {
      currentSection = 'coaching';
      const cleanLine = line.replace(/^(?:coaching|accents?|attentions?)\s*[:\-]?\s*/i, '').trim();
      if (cleanLine) coachingPoints.push(cleanLine);
      continue;
    }

    if (currentSection === 'rules') {
      rules.push(line.replace(/^[-•*]\s*/, ''));
    } else if (currentSection === 'variants') {
      variants.push(line.replace(/^[-•*]\s*/, ''));
    } else if (currentSection === 'coaching') {
      coachingPoints.push(line.replace(/^[-•*]\s*/, ''));
    } else {
      cleanParagraphs.push(line);
    }
  }

  return {
    id,
    slotName,
    title,
    coach,
    rawText: text,
    rules,
    variants,
    coachingPoints,
    cleanParagraphs: cleanParagraphs.length > 0 ? cleanParagraphs : [text],
  };
}

/**
 * Recombines Atelier 1 and Atelier 2 texts into a single standardized FootEco description
 */
export function combineDrillDescription(atelier1Text: string, atelier2Text: string): string {
  const a1 = (atelier1Text || '').trim();
  const a2 = (atelier2Text || '').trim();

  if (!a2) return a1;
  if (!a1) return a2;

  return `📍 Atelier 1 (Dessin 1) :\n${a1}\n\n📍 Atelier 2 (Dessin 2) :\n${a2}`;
}
