import React, { useState, useEffect, useRef, useMemo } from 'react';
import { 
  Play, 
  Pause, 
  RotateCcw, 
  Maximize2, 
  Sparkles, 
  Layers,
  Flame,
  Video,
  Film,
  Download,
  Check,
  AlertCircle,
  RefreshCw,
  Smartphone,
  Monitor,
  Zap,
  Target,
  Users,
  BookOpen
} from 'lucide-react';
import { 
  DrillAnimationScenario, 
  buildScenarioFromExercise, 
  extractDrillSlotText
} from '../utils/drillAnimations';

interface InlineExerciseAnimationPlayerProps {
  partTitle: string;
  partDescription: string;
  partFocus?: string;
  slotName?: 'Dessin 1' | 'Dessin 2' | 'Complet';
  category?: string;
  drawingSvg?: string;
  customDrawingCaption?: string;
  coachName?: string;
  scenarioId?: string;
  hasMultiple?: boolean;
  drawing1Caption?: string;
  drawing2Caption?: string;
  drawing1Coach?: string;
  drawing2Coach?: string;
  onSelectSlot?: (slot: 'Dessin 1' | 'Dessin 2' | 'Complet') => void;
  onOpenFullscreen?: () => void;
  onAutoAlign?: () => void;
  compact?: boolean;
  className?: string;
}

export const InlineExerciseAnimationPlayer: React.FC<InlineExerciseAnimationPlayerProps> = ({
  partTitle,
  partDescription,
  partFocus = '',
  slotName = 'Complet',
  category = 'FE12',
  drawingSvg,
  customDrawingCaption,
  coachName,
  scenarioId,
  hasMultiple = false,
  drawing1Caption,
  drawing2Caption,
  drawing1Coach,
  drawing2Coach,
  onSelectSlot,
  onOpenFullscreen,
  onAutoAlign,
  compact = false,
  className = ''
}) => {
  // Active view tab: 2D Tactical Animation vs Veo 3 Video vs Workshop Text Breakdown
  const [activeTab, setActiveTab] = useState<'2d' | 'video' | 'steps'>('2d');

  // Build scenario based on the active workshop text and synchronized AI diagram SVG
  const currentScenario = useMemo<DrillAnimationScenario>(() => {
    return buildScenarioFromExercise(
      partTitle,
      partDescription,
      partFocus,
      slotName as ('Dessin 1' | 'Dessin 2' | 'Complet'),
      customDrawingCaption,
      drawingSvg,
      scenarioId
    );
  }, [partTitle, partDescription, partFocus, slotName, customDrawingCaption, drawingSvg, scenarioId]);

  // Extract clean text for the active slot
  const slotSpecificText = useMemo(() => {
    return extractDrillSlotText(partDescription, slotName);
  }, [partDescription, slotName]);

  // Animation player state
  const [activePhaseIndex, setActivePhaseIndex] = useState<number>(0);
  const [isPlaying, setIsPlaying] = useState<boolean>(true);
  const [speed, setSpeed] = useState<number>(1);
  const [progress, setProgress] = useState<number>(0); // 0 to 1
  const [showTrails, setShowTrails] = useState<boolean>(true);
  const [showBadges, setShowBadges] = useState<boolean>(true);

  // Veo 3 Video Generation State
  const [videoAspectRatio, setVideoAspectRatio] = useState<'16:9' | '9:16'>('16:9');
  const [isGeneratingVideo, setIsGeneratingVideo] = useState<boolean>(false);
  const [videoStatusMessage, setVideoStatusMessage] = useState<string>('');
  const [generatedVideoUrl, setGeneratedVideoUrl] = useState<string | null>(null);
  const [videoError, setVideoError] = useState<string | null>(null);
  const [customVideoPrompt, setCustomVideoPrompt] = useState<string>('');
  const [isEditingPrompt, setIsEditingPrompt] = useState<boolean>(false);

  const phases = currentScenario.phases;
  const currentPhase = phases[activePhaseIndex] || phases[0] || {
    id: 1,
    timeStart: 0,
    timeEnd: 1,
    title: 'Action en cours',
    subtitle: '',
    description: '',
    coachingAccents: [],
    actors: {},
    ball: { x: 400, y: 260 }
  };

  // Animation Loop using requestAnimationFrame
  const animFrameRef = useRef<number | null>(null);
  const lastTimeRef = useRef<number>(performance.now());
  const TOTAL_CYCLE_DURATION_MS = 10000;

  // Reset animation when scenario or slot changes
  useEffect(() => {
    setActivePhaseIndex(0);
    setProgress(0);
    setIsPlaying(true);
  }, [currentScenario.id, slotName, partTitle]);

  // Auto-compose default prompt for Veo 3 when workshop changes
  useEffect(() => {
    const workshopTitle = customDrawingCaption || currentScenario.name || partTitle;
    const cleanDesc = slotSpecificText.replace(/\n+/g, ' ').slice(0, 300);
    const prompt = `Realistic cinematic 4K broadcast footage of youth soccer players (under-12 FootEco, red and blue jerseys) on a lush green soccer training pitch performing ${workshopTitle}: ${cleanDesc || "crisp technical passing sequences, fast turns and decisive shots into the goal"}. Dynamic broadcast camera, coaches watching with whistles, sunny day.`;
    setCustomVideoPrompt(prompt);
  }, [customDrawingCaption, currentScenario.name, partTitle, slotSpecificText]);

  useEffect(() => {
    const animate = (now: number) => {
      if (isPlaying && activeTab === '2d') {
        const delta = now - lastTimeRef.current;
        lastTimeRef.current = now;

        setProgress(prev => {
          const increment = (delta / TOTAL_CYCLE_DURATION_MS) * speed;
          let next = prev + increment;
          if (next >= 1.0) {
            next = 0.0; // Loop
          }

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
  }, [isPlaying, speed, phases, activePhaseIndex, activeTab]);

  // Jump to specific phase
  const handleJumpToPhase = (index: number) => {
    const targetPhase = phases[index];
    if (targetPhase) {
      setActivePhaseIndex(index);
      setProgress(targetPhase.timeStart + 0.005);
    }
  };

  // Interpolation for actors
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

  // Interpolation for ball with 3D elevation
  const interpolatedBall = useMemo(() => {
    if (!currentPhase || !currentPhase.ball) {
      return { x: 400, y: 260, action: 'static', elevation: 0 };
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
    const parabolicApex = isAerial && dist > 60 ? Math.min(46, Math.max(20, dist * 0.16)) : (startH > 0 || endH > 0 ? 22 : 0);
    const elevation = Math.max(0, startH + (endH - startH) * t + 4 * parabolicApex * t * (1 - t));

    return {
      x: curBall.x + (nextBall.x - curBall.x) * easeT,
      y: curBall.y + (nextBall.y - curBall.y) * easeT,
      action: curBall.action || 'static',
      elevation
    };
  }, [currentPhase, phases, activePhaseIndex, progress]);

  // Generate realistic video with Veo 3 (veo-3.1-fast-generate-preview)
  const handleGenerateVeoVideo = async () => {
    setIsGeneratingVideo(true);
    setVideoError(null);
    setVideoStatusMessage('Initialisation de Veo 3 (veo-3.1-fast-generate-preview)...');

    try {
      // 1. Start generation operation
      const res = await fetch('/api/ai/generate-video', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          prompt: customVideoPrompt,
          aspectRatio: videoAspectRatio, // '16:9' or '9:16'
          workshopTitle: customDrawingCaption || currentScenario.name || partTitle,
          workshopDescription: slotSpecificText
        })
      });

      if (!res.ok) {
        const errJson = await res.json().catch(() => ({}));
        throw new Error(errJson.error || `Erreur serveur (${res.status})`);
      }

      const { operationName } = await res.json();
      if (!operationName) {
        throw new Error("Opération de génération vidéo introuvable");
      }

      setVideoStatusMessage('Génération de la vidéo par Veo 3 en cours (calcul des trajectoires & joueurs)...');

      // 2. Poll until completed
      const pollInterval = 3500;
      let attempts = 0;
      const maxAttempts = 60; // Up to ~3.5 minutes

      const pollStatus = async (): Promise<string> => {
        while (attempts < maxAttempts) {
          attempts++;
          await new Promise(r => setTimeout(r, pollInterval));

          if (attempts === 2) {
            setVideoStatusMessage('Synthèse des mouvements techniques FootEco et rendu de la caméra...');
          } else if (attempts === 5) {
            setVideoStatusMessage('Finalisation du rendu réaliste HD 720p...');
          }

          const statusRes = await fetch('/api/ai/video-status', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ operationName })
          });

          if (statusRes.ok) {
            const statusJson = await statusRes.json();
            if (statusJson.error) {
              throw new Error(statusJson.error);
            }
            if (statusJson.done) {
              return operationName;
            }
          }
        }
        throw new Error("Délai de génération vidéo dépassé");
      };

      const completedOp = await pollStatus();

      // 3. Download video blob
      setVideoStatusMessage('Téléchargement du fichier vidéo...');
      const downloadRes = await fetch('/api/ai/video-download', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ operationName: completedOp })
      });

      if (!downloadRes.ok) {
        throw new Error("Impossible de télécharger le fichier vidéo final");
      }

      const blob = await downloadRes.blob();
      const videoBlobUrl = URL.createObjectURL(blob);
      setGeneratedVideoUrl(videoBlobUrl);
      setIsGeneratingVideo(false);
      setVideoStatusMessage('');
    } catch (err: any) {
      console.error('Error generating Veo 3 video:', err);
      setVideoError(err.message || 'Échec de la génération vidéo Veo 3');
      setIsGeneratingVideo(false);
      setVideoStatusMessage('');
    }
  };

  const currentTimeSeconds = (progress * (TOTAL_CYCLE_DURATION_MS / 1000) / speed).toFixed(1);

  return (
    <div className={`flex flex-col bg-slate-900 border border-slate-700/80 rounded-2xl overflow-hidden shadow-xl text-white ${className}`}>
      
      {/* Top Header Toolbar with Sub-Tabs */}
      <div className="bg-gradient-to-r from-slate-950 via-slate-900 to-slate-950 border-b border-slate-800 px-3 py-2 flex flex-wrap items-center justify-between gap-2">
        {/* Left: Title & Mode Switcher */}
        <div className="flex items-center gap-1.5 flex-wrap">
          {/* Main Mode Toggle Buttons */}
          <div className="flex items-center gap-1 bg-slate-950/80 p-0.5 rounded-lg border border-slate-800">
            <button
              type="button"
              onClick={() => setActiveTab('2d')}
              className={`px-2 py-1 rounded-md text-[10.5px] font-extrabold flex items-center gap-1.5 transition-all cursor-pointer ${
                activeTab === '2d'
                  ? 'bg-red-700 text-white shadow-xs'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              <Zap className="w-3 h-3 text-amber-400" />
              <span>Animation 2D</span>
            </button>

            <button
              type="button"
              onClick={() => setActiveTab('video')}
              className={`px-2 py-1 rounded-md text-[10.5px] font-extrabold flex items-center gap-1.5 transition-all cursor-pointer ${
                activeTab === 'video'
                  ? 'bg-indigo-600 text-white shadow-xs'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              <Film className="w-3 h-3 text-indigo-300" />
              <span>Vidéo IA Veo 3</span>
              <span className="bg-amber-400 text-slate-950 text-[8px] font-black px-1 py-0.2 rounded uppercase">
                Veo 3.1
              </span>
            </button>

            <button
              type="button"
              onClick={() => setActiveTab('steps')}
              className={`px-2 py-1 rounded-md text-[10.5px] font-extrabold flex items-center gap-1.5 transition-all cursor-pointer ${
                activeTab === 'steps'
                  ? 'bg-slate-800 text-white shadow-xs'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              <BookOpen className="w-3 h-3 text-emerald-400" />
              <span>Consignes</span>
            </button>
          </div>
        </div>

        {/* Right Tools */}
        <div className="flex items-center gap-1.5 shrink-0">
          {/* Sync text button */}
          {onAutoAlign && (
            <button
              type="button"
              onClick={onAutoAlign}
              className="p-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-amber-300 text-[10px] font-bold transition-colors cursor-pointer flex items-center gap-1 border border-slate-700"
              title="Réaligner l'animation avec le texte de l'atelier"
            >
              <Sparkles className="w-3 h-3" />
              <span className="hidden sm:inline">Aligner</span>
            </button>
          )}

          {/* Fullscreen modal open */}
          {onOpenFullscreen && (
            <button
              type="button"
              onClick={onOpenFullscreen}
              className="px-2.5 py-1 rounded-lg bg-red-600 hover:bg-red-500 text-white text-[11px] font-extrabold transition-all cursor-pointer flex items-center gap-1.5 shadow-sm active:scale-95"
              title="Agrandir et ouvrir le studio d'animation interactif complet"
            >
              <Maximize2 className="w-3 h-3" />
              <span>Plein Écran</span>
            </button>
          )}
        </div>
      </div>

      {/* Workshop / Slot Direct Selector Bar (Atelier 1 vs Atelier 2 vs Match) */}
      {(hasMultiple || onSelectSlot) && (
        <div className="bg-slate-950/70 border-b border-slate-800/80 px-3 py-1.5 flex items-center justify-between gap-2 overflow-x-auto">
          <div className="flex items-center gap-1.5 flex-nowrap">
            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider shrink-0 flex items-center gap-1">
              <Target className="w-3 h-3 text-red-500" />
              <span>Atelier :</span>
            </span>

            {/* Atelier 1 Button */}
            <button
              type="button"
              onClick={() => onSelectSlot?.('Dessin 1')}
              className={`px-2 py-0.5 rounded-md text-[10.5px] font-bold transition-all cursor-pointer flex items-center gap-1 shrink-0 ${
                slotName === 'Dessin 1'
                  ? 'bg-red-600 text-white shadow-xs font-black'
                  : 'bg-slate-800/80 text-slate-300 hover:bg-slate-700'
              }`}
            >
              <span>🔴 Atelier 1</span>
              {drawing1Coach && (
                <span className="opacity-75 text-[9px] hidden sm:inline">({drawing1Coach})</span>
              )}
            </button>

            {/* Atelier 2 Button */}
            <button
              type="button"
              onClick={() => onSelectSlot?.('Dessin 2')}
              className={`px-2 py-0.5 rounded-md text-[10.5px] font-bold transition-all cursor-pointer flex items-center gap-1 shrink-0 ${
                slotName === 'Dessin 2'
                  ? 'bg-blue-600 text-white shadow-xs font-black'
                  : 'bg-slate-800/80 text-slate-300 hover:bg-slate-700'
              }`}
            >
              <span>🔵 Atelier 2</span>
              {drawing2Coach && (
                <span className="opacity-75 text-[9px] hidden sm:inline">({drawing2Coach})</span>
              )}
            </button>

            {/* Global / Complete view */}
            <button
              type="button"
              onClick={() => onSelectSlot?.('Complet')}
              className={`px-2 py-0.5 rounded-md text-[10.5px] font-bold transition-all cursor-pointer flex items-center gap-1 shrink-0 ${
                slotName === 'Complet'
                  ? 'bg-emerald-600 text-white shadow-xs font-black'
                  : 'bg-slate-800/80 text-slate-300 hover:bg-slate-700'
              }`}
            >
              <span>🏟️ Global</span>
            </button>
          </div>

          {/* Active Workshop Name Badge */}
          <div className="text-right truncate max-w-xs">
            <span className="text-[10px] font-bold text-amber-300 truncate block">
              {customDrawingCaption || currentScenario.name}
            </span>
          </div>
        </div>
      )}

      {/* VIEW 1: 2D Interactive Tactical Animation Player */}
      {activeTab === '2d' && (
        <div className="flex flex-col">
          {/* Interactive Pitch SVG */}
          <div className="relative w-full aspect-[16/10.2] bg-gradient-to-b from-[#156e35] to-[#125d2d] overflow-hidden select-none">
            <svg 
              viewBox="0 0 800 520" 
              className="w-full h-full cursor-default"
            >
              <defs>
                {/* Striping */}
                <pattern id="inline-grass-stripes" width="80" height="520" patternUnits="userSpaceOnUse">
                  <rect width="40" height="520" fill="rgba(255,255,255,0.03)" />
                  <rect x="40" width="40" height="520" fill="transparent" />
                </pattern>

                {/* Markers */}
                <marker id="inline-arrow-run" viewBox="0 0 10 10" refX="6" refY="5" markerWidth="5" markerHeight="5" orient="auto">
                  <path d="M 0 1 L 8 5 L 0 9 z" fill="#FACC15" />
                </marker>
                <marker id="inline-arrow-pass" viewBox="0 0 10 10" refX="6" refY="5" markerWidth="5" markerHeight="5" orient="auto">
                  <path d="M 0 1 L 8 5 L 0 9 z" fill="#FFFFFF" />
                </marker>
                <marker id="inline-arrow-shot" viewBox="0 0 10 10" refX="6" refY="5" markerWidth="6" markerHeight="6" orient="auto">
                  <path d="M 0 1 L 8 5 L 0 9 z" fill="#EF4444" />
                </marker>

                <filter id="inline-shadow" x="-20%" y="-20%" width="140%" height="140%">
                  <feDropShadow dx="1" dy="2.5" stdDeviation="2.5" floodOpacity="0.4" />
                </filter>
              </defs>

              {/* Turf */}
              <rect width="800" height="520" fill="url(#inline-grass-stripes)" />

              {/* Pitch Lines */}
              <g stroke="#FFFFFF" strokeWidth="2.2" strokeOpacity="0.55" fill="none">
                <rect x="30" y="30" width="740" height="460" rx="8" />
                <line x1="30" y1="260" x2="770" y2="260" />
                <circle cx="400" cy="260" r="65" />
                <circle cx="400" cy="260" r="3" fill="#FFFFFF" />

                {/* Top Box */}
                <rect x="250" y="30" width="300" height="120" />
                <rect x="320" y="30" width="160" height="45" />
                <path d="M 340 150 A 60 60 0 0 0 460 150" />
                <circle cx="400" cy="110" r="3" fill="#FFFFFF" />

                {/* Bottom Box */}
                <rect x="250" y="370" width="300" height="120" />
                <rect x="320" y="445" width="160" height="45" />
                <path d="M 340 370 A 60 60 0 0 1 460 370" />
                <circle cx="400" cy="410" r="3" fill="#FFFFFF" />

                {/* Corners */}
                <path d="M 30 50 A 20 20 0 0 0 50 30" />
                <path d="M 750 30 A 20 20 0 0 0 770 50" />
                <path d="M 30 470 A 20 20 0 0 1 50 490" />
                <path d="M 750 490 A 20 20 0 0 1 770 470" />
              </g>

              {/* Equipment */}
              {currentScenario.elements.map(el => {
                if (el.type === 'goal') {
                  return (
                    <g key={el.id} transform={`translate(${el.x - (el.width || 80)/2}, ${el.y - (el.height || 22)/2})`}>
                      <rect width={el.width || 80} height={el.height || 22} fill="rgba(255,255,255,0.35)" stroke="#FFFFFF" strokeWidth="2.5" rx="2" />
                      <line x1="0" y1="7" x2={el.width || 80} y2="7" stroke="#FFFFFF" strokeWidth="1" strokeDasharray="3,3" strokeOpacity="0.7" />
                      <line x1="0" y1="14" x2={el.width || 80} y2="14" stroke="#FFFFFF" strokeWidth="1" strokeDasharray="3,3" strokeOpacity="0.7" />
                    </g>
                  );
                }
                if (el.type === 'mini-goal') {
                  return (
                    <g key={el.id} transform={`translate(${el.x}, ${el.y}) rotate(${el.rotation || 0})`}>
                      <rect x={-(el.width || 36)/2} y={-(el.height || 18)/2} width={el.width || 36} height={el.height || 18} fill="rgba(250,204,21,0.35)" stroke={el.color || "#FACC15"} strokeWidth="2.2" rx="2" />
                      <line x1={-(el.width || 36)/2} y1="0" x2={(el.width || 36)/2} y2="0" stroke={el.color || "#FACC15"} strokeWidth="1" strokeDasharray="2,2" />
                      <text x="0" y="3" textAnchor="middle" fontSize="7.5" fontWeight="bold" fill={el.color || "#FACC15"}>BUT</text>
                    </g>
                  );
                }
                if (el.type === 'cone') {
                  const r = (el.width || 12)/2;
                  return (
                    <g key={el.id} transform={`translate(${el.x}, ${el.y})`}>
                      <ellipse cx="0" cy="1" rx={r} ry={r * 0.55} fill="rgba(0,0,0,0.3)" />
                      <polygon points={`0,${-r * 1.3} ${r * 0.85},${r * 0.45} ${-r * 0.85},${r * 0.45}`} fill={el.color || "#F97316"} stroke="#FFFFFF" strokeWidth="0.8" />
                    </g>
                  );
                }
                if (el.type === 'pole') {
                  return (
                    <g key={el.id} transform={`translate(${el.x}, ${el.y})`}>
                      <ellipse cx="0" cy="2" rx="5" ry="2.5" fill="rgba(0,0,0,0.4)" />
                      <line x1="0" y1="2" x2="0" y2="-16" stroke={el.color || "#FACC15"} strokeWidth="3" strokeLinecap="round" />
                      <circle cx="0" cy="-16" r="3" fill="#EF4444" />
                    </g>
                  );
                }
                if (el.type === 'ladder') {
                  const len = el.height || 70;
                  const w = el.width || 20;
                  return (
                    <g key={el.id} transform={`translate(${el.x - w/2}, ${el.y - len/2})`}>
                      <rect width={w} height={len} fill="rgba(250,204,21,0.15)" stroke="#FACC15" strokeWidth="1.5" rx="2" />
                      {[1,2,3,4,5].map(step => (
                        <line key={step} x1="0" y1={(len/6) * step} x2={w} y2={(len/6) * step} stroke="#FACC15" strokeWidth="1.5" />
                      ))}
                    </g>
                  );
                }
                if (el.type === 'hurdle') {
                  const hw = el.width || 32;
                  return (
                    <g key={el.id} transform={`translate(${el.x - hw/2}, ${el.y})`}>
                      <line x1="0" y1="0" x2={hw} y2="0" stroke="#EF4444" strokeWidth="3" strokeLinecap="round" />
                      <circle cx="0" cy="0" r="3" fill="#1E293B" />
                      <circle cx={hw} cy="0" r="3" fill="#1E293B" />
                    </g>
                  );
                }
                if (el.type === 'zone') {
                  return (
                    <g key={el.id} transform={`translate(${el.x - (el.width || 100)/2}, ${el.y - (el.height || 80)/2})`}>
                      <rect width={el.width || 100} height={el.height || 80} fill={el.color || "rgba(250, 204, 21, 0.12)"} stroke={el.color || "#FACC15"} strokeWidth="1.5" strokeDasharray="4,4" rx="4" />
                      {el.label && (
                        <text x={(el.width || 100)/2} y={(el.height || 80)/2 + 4} textAnchor="middle" fontSize="10" fontWeight="bold" fill="#FFFFFF" opacity="0.85">
                          {el.label}
                        </text>
                      )}
                    </g>
                  );
                }
                return null;
              })}

              {/* Movement Trails */}
              {showTrails && currentPhase.trails && currentPhase.trails.map((trail, tIdx) => {
                const isPass = trail.type === 'pass';
                const isShot = trail.type === 'shot';
                return (
                  <g key={tIdx}>
                    <line 
                      x1={trail.from[0]} 
                      y1={trail.from[1]} 
                      x2={trail.to[0]} 
                      y2={trail.to[1]} 
                      stroke={isShot ? '#EF4444' : isPass ? '#FFFFFF' : '#FACC15'} 
                      strokeWidth={isShot ? 2.5 : isPass ? 2.2 : 1.8} 
                      strokeDasharray={isPass ? '4,4' : undefined} 
                      markerEnd={`url(#inline-arrow-${trail.type})`} 
                      opacity="0.85" 
                    />
                    {trail.label && (
                      <text 
                        x={(trail.from[0] + trail.to[0]) / 2} 
                        y={(trail.from[1] + trail.to[1]) / 2 - 5} 
                        textAnchor="middle" 
                        fontSize="8.5" 
                        fontWeight="bold" 
                        fill="#FFFFFF" 
                        stroke="rgba(0,0,0,0.6)" 
                        strokeWidth="2" 
                        paintOrder="stroke"
                      >
                        {trail.label}
                      </text>
                    )}
                  </g>
                );
              })}

              {/* Animated Players */}
              {currentScenario.actors.map(actor => {
                const actorData = interpolatedActors[actor.id] || { x: 400, y: 260, action: 'idle', angle: 0, isMoving: false };
                const isGK = actor.role === 'goalkeeper';
                const action = actorData.action || 'idle';

                return (
                  <g 
                    key={actor.id} 
                    transform={`translate(${actorData.x}, ${actorData.y})`}
                    filter="url(#inline-shadow)"
                  >
                    {/* Movement Chevron */}
                    {actorData.isMoving && (
                      <g transform={`rotate(${actorData.angle})`}>
                        <polygon 
                          points="12,-3.5 17,0 12,3.5" 
                          fill={actor.color} 
                          stroke="#FFFFFF" 
                          strokeWidth="1"
                          opacity="0.9"
                        />
                      </g>
                    )}

                    {/* Dynamic Action Badges */}
                    {showBadges && (
                      <>
                        {action === 'shoot' && (
                          <g transform="translate(0, -24)" className="animate-pulse">
                            <rect x="-22" y="-7" width="44" height="14" rx="4" fill="#EF4444" stroke="#FFFFFF" strokeWidth="1" />
                            <text x="0" y="3" textAnchor="middle" fontSize="7.5" fontWeight="900" fill="#FFFFFF">⚽ Tir !</text>
                          </g>
                        )}
                        {action === 'pass' && (
                          <g transform="translate(0, -24)">
                            <rect x="-24" y="-7" width="48" height="14" rx="4" fill="#2563EB" stroke="#FFFFFF" strokeWidth="1" />
                            <text x="0" y="3" textAnchor="middle" fontSize="7.5" fontWeight="900" fill="#FFFFFF">👟 Passe</text>
                          </g>
                        )}
                        {action === 'defend' && (
                          <g transform="translate(0, -24)">
                            <rect x="-26" y="-7" width="52" height="14" rx="4" fill="#475569" stroke="#FFFFFF" strokeWidth="1" />
                            <text x="0" y="3" textAnchor="middle" fontSize="7.5" fontWeight="900" fill="#FFFFFF">🛡️ Cadrage</text>
                          </g>
                        )}
                        {action === 'run' && actorData.isMoving && (
                          <g transform="translate(0, -24)">
                            <rect x="-22" y="-7" width="44" height="14" rx="4" fill="#D97706" stroke="#FFFFFF" strokeWidth="1" />
                            <text x="0" y="3" textAnchor="middle" fontSize="7.5" fontWeight="900" fill="#FFFFFF">💨 Appel</text>
                          </g>
                        )}
                        {action === 'save' && (
                          <g transform="translate(0, -24)">
                            <rect x="-24" y="-7" width="48" height="14" rx="4" fill="#059669" stroke="#FFFFFF" strokeWidth="1" />
                            <text x="0" y="3" textAnchor="middle" fontSize="7.5" fontWeight="900" fill="#FFFFFF">🧤 Arrêt !</text>
                          </g>
                        )}
                      </>
                    )}

                    {/* Player Circle */}
                    <circle 
                      cx="0" 
                      cy="0" 
                      r={isGK ? 12 : 10.5} 
                      fill={actor.color} 
                      stroke="#FFFFFF" 
                      strokeWidth="2" 
                    />
                    <text 
                      x="0" 
                      y="3.5" 
                      textAnchor="middle" 
                      fontSize={isGK ? "8" : "9"} 
                      fontWeight="900" 
                      fill="#FFFFFF"
                    >
                      {actor.number || (isGK ? 'GB' : actor.name.charAt(0))}
                    </text>
                  </g>
                );
              })}

              {/* Animated 3D Ball */}
              {(() => {
                const ballPos = interpolatedBall;
                const elevation = ballPos.elevation || 0;
                const isAirborne = elevation > 5;

                return (
                  <g transform={`translate(${ballPos.x}, ${ballPos.y})`}>
                    {/* Shadow */}
                    <ellipse 
                      cx="1" 
                      cy="3" 
                      rx={5 + elevation * 0.1} 
                      ry={2.5 + elevation * 0.05} 
                      fill="rgba(0,0,0,0.5)" 
                      opacity={Math.max(0.12, 0.5 - elevation * 0.008)} 
                    />

                    {/* Drop line */}
                    {isAirborne && (
                      <line 
                        x1="0" 
                        y1="3" 
                        x2="0" 
                        y2={-elevation * 1.15} 
                        stroke="rgba(255,255,255,0.3)" 
                        strokeWidth="1" 
                        strokeDasharray="2,2" 
                      />
                    )}

                    {/* Ball */}
                    <g transform={`translate(0, ${-elevation * 1.15}) scale(${1 + elevation * 0.01})`}>
                      <circle cx="0" cy="0" r="6.8" fill="#FFFFFF" stroke="#0F172A" strokeWidth="1.5" />
                      <polygon points="0,-3.2 2.8,-1.1 1.8,2.2 -1.8,2.2 -2.8,-1.1" fill="#0F172A" />
                      <circle cx="-1.8" cy="-2.2" r="1.8" fill="#FFFFFF" opacity="0.6" />
                    </g>
                  </g>
                );
              })()}

              {/* Goal Cue Banner */}
              {currentPhase.visualCue && /BUT|GOAL|TIR/i.test(currentPhase.visualCue) && (
                <g transform="translate(400, 75)">
                  <rect 
                    x="-70" 
                    y="-15" 
                    width="140" 
                    height="30" 
                    rx="8" 
                    fill="rgba(16, 185, 129, 0.95)" 
                    stroke="#FFFFFF" 
                    strokeWidth="2" 
                    filter="url(#inline-shadow)"
                  />
                  <text 
                    x="0" 
                    y="4" 
                    textAnchor="middle" 
                    fontSize="12" 
                    fontWeight="900" 
                    fill="#FFFFFF"
                    letterSpacing="1"
                  >
                    {currentPhase.visualCue}
                  </text>
                </g>
              )}
            </svg>

            {/* Floating Active Phase Cue Badge matching workshop text */}
            {currentPhase.title && (
              <div className="absolute top-2 left-2 pointer-events-none">
                <div className="bg-slate-900/90 backdrop-blur-xs border border-slate-700/80 px-2.5 py-1.5 rounded-lg shadow-md text-left max-w-sm">
                  <span className="text-[10px] font-black text-amber-400 block leading-tight">
                    {currentPhase.title}
                  </span>
                  {currentPhase.subtitle && (
                    <span className="text-[9px] text-slate-300 font-semibold block truncate">
                      {currentPhase.subtitle}
                    </span>
                  )}
                  {currentPhase.description && (
                    <span className="text-[8.5px] text-slate-400 font-normal block line-clamp-1 mt-0.5">
                      {currentPhase.description}
                    </span>
                  )}
                </div>
              </div>
            )}
          </div>

          {/* Phase Scrubber & Timeline Bar */}
          <div className="bg-slate-950/90 px-3 pt-2 pb-1.5 border-t border-slate-800">
            <div className="relative flex items-center mb-1.5">
              <input 
                type="range" 
                min="0" 
                max="1" 
                step="0.001" 
                value={progress} 
                onChange={(e) => {
                  const val = parseFloat(e.target.value);
                  setProgress(val);
                  const idx = phases.findIndex(p => val >= p.timeStart && val < p.timeEnd);
                  if (idx !== -1) setActivePhaseIndex(idx);
                }} 
                className="w-full h-1.5 bg-slate-800 rounded-lg appearance-none cursor-pointer accent-red-500" 
              />
            </div>

            {/* Phase Jump Buttons */}
            <div className="grid grid-cols-3 gap-1 mb-2">
              {phases.slice(0, 3).map((phase, pIdx) => {
                const isActive = activePhaseIndex === pIdx;
                return (
                  <button
                    key={phase.id || pIdx}
                    type="button"
                    onClick={() => handleJumpToPhase(pIdx)}
                    className={`py-1 px-1.5 rounded-lg text-[10px] font-bold transition-all text-left truncate cursor-pointer flex items-center gap-1 ${
                      isActive 
                        ? 'bg-red-700 text-white shadow-xs border border-red-500' 
                        : 'bg-slate-900/80 text-slate-400 hover:text-slate-200 hover:bg-slate-800 border border-slate-800'
                    }`}
                    title={`${phase.title} : ${phase.description || phase.subtitle}`}
                  >
                    <span className="w-3.5 h-3.5 rounded-full bg-black/30 flex items-center justify-center text-[9px] shrink-0">
                      {pIdx + 1}
                    </span>
                    <span className="truncate">{phase.title.replace(/^\d+\.\s*/, '')}</span>
                  </button>
                );
              })}
            </div>

            {/* Playback Controls Bar */}
            <div className="flex items-center justify-between gap-2 text-xs py-1">
              <div className="flex items-center gap-1.5">
                <button
                  type="button"
                  onClick={() => setIsPlaying(!isPlaying)}
                  className="p-1.5 rounded-lg bg-red-600 hover:bg-red-500 text-white font-black cursor-pointer transition-colors shadow-xs"
                  title={isPlaying ? 'Pause' : 'Lecture'}
                >
                  {isPlaying ? <Pause className="w-3.5 h-3.5 fill-white" /> : <Play className="w-3.5 h-3.5 fill-white" />}
                </button>

                <button
                  type="button"
                  onClick={() => handleJumpToPhase(0)}
                  className="p-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white cursor-pointer transition-colors"
                  title="Recommencer l'animation"
                >
                  <RotateCcw className="w-3.5 h-3.5" />
                </button>

                <span className="text-[11px] font-mono text-slate-400 ml-1">
                  {currentTimeSeconds}s / 10s
                </span>
              </div>

              {/* View options & Speed */}
              <div className="flex items-center gap-1.5">
                {/* Trails */}
                <button
                  type="button"
                  onClick={() => setShowTrails(!showTrails)}
                  className={`p-1 rounded-md text-[10px] font-bold transition-colors cursor-pointer flex items-center gap-1 ${
                    showTrails ? 'bg-amber-500/20 text-amber-300' : 'bg-slate-800 text-slate-400'
                  }`}
                  title="Tracés de passes"
                >
                  <Layers className="w-3 h-3" />
                </button>

                {/* Badges */}
                <button
                  type="button"
                  onClick={() => setShowBadges(!showBadges)}
                  className={`p-1 rounded-md text-[10px] font-bold transition-colors cursor-pointer flex items-center gap-1 ${
                    showBadges ? 'bg-blue-500/20 text-blue-300' : 'bg-slate-800 text-slate-400'
                  }`}
                  title="Badges d'actions"
                >
                  <Flame className="w-3 h-3" />
                </button>

                {/* Speed selector */}
                <div className="flex items-center gap-0.5 bg-slate-900 border border-slate-800 rounded-md p-0.5">
                  {[0.5, 1, 1.5].map((s) => (
                    <button
                      key={s}
                      type="button"
                      onClick={() => setSpeed(s)}
                      className={`px-1.5 py-0.5 rounded text-[9.5px] font-bold cursor-pointer transition-colors ${
                        speed === s ? 'bg-red-700 text-white' : 'text-slate-400 hover:text-slate-200'
                      }`}
                    >
                      {s}x
                    </button>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* VIEW 2: Realistic AI Video Generator via Veo 3 (veo-3.1-fast-generate-preview) */}
      {activeTab === 'video' && (
        <div className="p-3 sm:p-4 space-y-3 bg-slate-900 text-slate-200 min-h-[380px] flex flex-col justify-between">
          <div className="space-y-3">
            {/* Header info */}
            <div className="flex items-center justify-between border-b border-slate-800 pb-2.5">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-lg bg-indigo-600/30 border border-indigo-500/40 flex items-center justify-center text-indigo-400">
                  <Film className="w-4 h-4" />
                </div>
                <div>
                  <h4 className="text-xs font-black text-white flex items-center gap-1.5">
                    <span>Génération Vidéo Réaliste IA</span>
                    <span className="text-[9px] font-extrabold bg-indigo-500/20 text-indigo-300 border border-indigo-500/30 px-1.5 py-0.2 rounded-full">
                      Veo 3.1 Fast
                    </span>
                  </h4>
                  <p className="text-[10px] text-slate-400">
                    Modèle officiel <span className="font-mono text-indigo-300">veo-3.1-fast-generate-preview</span> pour ateliers de foot
                  </p>
                </div>
              </div>

              {/* Aspect Ratio Selector (16:9 vs 9:16) */}
              <div className="flex items-center gap-1 bg-slate-950 p-1 rounded-lg border border-slate-800">
                <button
                  type="button"
                  onClick={() => setVideoAspectRatio('16:9')}
                  className={`px-2 py-1 rounded text-[10px] font-bold flex items-center gap-1 transition-all cursor-pointer ${
                    videoAspectRatio === '16:9'
                      ? 'bg-indigo-600 text-white shadow-2xs'
                      : 'text-slate-400 hover:text-white'
                  }`}
                  title="Format Paysage 16:9 (TV, PC, Tableau tactique)"
                >
                  <Monitor className="w-3 h-3" />
                  <span>16:9 Paysage</span>
                </button>
                <button
                  type="button"
                  onClick={() => setVideoAspectRatio('9:16')}
                  className={`px-2 py-1 rounded text-[10px] font-bold flex items-center gap-1 transition-all cursor-pointer ${
                    videoAspectRatio === '9:16'
                      ? 'bg-indigo-600 text-white shadow-2xs'
                      : 'text-slate-400 hover:text-white'
                  }`}
                  title="Format Portrait 9:16 (Mobile, TikTok/Reels, Coaching vestiaire)"
                >
                  <Smartphone className="w-3 h-3" />
                  <span>9:16 Portrait</span>
                </button>
              </div>
            </div>

            {/* Generated Video Player or Generator Box */}
            {generatedVideoUrl ? (
              <div className="space-y-2">
                <div className={`relative mx-auto rounded-xl overflow-hidden border border-slate-700 bg-black shadow-lg ${
                  videoAspectRatio === '9:16' ? 'max-w-[240px] aspect-[9/16]' : 'w-full aspect-[16/9]'
                }`}>
                  <video 
                    src={generatedVideoUrl} 
                    controls 
                    autoPlay 
                    loop 
                    playsInline 
                    className="w-full h-full object-cover"
                  />
                  <div className="absolute top-2 right-2 bg-black/70 backdrop-blur-xs px-2 py-0.5 rounded text-[9px] font-mono text-white border border-white/20">
                    {videoAspectRatio}
                  </div>
                </div>

                <div className="flex items-center justify-between gap-2 pt-1">
                  <span className="text-[10.5px] text-emerald-400 font-bold flex items-center gap-1">
                    <Check className="w-3.5 h-3.5" />
                    <span>Vidéo générée avec succès par Veo 3</span>
                  </span>

                  <div className="flex items-center gap-1.5">
                    <a
                      href={generatedVideoUrl}
                      download={`atelier-footeco-veo3-${Date.now()}.mp4`}
                      className="px-2.5 py-1 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white text-[11px] font-bold flex items-center gap-1 transition-colors cursor-pointer"
                    >
                      <Download className="w-3 h-3" />
                      <span>Télécharger MP4</span>
                    </a>

                    <button
                      type="button"
                      onClick={() => setGeneratedVideoUrl(null)}
                      className="px-2.5 py-1 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 text-[11px] font-bold transition-colors cursor-pointer"
                    >
                      Nouvelle vidéo
                    </button>
                  </div>
                </div>
              </div>
            ) : (
              <div className="space-y-2.5">
                {/* Prompt Card */}
                <div className="bg-slate-950/90 rounded-xl p-3 border border-slate-800 space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="text-[10px] font-black text-slate-300 uppercase tracking-wider flex items-center gap-1">
                      <Sparkles className="w-3 h-3 text-indigo-400" />
                      <span>Description de la scène transmise à Veo 3 :</span>
                    </span>
                    <button
                      type="button"
                      onClick={() => setIsEditingPrompt(!isEditingPrompt)}
                      className="text-[10px] text-indigo-400 hover:text-indigo-300 font-bold underline cursor-pointer"
                    >
                      {isEditingPrompt ? 'Valider' : 'Personnaliser le prompt'}
                    </button>
                  </div>

                  {isEditingPrompt ? (
                    <textarea
                      value={customVideoPrompt}
                      onChange={(e) => setCustomVideoPrompt(e.target.value)}
                      rows={3}
                      className="w-full bg-slate-900 border border-slate-700 rounded-lg p-2 text-xs text-white focus:outline-none focus:border-indigo-500"
                    />
                  ) : (
                    <p className="text-xs text-slate-300 italic bg-slate-900/60 p-2.5 rounded-lg border border-slate-800/80 leading-relaxed">
                      "{customVideoPrompt}"
                    </p>
                  )}

                  <div className="flex items-center gap-2 text-[10px] text-slate-400">
                    <span className="font-semibold text-slate-300">Atelier cible :</span>
                    <span className="bg-slate-800 px-1.5 py-0.5 rounded text-slate-200 font-medium">
                      {customDrawingCaption || currentScenario.name}
                    </span>
                    <span>• Ratio :</span>
                    <span className="font-mono text-indigo-300 font-bold">{videoAspectRatio}</span>
                  </div>
                </div>

                {/* Error Banner */}
                {videoError && (
                  <div className="p-2.5 bg-red-900/40 border border-red-700/60 rounded-xl flex items-center gap-2 text-red-200 text-xs">
                    <AlertCircle className="w-4 h-4 text-red-400 shrink-0" />
                    <span>{videoError}</span>
                  </div>
                )}

                {/* Loading Banner */}
                {isGeneratingVideo && (
                  <div className="bg-indigo-950/60 border border-indigo-800/60 rounded-xl p-3.5 space-y-2 text-center">
                    <div className="flex items-center justify-center gap-2 text-indigo-300 font-bold text-xs">
                      <RefreshCw className="w-4 h-4 animate-spin text-indigo-400" />
                      <span>{videoStatusMessage || 'Génération de la vidéo en cours avec Veo 3...'}</span>
                    </div>
                    <div className="w-full bg-slate-800 h-1.5 rounded-full overflow-hidden">
                      <div className="bg-indigo-500 h-full w-2/3 animate-pulse rounded-full" />
                    </div>
                    <p className="text-[10px] text-indigo-300/80">
                      Veuillez patienter quelques instants, le modèle assemble le mouvement des joueurs et les trajectoires de balle.
                    </p>
                  </div>
                )}
              </div>
            )}
          </div>

          {/* Action Footer */}
          {!generatedVideoUrl && (
            <div className="pt-2 border-t border-slate-800/80 flex items-center justify-between gap-2">
              <span className="text-[10px] text-slate-400 hidden sm:inline">
                Rendu cinématique avec joueurs en mouvement, balles et matériel d'entraînement
              </span>
              <button
                type="button"
                onClick={handleGenerateVeoVideo}
                disabled={isGeneratingVideo}
                className={`ml-auto px-4 py-2 rounded-xl text-xs font-black flex items-center gap-2 transition-all cursor-pointer shadow-md ${
                  isGeneratingVideo
                    ? 'bg-slate-800 text-slate-500 cursor-not-allowed'
                    : 'bg-gradient-to-r from-indigo-600 to-indigo-700 hover:from-indigo-500 hover:to-indigo-600 text-white active:scale-95'
                }`}
              >
                {isGeneratingVideo ? (
                  <>
                    <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                    <span>Génération Veo 3 en cours...</span>
                  </>
                ) : (
                  <>
                    <Video className="w-3.5 h-3.5 text-indigo-200" />
                    <span>Lancer la génération Veo 3 ({videoAspectRatio})</span>
                  </>
                )}
              </button>
            </div>
          )}
        </div>
      )}

      {/* VIEW 3: Workshop Steps and Detailed Coaching Text Breakdown */}
      {activeTab === 'steps' && (
        <div className="p-3 sm:p-4 space-y-3 bg-slate-900 text-slate-200 min-h-[380px] overflow-y-auto max-h-[460px]">
          {/* Header */}
          <div className="border-b border-slate-800 pb-2">
            <div className="flex items-center justify-between">
              <h4 className="text-xs font-black text-white flex items-center gap-1.5">
                <BookOpen className="w-3.5 h-3.5 text-emerald-400" />
                <span>Déroulement & Étapes de l'Atelier</span>
              </h4>
              <span className="text-[10px] bg-slate-800 text-slate-300 px-2 py-0.5 rounded font-bold">
                {slotName}
              </span>
            </div>
            <p className="text-[11px] text-amber-300 font-bold mt-0.5">
              {customDrawingCaption || currentScenario.name}
            </p>
          </div>

          {/* Sequential Phases from Workshop Text */}
          <div className="space-y-2">
            <span className="text-[10px] font-black text-slate-400 uppercase tracking-wider">
              Phases d'animation synchronisées ({phases.length}) :
            </span>
            <div className="space-y-1.5">
              {phases.map((ph, idx) => (
                <div 
                  key={ph.id || idx}
                  className={`p-2.5 rounded-xl border transition-all ${
                    activePhaseIndex === idx
                      ? 'bg-red-950/40 border-red-600/70 text-white'
                      : 'bg-slate-950/60 border-slate-800/80 text-slate-300'
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <span className="text-[11px] font-black text-amber-400 flex items-center gap-1.5">
                      <span className="w-4 h-4 rounded-full bg-slate-800 flex items-center justify-center text-[9px] text-white">
                        {idx + 1}
                      </span>
                      <span>{ph.title}</span>
                    </span>
                    {ph.subtitle && (
                      <span className="text-[9.5px] font-bold text-slate-400">
                        {ph.subtitle}
                      </span>
                    )}
                  </div>
                  {ph.description && (
                    <p className="text-[11px] text-slate-300 mt-1 leading-relaxed pl-5 font-medium">
                      {ph.description}
                    </p>
                  )}
                  {ph.coachingAccents && ph.coachingAccents.length > 0 && (
                    <div className="mt-1.5 pl-5 flex flex-wrap gap-1">
                      {ph.coachingAccents.map((tip, tIdx) => (
                        <span key={tIdx} className="text-[9px] bg-slate-800/90 text-amber-300 border border-slate-700/80 px-1.5 py-0.5 rounded">
                          🗣️ {tip}
                        </span>
                      ))}
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>

          {/* Complete Raw Workshop Text */}
          <div className="pt-2 border-t border-slate-800 space-y-1.5">
            <span className="text-[10px] font-black text-slate-400 uppercase tracking-wider">
              Texte intégral de l'atelier :
            </span>
            <div className="p-2.5 bg-slate-950/80 rounded-xl border border-slate-800/80 text-[11px] text-slate-300 whitespace-pre-line leading-relaxed font-sans">
              {slotSpecificText || partDescription}
            </div>
          </div>
        </div>
      )}

    </div>
  );
};
