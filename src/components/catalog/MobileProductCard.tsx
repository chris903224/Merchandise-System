// src/components/catalog/MobileProductCard.tsx
// ✅ TikTok Shop product card

import { Link } from 'react-router-dom';
import { Heart } from 'lucide-react';
import ProductImage from '../ProductImage';
import { formatPrice, getStockBadge } from '../../services';
import type { Product } from '../../types';

interface MobileProductCardProps {
  product: Product;
  isFav?: boolean;
  onToggleFav?: (product: Product) => void;
}

export default function MobileProductCard({
  product,
  isFav = false,
  onToggleFav,
}: MobileProductCardProps) {
  const badge = getStockBadge(product.stock);
  const isOut = (Number(product.stock) || 0) <= 0;

  return (
    <article className="mobile-product-card">
      <Link
        to={`/products/${encodeURIComponent(product.id)}`}
        className="mobile-product-card__media"
      >
        <ProductImage
          product={product}
          className="mobile-product-card__image"
          width={400}
          height={400}
        />
        <span
          className={`mobile-product-card__badge ${badge.className}`}
        >
          {badge.text}
        </span>

        {onToggleFav && (
          <button
            type="button"
            className={`mobile-product-card__wish ${
              isFav ? 'is-active' : ''
            }`}
            onClick={(e) => {
              e.preventDefault();
              e.stopPropagation();
              onToggleFav(product);
            }}
            aria-label={isFav ? 'Remove from favorites' : 'Add to favorites'}
          >
            <Heart
              className="react-icon"
              fill={isFav ? 'currentColor' : 'none'}
            />
          </button>
        )}
      </Link>

      <div className="mobile-product-card__body">
        <Link
          to={`/products/${encodeURIComponent(product.id)}`}
          className="mobile-product-card__name"
        >
          {product.name}
        </Link>

        {product.category && (
          <p className="mobile-product-card__category">
            {product.category}
          </p>
        )}

        <div className="mobile-product-card__footer">
          <p className="mobile-product-card__price">
            {formatPrice(product.price)}
          </p>
          {isOut && (
            <span className="mobile-product-card__oos">Out</span>
          )}
        </div>
      </div>
    </article>
  );
}