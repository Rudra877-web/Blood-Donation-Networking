import { useState } from 'react';
import { Link, NavLink, Outlet } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { ROLE_HOME } from '../utils/constants';

export default function PublicLayout() {
  const { user } = useAuth();
  const [open, setOpen] = useState(false);
  const links = [['/', 'Home'], ['/about', 'About'], ['/how-it-works', 'How It Works'], ['/availability', 'Blood Availability']];
  return (
    <div className="flex min-h-screen flex-col bg-white">
      <header className="sticky top-0 z-20 border-b border-slate-200 bg-white/95 backdrop-blur">
        <div className="mx-auto flex h-16 max-w-6xl items-center justify-between px-4">
          <Link to="/" className="text-lg font-bold text-brand-700">🩸 BloodNet</Link>
          <nav className="hidden items-center gap-6 md:flex">
            {links.map(([to, label]) => <NavLink key={to} to={to} end className={({ isActive }) => `text-sm font-medium ${isActive ? 'text-brand-700' : 'text-slate-600 hover:text-slate-900'}`}>{label}</NavLink>)}
            {user ? <Link to={ROLE_HOME[user.role]} className="btn-primary">Dashboard</Link> : (<><Link to="/login" className="btn-outline">Login</Link><Link to="/register" className="btn-primary">Register</Link></>)}
          </nav>
          <button className="text-2xl md:hidden" onClick={() => setOpen(!open)} aria-label="Menu">☰</button>
        </div>
        {open && (
          <div className="space-y-2 border-t border-slate-100 px-4 py-3 md:hidden" onClick={() => setOpen(false)}>
            {links.map(([to, label]) => <Link key={to} to={to} className="block py-1 text-sm font-medium text-slate-700">{label}</Link>)}
            {user ? <Link to={ROLE_HOME[user.role]} className="btn-primary w-full">Dashboard</Link> : <div className="flex gap-2"><Link to="/login" className="btn-outline flex-1">Login</Link><Link to="/register" className="btn-primary flex-1">Register</Link></div>}
          </div>
        )}
      </header>
      <main className="flex-1"><Outlet /></main>
      <footer className="border-t border-slate-200 bg-slate-50 py-6 text-center text-sm text-slate-500">
        © {new Date().getFullYear()} Blood Donation Networking System · Every drop counts.
      </footer>
    </div>
  );
}
