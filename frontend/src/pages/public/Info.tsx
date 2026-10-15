import { Link } from 'react-router-dom';
import {
  ShieldCheck,
  Activity,
  Heart,
  Droplet,
  Users,
  Building2,
  Lock,
  MapPin,
  CheckCircle2,
  Sparkles,
  ArrowRight
} from 'lucide-react';

export function About() {
  return (
    <div className="mx-auto max-w-5xl px-4 py-12 sm:px-6 lg:px-8 space-y-12">
      {/* Header */}
      <div className="text-center max-w-3xl mx-auto space-y-3">
        <span className="text-xs font-bold uppercase tracking-wider text-brand-400">
          Our Healthcare Mission
        </span>
        <h1 className="text-3xl font-extrabold text-white tracking-tight sm:text-4xl">
          Transforming Blood Donation Into an Instant, Connected Network
        </h1>
        <p className="text-sm sm:text-base text-slate-300 leading-relaxed">
          Blood is a vital, perishable medicine that cannot be manufactured. In medical crises, precious hours are lost forwarding unverified messages across chaotic social media. BloodNet creates an audited, verified network connecting voluntary donors, receivers, and hospitals in real time.
        </p>
      </div>

      {/* 4 Pillars */}
      <div className="grid gap-6 sm:grid-cols-2">
        {[
          {
            title: '100% Verified Community',
            desc: 'Every donor, hospital, and patient account is reviewed by an administrator before activation to eliminate fraudulent or obsolete blood requests.',
            icon: ShieldCheck,
            color: 'text-emerald-400 bg-emerald-950/50 border-emerald-900/60',
          },
          {
            title: 'Clinical Distance Matching',
            desc: 'BloodNet combines blood-group compatibility matrices with Haversine GPS coordinate distances, immediately notifying the closest available donors first.',
            icon: MapPin,
            color: 'text-brand-400 bg-brand-950/50 border-brand-900/60',
          },
          {
            title: 'Transparent Blood Bank Stock',
            desc: 'Centralized live inventory for all eight blood groups across partner hospitals ensures doctors and patients can inspect existing reserves before requesting donors.',
            icon: Activity,
            color: 'text-blue-400 bg-blue-950/50 border-blue-900/60',
          },
          {
            title: 'Protected Donor Privacy',
            desc: 'Donors control their availability toggle at any time. Direct contact details are strictly kept private until the donor willingly accepts a request.',
            icon: Lock,
            color: 'text-purple-400 bg-purple-950/50 border-purple-900/60',
          },
        ].map((pillar) => {
          const Icon = pillar.icon;
          return (
            <div key={pillar.title} className="card p-6 space-y-3 hover:border-slate-700 transition">
              <div className={`flex h-11 w-11 items-center justify-center rounded-xl border ${pillar.color}`}>
                <Icon className="h-5 w-5" />
              </div>
              <h3 className="text-base font-bold text-white">{pillar.title}</h3>
              <p className="text-xs text-slate-400 leading-relaxed">{pillar.desc}</p>
            </div>
          );
        })}
      </div>

      {/* Network Architecture */}
      <div className="card p-8 space-y-6">
        <div className="max-w-2xl">
          <h2 className="text-xl font-bold text-white tracking-tight">The 4 Roles of the Network</h2>
          <p className="text-xs text-slate-400 mt-1">Each role operates with tailored clinical permissions and dedicated workflows</p>
        </div>

        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <div className="rounded-xl border border-slate-800 bg-[#0E111A] p-4">
            <div className="flex items-center gap-2 font-bold text-sm text-slate-100">
              <Heart className="h-4 w-4 text-brand-400" />
              <span>Voluntary Donors</span>
            </div>
            <p className="mt-2 text-xs text-slate-400 leading-relaxed">
              Maintain health profiles, toggle live availability, receive nearby emergency alerts, and view past donation records.
            </p>
          </div>

          <div className="rounded-xl border border-slate-800 bg-[#0E111A] p-4">
            <div className="flex items-center gap-2 font-bold text-sm text-slate-100">
              <Users className="h-4 w-4 text-blue-400" />
              <span>Patients & Attendants</span>
            </div>
            <p className="mt-2 text-xs text-slate-400 leading-relaxed">
              Post urgent blood requests, search compatible donors by city or radius, track matching donors, and coordinate via secure chat.
            </p>
          </div>

          <div className="rounded-xl border border-slate-800 bg-[#0E111A] p-4">
            <div className="flex items-center gap-2 font-bold text-sm text-slate-100">
              <Building2 className="h-4 w-4 text-emerald-400" />
              <span>Hospitals & Blood Banks</span>
            </div>
            <p className="mt-2 text-xs text-slate-400 leading-relaxed">
              Review incoming patient requests, verify donor blood collection, manage internal patient registries, and update inventory.
            </p>
          </div>

          <div className="rounded-xl border border-slate-800 bg-[#0E111A] p-4">
            <div className="flex items-center gap-2 font-bold text-sm text-slate-100">
              <ShieldCheck className="h-4 w-4 text-purple-400" />
              <span>System Administrators</span>
            </div>
            <p className="mt-2 text-xs text-slate-400 leading-relaxed">
              Audit registrations, moderate platform feedback, oversee network supply analytics, and review system action logs.
            </p>
          </div>
        </div>
      </div>

      {/* CTA Box */}
      <div className="rounded-2xl bg-brand-600 text-white p-8 flex flex-col sm:flex-row items-center justify-between gap-6 shadow-xl shadow-brand-600/30">
        <div className="space-y-1 text-center sm:text-left">
          <h3 className="text-xl font-bold">Help us expand the life-saving network</h3>
          <p className="text-xs text-brand-100">Sign up as a voluntary blood donor today and make a real difference.</p>
        </div>
        <Link to="/register" className="btn-secondary bg-[#0E111A] hover:bg-[#151822] text-white shadow-sm shrink-0 border-slate-700">
          Create an Account
        </Link>
      </div>
    </div>
  );
}

export function HowItWorks() {
  const steps = [
    {
      num: '01',
      title: 'Registration & Admin Verification',
      desc: 'Voluntary donors, patient attendants, and licensed hospitals register their profiles. An administrator reviews credentials to ensure authenticity and patient safety.',
      icon: ShieldCheck,
    },
    {
      num: '02',
      title: 'Post a Blood Request',
      desc: 'When blood is needed, the receiver specifies patient details, target hospital, blood group, units, and urgency level (Normal, Urgent, or Critical).',
      icon: Droplet,
    },
    {
      num: '03',
      title: 'Automated GPS & Compatibility Matching',
      desc: 'The matching algorithm filters for compatible blood types, verifies the donor’s 90-day donation eligibility, and dispatches wave alerts to nearest donors.',
      icon: MapPin,
    },
    {
      num: '04',
      title: 'Donor Accepts & Secure Chat Connects',
      desc: 'Available donors accept the alert with one tap. Once accepted, contact details and an encrypted request chat open for direct coordination.',
      icon: CheckCircle2,
    },
    {
      num: '05',
      title: 'Hospital Verification & Completion',
      desc: 'The patient arrives at the hospital, the medical team conducts donation, and hospital staff confirm the request as completed in the system.',
      icon: Building2,
    },
    {
      num: '06',
      title: 'Automated Radius Expansion',
      desc: 'If initial nearby donors are occupied, the platform systematically widens the search radius (up to 100km) and cross-checks hospital blood bank reserves.',
      icon: Activity,
    },
  ];

  return (
    <div className="mx-auto max-w-4xl px-4 py-12 sm:px-6 lg:px-8 space-y-10">
      <div className="text-center max-w-2xl mx-auto space-y-3">
        <span className="text-xs font-bold uppercase tracking-wider text-brand-400">
          End-to-End Workflow
        </span>
        <h1 className="text-3xl font-extrabold text-white tracking-tight sm:text-4xl">
          How the BloodNet System Operates
        </h1>
        <p className="text-xs sm:text-sm text-slate-300 leading-relaxed">
          From the initial medical request to hospital confirmation, every step is optimized for rapid clinical response and patient safety.
        </p>
      </div>

      <div className="space-y-4">
        {steps.map((item) => {
          const Icon = item.icon;
          return (
            <div
              key={item.num}
              className="card p-6 flex flex-col sm:flex-row items-start gap-5 hover:border-slate-700 transition"
            >
              <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-brand-950/60 text-brand-400 border border-brand-900/60 font-extrabold text-lg">
                {item.num}
              </div>
              <div className="flex-1 space-y-1">
                <div className="flex items-center gap-2">
                  <h3 className="text-base font-bold text-white">{item.title}</h3>
                </div>
                <p className="text-xs text-slate-400 leading-relaxed">{item.desc}</p>
              </div>
            </div>
          );
        })}
      </div>

      <div className="text-center pt-4">
        <Link to="/register" className="btn-primary btn-lg shadow-lg shadow-brand-600/30 inline-flex items-center gap-2">
          <span>Join the Network Now</span>
          <ArrowRight className="h-4 w-4" />
        </Link>
      </div>
    </div>
  );
}
