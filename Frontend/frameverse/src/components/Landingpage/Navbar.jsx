import { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import AnimatedLogo from '../AnimatedLogo';

const NAV_LINKS = [
  { label: 'About', href: '/#about' },
  { label: 'Features', href: '/#features' },
  { label: 'Real-Time', href: '/#realtime' },
  { label: 'Security', href: '/#security' },
];

export default function Navbar() {
  const [scrolled, setScrolled] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);
  const navigate = useNavigate();

  useEffect(() => {
    const h = () => setScrolled(window.scrollY > 20);
    window.addEventListener('scroll', h, { passive: true });
    return () => window.removeEventListener('scroll', h);
  }, []);

  const anchor = (e, href) => {
    if (!href.startsWith('/#')) return;
    e.preventDefault();
    document.getElementById(href.slice(2))?.scrollIntoView({ behavior: 'smooth' });
    setMenuOpen(false);
  };

  return (
    <motion.nav
      className={`fixed top-0 left-1/2 -translate-x-1/2 w-full max-w-page z-50 px-6 py-4 transition-all duration-300 ${scrolled ? 'bg-[#0a0a0a]/85 backdrop-blur-lg border-b border-white/10' : ''
        }`}
      initial={{ y: -20, opacity: 0 }}
      animate={{ y: 0, opacity: 1 }}
      transition={{ duration: 0.5, ease: 'easeOut' }}
    >
      <div className="flex items-center justify-between gap-6">
        <Link to="/" className="flex items-center gap-2 shrink-0">
          <AnimatedLogo className="w-40" />
        </Link>

        <div className="hidden md:flex items-center gap-1">
          {NAV_LINKS.map(({ label, href }) => (
            <a key={label} href={href} onClick={(e) => anchor(e, href)}
              className={`px-3 py-1.5 text-sm rounded-md hover:text-white hover:bg-white/5 transition-colors ${scrolled ? 'text-[#666666]' : 'text-white/80'
                }`}>
              {label}
            </a>
          ))}
        </div>

        <div className="hidden md:flex items-center gap-2">
          <button onClick={() => navigate('/auth')}
            className="px-4 py-2 text-[13px] font-medium text-white border border-white/16 rounded-full hover:bg-white/5 hover:border-white/30 transition-all">
            Sign In
          </button>
          <button onClick={() => navigate('/auth')}
            className="px-4 py-2 text-[13px] font-medium text-white/80 bg-accent border-2 border-white/20 rounded-full hover:shadow-[0_0_20px_4px_rgba(213,255,69,0.2)] hover:-translate-y-px transition-all">
            Get Started
          </button>
        </div>

        <button className="md:hidden flex flex-col gap-[5px] p-2" onClick={() => setMenuOpen(v => !v)} aria-label="menu">
          <span className={`block w-5 h-0.5 bg-white rounded transition-all duration-200 origin-center ${menuOpen ? 'rotate-45 translate-y-[7px]' : ''}`} />
          <span className={`block w-5 h-0.5 bg-white rounded transition-all duration-200 origin-center ${menuOpen ? '-rotate-45 -translate-y-[7px]' : ''}`} />
        </button>
      </div>

      <AnimatePresence>
        {menuOpen && (
          <motion.div className="md:hidden mt-2 flex flex-col gap-1 p-4 bg-surface border border-white/10 rounded-2xl"
            initial={{ opacity: 0, y: -8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -8 }} transition={{ duration: 0.18 }}>
            {NAV_LINKS.map(({ label, href }) => (
              <a key={label} href={href} onClick={(e) => anchor(e, href)}
                className={`px-4 py-3 text-[15px] rounded-lg hover:bg-white/5 hover:text-white transition-colors ${scrolled ? 'text-[#666666]' : 'text-white/80'
                  }`}>
                {label}
              </a>
            ))}
            <button onClick={() => { navigate('/auth'); setMenuOpen(false); }}
              className="mt-2 w-full py-3 text-sm font-medium text-[#0f0f0f] bg-accent rounded-full">
              Get Started
            </button>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.nav>
  );
}
