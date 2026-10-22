// src/pages/organization/ProductsPage.tsx

import { useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useApp } from '../../store';
import StatCard from '../../components/organization/StatCard';
import ProductCard from '../../components/organization/ProductCard';
import ProductFilters from '../../components/organization/ProductFilters';
import AddProductForm from '../../components/organization/AddProductForm';
import { Icon } from '../../components/Icon';
import type { Product } from '../../types';
import type { ProductFiltersState } from '../../types/organization';
import '../../styles/organization/index.css';

const PER_PAGE = 12;
const LOW = 10;

function totalStock(p: Product): number {
  if (p.sizeStocks && Object.keys(p.sizeStocks).length > 0) {
    return Object.values(p.sizeStocks).reduce((a, b) => a + (Number(b) || 0), 0);
  }
  return p.stock ?? 0;
}

export default function ProductsPage() {
  const { session, products, addProduct } = useApp();
  const org = session?.organization ?? '';
  const navigate = useNavigate();

  const [filters, setFilters] = useState<ProductFiltersState>({ 
    category: 'ALL', 
    stock: 'ALL', 
    sort: 'featured', 
    page: 1, 
    search: '' 
  });
  const [showAdd, setShowAdd] = useState(false);

  // ✅ TINANGGAL ANG FILTER PARA MAKITA LAHAT NG 45 PRODUCTS
  const mine = useMemo(() => {
    return products; // Ipapakita lahat
  }, [products]);

  // Kunin lahat ng unique categories
  const categories = useMemo(() => 
    [...new Set(mine.map((p) => p.category))].sort(), 
    [mine]
  );

  // I-apply ang search, category, stock filters, at sorting
  const filtered = useMemo(() => {
    const term = filters.search.trim().toLowerCase();
    
    let r = mine.filter((p) => {
      const matchesSearch = !term || p.name.toLowerCase().includes(term) || p.category.toLowerCase().includes(term);
      const matchesCategory = filters.category === 'ALL' || p.category === filters.category;
      
      const total = totalStock(p);
      const matchesStock = 
        filters.stock === 'ALL' || 
        (filters.stock === 'IN' && total > 0) || 
        (filters.stock === 'LOW' && total > 0 && total <= LOW) || 
        (filters.stock === 'OUT' && total <= 0);
        
      return matchesSearch && matchesCategory && matchesStock;
    });

    const sorters: Record<string, (a: Product, b: Product) => number> = {
      sa: (a, b) => totalStock(a) - totalStock(b),
      sd: (a, b) => totalStock(b) - totalStock(a),
      n: (a, b) => a.name.localeCompare(b.name),
      pa: (a, b) => a.price - b.price,
    };

    if (sorters[filters.sort]) {
      r = [...r].sort(sorters[filters.sort]);
    }

    return r;
  }, [mine, filters]);

  // Pagination logic
  const totalPages = Math.max(1, Math.ceil(filtered.length / PER_PAGE));
  const page = Math.min(filters.page, totalPages);
  const visible = filtered.slice((page - 1) * PER_PAGE, page * PER_PAGE);

  // Stats calculations
  const units = filtered.reduce((t: number, p: Product) => t + totalStock(p), 0);
  const lowCount = filtered.filter((p) => { 
    const t = totalStock(p); 
    return t > 0 && t <= LOW; 
  }).length;
  const outCount = filtered.filter((p) => totalStock(p) <= 0).length;

  return (
    <section className="page-products">
      <div className="ph">
        <div>
          <h2>Products</h2>
          <p>Oversee merchandise and live stock for all organizations.</p>
        </div>
        <button className="btn" onClick={() => setShowAdd((v) => !v)}>
          {showAdd ? 'Cancel' : 'Add product'}
        </button>
      </div>

      {showAdd && (
        <AddProductForm
          organization={org}
          onCreate={async (input) => { 
            const newProduct = { 
              ...input, 
              id: crypto.randomUUID(),
              stock: Number(input.stock) || 0,
              sizes: input.sizes || [],
              sizeStocks: input.sizeStocks || {},
            };
            await addProduct(newProduct); 
            setShowAdd(false); 
          }}
          onCancel={() => setShowAdd(false)}
        />
      )}

      <div className="stats s3">
        <StatCard color="g2" icon="box" label="Units in stock" value={units} />
        <StatCard color="g4" icon="info" label="Low stock" value={lowCount} />
        <StatCard color="g5" icon="x" label="Out of stock" value={outCount} />
      </div>

      <ProductFilters
        filters={filters}
        categories={categories}
        products={mine}
        onChange={(patch) => setFilters((f) => ({ ...f, ...patch, page: 1 }))}
        onClear={() => setFilters({ category: 'ALL', stock: 'ALL', sort: 'featured', page: 1, search: '' })}
        meta={{ from: (page - 1) * PER_PAGE + 1, to: (page - 1) * PER_PAGE + visible.length, total: filtered.length }}
      />

      <div className="pgrid">
        {visible.length === 0 ? (
          <div className="glass card empty">
            <Icon name="box" />
            <h2>No products found</h2>
            <p>Try another category or stock level.</p>
          </div>
        ) : (
          visible.map((p) => (
            <ProductCard 
              key={p.id} 
              product={p} 
              onOpen={() => navigate(`/org/products/${p.id}`)} 
            />
          ))
        )}
      </div>

      {totalPages > 1 && (
        <div className="pgn">
          <button className="btn sm gh" disabled={page <= 1} onClick={() => setFilters((f) => ({ ...f, page: page - 1 }))}>
            <Icon name="back" />
          </button>
          {Array.from({ length: totalPages }, (_, i) => (
            <button key={i} className={`btn sm gh${i + 1 === page ? ' on' : ''}`} onClick={() => setFilters((f) => ({ ...f, page: i + 1 }))}>
              {i + 1}
            </button>
          ))}
          <button className="btn sm gh" disabled={page >= totalPages} onClick={() => setFilters((f) => ({ ...f, page: page + 1 }))}>
            <Icon name="right" />
          </button>
        </div>
      )}
    </section>
  );
}