import React, { useState, useEffect } from 'react';
import { 
  X, 
  Plus, 
  Calendar, 
  Printer, 
  Download, 
  Copy, 
  Trash2, 
  Edit3, 
  Save, 
  Eye, 
  Sparkles, 
  ChevronLeft, 
  Check, 
  FileText, 
  Filter, 
  User, 
  Image as ImageIcon,
  Flame,
  Shield,
  Layers,
  ArrowRight,
  CalendarRange,
  Loader2,
  Wand2,
  Zap,
  Award,
  BookOpen,
  ExternalLink,
  Search,
  RotateCcw,
  Play
} from 'lucide-react';
import jsPDF from 'jspdf';
import html2canvas from 'html2canvas-pro';
import { TrainingSession, TrainingExercisePart, TrainingDrawing } from '../types';
import { 
  loadTrainingSessions, 
  saveTrainingSession, 
  deleteTrainingSession, 
  duplicateTrainingSession, 
  createNewEmptyTrainingSession 
} from '../utils/trainingStorage';
import { getSeasonFromDate, getAvailableSeasons } from '../utils/season';
import { PitchTacticalCanvasModal } from './PitchTacticalCanvasModal';
import { PrintableTrainingSheet } from './PrintableTrainingSheet';
import { CoachAutocompleteInput } from './CoachAutocompleteInput';
import { AITrainingGeneratorModal } from './AITrainingGeneratorModal';
import { ExerciseAnimationModal } from './ExerciseAnimationModal';
import { refineThemeWithAI, generateExercisePartWithAI, generateDrillDiagramWithAI } from '../utils/aiTrainingGenerator';

interface TrainingSessionModalProps {
  isOpen: boolean;
  onClose: () => void;
  initialSessionId?: string;
  defaultSeason?: string;
}

export const TrainingSessionModal: React.FC<TrainingSessionModalProps> = ({
  isOpen,
  onClose,
  initialSessionId,
  defaultSeason,
}) => {
  const [sessions, setSessions] = useState<TrainingSession[]>(() => loadTrainingSessions());
  const [activeView, setActiveView] = useState<'list' | 'editor' | 'preview'>('list');
  const [currentSession, setCurrentSession] = useState<TrainingSession | null>(null);
  const [selectedSeasonFilter, setSelectedSeasonFilter] = useState<string>(defaultSeason || 'all');
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [selectedKeywordFilter, setSelectedKeywordFilter] = useState<string>('all');
  const [saveSuccess, setSaveSuccess] = useState(false);
  const [isExportingPdf, setIsExportingPdf] = useState(false);
  const [isAiModalOpen, setIsAiModalOpen] = useState(false);
  const [isRefiningTE, setIsRefiningTE] = useState(false);
  const [isRefiningTA, setIsRefiningTA] = useState(false);
  const [isGeneratingPart, setIsGeneratingPart] = useState<string | null>(null);
  const [generatingSlotKey, setGeneratingSlotKey] = useState<string | null>(null);
  const [isRefiningIndiv, setIsRefiningIndiv] = useState(false);

  // Diagram modal state
  const [tacticalModalState, setTacticalModalState] = useState<{
    isOpen: boolean;
    partKey: 'initialPart' | 'playedForms' | 'finalGame';
    partTitle: string;
    slotName: 'Dessin 1' | 'Dessin 2';
    initialDrawing: TrainingDrawing;
    exerciseDescription?: string;
    themeTitle?: string;
    category?: string;
  }>({
    isOpen: false,
    partKey: 'initialPart',
    partTitle: '',
    slotName: 'Dessin 1',
    initialDrawing: {},
  });

  // Animation modal state
  const [animationModalState, setAnimationModalState] = useState<{
    isOpen: boolean;
    partTitle: string;
    partDescription: string;
    partFocus: string;
    slotName?: 'Dessin 1' | 'Dessin 2' | 'Complet';
    category?: string;
  }>({
    isOpen: false,
    partTitle: '',
    partDescription: '',
    partFocus: '',
  });

  const handleOpenAnimation = (
    partTitle: string,
    partDescription: string,
    partFocus: string = '',
    slotName?: 'Dessin 1' | 'Dessin 2' | 'Complet'
  ) => {
    setAnimationModalState({
      isOpen: true,
      partTitle,
      partDescription,
      partFocus,
      slotName,
      category: currentSession?.team || 'FE12',
    });
  };

  // Reload sessions when opening
  useEffect(() => {
    if (isOpen) {
      const loaded = loadTrainingSessions();
      setSessions(loaded);
      if (initialSessionId) {
        const found = loaded.find(s => s.id === initialSessionId);
        if (found) {
          setCurrentSession(JSON.parse(JSON.stringify(found)));
          setActiveView('editor');
        }
      }
    }
  }, [isOpen, initialSessionId]);

  if (!isOpen) return null;

  const sessionKeywordsList = [
    { id: 'all', label: 'Tous', icon: '🌟' },
    { id: '1v1', label: '1v1 / Duels', icon: '⚡' },
    { id: 'dribble', label: 'Dribble & Conduite', icon: '🌀' },
    { id: 'transition', label: 'Transition (3s)', icon: '🔄' },
    { id: 'passe', label: 'Passe & Jeu combiné', icon: '🎯' },
    { id: 'tir', label: 'Tir & Finition', icon: '🥅' },
    { id: 'defense', label: 'Défense & Pressing', icon: '🛡️' },
    { id: 'motricite', label: 'Motricité & Vitesse', icon: '🏃' },
  ];

  // Helper to collect all searchable text of a session
  const getSessionSearchableText = (session: TrainingSession): string => {
    return [
      session.title,
      session.team,
      session.coach,
      session.assistantCoach,
      session.season,
      session.remarksAndIndividualization,
      session.themeTE?.description,
      session.themeTE?.coachingAccents,
      session.themeTA?.description,
      session.themeTA?.coachingAccents,
      session.themeTA?.antagonism,
      session.themeTA?.defOrOff,
      session.themePE?.description,
      session.themePE?.coachingAccents,
      session.initialPart?.title,
      session.initialPart?.description,
      session.initialPart?.drawing1?.caption,
      session.initialPart?.drawing2?.caption,
      session.playedForms?.title,
      session.playedForms?.description,
      session.playedForms?.drawing1?.caption,
      session.playedForms?.drawing2?.caption,
      session.finalGame?.title,
      session.finalGame?.description,
      session.finalGame?.drawing1?.caption,
    ].filter(Boolean).join(' ').toLowerCase();
  };

  // Check if session text matches keyword or its aliases
  const testKeywordMatch = (text: string, keywordId: string): boolean => {
    if (keywordId === '1v1') {
      return text.includes('1v1') || text.includes('1c1') || text.includes('1-1') || text.includes('1 contre 1') || text.includes('duel') || text.includes('un contre un');
    }
    if (keywordId === 'dribble') {
      return text.includes('dribble') || text.includes('drible') || text.includes('feinte') || text.includes('conduite') || text.includes('élimination') || text.includes('crochet');
    }
    if (keywordId === 'transition') {
      return text.includes('transition') || text.includes('3s') || text.includes('3 secondes') || text.includes('contre-attaque') || text.includes('récupération') || text.includes('reconversion');
    }
    if (keywordId === 'passe') {
      return text.includes('passe') || text.includes('combin') || text.includes('rondo') || text.includes('possession') || text.includes('conservation') || text.includes('une-deux') || text.includes('appui');
    }
    if (keywordId === 'tir') {
      return text.includes('tir') || text.includes('frappe') || text.includes('finition') || text.includes('but') || text.includes('face-à-face') || text.includes('reprise');
    }
    if (keywordId === 'defense') {
      return text.includes('défense') || text.includes('defense') || text.includes('pressing') || text.includes('cadrage') || text.includes('interception') || text.includes('bloc') || text.includes('fermeture');
    }
    if (keywordId === 'motricite') {
      return text.includes('motricité') || text.includes('motricite') || text.includes('coordination') || text.includes('vivacité') || text.includes('vivacite') || text.includes('vitesse') || text.includes('appuis') || text.includes('slalom');
    }
    return text.includes(keywordId.toLowerCase());
  };

  // Filtered Sessions List
  const availableSeasons = getAvailableSeasons();
  const filteredSessions = sessions.filter((session) => {
    const matchesSeason = selectedSeasonFilter === 'all' || session.season === selectedSeasonFilter;
    const sessionText = getSessionSearchableText(session);

    // Filter by keyword pill
    if (selectedKeywordFilter !== 'all') {
      if (!testKeywordMatch(sessionText, selectedKeywordFilter)) {
        return false;
      }
    }

    // Filter by query string
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase().trim();
      const tokens = q.split(/\s+/).filter(Boolean);

      const matchesAllTokens = tokens.every(token => {
        // Direct text inclusion
        if (sessionText.includes(token)) return true;

        // Alias matching
        if ((token === '1v1' || token === '1c1' || token === 'duel') && testKeywordMatch(sessionText, '1v1')) return true;
        if ((token === 'dribble' || token === 'feinte' || token === 'conduite') && testKeywordMatch(sessionText, 'dribble')) return true;
        if ((token === 'transition' || token === '3s' || token === 'contre') && testKeywordMatch(sessionText, 'transition')) return true;
        if ((token === 'passe' || token === 'rondo' || token === 'possession') && testKeywordMatch(sessionText, 'passe')) return true;
        if ((token === 'tir' || token === 'frappe' || token === 'finition') && testKeywordMatch(sessionText, 'tir')) return true;
        if ((token === 'defense' || token === 'défense' || token === 'pressing') && testKeywordMatch(sessionText, 'defense')) return true;
        if ((token === 'motricite' || token === 'motricité' || token === 'vitesse') && testKeywordMatch(sessionText, 'motricite')) return true;

        return false;
      });

      if (!matchesAllTokens) return false;
    }

    return matchesSeason;
  });

  // Handler Actions
  const handleCreateNew = () => {
    const newSess = createNewEmptyTrainingSession(undefined, selectedSeasonFilter !== 'all' ? selectedSeasonFilter : undefined);
    setCurrentSession(newSess);
    setActiveView('editor');
  };

  const handleEditSession = (session: TrainingSession) => {
    setCurrentSession(JSON.parse(JSON.stringify(session)));
    setActiveView('editor');
  };

  const handlePreviewSession = (session: TrainingSession) => {
    setCurrentSession(JSON.parse(JSON.stringify(session)));
    setActiveView('preview');
  };

  const handleDuplicateSession = (session: TrainingSession) => {
    const dup = duplicateTrainingSession(session);
    const updated = loadTrainingSessions();
    setSessions(updated);
    setCurrentSession(dup);
    setActiveView('editor');
  };

  const handleDeleteSession = (sessionId: string, e: React.MouseEvent) => {
    e.stopPropagation();
    if (window.confirm('Êtes-vous sûr de vouloir supprimer cette fiche de séance d\'entraînement ?')) {
      const updated = deleteTrainingSession(sessionId);
      setSessions(updated);
      if (currentSession?.id === sessionId) {
        setCurrentSession(null);
        setActiveView('list');
      }
    }
  };

  const handleSaveCurrentSession = () => {
    if (!currentSession) return;
    const updated = saveTrainingSession(currentSession);
    setSessions(updated);
    setSaveSuccess(true);
    setTimeout(() => setSaveSuccess(false), 2000);
  };

  const handlePrint = () => {
    window.print();
  };

  const handleExportPdf = async () => {
    if (!currentSession) return;
    setIsExportingPdf(true);
    try {
      const element = document.getElementById('official-training-sheet-print');
      if (!element) {
        window.print();
        return;
      }

      const canvas = await html2canvas(element, {
        scale: 2,
        useCORS: true,
        logging: false,
        backgroundColor: '#ffffff',
      });

      const imgData = canvas.toDataURL('image/jpeg', 0.98);
      const pdf = new jsPDF({
        orientation: 'portrait',
        unit: 'mm',
        format: 'a4',
      });

      const pdfWidth = 210;
      const pdfHeight = 297;
      const margin = 5;
      const usableWidth = pdfWidth - margin * 2;
      const usableHeight = pdfHeight - margin * 2;

      const imgProps = pdf.getImageProperties(imgData);
      const renderedHeight = (imgProps.height * usableWidth) / imgProps.width;

      if (renderedHeight <= usableHeight) {
        pdf.addImage(imgData, 'JPEG', margin, margin, usableWidth, renderedHeight, undefined, 'FAST');
      } else {
        let heightLeft = renderedHeight;
        let position = margin;
        let page = 1;

        while (heightLeft > 0) {
          pdf.addImage(imgData, 'JPEG', margin, position, usableWidth, renderedHeight, undefined, 'FAST');
          heightLeft -= usableHeight;
          if (heightLeft > 0) {
            pdf.addPage('a4', 'portrait');
            page++;
            position = margin - (page - 1) * usableHeight;
          }
        }
      }

      const filename = `Seance_FootEco_${currentSession.team.replace(/\s+/g, '_')}_${currentSession.date}.pdf`;
      pdf.save(filename);
    } catch (err) {
      console.error('PDF export error:', err);
      window.print();
    } finally {
      setIsExportingPdf(false);
    }
  };

  const handleOpenDiagramModal = (
    partKey: 'initialPart' | 'playedForms' | 'finalGame',
    partTitle: string,
    slotName: 'Dessin 1' | 'Dessin 2'
  ) => {
    if (!currentSession) return;
    const drawing = slotName === 'Dessin 1' 
      ? currentSession[partKey].drawing1 
      : currentSession[partKey].drawing2;

    setTacticalModalState({
      isOpen: true,
      partKey,
      partTitle,
      slotName,
      initialDrawing: drawing || {},
      exerciseDescription: currentSession[partKey]?.description || '',
      themeTitle: currentSession.title,
      category: currentSession.team,
    });
  };

  const handleGenerateSlotDiagramAI = async (
    partKey: 'initialPart' | 'playedForms' | 'finalGame',
    slotName: 'Dessin 1' | 'Dessin 2'
  ) => {
    if (!currentSession) return;
    const part = currentSession[partKey];
    if (!part) return;

    const key = `${partKey}-${slotName}`;
    setGeneratingSlotKey(key);
    try {
      const drawing = slotName === 'Dessin 1' ? part.drawing1 : part.drawing2;
      const svg = await generateDrillDiagramWithAI({
        exerciseTitle: drawing?.caption || part.title || 'Atelier FootEco',
        description: part.description || '',
        slotName,
        partType: partKey,
        coach: drawing?.coach || (slotName === 'Dessin 1' ? currentSession.coach : currentSession.assistantCoach),
        category: currentSession.team,
        theme: currentSession.title,
      });

      if (svg) {
        if (slotName === 'Dessin 1') {
          setCurrentSession({
            ...currentSession,
            [partKey]: {
              ...part,
              drawing1: {
                ...part.drawing1,
                image: svg,
              },
            },
          });
        } else {
          setCurrentSession({
            ...currentSession,
            [partKey]: {
              ...part,
              drawing2: {
                ...part.drawing2,
                image: svg,
              },
            },
          });
        }
      }
    } catch (err) {
      console.error('Error generating diagram for slot:', err);
    } finally {
      setGeneratingSlotKey(null);
    }
  };

  const handleSaveDrawing = (drawingData: { image: string; coach?: string; caption?: string }) => {
    if (!currentSession) return;
    const { partKey, slotName } = tacticalModalState;
    const updatedPart = { ...currentSession[partKey] };

    if (slotName === 'Dessin 1') {
      updatedPart.drawing1 = {
        ...updatedPart.drawing1,
        ...drawingData,
      };
    } else {
      updatedPart.drawing2 = {
        ...updatedPart.drawing2,
        ...drawingData,
      };
    }

    setCurrentSession({
      ...currentSession,
      [partKey]: updatedPart,
    });
  };

  // AI Actions Handlers
  const handleApplyAiSession = (generatedSession: TrainingSession) => {
    const saved = saveTrainingSession(generatedSession);
    setSessions(saved);
    setCurrentSession(generatedSession);
    setActiveView('editor');
    setSaveSuccess(true);
    setTimeout(() => setSaveSuccess(false), 2500);
  };

  const handleRefineThemeTE = async () => {
    if (!currentSession) return;
    setIsRefiningTE(true);
    try {
      const res = await refineThemeWithAI({
        themeType: 'TE',
        currentText: currentSession.themeTE?.description || currentSession.title,
        focusCategory: currentSession.team,
      });
      setCurrentSession({
        ...currentSession,
        themeTE: {
          description: res.description || currentSession.themeTE.description,
          coachingAccents: res.coachingAccents || currentSession.themeTE.coachingAccents,
        },
      });
    } catch (err) {
      console.error(err);
    } finally {
      setIsRefiningTE(false);
    }
  };

  const handleRefineThemeTA = async () => {
    if (!currentSession) return;
    setIsRefiningTA(true);
    try {
      const res = await refineThemeWithAI({
        themeType: 'TA',
        currentText: currentSession.themeTA?.description || currentSession.title,
        focusCategory: currentSession.team,
      });
      setCurrentSession({
        ...currentSession,
        themeTA: {
          ...currentSession.themeTA,
          description: res.description || currentSession.themeTA.description,
          coachingAccents: res.coachingAccents || currentSession.themeTA.coachingAccents,
        },
      });
    } catch (err) {
      console.error(err);
    } finally {
      setIsRefiningTA(false);
    }
  };

  const handleGeneratePartAI = async (partKey: 'initialPart' | 'playedForms' | 'finalGame') => {
    if (!currentSession) return;
    setIsGeneratingPart(partKey);
    try {
      const generated = await generateExercisePartWithAI({
        partType: partKey,
        themeDescription: `${currentSession.title} - TE: ${currentSession.themeTE?.description} - TA: ${currentSession.themeTA?.description}`,
        focus: partKey === 'initialPart' ? 'TE/KO' : partKey === 'playedForms' ? 'TA' : 'TE/TA',
        category: currentSession.team,
        coach: currentSession.coach?.split(' ')[0] || 'SEB',
        assistantCoach: currentSession.assistantCoach?.split(' ')[0] || 'Miguel',
      });

      setCurrentSession({
        ...currentSession,
        [partKey]: {
          ...currentSession[partKey],
          ...generated,
        },
      });
    } catch (err) {
      console.error(err);
    } finally {
      setIsGeneratingPart(null);
    }
  };

  const handleSuggestIndividualization = async () => {
    if (!currentSession) return;
    setIsRefiningIndiv(true);
    try {
      const res = await refineThemeWithAI({
        themeType: 'individualization',
        currentText: `Séance FootEco FE12 : ${currentSession.title}`,
        focusCategory: currentSession.team,
      });
      setCurrentSession({
        ...currentSession,
        remarksAndIndividualization: res.coachingAccents || res.description,
      });
    } catch (err) {
      console.error(err);
    } finally {
      setIsRefiningIndiv(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-2 sm:p-4 bg-slate-900/80 backdrop-blur-xs animate-in fade-in duration-200">
      <div className="bg-slate-100 rounded-2xl shadow-2xl border border-slate-300 w-full max-w-5xl h-[94vh] flex flex-col overflow-hidden text-slate-800">
        
        {/* Top Navigation Bar */}
        <div className="bg-slate-900 text-white px-6 py-3.5 flex items-center justify-between shadow-md">
          <div className="flex items-center gap-3">
            {activeView !== 'list' ? (
              <button
                onClick={() => {
                  handleSaveCurrentSession();
                  setActiveView('list');
                }}
                className="p-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 transition-colors flex items-center gap-1 text-xs font-bold"
              >
                <ChevronLeft className="w-4 h-4" />
                <span>Séances</span>
              </button>
            ) : (
              <div className="p-2 rounded-xl bg-emerald-600 text-white">
                <FileText className="w-5 h-5" />
              </div>
            )}

            <div>
              <div className="flex items-center gap-2">
                <h1 className="font-extrabold text-sm sm:text-base tracking-tight">
                  {activeView === 'list' && 'Fiches de Séances d\'Entraînement FootEco FE12'}
                  {activeView === 'editor' && (currentSession?.title || 'Édition de Séance')}
                  {activeView === 'preview' && 'Aperçu Fiche Officielle FootEco'}
                </h1>
                {currentSession && activeView !== 'list' && (
                  <span className="text-[10px] font-extrabold bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 px-2 py-0.5 rounded-full">
                    Saison {currentSession.season}
                  </span>
                )}
              </div>
              <p className="text-[11px] text-slate-400">
                {activeView === 'list' 
                  ? 'Planification tactique, thèmes TE/TA, formes jouées et bilans'
                  : `${currentSession?.team || 'FE12 Bas-Valais'} • ${currentSession?.date ? currentSession.date.split('-').reverse().join('.') : ''}`}
              </p>
            </div>
          </div>

          {/* Right Action buttons */}
          <div className="flex items-center gap-2">
            {/* AI Generator Button always accessible in top navigation */}
            <button
              type="button"
              onClick={() => setIsAiModalOpen(true)}
              className="px-3.5 py-1.5 bg-gradient-to-r from-red-600 to-amber-600 hover:from-red-500 hover:to-amber-500 text-white rounded-xl text-xs font-black flex items-center gap-1.5 transition-all shadow-sm active:scale-95 cursor-pointer border border-white/20"
              title="Générateur IA FootEco selon la philosophie ASF (FE12)"
            >
              <Sparkles className="w-3.5 h-3.5 text-amber-200 animate-pulse" />
              <span>Générateur IA FootEco (ASF)</span>
            </button>

            {activeView === 'editor' && currentSession && (
              <>
                <button
                  onClick={() => setActiveView('preview')}
                  className="px-3 py-1.5 bg-slate-800 hover:bg-slate-700 text-slate-200 rounded-xl text-xs font-bold flex items-center gap-1.5 transition-colors border border-slate-700"
                >
                  <Eye className="w-3.5 h-3.5" />
                  <span className="hidden sm:inline">Aperçu officiel</span>
                </button>
                <button
                  onClick={handleSaveCurrentSession}
                  className={`px-4 py-1.5 rounded-xl text-xs font-bold flex items-center gap-1.5 transition-all ${
                    saveSuccess
                      ? 'bg-emerald-600 text-white'
                      : 'bg-emerald-600 hover:bg-emerald-500 text-white shadow-sm'
                  }`}
                >
                  {saveSuccess ? <Check className="w-3.5 h-3.5" /> : <Save className="w-3.5 h-3.5" />}
                  <span>{saveSuccess ? 'Enregistré !' : 'Enregistrer'}</span>
                </button>
              </>
            )}

            {activeView === 'preview' && currentSession && (
              <>
                <button
                  onClick={() => setActiveView('editor')}
                  className="px-3 py-1.5 bg-slate-800 hover:bg-slate-700 text-slate-200 rounded-xl text-xs font-bold flex items-center gap-1.5 transition-colors border border-slate-700"
                >
                  <Edit3 className="w-3.5 h-3.5" />
                  <span>Modifier</span>
                </button>
                <button
                  onClick={handlePrint}
                  className="px-3 py-1.5 bg-slate-800 hover:bg-slate-700 text-slate-200 rounded-xl text-xs font-bold flex items-center gap-1.5 transition-colors border border-slate-700"
                >
                  <Printer className="w-3.5 h-3.5 text-emerald-400" />
                  <span className="hidden sm:inline">Imprimer</span>
                </button>
                <button
                  onClick={handleExportPdf}
                  disabled={isExportingPdf}
                  className="px-4 py-1.5 bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl text-xs font-bold flex items-center gap-1.5 transition-colors shadow-sm"
                >
                  <Download className="w-3.5 h-3.5" />
                  <span>{isExportingPdf ? 'Export...' : 'Télécharger PDF'}</span>
                </button>
              </>
            )}

            {activeView === 'list' && (
              <button
                onClick={handleCreateNew}
                className="px-3.5 py-1.5 bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl text-xs font-bold flex items-center gap-1.5 transition-colors shadow-sm"
              >
                <Plus className="w-4 h-4" />
                <span>Créer manuellement</span>
              </button>
            )}

            <button
              onClick={onClose}
              className="p-1.5 rounded-xl text-slate-400 hover:text-white hover:bg-slate-800 transition-colors ml-2"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* ----------------------------------------------------
            VIEW 1: LIST OF SESSIONS
           ---------------------------------------------------- */}
        {activeView === 'list' && (
          <div className="flex-1 flex flex-col overflow-hidden">
            
            {/* Filter & Search Toolbar */}
            <div className="bg-white border-b border-slate-200 px-6 py-3.5 space-y-3 text-xs">
              
              {/* Primary Search and Action Bar */}
              <div className="flex flex-wrap items-center justify-between gap-3">
                <div className="flex items-center gap-2 flex-1 max-w-xl">
                  {/* Search Bar Input */}
                  <div className="relative w-full">
                    <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                    <input
                      type="text"
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      placeholder="Filtrer les exercices par mot-clé (ex: 'dribble', 'transition', '1v1', 'passe', 'tir')..."
                      className="w-full bg-slate-50 border border-slate-300 rounded-xl pl-9 pr-8 py-2 text-xs font-semibold focus:bg-white focus:outline-none focus:border-emerald-500 shadow-2xs transition-colors"
                    />
                    {searchQuery && (
                      <button
                        type="button"
                        onClick={() => setSearchQuery('')}
                        className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 p-0.5 rounded-full hover:bg-slate-200/60"
                        title="Effacer la recherche"
                      >
                        <X className="w-3.5 h-3.5" />
                      </button>
                    )}
                  </div>
                </div>

                <div className="flex items-center gap-2.5">
                  <div className="flex items-center gap-1.5 bg-slate-50 border border-slate-300 rounded-xl px-2.5 py-1">
                    <CalendarRange className="w-3.5 h-3.5 text-emerald-600" />
                    <span className="font-bold text-slate-500 text-[11px]">Saison :</span>
                    <select
                      value={selectedSeasonFilter}
                      onChange={(e) => setSelectedSeasonFilter(e.target.value)}
                      className="bg-transparent text-slate-800 text-xs font-bold focus:outline-none cursor-pointer"
                    >
                      <option value="all">Toutes</option>
                      {availableSeasons.map((s) => (
                        <option key={s} value={s}>
                          {s}
                        </option>
                      ))}
                    </select>
                  </div>

                  <button
                    onClick={() => setIsAiModalOpen(true)}
                    className="px-3 py-1.5 bg-gradient-to-r from-red-600 to-amber-600 hover:from-red-500 hover:to-amber-500 text-white font-black rounded-xl text-xs flex items-center gap-1 shadow-2xs cursor-pointer"
                  >
                    <Sparkles className="w-3.5 h-3.5 text-amber-200" />
                    <span>Générateur IA</span>
                  </button>

                  <a
                    href="https://clubcorner.ch/trainer/teams/61043/uebungsbibliothek"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="px-3 py-1.5 bg-red-50 hover:bg-red-100 text-red-900 border border-red-200 font-bold rounded-xl text-xs flex items-center gap-1.5 shadow-2xs group cursor-pointer"
                    title="Ouvrir la bibliothèque d'exercices officielle ClubCorner ASF de votre équipe (61043)"
                  >
                    <BookOpen className="w-3.5 h-3.5 text-red-600" />
                    <span className="hidden sm:inline">ClubCorner</span>
                    <ExternalLink className="w-3 h-3 text-red-500 group-hover:translate-x-0.5 transition-transform" />
                  </a>

                  <button
                    onClick={handleCreateNew}
                    className="px-3 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 border border-slate-300 font-bold rounded-xl text-xs flex items-center gap-1 cursor-pointer"
                  >
                    <Plus className="w-3.5 h-3.5 text-slate-500" />
                    <span>Fiche vierge</span>
                  </button>
                </div>
              </div>

              {/* Keyword Filter Pills */}
              <div className="flex items-center justify-between gap-3 pt-1 border-t border-slate-100">
                <div className="flex items-center gap-1.5 overflow-x-auto pb-0.5 scrollbar-thin flex-1">
                  <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider shrink-0 flex items-center gap-1 mr-1">
                    <Filter className="w-3 h-3 text-slate-400" />
                    Mots-clés :
                  </span>
                  {sessionKeywordsList.map((item) => {
                    const isActive = selectedKeywordFilter === item.id;
                    return (
                      <button
                        key={item.id}
                        type="button"
                        onClick={() => setSelectedKeywordFilter(item.id)}
                        className={`px-2.5 py-1 rounded-xl text-xs font-bold whitespace-nowrap flex items-center gap-1 transition-all cursor-pointer ${
                          isActive
                            ? 'bg-emerald-600 text-white shadow-2xs'
                            : 'bg-slate-100 hover:bg-slate-200/80 text-slate-700 border border-slate-200/70'
                        }`}
                      >
                        <span>{item.icon}</span>
                        <span>{item.label}</span>
                      </button>
                    );
                  })}
                </div>

                <div className="text-[11px] font-bold text-slate-500 shrink-0 hidden md:block">
                  <span>{filteredSessions.length} séance{filteredSessions.length > 1 ? 's' : ''} trouvée{filteredSessions.length > 1 ? 's' : ''}</span>
                  {(searchQuery || selectedKeywordFilter !== 'all' || selectedSeasonFilter !== 'all') && (
                    <button
                      type="button"
                      onClick={() => {
                        setSearchQuery('');
                        setSelectedKeywordFilter('all');
                        setSelectedSeasonFilter('all');
                      }}
                      className="ml-2 text-emerald-600 hover:text-emerald-700 underline font-semibold cursor-pointer inline-flex items-center gap-0.5"
                    >
                      <RotateCcw className="w-2.5 h-2.5" />
                      <span>Réinitialiser</span>
                    </button>
                  )}
                </div>
              </div>
            </div>

            {/* Sessions Cards Grid */}
            <div className="flex-1 overflow-y-auto p-6">
              {filteredSessions.length === 0 ? (
                <div className="text-center py-16 bg-white rounded-2xl border border-slate-200 p-8 shadow-xs max-w-md mx-auto">
                  <FileText className="w-12 h-12 text-slate-300 mx-auto mb-3" />
                  <h3 className="text-sm font-bold text-slate-700 mb-1">Aucune fiche d'exercice trouvée</h3>
                  <p className="text-xs text-slate-500 mb-4">
                    {searchQuery || selectedKeywordFilter !== 'all' || selectedSeasonFilter !== 'all'
                      ? 'Aucune séance ne correspond à vos mots-clés ou filtres de recherche.'
                      : 'Commencez par créer votre première séance d\'entraînement officielle FootEco.'}
                  </p>
                  {(searchQuery || selectedKeywordFilter !== 'all' || selectedSeasonFilter !== 'all') ? (
                    <button
                      onClick={() => {
                        setSearchQuery('');
                        setSelectedKeywordFilter('all');
                        setSelectedSeasonFilter('all');
                      }}
                      className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-white rounded-xl text-xs font-bold inline-flex items-center gap-1.5 shadow-sm cursor-pointer"
                    >
                      <RotateCcw className="w-3.5 h-3.5" />
                      <span>Réinitialiser les filtres</span>
                    </button>
                  ) : (
                    <button
                      onClick={handleCreateNew}
                      className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-bold inline-flex items-center gap-1.5 shadow-sm"
                    >
                      <Plus className="w-4 h-4" />
                      <span>Créer une séance</span>
                    </button>
                  )}
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {filteredSessions.map((session) => (
                    <div
                      key={session.id}
                      onClick={() => handleEditSession(session)}
                      className="bg-white rounded-2xl border border-slate-200/80 hover:border-emerald-500/80 hover:shadow-md transition-all p-5 flex flex-col justify-between cursor-pointer group relative"
                    >
                      <div>
                        {/* Card Header */}
                        <div className="flex items-start justify-between gap-2 mb-2">
                          <div className="flex items-center gap-1.5">
                            <span className="p-1 rounded-lg bg-emerald-100 text-emerald-800 text-[10px] font-extrabold uppercase tracking-wider">
                              {session.team || 'FE12'}
                            </span>
                            <span className="text-[11px] font-bold text-slate-500">
                              {session.date.split('-').reverse().join('.')}
                            </span>
                          </div>
                          <span className="text-[10px] font-bold text-slate-600 bg-slate-100 px-2 py-0.5 rounded-md border border-slate-200">
                            {session.season}
                          </span>
                        </div>

                        {/* Title */}
                        <h3 className="font-extrabold text-sm text-slate-900 group-hover:text-emerald-700 transition-colors leading-snug mb-2">
                          {session.title}
                        </h3>

                        {/* Themes badges */}
                        <div className="space-y-1.5 mb-3">
                          {session.themeTE?.description && (
                            <div className="p-2 rounded-xl bg-amber-50/80 border border-amber-200/70 text-amber-900 text-[11px] flex items-start gap-1.5">
                              <span className="font-extrabold text-amber-800 shrink-0">TE:</span>
                              <span className="line-clamp-2 leading-tight">
                                {session.themeTE.description.replace(/\n/g, ' ')}
                              </span>
                            </div>
                          )}

                          {session.themeTA?.description && (
                            <div className="p-2 rounded-xl bg-blue-50/80 border border-blue-200/70 text-blue-900 text-[11px] flex items-start gap-1.5">
                              <span className="font-extrabold text-blue-800 shrink-0">TA:</span>
                              <span className="line-clamp-2 leading-tight">
                                {session.themeTA.description.replace(/\n/g, ' ')}
                              </span>
                            </div>
                          )}
                        </div>

                        {/* Coaches */}
                        <div className="text-[11px] text-slate-500 font-semibold flex items-center gap-1 mb-2">
                          <User className="w-3.5 h-3.5 text-slate-400" />
                          <span>Responsable :</span>
                          <span className="font-bold text-slate-800">
                            {session.coach || 'Sébastien M.'}
                          </span>
                          {session.assistantCoach && (
                            <span className="text-slate-500">({session.assistantCoach})</span>
                          )}
                        </div>

                        {/* Exercise parts summary & detected keywords */}
                        <div className="pt-2 border-t border-slate-100/80 space-y-1.5">
                          <div className="flex flex-wrap items-center gap-1">
                            {session.initialPart?.title && (
                              <span className="text-[9px] font-bold px-1.5 py-0.5 rounded bg-emerald-50 text-emerald-800 border border-emerald-200/60" title={session.initialPart.title}>
                                1. {session.initialPart.title.length > 22 ? `${session.initialPart.title.slice(0, 22)}...` : session.initialPart.title}
                              </span>
                            )}
                            {session.playedForms?.title && (
                              <span className="text-[9px] font-bold px-1.5 py-0.5 rounded bg-blue-50 text-blue-800 border border-blue-200/60" title={session.playedForms.title}>
                                2. {session.playedForms.title.length > 22 ? `${session.playedForms.title.slice(0, 22)}...` : session.playedForms.title}
                              </span>
                            )}
                            {session.finalGame?.title && (
                              <span className="text-[9px] font-bold px-1.5 py-0.5 rounded bg-amber-50 text-amber-800 border border-amber-200/60" title={session.finalGame.title}>
                                3. {session.finalGame.title.length > 22 ? `${session.finalGame.title.slice(0, 22)}...` : session.finalGame.title}
                              </span>
                            )}
                          </div>

                          {/* Matching keyword badges */}
                          {(() => {
                            const fullText = getSessionSearchableText(session);
                            const matchedKws = [
                              { id: '1v1', label: '1v1 / Duels' },
                              { id: 'dribble', label: 'Dribble' },
                              { id: 'transition', label: 'Transition' },
                              { id: 'passe', label: 'Passe' },
                              { id: 'tir', label: 'Tir' },
                              { id: 'defense', label: 'Défense' },
                              { id: 'motricite', label: 'Motricité' },
                            ].filter(k => testKeywordMatch(fullText, k.id));

                            if (matchedKws.length === 0) return null;
                            return (
                              <div className="flex flex-wrap gap-1 pt-0.5">
                                {matchedKws.slice(0, 4).map(kw => (
                                  <span
                                    key={kw.id}
                                    className={`text-[9px] font-bold px-1.5 py-0.2 rounded uppercase ${
                                      selectedKeywordFilter === kw.id
                                        ? 'bg-emerald-600 text-white font-extrabold'
                                        : 'bg-slate-100 text-slate-600'
                                    }`}
                                  >
                                    #{kw.label}
                                  </span>
                                ))}
                              </div>
                            );
                          })()}
                        </div>
                      </div>

                      {/* Card Footer Actions */}
                      <div className="pt-3 border-t border-slate-100 flex items-center justify-between text-xs mt-2">
                        <div className="flex items-center gap-1">
                          <button
                            type="button"
                            onClick={(e) => {
                              e.stopPropagation();
                              handleOpenAnimation(
                                session.initialPart?.title || session.title,
                                session.initialPart?.description || session.themeTE?.description || '',
                                session.themeTA?.description || '',
                                'Complet'
                              );
                            }}
                            className="px-2 py-1 bg-red-50 hover:bg-red-100 text-red-700 border border-red-200 rounded-lg text-[10px] font-black flex items-center gap-1 transition-colors cursor-pointer"
                            title="Lancer l'animation de la séance avec explication détaillée"
                          >
                            <Play className="w-3 h-3 fill-red-600 text-red-600" />
                            <span>Animation</span>
                          </button>
                          <button
                            type="button"
                            onClick={(e) => {
                              e.stopPropagation();
                              handlePreviewSession(session);
                            }}
                            className="p-1.5 text-slate-500 hover:text-slate-900 hover:bg-slate-100 rounded-lg transition-colors"
                            title="Aperçu officiel"
                          >
                            <Eye className="w-4 h-4" />
                          </button>
                          <button
                            type="button"
                            onClick={(e) => {
                              e.stopPropagation();
                              handleDuplicateSession(session);
                            }}
                            className="p-1.5 text-slate-500 hover:text-slate-900 hover:bg-slate-100 rounded-lg transition-colors"
                            title="Dupliquer cette séance"
                          >
                            <Copy className="w-4 h-4" />
                          </button>
                          <button
                            type="button"
                            onClick={(e) => handleDeleteSession(session.id, e)}
                            className="p-1.5 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                            title="Supprimer"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>

                        <span className="text-emerald-700 font-bold flex items-center gap-1 text-[11px] group-hover:translate-x-0.5 transition-transform">
                          <span>Éditer</span>
                          <ArrowRight className="w-3 h-3" />
                        </span>
                      </div>

                    </div>
                  ))}
                </div>
              )}
            </div>

          </div>
        )}

        {/* ----------------------------------------------------
            VIEW 2: FULL EDITOR MATCHING OFFICIAL SCREENSHOT
           ---------------------------------------------------- */}
        {activeView === 'editor' && currentSession && (
          <div className="flex-1 overflow-y-auto p-4 sm:p-6 space-y-5 bg-slate-100">
            
            {/* 1. Header Information Panel */}
            <div className="bg-white rounded-2xl p-5 border border-slate-200 shadow-xs space-y-3">
              <div className="grid grid-cols-1 sm:grid-cols-4 gap-3 text-xs">
                <div>
                  <label className="block font-bold text-slate-700 mb-1">Catégorie / Équipe</label>
                  <input
                    type="text"
                    value={currentSession.team}
                    onChange={(e) => setCurrentSession({ ...currentSession, team: e.target.value })}
                    className="w-full bg-slate-50 border border-slate-300 rounded-xl px-3 py-2 font-bold focus:bg-white focus:outline-none focus:border-emerald-500"
                    placeholder="FE12 Bas-Valais"
                  />
                </div>

                <div>
                  <label className="block font-bold text-slate-700 mb-1">Date de la séance</label>
                  <input
                    type="date"
                    value={currentSession.date}
                    onChange={(e) => {
                      const newDate = e.target.value;
                      setCurrentSession({
                        ...currentSession,
                        date: newDate,
                        season: getSeasonFromDate(newDate),
                      });
                    }}
                    className="w-full bg-slate-50 border border-slate-300 rounded-xl px-3 py-2 font-semibold focus:bg-white focus:outline-none focus:border-emerald-500"
                  />
                </div>

                <div>
                  <label className="block font-bold text-slate-700 mb-1">Saison sportive</label>
                  <select
                    value={currentSession.season}
                    onChange={(e) => setCurrentSession({ ...currentSession, season: e.target.value })}
                    className="w-full bg-slate-50 border border-slate-300 rounded-xl px-3 py-2 font-bold focus:bg-white focus:outline-none focus:border-emerald-500"
                  >
                    {availableSeasons.map((s) => (
                      <option key={s} value={s}>
                        Saison {s}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block font-bold text-slate-700 mb-1">Entraîneur responsable</label>
                  <CoachAutocompleteInput
                    value={currentSession.coach}
                    onChange={(val) => setCurrentSession({ ...currentSession, coach: val })}
                    placeholder="Sébastien M."
                    className="w-full bg-slate-50 border border-slate-300 rounded-xl px-3 py-2 font-bold focus:bg-white focus:outline-none focus:border-emerald-500"
                  />
                </div>
              </div>

              <div>
                <label className="block font-bold text-slate-700 mb-1 text-xs">
                  Intitulé général de la séance
                </label>
                <input
                  type="text"
                  value={currentSession.title}
                  onChange={(e) => setCurrentSession({ ...currentSession, title: e.target.value })}
                  placeholder="Ex: Séance FootEco FE12 - Récupération & Duels 1c1"
                  className="w-full bg-slate-50 border border-slate-300 rounded-xl px-3 py-2 text-xs font-bold focus:bg-white focus:outline-none focus:border-emerald-500"
                />
              </div>
            </div>

            {/* 2. Thème TE (Technique) */}
            <div className="bg-white rounded-2xl p-5 border border-slate-200 shadow-xs space-y-3">
              <div className="flex flex-wrap items-center justify-between gap-2 border-b border-slate-100 pb-2">
                <div className="flex items-center gap-2">
                  <span className="px-2.5 py-0.5 rounded-lg bg-amber-100 text-amber-900 font-extrabold text-xs">
                    THÈME TE (Technique)
                  </span>
                  <span className="text-xs text-slate-500 font-medium hidden sm:inline">
                    Gestes techniques, passes, contrôles, dribbles, récupération
                  </span>
                </div>
                <button
                  type="button"
                  onClick={handleRefineThemeTE}
                  disabled={isRefiningTE}
                  className="px-2.5 py-1 bg-amber-50 hover:bg-amber-100 text-amber-900 border border-amber-300 rounded-lg text-[11px] font-bold flex items-center gap-1 transition-colors cursor-pointer disabled:opacity-50"
                  title="Améliorer le thème technique et générer des accents de coaching FootEco ASF"
                >
                  {isRefiningTE ? <Loader2 className="w-3 h-3 animate-spin text-amber-700" /> : <Sparkles className="w-3 h-3 text-amber-700" />}
                  <span>{isRefiningTE ? 'Perfectionnement IA...' : 'Perfectionner IA ASF'}</span>
                </button>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs">
                <div>
                  <label className="block font-bold text-slate-700 mb-1">Description du Thème TE</label>
                  <textarea
                    rows={3}
                    value={currentSession.themeTE?.description || ''}
                    onChange={(e) => setCurrentSession({
                      ...currentSession,
                      themeTE: { ...currentSession.themeTE, description: e.target.value }
                    })}
                    placeholder="Geste technique à la récupération du ballon&#10;Passe, contrôle, dribble, ..."
                    className="w-full bg-slate-50 border border-slate-300 rounded-xl p-2.5 font-medium focus:bg-white focus:outline-none focus:border-amber-500"
                  />
                </div>

                <div>
                  <label className="block font-bold text-slate-700 mb-1">Accents de Coaching (TE)</label>
                  <textarea
                    rows={3}
                    value={currentSession.themeTE?.coachingAccents || ''}
                    onChange={(e) => setCurrentSession({
                      ...currentSession,
                      themeTE: { ...currentSession.themeTE, coachingAccents: e.target.value }
                    })}
                    placeholder="Placement défensif&#10;Détermination et volonté de vouloir le ballon&#10;Défendre ensemble"
                    className="w-full bg-slate-50 border border-slate-300 rounded-xl p-2.5 font-medium focus:bg-white focus:outline-none focus:border-amber-500"
                  />
                </div>
              </div>
            </div>

            {/* 3. Thème TA (Tactique) */}
            <div className="bg-white rounded-2xl p-5 border border-slate-200 shadow-xs space-y-3">
              <div className="flex flex-wrap items-center justify-between gap-2 border-b border-slate-100 pb-2">
                <div className="flex items-center gap-2">
                  <span className="px-2.5 py-0.5 rounded-lg bg-blue-100 text-blue-900 font-extrabold text-xs">
                    THÈME TA (Tactique)
                  </span>
                  <span className="text-xs text-slate-500 font-medium hidden sm:inline">
                    Freiner, orienter, couper les lignes de passe, fermer l'axe
                  </span>
                </div>
                <button
                  type="button"
                  onClick={handleRefineThemeTA}
                  disabled={isRefiningTA}
                  className="px-2.5 py-1 bg-blue-50 hover:bg-blue-100 text-blue-900 border border-blue-300 rounded-lg text-[11px] font-bold flex items-center gap-1 transition-colors cursor-pointer disabled:opacity-50"
                  title="Améliorer le thème tactique et générer des repères tactiques ASF"
                >
                  {isRefiningTA ? <Loader2 className="w-3 h-3 animate-spin text-blue-700" /> : <Sparkles className="w-3 h-3 text-blue-700" />}
                  <span>{isRefiningTA ? 'Perfectionnement IA...' : 'Perfectionner IA ASF'}</span>
                </button>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs">
                <div>
                  <label className="block font-bold text-slate-700 mb-1">Description du Thème TA</label>
                  <textarea
                    rows={3}
                    value={currentSession.themeTA?.description || ''}
                    onChange={(e) => setCurrentSession({
                      ...currentSession,
                      themeTA: { ...currentSession.themeTA, description: e.target.value }
                    })}
                    placeholder="Freiner et orienter l'adversaire&#10;Couper les lignes de passe&#10;Fermer l'axe"
                    className="w-full bg-slate-50 border border-slate-300 rounded-xl p-2.5 font-medium focus:bg-white focus:outline-none focus:border-blue-500"
                  />
                </div>

                <div className="space-y-3">
                  <div className="grid grid-cols-2 gap-2">
                    <div>
                      <label className="block font-bold text-slate-700 mb-1">DEF ou OFF</label>
                      <select
                        value={currentSession.themeTA?.defOrOff || 'OFF'}
                        onChange={(e) => setCurrentSession({
                          ...currentSession,
                          themeTA: { ...currentSession.themeTA, defOrOff: e.target.value as any }
                        })}
                        className="w-full bg-slate-50 border border-slate-300 rounded-xl px-2.5 py-2 font-bold focus:bg-white focus:outline-none focus:border-blue-500"
                      >
                        <option value="OFF">OFF (Phase Offensive)</option>
                        <option value="DEF">DEF (Phase Défensive)</option>
                        <option value="DEF & OFF">DEF & OFF (Transition)</option>
                      </select>
                    </div>

                    <div>
                      <label className="block font-bold text-slate-700 mb-1">Antagonisme OFF / DEF</label>
                      <input
                        type="text"
                        value={currentSession.themeTA?.antagonism || ''}
                        onChange={(e) => setCurrentSession({
                          ...currentSession,
                          themeTA: { ...currentSession.themeTA, antagonism: e.target.value }
                        })}
                        placeholder="Volonté de vouloir gagner le ballon"
                        className="w-full bg-slate-50 border border-slate-300 rounded-xl px-2.5 py-2 font-semibold focus:bg-white focus:outline-none focus:border-blue-500"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block font-bold text-slate-700 mb-1">Accents de Coaching (TA complémentaires)</label>
                    <input
                      type="text"
                      value={currentSession.themeTA?.coachingAccents || ''}
                      onChange={(e) => setCurrentSession({
                        ...currentSession,
                        themeTA: { ...currentSession.themeTA, coachingAccents: e.target.value }
                      })}
                      placeholder="Cadrage porteur, couverture mutuelle..."
                      className="w-full bg-slate-50 border border-slate-300 rounded-xl px-2.5 py-1.5 font-medium focus:bg-white focus:outline-none focus:border-blue-500"
                    />
                  </div>
                </div>
              </div>
            </div>

            {/* 4. Thème PE (Physique / Psycho-émotionnel) */}
            <div className="bg-white rounded-2xl p-5 border border-slate-200 shadow-xs space-y-3">
              <div className="flex items-center gap-2 border-b border-slate-100 pb-2">
                <span className="px-2.5 py-0.5 rounded-lg bg-purple-100 text-purple-900 font-extrabold text-xs">
                  THÈME PE (Physique / Psycho-émotionnel)
                </span>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs">
                <div>
                  <label className="block font-bold text-slate-700 mb-1">Description Thème PE</label>
                  <input
                    type="text"
                    value={currentSession.themePE?.description || ''}
                    onChange={(e) => setCurrentSession({
                      ...currentSession,
                      themePE: { ...currentSession.themePE, description: e.target.value }
                    })}
                    placeholder="Vitesse de réaction, motricité, intensité..."
                    className="w-full bg-slate-50 border border-slate-300 rounded-xl px-3 py-2 font-medium focus:bg-white focus:outline-none focus:border-purple-500"
                  />
                </div>
                <div>
                  <label className="block font-bold text-slate-700 mb-1">Accents de Coaching (PE)</label>
                  <input
                    type="text"
                    value={currentSession.themePE?.coachingAccents || ''}
                    onChange={(e) => setCurrentSession({
                      ...currentSession,
                      themePE: { ...currentSession.themePE, coachingAccents: e.target.value }
                    })}
                    placeholder="Attitude positive, communication, dépassement de soi..."
                    className="w-full bg-slate-50 border border-slate-300 rounded-xl px-3 py-2 font-medium focus:bg-white focus:outline-none focus:border-purple-500"
                  />
                </div>
              </div>
            </div>

            {/* 5. Partie Initiale - Focus TE/KO */}
            <ExercisePartEditor
              partKey="initialPart"
              part={currentSession.initialPart}
              badgeColor="bg-emerald-100 text-emerald-900 border-emerald-300"
              isGenerating={isGeneratingPart === 'initialPart'}
              generatingSlotKey={generatingSlotKey}
              onGenerateAI={() => handleGeneratePartAI('initialPart')}
              onGenerateDiagramAI={(slot) => handleGenerateSlotDiagramAI('initialPart', slot)}
              onOpenAnimation={(slot) => handleOpenAnimation(currentSession.initialPart.title, currentSession.initialPart.description, currentSession.themeTE?.description || '', slot)}
              onChange={(updated) => setCurrentSession({ ...currentSession, initialPart: updated })}
              onOpenDiagram={(slot) => handleOpenDiagramModal('initialPart', currentSession.initialPart.title, slot)}
            />

            {/* 6. Formes Jouées - Focus TA */}
            <ExercisePartEditor
              partKey="playedForms"
              part={currentSession.playedForms}
              badgeColor="bg-blue-100 text-blue-900 border-blue-300"
              isGenerating={isGeneratingPart === 'playedForms'}
              generatingSlotKey={generatingSlotKey}
              onGenerateAI={() => handleGeneratePartAI('playedForms')}
              onGenerateDiagramAI={(slot) => handleGenerateSlotDiagramAI('playedForms', slot)}
              onOpenAnimation={(slot) => handleOpenAnimation(currentSession.playedForms.title, currentSession.playedForms.description, currentSession.themeTA?.description || '', slot)}
              onChange={(updated) => setCurrentSession({ ...currentSession, playedForms: updated })}
              onOpenDiagram={(slot) => handleOpenDiagramModal('playedForms', currentSession.playedForms.title, slot)}
            />

            {/* 7. Jeu Final - Focus TE/TA */}
            <ExercisePartEditor
              partKey="finalGame"
              part={currentSession.finalGame}
              badgeColor="bg-indigo-100 text-indigo-900 border-indigo-300"
              isGenerating={isGeneratingPart === 'finalGame'}
              generatingSlotKey={generatingSlotKey}
              onGenerateAI={() => handleGeneratePartAI('finalGame')}
              onGenerateDiagramAI={(slot) => handleGenerateSlotDiagramAI('finalGame', slot)}
              onOpenAnimation={(slot) => handleOpenAnimation(currentSession.finalGame.title, currentSession.finalGame.description, currentSession.themeTE?.description || '', slot)}
              onChange={(updated) => setCurrentSession({ ...currentSession, finalGame: updated })}
              onOpenDiagram={(slot) => handleOpenDiagramModal('finalGame', currentSession.finalGame.title, slot)}
            />

            {/* 8. Remarques & Individualisation */}
            <div className="bg-white rounded-2xl p-5 border border-slate-200 shadow-xs space-y-3">
              <div className="flex flex-wrap items-center justify-between gap-2 border-b border-slate-100 pb-2">
                <span className="font-extrabold text-xs text-slate-800">
                  Remarques et individualisation
                </span>
                <div className="flex items-center gap-2">
                  <span className="text-[10px] text-slate-500 hidden sm:inline">
                    Repères d'individualisation & contenus spécifiques
                  </span>
                  <button
                    type="button"
                    onClick={handleSuggestIndividualization}
                    disabled={isRefiningIndiv}
                    className="px-2 py-0.5 bg-emerald-50 hover:bg-emerald-100 text-emerald-900 border border-emerald-300 rounded-lg text-[10px] font-bold flex items-center gap-1 transition-colors cursor-pointer disabled:opacity-50"
                  >
                    {isRefiningIndiv ? <Loader2 className="w-3 h-3 animate-spin text-emerald-700" /> : <Sparkles className="w-3 h-3 text-emerald-700" />}
                    <span>{isRefiningIndiv ? 'Génération...' : 'Suggérer individualisation ASF'}</span>
                  </button>
                </div>
              </div>

              <textarea
                rows={3}
                value={currentSession.remarksAndIndividualization || ''}
                onChange={(e) => setCurrentSession({ ...currentSession, remarksAndIndividualization: e.target.value })}
                placeholder="Consignes particulières, travail individualisé pour certains joueurs, points d'attention..."
                className="w-full bg-slate-50 border border-slate-300 rounded-xl p-3 text-xs font-medium focus:bg-white focus:outline-none focus:border-emerald-500"
              />

              {/* Individualisation Guide Bar */}
              <div className="p-3 bg-slate-50 rounded-xl border border-slate-200 grid grid-cols-1 sm:grid-cols-2 gap-3 text-[11px]">
                <div>
                  <span className="font-bold text-slate-800 block mb-0.5">Individualisation :</span>
                  <div className="text-slate-600 space-y-0.5">
                    <div>• Intégration entraînement</div>
                    <div>• Temps à disposition</div>
                    <div>• Espace à disposition</div>
                  </div>
                </div>
                <div>
                  <span className="font-bold text-slate-800 block mb-0.5">Contenus :</span>
                  <div className="text-slate-600 space-y-0.5">
                    <div>• Travail spécifique à niveau</div>
                    <div>• Travail spécifique au poste</div>
                    <div>• Devoirs techniques</div>
                  </div>
                </div>
              </div>
            </div>

            {/* 9. Bilan */}
            <div className="bg-white rounded-2xl p-5 border border-slate-200 shadow-xs space-y-2">
              <label className="block font-bold text-xs text-slate-800">
                Bilan de la séance
              </label>
              <textarea
                rows={2}
                value={currentSession.bilan || ''}
                onChange={(e) => setCurrentSession({ ...currentSession, bilan: e.target.value })}
                placeholder="Évaluation globale de l'entraînement, comportements observés, axes d'amélioration pour la prochaine séance..."
                className="w-full bg-slate-50 border border-slate-300 rounded-xl p-3 text-xs font-medium focus:bg-white focus:outline-none focus:border-emerald-500"
              />
            </div>

          </div>
        )}

        {/* ----------------------------------------------------
            VIEW 3: PRINTABLE PREVIEW (MATCHING SCREENSHOT)
           ---------------------------------------------------- */}
        {activeView === 'preview' && currentSession && (
          <div className="flex-1 overflow-y-auto p-4 sm:p-8 bg-slate-200 flex justify-center">
            <div className="shadow-2xl bg-white rounded-lg p-2 max-w-[210mm] w-full">
              <PrintableTrainingSheet session={currentSession} />
            </div>
          </div>
        )}

      </div>

      {/* Tactical Canvas / Presets Picker Modal */}
      {tacticalModalState.isOpen && (
        <PitchTacticalCanvasModal
          isOpen={tacticalModalState.isOpen}
          onClose={() => setTacticalModalState({ ...tacticalModalState, isOpen: false })}
          initialImage={tacticalModalState.initialDrawing.image}
          initialCoach={tacticalModalState.initialDrawing.coach}
          initialCaption={tacticalModalState.initialDrawing.caption}
          partTitle={tacticalModalState.partTitle}
          slotName={tacticalModalState.slotName}
          exerciseDescription={tacticalModalState.exerciseDescription}
          themeTitle={tacticalModalState.themeTitle}
          category={tacticalModalState.category}
          onSave={handleSaveDrawing}
        />
      )}

      {/* AI FootEco Session Generator Modal */}
      <AITrainingGeneratorModal
        isOpen={isAiModalOpen}
        onClose={() => setIsAiModalOpen(false)}
        onApplySession={handleApplyAiSession}
        defaultCoach={currentSession?.coach || 'Sébastien M.'}
        defaultAssistantCoach={currentSession?.assistantCoach || 'Miguel R.'}
        defaultCategory={currentSession?.team || 'FE12'}
        defaultSeason={currentSession?.season || (selectedSeasonFilter !== 'all' ? selectedSeasonFilter : '2025/2026')}
      />

      {/* Interactive Exercise Animation & Detailed Explanation Modal */}
      {animationModalState.isOpen && (
        <ExerciseAnimationModal
          isOpen={animationModalState.isOpen}
          onClose={() => setAnimationModalState(prev => ({ ...prev, isOpen: false }))}
          partTitle={animationModalState.partTitle}
          partDescription={animationModalState.partDescription}
          partFocus={animationModalState.partFocus}
          slotName={animationModalState.slotName}
          category={animationModalState.category}
          session={currentSession || undefined}
        />
      )}

    </div>
  );
};

// -------------------------------------------------------------------
// Sub-component: Exercise Part Editor (Initial Part, Played Forms, Final Game)
// -------------------------------------------------------------------
interface ExercisePartEditorProps {
  partKey: string;
  part: TrainingExercisePart;
  badgeColor: string;
  isGenerating?: boolean;
  generatingSlotKey?: string | null;
  onGenerateAI?: () => void;
  onGenerateDiagramAI?: (slot: 'Dessin 1' | 'Dessin 2') => void;
  onOpenAnimation?: (slot?: 'Dessin 1' | 'Dessin 2' | 'Complet') => void;
  onChange: (updated: TrainingExercisePart) => void;
  onOpenDiagram: (slot: 'Dessin 1' | 'Dessin 2') => void;
}

const ExercisePartEditor: React.FC<ExercisePartEditorProps> = ({
  partKey,
  part,
  badgeColor,
  isGenerating = false,
  generatingSlotKey = null,
  onGenerateAI,
  onGenerateDiagramAI,
  onOpenAnimation,
  onChange,
  onOpenDiagram,
}) => {
  const renderDrawingBox = (
    drawing: TrainingDrawing,
    slotName: 'Dessin 1' | 'Dessin 2'
  ) => {
    const isSvg = drawing?.image?.startsWith('<svg');
    const isSlotGenerating = generatingSlotKey === `${partKey}-${slotName}`;

    return (
      <div className="flex-1 bg-slate-50 rounded-xl border border-slate-200 p-2.5 flex flex-col justify-between">
        <div className="flex items-center justify-between mb-1.5 gap-1">
          <span className="text-[11px] font-extrabold text-slate-700">{slotName}</span>
          <div className="flex items-center gap-1">
            {onOpenAnimation && (
              <button
                type="button"
                onClick={() => onOpenAnimation(slotName)}
                className="text-[10px] font-bold text-red-700 bg-red-50 hover:bg-red-100 border border-red-300 px-2 py-0.5 rounded-lg flex items-center gap-1 transition-colors cursor-pointer"
                title="Voir l'animation de cet atelier"
              >
                <Play className="w-2.5 h-2.5 fill-red-600 text-red-600" />
                <span>Animation</span>
              </button>
            )}
            <button
              type="button"
              onClick={() => onGenerateDiagramAI?.(slotName)}
              disabled={isSlotGenerating}
              className="text-[10px] font-bold text-amber-800 bg-amber-50 hover:bg-amber-100 border border-amber-300 px-2 py-0.5 rounded-lg flex items-center gap-1 transition-colors disabled:opacity-50 cursor-pointer"
              title="Générer automatiquement un schéma adapté au détail de cet exercice"
            >
              {isSlotGenerating ? (
                <Loader2 className="w-3 h-3 animate-spin text-amber-700" />
              ) : (
                <Sparkles className="w-3 h-3 text-amber-600" />
              )}
              <span>{isSlotGenerating ? 'Génération...' : 'Schéma IA'}</span>
            </button>
            <button
              type="button"
              onClick={() => onOpenDiagram(slotName)}
              className="text-[10px] font-bold text-emerald-700 bg-emerald-50 hover:bg-emerald-100 border border-emerald-300 px-2 py-0.5 rounded-lg flex items-center gap-1 transition-colors cursor-pointer"
            >
              <ImageIcon className="w-3 h-3" />
              <span>{drawing?.image ? 'Modifier' : '+ Schéma'}</span>
            </button>
          </div>
        </div>

        {/* Thumbnail Preview */}
        <div 
          onClick={() => onOpenDiagram(slotName)}
          className="w-full h-24 bg-white rounded-lg border border-slate-200 flex flex-col items-center justify-center p-1 cursor-pointer hover:border-emerald-400 transition-colors overflow-hidden group"
        >
          {drawing?.image ? (
            isSvg ? (
              <div
                className="w-full h-full flex items-center justify-center"
                dangerouslySetInnerHTML={{ __html: drawing.image }}
              />
            ) : (
              <img
                src={drawing.image}
                alt="Schéma d'atelier"
                className="max-h-full object-contain"
              />
            )
          ) : (
            <div className="text-center text-slate-400 group-hover:text-emerald-600 transition-colors">
              <ImageIcon className="w-6 h-6 mx-auto mb-1 opacity-50" />
              <span className="text-[10px] font-bold">Cliquez pour choisir un schéma</span>
            </div>
          )}
        </div>

        {/* Bottom Coach badge & caption */}
        <div className="mt-2 flex items-center justify-between text-[10px]">
          {drawing?.coach ? (
            <span className="font-extrabold text-slate-900 bg-slate-200 px-2 py-0.5 rounded">
              Coach : {drawing.coach}
            </span>
          ) : (
            <span className="text-slate-400 italic">Sans coach assigné</span>
          )}

          {drawing?.caption && (
            <span className="text-slate-600 font-semibold truncate max-w-[120px]" title={drawing.caption}>
              {drawing.caption}
            </span>
          )}
        </div>
      </div>
    );
  };

  return (
    <div className="bg-white rounded-2xl p-5 border border-slate-200 shadow-xs space-y-4">
      {/* Title bar */}
      <div className="flex flex-wrap items-center justify-between gap-2 border-b border-slate-100 pb-3">
        <div className="flex items-center gap-2 flex-1">
          <input
            type="text"
            value={part.title}
            onChange={(e) => onChange({ ...part, title: e.target.value })}
            className="font-extrabold text-xs sm:text-sm text-slate-900 bg-slate-50 border border-slate-300 rounded-xl px-3 py-1.5 focus:bg-white focus:outline-none focus:border-emerald-500 max-w-sm"
          />

          {onGenerateAI && (
            <button
              type="button"
              onClick={onGenerateAI}
              disabled={isGenerating}
              className="px-2.5 py-1 bg-gradient-to-r from-red-500/10 to-amber-500/10 hover:from-red-500/20 hover:to-amber-500/20 text-red-900 border border-red-200 rounded-xl text-[11px] font-bold flex items-center gap-1 transition-colors cursor-pointer disabled:opacity-50"
              title="Générer automatiquement cet atelier FootEco avec des schémas tactiques ASF adaptés"
            >
              {isGenerating ? (
                <Loader2 className="w-3 h-3 animate-spin text-red-600" />
              ) : (
                <Sparkles className="w-3 h-3 text-red-600" />
              )}
              <span>{isGenerating ? 'Génération IA...' : 'Générer cet atelier (IA ASF)'}</span>
            </button>
          )}
        </div>

        <div className="flex items-center gap-2">
          {onOpenAnimation && (
            <button
              type="button"
              onClick={() => onOpenAnimation('Complet')}
              className="px-2.5 py-1 bg-gradient-to-r from-red-600 to-amber-600 hover:from-red-500 hover:to-amber-500 text-white font-extrabold rounded-xl text-[11px] flex items-center gap-1.5 shadow-xs active:scale-95 transition-all cursor-pointer"
              title="Lancer l'animation interactive et l'explication détaillée de cet atelier FootEco"
            >
              <Play className="w-3.5 h-3.5 fill-white" />
              <span>Animer l'atelier</span>
            </button>
          )}

          <span className="text-xs font-bold text-slate-600">Durée :</span>
          <input
            type="text"
            value={part.duration}
            onChange={(e) => onChange({ ...part, duration: e.target.value })}
            placeholder="2X 15 min (Total 30 min)"
            className="bg-slate-50 border border-slate-300 rounded-xl px-3 py-1 text-xs font-bold text-slate-800 w-36 focus:bg-white focus:outline-none focus:border-emerald-500 text-center"
          />
        </div>
      </div>

      {/* Grid: Description on Left, 2 Drawings on Right */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-4">
        <div className="lg:col-span-5 flex flex-col">
          <label className="block font-bold text-xs text-slate-700 mb-1">
            Description détaillée des ateliers :
          </label>
          <textarea
            rows={6}
            value={part.description}
            onChange={(e) => onChange({ ...part, description: e.target.value })}
            placeholder="Dessin 1 = Duel 1 contre 1...&#10;Dessin 2 = Duel 1 contre 1..."
            className="w-full flex-1 bg-slate-50 border border-slate-300 rounded-xl p-3 text-xs font-medium focus:bg-white focus:outline-none focus:border-emerald-500 leading-relaxed resize-none"
          />
        </div>

        <div className="lg:col-span-7 grid grid-cols-1 sm:grid-cols-2 gap-3">
          {renderDrawingBox(part.drawing1, 'Dessin 1')}
          {renderDrawingBox(part.drawing2, 'Dessin 2')}
        </div>
      </div>
    </div>
  );
};
