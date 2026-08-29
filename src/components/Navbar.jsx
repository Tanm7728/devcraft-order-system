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
      <div className="max-w-6xl mx-auto px-5 sm:px-8">
        <div className="flex items-center justify-between h-14">

          {/* Logo */}
          <div className="flex items-center space-x-2.5">
            <div className="w-8 h-8 rounded-lg bg-slate-900 flex items-center justify-center text-white text-sm font-bold">
              K
            </div>
            <span className="text-lg font-semibold tracking-tight text-slate-900">
              KaamFlow
            </span>
            <span className="hidden sm:inline text-[10px] font-medium text-slate-400 border border-slate-200 rounded px-1.5 py-0.5">
              Dashboard
            </span>
          </div>

          {/* Right: status + tools */}
          <div className="flex items-center space-x-2">
            <div className="flex items-center space-x-1.5 text-xs text-slate-500">
              <span className={`w-1.5 h-1.5 rounded-full ${isOnline ? 'bg-emerald-500' : 'bg-amber-400'}`} />
              <span className="hidden sm:inline">{isOnline ? 'Online' : 'Offline'}</span>
            </div>

            <button
              onClick={onOpenConflict}
              className="p-1.5 rounded-md text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition text-xs cursor-pointer"
              title="Sync"
            >
              🔄
            </button>
            <button
              onClick={onOpenHealth}
              className="p-1.5 rounded-md text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition text-xs cursor-pointer"
              title="Analytics"
            >
              📊
            </button>
            <button
              onClick={onOpenBackup}
              className="p-1.5 rounded-md text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition text-xs cursor-pointer"
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
