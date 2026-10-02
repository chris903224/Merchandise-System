// src/layout/SiteLayout.tsx

import { Outlet } from 'react-router-dom';
import Navbar from '../components/Navbar';   // ✅ tamang path (../components/)
import Footer from '../components/Footer';   // ✅ kung nasa components/ din ang Footer

export default function SiteLayout() {
  console.log('SiteLayout rendering');

  return (
    <>
      <Navbar />
      <main>
        <Outlet />
      </main>
      <Footer />
    </>
  );
}