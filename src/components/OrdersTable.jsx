import { useState } from 'react';
import { getTodayKolkataDate } from '../db/ordersDb';

export default function OrdersTable({
  orders,
  onUpdateStatus,
  onTogglePaid,
  onDeleteOrder,
  onSelectCustomer,
  selectedDomain,
}) {
  const [viewMode, setViewMode] = useState('table');
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [overdueOnly, setOverdueOnly] = useState(false);
  const [selectedOrderDetails, setSelectedOrderDetails] = useState(null);

  const today = getTodayKolkataDate();
  const domainIcons = { tailor: '🧵', tiffin: '🍱', electrician: '⚡', baker: '🎂', general: '📦', custom: '📦' };

  const filteredOrders = orders.filter((ord) => {
    if (selectedDomain && selectedDomain !== 'all' && ord.domain !== selectedDomain) return false;
    if (statusFilter !== 'all' && ord.status !== statusFilter) return false;
    if (overdueOnly) {
      if (ord.status === 'Completed' || ord.status === 'Paid') return false;
      if (!ord.due_date || ord.due_date >= today) return false;
    }
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      const m = [ord.customer, ord.orderId, ord.raw_message].some(f => f && f.toLowerCase().includes(q));
      const mi = Array.isArray(ord.items) && ord.items.some(i => i?.description && String(i.description).toLowerCase().includes(q));
      if (!m && !mi) return false;
    }
    return true;
  });

  const getDueBadge = (dueDate, status) => {
    if (!dueDate) return <span className="text-white/25">—</span>;
    if (status === 'Completed' || status === 'Paid') return <span className="text-white/40 font-mono">{dueDate}</span>;
    if (dueDate < today) return <span className="text-red-400 font-medium font-mono">{dueDate}</span>;
    if (dueDate === today) return <span className="text-amber-400 font-medium font-mono">{dueDate}</span>;
    return <span className="text-white/60 font-mono">{dueDate}</span>;
  };

  const kanbanStatuses = ['Pending', 'In Progress', 'Completed', 'Paid'];

  return (
    <div className="bg-white/[0.04] backdrop-blur-md rounded-xl border border-white/[0.06]">

      {/* Controls */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-3 p-4 border-b border-white/[0.06]">
        <div className="flex flex-wrap items-center gap-2">
          <input
            type="text" value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search…"
            className="bg-white/[0.04] border border-white/[0.08] focus:border-white/20 rounded-lg pl-3 pr-3 py-1.5 text-xs text-white/80 placeholder:text-white/25 focus:outline-none w-40 sm:w-52 transition"
          />
          <div className="flex items-center gap-0.5 text-xs">
            {['all', 'Pending', 'In Progress', 'Completed', 'Paid'].map((st) => (
              <button key={st} onClick={() => setStatusFilter(st)}
                className={`px-2.5 py-1 rounded-md transition cursor-pointer ${
                  statusFilter === st ? 'bg-blue-600 text-white' : 'text-white/40 hover:text-white/70 hover:bg-white/[0.05]'
                }`}
              >
                {st === 'all' ? 'All' : st}
              </button>
            ))}
          </div>
          <button onClick={() => setOverdueOnly(!overdueOnly)}
            className={`px-2.5 py-1 rounded-md text-xs transition cursor-pointer ${
              overdueOnly ? 'bg-red-500/20 text-red-400' : 'text-white/40 hover:text-white/70 hover:bg-white/[0.05]'
            }`}
          >
            Overdue
          </button>
        </div>

        <div className="flex items-center gap-3 text-xs">
          <span className="text-white/30">{filteredOrders.length} orders</span>
          <div className="flex items-center bg-white/[0.04] rounded-lg p-0.5 border border-white/[0.06]">
            <button onClick={() => setViewMode('table')}
              className={`px-2 py-1 rounded-md transition cursor-pointer ${viewMode === 'table' ? 'bg-white/10 text-white' : 'text-white/40'}`}
            >Table</button>
            <button onClick={() => setViewMode('kanban')}
              className={`px-2 py-1 rounded-md transition cursor-pointer ${viewMode === 'kanban' ? 'bg-white/10 text-white' : 'text-white/40'}`}
            >Board</button>
          </div>
        </div>
      </div>

      {/* Content */}
      {filteredOrders.length === 0 ? (
        <div className="py-16 text-center">
          <p className="text-sm text-white/25">No orders match the current filters.</p>
        </div>
      ) : viewMode === 'table' ? (
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead>
              <tr className="border-b border-white/[0.06] text-[11px] uppercase tracking-wider text-white/25">
                <th className="py-3 px-4 font-medium">Order</th>
                <th className="py-3 px-4 font-medium">Customer</th>
                <th className="py-3 px-4 font-medium">Items</th>
                <th className="py-3 px-4 font-medium">Due</th>
                <th className="py-3 px-4 font-medium">Amount</th>
                <th className="py-3 px-4 font-medium">Status</th>
                <th className="py-3 px-4 font-medium text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-white/[0.04]">
              {filteredOrders.map((ord) => (
                <tr key={ord.id} className="hover:bg-white/[0.02] transition">
                  <td className="py-3 px-4">
                    <div className="font-mono text-white/60">{domainIcons[ord.domain] || '📦'} {ord.orderId}</div>
                    <div className="text-[10px] uppercase tracking-wider text-white/25 mt-0.5">{ord.domain || 'custom'}</div>
                  </td>
                  <td className="py-3 px-4">
                    <button onClick={() => onSelectCustomer(ord.customer)}
                      className="text-white/70 font-medium hover:text-white transition text-left cursor-pointer"
                    >{ord.customer}</button>
                  </td>
                  <td className="py-3 px-4 max-w-xs">
                    <div className="flex flex-wrap gap-1 text-white/50">
                      {(ord.items || []).map((it, iIdx) => (
                        <span key={iIdx}>
                          {it.quantity}× <span className="capitalize">{it.description}</span>
                          {iIdx < (ord.items || []).length - 1 && ','}
                        </span>
                      ))}
                    </div>
                  </td>
                  <td className="py-3 px-4 whitespace-nowrap text-xs">{getDueBadge(ord.due_date, ord.status)}</td>
                  <td className="py-3 px-4 whitespace-nowrap">
                    <div className="flex items-center gap-2">
                      <span className="font-mono text-white/70">{ord.amount ? `₹${ord.amount.toLocaleString('en-IN')}` : '—'}</span>
                      <button onClick={() => onTogglePaid(ord.id, !ord.paid)}
                        className={`text-[10px] px-1.5 py-0.5 rounded cursor-pointer transition ${
                          ord.paid || ord.status === 'Paid'
                            ? 'text-emerald-400 bg-emerald-500/10'
                            : 'text-white/35 bg-white/[0.04] hover:bg-white/[0.08]'
                        }`}
                      >{ord.paid || ord.status === 'Paid' ? '✓ Paid' : 'Unpaid'}</button>
                    </div>
                  </td>
                  <td className="py-3 px-4">
                    <select value={ord.status} onChange={(e) => onUpdateStatus(ord.id, e.target.value)}
                      className="text-xs bg-transparent text-white/50 focus:outline-none cursor-pointer [&>option]:bg-[#1a1a1a] [&>option]:text-white"
                    >
                      <option value="Pending">Pending</option>
                      <option value="In Progress">In Progress</option>
                      <option value="Completed">Completed</option>
                      <option value="Paid">Paid</option>
                    </select>
                  </td>
                  <td className="py-3 px-4 text-right">
                    <div className="flex items-center justify-end gap-1">
                      <button onClick={() => setSelectedOrderDetails(ord)}
                        className="p-1 rounded text-white/25 hover:text-white/60 hover:bg-white/[0.05] transition cursor-pointer">👁️</button>
                      <button onClick={() => onDeleteOrder(ord.id)}
                        className="p-1 rounded text-white/25 hover:text-red-400 hover:bg-red-500/10 transition cursor-pointer">🗑️</button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      ) : (
        /* KANBAN */
        <div className="grid grid-cols-1 md:grid-cols-4 gap-3 p-4">
          {kanbanStatuses.map((statusKey) => {
            const columnOrders = filteredOrders.filter((o) => o.status === statusKey);
            return (
              <div key={statusKey} className="bg-white/[0.02] rounded-lg p-3 flex flex-col h-[480px] border border-white/[0.04]">
                <div className="flex items-center justify-between pb-2 mb-2 border-b border-white/[0.06]">
                  <span className="text-xs font-medium text-white/50">{statusKey}</span>
                  <span className="text-[10px] text-white/25">{columnOrders.length}</span>
                </div>
                <div className="flex-1 overflow-y-auto space-y-2 pr-0.5">
                  {columnOrders.map((ord) => (
                    <div key={ord.id} className="bg-white/[0.04] border border-white/[0.06] rounded-lg p-3 space-y-1.5 hover:bg-white/[0.06] transition">
                      <div className="flex items-center justify-between text-xs">
                        <div>
                          <span className="font-mono text-white/40">{domainIcons[ord.domain]} {ord.orderId}</span>
                          <div className="text-[9px] uppercase tracking-wider text-white/20">{ord.domain || 'custom'}</div>
                        </div>
                        <span className="font-mono text-white/70">{ord.amount ? `₹${ord.amount}` : ''}</span>
                      </div>
                      <div>
                        <button onClick={() => onSelectCustomer(ord.customer)}
                          className="text-xs font-medium text-white/60 hover:text-white text-left cursor-pointer">{ord.customer}</button>
                        <div className="text-[11px] text-white/25 mt-0.5 line-clamp-1">
                          {(ord.items || []).map(i => `${i.quantity}× ${i.description}`).join(', ')}
                        </div>
                      </div>
                      <div className="flex items-center justify-between pt-1 border-t border-white/[0.05] text-[10px]">
                        {getDueBadge(ord.due_date, ord.status)}
                        <select value={ord.status} onChange={(e) => onUpdateStatus(ord.id, e.target.value)}
                          className="bg-transparent text-white/35 text-[10px] focus:outline-none cursor-pointer [&>option]:bg-[#1a1a1a] [&>option]:text-white"
                        >
                          <option value="Pending">Pending</option>
                          <option value="In Progress">In Progress</option>
                          <option value="Completed">Completed</option>
                          <option value="Paid">Paid</option>
                        </select>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Detail Modal */}
      {selectedOrderDetails && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-[#141414] border border-white/[0.08] rounded-xl max-w-lg w-full p-5 shadow-2xl space-y-4">
            <div className="flex items-center justify-between border-b border-white/[0.06] pb-3">
              <h3 className="text-sm font-semibold text-white/90">{selectedOrderDetails.orderId}</h3>
              <button onClick={() => setSelectedOrderDetails(null)} className="text-white/30 hover:text-white/70 cursor-pointer">✕</button>
            </div>
            <div className="space-y-3 text-xs">
              <div>
                <label className="text-white/30 block mb-1">Customer</label>
                <div className="text-white/70 bg-white/[0.04] p-2.5 rounded-lg border border-white/[0.06]">{selectedOrderDetails.customer}</div>
              </div>
              <div>
                <label className="text-white/30 block mb-1">Original Message</label>
                <div className="text-white/60 bg-white/[0.04] p-3 rounded-lg border border-white/[0.06] whitespace-pre-wrap leading-relaxed">
                  {selectedOrderDetails.raw_message || '—'}
                </div>
              </div>
              <div>
                <label className="text-white/30 block mb-1">Items</label>
                <pre className="text-white/60 font-mono bg-white/[0.04] p-3 rounded-lg border border-white/[0.06] max-h-36 overflow-y-auto text-[11px]">
                  {JSON.stringify(selectedOrderDetails.items, null, 2)}
                </pre>
              </div>
            </div>
            <div className="flex justify-end pt-2 border-t border-white/[0.06]">
              <button onClick={() => setSelectedOrderDetails(null)}
                className="px-4 py-1.5 rounded-lg bg-white/[0.06] hover:bg-white/10 text-white/60 text-xs cursor-pointer transition">Close</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
