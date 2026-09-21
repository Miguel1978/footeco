import React, { useState, useEffect, useRef, useMemo } from 'react';
import { 
  Play, 
  Pause, 
  RotateCcw, 
  Maximize2, 
  Sparkles, 
  Eye, 
  EyeOff, 
  Gauge, 
  Zap, 
  Check, 
  ChevronRight, 
  ChevronLeft,
  Layers,
  Flame
} from 'lucide-react';
import { 
  DrillAnimationScenario, 
  buildScenarioFromExercise, 
  extractDrillSlotText,
  PitchElement
} from '../utils/drillAnimations';

interface InlineExerciseAnimationPlayerProps {
  partTitle: string;
  partDescription: string;
  partFocus?: string;
  slotName?: 'Dessin 1' | 'Dessin 2' | 'Complet';
  category?: string;
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
  onOpenFullscreen,
  onAutoAlign,
  compact = false,
  className = ''
}) => {
  // Build scenario based on text
  const currentScenario = useMemo<DrillAnimationScenario>(() => {
    return buildScenarioFromExercise(partTitle, partDescription, partFocus, slotName as ('Dessin 1' | 'Dessin 2' | 'Complet'));
  }, [partTitle, partDescription, partFocus, slotName]);

  const [activePhaseIndex, setActivePhaseIndex] = useState<number>(0);
  const [isPlaying, setIsPlaying] = useState<boolean>(true);
  const [speed, setSpeed] = useState<number>(1);
  const [progress, setProgress] = useState<number>(0); // 0 to 1
  const [showTrails, setShowTrails] = useState<boolean>(true);
  const [showBadges, setShowBadges] = useState<boolean>(true);

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

  // Reset when scenario changes
  useEffect(() => {
    setActivePhaseIndex(0);
    setProgress(0);
    setIsPlaying(true);
  }, [currentScenario.id, slotName, partTitle]);

  useEffect(() => {
    const animate = (now: number) => {
      if (isPlaying) {
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
  }, [isPlaying, speed, phases, activePhaseIndex]);

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

  const currentTimeSeconds = (progress * (TOTAL_CYCLE_DURATION_MS / 1000) / speed).toFixed(1);

  return (
    <div className={`flex flex-col bg-slate-900 border border-slate-700/80 rounded-2xl overflow-hidden shadow-xl text-white ${className}`}>
      
      {/* Top Header Toolbar */}
      <div className="bg-gradient-to-r from-slate-950 via-slate-900 to-slate-950 border-b border-slate-800 px-3 py-2 flex flex-wrap items-center justify-between gap-2">
        <div className="flex items-center gap-2 min-w-0">
          <span className="flex items-center gap-1 bg-red-600/30 border border-red-500/40 text-amber-300 font-extrabold text-[10px] px-2 py-0.5 rounded-full uppercase tracking-wider">
            <Zap className="w-3 h-3 text-amber-400" />
            <span>Animation Tactique FootEco</span>
          </span>
          {slotName && slotName !== 'Complet' && (
            <span className="bg-slate-800 border border-slate-700 text-slate-200 text-[10px] font-bold px-2 py-0.5 rounded-md">
              {slotName}
            </span>
          )}
          <span className="text-xs font-bold text-slate-200 truncate hidden sm:inline" title={currentScenario.name}>
            {currentScenario.name}
          </span>
        </div>

        <div className="flex items-center gap-1.5 shrink-0">
          {/* Trails toggle */}
          <button
            type="button"
            onClick={() => setShowTrails(!showTrails)}
            className={`p-1.5 rounded-lg text-[10px] font-bold transition-colors cursor-pointer flex items-center gap-1 ${
              showTrails ? 'bg-amber-500/20 text-amber-300 border border-amber-500/30' : 'bg-slate-800 text-slate-400 hover:text-white'
            }`}
            title="Afficher/Masquer les tracés de passes et courses"
          >
            <Layers className="w-3 h-3" />
            <span className="hidden md:inline">Tracés</span>
          </button>

          {/* Badges toggle */}
          <button
            type="button"
            onClick={() => setShowBadges(!showBadges)}
            className={`p-1.5 rounded-lg text-[10px] font-bold transition-colors cursor-pointer flex items-center gap-1 ${
              showBadges ? 'bg-blue-500/20 text-blue-300 border border-blue-500/30' : 'bg-slate-800 text-slate-400 hover:text-white'
            }`}
            title="Afficher/Masquer les badges d'action (Tir, Passe, Cadrage)"
          >
            <Flame className="w-3 h-3" />
            <span className="hidden md:inline">Actions</span>
          </button>

          {/* Sync button */}
          {onAutoAlign && (
            <button
              type="button"
              onClick={onAutoAlign}
              className="p-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-amber-300 text-[10px] font-bold transition-colors cursor-pointer flex items-center gap-1 border border-slate-700"
              title="Réanalyser le texte FootEco pour synchroniser l'animation"
            >
              <Sparkles className="w-3 h-3" />
              <span className="hidden sm:inline">Sync</span>
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
              <span>Studio Complet</span>
            </button>
          )}
        </div>
      </div>

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

                {/* Dynamic Micro-Action Badges */}
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

          {/* Goal Banner */}
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

        {/* Floating Active Phase Cue Badge */}
        {currentPhase.subtitle && (
          <div className="absolute top-2 left-2 pointer-events-none">
            <div className="bg-slate-900/85 backdrop-blur-xs border border-slate-700/80 px-2.5 py-1 rounded-lg shadow-md text-left max-w-xs">
              <span className="text-[10px] font-black text-amber-400 block leading-tight">
                {currentPhase.title}
              </span>
              <span className="text-[9px] text-slate-300 font-medium block truncate">
                {currentPhase.subtitle}
              </span>
            </div>
          </div>
        )}
      </div>

      {/* Phase Scrubber & Timeline Bar */}
      <div className="bg-slate-950/90 px-3 pt-2 pb-1 border-t border-slate-800">
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

        {/* Phase Jump Pills */}
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
                title={`${phase.title} : ${phase.subtitle}`}
              >
                <span className="w-3.5 h-3.5 rounded-full bg-black/30 flex items-center justify-center text-[9px] shrink-0">
                  {pIdx + 1}
                </span>
                <span className="truncate">{phase.title.replace(/^\d+\.\s*/, '')}</span>
              </button>
            );
          })}
        </div>

        {/* Controls Bar */}
        <div className="flex items-center justify-between gap-2 text-xs py-1">
          <div className="flex items-center gap-1">
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

          {/* Speed selector */}
          <div className="flex items-center gap-1 bg-slate-900 border border-slate-800 rounded-lg p-0.5">
            {[0.5, 1, 1.5].map((s) => (
              <button
                key={s}
                type="button"
                onClick={() => setSpeed(s)}
                className={`px-1.5 py-0.5 rounded text-[10px] font-bold cursor-pointer transition-colors ${
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
  );
};
