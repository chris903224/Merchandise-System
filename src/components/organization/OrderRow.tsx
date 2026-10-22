// src/components/organization/OrderRow.tsx
import { Link } from 'react-router-dom';
import { peso, formatDate } from '../../utils/format';
import MarkPaidButton from './MarkPaidButton';
import OrderStatusPill from './OrderStatusPill';
import type { Order } from '../../types';

export default function OrderRow({
  order,
  onMarkPaid,
  disabled = false,
}: {
  order: Order;
  onMarkPaid: (id: string) => void | Promise<void>;
  disabled?: boolean; // ✅ Added disabled prop
}) {
  const paid = order.paymentStatus === 'Paid';

  return (
    <tr>
      <td><Link to={`/org/orders/${order.id}`}>#{order.id}</Link></td>
      <td>
        <b>{order.customerName}</b>
        {order.items[0] && <small>{order.items[0].name}</small>}
      </td>
      <td>{order.paymentMethod}</td>
      <td>{formatDate(order.createdAt)}</td>
      <td>{peso(order.totalAmount)}</td>
      <td><span className={`pill ${paid ? 'ok' : 'wa'}`}>{paid ? 'Paid' : 'Pending'}</span></td>
      <td><OrderStatusPill status={order.orderStatus} /></td>
      <td>{!paid && <MarkPaidButton orderId={order.id} onMarkPaid={onMarkPaid} disabled={disabled} />}</td>
    </tr>
  );
}