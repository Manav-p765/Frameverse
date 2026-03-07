import { useRef } from 'react';
import { motion, useInView } from 'framer-motion';

const CALL_FEATURES = [
  { icon: <P2PIcon />, label: 'Peer-to-Peer', desc: 'Direct WebRTC data channels — no relay server needed when STUN resolves.' },
  { icon: <StunIcon />, label: 'STUN / TURN', desc: 'Full ICE candidate negotiation with TURN fallback for NAT traversal.' },
  { icon: <LatencyIcon />, label: 'Low Latency', desc: 'Optimized codec selection (VP8/Opus) for real-time developer collaboration.' },
  { icon: <InChatIcon />, label: 'In-Chat UI', desc: 'Start a video call from any conversation thread without leaving the page.' },
];

export default function VideoCallSection() {
  const ref = useRef(null);
  const inView = useInView(ref, { once: true, margin: '-80px' });

  return (
    <section id="video" ref={ref} className="py-24 md:py-32 px-6 max-w-page mx-auto">
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 lg:gap-18 items-center">

        {/* Mockup */}
        <motion.div initial={{ opacity: 0, x: -40 }} animate={inView ? { opacity: 1, x: 0 } : {}} transition={{ duration: 0.6, ease: 'easeOut' }}>
          <div className="bg-surface border border-white/16 rounded-[20px] overflow-hidden shadow-[0_40px_80px_rgba(0,0,0,0.5)]">
            {/* Title bar */}
            <div className="flex items-center gap-1.5 px-4 py-3 border-b border-white/10 bg-white/[0.02]">
              <span className="w-2.5 h-2.5 rounded-full bg-[#ff5f57]" />
              <span className="w-2.5 h-2.5 rounded-full bg-[#ffbc2e]" />
              <span className="w-2.5 h-2.5 rounded-full bg-[#28c840]" />
              <span className="ml-2 font-mono text-[11px] text-[#858585]">video_call.jsx</span>
            </div>

            {/* Video area */}
            <div className="relative h-64 bg-[#050505]">
              {/* Remote */}
              <div className="absolute inset-0 flex flex-col items-center justify-center gap-2 bg-gradient-to-br from-[#0a0a0a] to-[#141414]">
                <svg width="40" height="40" viewBox="0 0 24 24" fill="none" className="text-white/10">
                  <circle cx="12" cy="8" r="4" stroke="currentColor" strokeWidth="1.5" />
                  <path d="M4 20c0-4 3.6-7 8-7s8 3 8 7" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
                </svg>
                <span className="font-mono text-[11px] text-[#858585]">collaborator_01</span>
              </div>
              {/* PiP */}
              <div className="absolute bottom-3 right-3 w-[90px] h-[70px] rounded-xl border-2 border-white/16 bg-[#0d0d0d] flex flex-col items-center justify-center gap-1">
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" className="text-white/10">
                  <circle cx="12" cy="8" r="4" stroke="currentColor" strokeWidth="1.5" />
                  <path d="M4 20c0-4 3.6-7 8-7s8 3 8 7" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
                </svg>
                <span className="font-mono text-[9px] text-[#858585]">you</span>
              </div>
            </div>

            {/* Controls */}
            <div className="flex items-center justify-center gap-3 px-4 py-4 border-t border-white/10">
              {[<MicIcon />, null, <CameraIcon />].map((icon, i) =>
                icon === null ? (
                  <button key={i} className="flex items-center justify-center w-10 h-10 rounded-full bg-red-500 border-red-500 border">
                    <PhoneIcon />
                  </button>
                ) : (
                  <button key={i} className="flex items-center justify-center w-10 h-10 rounded-full border border-white/16 bg-white/[0.04] hover:bg-white/10 transition-colors text-white">
                    {icon}
                  </button>
                )
              )}
            </div>

            {/* Status */}
            <div className="flex items-center gap-2 px-4 py-2 font-mono text-[10px] text-[#858585] border-t border-white/10 bg-white/[0.01]">
              <span className="w-1.5 h-1.5 rounded-full bg-accent shadow-[0_0_6px_#d5ff45] animate-pulse-dot" />
              WebRTC · STUN resolved · 42ms RTT
            </div>
          </div>
        </motion.div>

        {/* Content */}
        <div>
          <motion.div initial={{ opacity: 0, y: 40 }} animate={inView ? { opacity: 1, y: 0 } : {}} transition={{ duration: 0.5 }}>
            <div className="inline-flex items-center gap-2 px-3.5 py-1.5 border border-white/10 rounded-full text-xs text-[#858585] mb-5">
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none"><polygon points="23 7 16 12 23 17 23 7" stroke="currentColor" strokeWidth="1.5" /><rect x="1" y="5" width="15" height="14" rx="2" stroke="currentColor" strokeWidth="1.5" /></svg>
              WebRTC Video Calls
            </div>
          </motion.div>

          <motion.h2 className="font-display text-[clamp(32px,4vw,52px)] font-normal tracking-[-0.03em] leading-tight mb-4"
            initial={{ opacity: 0, y: 40 }} animate={inView ? { opacity: 1, y: 0 } : {}} transition={{ duration: 0.5, delay: 0.1 }}>
            Ship together, <span className="text-[#858585]">face-to-face.</span>
          </motion.h2>

          <motion.p className="text-sm text-[#858585] leading-[1.75] mb-8"
            initial={{ opacity: 0, y: 30 }} animate={inView ? { opacity: 1, y: 0 } : {}} transition={{ duration: 0.5, delay: 0.15 }}>
            WebRTC-powered peer-to-peer video calling lives directly inside your chat window. No third-party apps, no context switching — just click call and connect instantly.
          </motion.p>

          <motion.div className="flex flex-col gap-5"
            initial={{ opacity: 0, y: 30 }} animate={inView ? { opacity: 1, y: 0 } : {}} transition={{ duration: 0.5, delay: 0.2 }}>
            {CALL_FEATURES.map((f) => (
              <div key={f.label} className="flex items-start gap-3">
                <div className="flex items-center justify-center w-7 h-7 shrink-0 border border-white/16 rounded-md text-accent mt-0.5">
                  {f.icon}
                </div>
                <div>
                  <div className="text-[14px] font-medium text-white mb-1">{f.label}</div>
                  <div className="text-[13px] text-[#858585] leading-relaxed">{f.desc}</div>
                </div>
              </div>
            ))}
          </motion.div>
        </div>
      </div>
    </section>
  );
}

function P2PIcon() { return <svg width="14" height="14" viewBox="0 0 24 24" fill="none"><circle cx="5" cy="12" r="3" stroke="currentColor" strokeWidth="1.5" /><circle cx="19" cy="12" r="3" stroke="currentColor" strokeWidth="1.5" /><path d="M8 12h8" stroke="currentColor" strokeWidth="1.5" /></svg>; }
function StunIcon() { return <svg width="14" height="14" viewBox="0 0 24 24" fill="none"><path d="M1 6v16l7-4 8 4 7-4V2l-7 4-8-4-7 4z" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" /></svg>; }
function LatencyIcon() { return <svg width="14" height="14" viewBox="0 0 24 24" fill="none"><path d="M13 2L3 14h9l-1 8 10-12h-9l1-8z" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" /></svg>; }
function InChatIcon() { return <svg width="14" height="14" viewBox="0 0 24 24" fill="none"><path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" /></svg>; }
function MicIcon() { return <svg width="16" height="16" viewBox="0 0 24 24" fill="none"><path d="M12 1a3 3 0 0 0-3 3v8a3 3 0 0 0 6 0V4a3 3 0 0 0-3-3z" stroke="currentColor" strokeWidth="1.5" /><path d="M19 10v2a7 7 0 0 1-14 0v-2M12 19v4M8 23h8" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" /></svg>; }
function PhoneIcon() { return <svg width="16" height="16" viewBox="0 0 24 24" fill="none"><path d="M23 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6A19.79 19.79 0 0 1 3.08 5a2 2 0 0 1 2-2h3a2 2 0 0 1 2 1.72c.127.96.361 1.903.7 2.81a2 2 0 0 1-.45 2.11L9.09 10.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45c.907.339 1.85.573 2.81.7A2 2 0 0 1 23 16.92z" stroke="white" strokeWidth="1.5" /></svg>; }
function CameraIcon() { return <svg width="16" height="16" viewBox="0 0 24 24" fill="none"><polygon points="23 7 16 12 23 17 23 7" stroke="currentColor" strokeWidth="1.5" /><rect x="1" y="5" width="15" height="14" rx="2" stroke="currentColor" strokeWidth="1.5" /></svg>; }
