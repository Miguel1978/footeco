import React, { useState, useEffect } from 'react';
import { MatchData } from '../types';
import { 
  Trophy, 
  Clock, 
  Users, 
  Printer, 
  Download, 
  Upload, 
  RotateCcw, 
  BarChart3, 
  Play, 
  Pause,
  Calendar,
  Shield,
  FileSpreadsheet,
  FileText,
  FileDown,
  Loader2,
  Check,
  LogIn,
  LogOut,
  UserCheck,
  ShieldCheck,
  Settings,
  Handshake,
  ClipboardCheck,
  Medal,
  CalendarRange,
  Sparkles,
  ExternalLink,
  BookOpen,
  Copy,
  Maximize2,
  Minimize2
} from 'lucide-react';
import { exportMatchAsJSON } from '../utils/storage';
import { getInitialMatchData } from '../initialData';
import { exportMatchToExcel } from '../utils/excelExport';
import { exportMatchToPdf } from '../utils/pdfExport';
import { PeriodPdfPreviewModal } from './PeriodPdfPreviewModal';
import { CopyCompoModal } from './CopyCompoModal';
import { useAuth } from '../contexts/AuthContext';
import { AuthModal } from './AuthModal';
import { UserManagementModal } from './UserManagementModal';
import { FirebaseSyncBadge } from './FirebaseSyncBadge';
import { FirebaseSyncState } from '../types';
import { 
  EventType, 
  EVENT_TYPES_CONFIG, 
  getSeasonFromDate, 
  getAvailableSeasons, 
  getEventTypeConfig 
} from '../utils/season';


interface HeaderProps {
  matchData: MatchData;
  onUpdateMatch: (updater: (prev: MatchData) => MatchData) => void;
  onOpenDurationModal: () => void;
  onOpenRosterModal: () => void;
  onOpenStatsModal: () => void;
  onOpenTimerModal: () => void;
  onOpenCalendarModal?: () => void;
  onOpenTrainingModal?: () => void;
  activePeriodIndex: number;
  timerSecondsLeft: number;
  isTimerRunning: boolean;
  onToggleTimer: () => void;
  firebaseSyncState?: FirebaseSyncState;
  lastSyncedAt?: Date | null;
  lastLocalSavedAt?: Date | null;
  syncErrorMessage?: string | null;
  onForceSync?: () => void;
  // Legacy backward-compatibility props
  saveStatus?: 'saved' | 'saving';
  onForceSave?: () => void;
}

export const Header: React.FC<HeaderProps> = ({
  matchData,
  onUpdateMatch,
  onOpenDurationModal,
  onOpenRosterModal,
  onOpenStatsModal,
  onOpenTimerModal,
  onOpenCalendarModal,
  onOpenTrainingModal,
  activePeriodIndex,
  timerSecondsLeft,
  isTimerRunning,
  onToggleTimer,
  firebaseSyncState = 'synced',
  lastSyncedAt,
  lastLocalSavedAt,
  syncErrorMessage,
  onForceSync,
  saveStatus = 'saved',
  onForceSave,
}) => {
  const [isEditingTitle, setIsEditingTitle] = useState(false);
  const [showConfirmReset, setShowConfirmReset] = useState(false);
  const [isExportingPdf, setIsExportingPdf] = useState(false);
  const [pdfExportSuccess, setPdfExportSuccess] = useState(false);
  const [isExportingExcel, setIsExportingExcel] = useState(false);
  const [excelExportSuccess, setExcelExportSuccess] = useState(false);
  const [showPeriodPdfModal, setShowPeriodPdfModal] = useState(false);
  const [showCopyCompoModal, setShowCopyCompoModal] = useState(false);
  const [copyNotification, setCopyNotification] = useState<string | null>(null);
  const [isFullscreen, setIsFullscreen] = useState(false);

  // Fullscreen event listener to keep state in sync
  useEffect(() => {
    const handleFullscreenChange = () => {
      const doc = document as any;
      const isFull = !!(
        doc.fullscreenElement ||
        doc.webkitFullscreenElement ||
        doc.mozFullScreenElement ||
        doc.msFullscreenElement
      );
      setIsFullscreen(isFull);
    };

    document.addEventListener('fullscreenchange', handleFullscreenChange);
    document.addEventListener('webkitfullscreenchange', handleFullscreenChange);
    document.addEventListener('mozfullscreenchange', handleFullscreenChange);
    document.addEventListener('MSFullscreenChange', handleFullscreenChange);

    return () => {
      document.removeEventListener('fullscreenchange', handleFullscreenChange);
      document.removeEventListener('webkitfullscreenchange', handleFullscreenChange);
      document.removeEventListener('mozfullscreenchange', handleFullscreenChange);
      document.removeEventListener('MSFullscreenChange', handleFullscreenChange);
    };
  }, []);

  const toggleFullscreen = async () => {
    try {
      const doc = document as any;
      const docEl = document.documentElement as any;

      const isFull = !!(
        doc.fullscreenElement ||
        doc.webkitFullscreenElement ||
        doc.mozFullScreenElement ||
        doc.msFullscreenElement
      );

      if (!isFull) {
        if (docEl.requestFullscreen) {
          await docEl.requestFullscreen();
        } else if (docEl.webkitRequestFullscreen) {
          await docEl.webkitRequestFullscreen();
        } else if (docEl.mozRequestFullScreen) {
          await docEl.mozRequestFullScreen();
        } else if (docEl.msRequestFullscreen) {
          await docEl.msRequestFullscreen();
        }
      } else {
        if (doc.exitFullscreen) {
          await doc.exitFullscreen();
        } else if (doc.webkitExitFullscreen) {
          await doc.webkitExitFullscreen();
        } else if (doc.mozCancelFullScreen) {
          await doc.mozCancelFullScreen();
        } else if (doc.msExitFullscreen) {
          await doc.msExitFullscreen();
        }
      }
    } catch (err) {
      console.warn('Erreur lors du basculement plein écran:', err);
    }
  };

  // Auth modals & context
  const { user, userProfile, isAdmin, logout } = useAuth();
  const [showAuthModal, setShowAuthModal] = useState(false);
  const [showUsersModal, setShowUsersModal] = useState(false);

  const totalMatchMinutes = matchData.periods.reduce((acc, p) => acc + (p.durationMinutes || 15), 0);


  const handleExportPdf = async () => {
    setIsExportingPdf(true);
    try {
      const success = await exportMatchToPdf(matchData);
      if (success) {
        setPdfExportSuccess(true);
        setTimeout(() => setPdfExportSuccess(false), 2500);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setIsExportingPdf(false);
    }
  };

  const handleExportExcel = () => {
    setIsExportingExcel(true);
    try {
      exportMatchToExcel(matchData);
      setExcelExportSuccess(true);
      setTimeout(() => setExcelExportSuccess(false), 2500);
    } catch (err) {
      console.error(err);
      alert('Erreur lors de la génération du fichier Excel');
    } finally {
      setIsExportingExcel(false);
    }
  };

  // Compute calculated aggregate score if present
  let team1TotalGoals = 0;
  let team1OpponentGoals = 0;
  let team2TotalGoals = 0;
  let team2OpponentGoals = 0;
  let hasAnyScore = false;

  matchData.periods.forEach(p => {
    if (p.team1.scoreMatch) {
      const parsed = parseInt(p.team1.scoreMatch, 10);
      if (!isNaN(parsed)) {
        team1TotalGoals += parsed;
        hasAnyScore = true;
      }
    }
    if (p.team1.scoreOpponent) {
      const parsed = parseInt(p.team1.scoreOpponent, 10);
      if (!isNaN(parsed)) team1OpponentGoals += parsed;
    }
    if (p.team2.scoreMatch) {
      const parsed = parseInt(p.team2.scoreMatch, 10);
      if (!isNaN(parsed)) {
        team2TotalGoals += parsed;
        hasAnyScore = true;
      }
    }
    if (p.team2.scoreOpponent) {
      const parsed = parseInt(p.team2.scoreOpponent, 10);
      if (!isNaN(parsed)) team2OpponentGoals += parsed;
    }
  });

  const formatTimerDisplay = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  const handleImportJSON = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (event) => {
      try {
        const parsed = JSON.parse(event.target?.result as string);
        if (parsed && Array.isArray(parsed.periods)) {
          onUpdateMatch(() => parsed);
        }
      } catch (err) {
        alert('Fichier JSON invalide');
      }
    };
    reader.readAsText(file);
    e.target.value = '';
  };

  const handleReset = () => {
    onUpdateMatch(() => getInitialMatchData());
    setShowConfirmReset(false);
  };

  return (
    <header className="bg-white border-b border-slate-200 shadow-sm print:hidden">
      {/* Top Bar / App Identity */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 py-3 flex flex-wrap items-center justify-between gap-3 border-b border-slate-100">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-emerald-700 text-white flex items-center justify-center font-bold text-lg shadow-sm">
            <Trophy className="w-5 h-5 text-amber-300" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="font-bold text-slate-900 text-lg tracking-tight">Footeco FE12</span>
              <span className="bg-emerald-100 text-emerald-800 text-xs font-semibold px-2 py-0.5 rounded-full">
                Bas-Valais
              </span>
              <span className="bg-amber-100 text-amber-800 text-xs font-semibold px-2 py-0.5 rounded-full">
                {matchData.periods.length}x {matchData.periods[0]?.durationMinutes || 15} min ({totalMatchMinutes} min total)
              </span>

              {/* Dynamic Firebase Synchronization Badge */}
              <FirebaseSyncBadge
                syncState={firebaseSyncState}
                lastSyncedAt={lastSyncedAt ?? null}
                lastLocalSavedAt={lastLocalSavedAt ?? null}
                errorMessage={syncErrorMessage}
                onForceSync={onForceSync || onForceSave || (() => {})}
                isAuthenticated={!!user}
              />

              {/* Local Storage Auto-Save Indicator */}
              <div 
                className="hidden xl:inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full text-[11px] font-medium bg-emerald-50 text-emerald-800 border border-emerald-200/80 shadow-2xs"
                title="Sauvegarde automatique locale (localStorage) active à chaque modification du score ou de la composition"
              >
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                <span>Auto-sauvegardé</span>
              </div>
            </div>
            <p className="text-xs text-slate-500">Feuille de match officielle & rotation des joueurs</p>
          </div>
        </div>

        {/* Global Action Toolbar */}
        <div className="flex items-center flex-wrap gap-2">
          {/* Quick Timer Launcher */}
          <div className="flex items-center bg-slate-900 text-white rounded-lg p-1 px-2.5 shadow-sm">
            <button
              onClick={onToggleTimer}
              className={`p-1.5 rounded-md text-xs font-medium flex items-center gap-1.5 transition-colors ${
                isTimerRunning ? 'bg-amber-500 text-slate-950 hover:bg-amber-400' : 'bg-emerald-600 text-white hover:bg-emerald-500'
              }`}
              title={isTimerRunning ? 'Mettre en pause' : 'Démarrer le chrono'}
            >
              {isTimerRunning ? <Pause className="w-3.5 h-3.5" /> : <Play className="w-3.5 h-3.5" />}
              <span className="font-mono font-bold">{formatTimerDisplay(timerSecondsLeft)}</span>
            </button>
            <button
              onClick={onOpenTimerModal}
              className="ml-1.5 text-xs text-slate-300 hover:text-white px-1.5 py-1 hover:bg-slate-800 rounded transition-colors"
              title="Ouvrir le panneau chronomètre"
            >
              <Clock className="w-3.5 h-3.5" />
            </button>
          </div>

          {/* Durées 4x 15 min */}
          <button
            onClick={onOpenDurationModal}
            className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-slate-700 bg-slate-100 hover:bg-slate-200 border border-slate-300 rounded-lg transition-colors"
            title="Modifier les durées des périodes (4x 15 min)"
          >
            <Clock className="w-3.5 h-3.5 text-slate-600" />
            <span>Durées ({matchData.periods.length}x)</span>
          </button>

          {/* Effectif / Joueurs */}
          <button
            onClick={onOpenRosterModal}
            className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-slate-700 bg-slate-100 hover:bg-slate-200 border border-slate-300 rounded-lg transition-colors"
          >
            <Users className="w-3.5 h-3.5 text-slate-600" />
            <span>Effectif ({matchData.roster.length})</span>
          </button>

          {/* Séances d'Entraînement (Fiches officielles) */}
          {onOpenTrainingModal && (
            <button
              onClick={onOpenTrainingModal}
              className={`flex items-center gap-1.5 px-3 py-1.5 text-xs font-bold rounded-lg border transition-all shadow-2xs ${
                matchData.eventType === 'entrainement'
                  ? 'bg-emerald-600 text-white hover:bg-emerald-700 border-emerald-700 ring-2 ring-emerald-400/40 animate-pulse'
                  : 'text-emerald-950 bg-emerald-50 hover:bg-emerald-100 border-emerald-300'
              }`}
              title="Ouvrir le module des fiches de séances d'entraînement FootEco (Thèmes TE/TA, Schémas et Bilans)"
            >
              <ClipboardCheck className="w-3.5 h-3.5" />
              <span>Séances Entraînement</span>
            </button>
          )}

          {/* Bibliothèque d'exercices ClubCorner ASF */}
          <a
            href="https://clubcorner.ch/trainer/teams/61043/uebungsbibliothek"
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-bold text-red-950 bg-red-50 hover:bg-red-100 border border-red-200 rounded-lg transition-all shadow-2xs group"
            title="Ouvrir directement la Bibliothèque d'exercices ClubCorner ASF officielle de l'équipe (61043)"
          >
            <BookOpen className="w-3.5 h-3.5 text-red-700" />
            <span className="hidden sm:inline">ClubCorner Exercices</span>
            <span className="sm:hidden">ClubCorner</span>
            <ExternalLink className="w-3 h-3 text-red-500 group-hover:translate-x-0.5 transition-transform" />
          </a>

          {/* Calendrier & Historique */}
          {onOpenCalendarModal && (
            <button
              onClick={onOpenCalendarModal}
              className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-emerald-900 bg-emerald-50 hover:bg-emerald-100 border border-emerald-300 rounded-lg transition-colors"
              title="Ouvrir le calendrier des rencontres et l'historique des matchs"
            >
              <Calendar className="w-3.5 h-3.5 text-emerald-700" />
              <span>Calendrier</span>
            </button>
          )}

          {/* Stats & Bilan Évaluations */}
          <button
            onClick={onOpenStatsModal}
            className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-slate-700 bg-slate-100 hover:bg-slate-200 border border-slate-300 rounded-lg transition-colors"
            title="Bilan des matches, évaluations 1-5 & temps de jeu"
          >
            <BarChart3 className="w-3.5 h-3.5 text-indigo-600" />
            <span>Bilan & Évals</span>
          </button>

          {/* Copier Compo */}
          <button
            type="button"
            onClick={() => setShowCopyCompoModal(true)}
            className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-bold text-slate-800 bg-white hover:bg-slate-100 border border-slate-300 rounded-lg shadow-2xs transition-all active:scale-95 cursor-pointer"
            title="Copier ou dupliquer la composition d'un match vers les autres"
          >
            <Copy className="w-3.5 h-3.5 text-indigo-600" />
            <span>Copier Compo</span>
          </button>

          {/* Export Excel (.xlsx - Les 4 Matchs) */}
          <button
            onClick={handleExportExcel}
            disabled={isExportingExcel}
            className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-bold text-emerald-950 bg-emerald-100 hover:bg-emerald-200 border border-emerald-300 rounded-lg shadow-2xs transition-all active:scale-95 disabled:opacity-50 cursor-pointer"
            title="Exporter les 4 matchs et statistiques complètes en format Excel (.xlsx)"
          >
            {isExportingExcel ? (
              <Loader2 className="w-3.5 h-3.5 animate-spin text-emerald-700" />
            ) : excelExportSuccess ? (
              <Check className="w-3.5 h-3.5 text-emerald-700" />
            ) : (
              <FileSpreadsheet className="w-3.5 h-3.5 text-emerald-700" />
            )}
            <span>Excel (4 Matchs)</span>
          </button>

          {/* Bouton d'accès rapide 'Exporter tout' (Export PDF complet de toutes les périodes sans menu intermédiaire) */}
          <button
            id="btn-quick-export-all-pdf"
            type="button"
            onClick={handleExportPdf}
            disabled={isExportingPdf}
            className="flex items-center gap-1.5 px-3.5 py-1.5 text-xs font-bold text-white bg-rose-600 hover:bg-rose-700 active:scale-95 disabled:opacity-60 rounded-lg shadow-2xs transition-all cursor-pointer ring-1 ring-rose-500"
            title="Exporter tout : Télécharger directement le PDF officiel complet de toutes les périodes sans ouvrir le menu contextuel de chaque période (4 pages A4 paysage)"
          >
            {isExportingPdf ? (
              <>
                <Loader2 className="w-3.5 h-3.5 animate-spin text-white shrink-0" />
                <span>Export en cours...</span>
              </>
            ) : pdfExportSuccess ? (
              <>
                <Check className="w-3.5 h-3.5 text-white shrink-0" />
                <span>Tout exporté !</span>
              </>
            ) : (
              <>
                <FileDown className="w-3.5 h-3.5 text-white shrink-0" />
                <span>Exporter tout</span>
              </>
            )}
          </button>

          {/* Aperçu PDF & Export Période */}
          <button
            type="button"
            onClick={() => setShowPeriodPdfModal(true)}
            className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-bold text-indigo-950 bg-indigo-100 hover:bg-indigo-200 border border-indigo-300 rounded-lg shadow-2xs transition-all active:scale-95 cursor-pointer"
            title={`Aperçu avant impression et export PDF (${matchData.periods[activePeriodIndex]?.title || `Période ${activePeriodIndex + 1}`} ou 4 Matchs)`}
          >
            <FileText className="w-3.5 h-3.5 text-indigo-700" />
            <span>Aperçu PDF</span>
          </button>

          {/* Print Sheet */}
          <button
            onClick={() => window.print()}
            className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-slate-700 bg-slate-100 hover:bg-slate-200 border border-slate-300 rounded-lg transition-colors cursor-pointer"
            title="Imprimer directement la feuille officielle"
          >
            <Printer className="w-3.5 h-3.5 text-slate-600" />
            <span>Imprimer</span>
          </button>

          {/* Bascule Plein Écran (Tablette / Match) */}
          <button
            id="navbar-toggle-fullscreen-btn"
            type="button"
            onClick={toggleFullscreen}
            className={`flex items-center gap-1.5 px-3 py-1.5 text-xs font-bold rounded-lg border shadow-2xs transition-all active:scale-95 cursor-pointer ${
              isFullscreen
                ? 'bg-amber-500 hover:bg-amber-600 text-white border-amber-600 ring-2 ring-amber-300/60'
                : 'bg-white hover:bg-slate-100 text-slate-700 hover:text-slate-900 border-slate-300'
            }`}
            title={
              isFullscreen
                ? "Quitter le mode plein écran (Échap)"
                : "Passer en mode plein écran (maximise l'espace de travail sur tablette pendant le match)"
            }
            aria-label={isFullscreen ? "Quitter le mode plein écran" : "Basculer en mode plein écran"}
          >
            {isFullscreen ? (
              <>
                <Minimize2 className="w-3.5 h-3.5 text-white shrink-0" />
                <span>Quitter Plein Écran</span>
              </>
            ) : (
              <>
                <Maximize2 className="w-3.5 h-3.5 text-indigo-600 shrink-0" />
                <span>Plein Écran</span>
              </>
            )}
          </button>

          {/* Export JSON */}
          <button
            onClick={() => exportMatchAsJSON(matchData)}
            className="p-1.5 text-slate-600 hover:text-slate-900 hover:bg-slate-100 rounded-lg border border-slate-200"
            title="Exporter en JSON"
          >
            <Download className="w-4 h-4" />
          </button>

          {/* Import JSON */}
          <label
            className="p-1.5 text-slate-600 hover:text-slate-900 hover:bg-slate-100 rounded-lg border border-slate-200 cursor-pointer"
            title="Importer un fichier JSON"
          >
            <Upload className="w-4 h-4" />
            <input type="file" accept=".json" onChange={handleImportJSON} className="hidden" />
          </label>

          {/* Reset */}
          <button
            onClick={() => setShowConfirmReset(true)}
            className="p-1.5 text-rose-600 hover:text-rose-800 hover:bg-rose-50 rounded-lg border border-rose-200"
            title="Réinitialiser la feuille"
          >
            <RotateCcw className="w-4 h-4" />
          </button>

          {/* Authentication & User Roles Section */}
          <div className="h-5 w-px bg-slate-300 mx-0.5" />

          {user ? (
            <div className="flex items-center gap-1.5 bg-slate-100/90 border border-slate-200/80 p-1 pl-2 rounded-xl text-xs">
              <div className="flex items-center gap-1.5">
                <div className="w-6 h-6 rounded-full bg-indigo-600 text-white font-bold flex items-center justify-center text-[10px] shadow-2xs">
                  {user.photoURL ? (
                    <img src={user.photoURL} alt="User" className="w-full h-full rounded-full object-cover" />
                  ) : (
                    (user.displayName || user.email || 'U').charAt(0).toUpperCase()
                  )}
                </div>
                <div className="hidden sm:flex flex-col text-left">
                  <span className="font-extrabold text-slate-800 text-[11px] leading-tight truncate max-w-[100px]">
                    {user.displayName || user.email?.split('@')[0] || 'Coach'}
                  </span>
                  <span className="text-[9px] font-bold text-indigo-600 leading-none">
                    {isAdmin ? '🛡️ Admin' : userProfile?.role === 'coach' ? '⚽ Coach' : '👁️ Observateur'}
                  </span>
                </div>
              </div>

              {/* Admin Button to manage users */}
              {isAdmin && (
                <button
                  type="button"
                  onClick={() => setShowUsersModal(true)}
                  className="p-1.5 text-indigo-700 hover:text-indigo-950 hover:bg-indigo-100 rounded-lg transition-colors"
                  title="Gérer les accès et rôles des utilisateurs"
                >
                  <Settings className="w-3.5 h-3.5" />
                </button>
              )}

              {/* Logout Button */}
              <button
                type="button"
                onClick={logout}
                className="p-1.5 text-slate-500 hover:text-rose-700 hover:bg-rose-50 rounded-lg transition-colors"
                title="Se déconnecter"
              >
                <LogOut className="w-3.5 h-3.5" />
              </button>
            </div>
          ) : (
            <button
              type="button"
              onClick={() => setShowAuthModal(true)}
              className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-bold text-white bg-indigo-600 hover:bg-indigo-700 rounded-xl shadow-2xs transition-all active:scale-95 cursor-pointer"
              title="Connexion administrateur / coach"
            >
              <LogIn className="w-3.5 h-3.5" />
              <span>Connexion Admin</span>
            </button>
          )}
        </div>
      </div>


      {/* Official Match & Evaluation Banner Header */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 py-2.5">
        <div className="bg-slate-50 p-3 rounded-2xl border border-slate-200/80 shadow-2xs space-y-2.5">
          
          {/* Row 1: Event Type Selector & Season Selector */}
          <div className="flex flex-wrap items-center justify-between gap-2 pb-2 border-b border-slate-200/60">
            {/* Event Type Pills */}
            <div className="flex items-center gap-1.5 flex-wrap">
              <span className="text-[10px] font-extrabold uppercase tracking-wider text-slate-500 mr-1 hidden sm:inline">
                Type :
              </span>
              
              {/* Championnat */}
              <button
                type="button"
                onClick={() => {
                  onUpdateMatch(prev => ({
                    ...prev,
                    eventType: 'championnat',
                    matchTitle: prev.matchTitle === 'Entraînement & Évaluation FE12' || prev.matchTitle === 'Match Amical FE12' ? 'Championnat FE12' : prev.matchTitle
                  }));
                }}
                className={`flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs font-extrabold transition-all cursor-pointer ${
                  (matchData.eventType || 'championnat') === 'championnat'
                    ? 'bg-amber-500 text-white shadow-xs scale-102'
                    : 'bg-white text-slate-600 hover:bg-slate-100 border border-slate-200'
                }`}
                title="Match officiel de championnat FootEco"
              >
                <Trophy className="w-3.5 h-3.5" />
                <span>Championnat</span>
              </button>

              {/* Match Amical */}
              <button
                type="button"
                onClick={() => {
                  onUpdateMatch(prev => ({
                    ...prev,
                    eventType: 'amical',
                    matchTitle: prev.matchTitle === 'Championnat FE12' || prev.matchTitle === 'Entraînement & Évaluation FE12' ? 'Match Amical FE12' : prev.matchTitle
                  }));
                }}
                className={`flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs font-extrabold transition-all cursor-pointer ${
                  matchData.eventType === 'amical'
                    ? 'bg-blue-600 text-white shadow-xs scale-102'
                    : 'bg-white text-slate-600 hover:bg-slate-100 border border-slate-200'
                }`}
                title="Match amical de préparation"
              >
                <Handshake className="w-3.5 h-3.5" />
                <span>Match Amical</span>
              </button>

              {/* Entraînement / Évaluation */}
              <button
                type="button"
                onClick={() => {
                  onUpdateMatch(prev => ({
                    ...prev,
                    eventType: 'entrainement',
                    matchTitle: prev.matchTitle === 'Championnat FE12' || prev.matchTitle === 'Match Amical FE12' ? 'Entraînement & Évaluation FE12' : prev.matchTitle,
                    opponent: prev.opponent || 'Opposition interne (Jaunes vs Rouges)'
                  }));
                }}
                className={`flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs font-extrabold transition-all cursor-pointer ${
                  matchData.eventType === 'entrainement'
                    ? 'bg-emerald-600 text-white shadow-xs scale-102'
                    : 'bg-white text-slate-600 hover:bg-slate-100 border border-slate-200'
                }`}
                title="Séance d'entraînement, opposition interne et évaluation des joueurs"
              >
                <ClipboardCheck className="w-3.5 h-3.5" />
                <span>Entraînement / Éval</span>
              </button>

              {/* Tournoi */}
              <button
                type="button"
                onClick={() => {
                  onUpdateMatch(prev => ({
                    ...prev,
                    eventType: 'tournoi',
                    matchTitle: prev.matchTitle === 'Championnat FE12' || prev.matchTitle === 'Entraînement & Évaluation FE12' ? 'Tournoi FE12' : prev.matchTitle
                  }));
                }}
                className={`flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs font-extrabold transition-all cursor-pointer ${
                  matchData.eventType === 'tournoi'
                    ? 'bg-purple-600 text-white shadow-xs scale-102'
                    : 'bg-white text-slate-600 hover:bg-slate-100 border border-slate-200'
                }`}
                title="Tournoi ou rassemblement"
              >
                <Medal className="w-3.5 h-3.5" />
                <span>Tournoi</span>
              </button>
            </div>

            {/* Season Selector */}
            <div className="flex items-center gap-1.5">
              <span className="text-[10px] font-extrabold uppercase tracking-wider text-slate-500 flex items-center gap-1">
                <CalendarRange className="w-3 h-3 text-indigo-600" />
                <span>Saison :</span>
              </span>
              <select
                value={matchData.season || getSeasonFromDate(matchData.date)}
                onChange={(e) => {
                  const newSeason = e.target.value;
                  onUpdateMatch(prev => ({ ...prev, season: newSeason }));
                }}
                className="px-2.5 py-1 bg-white border border-slate-300 rounded-lg text-xs font-extrabold text-indigo-950 focus:ring-2 focus:ring-indigo-500 focus:outline-none shadow-2xs cursor-pointer"
              >
                {getAvailableSeasons(matchData.date).map(s => (
                  <option key={s} value={s}>
                    Saison {s}
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* Row 2: Match / Session Details Inputs */}
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-2.5">
            
            {/* Match / Session Title */}
            <div className="flex flex-col">
              <label className="text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-1 flex items-center justify-between">
                <span className="flex items-center gap-1">
                  <Shield className="w-3 h-3 text-emerald-600" />
                  {matchData.eventType === 'entrainement' ? 'Séance / Thème' : 'Intitulé'}
                </span>
                <span className={`text-[9px] px-1.5 py-0.2 rounded font-black ${
                  matchData.eventType === 'entrainement' ? 'bg-emerald-100 text-emerald-800' :
                  matchData.eventType === 'amical' ? 'bg-blue-100 text-blue-800' :
                  matchData.eventType === 'tournoi' ? 'bg-purple-100 text-purple-800' :
                  'bg-amber-100 text-amber-800'
                }`}>
                  {matchData.eventType === 'entrainement' ? 'Évaluation' : matchData.eventType === 'amical' ? 'Amical' : matchData.eventType === 'tournoi' ? 'Tournoi' : 'Officiel'}
                </span>
              </label>
              <input
                type="text"
                value={matchData.matchTitle}
                onChange={(e) => onUpdateMatch(prev => ({ ...prev, matchTitle: e.target.value }))}
                placeholder={getEventTypeConfig(matchData.eventType).defaultTitle}
                className="px-2.5 py-1.5 bg-white border border-slate-300 rounded-lg text-xs font-bold text-slate-900 focus:ring-2 focus:ring-indigo-500 focus:outline-none"
              />
            </div>

            {/* Adversaire / Opposition */}
            <div className="flex flex-col">
              <label className="text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-1">
                {matchData.eventType === 'entrainement' ? 'Cadre / Opposition' : 'Adversaire'}
              </label>
              <input
                type="text"
                value={matchData.opponent}
                onChange={(e) => onUpdateMatch(prev => ({ ...prev, opponent: e.target.value }))}
                placeholder={getEventTypeConfig(matchData.eventType).defaultOpponentPlaceholder}
                className="px-2.5 py-1.5 bg-white border border-slate-300 rounded-lg text-xs font-semibold text-slate-900 placeholder:text-slate-400 focus:ring-2 focus:ring-indigo-500 focus:outline-none"
              />
            </div>

            {/* Score Final / Bilan */}
            <div className="flex flex-col">
              <label className="text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-1">
                {matchData.eventType === 'entrainement' ? 'Score / Bilan séance' : 'Score final'}
              </label>
              <input
                type="text"
                value={matchData.finalScore}
                onChange={(e) => onUpdateMatch(prev => ({ ...prev, finalScore: e.target.value }))}
                placeholder={hasAnyScore ? `Eq1: ${team1TotalGoals}-${team1OpponentGoals} | Eq2: ${team2TotalGoals}-${team2OpponentGoals}` : '-'}
                className="px-2.5 py-1.5 bg-white border border-slate-300 rounded-lg text-xs font-bold text-center text-slate-900 placeholder:text-slate-400 focus:ring-2 focus:ring-indigo-500 focus:outline-none"
              />
            </div>

            {/* Date & Planning shortcut */}
            <div className="flex flex-col">
              <div className="flex items-center justify-between mb-1">
                <label className="text-[10px] font-bold text-slate-500 uppercase tracking-wider flex items-center gap-1">
                  <Calendar className="w-3 h-3 text-slate-400" /> Date
                </label>
                {onOpenCalendarModal && (
                  <button
                    type="button"
                    onClick={onOpenCalendarModal}
                    className="text-[10px] font-bold text-indigo-600 hover:text-indigo-900 hover:underline"
                  >
                    Planning 📅
                  </button>
                )}
              </div>
              <input
                type="date"
                value={matchData.date}
                onChange={(e) => {
                  const newDate = e.target.value;
                  const newSeason = getSeasonFromDate(newDate);
                  onUpdateMatch(prev => ({ 
                    ...prev, 
                    date: newDate,
                    // If season was not explicitly customized or was empty, auto-sync
                    season: prev.season ? prev.season : newSeason 
                  }));
                }}
                className="px-2.5 py-1.5 bg-white border border-slate-300 rounded-lg text-xs font-semibold text-slate-800 focus:ring-2 focus:ring-indigo-500 focus:outline-none"
              />
            </div>

          </div>

          {/* Training Session Helper Banner when in Entraînement mode */}
          {matchData.eventType === 'entrainement' && onOpenTrainingModal && (
            <div className="mt-2 pt-2 border-t border-emerald-200/60 flex flex-wrap items-center justify-between gap-2 bg-emerald-50/80 p-2 rounded-xl border border-emerald-200">
              <div className="flex items-center gap-2">
                <span className="p-1 rounded-lg bg-emerald-600 text-white">
                  <ClipboardCheck className="w-3.5 h-3.5" />
                </span>
                <span className="text-xs font-bold text-emerald-950">
                  Fiche de séance officielle FootEco (Thèmes TE/TA, schémas d'ateliers 1v1 & bilans)
                </span>
              </div>
              <button
                type="button"
                onClick={onOpenTrainingModal}
                className="px-3 py-1 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg text-xs font-extrabold shadow-2xs transition-all flex items-center gap-1.5 cursor-pointer"
              >
                <span>📋 Ouvrir la fiche de séance</span>
              </button>
            </div>
          )}
        </div>
      </div>

      {/* Confirmation Modal for Reset */}
      {showConfirmReset && (
        <div className="fixed inset-0 bg-slate-900/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl p-6 max-w-sm w-full shadow-2xl border border-slate-200">
            <h3 className="text-lg font-bold text-slate-900 mb-2">Réinitialiser la feuille de match ?</h3>
            <p className="text-sm text-slate-600 mb-5">
              Toutes les données actuelles seront remplacées par la composition initiale (4 périodes de 15 minutes, joueurs par défaut).
            </p>
            <div className="flex justify-end gap-3">
              <button
                onClick={() => setShowConfirmReset(false)}
                className="px-4 py-2 text-sm font-medium text-slate-700 bg-slate-100 hover:bg-slate-200 rounded-lg"
              >
                Annuler
              </button>
              <button
                onClick={handleReset}
                className="px-4 py-2 text-sm font-semibold text-white bg-rose-600 hover:bg-rose-700 rounded-lg shadow-sm"
              >
                Confirmer la réinitialisation
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Auth Modal (Login / Register) */}
      <AuthModal
        isOpen={showAuthModal}
        onClose={() => setShowAuthModal(false)}
      />

      {/* User Roles & Access Management Modal (Admin Only) */}
      <UserManagementModal
        isOpen={showUsersModal}
        onClose={() => setShowUsersModal(false)}
      />

      {/* Period PDF Preview & Export Modal */}
      <PeriodPdfPreviewModal
        isOpen={showPeriodPdfModal}
        onClose={() => setShowPeriodPdfModal(false)}
        matchData={matchData}
        initialPeriodIndex={activePeriodIndex}
      />

      {/* Composition Copy & Duplicate Modal */}
      <CopyCompoModal
        isOpen={showCopyCompoModal}
        onClose={() => setShowCopyCompoModal(false)}
        matchData={matchData}
        activePeriodIndex={activePeriodIndex}
        onUpdatePeriods={(updatedPeriods, msg) => {
          onUpdateMatch((prev) => ({ ...prev, periods: updatedPeriods }));
          if (msg) {
            setCopyNotification(msg);
            setTimeout(() => setCopyNotification(null), 3500);
          }
        }}
      />

      {/* Copy Notification Toast */}
      {copyNotification && (
        <div className="fixed bottom-5 right-5 z-50 flex items-center gap-2 bg-slate-900 text-white px-4 py-3 rounded-xl shadow-2xl border border-slate-700 animate-in fade-in slide-in-from-bottom-2 text-xs font-bold">
          <Check className="w-4 h-4 text-emerald-400 shrink-0" />
          <span>{copyNotification}</span>
        </div>
      )}
    </header>

  );
};
