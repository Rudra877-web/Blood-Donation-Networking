import { get } from '../../services/api';
import { useFetch } from '../../hooks/useFetch';
import { bg } from '../../utils/constants';
import { Badge, ErrorBox, Loading } from '../../components/ui';

export default function Availability() {
  const { data, loading, error, reload } = useFetch(() => get('/public/availability'));
  return (
    <div className="mx-auto max-w-4xl px-4 py-14">
      <h1 className="text-3xl font-bold">Blood availability</h1>
      <p className="mt-1 text-slate-500">Live stock across the blood banks in the network (expired and reserved units are excluded).</p>
      {loading ? <Loading /> : error ? <ErrorBox message={error} onRetry={reload} /> : (
        <div className="mt-6 grid grid-cols-2 gap-4 sm:grid-cols-4">
          {data!.map((x: any) => (
            <div key={x.bloodGroup} className="card text-center">
              <p className="text-4xl font-extrabold text-brand-600">{bg(x.bloodGroup)}</p>
              <p className="mt-1 text-lg font-semibold">{x.units} <span className="text-sm font-normal text-slate-500">units</span></p>
              <Badge value={x.status} />
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
