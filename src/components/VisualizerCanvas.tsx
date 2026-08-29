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
  barCount = 32,
}) => {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const animationFrameRef = useRef<number | null>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const dataArray = new Uint8Array(128);

    const render = () => {
      audioEngine.getFrequencyData(dataArray);

      // Handle high-DPI
      const width = canvas.width;
      const height = canvas.height;
      ctx.clearRect(0, 0, width, height);

      if (type === 'minimal-bars') {
        const bars = 16;
        const barWidth = width / bars - 2;
        for (let i = 0; i < bars; i++) {
          const raw = dataArray[i * 2] || 0;
          const val = isPlaying ? (raw / 255) * height * 0.85 : 4;
          const x = i * (barWidth + 2);
          const y = height - Math.max(3, val);

          ctx.fillStyle = color;
          ctx.beginPath();
          ctx.roundRect(x, y, barWidth, Math.max(3, val), 2);
          ctx.fill();
        }
      } else if (type === 'wave') {
        ctx.beginPath();
        ctx.lineWidth = 2.5;
        ctx.strokeStyle = color;
        const sliceWidth = width / 64;
        let x = 0;

        for (let i = 0; i < 64; i++) {
          const v = isPlaying ? (dataArray[i] / 128.0) : 1;
          const y = (v * height) / 2;

          if (i === 0) {
            ctx.moveTo(x, y);
          } else {
            ctx.lineTo(x, y);
          }
          x += sliceWidth;
        }
        ctx.lineTo(width, height / 2);
        ctx.stroke();
      } else if (type === 'circle') {
        const centerX = width / 2;
        const centerY = height / 2;
        const radius = Math.min(centerX, centerY) * 0.55;
        const totalPoints = 48;

        ctx.strokeStyle = color;
        ctx.lineWidth = 2;
        ctx.beginPath();

        for (let i = 0; i < totalPoints; i++) {
          const angle = (i * 2 * Math.PI) / totalPoints;
          const freq = isPlaying ? dataArray[i % 32] / 255 : 0.05;
          const r = radius + freq * 25;
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
        // Full frequency spectrum bars
        const count = barCount;
        const step = Math.floor(dataArray.length / count) || 1;
        const barW = Math.max(2, (width / count) - 2);

        for (let i = 0; i < count; i++) {
          const raw = dataArray[i * step] || 0;
          const barH = isPlaying ? Math.max(4, (raw / 255) * height * 0.95) : 4;
          const x = i * (barW + 2);
          const y = height - barH;

          // Gradient
          const gradient = ctx.createLinearGradient(0, height, 0, 0);
          gradient.addColorStop(0, color);
          gradient.addColorStop(1, '#ffffff');

          ctx.fillStyle = gradient;
          ctx.beginPath();
          ctx.roundRect(x, y, barW, barH, [3, 3, 0, 0]);
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
      width={360}
      height={100}
      className={`block ${className}`}
    />
  );
};
