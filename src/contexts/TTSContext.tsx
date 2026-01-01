import React, { createContext, useContext, useMemo, useState, useCallback, useEffect, ReactNode } from 'react';
import { ITTSAdapter, TTSProgressEvent } from '../adapters/ITTSAdapter';
import { NativeTTSAdapter } from '../adapters/NativeTTSAdapter';

interface TTSState {
  isPlaying: boolean;
  isPaused: boolean;
  rate: number;
  progress: TTSProgressEvent | null;
}

interface TTSContextValue extends TTSState {
  adapter: ITTSAdapter;
  speak: (text: string) => Promise<void>;
  pause: () => void;
  resume: () => void;
  stop: () => void;
  setRate: (rate: number) => void;
}

const TTSContext = createContext<TTSContextValue | null>(null);

interface TTSProviderProps {
  children: ReactNode;
  adapter?: ITTSAdapter; // Allow injecting custom adapter (for testing)
}

export const TTSProvider = ({ children, adapter }: TTSProviderProps) => {
  const ttsAdapter = useMemo(() => adapter ?? new NativeTTSAdapter(), [adapter]);
  
  const [state, setState] = useState<TTSState>({
    isPlaying: false,
    isPaused: false,
    rate: 1.0,
    progress: null,
  });

  // Subscribe to progress and end events
  useEffect(() => {
    const unsubProgress = ttsAdapter.onProgress((event) => {
      setState(prev => ({ ...prev, progress: event }));
    });

    const unsubEnd = ttsAdapter.onEnd(() => {
      setState(prev => ({ 
        ...prev, 
        isPlaying: false, 
        isPaused: false,
        progress: null 
      }));
    });

    return () => {
      unsubProgress();
      unsubEnd();
    };
  }, [ttsAdapter]);

  const speak = useCallback(async (text: string) => {
    setState(prev => ({ ...prev, isPlaying: true, isPaused: false }));
    try {
      await ttsAdapter.speak(text);
    } catch (e) {
      setState(prev => ({ ...prev, isPlaying: false }));
      throw e;
    }
  }, [ttsAdapter]);

  const pause = useCallback(() => {
    ttsAdapter.pause();
    setState(prev => ({ ...prev, isPaused: true }));
  }, [ttsAdapter]);

  const resume = useCallback(() => {
    ttsAdapter.resume();
    setState(prev => ({ ...prev, isPaused: false }));
  }, [ttsAdapter]);

  const stop = useCallback(() => {
    ttsAdapter.stop();
    setState(prev => ({ 
      ...prev, 
      isPlaying: false, 
      isPaused: false,
      progress: null 
    }));
  }, [ttsAdapter]);

  const setRate = useCallback((rate: number) => {
    ttsAdapter.setRate(rate);
    setState(prev => ({ ...prev, rate }));
  }, [ttsAdapter]);

  const value = useMemo(() => ({
    ...state,
    adapter: ttsAdapter,
    speak,
    pause,
    resume,
    stop,
    setRate,
  }), [state, ttsAdapter, speak, pause, resume, stop, setRate]);

  return (
    <TTSContext.Provider value={value}>
      {children}
    </TTSContext.Provider>
  );
};

export const useTTS = (): TTSContextValue => {
  const context = useContext(TTSContext);
  if (!context) {
    throw new Error('useTTS must be used within a TTSProvider');
  }
  return context;
};
