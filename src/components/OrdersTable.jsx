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
      const matchCust = ord.customer && ord.customer.toLowerCase().includes(q);
      const matchId = ord.orderId && ord.orderId.toLowerCase().includes(q);
      const matchMsg = ord.raw_message && ord.raw_message.toLowerCase().includes(q);
      const matchItem = Array.isArray(ord.items) && ord.items.some(i => i?.description && String(i.description).toLowerCase().includes(q));
      if (!matchCust && !matchId && !matchMsg && !matchItem) return false;
    }
    return true;
  });

  const getDueBadge = (dueDate, status) => {
    if (!dueDate) return <span className="text-slate-400">—</span>;
    if (status === 'Completed' || status === 'Paid') return <span className="text-slate-500 font-mono">{dueDate}</span>;
    if (dueDate < today) return <span className="text-red-600 font-medium font-mono">{dueDate}</span>;
    if (dueDate === today) return <span className="text-amber-600 font-medium font-mono">{dueDate}</span>;
    return <span className="text-slate-700 font-mono">{dueDate}</span>;
  };

  const kanbanStatuses = ['Pending', 'In Progress', 'Completed', 'Paid'];

  return (
    <div className="bg-white rounded-xl border border-slate-200 shadow-sm">

      {/* Control Bar */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-3 p-4 border-b border-slate-100">

        <div className="flex flex-wrap items-center gap-2">
          {/* Search */}
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search…"
            className="bg-slate-50 border border-slate-200 focus:border-slate-400 rounded-lg pl-3 pr-3 py-1.5 text-xs text-slate-800 placeholder:text-slate-400 focus:outline-none w-40 sm:w-52 transition"
          />

          {/* Status pills */}
          <div className="flex items-center gap-0.5 text-xs">
            {['all', 'Pending', 'In Progress', 'Completed', 'Paid'].map((st) => (
              <button
                key={st}
                onClick={() => setStatusFilter(st)}
                className={`px-2.5 py-1 rounded-md transition cursor-pointer ${
                  statusFilter === st
                    ? 'bg-slate-900 text-white'
                    : 'text-slate-500 hover:text-slate-800 hover:bg-slate-100'
                }`}
              >
                {st === 'all' ? 'All' : st}
              </button>
            ))}
          </div>

          {/* Overdue toggle */}
          <button
            onClick={() => setOverdueOnly(!overdueOnly)}
            className={`px-2.5 py-1 rounded-md text-xs transition cursor-pointer ${
              overdueOnly ? 'bg-red-600 text-white' : 'text-slate-500 hover:text-slate-800 hover:bg-slate-100'
            }`}
          >
            Overdue
          </button>
        </div>

        {/* Right: count + view toggle */}
        <div className="flex items-center gap-3 text-xs">
          <span className="text-slate-400">{filteredOrders.length} orders</span>
          <div className="flex items-center bg-slate-100 rounded-lg p-0.5">
            <button
              onClick={() => setViewMode('table')}
              className={`px-2 py-1 rounded-md transition cursor-pointer ${viewMode === 'table' ? 'bg-white text-slate-900 shadow-sm' : 'text-slate-500'}`}
            >
              Table
            </button>
            <button
              onClick={() => setViewMode('kanban')}
              className={`px-2 py-1 rounded-md transition cursor-pointer ${viewMode === 'kanban' ? 'bg-white text-slate-900 shadow-sm' : 'text-slate-500'}`}
            >
              Board
            </button>
          </div>
        </div>

      </div>

      {/* Content */}
      {filteredOrders.length === 0 ? (
        <div className="py-16 text-center">
          <p className="text-sm text-slate-400">No orders match the current filters.</p>
        </div>
      ) : viewMode === 'table' ? (
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead>
              <tr className="border-b border-slate-100 text-[11px] uppercase tracking-wider text-slate-400">
                <th className="py-3 px-4 font-medium">Order</th>
                <th className="py-3 px-4 font-medium">Customer</th>
                <th className="py-3 px-4 font-medium">Items</th>
                <th className="py-3 px-4 font-medium">Due</th>
                <th className="py-3 px-4 font-medium">Amount</th>
                <th className="py-3 px-4 font-medium">Status</th>
                <th className="py-3 px-4 font-medium text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-50">
              {filteredOrders.map((ord) => (
                <tr key={ord.id} className="hover:bg-slate-50/50 transition">

                  {/* Order ID */}
                  <td className="py-3 px-4">
                    <span className="font-mono text-slate-700">{domainIcons[ord.domain] || '📦'} {ord.orderId}</span>
                  </td>

                  {/* Customer */}
                  <td className="py-3 px-4">
                    <button
                      onClick={() => onSelectCustomer(ord.customer)}
                      className="text-slate-800 font-medium hover:text-slate-600 transition text-left cursor-pointer"
                    >
                      {ord.customer}
                    </button>
                  </td>

                  {/* Items */}
                  <td className="py-3 px-4 max-w-xs">
                    <div className="flex flex-wrap gap-1">
                      {(ord.items || []).map((it, iIdx) => (
                        <span key={iIdx} className="text-slate-600">
                          {it.quantity}× <span className="capitalize">{it.description}</span>
                          {iIdx < (ord.items || []).length - 1 && ','}
                        </span>
                      ))}
                    </div>
                  </td>

                  {/* Due */}
                  <td className="py-3 px-4 whitespace-nowrap text-xs">
                    {getDueBadge(ord.due_date, ord.status)}
                  </td>

                  {/* Amount */}
                  <td className="py-3 px-4 whitespace-nowrap">
                    <div className="flex items-center gap-2">
                      <span className="font-mono text-slate-800">{ord.amount ? `₹${ord.amount.toLocaleString('en-IN')}` : '—'}</span>
                      <button
                        onClick={() => onTogglePaid(ord.id, !ord.paid)}
                        className={`text-[10px] px-1.5 py-0.5 rounded cursor-pointer transition ${
                          ord.paid || ord.status === 'Paid'
                            ? 'text-emerald-700 bg-emerald-50'
                            : 'text-slate-500 bg-slate-100 hover:bg-slate-200'
                        }`}
                      >
                        {ord.paid || ord.status === 'Paid' ? '✓ Paid' : 'Unpaid'}
                      </button>
                    </div>
                  </td>

                  {/* Status */}
                  <td className="py-3 px-4">
                    <select
                      value={ord.status}
                      onChange={(e) => onUpdateStatus(ord.id, e.target.value)}
                      className="text-xs bg-transparent text-slate-700 focus:outline-none cursor-pointer"
                    >
                      <option value="Pending">Pending</option>
                      <option value="In Progress">In Progress</option>
                      <option value="Completed">Completed</option>
                      <option value="Paid">Paid</option>
                    </select>
                  </td>

                  {/* Actions */}
                  <td className="py-3 px-4 text-right">
                    <div className="flex items-center justify-end gap-1">
                      <button
                        onClick={() => setSelectedOrderDetails(ord)}
                        className="p-1 rounded text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition cursor-pointer"
                        title="View details"
                      >👁️</button>
                      <button
                        onClick={() => onDeleteOrder(ord.id)}
                        className="p-1 rounded text-slate-400 hover:text-red-600 hover:bg-red-50 transition cursor-pointer"
                        title="Delete"
                      >🗑️</button>
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
              <div key={statusKey} className="bg-slate-50 rounded-lg p-3 flex flex-col h-[480px]">
                <div className="flex items-center justify-between pb-2 mb-2 border-b border-slate-200">
                  <span className="text-xs font-medium text-slate-600">{statusKey}</span>
                  <span className="text-[10px] text-slate-400">{columnOrders.length}</span>
                </div>

                <div className="flex-1 overflow-y-auto space-y-2 pr-0.5">
                  {columnOrders.map((ord) => (
                    <div key={ord.id} className="bg-white border border-slate-200 rounded-lg p-3 space-y-1.5 hover:shadow-sm transition">
                      <div className="flex items-center justify-between text-xs">
                        <span className="font-mono text-slate-500">{domainIcons[ord.domain]} {ord.orderId}</span>
                        <span className="font-mono text-slate-800">{ord.amount ? `₹${ord.amount}` : ''}</span>
                      </div>
                      <div>
                        <button onClick={() => onSelectCustomer(ord.customer)} className="text-xs font-medium text-slate-800 hover:text-slate-600 text-left cursor-pointer">
                          {ord.customer}
                        </button>
                        <div className="text-[11px] text-slate-400 mt-0.5 line-clamp-1">
                          {(ord.items || []).map(i => `${i.quantity}× ${i.description}`).join(', ')}
                        </div>
                      </div>
                      <div className="flex items-center justify-between pt-1 border-t border-slate-100 text-[10px]">
                        {getDueBadge(ord.due_date, ord.status)}
                        <select
                          value={ord.status}
                          onChange={(e) => onUpdateStatus(ord.id, e.target.value)}
                          className="bg-transparent text-slate-500 text-[10px] focus:outline-none cursor-pointer"
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
        <div className="fixed inset-0 z-50 bg-black/30 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white rounded-xl max-w-lg w-full p-5 shadow-xl space-y-4">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <h3 className="text-sm font-semibold text-slate-900">{selectedOrderDetails.orderId}</h3>
              <button onClick={() => setSelectedOrderDetails(null)} className="text-slate-400 hover:text-slate-700 cursor-pointer">✕</button>
            </div>

            <div className="space-y-3 text-xs">
              <div>
                <label className="text-slate-400 block mb-1">Customer</label>
                <div className="text-slate-800 bg-slate-50 p-2.5 rounded-lg">{selectedOrderDetails.customer}</div>
              </div>
              <div>
                <label className="text-slate-400 block mb-1">Original Message</label>
                <div className="text-slate-700 bg-slate-50 p-3 rounded-lg whitespace-pre-wrap leading-relaxed">
                  {selectedOrderDetails.raw_message || '—'}
                </div>
              </div>
              <div>
                <label className="text-slate-400 block mb-1">Items</label>
                <pre className="text-slate-700 font-mono bg-slate-50 p-3 rounded-lg max-h-36 overflow-y-auto text-[11px]">
                  {JSON.stringify(selectedOrderDetails.items, null, 2)}
                </pre>
              </div>
            </div>

            <div className="flex justify-end pt-2 border-t border-slate-100">
              <button onClick={() => setSelectedOrderDetails(null)} className="px-4 py-1.5 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs cursor-pointer transition">
                Close
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
}
