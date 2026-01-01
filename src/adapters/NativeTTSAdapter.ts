// Native TTS Adapter using expo-speech
import * as Speech from 'expo-speech';
import { ITTSAdapter, TTSProgressEvent } from './ITTSAdapter';

export class NativeTTSAdapter implements ITTSAdapter {
  private rate: number = 1.0;
  private currentText: string = '';
  private progressCallbacks: Set<(event: TTSProgressEvent) => void> = new Set();
  private endCallbacks: Set<() => void> = new Set();
  private isPaused: boolean = false;

  async speak(text: string): Promise<void> {
    // Stop any previous speech
    await this.stop();
    
    this.currentText = text;
    this.isPaused = false;
    
    return new Promise((resolve, reject) => {
      Speech.speak(text, {
        rate: this.rate,
        onStart: () => {
          // Notify progress at start
          this.notifyProgress(0);
        },
        onDone: () => {
          this.notifyEnd();
          resolve();
        },
        onStopped: () => {
          resolve();
        },
        onError: (error) => {
          console.error('TTS Error:', error);
          reject(error);
        },
        // Note: expo-speech doesn't provide word-level progress events
        // We could approximate using timing, but for v1 we'll just track start/end
      });
    });
  }

  pause(): void {
    Speech.pause();
    this.isPaused = true;
  }

  resume(): void {
    Speech.resume();
    this.isPaused = false;
  }

  stop(): void {
    Speech.stop();
    this.currentText = '';
    this.isPaused = false;
  }

  setRate(rate: number): void {
    // Clamp rate between 0.1 and 2.0
    this.rate = Math.max(0.1, Math.min(2.0, rate));
  }

  getRate(): number {
    return this.rate;
  }

  async isSpeaking(): Promise<boolean> {
    return Speech.isSpeakingAsync();
  }

  onProgress(callback: (event: TTSProgressEvent) => void): () => void {
    this.progressCallbacks.add(callback);
    return () => {
      this.progressCallbacks.delete(callback);
    };
  }

  onEnd(callback: () => void): () => void {
    this.endCallbacks.add(callback);
    return () => {
      this.endCallbacks.delete(callback);
    };
  }

  private notifyProgress(position: number): void {
    const event: TTSProgressEvent = {
      position,
      totalLength: this.currentText.length,
    };
    this.progressCallbacks.forEach(cb => cb(event));
  }

  private notifyEnd(): void {
    this.endCallbacks.forEach(cb => cb());
  }
}
