// src/components/admin/AdminPaymentDetailModal.tsx

import { useState, useEffect } from 'react';
import { getPaymentByRef } from '../../services/admin';
import AdminModal from './AdminModal';
import type { AdminPayment } from '../../store/adminStore';

interface Props {
  paymentRef: string | null;
  onClose: () => void;
}

export default function AdminPaymentDetailModal({ paymentRef, onClose }: Props) {
  const [payment, setPayment] = useState<AdminPayment | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  /* ============================================
     LOAD PAYMENT (async)
     ============================================ */
  useEffect(() => {
    if (!paymentRef) {
      setPayment(null);
      return;
    }

    let cancelled = false;
    setIsLoading(true);

    getPaymentByRef(paymentRef)
      .then((data) => {
        if (!cancelled) setPayment(data ?? null);
      })
      .catch((err) => {
        console.error('[PaymentDetailModal] Failed to load:', err);
        if (!cancelled) setPayment(null);
      })
      .finally(() => {
        if (!cancelled) setIsLoading(false);
      });

    return () => {
      cancelled = true;
    };
  }, [paymentRef]);

  /* ============================================
     RENDER
     ============================================ */
  const isOpen = Boolean(paymentRef);
  const title = payment ? `Payment ${payment.ref}` : 'Loading…';

  return (
    <AdminModal
      open={isOpen}
      title={title}
      onClose={onClose}
      footer={
        <button className="admin-btn admin-btn--primary" onClick={onClose}>
          Close
        </button>
      }
    >
      {isLoading ? (
        <p
          className="admin-empty"
          style={{ textAlign: 'center', padding: '24px 0' }}
        >
          Loading payment…
        </p>
      ) : !payment ? (
        <p
          className="admin-empty"
          style={{ textAlign: 'center', padding: '24px 0' }}
        >
          Payment not found.
        </p>
      ) : (
        <div className="admin-order-detail">
          <section className="admin-order-detail__section">
            <p className="admin-order-detail__section-title">
              Payment Details
            </p>

            <Row label="Reference #" value={payment.ref} />
            <Row label="Customer" value={payment.customer} />

            <Row
              label="Method"
              value={
                <span
                  className={`admin-badge admin-badge--${
                    payment.method === 'GCash' ? 'shipped' : 'pending'
                  }`}
                >
                  {payment.method}
                </span>
              }
            />

            <Row label="Account #" value={payment.account} />

            <Row
              label="Amount"
              value={`₱ ${payment.amount.toLocaleString()}`}
            />

            <Row
              label="Status"
              value={
                <span
                  className={`admin-badge admin-badge--${payment.status.toLowerCase()}`}
                >
                  {payment.status}
                </span>
              }
            />

            <Row label="Submitted" value={payment.date} />

            {payment.orderId && (
              <Row label="Order ID" value={payment.orderId} />
            )}
          </section>
        </div>
      )}
    </AdminModal>
  );
}

/* ============================================
   SUB-COMPONENT
   ============================================ */

function Row({ label, value }: { label: string; value: React.ReactNode }) {
  return (
    <div className="admin-order-detail__row">
      <dt>{label}</dt>
      <dd>{value}</dd>
    </div>
  );
}