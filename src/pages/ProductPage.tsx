// src/pages/ProfilePage.tsx

import { useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import {
  ArrowLeft,
  Settings,
  User,
  Mail,
  Building,
  CreditCard,
  Camera,
  ShieldCheck,
  CircleCheck,
  Pencil,
  LifeBuoy,
  ChevronRight,
  Clock,
  Star,
  Zap,
  MapPin,
  Lock,
  Package,
  Home,
} from 'lucide-react';
import { useApp } from '../store';
import { useToast } from '../toast';
import './ProfilePage.css';

type ProfileTab = 'personal' | 'school' | 'security';

// Swap this for real events from your store/API once that data exists.
// Kept empty by default so the UI never shows fabricated activity.
type ActivityItem = { id: string; label: string; timestamp: string };
const recentActivity: ActivityItem[] = [];

// No address model on the session yet — flip this on once you add one.
const shippingAddress: string | null = null;

export default function ProfilePage() {
  const { session, updateProfilePicture } = useApp();
  const navigate = useNavigate();
  const toast = useToast();

  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [organization, setOrganization] = useState('');
  const [idNumber, setIdNumber] = useState('');
  const [profilePicture, setProfilePicture] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<ProfileTab>('personal');

  useEffect(() => {
    if (!session) {
      navigate('/dashboard');
      return;
    }
    setName(session.name || '');
    setEmail(session.email || '');
    setOrganization(session.organization || '');
    setIdNumber(session.idNumber || '');
    setProfilePicture(session.profilePicture || null);
  }, [session, navigate]);

  if (!session) {
    return null;
  }

  const handleProfilePictureUpload = () => {
    const input = document.createElement('input');
    input.type = 'file';
    input.accept = 'image/*';
    input.onchange = (e) => {
      const file = (e.target as HTMLInputElement).files?.[0];
      if (file) {
        if (file.size > 5 * 1024 * 1024) {
          toast('Image size must be less than 5MB.', 'warning');
          return;
        }
        if (!file.type.startsWith('image/')) {
          toast('Please upload a valid image file.', 'warning');
          return;
        }
        const reader = new FileReader();
        reader.onload = (event) => {
          const imageUrl = event.target?.result as string;
          setProfilePicture(imageUrl);
          updateProfilePicture(imageUrl);
          toast('Profile picture updated!', 'success');
        };
        reader.readAsDataURL(file);
      }
    };
    input.click();
  };

  const getUsername = () => email.split('@')[0] || 'username';
  const getInitials = () => {
    const source = name || session.name || '';
    return (
      source
        .split(' ')
        .filter(Boolean)
        .slice(0, 2)
        .map((part) => part[0]?.toUpperCase())
        .join('') || 'U'
    );
  };

  const displayName = name || session.name;
  const username = getUsername();

  // Derived, not invented: status reflects fields that actually exist on the session.
  const statusChecks = [
    { label: 'Email Verified', met: Boolean(email) },
    { label: 'Student ID Verified', met: Boolean(idNumber) },
    { label: 'Account Active', met: true },
  ];
  const verifiedCount = statusChecks.filter((c) => c.met).length;

  return (
    <main className="profile-page">
      <div className="profile-container">
        <header className="profile-header">
          <Link to="/dashboard" className="profile-back">
            <ArrowLeft className="react-icon" aria-hidden="true" />
            <span>Back</span>
          </Link>
          <Link to="/settings" className="profile-settings-btn" aria-label="Settings">
            <Settings className="react-icon" aria-hidden="true" />
          </Link>
        </header>

        <div className="profile-layout">
          {/* ===== Main column ===== */}
          <div className="profile-main">
            <div className="profile-cover">
              <button type="button" className="profile-cover-edit">
                <Pencil className="react-icon" aria-hidden="true" />
                Edit Cover
              </button>

              <div className="profile-cover-content">
                <div className="profile-picture-wrapper">
                  {profilePicture ? (
                    <img src={profilePicture} alt={displayName} />
                  ) : (
                    <div className="profile-picture-fallback">{getInitials()}</div>
                  )}
                  <button
                    type="button"
                    className="profile-picture-upload"
                    onClick={handleProfilePictureUpload}
                    aria-label="Upload profile picture"
                  >
                    <Camera className="react-icon" aria-hidden="true" />
                  </button>
                </div>

                <div className="profile-user-info">
                  <div className="profile-name-row">
                    <h1 className="profile-name">{displayName}</h1>
                    <span className="profile-status-pill">
                      <span className="profile-status-dot" />
                      Active
                    </span>
                  </div>
                  <div className="profile-meta-row">
                    <span>@{username}</span>
                    <span className="profile-meta-dot" aria-hidden="true" />
                    <span>{session.role}</span>
                    {organization && (
                      <>
                        <span className="profile-meta-dot" aria-hidden="true" />
                        <span>{organization}</span>
                      </>
                    )}
                  </div>
                </div>
              </div>
            </div>

            <nav className="profile-tabs" role="tablist" aria-label="Profile sections">
              <button
                type="button"
                role="tab"
                aria-selected={activeTab === 'personal'}
                className={`profile-tab ${activeTab === 'personal' ? 'is-active' : ''}`}
                onClick={() => setActiveTab('personal')}
              >
                Personal Info
              </button>
              <button
                type="button"
                role="tab"
                aria-selected={activeTab === 'security'}
                className={`profile-tab ${activeTab === 'security' ? 'is-active' : ''}`}
                onClick={() => setActiveTab('security')}
              >
                Account Security
              </button>
              <button
                type="button"
                role="tab"
                aria-selected={activeTab === 'school'}
                className={`profile-tab ${activeTab === 'school' ? 'is-active' : ''}`}
                onClick={() => setActiveTab('school')}
              >
                School Information
              </button>
            </nav>

            {activeTab === 'personal' && (
              <div className="profile-card">
                <div className="profile-card-header">
                  <div>
                    <h2 className="profile-card-title">
                      <User className="react-icon" aria-hidden="true" />
                      Personal Information
                    </h2>
                    <p className="profile-card-subtitle">Manage your personal details and contact information.</p>
                  </div>
                  <Link to="/settings" className="profile-edit-btn">
                    <Pencil className="react-icon" aria-hidden="true" />
                    Edit Profile
                  </Link>
                </div>

                <div className="profile-card-body">
                  <div className="profile-photo-block">
                    <div className="profile-photo-box">
                      {profilePicture ? (
                        <img src={profilePicture} alt={displayName} />
                      ) : (
                        <div className="profile-photo-fallback">{getInitials()}</div>
                      )}
                      <button
                        type="button"
                        className="profile-photo-badge"
                        onClick={handleProfilePictureUpload}
                        aria-label="Upload profile picture"
                      >
                        <Camera className="react-icon" aria-hidden="true" />
                      </button>
                    </div>
                    <button type="button" className="profile-photo-btn" onClick={handleProfilePictureUpload}>
                      <Camera className="react-icon" aria-hidden="true" />
                      Change Photo
                    </button>
                  </div>

                  <div className="profile-form-grid">
                    <div className="profile-form-group">
                      <label className="profile-form-label">Full Name</label>
                      <div className="profile-form-field">
                        <User className="react-icon" aria-hidden="true" />
                        <span>{displayName}</span>
                      </div>
                    </div>

                    <div className="profile-form-group">
                      <label className="profile-form-label">Student ID</label>
                      <div className="profile-form-field">
                        <CreditCard className="react-icon" aria-hidden="true" />
                        <span>{idNumber || 'N/A'}</span>
                      </div>
                    </div>

                    <div className="profile-form-group profile-form-group-wide">
                      <label className="profile-form-label">Email Address</label>
                      <div className="profile-form-field">
                        <Mail className="react-icon" aria-hidden="true" />
                        <span>{email}</span>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {activeTab === 'school' && (
              <div className="profile-card">
                <div className="profile-card-header">
                  <div>
                    <h2 className="profile-card-title">
                      <Building className="react-icon" aria-hidden="true" />
                      School Information
                    </h2>
                    <p className="profile-card-subtitle">Your school and enrollment details.</p>
                  </div>
                </div>

                <div className="profile-form-grid">
                  <div className="profile-form-group">
                    <label className="profile-form-label">Organization</label>
                    <div className="profile-form-field">
                      <Building className="react-icon" aria-hidden="true" />
                      <span>{organization || 'N/A'}</span>
                    </div>
                  </div>

                  <div className="profile-form-group">
                    <label className="profile-form-label">Role</label>
                    <div className="profile-form-field">
                      <User className="react-icon" aria-hidden="true" />
                      <span>{session.role}</span>
                    </div>
                  </div>

                  <div className="profile-form-group">
                    <label className="profile-form-label">Student ID</label>
                    <div className="profile-form-field">
                      <CreditCard className="react-icon" aria-hidden="true" />
                      <span>{idNumber || 'N/A'}</span>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {activeTab === 'security' && (
              <div className="profile-card">
                <div className="profile-card-header">
                  <div>
                    <h2 className="profile-card-title">
                      <ShieldCheck className="react-icon" aria-hidden="true" />
                      Account Security
                    </h2>
                    <p className="profile-card-subtitle">Password and login settings live in Settings.</p>
                  </div>
                  <Link to="/settings" className="profile-edit-btn">
                    <ChevronRight className="react-icon" aria-hidden="true" />
                    Go to Settings
                  </Link>
                </div>
                <p className="profile-empty-note">
                  Nothing to show here yet — connect this tab to your auth/security data when it's ready.
                </p>
              </div>
            )}

            <div className="profile-card">
              <div className="profile-card-header">
                <div>
                  <h2 className="profile-card-title">
                    <MapPin className="react-icon" aria-hidden="true" />
                    Shipping Address
                  </h2>
                  <p className="profile-card-subtitle">Manage your delivery address for your orders.</p>
                </div>
                <Link to="/settings" className="profile-edit-btn">
                  <Pencil className="react-icon" aria-hidden="true" />
                  {shippingAddress ? 'Edit' : 'Add'}
                </Link>
              </div>

              <div className="address-box">
                <div className="address-icon">
                  <Home className="react-icon" aria-hidden="true" />
                </div>
                {shippingAddress ? (
                  <p className="address-text">{shippingAddress}</p>
                ) : (
                  <p className="address-text address-text-empty">No shipping address on file yet.</p>
                )}
              </div>
            </div>
          </div>

          {/* ===== Sidebar ===== */}
          <aside className="profile-sidebar">
            <div className="sidebar-card">
              <div className="sidebar-card-header">
                <div className="sidebar-card-title">
                  <span className="sidebar-icon sidebar-icon-gold">
                    <Star className="react-icon" aria-hidden="true" />
                  </span>
                  Account Status
                </div>
                {verifiedCount === statusChecks.length && <span className="status-pill-mini">Verified</span>}
              </div>
              <ul className="status-list">
                {statusChecks.map((check) => (
                  <li key={check.label} className="status-item">
                    <CircleCheck className={`react-icon ${check.met ? 'is-met' : 'is-pending'}`} aria-hidden="true" />
                    <span>{check.label}</span>
                  </li>
                ))}
              </ul>
            </div>

            <div className="sidebar-card">
              <div className="sidebar-card-title">
                <span className="sidebar-icon sidebar-icon-gold">
                  <Zap className="react-icon" aria-hidden="true" />
                </span>
                Quick Actions
              </div>
              <div className="quick-actions">
                {/* Assumes an /orders route exists — adjust if yours differs. */}
                <Link to="/orders" className="quick-action">
                  <span className="quick-action-icon quick-action-icon-peach">
                    <Package className="react-icon" aria-hidden="true" />
                  </span>
                  <span className="quick-action-text">
                    <span className="quick-action-label">View My Orders</span>
                    <span className="quick-action-desc">Track your orders and purchases</span>
                  </span>
                  <ChevronRight className="react-icon quick-action-chevron" aria-hidden="true" />
                </Link>

                <Link to="/settings" className="quick-action">
                  <span className="quick-action-icon quick-action-icon-lavender">
                    <Pencil className="react-icon" aria-hidden="true" />
                  </span>
                  <span className="quick-action-text">
                    <span className="quick-action-label">Update Profile</span>
                    <span className="quick-action-desc">Edit your personal information</span>
                  </span>
                  <ChevronRight className="react-icon quick-action-chevron" aria-hidden="true" />
                </Link>

                <Link to="/settings" className="quick-action">
                  <span className="quick-action-icon quick-action-icon-blue">
                    <Lock className="react-icon" aria-hidden="true" />
                  </span>
                  <span className="quick-action-text">
                    <span className="quick-action-label">Change Password</span>
                    <span className="quick-action-desc">Keep your account secure</span>
                  </span>
                  <ChevronRight className="react-icon quick-action-chevron" aria-hidden="true" />
                </Link>

                <a href="mailto:support@example.com" className="quick-action">
                  <span className="quick-action-icon quick-action-icon-sky">
                    <LifeBuoy className="react-icon" aria-hidden="true" />
                  </span>
                  <span className="quick-action-text">
                    <span className="quick-action-label">Help &amp; Support</span>
                    <span className="quick-action-desc">Get assistance when you need it</span>
                  </span>
                  <ChevronRight className="react-icon quick-action-chevron" aria-hidden="true" />
                </a>
              </div>
            </div>

            <div className="sidebar-card">
              <div className="sidebar-card-header">
                <div className="sidebar-card-title">
                  <span className="sidebar-icon sidebar-icon-gold">
                    <Clock className="react-icon" aria-hidden="true" />
                  </span>
                  Recent Activity
                </div>
                {recentActivity.length > 0 && (
                  <Link to="/activity" className="sidebar-card-link">
                    View All
                  </Link>
                )}
              </div>
              {recentActivity.length === 0 ? (
                <p className="profile-empty-note">No recent activity yet.</p>
              ) : (
                <ul className="activity-list">
                  {recentActivity.map((item) => (
                    <li key={item.id} className="activity-item">
                      <span className="activity-label">{item.label}</span>
                      <span className="activity-time">{item.timestamp}</span>
                    </li>
                  ))}
                </ul>
              )}
            </div>
          </aside>
        </div>
      </div>
    </main>
  );
}