import { Link } from 'react-router-dom';
import { get } from '../../services/api';
import { useFetch } from '../../hooks/useFetch';
import { bg } from '../../utils/constants';
import {
  Heart,
  Droplet,
  Users,
  Building2,
  CheckCircle2,
  Clock,
  ArrowRight,
  ShieldCheck,
  MapPin,
  Activity,
  AlertTriangle,
  Lock,
  Search,
  Sparkles
} from 'lucide-react';
import { Badge, BloodTag, Spinner } from '../../components/ui';

export default function Landing() {
  const stats = useFetch(() => get('/public/stats'));
  const stock = useFetch(() => get('/public/availability'));
  const s = stats.data;

  return (
    <div className="space-y-16 pb-16">
      {/* Hero Section */}
      <section className="relative overflow-hidden pt-8 pb-16 md:pt-16 md:pb-24 border-b border-slate-800/80 bg-gradient-to-b from-[#0B0D13] via-[#0E111A] to-[#121622]">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="grid gap-12 lg:grid-cols-12 lg:items-center">
            {/* Left Content */}
            <div className="lg:col-span-7 space-y-6">
              <div className="inline-flex items-center gap-2 rounded-full border border-brand-800/60 bg-brand-950/50 px-3.5 py-1.5 text-xs font-semibold text-brand-300 shadow-subtle">
                <span className="flex h-2 w-2 rounded-full bg-brand-500 animate-pulse" />
                <span>Emergency Healthcare Network · Real-Time Matching</span>
              </div>

              <h1 className="text-4xl font-extrabold tracking-tight text-white sm:text-5xl lg:text-6xl leading-[1.12]">
                Find compatible blood donors{' '}
                <span className="text-brand-500">in minutes</span>, not hours.
              </h1>

              <p className="text-base sm:text-lg text-slate-300 max-w-2xl leading-relaxed">
                BloodNet bridges patients, voluntary donors, and hospitals on an audited, verified platform. With smart GPS proximity matching, nearby eligible donors are notified the moment an emergency arises.
              </p>

              {/* CTAs */}
              <div className="flex flex-wrap items-center gap-3 pt-2">
                <Link
                  to="/register"
                  className="btn-primary btn-lg shadow-lg shadow-brand-600/30 flex items-center gap-2 group"
                >
                  <Heart className="h-5 w-5 fill-white" />
                  <span>Become a Donor</span>
                  <ArrowRight className="h-4 w-4 group-hover:translate-x-0.5 transition" />
                </Link>

                <Link
                  to="/register"
                  className="btn-secondary btn-lg flex items-center gap-2"
                >
                  <Search className="h-5 w-5 text-slate-400" />
                  <span>Request Blood</span>
                </Link>

                <Link
                  to="/availability"
                  className="btn-outline btn-lg flex items-center gap-2"
                >
                  <Activity className="h-5 w-5 text-brand-400" />
                  <span>Check Live Stock</span>
                </Link>
              </div>

              {/* Trust Badges */}
              <div className="pt-4 border-t border-slate-800/80 flex flex-wrap items-center gap-6 text-xs font-medium text-slate-400">
                <div className="flex items-center gap-2">
                  <ShieldCheck className="h-4 w-4 text-emerald-400" />
                  <span>100% Admin-Verified Users</span>
                </div>
                <div className="flex items-center gap-2">
                  <MapPin className="h-4 w-4 text-brand-400" />
                  <span>Automated Radius Matching</span>
                </div>
                <div className="flex items-center gap-2">
                  <Lock className="h-4 w-4 text-blue-400" />
                  <span>Contact Privacy Protected</span>
                </div>
              </div>
            </div>

            {/* Right Card / Live Telemetry Preview */}
            <div className="lg:col-span-5">
              <div className="rounded-2xl border border-slate-800/90 bg-[#151822] p-6 shadow-2xl space-y-5">
                <div className="flex items-center justify-between pb-4 border-b border-slate-800">
                  <div className="flex items-center gap-2.5">
                    <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-brand-950/60 text-brand-400 border border-brand-900/60">
                      <Activity className="h-5 w-5" />
                    </div>
                    <div>
                      <h3 className="text-sm font-bold text-white">Live Network Telemetry</h3>
                      <p className="text-xs text-slate-400">Real-time database statistics</p>
                    </div>
                  </div>
                  <span className="inline-flex items-center gap-1.5 rounded-full bg-emerald-950/50 px-2.5 py-0.5 text-xs font-semibold text-emerald-400 border border-emerald-800/60">
                    <span className="h-1.5 w-1.5 rounded-full bg-emerald-400" />
                    Operational
                  </span>
                </div>

                {/* Key KPIs */}
                <div className="grid grid-cols-2 gap-3">
                  <div className="rounded-xl border border-slate-800 bg-[#0E111A] p-3.5">
                    <div className="flex items-center justify-between text-slate-400">
                      <span className="text-xs font-semibold uppercase">Donors</span>
                      <Users className="h-4 w-4 text-brand-400" />
                    </div>
                    <p className="mt-2 text-2xl font-bold text-white">
                      {s?.donors ?? (stats.loading ? '...' : 0)}
                    </p>
                    <p className="text-[11px] text-slate-400 mt-0.5">Voluntary registered</p>
                  </div>

                  <div className="rounded-xl border border-slate-800 bg-[#0E111A] p-3.5">
                    <div className="flex items-center justify-between text-slate-400">
                      <span className="text-xs font-semibold uppercase">Hospitals</span>
                      <Building2 className="h-4 w-4 text-blue-400" />
                    </div>
                    <p className="mt-2 text-2xl font-bold text-white">
                      {s?.hospitals ?? (stats.loading ? '...' : 0)}
                    </p>
                    <p className="text-[11px] text-slate-400 mt-0.5">Verified centers</p>
                  </div>

                  <div className="rounded-xl border border-slate-800 bg-[#0E111A] p-3.5">
                    <div className="flex items-center justify-between text-slate-400">
                      <span className="text-xs font-semibold uppercase">Fulfilled</span>
                      <CheckCircle2 className="h-4 w-4 text-emerald-400" />
                    </div>
                    <p className="mt-2 text-2xl font-bold text-white">
                      {s?.completedRequests ?? (stats.loading ? '...' : 0)}
                    </p>
                    <p className="text-[11px] text-slate-400 mt-0.5">Emergency requests</p>
                  </div>

                  <div className="rounded-xl border border-slate-800 bg-[#0E111A] p-3.5">
                    <div className="flex items-center justify-between text-slate-400">
                      <span className="text-xs font-semibold uppercase">Donations</span>
                      <Droplet className="h-4 w-4 text-brand-400" />
                    </div>
                    <p className="mt-2 text-2xl font-bold text-white">
                      {s?.donations ?? (stats.loading ? '...' : 0)}
                    </p>
                    <p className="text-[11px] text-slate-400 mt-0.5">Units contributed</p>
                  </div>
                </div>

                {/* Instant Emergency Action Box */}
                <div className="rounded-xl border border-brand-900/60 bg-brand-950/40 p-4 space-y-2">
                  <div className="flex items-center gap-2 text-brand-300 font-semibold text-xs uppercase tracking-wider">
                    <Sparkles className="h-4 w-4 text-brand-400" />
                    <span>Immediate Assistance</span>
                  </div>
                  <p className="text-xs text-slate-300 leading-relaxed">
                    Need urgent blood for a hospitalized patient? Create an emergency request to alert nearby compatible donors instantly.
                  </p>
                  <Link
                    to="/register"
                    className="inline-flex items-center gap-1.5 text-xs font-bold text-brand-400 hover:text-brand-300 pt-1"
                  >
                    <span>Create patient request</span>
                    <ArrowRight className="h-3.5 w-3.5" />
                  </Link>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Live Blood Stock Section */}
      <section className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="flex flex-col sm:flex-row sm:items-end sm:justify-between gap-4 mb-6">
          <div>
            <span className="text-xs font-bold uppercase tracking-wider text-brand-400">
              Verified Blood Bank Inventory
            </span>
            <h2 className="text-2xl font-extrabold text-white tracking-tight mt-1">
              Live Blood Group Availability
            </h2>
            <p className="text-xs sm:text-sm text-slate-400 mt-1">
              Active stock across all connected network blood banks (excluding expired & reserved units).
            </p>
          </div>
          <Link
            to="/availability"
            className="btn-outline btn-sm self-start sm:self-auto flex items-center gap-1.5 text-slate-200"
          >
            <span>View Full Stock Breakdown</span>
            <ArrowRight className="h-3.5 w-3.5" />
          </Link>
        </div>

        {stock.loading ? (
          <div className="card py-10 text-center">
            <Spinner className="h-7 w-7 text-brand-500 mx-auto" />
            <p className="mt-3 text-xs text-slate-400">Loading blood bank data...</p>
          </div>
        ) : (
          <div className="grid grid-cols-2 gap-3.5 sm:grid-cols-4 lg:grid-cols-8">
            {(stock.data || []).map((x: any) => {
              const isLow = x.status === 'LOW';
              return (
                <div
                  key={x.bloodGroup}
                  className={`card text-center p-4 transition duration-200 hover:-translate-y-0.5 hover:shadow-card-hover ${
                    isLow ? 'border-orange-800/60 bg-orange-950/20' : 'hover:border-slate-700'
                  }`}
                >
                  <div className="flex items-center justify-center">
                    <BloodTag value={x.bloodGroup} size="lg" />
                  </div>
                  <p className="mt-3 text-xl font-extrabold text-white tracking-tight">
                    {x.units} <span className="text-xs font-medium text-slate-400">units</span>
                  </p>
                  <div className="mt-2 flex justify-center">
                    <Badge value={x.status} />
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </section>

      {/* How It Works (4 Steps) */}
      <section className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 pt-6">
        <div className="text-center max-w-2xl mx-auto mb-12">
          <span className="text-xs font-bold uppercase tracking-wider text-brand-400">
            Intelligent Workflow
          </span>
          <h2 className="text-3xl font-extrabold text-white tracking-tight mt-1">
            How BloodNet Connects & Saves Lives
          </h2>
          <p className="text-xs sm:text-sm text-slate-400 mt-2">
            Every step is designed for high speed, clinical safety, and verified hospital confirmation.
          </p>
        </div>

        <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
          {[
            {
              step: '01',
              title: 'Post Emergency Request',
              desc: 'Receivers submit patient details, hospital location, required units, and urgency level.',
              icon: Search,
            },
            {
              step: '02',
              title: 'Proximity GPS Matching',
              desc: 'BloodNet calculates Haversine distances to match compatible, eligible donors within radius.',
              icon: MapPin,
            },
            {
              step: '03',
              title: 'Donor Accepts & Connects',
              desc: 'Notified donors accept via dashboard. A secure request chat opens instantly for coordination.',
              icon: CheckCircle2,
            },
            {
              step: '04',
              title: 'Hospital Verification',
              desc: 'The partner hospital verifies donation, updates blood bank inventory, and marks request completed.',
              icon: Building2,
            },
          ].map((item) => {
            const Icon = item.icon;
            return (
              <div
                key={item.step}
                className="card relative flex flex-col justify-between p-6 hover:border-slate-700 transition duration-200"
              >
                <div>
                  <div className="flex items-center justify-between mb-4">
                    <span className="text-2xl font-black tracking-tight text-slate-700 font-sans">
                      {item.step}
                    </span>
                    <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-brand-950/60 text-brand-400 border border-brand-900/60">
                      <Icon className="h-5 w-5" />
                    </div>
                  </div>
                  <h3 className="text-base font-bold text-white">{item.title}</h3>
                  <p className="mt-2 text-xs leading-relaxed text-slate-400">{item.desc}</p>
                </div>
              </div>
            );
          })}
        </div>
      </section>

      {/* Trust & Safety Features */}
      <section className="bg-[#0E111A] border-y border-slate-800/80 py-16">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="grid gap-10 lg:grid-cols-3">
            <div className="lg:col-span-1 space-y-4">
              <span className="text-xs font-bold uppercase tracking-wider text-brand-400">
                Healthcare Standards
              </span>
              <h2 className="text-2xl font-extrabold text-white tracking-tight">
                Built for Trust, Medical Safety & Privacy
              </h2>
              <p className="text-xs sm:text-sm text-slate-400 leading-relaxed">
                Unlike open messaging groups or unverified social boards, BloodNet is an audited, closed-loop healthcare platform.
              </p>
              <div className="pt-2">
                <Link to="/about" className="btn-outline btn-sm">
                  Learn about our verification standards
                </Link>
              </div>
            </div>

            <div className="lg:col-span-2 grid gap-6 sm:grid-cols-2">
              <div className="card p-5 space-y-2.5">
                <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-emerald-950/50 text-emerald-400 border border-emerald-900/60">
                  <ShieldCheck className="h-5 w-5" />
                </div>
                <h3 className="text-sm font-bold text-white">Admin Account Verification</h3>
                <p className="text-xs text-slate-400 leading-relaxed">
                  Every donor, patient attendant, and medical institution is reviewed and approved by administrators before receiving network access.
                </p>
              </div>

              <div className="card p-5 space-y-2.5">
                <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-blue-950/50 text-blue-400 border border-blue-900/60">
                  <Heart className="h-5 w-5" />
                </div>
                <h3 className="text-sm font-bold text-white">Clinical Eligibility Rules</h3>
                <p className="text-xs text-slate-400 leading-relaxed">
                  Enforces strict 90-day minimum donation intervals, weight threshold checks, and medical wellness criteria to protect voluntary donors.
                </p>
              </div>

              <div className="card p-5 space-y-2.5">
                <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-brand-950/50 text-brand-400 border border-brand-900/60">
                  <Lock className="h-5 w-5" />
                </div>
                <h3 className="text-sm font-bold text-white">Protected Contact Privacy</h3>
                <p className="text-xs text-slate-400 leading-relaxed">
                  Donor phone numbers and exact coordinates are kept confidential and are only shared with the receiver once a request is explicitly accepted.
                </p>
              </div>

              <div className="card p-5 space-y-2.5">
                <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-purple-950/50 text-purple-400 border border-purple-900/60">
                  <Activity className="h-5 w-5" />
                </div>
                <h3 className="text-sm font-bold text-white">Automated Radius Expansion</h3>
                <p className="text-xs text-slate-400 leading-relaxed">
                  If initial nearby donors are unavailable, the system expands radius thresholds (10km → 25km → 50km) and cross-checks blood bank alternatives.
                </p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Call to Action Banner */}
      <section className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="rounded-3xl bg-gradient-to-br from-[#1A1F2E] via-[#151822] to-[#0E111A] border border-slate-800 text-white p-8 sm:p-12 shadow-2xl relative overflow-hidden">
          <div className="relative z-10 max-w-2xl space-y-4">
            <span className="text-xs font-bold uppercase tracking-wider text-brand-400">
              Join the Life-Saving Network
            </span>
            <h2 className="text-3xl font-extrabold sm:text-4xl tracking-tight">
              A single blood donation can save up to 3 lives.
            </h2>
            <p className="text-xs sm:text-sm text-slate-300 leading-relaxed">
              Register as a voluntary donor today. You control your availability at any time, and you will only be contacted when an urgent match is needed near you.
            </p>
            <div className="flex flex-wrap items-center gap-3 pt-2">
              <Link to="/register" className="btn-primary btn-lg shadow-lg">
                Register as a Donor
              </Link>
              <Link to="/login" className="btn-outline btn-lg">
                Log In to Your Account
              </Link>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}
