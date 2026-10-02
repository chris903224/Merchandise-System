// src/pages/admin/PaymentsPage.tsx

import { useState, useEffect, useCallback } from 'react';
import { Download } from 'lucide-react';
import {
  AdminPageHeader,
  AdminChip,
  AdminPaymentDetailModal,
} from '../../components/admin';
import {
  getPayments,
  getPaymentSummary,
  setPaymentStatus,
  getAllPayments,
  exportPaymentsCSV,
} from '../../services/admin';
import { useToast } from '../../toast';
import type { AdminPayment } from '../../store/adminStore';

/* ============================================
   CONSTANTS
   ============================================ */

const FILTERS = ['all', 'Pending', 'Verified', 'Paid', 'Refunded'];

interface PaymentSummary {
  verified: number;
  verifiedCount: number;
  pending: number;
  pendingCount: number;
  cod: number;
  codCount: number;
  refunded: number;
  refundedCount: number;
}

const EMPTY_SUMMARY: PaymentSummary = {
  verified: 0,
  verifiedCount: 0,
  pending: 0,
  pendingCount: 0,
  cod: 0,
  codCount: 0,
  refunded: 0,
  refundedCount: 0,
};

/* ============================================
   COMPONENT
   ============================================ */

export default function PaymentsPage() {
  const toast = useToast();

  // Filter + refresh
  const [filter, setFilter] = useState('all');
  const [refreshKey, setRefreshKey] = useState(0);

  // Data
  const [payments, setPayments] = useState<AdminPayment[]>([]);
  const [summary, setSummary] = useState<PaymentSummary>(EMPTY_SUMMARY);
  const [isLoading, setIsLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Modal
  const [viewingRef, setViewingRef] = useState<string | null>(null);

  /* ============================================
     LOAD PAYMENTS + SUMMARY
     ============================================ */
  useEffect(() => {
    let cancelled = false;

    async function load() {
      setIsLoading(true);
      try {
        const [paymentsData, summaryData] = await Promise.all([
          getPayments(filter),
          getPaymentSummary(),
        ]);

        if (!cancelled) {
          setPayments(paymentsData);
          setSummary(summaryData);
        }
      } catch (error) {
        console.error('[PaymentsPage] Failed to load:', error);
        toast('Failed to load payments', 'danger');
      } finally {
        if (!cancelled) setIsLoading(false);
      }
    }

    load();

    return () => {
      cancelled = true;
    };
  }, [filter, refreshKey, toast]);

  /* ============================================
     HANDLERS
     ============================================ */

  const handleVerify = useCallback(
    async (ref: string) => {
      setIsSubmitting(true);
      try {
        await setPaymentStatus(ref, 'Verified');
        toast(`Payment ${ref} verified`, 'success');
        setRefreshKey((k) => k + 1);
      } catch (error) {
        console.error('[PaymentsPage] Verify failed:', error);
        toast('Failed to verify payment', 'danger');
      } finally {
        setIsSubmitting(false);
      }
    },
    [toast]
  );

  const handleReject = useCallback(
    async (ref: string) => {
      setIsSubmitting(true);
      try {
        await setPaymentStatus(ref, 'Refunded');
        toast(`Payment ${ref} rejected`, 'warning');
        setRefreshKey((k) => k + 1);
      } catch (error) {
        console.error('[PaymentsPage] Reject failed:', error);
        toast('Failed to reject payment', 'danger');
      } finally {
        setIsSubmitting(false);
      }
    },
    [toast]
  );

  const handleMarkPaid = useCallback(
    async (ref: string) => {
      setIsSubmitting(true);
      try {
        await setPaymentStatus(ref, 'Paid');
        toast(`Payment ${ref} marked as Paid`, 'success');
        setRefreshKey((k) => k + 1);
      } catch (error) {
        console.error('[PaymentsPage] Mark paid failed:', error);
        toast('Failed to mark as paid', 'danger');
      } finally {
        setIsSubmitting(false);
      }
    },
    [toast]
  );

  const handleExport = useCallback(async () => {
    try {
      const all = await getAllPayments();
      if (all.length === 0) {
        toast('No payments to export', 'info');
        return;
      }
      exportPaymentsCSV(all);
      toast('CSV exported', 'success');
    } catch (error) {
      console.error('[PaymentsPage] Export failed:', error);
      toast('Failed to export', 'danger');
    }
  }, [toast]);

  /* ============================================
     RENDER
     ============================================ */
  return (
    <>
      <AdminPageHeader
        eyebrow="Manual Payments"
        title="Payment Management"
        description="Verify GCash payments and track Cash on Delivery (COD) orders."
        actions={
          <button
            className="admin-btn admin-btn--primary"
            onClick={handleExport}
          >
            <Download className="react-icon" />
            Export CSV
          </button>
        }
      />

      {/* ============================================
          SUMMARY CARDS
          ============================================ */}
      <div className="admin-payment-summary">
        <div className="admin-payment-summary__card admin-payment-summary__card--green">
          <span className="admin-payment-summary__label">
            Verified (GCash)
          </span>
          <span className="admin-payment-summary__value">
            {isLoading ? '₱ …' : `₱ ${summary.verified.toLocaleString()}`}
          </span>
          <span className="admin-payment-summary__sub">
            {isLoading ? '…' : `${summary.verifiedCount} payments`}
          </span>
        </div>

        <div className="admin-payment-summary__card admin-payment-summary__card--gold">
          <span className="admin-payment-summary__label">
            Pending GCash
          </span>
          <span className="admin-payment-summary__value">
            {isLoading ? '₱ …' : `₱ ${summary.pending.toLocaleString()}`}
          </span>
          <span className="admin-payment-summary__sub">
            {isLoading ? '…' : `${summary.pendingCount} payments`}
          </span>
        </div>

        <div className="admin-payment-summary__card admin-payment-summary__card--blue">
          <span className="admin-payment-summary__label">
            Cash on Delivery
          </span>
          <span className="admin-payment-summary__value">
            {isLoading ? '₱ …' : `₱ ${summary.cod.toLocaleString()}`}
          </span>
          <span className="admin-payment-summary__sub">
            {isLoading ? '…' : `${summary.codCount} payments`}
          </span>
        </div>

        <div className="admin-payment-summary__card admin-payment-summary__card--red">
          <span className="admin-payment-summary__label">
            Refunded / Failed
          </span>
          <span className="admin-payment-summary__value">
            {isLoading ? '₱ …' : `₱ ${summary.refunded.toLocaleString()}`}
          </span>
          <span className="admin-payment-summary__sub">
            {isLoading ? '…' : `${summary.refundedCount} payments`}
          </span>
        </div>
      </div>

      {/* ============================================
          PAYMENTS TABLE
          ============================================ */}
      <div className="admin-panel">
        <div className="admin-panel__header">
          <h2 className="admin-panel__title">Payment Records</h2>

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
              <th>Reference #</th>
              <th>Customer</th>
              <th>Method</th>
              <th>GCash #</th>
              <th>Amount</th>
              <th>Status</th>
              <th>Submitted</th>
              <th></th>
            </tr>
          </thead>
          <tbody>
            {isLoading ? (
              <tr>
                <td colSpan={8} className="admin-empty" style={{ padding: '48px 0', textAlign: 'center' }}>
                  Loading payments…
                </td>
              </tr>
            ) : payments.length === 0 ? (
              <tr>
                <td colSpan={8} className="admin-empty" style={{ padding: '48px 0' }}>
                  <div style={{ textAlign: 'center' }}>
                    <p style={{ margin: '0 0 8px', fontWeight: 700, fontSize: 14 }}>
                      No payments yet
                    </p>
                    <p style={{ margin: 0, fontSize: 12, color: 'var(--admin-ink-400)' }}>
                      Payments will appear here kapag may nag-submit via GCash o COD.
                    </p>
                  </div>
                </td>
              </tr>
            ) : (
              payments.map((p) => (
                <tr key={p.ref}>
                  <td>
                    <span className="admin-order-id">{p.ref}</span>
                  </td>

                  <td>
                    <span className="admin-order-customer">{p.customer}</span>
                  </td>

                  <td>
                    <span
                      className={`admin-badge admin-badge--${
                        p.method === 'GCash' ? 'shipped' : 'pending'
                      }`}
                    >
                      {p.method}
                    </span>
                  </td>

                  <td>
                    <code>{p.account}</code>
                  </td>

                  <td>
                    <strong>₱ {p.amount.toLocaleString()}</strong>
                  </td>

                  <td>
                    <span
                      className={`admin-badge admin-badge--${p.status.toLowerCase()}`}
                    >
                      {p.status}
                    </span>
                  </td>

                  <td>
                    <span className="admin-order-date">{p.date}</span>
                  </td>

                  <td>
                    <div className="admin-row-actions">
                      {/* GCash Pending → Verify / Reject */}
                      {p.method === 'GCash' && p.status === 'Pending' && (
                        <>
                          <button
                            className="is-success"
                            onClick={() => handleVerify(p.ref)}
                            disabled={isSubmitting}
                          >
                            Verify
                          </button>
                          <button
                            className="is-danger"
                            onClick={() => handleReject(p.ref)}
                            disabled={isSubmitting}
                          >
                            Reject
                          </button>
                        </>
                      )}

                      {/* COD not yet paid → Mark Paid */}
                      {p.method === 'COD' && p.status !== 'Paid' && (
                        <button
                          className="is-success"
                          onClick={() => handleMarkPaid(p.ref)}
                          disabled={isSubmitting}
                        >
                          Mark Paid
                        </button>
                      )}

                      {/* Always show View */}
                      <button onClick={() => setViewingRef(p.ref)}>View</button>
                    </div>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {/* ============================================
          DETAIL MODAL
          ============================================ */}
      <AdminPaymentDetailModal
        paymentRef={viewingRef}
        onClose={() => setViewingRef(null)}
      />
    </>
  );
}