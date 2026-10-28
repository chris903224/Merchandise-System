// src/components/Icon.tsx

import React from 'react';

const ICONS: Record<string, React.ReactNode> = {
  home: <><path d="M3 11 12 3l9 8v10H3z"/><path d="M9 21v-7h6v7"/></>,
  box: <><path d="M21 8 12 3 3 8v8l9 5 9-5z"/><path d="m3 8 9 5 9-5M12 13v8"/></>,
  card: <><rect x="2" y="5" width="20" height="14" rx="3"/><path d="M2 10h20M6 15h4"/></>,
  gear: <><circle cx="12" cy="12" r="3.5"/><path d="M12 2v3M12 19v3M2 12h3M19 12h3M4.9 4.9 7 7M17 17l2.1 2.1M4.9 19.1 7 17M17 7l2.1-2.1"/></>,
  search: <><circle cx="11" cy="11" r="7"/><path d="m20 20-4-4"/></>,
  bell: <><path d="M6 8a6 6 0 0 1 12 0c0 7 3 8 3 8H3s3-1 3-8M10 21h4"/></>,
  chev: <path d="m6 9 6 6 6-6"/>,
  right: <path d="m9 6 6 6-6 6"/>,
  calendar: <><rect x="3" y="4" width="18" height="17" rx="3"/><path d="M3 10h18M8 2v4M16 2v4"/></>,
  bolt: <path d="M13 2 4 14h7l-1 8 9-12h-7z"/>,
  plus: <><circle cx="12" cy="12" r="9"/><path d="M12 8v8M8 12h8"/></>,
  cart: <><circle cx="9" cy="20" r="1.5"/><circle cx="18" cy="20" r="1.5"/><path d="M2 3h3l3 12h11l2-8H6"/></>,
  users: <><circle cx="9" cy="8" r="4"/><path d="M2 21c0-4 3-7 7-7s7 3 7 7M17 4a4 4 0 0 1 0 7M22 21c0-3-2-5-4-6"/></>,
  chart: <><path d="M3 3v18h18"/><path d="m7 15 4-4 3 3 6-7"/></>,
  clock: <><circle cx="12" cy="12" r="9"/><path d="M12 7v5l3 2"/></>,
  dots: <><circle cx="12" cy="5" r="1.3"/><circle cx="12" cy="12" r="1.3"/><circle cx="12" cy="19" r="1.3"/></>,
  up: <path d="M12 19V5M5 12l7-7 7 7"/>,
  palette: <><path d="M12 3a9 9 0 1 0 0 18c1.5 0 2-1 1.6-2.2-.5-1.3.2-2.3 1.6-2.3H18a3 3 0 0 0 3-3C21 7 17 3 12 3z"/><circle cx="7.5" cy="11" r="1"/><circle cx="10" cy="7.5" r="1"/><circle cx="14.5" cy="7.5" r="1"/></>,
  globe: <><circle cx="12" cy="12" r="9"/><path d="M3 12h18M12 3c3 3 3 15 0 18M12 3c-3 3-3 15 0 18"/></>,
  help: <><circle cx="12" cy="12" r="9"/><path d="M9.5 9.5a2.5 2.5 0 1 1 3.5 2.3c-.7.4-1 .9-1 1.7M12 17v.01"/></>,
  user: <><circle cx="12" cy="8" r="4"/><path d="M4 21c0-4 4-7 8-7s8 3 8 7"/></>,
  edit: <path d="M4 20h4L19 9l-4-4L4 16z"/>,
  send: <path d="M22 2 11 13M22 2l-7 20-4-9-9-4z"/>,
  x: <path d="M6 6l12 12M18 6 6 18"/>,
  check: <path d="m5 12 5 5 9-10"/>,
  trash: <><path d="M4 7h16M9 7V4h6v3M6 7l1 14h10l1-14"/></>,
  inbox: <><path d="M3 13l3-8h12l3 8v6H3zM3 13h5l1 3h6l1-3h5"/></>,
  minus: <path d="M5 12h14"/>,
  add: <path d="M12 5v14M5 12h14"/>,
  back: <path d="M19 12H5M12 5l-7 7 7 7"/>,
  info: <><circle cx="12" cy="12" r="9"/><path d="M12 11v6M12 7.5v.01"/></>,
  store: <><path d="M3 9l2-5h14l2 5M3 9c0 1.7 1.3 3 3 3s3-1.3 3-3c0 1.7 1.3 3 3 3s3-1.3 3-3c0 1.7 1.3 3 3 3M5 12v8h14v-8"/></>,
  shield: <path d="M12 3l8 3v6c0 5-3.5 8-8 9-4.5-1-8-4-8-9V6z"/>,
  lock: <><rect x="5" y="11" width="14" height="10" rx="2"/><path d="M8 11V8a4 4 0 0 1 8 0v3"/></>,
  pin: <><path d="M12 21s-7-6.2-7-11.5a7 7 0 0 1 14 0C19 14.800 12 21 12 21z"/><circle cx="12" cy="9.500" r="2.500"/></>,
  mail: <><rect x="3" y="5" width="18" height="14" rx="3"/><path d="m3.500 7 8.500 6 8.500-6"/></>,
  phone: <path d="M5 4h4l2 5-2.500 1.500a11 11 0 0 0 5 5L15 13l5 2v4a2 2 0 0 1-2 2A16 16 0 0 1 3 6a2 2 0 0 1 2-2z"/>,
  msg: <path d="M21 12a8 8 0 0 1-11.800 7L4 20.500l1.500-4.700A8 8 0 1 1 21 12z"/>,

  // 🚨 IDINAGDAG PARA SA ONBOARDING
  clipboard: (
    <>
      <path d="M16 4h2a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2V6a2 2 0 0 1 2-2h2" />
      <rect x="8" y="2" width="8" height="4" rx="1" ry="1" />
      <path d="M9 14l2 2 4-4" />
    </>
  ),
};

interface IconProps extends React.SVGProps<SVGSVGElement> {
  name: string;
}

export function Icon({ name, ...props }: IconProps) {
  const path = ICONS[name];
  if (!path) return null;
  
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.8"
      strokeLinecap="round"
      strokeLinejoin="round"
      width="1em"   
      height="1em"  
      {...props}
    >
      {path}
    </svg>
  );
}

export default Icon;