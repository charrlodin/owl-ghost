import { useCallback, useEffect, useRef } from "react";

export const useGhostSound = () => {
    const audioContextRef = useRef<AudioContext | null>(null);

    useEffect(() => {
        // Initialize AudioContext on first user interaction (browser policy)
        const initAudio = () => {
            if (!audioContextRef.current) {
                audioContextRef.current = new (window.AudioContext || (window as any).webkitAudioContext)();
            }
            if (audioContextRef.current.state === "suspended") {
                audioContextRef.current.resume();
            }
        };

        window.addEventListener("click", initAudio);
        window.addEventListener("keydown", initAudio);

        return () => {
            window.removeEventListener("click", initAudio);
            window.removeEventListener("keydown", initAudio);
        };
    }, []);

    const playOscillator = useCallback((
        type: OscillatorType,
        freqStart: number,
        freqEnd: number,
        duration: number,
        gainStart: number = 0.1,
        gainEnd: number = 0
    ) => {
        if (!audioContextRef.current) return;
        const ctx = audioContextRef.current;

        const osc = ctx.createOscillator();
        const gain = ctx.createGain();

        osc.type = type;
        osc.frequency.setValueAtTime(freqStart, ctx.currentTime);
        osc.frequency.exponentialRampToValueAtTime(freqEnd, ctx.currentTime + duration);

        gain.gain.setValueAtTime(gainStart, ctx.currentTime);
        gain.gain.exponentialRampToValueAtTime(gainEnd || 0.001, ctx.currentTime + duration);

        osc.connect(gain);
        gain.connect(ctx.destination);

        osc.start();
        osc.stop(ctx.currentTime + duration);
    }, []);

    const playHover = useCallback(() => {
        // High-pitch "radar blip"
        playOscillator("sine", 800, 1200, 0.05, 0.02, 0.001);
    }, [playOscillator]);

    const playClick = useCallback(() => {
        // Low-pitch "thud"
        playOscillator("triangle", 150, 50, 0.1, 0.1, 0.001);
    }, [playOscillator]);

    const playSuccess = useCallback(() => {
        // Ethereal Major Chord Swell (C Major: C, E, G)
        const duration = 1.5;
        const now = audioContextRef.current?.currentTime || 0;

        [261.63, 329.63, 392.00, 523.25].forEach((freq, i) => {
            setTimeout(() => {
                playOscillator("sine", freq, freq, duration, 0.05, 0.001);
            }, i * 50); // Staggered entry
        });
    }, [playOscillator]);

    const playError = useCallback(() => {
        // Dissonant low drone
        playOscillator("sawtooth", 100, 80, 0.4, 0.05, 0.001);
        playOscillator("sawtooth", 105, 85, 0.4, 0.05, 0.001); // Dissonance
    }, [playOscillator]);

    return { playHover, playClick, playSuccess, playError };
};
