export default function OperationalInsights({
  metrics,
  onFilterDueToday,
  onFilterOverdue,
  onOpenCustomerLookup,
  onOpenReceivablesModal,
}) {
  const { dueAndOverdue, receivables, capacity } = metrics;

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
      
      {/* Widget 1: Due Today & Overdue */}
      <div className="bg-slate-900/90 border border-slate-800 hover:border-slate-700 rounded-2xl p-4 shadow-sm transition-all relative overflow-hidden group">
        <div className="absolute top-0 left-0 w-1 h-full bg-amber-500" />
        <div className="flex items-start justify-between">
          <div>
            <span className="text-[11px] font-semibold tracking-wider text-slate-400 uppercase">
              Operational Focus
            </span>
            <h3 className="text-base font-bold text-slate-100 flex items-center space-x-1.5 mt-0.5">
              <span>📅</span>
              <span>Due Today & Overdue</span>
            </h3>
          </div>
          <span className="p-1.5 rounded-lg bg-amber-500/10 text-amber-400 text-sm">
            {dueAndOverdue.todayDate || 'Today'}
          </span>
        </div>

        <div className="mt-3 flex items-center justify-between">
          <button
            onClick={onFilterDueToday}
            className="flex-1 bg-amber-500/10 hover:bg-amber-500/20 border border-amber-500/30 rounded-xl p-2.5 mr-2 text-left transition group/btn cursor-pointer"
          >
            <div className="text-2xl font-black text-amber-400">
              {dueAndOverdue.dueTodayCount}
            </div>
            <div className="text-[11px] font-medium text-slate-300 flex items-center justify-between">
              <span>Due Today</span>
              <span className="opacity-0 group-hover/btn:opacity-100 text-amber-300">→</span>
            </div>
          </button>

          <button
            onClick={onFilterOverdue}
            className={`flex-1 rounded-xl p-2.5 text-left transition border group/btn cursor-pointer ${
              dueAndOverdue.overdueCount > 0
                ? 'bg-rose-500/15 hover:bg-rose-500/25 border-rose-500/40 text-rose-300'
                : 'bg-slate-800/50 border-slate-700/50 text-slate-400'
            }`}
          >
            <div className={`text-2xl font-black ${dueAndOverdue.overdueCount > 0 ? 'text-rose-400' : 'text-slate-400'}`}>
              {dueAndOverdue.overdueCount}
            </div>
            <div className="text-[11px] font-medium flex items-center justify-between">
              <span>Overdue</span>
              <span className="opacity-0 group-hover/btn:opacity-100 text-rose-300">→</span>
            </div>
          </button>
        </div>
      </div>

      {/* Widget 2: Unpaid Receivables */}
      <div className="bg-slate-900/90 border border-slate-800 hover:border-slate-700 rounded-2xl p-4 shadow-sm transition-all relative overflow-hidden">
        <div className="absolute top-0 left-0 w-1 h-full bg-emerald-500" />
        <div className="flex items-start justify-between">
          <div>
            <span className="text-[11px] font-semibold tracking-wider text-slate-400 uppercase">
              Financial Status
            </span>
            <h3 className="text-base font-bold text-slate-100 flex items-center space-x-1.5 mt-0.5">
              <span>💰</span>
              <span>Unpaid Receivables</span>
            </h3>
          </div>
          <span className="p-1.5 rounded-lg bg-emerald-500/10 text-emerald-400 text-xs font-bold">
            {receivables.debtorCount} Clients
          </span>
        </div>

        <div className="mt-3">
          <div className="text-2xl font-black text-emerald-400">
            ₹{receivables.totalUnpaidAmount.toLocaleString('en-IN')}
          </div>
          <div className="flex items-center justify-between mt-1">
            <span className="text-[11px] text-slate-400">Total Outstanding Balance</span>
            <button
              onClick={onOpenReceivablesModal}
              className="text-xs font-bold text-emerald-400 hover:text-emerald-300 underline underline-offset-2 flex items-center space-x-1 cursor-pointer"
            >
              <span>View List</span>
              <span>→</span>
            </button>
          </div>
        </div>
      </div>

      {/* Widget 3: Customer History Lookup */}
      <div className="bg-slate-900/90 border border-slate-800 hover:border-slate-700 rounded-2xl p-4 shadow-sm transition-all relative overflow-hidden">
        <div className="absolute top-0 left-0 w-1 h-full bg-sky-500" />
        <div className="flex items-start justify-between">
          <div>
            <span className="text-[11px] font-semibold tracking-wider text-slate-400 uppercase">
              Client Memory
            </span>
            <h3 className="text-base font-bold text-slate-100 flex items-center space-x-1.5 mt-0.5">
              <span>🔍</span>
              <span>Past Order Lookup</span>
            </h3>
          </div>
          <span className="p-1.5 rounded-lg bg-sky-500/10 text-sky-400 text-xs font-bold">
            Specs & Naap
          </span>
        </div>

        <div className="mt-3">
          <p className="text-xs text-slate-300 line-clamp-1">
            Instant repeat customer measurements, fabric, & preferences.
          </p>
          <button
            onClick={onOpenCustomerLookup}
            className="w-full mt-2.5 px-3 py-2 rounded-xl bg-sky-500/10 hover:bg-sky-500/20 border border-sky-500/30 text-sky-300 font-bold text-xs flex items-center justify-center space-x-1.5 transition shadow-sm cursor-pointer"
          >
            <span>🔎</span>
            <span>Search Customer History</span>
          </button>
        </div>
      </div>

      {/* Widget 4: Committed Weekly Capacity */}
      <div className="bg-slate-900/90 border border-slate-800 hover:border-slate-700 rounded-2xl p-4 shadow-sm transition-all relative overflow-hidden">
        <div className="absolute top-0 left-0 w-1 h-full bg-purple-500" />
        <div className="flex items-start justify-between">
          <div>
            <span className="text-[11px] font-semibold tracking-wider text-slate-400 uppercase">
              Workload Meter
            </span>
            <h3 className="text-base font-bold text-slate-100 flex items-center space-x-1.5 mt-0.5">
              <span>⚡</span>
              <span>Weekly Capacity</span>
            </h3>
          </div>
          <span className={`px-2 py-0.5 rounded-full text-xs font-extrabold ${
            capacity.utilizationPercent > 85 ? 'bg-rose-500/20 text-rose-300' : 'bg-purple-500/20 text-purple-300'
          }`}>
            {capacity.utilizationPercent}% Load
          </span>
        </div>

        <div className="mt-3">
          <div className="flex items-baseline justify-between text-xs mb-1">
            <span className="font-bold text-slate-200">
              <span className="text-xl font-black text-purple-400">{capacity.totalItemsCommitted}</span> / {capacity.maxCapacity} items
            </span>
            <span className="text-slate-400">{capacity.activeOrderCount} Active Orders</span>
          </div>

          {/* Progress Bar */}
          <div className="w-full bg-slate-800 rounded-full h-2 overflow-hidden">
            <div
              className={`h-full rounded-full transition-all duration-500 ${
                capacity.utilizationPercent > 85
                  ? 'bg-gradient-to-r from-amber-500 to-rose-500'
                  : 'bg-gradient-to-r from-purple-500 to-indigo-500'
              }`}
              style={{ width: `${capacity.utilizationPercent}%` }}
            />
          </div>

          {/* Day Mini Distribution */}
          <div className="flex justify-between items-center mt-2 text-[10px] text-slate-400 font-mono">
            {Object.entries(capacity.dailyBreakdown || {}).map(([day, cnt]) => (
              <span key={day} className={cnt > 0 ? 'text-purple-300 font-bold' : 'text-slate-600'}>
                {day}:{cnt}
              </span>
            ))}
          </div>
        </div>
      </div>

    </div>
  );
}
