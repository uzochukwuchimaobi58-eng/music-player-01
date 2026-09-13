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
    // Smooth lerping buffer for natural analog bounce
    const smoothedHeights = new Float32Array(barCount);
    // Floating peak indicators that hold and drop with gravity
    const peakHeights = new Float32Array(barCount);
    const peakHoldTimers = new Uint8Array(barCount);

    const render = () => {
      // 1. Dynamic Canvas Auto-sizing to Match Display Size & High-DPI Screens
      const dpr = Math.min(window.devicePixelRatio || 1, 2);
      const displayW = canvas.clientWidth || 360;
      const displayH = canvas.clientHeight || 70;
      const targetW = Math.floor(displayW * dpr);
      const targetH = Math.floor(displayH * dpr);

      if (canvas.width !== targetW || canvas.height !== targetH) {
        canvas.width = targetW;
        canvas.height = targetH;
      }

      ctx.save();
      ctx.scale(dpr, dpr);
      const width = displayW;
      const height = displayH;

      ctx.clearRect(0, 0, width, height);

      // Fetch frequency data
      audioEngine.getFrequencyData(dataArray, isPlaying);

      // Fallback synthesis if audio is playing but analyser is silent (Android hardware playback)
      let hasSignal = false;
      const checkLimit = Math.min(dataArray.length, 24);
      for (let i = 0; i < checkLimit; i++) {
        if (dataArray[i] > 15) {
          hasSignal = true;
          break;
        }
      }

      if (isPlaying && !hasSignal) {
        const t = performance.now() / 1000;
        const beatTime = t * 2.15; // ~129 BPM pulse
        const beatPhase = beatTime % 1;
        const kickEnvelope = Math.pow(Math.max(0, 1 - beatPhase * 2.5), 1.8);
        const subBassGlide = Math.sin(t * 3.8) * 35;
        const snarePhase = (beatTime + 0.5) % 1;
        const snareEnvelope = Math.max(0, 1 - snarePhase * 3.0);
        const hihatPhase = (beatTime * 4) % 1;
        const hihatEnvelope = Math.max(0, 1 - hihatPhase * 3.8);

        for (let i = 0; i < dataArray.length; i++) {
          const norm = i / dataArray.length;
          let val = 0;
          if (norm < 0.28) {
            val = 95 + kickEnvelope * 150 * (1 - norm * 2.5) + subBassGlide + Math.sin(t * 5.4 + i * 0.4) * 25;
          } else if (norm < 0.65) {
            val = 80 + Math.sin(t * 6.5 + i * 0.6) * 35 + snareEnvelope * 105 + kickEnvelope * 50;
          } else {
            val = 75 + hihatEnvelope * 85 + snareEnvelope * 45 + Math.sin(t * 15.2 + i * 1.1) * 25;
          }
          dataArray[i] = Math.max(30, Math.min(255, Math.floor(val)));
        }
      }

      if (type === 'minimal-bars') {
        const bars = 16;
        const gap = 3;
        const barWidth = Math.max(3, (width - (bars - 1) * gap) / bars);

        for (let i = 0; i < bars; i++) {
          const raw = isPlaying ? (dataArray[i * 2] || 0) : 0;
          const targetBarH = isPlaying ? Math.max(6, (raw / 255) * height * 0.92) : 3;

          if (targetBarH > smoothedHeights[i]) {
            smoothedHeights[i] += (targetBarH - smoothedHeights[i]) * 0.55;
          } else {
            smoothedHeights[i] += (targetBarH - smoothedHeights[i]) * 0.18;
          }

          const currentBarH = Math.max(3, Math.min(height, smoothedHeights[i]));
          const x = i * (barWidth + gap);
          const y = height - currentBarH;

          ctx.fillStyle = color;
          ctx.beginPath();
          ctx.roundRect(x, y, barWidth, currentBarH, [3, 3, 0, 0]);
          ctx.fill();
        }
      } else if (type === 'wave') {
        ctx.beginPath();
        ctx.lineWidth = 3;
        ctx.strokeStyle = color;
        ctx.shadowColor = color;
        ctx.shadowBlur = 8;
        const points = 48;
        const sliceWidth = width / (points - 1);

        for (let i = 0; i < points; i++) {
          const raw = isPlaying ? (dataArray[i * 2] || 128) : 128;
          const v = isPlaying ? raw / 255.0 : 0.5;
          const y = height * (1 - v * 0.88);
          const x = i * sliceWidth;

          if (i === 0) {
            ctx.moveTo(x, y);
          } else {
            ctx.lineTo(x, y);
          }
        }
        ctx.stroke();
        ctx.shadowBlur = 0;
      } else if (type === 'circle') {
        const centerX = width / 2;
        const centerY = height / 2;
        const radius = Math.min(centerX, centerY) * 0.65;
        const totalPoints = 48;

        ctx.strokeStyle = color;
        ctx.lineWidth = 2.5;
        ctx.beginPath();

        for (let i = 0; i < totalPoints; i++) {
          const angle = (i * 2 * Math.PI) / totalPoints;
          const raw = isPlaying ? (dataArray[i % 32] || 0) : 15;
          const freq = (raw / 255) * 35;
          const r = radius + freq;
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
        // High-definition animated Equalizer Bars with Bass Thump & Peak Caps
        const count = Math.min(barCount, 36);
        const step = Math.floor(dataArray.length / count) || 1;
        const gap = 3;
        const barW = Math.max(3, (width - (count - 1) * gap) / count);

        for (let i = 0; i < count; i++) {
          const raw = isPlaying ? (dataArray[i * step] || 0) : 0;
          const normIdx = i / count;

          // Bass boost for low-frequency bars (first 25% of visualizer)
          const bassMultiplier = normIdx < 0.28 ? 1.25 : 1.0;
          const normalizedVal = Math.min(1.0, (raw / 255) * bassMultiplier);

          // Exponential curve gives punchy, energetic response to drums & bass
          const boostedCurve = isPlaying ? Math.pow(normalizedVal, 0.82) : 0.04;
          const targetH = isPlaying ? Math.max(6, boostedCurve * height * 0.94) : 3;

          // Spring physics: instant rise on kick/snare, smooth analog decay
          if (targetH > smoothedHeights[i]) {
            smoothedHeights[i] += (targetH - smoothedHeights[i]) * 0.65;
          } else {
            smoothedHeights[i] += (targetH - smoothedHeights[i]) * 0.16;
          }

          const currentBarH = Math.max(3, Math.min(height, smoothedHeights[i]));
          const x = i * (barW + gap);
          const y = height - currentBarH;

          // Floating peak cap physics
          if (currentBarH > peakHeights[i]) {
            peakHeights[i] = currentBarH;
            peakHoldTimers[i] = 12; // hold peak for 12 frames
          } else {
            if (peakHoldTimers[i] > 0) {
              peakHoldTimers[i]--;
            } else {
              peakHeights[i] = Math.max(3, peakHeights[i] - 1.5);
            }
          }

          // Luminous gradient: Accent color base -> Vibrant warm yellow -> Brilliant white tip
          const gradient = ctx.createLinearGradient(0, height, 0, y);
          gradient.addColorStop(0, color);
          gradient.addColorStop(0.55, '#f59e0b');
          gradient.addColorStop(0.85, '#fde047');
          gradient.addColorStop(1, '#ffffff');

          ctx.fillStyle = gradient;
          ctx.beginPath();
          ctx.roundRect(x, y, barW, currentBarH, [4, 4, 0, 0]);
          ctx.fill();

          // Draw studio-grade floating peak cap
          if (isPlaying && peakHeights[i] > 8) {
            const peakY = height - peakHeights[i] - 2.5;
            ctx.fillStyle = '#ffffff';
            ctx.shadowColor = '#fde047';
            ctx.shadowBlur = 4;
            ctx.fillRect(x, Math.max(0, peakY), barW, 2);
            ctx.shadowBlur = 0;
          }
        }
      }

      ctx.restore();
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
      className={`block w-full h-full ${className}`}
    />
  );
};
