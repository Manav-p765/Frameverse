import { useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion, useInView } from 'framer-motion';

export default function CTA() {
  const ref = useRef(null);
  const inView = useInView(ref, { once: true, margin: '-80px' });
  const navigate = useNavigate();

  return (
    <section id="cta" ref={ref} className="relative py-24 md:py-32 px-6 overflow-hidden">
      {/* Glow */}
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[800px] h-[400px] bg-accent/10 blur-[100px] rounded-full pointer-events-none" />

      <motion.div
        className="relative z-10 max-w-xl mx-auto text-center flex flex-col items-center gap-5 px-10 py-16 bg-surface border border-white/16 rounded-[32px] shadow-[0_0_80px_rgba(213,255,69,0.05),inset_0_0_0_1px_rgba(255,255,255,0.05)]"
        initial={{ opacity: 0, y: 40 }} animate={inView ? { opacity: 1, y: 0 } : {}} transition={{ duration: 0.6, ease: 'easeOut' }}>

        <div className="inline-flex items-center gap-2 px-3 py-1.5 border border-white/16 rounded-full text-xs text-[#858585]">
          <span className="w-1.5 h-1.5 rounded-full bg-accent shadow-[0_0_6px_#d5ff45] animate-pulse-dot" />
          Start for free
        </div>

        <h2 className="font-display text-[clamp(32px,5vw,52px)] font-normal tracking-[-0.04em] leading-tight">
          Join Frameverse.<br />
          <span className="text-[#858585]">Ship with your community.</span>
        </h2>

        <p className="text-sm text-[#858585] leading-[1.7] max-w-sm">
          Get instant access to real-time messaging, video calls, the developer feed, and analytics — all in one place.
        </p>

        <div className="flex items-center gap-3 flex-wrap justify-center">
          <button onClick={() => navigate('/auth')}
            className="px-7 py-3.5 text-[15px] font-medium text-white bg-accent border-2 border-white/20 rounded-full hover:shadow-[0_0_30px_6px_rgba(213,255,69,0.2)] hover:-translate-y-px transition-all">
            Get Started — it's free
          </button>
          <button onClick={() => navigate('/')}
            className="px-6 py-3.5 text-[15px] font-medium text-white border border-white/16 rounded-full hover:bg-white/5 hover:border-white/30 transition-all">
            Explore the Feed
          </button>
        </div>

        <p className="text-xs text-white/30">No credit card required · Open source MERN stack</p>
      </motion.div>
    </section>
  );
}
