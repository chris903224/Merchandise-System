import { Outlet } from 'react-router-dom';
import Navbar from '../components/Navbar';


export default function SiteLayout() {
  return (
    <>
      <Navbar />
      <Outlet />

    </>
  );
}
