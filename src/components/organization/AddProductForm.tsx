// src/components/organization/AddProductForm.tsx
import { useState } from 'react';
import type { Product } from '../../types';

export default function AddProductForm({
  organization,
  onCreate,
  onCancel,
}: {
  organization: string;
  onCreate: (product: Omit<Product, 'id'>) => void;
  onCancel: () => void;
}) {
  const [name, setName] = useState('');
  const [category, setCategory] = useState('Uniforms');
  const [price, setPrice] = useState('');
  const [stock, setStock] = useState('');
  const [error, setError] = useState('');

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!name.trim()) return setError('Enter a product name');
    if (!(Number(price) > 0)) return setError('Enter a valid price');

    const totalStock = Number(stock) || 0;
    const defaultSizes = ['S', 'M', 'L', 'XL'];
    const perSize = Math.floor(totalStock / defaultSizes.length);

    onCreate({
      name: name.trim(),
      category,
      organization,
      price: Number(price),
      stock: totalStock,
      sizes: defaultSizes,
      sizeStocks: { S: perSize, M: perSize, L: perSize, XL: perSize },
      image: '', 
      imageAlt: name,
      description: '',
    });
  }

  return (
    <form className="glass card form open" onSubmit={handleSubmit} style={{ display: 'grid', gap: 12 }}>
      <input className="in" placeholder="Product name" value={name} onChange={(e) => setName(e.target.value)} />
      <input className="in" placeholder="Category" value={category} onChange={(e) => setCategory(e.target.value)} />
      <input className="in" type="number" placeholder="Price (₱)" value={price} onChange={(e) => setPrice(e.target.value)} />
      <input className="in" type="number" placeholder="Stock (total)" value={stock} onChange={(e) => setStock(e.target.value)} />
      
      {error && <small style={{ color: '#ff8b9c' }}>{error}</small>}

      <div className="seg">
        <button type="button" className="btn sm gh" onClick={onCancel}>Cancel</button>
        <button type="submit" className="btn">Save</button>
      </div>
    </form>
  );
}