import { Link } from 'react-router-dom';

const LINKS = {
  Platform: [{ label: 'Developer Feed', to: '/' }, { label: 'Messaging', to: '/chats' }, { label: 'Analytics', to: '/dashboard/analytics' }, { label: 'Video Calls', to: '/chats' }],
  Developers: [{ label: 'GitHub', href: 'https://github.com/Manav-p765/Frameverse' }, { label: 'API Docs', href: '#' }, { label: 'Changelog', href: '#' }, { label: 'Status', href: '#' }],
  Company: [{ label: 'About', href: '/#about' }, { label: 'Security', href: '/#security' }, { label: 'Privacy', href: '#' }, { label: 'Terms', href: '#' }],
};

export default function Footer() {
  const year = new Date().getFullYear();
  return (
    <footer className="border-t border-white/10 pt-16 pb-8 px-6 max-w-page mx-auto">
      <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-[1.6fr_1fr_1fr_1fr] gap-10 mb-12">
        {/* Brand */}
        <div className="col-span-2 md:col-span-1">
          <div className="flex items-center gap-2 mb-3">
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none">
              <path d="M4 4h16a2 2 0 0 1 2 2v10a2 2 0 0 1-2 2H8l-4 4V6a2 2 0 0 1 0-.2V4z" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
            <span className="font-display font-bold text-[16px] tracking-tight text-gradient-accent">Frameverse</span>
          </div>
          <p className="text-[13px] text-[#858585] leading-[1.7] mb-5">
            Real-time social platform for developers.<br />Built on the MERN stack.
          </p>
          <div className="flex gap-2">
            {[
              { label: 'GitHub', icon: <GitHubIcon />, href: 'https://github.com' },
              { label: 'X', icon: <XIcon />, href: 'https://twitter.com' },
              { label: 'Discord', icon: <DiscordIcon />, href: 'https://discord.com' },
            ].map(({ label, icon, href }) => (
              <a key={label} href={href} target="_blank" rel="noopener" aria-label={label}
                className="flex items-center justify-center w-8 h-8 border border-white/10 rounded-lg text-[#858585] hover:text-white hover:border-white/16 hover:bg-white/5 transition-all">
                {icon}
              </a>
            ))}
          </div>
        </div>

        {/* Link columns */}
        {Object.entries(LINKS).map(([group, links]) => (
          <div key={group}>
            <h4 className="text-[11px] font-semibold uppercase tracking-[0.08em] text-[#858585] mb-4">{group}</h4>
            <ul className="flex flex-col gap-2.5">
              {links.map(({ label, to, href }) => (
                <li key={label}>
                  {to
                    ? <Link to={to} className="text-[13px] text-[#858585] hover:text-white transition-colors">{label}</Link>
                    : <a href={href} className="text-[13px] text-[#858585] hover:text-white transition-colors" target={href?.startsWith('http') ? '_blank' : undefined} rel="noopener">{label}</a>
                  }
                </li>
              ))}
            </ul>
          </div>
        ))}
      </div>

      <div className="flex flex-col sm:flex-row items-center justify-between gap-3 pt-6 border-t border-white/10 text-[12px] text-[#858585]">
        <span>© {year} Frameverse. All rights reserved.</span>
        <div className="flex gap-5">
          {['Privacy', 'Terms', 'Cookies'].map(l => <a key={l} href="#" className="hover:text-white transition-colors">{l}</a>)}
        </div>
      </div>
    </footer>
  );
}

function GitHubIcon() { return <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor"><path d="M12 0C5.374 0 0 5.373 0 12c0 5.302 3.438 9.8 8.207 11.387.599.111.793-.261.793-.577v-2.234c-3.338.726-4.033-1.416-4.033-1.416-.546-1.387-1.333-1.756-1.333-1.756-1.089-.745.083-.729.083-.729 1.205.084 1.839 1.237 1.839 1.237 1.07 1.834 2.807 1.304 3.492.997.107-.775.418-1.305.762-1.604-2.665-.305-5.467-1.334-5.467-5.931 0-1.311.469-2.381 1.236-3.221-.124-.303-.535-1.524.117-3.176 0 0 1.008-.322 3.301 1.23A11.509 11.509 0 0 1 12 5.803c1.02.005 2.047.138 3.006.404 2.291-1.552 3.297-1.23 3.297-1.23.653 1.653.242 2.874.118 3.176.77.84 1.235 1.911 1.235 3.221 0 4.609-2.807 5.624-5.479 5.921.43.372.823 1.102.823 2.222v3.293c0 .319.192.694.801.576C20.566 21.797 24 17.3 24 12c0-6.627-5.373-12-12-12z" /></svg>; }
function XIcon() { return <svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor"><path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231 5.45-6.231zm-1.161 17.52h1.833L7.084 4.126H5.117L17.083 19.77z" /></svg>; }
function DiscordIcon() { return <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor"><path d="M20.317 4.37a19.791 19.791 0 0 0-4.885-1.515.074.074 0 0 0-.079.037c-.21.375-.444.864-.608 1.25a18.27 18.27 0 0 0-5.487 0 12.64 12.64 0 0 0-.617-1.25.077.077 0 0 0-.079-.037A19.736 19.736 0 0 0 3.677 4.37a.07.07 0 0 0-.032.027C.533 9.046-.32 13.58.099 18.057c.001.022.015.043.03.056a19.9 19.9 0 0 0 5.993 3.03.077.077 0 0 0 .084-.028c.462-.63.874-1.295 1.226-1.994a.076.076 0 0 0-.041-.106 13.107 13.107 0 0 1-1.872-.892.077.077 0 0 1-.008-.128 10.2 10.2 0 0 0 .372-.292.074.074 0 0 1 .077-.01c3.928 1.793 8.18 1.793 12.062 0a.074.074 0 0 1 .078.01c.12.098.246.198.373.292a.077.077 0 0 1-.006.127 12.299 12.299 0 0 1-1.873.892.077.077 0 0 0-.041.107c.36.698.772 1.362 1.225 1.993a.076.076 0 0 0 .084.028 19.839 19.839 0 0 0 6.002-3.03.077.077 0 0 0 .032-.054c.5-5.177-.838-9.674-3.549-13.66a.061.061 0 0 0-.031-.03z" /></svg>; }
