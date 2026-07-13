export type SoundCue = "ui" | "step" | "interact" | "restore" | "error" | "complete";

interface AudioSettings {
  enabled: boolean;
  volume: number;
}

const CUE_FREQUENCIES: Record<SoundCue, readonly number[]> = {
  ui: [420, 520],
  step: [120],
  interact: [330, 495],
  restore: [330, 440, 660],
  error: [180, 140],
  complete: [262, 330, 392, 523]
};

class AudioManager {
  private context: AudioContext | null = null;
  private master: GainNode | null = null;
  private settings: AudioSettings = { enabled: true, volume: 0.55 };
  private ambientTimer: number | null = null;

  setSettings(settings: Partial<AudioSettings>): void {
    this.settings = { ...this.settings, ...settings };
    if (this.master && this.context) {
      this.master.gain.setTargetAtTime(this.settings.enabled ? this.settings.volume : 0, this.context.currentTime, 0.03);
    }
    if (!this.settings.enabled) this.stopAmbience();
  }

  async unlock(): Promise<void> {
    if (!this.settings.enabled || typeof window === "undefined" || !("AudioContext" in window)) return;
    if (!this.context) {
      this.context = new AudioContext();
      this.master = this.context.createGain();
      this.master.gain.value = this.settings.volume;
      this.master.connect(this.context.destination);
    }
    if (this.context.state === "suspended") await this.context.resume();
  }

  play(cue: SoundCue): void {
    if (!this.settings.enabled) return;
    void this.unlock().then(() => {
      if (!this.context || !this.master) return;
      const frequencies = CUE_FREQUENCIES[cue];
      const now = this.context.currentTime;
      frequencies.forEach((frequency, index) => {
        const oscillator = this.context!.createOscillator();
        const gain = this.context!.createGain();
        const start = now + index * 0.075;
        const duration = cue === "complete" ? 0.22 : cue === "step" ? 0.035 : 0.1;
        oscillator.type = cue === "step" ? "triangle" : "square";
        oscillator.frequency.setValueAtTime(frequency, start);
        gain.gain.setValueAtTime(0.0001, start);
        gain.gain.exponentialRampToValueAtTime(cue === "step" ? 0.025 : 0.07, start + 0.008);
        gain.gain.exponentialRampToValueAtTime(0.0001, start + duration);
        oscillator.connect(gain);
        gain.connect(this.master!);
        oscillator.start(start);
        oscillator.stop(start + duration + 0.02);
      });
    }).catch(() => {
      // Browsers may defer audio until a user gesture; gameplay remains fully usable.
    });
  }

  startAmbience(): void {
    if (!this.settings.enabled || this.ambientTimer !== null || typeof window === "undefined") return;
    const schedule = () => {
      if (!this.settings.enabled) return;
      void this.unlock().then(() => {
        if (!this.context || !this.master) return;
        const oscillator = this.context.createOscillator();
        const gain = this.context.createGain();
        const now = this.context.currentTime;
        oscillator.type = "sine";
        oscillator.frequency.setValueAtTime(88, now);
        oscillator.frequency.linearRampToValueAtTime(96, now + 4);
        gain.gain.setValueAtTime(0.0001, now);
        gain.gain.exponentialRampToValueAtTime(0.014, now + 1.2);
        gain.gain.exponentialRampToValueAtTime(0.0001, now + 4.5);
        oscillator.connect(gain);
        gain.connect(this.master);
        oscillator.start(now);
        oscillator.stop(now + 4.6);
      }).catch(() => {
        // The next user gesture can unlock the context.
      });
    };
    schedule();
    this.ambientTimer = window.setInterval(schedule, 6200);
  }

  stopAmbience(): void {
    if (this.ambientTimer !== null && typeof window !== "undefined") {
      window.clearInterval(this.ambientTimer);
      this.ambientTimer = null;
    }
  }

  dispose(): void {
    this.stopAmbience();
    if (this.context) void this.context.close();
    this.context = null;
    this.master = null;
  }
}

export const audioManager = new AudioManager();
