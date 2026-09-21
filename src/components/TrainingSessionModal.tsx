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
import { FormattedDrillDescription } from './FormattedDrillDescription';
import { splitDrillDescription, combineDrillDescription } from '../utils/drillDescription';
import { extractDrillSlotText } from '../utils/drillAnimations';
import { refineThemeWithAI, generateExercisePartWithAI, generateDrillDiagramWithAI } from '../utils/aiTrainingGenerator';

interface TrainingSessionModalProps {
  isOpen: boolean;
  onClose: () => void;
  initialSessionId?: string;
  defaultSeason?: string;
  isEmbedded?: boolean;
}

export const TrainingSessionModal: React.FC<TrainingSessionModalProps> = ({
  isOpen,
  onClose,
  initialSessionId,
  defaultSeason,
  isEmbedded = false,
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
    partKey?: 'initialPart' | 'playedForms' | 'finalGame';
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
    slotName?: 'Dessin 1' | 'Dessin 2' | 'Complet',
    partKey?: 'initialPart' | 'playedForms' | 'finalGame'
  ) => {
    setAnimationModalState({
      isOpen: true,
      partTitle,
      partDescription,
      partFocus,
      slotName,
      category: currentSession?.team || 'FE12',
      partKey
    });
  };

  const handleSaveAnimationScenario = (scenario: any, slotName?: 'Dessin 1' | 'Dessin 2' | 'Complet') => {
    if (!currentSession) return;
    const updated = JSON.parse(JSON.stringify(currentSession));
    const pKey = animationModalState.partKey || 'initialPart';

    if (updated[pKey]) {
      const part = updated[pKey];
      if (slotName === 'Dessin 1') {
        if (!part.drawing1) part.drawing1 = {};
        part.drawing1.animationScenario = scenario;
      } else if (slotName === 'Dessin 2') {
        if (!part.drawing2) part.drawing2 = {};
        part.drawing2.animationScenario = scenario;
      } else {
        part.animationScenario = scenario;
      }
      setCurrentSession(updated);
      saveTrainingSession(updated);
      setSessions(loadTrainingSessions());
    }
  };

  // Reload sessions when opening or when embedded mode mounts
  useEffect(() => {
    if (isOpen || isEmbedded) {
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
  }, [isOpen, isEmbedded, initialSessionId]);

  if (!isOpen && !isEmbedded) return null;

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
        coach: currentSession.coach?.split(' ')[0] || 'Miguel',
        assistantCoach: currentSession.assistantCoach?.split(' ')[0] || 'SEB',
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

  const modalInnerContent = (
    <div className={`bg-slate-100 rounded-2xl shadow-xl border border-slate-300 w-full ${isEmbedded ? 'min-h-[84vh]' : 'max-w-5xl h-[94vh]'} flex flex-col overflow-hidden text-slate-800`}>
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
                            {session.coach || 'Miguel R.'}
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
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-3 text-xs">
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
                    placeholder="Miguel R."
                    className="w-full bg-slate-50 border border-slate-300 rounded-xl px-3 py-2 font-bold focus:bg-white focus:outline-none focus:border-emerald-500"
                  />
                </div>

                <div>
                  <label className="block font-bold text-slate-700 mb-1">Entraîneur adjoint</label>
                  <CoachAutocompleteInput
                    value={currentSession.assistantCoach || ''}
                    onChange={(val) => setCurrentSession({ ...currentSession, assistantCoach: val })}
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
              defaultCoach={currentSession.coach}
              defaultAssistantCoach={currentSession.assistantCoach}
              onGenerateAI={() => handleGeneratePartAI('initialPart')}
              onGenerateDiagramAI={(slot) => handleGenerateSlotDiagramAI('initialPart', slot)}
              onOpenAnimation={(slot) => handleOpenAnimation(currentSession.initialPart.title, currentSession.initialPart.description, currentSession.themeTE?.description || '', slot, 'initialPart')}
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
              defaultCoach={currentSession.coach}
              defaultAssistantCoach={currentSession.assistantCoach}
              onGenerateAI={() => handleGeneratePartAI('playedForms')}
              onGenerateDiagramAI={(slot) => handleGenerateSlotDiagramAI('playedForms', slot)}
              onOpenAnimation={(slot) => handleOpenAnimation(currentSession.playedForms.title, currentSession.playedForms.description, currentSession.themeTA?.description || '', slot, 'playedForms')}
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
              defaultCoach={currentSession.coach}
              defaultAssistantCoach={currentSession.assistantCoach}
              onGenerateAI={() => handleGeneratePartAI('finalGame')}
              onGenerateDiagramAI={(slot) => handleGenerateSlotDiagramAI('finalGame', slot)}
              onOpenAnimation={(slot) => handleOpenAnimation(currentSession.finalGame.title, currentSession.finalGame.description, currentSession.themeTE?.description || '', slot, 'finalGame')}
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
    );

  const renderSecondaryModals = () => (
    <>
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
        defaultCoach={currentSession?.coach || 'Miguel R.'}
        defaultAssistantCoach={currentSession?.assistantCoach || 'Sébastien M.'}
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
          onSaveScenario={handleSaveAnimationScenario}
        />
      )}
    </>
  );

  if (isEmbedded) {
    return (
      <div className="w-full space-y-4 animate-in fade-in duration-200">
        {modalInnerContent}
        {renderSecondaryModals()}
      </div>
    );
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-2 sm:p-4 bg-slate-900/80 backdrop-blur-xs animate-in fade-in duration-200">
      {modalInnerContent}
      {renderSecondaryModals()}
    </div>
  );
};

// -------------------------------------------------------------------
// Sub-component: Exercise Part Editor (Initial Part, Played Forms, Final Game)
// -------------------------------------------------------------------
const PLAYED_FORMS_FOOTECO_PRESETS = [
  {
    title: '3c2 Décalage & 4c3 Intervalle',
    tag: 'Attaque / Supériorité',
    d1Caption: '3 contre 2 avec décalage rapide',
    d1Coach: 'Miguel R.',
    d1Text: `Situation 3 contre 2 + gardien sur demi-terrain.\nLes 3 attaquants fixent le défenseur central pour créer un décalage rapide vers l'ailier libre à l'opposé.\n\nRègles :\n- Finition obligatoire en moins de 6 secondes dès l'entrée dans les 16 mètres.\n- 1 point par but marqué, 2 points si frappe en une touche.\n\nVariantes :\n- Ajouter un repli défensif d'un 3e défenseur après 3 secondes.\n\nCoaching :\n- Fixer avant de donner, orienter le corps vers le but adverse.`,
    d2Caption: '4 contre 3 avec passe dans l\'intervalle clé',
    d2Coach: 'Sébastien M.',
    d2Text: `Forme jouée 4 contre 3 avec zone intermédiaire protégée.\nL'objectif est de trouver l'attaquant de pointe par une passe au sol qui traverse la ligne défensive médiane.\n\nRègles :\n- 2 touches de balle obligatoires dans l'intervalle central.\n- But valable uniquement si précédé d'une passe traversante.\n\nVariantes :\n- Jeu libre dès que le ballon a franchi l'intervalle.\n\nCoaching :\n- Déplacements synchronisés : appui court / appel en profondeur.`,
  },
  {
    title: '1c1 en 4 zones & 2c1 en vagues',
    tag: 'Duels & Percussion',
    d1Caption: '1c1 en 4 zones délimitées',
    d1Coach: 'Miguel R.',
    d1Text: `Forme jouée 1 contre 1 dans 4 couloirs parallèles avec 2 mini-buts opposés.\nChaque joueur doit éliminer son vis-à-vis pour marquer.\n\nRègles :\n- 8 secondes maximum par duel.\n- Feinte ou changement de rythme obligatoire avant la frappe.\n\nCoaching :\n- Accélération explosive dès le déséquilibre créé, feinte de corps nette.`,
    d2Caption: '2 contre 1 en vagues offensives',
    d2Coach: 'Sébastien M.',
    d2Text: `Situation 2 contre 1 en transition rapide sur grand but avec gardien.\nDépart alterné des côtés gauche et droit.\n\nRègles :\n- 5 secondes chrono pour conclure.\n- Le défenseur marque dans 2 mini-buts s'il récupère le ballon.\n\nCoaching :\n- Conduite agressive vers le défenseur pour l'obliger à faire un choix.`,
  },
  {
    title: 'Double Carré 4c2 & Transition 3c2',
    tag: 'Transitions & Récupération',
    d1Caption: 'Double carré de conservation 4c2',
    d1Coach: 'Miguel R.',
    d1Text: `Rondo 4 contre 2 en deux carrés contigus de 12x12m.\nDès récupération, les 2 chasseurs transmettent dans le 2e carré et rejoignent leurs partenaires.\n\nRègles :\n- 6 passes consécutives = 1 point pour l'équipe en possession.\n\nCoaching :\n- Qualité de première touche et disponibilité du joueur de soutien.`,
    d2Caption: '3 contre 2 de transition rapide',
    d2Coach: 'Sébastien M.',
    d2Text: `Situation de contre-attaque 3 contre 2 consécutive à une perte de balle simulée.\n\nRègles :\n- Repli défensif immédiat (règle des 3 secondes FootEco).\n- Finition rapide au premier ou deuxième poteau.\n\nCoaching :\n- Vitesse de réaction mentale et communication défensive.`,
  },
  {
    title: 'Sortie de balle 4c3 & Rondo 5c3',
    tag: 'Construction basse & Pressing',
    d1Caption: 'Sortie de balle 4c3 + Gardien',
    d1Coach: 'Miguel R.',
    d1Text: `Sortie de balle depuis les 16m : 4 défenseurs + 1 gardien face à 3 attaquants presseurs.\nObjectif : franchir la ligne médiane par la passe ou la conduite.\n\nRègles :\n- Le gardien joue en 2 touches max.\n- Si les presseurs récupèrent, tir direct autorisé.\n\nCoaching :\n- Écarter les défenseurs centraux, offrir deux solutions diagonales.`,
    d2Caption: 'Rondo 5 contre 3 en progression',
    d2Coach: 'Sébastien M.',
    d2Text: `Conservation 5 contre 3 dans un rectangle 20x15m orienté.\nObjectif : trouver le joueur libre entre les lignes de pressing adverse.\n\nRègles :\n- 2 touches de balle max pour tous les joueurs.\n\nCoaching :\n- Prise d'information avant la réception (scanner le terrain).`,
  },
  {
    title: 'Finitions 3c2 (5s) & Tirs 2v2 1-touche',
    tag: 'Zone de vérité & Tirs rapides',
    d1Caption: '3c2 avec compte à rebours 5s',
    d1Coach: 'Miguel R.',
    d1Text: `3 contre 2 en zone de finition : obligation de frapper dans les 5 secondes suivant l'entrée dans la zone des 16m.\n\nRègles :\n- 2 touches max avant la frappe.\n- 1 point par but, 2 points si frappe au sol petit filet.\n\nCoaching :\n- Prise de décision rapide, frappe cadrée au sol.`,
    d2Caption: 'Duel de frappes 2v2 + 2 appuis',
    d2Coach: 'Sébastien M.',
    d2Text: `Duel de frappes 2v2 + 2 appuis latéraux avec tirs obligatoires en une touche de balle sur service de l'appui.\n\nRègles :\n- Tout tir hors-cadre = possession immédiate à l'adversaire.\n\nCoaching :\n- Orientation du pied d'appui et verrouillage de la cheville.`,
  }
];

interface ExercisePartEditorProps {
  partKey: string;
  part: TrainingExercisePart;
  badgeColor: string;
  isGenerating?: boolean;
  generatingSlotKey?: string | null;
  defaultCoach?: string;
  defaultAssistantCoach?: string;
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
  defaultCoach = 'Miguel R.',
  defaultAssistantCoach = 'Sébastien M.',
  onGenerateAI,
  onGenerateDiagramAI,
  onOpenAnimation,
  onChange,
  onOpenDiagram,
}) => {
  // Default to the dedicated 'ateliers-split' view so Dessin 1 and Dessin 2 are immediately visible and editable with their descriptions
  const [descViewMode, setDescViewMode] = useState<'ateliers-split' | 'formatted' | 'edit-raw'>('ateliers-split');

  const parsed = splitDrillDescription(
    part.description || '',
    part.drawing1?.caption,
    part.drawing2?.caption,
    part.drawing1?.coach || defaultCoach,
    part.drawing2?.coach || defaultAssistantCoach
  );

  const slot1Text = parsed.atelier1?.rawText || extractDrillSlotText(part.description, 'Dessin 1') || '';
  const slot2Text = parsed.atelier2?.rawText || extractDrillSlotText(part.description, 'Dessin 2') || '';

  const handleUpdateSlotText = (slot: 'Dessin 1' | 'Dessin 2', newText: string) => {
    const s1 = slot === 'Dessin 1' ? newText : slot1Text;
    const s2 = slot === 'Dessin 2' ? newText : slot2Text;
    const combined = combineDrillDescription(s1, s2);
    onChange({ ...part, description: combined });
  };

  const handleInsertHelperPrompt = (slot: 'Dessin 1' | 'Dessin 2', promptType: 'regles' | 'variantes' | 'coaching') => {
    const current = slot === 'Dessin 1' ? slot1Text : slot2Text;
    let snippet = '';
    if (promptType === 'regles') {
      snippet = '\n\nRègles :\n- 2 touches de balle obligatoires.\n- Finition en moins de 6 secondes.';
    } else if (promptType === 'variantes') {
      snippet = '\n\nVariantes :\n- Ajouter un repli défensif après 3 secondes.\n- Agrandir/réduire l\'espace de jeu.';
    } else if (promptType === 'coaching') {
      snippet = '\n\nCoaching :\n- Fixer l\'adversaire avant de donner.\n- Prise d\'information avant la réception.';
    }
    handleUpdateSlotText(slot, (current + snippet).trim());
  };

  const handleApplyPreset = (preset: typeof PLAYED_FORMS_FOOTECO_PRESETS[0]) => {
    const combined = combineDrillDescription(preset.d1Text, preset.d2Text);
    onChange({
      ...part,
      description: combined,
      drawing1: {
        ...part.drawing1,
        caption: preset.d1Caption,
        coach: part.drawing1?.coach || preset.d1Coach || defaultCoach,
      },
      drawing2: {
        ...part.drawing2,
        caption: preset.d2Caption,
        coach: part.drawing2?.coach || preset.d2Coach || defaultAssistantCoach,
      }
    });
  };

  const handleUpdateDrawing = (slot: 'Dessin 1' | 'Dessin 2', updates: Partial<TrainingDrawing>) => {
    if (slot === 'Dessin 1') {
      onChange({
        ...part,
        drawing1: {
          ...part.drawing1,
          ...updates
        }
      });
    } else {
      onChange({
        ...part,
        drawing2: {
          ...part.drawing2,
          ...updates
        }
      });
    }
  };

  const renderDrawingBox = (
    drawing: TrainingDrawing,
    slotName: 'Dessin 1' | 'Dessin 2'
  ) => {
    const isSvg = drawing?.image?.startsWith('<svg');
    const isSlotGenerating = generatingSlotKey === `${partKey}-${slotName}`;

    return (
      <div className="bg-slate-50 rounded-xl border border-slate-200 p-2.5 flex flex-col justify-between">
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

      {/* Preset suggestions for Formes Jouées (Focus TA) */}
      {partKey === 'playedForms' && (
        <div className="bg-blue-50/70 border border-blue-200/80 rounded-xl p-2.5 space-y-2">
          <div className="flex items-center justify-between text-xs">
            <span className="font-extrabold text-blue-900 flex items-center gap-1.5">
              <Sparkles className="w-3.5 h-3.5 text-blue-600" />
              Exemples FootEco ASF pour Formes Jouées (Dessin 1 & Dessin 2) :
            </span>
            <span className="text-[10px] text-blue-700 font-medium">1 clic pour appliquer Dessin 1 + Dessin 2</span>
          </div>
          <div className="flex items-center gap-1.5 flex-wrap">
            {PLAYED_FORMS_FOOTECO_PRESETS.map((preset, idx) => (
              <button
                key={idx}
                type="button"
                onClick={() => handleApplyPreset(preset)}
                className="px-2.5 py-1 bg-white hover:bg-blue-600 hover:text-white text-blue-900 border border-blue-200 rounded-lg text-[11px] font-bold transition-all shadow-2xs cursor-pointer flex items-center gap-1 group"
                title={`${preset.tag} : ${preset.d1Caption} + ${preset.d2Caption}`}
              >
                <span>{preset.title}</span>
                <span className="text-[9px] bg-blue-100 group-hover:bg-blue-800 text-blue-700 group-hover:text-blue-100 px-1 py-0.2 rounded font-medium">
                  {preset.tag}
                </span>
              </button>
            ))}
          </div>
        </div>
      )}

      {/* View Mode Switcher */}
      <div className="flex items-center justify-between gap-2 flex-wrap border-b border-slate-100 pb-2">
        <div className="flex items-center gap-2">
          <span className="font-black text-xs text-slate-800">
            Disposition des Ateliers & Descriptions :
          </span>
          <span className="text-[10px] text-slate-500 font-medium hidden sm:inline">
            (Dessin 1 = Atelier 1 • Dessin 2 = Atelier 2)
          </span>
        </div>

        <div className="flex items-center gap-1 bg-slate-100 p-1 rounded-xl border border-slate-200">
          <button
            type="button"
            onClick={() => setDescViewMode('ateliers-split')}
            className={`px-2.5 py-1 rounded-lg text-[11px] font-black transition-all cursor-pointer flex items-center gap-1 ${
              descViewMode === 'ateliers-split'
                ? 'bg-slate-900 text-white shadow-2xs'
                : 'text-slate-600 hover:text-slate-900 hover:bg-slate-200'
            }`}
            title="Édition directe côte-à-côte : chaque dessin avec sa propre description"
          >
            <span>👥 2 Ateliers (Dessin 1 & 2)</span>
          </button>

          <button
            type="button"
            onClick={() => setDescViewMode('formatted')}
            className={`px-2.5 py-1 rounded-lg text-[11px] font-black transition-all cursor-pointer flex items-center gap-1 ${
              descViewMode === 'formatted'
                ? 'bg-slate-900 text-white shadow-2xs'
                : 'text-slate-600 hover:text-slate-900 hover:bg-slate-200'
            }`}
            title="Aperçu synthèse selon la feuille de séance officielle"
          >
            <span>✨ Aperçu Synthèse</span>
          </button>

          <button
            type="button"
            onClick={() => setDescViewMode('edit-raw')}
            className={`px-2.5 py-1 rounded-lg text-[11px] font-black transition-all cursor-pointer flex items-center gap-1 ${
              descViewMode === 'edit-raw'
                ? 'bg-slate-700 text-white shadow-2xs'
                : 'text-slate-600 hover:text-slate-900 hover:bg-slate-200'
            }`}
            title="Édition texte brut intégral"
          >
            <span>✏️ Texte Brut</span>
          </button>
        </div>
      </div>

      {/* MODE 1: ATELIERS SPLIT (Dessin 1 & Dessin 2 side-by-side with dedicated descriptions) */}
      {descViewMode === 'ateliers-split' && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          
          {/* ATELIER 1 / DESSIN 1 CARD */}
          <div className="bg-gradient-to-b from-red-50/40 to-white border-2 border-red-200 rounded-2xl p-4 shadow-2xs space-y-3">
            {/* Header */}
            <div className="flex items-center justify-between gap-2 border-b border-red-100 pb-2">
              <div className="flex items-center gap-2">
                <span className="w-5 h-5 rounded-full bg-red-600 text-white flex items-center justify-center text-xs font-black">1</span>
                <span className="font-extrabold text-sm text-red-900">Atelier 1 (Dessin 1)</span>
              </div>
              
              {/* Coach selector/input */}
              <div className="flex items-center gap-1 text-[11px]">
                <span className="font-bold text-slate-500">Coach :</span>
                <input
                  type="text"
                  value={part.drawing1?.coach || defaultCoach}
                  onChange={(e) => handleUpdateDrawing('Dessin 1', { coach: e.target.value })}
                  placeholder={defaultCoach}
                  className="bg-white border border-red-300 rounded-lg px-2 py-0.5 text-[11px] font-extrabold text-red-900 w-28 focus:outline-none focus:ring-1 focus:ring-red-400"
                />
              </div>
            </div>

            {/* Subtitle / Caption */}
            <div>
              <label className="block text-[10px] font-black uppercase text-slate-500 mb-1">
                Titre / Thème spécifique Dessin 1 :
              </label>
              <input
                type="text"
                value={part.drawing1?.caption || ''}
                onChange={(e) => handleUpdateDrawing('Dessin 1', { caption: e.target.value })}
                placeholder="Ex: 3 contre 2 avec fixation et décalage rapide"
                className="w-full bg-white border border-slate-300 rounded-xl px-2.5 py-1.5 text-xs font-bold text-slate-800 focus:outline-none focus:border-red-400"
              />
            </div>

            {/* Tactical Diagram Preview & Buttons */}
            {renderDrawingBox(part.drawing1, 'Dessin 1')}

            {/* Dedicated Description for Dessin 1 */}
            <div className="space-y-1.5 pt-1">
              <div className="flex items-center justify-between gap-1 flex-wrap">
                <label className="block text-[11px] font-black text-red-900 flex items-center gap-1">
                  <span>📝 Description & Consignes (Dessin 1) :</span>
                </label>
                <div className="flex items-center gap-1">
                  <button
                    type="button"
                    onClick={() => handleInsertHelperPrompt('Dessin 1', 'regles')}
                    className="text-[9px] font-bold bg-white hover:bg-red-100 text-red-800 border border-red-200 px-1.5 py-0.5 rounded cursor-pointer"
                  >
                    + Règles
                  </button>
                  <button
                    type="button"
                    onClick={() => handleInsertHelperPrompt('Dessin 1', 'variantes')}
                    className="text-[9px] font-bold bg-white hover:bg-red-100 text-red-800 border border-red-200 px-1.5 py-0.5 rounded cursor-pointer"
                  >
                    + Variantes
                  </button>
                  <button
                    type="button"
                    onClick={() => handleInsertHelperPrompt('Dessin 1', 'coaching')}
                    className="text-[9px] font-bold bg-white hover:bg-red-100 text-red-800 border border-red-200 px-1.5 py-0.5 rounded cursor-pointer"
                  >
                    + Coaching
                  </button>
                </div>
              </div>
              <textarea
                rows={7}
                value={slot1Text}
                onChange={(e) => handleUpdateSlotText('Dessin 1', e.target.value)}
                placeholder="Consignes détaillées pour le Dessin 1 : organisation, règles, variantes et points clés..."
                className="w-full bg-white border border-red-300 rounded-xl p-3 text-xs font-medium focus:outline-none focus:ring-2 focus:ring-red-400 leading-relaxed resize-none shadow-2xs"
              />
            </div>
          </div>

          {/* ATELIER 2 / DESSIN 2 CARD */}
          <div className="bg-gradient-to-b from-blue-50/40 to-white border-2 border-blue-200 rounded-2xl p-4 shadow-2xs space-y-3">
            {/* Header */}
            <div className="flex items-center justify-between gap-2 border-b border-blue-100 pb-2">
              <div className="flex items-center gap-2">
                <span className="w-5 h-5 rounded-full bg-blue-600 text-white flex items-center justify-center text-xs font-black">2</span>
                <span className="font-extrabold text-sm text-blue-900">Atelier 2 (Dessin 2)</span>
              </div>

              {/* Coach selector/input */}
              <div className="flex items-center gap-1 text-[11px]">
                <span className="font-bold text-slate-500">Coach :</span>
                <input
                  type="text"
                  value={part.drawing2?.coach || defaultAssistantCoach}
                  onChange={(e) => handleUpdateDrawing('Dessin 2', { coach: e.target.value })}
                  placeholder={defaultAssistantCoach}
                  className="bg-white border border-blue-300 rounded-lg px-2 py-0.5 text-[11px] font-extrabold text-blue-900 w-28 focus:outline-none focus:ring-1 focus:ring-blue-400"
                />
              </div>
            </div>

            {/* Subtitle / Caption */}
            <div>
              <label className="block text-[10px] font-black uppercase text-slate-500 mb-1">
                Titre / Thème spécifique Dessin 2 :
              </label>
              <input
                type="text"
                value={part.drawing2?.caption || ''}
                onChange={(e) => handleUpdateDrawing('Dessin 2', { caption: e.target.value })}
                placeholder="Ex: 4 contre 3 avec zone intermédiaire protégée"
                className="w-full bg-white border border-slate-300 rounded-xl px-2.5 py-1.5 text-xs font-bold text-slate-800 focus:outline-none focus:border-blue-400"
              />
            </div>

            {/* Tactical Diagram Preview & Buttons */}
            {renderDrawingBox(part.drawing2, 'Dessin 2')}

            {/* Dedicated Description for Dessin 2 */}
            <div className="space-y-1.5 pt-1">
              <div className="flex items-center justify-between gap-1 flex-wrap">
                <label className="block text-[11px] font-black text-blue-900 flex items-center gap-1">
                  <span>📝 Description & Consignes (Dessin 2) :</span>
                </label>
                <div className="flex items-center gap-1">
                  <button
                    type="button"
                    onClick={() => handleInsertHelperPrompt('Dessin 2', 'regles')}
                    className="text-[9px] font-bold bg-white hover:bg-blue-100 text-blue-800 border border-blue-200 px-1.5 py-0.5 rounded cursor-pointer"
                  >
                    + Règles
                  </button>
                  <button
                    type="button"
                    onClick={() => handleInsertHelperPrompt('Dessin 2', 'variantes')}
                    className="text-[9px] font-bold bg-white hover:bg-blue-100 text-blue-800 border border-blue-200 px-1.5 py-0.5 rounded cursor-pointer"
                  >
                    + Variantes
                  </button>
                  <button
                    type="button"
                    onClick={() => handleInsertHelperPrompt('Dessin 2', 'coaching')}
                    className="text-[9px] font-bold bg-white hover:bg-blue-100 text-blue-800 border border-blue-200 px-1.5 py-0.5 rounded cursor-pointer"
                  >
                    + Coaching
                  </button>
                </div>
              </div>
              <textarea
                rows={7}
                value={slot2Text}
                onChange={(e) => handleUpdateSlotText('Dessin 2', e.target.value)}
                placeholder="Consignes détaillées pour le Dessin 2 : organisation, règles, variantes et points clés..."
                className="w-full bg-white border border-blue-300 rounded-xl p-3 text-xs font-medium focus:outline-none focus:ring-2 focus:ring-blue-400 leading-relaxed resize-none shadow-2xs"
              />
            </div>
          </div>

        </div>
      )}

      {/* MODE 2: FORMATTED SYNTHESIS VIEW (Classic FootEco card overview) */}
      {descViewMode === 'formatted' && (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-4">
          <div className="lg:col-span-6 space-y-2">
            <div className="max-h-[380px] overflow-y-auto pr-1">
              <FormattedDrillDescription
                description={part.description}
                drawing1Caption={part.drawing1?.caption}
                drawing2Caption={part.drawing2?.caption}
                drawing1Coach={part.drawing1?.coach || defaultCoach}
                drawing2Coach={part.drawing2?.coach || defaultAssistantCoach}
              />
            </div>
            <div className="flex justify-end pt-1">
              <button
                type="button"
                onClick={() => setDescViewMode('ateliers-split')}
                className="text-[11px] font-bold text-blue-700 hover:underline cursor-pointer flex items-center gap-1"
              >
                <span>✏️ Modifier Dessin 1 et Dessin 2 dans la vue 2 Ateliers</span>
              </button>
            </div>
          </div>

          <div className="lg:col-span-6 grid grid-cols-1 sm:grid-cols-2 gap-3">
            {renderDrawingBox(part.drawing1, 'Dessin 1')}
            {renderDrawingBox(part.drawing2, 'Dessin 2')}
          </div>
        </div>
      )}

      {/* MODE 3: RAW TEXT VIEW (For pasting and full editing) */}
      {descViewMode === 'edit-raw' && (
        <div className="space-y-2">
          <div className="flex items-center justify-between text-xs text-slate-500">
            <span>Texte brut complet (les marqueurs &quot;Dessin 1 :&quot; et &quot;Dessin 2 :&quot; sont automatiquement synchronisés avec les deux ateliers) :</span>
            <button
              type="button"
              onClick={() => setDescViewMode('ateliers-split')}
              className="px-2.5 py-1 bg-slate-900 text-white text-[10px] font-extrabold rounded-lg cursor-pointer"
            >
              Terminer & Revenir à la vue 2 Ateliers
            </button>
          </div>
          <textarea
            rows={10}
            value={part.description}
            onChange={(e) => onChange({ ...part, description: e.target.value })}
            placeholder="📍 Atelier 1 (Dessin 1) :&#10;...&#10;&#10;📍 Atelier 2 (Dessin 2) :&#10;..."
            className="w-full bg-slate-50 border border-slate-300 rounded-xl p-3 text-xs font-medium focus:bg-white focus:outline-none focus:border-emerald-500 leading-relaxed resize-none"
          />
        </div>
      )}
    </div>
  );
};
