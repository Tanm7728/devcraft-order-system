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
    <div className="fixed inset-0 z-50 bg-black/40 backdrop-blur-xs flex items-center justify-center p-4">
      <div className="bg-white border border-slate-200 rounded-2xl max-w-xl w-full p-6 shadow-2xl space-y-4">
        
        {/* Header */}
        <div className="flex items-center justify-between border-b border-slate-200 pb-3">
          <div className="flex items-center space-x-2">
            <span className="w-8 h-8 rounded-lg bg-sky-50 text-sky-700 border border-sky-200 flex items-center justify-center font-bold">
              🔍
            </span>
            <div>
              <h3 className="text-base font-black text-slate-900">
                Customer Order History & Specifications
              </h3>
              <p className="text-xs text-slate-500">
                Operational Query 3: What did this customer order last time?
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="text-slate-400 hover:text-slate-700 text-lg font-bold cursor-pointer"
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
            className="w-full bg-slate-50 focus:bg-white border border-slate-300 focus:border-sky-500 rounded-xl pl-9 pr-4 py-2.5 text-xs text-slate-900 placeholder:text-slate-400 focus:outline-none shadow-2xs"
          />
          <span className="absolute left-3 top-3 text-xs text-slate-400">🔎</span>
        </div>

        {/* Content */}
        {loading ? (
          <div className="py-8 text-center text-xs text-slate-500">Loading history...</div>
        ) : historyData && historyData.orders.length > 0 ? (
          <div className="space-y-4">
            
            {/* Customer Summary Banner */}
            <div className="bg-slate-50 p-3.5 rounded-xl border border-slate-200 flex items-center justify-between text-xs">
              <div>
                <span className="text-slate-500 font-medium">Customer:</span>{' '}
                <strong className="text-sky-900 font-extrabold text-sm">{historyData.customer}</strong>
              </div>
              <div className="flex items-center space-x-3">
                <span className="text-slate-600">
                  Total Orders: <strong className="text-amber-700 font-bold">{historyData.totalOrders}</strong>
                </span>
                <span className="text-slate-600">
                  Total Spent: <strong className="text-emerald-700 font-bold">₹{historyData.totalSpent.toLocaleString('en-IN')}</strong>
                </span>
              </div>
            </div>

            {/* Recurring Specifications / Naap */}
            {historyData.measurementHistory.length > 0 && (
              <div>
                <label className="text-[11px] font-bold uppercase tracking-wider text-slate-500 block mb-1.5">
                  Saved Measurements & Attribute Memory:
                </label>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 max-h-36 overflow-y-auto pr-1">
                  {historyData.measurementHistory.map((m, idx) => (
                    <div key={idx} className="bg-white p-2.5 rounded-lg border border-slate-200 text-xs shadow-2xs">
                      <div className="flex items-center justify-between text-slate-800 font-bold mb-1">
                        <span className="capitalize">{m.item}</span>
                        <span className="text-[10px] text-slate-400 font-mono">{m.date}</span>
                      </div>
                      <div className="flex flex-wrap gap-1">
                        {Object.entries(m.attributes).map(([k, v]) => (
                          <span
                            key={k}
                            className="bg-slate-50 text-slate-700 px-2 py-0.5 rounded text-[10px] font-mono border border-slate-200"
                          >
                            <strong className="text-sky-700">{k}:</strong> {String(v)}
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
              <label className="text-[11px] font-bold uppercase tracking-wider text-slate-500 block mb-1.5">
                Past Order History:
              </label>
              <div className="space-y-2 max-h-48 overflow-y-auto pr-1">
                {historyData.orders.map((ord) => (
                  <div
                    key={ord.id}
                    className="bg-slate-50 p-3 rounded-xl border border-slate-200 text-xs flex items-center justify-between"
                  >
                    <div>
                      <div className="flex items-center space-x-2">
                        <span className="font-mono font-bold text-slate-900">{ord.orderId}</span>
                        <span className="px-2 py-0.5 rounded bg-white text-slate-700 text-[10px] uppercase font-bold border border-slate-200">
                          {ord.domain}
                        </span>
                        <span className="text-[10px] text-slate-500 font-medium">
                          {ord.due_date ? `Due: ${ord.due_date}` : 'No date'}
                        </span>
                      </div>
                      <div className="text-slate-700 mt-1 font-medium">
                        {(ord.items || []).map(i => `${i.quantity}x ${i.description}`).join(', ')}
                      </div>
                    </div>
                    <div className="text-right">
                      <div className="font-mono font-bold text-emerald-700">₹{ord.amount || 0}</div>
                      <span className="text-[10px] text-slate-500">{ord.status}</span>
                    </div>
                  </div>
                ))}
              </div>
            </div>

          </div>
        ) : (
          <div className="py-8 text-center text-xs text-slate-400">
            {searchTerm ? 'No past orders found for this search.' : 'Type a customer name above to view prior orders and measurements.'}
          </div>
        )}

        <div className="flex justify-end pt-3 border-t border-slate-200">
          <button
            onClick={onClose}
            className="px-4 py-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-800 font-bold text-xs cursor-pointer"
          >
            Close
          </button>
        </div>

      </div>
    </div>
  );
}
