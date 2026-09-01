import React, { useState, useEffect, useRef } from 'react';
import { MatchData, PeriodMatch } from './types';
import { loadMatchData, saveMatchData } from './utils/storage';
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

export default function App() {
  const [matchData, setMatchData] = useState<MatchData>(() => loadMatchData());
  const [selectedPeriodIndex, setSelectedPeriodIndex] = useState<number>(0);
  const [viewMode, setViewMode] = useState<'single' | 'all' | 'tactical'>('single');

  // Modals
  const [isDurationModalOpen, setIsDurationModalOpen] = useState(false);
  const [isRosterModalOpen, setIsRosterModalOpen] = useState(false);
  const [isStatsModalOpen, setIsStatsModalOpen] = useState(false);
  const [isCalendarModalOpen, setIsCalendarModalOpen] = useState(false);
  const [isTrainingModalOpen, setIsTrainingModalOpen] = useState(false);
  const [selectedTrainingSessionId, setSelectedTrainingSessionId] = useState<string | undefined>(undefined);
  const [isTimerModalOpen, setIsTimerModalOpen] = useState(false);

  // Timer State
  const activePeriod = matchData.periods[selectedPeriodIndex] || matchData.periods[0];
  const [timerSecondsLeft, setTimerSecondsLeft] = useState<number>(
    () => (activePeriod?.durationMinutes || 15) * 60
  );
  const [isTimerRunning, setIsTimerRunning] = useState<boolean>(false);
  const timerRef = useRef<number | null>(null);

  // Sync / Auto-save State
  const [saveStatus, setSaveStatus] = useState<'saved' | 'saving'>('saved');
  const [lastSavedAt, setLastSavedAt] = useState<Date>(() => new Date());
  const isFirstRender = useRef(true);

  // Auto-save on data change
  useEffect(() => {
    if (isFirstRender.current) {
      isFirstRender.current = false;
      return;
    }
    setSaveStatus('saving');
    const saveTimer = setTimeout(() => {
      saveMatchData(matchData);
      setSaveStatus('saved');
      setLastSavedAt(new Date());
    }, 350);

    return () => clearTimeout(saveTimer);
  }, [matchData]);

  const handleForceSave = () => {
    setSaveStatus('saving');
    saveMatchData(matchData);
    setTimeout(() => {
      setSaveStatus('saved');
      setLastSavedAt(new Date());
    }, 200);
  };

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
    }
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
        saveStatus={saveStatus}
        lastSavedAt={lastSavedAt}
        onForceSave={handleForceSave}
      />

      {/* Main Container */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 py-6 print:p-0">
        
        {/* Navigation Tabs (Match 1, Match 2, Match 3, Match 4, View All, 7v7 Pitch) */}
        <PeriodTabs
          periods={matchData.periods}
          selectedPeriodIndex={selectedPeriodIndex}
          onSelectPeriodIndex={(idx) => setSelectedPeriodIndex(idx)}
          viewMode={viewMode}
          onChangeViewMode={setViewMode}
          onOpenDurationModal={() => setIsDurationModalOpen(true)}
        />

        {/* View Mode 1: Single Active Period */}
        {viewMode === 'single' && activePeriod && (
          <div>
            <MatchSheetTable
              period={activePeriod}
              roster={matchData.roster}
              allPeriods={matchData.periods}
              onUpdatePeriod={handleUpdatePeriod}
              onCopyFromPeriod={handleCopyFromPeriod}
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
              onOpenDurationModal={() => setIsDurationModalOpen(true)}
            />
          </div>
        )}

      </main>

      {/* Printable Sheet formatted specifically for printer / A4 / PDF export */}
      <PrintableOfficialSheet matchData={matchData} />

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

    </div>
  );
}
