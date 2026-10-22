// src/pages/organization/ProductDetailsPage.tsx

import { useEffect, useState } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import { useApp } from '../../store';
import StockRow from '../../components/organization/StockRow';
import ProductImage from '../../components/organization/ProductImage';
import { Icon } from '../../components/Icon';
import { peso } from '../../utils/format';
import { 
  fetchOrgProductById, 
  updateOrgProduct, 
  deleteOrgProduct 
} from '../../services/organization/productService';
import type { Product } from '../../types';

// ✅ TANGGALIN ANG CSS IMPORT DITO para hindi mag-conflict (nasa OrganizationLayout na)
// import '../../styles/organization/products.css';

function totalStock(p: Product): number {
  if (p.sizeStocks && Object.keys(p.sizeStocks).length > 0) {
    return Object.values(p.sizeStocks).reduce((a, b) => a + (Number(b) || 0), 0);
  }
  return p.stock ?? 0;
}

export default function ProductDetailsPage() {
  const { id } = useParams<{ id: string }>();
  const { session, products, refreshProducts } = useApp();
  const navigate = useNavigate();
  const org = session?.organization ?? '';

  const [product, setProduct] = useState<Product | null>(null);
  const [loading, setLoading] = useState(true);
  const [confirmDelete, setConfirmDelete] = useState(false);
  const [busy, setBusy] = useState(false);

  // ✅ Fetch Product
  useEffect(() => {
    let isMounted = true;

    async function loadProduct() {
      if (!id || !org) return;
      setLoading(true);
      
      // 1. Hanapin muna sa store (para mabilis)
      const fromStore = products.find((p) => p.id === id && p.organization === org);
      
      if (fromStore) {
        if (isMounted) {
          setProduct(fromStore);
          setLoading(false);
        }
        return;
      }

      // 2. Kung wala, fetch sa DB
      const fromDb = await fetchOrgProductById(id, org);
      
      if (isMounted) {
        if (fromDb) setProduct(fromDb);
        setLoading(false);
      }
    }

    loadProduct();
    return () => { isMounted = false; };
  }, [id, org, products]);

  // ✅ Update Stock
  async function handleStock(size: string, next: number) {
    if (!product) return;
    setBusy(true);
    
    // Optimistic UI
    const safeNext = Math.max(0, Math.floor(Number(next) || 0));
    const newSizeStocks = { ...(product.sizeStocks ?? {}), [size]: safeNext };
    const newStock = Object.values(newSizeStocks).reduce((a, b) => a + (Number(b) || 0), 0);
    const updatedProduct = { ...product, sizeStocks: newSizeStocks, stock: newStock };
    
    setProduct(updatedProduct);

    try {
      await updateOrgProduct(updatedProduct, org);
      await refreshProducts();
    } catch (err) {
      console.error('Failed to update stock:', err);
      alert('Failed to update stock. Please try again.');
      setProduct(product);
    } finally {
      setBusy(false);
    }
  }

  // ✅ Delete Product
  async function handleDelete() {
    if (!product) return;
    if (!confirmDelete) {
      setConfirmDelete(true);
      setTimeout(() => setConfirmDelete(false), 3000);
      return;
    }
    
    setBusy(true);
    try {
      await deleteOrgProduct(product.id, org);
      await refreshProducts();
      navigate('/org/products');
    } catch (err) {
      console.error('Failed to delete product:', err);
      alert('Failed to delete product. Please try again.');
      setBusy(false);
    }
  }

  // ✅ Loading State
  if (loading) {
    return (
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', minHeight: '60vh' }}>
        <div className="glass card" style={{ padding: '40px', textAlign: 'center' }}>
          <div style={{ width: 40, height: 40, border: '3px solid rgba(255,255,255,0.1)', borderTopColor: 'var(--a)', borderRadius: '50%', animation: 'spin 1s linear infinite', margin: '0 auto 16px' }} />
          <p style={{ color: 'var(--mu)' }}>Loading product...</p>
        </div>
      </div>
    );
  }

  // ✅ Not Found State (Naka-center)
  if (!product) {
    return (
      <div style={{ 
        display: 'flex', 
        flexDirection: 'column', 
        alignItems: 'center', 
        justifyContent: 'center', 
        minHeight: '60vh', 
        textAlign: 'center' 
      }}>
        <div className="glass card" style={{ padding: '40px', maxWidth: '400px', width: '100%' }}>
          <span className="ic g5" style={{ margin: '0 auto 16px', width: '64px', height: '64px', borderRadius: '50%' }}>
            <Icon name="box" style={{ width: '32px', height: '32px' }} />
          </span>
          <h2 style={{ fontSize: '24px', marginBottom: '8px', color: 'var(--tx)' }}>
            Product not found
          </h2>
          <p style={{ color: 'var(--mu)', marginBottom: '24px', fontSize: '14px' }}>
            This item does not exist or belongs to another organization.
          </p>
          <Link to="/org/products" className="btn" style={{ width: '100%' }}>
            <Icon name="back" /> Back to Products
          </Link>
        </div>
      </div>
    );
  }

  // ✅ Main Render
  const total = totalStock(product);
  const max = Math.max(1, ...Object.values(product.sizeStocks ?? {}), product.stock);

  const rows = product.sizes.length
    ? product.sizes.map((s) => ({ size: s, qty: product.sizeStocks?.[s] ?? 0 }))
    : [{ size: 'N/A', qty: product.stock }];

  const isNa = rows.length === 1 && rows[0].size === 'N/A';

  return (
    <section className="page-product-details">
      {/* Breadcrumbs */}
      <nav className="crumb">
        <Link to="/org/products">Products</Link>
        <Icon name="right" />
        <span>{product.category}</span>
        <Icon name="right" />
        <span>{product.name}</span>
      </nav>

      <div className="pl">
        {/* Product Image */}
        <div className="glass pg">
          <div className="pm big" style={{ '--pc': 'transparent' } as any}>
            <ProductImage product={product} />
          </div>
        </div>

        {/* Product Info */}
        <div className="glass card pp">
          <p className="eyebrow">{product.category}</p>
          <h1>{product.name}</h1>
          <p className="price">{peso(product.price)}</p>

          <div className="kv">
            <div>
              <small>Live stock</small>
              <b>{total} unit{total === 1 ? '' : 's'}</b>
            </div>
            <div>
              <small>Stock value</small>
              <b>{peso(total * product.price)}</b>
            </div>
            <div>
              <small>Organization</small>
              <b>{product.organization}</b>
            </div>
          </div>

          <span className="lbl">{isNa ? 'Stock' : 'Stock by size'}</span>
          
          <div className="srows">
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

          <div className="seg" style={{ marginTop: 24 }}>
            <Link to="/org/products" className="btn sm gh">
              <Icon name="back" /> Back to Products
            </Link>
            <button className="btn sm gh" onClick={handleDelete} disabled={busy} style={{ color: confirmDelete ? '#ff5d73' : 'var(--tx)' }}>
              <Icon name="trash" />
              {busy ? 'Saving…' : confirmDelete ? 'Click again to remove' : 'Remove product'}
            </button>
          </div>
        </div>
      </div>
    </section>
  );
}