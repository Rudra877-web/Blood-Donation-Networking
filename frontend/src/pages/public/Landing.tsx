import { Link } from 'react-router-dom';
import { get } from '../../services/api';
import { useFetch } from '../../hooks/useFetch';
import { bg } from '../../utils/constants';

export default function Landing() {
  const stats = useFetch(() => get('/public/stats'));
  const stock = useFetch(() => get('/public/availability'));
  const s = stats.data;
  return (
    <div>
      <section className="bg-gradient-to-br from-brand-50 via-white to-white">
        <div className="mx-auto grid max-w-6xl items-center gap-10 px-4 py-16 md:grid-cols-2 md:py-24">
          <div>
            <span className="rounded-full bg-brand-100 px-3 py-1 text-xs font-semibold text-brand-700">Healthcare · Community · Emergency response</span>
            <h1 className="mt-4 text-4xl font-extrabold leading-tight text-slate-900 md:text-5xl">Find blood donors <span className="text-brand-600">in minutes</span>, not hours.</h1>
            <p className="mt-4 text-lg text-slate-600">BloodNet connects patients, voluntary donors, hospitals and blood banks on one verified platform, with automatic nearest-donor matching for emergencies.</p>
            <div className="mt-6 flex flex-wrap gap-3">
              <Link to="/register" className="btn-primary px-6 py-3">Become a donor</Link>
              <Link to="/register" className="btn-outline px-6 py-3">Request blood</Link>
              <Link to="/availability" className="btn-outline px-6 py-3">Check blood stock</Link>
            </div>
          </div>
          <div className="grid grid-cols-2 gap-4">
            {[['Registered donors', s?.donors], ['Partner hospitals', s?.hospitals], ['Requests fulfilled', s?.completedRequests], ['Donations completed', s?.donations]].map(([l, v]) => (
              <div key={l as string} className="card text-center"><p className="text-3xl font-bold text-brand-600">{v ?? '–'}</p><p className="text-sm text-slate-500">{l}</p></div>
            ))}
          </div>
        </div>
      </section>
      <section className="mx-auto max-w-6xl px-4 py-14">
        <h2 className="text-center text-2xl font-bold">Live blood availability</h2>
        <div className="mt-6 grid grid-cols-2 gap-3 sm:grid-cols-4">
          {(stock.data || []).map((x: any) => (
            <div key={x.bloodGroup} className="card text-center">
              <p className="text-3xl font-extrabold text-brand-600">{bg(x.bloodGroup)}</p>
              <p className="text-sm text-slate-500">{x.units} units</p>
              <p className={`mt-1 text-xs font-semibold ${x.status === 'LOW' ? 'text-orange-600' : 'text-emerald-600'}`}>{x.status === 'LOW' ? 'Low stock' : 'Available'}</p>
            </div>
          ))}
        </div>
      </section>
    </div>
  );
}
