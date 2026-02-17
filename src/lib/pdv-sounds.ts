/**
 * PDV Sound effects using Web Audio API.
 * No external files needed — generates tones programmatically.
 */

let audioCtx: AudioContext | null = null;

function getAudioContext(): AudioContext {
  if (!audioCtx) {
    audioCtx = new AudioContext();
  }
  return audioCtx;
}

function playTone(frequency: number, duration: number, type: OscillatorType = "sine", volume = 0.15) {
  try {
    const ctx = getAudioContext();
    const oscillator = ctx.createOscillator();
    const gainNode = ctx.createGain();

    oscillator.type = type;
    oscillator.frequency.setValueAtTime(frequency, ctx.currentTime);
    gainNode.gain.setValueAtTime(volume, ctx.currentTime);
    gainNode.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + duration);

    oscillator.connect(gainNode);
    gainNode.connect(ctx.destination);

    oscillator.start(ctx.currentTime);
    oscillator.stop(ctx.currentTime + duration);
  } catch {
    // Audio not supported — silent fallback
  }
}

/** Short beep when a product is added successfully */
export function playAddSound() {
  playTone(880, 0.08, "sine", 0.12);
}

/** Two-tone error beep */
export function playErrorSound() {
  playTone(200, 0.15, "square", 0.1);
  setTimeout(() => playTone(150, 0.2, "square", 0.1), 160);
}

/** Rising chime when sale is finalized */
export function playSaleCompleteSound() {
  playTone(523, 0.1, "sine", 0.1);
  setTimeout(() => playTone(659, 0.1, "sine", 0.1), 100);
  setTimeout(() => playTone(784, 0.15, "sine", 0.12), 200);
}
