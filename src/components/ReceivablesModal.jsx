export default function ReceivablesModal({ isOpen, onClose, receivables, onMarkPaid }) {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4">
      <div className="bg-slate-900 border border-slate-700 rounded-2xl max-w-lg w-full p-6 shadow-2xl space-y-4">
        
        {/* Header */}
        <div className="flex items-center justify-between border-b border-slate-800 pb-3">
          <div className="flex items-center space-x-2">
            <span className="w-8 h-8 rounded-lg bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 flex items-center justify-center font-bold">
              💰
            </span>
            <div>
              <h3 className="text-base font-bold text-slate-100">
                Unpaid Receivables & Client Debtors
              </h3>
              <p className="text-xs text-slate-400">
                Operational Query 2: Which customers owe money, and how much?
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="text-slate-400 hover:text-white text-lg font-bold cursor-pointer"
          >
            ✕
          </button>
        </div>

        {/* Total Banner */}
        <div className="bg-slate-950 p-4 rounded-xl border border-slate-800 flex items-center justify-between">
          <div>
            <span className="text-[11px] uppercase tracking-wider text-slate-400 font-semibold">
              Total Outstanding Receivables
            </span>
            <div className="text-2xl font-black text-emerald-400 mt-0.5">
              ₹{receivables.totalUnpaidAmount.toLocaleString('en-IN')}
            </div>
          </div>
          <div className="text-right text-xs">
            <span className="px-2.5 py-1 rounded-full bg-slate-800 text-slate-300 font-bold border border-slate-700">
              {receivables.debtorCount} Active Debtors
            </span>
          </div>
        </div>

        {/* Debtors List */}
        <div className="space-y-2.5 max-h-64 overflow-y-auto pr-1">
          {receivables.debtors.length === 0 ? (
            <div className="py-8 text-center text-xs text-slate-500">
              🎉 No unpaid receivables! All completed orders are settled.
            </div>
          ) : (
            receivables.debtors.map((debtor, idx) => (
              <div
                key={idx}
                className="bg-slate-950 p-3.5 rounded-xl border border-slate-800 flex items-center justify-between text-xs"
              >
                <div>
                  <div className="font-bold text-slate-100 text-sm">
                    {debtor.customer}
                  </div>
                  <div className="text-[11px] text-slate-400 mt-0.5">
                    {debtor.orders.length} Unsettled Order{debtor.orders.length > 1 ? 's' : ''} ({debtor.orders.map(o => o.orderId).join(', ')})
                  </div>
                </div>

                <div className="flex items-center space-x-3">
                  <div className="text-right font-mono font-bold text-emerald-400 text-sm">
                    ₹{debtor.totalOwed.toLocaleString('en-IN')}
                  </div>
                  <button
                    onClick={() => {
                      debtor.orders.forEach(o => onMarkPaid(o.id, true));
                    }}
                    className="px-2.5 py-1 rounded-lg bg-emerald-500/10 hover:bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 text-xs font-bold transition cursor-pointer"
                  >
                    Mark Settled
                  </button>
                </div>
              </div>
            ))
          )}
        </div>

        <div className="flex justify-end pt-3 border-t border-slate-800">
          <button
            onClick={onClose}
            className="px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 font-bold text-xs cursor-pointer"
          >
            Close
          </button>
        </div>

      </div>
    </div>
  );
}
