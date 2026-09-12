import React, { useEffect, useRef } from 'react';
import { audioEngine } from '../services/audioEngine';

interface VisualizerCanvasProps {
  isPlaying: boolean;
  type?: 'bars' | 'wave' | 'circle' | 'minimal-bars';
  color?: string;
  className?: string;
  barCount?: number;
}

export const VisualizerCanvas: React.FC<VisualizerCanvasProps> = ({
  isPlaying,
  type = 'bars',
  color = '#f59e0b',
  className = 'w-full h-full',
  barCount = 30,
}) => {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const animationFrameRef = useRef<number | null>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const dataArray = new Uint8Array(128);
    // Smooth lerping buffer for natural analog bounce
    const smoothedHeights = new Float32Array(barCount);

    const render = () => {
      // Fetch frequency data passing current playback status
      audioEngine.getFrequencyData(dataArray, isPlaying);

      // Verify whether we have signal or need on-the-fly synthesis
      let hasSignal = false;
      const checkLimit = Math.min(dataArray.length, 24);
      for (let i = 0; i < checkLimit; i++) {
        if (dataArray[i] > 10) {
          hasSignal = true;
          break;
        }
      }

      // If playing but no signal (e.g. native Android hardware playback), synthesize dynamic bars directly
      if (isPlaying && !hasSignal) {
        const t = performance.now() / 1000;
        const beatPhase = (t * 2.1) % 1;
        const kick = Math.max(0, 1 - beatPhase * 3.5);
        for (let i = 0; i < dataArray.length; i++) {
          const norm = i / dataArray.length;
          let val = 0;
          if (norm < 0.25) {
            val = 75 + kick * 155 + Math.sin(t * 3.5) * 25;
          } else if (norm < 0.65) {
            val = 65 + Math.sin(t * 6.2 + i * 0.5) * 45 + kick * 35;
          } else {
            val = (55 + Math.sin(t * 12.5 + i * 0.9) * 35) * Math.max(0.2, 1 - (norm - 0.65) * 2);
          }
          dataArray[i] = Math.max(12, Math.min(255, Math.floor(val)));
        }
      }

      const width = canvas.width;
      const height = canvas.height;
      ctx.clearRect(0, 0, width, height);

      if (type === 'minimal-bars') {
        const bars = 16;
        const barWidth = width / bars - 3;
        for (let i = 0; i < bars; i++) {
          const raw = dataArray[i * 2] || 0;
          const targetH = isPlaying ? Math.max(4, (raw / 255) * height * 0.9) : 4;
          const x = i * (barWidth + 3);
          const y = height - targetH;

          ctx.fillStyle = color;
          ctx.beginPath();
          ctx.roundRect(x, y, barWidth, targetH, [3, 3, 0, 0]);
          ctx.fill();
        }
      } else if (type === 'wave') {
        ctx.beginPath();
        ctx.lineWidth = 3.5;
        ctx.strokeStyle = color;
        ctx.shadowColor = color;
        ctx.shadowBlur = 10;
        const sliceWidth = width / 48;
        let x = 0;

        for (let i = 0; i < 48; i++) {
          const raw = dataArray[i * 2] || 128;
          const v = isPlaying ? (raw / 255.0) : 0.5;
          const y = height * (1 - v * 0.85);

          if (i === 0) {
            ctx.moveTo(x, y);
          } else {
            ctx.lineTo(x, y);
          }
          x += sliceWidth;
        }
        ctx.stroke();
        ctx.shadowBlur = 0; // Reset
      } else if (type === 'circle') {
        const centerX = width / 2;
        const centerY = height / 2;
        const radius = Math.min(centerX, centerY) * 0.55;
        const totalPoints = 48;

        ctx.strokeStyle = color;
        ctx.lineWidth = 2.5;
        ctx.beginPath();

        for (let i = 0; i < totalPoints; i++) {
          const angle = (i * 2 * Math.PI) / totalPoints;
          const freq = isPlaying ? dataArray[i % 32] / 255 : 0.05;
          const r = radius + freq * 30;
          const x = centerX + r * Math.cos(angle);
          const y = centerY + r * Math.sin(angle);

          if (i === 0) {
            ctx.moveTo(x, y);
          } else {
            ctx.lineTo(x, y);
          }
        }
        ctx.closePath();
        ctx.stroke();
      } else {
        // High-definition animated Equalizer Bars
        const count = Math.min(barCount, 36);
        const step = Math.floor(dataArray.length / count) || 1;
        const gap = 3;
        const barW = Math.max(3, (width - (count - 1) * gap) / count);

        for (let i = 0; i < count; i++) {
          const raw = dataArray[i * step] || 0;
          const targetH = isPlaying ? Math.max(5, (raw / 255) * height * 0.95) : 4;

          // Natural peak-hold spring physics: rise fast, decay smoothly
          if (targetH > smoothedHeights[i]) {
            smoothedHeights[i] = smoothedHeights[i] + (targetH - smoothedHeights[i]) * 0.55;
          } else {
            smoothedHeights[i] = smoothedHeights[i] + (targetH - smoothedHeights[i]) * 0.18;
          }

          const currentBarH = Math.max(3, Math.min(height, smoothedHeights[i]));
          const x = i * (barW + gap);
          const y = height - currentBarH;

          // Glowing multi-stop gradient for premium aesthetic
          const gradient = ctx.createLinearGradient(0, height, 0, y);
          gradient.addColorStop(0, color);
          gradient.addColorStop(0.7, '#fcd34d'); // Amber gold
          gradient.addColorStop(1, '#ffffff'); // White cap

          ctx.fillStyle = gradient;
          ctx.beginPath();
          ctx.roundRect(x, y, barW, currentBarH, [4, 4, 0, 0]);
          ctx.fill();
        }
      }

      animationFrameRef.current = requestAnimationFrame(render);
    };

    render();

    return () => {
      if (animationFrameRef.current) {
        cancelAnimationFrame(animationFrameRef.current);
      }
    };
  }, [isPlaying, type, color, barCount]);

  return (
    <canvas
      ref={canvasRef}
      width={500}
      height={130}
      className={`block w-full h-full ${className}`}
    />
  );
};
