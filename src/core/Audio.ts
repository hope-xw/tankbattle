export class AudioEngine {
    private static ctx: AudioContext | null = null;
    private static enabled = false;
    private static bgmInterval: number | null = null;
    private static step = 0;

    public static init() {
        if (!this.ctx) {
            this.ctx = new (window.AudioContext || (window as any).webkitAudioContext)();
            this.enabled = true;
        }
        if (this.ctx.state === 'suspended') {
            this.ctx.resume();
        }
    }

    public static get isEnabled() {
        return this.enabled && this.ctx && this.ctx.state === 'running';
    }

    public static playBGM() {
        if (!this.isEnabled || this.bgmInterval !== null) return;
        const ctx = this.ctx!;

        // Classic Rock / Heavy Blues Progression (110 BPM)
        // E5 -> G5 -> A5 -> E5 pattern, a proper 4-bar loop
        const riffFreqs = [
            // Bar 1 (E)
            82.41, 0, 82.41, 0, 82.41, 82.41, 0, 82.41,
            98.00, 110.00, 0, 82.41, 82.41, 82.41, 0, 0,
            // Bar 2 (G)
            98.00, 0, 98.00, 0, 98.00, 98.00, 0, 98.00,
            110.00, 123.47, 0, 98.00, 98.00, 98.00, 0, 0,
            // Bar 3 (A)
            110.00, 0, 110.00, 0, 110.00, 110.00, 0, 110.00,
            123.47, 130.81, 0, 110.00, 110.00, 110.00, 0, 0,
            // Bar 4 (E, turnaround)
            82.41, 0, 82.41, 0, 82.41, 82.41, 0, 82.41,
            73.42, 77.78, 82.41, 0, 0, 0, 0, 0
        ];

        this.step = 0;
        const tempo = 110; // Slower, heavier groove
        const stepTime = (60 / tempo) / 4; // 16th notes
        const sequenceLength = riffFreqs.length; // 64 steps

        const scheduleNext = () => {
            if (ctx.state !== 'running') return;
            const now = ctx.currentTime;

            // --- 1. Distorted Rhythm Guitar ---
            const freq = riffFreqs[this.step % sequenceLength];
            if (freq > 0) {
                const riffOsc = ctx.createOscillator();
                const riffGain = ctx.createGain();
                riffOsc.type = 'sawtooth';
                riffOsc.frequency.value = freq;

                // Milder distortion, more low-mid body
                const distGain = ctx.createGain();
                distGain.gain.value = 3.0; // Reduced overdrive

                const riffFilter = ctx.createBiquadFilter();
                riffFilter.type = 'lowpass';
                // Warmer envelope
                riffFilter.frequency.setValueAtTime(1200, now);
                riffFilter.frequency.exponentialRampToValueAtTime(300, now + stepTime * 0.7);

                riffGain.gain.setValueAtTime(0.15, now);
                riffGain.gain.exponentialRampToValueAtTime(0.01, now + stepTime * 1.5);

                riffOsc.connect(distGain);
                distGain.connect(riffFilter);
                riffFilter.connect(riffGain);
                riffGain.connect(ctx.destination);

                riffOsc.start(now);
                riffOsc.stop(now + stepTime * 2);
            }

            // --- 2. Solid Rock Drum Kit ---
            const current16th = this.step % 16;
            // Kick on 1 and 3 (steps 0, 8), Snare on 2 and 4 (steps 4, 12)
            // Plus some groove kicks
            const isKick = current16th === 0 || current16th === 8 || current16th === 10;
            const isSnare = current16th === 4 || current16th === 12;

            if (isKick) {
                const kickOsc = ctx.createOscillator();
                const kickGain = ctx.createGain();
                kickOsc.type = 'sine';

                kickOsc.frequency.setValueAtTime(120, now);
                kickOsc.frequency.exponentialRampToValueAtTime(0.01, now + 0.15);

                kickGain.gain.setValueAtTime(0.7, now);
                kickGain.gain.exponentialRampToValueAtTime(0.01, now + 0.15);

                kickOsc.connect(kickGain);
                kickGain.connect(ctx.destination);
                kickOsc.start(now);
                kickOsc.stop(now + 0.15);
            }

            if (isSnare) {
                const bufferSize = ctx.sampleRate * 0.2;
                const buffer = ctx.createBuffer(1, bufferSize, ctx.sampleRate);
                const data = buffer.getChannelData(0);
                for (let i = 0; i < bufferSize; i++) data[i] = Math.random() * 2 - 1;

                const noise = ctx.createBufferSource();
                noise.buffer = buffer;

                const snareFilter = ctx.createBiquadFilter();
                snareFilter.type = 'bandpass';
                snareFilter.frequency.value = 800; // Lower snare body

                const snareGain = ctx.createGain();
                snareGain.gain.setValueAtTime(0.6, now);
                snareGain.gain.exponentialRampToValueAtTime(0.01, now + 0.2);

                noise.connect(snareFilter);
                snareFilter.connect(snareGain);
                snareGain.connect(ctx.destination);
                noise.start(now);
            }

            this.step++;
        };

        scheduleNext();
        this.bgmInterval = window.setInterval(scheduleNext, stepTime * 1000);
    }

    public static stopBGM() {
        if (this.bgmInterval !== null) {
            window.clearInterval(this.bgmInterval);
            this.bgmInterval = null;
        }
    }

    public static playLevelComplete() {
        if (!this.isEnabled) return;
        const ctx = this.ctx!;
        const now = ctx.currentTime;
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();

        osc.type = 'square';
        osc.frequency.setValueAtTime(329.63, now); // E4
        osc.frequency.setValueAtTime(392.00, now + 0.1); // G4
        osc.frequency.setValueAtTime(440.00, now + 0.2); // A4
        osc.frequency.setValueAtTime(493.88, now + 0.3); // B4
        osc.frequency.setValueAtTime(587.33, now + 0.4); // D5
        osc.frequency.setValueAtTime(659.25, now + 0.5); // E5
        osc.frequency.exponentialRampToValueAtTime(880.00, now + 1.5); // A5 bend

        gain.gain.setValueAtTime(0, now);
        gain.gain.linearRampToValueAtTime(0.2, now + 0.1);
        gain.gain.setValueAtTime(0.2, now + 0.5);
        gain.gain.exponentialRampToValueAtTime(0.01, now + 2.0);

        const vibrato = ctx.createOscillator();
        vibrato.type = 'sine';
        vibrato.frequency.value = 8;
        const vibratoGain = ctx.createGain();
        vibratoGain.gain.value = 10;
        vibrato.connect(vibratoGain);
        vibratoGain.connect(osc.frequency);
        vibrato.start(now + 0.5);
        vibrato.stop(now + 2.0);

        osc.connect(gain);
        gain.connect(ctx.destination);

        osc.start(now);
        osc.stop(now + 2.0);
    }

    public static playShoot() {
        if (!this.isEnabled) return;
        const ctx = this.ctx!;
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();

        osc.type = 'square';
        osc.frequency.setValueAtTime(440, ctx.currentTime);
        osc.frequency.exponentialRampToValueAtTime(110, ctx.currentTime + 0.1);

        gain.gain.setValueAtTime(0.1, ctx.currentTime);
        gain.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 0.1);

        osc.connect(gain);
        gain.connect(ctx.destination);

        osc.start();
        osc.stop(ctx.currentTime + 0.1);
    }

    public static playExplosion() {
        if (!this.isEnabled) return;
        const ctx = this.ctx!;

        const bufferSize = ctx.sampleRate * 0.5;
        const buffer = ctx.createBuffer(1, bufferSize, ctx.sampleRate);
        const data = buffer.getChannelData(0);
        for (let i = 0; i < bufferSize; i++) {
            data[i] = Math.random() * 2 - 1;
        }

        const noise = ctx.createBufferSource();
        noise.buffer = buffer;

        const filter = ctx.createBiquadFilter();
        filter.type = 'lowpass';
        filter.frequency.setValueAtTime(1000, ctx.currentTime);
        filter.frequency.exponentialRampToValueAtTime(100, ctx.currentTime + 0.5);

        const gain = ctx.createGain();
        gain.gain.setValueAtTime(0.8, ctx.currentTime);
        gain.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 0.5);

        noise.connect(filter);
        filter.connect(gain);
        gain.connect(ctx.destination);

        noise.start();
    }

    public static playBaseDestroyed() {
        if (!this.isEnabled) return;
        const ctx = this.ctx!;
        const now = ctx.currentTime;
        const duration = 2.0;

        // massive low frequency bass drop
        const osc = ctx.createOscillator();
        const baseGain = ctx.createGain();
        osc.type = 'sawtooth';
        osc.frequency.setValueAtTime(100, now);
        osc.frequency.exponentialRampToValueAtTime(10, now + duration);

        baseGain.gain.setValueAtTime(1.0, now);
        baseGain.gain.linearRampToValueAtTime(0.8, now + 0.5);
        baseGain.gain.exponentialRampToValueAtTime(0.01, now + duration);

        // sweeping white noise blast
        const bufferSize = ctx.sampleRate * duration;
        const buffer = ctx.createBuffer(1, bufferSize, ctx.sampleRate);
        const data = buffer.getChannelData(0);
        for (let i = 0; i < bufferSize; i++) {
            data[i] = Math.random() * 2 - 1;
        }
        const noise = ctx.createBufferSource();
        noise.buffer = buffer;

        const noiseFilter = ctx.createBiquadFilter();
        noiseFilter.type = 'bandpass';
        noiseFilter.frequency.setValueAtTime(400, now);
        noiseFilter.frequency.exponentialRampToValueAtTime(50, now + duration);

        const noiseGain = ctx.createGain();
        noiseGain.gain.setValueAtTime(1.5, now);
        noiseGain.gain.exponentialRampToValueAtTime(0.01, now + duration);

        // Connect everything up
        osc.connect(baseGain);
        baseGain.connect(ctx.destination);

        noise.connect(noiseFilter);
        noiseFilter.connect(noiseGain);
        noiseGain.connect(ctx.destination);

        osc.start();
        osc.stop(now + duration);
        noise.start();
    }

    public static playHitBrick() {
        if (!this.isEnabled) return;
        const ctx = this.ctx!;
        const bufferSize = ctx.sampleRate * 0.1;
        const buffer = ctx.createBuffer(1, bufferSize, ctx.sampleRate);
        const data = buffer.getChannelData(0);
        for (let i = 0; i < bufferSize; i++) data[i] = Math.random() * 2 - 1;
        const noise = ctx.createBufferSource();
        noise.buffer = buffer;

        const filter = ctx.createBiquadFilter();
        filter.type = 'lowpass';
        filter.frequency.setValueAtTime(400, ctx.currentTime);
        filter.frequency.exponentialRampToValueAtTime(50, ctx.currentTime + 0.1);

        const gain = ctx.createGain();
        gain.gain.setValueAtTime(0.4, ctx.currentTime);
        gain.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 0.1);

        noise.connect(filter);
        filter.connect(gain);
        gain.connect(ctx.destination);
        noise.start();
    }

    public static playHitSteel() {
        if (!this.isEnabled) return;
        const ctx = this.ctx!;
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();
        osc.type = 'triangle';
        osc.frequency.setValueAtTime(800, ctx.currentTime);
        osc.frequency.exponentialRampToValueAtTime(100, ctx.currentTime + 0.05);
        gain.gain.setValueAtTime(0.3, ctx.currentTime);
        gain.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 0.05);
        osc.connect(gain);
        gain.connect(ctx.destination);
        osc.start();
        osc.stop(ctx.currentTime + 0.05);
    }

    public static playHitWall() {
        if (!this.isEnabled) return;
        const ctx = this.ctx!;
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();
        osc.type = 'square';
        osc.frequency.setValueAtTime(150, ctx.currentTime);
        osc.frequency.exponentialRampToValueAtTime(40, ctx.currentTime + 0.08);
        gain.gain.setValueAtTime(0.15, ctx.currentTime);
        gain.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 0.08);
        osc.connect(gain);
        gain.connect(ctx.destination);
        osc.start();
        osc.stop(ctx.currentTime + 0.08);
    }

    public static playPowerUp() {
        if (!this.isEnabled) return;
        const ctx = this.ctx!;
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();

        osc.type = 'sine';

        // Arpeggio up
        const now = ctx.currentTime;
        osc.frequency.setValueAtTime(330, now);
        osc.frequency.setValueAtTime(440, now + 0.1);
        osc.frequency.setValueAtTime(554, now + 0.2);
        osc.frequency.setValueAtTime(659, now + 0.3);

        gain.gain.setValueAtTime(0.2, now);
        gain.gain.linearRampToValueAtTime(0.2, now + 0.3);
        gain.gain.exponentialRampToValueAtTime(0.01, now + 0.5);

        osc.connect(gain);
        gain.connect(ctx.destination);

        osc.start();
        osc.stop(now + 0.5);
    }

    public static playStart() {
        if (!this.isEnabled) return;
        const ctx = this.ctx!;

        // Play a sequence of retro notes
        const notes = [440, 440, 554, 659];
        const duration = 0.15;

        notes.forEach((freq, index) => {
            const osc = ctx.createOscillator();
            const gain = ctx.createGain();

            osc.type = 'square';
            osc.frequency.value = freq;

            const startTime = ctx.currentTime + index * duration;
            gain.gain.setValueAtTime(0.1, startTime);
            gain.gain.exponentialRampToValueAtTime(0.01, startTime + duration);

            osc.connect(gain);
            gain.connect(ctx.destination);

            osc.start(startTime);
            osc.stop(startTime + duration);
        });
    }
}
