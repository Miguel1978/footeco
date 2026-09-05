import React, { useState, useMemo } from 'react';
import { 
  Sparkles, 
  X, 
  Check, 
  Layers, 
  Shield, 
  Flame, 
  ArrowRight, 
  RefreshCw, 
  Loader2, 
  BookOpen, 
  Award, 
  Sliders, 
  Zap, 
  HelpCircle,
  Search,
  Target,
  Compass,
  Footprints,
  Crosshair,
  MoveHorizontal,
  ChevronRight,
  ExternalLink,
  Play
} from 'lucide-react';
import { TrainingSession } from '../types';
import { 
  ASF_THEMATIC_PRESETS, 
  ASFThematicPreset, 
  ASFThemeCategory,
  generateFullSessionWithAI 
} from '../utils/aiTrainingGenerator';
import { getAvailableSeasons, getSeasonFromDate } from '../utils/season';
import { ExerciseAnimationModal } from './ExerciseAnimationModal';

interface AITrainingGeneratorModalProps {
  isOpen: boolean;
  onClose: () => void;
  onApplySession: (session: TrainingSession) => void;
  defaultCoach?: string;
  defaultAssistantCoach?: string;
  defaultCategory?: string;
  defaultSeason?: string;
}

export const AITrainingGeneratorModal: React.FC<AITrainingGeneratorModalProps> = ({
  isOpen,
  onClose,
  onApplySession,
  defaultCoach = 'Sébastien M.',
  defaultAssistantCoach = 'Miguel R.',
  defaultCategory = 'FE12 Bas-Valais',
  defaultSeason,
}) => {
  const [selectedPreset, setSelectedPreset] = useState<ASFThematicPreset | null>(ASF_THEMATIC_PRESETS[0]);
  const [themeTitle, setThemeTitle] = useState(ASF_THEMATIC_PRESETS[0].label);
  const [phase, setPhase] = useState<'DEF' | 'OFF' | 'DEF & OFF'>(ASF_THEMATIC_PRESETS[0].phase);
  const [category, setCategory] = useState(defaultCategory);
  const [coach, setCoach] = useState(defaultCoach);
  const [assistantCoach, setAssistantCoach] = useState(defaultAssistantCoach);
  const [season, setSeason] = useState(defaultSeason || getSeasonFromDate());
  const [specificInstructions, setSpecificInstructions] = useState(ASF_THEMATIC_PRESETS[0].defaultPrompt);

  // Mode: 'catalog' for ASF library or 'clubcorner' for ClubCorner import
  const [generatorMode, setGeneratorMode] = useState<'catalog' | 'clubcorner'>('catalog');
  const [clubCornerText, setClubCornerText] = useState('');

  // Filters for thematic presets library
  const [selectedCategoryTab, setSelectedCategoryTab] = useState<'Tous' | ASFThemeCategory>('Tous');
  const [presetSearch, setPresetSearch] = useState('');
  const [phaseFilter, setPhaseFilter] = useState<'all' | 'DEF' | 'OFF' | 'DEF & OFF'>('all');

  const [isLoading, setIsLoading] = useState(false);
  const [generatedSession, setGeneratedSession] = useState<TrainingSession | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [animModalData, setAnimModalData] = useState<{
    isOpen: boolean;
    title: string;
    description: string;
    focus: string;
  }>({
    isOpen: false,
    title: '',
    description: '',
    focus: '',
  });

  const categoriesList: Array<{ id: 'Tous' | ASFThemeCategory; label: string; icon: string }> = [
    { id: 'Tous', label: 'Tous les thèmes', icon: '🌟' },
    { id: 'Passe', label: 'Passe & Jeu combiné', icon: '🎯' },
    { id: 'Dribble', label: 'Dribble & 1c1', icon: '⚡' },
    { id: 'Tir / Finition', label: 'Tir & Finition', icon: '🥅' },
    { id: 'Technique', label: 'Technique & Motricité', icon: '⚽' },
    { id: 'Tactique', label: 'Tactique & Principes', icon: '🧠' },
    { id: 'Défense', label: 'Défense & Récupération', icon: '🛡️' },
    { id: 'Transition', label: 'Transitions (3s)', icon: '🔄' },
  ];

  const filteredPresets = useMemo(() => {
    return ASF_THEMATIC_PRESETS.filter((preset) => {
      // Category filter
      if (selectedCategoryTab !== 'Tous' && preset.category !== selectedCategoryTab) {
        return false;
      }
      // Phase filter
      if (phaseFilter !== 'all' && preset.phase !== phaseFilter) {
        return false;
      }
      // Search term filter with keyword aliases
      if (presetSearch.trim()) {
        const query = presetSearch.toLowerCase().trim();
        const tokens = query.split(/\s+/).filter(Boolean);
        const text = [preset.label, preset.description, preset.category, preset.defaultPrompt, preset.phase].join(' ').toLowerCase();

        return tokens.every(token => {
          if (text.includes(token)) return true;
          if ((token === '1v1' || token === '1c1' || token === 'duel') && (text.includes('1c1') || text.includes('1v1') || text.includes('duel') || text.includes('1 contre 1'))) return true;
          if ((token === 'dribble' || token === 'feinte' || token === 'conduite') && (text.includes('dribble') || text.includes('feinte') || text.includes('conduite') || text.includes('élimination'))) return true;
          if ((token === 'transition' || token === '3s' || token === 'contre') && (text.includes('transition') || text.includes('3s') || text.includes('contre-attaque') || text.includes('récupération'))) return true;
          if ((token === 'passe' || token === 'rondo' || token === 'possession') && (text.includes('passe') || text.includes('combin') || text.includes('conservation') || text.includes('possession'))) return true;
          if ((token === 'tir' || token === 'frappe' || token === 'finition') && (text.includes('tir') || text.includes('frappe') || text.includes('finition') || text.includes('but'))) return true;
          if ((token === 'defense' || token === 'défense' || token === 'pressing') && (text.includes('défense') || text.includes('defense') || text.includes('pressing') || text.includes('cadrage'))) return true;
          return false;
        });
      }
      return true;
    });
  }, [selectedCategoryTab, phaseFilter, presetSearch]);

  if (!isOpen) return null;

  const handleSelectPreset = (preset: ASFThematicPreset) => {
    setSelectedPreset(preset);
    setThemeTitle(preset.label);
    setPhase(preset.phase);
    setSpecificInstructions(preset.defaultPrompt);
  };

  const handleGenerate = async () => {
    setIsLoading(true);
    setErrorMessage(null);
    try {
      const session = await generateFullSessionWithAI({
        themeTitle,
        category,
        phase,
        coach,
        assistantCoach,
        season,
        specificInstructions,
      });
      setGeneratedSession(session);
    } catch (err: any) {
      console.error(err);
      setErrorMessage(err.message || 'Impossible de contacter le service IA FootEco. Réessayez.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleConfirmApply = () => {
    if (!generatedSession) return;
    onApplySession(generatedSession);
    onClose();
  };

  const getCategoryBadgeClass = (cat: ASFThemeCategory) => {
    switch (cat) {
      case 'Passe':
        return 'bg-emerald-100 text-emerald-800 border-emerald-200';
      case 'Dribble':
        return 'bg-amber-100 text-amber-800 border-amber-200';
      case 'Tir / Finition':
        return 'bg-rose-100 text-rose-800 border-rose-200';
      case 'Technique':
        return 'bg-violet-100 text-violet-800 border-violet-200';
      case 'Tactique':
        return 'bg-blue-100 text-blue-800 border-blue-200';
      case 'Défense':
        return 'bg-slate-200 text-slate-800 border-slate-300';
      case 'Transition':
        return 'bg-teal-100 text-teal-800 border-teal-200';
      default:
        return 'bg-slate-100 text-slate-800 border-slate-200';
    }
  };

  return (
    <div className="fixed inset-0 z-60 flex items-center justify-center p-2 sm:p-4 bg-slate-950/80 backdrop-blur-xs animate-in fade-in duration-200">
      <div className="bg-white rounded-2xl shadow-2xl border border-slate-300 w-full max-w-5xl max-h-[92vh] flex flex-col overflow-hidden text-slate-800">
        
        {/* Header with ASF Swiss Football Branding */}
        <div className="bg-gradient-to-r from-red-700 via-red-800 to-slate-900 text-white px-6 py-4 flex items-center justify-between shadow-md">
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-xl bg-white/10 backdrop-blur-xs border border-white/20 text-amber-300">
              <Sparkles className="w-6 h-6" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-base sm:text-lg font-black tracking-tight">
                  Générateur IA de Séances FootEco ASF
                </h2>
                <span className="bg-red-500/80 text-white font-extrabold text-[10px] px-2 py-0.5 rounded-full uppercase tracking-wider border border-white/20">
                  Philosophie ASF / FE12
                </span>
              </div>
              <p className="text-xs text-red-100/80">
                Génération intelligente selon les thèmes officiels : Technique, Tactique, Passe, Dribble, Tir et Défense
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <a
              href="https://clubcorner.ch/trainer/teams/61043/uebungsbibliothek"
              target="_blank"
              rel="noopener noreferrer"
              className="hidden sm:flex items-center gap-1.5 px-3 py-1.5 bg-white/10 hover:bg-white/20 text-white rounded-xl text-xs font-bold border border-white/20 transition-all shadow-2xs group"
              title="Ouvrir la bibliothèque d'exercices officielle ClubCorner ASF de l'équipe (61043)"
            >
              <BookOpen className="w-3.5 h-3.5 text-amber-300" />
              <span>ClubCorner Bibliothèque</span>
              <ExternalLink className="w-3 h-3 text-white/70 group-hover:translate-x-0.5 transition-transform" />
            </a>

            <button
              onClick={onClose}
              className="p-1.5 rounded-xl text-white/70 hover:text-white hover:bg-white/10 transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Content Body */}
        <div className="flex-1 overflow-y-auto p-4 sm:p-6 space-y-6">
          
          {/* Main Mode Selector: Catalog vs ClubCorner Import */}
          <div className="grid grid-cols-2 gap-2 p-1 bg-slate-100 rounded-2xl border border-slate-200">
            <button
              type="button"
              onClick={() => setGeneratorMode('catalog')}
              className={`py-2.5 px-4 rounded-xl font-black text-xs flex items-center justify-center gap-2 transition-all cursor-pointer ${
                generatorMode === 'catalog'
                  ? 'bg-white text-red-900 shadow-xs border border-slate-200/80'
                  : 'text-slate-600 hover:text-slate-900 hover:bg-slate-200/60'
              }`}
            >
              <Zap className="w-3.5 h-3.5 text-amber-500" />
              <span>1. Catalogue des Thèmes Officiels ASF ({ASF_THEMATIC_PRESETS.length})</span>
            </button>

            <button
              type="button"
              onClick={() => setGeneratorMode('clubcorner')}
              className={`py-2.5 px-4 rounded-xl font-black text-xs flex items-center justify-center gap-2 transition-all cursor-pointer ${
                generatorMode === 'clubcorner'
                  ? 'bg-red-700 text-white shadow-xs'
                  : 'text-slate-600 hover:text-slate-900 hover:bg-slate-200/60'
              }`}
            >
              <BookOpen className="w-3.5 h-3.5 text-amber-300" />
              <span>2. Importer / Coller depuis ClubCorner.ch</span>
            </button>
          </div>
          
          {/* ASF Methodology Principles Banner */}
          <div className="bg-gradient-to-br from-red-50 to-amber-50 border border-red-200/80 rounded-2xl p-4 text-xs">
            <div className="flex items-center gap-2 font-black text-red-900 mb-2">
              <Award className="w-4 h-4 text-red-700" />
              <span>Piliers Méthodologiques de l'Association Suisse de Football (ASF FootEco)</span>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-slate-700">
              <div className="bg-white/80 rounded-xl p-2.5 border border-red-100 shadow-2xs">
                <span className="font-extrabold text-red-800 block mb-0.5">1. Jouer - Jouer - Jouer</span>
                <p className="text-[11px] text-slate-600 leading-tight">
                  0 temps mort, intensité élevée, volume de répétitions et de touches de balle maximal.
                </p>
              </div>
              <div className="bg-white/80 rounded-xl p-2.5 border border-red-100 shadow-2xs">
                <span className="font-extrabold text-red-800 block mb-0.5">2. Structure en 3 Parties</span>
                <p className="text-[11px] text-slate-600 leading-tight">
                  Partie Initiale (TE/KO) → Formes Jouées (TA) → Jeu Final d'application (TE/TA 6v6).
                </p>
              </div>
              <div className="bg-white/80 rounded-xl p-2.5 border border-red-100 shadow-2xs">
                <span className="font-extrabold text-red-800 block mb-0.5">3. Pédagogie Active</span>
                <p className="text-[11px] text-slate-600 leading-tight">
                  Questionnement ouvert, autonomie, prise d'initiative et coaching individuel par poste.
                </p>
              </div>
            </div>
          </div>

          {!generatedSession ? (
            /* CONFIGURATION VIEW */
            <div className="space-y-6">
              
              {/* VIEW A: CATALOG ASF PRESETS */}
              {generatorMode === 'catalog' && (
                <div className="space-y-3">
                  <div className="flex flex-wrap items-center justify-between gap-2">
                    <label className="font-black text-xs text-slate-800 uppercase tracking-wider flex items-center gap-1.5">
                      <Zap className="w-3.5 h-3.5 text-amber-600" />
                      <span>1. Choisir un Thème de Séance ASF ({filteredPresets.length} disponibles)</span>
                    </label>

                    {/* Search Bar */}
                    <div className="relative w-full sm:w-64">
                      <Search className="w-3.5 h-3.5 absolute left-2.5 top-1/2 -translate-y-1/2 text-slate-400" />
                      <input
                        type="text"
                        value={presetSearch}
                        onChange={(e) => setPresetSearch(e.target.value)}
                        placeholder="Rechercher (ex: passe, 1c1, tir, centre...)"
                        className="w-full bg-slate-50 border border-slate-300 rounded-xl pl-8 pr-3 py-1.5 text-xs font-semibold focus:bg-white focus:outline-none focus:border-red-500"
                      />
                      {presetSearch && (
                        <button
                          type="button"
                          onClick={() => setPresetSearch('')}
                          className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
                        >
                          <X className="w-3 h-3" />
                        </button>
                      )}
                    </div>
                  </div>

                  {/* Category Tabs */}
                  <div className="flex items-center gap-1.5 overflow-x-auto pb-1 scrollbar-thin">
                    {categoriesList.map((cat) => {
                      const isActive = selectedCategoryTab === cat.id;
                      const count = cat.id === 'Tous' 
                        ? ASF_THEMATIC_PRESETS.length 
                        : ASF_THEMATIC_PRESETS.filter(p => p.category === cat.id).length;

                      return (
                        <button
                          key={cat.id}
                          type="button"
                          onClick={() => setSelectedCategoryTab(cat.id)}
                          className={`px-3 py-1.5 rounded-xl text-xs font-black whitespace-nowrap flex items-center gap-1.5 transition-all cursor-pointer ${
                            isActive
                              ? 'bg-red-700 text-white shadow-xs'
                              : 'bg-slate-100 hover:bg-slate-200 text-slate-700 border border-slate-200'
                          }`}
                        >
                          <span>{cat.icon}</span>
                          <span>{cat.label}</span>
                          <span className={`text-[10px] px-1.5 py-0.2 rounded-full font-bold ${
                            isActive ? 'bg-white/20 text-white' : 'bg-slate-200 text-slate-600'
                          }`}>
                            {count}
                          </span>
                        </button>
                      );
                    })}
                  </div>

                  {/* Presets Cards Grid */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2.5 max-h-72 overflow-y-auto p-1 bg-slate-50/50 rounded-2xl border border-slate-200">
                    {filteredPresets.map((preset) => {
                      const isSelected = selectedPreset?.id === preset.id;
                      return (
                        <button
                          key={preset.id}
                          type="button"
                          onClick={() => handleSelectPreset(preset)}
                          className={`text-left p-3 rounded-xl border transition-all flex flex-col justify-between cursor-pointer ${
                            isSelected
                              ? 'bg-red-50 border-red-500 text-red-950 ring-2 ring-red-400/30 shadow-xs'
                              : 'bg-white border-slate-200 text-slate-700 hover:bg-slate-50 hover:border-slate-300'
                          }`}
                        >
                          <div>
                            <div className="flex items-center justify-between gap-1 mb-1.5">
                              <span className={`text-[9px] font-extrabold px-2 py-0.5 rounded-md border uppercase ${getCategoryBadgeClass(preset.category)}`}>
                                {preset.category}
                              </span>
                              <span className={`text-[9px] font-extrabold px-1.5 py-0.5 rounded uppercase ${
                                preset.phase === 'DEF' 
                                  ? 'bg-amber-100 text-amber-900 border border-amber-200' 
                                  : preset.phase === 'OFF' 
                                  ? 'bg-blue-100 text-blue-900 border border-blue-200' 
                                  : 'bg-purple-100 text-purple-900 border border-purple-200'
                              }`}>
                                {preset.phase}
                              </span>
                            </div>
                            <span className="font-extrabold text-xs leading-snug block mb-1">
                              {preset.label}
                            </span>
                          </div>
                          <p className="text-[10px] text-slate-500 line-clamp-2 leading-relaxed">
                            {preset.description}
                          </p>
                        </button>
                      );
                    })}
                    {filteredPresets.length === 0 && (
                      <div className="col-span-full py-8 text-center text-slate-400 text-xs font-semibold">
                        Aucun thème ne correspond à votre recherche "{presetSearch}".
                      </div>
                    )}
                  </div>
                </div>
              )}

              {/* VIEW B: IMPORT FROM CLUBCORNER */}
              {generatorMode === 'clubcorner' && (
                <div className="bg-gradient-to-br from-red-50 via-white to-slate-50 border-2 border-red-200 rounded-2xl p-5 space-y-4 shadow-sm">
                  <div className="flex flex-wrap items-center justify-between gap-3">
                    <div className="flex items-center gap-2.5">
                      <div className="p-2 rounded-xl bg-red-700 text-white shadow-xs">
                        <BookOpen className="w-5 h-5" />
                      </div>
                      <div>
                        <h4 className="font-black text-sm text-red-950">
                          Bibliothèque d'Exercices ClubCorner ASF (Équipe 61043)
                        </h4>
                        <p className="text-xs text-slate-600">
                          Copiez le texte ou le lien d'un exercice ClubCorner pour créer la fiche officielle FootEco
                        </p>
                      </div>
                    </div>

                    <a
                      href="https://clubcorner.ch/trainer/teams/61043/uebungsbibliothek"
                      target="_blank"
                      rel="noopener noreferrer"
                      className="px-3.5 py-2 bg-red-700 hover:bg-red-800 text-white rounded-xl text-xs font-bold flex items-center gap-1.5 shadow-sm transition-all cursor-pointer group"
                    >
                      <BookOpen className="w-3.5 h-3.5" />
                      <span>Ouvrir ClubCorner.ch</span>
                      <ExternalLink className="w-3 h-3 text-red-200 group-hover:translate-x-0.5 transition-transform" />
                    </a>
                  </div>

                  {/* Quick ClubCorner Drill Templates */}
                  <div>
                    <label className="block font-bold text-xs text-slate-700 mb-2">
                      💡 Ou chargez un modèle type ClubCorner ASF en 1 clic :
                    </label>
                    <div className="flex flex-wrap gap-1.5">
                      {[
                        {
                          title: 'Rondo 4v2 avec transition rapide (3s)',
                          phase: 'DEF & OFF' as const,
                          desc: 'Conservation de balle à 4 contre 2 avec 2 touches max. À la récupération, les 2 défenseurs doivent trouver une passe verticale vers un mini-but en moins de 3 secondes.'
                        },
                        {
                          title: 'Duels 1c1 offensif et finition sous pression',
                          phase: 'OFF' as const,
                          desc: 'L\'attaquant reçoit le ballon dos au but, effectue une feinte de corps pour se retourner et éliminer le défenseur avant de frapper dans les 4 secondes.'
                        },
                        {
                          title: 'Jeu combiné dédoublements & centres au sol',
                          phase: 'OFF' as const,
                          desc: 'Circuit de passes avec une-deux sur l\'aile, dédoublement du latéral, centre tendu au 1er poteau et reprise en une touche avec opposition d\'un défenseur.'
                        },
                        {
                          title: 'Pressing en bloc médian & fermeture de l\'axe',
                          phase: 'DEF' as const,
                          desc: 'Les défenseurs coulissent en bloc, orientent la relance adverse vers l\'extérieur et déclenchent le pressing à la passe latérale pour intercepter.'
                        },
                        {
                          title: 'Jeu de position 6v6 + 2 jokers (largeur et profondeur)',
                          phase: 'OFF' as const,
                          desc: 'Jeu de possession sur terrain réduit avec 2 appuis extérieurs. L\'objectif est de fixer d\'un côté pour trouver le joker libre dans l\'intervalle opposé.'
                        }
                      ].map((item, idx) => (
                        <button
                          key={idx}
                          type="button"
                          onClick={() => {
                            setThemeTitle(item.title);
                            setPhase(item.phase);
                            setClubCornerText(item.desc);
                            setSpecificInstructions(`Exercice ClubCorner : ${item.title}\nDescription : ${item.desc}\nAppliquer la règle des 3 parties FootEco (TE/KO, TA, Jeu final).`);
                          }}
                          className="px-2.5 py-1 bg-white hover:bg-red-50 hover:border-red-300 text-slate-700 border border-slate-200 rounded-lg text-xs font-semibold transition-colors cursor-pointer text-left"
                        >
                          {item.title}
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* Textarea for pasting ClubCorner content */}
                  <div>
                    <label className="block font-bold text-xs text-slate-700 mb-1">
                      Coller les détails, consignes ou notes de votre exercice ClubCorner :
                    </label>
                    <textarea
                      rows={3}
                      value={clubCornerText}
                      onChange={(e) => {
                        const val = e.target.value;
                        setClubCornerText(val);
                        setSpecificInstructions(`Exercice importé depuis ClubCorner : \n${val}\n\nStructurer obligatoirement selon les 3 parties FootEco (Partie Initiale TE/KO avec 2 ateliers, Formes Jouées TA avec 2 ateliers, Jeu Final 6v6).`);
                        if (!themeTitle || themeTitle === ASF_THEMATIC_PRESETS[0].label) {
                          const firstLine = val.split('\n')[0].replace(/[#*-]/g, '').trim();
                          if (firstLine && firstLine.length < 80) {
                            setThemeTitle(firstLine);
                          }
                        }
                      }}
                      placeholder="Exemple : Collez ici l'intitulé, les règles, le nombre de joueurs (ex: 4v2, 6v6), les dimensions du terrain ou les objectifs pédagogiques relevés sur ClubCorner..."
                      className="w-full bg-white border border-slate-300 rounded-xl p-3 text-xs font-medium focus:border-red-500 focus:outline-none shadow-inner"
                    />
                  </div>
                </div>
              )}

              {/* 2. Custom Parameters Form */}
              <div className="bg-slate-50 rounded-2xl p-4 sm:p-5 border border-slate-200 space-y-4">
                <label className="block font-black text-xs text-slate-800 uppercase tracking-wider flex items-center gap-1.5">
                  <Sliders className="w-3.5 h-3.5 text-slate-600" />
                  <span>2. Paramètres et personnalisation de la séance</span>
                </label>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-xs">
                  <div className="sm:col-span-2">
                    <label className="block font-bold text-slate-700 mb-1">Intitulé / Thème spécifique de la séance</label>
                    <input
                      type="text"
                      value={themeTitle}
                      onChange={(e) => setThemeTitle(e.target.value)}
                      placeholder="Ex: Passes courtes au sol, appuis et première touche orientée"
                      className="w-full bg-white border border-slate-300 rounded-xl px-3 py-2 font-bold focus:border-red-500 focus:outline-none"
                    />
                  </div>

                  <div>
                    <label className="block font-bold text-slate-700 mb-1">Phase Tactique dominante</label>
                    <select
                      value={phase}
                      onChange={(e) => setPhase(e.target.value as any)}
                      className="w-full bg-white border border-slate-300 rounded-xl px-3 py-2 font-bold focus:border-red-500 focus:outline-none"
                    >
                      <option value="OFF">Offensive (OFF - Créer espace, 1c1, finition)</option>
                      <option value="DEF">Défensive (DEF - Freiner, orienter, fermer)</option>
                      <option value="DEF & OFF">Transition (DEF & OFF - Règle des 3s)</option>
                    </select>
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-xs">
                  <div>
                    <label className="block font-bold text-slate-700 mb-1">Catégorie / Équipe</label>
                    <input
                      type="text"
                      value={category}
                      onChange={(e) => setCategory(e.target.value)}
                      placeholder="FE12 Bas-Valais"
                      className="w-full bg-white border border-slate-300 rounded-xl px-3 py-2 font-bold focus:border-red-500 focus:outline-none"
                    />
                  </div>

                  <div>
                    <label className="block font-bold text-slate-700 mb-1">Entraîneur responsable</label>
                    <input
                      type="text"
                      value={coach}
                      onChange={(e) => setCoach(e.target.value)}
                      placeholder="Sébastien M."
                      className="w-full bg-white border border-slate-300 rounded-xl px-3 py-2 font-semibold focus:border-red-500 focus:outline-none"
                    />
                  </div>

                  <div>
                    <label className="block font-bold text-slate-700 mb-1">Entraîneur adjoint</label>
                    <input
                      type="text"
                      value={assistantCoach}
                      onChange={(e) => setAssistantCoach(e.target.value)}
                      placeholder="Miguel R."
                      className="w-full bg-white border border-slate-300 rounded-xl px-3 py-2 font-semibold focus:border-red-500 focus:outline-none"
                    />
                  </div>
                </div>

                <div>
                  <label className="block font-bold text-slate-700 mb-1 text-xs">
                    Consignes / Points d'attention particuliers de l'entraîneur (optionnel)
                  </label>
                  <textarea
                    rows={2}
                    value={specificInstructions}
                    onChange={(e) => setSpecificInstructions(e.target.value)}
                    placeholder="Ex: Insister sur la première touche vers l'avant, le pied faible et la communication entre partenaires..."
                    className="w-full bg-white border border-slate-300 rounded-xl p-2.5 text-xs font-medium focus:border-red-500 focus:outline-none"
                  />
                </div>
              </div>

              {errorMessage && (
                <div className="p-3 bg-red-50 border border-red-300 rounded-xl text-red-800 text-xs font-semibold">
                  {errorMessage}
                </div>
              )}

            </div>
          ) : (
            /* PREVIEW OF GENERATED SESSION */
            <div className="space-y-4 animate-in fade-in">
              <div className="flex items-center justify-between bg-emerald-50 border border-emerald-300 p-3 rounded-xl text-xs">
                <div className="flex items-center gap-2 text-emerald-950 font-extrabold">
                  <Check className="w-4 h-4 text-emerald-700" />
                  <span>Séance FootEco générée avec succès selon les critères ASF !</span>
                </div>
                <button
                  onClick={() => setGeneratedSession(null)}
                  className="text-emerald-800 hover:text-emerald-950 font-bold underline cursor-pointer"
                >
                  Modifier les paramètres
                </button>
              </div>

              {/* Summary Card */}
              <div className="bg-slate-50 border border-slate-200 rounded-2xl p-5 space-y-4">
                <div>
                  <span className="text-[10px] font-black uppercase text-red-700 tracking-wider">
                    {generatedSession.team} • Saison {generatedSession.season}
                  </span>
                  <h3 className="text-base font-black text-slate-900 mt-0.5">
                    {generatedSession.title}
                  </h3>
                </div>

                {/* Themes */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-xs">
                  <div className="bg-amber-50/80 border border-amber-200 p-3 rounded-xl">
                    <span className="font-extrabold text-amber-900 block mb-1">Thème TE (Technique)</span>
                    <p className="text-slate-800 font-medium">{generatedSession.themeTE.description}</p>
                    <p className="text-amber-800 text-[11px] mt-1 font-semibold">
                      Accents : {generatedSession.themeTE.coachingAccents}
                    </p>
                  </div>

                  <div className="bg-blue-50/80 border border-blue-200 p-3 rounded-xl">
                    <span className="font-extrabold text-blue-900 block mb-1">
                      Thème TA (Tactique - {generatedSession.themeTA.defOrOff})
                    </span>
                    <p className="text-slate-800 font-medium">{generatedSession.themeTA.description}</p>
                    <p className="text-blue-800 text-[11px] mt-1 font-semibold">
                      Antagonisme : {generatedSession.themeTA.antagonism}
                    </p>
                  </div>
                </div>

                {/* 3 Exercises preview */}
                <div className="space-y-2">
                  <span className="font-extrabold text-xs text-slate-800">
                    Déroulement FootEco en 3 Parties :
                  </span>
                  
                  {/* Part 1 */}
                  <div className="bg-white border border-slate-200 rounded-xl p-3 text-xs flex gap-3">
                    <div className="flex-1">
                      <div className="flex items-center justify-between font-bold text-slate-800 mb-1">
                        <span>1. {generatedSession.initialPart.title}</span>
                        <div className="flex items-center gap-2">
                          <button
                            type="button"
                            onClick={() => setAnimModalData({
                              isOpen: true,
                              title: generatedSession.initialPart.title,
                              description: generatedSession.initialPart.description,
                              focus: generatedSession.themeTE.description
                            })}
                            className="px-2 py-0.5 bg-red-50 hover:bg-red-100 text-red-700 border border-red-200 rounded-md text-[10px] font-black flex items-center gap-1 transition-colors cursor-pointer"
                            title="Voir l'animation de cet atelier"
                          >
                            <Play className="w-2.5 h-2.5 fill-red-600 text-red-600" />
                            <span>Animation</span>
                          </button>
                          <span className="text-[11px] text-slate-500">{generatedSession.initialPart.duration}</span>
                        </div>
                      </div>
                      <p className="text-slate-600 line-clamp-2 text-[11px] whitespace-pre-line">
                        {generatedSession.initialPart.description}
                      </p>
                    </div>
                    {generatedSession.initialPart.drawing1?.image && (
                      <div 
                        className="w-16 h-12 flex-shrink-0 bg-emerald-800 rounded-lg overflow-hidden border border-emerald-700 shadow-2xs"
                        dangerouslySetInnerHTML={{ __html: generatedSession.initialPart.drawing1.image }}
                      />
                    )}
                  </div>

                  {/* Part 2 */}
                  <div className="bg-white border border-slate-200 rounded-xl p-3 text-xs flex gap-3">
                    <div className="flex-1">
                      <div className="flex items-center justify-between font-bold text-slate-800 mb-1">
                        <span>2. {generatedSession.playedForms.title}</span>
                        <div className="flex items-center gap-2">
                          <button
                            type="button"
                            onClick={() => setAnimModalData({
                              isOpen: true,
                              title: generatedSession.playedForms.title,
                              description: generatedSession.playedForms.description,
                              focus: generatedSession.themeTA.description
                            })}
                            className="px-2 py-0.5 bg-red-50 hover:bg-red-100 text-red-700 border border-red-200 rounded-md text-[10px] font-black flex items-center gap-1 transition-colors cursor-pointer"
                            title="Voir l'animation de cet atelier"
                          >
                            <Play className="w-2.5 h-2.5 fill-red-600 text-red-600" />
                            <span>Animation</span>
                          </button>
                          <span className="text-[11px] text-slate-500">{generatedSession.playedForms.duration}</span>
                        </div>
                      </div>
                      <p className="text-slate-600 line-clamp-2 text-[11px] whitespace-pre-line">
                        {generatedSession.playedForms.description}
                      </p>
                    </div>
                    {generatedSession.playedForms.drawing1?.image && (
                      <div 
                        className="w-16 h-12 flex-shrink-0 bg-emerald-800 rounded-lg overflow-hidden border border-emerald-700 shadow-2xs"
                        dangerouslySetInnerHTML={{ __html: generatedSession.playedForms.drawing1.image }}
                      />
                    )}
                  </div>

                  {/* Part 3 */}
                  <div className="bg-white border border-slate-200 rounded-xl p-3 text-xs flex gap-3">
                    <div className="flex-1">
                      <div className="flex items-center justify-between font-bold text-slate-800 mb-1">
                        <span>3. {generatedSession.finalGame.title}</span>
                        <div className="flex items-center gap-2">
                          <button
                            type="button"
                            onClick={() => setAnimModalData({
                              isOpen: true,
                              title: generatedSession.finalGame.title,
                              description: generatedSession.finalGame.description,
                              focus: generatedSession.themeTE.description
                            })}
                            className="px-2 py-0.5 bg-red-50 hover:bg-red-100 text-red-700 border border-red-200 rounded-md text-[10px] font-black flex items-center gap-1 transition-colors cursor-pointer"
                            title="Voir l'animation de cet atelier"
                          >
                            <Play className="w-2.5 h-2.5 fill-red-600 text-red-600" />
                            <span>Animation</span>
                          </button>
                          <span className="text-[11px] text-slate-500">{generatedSession.finalGame.duration}</span>
                        </div>
                      </div>
                      <p className="text-slate-600 line-clamp-2 text-[11px] whitespace-pre-line">
                        {generatedSession.finalGame.description}
                      </p>
                    </div>
                    {generatedSession.finalGame.drawing1?.image && (
                      <div 
                        className="w-16 h-12 flex-shrink-0 bg-emerald-800 rounded-lg overflow-hidden border border-emerald-700 shadow-2xs"
                        dangerouslySetInnerHTML={{ __html: generatedSession.finalGame.drawing1.image }}
                      />
                    )}
                  </div>
                </div>

                {/* Individualization */}
                <div className="bg-white border border-slate-200 rounded-xl p-3 text-xs">
                  <span className="font-extrabold text-slate-800 block mb-0.5">
                    Individualisation & Bilan ASF :
                  </span>
                  <p className="text-[11px] text-slate-600">
                    {generatedSession.remarksAndIndividualization}
                  </p>
                </div>
              </div>
            </div>
          )}

        </div>

        {/* Footer Actions */}
        <div className="bg-slate-100 border-t border-slate-200 px-6 py-3.5 flex items-center justify-between">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 bg-white hover:bg-slate-200 text-slate-700 rounded-xl text-xs font-bold transition-colors border border-slate-300 cursor-pointer"
          >
            Fermer
          </button>

          {!generatedSession ? (
            <button
              type="button"
              onClick={handleGenerate}
              disabled={isLoading || !themeTitle.trim()}
              className="px-5 py-2.5 bg-gradient-to-r from-red-600 to-red-700 hover:from-red-500 hover:to-red-600 text-white rounded-xl text-xs font-black flex items-center gap-2 transition-all shadow-md active:scale-95 disabled:opacity-50 cursor-pointer"
            >
              {isLoading ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin text-white" />
                  <span>Génération selon la philosophie ASF...</span>
                </>
              ) : (
                <>
                  <Sparkles className="w-4 h-4 text-amber-300" />
                  <span>Générer la séance FootEco (IA ASF)</span>
                </>
              )}
            </button>
          ) : (
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={handleGenerate}
                disabled={isLoading}
                className="px-3.5 py-2 bg-white hover:bg-slate-200 text-slate-700 rounded-xl text-xs font-bold transition-colors border border-slate-300 flex items-center gap-1.5 cursor-pointer"
              >
                <RefreshCw className={`w-3.5 h-3.5 ${isLoading ? 'animate-spin' : ''}`} />
                <span>Régénérer</span>
              </button>
              <button
                type="button"
                onClick={handleConfirmApply}
                className="px-5 py-2.5 bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl text-xs font-black flex items-center gap-2 transition-all shadow-md active:scale-95 cursor-pointer"
              >
                <Check className="w-4 h-4" />
                <span>Appliquer et Ouvrir la Fiche</span>
              </button>
            </div>
          )}
        </div>

      </div>

      {animModalData.isOpen && (
        <ExerciseAnimationModal
          isOpen={animModalData.isOpen}
          onClose={() => setAnimModalData(prev => ({ ...prev, isOpen: false }))}
          partTitle={animModalData.title}
          partDescription={animModalData.description}
          partFocus={animModalData.focus}
          category={category}
        />
      )}
    </div>
  );
};
