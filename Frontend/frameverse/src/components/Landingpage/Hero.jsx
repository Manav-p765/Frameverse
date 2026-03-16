import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';

const WORDS = ['Real-Time', 'Social', 'Platform', 'for', 'Developers.'];

const wordV = {
  hidden: { opacity: 0, filter: 'blur(4px)', y: 12 },
  visible: (i) => ({ opacity: 1, filter: 'blur(0px)', y: 0, transition: { delay: i * 0.08, duration: 0.5, ease: 'easeOut' } }),
};

export default function Hero() {
  const navigate = useNavigate();

  return (
    <header id="hero" className="relative w-full min-h-screen flex items-center justify-center overflow-hidden pt-20">

      {/* BG image */}
      <div className="absolute inset-0">
        <div className="absolute inset-0 bg-hero-overlay z-10" />
        <img 
          src="https://framerusercontent.com/images/LzblaeZXHMibAuWgYhFsP59pXk.png?scale-down-to=2048&width=2912&height=1632" 
          alt="Hero background" 
          className="absolute inset-0 w-full h-full object-cover scale-105"
          fetchPriority="high"
          loading="eager"
          decoding="sync"
        />
      </div>

      {/* Ambient blobs */}
      <div className="absolute -top-24 -left-24 w-[500px] h-[500px] rounded-full bg-accent/[0.08] blur-[100px] pointer-events-none z-10 animate-blob-a" />
      <div className="absolute bottom-0 -right-20 w-[400px] h-[400px] rounded-full bg-blue-500/[0.06] blur-[100px] pointer-events-none z-10 animate-blob-b" />

      {/* Content */}
      <div className="relative z-20 flex flex-col items-center text-center gap-6 max-w-3xl px-6">

        {/* Badge */}
        <motion.div className="inline-flex items-center gap-2 px-3.5 py-1.5 border border-white/16 rounded-full text-xs text-white/80 bg-white/[0.04] backdrop-blur-sm"
          initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.4, delay: 0.1 }}>
          <span className="w-1.5 h-1.5 rounded-full bg-accent shadow-[0_0_6px_#d5ff45] animate-pulse-dot" />
          Frameverse is now live
        </motion.div>

        {/* Heading */}
        <h1 className="font-display text-[clamp(42px,8vw,88px)] font-normal tracking-[-0.02em] leading-[1.1] text-white">
          {WORDS.map((word, i) => (
            <motion.span key={word} className="inline-block mr-[0.25em] last:mr-0" custom={i} initial="hidden" animate="visible" variants={wordV}>
              {word}
            </motion.span>
          ))}
        </h1>

        {/* Subtitle */}
        <motion.p className="text-[clamp(15px,2vw,18px)] text-white/60 max-w-lg leading-relaxed"
          initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.55, duration: 0.6 }}>
          Share ideas, chat instantly, video call collaborators, and track your impact.
        </motion.p>

        {/* CTAs */}
        <motion.div className="flex items-center gap-3 flex-wrap justify-center"
          initial={{ opacity: 0, y: 24 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.75, duration: 0.5 }}>
          <button onClick={() => navigate('/auth')}
            className="px-7 py-3.5 text-[15px] font-medium text-white bg-accent border-2 border-white/20 rounded-full hover:shadow-[0_0_30px_6px_rgba(213,255,69,0.2)] hover:-translate-y-px transition-all">
            Get Started
          </button>
          <button onClick={() => navigate('/')}
            className="inline-flex items-center gap-2 px-6 py-3.5 text-[15px] font-medium text-white border border-white/16 rounded-full hover:bg-white/5 hover:border-white/30 transition-all">
            Explore Feed
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none">
              <path d="M5 12h14M13 6l6 6-6 6" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
          </button>
        </motion.div>

        {/* Scroll hint */}
        <motion.div className="flex items-center gap-1.5 text-xs text-white/30 mt-4 animate-scroll-hint"
          initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 1.1, duration: 0.5 }}>
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none">
            <path d="M6 9l6 6 6-6" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
          Scroll to explore
        </motion.div>
      </div>
    </header>
  );
}
