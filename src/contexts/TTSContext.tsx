import React, { createContext, useContext, useMemo, useState, useCallback, useEffect, ReactNode, useRef } from 'react';
import { ITTSAdapter, TTSProgressEvent } from '../adapters/ITTSAdapter';
import { NativeTTSAdapter } from '../adapters/NativeTTSAdapter';
import { splitIntoSentences } from '../utils/textUtils';

interface TTSState {
  isPlaying: boolean;
  isPaused: boolean;
  rate: number;
  currentSentence: string;
  currentSentenceIndex: number;
  totalSentences: number;
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
    currentSentence: '',
    currentSentenceIndex: -1,
    totalSentences: 0,
  });

  // Ref to track playback state synchronously for the loop
  const isPlayingRef = useRef(false);
  const shouldStopRef = useRef(false);

  // Subscribe to progress events (still useful for internal adapter state)
  useEffect(() => {
    // We handle "end" manually in the loop now, but we listen for cleanup
    return () => {
      ttsAdapter.stop();
    };
  }, [ttsAdapter]);

  const speak = useCallback(async (text: string) => {
    // 1. Split text
    const sentences = splitIntoSentences(text);
    if (sentences.length === 0) return;

    // 2. Reset state
    setState(prev => ({ 
      ...prev, 
      isPlaying: true, 
      isPaused: false,
      currentSentenceIndex: 0,
      totalSentences: sentences.length,
      currentSentence: sentences[0]
    }));
    isPlayingRef.current = true;
    shouldStopRef.current = false;

    try {
      // 3. Play loop
      for (let i = 0; i < sentences.length; i++) {
        if (shouldStopRef.current) break;

        // Update current sentence
        const sentence = sentences[i];
        setState(prev => ({ 
          ...prev, 
          currentSentence: sentence, 
          currentSentenceIndex: i 
        }));

        // Speak and wait for finish
        await ttsAdapter.speak(sentence);
        
        // If we were stopped during speech, break
        if (shouldStopRef.current) break;
      }
    } catch (e) {
      console.error('TTS Playback error:', e);
    } finally {
      // Cleanup
      setState(prev => ({ 
        ...prev, 
        isPlaying: false, 
        isPaused: false,
        currentSentence: '',
        currentSentenceIndex: -1
      }));
      isPlayingRef.current = false;
      shouldStopRef.current = false;
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
    shouldStopRef.current = true;
    ttsAdapter.stop();
    setState(prev => ({ 
      ...prev, 
      isPlaying: false, 
      isPaused: false,
      currentSentence: '',
      currentSentenceIndex: -1
    }));
  }, [ttsAdapter]);

  const setRate = useCallback((rate: number) => {
    ttsAdapter.setRate(rate);
    setState(prev => ({ ...prev, rate }));
  }, [ttsAdapter]);

  const value = useMemo(() => ({
    ...state,
    progress: null, // Legacy, removed
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
