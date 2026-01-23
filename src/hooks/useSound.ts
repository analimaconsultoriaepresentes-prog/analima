import { useCallback, useRef } from "react";
import { useStore } from "./useStore";

// Sound types mapped to their characteristics
export type SoundType = "success" | "tick" | "pop" | "error";

// Web Audio API-based sound generation for instant, lightweight feedback
const SOUNDS: Record<SoundType, { frequency: number; duration: number; type: OscillatorType; volume: number }> = {
  success: { frequency: 880, duration: 150, type: "sine", volume: 0.15 }, // Pleasant "plim"
  tick: { frequency: 1200, duration: 50, type: "sine", volume: 0.08 }, // Subtle "tick"
  pop: { frequency: 600, duration: 80, type: "sine", volume: 0.1 }, // Light "pop"
  error: { frequency: 200, duration: 100, type: "triangle", volume: 0.1 }, // Low "toc"
};

export function useSound() {
  const { store } = useStore();
  const audioContextRef = useRef<AudioContext | null>(null);

  const getAudioContext = useCallback(() => {
    if (!audioContextRef.current) {
      audioContextRef.current = new (window.AudioContext || (window as any).webkitAudioContext)();
    }
    return audioContextRef.current;
  }, []);

  const playSound = useCallback((type: SoundType) => {
    // Check if sounds are enabled
    if (!store?.soundEnabled) return;

    try {
      const context = getAudioContext();
      const sound = SOUNDS[type];

      // Create oscillator for the main tone
      const oscillator = context.createOscillator();
      const gainNode = context.createGain();

      oscillator.type = sound.type;
      oscillator.frequency.setValueAtTime(sound.frequency, context.currentTime);

      // For success sound, add a second higher note for "plim" effect
      if (type === "success") {
        oscillator.frequency.setValueAtTime(880, context.currentTime);
        oscillator.frequency.setValueAtTime(1174, context.currentTime + 0.08); // D6 note
      }

      // Envelope for smooth attack/decay
      gainNode.gain.setValueAtTime(0, context.currentTime);
      gainNode.gain.linearRampToValueAtTime(sound.volume, context.currentTime + 0.01);
      gainNode.gain.exponentialRampToValueAtTime(0.001, context.currentTime + sound.duration / 1000);

      oscillator.connect(gainNode);
      gainNode.connect(context.destination);

      oscillator.start(context.currentTime);
      oscillator.stop(context.currentTime + sound.duration / 1000);
    } catch (error) {
      // Silently fail - sounds are optional UX enhancement
      console.debug("Sound playback failed:", error);
    }
  }, [store?.soundEnabled, getAudioContext]);

  // Convenience methods for specific actions
  const playSaleSuccess = useCallback(() => playSound("success"), [playSound]);
  const playActionTick = useCallback(() => playSound("tick"), [playSound]);
  const playHelpPop = useCallback(() => playSound("pop"), [playSound]);
  const playErrorToc = useCallback(() => playSound("error"), [playSound]);

  return {
    playSound,
    playSaleSuccess,
    playActionTick,
    playHelpPop,
    playErrorToc,
    soundEnabled: store?.soundEnabled ?? false,
  };
}
