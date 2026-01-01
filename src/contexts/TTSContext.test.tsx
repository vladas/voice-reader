import React from 'react';
import { renderHook, act } from '@testing-library/react-native';
import { TTSProvider, useTTS } from './TTSContext';
import { ITTSAdapter } from '../adapters/ITTSAdapter';

// Mock Adapter
class MockTTSAdapter implements ITTSAdapter {
  speak = jest.fn().mockResolvedValue(undefined);
  stop = jest.fn();
  pause = jest.fn();
  resume = jest.fn();
  setRate = jest.fn();
  getRate = jest.fn().mockReturnValue(1.0);
  isSpeaking = jest.fn().mockResolvedValue(false);
  onProgress = jest.fn().mockReturnValue(() => {});
  onEnd = jest.fn().mockReturnValue(() => {});
}

describe('TTSContext', () => {
  let mockAdapter: MockTTSAdapter;

  beforeEach(() => {
    mockAdapter = new MockTTSAdapter();
  });

  const wrapper = ({ children }: { children: React.ReactNode }) => (
    <TTSProvider adapter={mockAdapter}>{children}</TTSProvider>
  );

  it('provides initial state', () => {
    const { result } = renderHook(() => useTTS(), { wrapper });
    expect(result.current.isPlaying).toBe(false);
    expect(result.current.isPaused).toBe(false);
    expect(result.current.rate).toBe(1.0);
    expect(result.current.currentSentence).toBe('');
    expect(result.current.currentSentenceIndex).toBe(-1);
  });

  it('splits text and calls adapter for each sentence', async () => {
    const { result } = renderHook(() => useTTS(), { wrapper });
    
    await act(async () => {
      await result.current.speak('Hello World. This is a test.');
    });

    // Should have called speak twice
    expect(mockAdapter.speak).toHaveBeenCalledTimes(2);
    expect(mockAdapter.speak).toHaveBeenNthCalledWith(1, 'Hello World.');
    expect(mockAdapter.speak).toHaveBeenNthCalledWith(2, 'This is a test.');
    
    // After finish, should be reset
    expect(result.current.isPlaying).toBe(false);
  });


  it('updates state on pause/resume', () => {
    const { result } = renderHook(() => useTTS(), { wrapper });

    act(() => {
      result.current.pause();
    });
    expect(mockAdapter.pause).toHaveBeenCalled();
    expect(result.current.isPaused).toBe(true);

    act(() => {
      result.current.resume();
    });
    expect(mockAdapter.resume).toHaveBeenCalled();
    expect(result.current.isPaused).toBe(false);
  });

  it('resets state on stop', () => {
    const { result } = renderHook(() => useTTS(), { wrapper });

    act(() => {
      result.current.stop();
    });
    expect(mockAdapter.stop).toHaveBeenCalled();
    expect(result.current.isPlaying).toBe(false);
    expect(result.current.isPaused).toBe(false);
  });

  it('updates rate', () => {
    const { result } = renderHook(() => useTTS(), { wrapper });

    act(() => {
      result.current.setRate(1.5);
    });
    expect(mockAdapter.setRate).toHaveBeenCalledWith(1.5);
    expect(result.current.rate).toBe(1.5);
  });
});
