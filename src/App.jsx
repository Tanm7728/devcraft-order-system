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
  const [selectedDomain, setSelectedDomain] = useState('all');
  const [toast, setToast] = useState(null);

  // Operational Metrics
  const [metrics, setMetrics] = useState({
    dueAndOverdue: { todayDate: '', dueTodayCount: 0, overdueCount: 0, upcomingCount: 0 },
    receivables: { totalUnpaidAmount: 0, debtorCount: 0, debtors: [] },
    capacity: { totalItemsCommitted: 0, activeOrderCount: 0, maxCapacity: 35, utilizationPercent: 0, dailyBreakdown: {} },
  });

  // Modals state
  const [isConflictModalOpen, setIsConflictModalOpen] = useState(false);
  const [isCustomerHistoryModalOpen, setIsCustomerHistoryModalOpen] = useState(false);
  const [historyCustomerName, setHistoryCustomerName] = useState('');
  const [isReceivablesModalOpen, setIsReceivablesModalOpen] = useState(false);
  const [isBackupModalOpen, setIsBackupModalOpen] = useState(false);
  const [isHealthModalOpen, setIsHealthModalOpen] = useState(false);

  const showToast = (message, type = 'success') => {
    setToast({ message, type });
    setTimeout(() => setToast(null), 3500);
  };

  // Fetch all orders & operational metrics from IndexedDB
  const refreshAllData = useCallback(async () => {
    try {
      const all = await getAllOrders();
      setOrders(all);

      const [dueOverdueRes, receivablesRes, capacityRes] = await Promise.all([
        getDueAndOverdueMetrics(),
        getUnpaidReceivablesMetrics(),
        getCommittedWeeklyCapacity(),
      ]);

      setMetrics({
        dueAndOverdue: dueOverdueRes,
        receivables: receivablesRes,
        capacity: capacityRes,
      });
    } catch (err) {
      console.error('Error fetching data from Dexie DB:', err);
    }
  }, []);

  // Initialize and auto-seed if empty
  useEffect(() => {
    const init = async () => {
      await seedDemoDataset();
      await refreshAllData();
    };
    init();
  }, [refreshAllData]);

  // Save new order from Quick Intake
  const handleSaveOrder = async (parsedData, rawMessage, domain) => {
    try {
      const saved = await createOrder(parsedData, rawMessage, domain);
      await refreshAllData();
      showToast(`Order ${saved.orderId} saved locally in offline DB!`, 'success');
    } catch (err) {
      showToast(`Failed to save order: ${err.message}`, 'error');
    }
  };

  // Update order status
  const handleUpdateStatus = async (id, newStatus) => {
    try {
      await updateOrder(id, { status: newStatus });
      await refreshAllData();
      showToast(`Order status updated to ${newStatus}`);
    } catch (err) {
      showToast(`Failed to update status: ${err.message}`, 'error');
    }
  };

  // Toggle order payment
  const handleTogglePaid = async (id, isPaid) => {
    try {
      await updateOrder(id, { paid: isPaid, status: isPaid ? 'Paid' : 'Pending' });
      await refreshAllData();
      showToast(isPaid ? 'Order marked as Paid!' : 'Order marked as Unpaid');
    } catch (err) {
      showToast(`Failed to update payment: ${err.message}`, 'error');
    }
  };

  // Delete order
  const handleDeleteOrder = async (id) => {
    if (window.confirm('Are you sure you want to delete this order?')) {
      try {
        await deleteOrder(id);
        await refreshAllData();
        showToast('Order deleted from local database.');
      } catch (err) {
        showToast(`Failed to delete: ${err.message}`, 'error');
      }
    }
  };

  // Manual seed demo data
  const handleSeedData = async () => {
    await seedDemoDataset();
    await refreshAllData();
    showToast('Demo dataset loaded successfully!');
  };

  // Open customer history lookup
  const handleOpenCustomerLookup = (custName = '') => {
    setHistoryCustomerName(custName);
    setIsCustomerHistoryModalOpen(true);
  };

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900 flex flex-col font-sans">
      
      {/* Top Navigation */}
      <Navbar
        selectedDomain={selectedDomain}
        setSelectedDomain={setSelectedDomain}
        onOpenBackup={() => setIsBackupModalOpen(true)}
        onOpenConflict={() => setIsConflictModalOpen(true)}
        onOpenHealth={() => setIsHealthModalOpen(true)}
        onSeedData={handleSeedData}
        ordersCount={orders.length}
      />

      {/* Main Container */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-6">
        
        {/* Toast Notification */}
        {toast && (
          <div className="fixed bottom-5 right-5 z-50 animate-bounce">
            <div className={`px-4 py-3 rounded-xl shadow-xl text-xs font-bold flex items-center space-x-2 border ${
              toast.type === 'success'
                ? 'bg-emerald-50 text-emerald-900 border-emerald-300 shadow-emerald-500/10'
                : 'bg-rose-50 text-rose-900 border-rose-300 shadow-rose-500/10'
            }`}>
              <span>{toast.type === 'success' ? '✅' : '⚠️'}</span>
              <span>{toast.message}</span>
            </div>
          </div>
        )}

        {/* 4 Operational Insights Cards */}
        <OperationalInsights
          metrics={metrics}
          onFilterDueToday={() => {
            showToast('Showing Due Today orders in table');
          }}
          onFilterOverdue={() => {
            showToast('Showing Overdue orders in table');
          }}
          onOpenCustomerLookup={() => handleOpenCustomerLookup('')}
          onOpenReceivablesModal={() => setIsReceivablesModalOpen(true)}
        />

        {/* Universal Smart Intake Box & Real-Time Parser */}
        <QuickIntake
          onSaveOrder={handleSaveOrder}
        />

        {/* Orders Table & Kanban Board */}
        <OrdersTable
          orders={orders}
          selectedDomain={selectedDomain}
          onUpdateStatus={handleUpdateStatus}
          onTogglePaid={handleTogglePaid}
          onDeleteOrder={handleDeleteOrder}
          onSelectCustomer={handleOpenCustomerLookup}
        />

      </main>

      {/* Footer */}
      <footer className="border-t border-slate-200 bg-white py-4 text-center text-xs text-slate-500">
        <div className="max-w-7xl mx-auto px-4 flex flex-col sm:flex-row items-center justify-between gap-2">
          <div>
            ⚡ <strong className="text-slate-800">KaamFlow</strong> — Offline-First Intelligent Order Intake & Management for Micro-Enterprises
          </div>
          <div className="font-mono text-[11px] text-slate-500 font-semibold">
            DevCraft Edition • 100% Deterministic Sync CRDT & Multi-Domain Dynamic Parsing
          </div>
        </div>
      </footer>

      {/* Interactive Modals */}
      <ConflictModal
        isOpen={isConflictModalOpen}
        onClose={() => setIsConflictModalOpen(false)}
      />

      <CustomerHistoryModal
        isOpen={isCustomerHistoryModalOpen}
        onClose={() => setIsCustomerHistoryModalOpen(false)}
        initialCustomer={historyCustomerName}
      />

      <ReceivablesModal
        isOpen={isReceivablesModalOpen}
        onClose={() => setIsReceivablesModalOpen(false)}
        receivables={metrics.receivables}
        onMarkPaid={handleTogglePaid}
      />

      <BackupModal
        isOpen={isBackupModalOpen}
        onClose={() => setIsBackupModalOpen(false)}
        onRefreshData={refreshAllData}
      />

      <BusinessHealthModal
        isOpen={isHealthModalOpen}
        onClose={() => setIsHealthModalOpen(false)}
      />

    </div>
  );
}