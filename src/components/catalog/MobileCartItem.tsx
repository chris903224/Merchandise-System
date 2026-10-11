// src/components/cart/MobileCartItem.tsx
// ✅ TikTok Shop cart item card

import { Link } from 'react-router-dom';
import { Minus, Plus, Trash2 } from 'lucide-react';
import ProductImage from '../ProductImage';
import { formatPrice } from '../../services';
import type { CartItem, Product } from '../../types';

interface MobileCartItemProps {
  item: CartItem;
  product?: Product;
  isSelected: boolean;
  onToggleSelect: () => void;
  onUpdateQty: (delta: number) => void;
  onRemove: () => void;
}

export default function MobileCartItem({
  item,
  product,
  isSelected,
  onToggleSelect,
  onUpdateQty,
  onRemove,
}: MobileCartItemProps) {
  const itemTotal = (Number(item.price) || 0) * (Number(item.qty) || 0);

  return (
    <li className={`mobile-cart-item ${isSelected ? 'is-selected' : ''}`}>
      <label className="mobile-cart-item__check">
        <input
          type="checkbox"
          checked={isSelected}
          onChange={onToggleSelect}
          aria-label="Select item"
        />
      </label>

      <Link
        to={`/products/${encodeURIComponent(item.id)}`}
        className="mobile-cart-item__media"
      >
        {product ? (
          <ProductImage
            product={product}
            className="mobile-cart-item__image"
            width={160}
            height={160}
          />
        ) : (
          <div className="mobile-cart-item__placeholder" />
        )}
      </Link>

      <div className="mobile-cart-item__details">
        <Link
          to={`/products/${encodeURIComponent(item.id)}`}
          className="mobile-cart-item__name"
        >
          {item.name}
        </Link>

        {item.size && (
          <span className="mobile-cart-item__size">
            Size: <strong>{item.size}</strong>
          </span>
        )}

        <p className="mobile-cart-item__price">
          {formatPrice(item.price)}
        </p>
      </div>

      <button
        type="button"
        className="mobile-cart-item__remove"
        onClick={onRemove}
        aria-label={`Remove ${item.name}`}
      >
        <Trash2 className="react-icon" />
      </button>

      <div className="mobile-cart-item__bottom">
        <div className="mobile-cart-item__qty">
          <button
            type="button"
            onClick={() => onUpdateQty(-1)}
            aria-label="Decrease quantity"
          >
            <Minus className="react-icon" />
          </button>
          <span>{item.qty}</span>
          <button
            type="button"
            onClick={() => onUpdateQty(1)}
            aria-label="Increase quantity"
          >
            <Plus className="react-icon" />
          </button>
        </div>

        <span className="mobile-cart-item__total">
          {formatPrice(itemTotal)}
        </span>
      </div>
    </li>
  );
}