import React, { useState, useRef, useMemo } from 'react';
import { 
  X, 
  Check, 
  Upload, 
  Sparkles, 
  Image as ImageIcon, 
  Trash2, 
  Palette, 
  UserCheck, 
  Flag, 
  CircleDot,
  RotateCcw,
  Search,
  Zap,
  Filter,
  Loader2,
  Wand2,
  Play
} from 'lucide-react';
import { DRILL_PRESETS, DrillPreset } from '../utils/pitchDiagrams';
import { loadCoachesHistory } from '../utils/storage';
import { generateDrillDiagramWithAI } from '../utils/aiTrainingGenerator';
import { ExerciseAnimationModal } from './ExerciseAnimationModal';

interface PitchTacticalCanvasModalProps {
  isOpen: boolean;
  onClose: () => void;
  initialImage?: string;
  initialCoach?: string;
  initialCaption?: string;
  partTitle: string;
  slotName: 'Dessin 1' | 'Dessin 2';
  exerciseDescription?: string;
  themeTitle?: string;
  category?: string;
  onSave: (drawingData: { image: string; coach?: string; caption?: string }) => void;
}

export const PitchTacticalCanvasModal: React.FC<PitchTacticalCanvasModalProps> = ({
  isOpen,
  onClose,
  initialImage = '',
  initialCoach = '',
  initialCaption = '',
  partTitle,
  slotName,
  exerciseDescription = '',
  themeTitle = '',
  category = 'FE12',
  onSave,
}) => {
  const [activeTab, setActiveTab] = useState<'presets' | 'upload' | 'ai'>('presets');
  const [selectedPresetId, setSelectedPresetId] = useState<string>('preset-init-1');
  const [previewImage, setPreviewImage] = useState<string>(initialImage || '');
  const [coachName, setCoachName] = useState<string>(initialCoach || '');
  const [caption, setCaption] = useState<string>(initialCaption || '');
  const [customCoaches] = useState<string[]>(() => loadCoachesHistory());

  // AI Diagram Generation State
  const [customPrompt, setCustomPrompt] = useState<string>('');
  const [isGeneratingAiDiagram, setIsGeneratingAiDiagram] = useState<boolean>(false);
  const [aiSuccessMessage, setAiSuccessMessage] = useState<string | null>(null);
  const [isAnimationOpen, setIsAnimationOpen] = useState<boolean>(false);

  // Search & Filter State
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [selectedKeywordFilter, setSelectedKeywordFilter] = useState<string>('all');

  // Interactive Canvas State
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const fileInputRef = useRef<HTMLInputElement | null>(null);

  const filterKeywordsList = [
    { id: 'all', label: 'Tous', icon: '⚽' },
    { id: '1v1', label: '1v1 / Duels', icon: '⚡' },
    { id: 'dribble', label: 'Dribble', icon: '🌀' },
    { id: 'transition', label: 'Transition (3s)', icon: '🔄' },
    { id: 'passe', label: 'Passe & Rondo', icon: '🎯' },
    { id: 'tir', label: 'Tir & Finition', icon: '🥅' },
    { id: 'pressing', label: 'Pressing', icon: '🛡️' },
    { id: '6v6', label: 'Match 6v6', icon: '🏆' },
  ];

  // Filtered Presets with keyword aliases
  const filteredPresets = useMemo(() => {
    return DRILL_PRESETS.filter((preset) => {
      // Keyword tag filter
      if (selectedKeywordFilter !== 'all') {
        const tag = selectedKeywordFilter.toLowerCase();
        const matchesTag = 
          preset.keywords?.some(k => k.includes(tag)) ||
          preset.title.toLowerCase().includes(tag) ||
          preset.description.toLowerCase().includes(tag);
        
        // Handle 1v1 <-> 1c1 alias
        if (tag === '1v1') {
          const matches1v1 = matchesTag || 
            preset.title.toLowerCase().includes('1c1') || 
            preset.title.toLowerCase().includes('1 contre 1') ||
            preset.description.toLowerCase().includes('1c1') ||
            preset.description.toLowerCase().includes('1 contre 1');
          if (!matches1v1) return false;
        } else if (!matchesTag) {
          return false;
        }
      }

      // Search query filter
      if (searchQuery.trim()) {
        const query = searchQuery.toLowerCase().trim();
        const searchTokens = query.split(/\s+/).filter(Boolean);

        return searchTokens.every(token => {
          // Check for common synonyms
          const is1v1Token = token === '1v1' || token === '1c1' || token === '1-1' || token === 'duel';
          const isDribbleToken = token === 'dribble' || token === 'dribles' || token === 'feinte' || token === 'conduite';
          const isTransitionToken = token === 'transition' || token === '3s' || token === 'contre-attaque';
          const isPassToken = token === 'passe' || token === 'rondo' || token === 'possession' || token === 'conservation';
          const isShotToken = token === 'tir' || token === 'frappe' || token === 'finition' || token === 'but';

          const textToSearch = [
            preset.title,
            preset.description,
            preset.category,
            preset.caption || '',
            preset.defaultCoach || '',
            ...(preset.keywords || []),
          ].join(' ').toLowerCase();

          if (textToSearch.includes(token)) return true;

          if (is1v1Token && (textToSearch.includes('1c1') || textToSearch.includes('1v1') || textToSearch.includes('duel') || textToSearch.includes('1 contre 1'))) return true;
          if (isDribbleToken && (textToSearch.includes('dribble') || textToSearch.includes('feinte') || textToSearch.includes('slalom') || textToSearch.includes('conduite'))) return true;
          if (isTransitionToken && (textToSearch.includes('transition') || textToSearch.includes('3s') || textToSearch.includes('contre-attaque') || textToSearch.includes('récupération'))) return true;
          if (isPassToken && (textToSearch.includes('passe') || textToSearch.includes('rondo') || textToSearch.includes('conservation') || textToSearch.includes('combinaison'))) return true;
          if (isShotToken && (textToSearch.includes('tir') || textToSearch.includes('frappe') || textToSearch.includes('finition') || textToSearch.includes('but'))) return true;

          return false;
        });
      }

      return true;
    });
  }, [searchQuery, selectedKeywordFilter]);

  if (!isOpen) return null;

  const handleSelectPreset = (preset: DrillPreset) => {
    setSelectedPresetId(preset.id);
    setPreviewImage(preset.svgContent);
    if (!coachName && preset.defaultCoach) {
      setCoachName(preset.defaultCoach);
    }
    if (!caption && preset.caption) {
      setCaption(preset.caption);
    }
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (event) => {
        const result = event.target?.result as string;
        if (result) {
          setPreviewImage(result);
        }
      };
      reader.readAsDataURL(file);
    }
  };

  const handleGenerateAiDrillDiagram = async () => {
    setIsGeneratingAiDiagram(true);
    setAiSuccessMessage(null);
    try {
      const generatedSvg = await generateDrillDiagramWithAI({
        exerciseTitle: caption || partTitle,
        description: exerciseDescription || '',
        slotName,
        coach: coachName,
        category,
        theme: themeTitle,
        customPrompt,
      });

      if (generatedSvg) {
        setPreviewImage(generatedSvg);
        if (!caption) {
          setCaption(partTitle || 'Atelier FootEco');
        }
        setAiSuccessMessage('Schéma tactique généré avec succès selon le détail de l\'exercice !');
        setTimeout(() => setAiSuccessMessage(null), 4000);
      }
    } catch (err) {
      console.error('Error generating AI diagram in modal:', err);
    } finally {
      setIsGeneratingAiDiagram(false);
    }
  };

  const handleConfirm = () => {
    onSave({
      image: previewImage,
      coach: coachName.trim(),
      caption: caption.trim(),
    });
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/70 backdrop-blur-xs animate-in fade-in duration-200">
      <div className="bg-white rounded-2xl shadow-2xl border border-slate-200 w-full max-w-3xl max-h-[90vh] flex flex-col overflow-hidden text-slate-800">
        
        {/* Modal Header */}
        <div className="px-6 py-4 border-b border-slate-200 bg-slate-50 flex items-center justify-between">
          <div>
            <div className="flex items-center gap-2">
              <span className="p-1.5 rounded-lg bg-emerald-100 text-emerald-800 text-sm font-bold">
                ⚽ Schéma Tactique
              </span>
              <h2 className="text-base font-extrabold text-slate-900">
                {partTitle} • {slotName}
              </h2>
            </div>
            <p className="text-xs text-slate-500 mt-0.5">
              Choisissez un schéma d'entraînement FootEco ou téléversez un visuel personnalisé
            </p>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={() => setIsAnimationOpen(true)}
              className="px-3 py-1.5 bg-gradient-to-r from-red-600 to-amber-600 hover:from-red-500 hover:to-amber-500 text-white font-extrabold rounded-xl text-xs flex items-center gap-1.5 shadow-xs cursor-pointer transition-all active:scale-95"
              title="Lancer l'animation de cet exercice pour explication détaillée"
            >
              <Play className="w-3.5 h-3.5 fill-white" />
              <span>Animer l'exercice</span>
            </button>
            <button
              onClick={onClose}
              className="p-1.5 rounded-xl text-slate-400 hover:text-slate-700 hover:bg-slate-200/60 transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Tab Navigation */}
        <div className="flex border-b border-slate-200 px-6 bg-white gap-4 text-xs font-bold">
          <button
            onClick={() => setActiveTab('presets')}
            className={`py-3 border-b-2 flex items-center gap-1.5 transition-colors ${
              activeTab === 'presets'
                ? 'border-emerald-600 text-emerald-700'
                : 'border-transparent text-slate-500 hover:text-slate-800'
            }`}
          >
            <Sparkles className="w-3.5 h-3.5" />
            <span>Modèles d'exercices FootEco</span>
          </button>
          <button
            onClick={() => setActiveTab('ai')}
            className={`py-3 border-b-2 flex items-center gap-1.5 transition-colors ${
              activeTab === 'ai'
                ? 'border-red-600 text-red-700 font-extrabold'
                : 'border-transparent text-slate-500 hover:text-slate-800'
            }`}
          >
            <Wand2 className="w-3.5 h-3.5 text-red-600" />
            <span>Générateur IA selon le détail de l'exercice</span>
          </button>
          <button
            onClick={() => setActiveTab('upload')}
            className={`py-3 border-b-2 flex items-center gap-1.5 transition-colors ${
              activeTab === 'upload'
                ? 'border-emerald-600 text-emerald-700'
                : 'border-transparent text-slate-500 hover:text-slate-800'
            }`}
          >
            <Upload className="w-3.5 h-3.5" />
            <span>Importer une image (PNG / JPG / SVG)</span>
          </button>
        </div>

        {/* Body Content */}
        <div className="flex-1 overflow-y-auto p-6 space-y-6">
          
          {activeTab === 'presets' && (
            <div className="space-y-4">
              
              {/* Search Bar & Keyword Filter Toolbar */}
              <div className="space-y-2.5 bg-slate-50 p-3.5 rounded-2xl border border-slate-200">
                <div className="flex items-center justify-between gap-2">
                  <label className="text-xs font-black text-slate-800 uppercase tracking-wider flex items-center gap-1.5">
                    <Filter className="w-3.5 h-3.5 text-emerald-600" />
                    <span>Bibliothèque d'exercices FootEco ({filteredPresets.length}/{DRILL_PRESETS.length})</span>
                  </label>

                  {/* Search Input */}
                  <div className="relative w-full sm:w-72">
                    <Search className="w-3.5 h-3.5 absolute left-2.5 top-1/2 -translate-y-1/2 text-slate-400" />
                    <input
                      type="text"
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      placeholder="Filtrer (ex: dribble, transition, 1v1, tir...)"
                      className="w-full bg-white border border-slate-300 rounded-xl pl-8 pr-7 py-1.5 text-xs font-semibold focus:outline-none focus:border-emerald-500 shadow-2xs"
                    />
                    {searchQuery && (
                      <button
                        type="button"
                        onClick={() => setSearchQuery('')}
                        className="absolute right-2 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 p-0.5"
                      >
                        <X className="w-3 h-3" />
                      </button>
                    )}
                  </div>
                </div>

                {/* Keyword Pills */}
                <div className="flex items-center gap-1.5 overflow-x-auto pb-1 scrollbar-thin">
                  {filterKeywordsList.map((item) => {
                    const isActive = selectedKeywordFilter === item.id;
                    return (
                      <button
                        key={item.id}
                        type="button"
                        onClick={() => setSelectedKeywordFilter(item.id)}
                        className={`px-2.5 py-1 rounded-xl text-xs font-bold whitespace-nowrap flex items-center gap-1 transition-all cursor-pointer ${
                          isActive
                            ? 'bg-emerald-600 text-white shadow-2xs'
                            : 'bg-white hover:bg-slate-100 text-slate-700 border border-slate-200'
                        }`}
                      >
                        <span>{item.icon}</span>
                        <span>{item.label}</span>
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Presets Cards Grid */}
              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3">
                {filteredPresets.map((preset) => {
                  const isSelected = selectedPresetId === preset.id || previewImage === preset.svgContent;
                  return (
                    <div
                      key={preset.id}
                      onClick={() => handleSelectPreset(preset)}
                      className={`cursor-pointer rounded-xl border p-2.5 flex flex-col justify-between transition-all text-left ${
                        isSelected
                          ? 'border-emerald-500 bg-emerald-50/50 ring-2 ring-emerald-500/20 shadow-xs'
                          : 'border-slate-200 hover:border-slate-300 bg-slate-50/40 hover:bg-slate-100/60'
                      }`}
                    >
                      <div>
                        <div className="w-full h-28 bg-slate-900/5 rounded-lg overflow-hidden flex items-center justify-center p-1 border border-slate-200/60 mb-2">
                          <div
                            className="w-full h-full flex items-center justify-center"
                            dangerouslySetInnerHTML={{ __html: preset.svgContent }}
                          />
                        </div>
                        <div className="font-bold text-xs text-slate-900 leading-tight">
                          {preset.title}
                        </div>
                        <p className="text-[10px] text-slate-500 line-clamp-2 mt-1">
                          {preset.description}
                        </p>
                      </div>

                      <div className="mt-2.5 space-y-1.5">
                        {/* Keyword tags */}
                        {preset.keywords && preset.keywords.length > 0 && (
                          <div className="flex flex-wrap gap-1">
                            {preset.keywords.slice(0, 3).map((kw, i) => (
                              <span key={i} className="text-[9px] font-bold px-1.5 py-0.2 bg-slate-100 text-slate-600 rounded border border-slate-200 uppercase">
                                {kw}
                              </span>
                            ))}
                          </div>
                        )}

                        {preset.defaultCoach && (
                          <div className="pt-1 border-t border-slate-200 flex items-center justify-between text-[10px] font-semibold text-slate-600">
                            <span>Coach suggéré :</span>
                            <span className="bg-slate-200 text-slate-800 px-1.5 py-0.2 rounded font-bold">
                              {preset.defaultCoach}
                            </span>
                          </div>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>

              {filteredPresets.length === 0 && (
                <div className="text-center py-10 bg-slate-50 rounded-2xl border border-slate-200 p-6">
                  <Search className="w-8 h-8 text-slate-300 mx-auto mb-2" />
                  <p className="text-xs font-bold text-slate-700">Aucun exercice ne correspond à votre recherche</p>
                  <p className="text-[11px] text-slate-500 mt-0.5 mb-3">
                    Essayez d'autres mots-clés comme 'dribble', 'transition', '1v1', 'passe' ou réinitialisez les filtres.
                  </p>
                  <button
                    type="button"
                    onClick={() => {
                      setSearchQuery('');
                      setSelectedKeywordFilter('all');
                    }}
                    className="px-3 py-1.5 bg-emerald-600 text-white font-bold rounded-xl text-xs"
                  >
                    Réinitialiser les filtres
                  </button>
                </div>
              )}
            </div>
          )}

          {activeTab === 'upload' && (
            <div className="space-y-4">
              <div
                onClick={() => fileInputRef.current?.click()}
                className="border-2 border-dashed border-slate-300 hover:border-emerald-500 hover:bg-emerald-50/20 rounded-2xl p-8 text-center cursor-pointer transition-all flex flex-col items-center justify-center gap-2"
              >
                <div className="p-3 bg-slate-100 rounded-full text-slate-500">
                  <Upload className="w-6 h-6" />
                </div>
                <div className="font-bold text-xs text-slate-700">
                  Cliquez ici pour sélectionner un fichier ou glissez-déposez l'image
                </div>
                <p className="text-[11px] text-slate-400">
                  Compatible formats PNG, JPEG, WEBP ou SVG vectoriel
                </p>
                <input
                  ref={fileInputRef}
                  type="file"
                  accept="image/*,.svg"
                  className="hidden"
                  onChange={handleFileUpload}
                />
              </div>

              {previewImage && !previewImage.startsWith('<svg') && (
                <div className="p-3 bg-slate-50 rounded-xl border border-slate-200 flex items-center justify-between">
                  <span className="text-xs font-semibold text-slate-600">Image chargée avec succès</span>
                  <button
                    onClick={() => setPreviewImage('')}
                    className="text-xs text-red-600 font-bold hover:underline flex items-center gap-1"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                    Supprimer
                  </button>
                </div>
              )}
            </div>
          )}

          {activeTab === 'ai' && (
            <div className="space-y-4">
              {/* Info banner */}
              <div className="p-4 bg-gradient-to-r from-red-50 to-amber-50 rounded-2xl border border-red-200 space-y-2">
                <div className="flex items-center gap-2">
                  <span className="p-1 rounded-lg bg-red-600 text-white font-black text-xs">ASF</span>
                  <h3 className="text-xs font-extrabold text-slate-900">
                    Générateur IA de Schémas Tactiques Vectoriels FootEco
                  </h3>
                </div>
                <p className="text-[11px] text-slate-600 leading-relaxed">
                  L'intelligence artificielle analyse le détail précis de votre atelier (règles, joueurs, buts, cônes, sens de circulation) pour tracer un schéma vectoriel de terrain parfaitement adapté.
                </p>
              </div>

              {/* Current exercise context card */}
              <div className="bg-slate-50 p-4 rounded-2xl border border-slate-200 space-y-2.5">
                <div className="flex items-center justify-between text-xs">
                  <span className="font-bold text-slate-700">Détails actuels de l'atelier :</span>
                  <span className="text-[10px] font-extrabold text-slate-500 uppercase">
                    {slotName} • {category}
                  </span>
                </div>

                <div className="bg-white p-3 rounded-xl border border-slate-200 text-xs">
                  <div className="font-extrabold text-slate-900 mb-1">
                    {partTitle || 'Atelier'} {caption ? `— ${caption}` : ''}
                  </div>
                  <p className="text-slate-600 text-[11px] whitespace-pre-line leading-relaxed italic">
                    {exerciseDescription || 'Aucune description saisie pour le moment. Vous pouvez préciser vos souhaits ci-dessous.'}
                  </p>
                </div>

                {/* Quick Tactical Add-on Badges */}
                <div>
                  <label className="block text-[11px] font-bold text-slate-600 mb-1.5">
                    Ajouts tactiques rapides en 1 clic :
                  </label>
                  <div className="flex flex-wrap gap-1.5">
                    {[
                      { label: '1c1 Duel avec finition', text: 'Duel 1 contre 1 avec frappe au but et retour défenseur' },
                      { label: 'Conservation 4c2', text: 'Conservation 4 contre 2 en supériorité numérique et pressing' },
                      { label: 'Transition 3s & Contre', text: 'Règle des 3 secondes, transition rapide offensive' },
                      { label: 'Frappe & Finition', text: 'Slalom de cônes, enchaînement contrôle orienté et tir au but' },
                      { label: 'Jeu 6c6 FootEco', text: 'Match FootEco 6 contre 6 avec gardiens et zones' },
                      { label: '2 mini-buts', text: 'Cibles avec 2 mini-buts latéraux' },
                    ].map((badge) => (
                      <button
                        key={badge.label}
                        type="button"
                        onClick={() => {
                          setCustomPrompt(prev => prev ? `${prev}, ${badge.text}` : badge.text);
                        }}
                        className="px-2.5 py-1 bg-white hover:bg-slate-100 text-slate-700 border border-slate-300 rounded-lg text-[10px] font-bold transition-all shadow-2xs hover:border-red-400"
                      >
                        + {badge.label}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Custom instructions textarea */}
                <div>
                  <label className="block text-[11px] font-bold text-slate-700 mb-1">
                    Précisions ou consignes particulières pour le schéma :
                  </label>
                  <textarea
                    rows={2}
                    value={customPrompt}
                    onChange={(e) => setCustomPrompt(e.target.value)}
                    placeholder="Ex: Terrain 30x20m avec 2 petits buts, 4 attaquants en rouge et 2 défenseurs en bleu..."
                    className="w-full bg-white border border-slate-300 rounded-xl p-2.5 text-xs font-medium focus:border-red-500 focus:outline-none"
                  />
                </div>

                {/* Generate Button */}
                <div className="pt-2 flex flex-col sm:flex-row items-center gap-3">
                  <button
                    type="button"
                    onClick={handleGenerateAiDrillDiagram}
                    disabled={isGeneratingAiDiagram}
                    className="w-full sm:w-auto px-5 py-2.5 bg-gradient-to-r from-red-600 to-amber-600 hover:from-red-500 hover:to-amber-500 text-white rounded-xl text-xs font-black flex items-center justify-center gap-2 transition-all shadow-md active:scale-95 disabled:opacity-50 cursor-pointer"
                  >
                    {isGeneratingAiDiagram ? (
                      <>
                        <Loader2 className="w-4 h-4 animate-spin text-white" />
                        <span>Création du schéma tactique selon l'exercice...</span>
                      </>
                    ) : (
                      <>
                        <Sparkles className="w-4 h-4 text-amber-200 animate-pulse" />
                        <span>Générer le schéma selon le détail de l'exercice</span>
                      </>
                    )}
                  </button>

                  {aiSuccessMessage && (
                    <div className="text-emerald-700 text-xs font-extrabold flex items-center gap-1.5 animate-in fade-in">
                      <Check className="w-4 h-4 text-emerald-600" />
                      <span>{aiSuccessMessage}</span>
                    </div>
                  )}
                </div>
              </div>
            </div>
          )}

          {/* Coach & Caption Options */}
          <div className="p-4 bg-slate-50 rounded-xl border border-slate-200 grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
            <div>
              <label className="block font-bold text-slate-700 mb-1">
                Responsable du groupe / Coach sur l'atelier
              </label>
              <div className="flex gap-2">
                <input
                  type="text"
                  value={coachName}
                  onChange={(e) => setCoachName(e.target.value)}
                  placeholder="Ex: SEB, Miguel, Alex..."
                  className="flex-1 bg-white border border-slate-300 rounded-xl px-3 py-1.5 font-bold text-xs focus:outline-none focus:border-emerald-500"
                />
                <div className="flex items-center gap-1">
                  {['SEB', 'Miguel'].map((c) => (
                    <button
                      key={c}
                      type="button"
                      onClick={() => setCoachName(c)}
                      className={`px-2 py-1 rounded-lg font-bold text-[11px] border transition-colors ${
                        coachName === c
                          ? 'bg-slate-900 text-white border-slate-900'
                          : 'bg-white text-slate-700 border-slate-300 hover:bg-slate-100'
                      }`}
                    >
                      {c}
                    </button>
                  ))}
                </div>
              </div>
              <p className="text-[10px] text-slate-500 mt-1">
                Ce label s'affiche en dessous du dessin (ex: "SEB" ou "Miguel")
              </p>
            </div>

            <div>
              <label className="block font-bold text-slate-700 mb-1">
                Légende / Titre court de l'atelier
              </label>
              <input
                type="text"
                value={caption}
                onChange={(e) => setCaption(e.target.value)}
                placeholder="Ex: Duel 1v1, 4 zones et 2 petits buts..."
                className="w-full bg-white border border-slate-300 rounded-xl px-3 py-1.5 font-medium text-xs focus:outline-none focus:border-emerald-500"
              />
            </div>
          </div>

          {/* Current Preview */}
          <div>
            <label className="block text-xs font-bold text-slate-700 mb-2">
              Aperçu en direct sur la fiche :
            </label>
            <div className="p-3 bg-slate-900/5 rounded-xl border border-slate-200 flex flex-col items-center justify-center min-h-40 max-w-sm mx-auto">
              {previewImage ? (
                previewImage.startsWith('<svg') ? (
                  <div
                    className="w-full h-36 flex items-center justify-center"
                    dangerouslySetInnerHTML={{ __html: previewImage }}
                  />
                ) : (
                  <img
                    src={previewImage}
                    alt="Aperçu atelier"
                    className="max-h-36 object-contain rounded"
                  />
                )
              ) : (
                <div className="text-center text-slate-400 py-6">
                  <ImageIcon className="w-8 h-8 mx-auto mb-1 opacity-40" />
                  <span className="text-xs">Aucun schéma sélectionné</span>
                </div>
              )}

              {coachName && (
                <div className="mt-2 text-xs font-extrabold text-slate-900 bg-slate-200 px-3 py-0.5 rounded">
                  Coach : {coachName}
                </div>
              )}
            </div>
          </div>

        </div>

        {/* Footer Actions */}
        <div className="px-6 py-3 border-t border-slate-200 bg-slate-50 flex items-center justify-between">
          <button
            onClick={() => {
              setPreviewImage('');
              setCoachName('');
              setCaption('');
            }}
            className="text-xs text-slate-500 hover:text-slate-800 font-semibold"
          >
            Effacer le schéma
          </button>
          <div className="flex items-center gap-2">
            <button
              onClick={onClose}
              className="px-4 py-2 text-xs font-bold text-slate-700 bg-white hover:bg-slate-100 border border-slate-300 rounded-xl transition-colors"
            >
              Annuler
            </button>
            <button
              onClick={handleConfirm}
              className="px-5 py-2 text-xs font-bold text-white bg-emerald-600 hover:bg-emerald-700 rounded-xl shadow-xs transition-colors flex items-center gap-1.5"
            >
              <Check className="w-3.5 h-3.5" />
              <span>Valider ce schéma</span>
            </button>
          </div>
        </div>

      </div>

      {isAnimationOpen && (
        <ExerciseAnimationModal
          isOpen={isAnimationOpen}
          onClose={() => setIsAnimationOpen(false)}
          partTitle={partTitle}
          partDescription={exerciseDescription || caption || ''}
          partFocus={themeTitle || ''}
          slotName={slotName}
          category={category}
        />
      )}
    </div>
  );
};
