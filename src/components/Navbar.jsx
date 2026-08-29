import { useState, useEffect } from 'react';

export default function Navbar() {
  const [scrolled, setScrolled] = useState(false);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 40);
    window.addEventListener('scroll', onScroll);
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  return (
    <header className={`fixed top-0 left-0 right-0 z-50 transition-all duration-300 ${
      scrolled ? 'bg-black/60 backdrop-blur-xl border-b border-white/5' : 'bg-transparent'
    }`}>
      <div className="max-w-7xl mx-auto px-6 md:px-10">
        <div className="flex items-center justify-between h-16">

          {/* Logo */}
          <a href="#top" className="flex items-center space-x-3">
            <div className="w-8 h-8 rounded-lg bg-blue-600 flex items-center justify-center text-white text-sm font-bold">
              K
            </div>
            <span className="text-lg font-semibold tracking-tight text-white">KaamFlow</span>
          </a>

          {/* Nav links */}
          <nav className="hidden md:flex items-center space-x-8 text-sm text-white/60">
            <a href="#top" className="hover:text-white transition">Home</a>
            <a href="#features" className="hover:text-white transition">Features</a>
            <a href="#app" className="hover:text-white transition">Try App</a>
          </nav>

          {/* CTA */}
          <a
            href="#app"
            className="px-4 py-1.5 rounded-lg border border-white/20 text-sm text-white/80 hover:text-white hover:border-white/40 transition"
          >
            Launch Dashboard →
          </a>
        </div>
      </div>
    </header>
  );
}
