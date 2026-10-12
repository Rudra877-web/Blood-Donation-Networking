import { Link } from 'react-router-dom';

export function About() {
  return (
    <div className="mx-auto max-w-4xl space-y-6 px-4 py-14">
      <h1 className="text-3xl font-bold">About BloodNet</h1>
      <p className="text-slate-600">Blood is a life-saving resource that cannot be manufactured; it can only be donated. In emergencies, families lose precious hours phoning blood banks and forwarding social-media messages that are often outdated or unverified.</p>
      <p className="text-slate-600">The Blood Donation Networking System is a role-based platform that connects four groups: <b>donors</b>, <b>receivers</b> (patients and attendants), <b>hospitals</b> (with their blood banks) and <b>administrators</b>. Every account is verified by an administrator, and the system automatically alerts the nearest compatible, available and eligible donors when a request is posted.</p>
      <div className="grid gap-4 sm:grid-cols-2">
        {[['Verified network', 'Admin approval for donors, receivers and hospitals reduces fake or outdated requests.'], ['Smart matching', 'Blood-group compatibility, donor eligibility and Haversine distance decide who is alerted first.'], ['Transparent stock', 'Blood bank inventory for all eight groups is visible to everyone.'], ['Private by design', 'Passwords are hashed, access is role-based and donor contacts are shared only after acceptance.']].map(([t, d]) => (
          <div key={t} className="card"><h3 className="font-semibold text-brand-700">{t}</h3><p className="mt-1 text-sm text-slate-600">{d}</p></div>
        ))}
      </div>
    </div>
  );
}

export function HowItWorks() {
  const steps = [
    ['1', 'Register & get verified', 'Donors, receivers and hospitals sign up. An administrator approves each account.'],
    ['2', 'Post a blood request', 'Receivers enter patient, blood group, units, hospital and urgency.'],
    ['3', 'Automatic matching', 'Compatible, available, eligible donors are sorted by distance and the nearest are alerted first.'],
    ['4', 'Donor accepts', 'The receiver and hospital are notified and a request-based chat opens.'],
    ['5', 'Hospital completes', 'The hospital approves the request, records the donation and marks it completed.'],
    ['6', 'Expand if needed', 'If nobody accepts, the search radius widens automatically and blood-bank stock is suggested.'],
  ];
  return (
    <div className="mx-auto max-w-4xl px-4 py-14">
      <h1 className="text-3xl font-bold">How it works</h1>
      <ol className="mt-8 space-y-4">
        {steps.map(([n, t, d]) => (
          <li key={n} className="card flex gap-4"><span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-brand-600 font-bold text-white">{n}</span><div><h3 className="font-semibold">{t}</h3><p className="text-sm text-slate-600">{d}</p></div></li>
        ))}
      </ol>
      <div className="mt-8 text-center"><Link to="/register" className="btn-primary px-6 py-3">Join now</Link></div>
    </div>
  );
}
