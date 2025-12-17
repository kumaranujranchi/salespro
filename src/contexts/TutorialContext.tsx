import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { CallBackProps, STATUS } from 'react-joyride';

interface TutorialContextType {
  run: boolean;
  stepIndex: number;
  startTutorial: () => void;
  stopTutorial: () => void;
  resetTutorial: () => void;
  handleJoyrideCallback: (data: CallBackProps) => void;
}

const TutorialContext = createContext<TutorialContextType | undefined>(undefined);

export const useTutorial = () => {
  const context = useContext(TutorialContext);
  if (!context) throw new Error('useTutorial must be used within a TutorialProvider');
  return context;
};

interface TutorialProviderProps {
  children: ReactNode;
}

// Analytics Stub
const trackTutorialEvent = (action: string, detail?: any) => {
  console.log(`[Tutorial Analytics] ${action}`, detail);
  // In a real app, send to Supabase or GA
};

export const TutorialProvider: React.FC<TutorialProviderProps> = ({ children }) => {
  const [run, setRun] = useState(false);
  const [stepIndex, setStepIndex] = useState(0);

  useEffect(() => {
    // Auto-launch if not seen
    const hasSeen = localStorage.getItem('tutorial_completed');
    if (!hasSeen) {
      // Slight delay to ensure UI is ready
      setTimeout(() => setRun(true), 1500);
    }
  }, []);

  const startTutorial = () => {
    setRun(true);
    setStepIndex(0);
    trackTutorialEvent('started');
  };

  const stopTutorial = () => {
    setRun(false);
    trackTutorialEvent('stopped_manually');
  };

  const resetTutorial = () => {
    localStorage.removeItem('tutorial_completed');
    startTutorial();
    trackTutorialEvent('restarted');
  };

  const handleJoyrideCallback = (data: CallBackProps) => {
    const { status, type, index, action } = data;

    if (type === 'step:after') {
      trackTutorialEvent('step_completed', { step: index });
      setStepIndex(index + 1); // Only for controlled, but we might let Joyride handle it if we don't pass stepIndex
    }

    if ([STATUS.FINISHED, STATUS.SKIPPED].includes(status as any)) {
      setRun(false);
      localStorage.setItem('tutorial_completed', 'true');
      trackTutorialEvent(status === STATUS.FINISHED ? 'completed' : 'skipped', { lastStep: index });
    }
  };

  return (
    <TutorialContext.Provider value={{ run, stepIndex, startTutorial, stopTutorial, resetTutorial, handleJoyrideCallback }}>
      {children}
    </TutorialContext.Provider>
  );
};
