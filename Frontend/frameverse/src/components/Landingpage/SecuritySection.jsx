import { useRef } from 'react';
import { motion, useInView } from 'framer-motion';

const CARDS = [
  { icon: <JWTIcon />,       title: 'JWT Authentication',   color: '#60a5fa', bg: 'rgba(96,165,250,0.09)',  desc: 'Stateless token-based auth with refresh token rotation and secure httpOnly cookies.' },
  { icon: <RateLimitIcon />, title: 'Rate Limiting',        color: '#f59e0b', bg: 'rgba(245,158,11,0.09)',  desc: 'Express-rate-limit with Redis store. IP-level throttling on all auth and API endpoints.' },
  { icon: <XSSIcon />,       title: 'XSS Protection',       color: '#34d399', bg: 'rgba(52,211,153,0.09)',  desc: 'Helmet.js headers, DOMPurify on the client, and input sanitization on every request.' },
  { icon: <MongoIcon />,     title: 'MongoDB Sanitization', color: '#a78bfa', bg: 'rgba(167,139,250,0.09)', desc: 'mongo-sanitize strips $ and . operators from all user input before DB queries.' },
  { icon: <TFAIcon />,       title: 'Optional 2FA',         color: '#fb7185', bg: 'rgba(251,113,133,0.09)', desc: 'TOTP-based two-factor authentication via Google Authenticator or any TOTP app.' },
  { icon: <AuditIcon />,     title: 'Audit Logging',        color: '#d5ff45', bg: 'rgba(213,255,69,0.09)',  desc: 'All auth events, admin actions and security alerts are logged with timestamps.' },
];

const cardV = {
  hidden:  { opacity: 0, y: 40 },
  visible: (i) => ({ opacity: 1, y: 0, transition: { delay: i * 0.07, duration: 0.5, ease: 'easeOut' } }),
};

export default function SecuritySection() {
  const ref = useRef(null);
  const inView = useInView(ref, { once: true, margin: '-80px' });

  return (
    <section id="security" ref={ref} className="py-24 md:py-32 px-6 max-w-page mx-auto">
      <div className="flex flex-col gap-5 mb-14 max-w-xl">
        <motion.div initial={{ opacity: 0, y: 40 }} animate={inView ? { opacity: 1, y: 0 } : {}} transition={{ duration: 0.5 }}>
          <div className="inline-flex items-center gap-2 px-3.5 py-1.5 border border-white/10 rounded-full text-xs text-[#858585]">
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none"><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" stroke="currentColor" strokeWidth="1.5"/></svg>
            Security System
          </div>
        </motion.div>
        <motion.h2 className="font-display text-[clamp(32px,4vw,52px)] font-normal tracking-[-0.03em] leading-tight"
          initial={{ opacity: 0, y: 40 }} animate={inView ? { opacity: 1, y: 0 } : {}} transition={{ duration: 0.5, delay: 0.1 }}>
          Security built <span className="text-[#858585]">into every layer.</span>
        </motion.h2>
        <motion.p className="text-sm text-[#858585] leading-[1.75]"
          initial={{ opacity: 0, y: 30 }} animate={inView ? { opacity: 1, y: 0 } : {}} transition={{ duration: 0.5, delay: 0.15 }}>
          Frameverse is designed with a defence-in-depth philosophy. Every entry point is guarded — from the network edge to the database.
        </motion.p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {CARDS.map((card, i) => (
          <motion.div key={card.title} custom={i} variants={cardV} initial="hidden" animate={inView ? 'visible' : 'hidden'}
            className="relative group bg-surface border border-white/10 rounded-3xl p-6 overflow-hidden transition-all duration-400 hover:-translate-y-0.5 hover:border-white/16 hover:shadow-[0_16px_40px_rgba(0,0,0,0.3)]">
            {/* Accent top bar */}
            <div className="absolute top-0 left-0 right-0 h-px opacity-0 group-hover:opacity-100 transition-opacity duration-400"
              style={{ background: card.color }} />
            <div className="flex items-center justify-center w-10 h-10 rounded-xl mb-4"
              style={{ background: card.bg, color: card.color }}>
              {card.icon}
            </div>
            <h3 className="text-[15px] font-medium text-white mb-2">{card.title}</h3>
            <p className="text-[13px] text-[#858585] leading-[1.65]">{card.desc}</p>
          </motion.div>
        ))}
      </div>
    </section>
  );
}

function JWTIcon()       { return <svg width="18" height="18" viewBox="0 0 24 24" fill="none"><rect x="3" y="11" width="18" height="11" rx="2" stroke="currentColor" strokeWidth="1.5"/><path d="M7 11V7a5 5 0 0 1 10 0v4" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/></svg>; }
function RateLimitIcon() { return <svg width="18" height="18" viewBox="0 0 24 24" fill="none"><circle cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="1.5"/><path d="M10 15V9l5 3-5 3z" fill="currentColor"/></svg>; }
function XSSIcon()       { return <svg width="18" height="18" viewBox="0 0 24 24" fill="none"><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/><path d="M9 12l2 2 4-4" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/></svg>; }
function MongoIcon()     { return <svg width="18" height="18" viewBox="0 0 24 24" fill="none"><ellipse cx="12" cy="5" rx="9" ry="3" stroke="currentColor" strokeWidth="1.5"/><path d="M21 5v7c0 1.657-4.03 3-9 3S3 13.657 3 12V5" stroke="currentColor" strokeWidth="1.5"/><path d="M21 12v7c0 1.657-4.03 3-9 3s-9-1.343-9-3v-7" stroke="currentColor" strokeWidth="1.5"/></svg>; }
function TFAIcon()       { return <svg width="18" height="18" viewBox="0 0 24 24" fill="none"><path d="M12 2L2 7l10 5 10-5-10-5zM2 17l10 5 10-5M2 12l10 5 10-5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/></svg>; }
function AuditIcon()     { return <svg width="18" height="18" viewBox="0 0 24 24" fill="none"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" stroke="currentColor" strokeWidth="1.5"/><polyline points="14 2 14 8 20 8" stroke="currentColor" strokeWidth="1.5"/><line x1="16" y1="13" x2="8" y2="13" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/><line x1="16" y1="17" x2="8" y2="17" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/></svg>; }
