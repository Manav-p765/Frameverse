import { useRef } from 'react';
import { motion, useInView } from 'framer-motion';

const FEATURES = [
  { icon: <AIIcon />,          title: 'AI Auto Posting',        tag: 'AI',        desc: 'Generate and schedule developer posts using AI. Zero effort, full reach.' },
  { icon: <ChatIcon />,        title: 'Real-Time Messaging',    tag: 'Socket.io', desc: 'Socket.io powered chat with typing indicators, read receipts, and live presence.' },
  { icon: <VideoIcon />,       title: 'WebRTC Video Calls',     tag: 'WebRTC',    desc: 'Peer-to-peer video calling inside chats. Low latency with STUN/TURN support.' },
  { icon: <FeedIcon />,        title: 'Developer Social Feed',  tag: 'Social',    desc: 'Share ideas, discussions, and code insights with a developer-first community.' },
  { icon: <AnalyticsIcon />,   title: 'Analytics Dashboard',    tag: 'Insights',  desc: 'Track user growth, message activity, post reach, and engagement metrics.' },
  { icon: <SecurityIcon />,    title: 'Security System',        tag: 'Security',  desc: 'JWT auth, rate limiting, XSS protection, MongoDB sanitization, optional 2FA.' },
  { icon: <PerformanceIcon />, title: 'Performance Engineering',tag: 'Infra',     desc: 'Redis caching, MongoDB indexing, and query optimizations built from the ground up.' },
];

const containerV = { hidden: {}, visible: { transition: { staggerChildren: 0.08 } } };
const cardV = { hidden: { opacity: 0, y: 40 }, visible: { opacity: 1, y: 0, transition: { duration: 0.5, ease: 'easeOut' } } };

export default function Features() {
  const ref = useRef(null);
  const inView = useInView(ref, { once: true, margin: '-80px' });

  return (
    <section id="features" ref={ref} className="py-24 md:py-32 px-6 max-w-page mx-auto">
      <motion.div className="flex flex-col gap-5 mb-14 max-w-xl"
        initial={{ opacity: 0, y: 40 }} animate={inView ? { opacity: 1, y: 0 } : {}} transition={{ duration: 0.5 }}>
        <div className="inline-flex items-center gap-2 px-3.5 py-1.5 border border-white/10 rounded-full text-xs text-[#858585]">
          <SparkleIcon /> Platform Features
        </div>
        <h2 className="font-display text-[clamp(32px,4vw,52px)] font-normal tracking-[-0.03em] leading-tight">
          Every tool developers need{' '}
          <span className="text-[#858585]">built into one connected platform.</span>
        </h2>
      </motion.div>

      <motion.div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4"
        variants={containerV} initial="hidden" animate={inView ? 'visible' : 'hidden'}>
        {FEATURES.map((f, i) => (
          <motion.div key={f.title} variants={cardV}
            className={`relative bg-surface border border-white/10 rounded-3xl p-6 group transition-all duration-400 hover:-translate-y-0.5 hover:border-white/16 hover:shadow-[inset_0_0_46px_0_rgba(255,255,255,0.04)] overflow-hidden ${i === 0 ? 'border-accent/15 bg-gradient-to-br from-accent/[0.04] to-surface' : ''}`}>
            <div className="absolute inset-0 bg-gradient-to-br from-accent/[0.04] to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-400 rounded-3xl" />
            <div className="relative">
              <div className="flex items-center justify-between mb-3.5">
                <div className="flex items-center justify-center w-10 h-10 border border-white/16 rounded-full text-white">
                  {f.icon}
                </div>
                <span className="text-[10px] font-medium uppercase tracking-widest text-accent bg-accent/10 border border-accent/20 rounded px-2 py-0.5">
                  {f.tag}
                </span>
              </div>
              <h3 className="text-[15px] font-medium text-white mb-1.5">{f.title}</h3>
              <p className="text-[13px] text-[#858585] leading-relaxed">{f.desc}</p>
            </div>
          </motion.div>
        ))}
      </motion.div>
    </section>
  );
}

function AIIcon() { return <svg width="18" height="18" viewBox="0 0 24 24" fill="none"><path d="M12 2L2 7l10 5 10-5-10-5zM2 17l10 5 10-5M2 12l10 5 10-5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/></svg>; }
function ChatIcon() { return <svg width="18" height="18" viewBox="0 0 24 24" fill="none"><path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/></svg>; }
function VideoIcon() { return <svg width="18" height="18" viewBox="0 0 24 24" fill="none"><polygon points="23 7 16 12 23 17 23 7" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/><rect x="1" y="5" width="15" height="14" rx="2" stroke="currentColor" strokeWidth="1.5"/></svg>; }
function FeedIcon() { return <svg width="18" height="18" viewBox="0 0 24 24" fill="none"><path d="M4 6h16M4 10h16M4 14h10" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/><circle cx="18" cy="18" r="3" stroke="currentColor" strokeWidth="1.5"/></svg>; }
function AnalyticsIcon() { return <svg width="18" height="18" viewBox="0 0 24 24" fill="none"><path d="M18 20V10M12 20V4M6 20v-6" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/></svg>; }
function SecurityIcon() { return <svg width="18" height="18" viewBox="0 0 24 24" fill="none"><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/></svg>; }
function PerformanceIcon() { return <svg width="18" height="18" viewBox="0 0 24 24" fill="none"><circle cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="1.5"/><path d="M12 6v6l4 2" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/></svg>; }
function SparkleIcon() { return <svg width="14" height="14" viewBox="0 0 24 24" fill="none"><path d="M12 2v4M12 18v4M4.93 4.93l2.83 2.83M16.24 16.24l2.83 2.83M2 12h4M18 12h4M4.93 19.07l2.83-2.83M16.24 7.76l2.83-2.83" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/></svg>; }
