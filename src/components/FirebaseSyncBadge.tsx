import React, { useState } from 'react';
import { 
  Cloud, 
  CloudOff, 
  RefreshCw, 
  CheckCircle2, 
  AlertTriangle, 
  Wifi, 
  WifiOff, 
  Database,
  ArrowUpRight,
  ShieldCheck
} from 'lucide-react';
import { FirebaseSyncState } from '../types';

interface FirebaseSyncBadgeProps {
  syncState: FirebaseSyncState;
  lastSyncedAt: Date | null;
  lastLocalSavedAt?: Date | null;
  errorMessage?: string | null;
  onForceSync: () => void;
  isAuthenticated: boolean;
  className?: string;
}

export const FirebaseSyncBadge: React.FC<FirebaseSyncBadgeProps> = ({
  syncState,
  lastSyncedAt,
  lastLocalSavedAt,
  errorMessage,
  onForceSync,
  isAuthenticated,
  className = '',
}) => {
  const [showDetails, setShowDetails] = useState(false);

  const formatTime = (d: Date | null) => {
    if (!d) return '--:--';
    return d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' });
  };

  // Compute visual styles based on current sync state
  const getConfig = () => {
    switch (syncState) {
      case 'syncing':
        return {
          containerClass: 'bg-sky-50 text-sky-800 border-sky-300 ring-2 ring-sky-400/30 hover:bg-sky-100',
          dotClass: 'bg-sky-500 animate-ping',
          solidDotClass: 'bg-sky-600',
          icon: <RefreshCw className="w-3.5 h-3.5 text-sky-600 animate-spin" />,
          label: 'Sync en cours...',
          shortLabel: 'Sync...',
          description: 'Enregistrement en direct dans Firebase Firestore...',
          statusBadgeClass: 'bg-sky-100 text-sky-800',
        };
      case 'synced':
        return {
          containerClass: 'bg-emerald-50 text-emerald-800 border-emerald-300 ring-1 ring-emerald-400/20 hover:bg-emerald-100',
          dotClass: 'bg-emerald-400 opacity-75',
          solidDotClass: 'bg-emerald-600',
          icon: <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />,
          label: lastSyncedAt ? `Synchronisé (${formatTime(lastSyncedAt)})` : 'Synchronisé',
          shortLabel: 'Synchronisé',
          description: `Données sauvegardées avec succès dans Firebase (${lastSyncedAt ? formatTime(lastSyncedAt) : 'récemment'}).`,
          statusBadgeClass: 'bg-emerald-100 text-emerald-800',
        };
      case 'error':
        return {
          containerClass: 'bg-rose-50 text-rose-800 border-rose-300 ring-2 ring-rose-400/40 hover:bg-rose-100 animate-pulse',
          dotClass: 'bg-rose-500 animate-ping',
          solidDotClass: 'bg-rose-600',
          icon: <AlertTriangle className="w-3.5 h-3.5 text-rose-600" />,
          label: 'Erreur Sync',
          shortLabel: 'Erreur',
          description: errorMessage || 'Échec de synchronisation avec Firebase Firestore. Cliquez pour réessayer.',
          statusBadgeClass: 'bg-rose-100 text-rose-800',
        };
      case 'offline':
      default:
        return {
          containerClass: 'bg-slate-100 text-slate-700 border-slate-300 hover:bg-slate-200',
          dotClass: 'bg-slate-400 opacity-0',
          solidDotClass: 'bg-slate-500',
          icon: <WifiOff className="w-3.5 h-3.5 text-slate-500" />,
          label: 'Hors-ligne',
          shortLabel: 'Local',
          description: 'Mode local actif. Connexion Internet ou authentification requise pour le Cloud.',
          statusBadgeClass: 'bg-slate-200 text-slate-700',
        };
    }
  };

  const config = getConfig();

  return (
    <div className={`relative inline-block ${className}`}>
      {/* Dynamic Sync Trigger Button */}
      <button
        type="button"
        id="firebase-sync-status-button"
        onClick={() => {
          onForceSync();
          setShowDetails(prev => !prev);
        }}
        onMouseEnter={() => setShowDetails(true)}
        onMouseLeave={() => setShowDetails(false)}
        className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold border transition-all cursor-pointer shadow-2xs ${config.containerClass}`}
        title="État de la synchronisation Firebase (Cliquez pour forcer la synchronisation)"
        aria-label="Statut de synchronisation Firebase"
      >
        {/* Animated Beacon Dot */}
        <span className="relative flex h-2 w-2">
          {syncState === 'syncing' || syncState === 'error' ? (
            <span className={`absolute inline-flex h-full w-full rounded-full opacity-75 ${config.dotClass}`} />
          ) : null}
          <span className={`relative inline-flex rounded-full h-2 w-2 ${config.solidDotClass}`} />
        </span>

        {/* Status Icon */}
        <span className="flex items-center justify-center">
          {config.icon}
        </span>

        {/* Text Label */}
        <span className="hidden sm:inline font-medium tracking-tight">
          {config.label}
        </span>
        <span className="sm:hidden font-medium tracking-tight">
          {config.shortLabel}
        </span>
      </button>

      {/* Floating Info Popover on Hover / Click */}
      {showDetails && (
        <div 
          className="absolute left-0 sm:left-auto sm:right-0 top-full mt-2 w-72 bg-white rounded-xl shadow-xl border border-slate-200 p-3.5 z-50 text-left animate-in fade-in slide-in-from-top-1 duration-150"
          onMouseEnter={() => setShowDetails(true)}
          onMouseLeave={() => setShowDetails(false)}
        >
          <div className="flex items-center justify-between gap-2 border-b border-slate-100 pb-2 mb-2.5">
            <div className="flex items-center gap-2">
              <Database className="w-4 h-4 text-emerald-600" />
              <span className="font-bold text-slate-900 text-xs">Cloud Firebase Firestore</span>
            </div>
            <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${config.statusBadgeClass}`}>
              {syncState.toUpperCase()}
            </span>
          </div>

          <p className="text-xs text-slate-600 mb-3 leading-relaxed">
            {config.description}
          </p>

          <div className="space-y-1.5 text-[11px] text-slate-600 bg-slate-50 p-2 rounded-lg border border-slate-200/70 mb-3">
            <div className="flex justify-between items-center">
              <span className="text-slate-500">Statut Réseau :</span>
              <span className="font-semibold text-slate-800 flex items-center gap-1">
                {navigator.onLine ? (
                  <>
                    <Wifi className="w-3 h-3 text-emerald-600" /> En ligne
                  </>
                ) : (
                  <>
                    <WifiOff className="w-3 h-3 text-rose-600" /> Déconnecté
                  </>
                )}
              </span>
            </div>

            <div className="flex justify-between items-center">
              <span className="text-slate-500">Authentification :</span>
              <span className="font-semibold text-slate-800 flex items-center gap-1">
                {isAuthenticated ? (
                  <>
                    <ShieldCheck className="w-3 h-3 text-indigo-600" /> Connecté
                  </>
                ) : (
                  'Mode Public / Local'
                )}
              </span>
            </div>

            <div className="flex justify-between items-center">
              <span className="text-slate-500">Sauvegarde locale :</span>
              <span className="font-semibold text-emerald-700 flex items-center gap-1 font-mono">
                <CheckCircle2 className="w-3 h-3 text-emerald-600" />
                {lastLocalSavedAt ? formatTime(lastLocalSavedAt) : 'En continu'} (Auto)
              </span>
            </div>

            <div className="flex justify-between items-center">
              <span className="text-slate-500">Dernier Cloud Sync :</span>
              <span className="font-semibold text-slate-800 font-mono">
                {lastSyncedAt ? formatTime(lastSyncedAt) : 'Aucun'}
              </span>
            </div>
          </div>

          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation();
              onForceSync();
            }}
            disabled={syncState === 'syncing'}
            className="w-full flex items-center justify-center gap-1.5 py-1.5 px-3 rounded-lg text-xs font-bold text-white bg-emerald-600 hover:bg-emerald-700 active:scale-98 transition-all disabled:opacity-50 shadow-2xs cursor-pointer"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${syncState === 'syncing' ? 'animate-spin' : ''}`} />
            <span>{syncState === 'syncing' ? 'Synchronisation...' : 'Forcer la synchronisation'}</span>
          </button>
        </div>
      )}
    </div>
  );
};
