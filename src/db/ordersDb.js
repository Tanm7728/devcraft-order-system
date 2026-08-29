import Dexie from 'dexie';

/**
 * KaamFlow Database — High-Performance Dexie.js (IndexedDB) Wrapper
 * Designed for offline-first resilience with local transaction logging.
 */
export const db = new Dexie('KaamFlowDB');

db.version(1).stores({
  orders: '++id, orderId, customer, domain, status, due_date, amount, paid, needs_clarification, confidence, created_at, updated_at',
  syncLog: '++id, orderId, deviceId, timestamp, opType, field',
  conflicts: '++id, orderId, timestamp, resolved, type',
  settings: 'key, value',
});

/**
 * Helper to get current Asia/Kolkata ISO Date string (YYYY-MM-DD)
 */
export function getTodayKolkataDate() {
  const now = new Date();
  const utc = now.getTime() + (now.getTimezoneOffset() * 60000);
  const kolkataTime = new Date(utc + (3600000 * 5.5));
  return kolkataTime.toISOString().slice(0, 10);
}

/**
 * Helper to generate stable short ID
 */
export function generateOrderId() {
  return 'ord-' + Math.random().toString(36).substring(2, 8).toUpperCase();
}

/**
 * Create a new Order in IndexedDB
 */
export async function createOrder(parsedData, rawMessage = '', domain = 'general') {
  const today = getTodayKolkataDate();
  const orderRecord = {
    orderId: parsedData.id || generateOrderId(),
    customer: parsedData.customer || 'Walk-in Customer',
    domain: parsedData.domain || domain || 'tailor',
    items: parsedData.items || [],
    due_date: parsedData.due_date || null,
    amount: parsedData.amount !== null && parsedData.amount !== undefined ? Number(parsedData.amount) : null,
    paid: false,
    status: 'Pending', // Pending | In Progress | Completed | Paid | Cancelled
    references_prior_order: Boolean(parsedData.references_prior_order),
    confidence: parsedData.confidence !== undefined ? parsedData.confidence : 0.85,
    needs_clarification: Boolean(parsedData.needs_clarification),
    raw_message: rawMessage,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
    created_date: today,
    deviceId: 'DEV-A',
  };

  const id = await db.orders.add(orderRecord);

  // Append to sync log for deterministic synchronization
  await db.syncLog.add({
    orderId: orderRecord.orderId,
    deviceId: 'DEV-A',
    timestamp: new Date().toISOString(),
    opType: 'CREATE',
    field: '*',
    value: orderRecord,
  });

  return { ...orderRecord, id };
}

/**
 * Update an existing Order in IndexedDB
 */
export async function updateOrder(id, patch, deviceId = 'DEV-A') {
  const current = await db.orders.get(id);
  if (!current) throw new Error(`Order with ID ${id} not found.`);

  const updatedRecord = {
    ...current,
    ...patch,
    updated_at: new Date().toISOString(),
  };

  // If status is marked as 'Paid', update paid boolean
  if (patch.status === 'Paid') {
    updatedRecord.paid = true;
  }

  await db.orders.put(updatedRecord);

  // Log each modified field
  for (const key of Object.keys(patch)) {
    await db.syncLog.add({
      orderId: current.orderId,
      deviceId,
      timestamp: new Date().toISOString(),
      opType: 'UPDATE',
      field: key,
      value: patch[key],
    });
  }

  return updatedRecord;
}

/**
 * Delete an Order from IndexedDB
 */
export async function deleteOrder(id, deviceId = 'DEV-A') {
  const current = await db.orders.get(id);
  if (!current) return false;

  await db.orders.delete(id);

  await db.syncLog.add({
    orderId: current.orderId,
    deviceId,
    timestamp: new Date().toISOString(),
    opType: 'DELETE',
    field: '*',
    value: null,
  });

  return true;
}

/**
 * Get all Orders with optional filtering and sorting
 */
export async function getAllOrders(filters = {}) {
  let collection = db.orders.toCollection();

  let orders = await collection.reverse().sortBy('created_at');

  if (filters.domain && filters.domain !== 'all') {
    orders = orders.filter(o => o.domain === filters.domain);
  }

  if (filters.status && filters.status !== 'all') {
    orders = orders.filter(o => o.status === filters.status);
  }

  if (filters.search) {
    const q = filters.search.toLowerCase();
    orders = orders.filter(o =>
      (o.customer && o.customer.toLowerCase().includes(q)) ||
      (o.orderId && o.orderId.toLowerCase().includes(q)) ||
      (o.raw_message && o.raw_message.toLowerCase().includes(q)) ||
      (o.items && o.items.some(i => i.description.toLowerCase().includes(q)))
    );
  }

  return orders;
}

/**
 * Operational Query 1: Due Today & Overdue
 */
export async function getDueAndOverdueMetrics() {
  const today = getTodayKolkataDate();
  const allOrders = await db.orders.toArray();

  const dueToday = [];
  const overdue = [];
  const upcoming = [];

  for (const ord of allOrders) {
    if (ord.status === 'Completed' || ord.status === 'Paid') continue;
    if (!ord.due_date) continue;

    if (ord.due_date === today) {
      dueToday.push(ord);
    } else if (ord.due_date < today) {
      overdue.push(ord);
    } else {
      upcoming.push(ord);
    }
  }

  return {
    todayDate: today,
    dueTodayCount: dueToday.length,
    overdueCount: overdue.length,
    dueToday,
    overdue,
    upcomingCount: upcoming.length,
  };
}

/**
 * Operational Query 2: Unpaid Receivables & Total Owed
 */
export async function getUnpaidReceivablesMetrics() {
  const allOrders = await db.orders.toArray();

  let totalUnpaidAmount = 0;
  const customerDebts = {};

  for (const ord of allOrders) {
    if (!ord.paid && ord.status !== 'Paid' && ord.amount && ord.amount > 0) {
      totalUnpaidAmount += ord.amount;
      const cust = ord.customer || 'Unknown Customer';
      if (!customerDebts[cust]) {
        customerDebts[cust] = {
          customer: cust,
          totalOwed: 0,
          orders: [],
        };
      }
      customerDebts[cust].totalOwed += ord.amount;
      customerDebts[cust].orders.push({
        orderId: ord.orderId,
        id: ord.id,
        amount: ord.amount,
        due_date: ord.due_date,
        items: ord.items,
        status: ord.status,
      });
    }
  }

  const sortedDebtors = Object.values(customerDebts).sort((a, b) => b.totalOwed - a.totalOwed);

  return {
    totalUnpaidAmount,
    debtorCount: sortedDebtors.length,
    debtors: sortedDebtors,
  };
}

/**
 * Operational Query 3: Customer Order History Lookup
 */
export async function getCustomerOrderHistory(customerName) {
  if (!customerName) return [];
  const allOrders = await db.orders.toArray();

  const query = customerName.trim().toLowerCase();
  const customerOrders = allOrders.filter(o =>
    o.customer && o.customer.toLowerCase().includes(query)
  ).sort((a, b) => new Date(b.created_at) - new Date(a.created_at));

  // Extract recurring attributes and measurements
  const measurementHistory = [];
  for (const ord of customerOrders) {
    for (const item of (ord.items || [])) {
      if (item.attributes && Object.keys(item.attributes).length > 0) {
        measurementHistory.push({
          date: ord.due_date || ord.created_at.slice(0, 10),
          item: item.description,
          attributes: item.attributes,
        });
      }
    }
  }

  return {
    customer: customerName,
    totalOrders: customerOrders.length,
    totalSpent: customerOrders.reduce((sum, o) => sum + (o.amount || 0), 0),
    orders: customerOrders,
    measurementHistory,
  };
}

/**
 * Operational Query 4: Committed Weekly Capacity
 */
export async function getCommittedWeeklyCapacity() {
  const allOrders = await db.orders.toArray();
  const today = new Date();
  
  // Calculate start (Monday) and end (Sunday) of current week
  const day = today.getDay();
  const diffToMonday = today.getDate() - day + (day === 0 ? -6 : 1);
  const monday = new Date(today.setDate(diffToMonday));
  monday.setHours(0, 0, 0, 0);

  const sunday = new Date(monday);
  sunday.setDate(monday.getDate() + 6);
  sunday.setHours(23, 59, 59, 999);

  const monStr = monday.toISOString().slice(0, 10);
  const sunStr = sunday.toISOString().slice(0, 10);

  let totalItemsCommitted = 0;
  let activeOrderCount = 0;
  const dailyBreakdown = { Mon: 0, Tue: 0, Wed: 0, Thu: 0, Fri: 0, Sat: 0, Sun: 0 };
  const dayKeys = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

  for (const ord of allOrders) {
    if (ord.status === 'Completed' || ord.status === 'Paid') continue;
    if (ord.due_date && ord.due_date >= monStr && ord.due_date <= sunStr) {
      activeOrderCount++;
      const itemCount = (ord.items || []).reduce((acc, i) => acc + (i.quantity || 1), 0);
      totalItemsCommitted += itemCount;

      const d = new Date(ord.due_date);
      const dName = dayKeys[d.getDay()];
      if (dailyBreakdown[dName] !== undefined) {
        dailyBreakdown[dName] += itemCount;
      }
    }
  }

  // Define operator max weekly capacity (e.g. 35 items)
  const MAX_WEEKLY_CAPACITY = 35;
  const utilizationPercent = Math.min(100, Math.round((totalItemsCommitted / MAX_WEEKLY_CAPACITY) * 100));

  return {
    weekRange: `${monStr} to ${sunStr}`,
    totalItemsCommitted,
    activeOrderCount,
    maxCapacity: MAX_WEEKLY_CAPACITY,
    utilizationPercent,
    dailyBreakdown,
  };
}

/**
 * Smart Revenue & Business Health Analytics
 */
export async function getBusinessHealthAnalytics() {
  const allOrders = await db.orders.toArray();

  let totalRevenue = 0;
  let collectedRevenue = 0;
  const domainRevenue = { tailor: 0, tiffin: 0, electrician: 0, baker: 0, general: 0 };
  const statusCounts = { Pending: 0, 'In Progress': 0, Completed: 0, Paid: 0 };

  for (const ord of allOrders) {
    const amt = Number(ord.amount) || 0;
    totalRevenue += amt;
    if (ord.paid || ord.status === 'Paid') {
      collectedRevenue += amt;
    }

    const d = ord.domain || 'general';
    if (domainRevenue[d] !== undefined) {
      domainRevenue[d] += amt;
    } else {
      domainRevenue.general += amt;
    }

    const st = ord.status || 'Pending';
    if (statusCounts[st] !== undefined) {
      statusCounts[st]++;
    }
  }

  return {
    totalOrdersCount: allOrders.length,
    totalRevenue,
    collectedRevenue,
    pendingRevenue: totalRevenue - collectedRevenue,
    domainRevenue,
    statusCounts,
  };
}

/**
 * 1-Click JSON Backup Export (Supports Test C cross-device testing)
 */
export async function exportDatabaseToJson() {
  const orders = await db.orders.toArray();
  const syncLog = await db.syncLog.toArray();
  const conflicts = await db.conflicts.toArray();

  const backupData = {
    app: 'KaamFlow',
    version: '1.0.0',
    exportedAt: new Date().toISOString(),
    recordsCount: orders.length,
    data: {
      orders,
      syncLog,
      conflicts,
    },
  };

  return JSON.stringify(backupData, null, 2);
}

/**
 * 1-Click JSON Backup Restore
 */
export async function importDatabaseFromJson(jsonString) {
  try {
    const parsed = typeof jsonString === 'string' ? JSON.parse(jsonString) : jsonString;
    if (!parsed.data || !Array.isArray(parsed.data.orders)) {
      throw new Error('Invalid KaamFlow backup format.');
    }

    await db.transaction('rw', db.orders, db.syncLog, db.conflicts, async () => {
      await db.orders.clear();
      await db.syncLog.clear();
      await db.conflicts.clear();

      if (parsed.data.orders.length > 0) {
        await db.orders.bulkAdd(parsed.data.orders);
      }
      if (parsed.data.syncLog && parsed.data.syncLog.length > 0) {
        await db.syncLog.bulkAdd(parsed.data.syncLog);
      }
      if (parsed.data.conflicts && parsed.data.conflicts.length > 0) {
        await db.conflicts.bulkAdd(parsed.data.conflicts);
      }
    });

    return { success: true, count: parsed.data.orders.length };
  } catch (err) {
    return { success: false, error: err.message };
  }
}

/**
 * Seed realistic multi-domain starter orders for live judge demos
 */
export async function seedDemoDataset() {
  const count = await db.orders.count();
  if (count > 0) return { alreadySeeded: true, count };

  const today = getTodayKolkataDate();
  const tomorrow = new Date(Date.now() + 86400000).toISOString().slice(0, 10);
  const yesterday = new Date(Date.now() - 86400000).toISOString().slice(0, 10);

  const sampleOrders = [
    {
      orderId: 'ORD-TL-101',
      customer: 'Pooja Verma',
      domain: 'tailor',
      items: [{ description: 'blouse', quantity: 2, attributes: { chest: 34, waist: 28, fabric: 'silk', color: 'red' } }],
      due_date: today,
      amount: 1200,
      paid: false,
      status: 'In Progress',
      references_prior_order: true,
      confidence: 0.96,
      needs_clarification: false,
      raw_message: 'Pooja didi bol rahi hu, 2 silk blouse silna hai red color ka kal tak. Pichli baar jaise naap 34 chest.',
      created_at: new Date(Date.now() - 3600000 * 24).toISOString(),
      updated_at: new Date().toISOString(),
      deviceId: 'DEV-A',
    },
    {
      orderId: 'ORD-TF-202',
      customer: 'Amit Sharma',
      domain: 'tiffin',
      items: [{ description: 'lunch', quantity: 1, attributes: { meal: 'lunch', spice_level: 'medium', roti_count: 4, days: 5 } }],
      due_date: tomorrow,
      amount: 750,
      paid: true,
      status: 'Pending',
      references_prior_order: false,
      confidence: 0.94,
      needs_clarification: false,
      raw_message: 'Amit Sharma. 5 din ke liye lunch tiffin lagado kal se, medium teekha aur 4 roti.',
      created_at: new Date(Date.now() - 3600000 * 12).toISOString(),
      updated_at: new Date().toISOString(),
      deviceId: 'DEV-A',
    },
    {
      orderId: 'ORD-EL-303',
      customer: 'Rajesh Gupta',
      domain: 'electrician',
      items: [{ description: 'geyser', quantity: 1, attributes: { appliance: 'geyser', issue: 'not heating', room: 'bathroom' } }],
      due_date: yesterday,
      amount: 450,
      paid: false,
      status: 'Pending',
      references_prior_order: false,
      confidence: 0.92,
      needs_clarification: false,
      raw_message: 'Bhaiya Rajesh Gupta bol raha hu, bathroom ka geyser garam nahi kar raha, jaldi aakar check karlo.',
      created_at: new Date(Date.now() - 3600000 * 48).toISOString(),
      updated_at: new Date().toISOString(),
      deviceId: 'DEV-A',
    },
    {
      orderId: 'ORD-BK-404',
      customer: 'Sunita Rao',
      domain: 'baker',
      items: [{ description: 'cake', quantity: 1, attributes: { flavour: 'chocolate', weight_kg: 1.5, egg_free: true, message_on_cake: 'Happy Birthday Aarav' } }],
      due_date: today,
      amount: 1100,
      paid: false,
      status: 'Pending',
      references_prior_order: false,
      confidence: 0.98,
      needs_clarification: false,
      raw_message: 'Sunita Rao ke liye 1.5kg chocolate eggless cake chahiye aaj shaam tak, Happy Birthday Aarav likh dena.',
      created_at: new Date(Date.now() - 3600000 * 5).toISOString(),
      updated_at: new Date().toISOString(),
      deviceId: 'DEV-A',
    },
    {
      orderId: 'ORD-TL-505',
      customer: 'Vikas Mehra',
      domain: 'tailor',
      items: [{ description: 'kurta', quantity: 2, attributes: { color: 'white', size: 'L' } }],
      due_date: null,
      amount: 800,
      paid: false,
      status: 'Pending',
      references_prior_order: false,
      confidence: 0.70,
      needs_clarification: true,
      raw_message: 'Vikas Mehra. 2 white kurta silwana hai jaldi mein. Naap phone pe batata hu.',
      created_at: new Date(Date.now() - 3600000 * 2).toISOString(),
      updated_at: new Date().toISOString(),
      deviceId: 'DEV-A',
    },
  ];

  await db.orders.bulkAdd(sampleOrders);
  return { alreadySeeded: false, count: sampleOrders.length };
}
