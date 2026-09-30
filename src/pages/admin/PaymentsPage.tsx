// src/pages/admin/PaymentsPage.tsx

import { useState, useMemo } from 'react';
import { Download } from 'lucide-react';
import { AdminPageHeader, AdminChip, AdminPaymentDetailModal } from '../../components/admin';
import { getPayments, getPaymentSummary, setPaymentStatus, exportPaymentsCSV } from '../../services/admin';

const FILTERS = ['all', 'Pending', 'Verified', 'Refunded'];

export default function PaymentsPage() {
  const [filter, setFilter] = useState('all');
  const [refreshKey, setRefreshKey] = useState(0);
  const [viewingRef, setViewingRef] = useState<string | null>(null);

  const payments = useMemo(() => getPayments(filter), [filter, refreshKey]);
  const summary = useMemo(() => getPaymentSummary(), [refreshKey]);

  const handleVerify = (ref: string) => {
    setPaymentStatus(ref, 'Verified');
    setRefreshKey((k) => k + 1);
  };

  const handleReject = (ref: string) => {
    setPaymentStatus(ref, 'Refunded');
    setRefreshKey((k) => k + 1);
  };

  return (
    <>
      <AdminPageHeader
        eyebrow="Manual Payments"
        title="Payment Management"
        description="Verify manual payments (bank/GCash transfer) using account & reference numbers."
        actions={
          <button
            className="admin-btn admin-btn--primary"
            onClick={() => exportPaymentsCSV(getPayments('all'))}
          >
            <Download className="react-icon" /> Export CSV
          </button>
        }
      />

      <div className="admin-payment-summary">
        <div className="admin-payment-summary__card admin-payment-summary__card--green">
          <span className="admin-payment-summary__label">Verified</span>
          <span className="admin-payment-summary__value">₱ {summary.verified.toLocaleString()}</span>
          <span className="admin-payment-summary__sub">{summary.verifiedCount} payments</span>
        </div>
        <div className="admin-payment-summary__card admin-payment-summary__card--gold">
          <span className="admin-payment-summary__label">Pending Verification</span>
          <span className="admin-payment-summary__value">₱ {summary.pending.toLocaleString()}</span>
          <span className="admin-payment-summary__sub">{summary.pendingCount} payments</span>
        </div>
        <div className="admin-payment-summary__card admin-payment-summary__card--blue">
          <span className="admin-payment-summary__label">Over-the-Counter</span>
          <span className="admin-payment-summary__value">₱ {summary.otc.toLocaleString()}</span>
          <span className="admin-payment-summary__sub">{summary.otcCount} payments</span>
        </div>
        <div className="admin-payment-summary__card admin-payment-summary__card--red">
          <span className="admin-payment-summary__label">Refunded / Failed</span>
          <span className="admin-payment-summary__value">₱ {summary.refunded.toLocaleString()}</span>
          <span className="admin-payment-summary__sub">{summary.refundedCount} payments</span>
        </div>
      </div>

      <div className="admin-panel">
        <div className="admin-panel__header">
          <h2 className="admin-panel__title">Manual Payment Submissions</h2>
          <div className="admin-filter-row">
            {FILTERS.map((f) => (
              <AdminChip
                key={f}
                label={f === 'all' ? 'All' : f}
                active={filter === f}
                onClick={() => setFilter(f)}
              />
            ))}
          </div>
        </div>

        <table className="admin-table">
          <thead>
            <tr>
              <th>Reference #</th><th>Customer</th><th>Method</th>
              <th>Account #</th><th>Amount</th><th>Status</th>
              <th>Submitted</th><th></th>
            </tr>
          </thead>
          <tbody>
            {payments.length === 0 ? (
              <tr><td colSpan={8} className="admin-empty">No payments.</td></tr>
            ) : (
              payments.map((p) => (
                <tr key={p.ref}>
                  <td><span className="admin-order-id">{p.ref}</span></td>
                  <td><span className="admin-order-customer">{p.customer}</span></td>
                  <td>{p.method}</td>
                  <td><code>{p.account}</code></td>
                  <td><strong>₱ {p.amount.toLocaleString()}</strong></td>
                  <td>
                    <span className={`admin-badge admin-badge--${p.status.toLowerCase()}`}>{p.status}</span>
                  </td>
                  <td><span className="admin-order-date">{p.date}</span></td>
                  <td>
                    <div className="admin-row-actions">
                      {p.status === 'Pending' ? (
                        <>
                          <button className="is-success" onClick={() => handleVerify(p.ref)}>Verify</button>
                          <button className="is-danger" onClick={() => handleReject(p.ref)}>Reject</button>
                        </>
                      ) : (
                        <button onClick={() => setViewingRef(p.ref)}>View</button>
                      )}
                    </div>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      <AdminPaymentDetailModal paymentRef={viewingRef} onClose={() => setViewingRef(null)} />
    </>
  );
}