// src/pages/ProfilePage.tsx

import { useEffect, useRef, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import {
  User,
  Mail,
  Phone,
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
  Menu,
  X,
  Store,
  ShoppingCart,
  Shield,
} from 'lucide-react';
import { useApp } from '../store';
import { useToast } from '../toast';
import ProfilePicture from '../components/ProfilePicture';
import { uploadAvatar, uploadCover, fetchProfileImages } from '../data/storage';
import './ProfilePage.css';

type ProfileTab = 'info' | 'security' | 'school';

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

const sideNavItems = [
  { to: '/', label: 'Home', icon: Home, end: true },
  { to: '/catalog', label: 'Shop', icon: Store },
  { to: '/cart', label: 'Cart', icon: ShoppingCart },
  { to: '/dashboard', label: 'My Orders', icon: Package },
  { to: '/profile', label: 'Profile', icon: User, active: true },
  { to: '/settings', label: 'Settings', icon: Shield },
];

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
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [isSidebarPinned, setIsSidebarPinned] = useState(false);
  const [isUploading, setIsUploading] = useState(false);

  const sidebarRef = useRef<HTMLElement>(null);
  const hoverZoneRef = useRef<HTMLDivElement>(null);
  const closeTimerRef = useRef<number | null>(null);

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

    // Fetch avatar + cover mula sa Supabase
    const loadImages = async () => {
      try {
        const { avatar_url, cover_url } = await fetchProfileImages(session.id);
        if (avatar_url) setProfilePicture(avatar_url);
        if (cover_url) {
          setCoverPhoto(cover_url);
          console.log('[Profile] Cover loaded:', cover_url);
        } else {
          console.log('[Profile] No cover_url sa database');
        }
      } catch (error) {
        console.error('[Profile] Failed to load images:', error);
      }
    };

    void loadImages();
  }, [session, navigate]);

  // Hover-to-open sidebar (desktop only)
  useEffect(() => {
    const isDesktop = () => window.matchMedia('(min-width: 1024px)').matches;
    if (!isDesktop()) return;

    const openSidebar = () => {
      if (closeTimerRef.current) {
        window.clearTimeout(closeTimerRef.current);
        closeTimerRef.current = null;
      }
      setIsSidebarOpen(true);
    };

    const scheduleClose = () => {
      if (isSidebarPinned) return;
      if (closeTimerRef.current) window.clearTimeout(closeTimerRef.current);
      closeTimerRef.current = window.setTimeout(() => {
        setIsSidebarOpen(false);
      }, 150);
    };

    const zone = hoverZoneRef.current;
    const sidebar = sidebarRef.current;
    if (!zone || !sidebar) return;

    zone.addEventListener('mouseenter', openSidebar);
    sidebar.addEventListener('mouseenter', openSidebar);
    sidebar.addEventListener('mouseleave', scheduleClose);
    zone.addEventListener('mouseleave', scheduleClose);

    return () => {
      zone.removeEventListener('mouseenter', openSidebar);
      sidebar.removeEventListener('mouseenter', openSidebar);
      sidebar.removeEventListener('mouseleave', scheduleClose);
      zone.removeEventListener('mouseleave', scheduleClose);
      if (closeTimerRef.current) window.clearTimeout(closeTimerRef.current);
    };
  }, [isSidebarPinned, session]);

  if (!session) return null;

  // ============================================
  // HANDLERS — Supabase upload
  // ============================================

  const validateFile = (file: File): boolean => {
    if (file.size > 5 * 1024 * 1024) {
      toast('Image size must be less than 5MB.', 'warning');
      return false;
    }
    if (!file.type.startsWith('image/')) {
      toast('Please upload a valid image file.', 'warning');
      return false;
    }
    return true;
  };

  const handleProfilePictureUpload = () => {
    const input = document.createElement('input');
    input.type = 'file';
    input.accept = 'image/*';
    input.onchange = async (e) => {
      const file = (e.target as HTMLInputElement).files?.[0];
      if (!file || !validateFile(file)) return;

      setIsUploading(true);
      try {
        const { url } = await uploadAvatar(session.id, file);
        setProfilePicture(url);
        updateProfilePicture(url);
        toast('Profile picture updated!', 'success');
      } catch (error) {
        console.error('Avatar upload failed:', error);
        toast(
          error instanceof Error
            ? error.message
            : 'Failed to upload profile picture. Please try again.',
          'danger',
        );
      } finally {
        setIsUploading(false);
      }
    };
    input.click();
  };

  const handleCoverPhotoUpload = () => {
    const input = document.createElement('input');
    input.type = 'file';
    input.accept = 'image/*';
    input.onchange = async (e) => {
      const file = (e.target as HTMLInputElement).files?.[0];
      if (!file || !validateFile(file)) return;

      setIsUploading(true);
      try {
        const { url } = await uploadCover(session.id, file);
        setCoverPhoto(url);
        toast('Cover photo updated!', 'success');
      } catch (error) {
        console.error('Cover upload failed:', error);
        toast(
          error instanceof Error
            ? error.message
            : 'Failed to upload cover photo. Please try again.',
          'danger',
        );
      } finally {
        setIsUploading(false);
      }
    };
    input.click();
  };

  const getUsername = () => email.split('@')[0] || 'username';

  const displayName = name || session.name;
  const username = getUsername();

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

  // Cover style — direct inline backgroundImage (highest priority, cannot be overridden)
  const coverStyle: React.CSSProperties | undefined = coverPhoto
    ? {
        backgroundImage: `url("${coverPhoto}")`,
        backgroundSize: 'cover',
        backgroundPosition: 'center',
        backgroundRepeat: 'no-repeat',
        backgroundColor: 'var(--theme-primary)',
      }
    : undefined;

  return (
    <div className={`profile-shell ${isSidebarOpen ? 'is-sidebar-open' : ''}`}>
      <div
        ref={hoverZoneRef}
        className="profile-hover-zone"
        aria-hidden="true"
      />

      <aside
        ref={sidebarRef}
        className={`profile-sidebar ${isSidebarOpen ? 'is-open' : ''}`}
      >
        <div className="profile-sidebar__top">
          <button
            type="button"
            className="profile-sidebar__pin"
            onClick={() => setIsSidebarPinned((p) => !p)}
            aria-label={isSidebarPinned ? 'Unpin sidebar' : 'Pin sidebar'}
            title={isSidebarPinned ? 'Unpin sidebar' : 'Pin sidebar'}
          >
            {isSidebarPinned ? (
              <X className="react-icon" />
            ) : (
              <ChevronRight className="react-icon" />
            )}
          </button>

          <Link to="/" className="profile-sidebar__brand" onClick={() => setIsSidebarOpen(false)}>
            <span className="profile-sidebar__brand-mark">SJ</span>
            <span className="profile-sidebar__brand-copy">
              <span className="profile-sidebar__brand-name">SJCM STORE</span>
              <span className="profile-sidebar__brand-tag">Official School Merchandise</span>
            </span>
          </Link>

          <nav className="profile-sidebar__nav">
            {sideNavItems.map((item) => {
              const Icon = item.icon;
              const isActive = item.active || item.to === '/profile';
              return (
                <Link
                  key={item.to}
                  to={item.to}
                  className={`profile-sidebar__item ${isActive ? 'is-active' : ''}`}
                  onClick={() => setIsSidebarOpen(false)}
                >
                  <Icon className="react-icon" aria-hidden="true" />
                  <span>{item.label}</span>
                </Link>
              );
            })}
          </nav>
        </div>

        <div className="profile-sidebar__bottom">
          <p className="profile-sidebar__motto">"Faith • Excellence • Service"</p>
          <p className="profile-sidebar__campus">Saint Jude College</p>
        </div>
      </aside>

      {isSidebarOpen ? (
        <div
          className="profile-backdrop"
          onClick={() => setIsSidebarOpen(false)}
          aria-hidden="true"
        />
      ) : null}

      <div className="profile-main-wrap">
        <button
          type="button"
          className="profile-mobile-menu"
          aria-label="Toggle navigation"
          onClick={() => setIsSidebarOpen((p) => !p)}
        >
          {isSidebarOpen ? (
            <X className="react-icon" aria-hidden="true" />
          ) : (
            <Menu className="react-icon" aria-hidden="true" />
          )}
        </button>

        <main className="profile-page">
          <div className="profile-container">
            <div className="profile-layout">
              <div className="profile-main">
                {/* COVER — direct inline backgroundImage */}
                <div className="profile-cover" style={coverStyle}>
                  <div className="profile-cover-overlay" />

                  <button
                    type="button"
                    className="profile-cover-edit"
                    onClick={handleCoverPhotoUpload}
                    disabled={isUploading}
                  >
                    <ImagePlus className="react-icon" aria-hidden="true" />
                    {isUploading ? 'Uploading…' : 'Edit Cover'}
                  </button>

                  <div className="profile-cover-content">
                    <div className="profile-picture-wrapper">
                      <ProfilePicture
                        name={displayName}
                        imageUrl={profilePicture}
                        size="xl"
                        bordered={true}
                      />
                      <button
                        type="button"
                        className="profile-picture-upload"
                        onClick={handleProfilePictureUpload}
                        disabled={isUploading}
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
                          <p className="profile-card-subtitle">
                            Manage your personal details and contact information.
                          </p>
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
                              disabled={isUploading}
                              aria-label="Change photo"
                            >
                              <Camera className="react-icon" aria-hidden="true" />
                            </button>
                          </div>
                          <button
                            type="button"
                            className="profile-photo-btn"
                            onClick={handleProfilePictureUpload}
                            disabled={isUploading}
                          >
                            <Camera className="react-icon" aria-hidden="true" />
                            {isUploading ? 'Uploading…' : 'Change Photo'}
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
                          <p className="profile-card-subtitle">
                            Manage your delivery address for your orders.
                          </p>
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
                        <p className="profile-card-subtitle">
                          Password and login settings live in Settings.
                        </p>
                      </div>
                      <Link to="/settings#security" className="profile-edit-btn">
                        <ChevronRight className="react-icon" aria-hidden="true" />
                        Go to Settings
                      </Link>
                    </div>
                    <p className="profile-empty-note">
                      Nothing to show here yet — connect this tab to your auth/security data
                      when it's ready.
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
                        <p className="profile-card-subtitle">
                          Academic details on file with the registrar.
                        </p>
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

              <aside className="profile-side">
                <div className="profile-side__card">
                  <div className="profile-side__header">
                    <div className="profile-side__title">
                      <ShieldCheck className="react-icon" aria-hidden="true" />
                      Account Status
                    </div>
                    {allVerified && <span className="profile-side__pill">Verified</span>}
                  </div>
                  <ul className="profile-status-list">
                    {statusChecks.map((check) => (
                      <li key={check.label} className="profile-status-item">
                        <CircleCheck
                          className={`react-icon ${check.met ? 'is-met' : 'is-pending'}`}
                          aria-hidden="true"
                        />
                        <span>{check.label}</span>
                      </li>
                    ))}
                  </ul>
                </div>

                <div className="profile-side__card">
                  <div className="profile-side__title">Quick Actions</div>
                  <div className="profile-quick-actions">
                    {quickActions.map((action) => {
                      const Icon = action.icon;
                      const content = (
                        <>
                          <span className={`profile-quick-action__icon profile-quick-action__icon--${action.tone}`}>
                            <Icon className="react-icon" aria-hidden="true" />
                          </span>
                          <span className="profile-quick-action__text">
                            <span className="profile-quick-action__label">{action.label}</span>
                            <span className="profile-quick-action__desc">{action.desc}</span>
                          </span>
                          <ChevronRight className="react-icon profile-quick-action__chev" aria-hidden="true" />
                        </>
                      );
                      return action.href ? (
                        <a key={action.key} href={action.href} className="profile-quick-action">
                          {content}
                        </a>
                      ) : (
                        <Link
                          key={action.key}
                          to={action.to as string}
                          className="profile-quick-action"
                        >
                          {content}
                        </Link>
                      );
                    })}
                  </div>
                </div>

                <div className="profile-side__card">
                  <div className="profile-side__header">
                    <div className="profile-side__title">
                      <Clock className="react-icon" aria-hidden="true" />
                      Recent Activity
                    </div>
                    {recentActivity.length > 0 && (
                      <Link to="/activity" className="profile-side__viewall">
                        View All
                      </Link>
                    )}
                  </div>
                  {recentActivity.length === 0 ? (
                    <p className="profile-empty-note">No recent activity yet.</p>
                  ) : (
                    <ul className="profile-activity-list">
                      {recentActivity.map((item) => {
                        const Icon = activityIcon[item.kind];
                        return (
                          <li key={item.id} className="profile-activity-item">
                            <span className={`profile-activity-icon profile-activity-icon--${item.kind}`}>
                              <Icon className="react-icon" aria-hidden="true" />
                            </span>
                            <span className="profile-activity-text">
                              <span className="profile-activity-label">{item.label}</span>
                              <span className="profile-activity-time">{item.timestamp}</span>
                            </span>
                            <ChevronRight className="react-icon profile-activity-chevron" aria-hidden="true" />
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
      </div>
    </div>
  );
}