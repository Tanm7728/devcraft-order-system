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
      <div className="bg-white border border-slate-200/90 hover:border-amber-300 rounded-2xl p-4.5 shadow-xs hover:shadow-md transition-all relative overflow-hidden group">
        <div className="absolute top-0 left-0 w-1.5 h-full bg-amber-500" />
        <div className="flex items-start justify-between">
          <div>
            <span className="text-[11px] font-bold tracking-wider text-slate-500 uppercase">
              Operational Focus
            </span>
            <h3 className="text-base font-bold text-slate-900 flex items-center space-x-1.5 mt-0.5">
              <span>📅</span>
              <span>Due Today & Overdue</span>
            </h3>
          </div>
          <span className="px-2 py-0.5 rounded-md bg-amber-50 text-amber-800 border border-amber-200 text-xs font-semibold">
            {dueAndOverdue.todayDate || 'Today'}
          </span>
        </div>

        <div className="mt-3.5 flex items-center justify-between gap-2">
          <button
            onClick={onFilterDueToday}
            className="flex-1 bg-amber-50/80 hover:bg-amber-100/90 border border-amber-200/90 rounded-xl p-2.5 text-left transition group/btn cursor-pointer shadow-2xs"
          >
            <div className="text-2xl font-black text-amber-700">
              {dueAndOverdue.dueTodayCount}
            </div>
            <div className="text-[11px] font-bold text-amber-900 flex items-center justify-between mt-0.5">
              <span>Due Today</span>
              <span className="opacity-0 group-hover/btn:opacity-100 text-amber-700">→</span>
            </div>
          </button>

          <button
            onClick={onFilterOverdue}
            className={`flex-1 rounded-xl p-2.5 text-left transition border group/btn cursor-pointer shadow-2xs ${
              dueAndOverdue.overdueCount > 0
                ? 'bg-rose-50 hover:bg-rose-100 border-rose-200 text-rose-800'
                : 'bg-slate-50 border-slate-200 text-slate-500'
            }`}
          >
            <div className={`text-2xl font-black ${dueAndOverdue.overdueCount > 0 ? 'text-rose-600' : 'text-slate-400'}`}>
              {dueAndOverdue.overdueCount}
            </div>
            <div className="text-[11px] font-bold flex items-center justify-between mt-0.5">
              <span className={dueAndOverdue.overdueCount > 0 ? 'text-rose-900' : 'text-slate-500'}>Overdue</span>
              <span className="opacity-0 group-hover/btn:opacity-100 text-rose-600">→</span>
            </div>
          </button>
        </div>
      </div>

      {/* Widget 2: Unpaid Receivables */}
      <div className="bg-white border border-slate-200/90 hover:border-emerald-300 rounded-2xl p-4.5 shadow-xs hover:shadow-md transition-all relative overflow-hidden">
        <div className="absolute top-0 left-0 w-1.5 h-full bg-emerald-500" />
        <div className="flex items-start justify-between">
          <div>
            <span className="text-[11px] font-bold tracking-wider text-slate-500 uppercase">
              Financial Status
            </span>
            <h3 className="text-base font-bold text-slate-900 flex items-center space-x-1.5 mt-0.5">
              <span>💰</span>
              <span>Unpaid Receivables</span>
            </h3>
          </div>
          <span className="px-2 py-0.5 rounded-md bg-emerald-50 text-emerald-800 border border-emerald-200 text-xs font-bold">
            {receivables.debtorCount} Clients
          </span>
        </div>

        <div className="mt-3.5">
          <div className="text-2xl font-black text-emerald-700 font-mono">
            ₹{receivables.totalUnpaidAmount.toLocaleString('en-IN')}
          </div>
          <div className="flex items-center justify-between mt-1">
            <span className="text-xs text-slate-500 font-medium">Outstanding Balance</span>
            <button
              onClick={onOpenReceivablesModal}
              className="text-xs font-bold text-emerald-700 hover:text-emerald-800 underline underline-offset-2 flex items-center space-x-1 cursor-pointer"
            >
              <span>View Debtors</span>
              <span>→</span>
            </button>
          </div>
        </div>
      </div>

      {/* Widget 3: Customer History Lookup */}
      <div className="bg-white border border-slate-200/90 hover:border-sky-300 rounded-2xl p-4.5 shadow-xs hover:shadow-md transition-all relative overflow-hidden">
        <div className="absolute top-0 left-0 w-1.5 h-full bg-sky-500" />
        <div className="flex items-start justify-between">
          <div>
            <span className="text-[11px] font-bold tracking-wider text-slate-500 uppercase">
              Client Memory
            </span>
            <h3 className="text-base font-bold text-slate-900 flex items-center space-x-1.5 mt-0.5">
              <span>🔍</span>
              <span>Past Order Lookup</span>
            </h3>
          </div>
          <span className="px-2 py-0.5 rounded-md bg-sky-50 text-sky-800 border border-sky-200 text-xs font-bold">
            Specs & Naap
          </span>
        </div>

        <div className="mt-3.5">
          <p className="text-xs text-slate-600 line-clamp-1">
            Instant repeat customer measurements, fabric, & preferences.
          </p>
          <button
            onClick={onOpenCustomerLookup}
            className="w-full mt-2.5 px-3 py-2 rounded-xl bg-sky-50 hover:bg-sky-100 border border-sky-200 text-sky-800 font-bold text-xs flex items-center justify-center space-x-1.5 transition shadow-2xs cursor-pointer"
          >
            <span>🔎</span>
            <span>Search Customer History</span>
          </button>
        </div>
      </div>

      {/* Widget 4: Committed Weekly Capacity */}
      <div className="bg-white border border-slate-200/90 hover:border-purple-300 rounded-2xl p-4.5 shadow-xs hover:shadow-md transition-all relative overflow-hidden">
        <div className="absolute top-0 left-0 w-1.5 h-full bg-purple-500" />
        <div className="flex items-start justify-between">
          <div>
            <span className="text-[11px] font-bold tracking-wider text-slate-500 uppercase">
              Workload Meter
            </span>
            <h3 className="text-base font-bold text-slate-900 flex items-center space-x-1.5 mt-0.5">
              <span>⚡</span>
              <span>Weekly Capacity</span>
            </h3>
          </div>
          <span className={`px-2 py-0.5 rounded-md text-xs font-extrabold border ${
            capacity.utilizationPercent > 85
              ? 'bg-rose-50 text-rose-800 border-rose-200'
              : 'bg-purple-50 text-purple-800 border-purple-200'
          }`}>
            {capacity.utilizationPercent}% Load
          </span>
        </div>

        <div className="mt-3.5">
          <div className="flex items-baseline justify-between text-xs mb-1.5">
            <span className="font-bold text-slate-800">
              <span className="text-xl font-black text-purple-700">{capacity.totalItemsCommitted}</span> / {capacity.maxCapacity} items
            </span>
            <span className="text-slate-500 font-medium">{capacity.activeOrderCount} Active Orders</span>
          </div>

          {/* Progress Bar */}
          <div className="w-full bg-slate-100 rounded-full h-2 overflow-hidden border border-slate-200/60">
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
          <div className="flex justify-between items-center mt-2 text-[10px] text-slate-500 font-mono">
            {Object.entries(capacity.dailyBreakdown || {}).map(([day, cnt]) => (
              <span key={day} className={cnt > 0 ? 'text-purple-800 font-bold' : 'text-slate-400'}>
                {day}:{cnt}
              </span>
            ))}
          </div>
        </div>
      </div>

    </div>
  );
}
