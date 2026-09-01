import express from "express";
import path from "path";
import { createServer as createViteServer } from "vite";
import { GoogleGenAI } from "@google/genai";
import dotenv from "dotenv";

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

// Resilient Gemini caller with supported models from @google/genai and deterministic fallback
async function generateContentWithFallback(options: {
  contents: string;
  systemInstruction?: string;
  temperature?: number;
  responseMimeType?: string;
}): Promise<string | null> {
  const ai = getAIClient();
  if (!ai) {
    return null;
  }

  // Official supported models in order of capability & speed
  const modelsToTry = [
    "gemini-3.7-flash",
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
          // Strip any potential markdown wrapper if present
          const cleanText = text.replace(/```json\n?/g, '').replace(/```\n?/g, '').trim();
          generatedJson = JSON.parse(cleanText);
        }
      } catch (aiErr) {
        console.warn("AI generation parser issue, using fallback structure:", aiErr);
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
          const cleanText = text.replace(/```json\n?/g, '').replace(/```\n?/g, '').trim();
          generated = JSON.parse(cleanText);
        }
      } catch (err) {
        console.warn("Exercise part AI fallback activated:", err);
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

      return res.json({ success: true, exercisePart: generated });
    } catch (err: any) {
      res.status(500).json({ error: err.message });
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
          const cleanText = text.replace(/```json\n?/g, '').replace(/```\n?/g, '').trim();
          generated = JSON.parse(cleanText);
        }
      } catch (err) {
        console.warn("Theme refine AI fallback activated:", err);
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
