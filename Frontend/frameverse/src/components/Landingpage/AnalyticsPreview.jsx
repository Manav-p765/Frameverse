import { useRef } from 'react';
import { motion, useInView } from 'framer-motion';

const BARS   = [40, 65, 50, 80, 70, 90, 75, 95, 85, 100, 88, 92];
const MONTHS = ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'];
const METRICS = [
  { label: 'Active Users',   value: '12.4K', delta: '+18%' },
  { label: 'Messages / Day', value: '87.2K', delta: '+31%' },
  { label: 'Post Reach',     value: '204K',  delta: '+24%' },
  { label: 'Avg. Latency',   value: '42ms',  delta: '-12ms' },
];

export default function AnalyticsPreview() {
  const ref = useRef(null);
  const inView = useInView(ref, { once: true, margin: '-80px' });

  return (
    <section id="analytics" ref={ref} className="py-24 md:py-32 px-6 max-w-page mx-auto">
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 lg:gap-20 items-center">

        {/* Left: content */}
        <div>
          <motion.div initial={{ opacity: 0, y: 40 }} animate={inView ? { opacity: 1, y: 0 } : {}} transition={{ duration: 0.5 }}>
            <div className="inline-flex items-center gap-2 px-3.5 py-1.5 border border-white/10 rounded-full text-xs text-[#858585] mb-5">
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none"><path d="M18 20V10M12 20V4M6 20v-6" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/></svg>
              Analytics Dashboard
            </div>
          </motion.div>

          <motion.h2 className="font-display text-[clamp(32px,4vw,52px)] font-normal tracking-[-0.03em] leading-tight mb-4"
            initial={{ opacity: 0, y: 40 }} animate={inView ? { opacity: 1, y: 0 } : {}} transition={{ duration: 0.5, delay: 0.1 }}>
            Track your developer <span className="text-[#858585]">impact at scale.</span>
          </motion.h2>

          <motion.p className="text-sm text-[#858585] leading-[1.75] mb-8"
            initial={{ opacity: 0, y: 30 }} animate={inView ? { opacity: 1, y: 0 } : {}} transition={{ duration: 0.5, delay: 0.15 }}>
            Frameverse's analytics dashboard gives you deep visibility into user growth, message activity, and post engagement — all updated in real-time from the same Socket.io pipeline.
          </motion.p>

          <motion.div className="grid grid-cols-2 gap-3"
            initial={{ opacity: 0, y: 30 }} animate={inView ? { opacity: 1, y: 0 } : {}} transition={{ duration: 0.5, delay: 0.2 }}>
            {METRICS.map((m) => (
              <div key={m.label} className="flex flex-col gap-1 p-4 bg-surface border border-white/10 rounded-2xl">
                <span className="font-display text-2xl font-bold tracking-tight text-white">{m.value}</span>
                <span className="text-xs font-medium text-accent">{m.delta}</span>
                <span className="text-xs text-[#858585]">{m.label}</span>
              </div>
            ))}
          </motion.div>
        </div>

        {/* Right: chart card */}
        <motion.div initial={{ opacity: 0, x: 40 }} animate={inView ? { opacity: 1, x: 0 } : {}} transition={{ duration: 0.6, ease: 'easeOut', delay: 0.15 }}>
          <div className="bg-surface border border-white/16 rounded-[20px] overflow-hidden">
            {/* Header */}
            <div className="flex items-center justify-between px-5 py-4 border-b border-white/10">
              <span className="text-[14px] font-medium text-white">User Growth</span>
              <div className="flex gap-1">
                {['30d','90d','1y'].map((p, i) => (
                  <button key={p} className={`px-2.5 py-1 text-[11px] rounded-md border transition-colors ${i === 0 ? 'bg-white/8 border-white/16 text-white' : 'border-transparent text-[#858585] hover:bg-white/5'}`}>
                    {p}
                  </button>
                ))}
              </div>
            </div>

            {/* Bars */}
            <div className="px-5 pt-6 pb-3">
              <div className="flex items-end gap-1.5 h-40">
                {BARS.map((h, i) => (
                  <motion.div key={i}
                    className="flex-1 bg-gradient-to-t from-accent to-accent/30 rounded-t chart-bar"
                    style={{ '--bar-h': `${h}%` }}
                    initial={{ scaleY: 0 }}
                    animate={inView ? { scaleY: 1 } : {}}
                    transition={{ delay: 0.3 + i * 0.04, duration: 0.4, ease: 'easeOut' }}
                  />
                ))}
              </div>
              <div className="flex gap-1.5 mt-2">
                {MONTHS.map((m) => (
                  <span key={m} className="flex-1 text-center text-[9px] text-[#858585]">{m}</span>
                ))}
              </div>
            </div>

            {/* Live indicator */}
            <div className="flex items-center gap-2 px-5 py-2.5 font-mono text-[11px] text-[#858585] border-t border-white/10 bg-white/[0.01]">
              <span className="w-1.5 h-1.5 rounded-full bg-accent shadow-[0_0_6px_#d5ff45] animate-pulse-dot" />
              Live data · updated 2s ago
            </div>
          </div>
        </motion.div>
      </div>
    </section>
  );
}
