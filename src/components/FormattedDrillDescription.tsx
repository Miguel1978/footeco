import React, { useState } from 'react';
import { 
  Users, 
  Target, 
  Sparkles, 
  CheckCircle2, 
  ArrowRight, 
  Layers, 
  Copy, 
  Check, 
  Shield, 
  Flame, 
  Zap,
  Info
} from 'lucide-react';
import { splitDrillDescription, DrillSubAtelier } from '../utils/drillDescription';

interface FormattedDrillDescriptionProps {
  description: string;
  drawing1Caption?: string;
  drawing2Caption?: string;
  drawing1Coach?: string;
  drawing2Coach?: string;
  selectedSlotKey?: string; // 'Dessin 1' | 'Dessin 2' | 'Complet'
  onSelectSlot?: (slot: 'Dessin 1' | 'Dessin 2' | 'Complet') => void;
  className?: string;
}

export const FormattedDrillDescription: React.FC<FormattedDrillDescriptionProps> = ({
  description = '',
  drawing1Caption = '',
  drawing2Caption = '',
  drawing1Coach = '',
  drawing2Coach = '',
  selectedSlotKey = 'Complet',
  onSelectSlot,
  className = '',
}) => {
  const [copiedSlot, setCopiedSlot] = useState<string | null>(null);
  const [displayMode, setDisplayMode] = useState<'both' | 'dessin1' | 'dessin2'>(() => {
    if (selectedSlotKey === 'Dessin 1') return 'dessin1';
    if (selectedSlotKey === 'Dessin 2') return 'dessin2';
    return 'both';
  });

  const parsed = splitDrillDescription(
    description,
    drawing1Caption,
    drawing2Caption,
    drawing1Coach,
    drawing2Coach
  );

  const handleCopy = (text: string, label: string) => {
    navigator.clipboard?.writeText(text);
    setCopiedSlot(label);
    setTimeout(() => setCopiedSlot(null), 2000);
  };

  const renderAtelierCard = (atelier: DrillSubAtelier, isSlot1: boolean) => {
    const isSlot1Theme = isSlot1;
    const borderClass = isSlot1Theme 
      ? 'border-red-200 bg-gradient-to-b from-red-50/70 to-white' 
      : 'border-blue-200 bg-gradient-to-b from-blue-50/70 to-white';
    const headerBg = isSlot1Theme 
      ? 'bg-red-700 text-white' 
      : 'bg-blue-700 text-white';
    const badgeBg = isSlot1Theme 
      ? 'bg-red-100 text-red-800 border-red-200' 
      : 'bg-blue-100 text-blue-800 border-blue-200';
    const coachBg = isSlot1Theme
      ? 'bg-red-900/10 text-red-900 border-red-200'
      : 'bg-blue-900/10 text-blue-900 border-blue-200';

    return (
      <div 
        key={atelier.id}
        className={`rounded-2xl border ${borderClass} p-3.5 sm:p-4 shadow-xs space-y-3 transition-all relative overflow-hidden`}
      >
        {/* Top Header with Badge, Coach & Title */}
        <div className="flex items-start justify-between gap-2 border-b pb-2.5 border-slate-200/80">
          <div className="space-y-1">
            <div className="flex items-center gap-2 flex-wrap">
              <span className={`px-2.5 py-0.5 rounded-full text-[10px] font-black uppercase tracking-wider flex items-center gap-1.5 shadow-2xs ${headerBg}`}>
                <span>{isSlot1Theme ? '🔴' : '🔵'}</span>
                <span>{isSlot1Theme ? 'Atelier 1 (Dessin 1)' : 'Atelier 2 (Dessin 2)'}</span>
              </span>

              {atelier.coach && (
                <span className={`text-[10px] font-extrabold px-2 py-0.5 rounded-md border flex items-center gap-1 ${coachBg}`}>
                  <Users className="w-2.5 h-2.5" />
                  Coach : {atelier.coach}
                </span>
              )}
            </div>

            {atelier.title && (
              <h5 className="text-xs sm:text-sm font-extrabold text-slate-900 mt-1 flex items-center gap-1.5">
                <Target className={`w-3.5 h-3.5 ${isSlot1Theme ? 'text-red-600' : 'text-blue-600'}`} />
                <span>{atelier.title}</span>
              </h5>
            )}
          </div>

          <button
            type="button"
            onClick={() => handleCopy(atelier.rawText, atelier.slotName)}
            className="p-1.5 hover:bg-white text-slate-500 hover:text-slate-800 border border-slate-200 rounded-lg text-[10px] transition-colors flex items-center gap-1 cursor-pointer flex-shrink-0"
            title="Copier la description de cet atelier"
          >
            {copiedSlot === atelier.slotName ? (
              <Check className="w-3 h-3 text-emerald-600" />
            ) : (
              <Copy className="w-3 h-3" />
            )}
            <span className="text-[10px] font-semibold hidden sm:inline">Copier</span>
          </button>
        </div>

        {/* Structured Body */}
        <div className="space-y-2.5 text-xs text-slate-800 leading-relaxed">
          {/* Main paragraphs */}
          {atelier.cleanParagraphs.map((p, idx) => (
            <p key={idx} className="whitespace-pre-line text-slate-700 font-medium">
              {p}
            </p>
          ))}

          {/* Rules & Consignes */}
          {atelier.rules.length > 0 && (
            <div className="bg-white/90 rounded-xl p-2.5 border border-slate-200/90 shadow-2xs space-y-1">
              <div className="flex items-center gap-1.5 text-[11px] font-black text-slate-800 uppercase tracking-wider">
                <Zap className="w-3 h-3 text-amber-500" />
                <span>Consignes & Fonctionnement :</span>
              </div>
              <ul className="space-y-1 pl-1">
                {atelier.rules.map((r, rIdx) => (
                  <li key={rIdx} className="flex items-start gap-1.5 text-[11.5px] text-slate-700">
                    <span className="text-slate-400 mt-0.5">•</span>
                    <span>{r}</span>
                  </li>
                ))}
              </ul>
            </div>
          )}

          {/* Variants & Evolutions */}
          {atelier.variants.length > 0 && (
            <div className="bg-amber-50/60 rounded-xl p-2.5 border border-amber-200/80 space-y-1">
              <div className="flex items-center gap-1.5 text-[11px] font-black text-amber-900 uppercase tracking-wider">
                <Sparkles className="w-3 h-3 text-amber-600" />
                <span>Variantes & Évolutions FootEco :</span>
              </div>
              <ul className="space-y-1 pl-1">
                {atelier.variants.map((v, vIdx) => (
                  <li key={vIdx} className="flex items-start gap-1.5 text-[11.5px] text-amber-950">
                    <span className="text-amber-500 mt-0.5">→</span>
                    <span>{v}</span>
                  </li>
                ))}
              </ul>
            </div>
          )}

          {/* Coaching points */}
          {atelier.coachingPoints.length > 0 && (
            <div className="bg-emerald-50/60 rounded-xl p-2.5 border border-emerald-200/80 space-y-1">
              <div className="flex items-center gap-1.5 text-[11px] font-black text-emerald-900 uppercase tracking-wider">
                <CheckCircle2 className="w-3 h-3 text-emerald-600" />
                <span>Points de Vigilance Éducateur :</span>
              </div>
              <ul className="space-y-1 pl-1">
                {atelier.coachingPoints.map((c, cIdx) => (
                  <li key={cIdx} className="flex items-start gap-1.5 text-[11.5px] text-emerald-950 font-medium">
                    <span className="text-emerald-500 mt-0.5">✓</span>
                    <span>{c}</span>
                  </li>
                ))}
              </ul>
            </div>
          )}
        </div>
      </div>
    );
  };

  // If there are two sub-ateliers, show the rich separated layout
  if (parsed.isSplit && parsed.atelier1 && parsed.atelier2) {
    return (
      <div className={`space-y-3 ${className}`}>
        {/* Toggle Selector for clear Atelier 1 vs Atelier 2 view */}
        <div className="flex items-center justify-between gap-2 flex-wrap bg-slate-100/90 p-1.5 rounded-xl border border-slate-200">
          <div className="flex items-center gap-1 text-[11px] font-extrabold text-slate-700 px-1">
            <Layers className="w-3.5 h-3.5 text-slate-500" />
            <span>Affichage :</span>
          </div>

          <div className="flex items-center gap-1">
            <button
              type="button"
              onClick={() => {
                setDisplayMode('both');
                onSelectSlot?.('Complet');
              }}
              className={`px-2.5 py-1 rounded-lg text-xs font-black transition-all cursor-pointer flex items-center gap-1 ${
                displayMode === 'both'
                  ? 'bg-slate-900 text-white shadow-xs'
                  : 'bg-white text-slate-700 hover:bg-slate-200 border border-slate-200'
              }`}
            >
              <span>⚡ Les 2 Ateliers Séparés</span>
            </button>

            <button
              type="button"
              onClick={() => {
                setDisplayMode('dessin1');
                onSelectSlot?.('Dessin 1');
              }}
              className={`px-2.5 py-1 rounded-lg text-xs font-black transition-all cursor-pointer flex items-center gap-1 ${
                displayMode === 'dessin1'
                  ? 'bg-red-700 text-white shadow-xs'
                  : 'bg-white text-slate-700 hover:bg-slate-200 border border-slate-200'
              }`}
            >
              <span>🔴 Atelier 1</span>
            </button>

            <button
              type="button"
              onClick={() => {
                setDisplayMode('dessin2');
                onSelectSlot?.('Dessin 2');
              }}
              className={`px-2.5 py-1 rounded-lg text-xs font-black transition-all cursor-pointer flex items-center gap-1 ${
                displayMode === 'dessin2'
                  ? 'bg-blue-700 text-white shadow-xs'
                  : 'bg-white text-slate-700 hover:bg-slate-200 border border-slate-200'
              }`}
            >
              <span>🔵 Atelier 2</span>
            </button>
          </div>
        </div>

        {/* Separated Content Blocks */}
        {displayMode === 'both' ? (
          <div className="space-y-3.5">
            {renderAtelierCard(parsed.atelier1, true)}

            {/* Clear separator line */}
            <div className="relative flex items-center justify-center py-0.5">
              <div className="absolute inset-0 flex items-center">
                <div className="w-full border-t border-dashed border-slate-300" />
              </div>
              <div className="relative bg-white px-3 py-0.5 rounded-full border border-slate-200 text-[10px] font-extrabold text-slate-500 uppercase flex items-center gap-1 shadow-2xs">
                <span>🔄 Rotation / 2e Atelier</span>
              </div>
            </div>

            {renderAtelierCard(parsed.atelier2, false)}
          </div>
        ) : displayMode === 'dessin1' ? (
          renderAtelierCard(parsed.atelier1, true)
        ) : (
          renderAtelierCard(parsed.atelier2, false)
        )}
      </div>
    );
  }

  // Fallback for single atelier (e.g., Match 7v7 or unstructured text)
  return (
    <div className={`bg-gradient-to-b from-slate-50 to-white rounded-2xl border border-slate-200 p-4 shadow-xs space-y-3 ${className}`}>
      <div className="flex items-center justify-between border-b pb-2 border-slate-200/80">
        <div className="flex items-center gap-2">
          <span className="px-2.5 py-0.5 rounded-full text-[10px] font-black uppercase tracking-wider bg-slate-800 text-white">
            ⚽ Description de l'atelier
          </span>
          {drawing1Caption && (
            <span className="text-xs font-extrabold text-slate-800">
              {drawing1Caption}
            </span>
          )}
        </div>

        <button
          type="button"
          onClick={() => handleCopy(description, 'single')}
          className="p-1 hover:bg-slate-100 text-slate-500 rounded text-[10px] flex items-center gap-1 cursor-pointer"
        >
          {copiedSlot === 'single' ? <Check className="w-3 h-3 text-emerald-600" /> : <Copy className="w-3 h-3" />}
          <span className="hidden sm:inline">Copier</span>
        </button>
      </div>

      <div className="text-xs text-slate-800 whitespace-pre-line leading-relaxed font-medium">
        {description}
      </div>
    </div>
  );
};
