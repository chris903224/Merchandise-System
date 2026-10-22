// src/components/organization/ProductImage.tsx
import type { Product } from '../../types';

export default function ProductImage({ product }: { product: Product }) {
  // ✅ Kung may image URL, gamitin yon
  if (product.image) {
    return (
      <img 
        src={product.image} 
        alt={product.imageAlt} 
        style={{ width: '100%', height: '100%', objectFit: 'cover', borderRadius: 'inherit' }} 
      />
    );
  }

  // ✅ Fallback kapag walang image
  return (
    <svg viewBox="0 0 100 100" style={{ color: 'var(--a)', fill: 'currentColor', width: '60%', height: '60%' }}>
      <path d="M21 8 12 3 3 8v8l9 5 9-5z"/>
      <path d="m3 8 9 5 9-5M12 13v8" fill="none" stroke="#fff" strokeWidth={1.5} />
    </svg>
  );
}