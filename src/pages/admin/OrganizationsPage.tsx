// src/pages/admin/OrganizationsPage.tsx

import { useState, useEffect, useCallback } from 'react';
import { Plus } from 'lucide-react';
import { AdminPageHeader, AdminChip, AdminModal } from '../../components/admin';
import { getOrgs, addOrg, orgInitials } from '../../services/admin';
import { useToast } from '../../toast';
import type { AdminOrg } from '../../store/adminStore';

const FILTERS = [
  { id: 'all', label: 'All' },
  { id: 'college', label: 'College' },
  { id: 'shs', label: 'SHS' },
  { id: 'interest', label: 'Interest-Based' },
];

export default function OrganizationsPage() {
  const toast = useToast();

  const [filter, setFilter] = useState('all');
  const [refreshKey, setRefreshKey] = useState(0);
  const [orgs, setOrgs] = useState<AdminOrg[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isAddOpen, setIsAddOpen] = useState(false);

  /* ============================================
     LOAD ORGS (async)
     ============================================ */
  useEffect(() => {
    let cancelled = false;

    async function load() {
      setIsLoading(true);
      try {
        const data = await getOrgs(filter);
        if (!cancelled) setOrgs(data);
      } catch (error) {
        console.error('[OrganizationsPage] Failed to load:', error);
        toast('Failed to load organizations', 'danger');
      } finally {
        if (!cancelled) setIsLoading(false);
      }
    }

    load();
    return () => {
      cancelled = true;
    };
  }, [filter, refreshKey, toast]);

  /* ============================================
     HANDLERS
     ============================================ */

  const handleAdd = useCallback(
    async (formData: FormData) => {
      const name = String(formData.get('name') ?? '').trim();
      const type = String(formData.get('type') ?? 'College') as AdminOrg['type'];
      const members = Number(formData.get('members') ?? 0);
      const products = Number(formData.get('products') ?? 0);
      const description = String(formData.get('description') ?? '').trim();
      const email = String(formData.get('email') ?? '').trim();
      const adviser = String(formData.get('adviser') ?? '').trim();

      if (!name) {
        toast('Please enter an organization name', 'warning');
        return;
      }

      setIsSubmitting(true);
      try {
        await addOrg({
          name,
          type,
          members,
          products,
          description: description || undefined,
          email: email || undefined,
          adviser: adviser || undefined,
        });

        toast(`Added "${name}"`, 'success');
        setIsAddOpen(false);
        setRefreshKey((k) => k + 1);
      } catch (error) {
        console.error('[OrganizationsPage] Add failed:', error);
        toast(
          error instanceof Error ? error.message : 'Failed to add organization',
          'danger'
        );
      } finally {
        setIsSubmitting(false);
      }
    },
    [toast]
  );

  /* ============================================
     RENDER
     ============================================ */
  return (
    <>
      <AdminPageHeader
        eyebrow="Organizations"
        title="Organization Account Management"
        description="Manage student organizations, their accounts, and product inventory."
        actions={
          <button
            className="admin-btn admin-btn--primary"
            onClick={() => setIsAddOpen(true)}
          >
            <Plus className="react-icon" />
            Add Organization
          </button>
        }
      />

      {/* Filters */}
      <div className="admin-filter-row">
        {FILTERS.map((f) => (
          <AdminChip
            key={f.id}
            label={f.label}
            active={filter === f.id}
            onClick={() => setFilter(f.id)}
          />
        ))}
      </div>

      {/* Orgs grid */}
      <div className="admin-org-grid">
        {isLoading ? (
          <p className="admin-empty">Loading organizations…</p>
        ) : orgs.length === 0 ? (
          <div className="admin-empty" style={{ gridColumn: '1 / -1', padding: '48px 0' }}>
            <p style={{ margin: '0 0 8px', fontWeight: 700, fontSize: 14 }}>
              No organizations yet
            </p>
            <p style={{ margin: 0, fontSize: 12 }}>
              Click "Add Organization" to create one.
            </p>
          </div>
        ) : (
          orgs.map((o) => (
            <article key={o.id ?? o.name} className="admin-org-card">
              <div className="admin-org-card__header">
                <div className="admin-org-card__avatar">
                  {orgInitials(o.name)}
                </div>
                <div>
                  <h3 className="admin-org-card__name">{o.name}</h3>
                  <p className="admin-org-card__type">{o.type}</p>
                </div>
              </div>

              <div className="admin-org-card__stats">
                <div>
                  <span>{o.members}</span>
                  <small>Members</small>
                </div>
                <div>
                  <span>{o.products}</span>
                  <small>Products</small>
                </div>
                <div>
                  <span>{o.revenue}</span>
                  <small>Revenue</small>
                </div>
              </div>

              <div className="admin-org-card__actions">
                <button>Manage</button>
                <button>View Store</button>
              </div>
            </article>
          ))
        )}
      </div>

      {/* ADD MODAL */}
      <AdminModal
        open={isAddOpen}
        title="Add New Organization"
        onClose={() => !isSubmitting && setIsAddOpen(false)}
        footer={
          <>
            <button
              className="admin-btn admin-btn--ghost"
              onClick={() => setIsAddOpen(false)}
              disabled={isSubmitting}
            >
              Cancel
            </button>
            <button
              className="admin-btn admin-btn--primary"
              disabled={isSubmitting}
              onClick={() => {
                const form = document.getElementById('addOrgForm') as HTMLFormElement;
                if (!form) return;
                const fd = new FormData(form);
                handleAdd(fd);
              }}
            >
              {isSubmitting ? 'Adding…' : 'Add Organization'}
            </button>
          </>
        }
      >
        <form
          id="addOrgForm"
          onSubmit={(e) => {
            e.preventDefault();
            const fd = new FormData(e.currentTarget);
            handleAdd(fd);
          }}
        >
          {/* NAME */}
          <div className="admin-modal__field">
            <label>Organization Name *</label>
            <input
              name="name"
              placeholder="e.g. CITE Department"
              required
              autoFocus
            />
          </div>

          {/* TYPE */}
          <div className="admin-modal__field">
            <label>Type *</label>
            <select name="type" defaultValue="College">
              <option value="College">College</option>
              <option value="SHS">SHS</option>
              <option value="Interest-Based">Interest-Based</option>
            </select>
          </div>

          {/* MEMBERS + PRODUCTS */}
          <div className="admin-modal__grid-2">
            <div className="admin-modal__field">
              <label>Members</label>
              <input
                name="members"
                type="number"
                min="0"
                placeholder="0"
                defaultValue={0}
              />
            </div>
            <div className="admin-modal__field">
              <label>Initial Products</label>
              <input
                name="products"
                type="number"
                min="0"
                placeholder="0"
                defaultValue={0}
              />
            </div>
          </div>

          {/* EMAIL + ADVISER */}
          <div className="admin-modal__grid-2">
            <div className="admin-modal__field">
              <label>Email (optional)</label>
              <input
                name="email"
                type="email"
                placeholder="org@sjcm.edu.ph"
              />
            </div>
            <div className="admin-modal__field">
              <label>Adviser (optional)</label>
              <input
                name="adviser"
                type="text"
                placeholder="Prof. Name"
              />
            </div>
          </div>

          {/* DESCRIPTION */}
          <div className="admin-modal__field">
            <label>Description (optional)</label>
            <textarea
              name="description"
              rows={2}
              placeholder="Short description of the organization"
            />
          </div>
        </form>
      </AdminModal>
    </>
  );
}