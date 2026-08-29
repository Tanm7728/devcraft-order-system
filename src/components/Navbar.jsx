import { useState, useEffect } from 'react';

export default function Navbar({ onOpenBackup, onOpenConflict, onOpenHealth }) {
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

  return (
    <header className="sticky top-0 z-40 bg-white border-b border-slate-200/60">
      <div className="max-w-[1600px] mx-auto px-4 md:px-8">
        <div className="flex items-center justify-between h-14">

          {/* Logo */}
          <div className="flex items-center space-x-3">
            <div className="w-9 h-9 rounded-lg bg-slate-900 flex items-center justify-center text-white text-base font-bold">
              K
            </div>
            <span className="text-xl font-semibold tracking-tight text-slate-900">
              KaamFlow
            </span>
            <span className="hidden sm:inline text-[10px] font-medium text-slate-400 border border-slate-200 rounded px-1.5 py-0.5">
              Dashboard
            </span>
          </div>

          {/* Right: status + tools */}
          <div className="flex items-center space-x-1.5">
            <div className="flex items-center space-x-1.5 text-xs text-slate-500 mr-2">
              <span className={`w-2 h-2 rounded-full ${isOnline ? 'bg-emerald-500' : 'bg-amber-400'}`} />
              <span className="hidden sm:inline">{isOnline ? 'Online' : 'Offline'}</span>
            </div>

            <button
              onClick={onOpenConflict}
              className="w-9 h-9 rounded-lg text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition flex items-center justify-center text-lg cursor-pointer"
              title="Sync"
            >
              🔄
            </button>
            <button
              onClick={onOpenHealth}
              className="w-9 h-9 rounded-lg text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition flex items-center justify-center text-lg cursor-pointer"
              title="Analytics"
            >
              📊
            </button>
            <button
              onClick={onOpenBackup}
              className="w-9 h-9 rounded-lg text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition flex items-center justify-center text-lg cursor-pointer"
              title="Backup"
            >
              💾
            </button>
          </div>

        </div>
      </div>
    </header>
  );
}
