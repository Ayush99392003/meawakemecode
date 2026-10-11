'use client';

import * as React from 'react';

/* ─────────────────────────────────────────────────────────────────
   LiveBackground
   • Canvas fills viewport exactly — scales via ResizeObserver
   • Particle count, speed & link distance adapt to viewport area/diagonal
   • Reads CSS --accent variable for colours → theme-aware
   • intensity prop: 0=off  0.5=subtle  1=full (default)
   • Respects prefers-reduced-motion (pauses movement)
   ───────────────────────────────────────────────────────────────── */

interface Particle {
  x: number;
  y: number;
  vx: number;
  vy: number;
  radius: number;
  baseOpacity: number;
  pulsePhase: number;
  pulseSpeed: number;
  kind: 'node' | 'dot';
}

function resolveAccent(alpha: number): string {
  const safeAlpha = Math.max(0, Math.min(1, Number(alpha.toFixed(3))));
  if (typeof window === 'undefined') return `rgba(99, 102, 241, ${safeAlpha})`;
  const raw = getComputedStyle(document.documentElement)
    .getPropertyValue('--accent')
    .trim();
  if (!raw) return `rgba(99, 102, 241, ${safeAlpha})`;
  const formatted = raw.split(/\s+/).filter(Boolean).join(', ');
  return `rgba(${formatted}, ${safeAlpha})`;
}

function buildParticles(w: number, h: number, intensity: number): Particle[] {
  const area = w * h;
  // 1 particle per 15 000px², scaled by intensity, capped 20–250
  const count = Math.min(250, Math.max(20, Math.round((area / 15_000) * intensity)));

  return Array.from({ length: count }, (_, i) => {
    const kind = i < count * 0.14 ? 'node' : 'dot';
    // Speed inversely proportional to screen density: fast on small screens, slower on large
    const baseDiag = Math.sqrt(w * w + h * h);
    const speedScale = 480 / Math.max(480, baseDiag);
    const speed = (0.12 + Math.random() * 0.28) * speedScale * intensity;
    const angle = Math.random() * Math.PI * 2;
    return {
      x: Math.random() * w,
      y: Math.random() * h,
      vx: Math.cos(angle) * speed,
      vy: Math.sin(angle) * speed,
      radius: kind === 'node' ? 2 + Math.random() * 1.8 : 0.8 + Math.random() * 1.1,
      baseOpacity: kind === 'node' ? 0.5 + Math.random() * 0.4 : 0.15 + Math.random() * 0.3,
      pulsePhase: Math.random() * Math.PI * 2,
      pulseSpeed: 0.006 + Math.random() * 0.012,
      kind,
    };
  });
}

/* ── Props ── */
interface LiveBackgroundProps {
  /** 0 = hidden, 0.5 = subtle, 1 = full (default) */
  intensity?: number;
}

export function LiveBackground({ intensity = 1 }: LiveBackgroundProps) {
  const canvasRef = React.useRef<HTMLCanvasElement>(null);
  const rafRef = React.useRef<number>(0);
  const particlesRef = React.useRef<Particle[]>([]);
  const sizeRef = React.useRef({ w: 0, h: 0 });
  const prevTsRef = React.useRef<number>(0);
  const reducedRef = React.useRef(false);
  const intensityRef = React.useRef(intensity);

  // Keep intensity ref in sync without restarting loop
  React.useEffect(() => {
    intensityRef.current = intensity;
  }, [intensity]);

  React.useEffect(() => {
    reducedRef.current =
      typeof window !== 'undefined' &&
      window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  }, []);

  /* ── Resize: set canvas dimensions & rebuild particles ── */
  React.useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const applySize = () => {
      const w = window.innerWidth;
      const h = window.innerHeight;
      const dpr = Math.min(window.devicePixelRatio || 1, 2); // cap at 2× for performance
      canvas.width = Math.round(w * dpr);
      canvas.height = Math.round(h * dpr);
      canvas.style.width = `${w}px`;
      canvas.style.height = `${h}px`;
      const ctx = canvas.getContext('2d');
      if (ctx) {
        ctx.resetTransform();
        ctx.scale(dpr, dpr);
      }
      sizeRef.current = { w, h };
      particlesRef.current = buildParticles(w, h, intensityRef.current);
    };

    applySize();

    const ro = new ResizeObserver(applySize);
    ro.observe(document.documentElement);
    return () => ro.disconnect();
  }, []); // only run once; intensity changes rebuild via the loop

  /* ── Draw loop ── */
  React.useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const draw = (ts: number) => {
      const ctx = canvas.getContext('2d');
      if (!ctx) {
        rafRef.current = requestAnimationFrame(draw);
        return;
      }

      const eff = intensityRef.current;
      if (eff <= 0) {
        ctx.clearRect(0, 0, canvas.width, canvas.height);
        rafRef.current = requestAnimationFrame(draw);
        return;
      }

      const dt = prevTsRef.current === 0 ? 16 : ts - prevTsRef.current;
      prevTsRef.current = ts;
      // Clamp dt to prevent huge jumps on tab resume
      const dtClamped = Math.min(dt, 50);
      const speedFactor = dtClamped / 16.67;

      const { w, h } = sizeRef.current;
      if (!w || !h) {
        rafRef.current = requestAnimationFrame(draw);
        return;
      }

      const diagonal = Math.sqrt(w * w + h * h);
      // Link distance: 7–10 % of diagonal, scaled by intensity
      const linkDist = diagonal * (0.07 + 0.03 * eff);
      const linkDistSq = linkDist * linkDist;

      ctx.clearRect(0, 0, w, h);

      const particles = particlesRef.current;

      /* ── Move ── */
      if (!reducedRef.current) {
        for (const p of particles) {
          p.x += p.vx * speedFactor;
          p.y += p.vy * speedFactor;
          p.pulsePhase += p.pulseSpeed * speedFactor;

          // Soft-wrap at edges
          if (p.x < -12) p.x = w + 12;
          else if (p.x > w + 12) p.x = -12;
          if (p.y < -12) p.y = h + 12;
          else if (p.y > h + 12) p.y = -12;
        }
      }

      /* ── Lines ── */
      ctx.save();
      for (let i = 0; i < particles.length; i++) {
        const a = particles[i];
        for (let j = i + 1; j < particles.length; j++) {
          const b = particles[j];
          const dx = a.x - b.x;
          const dy = a.y - b.y;
          const dSq = dx * dx + dy * dy;
          if (dSq >= linkDistSq) continue;

          const proximity = 1 - Math.sqrt(dSq) / linkDist;
          const alpha = proximity * proximity * 0.3 * eff;

          ctx.beginPath();
          ctx.moveTo(a.x, a.y);
          ctx.lineTo(b.x, b.y);
          ctx.strokeStyle = resolveAccent(alpha);
          ctx.lineWidth = proximity * 1.4;
          ctx.stroke();
        }
      }
      ctx.restore();

      /* ── Nodes ── */
      for (const p of particles) {
        const pulse = Math.sin(p.pulsePhase) * 0.18;
        const r = p.radius * (1 + pulse);
        const alpha = p.baseOpacity * (0.8 + pulse * 0.4) * eff;

        if (p.kind === 'node') {
          // Radial glow halo
          const glowR = r * 5;
          const grad = ctx.createRadialGradient(p.x, p.y, 0, p.x, p.y, glowR);
          grad.addColorStop(0, resolveAccent(alpha * 0.45));
          grad.addColorStop(1, resolveAccent(0));
          ctx.beginPath();
          ctx.arc(p.x, p.y, glowR, 0, Math.PI * 2);
          ctx.fillStyle = grad;
          ctx.fill();
        }

        // Solid core dot
        ctx.beginPath();
        ctx.arc(p.x, p.y, r, 0, Math.PI * 2);
        ctx.fillStyle = resolveAccent(alpha);
        ctx.fill();
      }

      rafRef.current = requestAnimationFrame(draw);
    };

    rafRef.current = requestAnimationFrame(draw);
    return () => cancelAnimationFrame(rafRef.current);
  }, []);

  if (intensity <= 0) return null;

  return (
    <canvas
      ref={canvasRef}
      aria-hidden="true"
      className="fixed inset-0 pointer-events-none"
      style={{ zIndex: 0, opacity: intensity }}
    />
  );
}
