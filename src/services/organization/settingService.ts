// src/services/admin/adminPayMongoService.ts

import type { AdminPayMongoTxn } from '../../store/adminStore';

/* ============================================
   MOCK DATA
   ============================================ */

let TXNS: AdminPayMongoTxn[] = [
  { id: 'pi_3NqA1b2C3dE4fG5h', customer: 'Juan Dela Cruz', channel: 'QR Ph',  amount: 1000, status: 'Paid',    date: 'Sep 21, 10:42 AM' },
  { id: 'pi_3NqA1b2C3dE4fG5i', customer: 'Maria Santos',   channel: 'GCash', amount: 700,  status: 'Paid',    date: 'Sep 21, 09:18 AM' },
  { id: 'pi_3NqA1b2C3dE4fG5j', customer: 'Ralph Mendoza',  channel: 'Maya',  amount: 240,  status: 'Pending', date: 'Sep 21, 08:11 AM' },
  { id: 'pi_3NqA1b2C3dE4fG5k', customer: 'Angela Reyes',   channel: 'Card',  amount: 300,  status: 'Paid',    date: 'Sep 20, 01:12 PM' },
  { id: 'pi_3NqA1b2C3dE4fG5l', customer: 'Lance Cruz',     channel: 'QR Ph', amount: 500,  status: 'Failed',  date: 'Sep 20, 11:03 AM' },
  { id: 'pi_3NqA1b2C3dE4fG5m', customer: 'Bea Aquino',     channel: 'Maya',  amount: 1000, status: 'Expired', date: 'Sep 19, 08:14 PM' },
];

/* ============================================
   READ
   ============================================ */

export function getPayMongoTxns(): AdminPayMongoTxn[] {
  return [...TXNS];
}

export function getTxnById(id: string): AdminPayMongoTxn | undefined {
  return TXNS.find((t) => t.id === id);
}

export function getPayMongoSummary() {
  const sumBy = (predicate: (t: AdminPayMongoTxn) => boolean) =>
    TXNS.filter(predicate).reduce((sum, t) => sum + t.amount, 0);
  const countBy = (predicate: (t: AdminPayMongoTxn) => boolean) =>
    TXNS.filter(predicate).length;

  const isWallet = (t: AdminPayMongoTxn) => t.channel === 'GCash' || t.channel === 'Maya';
  const isFailed = (t: AdminPayMongoTxn) => t.status === 'Failed' || t.status === 'Expired';

  return {
    qr: sumBy((t) => t.channel === 'QR Ph'),
    qrCount: countBy((t) => t.channel === 'QR Ph'),
    wallet: sumBy(isWallet),
    walletCount: countBy(isWallet),
    card: sumBy((t) => t.channel === 'Card'),
    cardCount: countBy((t) => t.channel === 'Card'),
    failed: sumBy(isFailed),
    failedCount: countBy(isFailed),
  };
}

/* ============================================
   WRITE — simulate API sync
   ============================================ */

const CHANNELS: AdminPayMongoTxn['channel'][] = ['QR Ph', 'GCash', 'Maya', 'Card'];
const CUSTOMER_NAMES = ['Alex Rivera', 'Sam Bautista', 'Chris Tan', 'Dana Lim', 'Kim Lopez'];

function randomPick<T>(arr: T[]): T {
  return arr[Math.floor(Math.random() * arr.length)];
}

export async function syncPayMongo(): Promise<AdminPayMongoTxn> {
  // Simulate network latency
  await new Promise((resolve) => setTimeout(resolve, 1200));

  const newTxn: AdminPayMongoTxn = {
    id: `pi_${Math.random().toString(36).slice(2, 22)}`,
    customer: randomPick(CUSTOMER_NAMES),
    channel: randomPick(CHANNELS),
    amount: Math.floor(Math.random() * 2000) + 100,
    status: Math.random() > 0.15 ? 'Paid' : 'Pending',
    date: new Date().toLocaleString('en-US', {
      month: 'short',
      day: 'numeric',
      hour: 'numeric',
      minute: '2-digit',
    }),
  };

  TXNS = [newTxn, ...TXNS];
  return newTxn;
}

export function addPayMongoTxn(txn: AdminPayMongoTxn): AdminPayMongoTxn {
  TXNS = [txn, ...TXNS];
  return txn;
}