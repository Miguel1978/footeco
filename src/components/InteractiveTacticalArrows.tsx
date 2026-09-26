import React, { useState, useRef, useEffect, useCallback } from 'react';
import { 
  Play, 
  Pause, 
  Trash2, 
  ArrowRight, 
  RotateCcw, 
  Sparkles, 
  Check, 
  ChevronRight,
  Zap,
  Undo2
} from 'lucide-react';

export type ArrowType = 'pass' | 'run';

export interface TacticalArrow {
  id: string;
  type: ArrowType; // 'pass' (trajectoire de passe) | 'run' (course sans ballon)
  team: 'team1' | 'team2';
  color: string;
  startX: number; // percentage 0..100
  startY: number; // percentage 0..100
  endX: number;   // percentage 0..100
  endY: number;   // percentage 0..100
  startPlayerName?: string;
  startRole?: string;
  endPlayerName?: string;
  endRole?: string;
  label?: string;
  curve?: number; // bezier offset: -30 to 30
}

interface InteractiveTacticalArrowsProps {
  team: 'team1' | 'team2';
  arrows: TacticalArrow[];
  onArrowsChange: (arrows: TacticalArrow[]) => void;
  isArrowModeActive: boolean;
  arrowTool: ArrowType;
  arrowColor: string;
  pitchContainerRef: React.RefObject<HTMLDivElement | null>;
  onArrowCreated?: (arrow: TacticalArrow) => void;
}

export const InteractiveTacticalArrows: React.FC<InteractiveTacticalArrowsProps> = ({
  team,
  arrows,
  onArrowsChange,
  isArrowModeActive,
  arrowTool,
  arrowColor,
  pitchContainerRef,
  onArrowCreated
}) => {
  const [selectedArrowId, setSelectedArrowId] = useState<string | null>(null);
  const [drawingStart, setDrawingStart] = useState<{
    x: number;
    y: number;
    playerName?: string;
    role?: string;
  } | null>(null);
  const [currentCursor, setCurrentCursor] = useState<{
    x: number;
    y: number;
    snappedPlayerName?: string;
    snappedRole?: string;
  } | null>(null);

  // Animation playback state for ball trajectory and player runs
  const [isAnimating, setIsAnimating] = useState<boolean>(false);
  const [animProgress, setAnimProgress] = useState<number>(0); // 0 to 1
  const animFrameRef = useRef<number | null>(null);

  // Run smooth animation loop when isAnimating is true
  useEffect(() => {
    if (!isAnimating) {
      if (animFrameRef.current) cancelAnimationFrame(animFrameRef.current);
      setAnimProgress(0);
      return;
    }

    let startTime = performance.now();
    const duration = 2400; // 2.4s per loop

    const step = (now: number) => {
      const elapsed = (now - startTime) % duration;
      setAnimProgress(elapsed / duration);
      animFrameRef.current = requestAnimationFrame(step);
    };

    animFrameRef.current = requestAnimationFrame(step);
    return () => {
      if (animFrameRef.current) cancelAnimationFrame(animFrameRef.current);
    };
  }, [isAnimating]);

  // Convert client click to pitch percentage coordinates (0..100)
  const getPitchCoords = useCallback((clientX: number, clientY: number): { x: number; y: number } | null => {
    const container = pitchContainerRef.current;
    if (!container) return null;
    const rect = container.getBoundingClientRect();
    if (rect.width === 0 || rect.height === 0) return null;

    const x = Math.max(2, Math.min(98, ((clientX - rect.left) / rect.width) * 100));
    const y = Math.max(2, Math.min(98, ((clientY - rect.top) / rect.height) * 100));
    return { x, y };
  }, [pitchContainerRef]);

  // Check if pointer is near any tactical player slot on the pitch
  const findNearbyPlayerSlot = useCallback((clientX: number, clientY: number): {
    x: number;
    y: number;
    playerName?: string;
    role?: string;
  } | null => {
    const container = pitchContainerRef.current;
    if (!container) return null;

    const slotEls = container.querySelectorAll(`[data-tactical-slot="${team}"]`) as NodeListOf<HTMLElement>;
    let closest: { x: number; y: number; playerName?: string; role?: string; dist: number } | null = null;

    slotEls.forEach((el) => {
      const rect = el.getBoundingClientRect();
      const centerX = rect.left + rect.width / 2;
      const centerY = rect.top + rect.height / 2;
      const dist = Math.hypot(clientX - centerX, clientY - centerY);

      // Snap radius of 45px around player avatar
      if (dist < 45 && (!closest || dist < closest.dist)) {
        const pCoords = getPitchCoords(centerX, centerY);
        if (pCoords) {
          closest = {
            x: pCoords.x,
            y: pCoords.y,
            role: el.dataset.slotRole,
            dist
          };
        }
      }
    });

    return closest ? { x: closest.x, y: closest.y, role: closest.role } : null;
  }, [team, pitchContainerRef, getPitchCoords]);

  // Handle pointer down on pitch
  const handlePitchPointerDown = (e: React.PointerEvent<SVGSVGElement>) => {
    if (!isArrowModeActive) return;
    if (e.button !== 0) return; // only left click

    const nearby = findNearbyPlayerSlot(e.clientX, e.clientY);
    const coords = nearby || getPitchCoords(e.clientX, e.clientY);
    if (!coords) return;

    if (!drawingStart) {
      // Start tracing an arrow
      setDrawingStart({
        x: coords.x,
        y: coords.y,
        role: coords.role
      });
      setCurrentCursor({
        x: coords.x,
        y: coords.y
      });
    } else {
      // Finish tracing arrow
      const dist = Math.hypot(coords.x - drawingStart.x, coords.y - drawingStart.y);
      if (dist > 4) { // Minimum 4% distance to avoid accidental clicks
        const newArrow: TacticalArrow = {
          id: `arrow-${Date.now()}-${Math.random().toString(36).substr(2, 5)}`,
          type: arrowTool,
          team,
          color: arrowColor,
          startX: drawingStart.x,
          startY: drawingStart.y,
          endX: coords.x,
          endY: coords.y,
          startRole: drawingStart.role,
          endRole: coords.role,
          label: arrowTool === 'pass' 
            ? (coords.role ? `Passe ➔ ${coords.role}` : 'Passe dans l\'espace') 
            : (drawingStart.role ? `Appel ${drawingStart.role}` : 'Course sans ballon'),
          curve: 0
        };

        onArrowsChange([...arrows, newArrow]);
        if (onArrowCreated) onArrowCreated(newArrow);
      }
      setDrawingStart(null);
      setCurrentCursor(null);
    }
  };

  const handlePitchPointerMove = (e: React.PointerEvent<SVGSVGElement>) => {
    if (!isArrowModeActive || !drawingStart) return;

    const nearby = findNearbyPlayerSlot(e.clientX, e.clientY);
    const coords = nearby || getPitchCoords(e.clientX, e.clientY);
    if (coords) {
      setCurrentCursor({
        x: coords.x,
        y: coords.y,
        snappedRole: coords.role
      });
    }
  };

  // Helper to calculate SVG path for curved or straight arrows
  const getPathData = (startX: number, startY: number, endX: number, endY: number, curve: number = 0) => {
    if (curve === 0) {
      return `M ${startX} ${startY} L ${endX} ${endY}`;
    }
    // Quadratic bezier with normal perpendicular offset
    const midX = (startX + endX) / 2;
    const midY = (startY + endY) / 2;
    const dx = endX - startX;
    const dy = endY - startY;
    const len = Math.hypot(dx, dy) || 1;
    const nx = -dy / len;
    const ny = dx / len;
    const ctrlX = midX + nx * curve;
    const ctrlY = midY + ny * curve;
    return `M ${startX} ${startY} Q ${ctrlX} ${ctrlY} ${endX} ${endY}`;
  };

  // Helper to compute angle at end point for arrowhead
  const getEndAngle = (startX: number, startY: number, endX: number, endY: number, curve: number = 0) => {
    if (curve === 0) {
      return Math.atan2(endY - startY, endX - startX);
    }
    const midX = (startX + endX) / 2;
    const midY = (startY + endY) / 2;
    const dx = endX - startX;
    const dy = endY - startY;
    const len = Math.hypot(dx, dy) || 1;
    const nx = -dy / len;
    const ny = dx / len;
    const ctrlX = midX + nx * curve;
    const ctrlY = midY + ny * curve;
    return Math.atan2(endY - ctrlY, endX - ctrlX);
  };

  // Calculate animated position along a line or curve
  const getAnimatedPos = (startX: number, startY: number, endX: number, endY: number, curve: number = 0, t: number) => {
    if (curve === 0) {
      return {
        x: startX + (endX - startX) * t,
        y: startY + (endY - startY) * t
      };
    }
    const midX = (startX + endX) / 2;
    const midY = (startY + endY) / 2;
    const dx = endX - startX;
    const dy = endY - startY;
    const len = Math.hypot(dx, dy) || 1;
    const nx = -dy / len;
    const ny = dx / len;
    const ctrlX = midX + nx * curve;
    const ctrlY = midY + ny * curve;

    const oneMinusT = 1 - t;
    const x = oneMinusT * oneMinusT * startX + 2 * oneMinusT * t * ctrlX + t * t * endX;
    const y = oneMinusT * oneMinusT * startY + 2 * oneMinusT * t * ctrlY + t * t * endY;
    return { x, y };
  };

  // Action handlers for selected arrow
  const handleToggleArrowType = (arrowId: string) => {
    onArrowsChange(arrows.map(a => {
      if (a.id === arrowId) {
        const newType: ArrowType = a.type === 'pass' ? 'run' : 'pass';
        return {
          ...a,
          type: newType,
          label: newType === 'pass' ? 'Passe' : 'Course sans ballon'
        };
      }
      return a;
    }));
  };

  const handleInvertArrow = (arrowId: string) => {
    onArrowsChange(arrows.map(a => {
      if (a.id === arrowId) {
        return {
          ...a,
          startX: a.endX,
          startY: a.endY,
          endX: a.startX,
          endY: a.startY,
          startRole: a.endRole,
          endRole: a.startRole,
          curve: a.curve ? -a.curve : 0
        };
      }
      return a;
    }));
  };

  const handleToggleCurve = (arrowId: string) => {
    onArrowsChange(arrows.map(a => {
      if (a.id === arrowId) {
        const nextCurve = a.curve === 0 ? 12 : a.curve === 12 ? -12 : 0;
        return { ...a, curve: nextCurve };
      }
      return a;
    }));
  };

  const handleDeleteArrow = (arrowId: string) => {
    onArrowsChange(arrows.filter(a => a.id !== arrowId));
    if (selectedArrowId === arrowId) setSelectedArrowId(null);
  };

  return (
    <div className="absolute inset-0 z-15 pointer-events-none select-none">
      {/* Interactive SVG layer mapped 0..100 viewBox */}
      <svg
        viewBox="0 0 100 100"
        preserveAspectRatio="none"
        onPointerDown={handlePitchPointerDown}
        onPointerMove={handlePitchPointerMove}
        className={`w-full h-full ${
          isArrowModeActive ? 'pointer-events-auto cursor-crosshair' : 'pointer-events-none'
        }`}
      >
        <defs>
          {/* Arrowhead marker for solid run */}
          <marker
            id={`arrowhead-run-${team}`}
            viewBox="0 0 10 10"
            refX="6"
            refY="5"
            markerWidth="4.5"
            markerHeight="4.5"
            orient="auto"
          >
            <path d="M 0 1.5 L 8 5 L 0 8.5 z" fill="#38BDF8" />
          </marker>

          {/* Arrowhead marker for passes */}
          <marker
            id={`arrowhead-pass-${team}`}
            viewBox="0 0 10 10"
            refX="6"
            refY="5"
            markerWidth="5"
            markerHeight="5"
            orient="auto"
          >
            <path d="M 0 1.5 L 8 5 L 0 8.5 z" fill="#FACC15" />
          </marker>

          {/* Glow filter */}
          <filter id={`arrow-glow-${team}`} x="-20%" y="-20%" width="140%" height="140%">
            <feDropShadow dx="0" dy="0" stdDeviation="0.8" floodColor="#000" floodOpacity="0.8" />
          </filter>
        </defs>

        {/* 1. Render Confirmed Tactical Arrows */}
        {arrows.map((arrow) => {
          const isPass = arrow.type === 'pass';
          const isSelected = selectedArrowId === arrow.id;
          const curve = arrow.curve || 0;
          const pathData = getPathData(arrow.startX, arrow.startY, arrow.endX, arrow.endY, curve);
          const endAngle = getEndAngle(arrow.startX, arrow.startY, arrow.endX, arrow.endY, curve);
          
          // Midpoint for badge / label
          const midPos = getAnimatedPos(arrow.startX, arrow.startY, arrow.endX, arrow.endY, curve, 0.5);

          // Animated ball or runner position
          const animPos = isAnimating 
            ? getAnimatedPos(arrow.startX, arrow.startY, arrow.endX, arrow.endY, curve, animProgress)
            : null;

          return (
            <g 
              key={arrow.id} 
              className="cursor-pointer group"
              onClick={(e) => {
                e.stopPropagation();
                setSelectedArrowId(isSelected ? null : arrow.id);
              }}
              style={{ pointerEvents: 'auto' }}
            >
              {/* Invisible wider hit area for easy clicking */}
              <path
                d={pathData}
                fill="none"
                stroke="transparent"
                strokeWidth="4"
              />

              {/* Shadow line for pitch contrast */}
              <path
                d={pathData}
                fill="none"
                stroke="rgba(0,0,0,0.7)"
                strokeWidth={isPass ? 1.4 : 1.6}
                strokeLinecap="round"
                transform="translate(0.3, 0.4)"
              />

              {/* Main Arrow Line */}
              <path
                d={pathData}
                fill="none"
                stroke={arrow.color}
                strokeWidth={isSelected ? 1.8 : 1.3}
                strokeDasharray={isPass ? '2 1.5' : 'none'}
                strokeLinecap="round"
                className={`transition-all duration-150 ${
                  isPass ? 'animate-[dash_1s_linear_infinite]' : ''
                }`}
                style={isSelected ? { filter: `drop-shadow(0 0 1.5px ${arrow.color})` } : {}}
              />

              {/* Arrowhead at destination */}
              <polygon
                points="-1.2,-1 1.6,0 -1.2,1 -0.5,0"
                fill={arrow.color}
                stroke="rgba(0,0,0,0.6)"
                strokeWidth="0.2"
                transform={`translate(${arrow.endX}, ${arrow.endY}) rotate(${(endAngle * 180) / Math.PI}) scale(1.1)`}
              />

              {/* Start node dot */}
              <circle
                cx={arrow.startX}
                cy={arrow.startY}
                r="1"
                fill={arrow.color}
                stroke="#020617"
                strokeWidth="0.4"
              />

              {/* Animated ball on passes */}
              {isAnimating && animPos && isPass && (
                <g transform={`translate(${animPos.x}, ${animPos.y})`}>
                  <circle r="1.3" fill="#FFFFFF" stroke="#000000" strokeWidth="0.3" />
                  <circle r="0.6" fill="#1E293B" />
                </g>
              )}

              {/* Animated runner pulse on runs */}
              {isAnimating && animPos && !isPass && (
                <g transform={`translate(${animPos.x}, ${animPos.y})`}>
                  <circle r="1.4" fill={arrow.color} opacity="0.8" className="animate-ping" />
                  <circle r="1.1" fill={arrow.color} stroke="#020617" strokeWidth="0.3" />
                </g>
              )}

              {/* Center label badge on hover or selection */}
              <g 
                transform={`translate(${midPos.x}, ${midPos.y})`}
                className="transition-transform duration-150 hover:scale-110"
              >
                <rect
                  x="-7"
                  y="-2"
                  width="14"
                  height="4"
                  rx="1.5"
                  fill="#0F172A"
                  stroke={isSelected ? arrow.color : '#334155'}
                  strokeWidth="0.4"
                  opacity="0.9"
                />
                <text
                  x="0"
                  y="0.7"
                  textAnchor="middle"
                  fill="#F8FAFC"
                  fontSize="2"
                  fontWeight="bold"
                  className="pointer-events-none select-none"
                >
                  {isPass ? '⚽ Passe' : '🏃 Course'}
                </text>
              </g>
            </g>
          );
        })}

        {/* 2. In-Progress Tracing Arrow Preview */}
        {isArrowModeActive && drawingStart && currentCursor && (
          <g className="pointer-events-none">
            {/* Start point halo */}
            <circle
              cx={drawingStart.x}
              cy={drawingStart.y}
              r="2.5"
              fill={arrowColor}
              opacity="0.35"
              className="animate-ping"
            />
            <circle
              cx={drawingStart.x}
              cy={drawingStart.y}
              r="1.2"
              fill={arrowColor}
              stroke="#000"
              strokeWidth="0.4"
            />

            {/* In-progress dashed trajectory */}
            <line
              x1={drawingStart.x}
              y1={drawingStart.y}
              x2={currentCursor.x}
              y2={currentCursor.y}
              stroke={arrowColor}
              strokeWidth="1.4"
              strokeDasharray={arrowTool === 'pass' ? '2.5 1.5' : 'none'}
              strokeLinecap="round"
            />

            {/* Target snap circle */}
            <circle
              cx={currentCursor.x}
              cy={currentCursor.y}
              r="1.8"
              fill="none"
              stroke={arrowColor}
              strokeWidth="0.6"
              strokeDasharray="1 1"
              className="animate-spin"
            />

            {/* Destination tooltip badge */}
            <g transform={`translate(${currentCursor.x}, ${currentCursor.y - 4})`}>
              <rect
                x="-12"
                y="-2"
                width="24"
                height="4.5"
                rx="1.5"
                fill="#020617"
                stroke={arrowColor}
                strokeWidth="0.4"
                opacity="0.95"
              />
              <text
                x="0"
                y="1"
                textAnchor="middle"
                fill="#F8FAFC"
                fontSize="1.9"
                fontWeight="bold"
              >
                {currentCursor.snappedRole 
                  ? (arrowTool === 'pass' ? `➔ Passe vers ${currentCursor.snappedRole}` : `➔ Course vers ${currentCursor.snappedRole}`)
                  : (arrowTool === 'pass' ? '⚽ Clic pour valider passe' : '🏃 Clic pour valider course')
                }
              </text>
            </g>
          </g>
        )}
      </svg>

      {/* 3. Floating Quick Context Action Bar for Selected Arrow */}
      {selectedArrowId && (
        <div 
          className="absolute top-2 left-1/2 -translate-x-1/2 z-30 bg-slate-900/95 border border-amber-400 text-white px-2.5 py-1.5 rounded-xl shadow-2xl flex items-center gap-2 text-xs backdrop-blur-md animate-in fade-in zoom-in-95 pointer-events-auto"
        >
          {(() => {
            const arr = arrows.find(a => a.id === selectedArrowId);
            if (!arr) return null;
            return (
              <>
                <span className="font-bold text-[11px] text-amber-300 flex items-center gap-1">
                  <span>{arr.type === 'pass' ? '⚽ Passe' : '🏃 Course sans ballon'}</span>
                  {arr.startRole && arr.endRole && (
                    <span className="text-[10px] text-slate-300 font-normal">
                      ({arr.startRole} ➔ {arr.endRole})
                    </span>
                  )}
                </span>

                <div className="h-4 w-px bg-slate-700" />

                <button
                  type="button"
                  onClick={() => handleToggleArrowType(arr.id)}
                  className="px-2 py-0.5 rounded bg-slate-800 hover:bg-slate-700 text-slate-200 text-[10px] font-bold border border-slate-700 cursor-pointer"
                  title="Basculer entre Trajectoire de passe et Course sans ballon"
                >
                  Type : {arr.type === 'pass' ? 'Passe ➔ Course' : 'Course ➔ Passe'}
                </button>

                <button
                  type="button"
                  onClick={() => handleInvertArrow(arr.id)}
                  className="px-2 py-0.5 rounded bg-slate-800 hover:bg-slate-700 text-slate-200 text-[10px] font-bold border border-slate-700 flex items-center gap-1 cursor-pointer"
                  title="Inverser le sens de la flèche (départ ⇄ arrivée)"
                >
                  <ArrowRight className="w-3 h-3 rotate-180" />
                  <span>Inverser</span>
                </button>

                <button
                  type="button"
                  onClick={() => handleToggleCurve(arr.id)}
                  className={`px-2 py-0.5 rounded text-[10px] font-bold border cursor-pointer ${
                    arr.curve ? 'bg-amber-500/20 text-amber-300 border-amber-500/50' : 'bg-slate-800 text-slate-300 border-slate-700'
                  }`}
                  title="Basculer entre trajectoire droite ou course courbée / dédoublement"
                >
                  Courbe {arr.curve ? (arr.curve > 0 ? '⤹' : '⤸') : '—'}
                </button>

                <button
                  type="button"
                  onClick={() => handleDeleteArrow(arr.id)}
                  className="p-1 rounded bg-rose-950/60 hover:bg-rose-900 text-rose-300 border border-rose-800/80 cursor-pointer"
                  title="Supprimer cette flèche"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                </button>

                <button
                  type="button"
                  onClick={() => setSelectedArrowId(null)}
                  className="text-slate-400 hover:text-white text-[10px] px-1 cursor-pointer"
                >
                  ✕
                </button>
              </>
            );
          })()}
        </div>
      )}

      {/* 4. Controls Overlay Badge (Animation Play / Pause & count) */}
      {arrows.length > 0 && (
        <div className="absolute top-2 left-2 z-20 pointer-events-auto flex items-center gap-1.5">
          <button
            type="button"
            onClick={() => setIsAnimating(!isAnimating)}
            className={`inline-flex items-center gap-1 px-2 py-1 rounded-lg text-[10px] font-bold shadow-md border transition-all cursor-pointer ${
              isAnimating
                ? 'bg-emerald-500 text-slate-950 border-emerald-400 animate-pulse'
                : 'bg-slate-900/90 text-emerald-300 border-emerald-500/50 hover:bg-slate-800'
            }`}
            title={isAnimating ? "Mettre en pause l'animation des trajectoires" : "Animer le déplacement du ballon et les courses des joueurs"}
          >
            {isAnimating ? <Pause className="w-3 h-3" /> : <Play className="w-3 h-3 fill-emerald-300" />}
            <span>{isAnimating ? 'Anim en cours' : 'Animer flèches'}</span>
          </button>
          
          <span className="text-[9px] font-mono text-slate-300 bg-slate-950/80 px-1.5 py-0.5 rounded border border-slate-800">
            {arrows.filter(a => a.type === 'pass').length} passes • {arrows.filter(a => a.type === 'run').length} courses
          </span>
        </div>
      )}
    </div>
  );
};
