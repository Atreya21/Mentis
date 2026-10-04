// Web Audio API Notification Chime Synthesizer
// Zero external sound files needed, zero latency, pleasant modern chime

class AudioChimeService {
  constructor() {
    this.audioCtx = null;
    this.muted = localStorage.getItem('mentis_sound_muted') === 'true';
  }

  getAudioContext() {
    if (!this.audioCtx && (window.AudioContext || window.webkitAudioContext)) {
      const AudioContextClass = window.AudioContext || window.webkitAudioContext;
      this.audioCtx = new AudioContextClass();
    }
    return this.audioCtx;
  }

  isMuted() {
    return this.muted;
  }

  setMuted(mute) {
    this.muted = !!mute;
    localStorage.setItem('mentis_sound_muted', this.muted ? 'true' : 'false');
  }

  toggleMute() {
    this.setMuted(!this.muted);
    return this.muted;
  }

  // Play pleasant, warm two-tone chime (D5 -> A5)
  playNotificationSound() {
    if (this.muted) return;

    try {
      const ctx = this.getAudioContext();
      if (!ctx) return;

      if (ctx.state === 'suspended') {
        ctx.resume().catch(() => {});
      }

      const now = ctx.currentTime;

      // Master gain node for gentle, modern volume
      const masterGain = ctx.createGain();
      masterGain.gain.setValueAtTime(0.18, now);
      masterGain.connect(ctx.destination);

      // Note 1: 587.33 Hz (D5) - warm chime tone
      const osc1 = ctx.createOscillator();
      const gain1 = ctx.createGain();
      osc1.type = 'sine';
      osc1.frequency.setValueAtTime(587.33, now);
      // Soft attack & exponential decay
      gain1.gain.setValueAtTime(0.001, now);
      gain1.gain.exponentialRampToValueAtTime(0.35, now + 0.02);
      gain1.gain.exponentialRampToValueAtTime(0.0001, now + 0.35);
      osc1.connect(gain1);
      gain1.connect(masterGain);
      osc1.start(now);
      osc1.stop(now + 0.36);

      // Note 2: 880 Hz (A5) - uplifting harmonic tone, delayed by 110ms
      const note2Start = now + 0.11;
      const osc2 = ctx.createOscillator();
      const gain2 = ctx.createGain();
      osc2.type = 'sine';
      osc2.frequency.setValueAtTime(880, note2Start);
      gain2.gain.setValueAtTime(0.001, note2Start);
      gain2.gain.exponentialRampToValueAtTime(0.4, note2Start + 0.03);
      gain2.gain.exponentialRampToValueAtTime(0.0001, note2Start + 0.55);
      osc2.connect(gain2);
      gain2.connect(masterGain);
      osc2.start(note2Start);
      osc2.stop(note2Start + 0.56);
    } catch (err) {
      console.warn('Notification chime error:', err);
    }
  }
}

const audioChime = new AudioChimeService();
export default audioChime;
