import { Link, useLocation } from 'react-router-dom';

export default function BottomNav() {
  const location = useLocation();
  const path = location.pathname;

  // Don't show on login/signup or chat view (where we want full screen)
  if (['/login', '/signup'].includes(path) || path.startsWith('/chat/') || path.startsWith('/group/')) {
    return null;
  }

  return (
    <div className="absolute bottom-0 w-full bg-ghost-panel/95 backdrop-blur-xl border-t border-ghost-border flex flex-col z-50 pb-safe">
      <div className="flex justify-around items-center h-[60px] w-full">
        <Link to="/inbox" className={`flex flex-col items-center gap-1.5 w-full h-full justify-center transition-colors ${path === '/inbox' ? 'text-ghost-green' : 'text-ghost-muted hover:text-white'}`}>
          <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/></svg>
          <span className="text-[10px] font-mono tracking-wider">INBOX</span>
        </Link>
        <Link to="/search" className={`flex flex-col items-center gap-1.5 w-full h-full justify-center transition-colors ${path === '/search' ? 'text-ghost-green' : 'text-ghost-muted hover:text-white'}`}>
          <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/></svg>
          <span className="text-[10px] font-mono tracking-wider">SEARCH</span>
        </Link>
        <Link to="/profile" className={`flex flex-col items-center gap-1.5 w-full h-full justify-center transition-colors ${path === '/profile' ? 'text-ghost-green' : 'text-ghost-muted hover:text-white'}`}>
          <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/><circle cx="12" cy="7" r="4"/></svg>
          <span className="text-[10px] font-mono tracking-wider">PROFILE</span>
        </Link>
      </div>
      <div className="w-full text-center text-[10px] text-ghost-muted pb-1 font-mono">
        created with ❤️ by <a href="https://github.com/yeahbitchscience" target="_blank" rel="noreferrer" className="text-ghost-green hover:underline">sanskar</a>
      </div>
    </div>
  );
}
