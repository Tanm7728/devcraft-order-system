export default function OperationalInsights({
  metrics,
  onFilterDueToday,
  onFilterOverdue,
  onOpenCustomerLookup,
  onOpenReceivablesModal,
}) {
  const { dueAndOverdue, receivables, capacity } = metrics;

  return (
    <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 mb-5">

      {/* Due Today */}
      <button onClick={onFilterDueToday} className="bg-white rounded-xl p-4 shadow-sm border border-slate-100 text-left hover:shadow transition cursor-pointer">
        <p className="text-xs text-slate-400 font-medium">Due Today</p>
        <p className="text-2xl font-semibold text-slate-900 mt-1">{dueAndOverdue.dueTodayCount}</p>
      </button>

      {/* Overdue */}
      <button onClick={onFilterOverdue} className="bg-white rounded-xl p-4 shadow-sm border border-slate-100 text-left hover:shadow transition cursor-pointer">
        <p className="text-xs text-slate-400 font-medium">Overdue</p>
        <p className={`text-2xl font-semibold mt-1 ${dueAndOverdue.overdueCount > 0 ? 'text-red-600' : 'text-slate-900'}`}>{dueAndOverdue.overdueCount}</p>
      </button>

      {/* Receivables */}
      <button onClick={onOpenReceivablesModal} className="bg-white rounded-xl p-4 shadow-sm border border-slate-100 text-left hover:shadow transition cursor-pointer">
        <p className="text-xs text-slate-400 font-medium">Unpaid</p>
        <p className="text-2xl font-semibold text-slate-900 mt-1 font-mono">₹{receivables.totalUnpaidAmount.toLocaleString('en-IN')}</p>
      </button>

      {/* Capacity */}
      <button onClick={onOpenCustomerLookup} className="bg-white rounded-xl p-4 shadow-sm border border-slate-100 text-left hover:shadow transition cursor-pointer">
        <p className="text-xs text-slate-400 font-medium">Active Items</p>
        <p className="text-2xl font-semibold text-slate-900 mt-1">{capacity.totalItemsCommitted}<span className="text-sm text-slate-400 font-normal">/{capacity.maxCapacity}</span></p>
      </button>

    </div>
  );
}
