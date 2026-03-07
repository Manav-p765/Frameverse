import { Link } from 'react-router-dom';

const LINKS = {
  Platform: [{ label: 'Developer Feed', to: '/' }, { label: 'Messaging', to: '/chats' }, { label: 'Analytics', to: '/dashboard/analytics' }],
  Developers: [{ label: 'GitHub', href: 'https://github.com/Manav-p765/Frameverse' }, { label: 'API Docs', href: 'https://github.com/Manav-p765/Frameverse/blob/main/Docs/frameverse-api-docs.md' }, { label: 'README', href: 'https://github.com/Manav-p765/Frameverse/blob/main/README.md' }],
  Company: [{ label: 'Privacy', href: '/privacy' }, { label: 'Terms', href: '/terms' }],
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
              { label: 'GitHub', icon: <GitHubIcon />, href: 'https://github.com/Manav-p765' },
              { label: 'X', icon: <XIcon />, href: 'https://x.com/manavparih31631' },
              { label: 'Instagram', icon: <InstagramIcon />, href: 'https://www.instagram.com/_manav__p/' },
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
          {['Privacy', 'Terms'  ].map(l => <a key={l} href={l === 'Privacy' ? '/privacy' : '/terms'} className="hover:text-white transition-colors">{l}</a>)}
        </div>
      </div>
    </footer>
  );
}

function GitHubIcon() { return <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor"><path d="M12 0C5.374 0 0 5.373 0 12c0 5.302 3.438 9.8 8.207 11.387.599.111.793-.261.793-.577v-2.234c-3.338.726-4.033-1.416-4.033-1.416-.546-1.387-1.333-1.756-1.333-1.756-1.089-.745.083-.729.083-.729 1.205.084 1.839 1.237 1.839 1.237 1.07 1.834 2.807 1.304 3.492.997.107-.775.418-1.305.762-1.604-2.665-.305-5.467-1.334-5.467-5.931 0-1.311.469-2.381 1.236-3.221-.124-.303-.535-1.524.117-3.176 0 0 1.008-.322 3.301 1.23A11.509 11.509 0 0 1 12 5.803c1.02.005 2.047.138 3.006.404 2.291-1.552 3.297-1.23 3.297-1.23.653 1.653.242 2.874.118 3.176.77.84 1.235 1.911 1.235 3.221 0 4.609-2.807 5.624-5.479 5.921.43.372.823 1.102.823 2.222v3.293c0 .319.192.694.801.576C20.566 21.797 24 17.3 24 12c0-6.627-5.373-12-12-12z" /></svg>; }
function XIcon() { return <svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor"><path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231 5.45-6.231zm-1.161 17.52h1.833L7.084 4.126H5.117L17.083 19.77z" /></svg>; }
function InstagramIcon() { return ( <svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor"> <path d="M7.75 2C4.574 2 2 4.574 2 7.75v8.5C2 19.426 4.574 22 7.75 22h8.5C19.426 22 22 19.426 22 16.25v-8.5C22 4.574 19.426 2 16.25 2h-8.5zm0 2h8.5C18.216 4 20 5.784 20 7.75v8.5C20 18.216 18.216 20 16.25 20h-8.5C5.784 20 4 18.216 4 16.25v-8.5C4 5.784 5.784 4 7.75 4zm4.25 3a5 5 0 100 10 5 5 0 000-10zm0 2a3 3 0 110 6 3 3 0 010-6zm4.75-.9a1.15 1.15 0 100 2.3 1.15 1.15 0 000-2.3z"/> </svg> ); }