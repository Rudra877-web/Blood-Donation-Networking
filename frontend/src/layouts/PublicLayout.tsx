import { useState } from 'react';
import { Link, NavLink, Outlet } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { ROLE_HOME } from '../utils/constants';
import {
  Droplet,
  Menu,
  X,
  ArrowRight,
  ShieldCheck,
  Activity,
  Heart,
  PhoneCall
} from 'lucide-react';

export default function PublicLayout() {
  const { user } = useAuth();
  const [mobileOpen, setMobileOpen] = useState(false);

  const navLinks = [
    { to: '/', label: 'Home' },
    { to: '/availability', label: 'Blood Availability' },
    { to: '/how-it-works', label: 'How It Works' },
    { to: '/about', label: 'About Us' },
  ];

  return (
    <div className="flex min-h-screen flex-col bg-[#0B0D13] text-slate-100">
      {/* Emergency Notice Banner */}
      <div className="bg-[#07080C] text-slate-300 text-xs py-2 px-4 border-b border-slate-800/90">
        <div className="mx-auto max-w-7xl flex flex-wrap items-center justify-between gap-2">
          <div className="flex items-center gap-2">
            <span className="flex h-2 w-2 rounded-full bg-emerald-400 animate-pulse" />
            <span className="font-semibold text-slate-200">Live Network:</span>
            <span className="text-slate-400">Real-time donor matching and verified hospital inventory active</span>
          </div>
          <div className="flex items-center gap-4 text-slate-400">
            <Link to="/availability" className="hover:text-white transition flex items-center gap-1.5">
              <Activity className="h-3.5 w-3.5 text-brand-400" />
              <span>Live Stock Status</span>
            </Link>
            <span className="hidden sm:inline text-slate-700">|</span>
            <span className="hidden sm:inline text-slate-500">Emergency response platform</span>
          </div>
        </div>
      </div>

      {/* Main Header */}
      <header className="sticky top-0 z-30 border-b border-slate-800/80 bg-[#0B0D13]/90 backdrop-blur-md transition-all">
        <div className="mx-auto flex h-20 max-w-7xl items-center justify-between px-4 sm:px-6 lg:px-8">
          {/* Logo */}
          <Link to="/" className="flex items-center gap-3 group">
            <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-brand-600 text-white shadow-md shadow-brand-600/30 group-hover:bg-brand-500 transition">
              <Droplet className="h-6 w-6 fill-white" />
            </div>
            <div>
              <span className="text-xl font-extrabold tracking-tight text-white group-hover:text-brand-400 transition">
                Blood<span className="text-brand-500">Net</span>
              </span>
              <span className="block text-[11px] font-medium tracking-wide uppercase text-slate-400">
                Healthcare Network
              </span>
            </div>
          </Link>

          {/* Desktop Nav */}
          <nav className="hidden items-center gap-1.5 md:flex">
            {navLinks.map((item) => (
              <NavLink
                key={item.to}
                to={item.to}
                end={item.to === '/'}
                className={({ isActive }) =>
                  `px-3.5 py-2 rounded-lg text-sm font-semibold transition ${
                    isActive
                      ? 'bg-brand-950/70 text-brand-300 border border-brand-800/60 shadow-subtle'
                      : 'text-slate-300 hover:text-white hover:bg-slate-800/60'
                  }`
                }
              >
                {item.label}
              </NavLink>
            ))}
          </nav>

          {/* Right Action buttons */}
          <div className="hidden items-center gap-3 md:flex">
            {user ? (
              <Link
                to={ROLE_HOME[user.role]}
                className="btn-primary flex items-center gap-2 shadow-sm"
              >
                <span>Dashboard ({user.role.toLowerCase()})</span>
                <ArrowRight className="h-4 w-4" />
              </Link>
            ) : (
              <>
                <Link
                  to="/login"
                  className="px-4 py-2 text-sm font-semibold text-slate-300 hover:text-white transition"
                >
                  Sign in
                </Link>
                <Link
                  to="/register"
                  className="btn-primary shadow-sm shadow-brand-600/20"
                >
                  Join Network
                </Link>
              </>
            )}
          </div>

          {/* Mobile menu trigger */}
          <button
            className="flex h-10 w-10 items-center justify-center rounded-lg border border-slate-800 text-slate-300 hover:bg-slate-800 md:hidden"
            onClick={() => setMobileOpen(!mobileOpen)}
            aria-label="Toggle navigation menu"
          >
            {mobileOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
          </button>
        </div>

        {/* Mobile dropdown */}
        {mobileOpen && (
          <div className="border-t border-slate-800 bg-[#0F121B] px-4 py-4 md:hidden shadow-2xl animate-in slide-in-from-top-2 duration-150">
            <div className="space-y-1 pb-3">
              {navLinks.map((item) => (
                <NavLink
                  key={item.to}
                  to={item.to}
                  end={item.to === '/'}
                  onClick={() => setMobileOpen(false)}
                  className={({ isActive }) =>
                    `block px-3 py-2.5 rounded-lg text-base font-semibold ${
                      isActive
                        ? 'bg-brand-950/70 text-brand-300 border border-brand-800/60'
                        : 'text-slate-300 hover:bg-slate-850 hover:text-white'
                    }`
                  }
                >
                  {item.label}
                </NavLink>
              ))}
            </div>
            <div className="pt-3 border-t border-slate-850 flex flex-col gap-2">
              {user ? (
                <Link
                  to={ROLE_HOME[user.role]}
                  onClick={() => setMobileOpen(false)}
                  className="btn-primary w-full text-center"
                >
                  Go to Dashboard ({user.role})
                </Link>
              ) : (
                <>
                  <Link
                    to="/login"
                    onClick={() => setMobileOpen(false)}
                    className="btn-outline w-full text-center"
                  >
                    Sign in
                  </Link>
                  <Link
                    to="/register"
                    onClick={() => setMobileOpen(false)}
                    className="btn-primary w-full text-center"
                  >
                    Register / Join Network
                  </Link>
                </>
              )}
            </div>
          </div>
        )}
      </header>

      {/* Main Content */}
      <main className="flex-1">
        <Outlet />
      </main>

      {/* Enhanced Dark Footer */}
      <footer className="border-t border-slate-800/80 bg-[#07090F]">
        <div className="mx-auto max-w-7xl px-4 py-12 sm:px-6 lg:px-8">
          <div className="grid gap-10 sm:grid-cols-2 lg:grid-cols-4">
            {/* Column 1: Brand */}
            <div>
              <div className="flex items-center gap-2.5">
                <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-brand-600 text-white shadow-sm">
                  <Droplet className="h-5 w-5 fill-white" />
                </div>
                <span className="text-xl font-bold tracking-tight text-white">
                  Blood<span className="text-brand-500">Net</span>
                </span>
              </div>
              <p className="mt-4 text-xs text-slate-400 leading-relaxed">
                A verified healthcare networking platform connecting voluntary blood donors, patients, and partner hospitals for rapid emergency response.
              </p>
              <div className="mt-4 flex items-center gap-2 text-xs font-semibold text-emerald-400 bg-emerald-950/40 border border-emerald-900/60 rounded-lg px-3 py-2 w-fit">
                <ShieldCheck className="h-4 w-4" />
                <span>Admin-verified members & hospitals</span>
              </div>
            </div>

            {/* Column 2: Quick Links */}
            <div>
              <h3 className="text-xs font-bold uppercase tracking-wider text-slate-200">
                Platform
              </h3>
              <ul className="mt-4 space-y-2.5 text-xs text-slate-400">
                <li>
                  <Link to="/" className="hover:text-brand-400 transition">
                    Home
                  </Link>
                </li>
                <li>
                  <Link to="/availability" className="hover:text-brand-400 transition">
                    Live Blood Availability
                  </Link>
                </li>
                <li>
                  <Link to="/how-it-works" className="hover:text-brand-400 transition">
                    How Donation Works
                  </Link>
                </li>
                <li>
                  <Link to="/about" className="hover:text-brand-400 transition">
                    About the Network
                  </Link>
                </li>
                <li>
                  <Link to="/register" className="hover:text-brand-400 transition">
                    Become a Voluntary Donor
                  </Link>
                </li>
              </ul>
            </div>

            {/* Column 3: Portals */}
            <div>
              <h3 className="text-xs font-bold uppercase tracking-wider text-slate-200">
                Participant Portals
              </h3>
              <ul className="mt-4 space-y-2.5 text-xs text-slate-400">
                <li>
                  <Link to="/login" className="hover:text-brand-400 transition">
                    Donor Dashboard
                  </Link>
                </li>
                <li>
                  <Link to="/login" className="hover:text-brand-400 transition">
                    Patient & Receiver Portal
                  </Link>
                </li>
                <li>
                  <Link to="/login" className="hover:text-brand-400 transition">
                    Hospital & Blood Bank Network
                  </Link>
                </li>
                <li>
                  <Link to="/login" className="hover:text-brand-400 transition">
                    System Administration
                  </Link>
                </li>
              </ul>
            </div>

            {/* Column 4: Medical Notice */}
            <div>
              <h3 className="text-xs font-bold uppercase tracking-wider text-slate-200">
                Emergency & Safety Notice
              </h3>
              <p className="mt-4 text-xs text-slate-400 leading-relaxed">
                In critical medical emergencies requiring immediate life support, contact your nearest emergency medical facility or ambulance service directly.
              </p>
              <div className="mt-4 rounded-xl border border-slate-800 bg-[#121622] p-3 text-xs text-slate-300">
                <p className="font-semibold text-white flex items-center gap-1.5">
                  <Heart className="h-3.5 w-3.5 text-brand-500 fill-brand-500" />
                  Every drop counts
                </p>
                <p className="mt-1 text-slate-400">
                  1 unit of blood can save up to 3 lives. Thank you to all voluntary donors.
                </p>
              </div>
            </div>
          </div>

          <div className="mt-10 border-t border-slate-800/80 pt-6 flex flex-col sm:flex-row items-center justify-between gap-4 text-xs text-slate-500">
            <p>© {new Date().getFullYear()} BloodNet · Blood Donation Networking System. All rights reserved.</p>
            <p className="flex items-center gap-1.5 text-slate-400">
              <span>Secure · Privacy-Compliant · Role-Based Access</span>
            </p>
          </div>
        </div>
      </footer>
    </div>
  );
}
