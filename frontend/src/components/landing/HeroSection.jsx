import { useEffect, useRef } from 'react';
import { Link } from 'react-router-dom';
import { ArrowRight, Sparkles } from 'lucide-react';

/**
 * Animated hero background — draws a faint mechanism sketch that rotates slowly.
 */
function HeroBackground() {
  const canvasRef = useRef(null);
  const frameRef = useRef(0);

  useEffect(() => {
    const svg = canvasRef.current;
    if (!svg) return;
    let animId;
    let angle = 0;

    const animate = () => {
      angle += 0.003;
      frameRef.current = angle;
      // Update the crank rotation
      const crank = svg.querySelector('#hero-crank');
      const coupler = svg.querySelector('#hero-coupler');
      const rocker = svg.querySelector('#hero-rocker');
      const trace = svg.querySelector('#hero-trace');

      if (!crank || !coupler || !rocker) { animId = requestAnimationFrame(animate); return; }

      // Simple 4-bar: ground=100, crank=30, coupler=80, rocker=60
      // Ground pivots: A=(150,200), D=(250,200)
      const a1 = 100, a2 = 30, a3 = 80, a4 = 60;
      const ax = 150, ay = 200, dx = 250, dy = 200;

      const bx = ax + a2 * Math.cos(angle);
      const by = ay + a2 * Math.sin(angle);

      // Solve for C (coupler-rocker joint) using circle-circle intersection
      const bdx = dx - bx, bdy = dy - by;
      const dist = Math.sqrt(bdx * bdx + bdy * bdy);

      if (dist > a3 + a4 || dist < Math.abs(a3 - a4)) {
        animId = requestAnimationFrame(animate);
        return;
      }

      const cosA = (a3 * a3 + dist * dist - a4 * a4) / (2 * a3 * dist);
      const sinA = Math.sqrt(Math.max(0, 1 - cosA * cosA));
      const baseAngle = Math.atan2(bdy, bdx);

      const cx = bx + a3 * Math.cos(baseAngle - sinA > 0 ? baseAngle - Math.acos(Math.max(-1, Math.min(1, cosA))) : baseAngle + Math.acos(Math.max(-1, Math.min(1, cosA))));
      const cy = by + a3 * Math.sin(baseAngle - Math.acos(Math.max(-1, Math.min(1, cosA))));

      // Coupler point offset
      const cpAngle = Math.atan2(cy - by, cx - bx) + 0.5;
      const cpDist = 50;
      const px = bx + cpDist * Math.cos(cpAngle);
      const py = by + cpDist * Math.sin(cpAngle);

      crank.setAttribute('x2', bx);
      crank.setAttribute('y2', by);
      coupler.setAttribute('x1', bx);
      coupler.setAttribute('y1', by);
      coupler.setAttribute('x2', cx);
      coupler.setAttribute('y2', cy);
      rocker.setAttribute('x1', dx);
      rocker.setAttribute('y1', dy);
      rocker.setAttribute('x2', cx);
      rocker.setAttribute('y2', cy);

      // Add to trace path
      if (trace) {
        const currentD = trace.getAttribute('d') || `M ${px} ${py}`;
        // Only keep last 300 points to prevent memory issues
        const parts = currentD.split('L');
        const trimmed = parts.length > 300
          ? 'M' + parts.slice(-300).join('L')
          : currentD;
        trace.setAttribute('d', `${trimmed} L ${px} ${py}`);
      }

      animId = requestAnimationFrame(animate);
    };

    animId = requestAnimationFrame(animate);
    return () => cancelAnimationFrame(animId);
  }, []);

  return (
    <svg
      ref={canvasRef}
      viewBox="0 0 400 350"
      className="absolute inset-0 w-full h-full opacity-[0.07] pointer-events-none"
      preserveAspectRatio="xMidYMid slice"
    >
      {/* Ground */}
      <line x1="150" y1="200" x2="250" y2="200" stroke="currentColor" strokeWidth="3" strokeDasharray="6 3" />
      {/* Ground pivots */}
      <circle cx="150" cy="200" r="5" fill="currentColor" />
      <circle cx="250" cy="200" r="5" fill="currentColor" />
      {/* Links */}
      <line id="hero-crank" x1="150" y1="200" x2="180" y2="200" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" />
      <line id="hero-coupler" x1="180" y1="200" x2="240" y2="160" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" />
      <line id="hero-rocker" x1="250" y1="200" x2="240" y2="160" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" />
      {/* Coupler curve trace */}
      <path id="hero-trace" d="" stroke="#3170e3" strokeWidth="1.5" fill="none" opacity="0.6" />
    </svg>
  );
}

export default function HeroSection() {
  return (
    <section className="relative bg-blueprint min-h-[85vh] flex items-center justify-center overflow-hidden">
      <HeroBackground />

      {/* Radial glow behind content */}
      <div className="absolute inset-0 pointer-events-none">
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] rounded-full bg-blueprint-500/5 blur-[120px]" />
      </div>

      <div className="relative z-10 max-w-3xl mx-auto px-4 text-center animate-in">
        {/* Badge */}
        <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-blueprint-500/10 border border-blueprint-500/20 text-xs font-medium text-blueprint-400 mb-6">
          <Sparkles size={12} />
          <span>Mechanism Synthesis Made Accessible</span>
        </div>

        {/* Logo mark */}
        <div className="flex justify-center mb-6">
          <svg viewBox="0 0 42 48" className="w-14 h-16" fill="none">
            <path d="M6 12 C16 12, 20 36, 36 36" stroke="#3170e3" strokeWidth="2.5" strokeLinecap="round" fill="none"/>
            <path d="M36 12 C26 12, 22 36, 6 36" stroke="#34d399" strokeWidth="2.5" strokeLinecap="round" fill="none"/>
            <circle cx="21" cy="24" r="3" fill="#f59e0b"/>
            <circle cx="6" cy="12" r="2.5" fill="#3170e3"/>
            <circle cx="36" cy="36" r="2.5" fill="#3170e3"/>
            <circle cx="36" cy="12" r="2.5" fill="#34d399"/>
            <circle cx="6" cy="36" r="2.5" fill="#34d399"/>
          </svg>
        </div>

        {/* Title */}
        <h1 className="text-5xl font-extrabold tracking-tight mb-4 leading-tight">
          <span className="text-blueprint-400">Zx</span>ynth
        </h1>

        {/* Subtitle */}
        <p className="text-xl text-[var(--color-text-secondary)] mb-3 font-light leading-relaxed">
          Design, Synthesize & Visualize Planar Mechanisms
        </p>
        <p className="text-sm text-[var(--color-text-muted)] max-w-lg mx-auto mb-10 leading-relaxed">
          From a desired path, function, or motion — to a fully synthesized 4-bar, 6-bar, or slider-crank mechanism.
          Step-by-step educational walkthrough with interactive visualization.
        </p>

        {/* CTA Buttons */}
        <div className="flex items-center justify-center gap-4">
          <Link
            to="/path"
            className="btn-primary px-7 py-3 text-base font-semibold group"
          >
            Start Synthesizing
            <ArrowRight size={18} className="transition-transform group-hover:translate-x-0.5" />
          </Link>
          <a
            href="#overview"
            className="btn-secondary px-7 py-3 text-base"
          >
            Explore Features
          </a>
        </div>

        {/* Tech stack pills */}
        <div className="mt-12 flex items-center justify-center gap-2 flex-wrap">
          {['4-Bar', '6-Bar Watt', '6-Bar Stephenson', 'Slider-Crank', 'DE', 'GA', 'PSO', 'SA'].map((tag) => (
            <span
              key={tag}
              className="px-2.5 py-1 rounded-md text-2xs font-medium bg-[var(--color-bg-input)] text-[var(--color-text-muted)] border border-[var(--color-border-subtle)]"
            >
              {tag}
            </span>
          ))}
        </div>
      </div>
    </section>
  );
}
