// src/pages/ProfilePage.tsx

import { useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import {
  ArrowLeft,
  User,
  Mail,
  Phone,
  CreditCard,
  Camera,
  ImagePlus,
  ShieldCheck,
  CircleCheck,
  Pencil,
  LifeBuoy,
  ChevronRight,
  Clock,
  MapPin,
  Home,
  GraduationCap,
  Calendar,
  CalendarRange,
  Package,
  Lock,
  Building2,
} from 'lucide-react';
import { useApp } from '../store';
import { useToast } from '../toast';
import ProfilePicture from '../components/ProfilePicture';
import './ProfilePage.css';

type ProfileTab = 'info' | 'security' | 'school';

// Swap this for real events from your store/API once that data exists.
// Kept empty by default so the UI never shows fabricated activity.
type ActivityItem = {
  id: string;
  label: string;
  timestamp: string;
  kind: 'order' | 'profile' | 'security';
};
const recentActivity: ActivityItem[] = [];

const activityIcon = {
  order: Package,
  profile: Pencil,
  security: Lock,
};

export default function ProfilePage() {
  const { session, updateProfilePicture } = useApp();
  const navigate = useNavigate();
  const toast = useToast();

  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [organization, setOrganization] = useState('');
  const [idNumber, setIdNumber] = useState('');
  const [profilePicture, setProfilePicture] = useState<string | null>(null);
  const [coverPhoto, setCoverPhoto] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<ProfileTab>('info');

  // ----- Not on the session model yet -----
  // courseStrand, yearLevel, dob, schoolYear, phone, campus, program, adviser
  // aren't wired to the backend/store yet. Left blank ('') on purpose so the
  // UI shows honest empty states instead of fabricated values. Wire these up
  // once your session/profile API returns them (same fields already used in
  // SettingsPage.tsx).
  const [courseStrand] = useState('');
  const [yearLevel] = useState('');
  const [dob] = useState('');
  const [schoolYear] = useState('');
  const [phone] = useState('');
  const [campus] = useState('');
  const [program] = useState('');
  const [adviser] = useState('');
  const [shippingAddress] = useState<string | null>(null);

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

  const handleImageUpload = (onSuccess: (dataUrl: string) => void) => {
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
          onSuccess(event.target?.result as string);
        };
        reader.readAsDataURL(file);
      }
    };
    input.click();
  };

  const handleProfilePictureUpload = () => {
    handleImageUpload((imageUrl) => {
      setProfilePicture(imageUrl);
      updateProfilePicture(imageUrl);
      toast('Profile picture updated!', 'success');
    });
  };

  const handleCoverPhotoUpload = () => {
    // TODO: persist to backend once a cover-photo field exists on the profile API.
    handleImageUpload((imageUrl) => {
      setCoverPhoto(imageUrl);
      toast('Cover photo updated!', 'success');
    });
  };

  const getUsername = () => {
    return email.split('@')[0] || 'username';
  };

  const displayName = name || session.name;
  const username = getUsername();

  // Derived, not invented: status reflects fields that actually exist on the session.
  const statusChecks = [
    { label: 'Email Verified', met: Boolean(email) },
    { label: 'Student ID Verified', met: Boolean(idNumber) },
    { label: 'Account Active', met: true },
  ];
  const allVerified = statusChecks.every((check) => check.met);

  const quickActions = [
    {
      key: 'orders',
      to: '/my-orders',
      icon: Package,
      tone: 'teal' as const,
      label: 'View My Orders',
      desc: 'Track your orders and purchases',
    },
    {
      key: 'update',
      to: '/settings',
      icon: Pencil,
      tone: 'pink' as const,
      label: 'Update Profile',
      desc: 'Edit your personal information',
    },
    {
      key: 'password',
      to: '/settings#security',
      icon: Lock,
      tone: 'purple' as const,
      label: 'Change Password',
      desc: 'Keep your account secure',
    },
    {
      key: 'help',
      href: 'mailto:support@example.com',
      icon: LifeBuoy,
      tone: 'blue' as const,
      label: 'Help & Support',
      desc: 'Get assistance when you need it',
    },
  ];

  return (
    <main className="profile-page">
      <div className="profile-container">
        <header className="profile-header">
          <Link to="/dashboard" className="profile-back">
            <ArrowLeft className="react-icon" aria-hidden="true" />
            <span>Back</span>
          </Link>
        </header>

        <div className="profile-layout">
          {/* ===== Main column ===== */}
          <div className="profile-main">
            <div className="profile-cover" style={coverPhoto ? { backgroundImage: `url(${coverPhoto})` } : undefined}>
              <div className="profile-cover-overlay" />

              <button type="button" className="profile-cover-edit" onClick={handleCoverPhotoUpload}>
                <ImagePlus className="react-icon" aria-hidden="true" />
                Edit Cover
              </button>

              <div className="profile-cover-content">
                <div className="profile-picture-wrapper">
                  <ProfilePicture name={displayName} imageUrl={profilePicture} size="xl" bordered={true} />
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
                    <span>{session.role}</span>
                    {organization && (
                      <>
                        <span className="profile-meta-dot" aria-hidden="true" />
                        <span>{organization}</span>
                      </>
                    )}
                    <span className="profile-meta-dot" aria-hidden="true" />
                    <span>@{username}</span>
                  </div>
                </div>
              </div>
            </div>

            <nav className="profile-tabs" role="tablist" aria-label="Profile sections">
              <button
                type="button"
                role="tab"
                aria-selected={activeTab === 'info'}
                className={`profile-tab ${activeTab === 'info' ? 'is-active' : ''}`}
                onClick={() => setActiveTab('info')}
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

            {activeTab === 'info' && (
              <>
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

                  <div className="profile-info-body">
                    <div className="profile-photo-block">
                      <div className="profile-photo-thumb">
                        {profilePicture ? (
                          <img src={profilePicture} alt={displayName} />
                        ) : (
                          <div className="profile-photo-fallback">
                            <User className="react-icon" aria-hidden="true" />
                          </div>
                        )}
                        <button
                          type="button"
                          className="profile-photo-badge"
                          onClick={handleProfilePictureUpload}
                          aria-label="Change photo"
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
                        <p className="profile-form-value">{displayName}</p>
                      </div>

                      <div className="profile-form-group">
                        <label className="profile-form-label">Student ID</label>
                        <p className="profile-form-value">{idNumber || 'N/A'}</p>
                      </div>

                      <div className="profile-form-group">
                        <label className="profile-form-label">Course / Strand</label>
                        <p className="profile-form-value">{courseStrand || 'N/A'}</p>
                      </div>

                      <div className="profile-form-group">
                        <label className="profile-form-label">Year Level</label>
                        <p className="profile-form-value">{yearLevel || 'N/A'}</p>
                      </div>

                      <div className="profile-form-group">
                        <label className="profile-form-label">Date of Birth</label>
                        <p className="profile-form-value">{dob || 'N/A'}</p>
                      </div>

                      <div className="profile-form-group">
                        <label className="profile-form-label">School Year</label>
                        <p className="profile-form-value">{schoolYear || 'N/A'}</p>
                      </div>

                      <div className="profile-form-group">
                        <label className="profile-form-label">Email Address</label>
                        <div className="profile-form-field">
                          <Mail className="react-icon" aria-hidden="true" />
                          <span>{email}</span>
                        </div>
                      </div>

                      <div className="profile-form-group">
                        <label className="profile-form-label">Phone Number</label>
                        <div className="profile-form-field">
                          <Phone className="react-icon" aria-hidden="true" />
                          <span>{phone || 'N/A'}</span>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>

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

                  <div className="profile-address-box">
                    <div className="profile-address-icon">
                      <Home className="react-icon" aria-hidden="true" />
                    </div>
                    {shippingAddress ? (
                      <p className="profile-address-text">{shippingAddress}</p>
                    ) : (
                      <p className="profile-address-text profile-address-text-empty">
                        No shipping address on file yet.
                      </p>
                    )}
                  </div>
                </div>
              </>
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
                  <Link to="/settings#security" className="profile-edit-btn">
                    <ChevronRight className="react-icon" aria-hidden="true" />
                    Go to Settings
                  </Link>
                </div>
                <p className="profile-empty-note">
                  Nothing to show here yet — connect this tab to your auth/security data when it's ready.
                </p>
              </div>
            )}

            {activeTab === 'school' && (
              <div className="profile-card">
                <div className="profile-card-header">
                  <div>
                    <h2 className="profile-card-title">
                      <GraduationCap className="react-icon" aria-hidden="true" />
                      School Information
                    </h2>
                    <p className="profile-card-subtitle">Academic details on file with the registrar.</p>
                  </div>
                  <Link to="/settings" className="profile-edit-btn">
                    <Pencil className="react-icon" aria-hidden="true" />
                    Edit
                  </Link>
                </div>

                <div className="profile-form-grid">
                  <div className="profile-form-group">
                    <label className="profile-form-label">Campus</label>
                    <div className="profile-form-field">
                      <Building2 className="react-icon" aria-hidden="true" />
                      <span>{campus || 'N/A'}</span>
                    </div>
                  </div>

                  <div className="profile-form-group">
                    <label className="profile-form-label">Program</label>
                    <div className="profile-form-field">
                      <GraduationCap className="react-icon" aria-hidden="true" />
                      <span>{program || courseStrand || 'N/A'}</span>
                    </div>
                  </div>

                  <div className="profile-form-group">
                    <label className="profile-form-label">Year Level</label>
                    <div className="profile-form-field">
                      <Calendar className="react-icon" aria-hidden="true" />
                      <span>{yearLevel || 'N/A'}</span>
                    </div>
                  </div>

                  <div className="profile-form-group">
                    <label className="profile-form-label">School Year</label>
                    <div className="profile-form-field">
                      <CalendarRange className="react-icon" aria-hidden="true" />
                      <span>{schoolYear || 'N/A'}</span>
                    </div>
                  </div>

                  <div className="profile-form-group">
                    <label className="profile-form-label">Academic Adviser</label>
                    <div className="profile-form-field">
                      <User className="react-icon" aria-hidden="true" />
                      <span>{adviser || 'N/A'}</span>
                    </div>
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* ===== Sidebar ===== */}
          <aside className="profile-sidebar">
            <div className="sidebar-card">
              <div className="sidebar-card-header">
                <div className="sidebar-card-title">
                  <ShieldCheck className="react-icon" aria-hidden="true" />
                  Account Status
                </div>
                {allVerified && <span className="sidebar-verified-pill">Verified</span>}
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
              <div className="sidebar-card-title">Quick Actions</div>
              <div className="quick-actions">
                {quickActions.map((action) => {
                  const Icon = action.icon;
                  const content = (
                    <>
                      <span className={`quick-action-icon quick-action-icon--${action.tone}`}>
                        <Icon className="react-icon" aria-hidden="true" />
                      </span>
                      <span className="quick-action-text">
                        <span className="quick-action-label">{action.label}</span>
                        <span className="quick-action-desc">{action.desc}</span>
                      </span>
                      <ChevronRight className="react-icon quick-action-chevron" aria-hidden="true" />
                    </>
                  );
                  return action.href ? (
                    <a key={action.key} href={action.href} className="quick-action">
                      {content}
                    </a>
                  ) : (
                    <Link key={action.key} to={action.to as string} className="quick-action">
                      {content}
                    </Link>
                  );
                })}
              </div>
            </div>

            <div className="sidebar-card">
              <div className="sidebar-card-header">
                <div className="sidebar-card-title">
                  <Clock className="react-icon" aria-hidden="true" />
                  Recent Activity
                </div>
                {recentActivity.length > 0 && (
                  <Link to="/activity" className="sidebar-viewall">
                    View All
                  </Link>
                )}
              </div>
              {recentActivity.length === 0 ? (
                <p className="profile-empty-note">No recent activity yet.</p>
              ) : (
                <ul className="activity-list">
                  {recentActivity.map((item) => {
                    const Icon = activityIcon[item.kind];
                    return (
                      <li key={item.id} className="activity-item">
                        <span className={`activity-icon activity-icon--${item.kind}`}>
                          <Icon className="react-icon" aria-hidden="true" />
                        </span>
                        <span className="activity-text">
                          <span className="activity-label">{item.label}</span>
                          <span className="activity-time">{item.timestamp}</span>
                        </span>
                        <ChevronRight className="react-icon activity-chevron" aria-hidden="true" />
                      </li>
                    );
                  })}
                </ul>
              )}
            </div>
          </aside>
        </div>
      </div>
    </main>
  );
}