import { useState } from 'react';
import { Badge, Shirt } from 'lucide-react';
import { productIcon } from '../services';
import type { Product } from '../types';

type ProductImageSource = Pick<Product, 'name' | 'category' | 'image' | 'imageAlt'>;

interface ProductImageProps {
  product: ProductImageSource;
  /** Class applied to the <img>. The icon fallback always uses `react-icon`. */
  className: string;
  width: number;
  height: number;
}

/**
 * Renders a product photo and degrades to the category's lucide icon whenever the
 * remote image is missing or fails to load, so a card never collapses.
 */
export default function ProductImage({ product, className, width, height }: ProductImageProps) {
  const [hasFailed, setHasFailed] = useState(false);
  const FallbackIcon = productIcon(product.category) === 'badge' ? Badge : Shirt;

  if (hasFailed || !product.image) {
    return <FallbackIcon className="react-icon" aria-hidden="true" />;
  }

  return (
    <img
      src={product.image}
      alt={product.imageAlt || product.name}
      className={className}
      style={{ width: '100%', height: '100%' }}
      width={width}
      height={height}
      loading="lazy"
      decoding="async"
      onError={() => setHasFailed(true)}
    />
  );
}
