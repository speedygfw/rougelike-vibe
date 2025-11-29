export default class AudioSystem {
    ctx: AudioContext | null;
    masterGain: GainNode | null;
    musicOscillators: any[];
    isMuted: boolean;
    musicTimer: any;
    currentTheme: string | null;

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

        const AudioContext = window.AudioContext || (window as any).webkitAudioContext;
        this.ctx = new AudioContext();
        this.masterGain = this.ctx.createGain();
        this.masterGain.gain.value = 0.3; // Master volume
        this.masterGain.connect(this.ctx.destination);
    }

    playSound(type: string) {
        if (!this.ctx || this.isMuted) return;
        if (this.ctx.state === 'suspended') this.ctx.resume();

        const osc = this.ctx.createOscillator();
        const gain = this.ctx.createGain();

        osc.connect(gain);
        gain.connect(this.masterGain!);

        const now = this.ctx.currentTime;

        // Pitch Randomization (+/- 10%)
        const pitchMod = 0.9 + Math.random() * 0.2;

        if (type === 'step') {
            // Quiet click/tap
            osc.type = 'triangle';
            osc.frequency.setValueAtTime((100 + Math.random() * 50) * pitchMod, now);
            gain.gain.setValueAtTime(0.1, now);
            gain.gain.exponentialRampToValueAtTime(0.01, now + 0.05);
            osc.start(now);
            osc.stop(now + 0.05);
        } else if (type === 'hit') {
            // Noise burst / low punch
            osc.type = 'square';
            osc.frequency.setValueAtTime(150 * pitchMod, now);
            osc.frequency.exponentialRampToValueAtTime(40, now + 0.1);
            gain.gain.setValueAtTime(0.3, now);
            gain.gain.exponentialRampToValueAtTime(0.01, now + 0.1);
            osc.start(now);
            osc.stop(now + 0.1);
        } else if (type === 'magic') {
            // High pitch sine sweep
            osc.type = 'sine';
            osc.frequency.setValueAtTime(400 * pitchMod, now);
            osc.frequency.linearRampToValueAtTime(800 * pitchMod, now + 0.3);
            gain.gain.setValueAtTime(0.2, now);
            gain.gain.linearRampToValueAtTime(0.01, now + 0.3);
            osc.start(now);
            osc.stop(now + 0.3);
        } else if (type === 'pickup') {
            // Cheerful chime (two tones)
            osc.type = 'sine';
            osc.frequency.setValueAtTime(600 * pitchMod, now);
            gain.gain.setValueAtTime(0.2, now);
            gain.gain.linearRampToValueAtTime(0.01, now + 0.1);
            osc.start(now);
            osc.stop(now + 0.1);

            // Second tone
            const osc2 = this.ctx.createOscillator();
            const gain2 = this.ctx.createGain();
            osc2.connect(gain2);
            gain2.connect(this.masterGain!);
            osc2.type = 'sine';
            osc2.frequency.setValueAtTime(900 * pitchMod, now + 0.1);
            gain2.gain.setValueAtTime(0.2, now + 0.1);
            gain2.gain.linearRampToValueAtTime(0.01, now + 0.2);
            osc2.start(now + 0.1);
            osc2.stop(now + 0.2);
        } else if (type === 'level_up') {
            // Ascending major arpeggio
            const freqs = [440, 554, 659, 880];
            freqs.forEach((f, i) => {
                const o = this.ctx!.createOscillator();
                const g = this.ctx!.createGain();
                o.connect(g);
                g.connect(this.masterGain!);
                o.type = 'triangle';
                o.frequency.setValueAtTime(f, now + i * 0.1);
                g.gain.setValueAtTime(0.2, now + i * 0.1);
                g.gain.linearRampToValueAtTime(0.01, now + i * 0.1 + 0.3);
                o.start(now + i * 0.1);
                o.stop(now + i * 0.1 + 0.3);
            });
        }
    }

    playTheme(themeName: string) {
        if (!this.ctx || this.isMuted) return;
        if (this.currentTheme === themeName) return; // Don't restart if already playing
        this.stopMusic();
        this.currentTheme = themeName;

        const bpm = themeName === 'boss' ? 150 : (themeName === 'cave' ? 90 : 120);
        const noteDuration = 60 / bpm;

        let sequence: any[] = [];

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
        } else if (themeName === 'village') {
            // Happy, Medieval, Flute-like
            // Major Scale (C Major: C, D, E, F, G, A, B)
            sequence = [
                { note: 261.63, type: 'triangle', duration: 0.5 }, // C4
                { note: 293.66, type: 'triangle', duration: 0.5 }, // D4
                { note: 329.63, type: 'triangle', duration: 0.5 }, // E4
                { note: 392.00, type: 'triangle', duration: 0.5 }, // G4
                { note: 329.63, type: 'triangle', duration: 0.5 }, // E4
                { note: 293.66, type: 'triangle', duration: 0.5 }, // D4
                { note: 261.63, type: 'triangle', duration: 1.0 }, // C4
                { note: 0, type: 'rest', duration: 0.5 },
                { note: 392.00, type: 'triangle', duration: 0.5 }, // G4
                { note: 329.63, type: 'triangle', duration: 0.5 }, // E4
                { note: 440.00, type: 'triangle', duration: 0.5 }, // A4
                { note: 392.00, type: 'triangle', duration: 1.0 }, // G4
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
                    gain.connect(this.masterGain!);

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

    playProceduralTheme(level: number) {
        if (!this.ctx || this.isMuted) return;
        const themeId = `level_${level}`;
        if (this.currentTheme === themeId) return;
        this.stopMusic();
        this.currentTheme = themeId;

        // Seeded random
        let seed = level * 123456789 + 54321;
        const random = () => {
            seed = (seed * 1664525 + 1013904223) % 4294967296;
            return seed / 4294967296;
        };

        const bpm = 90 + Math.floor(random() * 40); // 90-130 BPM
        const stepTime = 15 / bpm; // 16th notes
        const length = 32; // 2 bars of 16th notes

        // Enhanced Scale Generation
        const rootFreq = 55 * Math.pow(2, Math.floor(random() * 3)); // A1, A2, or A3 base

        // Scale Types
        const scales: { [key: string]: number[] } = {
            minor: [0, 2, 3, 5, 7, 8, 10, 12],
            phrygian: [0, 1, 3, 5, 7, 8, 10, 12], // Dark, tension
            lydian: [0, 2, 4, 6, 7, 9, 11, 12], // Dreamy, mysterious
            harmonicMinor: [0, 2, 3, 5, 7, 8, 11, 12] // Exotic, boss-like
        };

        const scaleKeys = Object.keys(scales);
        const selectedScale = scales[scaleKeys[Math.floor(random() * scaleKeys.length)]];

        const getNote = (degree: number) => {
            const octave = Math.floor(degree / 7);
            const idx = degree % 7;
            const semi = selectedScale[idx];
            return rootFreq * Math.pow(2, octave + semi / 12);
        };

        const melody: any[] = [];
        const bass: any[] = [];
        const drums: any[] = [];

        // Generate Tracks
        for (let i = 0; i < length; i++) {
            // Melody
            if (random() > 0.4) {
                const degree = Math.floor(random() * 10); // 0-9
                let type = 'triangle';
                if (random() > 0.7) type = 'sine'; // Flute-ish
                if (random() > 0.9) type = 'square'; // Chiptune-ish

                melody.push({
                    note: getNote(degree + 7), // Higher octave
                    type: type,
                    duration: stepTime * (random() > 0.8 ? 2 : 1)
                });
            } else {
                melody.push(null);
            }

            // Bass (Root notes, on beat)
            if (i % 4 === 0 || (i % 4 === 2 && random() > 0.5)) {
                bass.push({
                    note: getNote(0), // Root
                    type: random() > 0.5 ? 'sawtooth' : 'square',
                    duration: stepTime * 2
                });
            } else {
                bass.push(null);
            }

            // Drums (Kick on 1, Snare on 3, Hi-hats)
            let drumType = null;
            if (i % 8 === 0) drumType = 'kick';
            else if (i % 8 === 4) drumType = 'snare';
            else if (random() > 0.3) drumType = 'hat';

            // Occasional fills
            if (i % 16 === 15 && random() > 0.5) drumType = 'snare';

            drums.push(drumType);
        }

        this.startScheduler(melody, bass, drums, stepTime, length);
    }

    playCombatTheme() {
        if (!this.ctx || this.isMuted) return;
        if (this.currentTheme === 'combat') return;
        this.stopMusic();
        this.currentTheme = 'combat';

        const bpm = 150;
        const stepTime = 15 / bpm;
        const length = 16;

        // Phrygian Dominant / Harmonic Minor for tension
        const rootFreq = 55 * 2; // A2
        const scale = [0, 1, 4, 5, 7, 8, 10, 12];
        const getNote = (degree: number) => {
            const octave = Math.floor(degree / 7);
            const idx = degree % 7;
            const semi = scale[idx];
            return rootFreq * Math.pow(2, octave + semi / 12);
        };

        const melody: any[] = [];
        const bass: any[] = [];
        const drums: any[] = [];

        for (let i = 0; i < length; i++) {
            // Fast Arpeggios
            const degree = i % 8;
            melody.push({
                note: getNote(degree + 7),
                type: 'sawtooth',
                duration: stepTime * 0.8
            });

            // Driving Bass
            if (i % 2 === 0) {
                bass.push({
                    note: getNote(0),
                    type: 'sawtooth',
                    duration: stepTime
                });
            } else {
                bass.push(null);
            }

            // Driving Drums
            let drumType = null;
            if (i % 4 === 0) drumType = 'kick';
            if (i % 4 === 2) drumType = 'snare';
            if (i % 2 === 1) drumType = 'hat';
            drums.push(drumType);
        }

        this.startScheduler(melody, bass, drums, stepTime, length);
    }

    startScheduler(melody: any[], bass: any[], drums: any[], stepTime: number, length: number) {
        let stepIndex = 0;
        let nextStepTime = this.ctx!.currentTime;

        const scheduler = () => {
            if (!this.ctx) return;

            while (nextStepTime < this.ctx.currentTime + 0.1) {
                const idx = stepIndex % length;

                // Play Melody
                const m = melody[idx];
                if (m) {
                    const osc = this.ctx.createOscillator();
                    const gain = this.ctx.createGain();
                    osc.type = m.type;
                    osc.frequency.setValueAtTime(m.note, nextStepTime);
                    gain.gain.setValueAtTime(0.05, nextStepTime);
                    gain.gain.exponentialRampToValueAtTime(0.001, nextStepTime + m.duration);
                    osc.connect(gain);
                    gain.connect(this.masterGain!);
                    osc.start(nextStepTime);
                    osc.stop(nextStepTime + m.duration);
                }

                // Play Bass
                const b = bass[idx];
                if (b) {
                    const osc = this.ctx.createOscillator();
                    const gain = this.ctx.createGain();
                    osc.type = b.type;
                    osc.frequency.setValueAtTime(b.note, nextStepTime);
                    gain.gain.setValueAtTime(0.1, nextStepTime);
                    gain.gain.linearRampToValueAtTime(0.001, nextStepTime + b.duration);
                    osc.connect(gain);
                    gain.connect(this.masterGain!);
                    osc.start(nextStepTime);
                    osc.stop(nextStepTime + b.duration);
                }

                // Play Drums
                const d = drums[idx];
                if (d) {
                    const osc = this.ctx.createOscillator();
                    const gain = this.ctx.createGain();
                    osc.connect(gain);
                    gain.connect(this.masterGain!);

                    if (d === 'kick') {
                        osc.frequency.setValueAtTime(150, nextStepTime);
                        osc.frequency.exponentialRampToValueAtTime(0.01, nextStepTime + 0.5);
                        gain.gain.setValueAtTime(0.4, nextStepTime);
                        gain.gain.exponentialRampToValueAtTime(0.001, nextStepTime + 0.5);
                        osc.start(nextStepTime);
                        osc.stop(nextStepTime + 0.5);
                    } else if (d === 'snare') {
                        osc.type = 'square';
                        osc.frequency.setValueAtTime(200, nextStepTime);
                        osc.frequency.linearRampToValueAtTime(100, nextStepTime + 0.1);
                        gain.gain.setValueAtTime(0.2, nextStepTime);
                        gain.gain.exponentialRampToValueAtTime(0.001, nextStepTime + 0.1);
                        osc.start(nextStepTime);
                        osc.stop(nextStepTime + 0.1);
                    } else if (d === 'hat') {
                        osc.type = 'square';
                        osc.frequency.setValueAtTime(8000, nextStepTime); // High hat
                        gain.gain.setValueAtTime(0.05, nextStepTime);
                        gain.gain.exponentialRampToValueAtTime(0.001, nextStepTime + 0.05);
                        osc.start(nextStepTime);
                        osc.stop(nextStepTime + 0.05);
                    }
                }

                nextStepTime += stepTime;
                stepIndex++;
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
