// src/pages/admin/OrganizationsPage.tsx

import { useState, useMemo } from 'react';
import { Plus } from 'lucide-react';
import { AdminPageHeader, AdminChip, AdminModal } from '../../components/admin';
import { getOrgs, addOrg, orgInitials } from '../../services/admin';

const FILTERS = [
  { id: 'all', label: 'All' },
  { id: 'college', label: 'College' },
  { id: 'shs', label: 'SHS' },
  { id: 'interest', label: 'Interest-Based' },
];

export default function OrganizationsPage() {
  const [filter, setFilter] = useState('all');
  const [refreshKey, setRefreshKey] = useState(0);
  const [isAddOpen, setIsAddOpen] = useState(false);

  const orgs = useMemo(() => getOrgs(filter), [filter, refreshKey]);

  const handleAdd = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const fd = new FormData(e.currentTarget);
    const name = String(fd.get('name')).trim();
    if (!name) return;
    addOrg({
      name,
      type: String(fd.get('type')) as any,
      members: Number(fd.get('members')) || 0,
      products: Number(fd.get('products')) || 0,
      revenue: '₱ 0',
    });
    setIsAddOpen(false);
    setRefreshKey((k) => k + 1);
  };

  return (
    <>
      <AdminPageHeader
        eyebrow="Organizations"
        title="Organization Account Management"
        description="Manage student organizations, their accounts, and product inventory."
        actions={
          <button className="admin-btn admin-btn--primary" onClick={() => setIsAddOpen(true)}>
            <Plus className="react-icon" /> Add Organization
          </button>
        }
      />

      <div className="admin-filter-row">
        {FILTERS.map((f) => (
          <AdminChip key={f.id} label={f.label} active={filter === f.id} onClick={() => setFilter(f.id)} />
        ))}
      </div>

      <div className="admin-org-grid">
        {orgs.map((o) => (
          <article key={o.name} className="admin-org-card">
            <div className="admin-org-card__header">
              <div className="admin-org-card__avatar">{orgInitials(o.name)}</div>
              <div>
                <h3 className="admin-org-card__name">{o.name}</h3>
                <p className="admin-org-card__type">{o.type}</p>
              </div>
            </div>
            <div className="admin-org-card__stats">
              <div><span>{o.members}</span><small>Members</small></div>
              <div><span>{o.products}</span><small>Products</small></div>
              <div><span>{o.revenue}</span><small>Revenue</small></div>
            </div>
            <div className="admin-org-card__actions">
              <button>Manage</button>
              <button>View Store</button>
            </div>
          </article>
        ))}
      </div>

      <AdminModal
        open={isAddOpen}
        title="Add New Organization"
        onClose={() => setIsAddOpen(false)}
      >
        <form id="addOrgForm" onSubmit={handleAdd}>
          <div className="admin-modal__field">
            <label>Organization Name</label>
            <input name="name" placeholder="e.g. CITE Department" required />
          </div>
          <div className="admin-modal__field">
            <label>Type</label>
            <select name="type">
              <option>College</option>
              <option>SHS</option>
              <option>Interest-Based</option>
            </select>
          </div>
          <div className="admin-modal__grid-2">
            <div className="admin-modal__field">
              <label>Members</label>
              <input name="members" type="number" placeholder="100" />
            </div>
            <div className="admin-modal__field">
              <label>Initial Products</label>
              <input name="products" type="number" placeholder="0" />
            </div>
          </div>
          <div className="admin-modal__footer">
            <button type="button" className="admin-btn admin-btn--ghost" onClick={() => setIsAddOpen(false)}>
              Cancel
            </button>
            <button type="submit" className="admin-btn admin-btn--primary">
              Add Organization
            </button>
          </div>
        </form>
      </AdminModal>
    </>
  );
}