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
  RotateCw,
  Copy,
  Flag,
  CircleDot,
  Layers,
  Box,
  Timer,
  Users,
  Maximize2,
  Zap,
  Shield,
  Footprints,
  Filter,
  Compass
} from 'lucide-react';
import { 
  DrillAnimationScenario, 
  DrillPhase,
  PitchElement,
  AsfPedagogicalVariable,
  ASF_PEDAGOGICAL_VARIABLES_CATALOG,
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

// Catalog of available football equipment with presets & icons
interface EquipmentPreset {
  type: PitchElement['type'];
  label: string;
  category: 'cones' | 'goals' | 'slalom' | 'coordination' | 'tactical';
  color: string;
  defaultWidth?: number;
  defaultHeight?: number;
  subType?: string;
  description: string;
}

const FOOTBALL_EQUIPMENT_PRESETS: EquipmentPreset[] = [
  // Cones & Coupelles
  { type: 'cone', label: 'Plot Orange', category: 'cones', color: '#F97316', description: 'Plot ou coupelle classique de délimitation' },
  { type: 'cone', label: 'Coupelle Jaune', category: 'cones', color: '#FACC15', description: 'Coupelle plate de repère technique' },
  { type: 'cone', label: 'Coupelle Rouge', category: 'cones', color: '#EF4444', description: 'Coupelle de balisage ou zone interdite' },
  { type: 'cone', label: 'Coupelle Bleue', category: 'cones', color: '#3B82F6', description: 'Coupelle d\'orientation ou porte' },
  { type: 'cone', label: 'Coupelle Blanche', category: 'cones', color: '#FFFFFF', description: 'Coupelle neutre de départ' },

  // Jalons & Slalom
  { type: 'pole', label: 'Jalon Rouge', category: 'slalom', color: '#EF4444', description: 'Piquet de slalom haut pour dribbles' },
  { type: 'pole', label: 'Jalon Jaune', category: 'slalom', color: '#FACC15', description: 'Piquet d\'agilité et d\'évitement' },

  // Buts & Cibles
  { type: 'mini-goal', label: 'Mini-but Jaune', category: 'goals', color: '#FACC15', defaultWidth: 36, defaultHeight: 18, description: 'Mini-but d\'entraînement rotatif (2m)' },
  { type: 'mini-goal', label: 'Mini-but Rouge', category: 'goals', color: '#EF4444', defaultWidth: 36, defaultHeight: 18, description: 'Mini-but cible pour transition rapide' },
  { type: 'goal', label: 'Grand but de match', category: 'goals', color: '#FFFFFF', defaultWidth: 84, defaultHeight: 22, description: 'But officiel avec filet pour frappes' },

  // Obstacles & Mannequins
  { type: 'dummy', label: 'Mannequin Défenseur', category: 'tactical', color: '#0284C7', defaultWidth: 22, defaultHeight: 34, description: 'Silhouette de défenseur fixe pour duel / coup franc' },
  { type: 'hurdle', label: 'Mini-haie de saut', category: 'coordination', color: '#F59E0B', defaultWidth: 28, defaultHeight: 14, description: 'Haie de motricité et pliométrie' },

  // Coordination & Rythme
  { type: 'ladder', label: 'Échelle de motricité', category: 'coordination', color: '#FACC15', defaultWidth: 30, defaultHeight: 88, description: 'Échelle de rythme FootEco (5 échelons)' },
  { type: 'ring', label: 'Cerceau d\'agilité', category: 'coordination', color: '#10B981', defaultWidth: 24, defaultHeight: 24, description: 'Cerceau de coordination motrice' },

  // Terrain & Ballons
  { type: 'ball-rack', label: 'Réserve de ballons', category: 'tactical', color: '#FFFFFF', defaultWidth: 26, defaultHeight: 26, description: 'Paquet de 3 ballons au départ de l\'action' },
  { type: 'zone', label: 'Zone de jeu délimitée', category: 'tactical', color: 'rgba(16, 185, 129, 0.2)', defaultWidth: 130, defaultHeight: 90, description: 'Rectangle tactique pour conservation ou finition' },
];

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

  // Extract diagram and scenario information for current slot, prioritized by matching partTitle
  const getSlotDrawingInfo = useCallback((slot: 'Dessin 1' | 'Dessin 2' | 'Complet') => {
    if (!session) return { svg: undefined, caption: undefined, scenarioId: undefined };

    const parts = [session.initialPart, session.playedForms, session.finalGame].filter(Boolean);
    const matchedPart = parts.find(p => p && p.title === partTitle) || parts[0];
    const orderedParts = matchedPart ? [matchedPart, ...parts.filter(p => p !== matchedPart)] : parts;

    for (const p of orderedParts) {
      if (!p) continue;
      if (slot === 'Dessin 1' && p.drawing1) {
        return {
          svg: p.drawing1.image,
          caption: p.drawing1.caption,
          scenarioId: p.drawing1.scenarioId || p.scenarioId,
        };
      }
      if (slot === 'Dessin 2' && p.drawing2) {
        return {
          svg: p.drawing2.image,
          caption: p.drawing2.caption,
          scenarioId: p.drawing2.scenarioId || p.scenarioId,
        };
      }
      if (slot === 'Complet') {
        return {
          svg: p.drawing1?.image || p.drawing2?.image,
          caption: p.title,
          scenarioId: p.scenarioId || p.drawing1?.scenarioId || p.drawing2?.scenarioId,
        };
      }
    }
    return { svg: undefined, caption: undefined, scenarioId: undefined };
  }, [session, partTitle]);

  // Try to find if a saved scenario exists in session
  const findSavedScenarioForSlot = useCallback((slot: 'Dessin 1' | 'Dessin 2' | 'Complet') => {
    if (savedScenario) return savedScenario;
    if (!session) return null;

    const parts = [session.initialPart, session.playedForms, session.finalGame].filter(Boolean);
    const matchedPart = parts.find(p => p && p.title === partTitle) || parts[0];
    const orderedParts = matchedPart ? [matchedPart, ...parts.filter(p => p !== matchedPart)] : parts;

    for (const p of orderedParts) {
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
  }, [savedScenario, session, partTitle]);

  // Initialize scenario based on active slot, synchronized with AI diagram SVG & scenarioId
  const initialScenario = useMemo(() => {
    const saved = findSavedScenarioForSlot(activeSlot);
    if (saved) return JSON.parse(JSON.stringify(saved));

    const slotInfo = getSlotDrawingInfo(activeSlot);
    return buildScenarioFromExercise(
      partTitle,
      partDescription,
      partFocus,
      activeSlot,
      slotInfo.caption,
      slotInfo.svg,
      slotInfo.scenarioId
    );
  }, [partTitle, partDescription, partFocus, activeSlot, findSavedScenarioForSlot, getSlotDrawingInfo]);

  const [currentScenario, setCurrentScenario] = useState<DrillAnimationScenario>(initialScenario);
  const [activePhaseIndex, setActivePhaseIndex] = useState<number>(0);
  const [isPlaying, setIsPlaying] = useState<boolean>(true);
  const [speed, setSpeed] = useState<number>(1);
  const [progress, setProgress] = useState<number>(0); // 0 to 1
  const [showTrails, setShowTrails] = useState<boolean>(true);
  const [activeTab, setActiveTab] = useState<'explanation' | 'edit' | 'coaching' | 'variants' | 'setup'>('explanation');
  const [isEditingFlow, setIsEditingFlow] = useState<boolean>(false);
  const [editSubTab, setEditSubTab] = useState<'steps' | 'equipment' | 'variables'>('steps');
  const [selectedElementId, setSelectedElementId] = useState<string | null>(null);
  const [saveSuccessMessage, setSaveSuccessMessage] = useState<string | null>(null);

  // Pedagogical Variables state
  const [isCatalogOpen, setIsCatalogOpen] = useState<boolean>(false);
  const [catalogCategoryFilter, setCatalogCategoryFilter] = useState<string>('all');
  const [isCreatingCustomVariable, setIsCreatingCustomVariable] = useState<boolean>(false);
  const [newVarCategory, setNewVarCategory] = useState<AsfPedagogicalVariable['category']>('time');
  const [newVarTitle, setNewVarTitle] = useState<string>('');
  const [newVarType, setNewVarType] = useState<AsfPedagogicalVariable['type']>('provocation');
  const [newVarDescription, setNewVarDescription] = useState<string>('');
  const [newVarCoaching, setNewVarCoaching] = useState<string>('');
  const [newVarTag, setNewVarTag] = useState<string>('');
  const [variablesCategoryFilter, setVariablesCategoryFilter] = useState<string>('all');

  // SVG interaction state for dragging players / ball / equipment in edit mode
  const svgRef = useRef<SVGSVGElement | null>(null);
  const [draggingTarget, setDraggingTarget] = useState<string | null>(null); // actor id, 'ball', or 'element-{id}'

  // Sync with slot changes or text changes
  useEffect(() => {
    const saved = findSavedScenarioForSlot(activeSlot);
    const slotInfo = getSlotDrawingInfo(activeSlot);
    const newSc = saved || buildScenarioFromExercise(
      partTitle,
      partDescription,
      partFocus,
      activeSlot,
      slotInfo.caption,
      slotInfo.svg,
      slotInfo.scenarioId
    );
    setCurrentScenario(JSON.parse(JSON.stringify(newSc)));
    setActivePhaseIndex(0);
    setProgress(0);
    setSelectedElementId(null);
    setIsPlaying(true);
  }, [activeSlot, partTitle, partDescription, partFocus, findSavedScenarioForSlot, getSlotDrawingInfo]);

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
    const result: Record<string, { x: number; y: number; action: string; angle: number; isMoving: boolean }> = {};

    currentScenario.actors.forEach(actor => {
      const currentPos = currentPhase.actors[actor.id] || { x: 400, y: 260, action: 'idle' };
      const nextPos = nextPhase.actors[actor.id] || currentPos;

      const t = phaseProgress;
      const easeT = t < 0.5 ? 2 * t * t : -1 + (4 - 2 * t) * t;
      const dx = nextPos.x - currentPos.x;
      const dy = nextPos.y - currentPos.y;
      const dist = Math.hypot(dx, dy);
      const isMoving = dist > 6;
      const angle = isMoving ? Math.atan2(dy, dx) * (180 / Math.PI) : 0;

      result[actor.id] = {
        x: currentPos.x + dx * easeT,
        y: currentPos.y + dy * easeT,
        action: currentPos.action || 'idle',
        angle,
        isMoving
      };
    });

    return result;
  }, [currentScenario, currentPhase, phases, activePhaseIndex, progress]);

  // Interpolation helper for ball movement with realistic 3D parabolic elevation
  const interpolatedBall = useMemo(() => {
    if (!currentPhase || !currentPhase.ball) {
      return { x: 400, y: 260, action: 'static', elevation: 0, phaseProgress: 0 };
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

    const startH = curBall.height || 0;
    const endH = nextBall.height || 0;
    const isAerial = curBall.action === 'shot' || curBall.action === 'pass' || curBall.action === 'rebound' || startH > 0 || endH > 0;
    const dist = Math.hypot(nextBall.x - curBall.x, nextBall.y - curBall.y);
    const parabolicApex = isAerial && dist > 60 ? Math.min(48, Math.max(20, dist * 0.16)) : (startH > 0 || endH > 0 ? 24 : 0);
    const elevation = Math.max(0, startH + (endH - startH) * t + 4 * parabolicApex * t * (1 - t));

    return {
      x: curBall.x + (nextBall.x - curBall.x) * easeT,
      y: curBall.y + (nextBall.y - curBall.y) * easeT,
      action: curBall.action || 'static',
      elevation,
      phaseProgress
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

  // Drag handlers for modifying player/ball/equipment positions on pitch
  const handlePointerDown = (targetId: string, e: React.PointerEvent) => {
    if (!isEditingFlow && activeTab !== 'edit') return;
    e.stopPropagation();
    setDraggingTarget(targetId);
    setIsPlaying(false);

    if (targetId.startsWith('element-')) {
      setSelectedElementId(targetId.replace('element-', ''));
    }
  };

  const handlePointerMove = (e: React.PointerEvent) => {
    if (!draggingTarget || (!isEditingFlow && activeTab !== 'edit')) return;
    const { x, y } = getSvgCoordinates(e.clientX, e.clientY);

    // If dragging pitch equipment
    if (draggingTarget.startsWith('element-')) {
      const elId = draggingTarget.replace('element-', '');
      setCurrentScenario(prev => ({
        ...prev,
        elements: prev.elements.map(el => el.id === elId ? { ...el, x, y } : el)
      }));
      return;
    }

    // If dragging ball or actor
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

  // =========================================================================
  // FOOTBALL EQUIPMENT ACTIONS (Plots, Coupelles, Jalons, Buts, Mannequins...)
  // =========================================================================

  const handleAddEquipment = (preset: EquipmentPreset) => {
    const newId = `eq-${preset.type}-${Date.now().toString(36)}-${Math.random().toString(36).substring(2, 5)}`;
    
    // Spread position slightly around pitch center
    const x = Math.round(380 + (Math.random() - 0.5) * 200);
    const y = Math.round(240 + (Math.random() - 0.5) * 140);

    const newElement: PitchElement = {
      id: newId,
      type: preset.type,
      x,
      y,
      color: preset.color,
      label: preset.label.split(' ')[0],
      width: preset.defaultWidth,
      height: preset.defaultHeight,
      rotation: 0,
      subType: preset.subType
    };

    setCurrentScenario(prev => ({
      ...prev,
      elements: [...prev.elements, newElement]
    }));

    setSelectedElementId(newId);
    setSaveSuccessMessage(`+ ${preset.label} ajouté sur le terrain !`);
    setTimeout(() => setSaveSuccessMessage(null), 3000);
  };

  // Add multiple cones in a line (Slalom 4 plots)
  const handleAddConeSlalomLine = () => {
    const startX = 300;
    const startY = 260;
    const step = 45;
    const newElements: PitchElement[] = [0, 1, 2, 3].map(i => ({
      id: `eq-cone-slalom-${Date.now()}-${i}`,
      type: 'cone',
      x: startX + i * step,
      y: startY,
      color: i % 2 === 0 ? '#F97316' : '#FACC15',
      label: `P${i + 1}`,
      rotation: 0
    }));

    setCurrentScenario(prev => ({
      ...prev,
      elements: [...prev.elements, ...newElements]
    }));

    setSelectedElementId(newElements[0].id);
    setSaveSuccessMessage('Ligne de 4 plots de slalom ajoutée !');
    setTimeout(() => setSaveSuccessMessage(null), 3000);
  };

  // Add a passing gate (Porte de 2 coupelles)
  const handleAddPassingGate = (color: string = '#3B82F6') => {
    const gateId = Date.now();
    const g1: PitchElement = {
      id: `eq-cone-gate-${gateId}-1`,
      type: 'cone',
      x: 380,
      y: 230,
      color,
      label: 'Porte'
    };
    const g2: PitchElement = {
      id: `eq-cone-gate-${gateId}-2`,
      type: 'cone',
      x: 380,
      y: 290,
      color,
      label: 'Porte'
    };

    setCurrentScenario(prev => ({
      ...prev,
      elements: [...prev.elements, g1, g2]
    }));

    setSelectedElementId(g1.id);
    setSaveSuccessMessage('Porte de 2 coupelles ajoutée !');
    setTimeout(() => setSaveSuccessMessage(null), 3000);
  };

  const handleDeleteEquipment = (id: string) => {
    setCurrentScenario(prev => ({
      ...prev,
      elements: prev.elements.filter(el => el.id !== id)
    }));
    if (selectedElementId === id) setSelectedElementId(null);
  };

  const handleDuplicateEquipment = (id: string) => {
    const found = currentScenario.elements.find(el => el.id === id);
    if (!found) return;

    const newId = `eq-${found.type}-${Date.now().toString(36)}`;
    const duplicate: PitchElement = {
      ...found,
      id: newId,
      x: Math.min(760, found.x + 25),
      y: Math.min(480, found.y + 20)
    };

    setCurrentScenario(prev => ({
      ...prev,
      elements: [...prev.elements, duplicate]
    }));

    setSelectedElementId(newId);
  };

  const handleRotateEquipment = (id: string, deltaDeg: number = 45) => {
    setCurrentScenario(prev => ({
      ...prev,
      elements: prev.elements.map(el => {
        if (el.id !== id) return el;
        const curRot = el.rotation || 0;
        return { ...el, rotation: (curRot + deltaDeg) % 360 };
      })
    }));
  };

  const handleUpdateEquipmentColor = (id: string, color: string) => {
    setCurrentScenario(prev => ({
      ...prev,
      elements: prev.elements.map(el => el.id === id ? { ...el, color } : el)
    }));
  };

  const handleClearAllEquipment = () => {
    if (!confirm('Supprimer tout le matériel présent sur le terrain ?')) return;
    setCurrentScenario(prev => ({ ...prev, elements: [] }));
    setSelectedElementId(null);
  };

  const handleResetDefaultEquipment = () => {
    const defaultSc = buildScenarioFromExercise(partTitle, partDescription, partFocus, activeSlot);
    setCurrentScenario(prev => ({ ...prev, elements: defaultSc.elements }));
    setSelectedElementId(null);
    setSaveSuccessMessage('Matériel d\'origine restauré !');
    setTimeout(() => setSaveSuccessMessage(null), 3000);
  };

  // Currently selected equipment element
  const selectedElement = useMemo(() => {
    return currentScenario.elements.find(el => el.id === selectedElementId) || null;
  }, [currentScenario.elements, selectedElementId]);

  // Pedagogical variables getters & computations
  const variables: AsfPedagogicalVariable[] = useMemo(() => {
    return currentScenario.pedagogicalVariants?.variables || [];
  }, [currentScenario.pedagogicalVariants?.variables]);

  const activeVariables = useMemo(() => {
    return variables.filter(v => v.isActive);
  }, [variables]);

  // Toggle variable active state
  const handleToggleVariable = (id: string) => {
    setCurrentScenario(prev => {
      const currentVars = prev.pedagogicalVariants?.variables || [];
      const updated = currentVars.map(v => v.id === id ? { ...v, isActive: !v.isActive } : v);
      return {
        ...prev,
        pedagogicalVariants: {
          ...prev.pedagogicalVariants,
          variables: updated
        }
      };
    });
    setSaveSuccessMessage('Statut de la variable mis à jour !');
    setTimeout(() => setSaveSuccessMessage(null), 2500);
  };

  // Add variable from official ASF catalog
  const handleAddVariableFromCatalog = (catalogVar: AsfPedagogicalVariable) => {
    setCurrentScenario(prev => {
      const currentVars = prev.pedagogicalVariants?.variables || [];
      const existingIdx = currentVars.findIndex(v => v.id === catalogVar.id);
      let updated: AsfPedagogicalVariable[];
      if (existingIdx >= 0) {
        updated = currentVars.map((v, i) => i === existingIdx ? { ...v, isActive: true } : v);
      } else {
        updated = [...currentVars, { ...catalogVar, isActive: true }];
      }
      return {
        ...prev,
        pedagogicalVariants: {
          ...prev.pedagogicalVariants,
          variables: updated
        }
      };
    });
    setSaveSuccessMessage(`« ${catalogVar.title} » ajoutée !`);
    setTimeout(() => setSaveSuccessMessage(null), 3000);
  };

  // Remove variable
  const handleRemoveVariable = (id: string) => {
    setCurrentScenario(prev => {
      const currentVars = prev.pedagogicalVariants?.variables || [];
      return {
        ...prev,
        pedagogicalVariants: {
          ...prev.pedagogicalVariants,
          variables: currentVars.filter(v => v.id !== id)
        }
      };
    });
    setSaveSuccessMessage('Variable retirée.');
    setTimeout(() => setSaveSuccessMessage(null), 2500);
  };

  // Create custom variable
  const handleCreateCustomVariable = () => {
    if (!newVarTitle.trim() || !newVarDescription.trim()) {
      alert('Veuillez renseigner un titre et une description pour la variable.');
      return;
    }
    const customVar: AsfPedagogicalVariable = {
      id: `custom-var-${Date.now()}`,
      category: newVarCategory,
      title: newVarTitle.trim(),
      type: newVarType,
      description: newVarDescription.trim(),
      coachingInstruction: newVarCoaching.trim() || undefined,
      ruleTag: newVarTag.trim() || '🎯 Règle FootEco',
      isActive: true
    };

    setCurrentScenario(prev => ({
      ...prev,
      pedagogicalVariants: {
        ...prev.pedagogicalVariants,
        variables: [...(prev.pedagogicalVariants?.variables || []), customVar]
      }
    }));

    setNewVarTitle('');
    setNewVarDescription('');
    setNewVarCoaching('');
    setNewVarTag('');
    setIsCreatingCustomVariable(false);
    setSaveSuccessMessage('Nouvelle variable personnalisée créée !');
    setTimeout(() => setSaveSuccessMessage(null), 3000);
  };

  // Inject variable into current active phase
  const handleInjectVariableIntoPhase = (v: AsfPedagogicalVariable) => {
    if (!currentPhase) return;
    setCurrentScenario(prev => {
      const newPhases = [...prev.phases];
      const targetPhase = { ...newPhases[activePhaseIndex] };
      const addition = v.coachingInstruction || v.description;
      targetPhase.coachingAccents = targetPhase.coachingAccents 
        ? `${targetPhase.coachingAccents} | ${v.ruleTag || v.title}: ${addition}`
        : `${v.ruleTag || v.title}: ${addition}`;
      targetPhase.visualCue = v.ruleTag || targetPhase.visualCue;
      newPhases[activePhaseIndex] = targetPhase;
      return {
        ...prev,
        phases: newPhases
      };
    });
    setSaveSuccessMessage(`Consigne « ${v.ruleTag || v.title} » injectée à l'étape ${activePhaseIndex + 1} !`);
    setTimeout(() => setSaveSuccessMessage(null), 3000);
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

  // Render pedagogical variables manager (used both in Variants Tab and Edit Mode subtab)
  const renderPedagogicalVariablesManager = (isEditModeContext: boolean) => {
    const filteredVariables = variablesCategoryFilter === 'all'
      ? variables
      : variables.filter(v => v.category === variablesCategoryFilter);

    const filteredCatalog = catalogCategoryFilter === 'all'
      ? ASF_PEDAGOGICAL_VARIABLES_CATALOG
      : ASF_PEDAGOGICAL_VARIABLES_CATALOG.filter(v => v.category === catalogCategoryFilter);

    const getCategoryMeta = (cat: AsfPedagogicalVariable['category']) => {
      switch (cat) {
        case 'time':
          return { label: 'Temps & Pression (3s)', icon: Timer, color: 'text-amber-700 bg-amber-50 border-amber-300' };
        case 'players':
          return { label: 'Effectif & Surnombre', icon: Users, color: 'text-blue-700 bg-blue-50 border-blue-300' };
        case 'space':
          return { label: 'Espace & Surface', icon: Maximize2, color: 'text-emerald-700 bg-emerald-50 border-emerald-300' };
        case 'rules':
          return { label: 'Règles Provocatrices', icon: Zap, color: 'text-purple-700 bg-purple-50 border-purple-300' };
        case 'technical':
          return { label: 'Technique & Bilatéralité', icon: Footprints, color: 'text-rose-700 bg-rose-50 border-rose-300' };
        default:
          return { label: 'Général', icon: Sliders, color: 'text-slate-700 bg-slate-50 border-slate-300' };
      }
    };

    const getTypeMeta = (type: AsfPedagogicalVariable['type']) => {
      switch (type) {
        case 'easier':
          return { label: '🟢 Pour Faciliter', bg: 'bg-emerald-100 text-emerald-800 border-emerald-300' };
        case 'harder':
          return { label: '🔴 Pour Complexifier', bg: 'bg-rose-100 text-rose-800 border-rose-300' };
        case 'provocation':
          return { label: '⚡ Règle Provocatrice', bg: 'bg-amber-100 text-amber-800 border-amber-300' };
        default:
          return { label: '⚪ Neutre', bg: 'bg-slate-100 text-slate-800 border-slate-300' };
      }
    };

    return (
      <div className="space-y-4 flex-1 overflow-y-auto pr-1">
        
        {/* Banner: Méthodologie S.T.E.P. ASF */}
        <div className="bg-gradient-to-r from-red-900 via-slate-900 to-amber-950 text-white p-3.5 rounded-2xl border border-red-500/30 shadow-md">
          <div className="flex items-start justify-between gap-2">
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-xl bg-red-600/80 flex items-center justify-center text-white flex-shrink-0">
                <Compass className="w-4 h-4" />
              </div>
              <div>
                <h4 className="text-xs font-black text-white uppercase tracking-wider flex items-center gap-1.5">
                  <span>Méthodologie S.T.E.P. (ASF / SFV)</span>
                  <span className="text-[10px] font-bold text-amber-300 bg-amber-500/20 px-1.5 py-0.2 rounded border border-amber-400/30">
                    FootEco
                  </span>
                </h4>
                <p className="text-[11px] text-slate-300 font-medium">
                  Adaptez la charge et la réussite selon les 4 leviers : <strong>S</strong>urface, <strong>T</strong>âche, <strong>E</strong>ffectif, <strong>P</strong>ression.
                </p>
              </div>
            </div>

            <div className="flex items-center gap-1.5 flex-shrink-0">
              <span className="text-[10px] font-black bg-emerald-500/20 border border-emerald-400/40 text-emerald-300 px-2 py-0.5 rounded-full">
                {activeVariables.length} active{activeVariables.length > 1 ? 's' : ''} / {variables.length}
              </span>
            </div>
          </div>

          {/* S.T.E.P. mini matrix pills */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-1.5 mt-2.5 text-[10px]">
            <div className="bg-black/40 rounded-lg p-1.5 border border-white/10">
              <span className="font-black text-amber-300 block">S • Surface</span>
              <span className="text-slate-300 text-[9px] leading-tight">Dimensions terrain, zones d'appel</span>
            </div>
            <div className="bg-black/40 rounded-lg p-1.5 border border-white/10">
              <span className="font-black text-purple-300 block">T • Tâche</span>
              <span className="text-slate-300 text-[9px] leading-tight">Règles bonus, passes mini, 1 touche</span>
            </div>
            <div className="bg-black/40 rounded-lg p-1.5 border border-white/10">
              <span className="font-black text-blue-300 block">E • Effectif</span>
              <span className="text-slate-300 text-[9px] leading-tight">Joker +1, supériorité, 2c1, 3c2</span>
            </div>
            <div className="bg-black/40 rounded-lg p-1.5 border border-white/10">
              <span className="font-black text-rose-300 block">P • Pression</span>
              <span className="text-slate-300 text-[9px] leading-tight">3s transition, 2 touches, pressing</span>
            </div>
          </div>
        </div>

        {/* Action Controls: Catalog & Custom Variable */}
        <div className="flex items-center gap-2 flex-wrap">
          <button
            type="button"
            onClick={() => {
              setIsCatalogOpen(!isCatalogOpen);
              if (isCreatingCustomVariable) setIsCreatingCustomVariable(false);
            }}
            className={`px-3 py-1.5 rounded-xl text-xs font-black flex items-center gap-1.5 transition-all cursor-pointer shadow-xs ${
              isCatalogOpen
                ? 'bg-red-600 text-white ring-2 ring-red-300'
                : 'bg-white hover:bg-slate-100 text-red-700 border border-red-200'
            }`}
          >
            <BookOpen className="w-3.5 h-3.5 text-red-600" />
            <span>Catalogue Officiel ASF ({ASF_PEDAGOGICAL_VARIABLES_CATALOG.length})</span>
          </button>

          <button
            type="button"
            onClick={() => {
              setIsCreatingCustomVariable(!isCreatingCustomVariable);
              if (isCatalogOpen) setIsCatalogOpen(false);
            }}
            className={`px-3 py-1.5 rounded-xl text-xs font-black flex items-center gap-1.5 transition-all cursor-pointer shadow-xs ${
              isCreatingCustomVariable
                ? 'bg-purple-600 text-white ring-2 ring-purple-300'
                : 'bg-white hover:bg-slate-100 text-purple-700 border border-purple-200'
            }`}
          >
            <Plus className="w-3.5 h-3.5 text-purple-600" />
            <span>Créer une Variable Personnalisée</span>
          </button>

          {onSaveScenario && (
            <button
              type="button"
              onClick={handleSaveScenario}
              className="ml-auto px-3 py-1.5 bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl text-xs font-black flex items-center gap-1 shadow-xs transition-all cursor-pointer"
              title="Enregistrer ces variables dans la séance"
            >
              <Save className="w-3.5 h-3.5" />
              <span>Enregistrer</span>
            </button>
          )}
        </div>

        {/* FORM: CREATE CUSTOM VARIABLE */}
        {isCreatingCustomVariable && (
          <div className="bg-purple-50/80 p-3.5 rounded-2xl border-2 border-purple-300 shadow-sm space-y-3 animate-in fade-in duration-150">
            <div className="flex items-center justify-between">
              <h5 className="text-xs font-black text-purple-950 flex items-center gap-1.5">
                <Plus className="w-4 h-4 text-purple-600" />
                <span>Nouvelle Variable Pédagogique Personnalisée</span>
              </h5>
              <button
                type="button"
                onClick={() => setIsCreatingCustomVariable(false)}
                className="text-slate-400 hover:text-slate-700 p-1 cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
              <div>
                <label className="block text-[11px] font-bold text-slate-700 mb-1">
                  Catégorie S.T.E.P. :
                </label>
                <select
                  value={newVarCategory}
                  onChange={(e) => setNewVarCategory(e.target.value as AsfPedagogicalVariable['category'])}
                  className="w-full bg-white border border-purple-200 rounded-xl p-1.5 text-xs font-bold text-slate-800 focus:outline-none focus:border-purple-500"
                >
                  <option value="time">⏱️ Pression & Temps (Règle 3s)</option>
                  <option value="players">👥 Effectif & Joueurs (Surnombre)</option>
                  <option value="space">📐 Surface & Espace (Dimensions)</option>
                  <option value="rules">🎯 Tâche & Règles Provocatrices</option>
                  <option value="technical">👟 Technique & Bilatéralité</option>
                </select>
              </div>

              <div>
                <label className="block text-[11px] font-bold text-slate-700 mb-1">
                  Type d'effet pédagogique :
                </label>
                <select
                  value={newVarType}
                  onChange={(e) => setNewVarType(e.target.value as AsfPedagogicalVariable['type'])}
                  className="w-full bg-white border border-purple-200 rounded-xl p-1.5 text-xs font-bold text-slate-800 focus:outline-none focus:border-purple-500"
                >
                  <option value="provocation">⚡ Règle Provocatrice (Comportement visé)</option>
                  <option value="easier">🟢 Pour Faciliter (Réduire difficulté)</option>
                  <option value="harder">🔴 Pour Complexifier (Hausser l'exigence)</option>
                </select>
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
              <div className="sm:col-span-2">
                <label className="block text-[11px] font-bold text-slate-700 mb-1">
                  Titre de la variable :
                </label>
                <input
                  type="text"
                  value={newVarTitle}
                  onChange={(e) => setNewVarTitle(e.target.value)}
                  placeholder="Ex : But de la tête = 3 points"
                  className="w-full bg-white border border-purple-200 rounded-xl px-2.5 py-1.5 text-xs font-bold text-slate-800 focus:outline-none focus:border-purple-500"
                />
              </div>

              <div>
                <label className="block text-[11px] font-bold text-slate-700 mb-1">
                  Tag court / Badge terrain :
                </label>
                <input
                  type="text"
                  value={newVarTag}
                  onChange={(e) => setNewVarTag(e.target.value)}
                  placeholder="Ex : ⚽ Tête x3"
                  className="w-full bg-white border border-purple-200 rounded-xl px-2.5 py-1.5 text-xs font-bold text-slate-800 focus:outline-none focus:border-purple-500"
                />
              </div>
            </div>

            <div>
              <label className="block text-[11px] font-bold text-slate-700 mb-1">
                Description de l'aménagement ou de la règle :
              </label>
              <textarea
                rows={2}
                value={newVarDescription}
                onChange={(e) => setNewVarDescription(e.target.value)}
                placeholder="Ex : Tout but inscrit sur une reprise de volée ou de la tête suite à un centre compte pour 3 points."
                className="w-full bg-white border border-purple-200 rounded-xl p-2 text-xs font-medium text-slate-800 focus:outline-none focus:border-purple-500 resize-none"
              />
            </div>

            <div>
              <label className="block text-[11px] font-bold text-slate-700 mb-1">
                Mot d'ordre / Consigne clé du coach :
              </label>
              <input
                type="text"
                value={newVarCoaching}
                onChange={(e) => setNewVarCoaching(e.target.value)}
                placeholder="Ex : « Attaquez le premier poteau ! »"
                className="w-full bg-white border border-purple-200 rounded-xl px-2.5 py-1.5 text-xs font-bold text-slate-800 focus:outline-none focus:border-purple-500"
              />
            </div>

            <div className="flex items-center justify-end gap-2 pt-1">
              <button
                type="button"
                onClick={() => setIsCreatingCustomVariable(false)}
                className="px-3 py-1 text-xs font-bold text-slate-600 hover:text-slate-800 cursor-pointer"
              >
                Annuler
              </button>
              <button
                type="button"
                onClick={handleCreateCustomVariable}
                className="px-3 py-1.5 bg-purple-600 hover:bg-purple-500 text-white rounded-xl text-xs font-bold flex items-center gap-1 cursor-pointer shadow-xs"
              >
                <Check className="w-3.5 h-3.5" />
                <span>Créer et Activer</span>
              </button>
            </div>
          </div>
        )}

        {/* MODAL / PANEL: OFFICIAL ASF CATALOG */}
        {isCatalogOpen && (
          <div className="bg-slate-900 text-white p-4 rounded-2xl border border-slate-700 shadow-xl space-y-3 animate-in fade-in duration-150">
            <div className="flex items-center justify-between border-b border-slate-800 pb-2.5">
              <div className="flex items-center gap-2">
                <BookOpen className="w-4 h-4 text-red-500" />
                <h5 className="text-xs font-black text-white uppercase tracking-wider">
                  Catalogue Officiel ASF / FootEco ({ASF_PEDAGOGICAL_VARIABLES_CATALOG.length} variables)
                </h5>
              </div>
              <button
                type="button"
                onClick={() => setIsCatalogOpen(false)}
                className="text-slate-400 hover:text-white p-1 cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Catalog category filter */}
            <div className="flex items-center gap-1.5 overflow-x-auto pb-1 text-[11px] font-bold">
              {[
                { id: 'all', label: 'Toutes' },
                { id: 'time', label: '⏱️ Temps (3s)' },
                { id: 'players', label: '👥 Effectif (+1)' },
                { id: 'space', label: '📐 Espace' },
                { id: 'rules', label: '🎯 Règles' },
                { id: 'technical', label: '👟 Technique' }
              ].map(f => (
                <button
                  key={f.id}
                  type="button"
                  onClick={() => setCatalogCategoryFilter(f.id)}
                  className={`px-2.5 py-1 rounded-lg border whitespace-nowrap cursor-pointer transition-all ${
                    catalogCategoryFilter === f.id
                      ? 'bg-red-600 border-red-500 text-white'
                      : 'bg-slate-800 border-slate-700 text-slate-300 hover:text-white'
                  }`}
                >
                  {f.label}
                </button>
              ))}
            </div>

            {/* Catalog cards list */}
            <div className="space-y-2 max-h-72 overflow-y-auto pr-1">
              {filteredCatalog.map(catVar => {
                const isAlreadyPresent = variables.some(v => v.id === catVar.id);
                const isAlreadyActive = variables.some(v => v.id === catVar.id && v.isActive);
                const typeMeta = getTypeMeta(catVar.type);
                const catMeta = getCategoryMeta(catVar.category);

                return (
                  <div
                    key={catVar.id}
                    className="p-2.5 bg-slate-800/90 rounded-xl border border-slate-700 hover:border-slate-500 flex flex-col sm:flex-row sm:items-center justify-between gap-2.5 transition-colors"
                  >
                    <div className="space-y-1 flex-1">
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="px-2 py-0.5 bg-slate-900 border border-slate-600 text-amber-300 font-extrabold text-[10px] rounded-md">
                          {catVar.ruleTag || catVar.title}
                        </span>
                        <span className={`px-2 py-0.5 text-[10px] font-bold rounded-md border ${typeMeta.bg}`}>
                          {typeMeta.label}
                        </span>
                        <span className="text-[10px] font-bold text-slate-400">
                          {catMeta.label}
                        </span>
                      </div>
                      <h6 className="text-xs font-extrabold text-white">
                        {catVar.title}
                      </h6>
                      <p className="text-[11px] text-slate-300 leading-snug">
                        {catVar.description}
                      </p>
                      {catVar.coachingInstruction && (
                        <span className="text-[10px] font-semibold text-amber-300 block italic">
                          Coach : {catVar.coachingInstruction}
                        </span>
                      )}
                    </div>

                    <div className="flex sm:flex-col items-center sm:items-end gap-1.5 flex-shrink-0">
                      <button
                        type="button"
                        onClick={() => handleAddVariableFromCatalog(catVar)}
                        className={`px-2.5 py-1 rounded-lg text-xs font-bold flex items-center gap-1 transition-all cursor-pointer ${
                          isAlreadyActive
                            ? 'bg-emerald-700/80 text-emerald-200 border border-emerald-500'
                            : isAlreadyPresent
                            ? 'bg-slate-700 text-amber-300 hover:bg-slate-600'
                            : 'bg-red-600 hover:bg-red-500 text-white'
                        }`}
                      >
                        {isAlreadyActive ? (
                          <>
                            <Check className="w-3 h-3 text-emerald-300" />
                            <span>Active ✓</span>
                          </>
                        ) : isAlreadyPresent ? (
                          <>
                            <Check className="w-3 h-3" />
                            <span>Réactiver</span>
                          </>
                        ) : (
                          <>
                            <Plus className="w-3 h-3" />
                            <span>Ajouter</span>
                          </>
                        )}
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* Current Drill Variables List */}
        <div className="space-y-2.5">
          <div className="flex items-center justify-between flex-wrap gap-2">
            <div className="flex items-center gap-2">
              <Sliders className="w-4 h-4 text-slate-700" />
              <h5 className="text-xs font-black text-slate-900 uppercase tracking-wider">
                Variables appliquées à cet atelier ({variables.length})
              </h5>
            </div>

            {/* Filter pills */}
            <div className="flex items-center gap-1 overflow-x-auto text-[10px] font-bold">
              {[
                { id: 'all', label: `Toutes (${variables.length})` },
                { id: 'time', label: '⏱️ Temps' },
                { id: 'players', label: '👥 Effectif' },
                { id: 'space', label: '📐 Espace' },
                { id: 'rules', label: '🎯 Règles' },
                { id: 'technical', label: '👟 Technique' }
              ].map(f => (
                <button
                  key={f.id}
                  type="button"
                  onClick={() => setVariablesCategoryFilter(f.id)}
                  className={`px-2 py-0.5 rounded-lg border whitespace-nowrap cursor-pointer transition-all ${
                    variablesCategoryFilter === f.id
                      ? 'bg-slate-900 border-slate-900 text-white'
                      : 'bg-white border-slate-300 text-slate-600 hover:text-slate-900'
                  }`}
                >
                  {f.label}
                </button>
              ))}
            </div>
          </div>

          {filteredVariables.length === 0 ? (
            <div className="p-5 text-center bg-white rounded-2xl border border-dashed border-slate-300 text-slate-500 space-y-2">
              <Sliders className="w-6 h-6 mx-auto text-slate-400" />
              <p className="text-xs font-medium">
                Aucune variable dans cette catégorie pour le moment.
              </p>
              <button
                type="button"
                onClick={() => setIsCatalogOpen(true)}
                className="px-3 py-1 bg-red-600 hover:bg-red-500 text-white rounded-xl text-xs font-bold cursor-pointer inline-flex items-center gap-1"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>Sélectionner dans le catalogue ASF</span>
              </button>
            </div>
          ) : (
            <div className="space-y-2">
              {filteredVariables.map((v) => {
                const typeMeta = getTypeMeta(v.type);
                const catMeta = getCategoryMeta(v.category);

                return (
                  <div
                    key={v.id}
                    className={`p-3 rounded-2xl border transition-all ${
                      v.isActive
                        ? 'bg-white border-slate-300 shadow-xs ring-1 ring-slate-200'
                        : 'bg-slate-100/70 border-slate-200 opacity-60'
                    }`}
                  >
                    <div className="flex items-start justify-between gap-3">
                      
                      {/* Checkbox / Toggle switch */}
                      <label className="flex items-center gap-2 cursor-pointer select-none flex-shrink-0 pt-0.5">
                        <input
                          type="checkbox"
                          checked={v.isActive}
                          onChange={() => handleToggleVariable(v.id)}
                          className="w-4 h-4 rounded text-red-600 focus:ring-red-500 cursor-pointer accent-red-600"
                        />
                        <span className={`text-[10px] font-black uppercase tracking-wider ${v.isActive ? 'text-emerald-700' : 'text-slate-400'}`}>
                          {v.isActive ? 'Active' : 'Désactivée'}
                        </span>
                      </label>

                      {/* Content */}
                      <div className="flex-1 space-y-1">
                        <div className="flex items-center gap-1.5 flex-wrap">
                          <span className="px-2 py-0.5 bg-slate-900 text-amber-300 font-black text-[10px] rounded-md shadow-2xs">
                            {v.ruleTag || v.title}
                          </span>
                          <span className={`px-2 py-0.5 text-[10px] font-bold rounded-md border ${typeMeta.bg}`}>
                            {typeMeta.label}
                          </span>
                          <span className="text-[10px] font-bold text-slate-500">
                            {catMeta.label}
                          </span>
                        </div>

                        <h6 className="text-xs font-extrabold text-slate-900">
                          {v.title}
                        </h6>

                        <p className="text-xs text-slate-700 leading-snug">
                          {v.description}
                        </p>

                        {v.coachingInstruction && (
                          <div className="p-1.5 bg-amber-50 rounded-lg border border-amber-200/80 text-[11px] font-bold text-amber-900 flex items-center gap-1.5 mt-1">
                            <span className="w-1.5 h-1.5 rounded-full bg-amber-500" />
                            <span>Mot d'ordre : {v.coachingInstruction}</span>
                          </div>
                        )}
                      </div>

                      {/* Actions */}
                      <div className="flex flex-col items-end gap-1.5 flex-shrink-0">
                        <button
                          type="button"
                          onClick={() => handleInjectVariableIntoPhase(v)}
                          className="px-2 py-1 bg-slate-100 hover:bg-slate-200 border border-slate-300 text-slate-700 hover:text-slate-900 rounded-lg text-[10px] font-bold flex items-center gap-1 transition-colors cursor-pointer"
                          title="Injecter cette consigne directement dans l'étape active affichée sur le terrain"
                        >
                          <Zap className="w-3 h-3 text-amber-500" />
                          <span>Appliquer à l'étape {activePhaseIndex + 1}</span>
                        </button>

                        <button
                          type="button"
                          onClick={() => handleRemoveVariable(v.id)}
                          className="p-1 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded-md transition-colors cursor-pointer"
                          title="Retirer cette variable"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>

                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* Global Evolutions (Pour Faciliter / Pour Complexifier) */}
        <div className="bg-white p-3.5 rounded-2xl border border-slate-200 shadow-xs space-y-3">
          <div className="flex items-center gap-2">
            <Compass className="w-4 h-4 text-amber-600" />
            <h5 className="text-xs font-black text-slate-900 uppercase tracking-wider">
              Orientations globales de progression (ASF)
            </h5>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div className="p-3 bg-emerald-50/80 rounded-xl border border-emerald-200 space-y-1.5">
              <div className="flex items-center gap-1.5 text-xs font-bold text-emerald-900">
                <span className="w-2 h-2 rounded-full bg-emerald-500" />
                <span>Pour Faciliter (Réduire la charge / Réussite) :</span>
              </div>
              {isEditModeContext ? (
                <textarea
                  rows={3}
                  value={currentScenario.pedagogicalVariants.easier}
                  onChange={(e) => {
                    const nextVal = e.target.value;
                    setCurrentScenario(prev => ({
                      ...prev,
                      pedagogicalVariants: {
                        ...prev.pedagogicalVariants,
                        easier: nextVal
                      }
                    }));
                  }}
                  className="w-full bg-white border border-emerald-200 rounded-lg p-2 text-xs text-slate-800 focus:outline-none focus:border-emerald-500 resize-none"
                />
              ) : (
                <p className="text-xs text-slate-700 pl-3.5 leading-relaxed">
                  {currentScenario.pedagogicalVariants.easier}
                </p>
              )}
            </div>

            <div className="p-3 bg-rose-50/80 rounded-xl border border-rose-200 space-y-1.5">
              <div className="flex items-center gap-1.5 text-xs font-bold text-rose-900">
                <span className="w-2 h-2 rounded-full bg-rose-500" />
                <span>Pour Complexifier (Augmenter l'exigence) :</span>
              </div>
              {isEditModeContext ? (
                <textarea
                  rows={3}
                  value={currentScenario.pedagogicalVariants.harder}
                  onChange={(e) => {
                    const nextVal = e.target.value;
                    setCurrentScenario(prev => ({
                      ...prev,
                      pedagogicalVariants: {
                        ...prev.pedagogicalVariants,
                        harder: nextVal
                      }
                    }));
                  }}
                  className="w-full bg-white border border-rose-200 rounded-lg p-2 text-xs text-slate-800 focus:outline-none focus:border-rose-500 resize-none"
                />
              ) : (
                <p className="text-xs text-slate-700 pl-3.5 leading-relaxed">
                  {currentScenario.pedagogicalVariants.harder}
                </p>
              )}
            </div>
          </div>

          <div className="pt-2 border-t border-slate-100">
            <span className="font-extrabold text-slate-800 text-xs block mb-1">
              Critères de réussite (FootEco) :
            </span>
            <ul className="space-y-1 text-slate-600 text-[11px]">
              <li className="flex items-center gap-1.5">
                <span className="w-1.5 h-1.5 rounded-full bg-red-500" />
                <span>Plus de 70% d'actions abouties (tirs, centres ou passes vers l'avant réussies).</span>
              </li>
              <li className="flex items-center gap-1.5">
                <span className="w-1.5 h-1.5 rounded-full bg-red-500" />
                <span>Transition offensive/défensive déclenchée en moins de 3 secondes chronométrées.</span>
              </li>
              <li className="flex items-center gap-1.5">
                <span className="w-1.5 h-1.5 rounded-full bg-red-500" />
                <span>Répétition maximale et plaisir du jeu (« Jouer - Jouer - Jouer »).</span>
              </li>
            </ul>
          </div>
        </div>

      </div>
    );
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
                    <span>{saveSuccessMessage}</span>
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
                      ? 'bg-red-700 text-white shadow-sm'
                      : 'text-slate-300 hover:text-white hover:bg-slate-700'
                  }`}
                >
                  <span className="w-2 h-2 rounded-full bg-red-400" />
                  <span>🔴 Atelier 1</span>
                </button>
                <button
                  type="button"
                  onClick={() => setActiveSlot('Dessin 2')}
                  className={`text-[11px] font-bold px-2.5 py-1 rounded-lg transition-all flex items-center gap-1.5 cursor-pointer ${
                    activeSlot === 'Dessin 2'
                      ? 'bg-blue-700 text-white shadow-sm'
                      : 'text-slate-300 hover:text-white hover:bg-slate-700'
                  }`}
                >
                  <span className="w-2 h-2 rounded-full bg-blue-400" />
                  <span>🔵 Atelier 2</span>
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
                  Vue Complète
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
              title="Modifier le déroulement, ajouter du matériel de foot et positionner les joueurs"
            >
              <Pencil className="w-3.5 h-3.5" />
              <span>{isEditingFlow ? 'Mode Édition Activé' : 'Modifier les Étapes & Matériel'}</span>
            </button>

            {/* Auto-Align / Sync with Exercise Text button */}
            <button
              type="button"
              onClick={handleAutoAlignFromExercise}
              className="px-2.5 py-1.5 rounded-xl font-bold text-xs flex items-center gap-1.5 transition-all bg-gradient-to-r from-red-600 to-amber-600 hover:from-red-500 hover:to-amber-500 text-white shadow-sm active:scale-95 cursor-pointer"
              title="Réanalyser le texte FootEco de l'exercice pour synchroniser automatiquement l'animation, le matériel et les phases"
            >
              <Sparkles className="w-3.5 h-3.5 text-amber-200" />
              <span className="hidden sm:inline">Adapter au texte</span>
              <span className="sm:hidden">Sync</span>
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
              <div className="flex items-center gap-2 flex-wrap">
                <span className="px-2.5 py-1 bg-emerald-900/60 border border-emerald-500/40 text-emerald-300 font-bold rounded-lg flex items-center gap-1.5">
                  <span className="w-2 h-2 rounded-full bg-emerald-400 animate-ping" />
                  {currentPhase.title}
                </span>
                {currentPhase.visualCue && (
                  <span className="px-2.5 py-1 bg-amber-500/20 border border-amber-400/40 text-amber-300 font-black rounded-lg text-[11px]">
                    {currentPhase.visualCue}
                  </span>
                )}

                {/* Active FootEco Pedagogical Variables Badges */}
                {activeVariables.map((v) => (
                  <span 
                    key={v.id} 
                    title={`${v.title}: ${v.description}`}
                    onClick={() => {
                      if (!isEditingFlow) setActiveTab('variants');
                      else setEditSubTab('variables');
                    }}
                    className={`px-2 py-0.5 rounded-lg text-[10px] font-bold border flex items-center gap-1 shadow-2xs cursor-pointer transition-all hover:scale-105 ${
                      v.type === 'provocation' 
                        ? 'bg-amber-950/70 border-amber-500/50 text-amber-300 hover:border-amber-400' 
                        : v.type === 'easier'
                        ? 'bg-emerald-950/70 border-emerald-500/50 text-emerald-300 hover:border-emerald-400'
                        : 'bg-rose-950/70 border-rose-500/50 text-rose-300 hover:border-rose-400'
                    }`}
                  >
                    <span>{v.ruleTag || v.title}</span>
                  </span>
                ))}
              </div>

              {/* Pitch Controls & Mode Badge */}
              <div className="flex items-center gap-2">
                {(isEditingFlow || activeTab === 'edit') && (
                  <span className="text-[10px] font-bold text-amber-300 bg-amber-950/70 border border-amber-500/40 px-2 py-0.5 rounded-lg flex items-center gap-1 animate-pulse">
                    <Move className="w-3 h-3 text-amber-400" />
                    <span>Glissez joueurs & matériel</span>
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

            {/* Selected Equipment Pitch Context Bar (if an item is selected on pitch) */}
            {(isEditingFlow || activeTab === 'edit') && selectedElement && (
              <div className="mb-2 bg-slate-900/95 border border-amber-500/50 rounded-xl px-3 py-1.5 flex items-center justify-between text-xs text-slate-200 gap-2 animate-in fade-in">
                <div className="flex items-center gap-2">
                  <span className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: selectedElement.color || '#FACC15' }} />
                  <span className="font-extrabold text-amber-300">{selectedElement.label || selectedElement.type}</span>
                  <span className="text-[10px] text-slate-400 font-mono">({selectedElement.x}, {selectedElement.y})</span>
                </div>
                <div className="flex items-center gap-1.5">
                  <button
                    type="button"
                    onClick={() => handleRotateEquipment(selectedElement.id, 45)}
                    className="p-1 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white text-[10px] font-bold flex items-center gap-1 cursor-pointer"
                    title="Pivoter de 45°"
                  >
                    <RotateCw className="w-3 h-3" />
                    <span>Pivoter</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => handleDuplicateEquipment(selectedElement.id)}
                    className="p-1 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white text-[10px] font-bold flex items-center gap-1 cursor-pointer"
                    title="Dupliquer cet élément"
                  >
                    <Copy className="w-3 h-3" />
                    <span>Dupliquer</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => handleDeleteEquipment(selectedElement.id)}
                    className="p-1 rounded-lg bg-red-950/80 hover:bg-red-900 text-red-300 text-[10px] font-bold flex items-center gap-1 cursor-pointer"
                    title="Supprimer cet équipement"
                  >
                    <Trash2 className="w-3 h-3" />
                    <span>Suppr</span>
                  </button>
                </div>
              </div>
            )}

            {/* SVG Interactive Pitch Canvas */}
            <div className="relative w-full aspect-[16/10] bg-gradient-to-b from-[#156e35] to-[#125d2d] rounded-2xl border-4 border-emerald-800/80 shadow-2xl overflow-hidden select-none">
              
              <svg 
                ref={svgRef}
                viewBox="0 0 800 520" 
                className="w-full h-full cursor-default"
                onClick={() => setSelectedElementId(null)}
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

                  {/* Player & Equipment drop shadow filter */}
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

                {/* PITCH EQUIPMENT LAYER (Plots, Jalons, Buts, Mannequins, Échelles...) */}
                {currentScenario.elements.map(el => {
                  const isSelected = selectedElementId === el.id;
                  const canDrag = isEditingFlow || activeTab === 'edit';

                  // 1. Grand But
                  if (el.type === 'goal') {
                    return (
                      <g 
                        key={el.id} 
                        transform={`translate(${el.x - (el.width || 80)/2}, ${el.y - (el.height || 22)/2}) rotate(${el.rotation || 0} ${(el.width || 80)/2} ${(el.height || 22)/2})`}
                        onPointerDown={(e) => handlePointerDown(`element-${el.id}`, e)}
                        onClick={(e) => {
                          e.stopPropagation();
                          if (canDrag) setSelectedElementId(el.id);
                        }}
                        className={canDrag ? 'cursor-grab active:cursor-grabbing' : 'pointer-events-none'}
                      >
                        {isSelected && (
                          <rect x="-4" y="-4" width={(el.width || 80) + 8} height={(el.height || 22) + 8} fill="none" stroke="#FACC15" strokeWidth="2" strokeDasharray="3,3" rx="4" />
                        )}
                        <rect 
                          width={el.width || 80} 
                          height={el.height || 22} 
                          fill="rgba(255,255,255,0.3)" 
                          stroke="#FFFFFF" 
                          strokeWidth="3" 
                          rx="2"
                        />
                        <line x1="0" y1="7" x2={el.width || 80} y2="7" stroke="#FFFFFF" strokeWidth="1" strokeDasharray="3,3" strokeOpacity="0.7" />
                        <line x1="0" y1="14" x2={el.width || 80} y2="14" stroke="#FFFFFF" strokeWidth="1" strokeDasharray="3,3" strokeOpacity="0.7" />
                      </g>
                    );
                  }

                  // 2. Mini-but rotatif
                  if (el.type === 'mini-goal') {
                    return (
                      <g 
                        key={el.id} 
                        transform={`translate(${el.x}, ${el.y}) rotate(${el.rotation || 0})`}
                        onPointerDown={(e) => handlePointerDown(`element-${el.id}`, e)}
                        onClick={(e) => {
                          e.stopPropagation();
                          if (canDrag) setSelectedElementId(el.id);
                        }}
                        className={canDrag ? 'cursor-grab active:cursor-grabbing' : 'pointer-events-none'}
                      >
                        {isSelected && (
                          <rect x={-(el.width || 36)/2 - 4} y={-(el.height || 18)/2 - 4} width={(el.width || 36) + 8} height={(el.height || 18) + 8} fill="none" stroke="#FACC15" strokeWidth="2" strokeDasharray="2,2" rx="3" />
                        )}
                        <rect 
                          x={-(el.width || 36)/2} 
                          y={-(el.height || 18)/2} 
                          width={el.width || 36} 
                          height={el.height || 18} 
                          fill="rgba(250,204,21,0.35)" 
                          stroke={el.color || "#FACC15"} 
                          strokeWidth="2.5" 
                          rx="2"
                        />
                        <line x1={-(el.width || 36)/2} y1="0" x2={(el.width || 36)/2} y2="0" stroke={el.color || "#FACC15"} strokeWidth="1" strokeDasharray="2,2" />
                        <text x="0" y="3" textAnchor="middle" fontSize="7.5" fontWeight="bold" fill={el.color || "#FACC15"}>
                          BUT
                        </text>
                      </g>
                    );
                  }

                  // 3. Coupelle ou Plot
                  if (el.type === 'cone') {
                    return (
                      <g 
                        key={el.id} 
                        transform={`translate(${el.x}, ${el.y})`}
                        onPointerDown={(e) => handlePointerDown(`element-${el.id}`, e)}
                        onClick={(e) => {
                          e.stopPropagation();
                          if (canDrag) setSelectedElementId(el.id);
                        }}
                        className={canDrag ? 'cursor-grab active:cursor-grabbing' : 'pointer-events-none'}
                      >
                        {isSelected && (
                          <circle cx="0" cy="0" r="13" fill="none" stroke="#FACC15" strokeWidth="2" strokeDasharray="2,2" />
                        )}
                        <ellipse cx="0" cy="2" rx="8" ry="4" fill="rgba(0,0,0,0.35)" />
                        <polygon points="0,-8 7,5 -7,5" fill={el.color || '#F97316'} stroke="#FFFFFF" strokeWidth="1" />
                        <circle cx="0" cy="1" r="2" fill="#FFFFFF" opacity="0.9" />
                      </g>
                    );
                  }

                  // 4. Jalon / Piquet de slalom
                  if (el.type === 'pole') {
                    return (
                      <g 
                        key={el.id} 
                        transform={`translate(${el.x}, ${el.y})`}
                        onPointerDown={(e) => handlePointerDown(`element-${el.id}`, e)}
                        onClick={(e) => {
                          e.stopPropagation();
                          if (canDrag) setSelectedElementId(el.id);
                        }}
                        className={canDrag ? 'cursor-grab active:cursor-grabbing' : 'pointer-events-none'}
                      >
                        {isSelected && (
                          <circle cx="0" cy="-6" r="15" fill="none" stroke="#FACC15" strokeWidth="2" strokeDasharray="2,2" />
                        )}
                        <ellipse cx="0" cy="2" rx="7" ry="3" fill="rgba(0,0,0,0.4)" />
                        <circle cx="0" cy="0" r="6" fill="#1E293B" stroke="#FFFFFF" strokeWidth="1" />
                        <line x1="0" y1="0" x2="0" y2="-18" stroke={el.color || '#EF4444'} strokeWidth="3" strokeLinecap="round" />
                        <polygon points="0,-18 7,-15 0,-12" fill={el.color || '#EF4444'} />
                        <circle cx="0" cy="-18" r="2" fill="#FFFFFF" />
                        {el.label && (
                          <text x="0" y="14" textAnchor="middle" fontSize="8" fontWeight="bold" fill="#FFFFFF" stroke="#000000" strokeWidth="1.5" paintOrder="stroke">
                            {el.label}
                          </text>
                        )}
                      </g>
                    );
                  }

                  // 5. Mannequin / Silhouette Défenseur
                  if (el.type === 'dummy') {
                    return (
                      <g 
                        key={el.id} 
                        transform={`translate(${el.x}, ${el.y}) rotate(${el.rotation || 0})`}
                        onPointerDown={(e) => handlePointerDown(`element-${el.id}`, e)}
                        onClick={(e) => {
                          e.stopPropagation();
                          if (canDrag) setSelectedElementId(el.id);
                        }}
                        className={canDrag ? 'cursor-grab active:cursor-grabbing' : 'pointer-events-none'}
                      >
                        {isSelected && (
                          <rect x="-14" y="-22" width="28" height="42" fill="none" stroke="#FACC15" strokeWidth="2" strokeDasharray="2,2" rx="4" />
                        )}
                        <ellipse cx="0" cy="16" rx="10" ry="4" fill="rgba(0,0,0,0.35)" />
                        <rect x="-8" y="13" width="16" height="3" fill="#1E293B" rx="1" />
                        <line x1="-4" y1="13" x2="-4" y2="4" stroke={el.color || '#0284C7'} strokeWidth="2.5" />
                        <line x1="4" y1="13" x2="4" y2="4" stroke={el.color || '#0284C7'} strokeWidth="2.5" />
                        <rect x="-8" y="-10" width="16" height="14" rx="3" fill={el.color || '#0284C7'} stroke="#FFFFFF" strokeWidth="1.5" />
                        <circle cx="0" cy="-15" r="5" fill={el.color || '#0284C7'} stroke="#FFFFFF" strokeWidth="1.5" />
                        <text x="0" y="-1" textAnchor="middle" fontSize="6.5" fontWeight="900" fill="#FFFFFF">
                          DEF
                        </text>
                      </g>
                    );
                  }

                  // 6. Échelle de rythme / motricité
                  if (el.type === 'ladder') {
                    return (
                      <g 
                        key={el.id} 
                        transform={`translate(${el.x}, ${el.y}) rotate(${el.rotation || 0})`}
                        onPointerDown={(e) => handlePointerDown(`element-${el.id}`, e)}
                        onClick={(e) => {
                          e.stopPropagation();
                          if (canDrag) setSelectedElementId(el.id);
                        }}
                        className={canDrag ? 'cursor-grab active:cursor-grabbing' : 'pointer-events-none'}
                      >
                        {isSelected && (
                          <rect x="-18" y="-48" width="36" height="96" fill="none" stroke="#FACC15" strokeWidth="2" strokeDasharray="3,3" rx="4" />
                        )}
                        <line x1="-12" y1="-42" x2="-12" y2="42" stroke="#1E293B" strokeWidth="3" />
                        <line x1="12" y1="-42" x2="12" y2="42" stroke="#1E293B" strokeWidth="3" />
                        {[-38, -19, 0, 19, 38].map((ry, rIdx) => (
                          <line key={rIdx} x1="-13" y1={ry} x2="13" y2={ry} stroke={el.color || '#FACC15'} strokeWidth="3" strokeLinecap="round" />
                        ))}
                      </g>
                    );
                  }

                  // 7. Mini-haie
                  if (el.type === 'hurdle') {
                    return (
                      <g 
                        key={el.id} 
                        transform={`translate(${el.x}, ${el.y}) rotate(${el.rotation || 0})`}
                        onPointerDown={(e) => handlePointerDown(`element-${el.id}`, e)}
                        onClick={(e) => {
                          e.stopPropagation();
                          if (canDrag) setSelectedElementId(el.id);
                        }}
                        className={canDrag ? 'cursor-grab active:cursor-grabbing' : 'pointer-events-none'}
                      >
                        {isSelected && (
                          <rect x="-16" y="-12" width="32" height="24" fill="none" stroke="#FACC15" strokeWidth="2" strokeDasharray="2,2" rx="3" />
                        )}
                        <ellipse cx="0" cy="6" rx="14" ry="3" fill="rgba(0,0,0,0.3)" />
                        <line x1="-12" y1="5" x2="-12" y2="-6" stroke={el.color || '#F59E0B'} strokeWidth="2.5" />
                        <line x1="12" y1="5" x2="12" y2="-6" stroke={el.color || '#F59E0B'} strokeWidth="2.5" />
                        <line x1="-14" y1="-6" x2="14" y2="-6" stroke={el.color || '#F59E0B'} strokeWidth="3.5" strokeLinecap="round" />
                      </g>
                    );
                  }

                  // 8. Cerceau
                  if (el.type === 'ring') {
                    return (
                      <g 
                        key={el.id} 
                        transform={`translate(${el.x}, ${el.y})`}
                        onPointerDown={(e) => handlePointerDown(`element-${el.id}`, e)}
                        onClick={(e) => {
                          e.stopPropagation();
                          if (canDrag) setSelectedElementId(el.id);
                        }}
                        className={canDrag ? 'cursor-grab active:cursor-grabbing' : 'pointer-events-none'}
                      >
                        {isSelected && (
                          <circle cx="0" cy="0" r="16" fill="none" stroke="#FACC15" strokeWidth="2" strokeDasharray="2,2" />
                        )}
                        <ellipse cx="0" cy="2" rx="13" ry="8" fill="none" stroke="rgba(0,0,0,0.3)" strokeWidth="3" />
                        <ellipse cx="0" cy="0" rx="13" ry="8" fill="none" stroke={el.color || '#10B981'} strokeWidth="3" />
                      </g>
                    );
                  }

                  // 9. Réserve de ballons
                  if (el.type === 'ball-rack') {
                    return (
                      <g 
                        key={el.id} 
                        transform={`translate(${el.x}, ${el.y})`}
                        onPointerDown={(e) => handlePointerDown(`element-${el.id}`, e)}
                        onClick={(e) => {
                          e.stopPropagation();
                          if (canDrag) setSelectedElementId(el.id);
                        }}
                        className={canDrag ? 'cursor-grab active:cursor-grabbing' : 'pointer-events-none'}
                      >
                        {isSelected && (
                          <circle cx="0" cy="0" r="18" fill="none" stroke="#FACC15" strokeWidth="2" strokeDasharray="2,2" />
                        )}
                        <ellipse cx="0" cy="6" rx="14" ry="5" fill="rgba(0,0,0,0.4)" />
                        <circle cx="-5" cy="2" r="6" fill="#FFFFFF" stroke="#1E293B" strokeWidth="1" />
                        <circle cx="5" cy="2" r="6" fill="#FFFFFF" stroke="#1E293B" strokeWidth="1" />
                        <circle cx="0" cy="-4" r="6" fill="#FFFFFF" stroke="#1E293B" strokeWidth="1" />
                        <text x="0" y="16" textAnchor="middle" fontSize="7" fontWeight="bold" fill="#FFFFFF" stroke="#000" strokeWidth="1.5" paintOrder="stroke">
                          Ballons
                        </text>
                      </g>
                    );
                  }

                  // 10. Zone Délimitée
                  if (el.type === 'zone') {
                    return (
                      <g 
                        key={el.id} 
                        transform={`translate(${el.x}, ${el.y})`}
                        onPointerDown={(e) => handlePointerDown(`element-${el.id}`, e)}
                        onClick={(e) => {
                          e.stopPropagation();
                          if (canDrag) setSelectedElementId(el.id);
                        }}
                        className={canDrag ? 'cursor-grab active:cursor-grabbing' : 'pointer-events-none'}
                      >
                        <rect 
                          x={-(el.width || 120)/2} 
                          y={-(el.height || 80)/2} 
                          width={el.width || 120} 
                          height={el.height || 80} 
                          fill={el.color || 'rgba(16, 185, 129, 0.15)'} 
                          stroke={isSelected ? "#FACC15" : (el.color || '#10B981')} 
                          strokeWidth={isSelected ? "3" : "2"} 
                          strokeDasharray="6,4" 
                          rx="6"
                        />
                        {el.label && (
                          <text x="0" y="3" textAnchor="middle" fontSize="9.5" fontWeight="bold" fill="#FFFFFF" stroke="#000" strokeWidth="2" paintOrder="stroke">
                            {el.label}
                          </text>
                        )}
                      </g>
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
                  const actorData = interpolatedActors[actor.id] || { x: 400, y: 260, action: 'idle', angle: 0, isMoving: false };
                  const pos = isEditingFlow && currentPhase.actors[actor.id]
                    ? { ...currentPhase.actors[actor.id], angle: actorData.angle, isMoving: false }
                    : actorData;

                  const isGK = actor.role === 'goalkeeper';
                  const isCoach = actor.role === 'coach';
                  const radius = isCoach ? 16 : isGK ? 15 : 14;
                  const isDraggingThis = draggingTarget === actor.id;
                  const action = currentPhase.actors[actor.id]?.action || actorData.action || 'idle';

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
                      {/* Movement Direction Chevron */}
                      {actorData.isMoving && !isDraggingThis && (
                        <g transform={`rotate(${actorData.angle})`}>
                          <polygon 
                            points="13,-4 18,0 13,4" 
                            fill={actor.color} 
                            stroke="#FFFFFF" 
                            strokeWidth="1.2"
                            opacity="0.9"
                          />
                        </g>
                      )}

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

                      {/* Dynamic Micro-Action Badges */}
                      {!isEditingFlow && (
                        <>
                          {action === 'shoot' && (
                            <g transform="translate(0, -26)" className="animate-pulse">
                              <rect x="-24" y="-8" width="48" height="15" rx="5" fill="#EF4444" stroke="#FFFFFF" strokeWidth="1.2" />
                              <text x="0" y="3" textAnchor="middle" fontSize="8" fontWeight="900" fill="#FFFFFF">⚽ Tir !</text>
                            </g>
                          )}
                          {action === 'pass' && (
                            <g transform="translate(0, -26)">
                              <rect x="-26" y="-8" width="52" height="15" rx="5" fill="#2563EB" stroke="#FFFFFF" strokeWidth="1.2" />
                              <text x="0" y="3" textAnchor="middle" fontSize="8" fontWeight="900" fill="#FFFFFF">👟 Passe</text>
                            </g>
                          )}
                          {action === 'defend' && (
                            <g transform="translate(0, -26)">
                              <rect x="-28" y="-8" width="56" height="15" rx="5" fill="#475569" stroke="#FFFFFF" strokeWidth="1.2" />
                              <text x="0" y="3" textAnchor="middle" fontSize="8" fontWeight="900" fill="#FFFFFF">🛡️ Cadrage</text>
                            </g>
                          )}
                          {action === 'run' && actorData.isMoving && (
                            <g transform="translate(0, -26)">
                              <rect x="-24" y="-8" width="48" height="15" rx="5" fill="#D97706" stroke="#FFFFFF" strokeWidth="1.2" />
                              <text x="0" y="3" textAnchor="middle" fontSize="8" fontWeight="900" fill="#FFFFFF">💨 Appel</text>
                            </g>
                          )}
                          {action === 'save' && (
                            <g transform="translate(0, -26)">
                              <rect x="-26" y="-8" width="52" height="15" rx="5" fill="#059669" stroke="#FFFFFF" strokeWidth="1.2" />
                              <text x="0" y="3" textAnchor="middle" fontSize="8" fontWeight="900" fill="#FFFFFF">🧤 Arrêt !</text>
                            </g>
                          )}
                          {action === 'dribble' && (
                            <g transform="translate(0, -26)">
                              <rect x="-28" y="-8" width="56" height="15" rx="5" fill="#7C3AED" stroke="#FFFFFF" strokeWidth="1.2" />
                              <text x="0" y="3" textAnchor="middle" fontSize="8" fontWeight="900" fill="#FFFFFF">⚡ Dribble</text>
                            </g>
                          )}
                        </>
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

                {/* Animated & Draggable Ball (⚽) with 3D Elevation */}
                {(() => {
                  const ballData = interpolatedBall;
                  const ballPos = isEditingFlow && currentPhase.ball
                    ? { ...currentPhase.ball, elevation: 0, phaseProgress: 0 }
                    : ballData;
                  const isDraggingBall = draggingTarget === 'ball';
                  const elevation = isDraggingBall ? 0 : (ballPos.elevation || 0);
                  const isAirborne = elevation > 5;

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
                      {/* Interactive ring if edit mode */}
                      {(isEditingFlow || activeTab === 'edit') && (
                        <circle 
                          cx="0" 
                          cy="0" 
                          r="14" 
                          fill="none" 
                          stroke={isDraggingBall ? "#FACC15" : "rgba(255,255,255,0.7)"} 
                          strokeWidth="2" 
                          strokeDasharray="2,2" 
                        />
                      )}

                      {/* Realistic Ground Shadow (stays at ground level, widens/fades with elevation) */}
                      <ellipse 
                        cx="1" 
                        cy="4" 
                        rx={6 + elevation * 0.12} 
                        ry={3 + elevation * 0.05} 
                        fill="rgba(0,0,0,0.5)" 
                        opacity={Math.max(0.12, 0.5 - elevation * 0.008)}
                      />

                      {/* Subtle altitude drop line when ball is in high aerial flight */}
                      {isAirborne && (
                        <line 
                          x1="0" 
                          y1="4" 
                          x2="0" 
                          y2={-elevation * 1.15} 
                          stroke="rgba(255,255,255,0.3)" 
                          strokeWidth="1" 
                          strokeDasharray="2,2" 
                        />
                      )}

                      {/* Ball Sphere (elevated upward by parabolic trajectory and slightly scaled up) */}
                      <g transform={`translate(0, ${-elevation * 1.15}) scale(${1 + elevation * 0.01})`}>
                        <circle cx="0" cy="0" r="7.5" fill="#FFFFFF" stroke="#0F172A" strokeWidth="1.6" />
                        <polygon points="0,-3.5 3.2,-1.2 2,2.4 -2,2.4 -3.2,-1.2" fill="#0F172A" />
                        {/* Highlights for 3D sphere look */}
                        <circle cx="-2" cy="-2.5" r="2" fill="#FFFFFF" opacity="0.6" />
                      </g>
                    </g>
                  );
                })()}

                {/* Celebratory Goal Overlay */}
                {!isEditingFlow && currentPhase.visualCue && /BUT|GOAL|TIR/i.test(currentPhase.visualCue) && (
                  <g transform="translate(400, 80)">
                    <rect 
                      x="-80" 
                      y="-18" 
                      width="160" 
                      height="36" 
                      rx="10" 
                      fill="rgba(16, 185, 129, 0.92)" 
                      stroke="#FFFFFF" 
                      strokeWidth="2.5" 
                      filter="url(#shadow)"
                    />
                    <text 
                      x="0" 
                      y="5" 
                      textAnchor="middle" 
                      fontSize="14" 
                      fontWeight="900" 
                      fill="#FFFFFF"
                      letterSpacing="1"
                    >
                      {currentPhase.visualCue}
                    </text>
                  </g>
                )}

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
                <span>✏️ Modifier les étapes & matériel</span>
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
                <span>🎯 Variables S.T.E.P. {activeVariables.length > 0 && `(${activeVariables.length})`}</span>
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

            {/* TAB: EDIT FLOW & EQUIPMENT MODE */}
            {(activeTab === 'edit' || isEditingFlow) && (
              <div className="space-y-3.5 flex-1 overflow-y-auto pr-1">
                
                {/* Sub-tab switcher inside Edit mode: Steps vs Equipment vs Variables */}
                <div className="flex items-center bg-slate-200/80 p-1 rounded-xl gap-1">
                  <button
                    type="button"
                    onClick={() => setEditSubTab('steps')}
                    className={`flex-1 py-1.5 rounded-lg text-xs font-extrabold flex items-center justify-center gap-1.5 transition-all cursor-pointer ${
                      editSubTab === 'steps'
                        ? 'bg-white text-slate-900 shadow-xs'
                        : 'text-slate-600 hover:text-slate-900'
                    }`}
                  >
                    <Pencil className="w-3.5 h-3.5 text-amber-600" />
                    <span>Étapes ({phases.length})</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => setEditSubTab('equipment')}
                    className={`flex-1 py-1.5 rounded-lg text-xs font-extrabold flex items-center justify-center gap-1.5 transition-all cursor-pointer ${
                      editSubTab === 'equipment'
                        ? 'bg-amber-500 text-slate-950 shadow-xs'
                        : 'text-slate-600 hover:text-slate-900'
                    }`}
                  >
                    <Box className="w-3.5 h-3.5" />
                    <span>🎒 Matériel ({currentScenario.elements.length})</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => setEditSubTab('variables')}
                    className={`flex-1 py-1.5 rounded-lg text-xs font-extrabold flex items-center justify-center gap-1.5 transition-all cursor-pointer ${
                      editSubTab === 'variables'
                        ? 'bg-purple-600 text-white shadow-xs'
                        : 'text-slate-600 hover:text-slate-900'
                    }`}
                  >
                    <Sliders className="w-3.5 h-3.5" />
                    <span>🎯 Variables ({activeVariables.length})</span>
                  </button>
                </div>

                {/* SUB-VIEW 1: FOOTBALL EQUIPMENT MANAGEMENT */}
                {editSubTab === 'equipment' && (
                  <div className="space-y-3">
                    
                    {/* Equipment Catalog Banner */}
                    <div className="bg-amber-50 border border-amber-300 rounded-2xl p-3 text-xs space-y-1">
                      <div className="flex items-center justify-between">
                        <span className="font-extrabold text-amber-900 flex items-center gap-1.5">
                          <Box className="w-4 h-4 text-amber-600" />
                          <span>Palette de Matériel de Football</span>
                        </span>
                        <span className="text-[10px] font-bold text-amber-800 bg-amber-200/70 px-2 py-0.5 rounded-full">
                          {currentScenario.elements.length} éléments
                        </span>
                      </div>
                      <p className="text-[11px] text-amber-800 leading-relaxed">
                        Cliquez pour ajouter du matériel sur le terrain. Glissez-les ensuite à l'endroit exact souhaité pour modéliser votre atelier.
                      </p>
                    </div>

                    {/* Quick Add Grid */}
                    <div className="bg-white p-3 rounded-2xl border border-slate-200 shadow-xs space-y-2.5">
                      <span className="text-[11px] font-extrabold text-slate-600 uppercase tracking-wider block">
                        Ajouter du matériel :
                      </span>

                      <div className="grid grid-cols-2 sm:grid-cols-3 gap-1.5">
                        {FOOTBALL_EQUIPMENT_PRESETS.map((preset, idx) => (
                          <button
                            key={idx}
                            type="button"
                            onClick={() => handleAddEquipment(preset)}
                            className="p-2 bg-slate-50 hover:bg-amber-50 border border-slate-200 hover:border-amber-300 rounded-xl text-left flex items-center gap-2 transition-all cursor-pointer group"
                            title={preset.description}
                          >
                            <span 
                              className="w-3.5 h-3.5 rounded-full border border-slate-400 flex-shrink-0 group-hover:scale-110 transition-transform"
                              style={{ backgroundColor: preset.color }}
                            />
                            <span className="text-[11px] font-bold text-slate-800 group-hover:text-amber-900 truncate">
                              {preset.label}
                            </span>
                          </button>
                        ))}
                      </div>

                      {/* Quick combo actions */}
                      <div className="pt-2 border-t border-slate-100 flex items-center gap-1.5 flex-wrap">
                        <button
                          type="button"
                          onClick={handleAddConeSlalomLine}
                          className="px-2.5 py-1 bg-amber-100 hover:bg-amber-200 text-amber-900 border border-amber-300 rounded-lg text-[10px] font-extrabold flex items-center gap-1 cursor-pointer transition-colors"
                        >
                          <Plus className="w-3 h-3" />
                          <span>Ligne de 4 plots (Slalom)</span>
                        </button>
                        <button
                          type="button"
                          onClick={() => handleAddPassingGate('#3B82F6')}
                          className="px-2.5 py-1 bg-blue-100 hover:bg-blue-200 text-blue-900 border border-blue-300 rounded-lg text-[10px] font-extrabold flex items-center gap-1 cursor-pointer transition-colors"
                        >
                          <Plus className="w-3 h-3" />
                          <span>Porte 2 coupelles</span>
                        </button>
                      </div>
                    </div>

                    {/* Selected Equipment Inspector */}
                    {selectedElement ? (
                      <div className="bg-amber-50/60 p-3.5 rounded-2xl border-2 border-amber-400 space-y-2.5 text-xs">
                        <div className="flex items-center justify-between border-b border-amber-200 pb-2">
                          <span className="font-extrabold text-amber-950 flex items-center gap-1.5">
                            <span className="w-3 h-3 rounded-full" style={{ backgroundColor: selectedElement.color || '#FACC15' }} />
                            <span>Équipement sélectionné : {selectedElement.label || selectedElement.type}</span>
                          </span>
                          <span className="text-[10px] font-mono text-slate-500">
                            X: {selectedElement.x} | Y: {selectedElement.y}
                          </span>
                        </div>

                        {/* Controls */}
                        <div className="grid grid-cols-3 gap-1.5">
                          <button
                            type="button"
                            onClick={() => handleRotateEquipment(selectedElement.id, 45)}
                            className="py-1.5 px-2 bg-white hover:bg-slate-50 border border-slate-300 rounded-xl font-bold text-slate-800 flex items-center justify-center gap-1 cursor-pointer"
                          >
                            <RotateCw className="w-3.5 h-3.5 text-amber-600" />
                            <span>Pivoter 45°</span>
                          </button>

                          <button
                            type="button"
                            onClick={() => handleDuplicateEquipment(selectedElement.id)}
                            className="py-1.5 px-2 bg-white hover:bg-slate-50 border border-slate-300 rounded-xl font-bold text-slate-800 flex items-center justify-center gap-1 cursor-pointer"
                          >
                            <Copy className="w-3.5 h-3.5 text-blue-600" />
                            <span>Dupliquer</span>
                          </button>

                          <button
                            type="button"
                            onClick={() => handleDeleteEquipment(selectedElement.id)}
                            className="py-1.5 px-2 bg-red-50 hover:bg-red-100 border border-red-300 rounded-xl font-bold text-red-700 flex items-center justify-center gap-1 cursor-pointer"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                            <span>Supprimer</span>
                          </button>
                        </div>

                        {/* Color changer for cones, poles, zones */}
                        {(selectedElement.type === 'cone' || selectedElement.type === 'pole' || selectedElement.type === 'zone') && (
                          <div className="flex items-center gap-2 pt-1">
                            <span className="text-[11px] font-bold text-slate-600">Couleur :</span>
                            <div className="flex items-center gap-1.5">
                              {['#F97316', '#FACC15', '#EF4444', '#3B82F6', '#10B981', '#FFFFFF'].map(c => (
                                <button
                                  key={c}
                                  type="button"
                                  onClick={() => handleUpdateEquipmentColor(selectedElement.id, c)}
                                  className={`w-5 h-5 rounded-full border-2 transition-transform cursor-pointer ${
                                    selectedElement.color === c ? 'scale-125 border-slate-900 shadow-xs' : 'border-slate-300'
                                  }`}
                                  style={{ backgroundColor: c }}
                                />
                              ))}
                            </div>
                          </div>
                        )}
                      </div>
                    ) : (
                      <div className="p-3 bg-slate-100 rounded-xl border border-slate-200 text-center text-xs text-slate-500 italic">
                        Cliquez sur n'importe quel plot, but ou jalon sur le terrain pour le modifier, le faire pivoter ou le dupliquer.
                      </div>
                    )}

                    {/* Equipment list & reset tools */}
                    <div className="bg-white p-3 rounded-2xl border border-slate-200 space-y-2">
                      <div className="flex items-center justify-between text-xs">
                        <span className="font-extrabold text-slate-700">
                          Matériel sur le terrain ({currentScenario.elements.length}) :
                        </span>
                        <div className="flex items-center gap-1">
                          <button
                            type="button"
                            onClick={handleResetDefaultEquipment}
                            className="text-[10px] font-bold text-blue-700 hover:underline cursor-pointer"
                          >
                            Rétablir défaut
                          </button>
                          <span className="text-slate-300">|</span>
                          <button
                            type="button"
                            onClick={handleClearAllEquipment}
                            className="text-[10px] font-bold text-red-600 hover:underline cursor-pointer"
                          >
                            Tout effacer
                          </button>
                        </div>
                      </div>

                      <div className="flex flex-wrap gap-1.5 max-h-36 overflow-y-auto p-1">
                        {currentScenario.elements.map(el => (
                          <div
                            key={el.id}
                            onClick={() => setSelectedElementId(el.id)}
                            className={`px-2 py-1 rounded-lg border text-[10px] font-bold flex items-center gap-1.5 transition-all cursor-pointer ${
                              selectedElementId === el.id
                                ? 'bg-amber-100 border-amber-400 text-amber-950 shadow-xs'
                                : 'bg-slate-50 border-slate-200 text-slate-700 hover:bg-slate-100'
                            }`}
                          >
                            <span className="w-2 h-2 rounded-full" style={{ backgroundColor: el.color || '#FACC15' }} />
                            <span>{el.label || el.type}</span>
                            <button
                              type="button"
                              onClick={(e) => {
                                e.stopPropagation();
                                handleDeleteEquipment(el.id);
                              }}
                              className="text-slate-400 hover:text-red-600 ml-0.5"
                            >
                              ×
                            </button>
                          </div>
                        ))}
                      </div>
                    </div>

                  </div>
                )}

                {/* SUB-VIEW 2: DRILL PHASES / STEPS MANAGEMENT */}
                {editSubTab === 'steps' && (
                  <div className="space-y-3.5">
                    
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

                  </div>
                )}

                {/* SUB-VIEW 3: ASF PEDAGOGICAL VARIABLES */}
                {editSubTab === 'variables' && renderPedagogicalVariablesManager(true)}

                {/* Save button in edit mode */}
                {onSaveScenario && (
                  <button
                    type="button"
                    onClick={handleSaveScenario}
                    className="w-full py-2.5 bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl text-xs font-extrabold flex items-center justify-center gap-2 shadow-md transition-all cursor-pointer"
                  >
                    <Save className="w-4 h-4" />
                    <span>Enregistrer le déroulement & matériel pour la séance</span>
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

            {/* TAB 3: ASF Pedagogical Variables & Variants */}
            {activeTab === 'variants' && !isEditingFlow && (
              <div className="space-y-3 flex-1 overflow-y-auto pr-1">
                {renderPedagogicalVariablesManager(false)}
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
                    <div className="flex items-center justify-between p-2 bg-slate-50 rounded-lg">
                      <span className="text-slate-500 font-semibold">Matériel sur le terrain :</span>
                      <span className="font-bold text-emerald-700">{currentScenario.elements.length} éléments placés</span>
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
                      setSelectedElementId(null);
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
