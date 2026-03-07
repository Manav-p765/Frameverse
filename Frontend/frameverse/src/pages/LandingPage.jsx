import Navbar from '../components/Landingpage/Navbar';
import Hero from '../components/Landingpage/Hero';
import Features from '../components/Landingpage/Features';
import RealtimeSection from '../components/Landingpage/RealtimeSection';
import VideoCallSection from '../components/Landingpage/VideoCallSection';
import AnalyticsPreview from '../components/Landingpage/AnalyticsPreview';
import SecuritySection from '../components/Landingpage/SecuritySection';
import CTA from '../components/Landingpage/CTA';
import Footer from '../components/Landingpage/Footer';

export default function LandingPage() {
  return (
    <>
      {/* Framer-style noise texture overlay */}
      <div className="noise-overlay fixed inset-0 pointer-events-none z-[5] opacity-[0.13]" aria-hidden="true" />
      <Navbar />
      <main>
        <Hero />
        <Features />
        <RealtimeSection />
        <VideoCallSection />
        <AnalyticsPreview />
        <SecuritySection />
        <CTA />
      </main>
      <Footer />
    </>
  );
}
