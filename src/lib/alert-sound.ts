// ============================================
// CommuteSense - Alert Sound System
// Web Audio API based emergency alert sounds
// No external audio files needed
// ============================================

let audioCtx: AudioContext | null = null;
let isMuted = false;

function getCtx(): AudioContext {
  if (!audioCtx) {
    audioCtx = new AudioContext();
  }
  if (audioCtx.state === 'suspended') {
    audioCtx.resume();
  }
  return audioCtx;
}

export function setMuted(muted: boolean) {
  isMuted = muted;
}

export function getMuted() {
  return isMuted;
}

/**
 * Play a two-tone rising alarm — used for critical emergencies (puncture, driver down)
 */
export function playEmergencyAlarm() {
  if (isMuted) return;
  const ctx = getCtx();
  const now = ctx.currentTime;

  // First high-pitched beep
  const osc1 = ctx.createOscillator();
  const gain1 = ctx.createGain();
  osc1.type = 'square';
  osc1.frequency.setValueAtTime(880, now);
  gain1.gain.setValueAtTime(0.25, now);
  gain1.gain.exponentialRampToValueAtTime(0.01, now + 0.2);
  osc1.connect(gain1).connect(ctx.destination);
  osc1.start(now);
  osc1.stop(now + 0.25);

  // Second higher beep
  const osc2 = ctx.createOscillator();
  const gain2 = ctx.createGain();
  osc2.type = 'square';
  osc2.frequency.setValueAtTime(1100, now + 0.3);
  gain2.gain.setValueAtTime(0.3, now + 0.3);
  gain2.gain.exponentialRampToValueAtTime(0.01, now + 0.55);
  osc2.connect(gain2).connect(ctx.destination);
  osc2.start(now + 0.3);
  osc2.stop(now + 0.6);

  // Third even higher beep (urgency)
  const osc3 = ctx.createOscillator();
  const gain3 = ctx.createGain();
  osc3.type = 'square';
  osc3.frequency.setValueAtTime(1320, now + 0.65);
  gain3.gain.setValueAtTime(0.35, now + 0.65);
  gain3.gain.exponentialRampToValueAtTime(0.01, now + 0.95);
  osc3.connect(gain3).connect(ctx.destination);
  osc3.start(now + 0.65);
  osc3.stop(now + 1.0);
}

/**
 * Play a repeating siren pattern — used for traffic jam alerts
 */
export function playTrafficSiren() {
  if (isMuted) return;
  const ctx = getCtx();
  const now = ctx.currentTime;

  // Rising tone
  const osc = ctx.createOscillator();
  const gain = ctx.createGain();
  osc.type = 'sawtooth';
  osc.frequency.setValueAtTime(400, now);
  osc.frequency.linearRampToValueAtTime(800, now + 0.4);
  osc.frequency.linearRampToValueAtTime(400, now + 0.8);
  gain.gain.setValueAtTime(0.15, now);
  gain.gain.setValueAtTime(0.15, now + 0.7);
  gain.gain.exponentialRampToValueAtTime(0.01, now + 0.85);
  osc.connect(gain).connect(ctx.destination);
  osc.start(now);
  osc.stop(now + 0.9);

  // Repeat once for emphasis
  const osc2 = ctx.createOscillator();
  const gain2 = ctx.createGain();
  osc2.type = 'sawtooth';
  osc2.frequency.setValueAtTime(400, now + 1.0);
  osc2.frequency.linearRampToValueAtTime(800, now + 1.4);
  osc2.frequency.linearRampToValueAtTime(400, now + 1.8);
  gain2.gain.setValueAtTime(0.15, now + 1.0);
  gain2.gain.setValueAtTime(0.15, now + 1.7);
  gain2.gain.exponentialRampToValueAtTime(0.01, now + 1.85);
  osc2.connect(gain2).connect(ctx.destination);
  osc2.start(now + 1.0);
  osc2.stop(now + 1.9);
}

/**
 * Play a single notification beep — used for info alerts
 */
export function playInfoBeep() {
  if (isMuted) return;
  const ctx = getCtx();
  const now = ctx.currentTime;

  const osc = ctx.createOscillator();
  const gain = ctx.createGain();
  osc.type = 'sine';
  osc.frequency.setValueAtTime(660, now);
  gain.gain.setValueAtTime(0.2, now);
  gain.gain.exponentialRampToValueAtTime(0.01, now + 0.3);
  osc.connect(gain).connect(ctx.destination);
  osc.start(now);
  osc.stop(now + 0.35);
}

/**
 * Play the appropriate sound based on alert type
 */
export function playAlertSound(type: string) {
  if (type === 'PUNCTURE' || type === 'DRIVER_UNAVAILABLE' || type === 'BREAKDOWN') {
    playEmergencyAlarm();
  } else if (type === 'TRAFFIC_JAM') {
    playTrafficSiren();
  } else {
    playInfoBeep();
  }
}
