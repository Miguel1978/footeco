// Web Audio synthetic referee whistle and timer alerts
let audioCtx: AudioContext | null = null;

function getAudioContext(): AudioContext {
  if (!audioCtx) {
    const AudioContextClass = window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
    audioCtx = new AudioContextClass();
  }
  if (audioCtx.state === 'suspended') {
    audioCtx.resume();
  }
  return audioCtx;
}

export function playWhistleSound() {
  try {
    const ctx = getAudioContext();
    const now = ctx.currentTime;

    // Dual oscillator whistle effect with slight vibrato / modulation
    const osc1 = ctx.createOscillator();
    const osc2 = ctx.createOscillator();
    const gain = ctx.createGain();

    osc1.type = 'triangle';
    osc1.frequency.setValueAtTime(2600, now);
    osc1.frequency.linearRampToValueAtTime(2900, now + 0.15);
    osc1.frequency.linearRampToValueAtTime(2700, now + 0.35);

    osc2.type = 'sine';
    osc2.frequency.setValueAtTime(2680, now);
    osc2.frequency.linearRampToValueAtTime(2980, now + 0.15);
    osc2.frequency.linearRampToValueAtTime(2750, now + 0.35);

    // Envelope
    gain.gain.setValueAtTime(0, now);
    gain.gain.linearRampToValueAtTime(0.4, now + 0.05);
    gain.gain.setValueAtTime(0.35, now + 0.3);
    gain.gain.exponentialRampToValueAtTime(0.001, now + 0.5);

    osc1.connect(gain);
    osc2.connect(gain);
    gain.connect(ctx.destination);

    osc1.start(now);
    osc2.start(now);
    osc1.stop(now + 0.5);
    osc2.stop(now + 0.5);

    // Second short burst for real referee double whistle
    setTimeout(() => {
      try {
        const now2 = ctx.currentTime;
        const osc3 = ctx.createOscillator();
        const gain2 = ctx.createGain();
        osc3.type = 'triangle';
        osc3.frequency.setValueAtTime(2800, now2);
        osc3.frequency.linearRampToValueAtTime(3100, now2 + 0.2);
        gain2.gain.setValueAtTime(0.4, now2);
        gain2.gain.exponentialRampToValueAtTime(0.001, now2 + 0.4);
        osc3.connect(gain2);
        gain2.connect(ctx.destination);
        osc3.start(now2);
        osc3.stop(now2 + 0.4);
      } catch (e) {
        console.error('Audio whistle burst 2 error', e);
      }
    }, 450);
  } catch (err) {
    console.error('Audio context whistle error:', err);
  }
}

export function playBeep(freq = 880, duration = 0.15) {
  try {
    const ctx = getAudioContext();
    const now = ctx.currentTime;
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.type = 'sine';
    osc.frequency.setValueAtTime(freq, now);
    gain.gain.setValueAtTime(0.2, now);
    gain.gain.exponentialRampToValueAtTime(0.001, now + duration);
    osc.connect(gain);
    gain.connect(ctx.destination);
    osc.start(now);
    osc.stop(now + duration);
  } catch (err) {
    console.error('Audio beep error:', err);
  }
}

// Rewarding goal celebration sound chime
export function playGoalCelebrationSound() {
  try {
    const ctx = getAudioContext();
    const now = ctx.currentTime;
    const notes = [523.25, 659.25, 783.99, 1046.5]; // C5, E5, G5, C6 (major chord chime)

    notes.forEach((freq, idx) => {
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      const noteStart = now + idx * 0.08;

      osc.type = 'triangle';
      osc.frequency.setValueAtTime(freq, noteStart);

      gain.gain.setValueAtTime(0, noteStart);
      gain.gain.linearRampToValueAtTime(0.28, noteStart + 0.02);
      gain.gain.exponentialRampToValueAtTime(0.001, noteStart + 0.35);

      osc.connect(gain);
      gain.connect(ctx.destination);

      osc.start(noteStart);
      osc.stop(noteStart + 0.35);
    });
  } catch (err) {
    console.error('Goal chime error:', err);
  }
}

// Crisp substitution audio chime (two-tone swap sound: 587.33Hz D5 -> 783.99Hz G5)
export function playSubstitutionSound() {
  try {
    const ctx = getAudioContext();
    const now = ctx.currentTime;
    
    // Note 1: player exiting
    const osc1 = ctx.createOscillator();
    const gain1 = ctx.createGain();
    osc1.type = 'sine';
    osc1.frequency.setValueAtTime(587.33, now); // D5
    gain1.gain.setValueAtTime(0.18, now);
    gain1.gain.exponentialRampToValueAtTime(0.001, now + 0.12);
    osc1.connect(gain1);
    gain1.connect(ctx.destination);
    osc1.start(now);
    osc1.stop(now + 0.12);

    // Note 2: player entering
    const osc2 = ctx.createOscillator();
    const gain2 = ctx.createGain();
    osc2.type = 'triangle';
    osc2.frequency.setValueAtTime(783.99, now + 0.08); // G5
    gain2.gain.setValueAtTime(0.22, now + 0.08);
    gain2.gain.exponentialRampToValueAtTime(0.001, now + 0.28);
    osc2.connect(gain2);
    gain2.connect(ctx.destination);
    osc2.start(now + 0.08);
    osc2.stop(now + 0.28);
  } catch (err) {
    console.error('Substitution chime error:', err);
  }
}
