// src/pages/organization/ProductDetailsPage.tsx

import { useEffect, useState } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import { useApp } from '../../store';
import StockRow from '../../components/organization/StockRow';
import ProductImage from '../../components/organization/ProductImage';
import { Icon } from '../../components/Icon';
import { peso } from '../../utils/format';
import { 
  fetchProductById, 
  updateProductInDb, 
  deleteProductFromDb 
} from '../../services/products'; 
import type { Product } from '../../types';

function totalStock(p: Product): number {
  if (p.sizeStocks && Object.keys(p.sizeStocks).length > 0) {
    return Object.values(p.sizeStocks).reduce((a, b) => a + (Number(b) || 0), 0);
  }
  return p.stock ?? 0;
}

export default function ProductDetailsPage() {
  const { id } = useParams<{ id: string }>();
  
  // 🚨 INALIS NATIN ANG `session` DAHIL HINDI NAMAN GINAGAMIT SA UI
  // Kung kailangan mo ito sa ibang parte ng code sa hinaharap, ibalik mo lang.
  const { products, refreshProducts } = useApp(); 
  
  const navigate = useNavigate();
  // 🚨 TINANGGAL NA NATIN ITO: const org = session?.organization ?? '';

  const [product, setProduct] = useState<Product | null>(null);
  const [loading, setLoading] = useState(true);
  const [confirmDelete, setConfirmDelete] = useState(false);
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    let isMounted = true;

    async function loadProduct() {
      if (!id) { setLoading(false); return; }
      setLoading(true);
      
      const fromStore = products.find((p) => p.id === id);
      if (fromStore) {
        if (isMounted) { setProduct(fromStore); setLoading(false); }
        return;
      }

      const fromDb = await fetchProductById(id);
      if (isMounted) {
        setProduct(fromDb || null);
        setLoading(false);
      }
    }

    loadProduct();
    return () => { isMounted = false; };
  }, [id, products]);

  async function handleStock(size: string, next: number) {
    if (!product) return;
    setBusy(true);
    
    const safeNext = Math.max(0, Math.floor(Number(next) || 0));
    const newSizeStocks = { ...(product.sizeStocks ?? {}), [size]: safeNext };
    const newStock = Object.values(newSizeStocks).reduce((a, b) => a + (Number(b) || 0), 0);
    const updatedProduct = { ...product, sizeStocks: newSizeStocks, stock: newStock };
    
    setProduct(updatedProduct);

    try {
      await updateProductInDb(updatedProduct); 
      await refreshProducts(); 
    } catch (err) {
      console.error('Failed to update stock:', err);
      alert('Failed to update stock. Please try again.');
      setProduct(product); 
    } finally {
      setBusy(false);
    }
  }

  async function handleDelete() {
    if (!product) return;
    if (!confirmDelete) {
      setConfirmDelete(true);
      setTimeout(() => setConfirmDelete(false), 3000);
      return;
    }
    
    setBusy(true);
    try {
      await deleteProductFromDb(product.id); 
      await refreshProducts(); 
      navigate('/org/products');
    } catch (err) {
      console.error('Failed to delete product:', err);
      alert('Failed to delete product. Please try again.');
      setBusy(false);
    }
  }

  if (loading) {
    return (
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', minHeight: '60vh' }}>
        <div style={{ padding: '40px', textAlign: 'center' }}>
          <div style={{ width: 40, height: 40, border: '3px solid rgba(255,255,255,0.1)', borderTopColor: 'var(--a)', borderRadius: '50%', animation: 'spin 1s linear infinite', margin: '0 auto 16px' }} />
          <p style={{ color: 'var(--mu)' }}>Loading product details...</p>
        </div>
      </div>
    );
  }

  if (!product) {
    return (
      <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', minHeight: '60vh', textAlign: 'center' }}>
        <div style={{ padding: '40px', maxWidth: '400px', width: '100%', background: '#0a1226', borderRadius: '12px', border: '1px solid rgba(var(--w), .08)' }}>
          <span style={{ margin: '0 auto 16px', width: '64px', height: '64px', borderRadius: '50%', background: 'rgba(239, 68, 68, 0.1)', color: '#ef4444', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <Icon name="box" style={{ width: '32px', height: '32px' }} />
          </span>
          <h2 style={{ fontSize: '24px', marginBottom: '8px', color: '#fff' }}>Product not found</h2>
          <p style={{ color: 'var(--mu)', marginBottom: '24px', fontSize: '14px' }}>This item does not exist in the database.</p>
          <Link to="/org/products" className="manage-btn" style={{ textDecoration: 'none' }}>
            <Icon name="back" /> Back to Products
          </Link>
        </div>
      </div>
    );
  }

  const total = totalStock(product);
  const max = Math.max(1, ...Object.values(product.sizeStocks ?? {}), product.stock);

  const rows = product.sizes && product.sizes.length
    ? product.sizes.map((s) => ({ size: s, qty: product.sizeStocks?.[s] ?? 0 }))
    : [{ size: 'N/A', qty: product.stock }];

  const isNa = rows.length === 1 && rows[0].size === 'N/A';

  return (
    <section className="pd-page">
      <nav className="pd-crumb">
        <Link to="/org/products">Products</Link>
        <Icon name="right" />
        <span>{product.category}</span>
        <Icon name="right" />
        <span>{product.name}</span>
      </nav>

      <div className="pd-layout">
        {/* Left: Image */}
        <div className="pd-image-box">
          <div className="pd-image">
            <ProductImage product={product} />
            <span className={`stock-badge ${total > 10 ? 'ok' : total > 0 ? 'wa' : 'no'}`}>
              {total > 0 ? 'In Stock' : 'Out of Stock'}
            </span>
          </div>
        </div>

        {/* Right: Info */}
        <div className="pd-info-box">
          <div className="pd-header">
            <p className="pd-category">{product.category}</p>
            <h1 className="pd-title">{product.name}</h1>
            <p className="pd-price">{peso(product.price)}</p>
          </div>

          <div className="pd-metrics">
            <div className="pd-metric">
              <small>Live stock</small>
              <b>{total} <span>units</span></b>
            </div>
            <div className="pd-metric">
              <small>Stock value</small>
              <b>{peso(total * product.price)}</b>
            </div>
            <div className="pd-metric">
              <small>Organization</small>
              <b>{product.organization}</b>
            </div>
          </div>

          <div className="pd-stock-section">
            <div className="pd-stock-header">
              <h3 className="pd-stock-title">{isNa ? 'Stock' : 'Stock by Size'}</h3>
            </div>
            <div className="pd-stock-list">
              {rows.map(({ size, qty }) => (
                <StockRow
                  key={size}
                  size={size}
                  qty={qty}
                  max={max}
                  isNa={isNa}
                  onCommit={(v) => handleStock(size, v)}
                />
              ))}
            </div>
          </div>

          <div className="pd-actions">
            <Link to="/org/products" className="pd-btn ghost">
              <Icon name="back" /> Back to Products
            </Link>
            <button 
              className={`pd-btn danger ${confirmDelete ? 'active' : ''}`}
              onClick={handleDelete} 
              disabled={busy} 
            >
              <Icon name="trash" />
              {busy ? 'Saving…' : confirmDelete ? 'Click again to remove' : 'Remove product'}
            </button>
          </div>
        </div>
      </div>
    </section>
  );
}