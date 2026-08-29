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
    { id: 'all', label: 'All Orders', icon: '🌐' },
    { id: 'tailor', label: 'Tailor', icon: '🧵' },
    { id: 'tiffin', label: 'Tiffin', icon: '🍱' },
    { id: 'electrician', label: 'Electrician', icon: '⚡' },
    { id: 'baker', label: 'Baker', icon: '🎂' },
    { id: 'custom', label: 'Custom', icon: '📦' },
  ];

  return (
    <header className="sticky top-0 z-40 bg-white/95 backdrop-blur-md border-b border-slate-200 shadow-xs">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          
          {/* Brand Logo & Offline Status */}
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-amber-500 to-orange-500 flex items-center justify-center shadow-md shadow-amber-500/20 text-xl font-black text-white">
              ⚡
            </div>
            <div>
              <div className="flex items-center space-x-2">
                <span className="text-xl font-black tracking-tight text-slate-900">
                  Kaam<span className="text-amber-600">Flow</span>
                </span>
                <span className="hidden sm:inline-block text-[10px] uppercase tracking-wider font-extrabold px-2 py-0.5 rounded-md bg-amber-50 text-amber-700 border border-amber-200/80">
                  Offline-First
                </span>
              </div>
              <p className="text-xs text-slate-500 font-medium">Smart Order Intake & Sync Engine</p>
            </div>
          </div>

          {/* Domain Filter Pills */}
          <nav className="hidden md:flex items-center space-x-1 bg-slate-100 p-1 rounded-xl border border-slate-200">
            {domains.map((dom) => (
              <button
                key={dom.id}
                onClick={() => setSelectedDomain(dom.id)}
                className={`flex items-center space-x-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition-all duration-150 cursor-pointer ${
                  selectedDomain === dom.id
                    ? 'bg-white text-slate-900 shadow-xs font-bold border border-slate-200/60'
                    : 'text-slate-600 hover:text-slate-900 hover:bg-white/60'
                }`}
              >
                <span>{dom.icon}</span>
                <span>{dom.label}</span>
              </button>
            ))}
          </nav>

          {/* Action Tools & Connectivity Indicator */}
          <div className="flex items-center space-x-2 sm:space-x-2.5">
            {/* Offline Status Badge */}
            <div className="flex items-center space-x-1.5 px-2.5 py-1 rounded-full bg-slate-100 border border-slate-200 text-xs">
              <span className={`w-2 h-2 rounded-full ${isOnline ? 'bg-emerald-500' : 'bg-amber-500'}`} />
              <span className="text-slate-700 font-semibold hidden sm:inline">
                {isOnline ? 'IndexedDB Active' : 'Offline Mode'}
              </span>
            </div>

            {/* Sync Conflict Demo Trigger */}
            <button
              onClick={onOpenConflict}
              className="flex items-center space-x-1 px-3 py-1.5 rounded-lg bg-indigo-50 hover:bg-indigo-100 border border-indigo-200 text-indigo-700 text-xs font-bold transition cursor-pointer shadow-2xs"
              title="Test Deterministic Sync & Conflict Resolution"
            >
              <span>🔄</span>
              <span className="hidden sm:inline">Sync CRDT</span>
            </button>

            {/* Analytics Modal */}
            <button
              onClick={onOpenHealth}
              className="flex items-center space-x-1 px-3 py-1.5 rounded-lg bg-emerald-50 hover:bg-emerald-100 border border-emerald-200 text-emerald-700 text-xs font-bold transition cursor-pointer shadow-2xs"
              title="Business Analytics & Revenue Breakdown"
            >
              <span>📊</span>
              <span className="hidden sm:inline">Analytics</span>
            </button>

            {/* 1-Click Backup / Restore */}
            <button
              onClick={onOpenBackup}
              className="p-2 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-700 border border-slate-200 text-xs transition cursor-pointer"
              title="1-Click JSON Backup & Restore"
            >
              💾
            </button>

            {/* Demo Data Seeder */}
            {ordersCount === 0 && (
              <button
                onClick={onSeedData}
                className="px-3.5 py-1.5 rounded-lg bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-600 hover:to-orange-600 text-white font-extrabold text-xs shadow-sm shadow-amber-500/30 transition cursor-pointer"
              >
                ✨ Load Demo Data
              </button>
            )}
          </div>

        </div>

        {/* Mobile Domain Selector */}
        <div className="flex md:hidden overflow-x-auto py-2 space-x-1 border-t border-slate-200">
          {domains.map((dom) => (
            <button
              key={dom.id}
              onClick={() => setSelectedDomain(dom.id)}
              className={`flex items-center space-x-1 px-3 py-1 rounded-lg text-xs whitespace-nowrap font-medium transition cursor-pointer ${
                selectedDomain === dom.id
                  ? 'bg-amber-500 text-white font-bold'
                  : 'text-slate-600 bg-slate-100 border border-slate-200'
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
