// src/pages/admin/ProfilePage.tsx

import { useState, useEffect } from 'react';
import { Save } from 'lucide-react';
import { AdminPageHeader } from '../../components/admin';
import { useApp } from '../../store';

interface ProfileForm {
  name: string;
  email: string;
  empId: string;
}

const STORAGE_KEY = 'sjcm_admin_profile';

export default function ProfilePage() {
  const { session } = useApp();
  const [profile, setProfile] = useState<ProfileForm>({ name: 'Admin', email: 'admin@sjcm.edu.ph', empId: 'ADM-0001' });
  const [saved, setSaved] = useState(false);

  useEffect(() => {
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      if (raw) {
        setProfile(JSON.parse(raw));
      } else if (session) {
        setProfile({
          name: session.name || 'Admin',
          email: session.email || 'admin@sjcm.edu.ph',
          empId: session.idNumber || 'ADM-0001',
        });
      }
    } catch { /* ignore */ }
  }, [session]);

  const handleSave = () => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(profile));
    setSaved(true);
    setTimeout(() => setSaved(false), 2000);
  };

  return (
    <>
      <AdminPageHeader
        eyebrow="Account"
        title="Admin Profile"
        description="Manage your admin account information and preferences."
        actions={
          <button className="admin-btn admin-btn--primary" onClick={handleSave}>
            <Save className="react-icon" /> {saved ? 'Saved!' : 'Save Changes'}
          </button>
        }
      />

      <div className="admin-profile-layout">
        <div className="admin-profile-card">
          <div className="admin-profile-card__avatar">
            {profile.name.split(' ').map((w) => w[0]).slice(0, 2).join('').toUpperCase()}
          </div>
          <h2 className="admin-profile-card__name">{profile.name}</h2>
          <p className="admin-profile-card__role">System Administrator</p>
          <p className="admin-profile-card__email">{profile.email}</p>
          <div className="admin-profile-card__stats">
            <div><span>248</span><small>Orders</small></div>
            <div><span>86</span><small>Products</small></div>
            <div><span>12</span><small>Reports</small></div>
          </div>
        </div>

        <div className="admin-profile-form">
          <div className="admin-field">
            <label>Full Name</label>
            <input
              type="text"
              value={profile.name}
              onChange={(e) => setProfile({ ...profile, name: e.target.value })}
            />
          </div>
          <div className="admin-field">
            <label>Email Address</label>
            <input
              type="email"
              value={profile.email}
              onChange={(e) => setProfile({ ...profile, email: e.target.value })}
            />
          </div>
          <div className="admin-field">
            <label>Role</label>
            <input type="text" value="Administrator" disabled />
          </div>
          <div className="admin-field">
            <label>Employee ID</label>
            <input
              type="text"
              value={profile.empId}
              onChange={(e) => setProfile({ ...profile, empId: e.target.value })}
            />
          </div>
        </div>
      </div>
    </>
  );
}