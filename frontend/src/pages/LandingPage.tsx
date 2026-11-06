import Navbar from '../components/landing/Navbar'
import Hero from '../components/landing/Hero'
import PhoneStory, {
  PhoneStoryMobileFallback,
} from '../components/landing/PhoneStory'
import CapabilitiesSection from '../components/landing/CapabilitiesSection'
import WorkforceSection from '../components/landing/WorkforceSection'
import AutomationSection from '../components/landing/AutomationSection'
import FinalCTA from '../components/landing/FinalCTA'
import Footer from '../components/landing/Footer'

/**
 * Public marketing page at `/`. The authenticated application lives under
 * `/app` and is untouched by this page — including the scroll-driven phone
 * story, which exists only here and only on desktop viewports.
 */
export default function LandingPage() {
  return (
    <div className="min-h-screen bg-paper font-sans text-ink">
      <Navbar />
      <main>
        <Hero />
        {/* Desktop: scroll-synchronized phone story. Mobile: static list. */}
        <PhoneStory />
        <PhoneStoryMobileFallback />
        <CapabilitiesSection />
        <WorkforceSection />
        <AutomationSection />
        <FinalCTA />
      </main>
      <Footer />
    </div>
  )
}
