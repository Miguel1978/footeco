import React from 'react';
import { Target, Shield, Compass, ArrowUp, Zap, Layers } from 'lucide-react';

export type PressingZoneType = 'none' | 'high' | 'mid' | 'low' | 'all';

interface PressingZonesOverlayProps {
  activeZone: PressingZoneType;
  opacity: number; // 0 to 100
  teamName?: string;
  formationCode?: string;
}

export const PressingZonesOverlay: React.FC<PressingZonesOverlayProps> = ({
  activeZone,
  opacity,
  teamName = 'Équipe',
  formationCode = '2-3-1'
}) => {
  if (activeZone === 'none' || opacity <= 0) return null;

  // Normalized opacity value (0 to 1)
  const normOpacity = Math.max(0, Math.min(100, opacity)) / 100;

  return (
    <div 
      className="absolute inset-0 pointer-events-none select-none z-5 transition-opacity duration-150 overflow-hidden rounded-xl"
      style={{ opacity: normOpacity }}
      data-testid="pressing-zones-overlay"
    >
      {/* SVG Background Patterns & Grids */}
      <svg className="absolute inset-0 w-full h-full pointer-events-none" xmlns="http://www.w3.org/2000/svg">
        <defs>
          {/* Diagonal hatch pattern for high pressing zone */}
          <pattern id="hatch-high" width="16" height="16" patternTransform="rotate(45 0 0)" patternUnits="userSpaceOnUse">
            <line x1="0" y1="0" x2="0" y2="16" stroke="rgba(245, 158, 11, 0.4)" strokeWidth="2.5" />
          </pattern>
          {/* Diagonal hatch pattern for mid block zone */}
          <pattern id="hatch-mid" width="16" height="16" patternTransform="rotate(-45 0 0)" patternUnits="userSpaceOnUse">
            <line x1="0" y1="0" x2="0" y2="16" stroke="rgba(59, 130, 246, 0.4)" strokeWidth="2.5" />
          </pattern>
          {/* Diagonal hatch pattern for low defensive zone */}
          <pattern id="hatch-low" width="16" height="16" patternTransform="rotate(45 0 0)" patternUnits="userSpaceOnUse">
            <line x1="0" y1="0" x2="0" y2="16" stroke="rgba(16, 185, 129, 0.4)" strokeWidth="2.5" />
          </pattern>
          {/* Arrow marker for pressing runs */}
          <marker id="arrow-high" viewBox="0 0 10 10" refX="5" refY="5" markerWidth="6" markerHeight="6" orient="auto-start-reverse">
            <path d="M 0 0 L 10 5 L 0 10 z" fill="#F59E0B" />
          </marker>
        </defs>
      </svg>

      {/* 1. ZONE HAUTE (Bloc Haut / Pressing Tout Terrain) - Top 36% of pitch */}
      {(activeZone === 'high' || activeZone === 'all') && (
        <div 
          className={`absolute top-0 left-0 right-0 ${
            activeZone === 'all' ? 'h-[33.3%]' : 'h-[36%]'
          } transition-all duration-200 border-b-2 border-dashed border-amber-400 bg-amber-500/25 flex flex-col justify-between p-2`}
        >
          {/* Diagonal hatch fill */}
          <div 
            className="absolute inset-0 pointer-events-none opacity-40"
            style={{
              backgroundImage: 'repeating-linear-gradient(45deg, rgba(245, 158, 11, 0.15) 0px, rgba(245, 158, 11, 0.15) 6px, transparent 6px, transparent 14px)'
            }}
          />

          {/* Tactical Badge Header */}
          <div className="relative z-10 flex items-center justify-between">
            <div className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-md bg-slate-950/85 border border-amber-400 text-amber-300 text-[10px] font-black tracking-wider uppercase shadow-md backdrop-blur-xs">
              <Zap className="w-3 h-3 text-amber-400 animate-pulse" />
              <span>Zone Haute • Pressing Haut</span>
            </div>
            {activeZone === 'high' && (
              <div className="hidden sm:inline-flex items-center gap-1 px-1.5 py-0.5 rounded bg-slate-900/80 text-amber-200 text-[9px] font-mono border border-amber-400/40">
                <span>Phase : Récupération active</span>
              </div>
            )}
          </div>

          {/* Pressing Directional Indicators (Arrows pointing up to opponent goal) */}
          <div className="relative z-10 flex items-center justify-around opacity-80 py-1">
            <div className="flex flex-col items-center text-amber-300 text-[9px] font-bold">
              <ArrowUp className="w-3.5 h-3.5 animate-bounce text-amber-400" />
              <span className="bg-slate-950/70 px-1 rounded text-[8px]">Cadrage</span>
            </div>
            <div className="flex flex-col items-center text-amber-300 text-[9px] font-bold">
              <ArrowUp className="w-4 h-4 animate-bounce text-amber-300" />
              <span className="bg-slate-950/70 px-1 rounded text-[8px] font-black">Harcèlement</span>
            </div>
            <div className="flex flex-col items-center text-amber-300 text-[9px] font-bold">
              <ArrowUp className="w-3.5 h-3.5 animate-bounce text-amber-400" />
              <span className="bg-slate-950/70 px-1 rounded text-[8px]">Interception</span>
            </div>
          </div>

          {/* Tactical instruction strip */}
          <div className="relative z-10 flex items-center justify-between text-[9px] text-amber-200 bg-slate-950/70 px-2 py-0.5 rounded border border-amber-500/30">
            <span className="truncate">Coupure des relances courtes & pressing sur le porteur adverse</span>
            <span className="font-mono font-bold text-amber-300 shrink-0 ml-1">Tiers Offensif</span>
          </div>
        </div>
      )}

      {/* 2. ZONE MÉDIANE (Bloc Médian / Densité Centrale) - Middle of pitch */}
      {(activeZone === 'mid' || activeZone === 'all') && (
        <div 
          className={`absolute left-0 right-0 ${
            activeZone === 'all' 
              ? 'top-[33.3%] h-[33.3%] border-y-2 border-dashed border-cyan-400 bg-cyan-500/25' 
              : 'top-[30%] h-[40%] border-y-2 border-dashed border-cyan-400 bg-cyan-500/25'
          } transition-all duration-200 flex flex-col justify-between p-2`}
        >
          {/* Diagonal hatch fill */}
          <div 
            className="absolute inset-0 pointer-events-none opacity-40"
            style={{
              backgroundImage: 'repeating-linear-gradient(-45deg, rgba(6, 182, 212, 0.15) 0px, rgba(6, 182, 212, 0.15) 6px, transparent 6px, transparent 14px)'
            }}
          />

          {/* Tactical Badge Header */}
          <div className="relative z-10 flex items-center justify-between">
            <div className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-md bg-slate-950/85 border border-cyan-400 text-cyan-300 text-[10px] font-black tracking-wider uppercase shadow-md backdrop-blur-xs">
              <Compass className="w-3 h-3 text-cyan-400" />
              <span>Zone Médiane • Bloc Médian</span>
            </div>
            {activeZone === 'mid' && (
              <div className="hidden sm:inline-flex items-center gap-1 px-1.5 py-0.5 rounded bg-slate-900/80 text-cyan-200 text-[9px] font-mono border border-cyan-400/40">
                <span>Phase : Équilibre & Densité</span>
              </div>
            )}
          </div>

          {/* Tactical center target markers */}
          <div className="relative z-10 flex items-center justify-around opacity-80 py-1">
            <div className="flex items-center gap-1 text-cyan-300 text-[9px] font-bold bg-slate-950/70 px-1.5 py-0.5 rounded border border-cyan-500/30">
              <span className="w-1.5 h-1.5 rounded-full bg-cyan-400 inline-block animate-ping" />
              <span>Compacité axiale</span>
            </div>
            <div className="flex items-center gap-1 text-cyan-300 text-[9px] font-bold bg-slate-950/70 px-1.5 py-0.5 rounded border border-cyan-500/30">
              <Target className="w-3 h-3 text-cyan-400" />
              <span>Fermeture des intervalles</span>
            </div>
          </div>

          {/* Tactical instruction strip */}
          <div className="relative z-10 flex items-center justify-between text-[9px] text-cyan-200 bg-slate-950/70 px-2 py-0.5 rounded border border-cyan-500/30">
            <span className="truncate">Orienter le jeu vers les couloirs et piéger à la passe axiale</span>
            <span className="font-mono font-bold text-cyan-300 shrink-0 ml-1">Ligne Médiane</span>
          </div>
        </div>
      )}

      {/* 3. ZONE BASSE (Bloc Bas / Protection Surface) - Bottom of pitch */}
      {(activeZone === 'low' || activeZone === 'all') && (
        <div 
          className={`absolute bottom-0 left-0 right-0 ${
            activeZone === 'all' ? 'h-[33.4%]' : 'h-[36%]'
          } transition-all duration-200 border-t-2 border-dashed border-emerald-400 bg-emerald-500/25 flex flex-col justify-between p-2`}
        >
          {/* Diagonal hatch fill */}
          <div 
            className="absolute inset-0 pointer-events-none opacity-40"
            style={{
              backgroundImage: 'repeating-linear-gradient(45deg, rgba(16, 185, 129, 0.15) 0px, rgba(16, 185, 129, 0.15) 6px, transparent 6px, transparent 14px)'
            }}
          />

          {/* Tactical Badge Header */}
          <div className="relative z-10 flex items-center justify-between">
            <div className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-md bg-slate-950/85 border border-emerald-400 text-emerald-300 text-[10px] font-black tracking-wider uppercase shadow-md backdrop-blur-xs">
              <Shield className="w-3 h-3 text-emerald-400" />
              <span>Zone Basse • Bloc Bas</span>
            </div>
            {activeZone === 'low' && (
              <div className="hidden sm:inline-flex items-center gap-1 px-1.5 py-0.5 rounded bg-slate-900/80 text-emerald-200 text-[9px] font-mono border border-emerald-400/40">
                <span>Phase : Sécurité & Verrouillage</span>
              </div>
            )}
          </div>

          {/* Tactical center target markers */}
          <div className="relative z-10 flex items-center justify-around opacity-80 py-1">
            <div className="flex items-center gap-1 text-emerald-300 text-[9px] font-bold bg-slate-950/70 px-1.5 py-0.5 rounded border border-emerald-500/30">
              <Shield className="w-3 h-3 text-emerald-400" />
              <span>Protection de l'axe but</span>
            </div>
            <div className="flex items-center gap-1 text-emerald-300 text-[9px] font-bold bg-slate-950/70 px-1.5 py-0.5 rounded border border-emerald-500/30">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 inline-block" />
              <span>Lignes très serrées</span>
            </div>
          </div>

          {/* Tactical instruction strip */}
          <div className="relative z-10 flex items-center justify-between text-[9px] text-emerald-200 bg-slate-950/70 px-2 py-0.5 rounded border border-emerald-500/30">
            <span className="truncate">Densité totale dans la surface de vérité, pas de profondeur concédée</span>
            <span className="font-mono font-bold text-emerald-300 shrink-0 ml-1">Zone Défensive</span>
          </div>
        </div>
      )}

      {/* Floating opacity watermark indicator for coaches */}
      <div className="absolute bottom-1 right-2 text-[8px] font-mono text-white/50 bg-slate-950/60 px-1 rounded pointer-events-none">
        Bloc: {activeZone.toUpperCase()} • Opacité: {opacity}%
      </div>
    </div>
  );
};
