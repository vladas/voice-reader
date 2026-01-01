import React, { useState } from 'react';
import { View, TouchableOpacity, StyleSheet, Text, Modal, Pressable } from 'react-native';
import { useTTS } from '../contexts/TTSContext';
import { Colors } from '../constants/Colors';

interface TTSControlsProps {
  onRequestText: () => Promise<string>; // Callback to get text to speak
}

const SPEED_OPTIONS = [
  { label: '0.5x', value: 0.5 },
  { label: '0.75x', value: 0.75 },
  { label: '1x', value: 1.0 },
  { label: '1.25x', value: 1.25 },
  { label: '1.5x', value: 1.5 },
  { label: '2x', value: 2.0 },
];

export const TTSControls = ({ onRequestText }: TTSControlsProps) => {
  const { isPlaying, isPaused, rate, speak, pause, resume, stop, setRate } = useTTS();
  const [showSpeedPicker, setShowSpeedPicker] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  const handlePlayPause = async () => {
    if (isPlaying && !isPaused) {
      pause();
    } else if (isPaused) {
      resume();
    } else {
      // Start new speech
      setIsLoading(true);
      try {
        const text = await onRequestText();
        if (text) {
          await speak(text);
        }
      } catch (e) {
        console.error('Failed to start TTS:', e);
      } finally {
        setIsLoading(false);
      }
    }
  };

  const handleSpeedSelect = (newRate: number) => {
    setRate(newRate);
    setShowSpeedPicker(false);
  };

  const currentSpeedLabel = SPEED_OPTIONS.find(o => o.value === rate)?.label || `${rate}x`;

  return (
    <>
      <View style={styles.container}>
        {/* Speed Button */}
        <TouchableOpacity 
          style={styles.speedButton}
          onPress={() => setShowSpeedPicker(true)}
        >
          <Text style={styles.speedText}>{currentSpeedLabel}</Text>
        </TouchableOpacity>

        {/* Play/Pause FAB */}
        <TouchableOpacity 
          style={[styles.fab, isLoading && styles.fabDisabled]}
          onPress={handlePlayPause}
          disabled={isLoading}
        >
          <Text style={styles.fabIcon}>
            {isLoading ? '...' : (isPlaying && !isPaused ? '⏸' : '▶')}
          </Text>
        </TouchableOpacity>

        {/* Stop Button (only visible when playing) */}
        {isPlaying && (
          <TouchableOpacity style={styles.stopButton} onPress={stop}>
            <Text style={styles.stopText}>⏹</Text>
          </TouchableOpacity>
        )}
      </View>

      {/* Speed Picker Modal */}
      <Modal
        visible={showSpeedPicker}
        transparent
        animationType="fade"
        onRequestClose={() => setShowSpeedPicker(false)}
      >
        <Pressable 
          style={styles.modalOverlay} 
          onPress={() => setShowSpeedPicker(false)}
        >
          <View style={styles.speedPickerContainer}>
            <Text style={styles.speedPickerTitle}>Reading Speed</Text>
            {SPEED_OPTIONS.map((option) => (
              <TouchableOpacity
                key={option.value}
                style={[
                  styles.speedOption,
                  option.value === rate && styles.speedOptionSelected
                ]}
                onPress={() => handleSpeedSelect(option.value)}
              >
                <Text style={[
                  styles.speedOptionText,
                  option.value === rate && styles.speedOptionTextSelected
                ]}>
                  {option.label}
                </Text>
              </TouchableOpacity>
            ))}
          </View>
        </Pressable>
      </Modal>
    </>
  );
};

const styles = StyleSheet.create({
  container: {
    position: 'absolute',
    bottom: 100, // Moved higher to be clearly visible above home indicator
    right: 20,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    zIndex: 999, // Ensure it's above WebView
  },
  fab: {
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: Colors.theme.accent,
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 8,
  },
  fabDisabled: {
    opacity: 0.6,
  },
  fabIcon: {
    fontSize: 24,
    color: '#FFFFFF',
  },
  speedButton: {
    paddingHorizontal: 12,
    paddingVertical: 8,
    backgroundColor: Colors.theme.surface,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: Colors.theme.border,
  },
  speedText: {
    fontSize: 14,
    fontWeight: '600',
    color: Colors.theme.text,
  },
  stopButton: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: Colors.theme.surface,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: Colors.theme.border,
  },
  stopText: {
    fontSize: 18,
    color: Colors.theme.text,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  speedPickerContainer: {
    backgroundColor: Colors.theme.surface,
    borderRadius: 16,
    padding: 20,
    minWidth: 200,
  },
  speedPickerTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: Colors.theme.text,
    marginBottom: 16,
    textAlign: 'center',
  },
  speedOption: {
    paddingVertical: 12,
    paddingHorizontal: 20,
    borderRadius: 8,
    marginBottom: 4,
  },
  speedOptionSelected: {
    backgroundColor: Colors.theme.accent + '20',
  },
  speedOptionText: {
    fontSize: 16,
    color: Colors.theme.text,
    textAlign: 'center',
  },
  speedOptionTextSelected: {
    color: Colors.theme.accent,
    fontWeight: '600',
  },
});
