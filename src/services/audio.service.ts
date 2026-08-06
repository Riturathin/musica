import { Song } from "@/types/song";

declare global {
    interface Window {
        webkitAudioContext?: typeof AudioContext;
    }
}

export const formatDuration = (value: number) => {
    const minutes = Math.floor(value / 60);
    const seconds = Math.floor(value % 60);

    return `${minutes}:${seconds.toString().padStart(2, "0")}`;
};

interface AudioEngineCallbacks {
    onDurationChange?: (duration: number) => void;
    onEnded?: () => void;
    onError?: (message: string) => void;
    onTimeUpdate?: (time: number) => void;
}

class BrowserAudioEngine {
    private context: AudioContext | null = null;
    private oscillator: OscillatorNode | null = null;
    private gain: GainNode | null = null;
    private audio: HTMLAudioElement | null = null;

    play(song: Song, volume: number, callbacks: AudioEngineCallbacks = {}) {
        if (typeof window === "undefined") {
            return;
        }

        this.stop();

        if (song.audioUrl) {
            this.audio = new Audio(song.audioUrl);
            this.audio.preload = "auto";
            this.audio.volume = volume / 100;
            this.audio.onerror = () => {
                callbacks.onError?.("Stream failed. Playing fallback tone.");
                this.audio = null;
                this.playGeneratedTone(song, volume);
            };
            this.audio.onloadedmetadata = () => {
                if (this.audio && Number.isFinite(this.audio.duration)) {
                    callbacks.onDurationChange?.(this.audio.duration);
                }
            };
            this.audio.ontimeupdate = () => {
                if (this.audio) {
                    callbacks.onTimeUpdate?.(this.audio.currentTime);
                }
            };
            this.audio.onended = () => callbacks.onEnded?.();

            this.audio.play().catch(() => {
                callbacks.onError?.("Browser blocked the stream. Playing fallback tone.");
                this.audio = null;
                this.playGeneratedTone(song, volume);
            });
            return;
        }

        this.playGeneratedTone(song, volume);
    }

    pause() {
        this.audio?.pause();
        void this.context?.suspend();
    }

    resume() {
        if (this.audio) {
            void this.audio.play();
            return;
        }

        void this.context?.resume();
    }

    stop() {
        if (this.audio) {
            this.audio.pause();
            this.audio.currentTime = 0;
        }

        this.audio = null;

        if (this.oscillator) {
            try {
                this.oscillator.stop();
            } catch {
                // The oscillator can already be stopped when a user taps quickly.
            }
        }

        this.oscillator = null;
        this.gain = null;
    }

    setVolume(volume: number) {
        if (this.audio) {
            this.audio.volume = volume / 100;
        }

        if (this.gain) {
            this.gain.gain.value = volume / 100;
        }
    }

    seek(value: number) {
        if (this.audio) {
            this.audio.currentTime = value;
        }
    }

    isNativeAudioActive() {
        return Boolean(this.audio);
    }

    private playGeneratedTone(song: Song, volume: number) {
        const AudioContextConstructor = window.AudioContext || window.webkitAudioContext;
        this.context = this.context ?? new AudioContextConstructor();
        this.oscillator = this.context.createOscillator();
        this.gain = this.context.createGain();

        this.oscillator.type = "sine";
        this.oscillator.frequency.value = this.getSongFrequency(song);
        this.gain.gain.value = volume / 100;

        this.oscillator.connect(this.gain);
        this.gain.connect(this.context.destination);
        this.oscillator.start();

        void this.context.resume();
    }

    private getSongFrequency(song: Song) {
        const baseByMood = {
            chill: 220,
            energy: 330,
            focus: 247,
            happy: 294,
            romance: 262,
        };

        const idValue = [...song.id].reduce((total, character) => total + character.charCodeAt(0), 0);

        return baseByMood[song.mood] + (idValue % 12) * 18;
    }
}

export const audioEngine = new BrowserAudioEngine();

export const clampProgress = (value: number, duration: number) => {
    if (value < 0) {
        return 0;
    }

    if (value > duration) {
        return duration;
    }

    return value;
};
