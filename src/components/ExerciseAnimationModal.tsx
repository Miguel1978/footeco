import React, { useState, useEffect, useRef, useMemo, useCallback } from 'react';
import { 
  X, 
  Play, 
  Pause, 
  RotateCcw, 
  ChevronLeft, 
  ChevronRight, 
  Sparkles, 
  BookOpen, 
  Award, 
  Info, 
  CheckCircle2, 
  Sliders, 
  ArrowRight,
  Pencil,
  Save,
  Plus,
  Trash2,
  Check,
  RefreshCw,
  Move,
  ListOrdered
} from 'lucide-react';
import { 
  DrillAnimationScenario, 
  DrillPhase,
  ALL_ANIMATION_SCENARIOS, 
  detectBestAnimationScenario,
  buildScenarioFromExercise,
  extractDrillSlotText
} from '../utils/drillAnimations';
import { TrainingSession } from '../types';

interface ExerciseAnimationModalProps {
  isOpen: boolean;
  onClose: () => void;
  partTitle?: string;
  partDescription?: string;
  partFocus?: string;
  slotName?: 'Dessin 1' | 'Dessin 2' | 'Complet';
  category?: string;
  session?: TrainingSession;
  savedScenario?: DrillAnimationScenario;
  onSaveScenario?: (scenario: DrillAnimationScenario, slotName?: 'Dessin 1' | 'Dessin 2' | 'Complet') => void;
}

export const ExerciseAnimationModal: React.FC<ExerciseAnimationModalProps> = ({
  isOpen,
  onClose,
  partTitle = 'Atelier FootEco',
  partDescription = '',
  partFocus = '',
  slotName = 'Complet',
  category = 'FE12',
  session,
  savedScenario,
  onSaveScenario
}) => {
  // Slot selection state: 'Dessin 1' | 'Dessin 2' | 'Complet'
  const [activeSlot, setActiveSlot] = useState<'Dessin 1' | 'Dessin 2' | 'Complet'>(slotName || 'Complet');

  // Check whether the description has mentions of Dessin 1 / Dessin 2
  const hasD1 = useMemo(() => {
    return /Dessin 1/i.test(partDescription) || slotName === 'Dessin 1';
  }, [partDescription, slotName]);

  const hasD2 = useMemo(() => {
    return /Dessin 2/i.test(partDescription) || slotName === 'Dessin 2';
  }, [partDescription, slotName]);

  // Try to find if a saved scenario exists in session
  const findSavedScenarioForSlot = useCallback((slot: 'Dessin 1' | 'Dessin 2' | 'Complet') => {
    if (savedScenario) return savedScenario;
    if (!session) return null;

    const parts = [session.initialPart, session.playedForms, session.finalGame].filter(Boolean);
    for (const p of parts) {
      if (!p) continue;
      if (slot === 'Dessin 1' && p.drawing1?.animationScenario) {
        return p.drawing1.animationScenario;
      }
      if (slot === 'Dessin 2' && p.drawing2?.animationScenario) {
        return p.drawing2.animationScenario;
      }
      if (slot === 'Complet' && p.animationScenario) {
        return p.animationScenario;
      }
    }
    return null;
  }, [savedScenario, session]);

  // Initialize scenario based on active slot and text
  const initialScenario = useMemo(() => {
    const saved = findSavedScenarioForSlot(activeSlot);
    if (saved) return JSON.parse(JSON.stringify(saved));

    return buildScenarioFromExercise(partTitle, partDescription, partFocus, activeSlot);
  }, [partTitle, partDescription, partFocus, activeSlot, findSavedScenarioForSlot]);

  const [currentScenario, setCurrentScenario] = useState<DrillAnimationScenario>(initialScenario);
  const [activePhaseIndex, setActivePhaseIndex] = useState<number>(0);
  const [isPlaying, setIsPlaying] = useState<boolean>(true);
  const [speed, setSpeed] = useState<number>(1);
  const [progress, setProgress] = useState<number>(0); // 0 to 1
  const [showTrails, setShowTrails] = useState<boolean>(true);
  const [activeTab, setActiveTab] = useState<'explanation' | 'edit' | 'coaching' | 'variants' | 'setup'>('explanation');
  const [isEditingFlow, setIsEditingFlow] = useState<boolean>(false);
  const [saveSuccessMessage, setSaveSuccessMessage] = useState<string | null>(null);

  // SVG interaction state for dragging players / ball in edit mode
  const svgRef = useRef<SVGSVGElement | null>(null);
  const [draggingTarget, setDraggingTarget] = useState<string | null>(null); // actor id or 'ball'

  // Sync with slot changes or text changes
  useEffect(() => {
    const newSc = findSavedScenarioForSlot(activeSlot) || buildScenarioFromExercise(partTitle, partDescription, partFocus, activeSlot);
    setCurrentScenario(JSON.parse(JSON.stringify(newSc)));
    setActivePhaseIndex(0);
    setProgress(0);
    setIsPlaying(true);
  }, [activeSlot, partTitle, partDescription, partFocus, findSavedScenarioForSlot]);

  const phases = currentScenario.phases;
  const currentPhase = phases[activePhaseIndex] || phases[0];

  // Animation Loop using requestAnimationFrame
  const animFrameRef = useRef<number | null>(null);
  const lastTimeRef = useRef<number>(performance.now());
  const TOTAL_CYCLE_DURATION_MS = 10000; // 10 seconds for a full drill sequence

  useEffect(() => {
    if (!isOpen) return;

    const animate = (now: number) => {
      if (isPlaying && !draggingTarget) {
        const delta = now - lastTimeRef.current;
        lastTimeRef.current = now;

        setProgress(prev => {
          const increment = (delta / TOTAL_CYCLE_DURATION_MS) * speed;
          let next = prev + increment;
          if (next >= 1.0) {
            next = 0.0; // Loop back
          }

          // Compute matching phase index
          const matchingPhaseIdx = phases.findIndex(p => next >= p.timeStart && next < p.timeEnd);
          if (matchingPhaseIdx !== -1 && matchingPhaseIdx !== activePhaseIndex) {
            setActivePhaseIndex(matchingPhaseIdx);
          }

          return next;
        });
      } else {
        lastTimeRef.current = now;
      }

      animFrameRef.current = requestAnimationFrame(animate);
    };

    lastTimeRef.current = performance.now();
    animFrameRef.current = requestAnimationFrame(animate);

    return () => {
      if (animFrameRef.current) {
        cancelAnimationFrame(animFrameRef.current);
      }
    };
  }, [isOpen, isPlaying, speed, phases, activePhaseIndex, draggingTarget]);

  // Jump to specific phase
  const handleJumpToPhase = (index: number) => {
    const targetPhase = phases[index];
    if (targetPhase) {
      setActivePhaseIndex(index);
      setProgress(targetPhase.timeStart + 0.01);
    }
  };

  const handleNextPhase = () => {
    const nextIdx = (activePhaseIndex + 1) % phases.length;
    handleJumpToPhase(nextIdx);
  };

  const handlePrevPhase = () => {
    const prevIdx = (activePhaseIndex - 1 + phases.length) % phases.length;
    handleJumpToPhase(prevIdx);
  };

  const handleRestart = () => {
    setProgress(0);
    setActivePhaseIndex(0);
    setIsPlaying(true);
  };

  // Interpolation helper for smooth actor movement
  const interpolatedActors = useMemo(() => {
    if (!currentPhase) return {};

    const phaseDuration = currentPhase.timeEnd - currentPhase.timeStart;
    const phaseProgress = phaseDuration > 0 
      ? Math.max(0, Math.min(1, (progress - currentPhase.timeStart) / phaseDuration))
      : 0;

    const nextPhase = phases[(activePhaseIndex + 1) % phases.length] || currentPhase;
    const result: Record<string, { x: number; y: number; action: string }> = {};

    currentScenario.actors.forEach(actor => {
      const currentPos = currentPhase.actors[actor.id] || { x: 400, y: 260, action: 'idle' };
      const nextPos = nextPhase.actors[actor.id] || currentPos;

      const t = phaseProgress;
      const easeT = t < 0.5 ? 2 * t * t : -1 + (4 - 2 * t) * t;

      result[actor.id] = {
        x: currentPos.x + (nextPos.x - currentPos.x) * easeT,
        y: currentPos.y + (nextPos.y - currentPos.y) * easeT,
        action: currentPos.action || 'idle'
      };
    });

    return result;
  }, [currentScenario, currentPhase, phases, activePhaseIndex, progress]);

  // Interpolation helper for ball movement
  const interpolatedBall = useMemo(() => {
    if (!currentPhase || !currentPhase.ball) {
      return { x: 400, y: 260, action: 'static' };
    }

    const phaseDuration = currentPhase.timeEnd - currentPhase.timeStart;
    const phaseProgress = phaseDuration > 0 
      ? Math.max(0, Math.min(1, (progress - currentPhase.timeStart) / phaseDuration))
      : 0;

    const nextPhase = phases[(activePhaseIndex + 1) % phases.length] || currentPhase;
    const curBall = currentPhase.ball;
    const nextBall = nextPhase.ball || curBall;

    const t = phaseProgress;
    const easeT = t < 0.5 ? 2 * t * t : -1 + (4 - 2 * t) * t;

    return {
      x: curBall.x + (nextBall.x - curBall.x) * easeT,
      y: curBall.y + (nextBall.y - curBall.y) * easeT,
      action: curBall.action || 'static'
    };
  }, [currentPhase, phases, activePhaseIndex, progress]);

  // Convert SVG client coords to viewBox (800 x 520) coords
  const getSvgCoordinates = useCallback((clientX: number, clientY: number) => {
    if (!svgRef.current) return { x: 400, y: 260 };
    const rect = svgRef.current.getBoundingClientRect();
    const x = Math.round(Math.max(30, Math.min(770, ((clientX - rect.left) / rect.width) * 800)));
    const y = Math.round(Math.max(30, Math.min(490, ((clientY - rect.top) / rect.height) * 520)));
    return { x, y };
  }, []);

  // Drag handlers for modifying player/ball positions on pitch
  const handlePointerDown = (targetId: string, e: React.PointerEvent) => {
    if (!isEditingFlow && activeTab !== 'edit') return;
    e.stopPropagation();
    setDraggingTarget(targetId);
    setIsPlaying(false);
  };

  const handlePointerMove = (e: React.PointerEvent) => {
    if (!draggingTarget || (!isEditingFlow && activeTab !== 'edit')) return;
    const { x, y } = getSvgCoordinates(e.clientX, e.clientY);

    setCurrentScenario(prev => {
      const updatedPhases = [...prev.phases];
      const ph = { ...updatedPhases[activePhaseIndex] };

      if (draggingTarget === 'ball') {
        ph.ball = { ...ph.ball, x, y };
      } else {
        ph.actors = {
          ...ph.actors,
          [draggingTarget]: {
            ...ph.actors[draggingTarget],
            x,
            y,
            action: ph.actors[draggingTarget]?.action || 'run'
          }
        };
      }

      updatedPhases[activePhaseIndex] = ph;
      return { ...prev, phases: updatedPhases };
    });
  };

  const handlePointerUp = () => {
    if (draggingTarget) {
      setDraggingTarget(null);
    }
  };

  // Phase editing handlers
  const handleUpdateCurrentPhaseField = (field: keyof DrillPhase, value: any) => {
    setCurrentScenario(prev => {
      const updatedPhases = [...prev.phases];
      updatedPhases[activePhaseIndex] = {
        ...updatedPhases[activePhaseIndex],
        [field]: value
      };
      return { ...prev, phases: updatedPhases };
    });
  };

  const handleAddCoachingAccent = (newAccent: string) => {
    if (!newAccent.trim()) return;
    setCurrentScenario(prev => {
      const updatedPhases = [...prev.phases];
      const ph = updatedPhases[activePhaseIndex];
      updatedPhases[activePhaseIndex] = {
        ...ph,
        coachingAccents: [...ph.coachingAccents, newAccent.trim()]
      };
      return { ...prev, phases: updatedPhases };
    });
  };

  const handleRemoveCoachingAccent = (index: number) => {
    setCurrentScenario(prev => {
      const updatedPhases = [...prev.phases];
      const ph = updatedPhases[activePhaseIndex];
      updatedPhases[activePhaseIndex] = {
        ...ph,
        coachingAccents: ph.coachingAccents.filter((_, i) => i !== index)
      };
      return { ...prev, phases: updatedPhases };
    });
  };

  // Add a new phase
  const handleAddNewPhase = () => {
    setCurrentScenario(prev => {
      const currentPhases = [...prev.phases];
      const newId = currentPhases.length + 1;
      const basePhase = currentPhases[currentPhases.length - 1] || currentPhases[0];

      // Clone base phase with slightly altered positions
      const clonedActors: Record<string, any> = {};
      Object.entries(basePhase.actors).forEach(([k, val]) => {
        const v = val as { x: number; y: number; action?: string };
        clonedActors[k] = { ...v, x: Math.min(750, v.x + 20), y: Math.min(480, v.y + 15) };
      });

      const newPhase: DrillPhase = {
        id: newId,
        timeStart: 0,
        timeEnd: 1,
        title: `Étape ${newId} : Nouvelle phase tactique`,
        subtitle: 'Déroulement de l\'action',
        description: 'Description de la nouvelle étape selon les consignes du coach.',
        coachingAccents: ['Prise d\'information', 'Qualité de la passe'],
        visualCue: 'ACTION ! ⚽',
        actors: clonedActors,
        ball: basePhase.ball ? { ...basePhase.ball, x: basePhase.ball.x + 15 } : { x: 400, y: 260, action: 'pass' }
      };

      currentPhases.push(newPhase);

      // Re-calculate equal time splits
      const split = 1 / currentPhases.length;
      currentPhases.forEach((p, idx) => {
        p.timeStart = parseFloat((idx * split).toFixed(3));
        p.timeEnd = parseFloat(((idx + 1) * split).toFixed(3));
      });

      return { ...prev, phases: currentPhases };
    });

    setActivePhaseIndex(phases.length);
  };

  // Delete current phase
  const handleDeleteCurrentPhase = () => {
    if (phases.length <= 2) {
      alert('Un déroulement tactique doit comporter au minimum 2 étapes.');
      return;
    }

    setCurrentScenario(prev => {
      const filtered = prev.phases.filter((_, idx) => idx !== activePhaseIndex);
      // Re-calculate equal time splits
      const split = 1 / filtered.length;
      filtered.forEach((p, idx) => {
        p.id = idx + 1;
        p.timeStart = parseFloat((idx * split).toFixed(3));
        p.timeEnd = parseFloat(((idx + 1) * split).toFixed(3));
      });
      return { ...prev, phases: filtered };
    });

    setActivePhaseIndex(Math.max(0, activePhaseIndex - 1));
  };

  // Reset/align scenario from exercise text automatically
  const handleAutoAlignFromExercise = () => {
    const aligned = buildScenarioFromExercise(partTitle, partDescription, partFocus, activeSlot);
    setCurrentScenario(aligned);
    setActivePhaseIndex(0);
    setProgress(0);
    setSaveSuccessMessage('✨ Déroulement synchronisé avec le texte de l\'exercice !');
    setTimeout(() => setSaveSuccessMessage(null), 3500);
  };

  // Save customized scenario
  const handleSaveScenario = () => {
    if (onSaveScenario) {
      onSaveScenario(currentScenario, activeSlot);
    }
    setSaveSuccessMessage('✅ Déroulement enregistré avec succès pour cet exercice !');
    setTimeout(() => setSaveSuccessMessage(null), 4000);
  };

  if (!isOpen) return null;

  return (
    <div 
      className="fixed inset-0 z-[100] bg-slate-950/80 backdrop-blur-md flex items-center justify-center p-2 sm:p-5 overflow-hidden animate-in fade-in duration-200"
      onPointerMove={handlePointerMove}
      onPointerUp={handlePointerUp}
    >
      <div className="bg-white rounded-3xl shadow-2xl border border-slate-200 flex flex-col w-full max-w-6xl max-h-[96vh] overflow-hidden">
        
        {/* Header Bar */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between px-5 py-3.5 border-b border-slate-200 bg-slate-900 text-white gap-3">
          
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-gradient-to-tr from-red-600 to-amber-500 flex items-center justify-center text-white shadow-md flex-shrink-0">
              <Play className="w-5 h-5 fill-white ml-0.5" />
            </div>
            <div>
              <div className="flex items-center gap-2 flex-wrap">
                <h2 className="text-base font-extrabold text-white">
                  Animation & Déroulement des Exercices
                </h2>
                <span className="bg-red-600/90 text-white text-[10px] font-black uppercase tracking-wider px-2 py-0.5 rounded-full">
                  FootEco {category}
                </span>
                {saveSuccessMessage && (
                  <span className="bg-emerald-500 text-white text-[10px] font-bold px-2 py-0.5 rounded-full flex items-center gap-1 animate-in fade-in">
                    <Check className="w-3 h-3" />
                    <span>Enregistré !</span>
                  </span>
                )}
              </div>
              <p className="text-xs text-slate-300 line-clamp-1">
                {partTitle} — <span className="text-amber-400 font-bold">{currentScenario.name}</span>
              </p>
            </div>
          </div>

          {/* Slot Switcher (Dessin 1 / Dessin 2 / Tout l'atelier) & Controls */}
          <div className="flex items-center gap-2 flex-wrap">
            
            {/* Slot selector chips */}
            {(hasD1 || hasD2) && (
              <div className="flex items-center bg-slate-800 p-1 rounded-xl border border-slate-700">
                <button
                  type="button"
                  onClick={() => setActiveSlot('Dessin 1')}
                  className={`text-[11px] font-bold px-2.5 py-1 rounded-lg transition-all flex items-center gap-1.5 cursor-pointer ${
                    activeSlot === 'Dessin 1'
                      ? 'bg-emerald-600 text-white shadow-sm'
                      : 'text-slate-300 hover:text-white hover:bg-slate-700'
                  }`}
                >
                  <span className="w-2 h-2 rounded-full bg-emerald-400" />
                  <span>Dessin 1</span>
                </button>
                <button
                  type="button"
                  onClick={() => setActiveSlot('Dessin 2')}
                  className={`text-[11px] font-bold px-2.5 py-1 rounded-lg transition-all flex items-center gap-1.5 cursor-pointer ${
                    activeSlot === 'Dessin 2'
                      ? 'bg-blue-600 text-white shadow-sm'
                      : 'text-slate-300 hover:text-white hover:bg-slate-700'
                  }`}
                >
                  <span className="w-2 h-2 rounded-full bg-blue-400" />
                  <span>Dessin 2</span>
                </button>
                <button
                  type="button"
                  onClick={() => setActiveSlot('Complet')}
                  className={`text-[11px] font-bold px-2 py-1 rounded-lg transition-all cursor-pointer ${
                    activeSlot === 'Complet'
                      ? 'bg-slate-700 text-white shadow-sm'
                      : 'text-slate-400 hover:text-white'
                  }`}
                >
                  Tout l'atelier
                </button>
              </div>
            )}

            {/* Toggle Edit Flow Mode button */}
            <button
              type="button"
              onClick={() => {
                const nextState = !isEditingFlow;
                setIsEditingFlow(nextState);
                if (nextState) {
                  setActiveTab('edit');
                  setIsPlaying(false);
                } else {
                  setActiveTab('explanation');
                }
              }}
              className={`px-3 py-1.5 rounded-xl font-extrabold text-xs flex items-center gap-1.5 transition-all cursor-pointer ${
                isEditingFlow || activeTab === 'edit'
                  ? 'bg-amber-500 text-slate-950 ring-2 ring-amber-300 shadow-md'
                  : 'bg-slate-800 hover:bg-slate-700 text-amber-300 border border-amber-500/40'
              }`}
              title="Modifier le déroulement, les consignes et les positions sur le terrain"
            >
              <Pencil className="w-3.5 h-3.5" />
              <span>{isEditingFlow ? 'Mode Édition Activé' : 'Modifier le Déroulement'}</span>
            </button>

            {/* Save button (if onSaveScenario is provided) */}
            {onSaveScenario && (
              <button
                type="button"
                onClick={handleSaveScenario}
                className="px-3 py-1.5 bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl text-xs font-bold flex items-center gap-1 shadow-sm transition-all cursor-pointer"
                title="Enregistrer ce déroulement pour cet exercice"
              >
                <Save className="w-3.5 h-3.5" />
                <span className="hidden sm:inline">Enregistrer</span>
              </button>
            )}

            {/* Close button */}
            <button
              onClick={onClose}
              className="p-2 text-slate-400 hover:text-white hover:bg-slate-800 rounded-xl transition-colors cursor-pointer"
              title="Fermer"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

        </div>

        {/* Main Split Layout */}
        <div className="flex-1 overflow-y-auto lg:overflow-hidden grid grid-cols-1 lg:grid-cols-12 gap-0">
          
          {/* LEFT: SVG Animated Tactical Pitch (7 cols) */}
          <div className="lg:col-span-7 bg-slate-950 p-3 sm:p-5 flex flex-col justify-between border-b lg:border-b-0 lg:border-r border-slate-800">
            
            {/* Top Toolbar on Pitch */}
            <div className="flex items-center justify-between mb-2.5 text-xs gap-2 flex-wrap">
              <div className="flex items-center gap-2">
                <span className="px-2.5 py-1 bg-emerald-900/60 border border-emerald-500/40 text-emerald-300 font-bold rounded-lg flex items-center gap-1.5">
                  <span className="w-2 h-2 rounded-full bg-emerald-400 animate-ping" />
                  {currentPhase.title}
                </span>
                {currentPhase.visualCue && (
                  <span className="px-2.5 py-1 bg-amber-500/20 border border-amber-400/40 text-amber-300 font-black rounded-lg text-[11px]">
                    {currentPhase.visualCue}
                  </span>
                )}
              </div>

              {/* Mode indicator & Trails toggle & speed */}
              <div className="flex items-center gap-2">
                {(isEditingFlow || activeTab === 'edit') && (
                  <span className="text-[10px] font-bold text-amber-300 bg-amber-950/70 border border-amber-500/40 px-2 py-0.5 rounded-lg flex items-center gap-1 animate-pulse">
                    <Move className="w-3 h-3 text-amber-400" />
                    <span>Glissez les joueurs</span>
                  </span>
                )}

                <button
                  type="button"
                  onClick={() => setShowTrails(!showTrails)}
                  className={`text-[10px] font-bold px-2 py-1 rounded-lg border transition-all cursor-pointer ${
                    showTrails 
                      ? 'bg-slate-800 border-slate-600 text-white' 
                      : 'bg-transparent border-slate-800 text-slate-500'
                  }`}
                >
                  Trajectoires {showTrails ? 'ON' : 'OFF'}
                </button>

                <div className="flex items-center bg-slate-900 rounded-lg border border-slate-800 p-0.5 text-[10px] font-bold text-slate-300">
                  {[0.5, 1.0, 1.5].map(s => (
                    <button
                      key={s}
                      type="button"
                      onClick={() => setSpeed(s)}
                      className={`px-1.5 py-0.5 rounded cursor-pointer ${speed === s ? 'bg-red-600 text-white' : 'hover:text-white'}`}
                    >
                      {s}x
                    </button>
                  ))}
                </div>
              </div>
            </div>

            {/* SVG Interactive Pitch Canvas */}
            <div className="relative w-full aspect-[16/10] bg-gradient-to-b from-[#156e35] to-[#125d2d] rounded-2xl border-4 border-emerald-800/80 shadow-2xl overflow-hidden select-none">
              
              <svg 
                ref={svgRef}
                viewBox="0 0 800 520" 
                className="w-full h-full cursor-default"
              >
                <defs>
                  {/* Subtle pitch grass striping */}
                  <pattern id="grass-stripes" width="80" height="520" patternUnits="userSpaceOnUse">
                    <rect width="40" height="520" fill="rgba(255,255,255,0.03)" />
                    <rect x="40" width="40" height="520" fill="transparent" />
                  </pattern>

                  {/* Marker Arrowheads */}
                  <marker id="arrow-run" viewBox="0 0 10 10" refX="6" refY="5" markerWidth="6" markerHeight="6" orient="auto">
                    <path d="M 0 1 L 8 5 L 0 9 z" fill="#FACC15" />
                  </marker>
                  <marker id="arrow-pass" viewBox="0 0 10 10" refX="6" refY="5" markerWidth="6" markerHeight="6" orient="auto">
                    <path d="M 0 1 L 8 5 L 0 9 z" fill="#FFFFFF" />
                  </marker>
                  <marker id="arrow-shot" viewBox="0 0 10 10" refX="6" refY="5" markerWidth="7" markerHeight="7" orient="auto">
                    <path d="M 0 1 L 8 5 L 0 9 z" fill="#EF4444" />
                  </marker>

                  {/* Player drop shadow filter */}
                  <filter id="shadow" x="-20%" y="-20%" width="140%" height="140%">
                    <feDropShadow dx="1" dy="3" stdDeviation="3" floodOpacity="0.45" />
                  </filter>
                </defs>

                {/* Pitch Grass Fill & Stripes */}
                <rect width="800" height="520" fill="url(#grass-stripes)" />

                {/* Tactical Pitch Lines (White 2.5px, opacity 0.55) */}
                <g stroke="#FFFFFF" strokeWidth="2.5" strokeOpacity="0.55" fill="none">
                  <rect x="30" y="30" width="740" height="460" rx="8" />
                  <line x1="30" y1="260" x2="770" y2="260" />
                  <circle cx="400" cy="260" r="65" />
                  <circle cx="400" cy="260" r="3" fill="#FFFFFF" />

                  {/* Top Goal Box */}
                  <rect x="250" y="30" width="300" height="120" />
                  <rect x="320" y="30" width="160" height="45" />
                  <path d="M 340 150 A 60 60 0 0 0 460 150" />
                  <circle cx="400" cy="110" r="3" fill="#FFFFFF" />

                  {/* Bottom Goal Box */}
                  <rect x="250" y="370" width="300" height="120" />
                  <rect x="320" y="445" width="160" height="45" />
                  <path d="M 340 370 A 60 60 0 0 1 460 370" />
                  <circle cx="400" cy="410" r="3" fill="#FFFFFF" />

                  {/* Corner Arcs */}
                  <path d="M 30 50 A 20 20 0 0 0 50 30" />
                  <path d="M 750 30 A 20 20 0 0 0 770 50" />
                  <path d="M 30 470 A 20 20 0 0 1 50 490" />
                  <path d="M 750 490 A 20 20 0 0 1 770 470" />
                </g>

                {/* Static Pitch Elements (Goals, Mini-Goals, Cones, Poles, Zones) */}
                {currentScenario.elements.map(el => {
                  if (el.type === 'goal') {
                    return (
                      <g key={el.id} transform={`translate(${el.x - (el.width || 80)/2}, ${el.y - (el.height || 20)/2})`}>
                        <rect 
                          width={el.width || 80} 
                          height={el.height || 22} 
                          fill="rgba(255,255,255,0.25)" 
                          stroke="#FFFFFF" 
                          strokeWidth="3" 
                          rx="2"
                        />
                        <line x1="0" y1="7" x2={el.width || 80} y2="7" stroke="#FFFFFF" strokeWidth="1" strokeDasharray="3,3" strokeOpacity="0.6" />
                        <line x1="0" y1="14" x2={el.width || 80} y2="14" stroke="#FFFFFF" strokeWidth="1" strokeDasharray="3,3" strokeOpacity="0.6" />
                      </g>
                    );
                  }

                  if (el.type === 'mini-goal') {
                    return (
                      <g key={el.id} transform={`translate(${el.x}, ${el.y}) rotate(${el.rotation || 0})`}>
                        <rect 
                          x={-(el.width || 30)/2} 
                          y={-(el.height || 16)/2} 
                          width={el.width || 30} 
                          height={el.height || 16} 
                          fill="rgba(250,204,21,0.3)" 
                          stroke="#FACC15" 
                          strokeWidth="2.5" 
                          rx="2"
                        />
                        <text x="0" y="3" textAnchor="middle" fontSize="8" fontWeight="bold" fill="#FACC15">
                          BUT
                        </text>
                      </g>
                    );
                  }

                  if (el.type === 'cone') {
                    return (
                      <g key={el.id} transform={`translate(${el.x}, ${el.y})`}>
                        <polygon points="0,-7 6,6 -6,6" fill={el.color || '#F59E0B'} stroke="#FFFFFF" strokeWidth="1" />
                        <circle cx="0" cy="2" r="2" fill="#FFFFFF" opacity="0.8" />
                      </g>
                    );
                  }

                  if (el.type === 'pole') {
                    return (
                      <g key={el.id} transform={`translate(${el.x}, ${el.y})`}>
                        <circle cx="0" cy="0" r="7" fill={el.color || '#EF4444'} stroke="#FFFFFF" strokeWidth="2" />
                        <line x1="0" y1="0" x2="0" y2="-12" stroke="#FFFFFF" strokeWidth="2" strokeLinecap="round" />
                        {el.label && (
                          <text x="0" y="16" textAnchor="middle" fontSize="9" fontWeight="bold" fill="#FFFFFF">
                            {el.label}
                          </text>
                        )}
                      </g>
                    );
                  }

                  if (el.type === 'zone') {
                    return (
                      <rect 
                        key={el.id}
                        x={el.x} 
                        y={el.y} 
                        width={el.width} 
                        height={el.height} 
                        fill={el.color || 'rgba(16, 185, 129, 0.15)'} 
                        stroke={el.color || '#10B981'} 
                        strokeWidth="2" 
                        strokeDasharray="6,4" 
                        rx="6"
                      />
                    );
                  }

                  return null;
                })}

                {/* Trajectory Trails */}
                {showTrails && currentPhase.trails && (
                  <g>
                    {currentPhase.trails.map((tr, idx) => {
                      const isPass = tr.type === 'pass';
                      const isShot = tr.type === 'shot';
                      const marker = isPass ? 'url(#arrow-pass)' : isShot ? 'url(#arrow-shot)' : 'url(#arrow-run)';
                      const strokeColor = isPass ? '#FFFFFF' : isShot ? '#EF4444' : '#FACC15';

                      return (
                        <g key={idx} opacity="0.85">
                          <line 
                            x1={tr.from[0]} 
                            y1={tr.from[1]} 
                            x2={tr.to[0]} 
                            y2={tr.to[1]} 
                            stroke={strokeColor} 
                            strokeWidth={isShot ? "3.5" : "2.5"} 
                            strokeDasharray={isPass ? "6,4" : isShot ? "none" : "3,3"} 
                            markerEnd={marker}
                          />
                          {tr.label && (
                            <text 
                              x={(tr.from[0] + tr.to[0]) / 2} 
                              y={(tr.from[1] + tr.to[1]) / 2 - 8} 
                              fill="#FFFFFF" 
                              fontSize="9" 
                              fontWeight="bold" 
                              textAnchor="middle"
                              filter="url(#shadow)"
                            >
                              {tr.label}
                            </text>
                          )}
                        </g>
                      );
                    })}
                  </g>
                )}

                {/* Animated & Draggable Players */}
                {currentScenario.actors.map(actor => {
                  const pos = isEditingFlow && currentPhase.actors[actor.id]
                    ? currentPhase.actors[actor.id]
                    : (interpolatedActors[actor.id] || { x: 400, y: 260, action: 'idle' });

                  const isGK = actor.role === 'goalkeeper';
                  const isCoach = actor.role === 'coach';
                  const radius = isCoach ? 16 : isGK ? 15 : 14;
                  const isDraggingThis = draggingTarget === actor.id;

                  return (
                    <g 
                      key={actor.id} 
                      transform={`translate(${pos.x}, ${pos.y})`}
                      filter="url(#shadow)"
                      onPointerDown={(e) => handlePointerDown(actor.id, e)}
                      className={`${
                        isEditingFlow || activeTab === 'edit'
                          ? 'cursor-grab active:cursor-grabbing' 
                          : 'pointer-events-none'
                      }`}
                    >
                      {/* Interactive ring if edit mode */}
                      {(isEditingFlow || activeTab === 'edit') && (
                        <circle 
                          cx="0" 
                          cy="0" 
                          r={radius + 4} 
                          fill="none" 
                          stroke={isDraggingThis ? "#FACC15" : "rgba(255,255,255,0.6)"} 
                          strokeWidth={isDraggingThis ? "3" : "1.5"}
                          strokeDasharray={isDraggingThis ? "none" : "3,2"}
                        />
                      )}

                      {/* Player Body */}
                      <circle 
                        cx="0" 
                        cy="0" 
                        r={radius} 
                        fill={actor.color} 
                        stroke="#FFFFFF" 
                        strokeWidth="2.5" 
                      />

                      {/* Number / Initial */}
                      <text 
                        x="0" 
                        y={actor.number ? "4.5" : "3.5"} 
                        textAnchor="middle" 
                        fontSize={actor.number ? "11" : "9"} 
                        fontWeight="900" 
                        fill="#FFFFFF"
                        className="select-none pointer-events-none"
                      >
                        {actor.number || actor.name.charAt(0)}
                      </text>

                      {/* Label underneath */}
                      <text 
                        x="0" 
                        y={radius + 11} 
                        textAnchor="middle" 
                        fontSize="8.5" 
                        fontWeight="bold" 
                        fill="#FFFFFF"
                        stroke="#000000"
                        strokeWidth="2"
                        paintOrder="stroke"
                        className="select-none pointer-events-none"
                      >
                        {actor.name.split(' ')[0]}
                      </text>
                    </g>
                  );
                })}

                {/* Animated & Draggable Ball (⚽) */}
                {(() => {
                  const ballPos = isEditingFlow && currentPhase.ball
                    ? currentPhase.ball
                    : interpolatedBall;
                  const isDraggingBall = draggingTarget === 'ball';

                  return (
                    <g 
                      transform={`translate(${ballPos.x}, ${ballPos.y})`}
                      filter="url(#shadow)"
                      onPointerDown={(e) => handlePointerDown('ball', e)}
                      className={`${
                        isEditingFlow || activeTab === 'edit'
                          ? 'cursor-grab active:cursor-grabbing' 
                          : 'pointer-events-none'
                      }`}
                    >
                      {(isEditingFlow || activeTab === 'edit') && (
                        <circle 
                          cx="0" 
                          cy="0" 
                          r="12" 
                          fill="none" 
                          stroke={isDraggingBall ? "#FACC15" : "rgba(255,255,255,0.7)"} 
                          strokeWidth="2" 
                          strokeDasharray="2,2" 
                        />
                      )}
                      <ellipse cx="1" cy="4" rx="6" ry="3" fill="rgba(0,0,0,0.4)" />
                      <circle cx="0" cy="0" r="7" fill="#FFFFFF" stroke="#1E293B" strokeWidth="1.5" />
                      <polygon points="0,-3 3,-1 2,2 -2,2 -3,-1" fill="#1E293B" />
                    </g>
                  );
                })()}

              </svg>
            </div>

            {/* Bottom Playback & Phase Scrub Controls */}
            <div className="mt-3 pt-2.5 border-t border-slate-800 flex flex-col gap-2.5">
              
              {/* Scrub Bar */}
              <div className="relative w-full flex items-center gap-2">
                <span className="text-[11px] font-mono text-slate-400 w-10 text-right">
                  {Math.round(progress * 100)}%
                </span>
                <div 
                  className="flex-1 h-2.5 bg-slate-800 rounded-full overflow-hidden cursor-pointer relative"
                  onClick={(e) => {
                    const rect = e.currentTarget.getBoundingClientRect();
                    const clickX = e.clientX - rect.left;
                    const newProgress = Math.max(0, Math.min(1, clickX / rect.width));
                    setProgress(newProgress);
                  }}
                >
                  <div 
                    className="h-full bg-gradient-to-r from-red-600 via-amber-500 to-emerald-500 transition-all duration-75"
                    style={{ width: `${progress * 100}%` }}
                  />
                  {phases.map((p, idx) => (
                    <div 
                      key={idx} 
                      className="absolute top-0 bottom-0 w-0.5 bg-slate-600"
                      style={{ left: `${p.timeStart * 100}%` }}
                    />
                  ))}
                </div>
                <span className="text-[11px] font-mono text-slate-400 w-12">
                  Étape {activePhaseIndex + 1}/{phases.length}
                </span>
              </div>

              {/* Controls Row */}
              <div className="flex items-center justify-between flex-wrap gap-2">
                <div className="flex items-center gap-1.5">
                  <button
                    type="button"
                    onClick={handlePrevPhase}
                    className="p-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-white transition-colors cursor-pointer"
                    title="Étape précédente"
                  >
                    <ChevronLeft className="w-4 h-4" />
                  </button>

                  <button
                    type="button"
                    onClick={() => setIsPlaying(!isPlaying)}
                    className="px-3.5 py-1.5 rounded-xl bg-gradient-to-r from-red-600 to-amber-600 hover:from-red-500 hover:to-amber-500 text-white font-extrabold text-xs flex items-center gap-1.5 shadow-md active:scale-95 transition-all cursor-pointer"
                  >
                    {isPlaying ? (
                      <>
                        <Pause className="w-3.5 h-3.5 fill-white" />
                        <span>Pause</span>
                      </>
                    ) : (
                      <>
                        <Play className="w-3.5 h-3.5 fill-white" />
                        <span>Lecture</span>
                      </>
                    )}
                  </button>

                  <button
                    type="button"
                    onClick={handleNextPhase}
                    className="p-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-white transition-colors cursor-pointer"
                    title="Étape suivante"
                  >
                    <ChevronRight className="w-4 h-4" />
                  </button>

                  <button
                    type="button"
                    onClick={handleRestart}
                    className="p-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white transition-colors cursor-pointer"
                    title="Recommencer"
                  >
                    <RotateCcw className="w-3.5 h-3.5" />
                  </button>
                </div>

                {/* Phase Pills Navigation */}
                <div className="flex items-center gap-1 flex-wrap">
                  {phases.map((ph, idx) => (
                    <button
                      key={ph.id}
                      type="button"
                      onClick={() => handleJumpToPhase(idx)}
                      className={`text-[11px] font-extrabold px-2.5 py-1 rounded-lg transition-all cursor-pointer ${
                        activePhaseIndex === idx
                          ? 'bg-amber-500 text-slate-950 shadow-sm scale-105'
                          : 'bg-slate-800 text-slate-400 hover:text-white'
                      }`}
                    >
                      Étape {idx + 1}
                    </button>
                  ))}
                </div>
              </div>

            </div>

          </div>

          {/* RIGHT: Detailed Explanation & Flow Modification Editor (5 cols) */}
          <div className="lg:col-span-5 bg-slate-50 flex flex-col justify-between overflow-y-auto p-4 sm:p-5 space-y-3.5">
            
            {/* Tab Navigation */}
            <div className="flex border-b border-slate-200 gap-2 pb-2 text-xs font-bold overflow-x-auto">
              <button
                type="button"
                onClick={() => {
                  setActiveTab('explanation');
                  setIsEditingFlow(false);
                }}
                className={`pb-1.5 px-1 border-b-2 flex items-center gap-1.5 transition-colors cursor-pointer whitespace-nowrap ${
                  activeTab === 'explanation' && !isEditingFlow
                    ? 'border-red-600 text-red-600 font-extrabold'
                    : 'border-transparent text-slate-500 hover:text-slate-800'
                }`}
              >
                <BookOpen className="w-3.5 h-3.5" />
                <span>Déroulement</span>
              </button>

              <button
                type="button"
                onClick={() => {
                  setActiveTab('edit');
                  setIsEditingFlow(true);
                  setIsPlaying(false);
                }}
                className={`pb-1.5 px-1 border-b-2 flex items-center gap-1.5 transition-colors cursor-pointer whitespace-nowrap ${
                  activeTab === 'edit' || isEditingFlow
                    ? 'border-amber-600 text-amber-700 font-extrabold'
                    : 'border-transparent text-slate-500 hover:text-slate-800'
                }`}
              >
                <Pencil className="w-3.5 h-3.5" />
                <span>✏️ Modifier les étapes</span>
              </button>

              <button
                type="button"
                onClick={() => {
                  setActiveTab('coaching');
                  setIsEditingFlow(false);
                }}
                className={`pb-1.5 px-1 border-b-2 flex items-center gap-1.5 transition-colors cursor-pointer whitespace-nowrap ${
                  activeTab === 'coaching'
                    ? 'border-red-600 text-red-600 font-extrabold'
                    : 'border-transparent text-slate-500 hover:text-slate-800'
                }`}
              >
                <Award className="w-3.5 h-3.5" />
                <span>Accents ASF</span>
              </button>

              <button
                type="button"
                onClick={() => {
                  setActiveTab('variants');
                  setIsEditingFlow(false);
                }}
                className={`pb-1.5 px-1 border-b-2 flex items-center gap-1.5 transition-colors cursor-pointer whitespace-nowrap ${
                  activeTab === 'variants'
                    ? 'border-red-600 text-red-600 font-extrabold'
                    : 'border-transparent text-slate-500 hover:text-slate-800'
                }`}
              >
                <Sliders className="w-3.5 h-3.5" />
                <span>Variantes</span>
              </button>

              <button
                type="button"
                onClick={() => {
                  setActiveTab('setup');
                  setIsEditingFlow(false);
                }}
                className={`pb-1.5 px-1 border-b-2 flex items-center gap-1.5 transition-colors cursor-pointer whitespace-nowrap ${
                  activeTab === 'setup'
                    ? 'border-red-600 text-red-600 font-extrabold'
                    : 'border-transparent text-slate-500 hover:text-slate-800'
                }`}
              >
                <Info className="w-3.5 h-3.5" />
                <span>Matériel</span>
              </button>
            </div>

            {/* TAB: EDIT FLOW MODE (Modifier le déroulement des exercices) */}
            {(activeTab === 'edit' || isEditingFlow) && (
              <div className="space-y-3.5 flex-1 overflow-y-auto pr-1">
                
                {/* Banner */}
                <div className="bg-amber-50 border border-amber-300 rounded-2xl p-3 text-xs space-y-1.5">
                  <div className="flex items-center justify-between">
                    <span className="font-extrabold text-amber-900 flex items-center gap-1.5">
                      <Pencil className="w-3.5 h-3.5 text-amber-700" />
                      <span>Personnalisation du déroulement réel</span>
                    </span>
                    <button
                      type="button"
                      onClick={handleAutoAlignFromExercise}
                      className="text-[10px] font-bold text-amber-900 bg-amber-200/70 hover:bg-amber-200 px-2 py-0.5 rounded-md flex items-center gap-1 transition-colors cursor-pointer"
                      title="Re-synchroniser à partir du texte de l'exercice"
                    >
                      <RefreshCw className="w-2.5 h-2.5" />
                      <span>Auto-aligner</span>
                    </button>
                  </div>
                  <p className="text-amber-800 text-[11px] leading-relaxed">
                    Ajustez les titres, consignes, mots-clés et déplacez directement les joueurs sur le terrain vectoriel pour refléter fidèlement le déroulement de votre exercice.
                  </p>
                </div>

                {/* Step selector & Add/Delete buttons */}
                <div className="flex items-center justify-between gap-1 flex-wrap bg-white p-2.5 rounded-xl border border-slate-200">
                  <div className="flex items-center gap-1 flex-wrap">
                    {phases.map((ph, idx) => (
                      <button
                        key={ph.id}
                        type="button"
                        onClick={() => handleJumpToPhase(idx)}
                        className={`text-xs font-black px-2.5 py-1 rounded-lg transition-all cursor-pointer ${
                          activePhaseIndex === idx
                            ? 'bg-amber-500 text-slate-950 shadow-xs'
                            : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                        }`}
                      >
                        Étape {idx + 1}
                      </button>
                    ))}
                  </div>

                  <div className="flex items-center gap-1">
                    <button
                      type="button"
                      onClick={handleAddNewPhase}
                      className="text-[11px] font-bold text-emerald-700 bg-emerald-50 hover:bg-emerald-100 border border-emerald-300 px-2 py-1 rounded-lg flex items-center gap-1 transition-colors cursor-pointer"
                      title="Ajouter une nouvelle étape à l'animation"
                    >
                      <Plus className="w-3 h-3" />
                      <span>+ Étape</span>
                    </button>

                    {phases.length > 2 && (
                      <button
                        type="button"
                        onClick={handleDeleteCurrentPhase}
                        className="text-[11px] font-bold text-red-600 bg-red-50 hover:bg-red-100 border border-red-200 px-2 py-1 rounded-lg flex items-center gap-1 transition-colors cursor-pointer"
                        title="Supprimer cette étape"
                      >
                        <Trash2 className="w-3 h-3" />
                      </button>
                    )}
                  </div>
                </div>

                {/* Form fields for the current phase */}
                <div className="bg-white p-4 rounded-2xl border-2 border-amber-400 shadow-sm space-y-3 text-xs">
                  
                  <div className="flex items-center justify-between border-b border-slate-100 pb-2">
                    <span className="font-extrabold text-slate-900 flex items-center gap-1.5">
                      <span className="w-5 h-5 rounded-full bg-amber-500 text-slate-950 text-xs font-black flex items-center justify-center">
                        {activePhaseIndex + 1}
                      </span>
                      <span>Paramètres de l'Étape {activePhaseIndex + 1}</span>
                    </span>
                    <span className="text-[10px] text-slate-400 font-mono">
                      Timing: {Math.round(currentPhase.timeStart * 100)}% - {Math.round(currentPhase.timeEnd * 100)}%
                    </span>
                  </div>

                  {/* Phase Title */}
                  <div>
                    <label className="block font-extrabold text-slate-700 mb-1">
                      Titre de l'étape :
                    </label>
                    <input
                      type="text"
                      value={currentPhase.title}
                      onChange={(e) => handleUpdateCurrentPhaseField('title', e.target.value)}
                      placeholder="ex: Étape 1 : Appel sur l'aile & Lancement"
                      className="w-full bg-slate-50 border border-slate-300 rounded-xl px-3 py-1.5 font-bold text-slate-900 focus:bg-white focus:outline-none focus:border-amber-500"
                    />
                  </div>

                  {/* Subtitle */}
                  <div>
                    <label className="block font-bold text-slate-700 mb-1">
                      Sous-titre / Action immédiate :
                    </label>
                    <input
                      type="text"
                      value={currentPhase.subtitle}
                      onChange={(e) => handleUpdateCurrentPhaseField('subtitle', e.target.value)}
                      placeholder="ex: Course tranchante dans la course de l'ailier"
                      className="w-full bg-slate-50 border border-slate-300 rounded-xl px-3 py-1.5 text-slate-800 font-medium focus:bg-white focus:outline-none focus:border-amber-500"
                    />
                  </div>

                  {/* Detailed Description */}
                  <div>
                    <label className="block font-bold text-slate-700 mb-1">
                      Déroulement détaillé de l'exercice :
                    </label>
                    <textarea
                      rows={3}
                      value={currentPhase.description}
                      onChange={(e) => handleUpdateCurrentPhaseField('description', e.target.value)}
                      placeholder="Décrivez précisément ce que font les joueurs durant cette phase..."
                      className="w-full bg-slate-50 border border-slate-300 rounded-xl p-2.5 text-xs text-slate-800 leading-relaxed focus:bg-white focus:outline-none focus:border-amber-500 resize-none"
                    />
                  </div>

                  {/* Visual Cue */}
                  <div>
                    <label className="block font-bold text-slate-700 mb-1">
                      Mot-clé flash affiché sur le terrain :
                    </label>
                    <input
                      type="text"
                      value={currentPhase.visualCue || ''}
                      onChange={(e) => handleUpdateCurrentPhaseField('visualCue', e.target.value)}
                      placeholder="ex: APPEL DANS LE COULOIR ! ⚡"
                      className="w-full bg-slate-50 border border-slate-300 rounded-xl px-3 py-1.5 text-xs font-bold text-amber-800 focus:bg-white focus:outline-none focus:border-amber-500"
                    />
                  </div>

                  {/* Coaching Accents for this step */}
                  <div>
                    <label className="block font-bold text-slate-700 mb-1">
                      Consignes & Accents pour cette étape :
                    </label>
                    <div className="space-y-1.5 mb-2">
                      {currentPhase.coachingAccents.map((accent, idx) => (
                        <div key={idx} className="flex items-center gap-1.5 bg-slate-50 px-2.5 py-1.5 rounded-lg border border-slate-200">
                          <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600 flex-shrink-0" />
                          <span className="flex-1 text-[11px] text-slate-700">{accent}</span>
                          <button
                            type="button"
                            onClick={() => handleRemoveCoachingAccent(idx)}
                            className="text-slate-400 hover:text-red-600 p-0.5"
                            title="Supprimer cette consigne"
                          >
                            <Trash2 className="w-3 h-3" />
                          </button>
                        </div>
                      ))}
                    </div>

                    <div className="flex items-center gap-1.5">
                      <input
                        type="text"
                        id="new-accent-input"
                        placeholder="Ajouter une consigne..."
                        className="flex-1 bg-slate-50 border border-slate-300 rounded-xl px-2.5 py-1 text-xs focus:bg-white focus:outline-none focus:border-amber-500"
                        onKeyDown={(e) => {
                          if (e.key === 'Enter') {
                            e.preventDefault();
                            handleAddCoachingAccent(e.currentTarget.value);
                            e.currentTarget.value = '';
                          }
                        }}
                      />
                      <button
                        type="button"
                        onClick={() => {
                          const input = document.getElementById('new-accent-input') as HTMLInputElement;
                          if (input && input.value) {
                            handleAddCoachingAccent(input.value);
                            input.value = '';
                          }
                        }}
                        className="px-2.5 py-1 bg-slate-800 hover:bg-slate-700 text-white rounded-xl text-xs font-bold transition-colors cursor-pointer"
                      >
                        + Ajouter
                      </button>
                    </div>
                  </div>

                </div>

                {/* Save button in edit mode */}
                {onSaveScenario && (
                  <button
                    type="button"
                    onClick={handleSaveScenario}
                    className="w-full py-2.5 bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl text-xs font-extrabold flex items-center justify-center gap-2 shadow-md transition-all cursor-pointer"
                  >
                    <Save className="w-4 h-4" />
                    <span>Enregistrer les modifications pour la séance</span>
                  </button>
                )}

              </div>
            )}

            {/* TAB 1: Step-by-Step Explanation (View Mode) */}
            {activeTab === 'explanation' && !isEditingFlow && (
              <div className="space-y-3 flex-1 overflow-y-auto pr-1">
                
                {/* Active Phase Card (Highlighted) */}
                <div className="bg-white p-4 rounded-2xl border-2 border-red-500 shadow-md space-y-2 relative overflow-hidden">
                  <div className="absolute top-0 right-0 bg-red-600 text-white text-[9px] font-black uppercase px-2 py-0.5 rounded-bl-lg">
                    Phase Active ({activePhaseIndex + 1}/{phases.length})
                  </div>
                  
                  <div className="flex items-center gap-2">
                    <span className="w-6 h-6 rounded-full bg-red-100 text-red-700 font-black text-xs flex items-center justify-center">
                      {activePhaseIndex + 1}
                    </span>
                    <h3 className="text-sm font-extrabold text-slate-900">
                      {currentPhase.title}
                    </h3>
                  </div>

                  <p className="text-xs font-semibold text-slate-500 italic">
                    {currentPhase.subtitle}
                  </p>

                  <p className="text-xs text-slate-700 leading-relaxed bg-slate-50 p-3 rounded-xl border border-slate-200">
                    {currentPhase.description}
                  </p>

                  {/* Coaching points for this phase */}
                  <div className="pt-1">
                    <span className="text-[11px] font-extrabold text-slate-800 block mb-1">
                      Consignes clés pour cette phase :
                    </span>
                    <ul className="space-y-1">
                      {currentPhase.coachingAccents.map((accent, i) => (
                        <li key={i} className="text-xs text-slate-600 flex items-start gap-1.5">
                          <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600 flex-shrink-0 mt-0.5" />
                          <span>{accent}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                </div>

                {/* All Phases Sequence */}
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="text-[11px] font-extrabold text-slate-500 uppercase tracking-wider block">
                      Chronologie complète du drill :
                    </span>
                    <button
                      type="button"
                      onClick={() => {
                        setActiveTab('edit');
                        setIsEditingFlow(true);
                        setIsPlaying(false);
                      }}
                      className="text-[10px] font-bold text-amber-700 hover:text-amber-800 flex items-center gap-1"
                    >
                      <Pencil className="w-3 h-3" />
                      <span>Modifier</span>
                    </button>
                  </div>

                  {phases.map((ph, idx) => (
                    <div 
                      key={ph.id}
                      onClick={() => handleJumpToPhase(idx)}
                      className={`p-3 rounded-xl border transition-all cursor-pointer flex items-center justify-between ${
                        activePhaseIndex === idx 
                          ? 'bg-red-50/60 border-red-300 shadow-2xs' 
                          : 'bg-white border-slate-200 hover:border-slate-300'
                      }`}
                    >
                      <div className="flex items-center gap-2.5">
                        <span className={`w-5 h-5 rounded-full text-xs font-bold flex items-center justify-center ${
                          activePhaseIndex === idx ? 'bg-red-600 text-white' : 'bg-slate-100 text-slate-600'
                        }`}>
                          {idx + 1}
                        </span>
                        <div>
                          <div className="text-xs font-bold text-slate-800">
                            {ph.title}
                          </div>
                          <div className="text-[11px] text-slate-500 line-clamp-1">
                            {ph.subtitle}
                          </div>
                        </div>
                      </div>
                      <ArrowRight className="w-3.5 h-3.5 text-slate-400" />
                    </div>
                  ))}
                </div>

                {/* Original Exercise context from session */}
                {partDescription && (
                  <div className="bg-amber-50/70 border border-amber-200 p-3 rounded-xl text-xs space-y-1">
                    <span className="font-extrabold text-amber-900 block text-[11px]">
                      Texte de l'exercice dans la séance :
                    </span>
                    <p className="text-slate-700 text-[11px] whitespace-pre-line leading-relaxed italic">
                      {extractDrillSlotText(partDescription, activeSlot)}
                    </p>
                  </div>
                )}

              </div>
            )}

            {/* TAB 2: Coaching Accents FootEco ASF */}
            {activeTab === 'coaching' && !isEditingFlow && (
              <div className="space-y-3 flex-1 overflow-y-auto pr-1">
                <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-xs space-y-3">
                  <div className="flex items-center gap-2">
                    <Award className="w-4 h-4 text-red-600" />
                    <h4 className="text-xs font-extrabold text-slate-900">
                      Objectifs Pédagogiques & Triggers FootEco ASF
                    </h4>
                  </div>
                  
                  <div className="space-y-2 text-xs">
                    <div className="p-2.5 bg-emerald-50 rounded-xl border border-emerald-200">
                      <span className="font-bold text-emerald-900 block mb-1">
                        1. Geste Technique (TE / KO) :
                      </span>
                      <p className="text-slate-700 text-[11px] leading-relaxed">
                        Prise d'information avant la réception (regard périphérique). Première touche toujours orientée vers le sens du jeu. Pied d'appui solide et équilibré lors de la frappe ou du centre.
                      </p>
                    </div>

                    <div className="p-2.5 bg-blue-50 rounded-xl border border-blue-200">
                      <span className="font-bold text-blue-900 block mb-1">
                        2. Comportement Tactique (TA) :
                      </span>
                      <p className="text-slate-700 text-[11px] leading-relaxed">
                        Créer ou fermer les intervalles. Défenseur : freiner l'adversaire (recul-frein), cadrer sans se jeter. Attaquants : timing de l'appel dans l'espace libre et dédoublement.
                      </p>
                    </div>

                    <div className="p-2.5 bg-purple-50 rounded-xl border border-purple-200">
                      <span className="font-bold text-purple-900 block mb-1">
                        3. Règle des 3 secondes & Transition (PE) :
                      </span>
                      <p className="text-slate-700 text-[11px] leading-relaxed">
                        À la perte de balle : réaction immédiate (contre-pressing). À la récupération : verticaliser vers le but dans les 3 secondes chronométrées.
                      </p>
                    </div>
                  </div>
                </div>

                <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-xs space-y-2 text-xs">
                  <span className="font-extrabold text-slate-800 block">
                    Mots-clés à prononcer par le coach :
                  </span>
                  <div className="flex flex-wrap gap-1.5">
                    {['« Tête levée »', '« Cadre ! »', '« En 3 secondes ! »', '« Première touche ! »', '« Dédouble ! »', '« Coupe l\'axe ! »', '« Joue simple ! »', '« Transition ! »'].map(kw => (
                      <span key={kw} className="px-2.5 py-1 bg-slate-100 border border-slate-200 text-slate-700 font-bold rounded-lg text-[11px]">
                        {kw}
                      </span>
                    ))}
                  </div>
                </div>
              </div>
            )}

            {/* TAB 3: Variants */}
            {activeTab === 'variants' && !isEditingFlow && (
              <div className="space-y-3 flex-1 overflow-y-auto pr-1">
                <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-xs space-y-3">
                  <div className="flex items-center gap-2">
                    <Sliders className="w-4 h-4 text-amber-600" />
                    <h4 className="text-xs font-extrabold text-slate-900">
                      Évolution & Adaptabilité Pédagogique
                    </h4>
                  </div>

                  <div className="p-3 bg-emerald-50 rounded-xl border border-emerald-200 space-y-1">
                    <div className="flex items-center gap-1.5 text-xs font-bold text-emerald-900">
                      <span className="w-2 h-2 rounded-full bg-emerald-500" />
                      <span>Pour Faciliter (Réduire la charge / Réussite) :</span>
                    </div>
                    <p className="text-xs text-slate-700 pl-3.5">
                      {currentScenario.pedagogicalVariants.easier}
                    </p>
                  </div>

                  <div className="p-3 bg-amber-50 rounded-xl border border-amber-200 space-y-1">
                    <div className="flex items-center gap-1.5 text-xs font-bold text-amber-900">
                      <span className="w-2 h-2 rounded-full bg-amber-500" />
                      <span>Pour Complexifier (Augmenter l'exigence) :</span>
                    </div>
                    <p className="text-xs text-slate-700 pl-3.5">
                      {currentScenario.pedagogicalVariants.harder}
                    </p>
                  </div>
                </div>

                <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-xs space-y-2 text-xs">
                  <span className="font-extrabold text-slate-800 block">
                    Critères de réussite :
                  </span>
                  <ul className="space-y-1 text-slate-600 text-[11px]">
                    <li className="flex items-center gap-1.5">
                      <span className="w-1.5 h-1.5 rounded-full bg-red-500" />
                      <span>Plus de 70% de frappes cadrées ou de centres repris en une touche.</span>
                    </li>
                    <li className="flex items-center gap-1.5">
                      <span className="w-1.5 h-1.5 rounded-full bg-red-500" />
                      <span>Transition offensive déclenchée en moins de 3 secondes chronométrées.</span>
                    </li>
                    <li className="flex items-center gap-1.5">
                      <span className="w-1.5 h-1.5 rounded-full bg-red-500" />
                      <span>Aucun joueur passif à la perte de balle.</span>
                    </li>
                  </ul>
                </div>
              </div>
            )}

            {/* TAB 4: Setup & Equipment */}
            {activeTab === 'setup' && !isEditingFlow && (
              <div className="space-y-3 flex-1 overflow-y-auto pr-1">
                <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-xs space-y-3 text-xs">
                  <div className="flex items-center gap-2">
                    <Info className="w-4 h-4 text-blue-600" />
                    <h4 className="font-extrabold text-slate-900">
                      Organisation Matérielle & Règles
                    </h4>
                  </div>

                  <div className="space-y-1.5">
                    <div className="flex items-center justify-between p-2 bg-slate-50 rounded-lg">
                      <span className="text-slate-500 font-semibold">Durée recommandée :</span>
                      <span className="font-bold text-slate-800">{currentScenario.duration}</span>
                    </div>
                    <div className="flex items-center justify-between p-2 bg-slate-50 rounded-lg">
                      <span className="text-slate-500 font-semibold">Espace de jeu :</span>
                      <span className="font-bold text-slate-800">
                        {currentScenario.pitchType === 'half-pitch' ? 'Demi-terrain (35x30m)' : currentScenario.pitchType === 'grid-box' ? 'Carré 20x15m' : 'Terrain entier FootEco (50x35m)'}
                      </span>
                    </div>
                  </div>

                  <div>
                    <span className="font-bold text-slate-800 block mb-1">Matériel requis :</span>
                    <p className="text-slate-600 text-[11px] leading-relaxed bg-slate-50 p-2.5 rounded-xl border border-slate-200">
                      {currentScenario.equipment}
                    </p>
                  </div>

                  <div>
                    <span className="font-bold text-slate-800 block mb-1">Règles fondamentales :</span>
                    <ul className="space-y-1 text-slate-600 text-[11px]">
                      {currentScenario.rules.map((r, i) => (
                        <li key={i} className="flex items-start gap-1.5">
                          <span className="w-1.5 h-1.5 rounded-full bg-slate-400 mt-1.5 flex-shrink-0" />
                          <span>{r}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                </div>
              </div>
            )}

            {/* Footer Action & Preset Selector */}
            <div className="pt-2 border-t border-slate-200 flex items-center justify-between flex-wrap gap-2">
              <div className="flex items-center gap-1.5">
                <span className="text-[11px] text-slate-500 font-bold">Modèle :</span>
                <select
                  value={currentScenario.id.startsWith('custom') ? '' : currentScenario.id}
                  onChange={(e) => {
                    const found = ALL_ANIMATION_SCENARIOS.find(s => s.id === e.target.value);
                    if (found) {
                      setCurrentScenario(JSON.parse(JSON.stringify(found)));
                      setActivePhaseIndex(0);
                      setProgress(0);
                    }
                  }}
                  className="text-xs bg-white border border-slate-300 rounded-lg px-2 py-1 font-semibold text-slate-700 focus:outline-none focus:border-red-500"
                >
                  <option value="" disabled>Modèle de base...</option>
                  {ALL_ANIMATION_SCENARIOS.map(sc => (
                    <option key={sc.id} value={sc.id}>
                      {sc.name}
                    </option>
                  ))}
                </select>
              </div>

              <button
                onClick={onClose}
                className="px-4 py-1.5 bg-slate-900 hover:bg-slate-800 text-white rounded-xl text-xs font-bold transition-all cursor-pointer"
              >
                Fermer
              </button>
            </div>

          </div>

        </div>

      </div>
    </div>
  );
};
