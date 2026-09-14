// src/pages/ProfilePage.tsx

import { useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { ArrowLeft, Settings, User, Mail, Building, CreditCard, Camera } from 'lucide-react';
import { useApp } from '../store';
import { useToast } from '../toast';
import ProfilePicture from '../components/ProfilePicture';
import './ProfilePage.css';

export default function ProfilePage() {
  const { session, updateProfilePicture } = useApp();
  const navigate = useNavigate();
  const toast = useToast();

  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [organization, setOrganization] = useState('');
  const [idNumber, setIdNumber] = useState('');
  const [profilePicture, setProfilePicture] = useState<string | null>(null);

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

  const getUsername = () => {
    return email.split('@')[0] || 'username';
  };

  const displayName = name || session.name;
  const username = getUsername();

  return (
    <main className="profile-page">
      <div className="profile-container">
        <header className="profile-header">
          <Link to="/dashboard" className="profile-back">
            <ArrowLeft className="react-icon" aria-hidden="true" />
            <span>← Back</span>
          </Link>
          <Link to="/settings" className="profile-settings-btn" aria-label="Settings">
            <Settings className="react-icon" aria-hidden="true" />
          </Link>
        </header>

        <div className="profile-card">
          <div className="profile-info">
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
                aria-label="Upload profile picture"
              >
                <Camera className="react-icon" aria-hidden="true" />
              </button>
            </div>

            <div className="profile-user-info">
              <div className="profile-username">@{username}</div>
              <h1 className="profile-name">{displayName}</h1>
              <span className="profile-role">{session.role}</span>
            </div>
          </div>

          <div className="profile-form-grid">
            <div className="profile-form-group">
              <label className="profile-form-label">EMAIL</label>
              <div className="profile-form-field">
                <Mail className="react-icon" aria-hidden="true" />
                <span>{email}</span>
              </div>
            </div>

            <div className="profile-form-group">
              <label className="profile-form-label">ORGANIZATION</label>
              <div className="profile-form-field">
                <Building className="react-icon" aria-hidden="true" />
                <span>{organization || 'N/A'}</span>
              </div>
            </div>

            <div className="profile-form-group">
              <label className="profile-form-label">STUDENT ID</label>
              <div className="profile-form-field">
                <CreditCard className="react-icon" aria-hidden="true" />
                <span>{idNumber || 'N/A'}</span>
              </div>
            </div>

            <div className="profile-form-group">
              <label className="profile-form-label">ROLE</label>
              <div className="profile-form-field">
                <User className="react-icon" aria-hidden="true" />
                <span>{session.role}</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </main>
  );
}