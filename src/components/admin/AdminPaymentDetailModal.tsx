// src/components/admin/AdminPaymentDetailModal.tsx

import { getPaymentByRef } from '../../services/admin';
import AdminModal from './AdminModal';

interface Props {
  paymentRef: string | null;
  onClose: () => void;
}

export default function AdminPaymentDetailModal({ paymentRef, onClose }: Props) {
  const payment = paymentRef ? getPaymentByRef(paymentRef) : null;

  if (!payment) {
    return <AdminModal open={false} title="" onClose={onClose}>{null}</AdminModal>;
  }

  return (
    <AdminModal
      open={Boolean(payment)}
      title={`Payment ${payment.ref}`}
      onClose={onClose}
      footer={
        <button className="admin-btn admin-btn--primary" onClick={onClose}>
          Close
        </button>
      }
    >
      <div className="admin-order-detail">
        <section className="admin-order-detail__section">
          <p className="admin-order-detail__section-title">Payment Details</p>
          <Row label="Reference #" value={payment.ref} />
          <Row label="Customer" value={payment.customer} />
          <Row label="Method" value={payment.method} />
          <Row label="Account #" value={payment.account} />
          <Row label="Amount" value={`₱ ${payment.amount.toLocaleString()}`} />
          <Row
            label="Status"
            value={
              <span className={`admin-badge admin-badge--${payment.status.toLowerCase()}`}>
                {payment.status}
              </span>
            }
          />
          <Row label="Submitted" value={payment.date} />
        </section>
      </div>
    </AdminModal>
  );
}

function Row({ label, value }: { label: string; value: React.ReactNode }) {
  return (
    <div className="admin-order-detail__row">
      <dt>{label}</dt>
      <dd>{value}</dd>
    </div>
  );
}