export default function OperationalInsights({
  metrics,
  onFilterDueToday,
  onFilterOverdue,
  onOpenCustomerLookup,
  onOpenReceivablesModal,
}) {
  const { dueAndOverdue, receivables, capacity } = metrics;

  const cards = [
    { label: 'Due Today', value: dueAndOverdue.dueTodayCount, onClick: onFilterDueToday },
    { label: 'Overdue', value: dueAndOverdue.overdueCount, onClick: onFilterOverdue, alert: dueAndOverdue.overdueCount > 0 },
    { label: 'Unpaid', value: `₹${receivables.totalUnpaidAmount.toLocaleString('en-IN')}`, onClick: onOpenReceivablesModal, mono: true },
    { label: 'Active Items', value: `${capacity.totalItemsCommitted}/${capacity.maxCapacity}`, onClick: onOpenCustomerLookup },
  ];

  return (
    <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 mb-5">
      {cards.map((c) => (
        <button
          key={c.label}
          onClick={c.onClick}
          className="bg-white/[0.04] backdrop-blur-md rounded-xl p-4 border border-white/[0.06] text-left hover:bg-white/[0.07] hover:border-white/10 transition cursor-pointer"
        >
          <p className="text-[11px] text-white/40 font-medium tracking-wide">{c.label}</p>
          <p className={`text-2xl font-semibold mt-1 ${c.alert ? 'text-red-400' : 'text-white'} ${c.mono ? 'font-mono' : ''}`}>
            {c.value}
          </p>
        </button>
      ))}
    </div>
  );
}
