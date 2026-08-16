import React, { useEffect, useRef } from 'react';

export const BackgroundWaves: React.FC<{ opacity?: number }> = ({ opacity = 0.85 }) => {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d', { alpha: true });
    if (!ctx) return;

    let animationFrameId: number;
    let width = (canvas.width = window.innerWidth);
    let height = (canvas.height = window.innerHeight);

    const handleResize = () => {
      if (!canvas) return;
      width = canvas.width = window.innerWidth;
      height = canvas.height = window.innerHeight;
    };

    window.addEventListener('resize', handleResize);

    let step = 0;

    // Robotic Cyber Oscilloscope Harmonic Waves
    const waves = [
      {
        frequency: 0.0022,
        amplitude: 65,
        speed: 0.012,
        color: 'rgba(6, 182, 212, 0.25)', // Cyber Cyan Beam
        fillColor: 'rgba(6, 182, 212, 0.03)',
        lineWidth: 1.8,
        baseY: 0.4,
        dots: true,
      },
      {
        frequency: 0.0016,
        amplitude: 85,
        speed: 0.008,
        color: 'rgba(16, 185, 129, 0.28)', // Robotic Emerald Pulse
        fillColor: 'rgba(16, 185, 129, 0.035)',
        lineWidth: 2.0,
        baseY: 0.6,
        dots: true,
      },
      {
        frequency: 0.0012,
        amplitude: 110,
        speed: 0.005,
        color: 'rgba(139, 92, 246, 0.22)', // Deep AI Purple Wave
        fillColor: 'rgba(139, 92, 246, 0.025)',
        lineWidth: 1.5,
        baseY: 0.8,
        dots: false,
      },
    ];

    // Cyber Robotic Grid Matrix Dots
    const gridSpacing = 48;

    const render = () => {
      if (document.hidden) {
        animationFrameId = requestAnimationFrame(render);
        return;
      }

      ctx.clearRect(0, 0, width, height);

      // 1. Futuristic Dark Blue & Deep Obsidian Background Gradient
      const bgGrad = ctx.createLinearGradient(0, 0, width, height);
      bgGrad.addColorStop(0, '#050811'); // Deepest Space Black
      bgGrad.addColorStop(0.4, '#070D1E'); // Dark Tech Navy Blue
      bgGrad.addColorStop(0.8, '#0B132B'); // Cyber Obsidian Blue
      bgGrad.addColorStop(1, '#05070E');
      ctx.fillStyle = bgGrad;
      ctx.fillRect(0, 0, width, height);

      // 2. Ambient Cyber Core Glows
      const glowCyan = ctx.createRadialGradient(
        width * 0.15,
        height * 0.2,
        0,
        width * 0.15,
        height * 0.2,
        width * 0.45
      );
      glowCyan.addColorStop(0, 'rgba(6, 182, 212, 0.07)');
      glowCyan.addColorStop(1, 'transparent');
      ctx.fillStyle = glowCyan;
      ctx.fillRect(0, 0, width, height);

      const glowEmerald = ctx.createRadialGradient(
        width * 0.85,
        height * 0.65,
        0,
        width * 0.85,
        height * 0.65,
        width * 0.5
      );
      glowEmerald.addColorStop(0, 'rgba(16, 185, 129, 0.06)');
      glowEmerald.addColorStop(1, 'transparent');
      ctx.fillStyle = glowEmerald;
      ctx.fillRect(0, 0, width, height);

      // 3. Robotic Digital Grid Matrix
      ctx.fillStyle = 'rgba(255, 255, 255, 0.04)';
      for (let x = (step * 0.2) % gridSpacing; x < width; x += gridSpacing) {
        for (let y = 0; y < height; y += gridSpacing) {
          ctx.beginPath();
          ctx.arc(x, y, 0.75, 0, Math.PI * 2);
          ctx.fill();
        }
      }

      step += 1;

      // 4. Robotic Sine-Frequency Wave Beams
      waves.forEach((wave, wIdx) => {
        const startY = height * wave.baseY;
        const points: { x: number; y: number }[] = [];

        for (let x = 0; x <= width + 20; x += 12) {
          const y =
            startY +
            Math.sin(x * wave.frequency + step * wave.speed) * wave.amplitude +
            Math.cos(x * wave.frequency * 0.75 - step * wave.speed * 0.6) * (wave.amplitude * 0.35);
          points.push({ x, y });
        }

        // Draw translucent glow fill under wave
        ctx.beginPath();
        ctx.fillStyle = wave.fillColor;
        ctx.moveTo(0, height);
        points.forEach((pt, i) => {
          if (i === 0) ctx.lineTo(pt.x, pt.y);
          else ctx.lineTo(pt.x, pt.y);
        });
        ctx.lineTo(width, height);
        ctx.closePath();
        ctx.fill();

        // Draw glowing laser wave line
        ctx.beginPath();
        ctx.strokeStyle = wave.color;
        ctx.lineWidth = wave.lineWidth;
        ctx.shadowColor = wave.color;
        ctx.shadowBlur = 8;

        points.forEach((pt, i) => {
          if (i === 0) ctx.moveTo(pt.x, pt.y);
          else ctx.lineTo(pt.x, pt.y);
        });
        ctx.stroke();
        ctx.shadowBlur = 0; // reset shadow

        // 5. Robotic Telemetry Pulse Nodes along the wave
        if (wave.dots) {
          for (let i = 0; i < points.length; i += 18) {
            const pt = points[i];
            if (!pt) continue;

            const pulse = (Math.sin(step * 0.05 + i + wIdx) + 1) / 2;

            ctx.beginPath();
            ctx.fillStyle = 'rgba(255, 255, 255, 0.85)';
            ctx.arc(pt.x, pt.y, 1.8 + pulse * 1.5, 0, Math.PI * 2);
            ctx.fill();

            // Outer pulse ring
            ctx.beginPath();
            ctx.strokeStyle = wave.color;
            ctx.lineWidth = 1;
            ctx.arc(pt.x, pt.y, 4 + pulse * 4, 0, Math.PI * 2);
            ctx.stroke();
          }
        }
      });

      animationFrameId = requestAnimationFrame(render);
    };

    render();

    return () => {
      window.removeEventListener('resize', handleResize);
      cancelAnimationFrame(animationFrameId);
    };
  }, []);

  return (
    <canvas
      ref={canvasRef}
      style={{ opacity }}
      className="fixed inset-0 pointer-events-none -z-10 transition-opacity duration-700 select-none"
    />
  );
};
