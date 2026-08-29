export default function ReceivablesModal({ isOpen, onClose, receivables, onMarkPaid }) {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 bg-black/70 backdrop-blur-sm flex items-center justify-center p-4">
      <div className="bg-[#141414] border border-white/[0.08] rounded-xl max-w-lg w-full p-6 shadow-2xl space-y-4 text-white">
        
        {/* Header */}
        <div className="flex items-center justify-between border-b border-white/[0.06] pb-3">
          <div className="flex items-center space-x-2.5">
            <span className="w-8 h-8 rounded-lg bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 flex items-center justify-center font-bold text-sm">
              💰
            </span>
            <div>
              <h3 className="text-sm font-semibold text-white">
                Unpaid Receivables & Client Debtors
              </h3>
              <p className="text-xs text-white/40">
                Operational Query: Which customers owe money, and how much?
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="text-white/40 hover:text-white text-base cursor-pointer"
          >
            ✕
          </button>
        </div>

        {/* Total Banner */}
        <div className="bg-white/[0.03] p-4 rounded-lg border border-white/[0.06] flex items-center justify-between">
          <div>
            <span className="text-[11px] uppercase tracking-wider text-white/40 font-medium">
              Total Outstanding Receivables
            </span>
            <div className="text-2xl font-bold text-emerald-400 mt-0.5 font-mono">
              ₹{receivables.totalUnpaidAmount.toLocaleString('en-IN')}
            </div>
          </div>
          <div className="text-right text-xs">
            <span className="px-2.5 py-1 rounded-md bg-white/[0.06] text-white/70 border border-white/[0.08] font-medium">
              {receivables.debtorCount} Active Debtors
            </span>
          </div>
        </div>

        {/* Debtors List */}
        <div className="space-y-2 max-h-64 overflow-y-auto pr-1">
          {receivables.debtors.length === 0 ? (
            <div className="py-8 text-center text-xs text-white/30">
              🎉 No unpaid receivables! All completed orders are settled.
            </div>
          ) : (
            receivables.debtors.map((debtor, idx) => (
              <div
                key={idx}
                className="bg-black/30 p-3.5 rounded-lg border border-white/[0.06] flex items-center justify-between text-xs"
              >
                <div>
                  <div className="font-semibold text-white text-sm">
                    {debtor.customer}
                  </div>
                  <div className="text-[11px] text-white/40 mt-0.5 font-medium">
                    {debtor.orders.length} Unsettled Order{debtor.orders.length > 1 ? 's' : ''} ({debtor.orders.map(o => o.orderId).join(', ')})
                  </div>
                </div>

                <div className="flex items-center space-x-3">
                  <div className="text-right font-mono font-semibold text-emerald-400 text-sm">
                    ₹{debtor.totalOwed.toLocaleString('en-IN')}
                  </div>
                  <button
                    onClick={() => {
                      debtor.orders.forEach(o => onMarkPaid(o.id, true));
                    }}
                    className="px-2.5 py-1 rounded-md bg-emerald-500/10 hover:bg-emerald-500/20 text-emerald-400 border border-emerald-500/20 text-xs font-medium transition cursor-pointer"
                  >
                    Mark Settled
                  </button>
                </div>
              </div>
            ))
          )}
        </div>

        <div className="flex justify-end pt-3 border-t border-white/[0.06]">
          <button
            onClick={onClose}
            className="px-4 py-1.5 rounded-lg bg-white/[0.06] hover:bg-white/10 text-white/70 font-medium text-xs cursor-pointer transition"
          >
            Close
          </button>
        </div>

      </div>
    </div>
  );
}
