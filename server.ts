import express from "express";
import path from "path";
import { createServer as createViteServer } from "vite";
import { GoogleGenAI } from "@google/genai";
import dotenv from "dotenv";
import { generateTailoredSvgFromExercise } from "./src/utils/pitchDiagrams";

dotenv.config();

let aiClient: GoogleGenAI | null = null;
function getAIClient(): GoogleGenAI | null {
  const key = process.env.GEMINI_API_KEY;
  if (!key) {
    return null;
  }
  if (!aiClient) {
    aiClient = new GoogleGenAI({
      apiKey: key,
      httpOptions: {
        headers: {
          'User-Agent': 'aistudio-build',
        },
      },
    });
  }
  return aiClient;
}

// Robust JSON extractor that handles markdown blocks, trailing commentaries, unescaped chars, and trailing commas
function safeExtractAndParseJson(text: string | null | undefined): any {
  if (!text || typeof text !== "string") return null;

  let s = text.trim();

  // Try direct parse first
  try {
    return JSON.parse(s);
  } catch (_) {}

  // 1. If wrapped in markdown code fence ```json ... ``` or ``` ... ```
  const codeBlockMatches = [...s.matchAll(/```(?:json)?\s*([\s\S]*?)\s*```/g)];
  for (const match of codeBlockMatches) {
    if (match[1] && match[1].includes("{")) {
      const candidate = match[1].trim();
      try {
        return JSON.parse(candidate);
      } catch (_) {
        // Continue to brace isolation below
      }
    }
  }

  // 2. Extract from the first '{' to the last '}' (strips any trailing text/explanation)
  const firstBrace = s.indexOf("{");
  const lastBrace = s.lastIndexOf("}");
  if (firstBrace !== -1 && lastBrace > firstBrace) {
    const candidate = s.slice(firstBrace, lastBrace + 1).trim();
    try {
      return JSON.parse(candidate);
    } catch (_) {
      // 2a. Fix common LLM trailing commas before closing braces or brackets
      try {
        const withoutTrailingCommas = candidate
          .replace(/,\s*([}\]])/g, "$1")
          .replace(/[\u0000-\u001F\u007F-\u009F]/g, (c) =>
            c === "\n" || c === "\r" || c === "\t" ? c : ""
          );
        return JSON.parse(withoutTrailingCommas);
      } catch (_) {
        // 2b. Fix unescaped newlines inside string values
        try {
          const sanitizedStrings = candidate
            .replace(/"([^"\\]*(?:\\.[^"\\]*)*)"/g, (match) =>
              match.replace(/\n/g, "\\n").replace(/\r/g, "\\r").replace(/\t/g, "\\t")
            )
            .replace(/,\s*([}\]])/g, "$1");
          return JSON.parse(sanitizedStrings);
        } catch (_) {}
      }
    }
  }

  return null;
}

// Resilient Gemini caller with supported models from @google/genai and deterministic fallback
async function generateContentWithFallback(options: {
  contents: string;
  systemInstruction?: string;
  temperature?: number;
  responseMimeType?: string;
  maxOutputTokens?: number;
}): Promise<string | null> {
  const ai = getAIClient();
  if (!ai) {
    return null;
  }

  // Official supported models in order of capability & speed
  const modelsToTry = [
    "gemini-3.8-flash",
    "gemini-2.5-flash",
    "gemini-3.1-flash-lite",
    "gemini-flash-latest",
  ];

  for (const model of modelsToTry) {
    for (let attempt = 0; attempt < 2; attempt++) {
      try {
        const response = await ai.models.generateContent({
          model,
          contents: options.contents,
          config: {
            systemInstruction: options.systemInstruction,
            temperature: options.temperature ?? 0.7,
            responseMimeType: options.responseMimeType,
            maxOutputTokens: options.maxOutputTokens ?? 8192,
          },
        });

        if (response?.text) {
          return response.text;
        }
      } catch (err: any) {
        const isTransient =
          err?.status === 503 ||
          err?.status === 429 ||
          err?.message?.includes("503") ||
          err?.message?.includes("429") ||
          err?.message?.includes("high demand") ||
          err?.message?.includes("RESOURCE_EXHAUSTED") ||
          err?.message?.includes("UNAVAILABLE");

        if (isTransient && attempt === 0) {
          // Wait 500ms before retrying once
          await new Promise((resolve) => setTimeout(resolve, 500));
          continue;
        }

        // Try next valid model in list
        break;
      }
    }
  }

  return null;
}

const ASF_PHILOSOPHY_SYSTEM_PROMPT = `
Tu es un Directeur Technique et Formateur d'Élite de l'Association Suisse de Football (ASF) spécialisé dans le programme FootEco (catégories FE12, FE13, FE14).
Tu conçois des fiches de séances d'entraînement officielles FootEco basées scrupuleusement sur les principes méthodologiques de l'ASF :

1. PHILOSOPHIE FOOTECO ASF :
- "Jouer - Jouer - Jouer" : Intensité maximale, aucun temps mort (0 attente en file), volume de répétitions et de touches de balle maximal.
- Plaisir, autonomie, prise d'initiative, développement de l'intelligence de jeu.
- Le jeu guide l'apprentissage (pédagogie active avec questionnement ouvert).

2. STRUCTURE DE LA SÉANCE OFFICIELLE FOOTECO (3 PARTIES) :
- PARTIE INITIALE (Focus TE/KO - Technique & Coordination) : Formes d'échauffement dynamique avec ballon, coordination motrice, travail technique analytique ou semi-global (ex: duels 1c1 rapides, prises de balle orientées, slaloms avec finition, circuits de passes vivaces). Deux ateliers complémentaires (Dessin 1 & Dessin 2) animés par les 2 coaches.
- FORMES JOUÉES (Focus TA - Tactique & Situations) : Formes jouées stimulantes (ex: 1c1 en 4 zones avec mini-buts, 2c1, 3c2, 4c3, rondo de transition, jeux de possession orientés avec cibles). Dessin 1 et Dessin 2.
- JEU FINAL (Focus TE/TA - Match d'application) : Match en effectif réduit (6v6 ou 4v4 sur double terrain) avec règles pédagogiques provocatrices en lien avec le thème du jour (ex: but après 1v1 réussi = double, relance sous pression, etc.). Préciser l'activité des remplaçants (ex: jonglage de groupe, travail technique individualisé).

3. THÈMES FOOTECO :
- Thème TE (Technique) : Geste technique spécifique (ex: première touche orientée, passe claquée au sol, feinte et dribble, récupération du ballon, tir au but). Accents de coaching techniques précis.
- Thème TA (Tactique) : Phase défensive (DEF), offensive (OFF) ou transition. Ex: freiner et orienter, fermer l'axe, couper les lignes de passe, créer des lignes d'appui, dédoublement, transition 3 secondes.
- Thème PE (Physique / Psycho-émotionnel) : Vivacité de réaction, motricité, communication positive, détermination, courage, respect.

4. INDIVIDUALISATION & BILAN :
- Repères d'individualisation (différenciation espace/temps, nombre de touches, devoirs techniques).
- Bilan prévisionnel pour guider l'auto-évaluation des entraîneurs.
`;

async function startServer() {
  const app = express();
  const PORT = 3000;

  app.use(express.json({ limit: "5mb" }));

  // API Healthcheck
  app.get("/api/health", (req, res) => {
    res.json({ status: "ok", time: new Date().toISOString() });
  });

  // API 1: Generate Full FootEco Training Session
  app.post("/api/ai/generate-training-session", async (req, res) => {
    try {
      const {
        themeTitle,
        category = "FE12 Bas-Valais",
        phase = "DEF & OFF",
        focusTopic = "Duels 1c1 et récupération du ballon",
        coach = "Sébastien M.",
        assistantCoach = "Miguel R.",
        season = "2025/2026",
        specificInstructions = "",
      } = req.body;

      let prompt = `
Crée une fiche de séance d'entraînement complète FootEco ASF officielle pour la catégorie ${category}, saison ${season}.
Entraîneur responsable : ${coach}, Adjoint : ${assistantCoach}.
Thème souhaité : ${themeTitle || focusTopic}.
Phase tactique dominante : ${phase}.
Instructions / Focus spécifique de l'entraîneur : ${specificInstructions || "Mettre l'accent sur l'intensité, le plaisir et la philosophie ASF FootEco"}.

Tu DOIS répondre EXCLUSIVEMENT sous la forme d'un objet JSON strict avec la structure suivante (sans texte autour) :
{
  "title": "Titre clair et professionnel (ex: Séance FootEco FE12 - Récupération & Duels 1c1)",
  "team": "${category}",
  "themeTE": {
    "description": "Description concise et percutante du geste technique ciblé",
    "coachingAccents": "3-4 points clés d'intervention technique pour le coach (ex: Placement défensif, première touche active, pied d'appui solide)"
  },
  "themeTA": {
    "description": "Description tactique claire (ex: Freiner et orienter l'adversaire, couper les lignes de passe, fermer l'axe)",
    "defOrOff": "${phase === 'DEF' ? 'DEF' : phase === 'OFF' ? 'OFF' : 'DEF & OFF'}",
    "antagonism": "Antagonisme OFF/DEF (ex: Volonté de vouloir gagner le ballon vs Protéger et sortir sous pression)",
    "coachingAccents": "Accents tactiques clés pour le coach"
  },
  "themePE": {
    "description": "Qualités physiques et psycho-émotionnelles (ex: Vitesse de réaction, engagement et concentration)",
    "coachingAccents": "Attitude positive, communication, dépassement de soi"
  },
  "initialPart": {
    "title": "Partie initiale - Focus TE/KO",
    "focus": "Focus TE/KO",
    "duration": "2X 15 min (Total 30 min)",
    "description": "Description détaillée de l'atelier 1 (Dessin 1 = ...) et de l'atelier 2 (Dessin 2 = ...) avec les règles, le matériel et les consignes claires.",
    "drawing1Caption": "Titre court atelier 1 (ex: Duel 1c1 contournement assiettes & piquets)",
    "drawing1Coach": "${coach ? coach.split(' ')[0] : 'SEB'}",
    "drawing2Caption": "Titre court atelier 2 (ex: Duel 1c1 slalom & transition)",
    "drawing2Coach": "${assistantCoach ? assistantCoach.split(' ')[0] : 'Miguel'}",
    "recommendedPreset1": "preset-init-1",
    "recommendedPreset2": "preset-init-2"
  },
  "playedForms": {
    "title": "Formes jouées - Focus TA",
    "focus": "Focus TA",
    "duration": "2X 15 min (Total 30 min)",
    "description": "Description détaillée de la situation tactique (Dessin 1 = ... et Dessin 2 = ...) avec zones, cibles ou mini-buts, et règles de transition.",
    "drawing1Caption": "Titre court forme jouée 1 (ex: 1c1 en 4 zones avec 2 mini-buts)",
    "drawing1Coach": "${coach ? coach.split(' ')[0] : 'SEB'}",
    "drawing2Caption": "Titre court forme jouée 2 (ex: 1c1 en 4 zones avec 2 mini-buts)",
    "drawing2Coach": "${assistantCoach ? assistantCoach.split(' ')[0] : 'Miguel'}",
    "recommendedPreset1": "preset-form-1",
    "recommendedPreset2": "preset-form-2"
  },
  "finalGame": {
    "title": "Jeu final - Focus TE/TA",
    "focus": "Focus TE/TA",
    "duration": "30 min",
    "description": "Description du match final (ex: Match 6 contre 6 avec règles pédagogiques FootEco et consignes pour les remplaçants en jonglage de groupe).",
    "drawing1Caption": "Match final 6 contre 6 (FE12 FootEco)",
    "drawing1Coach": "",
    "drawing2Caption": "",
    "drawing2Coach": "",
    "recommendedPreset1": "preset-game-6v6",
    "recommendedPreset2": ""
  },
  "remarksAndIndividualization": "Conseils d'individualisation ASF (différenciation espace/temps, nombre de touches, devoirs techniques pour les joueurs)",
  "bilan": "Critères de réussite et repères d'évaluation de la séance"
}
`;

      let generatedJson: any = null;

      try {
        const text = await generateContentWithFallback({
          contents: prompt,
          systemInstruction: ASF_PHILOSOPHY_SYSTEM_PROMPT,
          temperature: 0.7,
          responseMimeType: "application/json",
        });

        if (text) {
          generatedJson = safeExtractAndParseJson(text);
          if (!generatedJson) {
            console.warn("AI generation parser issue: could not parse JSON, falling back to template.");
          }
        }
      } catch (aiErr) {
        console.warn("AI generation error, using fallback structure:", aiErr);
      }

      if (!generatedJson) {
        // High quality deterministic ASF fallback template
        generatedJson = {
          title: `Séance FootEco ${category} - ${focusTopic}`,
          team: category,
          themeTE: {
            description: `Maîtrise technique et qualité d'exécution orientée vers le thème : ${focusTopic}. Prises de balle actives et passes au sol.`,
            coachingAccents: "Prise d'information avant la réception (scan 360°), orientation du corps vers l'avant, pied d'appui stable.",
          },
          themeTA: {
            description: `Principes tactiques ASF : cadrer le porteur, orienter vers l'extérieur, fermer l'axe et réagir en 3 secondes à la transition.`,
            defOrOff: phase === "DEF" ? "DEF" : phase === "OFF" ? "OFF" : "DEF & OFF",
            antagonism: "Recherche immédiate du gain du ballon vs Sortie rapide de la zone de pression",
            coachingAccents: "Créer des triangles d'appui, agressivité saine dans le duel, couverture mutuelle permanente.",
          },
          themePE: {
            description: "Vivacité gestuelle, réactivité motrice et communication encourageante.",
            coachingAccents: "Plaisir de jouer, persévérance face à l'échec, intensité élevée.",
          },
          initialPart: {
            title: "Partie initiale - Focus TE/KO",
            focus: "Focus TE/KO",
            duration: "2X 15 min (Total 30 min)",
            description: `Dessin 1 = Atelier technique en duel 1c1 après contournement d'assiettes et remise dans la course par le coach.\n\nDessin 2 = Slalom vivacité et changement de statut attaquant/défenseur immédiat.`,
            drawing1Caption: "Duel 1c1 contournement & finition rapide",
            drawing1Coach: coach ? coach.split(" ")[0] : "SEB",
            drawing2Caption: "Duel 1c1 slalom motricité & transition",
            drawing2Coach: assistantCoach ? assistantCoach.split(" ")[0] : "Miguel",
            recommendedPreset1: "preset-init-1",
            recommendedPreset2: "preset-init-2",
          },
          playedForms: {
            title: "Formes jouées - Focus TA",
            focus: "Focus TA",
            duration: "2X 15 min (Total 30 min)",
            description: `Dessin 1 = Forme jouée 1c1 en 4 zones délimitées avec 2 mini-buts. Objectif : fixer et déséquilibrer ou orienter vers la ligne de touche.\n\nDessin 2 = Même atelier en miroir pour garantir 0 temps d'attente.`,
            drawing1Caption: "1c1 en 4 zones & mini-buts (Atelier A)",
            drawing1Coach: coach ? coach.split(" ")[0] : "SEB",
            drawing2Caption: "1c1 en 4 zones & mini-buts (Atelier B)",
            drawing2Coach: assistantCoach ? assistantCoach.split(" ")[0] : "Miguel",
            recommendedPreset1: "preset-form-1",
            recommendedPreset2: "preset-form-2",
          },
          finalGame: {
            title: "Jeu final - Focus TE/TA",
            focus: "Focus TE/TA",
            duration: "30 min",
            description: `Match d'application 6 contre 6 sur terrain FootEco.\nRègles stimulantes : Les buts marqués après une action liée au thème (${focusTopic}) comptent double.\nLes remplaçants effectuent un travail technique en jonglage de groupe / devoirs techniques.`,
            drawing1Caption: "Match final 6 contre 6 (FE12 FootEco)",
            drawing1Coach: "",
            drawing2Caption: "",
            drawing2Coach: "",
            recommendedPreset1: "preset-game-6v6",
            recommendedPreset2: "",
          },
          remarksAndIndividualization: `Différenciation FootEco : adapter les dimensions du terrain pour les joueurs en difficulté, autoriser 2 touches pour stimuler la vitesse de jeu, valoriser les initiatives audacieuses.`,
          bilan: "Évaluer l'engagement dans les duels, la fluidité des transitions et la qualité des prises d'information.",
        };
      }

      // Automatically generate tactical vector diagrams tailored specifically to each exercise description!
      try {
        const initDesc = generatedJson.initialPart?.description || "";
        const formDesc = generatedJson.playedForms?.description || "";
        const gameDesc = generatedJson.finalGame?.description || "";

        generatedJson.initialPart = generatedJson.initialPart || {};
        generatedJson.initialPart.drawing1Svg = generateTailoredSvgFromExercise({
          title: generatedJson.initialPart.drawing1Caption || "Atelier TE/KO 1",
          description: initDesc,
          slotName: "Dessin 1",
          partType: "initialPart",
          coach: generatedJson.initialPart.drawing1Coach || (coach ? coach.split(" ")[0] : "SEB"),
          theme: generatedJson.title,
        });
        generatedJson.initialPart.drawing2Svg = generateTailoredSvgFromExercise({
          title: generatedJson.initialPart.drawing2Caption || "Atelier TE/KO 2",
          description: initDesc,
          slotName: "Dessin 2",
          partType: "initialPart",
          coach: generatedJson.initialPart.drawing2Coach || (assistantCoach ? assistantCoach.split(" ")[0] : "Miguel"),
          theme: generatedJson.title,
        });

        generatedJson.playedForms = generatedJson.playedForms || {};
        generatedJson.playedForms.drawing1Svg = generateTailoredSvgFromExercise({
          title: generatedJson.playedForms.drawing1Caption || "Forme jouée 1",
          description: formDesc,
          slotName: "Dessin 1",
          partType: "playedForms",
          coach: generatedJson.playedForms.drawing1Coach || (coach ? coach.split(" ")[0] : "SEB"),
          theme: generatedJson.title,
        });
        generatedJson.playedForms.drawing2Svg = generateTailoredSvgFromExercise({
          title: generatedJson.playedForms.drawing2Caption || "Forme jouée 2",
          description: formDesc,
          slotName: "Dessin 2",
          partType: "playedForms",
          coach: generatedJson.playedForms.drawing2Coach || (assistantCoach ? assistantCoach.split(" ")[0] : "Miguel"),
          theme: generatedJson.title,
        });

        generatedJson.finalGame = generatedJson.finalGame || {};
        generatedJson.finalGame.drawing1Svg = generateTailoredSvgFromExercise({
          title: generatedJson.finalGame.drawing1Caption || "Match final 6 contre 6",
          description: gameDesc,
          slotName: "Dessin 1",
          partType: "finalGame",
          coach: "",
          theme: generatedJson.title,
        });
      } catch (diagramErr) {
        console.warn("Diagram generation note:", diagramErr);
      }

      res.json({ success: true, session: generatedJson });
    } catch (err: any) {
      console.error("Error in generate-training-session:", err);
      res.status(500).json({ error: err.message || "Erreur de génération" });
    }
  });

  // API 2: Generate / Refine a Specific Exercise Part (Initial Part, Played Forms, Final Game)
  app.post("/api/ai/generate-exercise-part", async (req, res) => {
    try {
      const {
        partType, // 'initialPart' | 'playedForms' | 'finalGame'
        themeDescription = "",
        focus = "TE/KO",
        category = "FE12",
        coach = "SEB",
        assistantCoach = "Miguel",
        customPrompt = "",
      } = req.body;

      const prompt = `
Tu es formateur ASF FootEco. Conçois un atelier spécifique (${partType}) pour la catégorie ${category}.
Thème général : ${themeDescription}.
Type de partie : ${partType} (Focus ${focus}).
Consignes particulières de l'entraîneur : ${customPrompt || "Exercice très dynamique selon la pédagogie FootEco ASF"}.

Réponds UNIQUEMENT avec un JSON strict :
{
  "title": "${partType === 'initialPart' ? 'Partie initiale - Focus TE/KO' : partType === 'playedForms' ? 'Formes jouées - Focus TA' : 'Jeu final - Focus TE/TA'}",
  "focus": "Focus ${focus}",
  "duration": "${partType === 'finalGame' ? '30 min' : '2X 15 min (Total 30 min)'}",
  "description": "Description claire et pédagogique de l'atelier avec consignes, matériel, rotation et coaching points.",
  "drawing1Caption": "Titre synthétique Atelier 1",
  "drawing1Coach": "${coach}",
  "drawing2Caption": "Titre synthétique Atelier 2",
  "drawing2Coach": "${assistantCoach}",
  "recommendedPreset1": "${partType === 'initialPart' ? 'preset-init-1' : partType === 'playedForms' ? 'preset-form-1' : 'preset-game-6v6'}",
  "recommendedPreset2": "${partType === 'initialPart' ? 'preset-init-2' : partType === 'playedForms' ? 'preset-form-2' : ''}"
}
`;

      let generated: any = null;
      try {
        const text = await generateContentWithFallback({
          contents: prompt,
          systemInstruction: ASF_PHILOSOPHY_SYSTEM_PROMPT,
          temperature: 0.7,
          responseMimeType: "application/json",
        });
        if (text) {
          generated = safeExtractAndParseJson(text);
          if (!generated) {
            console.warn("Exercise part AI could not parse JSON, activating fallback.");
          }
        }
      } catch (err) {
        console.warn("Exercise part AI error:", err);
      }

      if (!generated) {
        generated = {
          title: partType === "initialPart" ? "Partie initiale - Focus TE/KO" : partType === "playedForms" ? "Formes jouées - Focus TA" : "Jeu final - Focus TE/TA",
          focus: `Focus ${focus}`,
          duration: partType === "finalGame" ? "30 min" : "2X 15 min (Total 30 min)",
          description: `Atelier ASF FootEco : Dessin 1 = Duel et motricité orientée avec finition rapide.\n\nDessin 2 = Forme en miroir avec changement de statut pour un temps d'attente nul.`,
          drawing1Caption: "Atelier dynamique 1",
          drawing1Coach: coach,
          drawing2Caption: "Atelier dynamique 2",
          drawing2Coach: assistantCoach,
          recommendedPreset1: partType === "initialPart" ? "preset-init-1" : partType === "playedForms" ? "preset-form-1" : "preset-game-6v6",
          recommendedPreset2: partType === "initialPart" ? "preset-init-2" : partType === "playedForms" ? "preset-form-2" : "",
        };
      }

      // Generate tailored diagrams according to the newly created exercise description!
      try {
        const partDesc = generated.description || "";
        generated.drawing1Svg = generateTailoredSvgFromExercise({
          title: generated.drawing1Caption || generated.title || "Atelier 1",
          description: partDesc,
          slotName: "Dessin 1",
          partType,
          coach: generated.drawing1Coach || coach,
          theme: themeDescription,
        });
        generated.drawing2Svg = generateTailoredSvgFromExercise({
          title: generated.drawing2Caption || generated.title || "Atelier 2",
          description: partDesc,
          slotName: "Dessin 2",
          partType,
          coach: generated.drawing2Coach || assistantCoach,
          theme: themeDescription,
        });
      } catch (dErr) {
        console.warn("Part diagram generation error:", dErr);
      }

      return res.json({ success: true, exercisePart: generated });
    } catch (err: any) {
      res.status(500).json({ error: err.message });
    }
  });

  // API 3: Generate Custom Tactical Drill Diagram via AI (or tailored procedural generator)
  app.post("/api/ai/generate-drill-diagram", async (req, res) => {
    try {
      const {
        exerciseTitle = "Atelier FootEco",
        description = "",
        slotName = "Dessin 1",
        partType = "initialPart",
        coach = "Coach",
        category = "FE12",
        theme = "",
        customPrompt = "",
      } = req.body;

      let generatedSvg: string | null = null;

      if (process.env.GEMINI_API_KEY) {
        const prompt = `Tu es l'expert tactique et formateur officiel FootEco ASF (${category}).
Génère un schéma tactique vectoriel SVG complet (viewBox 0 0 400 240) représentant précisément l'atelier d'entraînement de football suivant :
- Titre : ${exerciseTitle} (${slotName})
- Type d'atelier : ${partType}
- Description détaillée de l'atelier : "${description}"
- Thème d'entraînement : ${theme}
- Coach responsable : ${coach}
- Demande spécifique : ${customPrompt || "Schéma clair avec joueurs, cibles et flèches de trajectoire"}

CONSIGNES STRICTES POUR LE CODE SVG :
1. Renvoie UNIQUEMENT le code SVG débutant par <svg viewBox="0 0 400 240" xmlns="http://www.w3.org/2000/svg" class="w-full h-full rounded"> et finissant par </svg>.
2. Pas de texte avant ou après, pas de balises markdown de type \`\`\`xml ou \`\`\`svg.
3. Inclus des définitions graphiques : dégradé herbe verte (grassGrad), ciel (skyGrad), lignes blanches, marqueurs de flèches (arrowPass, arrowYellow).
4. Représente fidèlement les consignes :
   - Zone de jeu verte ou couloir délimité.
   - Joueurs attaquants bleus (#2563eb avec bordure blanche), défenseurs rouges (#ef4444), jokers jaunes (#f59e0b), gardien vert (#10b981).
   - Matériel d'entraînement : cônes/coupelles (orange/jaune), piquets de slalom verticaux si motricité, mini-buts ou grand but.
   - Ballons (blancs avec coutures noires).
   - Flèches de passes (pointillés blancs) et flèches de courses (lignes continues jaunes ou dorées).
   - Petit badge du coach en bas à gauche ("${coach}").
   - Titre de l'exercice en filigrane propre.
`;

        try {
          const aiResponse = await generateContentWithFallback({
            contents: prompt,
            systemInstruction: "Tu es un générateur de schémas tactiques vectoriels SVG pour le football suisse des enfants FootEco ASF. Tu renvoies exclusivement du code SVG valide sans texte superflu.",
            temperature: 0.3,
            maxOutputTokens: 8192,
          });

          if (aiResponse) {
            const match = aiResponse.match(/<svg[\s\S]*?<\/svg>/i);
            if (match && match[0].includes("</svg>")) {
              generatedSvg = match[0];
            }
          }
        } catch (err) {
          console.warn("AI drill diagram generation error, using tailored procedural generator:", err);
        }
      }

      if (!generatedSvg) {
        generatedSvg = generateTailoredSvgFromExercise({
          title: exerciseTitle,
          description: `${description} ${customPrompt}`,
          slotName,
          partType,
          coach,
          theme,
        });
      }

      return res.json({ success: true, svg: generatedSvg });
    } catch (err: any) {
      console.error("Error in generate-drill-diagram:", err);
      res.status(500).json({ error: err.message || "Erreur lors de la génération du schéma" });
    }
  });

  // API 3: Refine coaching accents & individualization
  app.post("/api/ai/refine-theme", async (req, res) => {
    try {
      const { themeType, currentText, focusCategory } = req.body;
      const prompt = `
En tant que formateur ASF FootEco (${focusCategory || 'FE12'}), reformule et enrichis de manière synthétique et percutante les accents de coaching pour le thème ${themeType} :
Texte actuel : "${currentText || 'Amélioration générale'}"

Réponds UNIQUEMENT avec un JSON strict :
{
  "description": "Description officielle affinée selon le lexique FootEco ASF",
  "coachingAccents": "3-4 repères de coaching clés et questions ouvertes pour les joueurs"
}
`;
      let generated: any = null;
      try {
        const text = await generateContentWithFallback({
          contents: prompt,
          systemInstruction: ASF_PHILOSOPHY_SYSTEM_PROMPT,
          temperature: 0.6,
          responseMimeType: "application/json",
        });
        if (text) {
          generated = safeExtractAndParseJson(text);
          if (!generated) {
            console.warn("Theme refine AI could not parse JSON, activating fallback.");
          }
        }
      } catch (err) {
        console.warn("Theme refine AI error:", err);
      }

      if (!generated) {
        generated = {
          description: currentText || "Prise de décision rapide et gestes techniques orientés",
          coachingAccents: "Prise d'information avant la passe\nOrientation du corps vers le jeu\nCommunication positive",
        };
      }

      return res.json({ success: true, data: generated });
    } catch (err: any) {
      res.status(500).json({ error: err.message });
    }
  });

  // Vite middleware for development
  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), "dist");
    app.use(express.static(distPath));
    app.get("*", (req, res) => {
      res.sendFile(path.join(distPath, "index.html"));
    });
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`FootEco Server running on http://0.0.0.0:${PORT}`);
  });
}

startServer();
