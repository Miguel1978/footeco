import React, { useState, useEffect, useRef, useMemo } from 'react';
import { 
  X, 
  Play, 
  Pause, 
  RotateCcw, 
  ChevronLeft, 
  ChevronRight, 
  Sparkles, 
  Volume2, 
  VolumeX, 
  Layers, 
  BookOpen, 
  Award, 
  Info, 
  Clock, 
  CheckCircle2, 
  Maximize2,
  Sliders,
  Zap,
  Flag,
  Target,
  ArrowRight
} from 'lucide-react';
import { 
  DrillAnimationScenario, 
  ALL_ANIMATION_SCENARIOS, 
  detectBestAnimationScenario,
  ActorKeyframe,
  BallKeyframe
} from '../utils/drillAnimations';
import { TrainingExercisePart, TrainingSession } from '../types';

interface ExerciseAnimationModalProps {
  isOpen: boolean;
  onClose: () => void;
  partTitle?: string;
  partDescription?: string;
  partFocus?: string;
  slotName?: 'Dessin 1' | 'Dessin 2' | 'Complet';
  category?: string;
  session?: TrainingSession;
}

export const ExerciseAnimationModal: React.FC<ExerciseAnimationModalProps> = ({
  isOpen,
  onClose,
  partTitle = 'Atelier FootEco',
  partDescription = '',
  partFocus = '',
  slotName,
  category = 'FE12',
  session
}) => {
  // Determine initial scenario based on text
  const initialScenario = useMemo(() => {
    return detectBestAnimationScenario(partTitle, partDescription, partFocus);
  }, [partTitle, partDescription, partFocus]);

  const [currentScenario, setCurrentScenario] = useState<DrillAnimationScenario>(initialScenario);
  const [activePhaseIndex, setActivePhaseIndex] = useState<number>(0);
  const [isPlaying, setIsPlaying] = useState<boolean>(true);
  const [speed, setSpeed] = useState<number>(1);
  const [progress, setProgress] = useState<number>(0); // 0 to 1
  const [showTrails, setShowTrails] = useState<boolean>(true);
  const [activeTab, setActiveTab] = useState<'explanation' | 'coaching' | 'variants' | 'setup'>('explanation');

  // Update scenario if incoming props change significantly
  useEffect(() => {
    setCurrentScenario(initialScenario);
    setActivePhaseIndex(0);
    setProgress(0);
    setIsPlaying(true);
  }, [initialScenario]);

  const phases = currentScenario.phases;
  const currentPhase = phases[activePhaseIndex] || phases[0];

  // Animation Loop using requestAnimationFrame
  const animFrameRef = useRef<number | null>(null);
  const lastTimeRef = useRef<number>(performance.now());
  const TOTAL_CYCLE_DURATION_MS = 10000; // 10 seconds for a full drill sequence

  useEffect(() => {
    if (!isOpen) return;

    const animate = (now: number) => {
      if (isPlaying) {
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
  }, [isOpen, isPlaying, speed, phases, activePhaseIndex]);

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

    // Next phase for smooth transition or current phase fallback
    const nextPhase = phases[(activePhaseIndex + 1) % phases.length] || currentPhase;

    const result: Record<string, { x: number; y: number; action: string }> = {};

    currentScenario.actors.forEach(actor => {
      const currentPos = currentPhase.actors[actor.id] || { x: 400, y: 260, action: 'idle' };
      const nextPos = nextPhase.actors[actor.id] || currentPos;

      // Eased interpolation
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

  // Interpolated Ball position
  const interpolatedBall = useMemo(() => {
    if (!currentPhase) return { x: 400, y: 260 };

    const phaseDuration = currentPhase.timeEnd - currentPhase.timeStart;
    const phaseProgress = phaseDuration > 0 
      ? Math.max(0, Math.min(1, (progress - currentPhase.timeStart) / phaseDuration))
      : 0;

    const nextPhase = phases[(activePhaseIndex + 1) % phases.length] || currentPhase;
    const curBall = currentPhase.ball || { x: 400, y: 260 };
    const nxtBall = nextPhase.ball || curBall;

    const t = phaseProgress;
    const easeT = t < 0.5 ? 2 * t * t : -1 + (4 - 2 * t) * t;

    return {
      x: curBall.x + (nxtBall.x - curBall.x) * easeT,
      y: curBall.y + (nxtBall.y - curBall.y) * easeT,
      action: curBall.action || 'static'
    };
  }, [currentPhase, phases, activePhaseIndex, progress]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[100] bg-slate-950/80 backdrop-blur-md flex items-center justify-center p-3 sm:p-6 overflow-hidden animate-in fade-in duration-200">
      <div className="bg-white rounded-3xl shadow-2xl border border-slate-200 flex flex-col w-full max-w-6xl max-h-[95vh] overflow-hidden">
        
        {/* Header Bar */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-200 bg-slate-900 text-white">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-gradient-to-tr from-red-600 to-amber-500 flex items-center justify-center text-white shadow-md">
              <Play className="w-5 h-5 fill-white ml-0.5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-base font-extrabold text-white">
                  Animation Tactique & Explication Détaillée
                </h2>
                <span className="bg-red-600/90 text-white text-[10px] font-black uppercase tracking-wider px-2 py-0.5 rounded-full">
                  FootEco {category}
                </span>
              </div>
              <p className="text-xs text-slate-300 line-clamp-1">
                {partTitle} {slotName ? `(${slotName})` : ''} — {currentScenario.name}
              </p>
            </div>
          </div>

          {/* Scenario quick selector & Close */}
          <div className="flex items-center gap-3">
            <div className="hidden md:flex items-center gap-1.5 bg-slate-800 p-1 rounded-xl border border-slate-700">
              <span className="text-[11px] font-bold text-slate-400 px-2">Modèle :</span>
              {ALL_ANIMATION_SCENARIOS.map(sc => (
                <button
                  key={sc.id}
                  onClick={() => {
                    setCurrentScenario(sc);
                    setActivePhaseIndex(0);
                    setProgress(0);
                  }}
                  className={`text-[11px] font-bold px-2.5 py-1 rounded-lg transition-all ${
                    currentScenario.id === sc.id
                      ? 'bg-red-600 text-white shadow-sm'
                      : 'text-slate-300 hover:text-white hover:bg-slate-700'
                  }`}
                >
                  {sc.name.split(':')[0]}
                </button>
              ))}
            </div>

            <button
              onClick={onClose}
              className="p-2 text-slate-400 hover:text-white hover:bg-slate-800 rounded-xl transition-colors"
              title="Fermer"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Main Content Area: Split View (Animation Canvas left, Detailed Explanation right) */}
        <div className="flex-1 overflow-y-auto lg:overflow-hidden grid grid-cols-1 lg:grid-cols-12 gap-0">
          
          {/* LEFT: Animated Pitch Stage (7 cols) */}
          <div className="lg:col-span-7 bg-slate-950 p-4 sm:p-6 flex flex-col justify-between border-b lg:border-b-0 lg:border-r border-slate-800">
            
            {/* Top Toolbar on Pitch */}
            <div className="flex items-center justify-between mb-3 text-xs">
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

              {/* Trails toggle & speed */}
              <div className="flex items-center gap-2">
                <button
                  onClick={() => setShowTrails(!showTrails)}
                  className={`text-[10px] font-bold px-2 py-1 rounded-lg border transition-all ${
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
                      onClick={() => setSpeed(s)}
                      className={`px-1.5 py-0.5 rounded ${speed === s ? 'bg-red-600 text-white' : 'hover:text-white'}`}
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
                viewBox="0 0 800 520" 
                className="w-full h-full"
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

                {/* Tactical Pitch Lines (White 2px, opacity 0.5) */}
                <g stroke="#FFFFFF" strokeWidth="2.5" strokeOpacity="0.5" fill="none">
                  {/* Outer boundary with padding */}
                  <rect x="30" y="30" width="740" height="460" rx="8" />

                  {/* Halfway line */}
                  <line x1="30" y1="260" x2="770" y2="260" />

                  {/* Center circle */}
                  <circle cx="400" cy="260" r="65" />
                  <circle cx="400" cy="260" r="3" fill="#FFFFFF" />

                  {/* Top Goal Box (Penalty area) */}
                  <rect x="250" y="30" width="300" height="120" />
                  <rect x="320" y="30" width="160" height="45" />
                  {/* Penalty arc top */}
                  <path d="M 340 150 A 60 60 0 0 0 460 150" />
                  <circle cx="400" cy="110" r="3" fill="#FFFFFF" />

                  {/* Bottom Goal Box */}
                  <rect x="250" y="370" width="300" height="120" />
                  <rect x="320" y="445" width="160" height="45" />
                  {/* Penalty arc bottom */}
                  <path d="M 340 370 A 60 60 0 0 1 460 370" />
                  <circle cx="400" cy="410" r="3" fill="#FFFFFF" />

                  {/* Corner Arcs */}
                  <path d="M 30 50 A 20 20 0 0 0 50 30" />
                  <path d="M 750 30 A 20 20 0 0 0 770 50" />
                  <path d="M 30 470 A 20 20 0 0 1 50 490" />
                  <path d="M 750 490 A 20 20 0 0 1 770 470" />
                </g>

                {/* Static Pitch Elements (Goals, Mini-Goals, Cones, Poles) */}
                {currentScenario.elements.map(el => {
                  if (el.type === 'goal') {
                    return (
                      <g key={el.id} transform={`translate(${el.x - (el.width || 80)/2}, ${el.y - (el.height || 20)/2})`}>
                        {/* Goal Frame */}
                        <rect 
                          width={el.width || 80} 
                          height={el.height || 22} 
                          fill="rgba(255,255,255,0.25)" 
                          stroke="#FFFFFF" 
                          strokeWidth="3" 
                          rx="2"
                        />
                        {/* Net Pattern */}
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
                        <text 
                          x="0" 
                          y="3" 
                          textAnchor="middle" 
                          fontSize="8" 
                          fontWeight="bold" 
                          fill="#FACC15"
                        >
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

                {/* Visual Trajectory Trails (if active) */}
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

                {/* Animated Players */}
                {currentScenario.actors.map(actor => {
                  const pos = interpolatedActors[actor.id] || { x: 400, y: 260, action: 'idle' };
                  const isGK = actor.role === 'goalkeeper';
                  const isCoach = actor.role === 'coach';
                  const radius = isCoach ? 16 : isGK ? 15 : 14;

                  return (
                    <g 
                      key={actor.id} 
                      transform={`translate(${pos.x}, ${pos.y})`}
                      filter="url(#shadow)"
                      className="transition-transform duration-75"
                    >
                      {/* Player Circle */}
                      <circle 
                        cx="0" 
                        cy="0" 
                        r={radius} 
                        fill={actor.color} 
                        stroke="#FFFFFF" 
                        strokeWidth="2.5" 
                      />

                      {/* Jersey Number or Initial */}
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

                      {/* Small name label underneath */}
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

                {/* Animated Ball (⚽) */}
                <g 
                  transform={`translate(${interpolatedBall.x}, ${interpolatedBall.y})`}
                  filter="url(#shadow)"
                  className="transition-transform duration-75"
                >
                  {/* Ball shadow */}
                  <ellipse cx="1" cy="4" rx="6" ry="3" fill="rgba(0,0,0,0.4)" />
                  {/* Ball sphere */}
                  <circle cx="0" cy="0" r="7" fill="#FFFFFF" stroke="#1E293B" strokeWidth="1.5" />
                  {/* Ball pentagon pattern */}
                  <polygon points="0,-3 3,-1 2,2 -2,2 -3,-1" fill="#1E293B" />
                </g>

              </svg>
            </div>

            {/* Bottom Playback Controls */}
            <div className="mt-4 pt-3 border-t border-slate-800 flex flex-col gap-3">
              
              {/* Progress Scrub Bar */}
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
                  {/* Phase markers */}
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

              {/* Button Controls Row */}
              <div className="flex items-center justify-between">
                
                <div className="flex items-center gap-2">
                  <button
                    onClick={handlePrevPhase}
                    className="p-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-white transition-colors"
                    title="Étape précédente"
                  >
                    <ChevronLeft className="w-4 h-4" />
                  </button>

                  <button
                    onClick={() => setIsPlaying(!isPlaying)}
                    className="px-4 py-2 rounded-xl bg-gradient-to-r from-red-600 to-amber-600 hover:from-red-500 hover:to-amber-500 text-white font-extrabold text-xs flex items-center gap-1.5 shadow-md active:scale-95 transition-all"
                  >
                    {isPlaying ? (
                      <>
                        <Pause className="w-4 h-4 fill-white" />
                        <span>Pause</span>
                      </>
                    ) : (
                      <>
                        <Play className="w-4 h-4 fill-white" />
                        <span>Lecture</span>
                      </>
                    )}
                  </button>

                  <button
                    onClick={handleNextPhase}
                    className="p-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-white transition-colors"
                    title="Étape suivante"
                  >
                    <ChevronRight className="w-4 h-4" />
                  </button>

                  <button
                    onClick={handleRestart}
                    className="p-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white transition-colors"
                    title="Recommencer"
                  >
                    <RotateCcw className="w-4 h-4" />
                  </button>
                </div>

                {/* Phase Pills Navigation */}
                <div className="flex items-center gap-1">
                  {phases.map((ph, idx) => (
                    <button
                      key={ph.id}
                      onClick={() => handleJumpToPhase(idx)}
                      className={`text-[11px] font-extrabold px-2.5 py-1 rounded-lg transition-all ${
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

          {/* RIGHT: Detailed Explanation & Coaching Points (5 cols) */}
          <div className="lg:col-span-5 bg-slate-50 flex flex-col justify-between overflow-y-auto p-4 sm:p-6 space-y-4">
            
            {/* Tab Navigation for Explanation View */}
            <div className="flex border-b border-slate-200 gap-2 pb-2 text-xs font-bold">
              <button
                onClick={() => setActiveTab('explanation')}
                className={`pb-2 px-1 border-b-2 flex items-center gap-1.5 transition-colors ${
                  activeTab === 'explanation'
                    ? 'border-red-600 text-red-600 font-extrabold'
                    : 'border-transparent text-slate-500 hover:text-slate-800'
                }`}
              >
                <BookOpen className="w-3.5 h-3.5" />
                <span>Déroulement & Étapes</span>
              </button>
              <button
                onClick={() => setActiveTab('coaching')}
                className={`pb-2 px-1 border-b-2 flex items-center gap-1.5 transition-colors ${
                  activeTab === 'coaching'
                    ? 'border-red-600 text-red-600 font-extrabold'
                    : 'border-transparent text-slate-500 hover:text-slate-800'
                }`}
              >
                <Award className="w-3.5 h-3.5" />
                <span>Accents ASF</span>
              </button>
              <button
                onClick={() => setActiveTab('variants')}
                className={`pb-2 px-1 border-b-2 flex items-center gap-1.5 transition-colors ${
                  activeTab === 'variants'
                    ? 'border-red-600 text-red-600 font-extrabold'
                    : 'border-transparent text-slate-500 hover:text-slate-800'
                }`}
              >
                <Sliders className="w-3.5 h-3.5" />
                <span>Variantes</span>
              </button>
              <button
                onClick={() => setActiveTab('setup')}
                className={`pb-2 px-1 border-b-2 flex items-center gap-1.5 transition-colors ${
                  activeTab === 'setup'
                    ? 'border-red-600 text-red-600 font-extrabold'
                    : 'border-transparent text-slate-500 hover:text-slate-800'
                }`}
              >
                <Info className="w-3.5 h-3.5" />
                <span>Organisation</span>
              </button>
            </div>

            {/* TAB 1: Step-by-Step Explanation */}
            {activeTab === 'explanation' && (
              <div className="space-y-3 flex-1 overflow-y-auto">
                
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
                  <span className="text-[11px] font-extrabold text-slate-500 uppercase tracking-wider block">
                    Toutes les étapes du drill FootEco :
                  </span>
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

                {/* Original Exercise context from session (if available) */}
                {partDescription && (
                  <div className="bg-amber-50/70 border border-amber-200 p-3 rounded-xl text-xs space-y-1">
                    <span className="font-extrabold text-amber-900 block text-[11px]">
                      Texte de l'atelier dans la séance :
                    </span>
                    <p className="text-slate-700 text-[11px] whitespace-pre-line leading-relaxed italic">
                      {partDescription}
                    </p>
                  </div>
                )}

              </div>
            )}

            {/* TAB 2: Coaching Accents FootEco ASF */}
            {activeTab === 'coaching' && (
              <div className="space-y-3 flex-1 overflow-y-auto">
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
                        Prise d'information avant la réception (regard périphérique). Première touche toujours orientée vers le sens du jeu. Pied d'appui solide et équilibré lors de la frappe ou de la passe.
                      </p>
                    </div>

                    <div className="p-2.5 bg-blue-50 rounded-xl border border-blue-200">
                      <span className="font-bold text-blue-900 block mb-1">
                        2. Comportement Tactique (TA) :
                      </span>
                      <p className="text-slate-700 text-[11px] leading-relaxed">
                        Créer ou fermer les intervalles. Défenseur : freiner l'adversaire (recul-frein), cadrer sans se jeter. Attaquant : fixation du défenseur et accélération tranchante.
                      </p>
                    </div>

                    <div className="p-2.5 bg-purple-50 rounded-xl border border-purple-200">
                      <span className="font-bold text-purple-900 block mb-1">
                        3. Règle des 3 secondes & Transition (PE) :
                      </span>
                      <p className="text-slate-700 text-[11px] leading-relaxed">
                        À la perte de balle : réaction immédiate (contre-pressing). À la récupération : chercher la profondeur ou la cible dans les 3 secondes sans temporiser.
                      </p>
                    </div>
                  </div>
                </div>

                <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-xs space-y-2 text-xs">
                  <span className="font-extrabold text-slate-800 block">
                    Mots-clés à prononcer par le coach :
                  </span>
                  <div className="flex flex-wrap gap-1.5">
                    {['« Tête levée »', '« Cadre ! »', '« En 3 secondes ! »', '« Première touche ! »', '« Coupe l\'axe ! »', '« Joue simple ! »', '« Transition ! »'].map(kw => (
                      <span key={kw} className="px-2.5 py-1 bg-slate-100 border border-slate-200 text-slate-700 font-bold rounded-lg text-[11px]">
                        {kw}
                      </span>
                    ))}
                  </div>
                </div>
              </div>
            )}

            {/* TAB 3: Variants */}
            {activeTab === 'variants' && (
              <div className="space-y-3 flex-1 overflow-y-auto">
                <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-xs space-y-3">
                  <div className="flex items-center gap-2">
                    <Sliders className="w-4 h-4 text-amber-600" />
                    <h4 className="text-xs font-extrabold text-slate-900">
                      Évolution & Adaptabilité Pédagogique
                    </h4>
                  </div>

                  {/* Easier */}
                  <div className="p-3 bg-emerald-50 rounded-xl border border-emerald-200 space-y-1">
                    <div className="flex items-center gap-1.5 text-xs font-bold text-emerald-900">
                      <span className="w-2 h-2 rounded-full bg-emerald-500" />
                      <span>Pour Faciliter (Réduire la charge / Réussite) :</span>
                    </div>
                    <p className="text-xs text-slate-700 pl-3.5">
                      {currentScenario.pedagogicalVariants.easier}
                    </p>
                  </div>

                  {/* Harder */}
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
                      <span>Plus de 70% de tirs cadrés ou de passes réussies dans l'intervalle.</span>
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
            {activeTab === 'setup' && (
              <div className="space-y-3 flex-1 overflow-y-auto">
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

            {/* Footer Action */}
            <div className="pt-2 border-t border-slate-200 flex items-center justify-between">
              <span className="text-[11px] text-slate-400 font-medium">
                Simulation interactive vectorielle 60 FPS
              </span>
              <button
                onClick={onClose}
                className="px-4 py-2 bg-slate-900 hover:bg-slate-800 text-white rounded-xl text-xs font-bold transition-all"
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
