import { Upload, Settings2, Cpu, Play } from 'lucide-react';

const STEPS = [
  {
    number: '01',
    icon: Upload,
    title: 'Define Your Target',
    description: 'Upload an SVG or CSV file with your desired path, enter a mathematical function, or draw freehand on the canvas. Specify positions and orientations for motion generation.',
    color: 'text-pink-400',
    bgColor: 'bg-pink-500/10',
    borderColor: 'border-pink-500/20',
  },
  {
    number: '02',
    icon: Settings2,
    title: 'Configure Synthesis',
    description: 'Choose your mechanism type (4-bar, 6-bar Watt/Stephenson, slider-crank), select optimization algorithm (DE, GA, PSO, SA), and set constraints like Grashof condition and error tolerance.',
    color: 'text-blue-400',
    bgColor: 'bg-blue-500/10',
    borderColor: 'border-blue-500/20',
  },
  {
    number: '03',
    icon: Cpu,
    title: 'Run Synthesis',
    description: 'Zxynth runs type synthesis, number synthesis, and dimensional synthesis. Watch real-time progress: generation count, best fitness value. Both analytical and optimization results are computed.',
    color: 'text-amber-400',
    bgColor: 'bg-amber-500/10',
    borderColor: 'border-amber-500/20',
  },
  {
    number: '04',
    icon: Play,
    title: 'Visualize & Export',
    description: 'Animate the synthesized mechanism with labeled links and joints. View coupler curve overlay with error shading. Explore cognates and inversions. Export as PDF, GIF, DXF, SVG, JSON, or CSV.',
    color: 'text-emerald-400',
    bgColor: 'bg-emerald-500/10',
    borderColor: 'border-emerald-500/20',
  },
];

export default function QuickStartGuide() {
  return (
    <section className="py-20 px-4 bg-[var(--color-bg-secondary)]">
      <div className="max-w-[1200px] mx-auto">
        {/* Section header */}
        <div className="text-center mb-14">
          <p className="label text-blueprint-400 mb-2">How It Works</p>
          <h2 className="text-3xl font-bold tracking-tight mb-3">
            Four Steps to a Working Mechanism
          </h2>
          <p className="text-[var(--color-text-secondary)] max-w-lg mx-auto">
            From uploading a desired curve to exporting a fully synthesized linkage — with complete educational context at every step.
          </p>
        </div>

        {/* Steps — horizontal layout with connecting line */}
        <div className="relative">
          {/* Connecting line */}
          <div className="absolute top-12 left-[calc(12.5%+20px)] right-[calc(12.5%+20px)] h-px bg-gradient-to-r from-pink-500/30 via-blue-500/30 via-amber-500/30 to-emerald-500/30 hidden lg:block" />

          <div className="grid grid-cols-4 gap-6 stagger-children">
            {STEPS.map(({ number, icon: Icon, title, description, color, bgColor, borderColor }) => (
              <div key={number} className="flex flex-col items-center text-center">
                {/* Step number + icon */}
                <div className="relative mb-6">
                  <div className={`w-24 h-24 rounded-2xl ${bgColor} border ${borderColor} flex flex-col items-center justify-center gap-1`}>
                    <span className={`text-2xs font-bold uppercase tracking-widest ${color} opacity-60`}>
                      Step
                    </span>
                    <Icon size={28} className={color} />
                  </div>
                  {/* Step number badge */}
                  <div className={`absolute -top-2 -right-2 w-7 h-7 rounded-full bg-[var(--color-bg-elevated)] border ${borderColor} flex items-center justify-center`}>
                    <span className={`text-xs font-bold ${color}`}>{number}</span>
                  </div>
                </div>

                {/* Title */}
                <h3 className="text-base font-semibold mb-2">{title}</h3>

                {/* Description */}
                <p className="text-xs text-[var(--color-text-muted)] leading-relaxed">
                  {description}
                </p>
              </div>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}
