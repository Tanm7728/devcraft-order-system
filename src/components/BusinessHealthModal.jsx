import { useState, useEffect } from 'react';
import { getBusinessHealthAnalytics } from '../db/ordersDb';

export default function BusinessHealthModal({ isOpen, onClose }) {
  const [analytics, setAnalytics] = useState(null);

  useEffect(() => {
    if (isOpen) {
      getBusinessHealthAnalytics().then(setAnalytics);
    }
  }, [isOpen]);

  if (!isOpen || !analytics) return null;

  const domainIcons = {
    tailor: '🧵 Tailor',
    tiffin: '🍱 Tiffin',
    electrician: '⚡ Electrician',
    baker: '🎂 Baker',
    general: '📦 General',
  };

  const domainColors = {
    tailor: 'bg-amber-500',
    tiffin: 'bg-orange-500',
    electrician: 'bg-sky-500',
    baker: 'bg-pink-500',
    general: 'bg-purple-500',
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4">
      <div className="bg-slate-900 border border-slate-700 rounded-2xl max-w-lg w-full p-6 shadow-2xl space-y-5">
        
        {/* Header */}
        <div className="flex items-center justify-between border-b border-slate-800 pb-3">
          <div className="flex items-center space-x-2">
            <span className="w-8 h-8 rounded-lg bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 flex items-center justify-center font-bold">
              📊
            </span>
            <div>
              <h3 className="text-base font-bold text-slate-100">
                Business Health & Revenue Analytics
              </h3>
              <p className="text-xs text-slate-400">
                Single-Operator Performance Overview
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="text-slate-400 hover:text-white text-lg font-bold"
          >
            ✕
          </button>
        </div>

        {/* Revenue Summary Cards */}
        <div className="grid grid-cols-3 gap-2.5 text-center">
          <div className="bg-slate-950 p-3 rounded-xl border border-slate-800">
            <span className="text-[10px] uppercase font-semibold text-slate-400 block">Total Pipeline</span>
            <div className="text-lg font-black text-slate-100 mt-1 font-mono">
              ₹{analytics.totalRevenue.toLocaleString('en-IN')}
            </div>
          </div>
          <div className="bg-slate-950 p-3 rounded-xl border border-slate-800">
            <span className="text-[10px] uppercase font-semibold text-slate-400 block">Collected Cash</span>
            <div className="text-lg font-black text-emerald-400 mt-1 font-mono">
              ₹{analytics.collectedRevenue.toLocaleString('en-IN')}
            </div>
          </div>
          <div className="bg-slate-950 p-3 rounded-xl border border-slate-800">
            <span className="text-[10px] uppercase font-semibold text-slate-400 block">Pending Debt</span>
            <div className="text-lg font-black text-rose-400 mt-1 font-mono">
              ₹{analytics.pendingRevenue.toLocaleString('en-IN')}
            </div>
          </div>
        </div>

        {/* Revenue by Domain Breakdown */}
        <div>
          <label className="text-[11px] font-semibold uppercase tracking-wider text-slate-400 block mb-2">
            Revenue by Service Category:
          </label>
          <div className="space-y-2">
            {Object.entries(analytics.domainRevenue).map(([dom, rev]) => {
              const pct = analytics.totalRevenue > 0 ? Math.round((rev / analytics.totalRevenue) * 100) : 0;
              return (
                <div key={dom} className="bg-slate-950 p-2.5 rounded-xl border border-slate-800 text-xs">
                  <div className="flex items-center justify-between mb-1.5 font-semibold">
                    <span className="text-slate-200">{domainIcons[dom] || dom}</span>
                    <div className="space-x-2 font-mono">
                      <span className="text-slate-400">{pct}%</span>
                      <strong className="text-slate-100">₹{rev.toLocaleString('en-IN')}</strong>
                    </div>
                  </div>
                  <div className="w-full bg-slate-800 rounded-full h-1.5 overflow-hidden">
                    <div
                      className={`h-full ${domainColors[dom] || 'bg-amber-500'}`}
                      style={{ width: `${pct}%` }}
                    />
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Status Distribution */}
        <div>
          <label className="text-[11px] font-semibold uppercase tracking-wider text-slate-400 block mb-2">
            Order Status Volume:
          </label>
          <div className="grid grid-cols-4 gap-2 text-center text-xs">
            {Object.entries(analytics.statusCounts).map(([st, cnt]) => (
              <div key={st} className="bg-slate-950 p-2 rounded-lg border border-slate-800">
                <div className="font-bold text-slate-200">{cnt}</div>
                <div className="text-[10px] text-slate-500 mt-0.5">{st}</div>
              </div>
            ))}
          </div>
        </div>

        <div className="flex justify-end pt-3 border-t border-slate-800">
          <button
            onClick={onClose}
            className="px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 font-bold text-xs"
          >
            Close
          </button>
        </div>

      </div>
    </div>
  );
}
