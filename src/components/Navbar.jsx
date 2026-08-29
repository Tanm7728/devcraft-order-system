import { useState, useEffect } from 'react';

export default function Navbar({
  selectedDomain,
  setSelectedDomain,
  onOpenBackup,
  onOpenConflict,
  onOpenHealth,
  onSeedData,
  ordersCount,
}) {
  const [isOnline, setIsOnline] = useState(navigator.onLine);

  useEffect(() => {
    const handleOnline = () => setIsOnline(true);
    const handleOffline = () => setIsOnline(false);
    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);
    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);

  const domains = [
    { id: 'all', label: 'All Domains', icon: '🌐' },
    { id: 'tailor', label: 'Tailor', icon: '🧵' },
    { id: 'tiffin', label: 'Tiffin', icon: '🍱' },
    { id: 'electrician', label: 'Electrician', icon: '⚡' },
    { id: 'baker', label: 'Baker', icon: '🎂' },
  ];

  return (
    <header className="sticky top-0 z-40 bg-slate-900/90 backdrop-blur-md border-b border-slate-800 shadow-lg">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          
          {/* Logo & Offline Status */}
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-amber-500 to-orange-500 flex items-center justify-center shadow-lg shadow-amber-500/20 text-xl font-black text-slate-950">
              ⚡
            </div>
            <div>
              <div className="flex items-center space-x-2">
                <span className="text-xl font-bold tracking-tight bg-gradient-to-r from-amber-400 via-orange-300 to-amber-200 bg-clip-text text-transparent">
                  KaamFlow
                </span>
                <span className="hidden sm:inline-block text-[10px] uppercase tracking-wider font-extrabold px-1.5 py-0.5 rounded bg-amber-500/20 text-amber-300 border border-amber-500/30">
                  Offline-First
                </span>
              </div>
              <p className="text-xs text-slate-400 font-medium">Smart Order Intake & Sync Engine</p>
            </div>
          </div>

          {/* Domain Filter Pills */}
          <nav className="hidden md:flex items-center space-x-1 bg-slate-950/80 p-1 rounded-xl border border-slate-800">
            {domains.map((dom) => (
              <button
                key={dom.id}
                onClick={() => setSelectedDomain(dom.id)}
                className={`flex items-center space-x-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition-all duration-150 cursor-pointer ${
                  selectedDomain === dom.id
                    ? 'bg-amber-500 text-slate-950 shadow-md font-bold'
                    : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/60'
                }`}
              >
                <span>{dom.icon}</span>
                <span>{dom.label}</span>
              </button>
            ))}
          </nav>

          {/* Action Tools & Connectivity Indicator */}
          <div className="flex items-center space-x-2 sm:space-x-3">
            {/* Offline Status Badge */}
            <div className="flex items-center space-x-1.5 px-2.5 py-1 rounded-full bg-slate-800 border border-slate-700 text-xs">
              <span className={`w-2 h-2 rounded-full ${isOnline ? 'bg-emerald-400 animate-pulse' : 'bg-amber-400'}`} />
              <span className="text-slate-300 font-medium hidden sm:inline">
                {isOnline ? 'IndexedDB + Net' : '100% Offline'}
              </span>
            </div>

            {/* Sync Conflict Demo Trigger */}
            <button
              onClick={onOpenConflict}
              className="flex items-center space-x-1 px-2.5 py-1.5 rounded-lg bg-indigo-500/10 hover:bg-indigo-500/20 border border-indigo-500/30 text-indigo-300 text-xs font-semibold transition cursor-pointer"
              title="Test Deterministic Sync & Conflict Resolution"
            >
              <span>🔄</span>
              <span className="hidden sm:inline">Sync CRDT</span>
            </button>

            {/* Analytics Modal */}
            <button
              onClick={onOpenHealth}
              className="flex items-center space-x-1 px-2.5 py-1.5 rounded-lg bg-emerald-500/10 hover:bg-emerald-500/20 border border-emerald-500/30 text-emerald-300 text-xs font-semibold transition cursor-pointer"
              title="Business Analytics & Revenue Breakdown"
            >
              <span>📊</span>
              <span className="hidden sm:inline">Analytics</span>
            </button>

            {/* 1-Click Backup / Restore */}
            <button
              onClick={onOpenBackup}
              className="p-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white border border-slate-700 text-xs transition cursor-pointer"
              title="1-Click JSON Backup & Restore"
            >
              💾
            </button>

            {/* Demo Data Seeder */}
            {ordersCount === 0 && (
              <button
                onClick={onSeedData}
                className="px-3 py-1.5 rounded-lg bg-gradient-to-r from-amber-500 to-orange-600 hover:from-amber-400 hover:to-orange-500 text-slate-950 font-bold text-xs shadow-md shadow-amber-500/20 transition cursor-pointer"
              >
                ✨ Load Demo Data
              </button>
            )}
          </div>

        </div>

        {/* Mobile Domain Selector */}
        <div className="flex md:hidden overflow-x-auto py-2 space-x-1 border-t border-slate-800/80">
          {domains.map((dom) => (
            <button
              key={dom.id}
              onClick={() => setSelectedDomain(dom.id)}
              className={`flex items-center space-x-1 px-2.5 py-1 rounded-lg text-xs whitespace-nowrap font-medium transition cursor-pointer ${
                selectedDomain === dom.id
                  ? 'bg-amber-500 text-slate-950 font-bold'
                  : 'text-slate-400 bg-slate-900 border border-slate-800'
              }`}
            >
              <span>{dom.icon}</span>
              <span>{dom.label}</span>
            </button>
          ))}
        </div>

      </div>
    </header>
  );
}
