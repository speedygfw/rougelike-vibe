export default class AudioSystem {
    constructor() {
        this.ctx = null;
        this.masterGain = null;
        this.musicOscillators = [];
        this.isMuted = false;
        this.musicTimer = null;
        this.currentTheme = null;
    }

    init() {
        if (this.ctx) return;

        const AudioContext = window.AudioContext || window.webkitAudioContext;
        this.ctx = new AudioContext();
        this.masterGain = this.ctx.createGain();
        this.masterGain.gain.value = 0.3; // Master volume
        this.masterGain.connect(this.ctx.destination);
    }

    playSound(type) {
        if (!this.ctx || this.isMuted) return;
        if (this.ctx.state === 'suspended') this.ctx.resume();

        const osc = this.ctx.createOscillator();
        const gain = this.ctx.createGain();

        osc.connect(gain);
        gain.connect(this.masterGain);

        const now = this.ctx.currentTime;

        if (type === 'step') {
            // Quiet click/tap
            osc.type = 'triangle';
            osc.frequency.setValueAtTime(100 + Math.random() * 50, now);
            gain.gain.setValueAtTime(0.1, now);
            gain.gain.exponentialRampToValueAtTime(0.01, now + 0.05);
            osc.start(now);
            osc.stop(now + 0.05);
        } else if (type === 'hit') {
            // Noise burst / low punch
            osc.type = 'square';
            osc.frequency.setValueAtTime(150, now);
            osc.frequency.exponentialRampToValueAtTime(40, now + 0.1);
            gain.gain.setValueAtTime(0.3, now);
            gain.gain.exponentialRampToValueAtTime(0.01, now + 0.1);
            osc.start(now);
            osc.stop(now + 0.1);
        } else if (type === 'magic') {
            // High pitch sine sweep
            osc.type = 'sine';
            osc.frequency.setValueAtTime(400, now);
            osc.frequency.linearRampToValueAtTime(800, now + 0.3);
            gain.gain.setValueAtTime(0.2, now);
            gain.gain.linearRampToValueAtTime(0.01, now + 0.3);
            osc.start(now);
            osc.stop(now + 0.3);
        } else if (type === 'pickup') {
            // Cheerful chime (two tones)
            osc.type = 'sine';
            osc.frequency.setValueAtTime(600, now);
            gain.gain.setValueAtTime(0.2, now);
            gain.gain.linearRampToValueAtTime(0.01, now + 0.1);
            osc.start(now);
            osc.stop(now + 0.1);

            // Second tone
            const osc2 = this.ctx.createOscillator();
            const gain2 = this.ctx.createGain();
            osc2.connect(gain2);
            gain2.connect(this.masterGain);
            osc2.type = 'sine';
            osc2.frequency.setValueAtTime(900, now + 0.1);
            gain2.gain.setValueAtTime(0.2, now + 0.1);
            gain2.gain.linearRampToValueAtTime(0.01, now + 0.2);
            osc2.start(now + 0.1);
            osc2.stop(now + 0.2);
        } else if (type === 'level_up') {
            // Ascending major arpeggio
            const freqs = [440, 554, 659, 880];
            freqs.forEach((f, i) => {
                const o = this.ctx.createOscillator();
                const g = this.ctx.createGain();
                o.connect(g);
                g.connect(this.masterGain);
                o.type = 'triangle';
                o.frequency.setValueAtTime(f, now + i * 0.1);
                g.gain.setValueAtTime(0.2, now + i * 0.1);
                g.gain.linearRampToValueAtTime(0.01, now + i * 0.1 + 0.3);
                o.start(now + i * 0.1);
                o.stop(now + i * 0.1 + 0.3);
            });
        }
    }

    playTheme(themeName) {
        if (!this.ctx || this.isMuted) return;
        if (this.currentTheme === themeName) return; // Don't restart if already playing
        this.stopMusic();
        this.currentTheme = themeName;

        const bpm = themeName === 'boss' ? 150 : (themeName === 'cave' ? 90 : 120);
        const noteDuration = 60 / bpm;

        let sequence = [];

        if (themeName === 'start') {
            // Epic Intro - Slow, rising
            sequence = [
                { note: 110, type: 'triangle', duration: 0.5 }, // A2
                { note: 164.81, type: 'triangle', duration: 0.5 }, // E3
                { note: 220, type: 'triangle', duration: 0.5 }, // A3
                { note: 164.81, type: 'triangle', duration: 0.5 }, // E3
                { note: 130.81, type: 'triangle', duration: 0.5 }, // C3
                { note: 196, type: 'triangle', duration: 0.5 }, // G3
                { note: 261.63, type: 'triangle', duration: 1.0 }, // C4
            ];
        } else if (themeName === 'dungeon') {
            // Classic Adventure
            sequence = [
                { note: 110, type: 'square', duration: 0.25 }, // A2
                { note: 0, type: 'rest', duration: 0.25 },
                { note: 110, type: 'square', duration: 0.25 },
                { note: 130.81, type: 'square', duration: 0.25 }, // C3
                { note: 146.83, type: 'square', duration: 0.25 }, // D3
                { note: 0, type: 'rest', duration: 0.25 },
                { note: 164.81, type: 'square', duration: 0.25 }, // E3
                { note: 146.83, type: 'square', duration: 0.25 }, // D3
            ];
        } else if (themeName === 'cave') {
            // Spooky, slow, lower
            sequence = [
                { note: 55, type: 'sine', duration: 1.0 }, // A1
                { note: 65.41, type: 'sine', duration: 1.0 }, // C2
                { note: 61.74, type: 'sine', duration: 1.0 }, // B1
                { note: 0, type: 'rest', duration: 1.0 },
            ];
        } else if (themeName === 'boss') {
            // Fast, intense, dissonant
            sequence = [
                { note: 110, type: 'sawtooth', duration: 0.125 }, // A2
                { note: 116.54, type: 'sawtooth', duration: 0.125 }, // Bb2
                { note: 110, type: 'sawtooth', duration: 0.125 }, // A2
                { note: 103.83, type: 'sawtooth', duration: 0.125 }, // G#2
                { note: 220, type: 'square', duration: 0.25 }, // A3
                { note: 0, type: 'rest', duration: 0.25 },
            ];
        }

        let noteIndex = 0;
        let nextNoteTime = this.ctx.currentTime;

        const scheduler = () => {
            if (!this.ctx) return;

            // Schedule ahead
            while (nextNoteTime < this.ctx.currentTime + 0.1) {
                const step = sequence[noteIndex % sequence.length];

                if (step.type !== 'rest') {
                    const osc = this.ctx.createOscillator();
                    const gain = this.ctx.createGain();

                    osc.type = step.type;
                    osc.frequency.setValueAtTime(step.note, nextNoteTime);

                    // Volume envelope
                    const vol = themeName === 'start' ? 0.2 : (themeName === 'boss' ? 0.15 : 0.1);
                    gain.gain.setValueAtTime(vol, nextNoteTime);
                    gain.gain.exponentialRampToValueAtTime(0.01, nextNoteTime + step.duration);

                    osc.connect(gain);
                    gain.connect(this.masterGain);

                    osc.start(nextNoteTime);
                    osc.stop(nextNoteTime + step.duration);
                }

                nextNoteTime += noteDuration;
                noteIndex++;
            }

            this.musicTimer = setTimeout(scheduler, 25);
        };

        scheduler();
    }

    playProceduralTheme(level) {
        if (!this.ctx || this.isMuted) return;
        const themeId = `level_${level}`;
        if (this.currentTheme === themeId) return;
        this.stopMusic();
        this.currentTheme = themeId;

        // Simple seeded random (LCG)
        let seed = level * 123456789 + 54321;
        const random = () => {
            seed = (seed * 1664525 + 1013904223) % 4294967296;
            return seed / 4294967296;
        };

        const bpm = 100 + Math.floor(random() * 60); // 100-160 BPM
        const noteDuration = 60 / bpm;

        // Generate a scale (Minor Pentatonic-ish)
        const root = 110 * (1 + Math.floor(random() * 5) * 0.2); // Randomish root
        const scale = [1, 1.2, 1.33, 1.5, 1.78, 2]; // Ratios

        const sequence = [];
        const length = 16; // 16 steps

        for (let i = 0; i < length; i++) {
            if (random() > 0.3) { // 70% chance of note
                const ratio = scale[Math.floor(random() * scale.length)];
                const note = root * ratio * (random() > 0.8 ? 2 : 1); // Occasional octave up
                const type = random() > 0.5 ? 'square' : 'triangle';
                const duration = random() > 0.7 ? noteDuration * 2 : noteDuration;

                sequence.push({ note, type, duration });
            } else {
                sequence.push({ note: 0, type: 'rest', duration: noteDuration });
            }
        }

        let noteIndex = 0;
        let nextNoteTime = this.ctx.currentTime;

        const scheduler = () => {
            if (!this.ctx) return;

            while (nextNoteTime < this.ctx.currentTime + 0.1) {
                const step = sequence[noteIndex % sequence.length];

                if (step.type !== 'rest') {
                    const osc = this.ctx.createOscillator();
                    const gain = this.ctx.createGain();

                    osc.type = step.type;
                    osc.frequency.setValueAtTime(step.note, nextNoteTime);

                    gain.gain.setValueAtTime(0.08, nextNoteTime);
                    gain.gain.exponentialRampToValueAtTime(0.01, nextNoteTime + step.duration);

                    osc.connect(gain);
                    gain.connect(this.masterGain);

                    osc.start(nextNoteTime);
                    osc.stop(nextNoteTime + step.duration);
                }

                nextNoteTime += step.duration; // Use step duration for timing
                noteIndex++;
            }

            this.musicTimer = setTimeout(scheduler, 25);
        };

        scheduler();
    }

    stopMusic() {
        if (this.musicTimer) clearTimeout(this.musicTimer);
        this.musicOscillators.forEach(node => {
            if (node.stop) node.stop();
            if (node.osc) {
                try {
                    node.osc.stop();
                    node.osc.disconnect();
                } catch (e) { /* ignore */ }
            }
        });
        this.musicOscillators = [];
        this.currentTheme = null;
    }
}
