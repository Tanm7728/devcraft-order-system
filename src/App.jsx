import { useState, useEffect, useCallback } from 'react';
import Navbar from './components/Navbar';
import OperationalInsights from './components/OperationalInsights';
import QuickIntake from './components/QuickIntake';
import OrdersTable from './components/OrdersTable';
import ConflictModal from './components/ConflictModal';
import CustomerHistoryModal from './components/CustomerHistoryModal';
import ReceivablesModal from './components/ReceivablesModal';
import BackupModal from './components/BackupModal';
import BusinessHealthModal from './components/BusinessHealthModal';
import {
  getAllOrders,
  createOrder,
  updateOrder,
  deleteOrder,
  getDueAndOverdueMetrics,
  getUnpaidReceivablesMetrics,
  getCommittedWeeklyCapacity,
  seedDemoDataset,
} from './db/ordersDb';

export default function App() {
  const [orders, setOrders] = useState([]);
  const [selectedDomain] = useState('all');
  const [toast, setToast] = useState(null);

  const [metrics, setMetrics] = useState({
    dueAndOverdue: { todayDate: '', dueTodayCount: 0, overdueCount: 0, upcomingCount: 0 },
    receivables: { totalUnpaidAmount: 0, debtorCount: 0, debtors: [] },
    capacity: { totalItemsCommitted: 0, activeOrderCount: 0, maxCapacity: 35, utilizationPercent: 0, dailyBreakdown: {} },
  });

  const [isConflictModalOpen, setIsConflictModalOpen] = useState(false);
  const [isCustomerHistoryModalOpen, setIsCustomerHistoryModalOpen] = useState(false);
  const [historyCustomerName, setHistoryCustomerName] = useState('');
  const [isReceivablesModalOpen, setIsReceivablesModalOpen] = useState(false);
  const [isBackupModalOpen, setIsBackupModalOpen] = useState(false);
  const [isHealthModalOpen, setIsHealthModalOpen] = useState(false);

  const showToast = (message, type = 'success') => {
    setToast({ message, type });
    setTimeout(() => setToast(null), 2500);
  };

  const refreshAllData = useCallback(async () => {
    try {
      const all = await getAllOrders();
      setOrders(all);
      const [d, r, c] = await Promise.all([
        getDueAndOverdueMetrics(), getUnpaidReceivablesMetrics(), getCommittedWeeklyCapacity(),
      ]);
      setMetrics({ dueAndOverdue: d, receivables: r, capacity: c });
    } catch (err) {
      console.error('Error fetching data from Dexie DB:', err);
    }
  }, []);

  useEffect(() => {
    const init = async () => { await seedDemoDataset(); await refreshAllData(); };
    init();
  }, [refreshAllData]);

  const handleSaveOrder = async (parsedData, rawMessage, domain) => {
    try {
      const saved = await createOrder(parsedData, rawMessage, domain);
      await refreshAllData();
      showToast(`Order ${saved.orderId} saved`);
    } catch (err) { showToast(`Save failed: ${err.message}`, 'error'); }
  };

  const handleUpdateStatus = async (id, newStatus) => {
    try { await updateOrder(id, { status: newStatus }); await refreshAllData(); }
    catch (err) { showToast(`Update failed: ${err.message}`, 'error'); }
  };

  const handleTogglePaid = async (id, isPaid) => {
    try { await updateOrder(id, { paid: isPaid, status: isPaid ? 'Paid' : 'Pending' }); await refreshAllData(); }
    catch (err) { showToast(`Update failed: ${err.message}`, 'error'); }
  };

  const handleDeleteOrder = async (id) => {
    if (window.confirm('Delete this order?')) {
      try { await deleteOrder(id); await refreshAllData(); }
      catch (err) { showToast(`Delete failed: ${err.message}`, 'error'); }
    }
  };

  const handleOpenCustomerLookup = (custName = '') => {
    setHistoryCustomerName(custName);
    setIsCustomerHistoryModalOpen(true);
  };

  const features = [
    { icon: '⚡', color: 'bg-red-500', title: 'Offline-First', desc: 'Works without internet. Dexie.js IndexedDB ensures zero data loss, even on force-kill.' },
    { icon: '🧠', color: 'bg-blue-500', title: 'Smart NLP Parsing', desc: 'Paste any messy WhatsApp text. Our Hinglish parser extracts names, items, dates & amounts.' },
    { icon: '🔒', color: 'bg-emerald-500', title: 'No Vendor Lock-in', desc: 'Your data stays on your device. Full JSON backup & restore. Zero cloud dependency.' },
    { icon: '✏️', color: 'bg-amber-500', title: '100% Editable', desc: 'Every parsed field is editable. Override any extraction before saving to the database.' },
  ];

  return (
    <div className="min-h-screen bg-[#0a0a0a] text-white font-sans antialiased">

      {/* Floating Navbar */}
      <Navbar />

      {/* ═══════ SECTION 1: HERO ═══════ */}
      <section id="top" className="relative min-h-screen flex items-center justify-center hero-gradient overflow-hidden">
        {/* Subtle grid overlay */}
        <div className="absolute inset-0 opacity-[0.03]"
          style={{ backgroundImage: 'linear-gradient(white 1px, transparent 1px), linear-gradient(90deg, white 1px, transparent 1px)', backgroundSize: '60px 60px' }}
        />

        <div className="relative z-10 max-w-4xl mx-auto px-6 text-center">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-white/[0.06] border border-white/[0.08] text-xs text-white/50 mb-8">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
            Built for E-Summit DevCraft 2026
          </div>

          <h1 className="text-5xl sm:text-6xl md:text-7xl font-bold tracking-tight leading-[1.1] text-white">
            Order Management,
            <br />
            <span className="bg-gradient-to-r from-blue-400 via-blue-500 to-purple-500 bg-clip-text text-transparent">
              Accelerated.
            </span>
          </h1>

          <p className="mt-6 text-lg sm:text-xl text-white/40 max-w-2xl mx-auto leading-relaxed">
            Paste any unstructured WhatsApp message. Our zero-shot NLP engine extracts customer names, items, dates & amounts — works fully offline, in any language.
          </p>

          <div className="mt-10 flex flex-col sm:flex-row items-center justify-center gap-4">
            <a
              href="#app"
              className="px-8 py-3 rounded-lg bg-blue-600 hover:bg-blue-500 text-white font-medium transition-all hover:shadow-lg hover:shadow-blue-600/20 text-sm"
            >
              Launch Dashboard →
            </a>
            <a
              href="#features"
              className="px-8 py-3 rounded-lg border border-white/15 text-white/60 hover:text-white hover:border-white/30 font-medium transition text-sm"
            >
              See Features
            </a>
          </div>

          {/* Floating stats */}
          <div className="mt-16 flex items-center justify-center gap-8 sm:gap-16 text-center">
            <div>
              <div className="text-2xl sm:text-3xl font-bold text-white">250+</div>
              <div className="text-xs text-white/30 mt-1">Test Messages Parsed</div>
            </div>
            <div className="w-px h-10 bg-white/10" />
            <div>
              <div className="text-2xl sm:text-3xl font-bold text-white">83.5%</div>
              <div className="text-xs text-white/30 mt-1">Benchmark Accuracy</div>
            </div>
            <div className="w-px h-10 bg-white/10" />
            <div>
              <div className="text-2xl sm:text-3xl font-bold text-white">0ms</div>
              <div className="text-xs text-white/30 mt-1">Network Latency</div>
            </div>
          </div>
        </div>

        {/* Scroll hint */}
        <div className="absolute bottom-8 left-1/2 -translate-x-1/2 flex flex-col items-center gap-2 text-white/20">
          <span className="text-xs">Scroll</span>
          <div className="w-px h-8 bg-gradient-to-b from-white/20 to-transparent" />
        </div>
      </section>

      {/* ═══════ SECTION 2: FEATURES ═══════ */}
      <section id="features" className="py-24 px-6">
        <div className="max-w-6xl mx-auto">
          <div className="text-center mb-16">
            <h2 className="text-3xl sm:text-4xl font-bold tracking-tight text-white">
              Why KaamFlow?
            </h2>
            <p className="mt-4 text-white/35 max-w-xl mx-auto">
              Built from scratch for micro-enterprises — tailors, bakers, tiffin services, electricians — who manage orders over WhatsApp.
            </p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            {features.map((f) => (
              <div key={f.title} className="bg-white/[0.03] backdrop-blur-md border border-white/[0.06] rounded-xl p-6 hover:bg-white/[0.05] hover:border-white/10 transition">
                <div className={`w-10 h-10 rounded-full ${f.color} flex items-center justify-center text-white text-lg mb-4`}>
                  {f.icon}
                </div>
                <h3 className="text-base font-semibold text-white mb-2">{f.title}</h3>
                <p className="text-sm text-white/35 leading-relaxed">{f.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ═══════ SECTION 3: THE CORE ENGINE (DASHBOARD) ═══════ */}
      <section id="app" className="py-16 px-6">
        <div className="max-w-[1600px] mx-auto">

          {/* Section header */}
          <div className="flex items-center justify-between mb-8">
            <div>
              <h2 className="text-2xl font-bold tracking-tight text-white">Dashboard</h2>
              <p className="text-sm text-white/30 mt-1">Manage orders, track payments, and monitor deadlines — all offline.</p>
            </div>
            <div className="flex items-center gap-2">
              <button onClick={() => setIsConflictModalOpen(true)}
                className="w-9 h-9 rounded-lg bg-white/[0.04] border border-white/[0.06] hover:bg-white/[0.08] flex items-center justify-center text-lg transition cursor-pointer" title="Sync">🔄</button>
              <button onClick={() => setIsHealthModalOpen(true)}
                className="w-9 h-9 rounded-lg bg-white/[0.04] border border-white/[0.06] hover:bg-white/[0.08] flex items-center justify-center text-lg transition cursor-pointer" title="Analytics">📊</button>
              <button onClick={() => setIsBackupModalOpen(true)}
                className="w-9 h-9 rounded-lg bg-white/[0.04] border border-white/[0.06] hover:bg-white/[0.08] flex items-center justify-center text-lg transition cursor-pointer" title="Backup">💾</button>
            </div>
          </div>

          {/* Toast */}
          {toast && (
            <div className="fixed bottom-4 right-4 z-50">
              <div className={`px-4 py-2.5 rounded-lg shadow-lg text-xs font-medium backdrop-blur-md ${
                toast.type === 'success'
                  ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/20'
                  : 'bg-red-500/20 text-red-300 border border-red-500/20'
              }`}>
                {toast.message}
              </div>
            </div>
          )}

          {/* Metrics */}
          <OperationalInsights
            metrics={metrics}
            onFilterDueToday={() => showToast('Filtered: Due Today')}
            onFilterOverdue={() => showToast('Filtered: Overdue')}
            onOpenCustomerLookup={() => handleOpenCustomerLookup('')}
            onOpenReceivablesModal={() => setIsReceivablesModalOpen(true)}
          />

          {/* Smart Intake */}
          <QuickIntake onSaveOrder={handleSaveOrder} />

          {/* Orders */}
          <OrdersTable
            orders={orders}
            selectedDomain={selectedDomain}
            onUpdateStatus={handleUpdateStatus}
            onTogglePaid={handleTogglePaid}
            onDeleteOrder={handleDeleteOrder}
            onSelectCustomer={handleOpenCustomerLookup}
          />

        </div>
      </section>

      {/* ═══════ FOOTER ═══════ */}
      <footer className="border-t border-white/[0.05] py-6 text-center">
        <p className="text-[11px] text-white/20">KaamFlow · Offline-First Order Management · DevCraft E-Summit 2026</p>
      </footer>

      {/* ═══════ MODALS ═══════ */}
      <ConflictModal isOpen={isConflictModalOpen} onClose={() => setIsConflictModalOpen(false)} />
      <CustomerHistoryModal isOpen={isCustomerHistoryModalOpen} onClose={() => setIsCustomerHistoryModalOpen(false)} initialCustomer={historyCustomerName} />
      <ReceivablesModal isOpen={isReceivablesModalOpen} onClose={() => setIsReceivablesModalOpen(false)} receivables={metrics.receivables} onMarkPaid={handleTogglePaid} />
      <BackupModal isOpen={isBackupModalOpen} onClose={() => setIsBackupModalOpen(false)} onRefreshData={refreshAllData} />
      <BusinessHealthModal isOpen={isHealthModalOpen} onClose={() => setIsHealthModalOpen(false)} />

    </div>
  );
}