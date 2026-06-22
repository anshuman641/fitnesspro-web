import { useRef, useCallback, useEffect } from 'react';

function createOscillatorLoop(
  ctx: AudioContext,
  freq: number,
  type: OscillatorType,
  gainValue: number,
): { gain: GainNode; start: () => void; stop: () => void } {
  const gain = ctx.createGain();
  gain.gain.value = 0;
  gain.connect(ctx.destination);

  let osc: OscillatorNode | null = null;

  return {
    gain,
    start() {
      if (osc) return;
      osc = ctx.createOscillator();
      osc.type = type;
      osc.frequency.value = freq;
      osc.connect(gain);
      osc.start();
      gain.gain.setTargetAtTime(gainValue, ctx.currentTime, 0.1);
    },
    stop() {
      gain.gain.setTargetAtTime(0, ctx.currentTime, 0.1);
      if (osc) {
        const o = osc;
        osc = null;
        setTimeout(() => { try { o.stop(); o.disconnect(); } catch {} }, 200);
      }
    },
  };
}

export function useWorkoutAudio() {
  const ctxRef = useRef<AudioContext | null>(null);
  const workRef = useRef<ReturnType<typeof createOscillatorLoop> | null>(null);
  const restRef = useRef<ReturnType<typeof createOscillatorLoop> | null>(null);

  const ensureCtx = useCallback(() => {
    if (!ctxRef.current) {
      ctxRef.current = new AudioContext();
    }
    if (ctxRef.current.state === 'suspended') {
      ctxRef.current.resume();
    }
    if (!workRef.current) {
      workRef.current = createOscillatorLoop(ctxRef.current, 220, 'square', 0.07);
    }
    if (!restRef.current) {
      restRef.current = createOscillatorLoop(ctxRef.current, 261.63, 'sine', 0.05);
    }
  }, []);

  const playWork = useCallback(() => {
    ensureCtx();
    restRef.current?.stop();
    workRef.current?.start();
  }, [ensureCtx]);

  const playRest = useCallback(() => {
    ensureCtx();
    workRef.current?.stop();
    restRef.current?.start();
  }, [ensureCtx]);

  const stopAll = useCallback(() => {
    workRef.current?.stop();
    restRef.current?.stop();
  }, []);

  useEffect(() => {
    return () => {
      stopAll();
      if (ctxRef.current) {
        ctxRef.current.close();
        ctxRef.current = null;
      }
    };
  }, [stopAll]);

  return { playWork, playRest, stopAll };
}
