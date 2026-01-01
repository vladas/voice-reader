// TTS Adapter Interface (Per ADR-003)
// Allows swapping between NativeAdapter (expo-speech) and future ChatterboxAdapter

export interface TTSProgressEvent {
  position: number; // Current position in text (character index)
  totalLength: number; // Total text length
}

export interface ITTSAdapter {
  /** Start speaking the given text */
  speak(text: string): Promise<void>;
  
  /** Pause current speech */
  pause(): void;
  
  /** Resume paused speech */
  resume(): void;
  
  /** Stop and reset */
  stop(): void;
  
  /** Set speech rate (0.5 = half speed, 2.0 = double speed) */
  setRate(rate: number): void;
  
  /** Get current rate */
  getRate(): number;
  
  /** Check if currently speaking */
  isSpeaking(): Promise<boolean>;
  
  /** Subscribe to progress updates */
  onProgress(callback: (event: TTSProgressEvent) => void): () => void;
  
  /** Subscribe to speech end event */
  onEnd(callback: () => void): () => void;
}
