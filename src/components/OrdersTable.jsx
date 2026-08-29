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
  const [viewMode, setViewMode] = useState('table'); // 'table' | 'kanban'
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [overdueOnly, setOverdueOnly] = useState(false);
  const [selectedOrderDetails, setSelectedOrderDetails] = useState(null);

  const today = getTodayKolkataDate();

  const domainIcons = {
    tailor: '🧵',
    tiffin: '🍱',
    electrician: '⚡',
    baker: '🎂',
    general: '📦',
  };

  // Filter orders
  const filteredOrders = orders.filter((ord) => {
    if (selectedDomain && selectedDomain !== 'all' && ord.domain !== selectedDomain) {
      return false;
    }
    if (statusFilter !== 'all' && ord.status !== statusFilter) {
      return false;
    }
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

  const getDueDateBadge = (dueDate, status) => {
    if (!dueDate) {
      return (
        <span className="px-2.5 py-0.5 rounded-md text-[11px] bg-slate-100 text-slate-500 font-medium">
          No date
        </span>
      );
    }

    if (status === 'Completed' || status === 'Paid') {
      return (
        <span className="px-2.5 py-0.5 rounded-md text-[11px] bg-slate-100 text-slate-600 font-mono font-medium">
          {dueDate}
        </span>
      );
    }

    if (dueDate < today) {
      return (
        <span className="px-2.5 py-0.5 rounded-md text-[11px] bg-rose-50 text-rose-800 border border-rose-200 font-bold flex items-center space-x-1">
          <span>⚠️</span>
          <span>Overdue ({dueDate})</span>
        </span>
      );
    }

    if (dueDate === today) {
      return (
        <span className="px-2.5 py-0.5 rounded-md text-[11px] bg-amber-50 text-amber-800 border border-amber-300 font-bold flex items-center space-x-1">
          <span>⏰</span>
          <span>Today</span>
        </span>
      );
    }

    return (
      <span className="px-2.5 py-0.5 rounded-md text-[11px] bg-emerald-50 text-emerald-800 border border-emerald-200 font-medium">
        📅 {dueDate}
      </span>
    );
  };

  const kanbanStatuses = ['Pending', 'In Progress', 'Completed', 'Paid'];

  return (
    <div className="bg-white border border-slate-200/90 rounded-2xl p-5 shadow-xs">
      
      {/* Control Bar: Search, Filters & View Toggle */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-3 pb-4 border-b border-slate-200">
        
        {/* Left: Search & Filter Tabs */}
        <div className="flex flex-wrap items-center gap-2">
          {/* Search Input */}
          <div className="relative">
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search customer, item, ID..."
              className="bg-slate-50 border border-slate-300 focus:bg-white focus:border-amber-500 rounded-xl pl-8.5 pr-3 py-1.5 text-xs text-slate-900 placeholder:text-slate-400 focus:outline-none w-48 sm:w-60 shadow-2xs"
            />
            <span className="absolute left-2.5 top-2 text-xs text-slate-400">🔍</span>
          </div>

          {/* Status Filters */}
          <div className="flex items-center space-x-1 bg-slate-100 p-1 rounded-xl border border-slate-200 text-xs">
            {['all', 'Pending', 'In Progress', 'Completed', 'Paid'].map((st) => (
              <button
                key={st}
                onClick={() => setStatusFilter(st)}
                className={`px-2.5 py-1 rounded-lg font-bold transition cursor-pointer ${
                  statusFilter === st
                    ? 'bg-white text-slate-900 shadow-2xs'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                {st === 'all' ? 'All Status' : st}
              </button>
            ))}
          </div>

          {/* Overdue Only Filter */}
          <button
            onClick={() => setOverdueOnly(!overdueOnly)}
            className={`px-3 py-1.5 rounded-xl text-xs font-bold transition border flex items-center space-x-1 cursor-pointer shadow-2xs ${
              overdueOnly
                ? 'bg-rose-600 text-white border-rose-600'
                : 'bg-slate-50 text-slate-600 border-slate-300 hover:bg-slate-100'
            }`}
          >
            <span>⚠️ Overdue Only</span>
          </button>
        </div>

        {/* Right: View Mode Toggle & Count */}
        <div className="flex items-center space-x-3 self-end md:self-auto">
          <span className="text-xs text-slate-500 font-medium">
            Showing <strong className="text-slate-800 font-bold">{filteredOrders.length}</strong> orders
          </span>

          <div className="flex items-center bg-slate-100 p-1 rounded-xl border border-slate-200 text-xs">
            <button
              onClick={() => setViewMode('table')}
              className={`px-2.5 py-1 rounded-lg font-bold transition cursor-pointer ${
                viewMode === 'table' ? 'bg-white text-amber-700 shadow-2xs' : 'text-slate-600'
              }`}
              title="Table View"
            >
              📋 Table
            </button>
            <button
              onClick={() => setViewMode('kanban')}
              className={`px-2.5 py-1 rounded-lg font-bold transition cursor-pointer ${
                viewMode === 'kanban' ? 'bg-white text-amber-700 shadow-2xs' : 'text-slate-600'
              }`}
              title="Kanban View"
            >
              🗂️ Kanban
            </button>
          </div>
        </div>

      </div>

      {/* Content Area */}
      {filteredOrders.length === 0 ? (
        <div className="py-12 text-center text-slate-400">
          <div className="text-4xl mb-2">📭</div>
          <p className="text-sm font-bold text-slate-600">No orders found matching the current filters.</p>
          <p className="text-xs mt-1 text-slate-400">Try adjusting your search query or domain filter.</p>
        </div>
      ) : viewMode === 'table' ? (
        /* TABLE VIEW */
        <div className="overflow-x-auto mt-4">
          <table className="w-full text-left text-xs border-collapse">
            <thead>
              <tr className="border-b border-slate-200 text-[11px] uppercase tracking-wider text-slate-500 bg-slate-50/80 font-bold">
                <th className="py-3 px-3">Order ID & Domain</th>
                <th className="py-3 px-3">Customer</th>
                <th className="py-3 px-3">Items & Attributes</th>
                <th className="py-3 px-3">Due Date</th>
                <th className="py-3 px-3">Amount & Payment</th>
                <th className="py-3 px-3">Status</th>
                <th className="py-3 px-3 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {filteredOrders.map((ord) => (
                <tr key={ord.id} className="hover:bg-slate-50/90 transition group">
                  
                  {/* Order ID & Domain */}
                  <td className="py-3.5 px-3">
                    <div className="flex items-center space-x-2">
                      <span className="text-lg" title={ord.domain}>
                        {domainIcons[ord.domain] || '📦'}
                      </span>
                      <div>
                        <div className="font-mono font-bold text-slate-900">
                          {ord.orderId}
                        </div>
                        <span className="text-[10px] uppercase tracking-wider font-extrabold text-slate-500">
                          {ord.domain}
                        </span>
                      </div>
                    </div>
                  </td>

                  {/* Customer */}
                  <td className="py-3.5 px-3">
                    <button
                      onClick={() => onSelectCustomer(ord.customer)}
                      className="font-extrabold text-slate-900 hover:text-amber-600 hover:underline transition text-left cursor-pointer"
                    >
                      {ord.customer}
                    </button>
                    {ord.needs_clarification && (
                      <div className="text-[10px] text-amber-700 font-bold flex items-center space-x-1 mt-0.5">
                        <span>⚠️ Needs Clarification</span>
                      </div>
                    )}
                  </td>

                  {/* Items & Attributes */}
                  <td className="py-3.5 px-3 max-w-xs">
                    <div className="space-y-1">
                      {(ord.items || []).map((it, iIdx) => (
                        <div key={iIdx} className="flex flex-wrap items-center gap-1.5">
                          <span className="px-1.5 py-0.5 rounded bg-slate-100 text-slate-900 font-bold text-[10px] border border-slate-200">
                            {it.quantity}x
                          </span>
                          <span className="font-bold text-slate-800 capitalize">
                            {it.description}
                          </span>

                          {/* Attributes */}
                          {Object.entries(it.attributes || {}).map(([k, v]) => (
                            <span
                              key={k}
                              className="px-1.5 py-0.2 rounded bg-slate-100 text-slate-600 text-[9px] font-mono border border-slate-200"
                            >
                              {k}: {String(v)}
                            </span>
                          ))}
                        </div>
                      ))}
                    </div>
                  </td>

                  {/* Due Date */}
                  <td className="py-3.5 px-3 whitespace-nowrap">
                    {getDueDateBadge(ord.due_date, ord.status)}
                  </td>

                  {/* Amount & Payment */}
                  <td className="py-3.5 px-3 whitespace-nowrap">
                    <div className="flex items-center space-x-2">
                      <span className="font-mono font-bold text-slate-900">
                        {ord.amount ? `₹${ord.amount.toLocaleString('en-IN')}` : '—'}
                      </span>
                      <button
                        onClick={() => onTogglePaid(ord.id, !ord.paid)}
                        className={`px-2 py-0.5 rounded-md text-[10px] font-bold transition border cursor-pointer ${
                          ord.paid || ord.status === 'Paid'
                            ? 'bg-emerald-50 text-emerald-800 border-emerald-200'
                            : 'bg-rose-50 text-rose-800 border-rose-200 hover:bg-rose-100'
                        }`}
                      >
                        {ord.paid || ord.status === 'Paid' ? '✓ Paid' : 'Unpaid'}
                      </button>
                    </div>
                  </td>

                  {/* Status Dropdown */}
                  <td className="py-3.5 px-3">
                    <select
                      value={ord.status}
                      onChange={(e) => onUpdateStatus(ord.id, e.target.value)}
                      className={`text-xs font-bold rounded-lg px-2.5 py-1 focus:outline-none border cursor-pointer ${
                        ord.status === 'Completed' || ord.status === 'Paid'
                          ? 'bg-emerald-50 text-emerald-800 border-emerald-200'
                          : ord.status === 'In Progress'
                          ? 'bg-indigo-50 text-indigo-800 border-indigo-200'
                          : 'bg-amber-50 text-amber-900 border-amber-200'
                      }`}
                    >
                      <option value="Pending">Pending</option>
                      <option value="In Progress">In Progress</option>
                      <option value="Completed">Completed</option>
                      <option value="Paid">Paid</option>
                    </select>
                  </td>

                  {/* Actions */}
                  <td className="py-3.5 px-3 text-right">
                    <div className="flex items-center justify-end space-x-1.5">
                      <button
                        onClick={() => setSelectedOrderDetails(ord)}
                        className="p-1.5 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs transition cursor-pointer border border-slate-200"
                        title="View Raw Message & Audit Log"
                      >
                        👁️
                      </button>
                      <button
                        onClick={() => onDeleteOrder(ord.id)}
                        className="p-1.5 rounded-lg bg-rose-50 hover:bg-rose-100 text-rose-700 text-xs transition cursor-pointer border border-rose-200"
                        title="Delete Order"
                      >
                        🗑️
                      </button>
                    </div>
                  </td>

                </tr>
              ))}
            </tbody>
          </table>
        </div>
      ) : (
        /* KANBAN BOARD VIEW */
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mt-4">
          {kanbanStatuses.map((statusKey) => {
            const columnOrders = filteredOrders.filter((o) => o.status === statusKey);
            return (
              <div
                key={statusKey}
                className="bg-slate-50 border border-slate-200 rounded-xl p-3 flex flex-col h-[520px]"
              >
                {/* Column Header */}
                <div className="flex items-center justify-between pb-2 mb-2 border-b border-slate-200">
                  <div className="flex items-center space-x-1.5">
                    <span className="text-xs font-bold text-slate-800">{statusKey}</span>
                    <span className="w-5 h-5 rounded-full bg-white text-slate-700 text-[10px] font-bold flex items-center justify-center border border-slate-200 shadow-2xs">
                      {columnOrders.length}
                    </span>
                  </div>
                </div>

                {/* Cards Container */}
                <div className="flex-1 overflow-y-auto space-y-2.5 pr-1">
                  {columnOrders.map((ord) => (
                    <div
                      key={ord.id}
                      className="bg-white border border-slate-200 hover:border-slate-300 rounded-xl p-3 shadow-xs space-y-2 transition"
                    >
                      <div className="flex items-center justify-between text-xs">
                        <span className="font-mono font-bold text-amber-700">
                          {domainIcons[ord.domain]} {ord.orderId}
                        </span>
                        <span className="font-mono text-slate-900 font-bold">
                          ₹{ord.amount || 0}
                        </span>
                      </div>

                      <div>
                        <button
                          onClick={() => onSelectCustomer(ord.customer)}
                          className="text-xs font-bold text-slate-900 hover:text-amber-600 text-left cursor-pointer"
                        >
                          {ord.customer}
                        </button>
                        <div className="text-[11px] text-slate-500 mt-0.5 line-clamp-1">
                          {(ord.items || []).map(i => `${i.quantity}x ${i.description}`).join(', ')}
                        </div>
                      </div>

                      <div className="flex items-center justify-between pt-1.5 border-t border-slate-100 text-[10px]">
                        {getDueDateBadge(ord.due_date, ord.status)}
                        <select
                          value={ord.status}
                          onChange={(e) => onUpdateStatus(ord.id, e.target.value)}
                          className="bg-slate-50 text-slate-700 text-[10px] rounded p-1 border border-slate-200 font-medium cursor-pointer"
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

      {/* Raw Message & Order Details Modal */}
      {selectedOrderDetails && (
        <div className="fixed inset-0 z-50 bg-black/40 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white border border-slate-200 rounded-2xl max-w-lg w-full p-5 shadow-2xl space-y-4">
            <div className="flex items-center justify-between border-b border-slate-200 pb-3">
              <h3 className="text-base font-bold text-slate-900 flex items-center space-x-2">
                <span>{domainIcons[selectedOrderDetails.domain]}</span>
                <span>Order Details ({selectedOrderDetails.orderId})</span>
              </h3>
              <button
                onClick={() => setSelectedOrderDetails(null)}
                className="text-slate-400 hover:text-slate-700 text-lg font-bold cursor-pointer"
              >
                ✕
              </button>
            </div>

            <div className="space-y-3 text-xs">
              <div>
                <label className="text-slate-500 font-bold block mb-1">Customer</label>
                <div className="text-slate-900 font-bold bg-slate-50 p-2.5 rounded-lg border border-slate-200">
                  {selectedOrderDetails.customer}
                </div>
              </div>

              <div>
                <label className="text-slate-500 font-bold block mb-1">Original Raw Message</label>
                <div className="text-slate-800 font-sans bg-slate-50 p-3 rounded-lg border border-slate-200 whitespace-pre-wrap leading-relaxed">
                  {selectedOrderDetails.raw_message || '<No raw message recorded>'}
                </div>
              </div>

              <div>
                <label className="text-slate-500 font-bold block mb-1">Items & Attributes</label>
                <pre className="text-slate-800 font-mono bg-slate-50 p-3 rounded-lg border border-slate-200 max-h-36 overflow-y-auto text-[11px]">
                  {JSON.stringify(selectedOrderDetails.items, null, 2)}
                </pre>
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="text-slate-500 font-bold block mb-0.5">Created Date</label>
                  <div className="text-slate-700 font-mono bg-slate-50 p-2 rounded-lg border border-slate-200">
                    {selectedOrderDetails.created_at ? selectedOrderDetails.created_at.slice(0, 19).replace('T', ' ') : '—'}
                  </div>
                </div>
                <div>
                  <label className="text-slate-500 font-bold block mb-0.5">Confidence Score</label>
                  <div className="text-amber-800 font-mono font-bold bg-amber-50 p-2 rounded-lg border border-amber-200">
                    {Math.round((selectedOrderDetails.confidence || 0.8) * 100)}%
                  </div>
                </div>
              </div>
            </div>

            <div className="flex justify-end pt-2 border-t border-slate-200">
              <button
                onClick={() => setSelectedOrderDetails(null)}
                className="px-4 py-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-800 font-bold text-xs cursor-pointer"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
}
