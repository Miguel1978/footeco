import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence, LayoutGroup } from 'motion/react';
import { 
  Star, 
  Bookmark, 
  Sparkles, 
  Sliders, 
  Shield, 
  Check, 
  ArrowRightLeft, 
  Info, 
  ChevronDown, 
  ChevronUp,
  RotateCcw,
  Zap,
  Users,
  UserPlus,
  Plus,
  X,
  Camera,
  Download,
  Loader2,
  Maximize2,
  Minimize2,
  PenTool,
  Undo2,
  Trash2,
  Magnet,
  Play,
  Layers,
  Compass,
  Target,
  ArrowRight
} from 'lucide-react';
import html2canvas from 'html2canvas-pro';
import { TacticalDrawingCanvas, TacticalDrawTool, TacticalStroke } from './TacticalDrawingCanvas';
import { PressingZonesOverlay, PressingZoneType } from './PressingZonesOverlay';
import { InteractiveTacticalArrows, TacticalArrow, ArrowType } from './InteractiveTacticalArrows';
import { PeriodMatch, PlayerSlot, Player } from '../types';
import { PlayerAvatar } from './PlayerAvatar';
import { 
  TacticalFavorite, 
  loadTacticalFavorites, 
  loadActiveFavoriteId, 
  saveActiveFavoriteId,
  DEFAULT_TACTICAL_FAVORITES,
  BASE_TACTICAL_TEMPLATES 
} from '../utils/tacticalFavorites';
import { TacticalFavoritesModal } from './TacticalFavoritesModal';
import { 
  calculateTeamPlaytime, 
  generatePeriodRotationSuggestions, 
  executeSingleRotationSwap 
} from '../utils/rotationBalancer';
import { RotationSuggestionModal } from './RotationSuggestionModal';

interface PitchTacticalViewProps {
  period: PeriodMatch;
  roster?: Player[];
  allPeriods?: PeriodMatch[];
  onUpdatePeriod?: (updatedPeriod: PeriodMatch) => void;
  onUpdateAllPeriods?: (updatedPeriods: PeriodMatch[]) => void;
}

export const PitchTacticalView: React.FC<PitchTacticalViewProps> = ({ 
  period, 
  roster = [], 
  allPeriods = [],
  onUpdatePeriod,
  onUpdateAllPeriods
}) => {
  const [favorites, setFavorites] = useState<TacticalFavorite[]>(() => loadTacticalFavorites());
  const [team1FavId, setTeam1FavId] = useState<'fav-1' | 'fav-2' | 'fav-3'>(() => loadActiveFavoriteId());
  const [team2FavId, setTeam2FavId] = useState<'fav-1' | 'fav-2' | 'fav-3'>(() => loadActiveFavoriteId());
  const [applyScope, setApplyScope] = useState<'both' | 'team1' | 'team2'>('both');
  const [isManageModalOpen, setIsManageModalOpen] = useState(false);
  const [isRotationModalOpen, setIsRotationModalOpen] = useState(false);
  const [rotationTargetTeam, setRotationTargetTeam] = useState<'team1' | 'team2'>('team1');
  const [selectedPlayerForSwap, setSelectedPlayerForSwap] = useState<{
    team: 'team1' | 'team2';
    type: 'starter' | 'sub';
    index: number;
    name: string;
  } | null>(null);
  const [toastMessage, setToastMessage] = useState<string | null>(null);
  const [showTacticalDetails, setShowTacticalDetails] = useState<boolean>(false);

  // Tactical Drawing Canvas Mode state
  const [isDrawingMode, setIsDrawingMode] = useState<boolean>(false);
  const [drawTool, setDrawTool] = useState<TacticalDrawTool>('run');
  const [drawColor, setDrawColor] = useState<string>('#FACC15');
  const [drawLineWidth, setDrawLineWidth] = useState<number>(3.5);
  const [team1Strokes, setTeam1Strokes] = useState<TacticalStroke[]>([]);
  const [team2Strokes, setTeam2Strokes] = useState<TacticalStroke[]>([]);

  // Pressing Zones & Block state and opacity controls (range 0 to 100%)
  const [activePressingZone, setActivePressingZone] = useState<PressingZoneType>('none');
  const [team1PressingZone, setTeam1PressingZone] = useState<PressingZoneType>('none');
  const [team2PressingZone, setTeam2PressingZone] = useState<PressingZoneType>('none');
  const [pressingOpacity, setPressingOpacity] = useState<number>(55);
  const [showPressingControls, setShowPressingControls] = useState<boolean>(true);

  const handleSelectPressingZone = (zone: PressingZoneType, targetScope?: 'both' | 'team1' | 'team2') => {
    setActivePressingZone(zone);
    const scope = targetScope || applyScope;
    if (scope === 'both') {
      setTeam1PressingZone(zone);
      setTeam2PressingZone(zone);
    } else if (scope === 'team1') {
      setTeam1PressingZone(zone);
    } else {
      setTeam2PressingZone(zone);
    }

    if (zone === 'high') {
      setToastMessage("Zone Haute activée : Pressing haut & harcèlement de la relance adverse");
    } else if (zone === 'mid') {
      setToastMessage("Zone Médiane activée : Bloc médian & compacité axiale");
    } else if (zone === 'low') {
      setToastMessage("Zone Basse activée : Bloc bas & protection de la surface");
    } else if (zone === 'all') {
      setToastMessage("3 Blocs activés : Découpage complet des 3 tiers de jeu");
    } else {
      setToastMessage("Zones de pressing masquées");
    }
    setTimeout(() => setToastMessage(null), 2500);
  };

  // Interactive Tactical Arrows (Pass trajectories & Off-the-ball runs between players)
  const [isArrowModeActive, setIsArrowModeActive] = useState<boolean>(false);
  const [arrowTool, setArrowTool] = useState<ArrowType>('pass');
  const [arrowColor, setArrowColor] = useState<string>('#FACC15');
  const [team1Arrows, setTeam1Arrows] = useState<TacticalArrow[]>([]);
  const [team2Arrows, setTeam2Arrows] = useState<TacticalArrow[]>([]);

  const handleUndoArrow = () => {
    if (applyScope === 'team2' || (applyScope === 'both' && team2Arrows.length > 0)) {
      setTeam2Arrows(prev => prev.slice(0, -1));
    } else if (team1Arrows.length > 0) {
      setTeam1Arrows(prev => prev.slice(0, -1));
    }
  };

  const handleClearAllArrows = () => {
    setTeam1Arrows([]);
    setTeam2Arrows([]);
    setToastMessage("Toutes les flèches tactiques ont été effacées");
    setTimeout(() => setToastMessage(null), 2500);
  };

  const handleApplyArrowPreset = (presetType: 'one-two' | 'overlap' | 'through-ball', targetTeam: 'team1' | 'team2') => {
    const isT1 = targetTeam === 'team1';
    const mainColor = isT1 ? '#FACC15' : '#EF4444';
    let newArrows: TacticalArrow[] = [];

    if (presetType === 'one-two') {
      newArrows = [
        {
          id: `preset-pass1-${Date.now()}`,
          type: 'pass',
          team: targetTeam,
          color: mainColor,
          startX: 50,
          startY: 55,
          endX: 50,
          endY: 25,
          startRole: 'Milieu Axe',
          endRole: 'Attaquant',
          label: 'Passe d\'appui',
          curve: 0
        },
        {
          id: `preset-run1-${Date.now() + 1}`,
          type: 'run',
          team: targetTeam,
          color: '#38BDF8',
          startX: 50,
          startY: 55,
          endX: 38,
          endY: 28,
          startRole: 'Milieu Axe',
          label: 'Course de soutien',
          curve: -8
        },
        {
          id: `preset-pass2-${Date.now() + 2}`,
          type: 'pass',
          team: targetTeam,
          color: mainColor,
          startX: 50,
          startY: 25,
          endX: 38,
          endY: 28,
          startRole: 'Attaquant',
          endRole: 'Milieu Axe',
          label: 'Remise 1-2',
          curve: 0
        }
      ];
    } else if (presetType === 'through-ball') {
      newArrows = [
        {
          id: `preset-run-tb-${Date.now()}`,
          type: 'run',
          team: targetTeam,
          color: '#38BDF8',
          startX: 50,
          startY: 25,
          endX: 68,
          endY: 12,
          startRole: 'Attaquant',
          label: 'Appel en profondeur',
          curve: 6
        },
        {
          id: `preset-pass-tb-${Date.now() + 1}`,
          type: 'pass',
          team: targetTeam,
          color: mainColor,
          startX: 50,
          startY: 55,
          endX: 68,
          endY: 12,
          startRole: 'Milieu Axe',
          endRole: 'Attaquant',
          label: 'Passe dans le dos',
          curve: 0
        }
      ];
    } else if (presetType === 'overlap') {
      newArrows = [
        {
          id: `preset-pass-ol-${Date.now()}`,
          type: 'pass',
          team: targetTeam,
          color: mainColor,
          startX: 50,
          startY: 55,
          endX: 78,
          endY: 48,
          startRole: 'Milieu Axe',
          endRole: 'Couloir Droit',
          label: 'Écartement couloir',
          curve: 0
        },
        {
          id: `preset-run-ol-${Date.now() + 1}`,
          type: 'run',
          team: targetTeam,
          color: '#38BDF8',
          startX: 72,
          startY: 75,
          endX: 86,
          endY: 28,
          startRole: 'Défenseur',
          label: 'Course de dédoublement',
          curve: 14
        }
      ];
    }

    if (isT1) {
      setTeam1Arrows(prev => [...prev, ...newArrows]);
    } else {
      setTeam2Arrows(prev => [...prev, ...newArrows]);
    }

    setToastMessage(`Combinaison "${presetType === 'one-two' ? 'Une-Deux (1-2)' : presetType === 'through-ball' ? 'Appel en profondeur' : 'Dédoublement couloir'}" ajoutée !`);
    setTimeout(() => setToastMessage(null), 2500);
  };

  const handleUndoStroke = () => {
    if (team2Strokes.length > 0) {
      setTeam2Strokes(prev => prev.slice(0, -1));
    } else if (team1Strokes.length > 0) {
      setTeam1Strokes(prev => prev.slice(0, -1));
    }
  };

  const handleClearAllStrokes = () => {
    setTeam1Strokes([]);
    setTeam2Strokes([]);
    setToastMessage("Tous les tracés tactiques ont été effacés");
    setTimeout(() => setToastMessage(null), 2500);
  };

  // Substitutes visibility & assignment state
  const [showSubstitutesNames, setShowSubstitutesNames] = useState<boolean>(true);
  const [assignSubMenuTeam, setAssignSubMenuTeam] = useState<'team1' | 'team2' | null>(null);

  // PNG Screenshot & Export state & refs
  const [isExportingPng, setIsExportingPng] = useState<boolean>(false);
  const [exportMenuOpen, setExportMenuOpen] = useState<boolean>(false);
  const rootTacticalViewRef = useRef<HTMLDivElement>(null);
  const tacticalBoardRef = useRef<HTMLDivElement>(null);
  const team1PitchContainerRef = useRef<HTMLDivElement>(null);
  const team2PitchContainerRef = useRef<HTMLDivElement>(null);
  const team1PitchRef = useRef<HTMLDivElement>(null);
  const team2PitchRef = useRef<HTMLDivElement>(null);
  const exportDropdownRef = useRef<HTMLDivElement>(null);

  // Close export menu when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (exportDropdownRef.current && !exportDropdownRef.current.contains(event.target as Node)) {
        setExportMenuOpen(false);
      }
    };
    if (exportMenuOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    }
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [exportMenuOpen]);

  // Export current tactical diagram as a high-resolution PNG image
  const handleExportPng = async (target: 'board' | 'full' | 'team1' | 'team2' = 'board') => {
    if (isExportingPng) return;
    setIsExportingPng(true);
    setExportMenuOpen(false);

    try {
      let targetElement: HTMLElement | null = null;
      let filename = '';

      if (target === 'team1') {
        targetElement = team1PitchContainerRef.current || team1PitchRef.current;
        const teamName = (period.team1.teamName || 'Equipe1').trim().replace(/[^a-zA-Z0-9_-]/g, '_');
        filename = `schema-tactique-P${period.periodNumber}-${teamName}-${currentTeam1Fav.code}.png`;
      } else if (target === 'team2') {
        targetElement = team2PitchContainerRef.current || team2PitchRef.current;
        const teamName = (period.team2.teamName || 'Equipe2').trim().replace(/[^a-zA-Z0-9_-]/g, '_');
        filename = `schema-tactique-P${period.periodNumber}-${teamName}-${currentTeam2Fav.code}.png`;
      } else if (target === 'full') {
        targetElement = rootTacticalViewRef.current || document.querySelector<HTMLElement>('.pitch-tactical-view');
        filename = `vue-tactique-P${period.periodNumber}-${currentTeam1Fav.code}_${currentTeam2Fav.code}.png`;
      } else {
        // 'board': captures the 2 pitches board with title and lineups
        targetElement = tacticalBoardRef.current || rootTacticalViewRef.current || document.querySelector<HTMLElement>('.pitch-tactical-view');
        filename = `schema-tactique-P${period.periodNumber}-${currentTeam1Fav.code}_${currentTeam2Fav.code}.png`;
      }

      if (!targetElement) {
        throw new Error('Élément tactique introuvable pour la capture');
      }

      setToastMessage("Capture du schéma tactique en cours...");

      const canvas = await html2canvas(targetElement, {
        scale: 2,
        useCORS: true,
        logging: false,
        backgroundColor: '#090d16',
        ignoreElements: (element) => {
          return element.getAttribute('data-html2canvas-ignore') === 'true' ||
                 element.classList.contains('tactical-export-dropdown');
        }
      });

      const dataUrl = canvas.toDataURL('image/png');
      const link = document.createElement('a');
      link.download = filename;
      link.href = dataUrl;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);

      setToastMessage(`Schéma tactique exporté en PNG (${filename}) !`);
      setTimeout(() => setToastMessage(null), 3500);
    } catch (error) {
      console.error('[PitchTacticalView] Erreur capture PNG:', error);
      setToastMessage("Erreur lors de l'export PNG du schéma tactique.");
      setTimeout(() => setToastMessage(null), 3000);
    } finally {
      setIsExportingPng(false);
    }
  };

  // Fullscreen briefing mode state & controls
  const [isFullscreen, setIsFullscreen] = useState<boolean>(false);

  const toggleFullscreen = async () => {
    if (!isFullscreen) {
      setIsFullscreen(true);
      try {
        if (rootTacticalViewRef.current && !document.fullscreenElement) {
          if (rootTacticalViewRef.current.requestFullscreen) {
            await rootTacticalViewRef.current.requestFullscreen().catch(() => {});
          }
        }
      } catch {
        // Fallback gracefully handled by CSS fullscreen layout
      }
    } else {
      setIsFullscreen(false);
      try {
        if (document.fullscreenElement && document.exitFullscreen) {
          await document.exitFullscreen().catch(() => {});
        }
      } catch {
        // Fallback
      }
    }
  };

  // Listen for Escape key and browser fullscreen changes
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && isFullscreen) {
        setIsFullscreen(false);
      }
    };
    const handleFullscreenChange = () => {
      if (!document.fullscreenElement && isFullscreen) {
        setIsFullscreen(false);
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    document.addEventListener('fullscreenchange', handleFullscreenChange);
    return () => {
      window.removeEventListener('keydown', handleKeyDown);
      document.removeEventListener('fullscreenchange', handleFullscreenChange);
    };
  }, [isFullscreen]);

  // Lock background scroll when fullscreen is active
  useEffect(() => {
    if (isFullscreen) {
      const originalOverflow = document.body.style.overflow;
      document.body.style.overflow = 'hidden';
      return () => {
        document.body.style.overflow = originalOverflow;
      };
    }
  }, [isFullscreen]);

  // Playtime calculation over the 4 periods
  const effectiveAllPeriods = allPeriods && allPeriods.length > 0 ? allPeriods : [period];
  const t1Summary = calculateTeamPlaytime(effectiveAllPeriods, period.id, 'team1');
  const t2Summary = calculateTeamPlaytime(effectiveAllPeriods, period.id, 'team2');
  const t1Suggestions = generatePeriodRotationSuggestions(effectiveAllPeriods, period, 'team1');
  const t2Suggestions = generatePeriodRotationSuggestions(effectiveAllPeriods, period, 'team2');

  // Drag-and-drop state
  const [draggedPlayer, setDraggedPlayer] = useState<{
    team: 'team1' | 'team2';
    type: 'starter' | 'sub';
    index: number;
  } | null>(null);

  // Magnetic Snapping state & helpers
  const [isMagneticSnappingEnabled, setIsMagneticSnappingEnabled] = useState<boolean>(true);
  const [snappedSlotTarget, setSnappedSlotTarget] = useState<{
    team: 'team1' | 'team2';
    slotIndex: number;
    role: string;
  } | null>(null);

  // Calculates the nearest tactical slot on the field and triggers magnetic snapping
  const handlePitchDragOver = (e: React.DragEvent<HTMLDivElement>, team: 'team1' | 'team2') => {
    e.preventDefault();
    if (!draggedPlayer || draggedPlayer.team !== team || !isMagneticSnappingEnabled) return;

    const pitchContainer = team === 'team1' ? team1PitchRef.current : team2PitchRef.current;
    if (!pitchContainer) return;

    const slotElements = pitchContainer.querySelectorAll<HTMLElement>(`[data-tactical-slot="${team}"]`);
    if (!slotElements || slotElements.length === 0) return;

    let closest: { slotIndex: number; role: string; distance: number } | null = null;

    slotElements.forEach((el) => {
      const rect = el.getBoundingClientRect();
      const centerX = rect.left + rect.width / 2;
      const centerY = rect.top + rect.height / 2;
      const distance = Math.hypot(e.clientX - centerX, e.clientY - centerY);

      if (!closest || distance < closest.distance) {
        closest = {
          slotIndex: Number(el.dataset.slotIndex),
          role: el.dataset.slotRole || '',
          distance,
        };
      }
    });

    // Magnetic snap attraction radius: within 130px
    if (closest && closest.distance < 130) {
      if (!snappedSlotTarget || snappedSlotTarget.slotIndex !== closest.slotIndex || snappedSlotTarget.team !== team) {
        setSnappedSlotTarget({
          team,
          slotIndex: closest.slotIndex,
          role: closest.role,
        });
      }
    } else {
      if (snappedSlotTarget && snappedSlotTarget.team === team) {
        setSnappedSlotTarget(null);
      }
    }
  };

  const handlePitchDrop = (team: 'team1' | 'team2') => {
    if (draggedPlayer && draggedPlayer.team === team && snappedSlotTarget && isMagneticSnappingEnabled) {
      executeSwap(team, draggedPlayer, { type: 'starter', index: snappedSlotTarget.slotIndex });
      setToastMessage(`Joueur aimanté au poste : ${snappedSlotTarget.role}`);
      setTimeout(() => setToastMessage(null), 2200);
      setDraggedPlayer(null);
      setSnappedSlotTarget(null);
    }
  };

  const handleDragEnd = () => {
    setDraggedPlayer(null);
    setSnappedSlotTarget(null);
  };

  // Formation deployment animation state
  const [deploymentState, setDeploymentState] = useState<{
    team: 'team1' | 'team2' | 'both';
    fromCode: string;
    toCode: string;
  } | null>(null);
  const deploymentTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    return () => {
      if (deploymentTimeoutRef.current) {
        clearTimeout(deploymentTimeoutRef.current);
      }
    };
  }, []);

  const triggerFormationDeployment = (team: 'team1' | 'team2' | 'both', fromCode: string, toCode: string) => {
    if (deploymentTimeoutRef.current) {
      clearTimeout(deploymentTimeoutRef.current);
    }
    setDeploymentState({
      team,
      fromCode,
      toCode,
    });
    deploymentTimeoutRef.current = setTimeout(() => {
      setDeploymentState(null);
    }, 1800);
  };

  // Resolve active favorite objects
  const fav1 = favorites.find(f => f.id === 'fav-1') || DEFAULT_TACTICAL_FAVORITES[0];
  const fav2 = favorites.find(f => f.id === 'fav-2') || DEFAULT_TACTICAL_FAVORITES[1];
  const fav3 = favorites.find(f => f.id === 'fav-3') || DEFAULT_TACTICAL_FAVORITES[2];

  const currentTeam1Fav = favorites.find(f => f.id === team1FavId) || fav1;
  const currentTeam2Fav = favorites.find(f => f.id === team2FavId) || fav1;

  // Handle switching active tactical favorite with fluid deployment animation
  const handleSelectFavorite = (favId: 'fav-1' | 'fav-2' | 'fav-3', targetTeamOverride?: 'team1' | 'team2' | 'both') => {
    saveActiveFavoriteId(favId);
    const scope = targetTeamOverride || applyScope;
    const targetFav = favorites.find(f => f.id === favId) || DEFAULT_TACTICAL_FAVORITES[0];
    const prevT1 = currentTeam1Fav.code;
    const prevT2 = currentTeam2Fav.code;

    if (scope === 'both') {
      setTeam1FavId(favId);
      setTeam2FavId(favId);
      triggerFormationDeployment('both', prevT1 !== targetFav.code ? prevT1 : prevT2, targetFav.code);
    } else if (scope === 'team1') {
      setTeam1FavId(favId);
      triggerFormationDeployment('team1', prevT1, targetFav.code);
    } else {
      setTeam2FavId(favId);
      triggerFormationDeployment('team2', prevT2, targetFav.code);
    }

    setToastMessage(`Déploiement fluide du schéma ${targetFav.code} (${targetFav.name})`);
    setTimeout(() => setToastMessage(null), 2500);
  };

  // Direct formation code switcher (e.g. 2-3-1, 3-2-1, 3-1-2, 2-2-2) with fluid deployment animation
  const handleSwitchFormationCode = (team: 'team1' | 'team2' | 'both', targetCode: string) => {
    const existingFav = favorites.find(f => f.code === targetCode);
    const prevCode = team === 'team2' ? currentTeam2Fav.code : currentTeam1Fav.code;

    if (existingFav) {
      handleSelectFavorite(existingFav.id, team);
      return;
    }

    const template = BASE_TACTICAL_TEMPLATES[targetCode];
    if (!template) return;

    // Apply template into the corresponding favorite slot
    const targetFavId = team === 'team2' ? team2FavId : team1FavId;
    const updated = favorites.map(f => {
      if (f.id === targetFavId) {
        return {
          ...f,
          code: template.code,
          name: template.name,
          badge: template.badge,
          description: template.description,
          coachingTips: template.coachingTips,
          lines: template.lines,
        };
      }
      return f;
    });

    setFavorites(updated);
    triggerFormationDeployment(team, prevCode, targetCode);
    setToastMessage(`Déploiement fluide du schéma ${targetCode} (${template.name})`);
    setTimeout(() => setToastMessage(null), 2500);
  };

  // Handle player swapping
  const handlePlayerClick = (
    team: 'team1' | 'team2',
    type: 'starter' | 'sub',
    index: number,
    slot?: PlayerSlot
  ) => {
    if (!onUpdatePeriod) return;

    if (!selectedPlayerForSwap) {
      // First click: select player
      const name = slot?.playerName || (type === 'starter' ? `Titulaire ${index + 1}` : `Remplaçant ${index + 1}`);
      setSelectedPlayerForSwap({ team, type, index, name });
    } else {
      // Second click: if same player, cancel selection
      if (
        selectedPlayerForSwap.team === team &&
        selectedPlayerForSwap.type === type &&
        selectedPlayerForSwap.index === index
      ) {
        setSelectedPlayerForSwap(null);
        return;
      }

      // If different teams, prevent cross-team direct swap for safety unless intended
      if (selectedPlayerForSwap.team !== team) {
        // Switch selection to this new team player
        const name = slot?.playerName || (type === 'starter' ? `Titulaire ${index + 1}` : `Remplaçant ${index + 1}`);
        setSelectedPlayerForSwap({ team, type, index, name });
        return;
      }

      // Perform swap within the same team
      executeSwap(team, selectedPlayerForSwap, { type, index });
      setSelectedPlayerForSwap(null);
    }
  };

  const executeSwap = (
    team: 'team1' | 'team2',
    source: { type: 'starter' | 'sub'; index: number; name?: string },
    target: { type: 'starter' | 'sub'; index: number }
  ) => {
    if (!onUpdatePeriod) return;
    const currentTeam = period[team];
    const newStarters = [...currentTeam.titulaires];
    const newSubs = [...currentTeam.remplacants];

    if (source.type === 'starter' && target.type === 'starter') {
      const temp = newStarters[source.index];
      newStarters[source.index] = newStarters[target.index];
      newStarters[target.index] = temp;
    } else if (source.type === 'starter' && target.type === 'sub') {
      const temp = newStarters[source.index];
      newStarters[source.index] = newSubs[target.index];
      newSubs[target.index] = temp;
    } else if (source.type === 'sub' && target.type === 'starter') {
      const temp = newSubs[source.index];
      newSubs[source.index] = newStarters[target.index];
      newStarters[target.index] = temp;
    }

    const updatedPeriod: PeriodMatch = {
      ...period,
      [team]: {
        ...currentTeam,
        titulaires: newStarters,
        remplacants: newSubs,
      },
    };
    onUpdatePeriod(updatedPeriod);
    setToastMessage(`Postes permutés dans ${currentTeam.teamName || team} !`);
    setTimeout(() => setToastMessage(null), 2000);
  };

  // List of players in roster who are not assigned in this period
  const t1AssignedNames = new Set(
    [...period.team1.titulaires, ...period.team1.remplacants]
      .map(s => s.playerName?.trim().toLowerCase())
      .filter(Boolean)
  );
  const t1AvailableRoster = roster.filter(p => !t1AssignedNames.has(p.name.trim().toLowerCase()));

  const t2AssignedNames = new Set(
    [...period.team2.titulaires, ...period.team2.remplacants]
      .map(s => s.playerName?.trim().toLowerCase())
      .filter(Boolean)
  );
  const t2AvailableRoster = roster.filter(p => !t2AssignedNames.has(p.name.trim().toLowerCase()));

  const handleAddSubFromRoster = (team: 'team1' | 'team2', player: Player) => {
    if (!onUpdatePeriod) return;
    const currentTeam = period[team];
    const newSub: PlayerSlot = {
      id: `${team}-sub-${Date.now()}`,
      playerId: player.id,
      playerName: player.name,
      position: player.defaultPosition || 'Milieu',
      note: '',
      shootout: '',
    };
    const updatedPeriod: PeriodMatch = {
      ...period,
      [team]: {
        ...currentTeam,
        remplacants: [...currentTeam.remplacants, newSub],
      },
    };
    onUpdatePeriod(updatedPeriod);
    setAssignSubMenuTeam(null);
    setToastMessage(`${player.name} ajouté aux remplaçants de ${currentTeam.teamName || team} !`);
    setTimeout(() => setToastMessage(null), 2200);
  };

  const handleRemoveSub = (team: 'team1' | 'team2', subIndex: number) => {
    if (!onUpdatePeriod) return;
    const currentTeam = period[team];
    const targetSub = currentTeam.remplacants[subIndex];
    const subName = targetSub?.playerName || 'Remplaçant';
    const newSubs = currentTeam.remplacants.filter((_, idx) => idx !== subIndex);
    const updatedPeriod: PeriodMatch = {
      ...period,
      [team]: {
        ...currentTeam,
        remplacants: newSubs,
      },
    };
    onUpdatePeriod(updatedPeriod);
    setToastMessage(`${subName} retiré du banc des remplaçants`);
    setTimeout(() => setToastMessage(null), 2000);
  };

  // Apply the tactical positions from the active favorite to the match sheet
  const handleApplyPositionsToPeriod = (team: 'team1' | 'team2') => {
    if (!onUpdatePeriod) return;
    const fav = team === 'team1' ? currentTeam1Fav : currentTeam2Fav;
    const currentTeam = period[team];
    const updatedStarters = [...currentTeam.titulaires];

    fav.lines.forEach((line) => {
      line.slots.forEach((s) => {
        if (updatedStarters[s.slotIndex]) {
          updatedStarters[s.slotIndex] = {
            ...updatedStarters[s.slotIndex],
            position: s.position,
          };
        }
      });
    });

    const updatedPeriod: PeriodMatch = {
      ...period,
      [team]: {
        ...currentTeam,
        titulaires: updatedStarters,
      },
    };
    onUpdatePeriod(updatedPeriod);
    setToastMessage(`Postes officiels FootEco appliqués (${fav.code}) pour ${currentTeam.teamName} !`);
    setTimeout(() => setToastMessage(null), 2500);
  };

  const handleApplyPositionsBoth = () => {
    if (!onUpdatePeriod) return;
    let updatedPeriod = { ...period };

    // Team 1
    const t1Starters = [...period.team1.titulaires];
    currentTeam1Fav.lines.forEach((line) => {
      line.slots.forEach((s) => {
        if (t1Starters[s.slotIndex]) {
          t1Starters[s.slotIndex] = {
            ...t1Starters[s.slotIndex],
            position: s.position,
          };
        }
      });
    });
    updatedPeriod.team1 = { ...period.team1, titulaires: t1Starters };

    // Team 2
    const t2Starters = [...period.team2.titulaires];
    currentTeam2Fav.lines.forEach((line) => {
      line.slots.forEach((s) => {
        if (t2Starters[s.slotIndex]) {
          t2Starters[s.slotIndex] = {
            ...t2Starters[s.slotIndex],
            position: s.position,
          };
        }
      });
    });
    updatedPeriod.team2 = { ...period.team2, titulaires: t2Starters };

    onUpdatePeriod(updatedPeriod);
    setToastMessage(`Rôles tactiques synchronisés sur la feuille pour les 2 équipes !`);
    setTimeout(() => setToastMessage(null), 2500);
  };

  return (
    <div 
      ref={rootTacticalViewRef} 
      id="pitch-tactical-view" 
      className={`pitch-tactical-view space-y-4 mb-8 print:hidden transition-all duration-150 ${
        isFullscreen 
          ? 'fixed inset-0 z-50 bg-slate-950 overflow-y-auto p-3 sm:p-6 w-full h-full m-0 shadow-2xl' 
          : ''
      }`}
    >
      
      {/* Fullscreen Briefing Mode Top Bar */}
      {isFullscreen && (
        <div 
          data-html2canvas-ignore="true" 
          className="bg-gradient-to-r from-slate-900 via-indigo-950/80 to-slate-900 border border-indigo-500/40 rounded-2xl p-3 sm:px-5 flex flex-wrap items-center justify-between gap-3 shadow-2xl backdrop-blur-md sticky top-0 z-40"
        >
          <div className="flex items-center gap-3">
            <span className="flex h-3 w-3 relative shrink-0">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
              <span className="relative inline-flex rounded-full h-3 w-3 bg-emerald-500"></span>
            </span>
            <div>
              <div className="font-extrabold text-sm sm:text-base text-white flex items-center gap-2">
                <span>Briefing Tactique d'Avant-Match — Plein Écran</span>
                <span className="text-[10px] font-mono bg-emerald-500/20 text-emerald-300 border border-emerald-500/40 px-2 py-0.5 rounded-full font-bold">
                  Période {period.periodNumber} ({period.durationMinutes || 15} min)
                </span>
              </div>
              <p className="text-[11px] text-slate-400">
                Vue élargie pour tableau interactif et projection • Appuyez sur <kbd className="px-1.5 py-0.5 bg-slate-800 border border-slate-700 rounded text-slate-300 font-mono text-[10px]">Échap</kbd> pour quitter
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => handleExportPng('board')}
              disabled={isExportingPng}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 text-xs font-bold transition-all cursor-pointer disabled:opacity-50"
              title="Exporter le schéma actuel en PNG"
            >
              <Camera className="w-3.5 h-3.5 text-emerald-400" />
              <span>Capture PNG</span>
            </button>
            <button
              type="button"
              onClick={toggleFullscreen}
              className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl bg-rose-600 hover:bg-rose-500 text-white text-xs font-bold transition-all shadow-md active:scale-95 cursor-pointer"
              title="Quitter le mode plein écran (Échap)"
            >
              <Minimize2 className="w-3.5 h-3.5" />
              <span>Quitter plein écran</span>
            </button>
          </div>
        </div>
      )}

      {/* Tactical Favorites Toolbar */}
      <div className="bg-slate-900 text-white rounded-2xl p-4 border border-slate-800 shadow-md">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-3 pb-3.5 border-b border-slate-800">
          
          {/* Title & Badge */}
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-xl bg-amber-500 text-white flex items-center justify-center shadow-xs">
              <Bookmark className="w-4 h-4 fill-white text-white" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="font-extrabold text-sm text-white tracking-wide">
                  Favoris Tactiques 7v7
                </h3>
                <span className="text-[10px] bg-amber-500/20 text-amber-300 font-bold px-2 py-0.5 rounded-full border border-amber-500/30">
                  3 Schémas Rapides
                </span>
              </div>
              <p className="text-[11px] text-slate-400 mt-0.5">
                Chargez en 1 clic vos schémas préférentiels ou personnalisez vos 3 dispositions
              </p>
            </div>
          </div>

          {/* Controls: Target team & Manage favorites modal */}
          <div className="flex flex-wrap items-center gap-2">
            
            {/* Target Team Selector */}
            <div className="flex items-center bg-slate-800/90 rounded-xl p-1 border border-slate-700 text-xs">
              <span className="text-[10px] text-slate-400 font-bold px-2 hidden sm:inline">
                Appliquer à :
              </span>
              <button
                type="button"
                onClick={() => setApplyScope('both')}
                className={`px-2.5 py-1 rounded-lg font-bold text-[11px] transition-all cursor-pointer ${
                  applyScope === 'both'
                    ? 'bg-indigo-600 text-white shadow-xs'
                    : 'text-slate-400 hover:text-white'
                }`}
              >
                Les 2 équipes
              </button>
              <button
                type="button"
                onClick={() => setApplyScope('team1')}
                className={`px-2.5 py-1 rounded-lg font-bold text-[11px] transition-all flex items-center gap-1 cursor-pointer ${
                  applyScope === 'team1'
                    ? 'bg-yellow-400 text-slate-950 shadow-xs'
                    : 'text-slate-400 hover:text-white'
                }`}
              >
                <span className="w-2 h-2 rounded-full bg-yellow-400 inline-block" />
                <span>Eq. 1</span>
              </button>
              <button
                type="button"
                onClick={() => setApplyScope('team2')}
                className={`px-2.5 py-1 rounded-lg font-bold text-[11px] transition-all flex items-center gap-1 cursor-pointer ${
                  applyScope === 'team2'
                    ? 'bg-rose-600 text-white shadow-xs'
                    : 'text-slate-400 hover:text-white'
                }`}
              >
                <span className="w-2 h-2 rounded-full bg-rose-500 inline-block" />
                <span>Eq. 2</span>
              </button>
            </div>

            {/* Manage & Customize button */}
            <button
              type="button"
              onClick={() => setIsManageModalOpen(true)}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 hover:border-slate-600 text-xs font-bold transition-all active:scale-95 cursor-pointer"
              title="Personnaliser ou réinitialiser les 3 schémas de base"
            >
              <Sliders className="w-3.5 h-3.5 text-amber-400" />
              <span>Gérer Favoris</span>
            </button>

            {/* 4-Period Rotation Balancer Button */}
            <button
              type="button"
              onClick={() => {
                setRotationTargetTeam(applyScope === 'team2' ? 'team2' : 'team1');
                setIsRotationModalOpen(true);
              }}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-500 hover:to-purple-500 text-white text-xs font-extrabold shadow-md transition-all active:scale-95 cursor-pointer relative"
              title="Suggérer des rotations équilibrées sur les 4 périodes (FootEco)"
            >
              <ArrowRightLeft className="w-3.5 h-3.5 text-amber-300" />
              <span>Rotation 4 Périodes</span>
              {(t1Suggestions.length > 0 || t2Suggestions.length > 0) ? (
                <span className="px-1.5 py-0.2 rounded-full bg-amber-400 text-slate-950 text-[10px] font-black animate-pulse">
                  {t1Suggestions.length + t2Suggestions.length}
                </span>
              ) : (
                <span className="text-[10px] text-indigo-200 bg-indigo-800/80 px-1.5 py-0.2 rounded font-bold">
                  Équité
                </span>
              )}
            </button>

            {/* Screenshot / PNG Export Dropdown */}
            <div ref={exportDropdownRef} className="relative tactical-export-dropdown" data-html2canvas-ignore="true">
              <div className="inline-flex rounded-xl shadow-xs">
                <button
                  type="button"
                  onClick={() => handleExportPng('board')}
                  disabled={isExportingPng}
                  className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-l-xl bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 hover:border-slate-600 text-xs font-bold transition-all active:scale-95 cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
                  title="Exporter le schéma tactique en image PNG haute définition (Haute Définition 2x)"
                >
                  {isExportingPng ? (
                    <Loader2 className="w-3.5 h-3.5 text-emerald-400 animate-spin" />
                  ) : (
                    <Camera className="w-3.5 h-3.5 text-emerald-400" />
                  )}
                  <span>{isExportingPng ? 'Capture...' : 'Capture PNG'}</span>
                </button>
                <button
                  type="button"
                  onClick={() => setExportMenuOpen(!exportMenuOpen)}
                  disabled={isExportingPng}
                  className="px-2 py-1.5 rounded-r-xl bg-slate-800 hover:bg-slate-700 text-slate-200 border-y border-r border-slate-700 hover:border-slate-600 text-xs font-bold transition-all cursor-pointer disabled:opacity-50"
                  title="Options d'export d'image PNG"
                >
                  <ChevronDown className={`w-3.5 h-3.5 transition-transform ${exportMenuOpen ? 'rotate-180' : ''}`} />
                </button>
              </div>

              {/* Dropdown menu */}
              {exportMenuOpen && (
                <div className="absolute right-0 mt-1.5 w-64 bg-slate-900 border border-slate-700 rounded-xl shadow-2xl p-1.5 z-50 text-xs animate-in fade-in zoom-in-95">
                  <div className="px-2 py-1 text-[10px] font-bold text-slate-400 uppercase tracking-wider border-b border-slate-800 mb-1 flex items-center justify-between">
                    <span>Export Image PNG</span>
                    <span className="text-[9px] text-emerald-400 font-mono">2x Retina</span>
                  </div>
                  <button
                    type="button"
                    onClick={() => handleExportPng('board')}
                    className="w-full text-left px-2.5 py-2 rounded-lg hover:bg-slate-800 text-slate-200 flex items-center justify-between group cursor-pointer"
                  >
                    <span className="flex items-center gap-2">
                      <Download className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
                      <div>
                        <div className="font-semibold text-white">Schéma des 2 équipes</div>
                        <div className="text-[10px] text-slate-400">Période {period.periodNumber} • 2 terrains & compos</div>
                      </div>
                    </span>
                    <span className="text-[10px] bg-emerald-500/20 text-emerald-300 font-bold px-1.5 py-0.5 rounded shrink-0">PNG</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => handleExportPng('team1')}
                    className="w-full text-left px-2.5 py-2 rounded-lg hover:bg-slate-800 text-slate-200 flex items-center justify-between group cursor-pointer"
                  >
                    <span className="flex items-center gap-2">
                      <span className="w-2.5 h-2.5 rounded-full bg-yellow-400 shrink-0" />
                      <div>
                        <div className="font-semibold text-white">Équipe 1 uniquement</div>
                        <div className="text-[10px] text-slate-400">{period.team1.teamName || 'Éq. 1'} • {currentTeam1Fav.code}</div>
                      </div>
                    </span>
                    <Download className="w-3 h-3 text-slate-400 group-hover:text-amber-400 shrink-0" />
                  </button>
                  <button
                    type="button"
                    onClick={() => handleExportPng('team2')}
                    className="w-full text-left px-2.5 py-2 rounded-lg hover:bg-slate-800 text-slate-200 flex items-center justify-between group cursor-pointer"
                  >
                    <span className="flex items-center gap-2">
                      <span className="w-2.5 h-2.5 rounded-full bg-rose-500 shrink-0" />
                      <div>
                        <div className="font-semibold text-white">Équipe 2 uniquement</div>
                        <div className="text-[10px] text-slate-400">{period.team2.teamName || 'Éq. 2'} • {currentTeam2Fav.code}</div>
                      </div>
                    </span>
                    <Download className="w-3 h-3 text-slate-400 group-hover:text-rose-400 shrink-0" />
                  </button>
                  <button
                    type="button"
                    onClick={() => handleExportPng('full')}
                    className="w-full text-left px-2.5 py-2 rounded-lg hover:bg-slate-800 text-slate-300 flex items-center justify-between group cursor-pointer border-t border-slate-800/80 mt-1 pt-1.5"
                  >
                    <span className="flex items-center gap-2">
                      <Camera className="w-3.5 h-3.5 text-indigo-400 shrink-0" />
                      <div>
                        <div className="font-semibold text-white">Vue .pitch-tactical-view</div>
                        <div className="text-[10px] text-slate-400">Comprend barre d'outils et réglages</div>
                      </div>
                    </span>
                    <span className="text-[10px] text-slate-500 shrink-0">Complet</span>
                  </button>
                </div>
              )}
            </div>

            {/* Tactical Drawing Mode Button */}
            <button
              type="button"
              data-html2canvas-ignore="true"
              onClick={() => setIsDrawingMode(!isDrawingMode)}
              className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold transition-all active:scale-95 cursor-pointer border ${
                isDrawingMode
                  ? 'bg-amber-500 hover:bg-amber-400 text-slate-950 border-amber-400 shadow-md ring-2 ring-amber-400/40'
                  : 'bg-slate-800 hover:bg-slate-700 text-slate-200 border-slate-700 hover:border-slate-600'
              }`}
              title={isDrawingMode ? "Désactiver le mode dessin tactique" : "Activer le mode dessin pour tracer des flèches et passes en direct sur le terrain"}
            >
              <PenTool className={`w-3.5 h-3.5 ${isDrawingMode ? 'text-slate-950' : 'text-amber-400'}`} />
              <span>{isDrawingMode ? 'Dessin Actif' : 'Dessiner'}</span>
              {(team1Strokes.length > 0 || team2Strokes.length > 0) && (
                <span className={`px-1.5 py-0.2 rounded-full text-[10px] font-black ${
                  isDrawingMode ? 'bg-slate-950 text-amber-400' : 'bg-amber-400/20 text-amber-300'
                }`}>
                  {team1Strokes.length + team2Strokes.length}
                </span>
              )}
            </button>

            {/* Interactive Tactical Arrows Toggle Button (Passes & Runs) */}
            <button
              type="button"
              data-html2canvas-ignore="true"
              onClick={() => {
                const nextVal = !isArrowModeActive;
                setIsArrowModeActive(nextVal);
                if (nextVal && isDrawingMode) setIsDrawingMode(false);
                setToastMessage(
                  nextVal 
                    ? "Mode flèches interactives activé : cliquez sur un joueur pour tracer une passe ou une course" 
                    : "Mode flèches interactives désactivé"
                );
                setTimeout(() => setToastMessage(null), 2500);
              }}
              className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold transition-all active:scale-95 cursor-pointer border ${
                isArrowModeActive
                  ? 'bg-amber-500 hover:bg-amber-400 text-slate-950 border-amber-400 shadow-md ring-2 ring-amber-400/40'
                  : 'bg-slate-800 hover:bg-slate-700 text-slate-200 border-slate-700 hover:border-slate-600'
              }`}
              title="Tracer des flèches interactives entre joueurs pour dessiner des trajectoires de passes ou des courses sans ballon"
            >
              <ArrowRight className={`w-3.5 h-3.5 ${isArrowModeActive ? 'text-slate-950' : 'text-amber-400'}`} />
              <span>{isArrowModeActive ? 'Flèches Actives' : 'Flèches'}</span>
              {(team1Arrows.length > 0 || team2Arrows.length > 0) && (
                <span className={`px-1.5 py-0.2 rounded-full text-[10px] font-black ${
                  isArrowModeActive ? 'bg-slate-950 text-amber-400' : 'bg-amber-400/20 text-amber-300'
                }`}>
                  {team1Arrows.length + team2Arrows.length}
                </span>
              )}
            </button>

            {/* Magnetic Snapping Toggle Button */}
            <button
              type="button"
              data-html2canvas-ignore="true"
              onClick={() => {
                const nextVal = !isMagneticSnappingEnabled;
                setIsMagneticSnappingEnabled(nextVal);
                setToastMessage(
                  nextVal 
                    ? "Magnétisme (snapping) activé : les joueurs s'aimantent aux postes" 
                    : "Magnétisme désactivé"
                );
                setTimeout(() => setToastMessage(null), 2200);
              }}
              className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold transition-all active:scale-95 cursor-pointer border ${
                isMagneticSnappingEnabled
                  ? 'bg-amber-500/20 text-amber-300 border-amber-500/50 hover:bg-amber-500/30 ring-1 ring-amber-400/30'
                  : 'bg-slate-800 hover:bg-slate-700 text-slate-400 border-slate-700 hover:text-slate-200'
              }`}
              title={
                isMagneticSnappingEnabled
                  ? "Magnétisme activé : les joueurs s'aimantent automatiquement aux positions tactiques prédéfinies"
                  : "Activer le magnétisme automatique des joueurs vers les positions tactiques"
              }
            >
              <Magnet className={`w-3.5 h-3.5 ${isMagneticSnappingEnabled ? 'text-amber-400 animate-pulse' : 'text-slate-500'}`} />
              <span className="hidden sm:inline">{isMagneticSnappingEnabled ? 'Aimantation ON' : 'Aimantation OFF'}</span>
              <span className="sm:hidden">🧲</span>
            </button>

            {/* Pressing Zones & Team Block Toggle Button */}
            <button
              type="button"
              data-html2canvas-ignore="true"
              onClick={() => {
                if (activePressingZone === 'none' && !showPressingControls) {
                  setActivePressingZone('high');
                  setShowPressingControls(true);
                  setToastMessage("Zones de pressing activées : Zone Haute (Pressing)");
                  setTimeout(() => setToastMessage(null), 2200);
                } else {
                  setShowPressingControls(!showPressingControls);
                }
              }}
              className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold transition-all active:scale-95 cursor-pointer border ${
                activePressingZone !== 'none'
                  ? 'bg-amber-500/20 text-amber-300 border-amber-500/50 hover:bg-amber-500/30 ring-1 ring-amber-400/30'
                  : 'bg-slate-800 hover:bg-slate-700 text-slate-300 border-slate-700 hover:text-white'
              }`}
              title="Afficher les zones de pressing prédéfinies (haute, médiane, basse) et régler l'opacité du bloc équipe"
            >
              <Layers className={`w-3.5 h-3.5 ${activePressingZone !== 'none' ? 'text-amber-400 animate-pulse' : 'text-slate-400'}`} />
              <span className="hidden sm:inline">
                {activePressingZone === 'none' ? 'Zones Pressing' : `Pressing (${activePressingZone.toUpperCase()})`}
              </span>
              <span className="sm:hidden">Bloc</span>
              {activePressingZone !== 'none' && (
                <span className="px-1.5 py-0.2 rounded-full text-[10px] font-black bg-amber-400 text-slate-950 font-mono">
                  {pressingOpacity}%
                </span>
              )}
            </button>

            {/* Substitutes Names Toggle Button */}
            <button
              type="button"
              data-html2canvas-ignore="true"
              onClick={() => {
                const nextState = !showSubstitutesNames;
                setShowSubstitutesNames(nextState);
                setToastMessage(
                  nextState 
                    ? "Noms des remplaçants affichés sur le terrain et le banc" 
                    : "Noms des remplaçants masqués"
                );
                setTimeout(() => setToastMessage(null), 2200);
              }}
              className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold transition-all active:scale-95 cursor-pointer border ${
                showSubstitutesNames
                  ? 'bg-amber-500/20 text-amber-300 border-amber-500/50 hover:bg-amber-500/30 ring-1 ring-amber-400/30'
                  : 'bg-slate-800 hover:bg-slate-700 text-slate-400 border-slate-700 hover:text-slate-200'
              }`}
              title="Afficher ou masquer les noms des remplaçants sur le terrain tactique et les bancs de touche"
            >
              <Users className={`w-3.5 h-3.5 ${showSubstitutesNames ? 'text-amber-400' : 'text-slate-500'}`} />
              <span className="hidden sm:inline">
                {showSubstitutesNames ? 'Noms Remplaçants ON' : 'Remplaçants OFF'}
              </span>
              <span className="sm:hidden">Banc</span>
              <span className="px-1.5 py-0.2 rounded-full text-[10px] font-mono font-bold bg-slate-950/80 text-amber-300 border border-slate-800">
                {period.team1.remplacants.length + period.team2.remplacants.length}
              </span>
            </button>

            {/* Fullscreen / Plein écran Button */}
            <button
              type="button"
              data-html2canvas-ignore="true"
              onClick={toggleFullscreen}
              className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold transition-all active:scale-95 cursor-pointer border ${
                isFullscreen
                  ? 'bg-amber-500 hover:bg-amber-400 text-slate-950 border-amber-400 shadow-md ring-2 ring-amber-400/40'
                  : 'bg-slate-800 hover:bg-slate-700 text-slate-200 border-slate-700 hover:border-slate-600'
              }`}
              title={isFullscreen ? "Quitter le mode plein écran (Touche Échap)" : "Élargir en plein écran pour la démonstration tactique d'avant-match"}
            >
              {isFullscreen ? (
                <>
                  <Minimize2 className="w-3.5 h-3.5 text-slate-950" />
                  <span>Réduire</span>
                </>
              ) : (
                <>
                  <Maximize2 className="w-3.5 h-3.5 text-indigo-400" />
                  <span>Plein écran</span>
                </>
              )}
            </button>

          </div>
        </div>

        {/* 3 Tactical Favorite Quick Buttons */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5 pt-3.5">
          
          {/* Favorite 1 */}
          <button
            type="button"
            onClick={() => handleSelectFavorite('fav-1')}
            className={`p-3 rounded-xl border text-left transition-all active:scale-[0.98] cursor-pointer relative overflow-hidden group ${
              (applyScope === 'both' && team1FavId === 'fav-1' && team2FavId === 'fav-1') ||
              (applyScope === 'team1' && team1FavId === 'fav-1') ||
              (applyScope === 'team2' && team2FavId === 'fav-1')
                ? 'bg-gradient-to-br from-amber-500/20 to-amber-600/10 border-amber-400 ring-2 ring-amber-400/40 shadow-sm'
                : 'bg-slate-800/70 border-slate-700 hover:border-slate-600 hover:bg-slate-800'
            }`}
          >
            <div className="flex items-center justify-between mb-1.5">
              <span className="inline-flex items-center gap-1 text-[11px] font-black uppercase text-amber-400">
                <Star className="w-3.5 h-3.5 fill-amber-400 text-amber-400" />
                <span>Favori 1</span>
              </span>
              <span className="font-mono text-xs font-black px-2 py-0.5 rounded bg-slate-900/90 text-amber-300 border border-slate-700">
                {fav1.code}
              </span>
            </div>
            <div className="font-bold text-xs text-white group-hover:text-amber-200 truncate">
              {fav1.name}
            </div>
            <div className="text-[10px] text-slate-400 truncate mt-0.5">
              {fav1.badge}
            </div>
          </button>

          {/* Favorite 2 */}
          <button
            type="button"
            onClick={() => handleSelectFavorite('fav-2')}
            className={`p-3 rounded-xl border text-left transition-all active:scale-[0.98] cursor-pointer relative overflow-hidden group ${
              (applyScope === 'both' && team1FavId === 'fav-2' && team2FavId === 'fav-2') ||
              (applyScope === 'team1' && team1FavId === 'fav-2') ||
              (applyScope === 'team2' && team2FavId === 'fav-2')
                ? 'bg-gradient-to-br from-indigo-500/20 to-indigo-600/10 border-indigo-400 ring-2 ring-indigo-400/40 shadow-sm'
                : 'bg-slate-800/70 border-slate-700 hover:border-slate-600 hover:bg-slate-800'
            }`}
          >
            <div className="flex items-center justify-between mb-1.5">
              <span className="inline-flex items-center gap-1 text-[11px] font-black uppercase text-indigo-300">
                <Star className="w-3.5 h-3.5 fill-indigo-400 text-indigo-400" />
                <span>Favori 2</span>
              </span>
              <span className="font-mono text-xs font-black px-2 py-0.5 rounded bg-slate-900/90 text-indigo-300 border border-slate-700">
                {fav2.code}
              </span>
            </div>
            <div className="font-bold text-xs text-white group-hover:text-indigo-200 truncate">
              {fav2.name}
            </div>
            <div className="text-[10px] text-slate-400 truncate mt-0.5">
              {fav2.badge}
            </div>
          </button>

          {/* Favorite 3 */}
          <button
            type="button"
            onClick={() => handleSelectFavorite('fav-3')}
            className={`p-3 rounded-xl border text-left transition-all active:scale-[0.98] cursor-pointer relative overflow-hidden group ${
              (applyScope === 'both' && team1FavId === 'fav-3' && team2FavId === 'fav-3') ||
              (applyScope === 'team1' && team1FavId === 'fav-3') ||
              (applyScope === 'team2' && team2FavId === 'fav-3')
                ? 'bg-gradient-to-br from-emerald-500/20 to-emerald-600/10 border-emerald-400 ring-2 ring-emerald-400/40 shadow-sm'
                : 'bg-slate-800/70 border-slate-700 hover:border-slate-600 hover:bg-slate-800'
            }`}
          >
            <div className="flex items-center justify-between mb-1.5">
              <span className="inline-flex items-center gap-1 text-[11px] font-black uppercase text-emerald-400">
                <Star className="w-3.5 h-3.5 fill-emerald-400 text-emerald-400" />
                <span>Favori 3</span>
              </span>
              <span className="font-mono text-xs font-black px-2 py-0.5 rounded bg-slate-900/90 text-emerald-300 border border-slate-700">
                {fav3.code}
              </span>
            </div>
            <div className="font-bold text-xs text-white group-hover:text-emerald-200 truncate">
              {fav3.name}
            </div>
            <div className="text-[10px] text-slate-400 truncate mt-0.5">
              {fav3.badge}
            </div>
          </button>

        </div>

        {/* Pressing Zones Control Bar with Range Slider & Presets */}
        {(showPressingControls || activePressingZone !== 'none') && (
          <div 
            data-html2canvas-ignore="true" 
            className="mt-3.5 p-3 sm:p-4 rounded-xl bg-slate-950/90 border border-amber-500/40 shadow-xl space-y-3 animate-in fade-in slide-in-from-top-2"
          >
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-3 pb-2.5 border-b border-slate-800">
              <div className="flex items-center gap-2">
                <span className="p-1.5 rounded-lg bg-amber-500/20 text-amber-300 border border-amber-500/40">
                  <Layers className="w-4 h-4" />
                </span>
                <div>
                  <div className="text-xs font-bold text-white flex items-center gap-2">
                    <span>Zones de Pressing & Bloc Équipe</span>
                    <span className={`text-[10px] px-2 py-0.5 rounded-full font-bold font-mono ${
                      activePressingZone === 'none' 
                        ? 'bg-slate-800 text-slate-400' 
                        : 'bg-amber-500/20 text-amber-300 border border-amber-500/30'
                    }`}>
                      {activePressingZone === 'none' ? 'Désactivé' : `Zone active : ${activePressingZone.toUpperCase()}`}
                    </span>
                  </div>
                  <p className="text-[11px] text-slate-400">
                    Visualisez le positionnement du bloc selon la phase de jeu et réglez l'intensité visuelle avec le curseur d'opacité.
                  </p>
                </div>
              </div>

              {/* Opacity Range Slider (Curseur range input de 0 à 100%) */}
              <div className="flex items-center gap-2.5 bg-slate-900 px-3 py-1.5 rounded-xl border border-slate-700">
                <label htmlFor="pressing-opacity-slider" className="text-[11px] font-bold text-slate-300 whitespace-nowrap flex items-center gap-1.5 cursor-pointer">
                  <span>Opacité des zones :</span>
                  <span className="font-mono text-amber-300 font-extrabold w-10 text-right">
                    {pressingOpacity}%
                  </span>
                </label>
                <input
                  id="pressing-opacity-slider"
                  type="range"
                  min="0"
                  max="100"
                  step="5"
                  value={pressingOpacity}
                  onChange={(e) => setPressingOpacity(Number(e.target.value))}
                  className="w-24 sm:w-36 h-2 bg-slate-700 rounded-lg appearance-none cursor-pointer accent-amber-400 hover:accent-amber-300"
                  title={`Régler l'opacité des zones de pressing (${pressingOpacity}%)`}
                />
                {/* Quick preset buttons */}
                <div className="hidden sm:flex items-center gap-1 pl-1 border-l border-slate-700">
                  {[25, 50, 75, 100].map((preset) => (
                    <button
                      key={preset}
                      type="button"
                      onClick={() => setPressingOpacity(preset)}
                      className={`px-1.5 py-0.5 rounded text-[10px] font-mono font-bold transition-all cursor-pointer ${
                        pressingOpacity === preset
                          ? 'bg-amber-400 text-slate-950 font-black'
                          : 'text-slate-400 hover:text-white bg-slate-800'
                      }`}
                    >
                      {preset}%
                    </button>
                  ))}
                </div>
              </div>
            </div>

            {/* Zone selection buttons */}
            <div className="flex flex-wrap items-center justify-between gap-2 pt-1 text-xs">
              <div className="flex flex-wrap items-center gap-1.5">
                <span className="text-[11px] font-bold text-slate-400 mr-1">Zone :</span>
                
                <button
                  type="button"
                  onClick={() => {
                    setActivePressingZone('none');
                    setToastMessage("Zones de pressing masquées");
                    setTimeout(() => setToastMessage(null), 2000);
                  }}
                  className={`px-2.5 py-1 rounded-lg font-bold transition-all cursor-pointer ${
                    activePressingZone === 'none'
                      ? 'bg-slate-700 text-white shadow-xs'
                      : 'text-slate-400 hover:text-slate-200 bg-slate-900 border border-slate-800'
                  }`}
                >
                  Masquer
                </button>

                <button
                  type="button"
                  onClick={() => {
                    setActivePressingZone('high');
                    if (pressingOpacity === 0) setPressingOpacity(55);
                    setToastMessage("Zone Haute activée : Pressing haut & harcèlement des relances adverses");
                    setTimeout(() => setToastMessage(null), 2500);
                  }}
                  className={`px-2.5 py-1 rounded-lg font-bold flex items-center gap-1.5 transition-all cursor-pointer ${
                    activePressingZone === 'high'
                      ? 'bg-amber-500 text-slate-950 shadow-md ring-2 ring-amber-400/40'
                      : 'text-amber-300 hover:text-white bg-slate-900 border border-amber-500/40 hover:bg-slate-800'
                  }`}
                >
                  <Zap className="w-3.5 h-3.5" />
                  <span>Zone Haute (Pressing Haut)</span>
                </button>

                <button
                  type="button"
                  onClick={() => {
                    setActivePressingZone('mid');
                    if (pressingOpacity === 0) setPressingOpacity(55);
                    setToastMessage("Zone Médiane activée : Bloc médian, compacité axiale & fermeture des intervalles");
                    setTimeout(() => setToastMessage(null), 2500);
                  }}
                  className={`px-2.5 py-1 rounded-lg font-bold flex items-center gap-1.5 transition-all cursor-pointer ${
                    activePressingZone === 'mid'
                      ? 'bg-cyan-500 text-slate-950 shadow-md ring-2 ring-cyan-400/40'
                      : 'text-cyan-300 hover:text-white bg-slate-900 border border-cyan-500/40 hover:bg-slate-800'
                  }`}
                >
                  <Compass className="w-3.5 h-3.5" />
                  <span>Zone Médiane (Bloc Médian)</span>
                </button>

                <button
                  type="button"
                  onClick={() => {
                    setActivePressingZone('low');
                    if (pressingOpacity === 0) setPressingOpacity(55);
                    setToastMessage("Zone Basse activée : Bloc bas & verrouillage de la surface");
                    setTimeout(() => setToastMessage(null), 2500);
                  }}
                  className={`px-2.5 py-1 rounded-lg font-bold flex items-center gap-1.5 transition-all cursor-pointer ${
                    activePressingZone === 'low'
                      ? 'bg-emerald-500 text-slate-950 shadow-md ring-2 ring-emerald-400/40'
                      : 'text-emerald-300 hover:text-white bg-slate-900 border border-emerald-500/40 hover:bg-slate-800'
                  }`}
                >
                  <Shield className="w-3.5 h-3.5" />
                  <span>Zone Basse (Bloc Bas)</span>
                </button>

                <button
                  type="button"
                  onClick={() => {
                    setActivePressingZone('all');
                    if (pressingOpacity === 0) setPressingOpacity(55);
                    setToastMessage("Vue 3 Blocs activée : Affichage simultané des tiers défensif, médian et offensif");
                    setTimeout(() => setToastMessage(null), 2500);
                  }}
                  className={`px-2.5 py-1 rounded-lg font-bold flex items-center gap-1.5 transition-all cursor-pointer ${
                    activePressingZone === 'all'
                      ? 'bg-gradient-to-r from-emerald-500 via-cyan-500 to-amber-500 text-slate-950 font-black shadow-md'
                      : 'text-slate-200 hover:text-white bg-slate-900 border border-slate-700 hover:bg-slate-800'
                  }`}
                >
                  <Layers className="w-3.5 h-3.5" />
                  <span>3 Blocs (Vue Complète)</span>
                </button>
              </div>

              <button
                type="button"
                onClick={() => setShowPressingControls(false)}
                className="text-[11px] text-slate-400 hover:text-slate-200 underline cursor-pointer"
              >
                Réduire
              </button>
            </div>
          </div>
        )}

        {/* Swap helper or toast indicator */}
        <div className="mt-3 pt-2.5 border-t border-slate-800/80 flex flex-wrap items-center justify-between text-xs text-slate-400 gap-2">
          <div className="flex items-center gap-2">
            <ArrowRightLeft className="w-3.5 h-3.5 text-amber-400 shrink-0" />
            <span>
              {selectedPlayerForSwap ? (
                <span className="text-amber-300 font-bold">
                  Joueur sélectionné : <strong>{selectedPlayerForSwap.name}</strong> • Cliquez sur un autre joueur pour permuter leurs postes
                </span>
              ) : (
                <span>Astuce : Cliquez ou glissez-déposez un joueur sur un autre pour échanger leurs postes instantanément.</span>
              )}
            </span>
          </div>

          <div className="flex items-center gap-2">
            {selectedPlayerForSwap && (
              <button
                type="button"
                onClick={() => setSelectedPlayerForSwap(null)}
                className="text-[11px] text-rose-400 hover:text-rose-300 font-bold underline cursor-pointer"
              >
                Annuler sélection
              </button>
            )}

            {onUpdatePeriod && (
              <button
                type="button"
                onClick={handleApplyPositionsBoth}
                className="inline-flex items-center gap-1 text-[11px] bg-slate-800 hover:bg-slate-700 text-amber-300 font-bold px-2 py-1 rounded-lg border border-slate-700 transition-colors cursor-pointer"
                title="Met à jour la colonne des postes de la feuille de match selon les schémas tactiques actifs"
              >
                <Check className="w-3 h-3 text-amber-400" />
                <span>Appliquer postes à la feuille</span>
              </button>
            )}

            <button
              type="button"
              onClick={() => setShowTacticalDetails(!showTacticalDetails)}
              className="inline-flex items-center gap-1 text-[11px] text-slate-300 hover:text-white font-semibold cursor-pointer"
            >
              <Info className="w-3 h-3 text-indigo-400" />
              <span>{showTacticalDetails ? 'Masquer consignes' : 'Voir consignes tactiques'}</span>
              {showTacticalDetails ? <ChevronUp className="w-3 h-3" /> : <ChevronDown className="w-3 h-3" />}
            </button>
          </div>
        </div>

        {/* Tactical Info Accordion */}
        {showTacticalDetails && (
          <div className="mt-3 p-3.5 rounded-xl bg-slate-800/80 border border-slate-700 text-xs text-slate-300 space-y-3 animate-in fade-in duration-150">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              
              {/* Equipe 1 Tactical Notes */}
              <div className="space-y-1.5 border-l-2 border-yellow-400 pl-3">
                <div className="flex items-center gap-1.5 font-bold text-yellow-300">
                  <span className="w-2 h-2 rounded-full bg-yellow-400" />
                  <span>Équipe 1 : {currentTeam1Fav.name} ({currentTeam1Fav.code})</span>
                </div>
                <p className="text-[11px] text-slate-300 leading-relaxed">
                  {currentTeam1Fav.description}
                </p>
                {currentTeam1Fav.coachingTips && currentTeam1Fav.coachingTips.length > 0 && (
                  <ul className="text-[11px] space-y-1 text-slate-400 pt-1">
                    {currentTeam1Fav.coachingTips.map((tip, idx) => (
                      <li key={idx} className="flex items-start gap-1.5">
                        <span className="text-yellow-400 font-bold">•</span>
                        <span>{tip}</span>
                      </li>
                    ))}
                  </ul>
                )}
              </div>

              {/* Equipe 2 Tactical Notes */}
              <div className="space-y-1.5 border-l-2 border-rose-500 pl-3">
                <div className="flex items-center gap-1.5 font-bold text-rose-300">
                  <span className="w-2 h-2 rounded-full bg-rose-500" />
                  <span>Équipe 2 : {currentTeam2Fav.name} ({currentTeam2Fav.code})</span>
                </div>
                <p className="text-[11px] text-slate-300 leading-relaxed">
                  {currentTeam2Fav.description}
                </p>
                {currentTeam2Fav.coachingTips && currentTeam2Fav.coachingTips.length > 0 && (
                  <ul className="text-[11px] space-y-1 text-slate-400 pt-1">
                    {currentTeam2Fav.coachingTips.map((tip, idx) => (
                      <li key={idx} className="flex items-start gap-1.5">
                        <span className="text-rose-400 font-bold">•</span>
                        <span>{tip}</span>
                      </li>
                    ))}
                  </ul>
                )}
              </div>

            </div>
          </div>
        )}

      </div>

      {/* Floating toast notification */}
      {toastMessage && (
        <div className="fixed top-20 right-5 z-50 bg-slate-900 text-white text-xs font-bold px-3.5 py-2.5 rounded-xl border border-slate-700 shadow-2xl flex items-center gap-2 animate-in fade-in slide-in-from-top-2">
          <Check className="w-4 h-4 text-emerald-400 shrink-0" />
          <span>{toastMessage}</span>
        </div>
      )}

      {/* Tactical Pitches Board (Exportable as PNG) */}
      <div 
        ref={tacticalBoardRef} 
        id="pitch-tactical-board-canvas"
        className="tactical-board-canvas-wrapper bg-slate-950 rounded-2xl p-4 sm:p-5 border border-slate-800 shadow-xl space-y-4"
      >
        {/* Banner visible on exported PNG & board */}
        <div className="flex flex-wrap items-center justify-between gap-3 pb-3 border-b border-slate-800">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-xl bg-emerald-500/20 border border-emerald-500/40 text-emerald-400 flex items-center justify-center font-black text-sm shrink-0">
              P{period.periodNumber}
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="font-extrabold text-sm sm:text-base text-white tracking-wide">
                  Dispositif Tactique FootEco 7v7 — Période {period.periodNumber}
                </h3>
                <span className="text-[11px] font-mono font-bold text-amber-300 bg-amber-500/15 border border-amber-500/30 px-2 py-0.5 rounded-full">
                  {period.durationMinutes || 15} min
                </span>
              </div>
              <p className="text-[11px] text-slate-400">
                Composition officielle • 7 Titulaires & Remplaçants par équipe
              </p>
            </div>
          </div>

          <div className="flex items-center gap-3 text-xs font-semibold">
            <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-yellow-400/10 border border-yellow-400/30 text-yellow-300">
              <span className="w-2.5 h-2.5 rounded-full bg-[#FFFF00]" />
              <span>{period.team1.teamName || 'Équipe 1'}</span>
              <span className="font-mono font-bold text-[10px] bg-slate-900 px-1.5 py-0.5 rounded ml-0.5 text-white">{currentTeam1Fav.code}</span>
            </div>
            <span className="text-slate-600 font-black text-[10px]">VS</span>
            <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-rose-500/10 border border-rose-500/30 text-rose-300">
              <span className="w-2.5 h-2.5 rounded-full bg-[#FF0000]" />
              <span>{period.team2.teamName || 'Équipe 2'}</span>
              <span className="font-mono font-bold text-[10px] bg-slate-900 px-1.5 py-0.5 rounded ml-0.5 text-white">{currentTeam2Fav.code}</span>
            </div>

            <button
              type="button"
              data-html2canvas-ignore="true"
              onClick={() => {
                const nextVal = !isMagneticSnappingEnabled;
                setIsMagneticSnappingEnabled(nextVal);
                setToastMessage(
                  nextVal 
                    ? "Magnétisme (snapping) activé : les joueurs s'aimantent aux postes" 
                    : "Magnétisme désactivé"
                );
                setTimeout(() => setToastMessage(null), 2200);
              }}
              className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-lg text-xs font-bold transition-all cursor-pointer ml-1 border ${
                isMagneticSnappingEnabled
                  ? 'bg-amber-500/20 text-amber-300 border-amber-500/50 hover:bg-amber-500/30 ring-1 ring-amber-400/30'
                  : 'bg-slate-800 hover:bg-slate-700 text-slate-400 border-slate-700 hover:text-slate-200'
              }`}
              title={
                isMagneticSnappingEnabled
                  ? "Magnétisme activé : les joueurs s'aimantent automatiquement aux positions tactiques prédéfinies"
                  : "Activer le magnétisme automatique des joueurs vers les positions tactiques"
              }
            >
              <Magnet className={`w-3.5 h-3.5 ${isMagneticSnappingEnabled ? 'text-amber-400 animate-pulse' : 'text-slate-500'}`} />
              <span className="hidden md:inline text-[11px] font-bold">
                {isMagneticSnappingEnabled ? 'Aimanté' : 'Snapping'}
              </span>
            </button>

            <button
              type="button"
              data-html2canvas-ignore="true"
              onClick={() => {
                const nextVal = !isArrowModeActive;
                setIsArrowModeActive(nextVal);
                if (nextVal && isDrawingMode) setIsDrawingMode(false);
                setToastMessage(
                  nextVal 
                    ? "Mode flèches interactives activé : cliquez sur un joueur pour tracer une passe ou une course"
                    : "Mode flèches désactivé"
                );
                setTimeout(() => setToastMessage(null), 2500);
              }}
              className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-lg text-xs font-bold transition-all cursor-pointer ml-1 border ${
                isArrowModeActive
                  ? 'bg-amber-500 hover:bg-amber-400 text-slate-950 border-amber-400 shadow-md ring-2 ring-amber-400/40'
                  : 'bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white border border-slate-700'
              }`}
              title={isArrowModeActive ? "Désactiver le tracé de flèches interactives" : "Tracer des passes et courses sans ballon entre les joueurs"}
            >
              <ArrowRight className={`w-3.5 h-3.5 ${isArrowModeActive ? 'text-slate-950' : 'text-amber-400'}`} />
              <span className="hidden sm:inline text-[11px] font-bold">
                {isArrowModeActive ? 'Flèches Actives' : 'Flèches'}
              </span>
              {(team1Arrows.length > 0 || team2Arrows.length > 0) && (
                <span className={`px-1 rounded text-[10px] font-mono font-bold ${
                  isArrowModeActive ? 'bg-slate-950 text-amber-400' : 'bg-slate-900 text-amber-300'
                }`}>
                  {team1Arrows.length + team2Arrows.length}
                </span>
              )}
            </button>

            <button
              type="button"
              data-html2canvas-ignore="true"
              onClick={() => setIsDrawingMode(!isDrawingMode)}
              className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-lg text-xs font-bold transition-all cursor-pointer ml-1 border ${
                isDrawingMode
                  ? 'bg-amber-500 hover:bg-amber-400 text-slate-950 border-amber-400 shadow-md ring-2 ring-amber-400/40'
                  : 'bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white border border-slate-700'
              }`}
              title={isDrawingMode ? "Désactiver le mode dessin tactique" : "Activer le mode dessin tactique sur les 2 terrains"}
            >
              <PenTool className={`w-3.5 h-3.5 ${isDrawingMode ? 'text-slate-950' : 'text-amber-400'}`} />
              <span className="hidden sm:inline text-[11px] font-bold">
                {isDrawingMode ? 'Dessin Actif' : 'Dessiner'}
              </span>
            </button>

            <button
              type="button"
              data-html2canvas-ignore="true"
              onClick={() => {
                if (activePressingZone === 'none') {
                  setActivePressingZone('high');
                  setShowPressingControls(true);
                  setToastMessage("Zone de pressing : HAUTE (Pressing haut)");
                } else if (activePressingZone === 'high') {
                  setActivePressingZone('mid');
                  setShowPressingControls(true);
                  setToastMessage("Zone de pressing : MÉDIANE (Bloc médian)");
                } else if (activePressingZone === 'mid') {
                  setActivePressingZone('low');
                  setShowPressingControls(true);
                  setToastMessage("Zone de pressing : BASSE (Bloc bas)");
                } else if (activePressingZone === 'low') {
                  setActivePressingZone('all');
                  setShowPressingControls(true);
                  setToastMessage("Zone de pressing : 3 BLOCS SIMULTANÉS");
                } else {
                  setActivePressingZone('none');
                  setToastMessage("Zones de pressing masquées");
                }
                setTimeout(() => setToastMessage(null), 2000);
              }}
              className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-lg text-xs font-bold transition-all cursor-pointer ml-1 border ${
                activePressingZone !== 'none'
                  ? 'bg-amber-500/20 text-amber-300 border-amber-500/50 hover:bg-amber-500/30 ring-1 ring-amber-400/30'
                  : 'bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white border border-slate-700'
              }`}
              title="Changer de zone de pressing ou cliquer pour afficher les contrôles d'opacité"
            >
              <Layers className={`w-3.5 h-3.5 ${activePressingZone !== 'none' ? 'text-amber-400' : 'text-slate-400'}`} />
              <span className="hidden sm:inline text-[11px] font-bold">
                {activePressingZone === 'none' ? 'Pressing' : `Bloc ${activePressingZone.toUpperCase()}`}
              </span>
              {activePressingZone !== 'none' && (
                <span className="font-mono text-[10px] text-amber-300 bg-slate-950/80 px-1 rounded">
                  {pressingOpacity}%
                </span>
              )}
            </button>

            {/* Substitutes visibility in board header */}
            <button
              type="button"
              data-html2canvas-ignore="true"
              onClick={() => {
                setShowSubstitutesNames(!showSubstitutesNames);
                setToastMessage(!showSubstitutesNames ? "Noms des remplaçants affichés sur le terrain" : "Noms des remplaçants masqués");
                setTimeout(() => setToastMessage(null), 2000);
              }}
              className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-lg text-xs font-bold transition-all cursor-pointer ml-1 border ${
                showSubstitutesNames
                  ? 'bg-amber-500/20 text-amber-300 border-amber-500/50 hover:bg-amber-500/30 ring-1 ring-amber-400/30'
                  : 'bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white border border-slate-700'
              }`}
              title="Afficher ou masquer les noms des remplaçants sur le tableau tactique"
            >
              <Users className={`w-3.5 h-3.5 ${showSubstitutesNames ? 'text-amber-400' : 'text-slate-400'}`} />
              <span className="hidden sm:inline text-[11px] font-bold">Remplaçants</span>
              <span className="font-mono text-[10px] text-amber-300 bg-slate-950/80 px-1 rounded">
                {period.team1.remplacants.length + period.team2.remplacants.length}
              </span>
            </button>

            <button
              type="button"
              data-html2canvas-ignore="true"
              onClick={toggleFullscreen}
              className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white border border-slate-700 transition-all cursor-pointer text-xs ml-1"
              title={isFullscreen ? "Quitter le plein écran (Échap)" : "Plein écran pour le briefing"}
            >
              {isFullscreen ? (
                <>
                  <Minimize2 className="w-3.5 h-3.5 text-amber-400" />
                  <span className="hidden sm:inline text-[11px] font-bold">Réduire</span>
                </>
              ) : (
                <>
                  <Maximize2 className="w-3.5 h-3.5 text-indigo-400" />
                  <span className="hidden sm:inline text-[11px] font-bold">Plein écran</span>
                </>
              )}
            </button>
          </div>
        </div>

        {/* Tactical Drawing Toolbar (Visible when isDrawingMode is true) */}
        {isDrawingMode && (
          <div 
            data-html2canvas-ignore="true" 
            className="bg-slate-900 border border-amber-500/50 rounded-xl p-3 shadow-xl space-y-2.5 animate-in fade-in slide-in-from-top-2 select-none"
          >
            <div className="flex flex-wrap items-center justify-between gap-3">
              {/* Left: Mode Title & Info */}
              <div className="flex items-center gap-2">
                <span className="p-1.5 rounded-lg bg-amber-500/20 text-amber-300 border border-amber-500/40">
                  <PenTool className="w-4 h-4" />
                </span>
                <div>
                  <div className="text-xs font-bold text-white flex items-center gap-2">
                    <span>Mode Dessin Tactique en Temps Réel</span>
                    <span className="text-[10px] bg-emerald-500/20 text-emerald-300 px-1.5 py-0.5 rounded font-mono font-bold">
                      Canvas Actif
                    </span>
                  </div>
                  <div className="text-[11px] text-slate-400">
                    Tracez directement des flèches de déplacement, trajectoires de passes ou schémas sur les 2 terrains.
                  </div>
                </div>
              </div>

              {/* Right: Quick actions (Undo, Clear, Close) */}
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={handleUndoStroke}
                  disabled={team1Strokes.length === 0 && team2Strokes.length === 0}
                  className="px-2.5 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 disabled:opacity-40 disabled:cursor-not-allowed text-slate-200 border border-slate-700 hover:border-slate-600 text-xs font-semibold flex items-center gap-1.5 transition-all cursor-pointer"
                  title="Annuler le dernier tracé"
                >
                  <Undo2 className="w-3.5 h-3.5 text-amber-400" />
                  <span className="hidden sm:inline">Annuler</span>
                </button>
                <button
                  type="button"
                  onClick={handleClearAllStrokes}
                  disabled={team1Strokes.length === 0 && team2Strokes.length === 0}
                  className="px-2.5 py-1.5 rounded-lg bg-rose-950/40 hover:bg-rose-900/60 disabled:opacity-40 disabled:cursor-not-allowed text-rose-300 border border-rose-800/60 text-xs font-semibold flex items-center gap-1.5 transition-all cursor-pointer"
                  title="Effacer tous les tracés sur les 2 terrains"
                >
                  <Trash2 className="w-3.5 h-3.5 text-rose-400" />
                  <span className="hidden sm:inline">Tout effacer</span>
                </button>
                <button
                  type="button"
                  onClick={() => setIsDrawingMode(false)}
                  className="px-2.5 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 border border-slate-700 text-xs font-semibold transition-all cursor-pointer"
                  title="Fermer la palette (les annotations restent visibles)"
                >
                  Fermer
                </button>
              </div>
            </div>

            {/* Bottom Controls: Tools, Colors, Thickness */}
            <div className="flex flex-wrap items-center justify-between gap-3 pt-2 border-t border-slate-800 text-xs">
              
              {/* Tool Selection */}
              <div className="flex items-center gap-1.5 bg-slate-950 p-1 rounded-xl border border-slate-800">
                <button
                  type="button"
                  onClick={() => setDrawTool('run')}
                  className={`px-2.5 py-1 rounded-lg font-bold flex items-center gap-1.5 transition-all cursor-pointer ${
                    drawTool === 'run'
                      ? 'bg-amber-500 text-slate-950 shadow-sm'
                      : 'text-slate-300 hover:text-white hover:bg-slate-800/80'
                  }`}
                  title="Flèche continue droite : course d'un joueur, replacement ou démarquage"
                >
                  <span className="font-mono text-sm">➔</span>
                  <span>Course</span>
                </button>

                <button
                  type="button"
                  onClick={() => setDrawTool('pass')}
                  className={`px-2.5 py-1 rounded-lg font-bold flex items-center gap-1.5 transition-all cursor-pointer ${
                    drawTool === 'pass'
                      ? 'bg-amber-500 text-slate-950 shadow-sm'
                      : 'text-slate-300 hover:text-white hover:bg-slate-800/80'
                  }`}
                  title="Flèche en pointillés : passe au sol, transversale ou tir cadré"
                >
                  <span className="font-mono text-sm tracking-wider">⤍</span>
                  <span>Passe / Tir</span>
                </button>

                <button
                  type="button"
                  onClick={() => setDrawTool('free_arrow')}
                  className={`px-2.5 py-1 rounded-lg font-bold flex items-center gap-1.5 transition-all cursor-pointer ${
                    drawTool === 'free_arrow'
                      ? 'bg-amber-500 text-slate-950 shadow-sm'
                      : 'text-slate-300 hover:text-white hover:bg-slate-800/80'
                  }`}
                  title="Flèche courbée libre : dribble, débordement sur l'aile ou feinte"
                >
                  <span className="font-mono text-sm">〰️➔</span>
                  <span>Dribble / Course libre</span>
                </button>

                <button
                  type="button"
                  onClick={() => setDrawTool('pen')}
                  className={`px-2.5 py-1 rounded-lg font-bold flex items-center gap-1.5 transition-all cursor-pointer ${
                    drawTool === 'pen'
                      ? 'bg-amber-500 text-slate-950 shadow-sm'
                      : 'text-slate-300 hover:text-white hover:bg-slate-800/80'
                  }`}
                  title="Feutre libre : encercler un joueur, baliser une zone ou numéroter"
                >
                  <span>🖊️</span>
                  <span>Feutre</span>
                </button>
              </div>

              {/* Color Palette & Line Width */}
              <div className="flex items-center gap-3">
                {/* Colors */}
                <div className="flex items-center gap-1.5 bg-slate-950 px-2 py-1 rounded-xl border border-slate-800">
                  <span className="text-[10px] font-bold text-slate-400 mr-0.5">Couleur :</span>
                  {[
                    { color: '#FACC15', label: 'Jaune (Éq. 1)' },
                    { color: '#EF4444', label: 'Rouge (Éq. 2)' },
                    { color: '#FFFFFF', label: 'Blanc (Ballon/Neutre)' },
                    { color: '#38BDF8', label: 'Bleu Ciel' }
                  ].map((c) => (
                    <button
                      key={c.color}
                      type="button"
                      onClick={() => setDrawColor(c.color)}
                      style={{ backgroundColor: c.color }}
                      className={`w-5 h-5 rounded-full transition-all cursor-pointer ${
                        drawColor === c.color
                          ? 'ring-2 ring-white ring-offset-2 ring-offset-slate-950 scale-110'
                          : 'opacity-70 hover:opacity-100'
                      }`}
                      title={c.label}
                    />
                  ))}
                </div>

                {/* Line width */}
                <div className="flex items-center gap-1 bg-slate-950 p-1 rounded-xl border border-slate-800">
                  <span className="text-[10px] font-bold text-slate-400 px-1">Trait :</span>
                  {[
                    { width: 2.5, label: 'Fin' },
                    { width: 4.0, label: 'Moyen' },
                    { width: 6.0, label: 'Épais' }
                  ].map((w) => (
                    <button
                      key={w.width}
                      type="button"
                      onClick={() => setDrawLineWidth(w.width)}
                      className={`px-2 py-0.5 rounded text-[11px] font-bold transition-all cursor-pointer ${
                        drawLineWidth === w.width
                          ? 'bg-slate-700 text-white shadow-xs'
                          : 'text-slate-400 hover:text-slate-200'
                      }`}
                    >
                      {w.label}
                    </button>
                  ))}
                </div>
              </div>

            </div>
          </div>
        )}

        {/* Interactive Tactical Arrows Toolbar (Visible when isArrowModeActive is true) */}
        {isArrowModeActive && (
          <div 
            data-html2canvas-ignore="true" 
            className="bg-slate-900 border border-amber-500/50 rounded-xl p-3 shadow-xl space-y-2.5 animate-in fade-in slide-in-from-top-2 select-none"
          >
            <div className="flex flex-wrap items-center justify-between gap-3">
              {/* Left: Mode Title & Info */}
              <div className="flex items-center gap-2">
                <span className="p-1.5 rounded-lg bg-amber-500/20 text-amber-300 border border-amber-500/40">
                  <ArrowRight className="w-4 h-4" />
                </span>
                <div>
                  <div className="text-xs font-bold text-white flex items-center gap-2">
                    <span>Tracé de Flèches Interactives entre Joueurs</span>
                    <span className="text-[10px] bg-emerald-500/20 text-emerald-300 px-1.5 py-0.5 rounded font-mono font-bold">
                      {arrowTool === 'pass' ? '⚽ Trajectoire de Passe' : '🏃 Course sans Ballon'}
                    </span>
                  </div>
                  <div className="text-[11px] text-slate-400">
                    Cliquez sur un joueur de départ puis sur le coéquipier cible (ou un espace libre) pour tracer la flèche.
                  </div>
                </div>
              </div>

              {/* Right: Actions (Undo, Clear, Close) */}
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={handleUndoArrow}
                  disabled={team1Arrows.length === 0 && team2Arrows.length === 0}
                  className="px-2.5 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 disabled:opacity-40 disabled:cursor-not-allowed text-slate-200 border border-slate-700 hover:border-slate-600 text-xs font-semibold flex items-center gap-1.5 transition-all cursor-pointer"
                  title="Annuler la dernière flèche"
                >
                  <Undo2 className="w-3.5 h-3.5 text-amber-400" />
                  <span className="hidden sm:inline">Annuler</span>
                </button>
                <button
                  type="button"
                  onClick={handleClearAllArrows}
                  disabled={team1Arrows.length === 0 && team2Arrows.length === 0}
                  className="px-2.5 py-1.5 rounded-lg bg-rose-950/40 hover:bg-rose-900/60 disabled:opacity-40 disabled:cursor-not-allowed text-rose-300 border border-rose-800/60 text-xs font-semibold flex items-center gap-1.5 transition-all cursor-pointer"
                  title="Effacer toutes les flèches sur les 2 terrains"
                >
                  <Trash2 className="w-3.5 h-3.5 text-rose-400" />
                  <span className="hidden sm:inline">Tout effacer</span>
                </button>
                <button
                  type="button"
                  onClick={() => setIsArrowModeActive(false)}
                  className="px-2.5 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 border border-slate-700 text-xs font-semibold transition-all cursor-pointer"
                  title="Fermer la palette (les flèches restent visibles et animables)"
                >
                  Fermer
                </button>
              </div>
            </div>

            {/* Bottom Controls: Tools, Presets, Colors */}
            <div className="flex flex-wrap items-center justify-between gap-3 pt-2 border-t border-slate-800 text-xs">
              
              {/* Tool Selection (Pass vs Run) */}
              <div className="flex items-center gap-1.5 bg-slate-950 p-1 rounded-xl border border-slate-800">
                <button
                  type="button"
                  onClick={() => setArrowTool('pass')}
                  className={`px-2.5 py-1 rounded-lg font-bold flex items-center gap-1.5 transition-all cursor-pointer ${
                    arrowTool === 'pass'
                      ? 'bg-amber-500 text-slate-950 shadow-sm'
                      : 'text-slate-300 hover:text-white hover:bg-slate-800/80'
                  }`}
                  title="Trajectoire de passe : flèche en pointillés avec ballon animé et aimantation aux coéquipiers"
                >
                  <span>⚽</span>
                  <span>Trajectoire de Passe</span>
                </button>

                <button
                  type="button"
                  onClick={() => setArrowTool('run')}
                  className={`px-2.5 py-1 rounded-lg font-bold flex items-center gap-1.5 transition-all cursor-pointer ${
                    arrowTool === 'run'
                      ? 'bg-sky-500 text-slate-950 shadow-sm'
                      : 'text-slate-300 hover:text-white hover:bg-slate-800/80'
                  }`}
                  title="Course sans ballon : flèche continue d'appel en profondeur, soutien, démarquage ou dédoublement"
                >
                  <span>🏃</span>
                  <span>Course sans Ballon</span>
                </button>
              </div>

              {/* Combinaisons Types FE12 en 1 clic */}
              <div className="flex items-center gap-1.5 bg-slate-950 p-1 rounded-xl border border-slate-800">
                <span className="text-[10px] font-bold text-slate-400 px-1">Combinaisons :</span>
                <button
                  type="button"
                  onClick={() => handleApplyArrowPreset('one-two', applyScope === 'team2' ? 'team2' : 'team1')}
                  className="px-2 py-0.5 rounded bg-slate-800 hover:bg-slate-700 text-amber-300 border border-slate-700 font-bold text-[11px] transition-all cursor-pointer"
                  title="Générer une combinaison d'Une-Deux classique (appui et remise)"
                >
                  ⚡ Une-Deux (1-2)
                </button>
                <button
                  type="button"
                  onClick={() => handleApplyArrowPreset('through-ball', applyScope === 'team2' ? 'team2' : 'team1')}
                  className="px-2 py-0.5 rounded bg-slate-800 hover:bg-slate-700 text-sky-300 border border-slate-700 font-bold text-[11px] transition-all cursor-pointer"
                  title="Générer un appel en profondeur de l'attaquant et passe dans le dos"
                >
                  🎯 Appel Profondeur
                </button>
                <button
                  type="button"
                  onClick={() => handleApplyArrowPreset('overlap', applyScope === 'team2' ? 'team2' : 'team1')}
                  className="px-2 py-0.5 rounded bg-slate-800 hover:bg-slate-700 text-emerald-300 border border-slate-700 font-bold text-[11px] transition-all cursor-pointer"
                  title="Générer une passe sur l'aile et dédoublement du latéral"
                >
                  🏃 Dédoublement
                </button>
              </div>

              {/* Arrow Color Palette */}
              <div className="flex items-center gap-1.5 bg-slate-950 px-2 py-1 rounded-xl border border-slate-800">
                <span className="text-[10px] font-bold text-slate-400 mr-0.5">Couleur :</span>
                {[
                  { color: '#FACC15', label: 'Jaune (Passe / Éq. 1)' },
                  { color: '#38BDF8', label: 'Cyan (Course)' },
                  { color: '#EF4444', label: 'Rouge (Éq. 2)' },
                  { color: '#FFFFFF', label: 'Blanc (Neutre)' }
                ].map((c) => (
                  <button
                    key={c.color}
                    type="button"
                    onClick={() => setArrowColor(c.color)}
                    style={{ backgroundColor: c.color }}
                    className={`w-5 h-5 rounded-full transition-all cursor-pointer ${
                      arrowColor === c.color
                        ? 'ring-2 ring-white ring-offset-2 ring-offset-slate-950 scale-110'
                        : 'opacity-70 hover:opacity-100'
                    }`}
                    title={c.label}
                  />
                ))}
              </div>

            </div>
          </div>
        )}

        {/* Dedicated Team Block & Pressing Zones Control Bar */}
        <div 
          data-html2canvas-ignore="true" 
          className="p-3 sm:p-4 rounded-2xl bg-gradient-to-r from-slate-900 via-slate-900 to-slate-950 border border-amber-500/40 shadow-xl space-y-3"
        >
          <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-3">
            <div className="flex items-center gap-2.5">
              <span className="p-2 rounded-xl bg-amber-500/20 text-amber-300 border border-amber-500/40 shrink-0">
                <Layers className="w-4 h-4" />
              </span>
              <div>
                <div className="flex items-center gap-2">
                  <h4 className="font-extrabold text-xs sm:text-sm text-white">
                    Zones de Pressing & Bloc Équipe (Phase de Jeu)
                  </h4>
                  <span className={`text-[10px] font-mono font-bold px-2 py-0.5 rounded-full border ${
                    activePressingZone === 'none'
                      ? 'bg-slate-800 text-slate-400 border-slate-700'
                      : activePressingZone === 'high'
                      ? 'bg-amber-500/20 text-amber-300 border-amber-500/40'
                      : activePressingZone === 'mid'
                      ? 'bg-cyan-500/20 text-cyan-300 border-cyan-500/40'
                      : activePressingZone === 'low'
                      ? 'bg-emerald-500/20 text-emerald-300 border-emerald-500/40'
                      : 'bg-indigo-500/20 text-indigo-300 border-indigo-500/40'
                  }`}>
                    {activePressingZone === 'none' ? 'Désactivé' : `Zone active : ${activePressingZone.toUpperCase()}`}
                  </span>
                </div>
                <p className="text-[11px] text-slate-400">
                  Activez une zone par-dessus le terrain pour visualiser le positionnement du bloc selon la phase de jeu.
                </p>
              </div>
            </div>

            {/* Opacity Range Slider (Curseur range input 0% à 100%) */}
            <div className="flex items-center gap-2.5 bg-slate-950 px-3 py-1.5 rounded-xl border border-slate-800 self-start lg:self-auto">
              <label htmlFor="pitch-pressing-slider-main" className="text-[11px] font-bold text-slate-300 whitespace-nowrap flex items-center gap-1.5 cursor-pointer">
                <span>Opacité :</span>
                <span className="font-mono text-amber-300 font-extrabold w-10 text-right">
                  {pressingOpacity}%
                </span>
              </label>
              <input
                id="pitch-pressing-slider-main"
                type="range"
                min="0"
                max="100"
                step="5"
                value={pressingOpacity}
                onChange={(e) => setPressingOpacity(Number(e.target.value))}
                className="w-24 sm:w-32 h-2 bg-slate-700 rounded-lg appearance-none cursor-pointer accent-amber-400 hover:accent-amber-300"
                title={`Régler l'opacité des zones de pressing (${pressingOpacity}%)`}
              />
              <div className="flex items-center gap-1 pl-1 border-l border-slate-800">
                {[25, 50, 75, 100].map((preset) => (
                  <button
                    key={preset}
                    type="button"
                    onClick={() => setPressingOpacity(preset)}
                    className={`px-1.5 py-0.5 rounded text-[10px] font-mono font-bold transition-all cursor-pointer ${
                      pressingOpacity === preset
                        ? 'bg-amber-400 text-slate-950 font-black'
                        : 'text-slate-400 hover:text-white bg-slate-800'
                    }`}
                  >
                    {preset}%
                  </button>
                ))}
              </div>
            </div>
          </div>

          {/* Direct Zone Selector Buttons */}
          <div className="flex flex-wrap items-center justify-between gap-2 pt-1 border-t border-slate-800/80 text-xs">
            <div className="flex flex-wrap items-center gap-1.5">
              <button
                type="button"
                onClick={() => handleSelectPressingZone('none')}
                className={`px-3 py-1.5 rounded-xl font-bold transition-all cursor-pointer ${
                  activePressingZone === 'none'
                    ? 'bg-slate-700 text-white shadow-xs ring-1 ring-slate-500'
                    : 'text-slate-400 hover:text-slate-200 bg-slate-950 border border-slate-800 hover:bg-slate-800'
                }`}
              >
                ✕ Masquer
              </button>

              <button
                type="button"
                onClick={() => handleSelectPressingZone('high')}
                className={`px-3 py-1.5 rounded-xl font-bold flex items-center gap-1.5 transition-all cursor-pointer ${
                  activePressingZone === 'high'
                    ? 'bg-amber-500 text-slate-950 shadow-md ring-2 ring-amber-400/50'
                    : 'text-amber-300 hover:text-white bg-slate-950 border border-amber-500/40 hover:bg-slate-800'
                }`}
              >
                <Zap className="w-3.5 h-3.5 text-amber-400" />
                <span>Zone Haute (Pressing Haut)</span>
              </button>

              <button
                type="button"
                onClick={() => handleSelectPressingZone('mid')}
                className={`px-3 py-1.5 rounded-xl font-bold flex items-center gap-1.5 transition-all cursor-pointer ${
                  activePressingZone === 'mid'
                    ? 'bg-cyan-500 text-slate-950 shadow-md ring-2 ring-cyan-400/50'
                    : 'text-cyan-300 hover:text-white bg-slate-950 border border-cyan-500/40 hover:bg-slate-800'
                }`}
              >
                <Compass className="w-3.5 h-3.5 text-cyan-400" />
                <span>Zone Médiane (Bloc Médian)</span>
              </button>

              <button
                type="button"
                onClick={() => handleSelectPressingZone('low')}
                className={`px-3 py-1.5 rounded-xl font-bold flex items-center gap-1.5 transition-all cursor-pointer ${
                  activePressingZone === 'low'
                    ? 'bg-emerald-500 text-slate-950 shadow-md ring-2 ring-emerald-400/50'
                    : 'text-emerald-300 hover:text-white bg-slate-950 border border-emerald-500/40 hover:bg-slate-800'
                }`}
              >
                <Shield className="w-3.5 h-3.5 text-emerald-400" />
                <span>Zone Basse (Bloc Bas)</span>
              </button>

              <button
                type="button"
                onClick={() => handleSelectPressingZone('all')}
                className={`px-3 py-1.5 rounded-xl font-bold flex items-center gap-1.5 transition-all cursor-pointer ${
                  activePressingZone === 'all'
                    ? 'bg-gradient-to-r from-emerald-500 via-cyan-500 to-amber-500 text-slate-950 font-black shadow-md ring-2 ring-indigo-400/50'
                    : 'text-slate-200 hover:text-white bg-slate-950 border border-slate-700 hover:bg-slate-800'
                }`}
              >
                <Layers className="w-3.5 h-3.5" />
                <span>3 Blocs (Vue Globale)</span>
              </button>
            </div>

            {/* Target Team Scope for Pressing */}
            <div className="flex items-center gap-1 bg-slate-950 p-1 rounded-xl border border-slate-800 text-[11px]">
              <span className="text-[10px] text-slate-400 px-1 font-bold">Cible :</span>
              <button
                type="button"
                onClick={() => {
                  setTeam1PressingZone(activePressingZone);
                  setTeam2PressingZone(activePressingZone);
                  setToastMessage("Zones appliquées aux 2 équipes");
                  setTimeout(() => setToastMessage(null), 1500);
                }}
                className="px-2 py-0.5 rounded-lg bg-indigo-600 text-white font-bold cursor-pointer hover:bg-indigo-500"
              >
                Les 2
              </button>
              <button
                type="button"
                onClick={() => {
                  setTeam1PressingZone(activePressingZone);
                  setToastMessage("Zone appliquée à l'Équipe 1");
                  setTimeout(() => setToastMessage(null), 1500);
                }}
                className="px-2 py-0.5 rounded-lg bg-yellow-400 text-slate-950 font-bold cursor-pointer hover:bg-yellow-300"
              >
                Éq. 1
              </button>
              <button
                type="button"
                onClick={() => {
                  setTeam2PressingZone(activePressingZone);
                  setToastMessage("Zone appliquée à l'Équipe 2");
                  setTimeout(() => setToastMessage(null), 1500);
                }}
                className="px-2 py-0.5 rounded-lg bg-rose-600 text-white font-bold cursor-pointer hover:bg-rose-500"
              >
                Éq. 2
              </button>
            </div>
          </div>

          {/* Phase de jeu briefing note */}
          {activePressingZone !== 'none' && (
            <div className="p-2.5 rounded-lg bg-slate-950/80 border border-slate-800 text-[11px] text-slate-300 flex items-start gap-2 animate-in fade-in">
              <span className="p-1 rounded bg-slate-800 text-amber-400 font-bold shrink-0 text-[10px]">
                {activePressingZone === 'high' ? 'PHASE OFFENSIVE' : activePressingZone === 'mid' ? 'PHASE DE TRANSITION' : activePressingZone === 'low' ? 'PHASE DÉFENSIVE' : '3 HAUTEURS DE BLOC'}
              </span>
              <p className="leading-relaxed">
                {activePressingZone === 'high' && (
                  <span><strong>Phase de récupération active & pressing haut :</strong> Le bloc équipe monte d'un cran dans les 30 derniers mètres pour étouffer les relances courtes adverses, cadrer le porteur et forcer le dégagement aérien ou l'interception immédiate.</span>
                )}
                {activePressingZone === 'mid' && (
                  <span><strong>Phase d'équilibre & bloc médian :</strong> L'équipe se positionne autour de la ligne médiane, densifie l'axe central pour fermer les passes intérieures et orienter la circulation adverse vers les couloirs latéraux.</span>
                )}
                {activePressingZone === 'low' && (
                  <span><strong>Phase de verrouillage & bloc bas :</strong> L'équipe se replie compacte devant sa surface de réparation, supprime la profondeur dans le dos et prépare la transition offensive dès la récupération du ballon.</span>
                )}
                {activePressingZone === 'all' && (
                  <span><strong>Découpage complet en 3 tiers :</strong> Permet de visualiser simultanément la zone haute (pressing), la zone médiane (équilibre) et la zone basse (protection) pour expliquer aux joueurs les repères de déplacement selon la position du ballon.</span>
                )}
              </p>
            </div>
          )}
        </div>

        {/* The 2 Soccer Pitches (Team 1 Yellow, Team 2 Red) */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          
          {/* Equipe 1 Pitch (Yellow Accent) */}
          <div 
            ref={team1PitchContainerRef} 
            id="team1-pitch-container" 
            className="bg-slate-900 rounded-2xl p-4 shadow-md border border-slate-800 flex flex-col justify-between"
          >
            <div>
              <div className="flex items-center justify-between mb-3 px-2">
                <div className="flex items-center gap-2">
                  <span className="w-3 h-3 rounded-full bg-[#FFFF00]" />
                  <span className="font-bold text-white text-sm">
                    {period.team1.teamName || 'Equipe 1'} (Coach: {period.team1.coachName || 'Seb'})
                  </span>
                  <span className="text-[11px] font-mono font-black text-amber-300 bg-slate-800 px-2 py-0.5 rounded border border-slate-700 ml-1">
                    {currentTeam1Fav.code}
                  </span>
                  
                  {/* Team 1 dedicated pressing zone pills */}
                  <div className="flex items-center gap-1 bg-slate-800/80 px-2 py-0.5 rounded-lg border border-slate-700 ml-1">
                    <span className="text-[10px] text-slate-400 font-bold hidden sm:inline">Bloc:</span>
                    {(['none', 'high', 'mid', 'low', 'all'] as const).map(z => (
                      <button
                        key={z}
                        type="button"
                        onClick={() => {
                          setTeam1PressingZone(z);
                          setToastMessage(`Équipe 1 : Bloc ${z === 'none' ? 'Désactivé' : z.toUpperCase()}`);
                          setTimeout(() => setToastMessage(null), 1800);
                        }}
                        className={`px-1.5 py-0.5 rounded text-[10px] font-bold transition-all cursor-pointer ${
                          team1PressingZone === z
                            ? z === 'high' ? 'bg-amber-400 text-slate-950 font-black'
                              : z === 'mid' ? 'bg-cyan-400 text-slate-950 font-black'
                              : z === 'low' ? 'bg-emerald-400 text-slate-950 font-black'
                              : z === 'all' ? 'bg-indigo-400 text-slate-950 font-black'
                              : 'bg-slate-700 text-white font-bold'
                            : 'text-slate-400 hover:text-white'
                        }`}
                        title={`Équipe 1 - Zone : ${z}`}
                      >
                        {z === 'none' ? 'Off' : z === 'high' ? 'Haut' : z === 'mid' ? 'Méd.' : z === 'low' ? 'Bas' : '3T'}
                      </button>
                    ))}
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    data-html2canvas-ignore="true"
                    onClick={() => handleExportPng('team1')}
                    disabled={isExportingPng}
                    className="p-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-amber-300 border border-slate-700 hover:border-amber-400/50 transition-all cursor-pointer disabled:opacity-50"
                    title="Exporter uniquement le schéma de l'Équipe 1 en image PNG"
                  >
                    <Camera className="w-3.5 h-3.5" />
                  </button>
                  <button
                    type="button"
                    data-html2canvas-ignore="true"
                    onClick={() => {
                      setRotationTargetTeam('team1');
                      setIsRotationModalOpen(true);
                    }}
                  className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                    t1Suggestions.length > 0
                      ? 'bg-amber-500/20 text-amber-300 border border-amber-500/40 hover:bg-amber-500/30 shadow-xs'
                      : 'bg-slate-800 text-slate-300 border border-slate-700 hover:bg-slate-700'
                  }`}
                  title="Vérifier l'équité du temps de jeu et voir les suggestions de rotation"
                >
                  <ArrowRightLeft className="w-3 h-3 text-amber-400" />
                  <span>Rotation</span>
                  {t1Suggestions.length > 0 && (
                    <span className="px-1.5 py-0.2 rounded-full bg-amber-400 text-slate-950 text-[10px] font-black">
                      {t1Suggestions.length}
                    </span>
                  )}
                </button>
                <span className="text-xs text-amber-300 font-mono font-bold">
                  {period.durationMinutes || 15} min
                </span>
              </div>
            </div>

            {/* Dynamic 7v7 Pitch Graphic for Team 1 */}
            <div 
              ref={team1PitchRef}
              onDragOver={(e) => handlePitchDragOver(e, 'team1')}
              onDrop={() => handlePitchDrop('team1')}
              className={`relative w-full aspect-[4/3] bg-emerald-700 rounded-xl border-2 overflow-hidden p-3 flex flex-col justify-between shadow-inner select-none transition-colors ${
                draggedPlayer && draggedPlayer.team === 'team1' && isMagneticSnappingEnabled
                  ? 'border-amber-400/80 ring-2 ring-amber-400/30'
                  : 'border-emerald-500'
              }`}
            >
              
              {/* Pitch Markings */}
              <div className="absolute inset-0 border-2 border-white/30 pointer-events-none m-2 rounded-lg" />
              <div className="absolute top-1/2 left-0 right-0 h-0.5 bg-white/30 -translate-y-1/2 pointer-events-none" />
              <div className="absolute top-1/2 left-1/2 w-20 h-20 border-2 border-white/30 rounded-full -translate-x-1/2 -translate-y-1/2 pointer-events-none" />
              <div className="absolute top-2 left-1/2 -translate-x-1/2 w-28 h-12 border-b-2 border-x-2 border-white/30 rounded-b-lg pointer-events-none" />
              <div className="absolute bottom-2 left-1/2 -translate-x-1/2 w-28 h-12 border-t-2 border-x-2 border-white/30 rounded-t-lg pointer-events-none" />

              {/* Pressing Zones Tactical Overlay (with adjustable opacity) */}
              <PressingZonesOverlay
                activeZone={team1PressingZone}
                opacity={pressingOpacity}
                teamName={period.team1.teamName}
                formationCode={currentTeam1Fav.code}
              />

              {/* Dynamic Tactical Lines */}
              {currentTeam1Fav.lines.map((line, lineIdx) => {
                const isAttack = line.id === 'attack';
                const isGK = line.id === 'goalkeeper';
                const isDefense = line.id === 'defense';

                return (
                  <div
                    key={line.id}
                    className={`relative z-10 flex items-center ${
                      line.slots.length === 1
                        ? 'justify-center'
                        : line.slots.length === 2
                        ? isDefense ? 'justify-around px-8 sm:px-12' : 'justify-around px-6 sm:px-10'
                        : 'justify-between px-4 sm:px-6'
                    } ${isAttack ? 'pt-1 sm:pt-2' : ''} ${isGK ? 'pb-1 sm:pb-2' : ''}`}
                  >
                    {line.slots.map((posSlot) => {
                      const slotData = period.team1.titulaires[posSlot.slotIndex];
                      const isSelected = Boolean(
                        selectedPlayerForSwap &&
                        selectedPlayerForSwap.team === 'team1' &&
                        selectedPlayerForSwap.type === 'starter' &&
                        selectedPlayerForSwap.index === posSlot.slotIndex
                      );
                      const isRotCandidate = t1Suggestions.some(s => s.starterSlotIndex === posSlot.slotIndex);
                      const playerRep = t1Summary.reports.find(r => 
                        (slotData?.playerId && r.playerId === slotData.playerId) ||
                        (slotData?.playerName && r.playerName.trim().toLowerCase() === slotData.playerName.trim().toLowerCase())
                      );
                      const startsCount = playerRep ? playerRep.totalStarterPeriods : undefined;

                      const isSnapped = Boolean(
                        snappedSlotTarget &&
                        snappedSlotTarget.team === 'team1' &&
                        snappedSlotTarget.slotIndex === posSlot.slotIndex
                      );
                      const isDragged = Boolean(
                        draggedPlayer &&
                        draggedPlayer.team === 'team1' &&
                        draggedPlayer.type === 'starter' &&
                        draggedPlayer.index === posSlot.slotIndex
                      );

                      return (
                        <div
                          key={posSlot.slotIndex}
                          data-tactical-slot="team1"
                          data-slot-index={posSlot.slotIndex}
                          data-slot-role={posSlot.role}
                          draggable
                          onDragStart={() => setDraggedPlayer({ team: 'team1', type: 'starter', index: posSlot.slotIndex })}
                          onDragEnd={handleDragEnd}
                          onDragEnter={() => {
                            if (draggedPlayer && draggedPlayer.team === 'team1' && isMagneticSnappingEnabled) {
                              setSnappedSlotTarget({ team: 'team1', slotIndex: posSlot.slotIndex, role: posSlot.role });
                            }
                          }}
                          onDragOver={(e) => {
                            e.preventDefault();
                            if (draggedPlayer && draggedPlayer.team === 'team1' && isMagneticSnappingEnabled) {
                              if (!snappedSlotTarget || snappedSlotTarget.slotIndex !== posSlot.slotIndex) {
                                setSnappedSlotTarget({ team: 'team1', slotIndex: posSlot.slotIndex, role: posSlot.role });
                              }
                            }
                          }}
                          onDrop={(e) => {
                            e.stopPropagation();
                            if (draggedPlayer && draggedPlayer.team === 'team1') {
                              executeSwap('team1', draggedPlayer, { type: 'starter', index: posSlot.slotIndex });
                              if (isMagneticSnappingEnabled) {
                                setToastMessage(`Joueur aimanté au poste : ${posSlot.role}`);
                                setTimeout(() => setToastMessage(null), 2000);
                              }
                              setDraggedPlayer(null);
                              setSnappedSlotTarget(null);
                            }
                          }}
                          className={`relative transition-transform duration-150 ${
                            isSnapped ? 'scale-115 z-30' : isDragged ? 'opacity-40 scale-95' : ''
                          }`}
                        >
                          <PlayerPin
                            slot={slotData}
                            role={posSlot.role}
                            color="yellow"
                            isGK={isGK}
                            roster={roster}
                            isSelected={isSelected}
                            startsCount={startsCount}
                            isRotationCandidate={isRotCandidate}
                            isSnappedTarget={isSnapped}
                            isAnyDragging={Boolean(draggedPlayer && draggedPlayer.team === 'team1' && !isDragged)}
                            onClick={() => handlePlayerClick('team1', 'starter', posSlot.slotIndex, slotData)}
                          />
                        </div>
                      );
                    })}
                  </div>
                );
              })}

              {/* Interactive Tactical Arrows (Pass trajectories & Off-the-ball runs) */}
              <InteractiveTacticalArrows
                team="team1"
                arrows={team1Arrows}
                onArrowsChange={setTeam1Arrows}
                isArrowModeActive={isArrowModeActive}
                arrowTool={arrowTool}
                arrowColor={arrowColor}
                pitchContainerRef={team1PitchRef}
                onArrowCreated={(arr) => {
                  setToastMessage(`Flèche créée : ${arr.type === 'pass' ? 'Passe' : 'Course sans ballon'}`);
                  setTimeout(() => setToastMessage(null), 2000);
                }}
              />

              {/* Tactical Drawing Transparent Canvas Layer */}
              <TacticalDrawingCanvas
                isDrawingMode={isDrawingMode}
                activeTool={drawTool}
                activeColor={drawColor}
                lineWidth={drawLineWidth}
                strokes={team1Strokes}
                onStrokesChange={setTeam1Strokes}
              />

              {/* Dugout / Banc des remplaçants visible directly ON the pitch */}
              {showSubstitutesNames && period.team1.remplacants.length > 0 && (
                <div 
                  data-tactical-dugout="team1"
                  className="absolute bottom-2.5 right-2.5 z-25 bg-slate-950/90 backdrop-blur-md border border-amber-400/50 rounded-xl px-2.5 py-1.5 shadow-2xl flex items-center gap-2 max-w-[85%] overflow-x-auto"
                >
                  <div className="flex items-center gap-1 shrink-0 border-r border-slate-800 pr-2">
                    <Users className="w-3.5 h-3.5 text-amber-400" />
                    <span className="text-[10px] font-extrabold text-amber-300">Banc</span>
                    <span className="text-[9px] font-mono text-slate-400 font-bold">
                      ({period.team1.remplacants.length})
                    </span>
                  </div>
                  <div className="flex items-center gap-1.5 flex-nowrap">
                    {period.team1.remplacants.map((sub, idx) => {
                      const matched = roster.find(
                        p => (sub.playerId && p.id === sub.playerId) || 
                             (sub.playerName && p.name.trim().toLowerCase() === sub.playerName.trim().toLowerCase())
                      );
                      const isSelected = Boolean(
                        selectedPlayerForSwap &&
                        selectedPlayerForSwap.team === 'team1' &&
                        selectedPlayerForSwap.type === 'sub' &&
                        selectedPlayerForSwap.index === idx
                      );
                      const subRep = t1Summary.reports.find(r => 
                        (sub?.playerId && r.playerId === sub.playerId) ||
                        (sub?.playerName && r.playerName.trim().toLowerCase() === sub.playerName.trim().toLowerCase())
                      );
                      const subStarts = subRep ? subRep.totalStarterPeriods : 0;

                      return (
                        <div
                          key={sub.id || idx}
                          draggable
                          onDragStart={() => setDraggedPlayer({ team: 'team1', type: 'sub', index: idx })}
                          onDragEnd={handleDragEnd}
                          onClick={() => handlePlayerClick('team1', 'sub', idx, sub)}
                          className={`px-2 py-0.5 rounded-lg flex items-center gap-1.5 text-[11px] font-bold cursor-pointer transition-all border shrink-0 shadow-xs ${
                            isSelected
                              ? 'bg-amber-400 text-slate-950 border-amber-300 ring-2 ring-amber-300 scale-105'
                              : 'bg-slate-900/90 hover:bg-slate-800 text-white border-amber-400/50 hover:border-amber-300'
                          }`}
                          title={`Remplaçant : ${sub.playerName || 'Remplaçant'} (${sub.position || 'Poste'}) • ${subStarts}/4 titularisations - Cliquez ou glissez pour permuter`}
                        >
                          <PlayerAvatar player={matched} name={sub.playerName} size="xs" />
                          <span className="text-yellow-300 font-black max-w-[85px] truncate">
                            {sub.playerName || 'Remplaçant'}
                          </span>
                          {matched?.number && (
                            <span className="text-[9px] font-mono text-slate-400 font-bold">
                              #{matched.number}
                            </span>
                          )}
                          <span className="text-[9px] font-mono px-1 rounded bg-slate-800 text-slate-300 border border-slate-700">
                            {subStarts}P
                          </span>
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}

            </div>
          </div>

          {/* Substitutes section below pitch */}
          {showSubstitutesNames && (
            <div className="mt-3 pt-3 border-t border-slate-800 flex flex-col gap-2">
              <div className="flex items-center justify-between text-xs">
                <div className="flex items-center gap-2">
                  <span className="p-1 rounded-md bg-amber-500/20 text-amber-300 border border-amber-500/30">
                    <Users className="w-3.5 h-3.5" />
                  </span>
                  <span className="text-white font-extrabold text-xs">
                    Banc des Remplaçants
                  </span>
                  <span className="text-[10px] font-mono font-bold px-1.5 py-0.2 rounded-full bg-slate-800 text-amber-300 border border-slate-700">
                    {period.team1.remplacants.length} joueur{period.team1.remplacants.length > 1 ? 's' : ''}
                  </span>
                </div>

                <div className="flex items-center gap-1.5">
                  {t1AvailableRoster.length > 0 && (
                    <div className="relative">
                      <button
                        type="button"
                        onClick={() => setAssignSubMenuTeam(assignSubMenuTeam === 'team1' ? null : 'team1')}
                        className="text-[11px] font-bold text-amber-300 bg-amber-500/20 hover:bg-amber-500/30 border border-amber-500/40 px-2 py-0.5 rounded-lg flex items-center gap-1 transition-all cursor-pointer"
                        title="Ajouter un joueur de l'effectif aux remplaçants"
                      >
                        <UserPlus className="w-3 h-3" />
                        <span>+ Assigner ({t1AvailableRoster.length})</span>
                      </button>

                      {assignSubMenuTeam === 'team1' && (
                        <div 
                          className="absolute right-0 bottom-full mb-1.5 z-50 bg-slate-900 border border-amber-500/60 rounded-xl shadow-2xl p-2 min-w-[200px] text-xs"
                          onClick={(e) => e.stopPropagation()}
                        >
                          <div className="flex items-center justify-between pb-1.5 mb-1.5 border-b border-slate-800 text-[11px] font-bold text-slate-300">
                            <span>Effectif disponible</span>
                            <button 
                              type="button" 
                              onClick={() => setAssignSubMenuTeam(null)}
                              className="text-slate-400 hover:text-white p-0.5"
                            >
                              <X className="w-3 h-3" />
                            </button>
                          </div>
                          <div className="space-y-1 max-h-40 overflow-y-auto">
                            {t1AvailableRoster.map(player => (
                              <button
                                key={player.id}
                                type="button"
                                onClick={() => handleAddSubFromRoster('team1', player)}
                                className="w-full flex items-center justify-between p-1.5 rounded-lg hover:bg-amber-500/20 hover:text-amber-300 text-left transition-colors cursor-pointer text-slate-200"
                              >
                                <div className="flex items-center gap-1.5 truncate">
                                  <PlayerAvatar player={player} name={player.name} size="xs" />
                                  <span className="font-bold truncate">{player.name}</span>
                                  {player.number && <span className="text-[10px] text-slate-400 font-mono">#{player.number}</span>}
                                </div>
                                <span className="text-[10px] text-slate-400 shrink-0">{player.defaultPosition}</span>
                              </button>
                            ))}
                          </div>
                        </div>
                      )}
                    </div>
                  )}
                </div>
              </div>

              {/* List of Substitutes */}
              <div className="flex flex-wrap gap-2">
                {period.team1.remplacants.map((sub, idx) => {
                  const matched = roster.find(
                    p => (sub.playerId && p.id === sub.playerId) || 
                         (sub.playerName && p.name.trim().toLowerCase() === sub.playerName.trim().toLowerCase())
                  );
                  const isSelected = Boolean(
                    selectedPlayerForSwap &&
                    selectedPlayerForSwap.team === 'team1' &&
                    selectedPlayerForSwap.type === 'sub' &&
                    selectedPlayerForSwap.index === idx
                  );
                  const isSubRotCandidate = t1Suggestions.some(s => s.subSlotIndex === idx);
                  const subRep = t1Summary.reports.find(r => 
                    (sub?.playerId && r.playerId === sub.playerId) ||
                    (sub?.playerName && r.playerName.trim().toLowerCase() === sub.playerName.trim().toLowerCase())
                  );
                  const subStarts = subRep ? subRep.totalStarterPeriods : 0;

                  return (
                    <div
                      key={sub.id || idx}
                      draggable
                      onDragStart={() => setDraggedPlayer({ team: 'team1', type: 'sub', index: idx })}
                      onDragEnd={handleDragEnd}
                      onDragOver={(e) => e.preventDefault()}
                      onDrop={() => {
                        if (draggedPlayer && draggedPlayer.team === 'team1') {
                          executeSwap('team1', draggedPlayer, { type: 'sub', index: idx });
                          setDraggedPlayer(null);
                          setSnappedSlotTarget(null);
                        }
                      }}
                      onClick={() => handlePlayerClick('team1', 'sub', idx, sub)}
                      className={`px-2.5 py-1.5 rounded-xl font-medium border flex items-center gap-2 shadow-xs cursor-pointer transition-all active:scale-95 group ${
                        isSelected
                          ? 'bg-amber-400 text-slate-950 border-amber-300 ring-2 ring-amber-300 font-bold'
                          : isSubRotCandidate
                          ? 'bg-slate-800/90 text-yellow-300 border-amber-400/80 ring-1 ring-amber-400/40 hover:border-yellow-400'
                          : 'bg-slate-800/90 text-yellow-300 border-slate-700 hover:border-yellow-400/60'
                      }`}
                      title={`Remplaçant : ${sub.playerName || 'Remplaçant'} (${sub.position || 'Poste'}) • ${subStarts}/4 titularisations${isSubRotCandidate ? ' - Rotation conseillée' : ''} - Cliquez ou glissez pour permuter`}
                    >
                      <PlayerAvatar player={matched} name={sub.playerName} size="sm" />
                      <div className="flex flex-col text-left">
                        <span className="font-extrabold text-xs text-white leading-tight">
                          {sub.playerName || 'Remplaçant'}
                        </span>
                        <div className="flex items-center gap-1 text-[10px] text-slate-400">
                          <span>{sub.position || 'Poste'}</span>
                          {matched?.number && (
                            <>
                              <span>•</span>
                              <span className="font-mono font-bold text-slate-300">#{matched.number}</span>
                            </>
                          )}
                        </div>
                      </div>

                      <span className={`text-[10px] font-mono px-1.5 py-0.2 rounded font-bold ${
                        subStarts === 0 
                          ? 'bg-rose-500/30 text-rose-300 border border-rose-500/40 font-black' 
                          : subStarts === 1 
                          ? 'bg-amber-500/30 text-amber-300 border border-amber-500/40 font-bold'
                          : 'bg-slate-700/80 text-slate-300'
                      }`}>
                        {subStarts}/4
                      </span>

                      {isSubRotCandidate && (
                        <ArrowRightLeft className="w-3.5 h-3.5 text-emerald-400 animate-pulse shrink-0" />
                      )}

                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          handleRemoveSub('team1', idx);
                        }}
                        className="opacity-0 group-hover:opacity-100 p-0.5 rounded text-slate-400 hover:text-rose-400 transition-opacity ml-1 cursor-pointer"
                        title="Retirer ce remplaçant du banc"
                      >
                        <X className="w-3 h-3" />
                      </button>
                    </div>
                  );
                })}

                {period.team1.remplacants.length === 0 && (
                  <div className="flex items-center gap-2 text-slate-500 italic text-xs py-1">
                    <span>Aucun remplaçant assigné</span>
                    {t1AvailableRoster.length > 0 && (
                      <button
                        type="button"
                        onClick={() => handleAddSubFromRoster('team1', t1AvailableRoster[0])}
                        className="text-amber-400 not-italic hover:underline font-bold text-[11px] cursor-pointer"
                      >
                        + Assigner {t1AvailableRoster[0].name}
                      </button>
                    )}
                  </div>
                )}
              </div>
            </div>
          )}
        </div>

        {/* Equipe 2 Pitch (Red Accent) */}
        <div 
          ref={team2PitchContainerRef} 
          id="team2-pitch-container" 
          className="bg-slate-900 rounded-2xl p-4 shadow-md border border-slate-800 flex flex-col justify-between"
        >
          <div>
            <div className="flex items-center justify-between mb-3 px-2">
              <div className="flex items-center gap-2">
                <span className="w-3 h-3 rounded-full bg-[#FF0000]" />
                <span className="font-bold text-white text-sm">
                  {period.team2.teamName || 'Equipe 2'} (Coach: {period.team2.coachName || 'Miguel'})
                </span>
                <span className="text-[11px] font-mono font-black text-rose-300 bg-slate-800 px-2 py-0.5 rounded border border-slate-700 ml-1">
                  {currentTeam2Fav.code}
                </span>

                {/* Team 2 dedicated pressing zone pills */}
                <div className="flex items-center gap-1 bg-slate-800/80 px-2 py-0.5 rounded-lg border border-slate-700 ml-1">
                  <span className="text-[10px] text-slate-400 font-bold hidden sm:inline">Bloc:</span>
                  {(['none', 'high', 'mid', 'low', 'all'] as const).map(z => (
                    <button
                      key={z}
                      type="button"
                      onClick={() => {
                        setTeam2PressingZone(z);
                        setToastMessage(`Équipe 2 : Bloc ${z === 'none' ? 'Désactivé' : z.toUpperCase()}`);
                        setTimeout(() => setToastMessage(null), 1800);
                      }}
                      className={`px-1.5 py-0.5 rounded text-[10px] font-bold transition-all cursor-pointer ${
                        team2PressingZone === z
                          ? z === 'high' ? 'bg-amber-400 text-slate-950 font-black'
                            : z === 'mid' ? 'bg-cyan-400 text-slate-950 font-black'
                            : z === 'low' ? 'bg-emerald-400 text-slate-950 font-black'
                            : z === 'all' ? 'bg-indigo-400 text-slate-950 font-black'
                            : 'bg-slate-700 text-white font-bold'
                          : 'text-slate-400 hover:text-white'
                      }`}
                      title={`Équipe 2 - Zone : ${z}`}
                    >
                      {z === 'none' ? 'Off' : z === 'high' ? 'Haut' : z === 'mid' ? 'Méd.' : z === 'low' ? 'Bas' : '3T'}
                    </button>
                  ))}
                </div>
              </div>
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  data-html2canvas-ignore="true"
                  onClick={() => handleExportPng('team2')}
                  disabled={isExportingPng}
                  className="p-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-rose-300 border border-slate-700 hover:border-rose-400/50 transition-all cursor-pointer disabled:opacity-50"
                  title="Exporter uniquement le schéma de l'Équipe 2 en image PNG"
                >
                  <Camera className="w-3.5 h-3.5" />
                </button>
                <button
                  type="button"
                  data-html2canvas-ignore="true"
                  onClick={() => {
                    setRotationTargetTeam('team2');
                    setIsRotationModalOpen(true);
                  }}
                  className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                    t2Suggestions.length > 0
                      ? 'bg-amber-500/20 text-amber-300 border border-amber-500/40 hover:bg-amber-500/30 shadow-xs'
                      : 'bg-slate-800 text-slate-300 border border-slate-700 hover:bg-slate-700'
                  }`}
                  title="Vérifier l'équité du temps de jeu et voir les suggestions de rotation"
                >
                  <ArrowRightLeft className="w-3 h-3 text-amber-400" />
                  <span>Rotation</span>
                  {t2Suggestions.length > 0 && (
                    <span className="px-1.5 py-0.2 rounded-full bg-amber-400 text-slate-950 text-[10px] font-black">
                      {t2Suggestions.length}
                    </span>
                  )}
                </button>
                <span className="text-xs text-rose-300 font-mono font-bold">
                  {period.durationMinutes || 15} min
                </span>
              </div>
            </div>

            {/* Dynamic 7v7 Pitch Graphic for Team 2 */}
            <div 
              ref={team2PitchRef}
              onDragOver={(e) => handlePitchDragOver(e, 'team2')}
              onDrop={() => handlePitchDrop('team2')}
              className={`relative w-full aspect-[4/3] bg-emerald-700 rounded-xl border-2 overflow-hidden p-3 flex flex-col justify-between shadow-inner select-none transition-colors ${
                draggedPlayer && draggedPlayer.team === 'team2' && isMagneticSnappingEnabled
                  ? 'border-amber-400/80 ring-2 ring-amber-400/30'
                  : 'border-emerald-500'
              }`}
            >
              
              {/* Pitch Markings */}
              <div className="absolute inset-0 border-2 border-white/30 pointer-events-none m-2 rounded-lg" />
              <div className="absolute top-1/2 left-0 right-0 h-0.5 bg-white/30 -translate-y-1/2 pointer-events-none" />
              <div className="absolute top-1/2 left-1/2 w-20 h-20 border-2 border-white/30 rounded-full -translate-x-1/2 -translate-y-1/2 pointer-events-none" />
              <div className="absolute top-2 left-1/2 -translate-x-1/2 w-28 h-12 border-b-2 border-x-2 border-white/30 rounded-b-lg pointer-events-none" />
              <div className="absolute bottom-2 left-1/2 -translate-x-1/2 w-28 h-12 border-t-2 border-x-2 border-white/30 rounded-t-lg pointer-events-none" />

              {/* Pressing Zones Tactical Overlay (with adjustable opacity) */}
              <PressingZonesOverlay
                activeZone={team2PressingZone}
                opacity={pressingOpacity}
                teamName={period.team2.teamName}
                formationCode={currentTeam2Fav.code}
              />

              {/* Dynamic Tactical Lines */}
              {currentTeam2Fav.lines.map((line, lineIdx) => {
                const isAttack = line.id === 'attack';
                const isGK = line.id === 'goalkeeper';
                const isDefense = line.id === 'defense';

                return (
                  <div
                    key={line.id}
                    className={`relative z-10 flex items-center ${
                      line.slots.length === 1
                        ? 'justify-center'
                        : line.slots.length === 2
                        ? isDefense ? 'justify-around px-8 sm:px-12' : 'justify-around px-6 sm:px-10'
                        : 'justify-between px-4 sm:px-6'
                    } ${isAttack ? 'pt-1 sm:pt-2' : ''} ${isGK ? 'pb-1 sm:pb-2' : ''}`}
                  >
                    {line.slots.map((posSlot) => {
                      const slotData = period.team2.titulaires[posSlot.slotIndex];
                      const isSelected = Boolean(
                        selectedPlayerForSwap &&
                        selectedPlayerForSwap.team === 'team2' &&
                        selectedPlayerForSwap.type === 'starter' &&
                        selectedPlayerForSwap.index === posSlot.slotIndex
                      );
                      const isRotCandidate = t2Suggestions.some(s => s.starterSlotIndex === posSlot.slotIndex);
                      const playerRep = t2Summary.reports.find(r => 
                        (slotData?.playerId && r.playerId === slotData.playerId) ||
                        (slotData?.playerName && r.playerName.trim().toLowerCase() === slotData.playerName.trim().toLowerCase())
                      );
                      const startsCount = playerRep ? playerRep.totalStarterPeriods : undefined;

                      const isSnapped = Boolean(
                        snappedSlotTarget &&
                        snappedSlotTarget.team === 'team2' &&
                        snappedSlotTarget.slotIndex === posSlot.slotIndex
                      );
                      const isDragged = Boolean(
                        draggedPlayer &&
                        draggedPlayer.team === 'team2' &&
                        draggedPlayer.type === 'starter' &&
                        draggedPlayer.index === posSlot.slotIndex
                      );

                      return (
                        <div
                          key={posSlot.slotIndex}
                          data-tactical-slot="team2"
                          data-slot-index={posSlot.slotIndex}
                          data-slot-role={posSlot.role}
                          draggable
                          onDragStart={() => setDraggedPlayer({ team: 'team2', type: 'starter', index: posSlot.slotIndex })}
                          onDragEnd={handleDragEnd}
                          onDragEnter={() => {
                            if (draggedPlayer && draggedPlayer.team === 'team2' && isMagneticSnappingEnabled) {
                              setSnappedSlotTarget({ team: 'team2', slotIndex: posSlot.slotIndex, role: posSlot.role });
                            }
                          }}
                          onDragOver={(e) => {
                            e.preventDefault();
                            if (draggedPlayer && draggedPlayer.team === 'team2' && isMagneticSnappingEnabled) {
                              if (!snappedSlotTarget || snappedSlotTarget.slotIndex !== posSlot.slotIndex) {
                                setSnappedSlotTarget({ team: 'team2', slotIndex: posSlot.slotIndex, role: posSlot.role });
                              }
                            }
                          }}
                          onDrop={(e) => {
                            e.stopPropagation();
                            if (draggedPlayer && draggedPlayer.team === 'team2') {
                              executeSwap('team2', draggedPlayer, { type: 'starter', index: posSlot.slotIndex });
                              if (isMagneticSnappingEnabled) {
                                setToastMessage(`Joueur aimanté au poste : ${posSlot.role}`);
                                setTimeout(() => setToastMessage(null), 2000);
                              }
                              setDraggedPlayer(null);
                              setSnappedSlotTarget(null);
                            }
                          }}
                          className={`relative transition-transform duration-150 ${
                            isSnapped ? 'scale-115 z-30' : isDragged ? 'opacity-40 scale-95' : ''
                          }`}
                        >
                          <PlayerPin
                            slot={slotData}
                            role={posSlot.role}
                            color="red"
                            isGK={isGK}
                            roster={roster}
                            isSelected={isSelected}
                            startsCount={startsCount}
                            isRotationCandidate={isRotCandidate}
                            isSnappedTarget={isSnapped}
                            isAnyDragging={Boolean(draggedPlayer && draggedPlayer.team === 'team2' && !isDragged)}
                            onClick={() => handlePlayerClick('team2', 'starter', posSlot.slotIndex, slotData)}
                          />
                        </div>
                      );
                    })}
                  </div>
                );
              })}

              {/* Interactive Tactical Arrows (Pass trajectories & Off-the-ball runs) */}
              <InteractiveTacticalArrows
                team="team2"
                arrows={team2Arrows}
                onArrowsChange={setTeam2Arrows}
                isArrowModeActive={isArrowModeActive}
                arrowTool={arrowTool}
                arrowColor={arrowColor}
                pitchContainerRef={team2PitchRef}
                onArrowCreated={(arr) => {
                  setToastMessage(`Flèche créée : ${arr.type === 'pass' ? 'Passe' : 'Course sans ballon'}`);
                  setTimeout(() => setToastMessage(null), 2000);
                }}
              />

              {/* Tactical Drawing Transparent Canvas Layer */}
              <TacticalDrawingCanvas
                isDrawingMode={isDrawingMode}
                activeTool={drawTool}
                activeColor={drawColor}
                lineWidth={drawLineWidth}
                strokes={team2Strokes}
                onStrokesChange={setTeam2Strokes}
              />

              {/* Dugout / Banc des remplaçants visible directly ON the pitch for Team 2 */}
              {showSubstitutesNames && period.team2.remplacants.length > 0 && (
                <div 
                  data-tactical-dugout="team2"
                  className="absolute bottom-2.5 right-2.5 z-25 bg-slate-950/90 backdrop-blur-md border border-rose-500/50 rounded-xl px-2.5 py-1.5 shadow-2xl flex items-center gap-2 max-w-[85%] overflow-x-auto"
                >
                  <div className="flex items-center gap-1 shrink-0 border-r border-slate-800 pr-2">
                    <Users className="w-3.5 h-3.5 text-rose-400" />
                    <span className="text-[10px] font-extrabold text-rose-300">Banc</span>
                    <span className="text-[9px] font-mono text-slate-400 font-bold">
                      ({period.team2.remplacants.length})
                    </span>
                  </div>
                  <div className="flex items-center gap-1.5 flex-nowrap">
                    {period.team2.remplacants.map((sub, idx) => {
                      const matched = roster.find(
                        p => (sub.playerId && p.id === sub.playerId) || 
                             (sub.playerName && p.name.trim().toLowerCase() === sub.playerName.trim().toLowerCase())
                      );
                      const isSelected = Boolean(
                        selectedPlayerForSwap &&
                        selectedPlayerForSwap.team === 'team2' &&
                        selectedPlayerForSwap.type === 'sub' &&
                        selectedPlayerForSwap.index === idx
                      );
                      const subRep = t2Summary.reports.find(r => 
                        (sub?.playerId && r.playerId === sub.playerId) ||
                        (sub?.playerName && r.playerName.trim().toLowerCase() === sub.playerName.trim().toLowerCase())
                      );
                      const subStarts = subRep ? subRep.totalStarterPeriods : 0;

                      return (
                        <div
                          key={sub.id || idx}
                          draggable
                          onDragStart={() => setDraggedPlayer({ team: 'team2', type: 'sub', index: idx })}
                          onDragEnd={handleDragEnd}
                          onClick={() => handlePlayerClick('team2', 'sub', idx, sub)}
                          className={`px-2 py-0.5 rounded-lg flex items-center gap-1.5 text-[11px] font-bold cursor-pointer transition-all border shrink-0 shadow-xs ${
                            isSelected
                              ? 'bg-rose-500 text-white border-rose-400 ring-2 ring-rose-400 scale-105'
                              : 'bg-slate-900/90 hover:bg-slate-800 text-white border-rose-500/50 hover:border-rose-400'
                          }`}
                          title={`Remplaçant : ${sub.playerName || 'Remplaçant'} (${sub.position || 'Poste'}) • ${subStarts}/4 titularisations - Cliquez ou glissez pour permuter`}
                        >
                          <PlayerAvatar player={matched} name={sub.playerName} size="xs" />
                          <span className="text-rose-300 font-extrabold max-w-[85px] truncate">
                            {sub.playerName || 'Remplaçant'}
                          </span>
                          {matched?.number && (
                            <span className="text-[9px] font-mono text-slate-400 font-bold">
                              #{matched.number}
                            </span>
                          )}
                          <span className="text-[9px] font-mono px-1 rounded bg-slate-800 text-slate-300 border border-slate-700">
                            {subStarts}P
                          </span>
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}

            </div>
          </div>

          {/* Substitutes section below pitch for Team 2 */}
          {showSubstitutesNames && (
            <div className="mt-3 pt-3 border-t border-slate-800 flex flex-col gap-2">
              <div className="flex items-center justify-between text-xs">
                <div className="flex items-center gap-2">
                  <span className="p-1 rounded-md bg-rose-500/20 text-rose-300 border border-rose-500/30">
                    <Users className="w-3.5 h-3.5" />
                  </span>
                  <span className="text-white font-extrabold text-xs">
                    Banc des Remplaçants
                  </span>
                  <span className="text-[10px] font-mono font-bold px-1.5 py-0.2 rounded-full bg-slate-800 text-rose-300 border border-slate-700">
                    {period.team2.remplacants.length} joueur{period.team2.remplacants.length > 1 ? 's' : ''}
                  </span>
                </div>

                <div className="flex items-center gap-1.5">
                  {t2AvailableRoster.length > 0 && (
                    <div className="relative">
                      <button
                        type="button"
                        onClick={() => setAssignSubMenuTeam(assignSubMenuTeam === 'team2' ? null : 'team2')}
                        className="text-[11px] font-bold text-rose-300 bg-rose-500/20 hover:bg-rose-500/30 border border-rose-500/40 px-2 py-0.5 rounded-lg flex items-center gap-1 transition-all cursor-pointer"
                        title="Ajouter un joueur de l'effectif aux remplaçants de l'Équipe 2"
                      >
                        <UserPlus className="w-3 h-3" />
                        <span>+ Assigner ({t2AvailableRoster.length})</span>
                      </button>

                      {assignSubMenuTeam === 'team2' && (
                        <div 
                          className="absolute right-0 bottom-full mb-1.5 z-50 bg-slate-900 border border-rose-500/60 rounded-xl shadow-2xl p-2 min-w-[200px] text-xs"
                          onClick={(e) => e.stopPropagation()}
                        >
                          <div className="flex items-center justify-between pb-1.5 mb-1.5 border-b border-slate-800 text-[11px] font-bold text-slate-300">
                            <span>Effectif disponible</span>
                            <button 
                              type="button" 
                              onClick={() => setAssignSubMenuTeam(null)}
                              className="text-slate-400 hover:text-white p-0.5"
                            >
                              <X className="w-3 h-3" />
                            </button>
                          </div>
                          <div className="space-y-1 max-h-40 overflow-y-auto">
                            {t2AvailableRoster.map(player => (
                              <button
                                key={player.id}
                                type="button"
                                onClick={() => handleAddSubFromRoster('team2', player)}
                                className="w-full flex items-center justify-between p-1.5 rounded-lg hover:bg-rose-500/20 hover:text-rose-300 text-left transition-colors cursor-pointer text-slate-200"
                              >
                                <div className="flex items-center gap-1.5 truncate">
                                  <PlayerAvatar player={player} name={player.name} size="xs" />
                                  <span className="font-bold truncate">{player.name}</span>
                                  {player.number && <span className="text-[10px] text-slate-400 font-mono">#{player.number}</span>}
                                </div>
                                <span className="text-[10px] text-slate-400 shrink-0">{player.defaultPosition}</span>
                              </button>
                            ))}
                          </div>
                        </div>
                      )}
                    </div>
                  )}
                </div>
              </div>

              {/* List of Substitutes */}
              <div className="flex flex-wrap gap-2">
                {period.team2.remplacants.map((sub, idx) => {
                  const matched = roster.find(
                    p => (sub.playerId && p.id === sub.playerId) || 
                         (sub.playerName && p.name.trim().toLowerCase() === sub.playerName.trim().toLowerCase())
                  );
                  const isSelected = Boolean(
                    selectedPlayerForSwap &&
                    selectedPlayerForSwap.team === 'team2' &&
                    selectedPlayerForSwap.type === 'sub' &&
                    selectedPlayerForSwap.index === idx
                  );
                  const isSubRotCandidate = t2Suggestions.some(s => s.subSlotIndex === idx);
                  const subRep = t2Summary.reports.find(r => 
                    (sub?.playerId && r.playerId === sub.playerId) ||
                    (sub?.playerName && r.playerName.trim().toLowerCase() === sub.playerName.trim().toLowerCase())
                  );
                  const subStarts = subRep ? subRep.totalStarterPeriods : 0;

                  return (
                    <div
                      key={sub.id || idx}
                      draggable
                      onDragStart={() => setDraggedPlayer({ team: 'team2', type: 'sub', index: idx })}
                      onDragEnd={handleDragEnd}
                      onDragOver={(e) => e.preventDefault()}
                      onDrop={() => {
                        if (draggedPlayer && draggedPlayer.team === 'team2') {
                          executeSwap('team2', draggedPlayer, { type: 'sub', index: idx });
                          setDraggedPlayer(null);
                          setSnappedSlotTarget(null);
                        }
                      }}
                      onClick={() => handlePlayerClick('team2', 'sub', idx, sub)}
                      className={`px-2.5 py-1.5 rounded-xl font-medium border flex items-center gap-2 shadow-xs cursor-pointer transition-all active:scale-95 group ${
                        isSelected
                          ? 'bg-rose-500 text-white border-rose-400 ring-2 ring-rose-400 font-bold'
                          : isSubRotCandidate
                          ? 'bg-slate-800/90 text-rose-300 border-amber-400/80 ring-1 ring-amber-400/40 hover:border-rose-400'
                          : 'bg-slate-800/90 text-rose-300 border-slate-700 hover:border-rose-400/60'
                      }`}
                      title={`Remplaçant : ${sub.playerName || 'Remplaçant'} (${sub.position || 'Poste'}) • ${subStarts}/4 titularisations${isSubRotCandidate ? ' - Rotation conseillée' : ''} - Cliquez ou glissez pour permuter`}
                    >
                      <PlayerAvatar player={matched} name={sub.playerName} size="sm" />
                      <div className="flex flex-col text-left">
                        <span className="font-extrabold text-xs text-white leading-tight">
                          {sub.playerName || 'Remplaçant'}
                        </span>
                        <div className="flex items-center gap-1 text-[10px] text-slate-400">
                          <span>{sub.position || 'Poste'}</span>
                          {matched?.number && (
                            <>
                              <span>•</span>
                              <span className="font-mono font-bold text-slate-300">#{matched.number}</span>
                            </>
                          )}
                        </div>
                      </div>

                      <span className={`text-[10px] font-mono px-1.5 py-0.2 rounded font-bold ${
                        subStarts === 0 
                          ? 'bg-rose-500/30 text-rose-300 border border-rose-500/40 font-black' 
                          : subStarts === 1 
                          ? 'bg-amber-500/30 text-amber-300 border border-amber-500/40 font-bold'
                          : 'bg-slate-700/80 text-slate-300'
                      }`}>
                        {subStarts}/4
                      </span>

                      {isSubRotCandidate && (
                        <ArrowRightLeft className="w-3.5 h-3.5 text-emerald-400 animate-pulse shrink-0" />
                      )}

                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          handleRemoveSub('team2', idx);
                        }}
                        className="opacity-0 group-hover:opacity-100 p-0.5 rounded text-slate-400 hover:text-rose-400 transition-opacity ml-1 cursor-pointer"
                        title="Retirer ce remplaçant du banc"
                      >
                        <X className="w-3 h-3" />
                      </button>
                    </div>
                  );
                })}

                {period.team2.remplacants.length === 0 && (
                  <div className="flex items-center gap-2 text-slate-500 italic text-xs py-1">
                    <span>Aucun remplaçant assigné</span>
                    {t2AvailableRoster.length > 0 && (
                      <button
                        type="button"
                        onClick={() => handleAddSubFromRoster('team2', t2AvailableRoster[0])}
                        className="text-rose-400 not-italic hover:underline font-bold text-[11px] cursor-pointer"
                      >
                        + Assigner {t2AvailableRoster[0].name}
                      </button>
                    )}
                  </div>
                )}
              </div>
            </div>
          )}
        </div>

      </div>

        {/* Footer info visible on the captured PNG & tactical board */}
        <div className="pt-3 border-t border-slate-800/80 flex flex-wrap items-center justify-between text-[11px] text-slate-400 gap-2">
          <div className="flex items-center gap-3">
            <span>Coach Éq. 1 : <strong className="text-slate-200">{period.team1.coachName || 'Seb'}</strong></span>
            <span className="text-slate-700">•</span>
            <span>Coach Éq. 2 : <strong className="text-slate-200">{period.team2.coachName || 'Miguel'}</strong></span>
          </div>
          <div className="text-slate-500 font-mono text-[10px]">
            Export Schéma Tactique FootEco 7v7 • Période {period.periodNumber}
          </div>
        </div>

      </div>

      {/* Modal to manage & customize the 3 favorites */}
      <TacticalFavoritesModal
        isOpen={isManageModalOpen}
        onClose={() => setIsManageModalOpen(false)}
        favorites={favorites}
        activeFavoriteId={team1FavId}
        onFavoritesUpdated={(updated, newActiveId) => {
          setFavorites(updated);
          if (newActiveId) {
            handleSelectFavorite(newActiveId);
          }
        }}
      />

      {/* Modal for 4-period playtime rotation suggestions */}
      <RotationSuggestionModal
        isOpen={isRotationModalOpen}
        onClose={() => setIsRotationModalOpen(false)}
        period={period}
        allPeriods={effectiveAllPeriods}
        initialTeam={rotationTargetTeam}
        onUpdatePeriod={onUpdatePeriod}
        onUpdateAllPeriods={onUpdateAllPeriods}
      />

    </div>
  );
};

interface PlayerPinProps {
  slot?: PlayerSlot;
  role: string;
  color: 'yellow' | 'red';
  isGK?: boolean;
  roster: Player[];
  isSelected?: boolean;
  startsCount?: number;
  isRotationCandidate?: boolean;
  isSnappedTarget?: boolean;
  isAnyDragging?: boolean;
  onClick?: () => void;
}

const PlayerPin: React.FC<PlayerPinProps> = ({ 
  slot, 
  role, 
  color, 
  isGK, 
  roster, 
  isSelected,
  startsCount,
  isRotationCandidate,
  isSnappedTarget,
  isAnyDragging,
  onClick 
}) => {
  const name = slot?.playerName || '-';
  const hasName = Boolean(slot?.playerName);
  const matchedPlayer = roster.find(
    p => (slot?.playerId && p.id === slot.playerId) || 
         (slot?.playerName && p.name.trim().toLowerCase() === slot.playerName.trim().toLowerCase())
  );

  return (
    <div 
      onClick={onClick}
      className={`relative flex flex-col items-center group cursor-pointer transition-all ${
        isSnappedTarget
          ? 'scale-115 -translate-y-1.5 z-30'
          : isSelected 
          ? 'scale-110 -translate-y-1' 
          : 'hover:scale-105'
      }`}
      title={`${hasName ? name : 'Poste vacant'} (${role})${startsCount !== undefined ? ` • ${startsCount}/4 titularisations` : ''}${isRotationCandidate ? ' • Rotation conseillée pour équilibrer le temps de jeu' : ''} - Glissez pour aimanter ou cliquez pour permuter`}
    >
      {/* Floating Magnetic Snapping Indicator Pill */}
      {isSnappedTarget && (
        <div 
          data-html2canvas-ignore="true"
          className="absolute -top-7 left-1/2 -translate-x-1/2 whitespace-nowrap bg-amber-400 text-slate-950 px-2 py-0.5 rounded-full text-[10px] font-black shadow-xl border border-slate-900 flex items-center gap-1 z-30 animate-bounce pointer-events-none"
        >
          <Magnet className="w-3 h-3 text-slate-950 animate-pulse" />
          <span>Aimanté : {role}</span>
        </div>
      )}

      <div className={`relative transition-all rounded-full p-0.5 ${
        isSnappedTarget
          ? 'ring-4 ring-amber-400 shadow-[0_0_25px_rgba(251,191,36,0.95)] bg-amber-400/40'
          : isSelected 
          ? 'ring-4 ring-amber-400 shadow-xl bg-amber-400/30 animate-pulse' 
          : 'group-hover:ring-2 group-hover:ring-white/80'
      }`}>
        {/* Concentric Magnetic Attraction Wave Effects */}
        {isSnappedTarget && (
          <>
            <span className="absolute -inset-2 rounded-full border-2 border-amber-300 animate-ping opacity-80 pointer-events-none" />
            <span className="absolute -inset-3.5 rounded-full border border-amber-400/60 pointer-events-none animate-pulse" />
          </>
        )}

        {/* Magnetic Target Receptor Ring when dragging any player on pitch */}
        {isAnyDragging && !isSnappedTarget && (
          <span className="absolute -inset-1 rounded-full border border-dashed border-amber-300/50 pointer-events-none" />
        )}

        {matchedPlayer ? (
          <PlayerAvatar player={matchedPlayer} size="md" showBorder />
        ) : (
          <div
            className={`w-7 h-7 sm:w-8 sm:h-8 rounded-full border-2 border-white shadow-md flex items-center justify-center text-xs font-black ${
              isGK
                ? 'bg-amber-400 text-slate-900'
                : color === 'yellow'
                ? 'bg-yellow-300 text-slate-900'
                : 'bg-red-600 text-white'
            }`}
          >
            {isGK ? 'G' : name.charAt(0) || '•'}
          </div>
        )}

        {/* Floating Rotation Candidate Badge */}
        {isRotationCandidate && (
          <div 
            className="absolute -top-1 -right-1 bg-amber-400 text-slate-950 p-0.5 rounded-full shadow-md border border-slate-900 animate-bounce"
            title="Rotation suggérée pour équilibrer le temps de jeu"
          >
            <ArrowRightLeft className="w-2.5 h-2.5" />
          </div>
        )}
      </div>

      <div className="flex items-center gap-1 mt-0.5 max-w-[85px] justify-center">
        <span className={`text-white text-[10px] font-bold px-1.5 py-0.5 rounded shadow-xs truncate text-center transition-colors ${
          isSnappedTarget
            ? 'bg-amber-400 text-slate-950 font-black shadow-md'
            : isSelected
            ? 'bg-amber-500 text-slate-950 font-black'
            : 'bg-slate-950/85 backdrop-blur-xs'
        }`}>
          {hasName ? name : role}
        </span>

        {startsCount !== undefined && hasName && (
          <span 
            className={`text-[9px] font-mono font-bold px-1 rounded shadow-xs shrink-0 ${
              startsCount >= 3 
                ? 'bg-amber-400 text-slate-950' 
                : startsCount === 0 
                ? 'bg-rose-500 text-white' 
                : 'bg-slate-800 text-slate-300 border border-slate-700'
            }`}
            title={`${startsCount}/4 titularisations`}
          >
            {startsCount}P
          </span>
        )}
      </div>

      {/* Role tag under name */}
      <span className={`text-[9px] font-semibold text-center tracking-tight truncate max-w-[80px] drop-shadow-xs transition-colors ${
        isSnappedTarget ? 'text-amber-200 font-bold' : 'text-emerald-200/90'
      }`}>
        {role}
      </span>
    </div>
  );
};
