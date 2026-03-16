import { X, BookOpen, ChevronRight } from 'lucide-react';
import clsx from 'clsx';
import useAppStore from '../../stores/useAppStore';
import GrueblerExplainer from './GrueblerExplainer';
import FreudensteinExplainer from './FreudensteinExplainer';
import GrashofExplainer from './GrashofExplainer';
import LoopClosureExplainer from './LoopClosureExplainer';
import OptimizationExplainer from './OptimizationExplainer';
import TransmissionAngleExplainer from './TransmissionAngleExplainer';

/**
 * Education sidebar — slides in from the right, shows theory content
 * relevant to the current step in the synthesis workflow.
 *
 * Content mapping:
 * - Step 0 (Input): Overview of the 3 classical problems
 * - Step 1 (Type): What type synthesis means
 * - Step 2 (Number): Gruebler's equation explainer
 * - Step 3 (Dimensional): Optimization + Freudenstein + Loop closure
 * - Step 4 (Results): Grashof + Transmission angle
 */

const STEP_CONTENT = {
  0: {
    title: 'The Three Classical Problems',
    sections: ['overview'],
  },
  1: {
    title: 'Type Synthesis',
    sections: ['type_synthesis'],
  },
  2: {
    title: 'Number Synthesis & DOF',
    sections: ['gruebler'],
  },
  3: {
    title: 'Dimensional Synthesis',
    sections: ['loop_closure', 'freudenstein', 'optimization'],
  },
  4: {
    title: 'Verification & Feasibility',
    sections: ['grashof', 'transmission_angle'],
  },
};

export default function EducationSidebar() {
  const { sidebarOpen, setSidebarOpen, currentStep } = useAppStore();

  const content = STEP_CONTENT[currentStep] || STEP_CONTENT[0];

  return (
    <>
      {/* Backdrop */}
      {sidebarOpen && (
        <div
          className="fixed inset-0 bg-black/30 z-40 backdrop-blur-sm"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      {/* Sidebar panel */}
      <div
        className={clsx(
          'fixed top-14 right-0 bottom-0 z-50 w-[420px] flex flex-col',
          'bg-[var(--color-bg-secondary)] border-l border-[var(--color-border)]',
          'transition-transform duration-300 ease-in-out',
          sidebarOpen ? 'translate-x-0' : 'translate-x-full'
        )}
      >
        {/* Header */}
        <div className="flex items-center justify-between px-4 py-3 border-b border-[var(--color-border-subtle)]">
          <div className="flex items-center gap-2">
            <BookOpen size={16} className="text-blueprint-400" />
            <h2 className="text-sm font-semibold">{content.title}</h2>
          </div>
          <button
            onClick={() => setSidebarOpen(false)}
            className="btn-ghost p-1.5 rounded-md"
          >
            <X size={16} />
          </button>
        </div>

        {/* Step navigation */}
        <div className="flex items-center gap-1 px-4 py-2 border-b border-[var(--color-border-subtle)] overflow-x-auto">
          {Object.entries(STEP_CONTENT).map(([step, { title }]) => (
            <button
              key={step}
              onClick={() => useAppStore.getState().setCurrentStep(parseInt(step))}
              className={clsx(
                'px-2 py-1 rounded text-2xs font-medium whitespace-nowrap transition-colors',
                parseInt(step) === currentStep
                  ? 'bg-blueprint-500/15 text-blueprint-400'
                  : 'text-[var(--color-text-muted)] hover:text-[var(--color-text-secondary)]'
              )}
            >
              {title}
            </button>
          ))}
        </div>

        {/* Scrollable content */}
        <div className="flex-1 overflow-y-auto px-4 py-4 space-y-6">
          {/* Overview (Step 0) */}
          {content.sections.includes('overview') && <OverviewSection />}

          {/* Type synthesis (Step 1) */}
          {content.sections.includes('type_synthesis') && <TypeSynthesisSection />}

          {/* Gruebler (Step 2) */}
          {content.sections.includes('gruebler') && <GrueblerExplainer />}

          {/* Loop Closure (Step 3) */}
          {content.sections.includes('loop_closure') && <LoopClosureExplainer />}

          {/* Freudenstein (Step 3) */}
          {content.sections.includes('freudenstein') && <FreudensteinExplainer />}

          {/* Optimization (Step 3) */}
          {content.sections.includes('optimization') && <OptimizationExplainer />}

          {/* Grashof (Step 4) */}
          {content.sections.includes('grashof') && <GrashofExplainer />}

          {/* Transmission Angle (Step 4) */}
          {content.sections.includes('transmission_angle') && <TransmissionAngleExplainer />}
        </div>
      </div>
    </>
  );
}

/** Overview of the 3 classical problems */
function OverviewSection() {
  return (
    <div className="space-y-3">
      <p className="text-xs text-[var(--color-text-secondary)] leading-relaxed">
        Mechanism synthesis has three classical problems, each specifying a different
        kind of desired output:
      </p>

      {[
        {
          title: 'Path Generation',
          desc: 'A specific point on the coupler traces a prescribed curve (x, y). The timing (which crank angle produces which path point) may or may not be specified.',
          color: 'text-emerald-400',
        },
        {
          title: 'Function Generation',
          desc: 'The output link angle is a specified function of the input link angle: θ_out = f(θ_in). Only the input-output relationship matters, not the coupler path.',
          color: 'text-blue-400',
        },
        {
          title: 'Motion Generation',
          desc: 'The entire coupler link passes through prescribed positions AND orientations (x, y, θ). This is rigid-body guidance.',
          color: 'text-pink-400',
        },
      ].map(({ title, desc, color }) => (
        <div key={title} className="card p-3">
          <p className={clsx('text-xs font-semibold mb-1', color)}>{title}</p>
          <p className="text-2xs text-[var(--color-text-muted)] leading-relaxed">{desc}</p>
        </div>
      ))}
    </div>
  );
}

/** Type synthesis explanation */
function TypeSynthesisSection() {
  return (
    <div className="space-y-3">
      <p className="text-xs text-[var(--color-text-secondary)] leading-relaxed">
        <strong>Type synthesis</strong> determines what <em>kind</em> of mechanism to use.
        The decision depends on the problem category and desired complexity:
      </p>

      <div className="card p-3 space-y-2">
        <p className="text-2xs text-[var(--color-text-muted)] leading-relaxed">
          <strong className="text-[var(--color-text-secondary)]">Why linkages?</strong>{' '}
          For path, function, and motion generation, planar linkages (4-bar, 6-bar) are
          preferred over cams or gears because they provide smooth, continuous motion
          with a single degree of freedom and are easy to manufacture.
        </p>
        <p className="text-2xs text-[var(--color-text-muted)] leading-relaxed">
          <strong className="text-[var(--color-text-secondary)]">4-bar vs 6-bar:</strong>{' '}
          Start with a 4-bar — it is the simplest single-DOF linkage. If the 4-bar cannot
          achieve acceptable error (complex S-curves, inflection points), escalate to a
          6-bar (Watt-I or Stephenson-III), which has more design freedom.
        </p>
        <p className="text-2xs text-[var(--color-text-muted)] leading-relaxed">
          <strong className="text-[var(--color-text-secondary)]">Slider-crank:</strong>{' '}
          Use when the output needs a linear component, or the input is a linear actuator
          rather than a continuous rotary motor.
        </p>
      </div>
    </div>
  );
}
