import HeroSection from './HeroSection';
import ProblemOverview from './ProblemOverview';
import QuickStartGuide from './QuickStartGuide';
import ToolComparison from './ToolComparison';

/**
 * Landing page — composes all sections in order.
 * Each section is a full-width block; PageContainer is applied per-section
 * so that the hero can go edge-to-edge while other sections stay constrained.
 */
export default function LandingPage() {
  return (
    <div className="flex flex-col">
      <HeroSection />
      <ProblemOverview />
      <QuickStartGuide />
      <ToolComparison />
    </div>
  );
}
