import React from 'react';
import { Outlet } from 'react-router-dom';
import Navbar from './Navbar';
import Footer from './Footer';

const Layout: React.FC = () => {
  return (
    <div className="min-h-screen bg-[#050505] text-white selection:bg-cyan-500/30 selection:text-cyan-400">
      <Navbar />
      <main className="pb-20">
        <Outlet />
      </main>
      <Footer />
    </div>
  );
};

export default Layout;
