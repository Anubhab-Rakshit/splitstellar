class AudioEngine {
  constructor() {
    this.audioCtx = null;
    this.isEnabled = true; // Auto-enabled, but browser requires gesture to unlock
  }

  _initContext() {
    if (!this.audioCtx) {
      const AudioContext = window.AudioContext || window.webkitAudioContext;
      if (AudioContext) {
        this.audioCtx = new AudioContext();
      }
    }
    if (this.audioCtx?.state === 'suspended') {
      this.audioCtx.resume();
    }
  }

  playTick() {
    if (!this.isEnabled) return;
    this._initContext();
    if (!this.audioCtx) return;

    try {
      const osc = this.audioCtx.createOscillator();
      const gainNode = this.audioCtx.createGain();

      osc.type = 'sine';
      osc.frequency.setValueAtTime(800, this.audioCtx.currentTime); // High pitch tick
      osc.frequency.exponentialRampToValueAtTime(300, this.audioCtx.currentTime + 0.05);

      gainNode.gain.setValueAtTime(0, this.audioCtx.currentTime);
      gainNode.gain.linearRampToValueAtTime(0.05, this.audioCtx.currentTime + 0.01);
      gainNode.gain.exponentialRampToValueAtTime(0.001, this.audioCtx.currentTime + 0.05);

      osc.connect(gainNode);
      gainNode.connect(this.audioCtx.destination);

      osc.start(this.audioCtx.currentTime);
      osc.stop(this.audioCtx.currentTime + 0.06);
    } catch (e) {
      // Ignore audio errors
    }
  }

  playSuccess() {
    if (!this.isEnabled) return;
    this._initContext();
    if (!this.audioCtx) return;

    try {
      const playTone = (freq, delay, duration) => {
        const osc = this.audioCtx.createOscillator();
        const gainNode = this.audioCtx.createGain();

        osc.type = 'sine';
        osc.frequency.setValueAtTime(freq, this.audioCtx.currentTime + delay);

        gainNode.gain.setValueAtTime(0, this.audioCtx.currentTime + delay);
        gainNode.gain.linearRampToValueAtTime(0.1, this.audioCtx.currentTime + delay + 0.05);
        gainNode.gain.exponentialRampToValueAtTime(0.001, this.audioCtx.currentTime + delay + duration);

        osc.connect(gainNode);
        gainNode.connect(this.audioCtx.destination);

        osc.start(this.audioCtx.currentTime + delay);
        osc.stop(this.audioCtx.currentTime + delay + duration + 0.1);
      };

      // Play a soft C major chord arpeggio
      playTone(523.25, 0, 0.4);    // C5
      playTone(659.25, 0.05, 0.4); // E5
      playTone(783.99, 0.1, 0.6);  // G5
    } catch (e) {
      // Ignore audio errors
    }
  }

  toggle() {
    this.isEnabled = !this.isEnabled;
    return this.isEnabled;
  }
}

export const audio = new AudioEngine();
