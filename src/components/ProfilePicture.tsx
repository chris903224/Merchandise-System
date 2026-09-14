// src/components/ProfilePicture.tsx

import React from 'react';

interface ProfilePictureProps {
  name: string;
  imageUrl?: string | null;
  size?: 'sm' | 'md' | 'lg' | 'xl';
  className?: string;
  onClick?: () => void;
  alt?: string;
  bordered?: boolean;
}

const SIZE_MAP = {
  sm: {
    container: 'w-8 h-8',
    text: 'text-xs',
    svgSize: 32,
  },
  md: {
    container: 'w-10 h-10',
    text: 'text-sm',
    svgSize: 40,
  },
  lg: {
    container: 'w-14 h-14',
    text: 'text-base',
    svgSize: 56,
  },
  xl: {
    container: 'w-20 h-20',
    text: 'text-2xl',
    svgSize: 80,
  },
};

// Make sure to export the component correctly
const ProfilePicture: React.FC<ProfilePictureProps> = ({
  name,
  imageUrl,
  size = 'md',
  className = '',
  onClick,
  alt,
  bordered = true,
}) => {
  // Get initials from name (e.g., "Christian Jr. Villanueva" -> "CV")
  const getInitials = (fullName: string) => {
    if (!fullName || fullName.trim() === '') return '?';
    
    const parts = fullName.trim().split(' ');
    
    if (parts.length === 1) {
      return parts[0].charAt(0).toUpperCase();
    }
    
    const firstName = parts[0];
    const lastName = parts[parts.length - 1];
    
    return (firstName.charAt(0) + lastName.charAt(0)).toUpperCase();
  };

  const initials = getInitials(name);
  const sizeStyles = SIZE_MAP[size];
  const altText = alt || `${name}'s profile picture`;

  // Purple gradient colors
  const purpleGradients = [
    'from-purple-500 to-purple-600',
    'from-purple-600 to-purple-700',
    'from-indigo-500 to-purple-600',
    'from-purple-400 to-purple-600',
    'from-violet-500 to-purple-600',
  ];

  const colorIndex = name ? name.length % purpleGradients.length : 0;
  const gradientClass = purpleGradients[colorIndex];

  const ringClasses = bordered 
    ? 'ring-2 ring-white shadow-lg' 
    : '';

  const baseClasses = `rounded-full flex items-center justify-center flex-shrink-0 overflow-hidden ${sizeStyles.container} ${className}`;

  // If there's an image, show it in a perfect circle
  if (imageUrl) {
    return (
      <div 
        className={`${baseClasses} ${ringClasses}`} 
        style={{ 
          aspectRatio: '1/1',
          width: '100%',
          height: '100%'
        }}
        onClick={onClick}
      >
        <img
          src={imageUrl}
          alt={altText}
          className="w-full h-full object-cover"
          style={{ 
            aspectRatio: '1/1',
            width: '100%',
            height: '100%',
            objectFit: 'cover'
          }}
          onError={(e) => {
            e.currentTarget.style.display = 'none';
            const parent = e.currentTarget.parentElement;
            if (parent) {
              const fallback = document.createElement('div');
              fallback.className = `${baseClasses} bg-gradient-to-br ${gradientClass} text-white font-semibold ${sizeStyles.text} ${ringClasses}`;
              fallback.textContent = initials;
              fallback.style.aspectRatio = '1/1';
              parent.appendChild(fallback);
            }
          }}
        />
      </div>
    );
  }

  // DEFAULT: Purple circle with initials using SVG
  const svgSize = sizeStyles.svgSize;
  const fontSize = size === 'xl' ? 28 : size === 'lg' ? 20 : size === 'md' ? 14 : 10;

  return (
    <div 
      className={`flex-shrink-0 ${sizeStyles.container} ${className}`}
      style={{ 
        aspectRatio: '1/1',
        width: '100%',
        height: '100%'
      }}
      onClick={onClick}
      title={name}
      role="img"
      aria-label={altText}
    >
      <svg
        width="100%"
        height="100%"
        viewBox={`0 0 ${svgSize} ${svgSize}`}
        className={`rounded-full ${ringClasses}`}
        style={{ display: 'block' }}
      >
        <defs>
          <linearGradient id={`grad-${name}`} x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="#8B5CF6" />
            <stop offset="100%" stopColor="#7C3AED" />
          </linearGradient>
        </defs>
        <circle cx={svgSize / 2} cy={svgSize / 2} r={svgSize / 2} fill={`url(#grad-${name})`} />
        
        {bordered && (
          <circle 
            cx={svgSize / 2} 
            cy={svgSize / 2} 
            r={svgSize / 2 - 2} 
            fill="none" 
            stroke="white" 
            strokeWidth={svgSize / 20}
            opacity="0.6"
          />
        )}
        
        <text
          x="50%"
          y="50%"
          dominantBaseline="central"
          textAnchor="middle"
          fill="white"
          fontSize={fontSize}
          fontWeight="600"
          fontFamily="system-ui, -apple-system, sans-serif"
          letterSpacing="0.5"
        >
          {initials}
        </text>
      </svg>
    </div>
  );
};

// Export as default
export default ProfilePicture;