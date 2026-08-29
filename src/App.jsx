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
      const [dueOverdueRes, receivablesRes, capacityRes] = await Promise.all([
        getDueAndOverdueMetrics(),
        getUnpaidReceivablesMetrics(),
        getCommittedWeeklyCapacity(),
      ]);
      setMetrics({ dueAndOverdue: dueOverdueRes, receivables: receivablesRes, capacity: capacityRes });
    } catch (err) {
      console.error('Error fetching data from Dexie DB:', err);
    }
  }, []);

  useEffect(() => {
    const init = async () => {
      await seedDemoDataset();
      await refreshAllData();
    };
    init();
  }, [refreshAllData]);

  const handleSaveOrder = async (parsedData, rawMessage, domain) => {
    try {
      const saved = await createOrder(parsedData, rawMessage, domain);
      await refreshAllData();
      showToast(`Order ${saved.orderId} saved`);
    } catch (err) {
      showToast(`Save failed: ${err.message}`, 'error');
    }
  };

  const handleUpdateStatus = async (id, newStatus) => {
    try {
      await updateOrder(id, { status: newStatus });
      await refreshAllData();
    } catch (err) {
      showToast(`Update failed: ${err.message}`, 'error');
    }
  };

  const handleTogglePaid = async (id, isPaid) => {
    try {
      await updateOrder(id, { paid: isPaid, status: isPaid ? 'Paid' : 'Pending' });
      await refreshAllData();
    } catch (err) {
      showToast(`Update failed: ${err.message}`, 'error');
    }
  };

  const handleDeleteOrder = async (id) => {
    if (window.confirm('Delete this order?')) {
      try {
        await deleteOrder(id);
        await refreshAllData();
      } catch (err) {
        showToast(`Delete failed: ${err.message}`, 'error');
      }
    }
  };

  const handleSeedData = async () => {
    await seedDemoDataset();
    await refreshAllData();
    showToast('Demo data loaded');
  };

  const handleOpenCustomerLookup = (custName = '') => {
    setHistoryCustomerName(custName);
    setIsCustomerHistoryModalOpen(true);
  };

  return (
    <div className="min-h-screen bg-slate-50 text-slate-800 flex flex-col font-sans antialiased">

      <Navbar
        selectedDomain={selectedDomain}
        setSelectedDomain={setSelectedDomain}
        onOpenBackup={() => setIsBackupModalOpen(true)}
        onOpenConflict={() => setIsConflictModalOpen(true)}
        onOpenHealth={() => setIsHealthModalOpen(true)}
        onSeedData={handleSeedData}
        ordersCount={orders.length}
      />

      <main className="flex-1 w-full max-w-[1600px] mx-auto px-4 md:px-8 py-6">

        {/* Toast */}
        {toast && (
          <div className="fixed bottom-4 right-4 z-50">
            <div className={`px-4 py-2.5 rounded-lg shadow-lg text-xs font-medium ${
              toast.type === 'success' ? 'bg-slate-900 text-white' : 'bg-red-600 text-white'
            }`}>
              {toast.message}
            </div>
          </div>
        )}

        <OperationalInsights
          metrics={metrics}
          onFilterDueToday={() => showToast('Filtered: Due Today')}
          onFilterOverdue={() => showToast('Filtered: Overdue')}
          onOpenCustomerLookup={() => handleOpenCustomerLookup('')}
          onOpenReceivablesModal={() => setIsReceivablesModalOpen(true)}
        />

        <QuickIntake onSaveOrder={handleSaveOrder} />

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
      <footer className="border-t border-slate-100 bg-white py-3 text-center">
        <p className="text-[11px] text-slate-400">KaamFlow · Offline-First Order Management</p>
      </footer>

      {/* Modals */}
      <ConflictModal isOpen={isConflictModalOpen} onClose={() => setIsConflictModalOpen(false)} />
      <CustomerHistoryModal isOpen={isCustomerHistoryModalOpen} onClose={() => setIsCustomerHistoryModalOpen(false)} initialCustomer={historyCustomerName} />
      <ReceivablesModal isOpen={isReceivablesModalOpen} onClose={() => setIsReceivablesModalOpen(false)} receivables={metrics.receivables} onMarkPaid={handleTogglePaid} />
      <BackupModal isOpen={isBackupModalOpen} onClose={() => setIsBackupModalOpen(false)} onRefreshData={refreshAllData} />
      <BusinessHealthModal isOpen={isHealthModalOpen} onClose={() => setIsHealthModalOpen(false)} />

    </div>
  );
}