import { useState } from 'react';
import { getCustomerOrderHistory } from '../db/ordersDb';

export default function CustomerHistoryModal({ isOpen, onClose, initialCustomer = '' }) {
  const [searchTerm, setSearchTerm] = useState(initialCustomer);
  const [historyData, setHistoryData] = useState(null);
  const [loading, setLoading] = useState(false);

  if (!isOpen) return null;

  const handleSearch = async (query) => {
    setSearchTerm(query);
    if (!query.trim()) {
      setHistoryData(null);
      return;
    }
    setLoading(true);
    const data = await getCustomerOrderHistory(query);
    setHistoryData(data);
    setLoading(false);
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4">
      <div className="bg-slate-900 border border-slate-700 rounded-2xl max-w-xl w-full p-6 shadow-2xl space-y-4">
        
        {/* Header */}
        <div className="flex items-center justify-between border-b border-slate-800 pb-3">
          <div className="flex items-center space-x-2">
            <span className="w-8 h-8 rounded-lg bg-sky-500/20 text-sky-400 border border-sky-500/30 flex items-center justify-center font-bold">
              🔍
            </span>
            <div>
              <h3 className="text-base font-bold text-slate-100">
                Customer Order History & Specifications
              </h3>
              <p className="text-xs text-slate-400">
                Operational Query 3: What did this customer order last time?
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

        {/* Search Input */}
        <div className="relative">
          <input
            type="text"
            value={searchTerm}
            onChange={(e) => handleSearch(e.target.value)}
            placeholder="Type customer name (e.g. Pooja Verma, Amit Sharma)..."
            className="w-full bg-slate-950 border border-slate-700 rounded-xl pl-9 pr-4 py-2 text-xs text-slate-100 placeholder:text-slate-500 focus:outline-none focus:border-sky-500"
          />
          <span className="absolute left-3 top-2.5 text-xs text-slate-500">🔎</span>
        </div>

        {/* Content */}
        {loading ? (
          <div className="py-8 text-center text-xs text-slate-400">Loading history...</div>
        ) : historyData && historyData.orders.length > 0 ? (
          <div className="space-y-4">
            
            {/* Customer Summary Banner */}
            <div className="bg-slate-950 p-3 rounded-xl border border-slate-800 flex items-center justify-between text-xs">
              <div>
                <span className="text-slate-400 font-medium">Customer:</span>{' '}
                <strong className="text-sky-300 text-sm">{historyData.customer}</strong>
              </div>
              <div className="flex items-center space-x-3">
                <span className="text-slate-300">
                  Total Orders: <strong className="text-amber-400">{historyData.totalOrders}</strong>
                </span>
                <span className="text-slate-300">
                  Total Spent: <strong className="text-emerald-400">₹{historyData.totalSpent.toLocaleString('en-IN')}</strong>
                </span>
              </div>
            </div>

            {/* Recurring Specifications / Naap */}
            {historyData.measurementHistory.length > 0 && (
              <div>
                <label className="text-[11px] font-semibold uppercase tracking-wider text-slate-400 block mb-1.5">
                  Saved Measurements & Attribute Memory:
                </label>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 max-h-36 overflow-y-auto pr-1">
                  {historyData.measurementHistory.map((m, idx) => (
                    <div key={idx} className="bg-slate-950/80 p-2.5 rounded-lg border border-slate-800 text-xs">
                      <div className="flex items-center justify-between text-slate-300 font-bold mb-1">
                        <span className="capitalize">{m.item}</span>
                        <span className="text-[10px] text-slate-500 font-mono">{m.date}</span>
                      </div>
                      <div className="flex flex-wrap gap-1">
                        {Object.entries(m.attributes).map(([k, v]) => (
                          <span
                            key={k}
                            className="bg-slate-800 text-slate-300 px-1.5 py-0.5 rounded text-[10px] font-mono border border-slate-700"
                          >
                            <strong className="text-sky-400">{k}:</strong> {String(v)}
                          </span>
                        ))}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Orders Timeline */}
            <div>
              <label className="text-[11px] font-semibold uppercase tracking-wider text-slate-400 block mb-1.5">
                Past Order History:
              </label>
              <div className="space-y-2 max-h-48 overflow-y-auto pr-1">
                {historyData.orders.map((ord) => (
                  <div
                    key={ord.id}
                    className="bg-slate-950 p-2.5 rounded-xl border border-slate-800 text-xs flex items-center justify-between"
                  >
                    <div>
                      <div className="flex items-center space-x-2">
                        <span className="font-mono font-bold text-slate-200">{ord.orderId}</span>
                        <span className="px-1.5 py-0.2 rounded bg-slate-800 text-slate-400 text-[10px] uppercase font-semibold">
                          {ord.domain}
                        </span>
                        <span className="text-[10px] text-slate-400">
                          {ord.due_date ? `Due: ${ord.due_date}` : 'No date'}
                        </span>
                      </div>
                      <div className="text-slate-300 mt-1">
                        {(ord.items || []).map(i => `${i.quantity}x ${i.description}`).join(', ')}
                      </div>
                    </div>
                    <div className="text-right">
                      <div className="font-mono font-bold text-emerald-400">₹{ord.amount || 0}</div>
                      <span className="text-[10px] text-slate-400">{ord.status}</span>
                    </div>
                  </div>
                ))}
              </div>
            </div>

          </div>
        ) : (
          <div className="py-8 text-center text-xs text-slate-500">
            {searchTerm ? 'No past orders found for this search.' : 'Type a customer name above to view past orders and measurements.'}
          </div>
        )}

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
