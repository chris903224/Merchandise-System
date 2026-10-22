// src/components/organization/StockRow.tsx
import { useState, useEffect } from 'react';
import { Icon } from '../Icon';

export default function StockRow({
  size, qty, max, isNa, onCommit
}: {
  size: string;
  qty: number;
  max: number;
  isNa: boolean;
  onCommit: (v: number) => void;
}) {
  const [val, setVal] = useState(String(qty));

  useEffect(() => { setVal(String(qty)); }, [qty]);

  function commit(n: number) {
    const safe = Math.max(0, Math.floor(n));
    setVal(String(safe));
    if (safe !== qty) onCommit(safe);
  }

  return (
    <div className="sr">
      <b>{isNa ? 'Units' : size}</b>
      <div className="bar"><span style={{ width: `${Math.round((qty / max) * 100)}%` }} /></div>
      <div className="qty">
        <button type="button" onClick={() => commit(qty - 1)} disabled={qty <= 0}><Icon name="minus" /></button>
        <input
          type="number"
          value={val}
          onChange={(e) => setVal(e.target.value)}
          onBlur={() => commit(Number(val))}
          onKeyDown={(e) => e.key === 'Enter' && commit(Number(val))}
        />
        <button type="button" onClick={() => commit(qty + 1)}><Icon name="add" /></button>
      </div>
      <span className={`pill ${qty <= 0 ? 'no' : qty <= 3 ? 'wa' : 'ok'}`}>
        {qty <= 0 ? 'Out' : qty <= 3 ? 'Low' : 'OK'}
      </span>
    </div>
  );
}