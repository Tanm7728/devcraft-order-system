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
    <div className="fixed inset-0 z-50 bg-black/70 backdrop-blur-sm flex items-center justify-center p-4">
      <div className="bg-[#141414] border border-white/[0.08] rounded-xl max-w-xl w-full p-6 shadow-2xl space-y-4 text-white">
        
        {/* Header */}
        <div className="flex items-center justify-between border-b border-white/[0.06] pb-3">
          <div className="flex items-center space-x-2.5">
            <span className="w-8 h-8 rounded-lg bg-blue-500/10 text-blue-400 border border-blue-500/20 flex items-center justify-center font-bold text-sm">
              🔍
            </span>
            <div>
              <h3 className="text-sm font-semibold text-white">
                Customer Order History & Specifications
              </h3>
              <p className="text-xs text-white/40">
                Operational Query: What did this customer order last time?
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

        {/* Search Input */}
        <div className="relative">
          <input
            type="text"
            value={searchTerm}
            onChange={(e) => handleSearch(e.target.value)}
            placeholder="Type customer name (e.g. Ram, Pooja Verma, Amit Sharma)..."
            className="w-full bg-white/[0.04] border border-white/[0.08] focus:border-white/20 rounded-lg pl-9 pr-4 py-2 text-xs text-white placeholder:text-white/30 focus:outline-none transition"
          />
          <span className="absolute left-3 top-2.5 text-xs text-white/30">🔎</span>
        </div>

        {/* Content */}
        {loading ? (
          <div className="py-8 text-center text-xs text-white/40">Loading history...</div>
        ) : historyData && historyData.orders.length > 0 ? (
          <div className="space-y-4">
            
            {/* Customer Summary */}
            <div className="bg-white/[0.03] p-3.5 rounded-lg border border-white/[0.06] flex items-center justify-between text-xs">
              <div>
                <span className="text-white/40 font-medium">Customer:</span>{' '}
                <strong className="text-white font-semibold text-sm">{historyData.customer}</strong>
              </div>
              <div className="flex items-center space-x-3">
                <span className="text-white/50">
                  Total Orders: <strong className="text-white/80 font-medium">{historyData.totalOrders}</strong>
                </span>
                <span className="text-white/50">
                  Total Spent: <strong className="text-emerald-400 font-mono">₹{historyData.totalSpent.toLocaleString('en-IN')}</strong>
                </span>
              </div>
            </div>

            {/* Recurring Specifications */}
            {historyData.measurementHistory.length > 0 && (
              <div>
                <label className="text-[11px] font-medium uppercase tracking-wider text-white/40 block mb-1.5">
                  Saved Measurements & Attribute Memory:
                </label>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 max-h-36 overflow-y-auto pr-1">
                  {historyData.measurementHistory.map((m, idx) => (
                    <div key={idx} className="bg-black/30 p-2.5 rounded-lg border border-white/[0.06] text-xs">
                      <div className="flex items-center justify-between text-white/80 font-medium mb-1">
                        <span className="capitalize">{m.item}</span>
                        <span className="text-[10px] text-white/30 font-mono">{m.date}</span>
                      </div>
                      <div className="flex flex-wrap gap-1">
                        {Object.entries(m.attributes).map(([k, v]) => (
                          <span
                            key={k}
                            className="bg-white/[0.04] text-white/60 px-2 py-0.5 rounded text-[10px] font-mono border border-white/[0.06]"
                          >
                            <strong className="text-blue-400">{k}:</strong> {String(v)}
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
              <label className="text-[11px] font-medium uppercase tracking-wider text-white/40 block mb-1.5">
                Past Order History:
              </label>
              <div className="space-y-2 max-h-48 overflow-y-auto pr-1">
                {historyData.orders.map((ord) => (
                  <div
                    key={ord.id}
                    className="bg-white/[0.03] p-3 rounded-lg border border-white/[0.06] text-xs flex items-center justify-between"
                  >
                    <div>
                      <div className="flex items-center space-x-2">
                        <span className="font-mono text-white/70">{ord.orderId}</span>
                        <span className="px-1.5 py-0.5 rounded bg-white/[0.06] text-white/50 text-[10px] uppercase font-mono">
                          {ord.domain}
                        </span>
                        <span className="text-[10px] text-white/30 font-mono">
                          {ord.due_date ? `Due: ${ord.due_date}` : 'No date'}
                        </span>
                      </div>
                      <div className="text-white/60 mt-1">
                        {(ord.items || []).map(i => `${i.quantity}x ${i.description}`).join(', ')}
                      </div>
                    </div>
                    <div className="text-right">
                      <div className="font-mono font-semibold text-emerald-400">₹{ord.amount || 0}</div>
                      <span className="text-[10px] text-white/30">{ord.status}</span>
                    </div>
                  </div>
                ))}
              </div>
            </div>

          </div>
        ) : (
          <div className="py-8 text-center text-xs text-white/30">
            {searchTerm ? 'No past orders found for this search.' : 'Type a customer name above to view prior orders and measurements.'}
          </div>
        )}

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
