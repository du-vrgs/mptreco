'use client';

import React, { useEffect, useRef } from 'react';
import { usePlayer } from '@/features/player/context/PlayerContext';
import { PlaybackState } from '@/shared/types';

export const SpectrumVisualizer: React.FC = () => {
  const { analyserNode, playbackState } = usePlayer();
  const canvasRef = useRef<HTMLCanvasElement | null>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    let animationFrameId: number;
    const bufferLength = analyserNode ? analyserNode.frequencyBinCount : 32;
    const dataArray = new Uint8Array(bufferLength);

    const render = () => {
      animationFrameId = requestAnimationFrame(render);

      const width = canvas.width;
      const height = canvas.height;

      ctx.clearRect(0, 0, width, height);

      // Fundo preto translúcido retrô
      ctx.fillStyle = 'rgba(10, 15, 25, 0.85)';
      ctx.fillRect(0, 0, width, height);

      if (analyserNode && playbackState === PlaybackState.PLAYING) {
        analyserNode.getByteFrequencyData(dataArray);
      } else {
        // Modo Idle: pequenas ondas simuladas anos 2000
        for (let i = 0; i < bufferLength; i++) {
          dataArray[i] = Math.max(0, Math.sin(Date.now() / 300 + i * 0.2) * 20 + 25);
        }
      }

      const barWidth = (width / (bufferLength / 1.5)) - 2;
      let x = 2;

      for (let i = 0; i < bufferLength / 1.5; i++) {
        const barHeight = (dataArray[i] / 255) * height * 0.9;

        // Gradiente WMP / Winamp: Verde -> Amarelo -> Vermelho neon
        const gradient = ctx.createLinearGradient(0, height, 0, 0);
        gradient.addColorStop(0, '#00ff88');
        gradient.addColorStop(0.6, '#00d0ff');
        gradient.addColorStop(0.85, '#ffbb00');
        gradient.addColorStop(1, '#ff3366');

        ctx.fillStyle = gradient;
        ctx.fillRect(x, height - barHeight, barWidth, barHeight);

        // Barra de pico superior retrô (Peak Hold)
        ctx.fillStyle = '#ffffff';
        ctx.fillRect(x, Math.max(0, height - barHeight - 2), barWidth, 1.5);

        x += barWidth + 2;
      }
    };

    render();

    return () => {
      cancelAnimationFrame(animationFrameId);
    };
  }, [analyserNode, playbackState]);

  return (
    <div className="relative w-full h-24 rounded-lg overflow-hidden border border-cyan-500/30 shadow-[0_0_15px_rgba(0,229,255,0.2)] bg-black/80 flex items-center justify-center">
      <canvas
        ref={canvasRef}
        width={360}
        height={96}
        className="w-full h-full object-cover"
      />
      <div className="absolute top-1 left-2 text-[10px] tracking-widest font-mono text-cyan-400/70 select-none">
        SPECTRUM AUDIO ANALYZER 2.0
      </div>
    </div>
  );
};
