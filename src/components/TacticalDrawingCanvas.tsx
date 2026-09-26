import React, { useRef, useEffect, useState, useCallback } from 'react';

export type TacticalDrawTool = 'run' | 'pass' | 'free_arrow' | 'pen';

export interface TacticalStroke {
  id: string;
  tool: TacticalDrawTool;
  color: string;
  lineWidth: number;
  points: { x: number; y: number }[];
}

interface TacticalDrawingCanvasProps {
  isDrawingMode: boolean;
  activeTool: TacticalDrawTool;
  activeColor: string;
  lineWidth: number;
  strokes: TacticalStroke[];
  onStrokesChange: (strokes: TacticalStroke[]) => void;
  className?: string;
}

export const TacticalDrawingCanvas: React.FC<TacticalDrawingCanvasProps> = ({
  isDrawingMode,
  activeTool,
  activeColor,
  lineWidth,
  strokes,
  onStrokesChange,
  className = ''
}) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const isDrawingRef = useRef<boolean>(false);
  const currentPointsRef = useRef<{ x: number; y: number }[]>([]);

  // Redraw all strokes onto canvas
  const redrawCanvas = useCallback(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    ctx.clearRect(0, 0, canvas.width, canvas.height);

    const drawArrowHead = (fromX: number, fromY: number, toX: number, toY: number, color: string, width: number) => {
      const angle = Math.atan2(toY - fromY, toX - fromX);
      const headLength = Math.max(12, width * 3.5);
      
      ctx.save();
      ctx.fillStyle = color;
      ctx.strokeStyle = color;
      ctx.lineWidth = 1;
      ctx.lineCap = 'round';
      ctx.lineJoin = 'round';
      ctx.setLineDash([]); // solid arrowhead

      ctx.beginPath();
      ctx.moveTo(toX, toY);
      ctx.lineTo(
        toX - headLength * Math.cos(angle - Math.PI / 6),
        toY - headLength * Math.sin(angle - Math.PI / 6)
      );
      ctx.lineTo(
        toX - (headLength * 0.7) * Math.cos(angle),
        toY - (headLength * 0.7) * Math.sin(angle)
      );
      ctx.lineTo(
        toX - headLength * Math.cos(angle + Math.PI / 6),
        toY - headLength * Math.sin(angle + Math.PI / 6)
      );
      ctx.closePath();
      ctx.fill();
      ctx.stroke();
      ctx.restore();
    };

    const renderStroke = (stroke: TacticalStroke) => {
      if (stroke.points.length < 2) return;
      const pts = stroke.points;
      
      ctx.save();
      ctx.strokeStyle = stroke.color;
      ctx.lineWidth = stroke.lineWidth;
      ctx.lineCap = 'round';
      ctx.lineJoin = 'round';

      // Drop shadow for high visibility against green turf
      ctx.shadowColor = 'rgba(0, 0, 0, 0.65)';
      ctx.shadowBlur = 4;
      ctx.shadowOffsetX = 1;
      ctx.shadowOffsetY = 1.5;

      if (stroke.tool === 'pass') {
        // Dashed line for ball passes
        ctx.setLineDash([8, 6]);
      } else {
        ctx.setLineDash([]);
      }

      if (stroke.tool === 'run' || stroke.tool === 'pass') {
        // Straight line from first point to last point
        const start = pts[0];
        const end = pts[pts.length - 1];
        
        ctx.beginPath();
        ctx.moveTo(start.x, start.y);
        ctx.lineTo(end.x, end.y);
        ctx.stroke();

        // Draw arrowhead at end
        drawArrowHead(start.x, start.y, end.x, end.y, stroke.color, stroke.lineWidth);
      } else if (stroke.tool === 'free_arrow') {
        // Freehand curve with arrowhead at final direction
        ctx.beginPath();
        ctx.moveTo(pts[0].x, pts[0].y);
        for (let i = 1; i < pts.length; i++) {
          ctx.lineTo(pts[i].x, pts[i].y);
        }
        ctx.stroke();

        // Compute direction from last few points
        const lastIdx = pts.length - 1;
        const prevIdx = Math.max(0, lastIdx - 4);
        drawArrowHead(pts[prevIdx].x, pts[prevIdx].y, pts[lastIdx].x, pts[lastIdx].y, stroke.color, stroke.lineWidth);
      } else {
        // Regular freehand pen
        ctx.beginPath();
        ctx.moveTo(pts[0].x, pts[0].y);
        for (let i = 1; i < pts.length; i++) {
          ctx.lineTo(pts[i].x, pts[i].y);
        }
        ctx.stroke();
      }

      ctx.restore();
    };

    // Render confirmed strokes
    strokes.forEach(renderStroke);

    // Render current in-progress stroke
    if (isDrawingRef.current && currentPointsRef.current.length >= 2) {
      renderStroke({
        id: 'in-progress',
        tool: activeTool,
        color: activeColor,
        lineWidth,
        points: currentPointsRef.current
      });
    }
  }, [strokes, activeTool, activeColor, lineWidth]);

  // Handle canvas sizing & DPI scaling
  useEffect(() => {
    const canvas = canvasRef.current;
    const container = containerRef.current;
    if (!canvas || !container) return;

    const resizeObserver = new ResizeObserver(() => {
      const rect = container.getBoundingClientRect();
      const dpr = window.devicePixelRatio || 1;
      
      canvas.width = rect.width * dpr;
      canvas.height = rect.height * dpr;
      canvas.style.width = `${rect.width}px`;
      canvas.style.height = `${rect.height}px`;

      const ctx = canvas.getContext('2d');
      if (ctx) {
        ctx.scale(dpr, dpr);
      }
      redrawCanvas();
    });

    resizeObserver.observe(container);
    return () => resizeObserver.disconnect();
  }, [redrawCanvas]);

  useEffect(() => {
    redrawCanvas();
  }, [redrawCanvas]);

  // Coordinate helper
  const getCoordinates = (e: React.MouseEvent | React.TouchEvent): { x: number; y: number } | null => {
    const canvas = canvasRef.current;
    if (!canvas) return null;
    const rect = canvas.getBoundingClientRect();
    
    let clientX = 0;
    let clientY = 0;

    if ('touches' in e) {
      if (e.touches.length === 0) return null;
      clientX = e.touches[0].clientX;
      clientY = e.touches[0].clientY;
    } else {
      clientX = (e as React.MouseEvent).clientX;
      clientY = (e as React.MouseEvent).clientY;
    }

    return {
      x: clientX - rect.left,
      y: clientY - rect.top
    };
  };

  const handleStart = (e: React.MouseEvent | React.TouchEvent) => {
    if (!isDrawingMode) return;
    const coords = getCoordinates(e);
    if (!coords) return;

    isDrawingRef.current = true;
    currentPointsRef.current = [coords];
    redrawCanvas();
  };

  const handleMove = (e: React.MouseEvent | React.TouchEvent) => {
    if (!isDrawingMode || !isDrawingRef.current) return;
    const coords = getCoordinates(e);
    if (!coords) return;

    // Avoid touch scrolling when drawing
    if ('touches' in e && e.cancelable) {
      e.preventDefault();
    }

    currentPointsRef.current.push(coords);
    redrawCanvas();
  };

  const handleEnd = () => {
    if (!isDrawingMode || !isDrawingRef.current) return;
    isDrawingRef.current = false;

    if (currentPointsRef.current.length >= 2) {
      const newStroke: TacticalStroke = {
        id: `stroke-${Date.now()}-${Math.random().toString(36).substr(2, 6)}`,
        tool: activeTool,
        color: activeColor,
        lineWidth,
        points: [...currentPointsRef.current]
      };
      onStrokesChange([...strokes, newStroke]);
    }

    currentPointsRef.current = [];
    redrawCanvas();
  };

  return (
    <div
      ref={containerRef}
      className={`absolute inset-0 z-20 overflow-hidden rounded-xl ${
        isDrawingMode ? 'cursor-crosshair pointer-events-auto' : 'pointer-events-none'
      } ${className}`}
      style={{ touchAction: isDrawingMode ? 'none' : 'auto' }}
    >
      <canvas
        ref={canvasRef}
        onMouseDown={handleStart}
        onMouseMove={handleMove}
        onMouseUp={handleEnd}
        onMouseLeave={handleEnd}
        onTouchStart={handleStart}
        onTouchMove={handleMove}
        onTouchEnd={handleEnd}
        onTouchCancel={handleEnd}
        className="w-full h-full block"
      />
    </div>
  );
};
