import { Link } from 'react-router-dom';
import { Waypoints, TrendingUp, Move3D, ArrowRight } from 'lucide-react';

/**
 * Inline SVG illustrations for each problem type.
 */
function PathIllustration() {
  return (
    <svg viewBox="0 0 200 120" className="w-full h-28" fill="none">
      {/* Desired path — smooth curve */}
      <path
        d="M 30 90 Q 60 20, 100 50 Q 140 80, 170 30"
        stroke="#f472b6" strokeWidth="2" strokeDasharray="4 3" fill="none"
      />
      {/* Coupler curve tracing it */}
      <path
        d="M 32 88 Q 62 22, 100 52 Q 138 78, 168 32"
        stroke="#34d399" strokeWidth="2" fill="none"
      />
      {/* Sample points on desired path */}
      {[30, 50, 70, 100, 130, 150, 170].map((x, i) => {
        const y = i === 0 ? 90 : i === 1 ? 55 : i === 2 ? 35 : i === 3 ? 50 : i === 4 ? 65 : i === 5 ? 45 : 30;
        return <circle key={i} cx={x} cy={y} r="2.5" fill="#f59e0b" />;
      })}
      {/* Labels */}
      <text x="30" y="110" fontSize="8" fill="currentColor" opacity="0.5">Desired Path</text>
      <text x="130" y="110" fontSize="8" fill="#34d399" opacity="0.7">Coupler Curve</text>
    </svg>
  );
}

function FunctionIllustration() {
  return (
    <svg viewBox="0 0 200 120" className="w-full h-28" fill="none">
      {/* Axes */}
      <line x1="30" y1="100" x2="180" y2="100" stroke="currentColor" strokeWidth="1" opacity="0.3" />
      <line x1="30" y1="100" x2="30" y2="15" stroke="currentColor" strokeWidth="1" opacity="0.3" />
      {/* θ_in label */}
      <text x="100" y="115" fontSize="8" fill="currentColor" opacity="0.5" textAnchor="middle">θ_input</text>
      {/* θ_out label */}
      <text x="12" y="55" fontSize="8" fill="currentColor" opacity="0.5" textAnchor="middle" transform="rotate(-90 12 55)">θ_output</text>
      {/* Desired function curve (e.g., log-like) */}
      <path
        d="M 30 95 C 60 90, 80 70, 100 55 C 120 40, 150 25, 175 20"
        stroke="#f472b6" strokeWidth="2" strokeDasharray="4 3" fill="none"
      />
      {/* Actual mechanism function */}
      <path
        d="M 30 93 C 62 88, 82 68, 100 54 C 118 42, 148 27, 175 22"
        stroke="#60a5fa" strokeWidth="2" fill="none"
      />
      {/* Precision points */}
      <circle cx="55" cy="88" r="3" fill="#f59e0b" />
      <circle cx="100" cy="55" r="3" fill="#f59e0b" />
      <circle cx="155" cy="25" r="3" fill="#f59e0b" />
    </svg>
  );
}

function MotionIllustration() {
  return (
    <svg viewBox="0 0 200 120" className="w-full h-28" fill="none">
      {/* Coupler body at 3 different positions/orientations */}
      {/* Position 1 */}
      <g opacity="0.4">
        <rect x="40" y="70" width="40" height="18" rx="3" stroke="#f472b6" strokeWidth="1.5" fill="none" transform="rotate(-5 60 79)" />
        <circle cx="45" cy="79" r="2" fill="#f59e0b" />
        <text x="60" y="65" fontSize="7" fill="#f472b6">P₁</text>
      </g>
      {/* Position 2 */}
      <g opacity="0.7">
        <rect x="80" y="45" width="40" height="18" rx="3" stroke="#f472b6" strokeWidth="1.5" fill="none" transform="rotate(-25 100 54)" />
        <circle cx="85" cy="54" r="2" fill="#f59e0b" />
        <text x="105" y="38" fontSize="7" fill="#f472b6">P₂</text>
      </g>
      {/* Position 3 */}
      <g>
        <rect x="120" y="25" width="40" height="18" rx="3" stroke="#f472b6" strokeWidth="1.5" fill="none" transform="rotate(-45 140 34)" />
        <circle cx="125" cy="34" r="2" fill="#f59e0b" />
        <text x="150" y="18" fontSize="7" fill="#f472b6">P₃</text>
      </g>
      {/* Arrows showing motion direction */}
      <path d="M 68 75 L 78 58" stroke="#94a3b8" strokeWidth="1" markerEnd="url(#arrowhead)" />
      <path d="M 112 48 L 122 38" stroke="#94a3b8" strokeWidth="1" markerEnd="url(#arrowhead)" />
      <defs>
        <marker id="arrowhead" markerWidth="6" markerHeight="4" refX="5" refY="2" orient="auto">
          <polygon points="0 0, 6 2, 0 4" fill="#94a3b8" />
        </marker>
      </defs>
      <text x="40" y="110" fontSize="8" fill="currentColor" opacity="0.5">Position + Orientation</text>
    </svg>
  );
}

const CARDS = [
  {
    id: 'path',
    title: 'Path Generation',
    icon: Waypoints,
    illustration: PathIllustration,
    route: '/path',
    description: 'Design a mechanism where a coupler point traces a specific curve. Upload an SVG, CSV, or draw freehand.',
    details: [
      'Upload SVG/CSV or draw on canvas',
      'With or without prescribed timing',
      'Closest-point error metric',
    ],
    color: 'text-emerald-400',
    borderColor: 'hover:border-emerald-500/50',
    glowColor: 'hover:shadow-[0_0_20px_rgba(52,211,153,0.15)]',
  },
  {
    id: 'function',
    title: 'Function Generation',
    icon: TrendingUp,
    illustration: FunctionIllustration,
    route: '/function',
    description: 'Design a mechanism producing a specific input-output angle relationship. Enter expressions or upload data.',
    details: [
      'Math expressions (y = log(x), sin(x))',
      'CSV of sampled (θ_in, θ_out) pairs',
      'Freudenstein equation solver',
    ],
    color: 'text-blue-400',
    borderColor: 'hover:border-blue-500/50',
    glowColor: 'hover:shadow-[0_0_20px_rgba(96,165,250,0.15)]',
  },
  {
    id: 'motion',
    title: 'Motion Generation',
    icon: Move3D,
    illustration: MotionIllustration,
    route: '/motion',
    description: 'Design a mechanism guiding a rigid body through specified positions and orientations (x, y, θ).',
    details: [
      'Table entry or interactive canvas',
      'Burmester circle-point theory',
      'Up to 5 analytical precision poses',
    ],
    color: 'text-pink-400',
    borderColor: 'hover:border-pink-500/50',
    glowColor: 'hover:shadow-[0_0_20px_rgba(244,114,182,0.15)]',
  },
];

export default function ProblemOverview() {
  return (
    <section id="overview" className="py-20 px-4">
      <div className="max-w-[1200px] mx-auto">
        {/* Section header */}
        <div className="text-center mb-14">
          <p className="label text-blueprint-400 mb-2">Three Classical Problems</p>
          <h2 className="text-3xl font-bold tracking-tight mb-3">
            What Can You Synthesize?
          </h2>
          <p className="text-[var(--color-text-secondary)] max-w-lg mx-auto">
            Zxynth covers all three fundamental problems in planar mechanism synthesis,
            each with analytical and optimization-based solutions.
          </p>
        </div>

        {/* Cards grid */}
        <div className="grid grid-cols-3 gap-6 stagger-children">
          {CARDS.map(({ id, title, icon: Icon, illustration: Illustration, route, description, details, color, borderColor, glowColor }) => (
            <Link
              key={id}
              to={route}
              className={`card-hover p-6 flex flex-col group transition-all duration-300 ${borderColor} ${glowColor}`}
            >
              {/* Icon + Title */}
              <div className="flex items-center gap-2.5 mb-4">
                <div className={`p-2 rounded-md bg-[var(--color-bg-input)] ${color}`}>
                  <Icon size={20} />
                </div>
                <h3 className="text-lg font-semibold">{title}</h3>
              </div>

              {/* Illustration */}
              <div className="mb-4 rounded-md bg-[var(--color-bg-primary)] border border-[var(--color-border-subtle)] p-3 overflow-hidden">
                <Illustration />
              </div>

              {/* Description */}
              <p className="text-sm text-[var(--color-text-secondary)] mb-4 leading-relaxed flex-1">
                {description}
              </p>

              {/* Feature list */}
              <ul className="space-y-1.5 mb-5">
                {details.map((detail, i) => (
                  <li key={i} className="flex items-start gap-2 text-xs text-[var(--color-text-muted)]">
                    <span className={`mt-0.5 w-1 h-1 rounded-full flex-shrink-0 ${color.replace('text-', 'bg-')}`} />
                    {detail}
                  </li>
                ))}
              </ul>

              {/* CTA */}
              <div className={`flex items-center gap-1 text-sm font-medium ${color} group-hover:gap-2 transition-all`}>
                <span>Get Started</span>
                <ArrowRight size={14} />
              </div>
            </Link>
          ))}
        </div>
      </div>
    </section>
  );
}
