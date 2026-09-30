// src/pages/admin/PayMongoPage.tsx

import { useState, useMemo } from 'react';
import { RefreshCw } from 'lucide-react';
import { AdminPageHeader } from '../../components/admin';
import { getPayMongoTxns, getPayMongoSummary, syncPayMongo, getTxnById } from '../../services/admin';
import type { AdminPayMongoTxn } from '../../store/adminStore';

export default function PayMongoPage() {
  const [refreshKey, setRefreshKey] = useState(0);
  const [viewing, setViewing] = useState<AdminPayMongoTxn | null>(null);
  const [isSyncing, setIsSyncing] = useState(false);

  const txns = useMemo(() => getPayMongoTxns(), [refreshKey]);
  const summary = useMemo(() => getPayMongoSummary(), [refreshKey]);

  const handleSync = async () => {
    setIsSyncing(true);
    await syncPayMongo();
    setRefreshKey((k) => k + 1);
    setIsSyncing(false);
  };

  const statusClass = (s: string) =>
    s === 'Paid' ? 'admin-badge--completed'
    : s === 'Pending' ? 'admin-badge--pending'
    : 'admin-badge--cancelled';

  return (
    <>
      <AdminPageHeader
        eyebrow="PayMongo Integration"
        title="PayMongo Management"
        description="Track QR Ph, GCash, Maya, and card payments processed via PayMongo."
        actions={
          <button
            className="admin-btn admin-btn--ghost"
            onClick={handleSync}
            disabled={isSyncing}
          >
            <RefreshCw className="react-icon" />
            {isSyncing ? 'Syncing…' : 'Sync with PayMongo'}
          </button>
        }
      />

      <div className="admin-payment-summary">
        <div className="admin-payment-summary__card admin-payment-summary__card--green">
          <span className="admin-payment-summary__label">Paid via QR Ph</span>
          <span className="admin-payment-summary__value">₱ {summary.qr.toLocaleString()}</span>
          <span className="admin-payment-summary__sub">{summary.qrCount} txns</span>
        </div>
        <div className="admin-payment-summary__card admin-payment-summary__card--blue">
          <span className="admin-payment-summary__label">GCash / Maya</span>
          <span className="admin-payment-summary__value">₱ {summary.wallet.toLocaleString()}</span>
          <span className="admin-payment-summary__sub">{summary.walletCount} txns</span>
        </div>
        <div className="admin-payment-summary__card admin-payment-summary__card--gold">
          <span className="admin-payment-summary__label">Card Payments</span>
          <span className="admin-payment-summary__value">₱ {summary.card.toLocaleString()}</span>
          <span className="admin-payment-summary__sub">{summary.cardCount} txns</span>
        </div>
        <div className="admin-payment-summary__card admin-payment-summary__card--red">
          <span className="admin-payment-summary__label">Failed / Expired</span>
          <span className="admin-payment-summary__value">₱ {summary.failed.toLocaleString()}</span>
          <span className="admin-payment-summary__sub">{summary.failedCount} txns</span>
        </div>
      </div>

      <div className="admin-panel">
        <div className="admin-panel__header">
          <h2 className="admin-panel__title">PayMongo Transactions</h2>
          <span className="admin-panel__sub">Live from PayMongo API</span>
        </div>

        <table className="admin-table">
          <thead>
            <tr>
              <th>Payment Intent ID</th><th>Customer</th><th>Channel</th>
              <th>Amount</th><th>Status</th><th>Date</th><th></th>
            </tr>
          </thead>
          <tbody>
            {txns.length === 0 ? (
              <tr><td colSpan={7} className="admin-empty">No PayMongo transactions.</td></tr>
            ) : (
              txns.map((t) => (
                <tr key={t.id}>
                  <td><code>{t.id}</code></td>
                  <td><span className="admin-order-customer">{t.customer}</span></td>
                  <td>{t.channel}</td>
                  <td><strong>₱ {t.amount.toLocaleString()}</strong></td>
                  <td><span className={`admin-badge ${statusClass(t.status)}`}>{t.status}</span></td>
                  <td><span className="admin-order-date">{t.date}</span></td>
                  <td>
                    <div className="admin-row-actions">
                      <button onClick={() => setViewing(t)}>View</button>
                    </div>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {viewing && (
        <AdminModalInline title={`PayMongo ${viewing.id}`} onClose={() => setViewing(null)}>
          <div className="admin-order-detail">
            <div className="admin-order-detail__section">
              <p className="admin-order-detail__section-title">Transaction Details</p>
              <Row label="Payment Intent" value={<code>{viewing.id}</code>} />
              <Row label="Customer" value={viewing.customer} />
              <Row label="Channel" value={viewing.channel} />
              <Row label="Amount" value={`₱ ${viewing.amount.toLocaleString()}`} />
              <Row label="Status" value={viewing.status} />
              <Row label="Date" value={viewing.date} />
            </div>
          </div>
        </AdminModalInline>
      )}
    </>
  );
}

// Small inline helpers para hindi na kailangan mag-import ng components
function AdminModalInline({ title, onClose, children }: { title: string; onClose: () => void; children: React.ReactNode }) {
  return (
    <div className="admin-modal-backdrop" onClick={onClose}>
      <div className="admin-modal" onClick={(e) => e.stopPropagation()}>
        <header className="admin-modal__header">
          <h2 className="admin-modal__title">{title}</h2>
          <button className="admin-modal__close" onClick={onClose}>×</button>
        </header>
        <div className="admin-modal__body">{children}</div>
        <footer className="admin-modal__footer">
          <button className="admin-btn admin-btn--primary" onClick={onClose}>Close</button>
        </footer>
      </div>
    </div>
  );
}

function Row({ label, value }: { label: string; value: React.ReactNode }) {
  return (
    <div className="admin-order-detail__row">
      <dt>{label}</dt><dd>{value}</dd>
    </div>
  );
}