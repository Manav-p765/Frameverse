import { useRef } from 'react';
import { motion, useInView } from 'framer-motion';

const FEATURES = [
  { icon: <OnlineIcon />,    title: 'Online Presence',       desc: 'See who is active in real-time. Online indicators update instantly via Socket.io events.' },
  { icon: <TypingIcon />,    title: 'Typing Indicators',     desc: 'Animated typing dots appear the moment a collaborator starts composing a message.' },
  { icon: <ReceiptIcon />,   title: 'Read Receipts',         desc: 'Double-tick delivery and read confirmations for every message sent on the platform.' },
  { icon: <DeliveryIcon />,  title: 'Instant Delivery',      desc: 'Sub-100ms message delivery over persistent WebSocket connections powered by Socket.io.' },
  { icon: <ReconnectIcon />, title: 'Reconnection Handling', desc: 'Automatic reconnect with exponential backoff. No missed messages when connectivity drops.' },
];

const STATS = [
  { value: '<100ms', label: 'Message latency' },
  { value: 'WS',     label: 'Persistent socket' },
  { value: '∞',      label: 'Concurrent users' },
  { value: '99.9%',  label: 'Uptime target' },
];

const revealV = {
  hidden:  { opacity: 0, y: 40 },
  visible: (i) => ({ opacity: 1, y: 0, transition: { delay: i * 0.1, duration: 0.55, ease: 'easeOut' } }),
};

export default function RealtimeSection() {
  const ref = useRef(null);
  const inView = useInView(ref, { once: true, margin: '-80px' });

  return (
    <section id="realtime" ref={ref} className="relative py-24 md:py-32 px-6 max-w-page mx-auto overflow-hidden">
      {/* glow */}
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[400px] bg-accent/[0.06] blur-[100px] rounded-full pointer-events-none" />

      <div className="relative grid grid-cols-1 lg:grid-cols-2 gap-16 lg:gap-20 items-start">

        {/* Left */}
        <div>
          <motion.div initial={{ opacity: 0, y: 40 }} animate={inView ? { opacity: 1, y: 0 } : {}} transition={{ duration: 0.5 }}>
            <div className="inline-flex items-center gap-2 px-3.5 py-1.5 border border-white/10 rounded-full text-xs text-[#858585] mb-5">
              <PulseIcon /> Real-Time Infrastructure
            </div>
          </motion.div>

          <motion.h2 className="font-display text-[clamp(32px,4vw,52px)] font-normal tracking-[-0.03em] leading-tight mb-4"
            initial={{ opacity: 0, y: 40 }} animate={inView ? { opacity: 1, y: 0 } : {}} transition={{ duration: 0.5, delay: 0.1 }}>
            Built for Real-Time <span className="text-[#858585]">Systems</span>
          </motion.h2>

          <motion.p className="text-sm text-[#858585] leading-[1.75] max-w-sm mb-8"
            initial={{ opacity: 0, y: 40 }} animate={inView ? { opacity: 1, y: 0 } : {}} transition={{ duration: 0.5, delay: 0.15 }}>
            Frameverse's real-time layer is built on Socket.io with a Node.js cluster. Every user action — message, call, post — propagates instantly across all connected clients.
          </motion.p>

          <motion.div className="grid grid-cols-2 gap-3"
            initial={{ opacity: 0, y: 30 }} animate={inView ? { opacity: 1, y: 0 } : {}} transition={{ duration: 0.5, delay: 0.25 }}>
            {STATS.map(({ value, label }) => (
              <div key={label} className="flex flex-col gap-1 p-4 bg-surface border border-white/10 rounded-2xl">
                <span className="font-display text-3xl font-bold tracking-tight text-accent">{value}</span>
                <span className="text-xs text-[#858585]">{label}</span>
              </div>
            ))}
          </motion.div>
        </div>

        {/* Right */}
        <div className="flex flex-col gap-1">
          {FEATURES.map((f, i) => (
            <motion.div key={f.title} custom={i} variants={revealV} initial="hidden" animate={inView ? 'visible' : 'hidden'}
              className="flex items-start gap-4 p-4 rounded-2xl border border-transparent hover:bg-surface hover:border-white/10 transition-all duration-400">
              <div className="flex items-center justify-center w-8 h-8 shrink-0 border border-white/16 rounded-lg text-accent mt-0.5">
                {f.icon}
              </div>
              <div>
                <h3 className="text-[14px] font-medium text-white mb-1">{f.title}</h3>
                <p className="text-[13px] text-[#858585] leading-relaxed">{f.desc}</p>
              </div>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
}

function OnlineIcon()    { return <svg width="16" height="16" viewBox="0 0 24 24" fill="none"><circle cx="12" cy="12" r="3" fill="currentColor"/><circle cx="12" cy="12" r="7" stroke="currentColor" strokeWidth="1.5"/></svg>; }
function TypingIcon()    { return <svg width="16" height="16" viewBox="0 0 24 24" fill="none"><path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/><circle cx="9" cy="12" r="1" fill="currentColor"/><circle cx="12" cy="12" r="1" fill="currentColor"/><circle cx="15" cy="12" r="1" fill="currentColor"/></svg>; }
function ReceiptIcon()   { return <svg width="16" height="16" viewBox="0 0 24 24" fill="none"><path d="M20 6L9 17l-5-5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/><path d="M16 6l-5 5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeOpacity="0.4"/></svg>; }
function DeliveryIcon()  { return <svg width="16" height="16" viewBox="0 0 24 24" fill="none"><path d="M13 2L3 14h9l-1 8 10-12h-9l1-8z" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/></svg>; }
function ReconnectIcon() { return <svg width="16" height="16" viewBox="0 0 24 24" fill="none"><path d="M23 4v6h-6" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/><path d="M20.49 15a9 9 0 1 1-2.12-9.36L23 10" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/></svg>; }
function PulseIcon()     { return <svg width="14" height="14" viewBox="0 0 24 24" fill="none"><path d="M22 12h-4l-3 9L9 3l-3 9H2" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/></svg>; }
