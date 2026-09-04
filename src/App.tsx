import React, { useState, useEffect, useRef } from 'react';
import { MatchData, PeriodMatch } from './types';
import { loadMatchData, saveMatchData, getLastLocalSaveTimestamp } from './utils/storage';
import { useFirebaseSync } from './hooks/useFirebaseSync';
import { playWhistleSound } from './utils/audio';

import { Header } from './components/Header';
import { PeriodTabs } from './components/PeriodTabs';
import { MatchSheetTable } from './components/MatchSheetTable';
import { PitchTacticalView } from './components/PitchTacticalView';
import { DurationModal } from './components/DurationModal';
import { RosterModal } from './components/RosterModal';
import { StatsDrawer } from './components/StatsDrawer';
import { CalendarModal } from './components/CalendarModal';
import { TrainingSessionModal } from './components/TrainingSessionModal';
import { TimerWidget } from './components/TimerWidget';
import { PrintableOfficialSheet } from './components/PrintableOfficialSheet';
import { CopyCompoModal } from './components/CopyCompoModal';
import { ScoreEvolutionChart } from './components/ScoreEvolutionChart';
import { Check } from 'lucide-react';

export default function App() {
  const [matchData, setMatchData] = useState<MatchData>(() => loadMatchData());
  const [lastLocalSavedAt, setLastLocalSavedAt] = useState<Date | null>(() => getLastLocalSaveTimestamp() || new Date());
  const matchDataRef = useRef<MatchData>(matchData);

  const [selectedPeriodIndex, setSelectedPeriodIndex] = useState<number>(0);
  const [viewMode, setViewMode] = useState<'single' | 'all' | 'tactical' | 'chart'>('single');
  const [isQuickChartOpen, setIsQuickChartOpen] = useState(false);

  // Keep matchDataRef synchronously up to date
  useEffect(() => {
    matchDataRef.current = matchData;
  }, [matchData]);

  // Persistent local storage auto-save triggered on every modification of score or composition
  useEffect(() => {
    try {
      const isSaved = saveMatchData(matchData);
      if (isSaved) {
        setLastLocalSavedAt(new Date());
      }
    } catch (err) {
      console.error('Erreur lors de la sauvegarde locale persistante', err);
    }
  }, [matchData]);

  // Immediate persistence on tab switch, window reload or close
  useEffect(() => {
    const handleFlushLocalSave = () => {
      saveMatchData(matchDataRef.current);
    };

    window.addEventListener('beforeunload', handleFlushLocalSave);
    window.addEventListener('pagehide', handleFlushLocalSave);
    const handleVisibilityChange = () => {
      if (document.visibilityState === 'hidden') {
        saveMatchData(matchDataRef.current);
      }
    };
    document.addEventListener('visibilitychange', handleVisibilityChange);

    return () => {
      window.removeEventListener('beforeunload', handleFlushLocalSave);
      window.removeEventListener('pagehide', handleFlushLocalSave);
      document.removeEventListener('visibilitychange', handleVisibilityChange);
    };
  }, []);

  // Modals
  const [isDurationModalOpen, setIsDurationModalOpen] = useState(false);
  const [isRosterModalOpen, setIsRosterModalOpen] = useState(false);
  const [isStatsModalOpen, setIsStatsModalOpen] = useState(false);
  const [isCalendarModalOpen, setIsCalendarModalOpen] = useState(false);
  const [isTrainingModalOpen, setIsTrainingModalOpen] = useState(false);
  const [selectedTrainingSessionId, setSelectedTrainingSessionId] = useState<string | undefined>(undefined);
  const [isTimerModalOpen, setIsTimerModalOpen] = useState(false);
  const [isCopyCompoModalOpen, setIsCopyCompoModalOpen] = useState(false);
  const [appCopyToast, setAppCopyToast] = useState<string | null>(null);

  // Timer State
  const activePeriod = matchData.periods[selectedPeriodIndex] || matchData.periods[0];
  const [timerSecondsLeft, setTimerSecondsLeft] = useState<number>(
    () => (activePeriod?.durationMinutes || 15) * 60
  );
  const [isTimerRunning, setIsTimerRunning] = useState<boolean>(false);
  const timerRef = useRef<number | null>(null);

  // Real-time Firebase & Local storage sync engine
  const {
    syncState: firebaseSyncState,
    lastSyncedAt,
    errorMessage: syncErrorMessage,
    forceSync: handleForceSync,
  } = useFirebaseSync(matchData);

  // Sync timer when changing active period if timer is not currently running
  useEffect(() => {
    if (!isTimerRunning && activePeriod) {
      setTimerSecondsLeft((activePeriod.durationMinutes || 15) * 60);
    }
  }, [selectedPeriodIndex, activePeriod?.durationMinutes]);

  // Timer countdown loop
  useEffect(() => {
    if (isTimerRunning) {
      timerRef.current = window.setInterval(() => {
        setTimerSecondsLeft((prev) => {
          if (prev <= 1) {
            clearInterval(timerRef.current!);
            setIsTimerRunning(false);
            playWhistleSound();
            return 0;
          }
          return prev - 1;
        });
      }, 1000);
    } else if (timerRef.current) {
      clearInterval(timerRef.current);
    }

    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, [isTimerRunning]);

  const handleToggleTimer = () => {
    setIsTimerRunning((prev) => !prev);
  };

  const handleResetTimer = () => {
    setIsTimerRunning(false);
    if (activePeriod) {
      setTimerSecondsLeft((activePeriod.durationMinutes || 15) * 60);
    }
  };

  const handleAdjustSeconds = (deltaSeconds: number) => {
    setTimerSecondsLeft((prev) => Math.max(0, prev + deltaSeconds));
  };

  const handleUpdatePeriod = (updatedPeriod: PeriodMatch) => {
    setMatchData((prev) => ({
      ...prev,
      periods: prev.periods.map((p) => (p.id === updatedPeriod.id ? updatedPeriod : p)),
    }));
  };

  const handleCopyFromPeriod = (sourcePeriodId: number) => {
    const sourcePeriod = matchData.periods.find((p) => p.id === sourcePeriodId);
    const targetPeriod = matchData.periods[selectedPeriodIndex];
    if (!sourcePeriod || !targetPeriod) return;

    if (
      confirm(
        `Voulez-vous copier la composition de "${sourcePeriod.title}" vers "${targetPeriod.title}" ?`
      )
    ) {
      const clonedPeriod: PeriodMatch = {
        ...targetPeriod,
        team1: {
          ...targetPeriod.team1,
          coachName: sourcePeriod.team1.coachName,
          titulaires: sourcePeriod.team1.titulaires.map((slot, idx) => ({
            ...slot,
            id: `t1-p${targetPeriod.id}-${idx}`,
            note: '',
            shootout: '',
          })),
          remplacants: sourcePeriod.team1.remplacants.map((slot, idx) => ({
            ...slot,
            id: `t1-p${targetPeriod.id}-r${idx}`,
            note: '',
            shootout: '',
          })),
        },
        team2: {
          ...targetPeriod.team2,
          coachName: sourcePeriod.team2.coachName,
          titulaires: sourcePeriod.team2.titulaires.map((slot, idx) => ({
            ...slot,
            id: `t2-p${targetPeriod.id}-${idx}`,
            note: '',
            shootout: '',
          })),
          remplacants: sourcePeriod.team2.remplacants.map((slot, idx) => ({
            ...slot,
            id: `t2-p${targetPeriod.id}-r${idx}`,
            note: '',
            shootout: '',
          })),
        },
      };

      handleUpdatePeriod(clonedPeriod);
      setAppCopyToast(`Composition copiée de ${sourcePeriod.title} vers ${targetPeriod.title} !`);
      setTimeout(() => setAppCopyToast(null), 3500);
    }
  };

  const handleDuplicateToAllPeriods = (sourcePeriodId: number) => {
    const source = matchData.periods.find((p) => p.id === sourcePeriodId);
    if (!source) return;

    if (
      !confirm(
        `Dupliquer la composition complète de "${source.title}" sur TOUS les autres matchs (1 à 4) ?`
      )
    ) {
      return;
    }

    const updatedPeriods = matchData.periods.map((period) => {
      if (period.id === sourcePeriodId) return period;
      return {
        ...period,
        team1: {
          ...period.team1,
          coachName: source.team1.coachName,
          titulaires: source.team1.titulaires.map((slot, idx) => ({
            ...slot,
            id: `t1-p${period.id}-s${idx}-${Date.now()}`,
            note: '',
            shootout: '',
          })),
          remplacants: source.team1.remplacants.map((slot, idx) => ({
            ...slot,
            id: `t1-p${period.id}-r${idx}-${Date.now()}`,
            note: '',
            shootout: '',
          })),
        },
        team2: {
          ...period.team2,
          coachName: source.team2.coachName,
          titulaires: source.team2.titulaires.map((slot, idx) => ({
            ...slot,
            id: `t2-p${period.id}-s${idx}-${Date.now()}`,
            note: '',
            shootout: '',
          })),
          remplacants: source.team2.remplacants.map((slot, idx) => ({
            ...slot,
            id: `t2-p${period.id}-r${idx}-${Date.now()}`,
            note: '',
            shootout: '',
          })),
        },
      };
    });

    setMatchData((prev) => ({ ...prev, periods: updatedPeriods }));
    setAppCopyToast(`Composition de "${source.title}" dupliquée sur tous les 4 matchs !`);
    setTimeout(() => setAppCopyToast(null), 3500);
  };

  return (
    <div className="min-h-screen bg-slate-100 text-slate-900 flex flex-col selection:bg-emerald-200">
      
      {/* Header with match title, opponent, date, timer badge, tools */}
      <Header
        matchData={matchData}
        onUpdateMatch={setMatchData}
        onOpenDurationModal={() => setIsDurationModalOpen(true)}
        onOpenRosterModal={() => setIsRosterModalOpen(true)}
        onOpenStatsModal={() => setIsStatsModalOpen(true)}
        onOpenCalendarModal={() => setIsCalendarModalOpen(true)}
        onOpenTrainingModal={() => {
          setSelectedTrainingSessionId(undefined);
          setIsTrainingModalOpen(true);
        }}
        onOpenTimerModal={() => setIsTimerModalOpen(true)}
        activePeriodIndex={selectedPeriodIndex}
        timerSecondsLeft={timerSecondsLeft}
        isTimerRunning={isTimerRunning}
        onToggleTimer={handleToggleTimer}
        firebaseSyncState={firebaseSyncState}
        lastSyncedAt={lastSyncedAt}
        lastLocalSavedAt={lastLocalSavedAt}
        syncErrorMessage={syncErrorMessage}
        onForceSync={handleForceSync}
      />

      {/* Main Container */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 py-6 print:p-0">
        
        {/* Navigation Tabs (Match 1, Match 2, Match 3, Match 4, View All, 7v7 Pitch, Score Chart) */}
        <PeriodTabs
          periods={matchData.periods}
          selectedPeriodIndex={selectedPeriodIndex}
          onSelectPeriodIndex={(idx) => setSelectedPeriodIndex(idx)}
          viewMode={viewMode}
          onChangeViewMode={setViewMode}
          onOpenDurationModal={() => setIsDurationModalOpen(true)}
          isQuickChartOpen={isQuickChartOpen}
          onToggleQuickChart={() => setIsQuickChartOpen((prev) => !prev)}
        />

        {/* Optional Collapsible Quick Chart Preview when in single, all, or tactical mode */}
        {isQuickChartOpen && viewMode !== 'chart' && (
          <div className="mb-6">
            <ScoreEvolutionChart matchData={matchData} />
          </div>
        )}

        {/* View Mode 1: Single Active Period */}
        {viewMode === 'single' && activePeriod && (
          <div>
            <MatchSheetTable
              period={activePeriod}
              roster={matchData.roster}
              allPeriods={matchData.periods}
              onUpdatePeriod={handleUpdatePeriod}
              onCopyFromPeriod={handleCopyFromPeriod}
              onDuplicateToAllPeriods={handleDuplicateToAllPeriods}
              onOpenCopyModal={() => setIsCopyCompoModalOpen(true)}
              onOpenDurationModal={() => setIsDurationModalOpen(true)}
            />
          </div>
        )}

        {/* View Mode 2: All Periods Overview */}
        {viewMode === 'all' && (
          <div className="space-y-8">
            {matchData.periods.map((period) => (
              <MatchSheetTable
                key={period.id}
                period={period}
                roster={matchData.roster}
                allPeriods={matchData.periods}
                onUpdatePeriod={handleUpdatePeriod}
                onCopyFromPeriod={handleCopyFromPeriod}
                onDuplicateToAllPeriods={handleDuplicateToAllPeriods}
                onOpenCopyModal={() => setIsCopyCompoModalOpen(true)}
                onOpenDurationModal={() => setIsDurationModalOpen(true)}
              />
            ))}
          </div>
        )}

        {/* View Mode 3: Tactical Pitch 7v7 Formation */}
        {viewMode === 'tactical' && activePeriod && (
          <div>
            <PitchTacticalView period={activePeriod} roster={matchData.roster} />
            <MatchSheetTable
              period={activePeriod}
              roster={matchData.roster}
              allPeriods={matchData.periods}
              onUpdatePeriod={handleUpdatePeriod}
              onCopyFromPeriod={handleCopyFromPeriod}
              onDuplicateToAllPeriods={handleDuplicateToAllPeriods}
              onOpenCopyModal={() => setIsCopyCompoModalOpen(true)}
              onOpenDurationModal={() => setIsDurationModalOpen(true)}
            />
          </div>
        )}

        {/* View Mode 4: Dedicated Score Evolution Chart View */}
        {viewMode === 'chart' && (
          <div className="space-y-6">
            <ScoreEvolutionChart matchData={matchData} />

            {/* Quick Period Recap Cards */}
            <div className="bg-white rounded-2xl border border-slate-200 p-5 shadow-xs">
              <div className="flex items-center justify-between mb-4">
                <div>
                  <h4 className="text-sm font-extrabold text-slate-900">
                    Récapitulatif des 4 Périodes de Jeu
                  </h4>
                  <p className="text-xs text-slate-500">
                    Cliquez sur une période pour ouvrir sa feuille de match et éditer les scores ou la composition
                  </p>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3.5">
                {matchData.periods.map((p, idx) => {
                  const s1 = parseInt(p.team1.scoreMatch, 10) || 0;
                  const o1 = parseInt(p.team1.scoreOpponent, 10) || 0;
                  const s2 = parseInt(p.team2.scoreMatch, 10) || 0;
                  const o2 = parseInt(p.team2.scoreOpponent, 10) || 0;
                  const totalP = s1 + s2;
                  const totalOpp = o1 + o2;

                  return (
                    <div
                      key={p.id}
                      className="p-3.5 bg-slate-50/80 hover:bg-slate-100/80 border border-slate-200 rounded-xl transition-all space-y-2.5"
                    >
                      <div className="flex items-center justify-between border-b border-slate-200/80 pb-2">
                        <span className="font-extrabold text-xs text-slate-900">{p.title}</span>
                        <span className="text-[10px] px-1.5 py-0.5 rounded bg-white text-slate-600 font-mono border border-slate-200">
                          {p.durationMinutes || 15} min
                        </span>
                      </div>

                      <div className="space-y-1.5 text-xs">
                        <div className="flex justify-between items-center bg-white px-2 py-1 rounded border border-slate-100">
                          <span className="text-yellow-800 font-bold truncate text-[11px]">
                            {p.team1.teamName || 'Équipe 1'}
                          </span>
                          <span className="font-extrabold font-mono text-slate-900">
                            {s1} - {o1}
                          </span>
                        </div>

                        <div className="flex justify-between items-center bg-white px-2 py-1 rounded border border-slate-100">
                          <span className="text-red-800 font-bold truncate text-[11px]">
                            {p.team2.teamName || 'Équipe 2'}
                          </span>
                          <span className="font-extrabold font-mono text-slate-900">
                            {s2} - {o2}
                          </span>
                        </div>

                        <div className="flex justify-between items-center pt-1 text-[11px] font-bold text-slate-700">
                          <span>Total Période :</span>
                          <span className={totalP > totalOpp ? 'text-emerald-700 font-mono' : totalP < totalOpp ? 'text-rose-700 font-mono' : 'text-slate-700 font-mono'}>
                            {totalP} - {totalOpp}
                          </span>
                        </div>
                      </div>

                      <button
                        type="button"
                        onClick={() => {
                          setSelectedPeriodIndex(idx);
                          setViewMode('single');
                        }}
                        className="w-full text-center text-[11px] font-bold text-indigo-600 hover:text-indigo-800 bg-white hover:bg-indigo-50 border border-slate-200 py-1.5 rounded-lg transition-colors"
                      >
                        Voir la feuille &rarr;
                      </button>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
        )}

      </main>

      {/* Printable Sheet formatted specifically for printer / A4 / PDF export */}
      <PrintableOfficialSheet matchData={matchData} />

      {/* Hidden 4-period container specifically rendered for multi-page A4 PDF export */}
      <div id="all-periods-printable-container" className="hidden" aria-hidden="true">
        {matchData.periods.map((_, idx) => (
          <div key={idx} id={`printable-period-page-${idx}`}>
            <PrintableOfficialSheet
              matchData={matchData}
              periodIndex={idx}
              id={`official-period-sheet-${idx}`}
              isPrintOnly={false}
            />
          </div>
        ))}
      </div>

      {/* Modals & Drawers */}
      <DurationModal
        isOpen={isDurationModalOpen}
        onClose={() => setIsDurationModalOpen(false)}
        matchData={matchData}
        onUpdateMatch={setMatchData}
      />

      <RosterModal
        isOpen={isRosterModalOpen}
        onClose={() => setIsRosterModalOpen(false)}
        matchData={matchData}
        onUpdateMatch={setMatchData}
      />

      <StatsDrawer
        isOpen={isStatsModalOpen}
        onClose={() => setIsStatsModalOpen(false)}
        matchData={matchData}
        onOpenCalendarModal={() => {
          setIsStatsModalOpen(false);
          setIsCalendarModalOpen(true);
        }}
        onLoadMatchIntoSheet={(loaded) => setMatchData(loaded)}
        onSetMatchDateAndOpponent={(date, opponent, title) => {
          setMatchData((prev) => ({
            ...prev,
            date,
            opponent,
            matchTitle: title || prev.matchTitle,
          }));
        }}
      />

      <CalendarModal
        isOpen={isCalendarModalOpen}
        onClose={() => setIsCalendarModalOpen(false)}
        currentMatch={matchData}
        onLoadMatchIntoSheet={(loaded) => setMatchData(loaded)}
        onSetMatchDateAndOpponent={(date, opponent, title) => {
          setMatchData((prev) => ({
            ...prev,
            date,
            opponent,
            matchTitle: title || prev.matchTitle,
          }));
        }}
        onOpenTrainingModal={() => {
          setIsCalendarModalOpen(false);
          setSelectedTrainingSessionId(undefined);
          setIsTrainingModalOpen(true);
        }}
      />

      <TrainingSessionModal
        isOpen={isTrainingModalOpen}
        onClose={() => setIsTrainingModalOpen(false)}
        initialSessionId={selectedTrainingSessionId}
        defaultSeason={matchData.season}
      />

      <TimerWidget
        isOpen={isTimerModalOpen}
        onClose={() => setIsTimerModalOpen(false)}
        periodTitle={activePeriod?.title || 'Match 1'}
        durationMinutes={activePeriod?.durationMinutes || 15}
        secondsLeft={timerSecondsLeft}
        isRunning={isTimerRunning}
        onToggle={handleToggleTimer}
        onReset={handleResetTimer}
        onAdjustSeconds={handleAdjustSeconds}
      />

      {/* Composition Manager Modal */}
      <CopyCompoModal
        isOpen={isCopyCompoModalOpen}
        onClose={() => setIsCopyCompoModalOpen(false)}
        matchData={matchData}
        activePeriodIndex={selectedPeriodIndex}
        onUpdatePeriods={(updatedPeriods, msg) => {
          setMatchData((prev) => ({ ...prev, periods: updatedPeriods }));
          if (msg) {
            setAppCopyToast(msg);
            setTimeout(() => setAppCopyToast(null), 3500);
          }
        }}
      />

      {/* Toast Notification for Composition Operations */}
      {appCopyToast && (
        <div className="fixed bottom-5 right-5 z-50 flex items-center gap-2 bg-slate-900 text-white px-4 py-3 rounded-xl shadow-2xl border border-slate-700 animate-in fade-in slide-in-from-bottom-2 text-xs font-bold">
          <Check className="w-4 h-4 text-emerald-400 shrink-0" />
          <span>{appCopyToast}</span>
        </div>
      )}

    </div>
  );
}
