import express from "express";
import path from "path";
import { createServer as createViteServer } from "vite";
import { GoogleGenAI } from "@google/genai";
import dotenv from "dotenv";
import { generateTailoredSvgFromExercise, extractScenarioIdFromSvg } from "./src/utils/pitchDiagrams";
import { generateAsfSessionProcedural } from "./src/utils/asfProceduralGenerator";

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

  // Official supported models from @google/genai SDK in order of capability & speed
  const modelsToTry = [
    "gemini-3.8-flash",
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
        const isQuota =
          err?.status === 429 ||
          err?.message?.includes("429") ||
          err?.message?.includes("Quota exceeded") ||
          err?.message?.includes("RESOURCE_EXHAUSTED");

        if (isQuota) {
          // Immediately move to next valid model, do not waste retries on exhausted quota
          break;
        }

        const isTransient =
          err?.status === 503 ||
          err?.message?.includes("503") ||
          err?.message?.includes("high demand") ||
          err?.message?.includes("UNAVAILABLE");

        if (isTransient && attempt === 0) {
          // Wait 300ms before retrying once
          await new Promise((resolve) => setTimeout(resolve, 300));
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
- "Jouer - Jouer - Jouer" : Intensité maximale, aucun temps mort (zéro attente en file), volume de répétitions et de touches de balle maximal.
- Plaisir, autonomie, créativité, prise d'initiative, développement de l'intelligence de jeu.
- Pédagogie active avec questionnement ouvert ("Que vois-tu ?", "Où est l'espace libre ?").

2. EXIGENCE D'ORIGINALITÉ ET ADAPTATION AU THÈME :
- INTERDICTION ABSOLUE de proposer toujours les mêmes exercices génériques (comme un duel 1c1 ou un rondo basique) à chaque génération !
- Chaque séance doit être UNIQUE, VARIÉE et COLLER PARFAITEMENT au thème spécifique choisi par l'entraîneur (Passes courtes, Dédoublements, Centres & reprises, Finition au but, Relance, Cadrage défensif, Transitions 3 secondes, etc.).
- Varie les structures spatiales : circuits en vague, losanges, triangles de combinaison, zones interdites, mini-portes de couleur, stop-ball, supériorité numérique temporaire (3v2, 4v3), appuis et jokers extérieurs.
- Les 2 ateliers de chaque phase (Dessin 1 et Dessin 2) doivent être clairement différents et complémentaires.

3. STRUCTURE DE LA SÉANCE OFFICIELLE FOOTECO (3 PARTIES) :
- PARTIE INITIALE (Focus TE/KO - Technique & Coordination) : Échauffement dynamique avec ballon, coordination motrice, travail technique ciblé sur le thème. Deux ateliers complémentaires (Dessin 1 & Dessin 2) animés par les 2 entraîneurs.
- FORMES JOUÉES (Focus TA - Tactique & Situations) : Formes jouées stimulantes en petits groupes (Dessin 1 & Dessin 2) avec cibles, mini-buts, zones ou règles de transition.
- JEU FINAL (Focus TE/TA - Match d'application) : Match officiel FootEco 7 contre 7 (7v7 avec 1 gardien + 6 joueurs de champ sur demi-terrain 50x35m, organisation préconisée 2-3-1 ou 3-2-1) avec règle pédagogique provocatrice récompensant l'objectif du thème du jour. Préciser l'activité technique des remplaçants.

4. INDIVIDUALISATION & BILAN :
- Repères d'individualisation (différenciation espace/temps, nombre de touches autorisées, devoirs techniques).
- Bilan prévisionnel et critères de réussite clairs pour guider l'auto-évaluation des entraîneurs.
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
        focusTopic = "",
        coach = "Miguel R.",
        assistantCoach = "Sébastien M.",
        season = "2025/2026",
        specificInstructions = "",
        variation = "standard",
        regenerationInstructions = "",
        regenerationAttempt = 0,
      } = req.body;

      const safeVariation = typeof variation === "string" ? variation : "standard";
      const targetTheme = (typeof themeTitle === "string" && themeTitle.trim()) 
        ? themeTitle.trim() 
        : (typeof focusTopic === "string" && focusTopic.trim() ? focusTopic.trim() : "Jeu combiné & circulation rapide");

      const combinedInstructions = [
        specificInstructions,
        regenerationInstructions,
        safeVariation && safeVariation !== "standard" ? `Variante demandée : ${safeVariation}` : "",
      ]
        .filter(Boolean)
        .join(" - ");

      const uniqueInspirationId = `${Date.now()}-${Math.random().toString(36).substring(2, 7)}`;

      let prompt = `
Tu es un formateur expert ASF FootEco. Conçois une séance d'entraînement FootEco NOUVELLE, ORIGINALE et COMPLÈTE pour la catégorie ${category}, saison ${season}.
Entraîneur responsable : ${coach}, Adjoint : ${assistantCoach}.

THÈME CENTRAL OBLIGATOIRE : "${targetTheme}"
PHASE TACTIQUE DOMINANTE : ${phase}
${safeVariation && safeVariation !== "standard" ? `VARIANTE MÉTHODOLOGIQUE SPÉCIFIQUE : ${safeVariation}` : ""}
CONSIGNES SPÉCIFIQUES DU COACH : ${combinedInstructions || "Créer des ateliers vivants, stimulants et variés selon la philosophie Jouer-Jouer-Jouer"}
${regenerationAttempt > 0 ? `TENTATIVE DE VARIATION N°${regenerationAttempt} : Propose des exercices et situations d'entraînement INÉDITS et TOTALEMENT DIFFÉRENTS des versions précédentes.` : ""}
Graine d'originalité : ${uniqueInspirationId}

DIRECTIVE CRUCIALE DE RENOUVELLEMENT :
- NE PROPOSE PAS DE SCHÉMAS RÉPÉTITIFS OU STÉRÉOTYPÉS ! (Évite de toujours faire des duels 1c1 ou un banal rondo 4v2 si le thème ne le demande pas).
- Les exercices, le matériel (coupelles, cônes, mini-buts, jalons), les dimensions du terrain et les règles doivent être CONÇUS EXCLUSIVEMENT ET SPÉCIFIQUEMENT pour travailler le thème : "${targetTheme}".
- Dans la PARTIE INITIALE (TE/KO) : propose 2 ateliers complémentaires distincts (ex: circuit motricité avec passes et enchaînements vifs, dédoublements, vagues de percussion ou frappes selon le thème).
- Dans les FORMES JOUÉES (TA) : conçois 2 situations jouées stimulantes avec opposition adaptée (ex: supériorités 2v1 / 3v2, jeu avec appuis extérieurs, zones de progression, transitions rapides 3 secondes).
- Dans le JEU FINAL : propose un match d'application officiel FootEco 7 contre 7 (7v7 avec gardiens sur demi-terrain 50x35m) avec une règle provocatrice qui récompense directement le thème "${targetTheme}".

Tu DOIS répondre EXCLUSIVEMENT sous la forme d'un objet JSON strict avec la structure suivante (aucun texte en dehors du JSON) :
{
  "title": "Titre professionnel et stimulant mettant en avant le thème (ex: Séance FootEco ${category} - ...)",
  "team": "${category}",
  "themeTE": {
    "description": "Description concise et percutante du geste technique ciblé en lien direct avec le thème",
    "coachingAccents": "3-4 points clés d'intervention technique pour le coach (posture, appuis, surface de pied, regard)"
  },
  "themeTA": {
    "description": "Description tactique claire et dynamique en lien avec le thème",
    "defOrOff": "${phase === 'DEF' ? 'DEF' : phase === 'OFF' ? 'OFF' : 'DEF & OFF'}",
    "antagonism": "Antagonisme offensif vs défensif précis",
    "coachingAccents": "Accents tactiques clés pour le coach sur le terrain"
  },
  "themePE": {
    "description": "Qualités physiques et psycho-émotionnelles sollicitées (vivacité motrice, concentration, audace, communication)",
    "coachingAccents": "Attitude positive, dynamisme, persévérance et esprit d'équipe"
  },
  "initialPart": {
    "title": "Partie initiale - Focus TE/KO",
    "focus": "Focus TE/KO",
    "duration": "2X 15 min (Total 30 min)",
    "description": "Description détaillée de l'atelier 1 (Dessin 1 = ...) et de l'atelier 2 (Dessin 2 = ...) avec nombre de joueurs, dimensions du terrain, matériel et consignes précises.",
    "drawing1Caption": "Titre synthétique de l'atelier 1 illustrant l'exercice spécifique",
    "drawing1Coach": "${coach ? coach.split(' ')[0] : 'SEB'}",
    "drawing2Caption": "Titre synthétique de l'atelier 2 illustrant l'exercice spécifique",
    "drawing2Coach": "${assistantCoach ? assistantCoach.split(' ')[0] : 'Miguel'}",
    "recommendedPreset1": "preset-init-1",
    "recommendedPreset2": "preset-init-2"
  },
  "playedForms": {
    "title": "Formes jouées - Focus TA",
    "focus": "Focus TA",
    "duration": "2X 15 min (Total 30 min)",
    "description": "Description détaillée de la situation tactique (Dessin 1 = ... et Dessin 2 = ...) avec zones, règles d'opposition, transitions et critères de score.",
    "drawing1Caption": "Titre synthétique de la situation tactique 1",
    "drawing1Coach": "${coach ? coach.split(' ')[0] : 'SEB'}",
    "drawing2Caption": "Titre synthétique de la situation tactique 2",
    "drawing2Coach": "${assistantCoach ? assistantCoach.split(' ')[0] : 'Miguel'}",
    "recommendedPreset1": "preset-form-1",
    "recommendedPreset2": "preset-form-2"
  },
  "finalGame": {
    "title": "Jeu final - Focus TE/TA",
    "focus": "Focus TE/TA",
    "duration": "30 min",
    "description": "Description du match d'application officiel FootEco 7 contre 7 (7v7 avec gardiens sur demi-terrain 50x35m, 14 joueurs au total) avec règle pédagogique provocatrice liée au thème et activité technique pour les remplaçants.",
    "drawing1Caption": "Match 7 contre 7 FootEco (7v7)",
    "drawing1Coach": "",
    "drawing2Caption": "",
    "drawing2Coach": "",
    "recommendedPreset1": "preset-game-7v7",
    "recommendedPreset2": ""
  },
  "remarksAndIndividualization": "Conseils concrets d'individualisation ASF (adaptation espace/temps, touches de balle, défis pour joueurs avancés)",
  "bilan": "Critères précis de réussite et repères d'évaluation de la séance"
}
`;

      let generatedJson: any = null;

      try {
        const text = await generateContentWithFallback({
          contents: prompt,
          systemInstruction: ASF_PHILOSOPHY_SYSTEM_PROMPT,
          temperature: 0.85,
          responseMimeType: "application/json",
        });

        if (text) {
          generatedJson = safeExtractAndParseJson(text);
          if (!generatedJson) {
            console.warn("AI generation parser issue: could not parse JSON, falling back to procedural generator.");
          }
        }
      } catch (aiErr) {
        console.warn("AI generation error, using procedural ASF generator:", aiErr);
      }

      if (!generatedJson) {
        // High quality thematic ASF procedural generator tailored to the exact user theme & variation
        generatedJson = generateAsfSessionProcedural({
          themeTitle: themeTitle || focusTopic,
          category,
          phase: phase as any,
          focusTopic,
          coach,
          assistantCoach,
          season,
          specificInstructions: combinedInstructions,
          variation: safeVariation,
          regenerationAttempt,
        });
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

        // Synchronize scenarioIds between SVG diagrams and animation engine
        generatedJson.initialPart.scenarioId = generatedJson.initialPart.scenarioId || extractScenarioIdFromSvg(generatedJson.initialPart.drawing1Svg);
        generatedJson.initialPart.drawing1ScenarioId = extractScenarioIdFromSvg(generatedJson.initialPart.drawing1Svg);
        generatedJson.initialPart.drawing2ScenarioId = extractScenarioIdFromSvg(generatedJson.initialPart.drawing2Svg);

        generatedJson.playedForms.scenarioId = generatedJson.playedForms.scenarioId || extractScenarioIdFromSvg(generatedJson.playedForms.drawing1Svg);
        generatedJson.playedForms.drawing1ScenarioId = extractScenarioIdFromSvg(generatedJson.playedForms.drawing1Svg);
        generatedJson.playedForms.drawing2ScenarioId = extractScenarioIdFromSvg(generatedJson.playedForms.drawing2Svg);

        generatedJson.finalGame.scenarioId = generatedJson.finalGame.scenarioId || extractScenarioIdFromSvg(generatedJson.finalGame.drawing1Svg) || "scenario-match-7v7";
        generatedJson.finalGame.drawing1ScenarioId = extractScenarioIdFromSvg(generatedJson.finalGame.drawing1Svg) || "scenario-match-7v7";
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
        coach = "Miguel",
        assistantCoach = "SEB",
        customPrompt = "",
        variation = "standard",
        regenerationInstructions = "",
        regenerationAttempt = 0,
      } = req.body;

      const safeVariation = typeof variation === "string" ? variation : "standard";

      const combinedPrompt = [
        customPrompt,
        regenerationInstructions,
        safeVariation && safeVariation !== "standard" ? `Variante demandée : ${safeVariation}` : "",
      ]
        .filter(Boolean)
        .join(" - ");

      const uniquePartId = `${Date.now()}-${Math.random().toString(36).substring(2, 7)}`;

      const prompt = `
Tu es formateur élite ASF FootEco. Conçois un atelier spécifique (${partType}) TOTALEMENT INÉDIT et STIMULANT pour la catégorie ${category}.
THÈME CENTRAL : ${themeDescription || "Jeu combiné & circulation dynamique"}
TYPE DE PARTIE : ${partType} (Focus ${focus})
${safeVariation && safeVariation !== "standard" ? `VARIANTE DEMANDÉE : ${safeVariation}` : ""}
CONSIGNES DU COACH : ${combinedPrompt || "Exercice dynamique, zéro file d'attente, plaisir et haute intensité"}
${regenerationAttempt > 0 ? `RÉGÉNÉRATION N°${regenerationAttempt} : Propose une variante totalement inédite et originale, différente de ce qui a déjà été présenté.` : ""}
Graine créative : ${uniquePartId}

DIRECTIVE : Conçois des ateliers originaux collant STRICTEMENT au thème ci-dessus (éviter les clichés répétitifs).

Réponds UNIQUEMENT avec un JSON strict :
{
  "title": "${partType === 'initialPart' ? 'Partie initiale - Focus TE/KO' : partType === 'playedForms' ? 'Formes jouées - Focus TA' : 'Jeu final - Focus TE/TA'}",
  "focus": "Focus ${focus}",
  "duration": "${partType === 'finalGame' ? '30 min' : '2X 15 min (Total 30 min)'}",
  "description": "Description claire, pédagogique et détaillée de l'atelier avec consignes, dimensions, matériel, règles précises et coaching points.",
  "drawing1Caption": "Titre synthétique Atelier 1 en lien avec le thème",
  "drawing1Coach": "${coach}",
  "drawing2Caption": "Titre synthétique Atelier 2 en lien avec le thème",
  "drawing2Coach": "${assistantCoach}",
  "recommendedPreset1": "${partType === 'initialPart' ? 'preset-init-1' : partType === 'playedForms' ? 'preset-form-1' : 'preset-game-7v7'}",
  "recommendedPreset2": "${partType === 'initialPart' ? 'preset-init-2' : partType === 'playedForms' ? 'preset-form-2' : ''}"
}
`;

      let generated: any = null;
      try {
        const text = await generateContentWithFallback({
          contents: prompt,
          systemInstruction: ASF_PHILOSOPHY_SYSTEM_PROMPT,
          temperature: 0.85,
          responseMimeType: "application/json",
        });
        if (text) {
          generated = safeExtractAndParseJson(text);
          if (!generated) {
            console.warn("Exercise part AI could not parse JSON, activating procedural fallback.");
          }
        }
      } catch (err) {
        console.warn("Exercise part AI error, activating procedural fallback:", err);
      }

      if (!generated) {
        const fullProcedural = generateAsfSessionProcedural({
          themeTitle: themeDescription,
          category,
          coach,
          assistantCoach,
          specificInstructions: combinedPrompt,
          variation: safeVariation,
          regenerationAttempt,
        });

        const extractedPart = (fullProcedural as any)[partType];
        if (extractedPart) {
          generated = {
            ...extractedPart,
            focus: `Focus ${focus}`,
          };
        } else {
          generated = {
            title: partType === "initialPart" ? "Partie initiale - Focus TE/KO" : partType === "playedForms" ? "Formes jouées - Focus TA" : "Jeu final - Focus TE/TA",
            focus: `Focus ${focus}`,
            duration: partType === "finalGame" ? "30 min" : "2X 15 min (Total 30 min)",
            description: `Atelier ASF FootEco : Dessin 1 = Duel et motricité orientée avec finition rapide.\n\nDessin 2 = Forme en miroir avec changement de statut pour un temps d'attente nul.`,
            drawing1Caption: "Atelier dynamique 1",
            drawing1Coach: coach,
            drawing2Caption: "Atelier dynamique 2",
            drawing2Coach: assistantCoach,
            recommendedPreset1: partType === "initialPart" ? "preset-init-1" : partType === "playedForms" ? "preset-form-1" : "preset-game-7v7",
            recommendedPreset2: partType === "initialPart" ? "preset-init-2" : partType === "playedForms" ? "preset-form-2" : "",
          };
        }
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

        generated.scenarioId = generated.scenarioId || extractScenarioIdFromSvg(generated.drawing1Svg);
        generated.drawing1ScenarioId = extractScenarioIdFromSvg(generated.drawing1Svg);
        generated.drawing2ScenarioId = extractScenarioIdFromSvg(generated.drawing2Svg);
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
1. Renvoie UNIQUEMENT le code SVG débutant par <svg viewBox="0 0 400 240" xmlns="http://www.w3.org/2000/svg" class="w-full h-full rounded" data-scenario-id="..."> et finissant par </svg>.
2. Choisi pour l'attribut data-scenario-id l'identifiant correspondant le mieux parmi cette liste :
   - "scenario-duel-1v1" (1c1, duel, feinte, crochet)
   - "scenario-slalom-frappe" (slalom, piquets, motricité, conduite)
   - "scenario-vagues-2v1" (2c1 en vagues, 4 zones, supériorité)
   - "scenario-transition-3v2" (transition 3s, 3c2, contre-attaque)
   - "scenario-possession-3v3-jokers" (possession, conservation, jokers, stop-ball)
   - "scenario-rondo-4v2" (rondo 4c2, taureau, conservation courte)
   - "scenario-tirs-enchaines-finition" (tirs enchaînés, pivot, frappe au but)
   - "scenario-centres-finition" (centres, débordement, reprise)
   - "scenario-dedoublement-passes" (dédoublement, une-deux, appui-soutien)
   - "scenario-pressing-recuperation" (pressing, bloc haut, interception)
   - "scenario-cadrage-defense" (cadrage défensif, recul-frein)
   - "scenario-circuit-passes-appui" (circuit de passes, losange, passes courtes)
   - "scenario-match-6v6" (match 7c7 ou 6c6 FootEco)
3. Pas de texte avant ou après, pas de balises markdown de type \`\`\`xml ou \`\`\`svg.
4. Inclus des définitions graphiques : dégradé herbe verte (grassGrad), ciel (skyGrad), lignes blanches, marqueurs de flèches (arrowPass, arrowYellow).
5. Représente fidèlement les consignes :
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
          description: `${description} ${customPrompt || ''}`,
          slotName,
          partType,
          coach,
          theme,
        });
      }

      // Ensure data-scenario-id is present in the SVG tag
      let scenarioId = extractScenarioIdFromSvg(generatedSvg);
      if (!scenarioId) {
        const fullTxt = `${exerciseTitle} ${description} ${theme}`.toLowerCase();
        if (fullTxt.includes('7v7') || fullTxt.includes('match') || partType === 'finalGame') scenarioId = 'scenario-match-6v6';
        else if (fullTxt.includes('2v1') || fullTxt.includes('2c1')) scenarioId = 'scenario-vagues-2v1';
        else if (fullTxt.includes('3v2') || fullTxt.includes('3c2')) scenarioId = 'scenario-transition-3v2';
        else if (fullTxt.includes('slalom') || fullTxt.includes('motricité')) scenarioId = 'scenario-slalom-frappe';
        else if (fullTxt.includes('rondo') || fullTxt.includes('4v2')) scenarioId = 'scenario-rondo-4v2';
        else if (fullTxt.includes('possession') || fullTxt.includes('joker')) scenarioId = 'scenario-possession-3v3-jokers';
        else if (fullTxt.includes('centre') || fullTxt.includes('débord')) scenarioId = 'scenario-centres-finition';
        else if (fullTxt.includes('tir') || fullTxt.includes('frappe')) scenarioId = 'scenario-tirs-enchaines-finition';
        else if (fullTxt.includes('pressing') || fullTxt.includes('récupér')) scenarioId = 'scenario-pressing-recuperation';
        else if (fullTxt.includes('circuit') || fullTxt.includes('losange')) scenarioId = 'scenario-circuit-passes-appui';
        else scenarioId = 'scenario-duel-1v1';
      }

      if (!generatedSvg.includes('data-scenario-id=')) {
        generatedSvg = generatedSvg.replace(/<svg\b/i, `<svg data-scenario-id="${scenarioId}" `);
      }

      return res.json({ success: true, svg: generatedSvg, scenarioId });
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
